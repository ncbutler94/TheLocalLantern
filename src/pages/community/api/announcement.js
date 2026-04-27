// backend/src/routes/community/announcements.js
import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { Storage } from '@google-cloud/storage';
import { body, validationResult } from 'express-validator';

import db from '../../db.js';
import authenticateToken from '../../middleware/auth.js';

const router = express.Router();

/* ───────────────────────── Security helpers ───────────────────────── */
const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';
const securityMode = (process.env.SECURITY_MODE || (isProd ? 'prod' : 'dev')).toLowerCase();
const isProdLike = isProd || securityMode === 'prod' || securityMode === 'strict';

const enableRateLimit =
    String(process.env.ENABLE_RATE_LIMIT || (isProdLike ? 'true' : 'false')).toLowerCase() === 'true';

const createLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProdLike ? 120 : 2000,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => String(req.user?.id || req.ip || 'unknown'),
    message: { message: 'Too many requests, please slow down.' },
});

const ALLOWED_UPLOAD_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function safeFileName(name) {
    const base = path.basename(String(name || 'photo')).trim() || 'photo';
    return base.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120);
}

function randomId() {
    return Math.random().toString(16).slice(2, 10);
}

function parseLatLng(latitude, longitude) {
    const lat = latitude === undefined || latitude === null || String(latitude).trim() === '' ? null : Number(latitude);
    const lng = longitude === undefined || longitude === null || String(longitude).trim() === '' ? null : Number(longitude);

    if (lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) return { ok: false, message: 'Invalid latitude.' };
    if (lng !== null && (!Number.isFinite(lng) || lng < -180 || lng > 180)) return { ok: false, message: 'Invalid longitude.' };

    return { ok: true, lat, lng };
}

/**
 * Helper to check if a county/city value represents "all" (statewide).
 * Handles empty strings, "All Counties", "All Cities", etc.
 */
function isAllValue(val) {
    if (val === undefined || val === null) return true;
    const s = String(val).trim().toLowerCase();
    if (!s) return true;
    if (s === 'all' || s === 'all counties' || s === 'all cities') return true;
    return false;
}

/* ───────────────────────── GCS helpers ───────────────────────── */
const storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID || undefined,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || undefined,
});

function getBucket() {
    const name = String(process.env.GCS_BUCKET || '').trim();
    if (!name) return null;
    return storage.bucket(name);
}

async function uploadFilesToGcs(files, folderPrefix) {
    const list = Array.isArray(files) ? files : [];
    if (!list.length) return [];

    const bucket = getBucket();
    if (!bucket) {
        const e = new Error('GCS_BUCKET is not configured');
        e.status = 500;
        throw e;
    }

    const uploaded = [];

    for (const file of list) {
        if (!file || !file.buffer) continue;

        const mime = String(file?.mimetype || '').toLowerCase();
        if (!ALLOWED_UPLOAD_MIMES.has(mime)) {
            const e = new Error('Unsupported file type');
            e.status = 415;
            throw e;
        }

        const safe = safeFileName(file.originalname);
        const gcsName = `${folderPrefix}/${Date.now()}_${randomId()}_${safe}`;

        const blob = bucket.file(gcsName);
        const stream = blob.createWriteStream({
            resumable: false,
            metadata: { contentType: mime },
        });

        // eslint-disable-next-line no-await-in-loop
        const url = await new Promise((resolve, reject) => {
            stream.on('error', reject).on('finish', () => resolve(`https://storage.googleapis.com/${bucket.name}/${gcsName}`));
            stream.end(file.buffer);
        });

        uploaded.push(url);
    }

    return uploaded;
}

/* ───────────────────────── Route config ───────────────────────── */
const FOLDER_PREFIX = 'community/announcements';
const MAX_PHOTOS = 8;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        files: MAX_PHOTOS,
        fileSize: 8 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        const mime = String(file?.mimetype || '').toLowerCase();
        if (!ALLOWED_UPLOAD_MIMES.has(mime)) return cb(new Error('Unsupported file type'));
        return cb(null, true);
    },
});

const validate = [
    body('title').trim().notEmpty().isLength({ max: 50 }),
    body('description').trim().isLength({ max: 1000 }).optional({ nullable: true }),
    body('city').trim().optional({ nullable: true }),
    body('county').trim().optional({ nullable: true }),
    body('visibility').isIn(['public', 'followers']).optional({ nullable: true }),
    body('latitude').optional({ nullable: true }).custom((v) => v === '' || v === null || v === undefined || !Number.isNaN(Number(v))),
    body('longitude').optional({ nullable: true }).custom((v) => v === '' || v === null || v === undefined || !Number.isNaN(Number(v))),
];

router.post(
    '/',
    authenticateToken,
    enableRateLimit ? createLimiter : (req, _res, next) => next(),
    upload.array('photos', MAX_PHOTOS),
    validate,
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

        try {
            const photoUrls = await uploadFilesToGcs(req.files || [], FOLDER_PREFIX);

            const {
                title,
                description = '',
                visibility = 'public',
                latitude,
                longitude,
            } = req.body;

            // Parse county and city - treat "All Counties" / "All Cities" as statewide
            const countyRaw = String(req.body.county ?? '').trim();
            const cityRaw = String(req.body.city ?? '').trim();

            // Statewide if county is empty or "All Counties" (regardless of city value)
            const isStatewide = isAllValue(countyRaw);

            // For non-statewide posts, also check if city is "All Cities" - still use the county but no city
            const effectiveCity = isStatewide ? null : (isAllValue(cityRaw) ? null : cityRaw);
            const effectiveCounty = isStatewide ? null : countyRaw;

            // Only use coordinates if we have a specific city and county
            const shouldUseCoords = effectiveCity && effectiveCounty;
            const coords = shouldUseCoords ? parseLatLng(latitude, longitude) : { ok: true, lat: null, lng: null };
            if (!coords.ok) return res.status(400).json({ message: coords.message });

            const trx = await db.transaction();
            try {
                const [postId] = await trx('community_posts').insert({
                    user_id: req.user.id,
                    category: 'announcement',
                    title: String(title || '').trim(),
                    description: String(description || ''),
                    visibility: String(visibility || 'public'),
                    city: effectiveCity,
                    county: effectiveCounty,
                    latitude: coords.lat,
                    longitude: coords.lng,
                    posted_at: trx.fn.now(),
                });

                if (await trx.schema.hasTable('community_announcements')) {
                    await trx('community_announcements').insert({ post_id: postId });
                }

                if (await trx.schema.hasTable('announcements')) {
                    await trx('announcements').insert({
                        id: postId,
                        date_created: trx.fn.now(),
                        user_id: req.user.id,
                        title: String(title || '').trim(),
                        body: String(description || ''),
                        city: effectiveCity,
                        county: effectiveCounty,
                        latitude: coords.lat,
                        longitude: coords.lng,
                    });
                }

                if (photoUrls.length && (await trx.schema.hasTable('community_photos'))) {
                    await trx('community_photos').insert(
                        photoUrls.map((url, idx) => ({
                            post_id: postId,
                            url,
                            position: idx,
                        })),
                    );
                }

                await trx.commit();
                return res.status(201).json({ id: postId, photos: photoUrls });
            } catch (err) {
                await trx.rollback();
                return next(err);
            }
        } catch (err) {
            return next(err);
        }
    },
);

export default router;

/**
 * friendsInGroup.js
 * ─────────────────────────────────────────────────────────────────────────
 * GET /api/groups/:id/friends-in-group
 *
 * Returns an array of users that the authenticated viewer follows who are
 * members of the given group. Supports account-scoped following lists
 * (personal, business, artist).
 *
 * Response shape:
 *   { friends: [ { id, first_name, last_name, handle, avatar_url }, … ] }
 *
 * Mount:
 *   import friendsInGroupRouter from './friendsInGroup.js';
 *   app.use('/api/groups', friendsInGroupRouter);
 *   // — OR — merge into your existing groups router file.
 * ─────────────────────────────────────────────────────────────────────────
 */
import express from 'express';
import db from '../../db.js';                       // adjust path to your knex instance
import optionalAuth from '../../middleware/optionalAuth.js';

const router = express.Router();

/* ── helpers ─────────────────────────────────────────────────────────────── */
const parseMaybeJSON = (v, fallback) => {
    if (v == null) return fallback;
    if (typeof v === 'object') return v;
    try { return JSON.parse(v); } catch { return fallback; }
};

/**
 * Resolve the viewer's following list scoped to their active account.
 *
 * - Personal accounts: read from users.social_json.following
 * - Business accounts: read from follows table WHERE follower_business_id = X
 * - Artist accounts:   read from follows table WHERE follower_artist_id = X
 */
async function getFollowingIds(viewerId, req) {
    const accountType = String(
        req.headers['x-account-type'] ||
        req.query.account_type ||
        ''
    ).toLowerCase();

    const businessId = Number(
        req.headers['x-business-id'] ||
        req.query.account_id ||
        0
    );
    const artistId = Number(
        req.headers['x-artist-id'] ||
        req.query.account_id ||
        0
    );

    // Business account: use follows table
    if (accountType === 'business' && businessId > 0) {
        const rows = await db('follows')
            .select('followed_user_id')
            .where({ follower_business_id: businessId })
            .whereNotNull('followed_user_id');
        return rows.map((r) => Number(r.followed_user_id)).filter((n) => Number.isFinite(n) && n > 0);
    }

    // Artist account: use follows table
    if (accountType === 'artist' && artistId > 0) {
        const rows = await db('follows')
            .select('followed_user_id')
            .where({ follower_artist_id: artistId })
            .whereNotNull('followed_user_id');
        return rows.map((r) => Number(r.followed_user_id)).filter((n) => Number.isFinite(n) && n > 0);
    }

    // Personal account: read from social_json
    const viewerRow = await db('users')
        .select('social_json')
        .where({ id: viewerId })
        .first();

    if (!viewerRow) return [];

    const socialJson = parseMaybeJSON(viewerRow.social_json, {});
    return Array.isArray(socialJson.following)
        ? socialJson.following
            .map((id) => Number(id))
            .filter((n) => Number.isFinite(n) && n > 0)
        : [];
}

/* ── GET /:id/friends-in-group ───────────────────────────────────────────── */
router.get(
    '/:id/friends-in-group',
    optionalAuth,
    async (req, res, next) => {
        try {
            const groupId = Number(req.params.id);
            if (!groupId || Number.isNaN(groupId)) {
                return res.status(400).json({ message: 'Invalid group id' });
            }

            // If viewer is not authenticated, return empty
            const viewerId = Number(req.user?.id);
            if (!viewerId) {
                return res.json({ friends: [] });
            }

            // 1. Get the viewer's account-scoped following list
            const followingIds = await getFollowingIds(viewerId, req);

            if (followingIds.length === 0) {
                return res.json({ friends: [] });
            }

            // Exclude the viewer themselves from results
            const filteredIds = followingIds.filter((id) => id !== viewerId);
            if (filteredIds.length === 0) {
                return res.json({ friends: [] });
            }

            // 2. Find which of those followed users are members of the group
            const matchedRows = await db('group_members')
                .select('user_id')
                .where({ group_id: groupId, status: 'joined' })
                .whereIn('user_id', filteredIds);

            const matchedIds = matchedRows.map((r) => Number(r.user_id)).filter(Boolean);

            if (matchedIds.length === 0) {
                return res.json({ friends: [] });
            }

            // 3. Hydrate user profiles for the matched IDs
            const users = await db('users')
                .select('id', 'first_name', 'last_name', 'handle', 'profile_picture', 'avatar_url')
                .whereIn('id', matchedIds)
                .limit(20);

            const friends = users.map((u) => ({
                id:              u.id,
                first_name:      u.first_name || '',
                last_name:       u.last_name || '',
                handle:          u.handle || '',
                avatar_url:      u.avatar_url || u.profile_picture || null,
                profile_picture: u.profile_picture || u.avatar_url || null,
            }));

            return res.json({ friends });
        } catch (err) {
            return next(err);
        }
    }
);

export default router;

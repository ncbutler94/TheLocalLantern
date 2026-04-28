// src/pages/business/components/CreateBusinessPostDialog.jsx
//
// Reusable dialog for creating business posts.
// Extracted from BusinessPublicPage so it can be reused on the Business hub page.
// Adds optional city/county fields + lat/lng coordinate resolution
// so posts appear on the map.

import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import CloseIcon from '@mui/icons-material/Close';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

import PhotosUploadSection from '../../../components/PhotosUploadSection';
import CityCountySelect from '../../../components/CityCountySelect';
import RichTextEditor from '../../../components/RichTextEditor';
import { stripHtml } from '../../../utils/richTextUtils';
import { checkProfanity } from '../../../utils/profanityCheck';
import { createBusinessPost } from '../api/businessApi';

import cityGeoJson from '../../../data/alabamaCities.json';
import countyGeoJson from '../../../data/alabamaCounties.json';

/* ── Coordinate resolution (self-contained — no external deps) ── */
const stripCountySuffix = (s) => String(s || '').replace(/ County$/i, '').trim();

function getCoordsFromFeature(feature) {
    if (!feature?.geometry) return null;
    const { type, coordinates } = feature.geometry;

    if (type === 'Point' && Array.isArray(coordinates) && coordinates.length >= 2) {
        const [lng, lat] = coordinates;
        if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
        return null;
    }

    // Polygon / MultiPolygon — bounding-box centroid
    const rings = type === 'MultiPolygon'
        ? (coordinates || []).flat()
        : type === 'Polygon' ? (coordinates || []) : [];

    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (const ring of rings) {
        if (!Array.isArray(ring)) continue;
        for (const pt of ring) {
            if (!Array.isArray(pt) || pt.length < 2) continue;
            const [lng, lat] = pt;
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
        }
    }
    if (Number.isFinite(minLat) && Number.isFinite(maxLat)) {
        return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
    }
    return null;
}

function resolveLocationCoords(city, county) {
    const cityFeatures = cityGeoJson?.features || [];
    const countyFeatures = countyGeoJson?.features || [];

    if (city) {
        const norm = String(city).trim().toLowerCase();
        const hit = cityFeatures.find((f) =>
            String(f?.properties?.NAME || f?.properties?.name || '').trim().toLowerCase() === norm
        );
        if (hit) { const c = getCoordsFromFeature(hit); if (c) return c; }
    }

    if (county) {
        const norm = stripCountySuffix(county).toLowerCase();
        const hit = countyFeatures.find((f) =>
            stripCountySuffix(f?.properties?.NAME || f?.properties?.name || '').toLowerCase() === norm
        );
        if (hit) { const c = getCoordsFromFeature(hit); if (c) return c; }
    }

    return null;
}

/* ── Constants ── */
const POST_TYPES = [
    { value: 'update', label: 'Update', description: 'General news or behind-the-scenes' },
    { value: 'deal', label: 'Deal', description: 'Sales, promotions, or special offers' },
    { value: 'announcement', label: 'Announcement', description: 'Important news or changes' },
];

const MAX_POST_PHOTOS = 8;


/**
 * CreateBusinessPostDialog
 *
 * Props:
 *   open            - boolean
 *   onClose         - () => void
 *   businessId      - number
 *   businessName    - string (shown in subtitle)
 *   businessCity    - string (default city for location)
 *   businessCounty  - string (default county for location)
 *   onPostCreated   - () => void (called after successful save)
 */
export default function CreateBusinessPostDialog({
                                                     open,
                                                     onClose,
                                                     businessId,
                                                     businessName,
                                                     businessCity = '',
                                                     businessCounty = '',
                                                     onPostCreated,
                                                 }) {
    const theme = useTheme();
    const _cbpMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [postType, setPostType] = useState('update');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [photos, setPhotos] = useState([]);
    const [discountText, setDiscountText] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [terms, setTerms] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const contentRef = useRef(null);

    // Location fields
    const [city, setCity] = useState('');
    const [county, setCounty] = useState('');
    const [geocoding, setGeocoding] = useState(false);

    const isDeal = postType === 'deal';

    // Track whether we've applied defaults for this dialog open
    const appliedDefaultsRef = useRef(false);

    // Default city/county from business when dialog opens — only once per open
    useEffect(() => {
        if (open && !appliedDefaultsRef.current) {
            appliedDefaultsRef.current = true;
            if (businessCity) setCity(businessCity);
            if (businessCounty) setCounty(businessCounty);
        }
        if (!open) {
            appliedDefaultsRef.current = false;
        }
    }, [open, businessCity, businessCounty]);

    const handleClose = () => {
        photos.forEach((p) => {
            if (p?.url) {
                try { URL.revokeObjectURL(p.url); } catch { /* ignore */ }
            }
        });
        setPostType('update');
        setTitle('');
        setBody('');
        setPhotos([]);
        setDiscountText('');
        setValidUntil('');
        setTerms('');
        setCity('');
        setCounty('');
        setError(null);
        setFieldErrors({});
        onClose();
    };

    /**
     * Resolve lat/lng from city/county using local GeoJSON.
     * Returns { lat, lng }
     */
    const resolveCoordinates = async () => {
        const trimCity = String(city || '').trim();
        const trimCounty = String(county || '').trim();
        const isAllCity = !trimCity || trimCity.toLowerCase() === 'all cities';
        const isAllCounty = !trimCounty || trimCounty.toLowerCase() === 'all counties';

        if (isAllCounty) return { lat: null, lng: null };

        // Resolve from local GeoJSON data
        const coords = resolveLocationCoords(isAllCity ? '' : trimCity, trimCounty);
        if (coords && coords.length >= 2) {
            return { lat: coords[0], lng: coords[1] };
        }

        return { lat: null, lng: null };
    };

    const handleSubmit = async () => {
        // Client-side profanity check — all text fields
        const strippedBody = stripHtml(String(body || '')).trim();
        const fieldsToCheck = {
            title,
            body: strippedBody,
            ...(isDeal ? { discountText, terms } : {}),
        };
        const fieldOrder = ['title', 'discountText', 'terms', 'body'];

        const newFieldErrors = {};
        for (const [fieldName, value] of Object.entries(fieldsToCheck)) {
            if (!value) continue;
            const result = checkProfanity(value);
            if (!result.clean) {
                newFieldErrors[fieldName] = 'Contains inappropriate language. Please revise.';
            }
        }

        if (Object.keys(newFieldErrors).length > 0) {
            setFieldErrors(newFieldErrors);
            setError(null);
            const firstBad = fieldOrder.find(f => newFieldErrors[f]);
            if (firstBad) {
                setTimeout(() => {
                    const el = contentRef.current?.querySelector(`[data-field="${firstBad}"]`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 50);
            }
            return;
        }

        setSubmitting(true);
        setError(null);
        setFieldErrors({});

        try {
            // Resolve coordinates
            setGeocoding(true);
            const result = await resolveCoordinates();
            setGeocoding(false);

            const { lat, lng } = result;

            const photoFiles = photos.map((p) => ({ file: p.file }));

            const trimCity = String(city || '').trim();
            const trimCounty = String(county || '').trim();
            const isAllCity = !trimCity || trimCity.toLowerCase() === 'all cities';
            const isAllCounty = !trimCounty || trimCounty.toLowerCase() === 'all counties';

            const postData = {
                type: postType,
                title: title.trim(),
                body: body.trim(),
                photos: photoFiles,
                city: isAllCity ? null : trimCity,
                county: isAllCounty ? null : trimCounty,
                latitude: lat,
                longitude: lng,
            };

            if (isDeal) {
                postData.discount_text = discountText.trim();
                if (validUntil) postData.valid_until = validUntil;
                if (terms) postData.terms = terms.trim();
            }

            await createBusinessPost(businessId, postData);

            // Broadcast refresh event so lists update
            try {
                window.dispatchEvent(new CustomEvent('ll:businessPost:refresh'));
            } catch { /* ignore */ }

            handleClose();
            onPostCreated?.();
        } catch (err) {
            if (err?.field) {
                setFieldErrors(prev => ({ ...prev, [err.field]: err.message || 'Contains inappropriate content. Please revise.' }));
                setTimeout(() => {
                    const el = contentRef.current?.querySelector(`[data-field="${err.field}"]`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 50);
            } else {
                setError(err?.message || 'Failed to create post. Please try again.');
            }
        } finally {
            setGeocoding(false);
            setSubmitting(false);
        }
    };

    const today = new Date();
    const minDate = today.toISOString().split('T')[0];

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            fullScreen={_cbpMobile}
            PaperProps={{ sx: { maxHeight: _cbpMobile ? '100%' : '90vh', borderRadius: _cbpMobile ? 0 : undefined, ...(_cbpMobile && { pt: 'env(safe-area-inset-top, 0px)' }) } }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                <Typography variant="h6" fontWeight={800}>New Post</Typography>
                <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent ref={contentRef} sx={{ overflowY: 'auto', overflowX: 'hidden' }}>
                {businessName ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Share an update with your followers as {businessName}
                    </Typography>
                ) : null}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="create-biz-post-type-label">Post Type</InputLabel>
                    <Select
                        labelId="create-biz-post-type-label"
                        value={postType}
                        label="Post Type"
                        onChange={(e) => setPostType(e.target.value)}
                    >
                        {POST_TYPES.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                                <Stack>
                                    <Typography variant="body2" fontWeight={600}>{type.label}</Typography>
                                    <Typography variant="caption" color="text.secondary">{type.description}</Typography>
                                </Stack>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    fullWidth
                    label="Title"
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); setFieldErrors(prev => { const n = {...prev}; delete n.title; return n; }); }}
                    sx={{ mb: 2 }}
                    data-field="title"
                    error={Boolean(fieldErrors.title)}
                    inputProps={{ maxLength: 180 }}
                    helperText={fieldErrors.title || `${title.length}/180`}
                    required
                />

                {isDeal && (
                    <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: 2, border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.2) }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocalOfferIcon sx={{ fontSize: 18 }} /> Deal Details
                        </Typography>

                        <TextField
                            fullWidth
                            label="Discount/Offer"
                            value={discountText}
                            onChange={(e) => { setDiscountText(e.target.value); setFieldErrors(prev => { const n = {...prev}; delete n.discountText; return n; }); }}
                            sx={{ mb: 2 }}
                            data-field="discountText"
                            error={Boolean(fieldErrors.discountText)}
                            placeholder='e.g., "20% off all pizzas" or "Buy 1 Get 1 Free"'
                            inputProps={{ maxLength: 100 }}
                            helperText={fieldErrors.discountText || `${discountText.length}/100`}
                            required
                        />

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                            <TextField
                                fullWidth
                                label="Valid Until (optional)"
                                type="date"
                                value={validUntil}
                                onChange={(e) => setValidUntil(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ min: minDate }}
                            />
                        </Stack>

                        <TextField
                            fullWidth
                            label="Terms & Conditions (optional)"
                            value={terms}
                            onChange={(e) => { setTerms(e.target.value); setFieldErrors(prev => { const n = {...prev}; delete n.terms; return n; }); }}
                            multiline
                            rows={2}
                            data-field="terms"
                            error={Boolean(fieldErrors.terms)}
                            placeholder="e.g., Cannot be combined with other offers. Valid for dine-in only."
                            inputProps={{ maxLength: 500 }}
                            helperText={fieldErrors.terms || `${terms.length}/500`}
                        />
                    </Paper>
                )}

                <Box data-field="body" sx={{
                    '& .ProseMirror, & .tiptap, & [contenteditable="true"]': {
                        height: 280,
                        overflowY: 'auto',
                    },
                }}>
                    <RichTextEditor
                        label="Description"
                        value={body}
                        onChange={(html) => { setBody(html); setFieldErrors(prev => { const n = {...prev}; delete n.body; return n; }); }}
                        error={Boolean(fieldErrors.body)}
                        helperText={fieldErrors.body || undefined}
                        maxLength={5000}
                        placeholder={isDeal ? 'Add more details about this deal...' : "Tell your followers what's happening..."}
                        minRows={10}
                    />
                </Box>

                {/* Location section */}
                <Box sx={{ mb: 2 }}>
                    <Typography sx={{ fontWeight: 800, mb: 1 }}>Location</Typography>
                    <CityCountySelect
                        city={city}
                        setCity={setCity}
                        county={county}
                        setCounty={setCounty}
                        countyRequired={false}
                        countyError=""
                        cityError=""
                        emptyCountyLabel="All Counties"
                        emptyCityLabel="All Cities"
                        allCountyValue="All Counties"
                        allCityValue="All Cities"
                    />
                </Box>

                <PhotosUploadSection
                    photos={photos}
                    setPhotos={setPhotos}
                    disabled={submitting}
                    maxPhotos={MAX_POST_PHOTOS}
                    title="Photos"
                    helperText="Add photos to make your post stand out"
                    addButtonText="Add photos"
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!title.trim() || (isDeal && !discountText.trim()) || submitting || geocoding}
                    startIcon={submitting || geocoding ? <CircularProgress size={16} color="inherit" /> : null}
                >
                    {geocoding ? 'Locating...' : submitting ? 'Publishing...' : 'Publish Post'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

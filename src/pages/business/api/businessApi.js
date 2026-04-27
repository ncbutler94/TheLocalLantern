// src/pages/business/api/businessApi.js
/**
 * Business API client (scaffold)
 * ------------------------------
 * Keep ALL Business feature requests centralized here to avoid scattered fetch logic.
 *
 * NOTE: Uses cookie-based auth (credentials: 'include') to match the rest of the app.
 * In dev, CRA proxy can handle /api/* routes.
 */

import { getAccountHeaders, getAccountBody } from '../../../utils/getAccountHeadersStatic';
import { secureFetch } from '../../../utils/secureFetch';

const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

const apiUrl = (path) => (API_BASE ? `${API_BASE}${path}` : path);

const safeJson = async (res) => {
    try {
        return await res.json();
    } catch {
        return null;
    }
};

function normalizeLocationFilter(value, allLabel) {
    const raw = String(value ?? '').trim();
    if (!raw) return '';
    const lowered = raw.toLowerCase();
    if (lowered === 'all') return '';
    if (raw === allLabel) return '';
    return raw;
}

function normalizeBusinessDirectorySort(sort) {
    const raw = String(sort ?? '').trim();
    if (!raw) return 'any';

    const key = raw
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

    const aliases = {
        any: 'any',
        random: 'any',

        most_reviewed: 'most_reviewed',
        most_reviews: 'most_reviewed',
        reviews: 'most_reviewed',
        review_count: 'most_reviewed',

        highest_rated: 'highest_rated',
        highest_rating: 'highest_rated',
        highestrated: 'highest_rated',
        rating: 'highest_rated',
        top_rated: 'highest_rated',

        a_z: 'a_z',
        az: 'a_z',
        alphabetical: 'a_z',
        alphabetic: 'a_z',
        name_asc: 'a_z',

        z_a: 'z_a',
        za: 'z_a',
        reverse_alphabetical: 'z_a',
        name_desc: 'z_a',
    };

    return aliases[key] || 'any';
}


function getStableBusinessPostsRandomSeed({
                                              normalizedSort = 'any',
                                              businessId = null,
                                              q = '',
                                              view = 'all',
                                              dateRange = 'all',
                                              categoryKey = '',
                                              city = '',
                                              county = '',
                                              type = '',
                                          } = {}) {
    if (normalizedSort !== 'any') return '';

    const normalizedBusinessId =
        businessId != null && Number.isFinite(Number(businessId)) && Number(businessId) > 0
            ? String(Number(businessId))
            : '';

    const keyParts = [
        normalizedBusinessId,
        String(q ?? '').trim().toLowerCase(),
        String(view ?? 'all').trim().toLowerCase(),
        String(dateRange ?? 'all').trim().toLowerCase(),
        String(categoryKey ?? '').trim().toLowerCase(),
        String(city ?? '').trim().toLowerCase(),
        String(county ?? '').trim().toLowerCase(),
        String(type ?? '').trim().toLowerCase(),
    ];

    const storageKey = `business_posts_random_seed:${keyParts.join('|')}`;

    try {
        if (typeof sessionStorage !== 'undefined') {
            const existing = sessionStorage.getItem(storageKey);
            if (existing) return existing;

            const seed = `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
            sessionStorage.setItem(storageKey, seed);
            return seed;
        }
    } catch {
        // Ignore sessionStorage access issues and fall back below.
    }

    return `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
}

function normalizeBusinessPostSort(sort) {
    const raw = String(sort ?? '').trim();
    if (!raw) return 'any';

    const key = raw
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

    const aliases = {
        any: 'any',
        random: 'any',

        newest: 'newest',
        latest: 'newest',
        recent: 'newest',

        oldest: 'oldest',

        popular: 'popular',
        most_popular: 'popular',
        trending: 'popular',

        likes: 'likes',
        most_liked: 'likes',

        comments: 'comments',
        most_commented: 'comments',

        reposts: 'reposts',
        most_reposted: 'reposts',
    };

    return aliases[key] || 'any';
}


/**
 * Wrapper around fetch that automatically attaches account-scoping headers
 * (x-account-type, x-business-id, x-artist-id) from localStorage.
 * Also merges account identity into JSON bodies for POST/PUT/PATCH.
 */
async function authFetch(url, opts = {}) {
    const accountHeaders = getAccountHeaders();
    const merged = {
        ...opts,
        credentials: 'include',
        headers: {
            ...accountHeaders,
            ...(opts.headers || {}),
        },
    };

    // If there's a JSON body, merge account fields into it
    if (merged.body && merged.headers['Content-Type'] === 'application/json') {
        try {
            const parsed = JSON.parse(merged.body);
            const withAccount = { ...parsed, ...getAccountBody() };
            merged.body = JSON.stringify(withAccount);
        } catch {
            // body wasn't valid JSON, leave it alone
        }
    }

    return secureFetch(url, merged);
}

export async function submitBusinessApplication(payload) {
    const res = await authFetch(apiUrl('/api/business/applications'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {}),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

export async function fetchPublishedBusinesses({
                                                   limit = 50,
                                                   offset = 0,
                                                   q = '',
                                                   city = '',
                                                   county = '',
                                                   counties = null,
                                                   categoryKey = '',
                                                   sort = 'any',
                                                   view = 'all',
                                                   entityType = '',
                                               } = {}) {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    if (q) params.set('q', String(q));

    const normalizedCity = normalizeLocationFilter(city, 'All Cities');
    const normalizedCounty = normalizeLocationFilter(county, 'All Counties');
    const normalizedCategoryKey = String(categoryKey ?? '').trim();
    const normalizedSort = normalizeBusinessDirectorySort(sort);

    if (normalizedCity) params.set('city', normalizedCity);
    // Radius expansion: send comma-joined counties when >1
    const countiesArr = Array.isArray(counties) ? counties.filter(Boolean) : [];
    if (countiesArr.length > 1) {
        params.set('counties', countiesArr.join(','));
    } else if (normalizedCounty) {
        params.set('county', normalizedCounty);
    }
    if (normalizedCategoryKey) params.set('category_key', normalizedCategoryKey);
    params.set('sort', normalizedSort);
    if (view && view !== 'all') params.set('view', String(view));
    const normalizedEntityType = String(entityType ?? '').trim().toLowerCase();
    if (normalizedEntityType) params.set('entity_type', normalizedEntityType);

    const res = await authFetch(apiUrl(`/api/business?${params.toString()}`), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    // Expected shape (recommended): { items: [...], total: number }
    return data;
}

/**
 * Fetch businesses the current user can manage (owner/admin role).
 * Used for "My Businesses" view in the directory.
 * @returns {Promise<{businesses: Array}>}
 */
export async function fetchMyBusinesses() {
    const res = await authFetch(apiUrl('/api/business/mine'), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data; // { businesses: [...] }
}

export async function fetchBusinessPublicBySlug(slug) {
    const safeSlug = String(slug || '').trim();
    if (!safeSlug) throw new Error('Missing business slug.');

    const res = await authFetch(apiUrl(`/api/business/${encodeURIComponent(safeSlug)}`), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

export async function fetchBusinessPosts({
                                             limit = 50,
                                             offset = 0,
                                             businessId = null,
                                             q = '',
                                             view = 'all',
                                             sort = 'any',
                                             dateRange = 'all',
                                             categoryKey = '',
                                             city = '',
                                             county = '',
                                             counties = null,
                                             type = '',
                                             entityType = '',
                                             // Account identity — needed so the backend can scope
                                             // viewerLiked / viewerReposted per account
                                             // (mirrors what useCommunityData already does).
                                             activeBusinessId = null,
                                             activeArtistId = null,
                                         } = {}) {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    if (businessId != null) params.set('businessId', String(businessId));
    if (q) params.set('q', String(q));
    if (view && view !== 'all') params.set('view', String(view));
    // Supported sort values:
    // - newest (default)
    // - oldest
    // - popular
    // (legacy values like likes/comments/reposts are still accepted by the backend for backwards compatibility.)
    const normalizedSort = normalizeBusinessPostSort(sort);
    const normalizedDateRange = String(dateRange ?? 'all').trim().toLowerCase() || 'all';
    params.set('sort', normalizedSort);
    if (normalizedDateRange !== 'all') params.set('date_range', normalizedDateRange);
    if (categoryKey) params.set('category_key', String(categoryKey));
    if (type && type !== 'all') params.set('type', String(type));

    const normalizedEntityType = String(entityType ?? '').trim().toLowerCase();
    if (normalizedEntityType) params.set('entity_type', normalizedEntityType);

    const normalizedCity = normalizeLocationFilter(city, 'All Cities');
    const normalizedCounty = normalizeLocationFilter(county, 'All Counties');

    if (normalizedCity) params.set('city', normalizedCity);
    // Radius expansion: send comma-joined counties when >1
    const countiesArr = Array.isArray(counties) ? counties.filter(Boolean) : [];
    if (countiesArr.length > 1) {
        params.set('counties', countiesArr.join(','));
    } else if (normalizedCounty) {
        params.set('county', normalizedCounty);
    }

    const randomSeed = getStableBusinessPostsRandomSeed({
        normalizedSort,
        businessId,
        q,
        view,
        dateRange: normalizedDateRange,
        categoryKey,
        city: normalizedCity,
        county: normalizedCounty,
        type,
    });
    if (randomSeed) params.set('random_seed', randomSeed);

    // Account identity for per-account viewer state
    if (activeBusinessId && Number.isFinite(Number(activeBusinessId)) && Number(activeBusinessId) > 0) {
        params.set('activeBusinessId', String(activeBusinessId));
    }
    if (activeArtistId && Number.isFinite(Number(activeArtistId)) && Number(activeArtistId) > 0) {
        params.set('activeArtistId', String(activeArtistId));
    }

    const res = await authFetch(apiUrl(`/api/business/posts?${params.toString()}`), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data; // { items, total, limit, offset }
}

/**
 * Upload a single image to GCS via signed URL
 * Same approach as events - uses /api/uploads/signed-url
 */
async function uploadImageToGCS(file, folder = 'business-posts') {
    const safeName = String(file?.name || 'photo')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9._-]/g, '') || `photo-${Date.now()}.jpg`;
    const contentType = String(file?.type || 'image/jpeg');

    const payload = { fileName: safeName, contentType, folder };

    // 1) Ask backend for a signed PUT URL
    //    Use secureFetch directly (not authFetch) — the upload endpoint only needs
    //    auth cookies + CSRF token. authFetch merges getAccountBody() into the JSON
    //    which adds extra fields the upload endpoint doesn't expect (400 Bad Request).
    const signRes = await secureFetch(apiUrl('/api/uploads/signed-url'), {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...getAccountHeaders(),
        },
        body: JSON.stringify(payload),
    });

    if (!signRes.ok) {
        const errData = await safeJson(signRes);
        console.error('[uploadImageToGCS] Signing failed:', signRes.status, errData, 'Payload sent:', payload);
        throw new Error(errData?.message || errData?.error || `Upload signing failed (${signRes.status})`);
    }

    const data = await signRes.json();
    const signedUrl = data.signedUrl || data.signed_url || data.uploadUrl || data.upload_url || data.url || '';
    const publicUrl = data.publicUrl || data.public_url || (signedUrl ? signedUrl.split('?')[0] : '');

    if (!signedUrl) {
        throw new Error('Upload signing failed (missing signed URL)');
    }

    // 2) PUT directly to Google Cloud Storage
    const putRes = await fetch(signedUrl, {
        method: 'PUT',
        mode: 'cors',
        credentials: 'omit',
        headers: { 'Content-Type': contentType },
        body: file,
    });

    if (!putRes.ok) {
        throw new Error(`Photo upload failed (${putRes.status})`);
    }

    return publicUrl;
}

/**
 * Create a new business post
 * @param {string|number} businessId - The business ID
 * @param {object} postData - { title, body, type, photos (File[]), discount_text, promo_code, valid_until, terms }
 * @returns {Promise<{ok: boolean, post: object}>}
 */
export async function createBusinessPost(businessId, postData) {
    if (!businessId) throw new Error('Business ID is required.');
    if (!postData?.title) throw new Error('Post title is required.');

    // Upload photos first via signed URLs
    const mediaUrls = [];
    const photos = postData.photos || [];

    for (const photo of photos) {
        const file = photo instanceof File ? photo : photo?.file;
        if (file instanceof File) {
            try {
                const url = await uploadImageToGCS(file, 'business-posts');
                if (url) mediaUrls.push(url);
            } catch (err) {
                console.error('Photo upload failed:', err);
                // Continue with other photos
            }
        }
    }

    // Build payload
    const payload = {
        title: postData.title,
        body: postData.body || '',
        type: postData.type || 'update',
        media_urls: mediaUrls,
    };

    // Add deal-specific fields if present
    if (postData.type === 'deal') {
        if (postData.discount_text) payload.discount_text = postData.discount_text;
        if (postData.promo_code) payload.promo_code = postData.promo_code;
        if (postData.valid_until) payload.valid_until = postData.valid_until;
        if (postData.terms) payload.terms = postData.terms;
    }

    // Add location fields — always include when present in postData
    // so the backend receives explicit null for "no location" vs undefined for "not provided"
    if ('city' in postData) payload.city = postData.city || null;
    if ('county' in postData) payload.county = postData.county || null;
    if ('latitude' in postData) payload.latitude = postData.latitude;
    if ('longitude' in postData) payload.longitude = postData.longitude;

    const res = await authFetch(apiUrl(`/api/business/${businessId}/posts`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data; // { ok: true, post: {...} }
}

/**
 * Pin a business post
 * @param {string|number} postId
 * @returns {Promise<{ok: boolean, message?: string}>}
 */
export async function pinBusinessPost(postId) {
    if (!postId) throw new Error('Post ID is required.');

    const res = await authFetch(apiUrl(`/api/business/posts/${postId}/pin`), {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Unpin a business post
 * @param {string|number} postId
 * @returns {Promise<{ok: boolean, message?: string}>}
 */
export async function unpinBusinessPost(postId) {
    if (!postId) throw new Error('Post ID is required.');

    const res = await authFetch(apiUrl(`/api/business/posts/${postId}/unpin`), {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Update a business post
 * @param {string|number} postId - The post ID to update
 * @param {object} postData - The updated post data
 * @returns {Promise<{ok: boolean, post: object}>}
 */
export async function updateBusinessPost(postId, postData) {
    if (!postId) throw new Error('Post ID is required.');

    // Upload new photo files, keep existing URLs
    const finalMediaUrls = [];
    if (Array.isArray(postData.photos)) {
        for (const p of postData.photos) {
            if (p && p._existing && p.url) {
                finalMediaUrls.push(p.url);
            } else {
                const file = p instanceof File ? p : p?.file;
                if (file instanceof File) {
                    try {
                        const url = await uploadImageToGCS(file, `business-posts`);
                        if (url) finalMediaUrls.push(url);
                    } catch {
                        // skip failed uploads
                    }
                }
            }
        }
    }

    const payload = {
        title: postData.title,
        body: postData.body || '',
        type: postData.type || 'update',
    };

    // Add deal-specific fields if it's a deal
    if (postData.type === 'deal') {
        if (postData.discountText) payload.discount_text = postData.discountText;
        if (postData.promoCode) payload.promo_code = postData.promoCode;
        if (postData.validUntil) payload.valid_until = postData.validUntil;
        if (postData.terms) payload.terms = postData.terms;
    }

    // Include media URLs if provided (for photo add/remove/reorder)
    if (Array.isArray(postData.media_urls)) {
        payload.media_urls = postData.media_urls;
    } else if (Array.isArray(postData.photos) && finalMediaUrls.length >= 0) {
        payload.media_urls = finalMediaUrls;
    }

    const res = await authFetch(apiUrl(`/api/business/posts/${postId}`), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Delete a business post
 * @param {string|number} postId - The post ID to delete
 * @returns {Promise<{ok: boolean, message?: string}>}
 */
export async function deleteBusinessPost(postId) {
    if (!postId) throw new Error('Post ID is required.');

    const res = await authFetch(apiUrl(`/api/business/posts/${postId}`), {
        method: 'DELETE',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Report a business post
 * @param {object} params - { postId, reason, details }
 * @returns {Promise<{ok: boolean, message?: string}>}
 */
export async function reportBusinessPost({ postId, reason, details = '' }) {
    if (!postId) throw new Error('Post ID is required.');
    if (!reason) throw new Error('Reason is required.');

    const res = await authFetch(apiUrl(`/api/business/posts/${postId}/report`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, details }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Report a business
 * @param {object} params - { businessId, reason, details }
 * @returns {Promise<{ok: boolean, message?: string}>}
 */
export async function reportBusiness({ businessId, reason, details = '' }) {
    if (!businessId) throw new Error('Business ID is required.');
    if (!reason) throw new Error('Reason is required.');

    const res = await authFetch(apiUrl(`/api/business/${businessId}/report`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, details }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Toggle like on a business post
 * @param {string|number} postId
 * @returns {Promise<{ok: boolean, postId: number, likesCount: number, viewerLiked: boolean}>}
 */
export async function likeBusinessPost(postId) {
    if (!postId) throw new Error('Post ID is required.');

    const res = await authFetch(apiUrl(`/api/business/posts/${postId}/like`), {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Toggle repost on a business post
 * @param {string|number} postId
 * @returns {Promise<{ok: boolean, postId: number, repostsCount: number, viewerReposted: boolean}>}
 */
export async function repostBusinessPost(postId) {
    if (!postId) throw new Error('Post ID is required.');

    const res = await authFetch(apiUrl(`/api/business/posts/${postId}/repost`), {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

export async function fetchBusinessCategories() {
    const res = await authFetch(apiUrl('/api/business/categories'), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data; // { categories: [...] }
}

export async function fetchBusinessCategoryCounts({ q = '', city = '', county = '' } = {}) {
    const params = new URLSearchParams();
    if (q) params.set('q', String(q));

    const normalizedCity = normalizeLocationFilter(city, 'All Cities');
    const normalizedCounty = normalizeLocationFilter(county, 'All Counties');

    if (normalizedCity) params.set('city', normalizedCity);
    if (normalizedCounty) params.set('county', normalizedCounty);

    const res = await authFetch(apiUrl(`/api/business/categories/counts?${params.toString()}`), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data; // { counts: { key: count }, total: number }
}

/**
 * Fetch location counts for businesses — { counties: {...}, cities: {...} }
 * Used by BusinessFilterBar to show county/city badge counts.
 */
export async function fetchBusinessLocationCounts({ q = '', county = '', city = '', categoryKey = '', view = '', entityType = '', sort = '' } = {}) {
    const params = new URLSearchParams();
    if (q) params.set('q', String(q));

    const normalizedCounty = normalizeLocationFilter(county, 'All Counties');
    if (normalizedCounty) params.set('county', normalizedCounty);

    const normalizedCity = normalizeLocationFilter(city, 'All Cities');
    if (normalizedCity) params.set('city', normalizedCity);

    if (categoryKey) params.set('categoryKey', String(categoryKey));
    if (view && view !== 'all') params.set('view', String(view));
    if (entityType) params.set('entityType', String(entityType));
    if (sort && sort !== 'any') params.set('sort', String(sort));

    const res = await authFetch(apiUrl(`/api/business/location-counts?${params.toString()}`), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) return { counties: {}, cities: {} };

    return {
        counties: data?.counties && typeof data.counties === 'object' ? data.counties : {},
        cities: data?.cities && typeof data.cities === 'object' ? data.cities : {},
    };
}

/**
 * Fetch location counts for business posts — { counties: {...}, cities: {...} }
 * Posts inherit location from their parent business.
 */
export async function fetchBusinessPostLocationCounts({ q = '', type = '', county = '', city = '', categoryKey = '', view = '', entityType = '', dateRange = '', sort = '' } = {}) {
    const params = new URLSearchParams();
    if (q) params.set('q', String(q));
    if (type) params.set('type', String(type));

    const normalizedCounty = normalizeLocationFilter(county, 'All Counties');
    if (normalizedCounty) params.set('county', normalizedCounty);

    const normalizedCity = normalizeLocationFilter(city, 'All Cities');
    if (normalizedCity) params.set('city', normalizedCity);

    if (categoryKey) params.set('categoryKey', String(categoryKey));
    if (view && view !== 'all') params.set('view', String(view));
    if (entityType) params.set('entityType', String(entityType));
    if (dateRange && dateRange !== 'all') params.set('dateRange', String(dateRange));
    if (sort && sort !== 'any' && sort !== 'newest') params.set('sort', String(sort));

    const res = await authFetch(apiUrl(`/api/business/posts/location-counts?${params.toString()}`), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) return { counties: {}, cities: {} };

    return {
        counties: data?.counties && typeof data.counties === 'object' ? data.counties : {},
        cities: data?.cities && typeof data.cities === 'object' ? data.cities : {},
    };
}

export async function validateBusinessSetupInvite(token) {
    const t = String(token || '').trim();
    if (!t) throw new Error('Missing setup token.');

    const params = new URLSearchParams();
    params.set('token', t);

    const res = await authFetch(apiUrl(`/api/business/invite/validate?${params.toString()}`), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data; // { ok, invite, prefill }
}

/**
 * Validate a team invite token
 * @param {string} token - The invite token
 * @returns {Promise<{ok: boolean, invite: object}>}
 */
export async function validateInviteToken(token) {
    const t = String(token || '').trim();
    if (!t) throw new Error('Missing invite token.');

    const res = await authFetch(apiUrl(`/api/business/team/invites/validate?token=${encodeURIComponent(t)}`), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data; // { ok, invite }
}

export async function requestBusinessNameChange({ token, requested_name, reason } = {}) {
    const t = String(token || '').trim();
    const rn = String(requested_name || '').trim();
    const rs = String(reason || '').trim();

    if (!t) throw new Error('Missing setup token.');
    if (!rn) throw new Error('Requested name is required.');

    const res = await authFetch(apiUrl('/api/business/invite/request-name-change'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: t, requested_name: rn, reason: rs }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data; // { ok, id }
}

/**
 * Fetch business accounts & setup/application status for the signed-in user.
 * Returns a normalized shape:
 * {
 *   businesses: Array,
 *   pendingSetups: Array,
 *   pendingApplications: Array
 * }
 */
export async function fetchMyBusinessAccounts() {
    const res = await authFetch(apiUrl('/api/business/accounts/me'), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return {
        businesses: Array.isArray(data?.businesses) ? data.businesses : [],
        pendingSetups: Array.isArray(data?.pendingSetups) ? data.pendingSetups : [],
        pendingApplications: Array.isArray(data?.pendingApplications) ? data.pendingApplications : [],
    }; // normalized
}

// ============================================================================
// Team Management API
// ============================================================================

/**
 * Fetch team members and pending invites for a business
 * @param {string|number} businessId
 * @returns {Promise<{members: Array, pending_invites: Array, team_size: number, max_team_size: number, viewer_role: string}>}
 */
export async function fetchBusinessTeam(businessId) {
    if (!businessId) throw new Error('Business ID is required.');

    const res = await authFetch(apiUrl(`/api/business/${businessId}/team`), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Send team invite to a user
 * @param {string|number} businessId
 * @param {object} params - { user_id, role, message }
 * @returns {Promise<{ok: boolean, invite: object}>}
 */
export async function sendTeamInvite(businessId, { user_id, role = 'member', message = '' } = {}) {
    if (!businessId) throw new Error('Business ID is required.');
    if (!user_id) throw new Error('User ID is required.');

    const res = await authFetch(apiUrl(`/api/business/${businessId}/team/invite`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, role, message }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Invite a team member (alias for sendTeamInvite)
 * @param {string|number} businessId
 * @param {object} params - { user_id, role, message }
 * @returns {Promise<{ok: boolean, invite: object}>}
 */
export async function inviteTeamMember(businessId, params) {
    return sendTeamInvite(businessId, params);
}

/**
 * Generate a shareable invite link for team
 * @param {string|number} businessId
 * @param {object} params - { role, expires_in_days }
 * @returns {Promise<{ok: boolean, link: string, token: string}>}
 */
export async function generateInviteLink(businessId, { role = 'member', expires_in_days = 7 } = {}) {
    if (!businessId) throw new Error('Business ID is required.');

    const res = await authFetch(apiUrl(`/api/business/${businessId}/team/invite-link`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, expires_in_days }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data; // { ok, link, token }
}

/**
 * Cancel a pending team invite
 * @param {string|number} businessId
 * @param {string|number} inviteId
 * @returns {Promise<{ok: boolean}>}
 */
export async function cancelTeamInvite(businessId, inviteId) {
    if (!businessId) throw new Error('Business ID is required.');
    if (!inviteId) throw new Error('Invite ID is required.');

    const res = await authFetch(apiUrl(`/api/business/${businessId}/team/invite/${inviteId}`), {
        method: 'DELETE',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Update a team member's role
 * @param {string|number} businessId
 * @param {string|number} userId
 * @param {string} role - 'admin' | 'member'
 * @returns {Promise<{ok: boolean}>}
 */
export async function updateTeamMemberRole(businessId, userId, role) {
    if (!businessId) throw new Error('Business ID is required.');
    if (!userId) throw new Error('User ID is required.');
    if (!role) throw new Error('Role is required.');

    const res = await authFetch(apiUrl(`/api/business/${businessId}/team/${userId}/role`), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Change a team member's role (alias for updateTeamMemberRole)
 * @param {string|number} businessId
 * @param {string|number} userId
 * @param {string} role - 'admin' | 'member'
 * @returns {Promise<{ok: boolean}>}
 */
export async function changeTeamMemberRole(businessId, userId, role) {
    return updateTeamMemberRole(businessId, userId, role);
}

/**
 * Remove a team member
 * @param {string|number} businessId
 * @param {string|number} userId
 * @returns {Promise<{ok: boolean}>}
 */
export async function removeTeamMember(businessId, userId) {
    if (!businessId) throw new Error('Business ID is required.');
    if (!userId) throw new Error('User ID is required.');

    const res = await authFetch(apiUrl(`/api/business/${businessId}/team/${userId}`), {
        method: 'DELETE',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Leave a business team (self-removal)
 * @param {string|number} businessId
 * @returns {Promise<{ok: boolean}>}
 */
export async function leaveBusinessTeam(businessId) {
    if (!businessId) throw new Error('Business ID is required.');

    const res = await authFetch(apiUrl(`/api/business/${businessId}/team/leave`), {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

// ============================================================================
// Team Invite Response API (for the invited user)
// ============================================================================

/**
 * Accept a team invite
 * @param {string|number} inviteId
 * @returns {Promise<{ok: boolean, business_id: number}>}
 */
export async function acceptTeamInvite(inviteId) {
    if (!inviteId) throw new Error('Invite ID is required.');

    const res = await authFetch(apiUrl(`/api/business/team/invites/${inviteId}/accept`), {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Decline a team invite
 * @param {string|number} inviteId
 * @returns {Promise<{ok: boolean}>}
 */
export async function declineTeamInvite(inviteId) {
    if (!inviteId) throw new Error('Invite ID is required.');

    const res = await authFetch(apiUrl(`/api/business/team/invites/${inviteId}/decline`), {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Fetch pending team invites for the current user
 * @returns {Promise<{invites: Array}>}
 */
export async function fetchMyTeamInvites() {
    const res = await authFetch(apiUrl('/api/business/team/invites/mine'), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data; // { invites: [...] }
}

// ============================================================================
// Business Settings API
// ============================================================================

/**
 * Fetch business settings
 * @param {string|number} businessId
 * @returns {Promise<{ok: boolean, settings: object}>}
 */
export async function fetchBusinessSettings(businessId) {
    if (!businessId) throw new Error('Business ID is required.');

    const res = await authFetch(apiUrl(`/api/business/${businessId}/settings`), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data; // { ok, settings }
}

/**
 * Update business settings
 * @param {string|number} businessId
 * @param {object} settings - Settings to update
 * @returns {Promise<{ok: boolean, settings: object}>}
 */
export async function updateBusinessSettings(businessId, settings) {
    if (!businessId) throw new Error('Business ID is required.');

    const res = await authFetch(apiUrl(`/api/business/${businessId}/settings`), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings || {}),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data; // { ok, settings }
}

/**
 * Update basic business info (name change requires approval for published businesses)
 * @param {string|number} businessId
 * @param {object} updates - { name, tagline, description, email_public, phone, website_url, ... }
 * @returns {Promise<{ok: boolean, business: object, name_change_pending?: boolean}>}
 */
export async function updateBusinessInfo(businessId, updates) {
    if (!businessId) throw new Error('Business ID is required.');

    const res = await authFetch(apiUrl(`/api/business/${businessId}/profile`), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates || {}),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Update business profile (alias for updateBusinessInfo)
 * @param {string|number} businessId
 * @param {object} updates - { name, tagline, description, email_public, phone, website_url, ... }
 * @returns {Promise<{ok: boolean, business: object, name_change_pending?: boolean}>}
 */
export async function updateBusinessProfile(businessId, updates) {
    return updateBusinessInfo(businessId, updates);
}

/**
 * Delete files from Google Cloud Storage for a business.
 * Used when removing profile photos, cover photos, gallery photos, or team photos.
 * @param {string|number} businessId
 * @param {string[]} urls - Array of GCS public URLs to delete
 * @returns {Promise<{ok: boolean, deleted: number}>}
 */
export async function deleteBusinessFiles(businessId, urls) {
    if (!businessId) throw new Error('Business ID is required.');
    if (!Array.isArray(urls) || urls.length === 0) return { ok: true, deleted: 0 };

    // Filter out empty/blob URLs — only send real GCS URLs
    const validUrls = urls.filter((u) => u && typeof u === 'string' && !u.startsWith('blob:') && u.startsWith('http'));
    if (validUrls.length === 0) return { ok: true, deleted: 0 };

    const res = await authFetch(apiUrl(`/api/business/${businessId}/delete-files`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: validUrls }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Update business hours
 * @param {string|number} businessId
 * @param {object} hours - { monday: { open, close, closed, allDay }, ... }
 * @returns {Promise<{ok: boolean, hours: object}>}
 */
export async function updateBusinessHours(businessId, hours) {
    if (!businessId) throw new Error('Business ID is required.');

    const res = await authFetch(apiUrl(`/api/business/${businessId}/hours`), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: hours || {} }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}



/**
 * Upsert a special/temporary hours override for a specific date.
 * Use this when a business needs to temporarily close or change hours for a day.
 *
 * Endpoint: PUT /api/business/:businessId/special-hours
 *
 * @param {string|number} businessId
 * @param {object} payload - { date: 'YYYY-MM-DD', closed?: boolean, allDay?: boolean, open?: 'HH:MM', close?: 'HH:MM', note?: string }
 * @returns {Promise<{ok: boolean, specialHour: object}>}
 */
export async function upsertBusinessSpecialHours(businessId, payload) {
    if (!businessId) throw new Error('Business ID is required.');
    const res = await authFetch(apiUrl(`/api/business/${businessId}/special-hours`), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {}),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Delete a special/temporary hours override for a specific date.
 *
 * Endpoint: DELETE /api/business/:businessId/special-hours/:date
 *
 * @param {string|number} businessId
 * @param {string} date - 'YYYY-MM-DD'
 * @returns {Promise<{ok: boolean}>}
 */
export async function deleteBusinessSpecialHours(businessId, date) {
    if (!businessId) throw new Error('Business ID is required.');
    const d = String(date || '').trim();
    if (!d) throw new Error('Date is required.');
    const res = await authFetch(apiUrl(`/api/business/${businessId}/special-hours/${encodeURIComponent(d)}`), {
        method: 'DELETE',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data || { ok: true };
}


/**
 * Update business social links
 * @param {string|number} businessId
 * @param {object} socials - { facebook_url, instagram_url, twitter_url }
 * @returns {Promise<{ok: boolean}>}
 */
export async function updateBusinessSocials(businessId, socials) {
    if (!businessId) throw new Error('Business ID is required.');

    const res = await authFetch(apiUrl(`/api/business/${businessId}/socials`), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(socials || {}),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Update business photos (avatar, cover, gallery)
 * @param {string|number} businessId
 * @param {object} photos - { avatar_url, cover_url, gallery }
 * @returns {Promise<{ok: boolean}>}
 */
export async function updateBusinessPhotos(businessId, photos) {
    if (!businessId) throw new Error('Business ID is required.');

    const res = await authFetch(apiUrl(`/api/business/${businessId}/photos`), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(photos || {}),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Upload a single image for a business (returns CDN URL)
 * @param {string|number} businessId
 * @param {File} file - The image file to upload
 * @param {string} type - 'avatar' | 'cover' | 'gallery' | 'post'
 * @returns {Promise<{ok: boolean, url: string}>}
 */
export async function uploadBusinessImage(businessId, file, type = 'gallery') {
    if (!businessId) throw new Error('Business ID is required.');
    if (!file) throw new Error('File is required.');

    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);

    const res = await authFetch(apiUrl(`/api/business/${businessId}/upload`), {
        method: 'POST',
        credentials: 'include',
        body: formData,
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data; // { ok: true, url: '...' }
}

// ============================================================================
// Business Lifecycle API
// ============================================================================

/**
 * Request a name change for a published business (requires admin approval)
 * @param {string|number} businessId
 * @param {string} requestedName
 * @param {string} reason
 * @returns {Promise<{ok: boolean, message: string}>}
 */
export async function requestPublishedBusinessNameChange(businessId, requestedName, reason = '') {
    if (!businessId) throw new Error('Business ID is required.');
    if (!requestedName) throw new Error('Requested name is required.');

    const res = await authFetch(apiUrl(`/api/business/${businessId}/request-name-change`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requested_name: requestedName, reason }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Transfer business ownership to another team member
 * @param {string|number} businessId
 * @param {string|number} newOwnerId - User ID of the new owner
 * @returns {Promise<{ok: boolean, message: string, new_owner_id: number}>}
 */
export async function transferBusinessOwnership(businessId, newOwnerId) {
    if (!businessId) throw new Error('Business ID is required.');
    if (!newOwnerId) throw new Error('New owner ID is required.');

    const res = await authFetch(apiUrl(`/api/business/${businessId}/transfer-ownership`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_owner_id: newOwnerId }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Deactivate (suspend) a business page
 * @param {string|number} businessId
 * @returns {Promise<{ok: boolean, message: string}>}
 */
export async function deactivateBusiness(businessId) {
    if (!businessId) throw new Error('Business ID is required.');

    const res = await authFetch(apiUrl(`/api/business/${businessId}/deactivate`), {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Reactivate a suspended business page
 * @param {string|number} businessId
 * @returns {Promise<{ok: boolean, message: string}>}
 */
export async function reactivateBusiness(businessId) {
    if (!businessId) throw new Error('Business ID is required.');

    const res = await authFetch(apiUrl(`/api/business/${businessId}/reactivate`), {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Permanently delete a business (DANGER!)
 * @param {string|number} businessId
 * @param {string} confirmName - Must match business name exactly
 * @returns {Promise<{ok: boolean, message: string}>}
 */
export async function deleteBusinessPermanently(businessId, confirmName) {
    if (!businessId) throw new Error('Business ID is required.');
    if (!confirmName) throw new Error('Confirmation name is required.');

    const res = await authFetch(apiUrl(`/api/business/${businessId}/permanent`), {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm_name: confirmName }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

// ============================================================================
// User Search (for invite modal)
// ============================================================================

/**
 * Search users globally (for team invites)
 * Uses the existing /users/search endpoint
 * @param {object} params - { q, county, city, limit, offset }
 * @returns {Promise<{users: Array, total: number}>}
 */
export async function searchUsersForInvite({ q = '', county = '', city = '', limit = 20, offset = 0 } = {}) {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    params.set('includeTotal', '1');
    if (q) params.set('q', String(q));
    if (county) params.set('county', String(county));
    if (city) params.set('city', String(city));

    const res = await authFetch(apiUrl(`/users/search?${params.toString()}`), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    // Normalize response
    const users = Array.isArray(data) ? data : Array.isArray(data?.users) ? data.users : [];
    const total = Number.isFinite(Number(data?.total)) ? Number(data.total) : users.length;

    return { users, total };
}

/**
 * Fetch user's followers (for invite modal "My Followers" tab)
 * Uses the existing /users/social/:id endpoint
 * @param {string|number} userId - The logged-in user's ID or handle
 * @returns {Promise<{following: Array, followers: Array}>}
 */
export async function fetchUserSocialForInvite(userId) {
    if (!userId) throw new Error('User ID is required.');

    const res = await authFetch(apiUrl(`/users/social/${encodeURIComponent(userId)}`), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return {
        following: Array.isArray(data?.following) ? data.following : [],
        followers: Array.isArray(data?.followers) ? data.followers : [],
    };
}

/**
 * Fetch events belonging to a specific business account.
 * @param {object} params
 * @param {string|number} params.businessAccountId - The business account ID
 * @param {number} [params.limit=50]
 * @param {number} [params.page=1]
 * @param {string} [params.range='month'] - Date range filter
 * @returns {Promise<{items: Array, hasMore: boolean}>}
 */
export async function fetchBusinessEvents({
                                              businessAccountId,
                                              limit = 50,
                                              page = 1,
                                              range = 'month',
                                          } = {}) {
    if (!businessAccountId) throw new Error('Business account ID is required.');

    const params = new URLSearchParams();
    params.set('businessAccountId', String(businessAccountId));
    params.set('limit', String(limit));
    params.set('page', String(page));
    params.set('range', range);
    params.set('includeStatewide', '1');

    const res = await authFetch(apiUrl(`/api/events?${params.toString()}`), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return {
        items: Array.isArray(data?.items) ? data.items : [],
        hasMore: Boolean(data?.hasMore),
    };
}

/* ======================================================================
   BUSINESS REVIEWS
   ====================================================================== */

/**
 * Fetch reviews for a business.
 * @param {object} params
 * @param {string|number} params.businessId
 * @param {number} [params.limit=20]
 * @param {number} [params.offset=0]
 * @param {string} [params.sort='newest']
 * @returns {Promise<{items: Array, total: number, averageRating: number, ratingCounts: object, userReview: object|null}>}
 */
export async function fetchBusinessReviews({
                                               businessId,
                                               limit = 20,
                                               offset = 0,
                                               sort = 'any',
                                           } = {}) {
    if (!businessId) throw new Error('Business ID is required.');

    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    if (sort) params.set('sort', sort);

    const res = await authFetch(apiUrl(`/api/business/${businessId}/reviews?${params.toString()}`), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Create or update a review for a business (with optional photos).
 * Photos are uploaded to GCS via signed URL first, then URLs are sent with the review.
 * @param {string|number} businessId
 * @param {object} reviewData - { rating (1-5), title?, body?, photos? (File[]) }
 * @returns {Promise<{ok: boolean, review: object}>}
 */
export async function submitBusinessReview(businessId, reviewData) {
    if (!businessId) throw new Error('Business ID is required.');
    if (!reviewData?.rating) throw new Error('Rating is required.');

    // Upload photos first via signed URLs (same pattern as business posts)
    const photoUrls = [];
    const photos = reviewData.photos || [];

    // Include existing photos the user chose to keep
    const existingKept = Array.isArray(reviewData._existingPhotoUrls) ? reviewData._existingPhotoUrls : [];
    for (const url of existingKept) {
        const s = String(url || '').trim();
        if (s && (s.startsWith('http://') || s.startsWith('https://'))) {
            photoUrls.push(s);
        }
    }

    // Upload new photo files via signed URLs
    for (const photo of photos) {
        const file = photo instanceof File ? photo : photo?.file;
        if (file instanceof File) {
            try {
                const url = await uploadImageToGCS(file, `business-reviews/${businessId}`);
                if (url) photoUrls.push(url);
            } catch (err) {
                // Continue with other photos on failure
            }
        }
    }

    // Enforce max 4
    const finalPhotoUrls = photoUrls.slice(0, 4);

    const res = await authFetch(apiUrl(`/api/business/${businessId}/reviews`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            rating: reviewData.rating,
            title: reviewData.title || '',
            body: reviewData.body || '',
            photo_urls: finalPhotoUrls,
        }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Delete the current user's review for a business.
 * @param {string|number} businessId
 * @returns {Promise<{ok: boolean}>}
 */
export async function deleteBusinessReview(businessId) {
    if (!businessId) throw new Error('Business ID is required.');

    const res = await authFetch(apiUrl(`/api/business/${businessId}/reviews`), {
        method: 'DELETE',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Business owner replies to a review.
 * @param {string|number} businessId
 * @param {string|number} reviewId
 * @param {string} body - Reply text
 * @returns {Promise<{ok: boolean}>}
 */
export async function replyToBusinessReview(businessId, reviewId, body, replyPhotos = []) {
    if (!businessId) throw new Error('Business ID is required.');
    if (!reviewId) throw new Error('Review ID is required.');
    if (!body) throw new Error('Reply body is required.');

    // Upload reply photo files via signed URLs
    const replyPhotoUrls = [];
    for (const photo of replyPhotos) {
        if (typeof photo === 'string' && photo.startsWith('http')) {
            // Existing URL kept by user
            replyPhotoUrls.push(photo);
        } else {
            const file = photo instanceof File ? photo : photo?.file;
            if (file instanceof File) {
                try {
                    const url = await uploadImageToGCS(file, `business-review-replies/${businessId}`);
                    if (url) replyPhotoUrls.push(url);
                } catch {
                    // Continue with other photos on failure
                }
            }
        }
    }

    const res = await authFetch(apiUrl(`/api/business/${businessId}/reviews/${reviewId}/reply`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, reply_photo_urls: replyPhotoUrls.slice(0, 4) }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Delete a business owner's reply to a review.
 * @param {string|number} businessId
 * @param {string|number} reviewId
 * @returns {Promise<{ok: boolean}>}
 */
export async function deleteReviewReply(businessId, reviewId) {
    if (!businessId) throw new Error('Business ID is required.');
    if (!reviewId) throw new Error('Review ID is required.');

    const res = await authFetch(apiUrl(`/api/business/${businessId}/reviews/${reviewId}/reply`), {
        method: 'DELETE',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Toggle "helpful" vote on a business review.
 * @param {string|number} businessId
 * @param {string|number} reviewId
 * @returns {Promise<{ok: boolean, reviewId: number, helpfulCount: number, viewerFoundHelpful: boolean}>}
 */
export async function toggleReviewHelpful(businessId, reviewId) {
    if (!businessId) throw new Error('Business ID is required.');
    if (!reviewId) throw new Error('Review ID is required.');

    const res = await authFetch(apiUrl(`/api/business/${businessId}/reviews/${reviewId}/helpful`), {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Follow or unfollow a business.
 * Calls POST /api/users/follow with target_type='business'.
 *
 * @param {string|number} businessId - The business ID to follow/unfollow
 * @param {'follow'|'unfollow'} action - 'follow' or 'unfollow'
 * @returns {Promise<{ok: boolean, isFollowing: boolean, followRequested: boolean, counts: object}>}
 */
export async function followBusiness(businessId, action = 'follow') {
    if (!businessId) throw new Error('Business ID is required.');
    if (action !== 'follow' && action !== 'unfollow') throw new Error('Invalid action.');

    const res = await authFetch(apiUrl('/api/users/follow'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            target_id: Number(businessId),
            target_type: 'business',
            action,
        }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Bulk-check follow states for a list of business IDs.
 * Calls GET /api/users/follow-states with target_type='business'.
 *
 * @param {Array<number|string>} businessIds - Array of business IDs to check
 * @returns {Promise<{ok: boolean, following: Record<string, boolean>}>}
 */
export async function fetchBusinessFollowStates(businessIds) {
    if (!Array.isArray(businessIds) || businessIds.length === 0) {
        return { ok: true, following: {} };
    }

    const ids = businessIds
        .map((id) => Number(id))
        .filter((n) => Number.isFinite(n) && n > 0);
    if (ids.length === 0) return { ok: true, following: {} };

    const params = new URLSearchParams();
    params.set('target_ids', ids.join(','));
    params.set('target_type', 'business');

    const res = await authFetch(apiUrl(`/api/users/follow-states?${params.toString()}`), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

// ============================================================================
// Business Setup Flow API Functions
// ============================================================================

/**
 * Check if a business slug/handle is available.
 * Calls GET /api/business/check-slug?slug=xxx&exclude_id=yyy
 * @param {string} slug - The slug to check
 * @param {number|string} [excludeId] - Business ID to exclude (for edits)
 * @returns {Promise<{available: boolean, message: string}>}
 */
export async function checkBusinessSlug(slug, excludeId) {
    const params = new URLSearchParams();
    params.set('slug', String(slug || '').trim());
    if (excludeId) params.set('exclude_id', String(excludeId));

    const res = await secureFetch(apiUrl(`/api/business/check-slug?${params.toString()}`), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);
    if (!res.ok) return { available: false, message: 'Failed to check handle.' };
    return data || { available: false, message: 'Failed to check handle.' };
}

/**
 * Fetch handle change stats (rate-limiting info) for a business.
 * Mirrors ProfileHeader's handleStats: { remaining, nextAllowed }
 * Calls GET /api/business/:businessId/handle-stats
 * @param {number|string} businessId
 * @returns {Promise<{ remaining: number, nextAllowed: string|null }>}
 */
export async function fetchBusinessHandleStats(businessId) {
    if (!businessId) return { remaining: 2, nextAllowed: null };

    const res = await authFetch(apiUrl(`/api/business/${encodeURIComponent(businessId)}/handle-stats`), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);
    if (!res.ok) return { remaining: 2, nextAllowed: null };
    return data || { remaining: 2, nextAllowed: null };
}

/**
 * Create a new business draft.
 * Calls POST /api/business/create-draft
 * @param {string} businessName - The business name
 * @returns {Promise<{ok: boolean, business_id: number, token: string, slug: string, setup_url: string}>}
 */
export async function createBusinessDraft(businessName) {
    if (!businessName || !String(businessName).trim()) {
        throw new Error('Business name is required.');
    }

    const res = await authFetch(apiUrl('/api/business/create-draft'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_name: String(businessName).trim() }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Extract structured business listing data from the owner's own website.
 * Calls POST /api/business/extract-from-website.
 *
 * The owner provides their own website URL voluntarily; the server fetches
 * the site and uses Claude to pull out fields (name, phone, address, hours,
 * description, etc.) to pre-populate their draft listing.
 *
 * @param {string} websiteUrl - Full URL starting with http:// or https://
 * @returns {Promise<{ok: boolean, extracted?: object, message?: string}>}
 */
export async function extractFromWebsite(websiteUrl) {
    if (!websiteUrl || !String(websiteUrl).trim()) {
        throw new Error('Please enter a website URL.');
    }

    const res = await authFetch(apiUrl('/api/business/extract-from-website'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website_url: String(websiteUrl).trim() }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Fetch invite details for business setup page.
 * Calls GET /api/business/invite/details?token=xxx
 * @param {string} token - The invite token
 * @returns {Promise<{invite: object, application: object, business: object}>}
 */
export async function fetchInviteDetails(token) {
    if (!token) throw new Error('Missing invite token.');

    const res = await authFetch(apiUrl(`/api/business/invite/details?token=${encodeURIComponent(token)}`), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        if (data?.redirect_to) err.redirect_to = data.redirect_to;
        throw err;
    }

    return data;
}

/**
 * Save business draft (without submitting for approval).
 * Calls POST /api/business/invite/save-draft
 * @param {string} token - The invite token
 * @param {object} profileData - The business profile data to save
 * @returns {Promise<{ok: boolean, business: object}>}
 */
export async function saveBusinessDraft(token, profileData) {
    if (!token) throw new Error('Missing invite token.');

    const res = await authFetch(apiUrl('/api/business/invite/save-draft'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...profileData }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        if (data?.redirect_to) err.redirect_to = data.redirect_to;
        throw err;
    }

    return data;
}

/**
 * Complete business setup and submit for approval.
 * Calls POST /api/business/invite/complete
 * @param {string} token - The invite token
 * @param {object} profileData - The business profile data to submit
 * @returns {Promise<{ok: boolean, business: object, pending_approval: boolean}>}
 */
export async function completeBusinessSetup(token, profileData) {
    if (!token) throw new Error('Missing invite token.');

    const res = await authFetch(apiUrl('/api/business/invite/complete'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...profileData }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        if (data?.redirect_to) err.redirect_to = data.redirect_to;
        throw err;
    }

    return data;
}

/**
 * Delete a business draft during setup.
 * Calls DELETE /api/business/invite/delete
 * @param {string} token - The invite token
 * @returns {Promise<{ok: boolean}>}
 */
export async function deleteBusinessDraft(token) {
    if (!token) throw new Error('Missing invite token.');

    const res = await authFetch(apiUrl('/api/business/invite/delete'), {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}


// ============================================================================
// Business Activity API Functions
// ============================================================================

/**
 * Fetch comments made BY this business across all post types.
 * Calls GET /api/business/:businessId/activity/comments
 *
 * @param {number|string} businessId
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ comments: Array<{ post: object, comments: object[] }> }>}
 */
export async function fetchBusinessActivityComments(businessId, signal) {
    const res = await authFetch(apiUrl(`/api/business/${encodeURIComponent(businessId)}/activity/comments?limit=200`), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
        signal: signal || undefined,
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Fetch posts liked BY this business across all post types.
 * Calls GET /api/business/:businessId/activity/likes
 *
 * @param {number|string} businessId
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ items: Array<object> }>}
 */
export async function fetchBusinessActivityLikes(businessId, signal) {
    const res = await authFetch(apiUrl(`/api/business/${encodeURIComponent(businessId)}/activity/likes?limit=200`), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
        signal: signal || undefined,
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Fetch posts reposted BY this business across all post types.
 * Calls GET /api/business/:businessId/activity/reposts
 *
 * @param {number|string} businessId
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ items: Array<object> }>}
 */
export async function fetchBusinessActivityReposts(businessId, signal) {
    const res = await authFetch(apiUrl(`/api/business/${encodeURIComponent(businessId)}/activity/reposts?limit=200`), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
        signal: signal || undefined,
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
            `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Business Claim API — users claiming unclaimed business profiles
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Submit a claim request for an unclaimed business.
 *
 * @param {object} payload
 * @param {number} payload.unclaimed_business_id
 * @param {string} payload.claimant_name
 * @param {string} payload.claimant_email
 * @param {string} payload.claimant_role  - 'owner' | 'manager' | 'marketing' | 'authorized_rep' | 'other'
 * @param {string} payload.claim_message  - min 20 chars
 * @param {string} [payload.proof_url]    - optional GCS path
 */
export async function submitBusinessClaim(payload) {
    const res = await authFetch(apiUrl('/api/claims'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await safeJson(res);
    if (!res.ok) {
        const msg = (data && typeof data === 'object' && typeof data.error === 'string' && data.error)
            || `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }
    return data;
}

/**
 * Fetch the current user's claim requests.
 * @returns {Promise<{ok: boolean, claims: Array}>}
 */
export async function fetchMyClaims() {
    const res = await authFetch(apiUrl('/api/claims/mine'), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });
    const data = await safeJson(res);
    if (!res.ok) {
        const msg = (data && data.error) || `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        throw err;
    }
    return data;
}

/**
 * Cancel a pending claim request (user can only cancel their own).
 */
export async function cancelMyClaim(claimId) {
    const res = await authFetch(apiUrl(`/api/claims/${encodeURIComponent(claimId)}`), {
        method: 'DELETE',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });
    const data = await safeJson(res);
    if (!res.ok) {
        const msg = (data && data.error) || `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        throw err;
    }
    return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin claim management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * List claims for admin review queue.
 *
 * @param {object} [opts]
 * @param {string} [opts.status] - 'pending' (default) | 'approved' | 'rejected' | 'cancelled' | 'all'
 * @param {number} [opts.limit]
 * @param {number} [opts.offset]
 */
export async function adminListClaims({ status = 'pending', limit = 50, offset = 0 } = {}) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    params.set('limit', String(limit));
    params.set('offset', String(offset));

    const res = await authFetch(apiUrl(`/api/admin/claims?${params.toString()}`), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });
    const data = await safeJson(res);
    if (!res.ok) {
        const msg = (data && data.error) || `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        throw err;
    }
    return data;
}

/**
 * Approve a claim — promotes the unclaimed business to a real businesses row.
 */
export async function adminApproveClaim(claimId, { adminNotes } = {}) {
    const res = await authFetch(apiUrl(`/api/admin/claims/${encodeURIComponent(claimId)}/approve`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ admin_notes: adminNotes || null }),
    });
    const data = await safeJson(res);
    if (!res.ok) {
        const msg = (data && data.error) || `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        throw err;
    }
    return data;
}

/**
 * Reject a claim with a reason (user-visible message).
 */
export async function adminRejectClaim(claimId, { rejectionReason, adminNotes } = {}) {
    const res = await authFetch(apiUrl(`/api/admin/claims/${encodeURIComponent(claimId)}/reject`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
            rejection_reason: rejectionReason || '',
            admin_notes: adminNotes || null,
        }),
    });
    const data = await safeJson(res);
    if (!res.ok) {
        const msg = (data && data.error) || `Request failed (${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        throw err;
    }
    return data;
}

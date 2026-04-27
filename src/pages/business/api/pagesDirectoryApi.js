// src/pages/business/api/pagesDirectoryApi.js
/**
 * Pages Directory API (public)
 * ---------------------------
 * Supports listing published pages (filter by type) and fetching by slug.
 *
 * ACCOUNT-AWARE: When fetching business posts, attaches account identity
 * headers + query params so the backend can scope viewerLiked / viewerReposted
 * to the active account (personal, business, or artist).
 */

import { getAccountHeaders, getAccountQueryParams } from '../../../utils/getAccountHeadersStatic';
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

export async function fetchPublishedPages({ page_type = '', q = '', city = '', county = '', limit = 50, offset = 0 } = {}) {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    if (page_type) params.set('page_type', String(page_type));
    if (q) params.set('q', String(q));
    if (city) params.set('city', String(city));
    if (county) params.set('county', String(county));

    const res = await secureFetch(apiUrl(`/api/pages?${params.toString()}`), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);
    if (!res.ok) {
        throw new Error(data?.message || `Request failed (${res.status}).`);
    }
    return data; // { items, total, limit, offset }
}

export async function fetchPublishedPageBySlug(slug) {
    const s = String(slug || '').trim();
    if (!s) throw new Error('Missing slug.');

    const res = await secureFetch(apiUrl(`/api/pages/${encodeURIComponent(s)}`), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    const data = await safeJson(res);
    if (!res.ok) {
        throw new Error(data?.message || `Request failed (${res.status}).`);
    }
    return data; // { page }
}


export async function fetchPublishedPagePosts({ page_type = '', page_id = '', q = '', city = '', county = '', limit = 50, offset = 0 } = {}) {
    // Business Hub uses business-owned feed endpoint so it returns likes/reposts/comments counts + viewer flags.
    const isBusiness = String(page_type || '').toLowerCase() === 'business';

    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    if (q) params.set('q', String(q));
    if (!isBusiness) {
        if (page_type) params.set('page_type', String(page_type));
        if (page_id) params.set('page_id', String(page_id));
        if (city) params.set('city', String(city));
        if (county) params.set('county', String(county));
    } else {
        // Optional: filter posts by business/page id (used when viewing a single business page later)
        if (page_id) params.set('businessId', String(page_id));
    }

    // Attach active account identity as query params so the backend can scope
    // viewerLiked / viewerReposted per account (personal vs business vs artist).
    // This mirrors what businessApi.js fetchBusinessPosts() already does.
    const acctParams = getAccountQueryParams();
    if (acctParams) {
        for (const [k, v] of Object.entries(acctParams)) {
            if (v != null && v !== '' && v !== '0' && v !== 0) {
                params.set(k, String(v));
            }
        }
    }

    const path = isBusiness ? `/api/business/posts?${params.toString()}` : `/api/pages/posts?${params.toString()}`;

    // Attach account identity headers (x-account-type, x-business-id, x-artist-id)
    // as a fallback — the backend's getScope() reads headers when query params are absent.
    const accountHeaders = getAccountHeaders();

    const res = await secureFetch(apiUrl(path), {
        method: 'GET',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            ...accountHeaders,
        },
    });

    const data = await safeJson(res);
    if (!res.ok) {
        throw new Error(data?.message || `Request failed (${res.status}).`);
    }
    return data; // { items, total, limit, offset }
}

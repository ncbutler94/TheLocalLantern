// src/utils/resolveProfile.js
// ─────────────────────────────────────────────────────────────────────────────
// Lightweight profile resolver — replaces the pattern of firing parallel
// requests to /api/business/:slug, /api/music/artists/:handle, and
// /users/public/:handle to figure out what entity type a handle belongs to.
//
// Instead, makes a single call to GET /users/resolve/:handleOrId which
// returns { type: 'user'|'business'|'artist', id, handle/slug } or 404.
//
// This eliminates the noisy (but harmless) 404 console errors that appear
// when a handle doesn't match a business or artist.
//
// Usage:
//   import { resolveProfile } from '../utils/resolveProfile';
//
//   const result = await resolveProfile('natebutlerdf');
//   // → { type: 'user', id: 42, handle: 'natebutlerdf' }
//   // → { type: 'business', id: 7, slug: 'joes-pizza', name: "Joe's Pizza" }
//   // → { type: 'artist', id: 12, handle: 'the-band', name: 'The Band' }
//   // → null  (not found)
//
//   if (result?.type === 'user')    navigate(`/profile/${result.handle}`);
//   if (result?.type === 'business') navigate(`/business/${result.slug}`);
//   if (result?.type === 'artist')  navigate(`/music/artist/${result.handle}`);
// ─────────────────────────────────────────────────────────────────────────────

import { secureFetch } from './secureFetch';

const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

/**
 * Resolve a handle/slug/ID to its entity type with a single backend call.
 *
 * @param {string} handleOrId — the handle, slug, or numeric ID to look up
 * @returns {Promise<{ type: string, id: number, handle?: string, slug?: string, name?: string } | null>}
 */
export async function resolveProfile(handleOrId) {
    const key = String(handleOrId || '').replace(/^@/, '').trim();
    if (!key) return null;

    try {
        const res = await secureFetch(
            `${API_BASE}/users/resolve/${encodeURIComponent(key)}`,
            { method: 'GET', credentials: 'include' }
        );

        if (!res.ok) return null;

        const data = await res.json();
        return data?.type ? data : null;
    } catch {
        return null;
    }
}

export default resolveProfile;

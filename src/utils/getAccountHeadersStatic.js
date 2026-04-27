// src/utils/getAccountHeadersStatic.js
//
// =====================================================================
// STATIC ACCOUNT HEADERS UTILITY (non-React, no hooks)
// =====================================================================
//
// Use this in fetch()-based API files (like businessApi.js, artists.js)
// that can't use React hooks but still need to send account identity.
//
// Reads directly from localStorage — the same source of truth that
// AccountContext.jsx and the axios interceptor use.
//
// USAGE:
//
//   import { getAccountHeaders, getAccountBody } from '../utils/getAccountHeadersStatic';
//
//   // For fetch() calls — spread into headers:
//   const res = await fetch(url, {
//       method: 'POST',
//       credentials: 'include',
//       headers: {
//           'Accept': 'application/json',
//           'Content-Type': 'application/json',
//           ...getAccountHeaders(),
//       },
//       body: JSON.stringify({ ...yourData, ...getAccountBody() }),
//   });
//
//   // Or just headers (the backend extractAccountContext middleware reads them):
//   const res = await fetch(url, {
//       method: 'POST',
//       credentials: 'include',
//       headers: { 'Accept': 'application/json', ...getAccountHeaders() },
//   });
//
// =====================================================================

const ACTIVE_ACCOUNT_KEY = 'll:activeAccount';

/**
 * Read the active account from localStorage.
 * Returns null for personal account.
 */
function readAccount() {
    try {
        const raw = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return (parsed && typeof parsed === 'object' && parsed.id) ? parsed : null;
    } catch {
        return null;
    }
}

/**
 * Resolve the account type and numeric IDs from the stored account object.
 */
function resolveAccount() {
    const acct = readAccount();
    if (!acct) return { type: 'personal', businessId: null, artistId: null, acct: null };

    const type = (acct.type || acct.account_type || acct.accountType || 'personal').toLowerCase();

    let businessId = null;
    let artistId = null;

    if (type === 'business') {
        const raw = acct.id ?? acct.account_id ?? null;
        const num = Number(raw);
        businessId = (Number.isFinite(num) && num > 0) ? num : null;
    }

    if (type === 'artist') {
        const rawId = acct.artistId ?? acct.artist_id ?? null;
        if (rawId != null) {
            const num = Number(rawId);
            artistId = (Number.isFinite(num) && num > 0) ? num : null;
        } else {
            const idStr = String(acct.id || '');
            if (idStr.startsWith('artist:')) {
                const num = Number(idStr.replace('artist:', ''));
                artistId = (Number.isFinite(num) && num > 0) ? num : null;
            } else {
                // Fallback: acct.id IS the artist ID (e.g. { id: 5, type: 'artist' })
                const num = Number(acct.id);
                artistId = (Number.isFinite(num) && num > 0) ? num : null;
            }
        }
    }

    return { type, businessId, artistId, acct };
}

/**
 * Returns HTTP headers that identify the active account.
 * Spread into your fetch() headers object.
 *
 * Always includes x-account-type.
 * Business adds x-business-id.
 * Artist adds x-artist-id.
 *
 * @returns {Record<string, string>}
 */
export function getAccountHeaders() {
    const { type, businessId, artistId } = resolveAccount();

    if (type === 'business' && businessId) {
        return {
            'x-account-type': 'business',
            'x-business-id': String(businessId),
        };
    }

    if (type === 'artist' && artistId) {
        return {
            'x-account-type': 'artist',
            'x-artist-id': String(artistId),
        };
    }

    return { 'x-account-type': 'personal' };
}

/**
 * Returns a body payload object with account identity fields.
 * Spread into your JSON.stringify() body.
 *
 * Personal → {}
 * Business → { business_id: N, account_type: 'business' }
 * Artist → { artist_id: N, account_type: 'artist' }
 *
 * @returns {Record<string, any>}
 */
export function getAccountBody() {
    const { type, businessId, artistId } = resolveAccount();

    if (type === 'business' && businessId) {
        return { business_id: businessId, account_type: 'business' };
    }

    if (type === 'artist' && artistId) {
        return { artist_id: artistId, account_type: 'artist' };
    }

    return {};
}

/**
 * Returns query string parameters for GET requests.
 * Spread into URLSearchParams or query object.
 *
 * Personal → {}
 * Business → { activeBusinessId: N }
 * Artist → { activeArtistId: N }
 *
 * @returns {Record<string, string>}
 */
export function getAccountQueryParams() {
    const { type, businessId, artistId } = resolveAccount();

    if (type === 'business' && businessId) {
        return { activeBusinessId: String(businessId) };
    }

    if (type === 'artist' && artistId) {
        return { activeArtistId: String(artistId) };
    }

    return {};
}

/**
 * Returns extended payload for comments — includes display info for optimistic UI.
 *
 * @returns {Record<string, any>}
 */
export function getAccountCommentBody() {
    const { type, businessId, artistId, acct } = resolveAccount();
    const base = getAccountBody();

    if (type === 'business' && businessId && acct) {
        return {
            ...base,
            account_id: businessId,
            account_handle: acct.slug || acct.handle || '',
            account_name: acct.name || '',
            account_avatar_url: acct.avatar_url || acct.logo_url || '',
        };
    }

    if (type === 'artist' && artistId && acct) {
        return {
            ...base,
            account_id: artistId,
            account_handle: acct.handle || '',
            account_name: acct.name || '',
            account_avatar_url: acct.avatar_url || '',
        };
    }

    return base;
}

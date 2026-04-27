// src/utils/accountInterceptor.js
//
// =====================================================================
// AUTOMATIC ACCOUNT IDENTITY HEADERS — axios interceptor
// =====================================================================
//
// This interceptor reads the active account from localStorage on EVERY
// outgoing axios request and attaches three headers:
//
//   x-account-type : 'personal' | 'business' | 'artist'
//   x-business-id  : (only when account type is 'business')
//   x-artist-id    : (only when account type is 'artist')
//
// WHY HEADERS?
//   • Query params only work for GET requests.
//   • Body fields can be forgotten by individual components.
//   • Headers go on EVERY request method (GET, POST, PATCH, DELETE)
//     and can never be "forgotten" once the interceptor is installed.
//
// The backend middleware (extractAccountContext.js) reads these headers
// with cascading fallback: headers → body → query params.
//
// INSTALLATION (do this ONCE, e.g. in App.jsx or index.js):
//
//   import { installAccountInterceptor } from './utils/accountInterceptor';
//   installAccountInterceptor();
//
// You can also call removeAccountInterceptor() on unmount if needed.
//
// This is a SAFETY NET. Components should still pass account fields
// explicitly via getAccountPayload() / getAccountParams() where possible,
// but even if they forget, the interceptor ensures the backend always
// knows which account is active.
// =====================================================================

import axios from 'axios';

const ACTIVE_ACCOUNT_KEY = 'll:activeAccount';

let interceptorId = null;

/**
 * Reads the active account from localStorage (fast, synchronous).
 * Returns { accountType, businessId, artistId }.
 */
function readAccountIdentity() {
    try {
        const raw = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
        if (!raw) return { accountType: 'personal', businessId: null, artistId: null };

        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || !parsed.id) {
            return { accountType: 'personal', businessId: null, artistId: null };
        }

        const acctType = (
            parsed.type ||
            parsed.account_type ||
            parsed.accountType ||
            'personal'
        ).toLowerCase();

        if (acctType === 'business') {
            const num = Number(parsed.id ?? parsed.account_id);
            const businessId = Number.isFinite(num) && num > 0 ? num : null;
            return { accountType: 'business', businessId, artistId: null };
        }

        if (acctType === 'artist') {
            let artistId = null;
            const rawId = parsed.artistId ?? parsed.artist_id ?? null;
            if (rawId != null) {
                artistId = Number(rawId) || null;
            } else {
                const idStr = String(parsed.id || '');
                if (idStr.startsWith('artist:')) {
                    const num = Number(idStr.replace('artist:', ''));
                    artistId = Number.isFinite(num) && num > 0 ? num : null;
                } else {
                    // Fallback: parsed.id IS the artist ID (e.g. { id: 5, type: 'artist' })
                    const num = Number(parsed.id);
                    artistId = Number.isFinite(num) && num > 0 ? num : null;
                }
            }
            return { accountType: 'artist', businessId: null, artistId };
        }

        return { accountType: 'personal', businessId: null, artistId: null };
    } catch {
        return { accountType: 'personal', businessId: null, artistId: null };
    }
}

/**
 * Install the axios request interceptor.
 * Call this once at app startup.
 */
export function installAccountInterceptor() {
    // Avoid double-install
    if (interceptorId !== null) return;

    interceptorId = axios.interceptors.request.use(
        (config) => {
            // Allow individual requests to opt out by setting config.skipAccountHeaders = true
            if (config.skipAccountHeaders) return config;

            const { accountType, businessId, artistId } = readAccountIdentity();

            // Only set headers if not already explicitly set by the caller
            if (!config.headers) {
                config.headers = {};
            }

            if (!config.headers['x-account-type']) {
                config.headers['x-account-type'] = accountType;
            }

            if (accountType === 'business' && businessId && !config.headers['x-business-id']) {
                config.headers['x-business-id'] = String(businessId);
            }

            if (accountType === 'artist' && artistId && !config.headers['x-artist-id']) {
                config.headers['x-artist-id'] = String(artistId);
            }

            return config;
        },
        (error) => Promise.reject(error)
    );
}

/**
 * Remove the interceptor (useful for tests or cleanup).
 */
export function removeAccountInterceptor() {
    if (interceptorId !== null) {
        axios.interceptors.request.eject(interceptorId);
        interceptorId = null;
    }
}

export default installAccountInterceptor;

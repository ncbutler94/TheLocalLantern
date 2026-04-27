// src/pages/services/api/serviceFavoritesApi.js

import { secureFetch } from '../../../utils/secureFetch';

/**
 * Read the active account from localStorage and return headers that
 * identify it — same pattern as servicesApi.js and marketplace API.
 */
function getAccountHeaders() {
    try {
        const raw = localStorage.getItem("ll:activeAccount");
        if (!raw) return { "x-account-type": "personal" };
        const acct = JSON.parse(raw);
        if (!acct || typeof acct !== "object" || !acct.id) return { "x-account-type": "personal" };

        const type = String(acct.type || acct.account_type || acct.accountType || "personal").toLowerCase();

        if (type === "business") {
            const bizId = Number(acct.id);
            if (Number.isFinite(bizId) && bizId > 0) {
                return { "x-account-type": "business", "x-business-id": String(bizId) };
            }
        }

        if (type === "artist") {
            const artRawId = acct.artistId ?? acct.artist_id ?? null;
            let artId = null;
            if (artRawId != null) {
                artId = Number(artRawId) || null;
            } else {
                const idStr = String(acct.id || "");
                if (idStr.startsWith("artist:")) {
                    const num = Number(idStr.replace("artist:", ""));
                    artId = Number.isFinite(num) && num > 0 ? num : null;
                } else {
                    const num = Number(acct.id);
                    artId = Number.isFinite(num) && num > 0 ? num : null;
                }
            }
            if (artId) {
                return { "x-account-type": "artist", "x-artist-id": String(artId) };
            }
        }

        return { "x-account-type": "personal" };
    } catch {
        return { "x-account-type": "personal" };
    }
}

/**
 * Build account headers from an explicit activeAccount object.
 * Falls back to localStorage when no object is provided (backward compat).
 *
 * @param {{ type?: string, id?: string|number, artistId?: string|number, artist_id?: string|number }} [activeAccount]
 */
function buildAccountHeaders(activeAccount) {
    if (!activeAccount || typeof activeAccount !== "object" || !activeAccount.id) {
        return getAccountHeaders(); // fall back to localStorage
    }

    const type = String(
        activeAccount.type || activeAccount.account_type || activeAccount.accountType || "personal"
    ).toLowerCase();

    if (type === "business") {
        const bizId = Number(activeAccount.id);
        if (Number.isFinite(bizId) && bizId > 0) {
            return { "x-account-type": "business", "x-business-id": String(bizId) };
        }
    }

    if (type === "artist") {
        const artRawId = activeAccount.artistId ?? activeAccount.artist_id ?? null;
        let artId = null;
        if (artRawId != null) {
            artId = Number(artRawId) || null;
        } else {
            const idStr = String(activeAccount.id || "");
            if (idStr.startsWith("artist:")) {
                const num = Number(idStr.replace("artist:", ""));
                artId = Number.isFinite(num) && num > 0 ? num : null;
            } else {
                const num = Number(activeAccount.id);
                artId = Number.isFinite(num) && num > 0 ? num : null;
            }
        }
        if (artId) {
            return { "x-account-type": "artist", "x-artist-id": String(artId) };
        }
    }

    return { "x-account-type": "personal" };
}

/**
 * Toggle favorite on a service.
 * POST /api/services/:id/favorite
 * Returns { favorited: boolean, favoritesCount: number }
 *
 * @param {string|number} serviceId
 * @param {{ type?: string, id?: string|number, artistId?: string|number }} [activeAccount]
 *   Optional — when provided, headers are derived from this object
 *   instead of reading localStorage (which may be stale mid-render).
 */
export async function toggleServiceFavorite(serviceId, activeAccount) {
    const acctHeaders = buildAccountHeaders(activeAccount);
    const res = await secureFetch(`/api/services/${serviceId}/favorite`, {
        method: "POST",
        credentials: "include",
        headers: { ...acctHeaders },
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to toggle favorite");
    }
    return res.json();
}

/**
 * Get saved/favorited services for the active account.
 * GET /api/services/favorites
 * Returns { items: [...], total: number }
 *
 * @param {{ signal?: AbortSignal, activeAccount?: object }} [opts]
 */
export async function fetchSavedServices({ signal, activeAccount } = {}) {
    const acctHeaders = buildAccountHeaders(activeAccount);
    const res = await secureFetch("/api/services/favorites", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json", ...acctHeaders },
        signal,
    });
    if (!res.ok) {
        if (res.status === 401) return { items: [], total: 0 };
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to load saved services");
    }
    const data = await res.json();
    return {
        items: Array.isArray(data?.items) ? data.items : [],
        total: data?.total ?? 0,
    };
}

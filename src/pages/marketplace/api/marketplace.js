// src/pages/marketplace/api/marketplace.js
// Marketplace API helper — full endpoint coverage
// Uses secureFetch with credentials (cookie-based auth)

import { secureFetch } from "../../../utils/secureFetch";

function buildQuery(params) {
    const qs = new URLSearchParams();

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (typeof value === "string" && value.trim() === "") return;

        if (Array.isArray(value)) {
            value.forEach((v) => {
                if (v === undefined || v === null) return;
                qs.append(key, String(v));
            });
            return;
        }

        qs.set(key, String(value));
    });

    const str = qs.toString();
    return str ? `?${str}` : "";
}

/**
 * Read the active account from localStorage and return headers that
 * identify it.  This mirrors the axios interceptor (accountInterceptor.js)
 * so that the backend's extractAccountContext middleware always sees the
 * active account, even though marketplace uses secureFetch() instead of axios.
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
                    // Fallback: acct.id IS the artist ID (e.g. { id: 5, type: 'artist' })
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

async function apiFetch(url, options) {
    const acctHeaders = getAccountHeaders();
    const res = await secureFetch(url, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...acctHeaders,
            ...(options?.headers || {}),
        },
        ...options,
    });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

    if (!res.ok) {
        const message =
            (body && typeof body === "object" && body.error) ||
            (body && typeof body === "object" && body.message) ||
            (typeof body === "string" && body) ||
            `Request failed (${res.status})`;

        const err = new Error(message);
        err.status = res.status;
        err.body = body;
        throw err;
    }

    return body;
}

// ─── Feed ─────────────────────────────────────────────────────────────

export async function getListings(params = {}, options = {}) {
    const query = buildQuery({
        q: params.query,
        sort: params.sort,
        category: params.category && params.category !== "All" ? params.category : undefined,
        condition: params.condition && params.condition !== "All" ? params.condition : undefined,
        priceMin: Number.isFinite(Number(params.priceMin)) && Number(params.priceMin) > 0 ? Number(params.priceMin) : undefined,
        priceMax: Number.isFinite(Number(params.priceMax)) && Number(params.priceMax) < 10000 ? Number(params.priceMax) : undefined,
        city: params.city,
        county: (Array.isArray(params.counties) && params.counties.length > 1) ? undefined : params.county,
        counties: (Array.isArray(params.counties) && params.counties.length > 1) ? params.counties.join(",") : undefined,
        includeStatewide: params.includeStatewide,
        status: params.status,
        priceModel: params.priceModel || undefined,
        onlyMine: params.onlyMine ? "1" : undefined,
        view: params.view && params.view !== "all" ? params.view : undefined,
        cursor: params.cursor,
        limit: params.limit,
        activeBusinessId: params.activeBusinessId || undefined,
        activeArtistId: params.activeArtistId || undefined,
        excludeCategory: params.excludeCategory || undefined,
    });

    return apiFetch(`/api/marketplace/listings${query}`, {
        method: "GET",
        signal: options.signal,
    });
}

// ─── Category counts ──────────────────────────────────────────────────

export async function getCategoryCounts(params = {}, options = {}) {
    const query = buildQuery({
        q: params.q,
        status: params.status,
        condition: params.condition && params.condition !== "All" ? params.condition : undefined,
        city: params.city,
        county: params.county,
        includeStatewide: params.includeStatewide,
        excludeCategory: params.excludeCategory || undefined,
    });

    return apiFetch(`/api/marketplace/listings/category-counts${query}`, {
        method: "GET",
        signal: options.signal,
    });
}

// ─── Location counts ─────────────────────────────────────────────────

export async function getLocationCounts(params = {}, options = {}) {
    const query = buildQuery({
        q: params.q,
        status: params.status,
        condition: params.condition && params.condition !== "All" ? params.condition : undefined,
        county: params.county,
        city: params.city,
        category: params.category,
    });

    return apiFetch(`/api/marketplace/listings/location-counts${query}`, {
        method: "GET",
        signal: options.signal,
    });
}

// ─── Detail ───────────────────────────────────────────────────────────

export async function getListingById(listingId, { activeBusinessId, activeArtistId } = {}, options = {}) {
    if (!listingId) throw new Error("listingId is required");
    const query = buildQuery({
        activeBusinessId: activeBusinessId || undefined,
        activeArtistId: activeArtistId || undefined,
    });
    return apiFetch(`/api/marketplace/listings/${encodeURIComponent(String(listingId))}${query}`, {
        method: "GET",
        signal: options.signal,
    });
}

// ─── Create ───────────────────────────────────────────────────────────

export async function createListing(formData, options = {}) {
    // formData should be a FormData instance (multipart with photo files)
    const acctHeaders = getAccountHeaders();
    const res = await secureFetch("/api/marketplace/listings", {
        method: "POST",
        credentials: "include",
        headers: { ...acctHeaders },
        body: formData,
        signal: options.signal,
    });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

    if (!res.ok) {
        const message =
            (body && typeof body === "object" && body.error) ||
            (body && typeof body === "object" && body.message) ||
            (typeof body === "string" && body) ||
            `Request failed (${res.status})`;
        const err = new Error(message);
        err.status = res.status;
        err.body = body;
        throw err;
    }

    return body;
}

// ─── Update ───────────────────────────────────────────────────────────

export async function updateListing(listingId, formData, options = {}) {
    if (!listingId) throw new Error("listingId is required");
    // formData should be a FormData instance (multipart with photo files + photo_order)
    const acctHeaders = getAccountHeaders();
    const res = await secureFetch(`/api/marketplace/listings/${encodeURIComponent(String(listingId))}`, {
        method: "PUT",
        credentials: "include",
        headers: { ...acctHeaders },
        body: formData,
        signal: options.signal,
    });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

    if (!res.ok) {
        const message =
            (body && typeof body === "object" && body.error) ||
            (body && typeof body === "object" && body.message) ||
            (typeof body === "string" && body) ||
            `Request failed (${res.status})`;
        const err = new Error(message);
        err.status = res.status;
        err.body = body;
        throw err;
    }

    return body;
}

// ─── Mark sold ────────────────────────────────────────────────────────

export async function markListingSold(listingId, { businessId, artistId } = {}, options = {}) {
    if (!listingId) throw new Error("listingId is required");
    const body = {};
    if (businessId) {
        body.business_id = businessId;
        body.account_type = "business";
    } else if (artistId) {
        body.artist_id = artistId;
        body.account_type = "artist";
    }
    return apiFetch(`/api/marketplace/listings/${encodeURIComponent(String(listingId))}/mark-sold`, {
        method: "POST",
        body: JSON.stringify(body),
        signal: options.signal,
    });
}

// ─── Relist ───────────────────────────────────────────────────────────

export async function relistListing(listingId, options = {}) {
    if (!listingId) throw new Error("listingId is required");
    return apiFetch(`/api/marketplace/listings/${encodeURIComponent(String(listingId))}/relist`, {
        method: "POST",
        signal: options.signal,
    });
}

// ─── Delete ───────────────────────────────────────────────────────────

export async function deleteListing(listingId, options = {}) {
    if (!listingId) throw new Error("listingId is required");
    return apiFetch(`/api/marketplace/listings/${encodeURIComponent(String(listingId))}`, {
        method: "DELETE",
        signal: options.signal,
    });
}

// ─── Favorites ────────────────────────────────────────────────────────

export async function toggleFavorite(listingId, { businessId, artistId } = {}, options = {}) {
    if (!listingId) throw new Error("listingId is required");
    const body = {};
    if (businessId) {
        body.business_id = businessId;
        body.account_type = "business";
    } else if (artistId) {
        body.artist_id = artistId;
        body.account_type = "artist";
    }
    return apiFetch(`/api/marketplace/listings/${encodeURIComponent(String(listingId))}/favorite`, {
        method: "POST",
        body: JSON.stringify(body),
        signal: options.signal,
    });
}

export async function getFavorites({ businessId, artistId } = {}, options = {}) {
    const query = buildQuery({
        activeBusinessId: businessId || undefined,
        activeArtistId: artistId || undefined,
    });
    return apiFetch(`/api/marketplace/favorites${query}`, {
        method: "GET",
        signal: options.signal,
    });
}

// ─── Reposts ──────────────────────────────────────────────────────────

export async function toggleRepost(listingId, { businessId, artistId } = {}, options = {}) {
    if (!listingId) throw new Error("listingId is required");
    const body = {};
    if (businessId) {
        body.business_id = businessId;
        body.account_type = "business";
    } else if (artistId) {
        body.artist_id = artistId;
        body.account_type = "artist";
    }
    return apiFetch(`/api/marketplace/listings/${encodeURIComponent(String(listingId))}/repost`, {
        method: "POST",
        body: JSON.stringify(body),
        signal: options.signal,
    });
}

// ─── Flags / Reports ─────────────────────────────────────────────────

/**
 * Flag / report a listing.
 *
 * @param {number|string} listingId
 * @param {{ reason: string, details?: string }} payload
 * @param {object} [options]
 * @returns {Promise<object>}
 */
export async function flagListing(listingId, payload = {}, options = {}) {
    if (!listingId) throw new Error("listingId is required");
    return apiFetch(
        `/api/marketplace/listings/${encodeURIComponent(String(listingId))}/flag`,
        {
            method: "POST",
            body: JSON.stringify({
                reason: payload.reason || "other",
                details: payload.details || "",
            }),
            signal: options.signal,
        }
    );
}

// ─── Views ────────────────────────────────────────────────────────────

export async function recordView(listingId) {
    if (!listingId) return;
    return apiFetch(`/api/marketplace/listings/${encodeURIComponent(String(listingId))}/view`, {
        method: "POST",
    }).catch(() => {
        // Silent fail for view tracking
    });
}

// ─── Messages ─────────────────────────────────────────────────────────

export async function sendMessage(listingId, body, options = {}) {
    if (!listingId) throw new Error("listingId is required");
    return apiFetch(`/api/marketplace/listings/${encodeURIComponent(String(listingId))}/message`, {
        method: "POST",
        body: JSON.stringify({ body }),
        signal: options.signal,
    });
}

export async function getMessages(listingId, options = {}) {
    if (!listingId) throw new Error("listingId is required");
    return apiFetch(`/api/marketplace/listings/${encodeURIComponent(String(listingId))}/messages`, {
        method: "GET",
        signal: options.signal,
    });
}

// ─── Seller Reviews ──────────────────────────────────────────────────

export async function getSellerReviews(sellerId, params = {}, options = {}) {
    if (!sellerId) throw new Error("sellerId is required");
    const query = buildQuery({
        limit: params.limit,
        offset: params.offset,
    });
    return apiFetch(`/api/marketplace/sellers/${encodeURIComponent(String(sellerId))}/reviews${query}`, {
        method: "GET",
        signal: options.signal,
    });
}

export async function submitSellerReview(sellerId, payload, options = {}) {
    if (!sellerId) throw new Error("sellerId is required");
    return apiFetch(`/api/marketplace/sellers/${encodeURIComponent(String(sellerId))}/reviews`, {
        method: "POST",
        body: JSON.stringify({
            ...(payload || {}),
            photos: Array.isArray(payload?.photos) ? payload.photos : [],
        }),
        signal: options.signal,
    });
}

export async function deleteReview(reviewId, options = {}) {
    if (!reviewId) throw new Error("reviewId is required");
    return apiFetch(`/api/marketplace/reviews/${encodeURIComponent(String(reviewId))}`, {
        method: "DELETE",
        signal: options.signal,
    });
}

export async function replyToSellerReview(sellerId, reviewId, body, photos = [], options = {}) {
    if (!sellerId) throw new Error("sellerId is required");
    if (!reviewId) throw new Error("reviewId is required");
    if (!body) throw new Error("Reply body is required");
    return apiFetch(`/api/marketplace/sellers/${encodeURIComponent(String(sellerId))}/reviews/${encodeURIComponent(String(reviewId))}/reply`, {
        method: "POST",
        body: JSON.stringify({ body, photos }),
        signal: options.signal,
    });
}

export async function deleteSellerReviewReply(sellerId, reviewId, options = {}) {
    if (!sellerId) throw new Error("sellerId is required");
    if (!reviewId) throw new Error("reviewId is required");
    return apiFetch(`/api/marketplace/sellers/${encodeURIComponent(String(sellerId))}/reviews/${encodeURIComponent(String(reviewId))}/reply`, {
        method: "DELETE",
        signal: options.signal,
    });
}

// ─── Review Reports ─────────────────────────────────────────────────

export async function reportReview(reviewId, payload = {}, options = {}) {
    if (!reviewId) throw new Error("reviewId is required");
    return apiFetch(`/api/marketplace/reviews/${encodeURIComponent(String(reviewId))}/report`, {
        method: "POST",
        body: JSON.stringify({
            reason: payload.reason || "other",
            details: payload.details || "",
        }),
        signal: options.signal,
    });
}

// src/pages/services/api/servicesApi.js

import { secureFetch } from '../../../utils/secureFetch';

async function parseJsonSafe(res) {
    const text = await res.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function throwOnError(res, data, fallbackMsg) {
    if (!res.ok) {
        const message =
            (data && typeof data === "object" && (data.message || data.error)) || fallbackMsg;
        const err = new Error(message);
        err.status = res.status;
        err.data = data;
        throw err;
    }
}

/**
 * Read the active account from localStorage and return headers that
 * identify it.  This mirrors the axios interceptor (accountInterceptor.js)
 * so that the backend's extractAccountContext middleware always sees the
 * active account, even on raw fetch() calls.
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
 * Wrapper around fetch() that automatically injects account-context headers.
 * Accepts the same arguments as window.fetch().
 */
function svcFetch(url, options = {}) {
    const acctHeaders = getAccountHeaders();
    return secureFetch(url, {
        ...options,
        headers: {
            ...acctHeaders,
            ...(options.headers || {}),
        },
    });
}

// ════════════════════════════════════════════════════════════
//  FEED + CATEGORIES + MY LISTINGS
// ════════════════════════════════════════════════════════════

function normalizeServiceFeedSort(sort) {
    const raw = String(sort || "").trim().toLowerCase();

    if (!raw || raw === "any" || raw === "random" || raw === "shuffle") {
        return "any";
    }

    if (raw === "a-z" || raw === "az" || raw === "title_asc") {
        return "a-z";
    }

    if (raw === "z-a" || raw === "za" || raw === "title_desc") {
        return "z-a";
    }

    if (raw === "highest-rated" || raw === "highest_rated" || raw === "top_rated") {
        return "highest-rated";
    }

    if (raw === "most-reviewed" || raw === "most_reviewed" || raw === "top_reviewed") {
        return "most-reviewed";
    }

    return "any";
}

export async function fetchServicesFeed({ search, sort, filters, limit, cursor, signal } = {}) {
    const params = new URLSearchParams();

    const q = String(search || "").trim();
    const normalizedSort = normalizeServiceFeedSort(sort);
    if (q) params.set("q", q);
    if (normalizedSort) params.set("sort", normalizedSort);
    if (limit) params.set("limit", String(limit));
    if (cursor) params.set("cursor", cursor);

    const f = filters && typeof filters === "object" ? filters : {};
    if (f.category && f.category !== "All") params.set("category", f.category);
    if (f.priceModel && f.priceModel !== "any") params.set("priceModel", f.priceModel);
    if (f.city) params.set("city", f.city);
    const countiesArr = Array.isArray(f.counties) ? f.counties.filter(Boolean) : [];
    if (countiesArr.length > 1) {
        params.set("counties", countiesArr.join(","));
    } else if (f.county) {
        params.set("county", f.county);
    }
    if (f.statewideOnly) params.set("statewideOnly", "1");
    if (f.onlyMine || f.view === "mine") params.set("onlyMine", "1");
    if (f.view && f.view !== "mine") params.set("view", f.view);

    const url = `/api/services/feed?${params.toString()}`;
    const res = await svcFetch(url, {
        credentials: "include",
        headers: { Accept: "application/json" },
        signal,
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to load services feed.");

    return {
        items: Array.isArray(data?.items) ? data.items : [],
        nextCursor: data?.nextCursor ?? null,
        hasMore: Boolean(data?.hasMore),
        total: data?.total ?? 0,
    };
}

export async function fetchMyServices({ status, search, filters, signal } = {}) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);

    const q = String(search || "").trim();
    if (q) params.set("q", q);

    const f = filters && typeof filters === "object" ? filters : {};
    if (f.category && f.category !== "All") params.set("category", f.category);
    if (f.priceModel && f.priceModel !== "any") params.set("priceModel", f.priceModel);

    const qs = params.toString();
    const url = `/api/services/my${qs ? `?${qs}` : ""}`;

    const res = await svcFetch(url, {
        credentials: "include",
        headers: { Accept: "application/json" },
        signal,
    });
    const data = await parseJsonSafe(res);

    if (res.status === 401) return [];
    throwOnError(res, data, "Failed to load your services.");

    return {
        items: Array.isArray(data?.items) ? data.items : [],
        total: data?.total ?? 0,
    };
}

export async function fetchServiceCategories({ search, filters } = {}) {
    const params = new URLSearchParams();
    const q = String(search || "").trim();
    if (q) params.set("q", q);

    const f = filters && typeof filters === "object" ? filters : {};
    if (f.priceModel && f.priceModel !== "any") params.set("priceModel", f.priceModel);
    if (f.city) params.set("city", f.city);
    const countiesArr = Array.isArray(f.counties) ? f.counties.filter(Boolean) : [];
    if (countiesArr.length > 1) {
        params.set("counties", countiesArr.join(","));
    } else if (f.county) {
        params.set("county", f.county);
    }
    if (f.statewideOnly) params.set("statewideOnly", "1");

    const url = `/api/services/categories?${params.toString()}`;
    const res = await svcFetch(url, {
        credentials: "include",
        headers: { Accept: "application/json" },
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to load service categories.");

    return Array.isArray(data?.categories) ? data.categories : [];
}

// ════════════════════════════════════════════════════════════
//  CATEGORY COUNTS  (mirrors marketplace getCategoryCounts)
// ════════════════════════════════════════════════════════════

/**
 * Fetch per-category counts for the services feed (filter-aware).
 * Passes: q, city, county, priceModel, statewideOnly
 * (Excludes category so counts stay visible while browsing.)
 */
export async function fetchServiceCategoryCounts({ q, city, county, priceModel, statewideOnly } = {}, { signal } = {}) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (city) params.set("city", city);
    if (county) params.set("county", county);
    if (priceModel && priceModel !== "any") params.set("priceModel", priceModel);
    if (statewideOnly) params.set("statewideOnly", "1");

    const url = `/api/services/category-counts?${params.toString()}`;
    const res = await svcFetch(url, {
        credentials: "include",
        headers: { Accept: "application/json" },
        signal,
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to load category counts.");

    return {
        counts: data?.counts && typeof data.counts === "object" ? data.counts : {},
    };
}

// ════════════════════════════════════════════════════════════
//  LOCATION COUNTS  (fully filter-aware)
// ════════════════════════════════════════════════════════════

/**
 * Fetch per-county and per-city listing counts for the services feed.
 * Passes: q, category, county, priceModel, statewideOnly
 */
export async function fetchServiceLocationCounts({ q, category, county, city, priceModel, statewideOnly, sort, view } = {}, { signal } = {}) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (county) params.set("county", county);
    if (city) params.set("city", city);
    if (priceModel && priceModel !== "any") params.set("priceModel", priceModel);
    if (statewideOnly) params.set("statewideOnly", "1");
    if (sort && sort !== "any") params.set("sort", sort);
    if (view && view !== "all") params.set("view", view);

    const url = `/api/services/location-counts?${params.toString()}`;
    const res = await svcFetch(url, {
        credentials: "include",
        headers: { Accept: "application/json" },
        signal,
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to load location counts.");

    return {
        counties: data?.counties && typeof data.counties === "object" ? data.counties : {},
        cities: data?.cities && typeof data.cities === "object" ? data.cities : {},
    };
}

/**
 * Fetch per-county and per-city counts for service requests (fully filter-aware).
 * Passes: q, category, county, urgency, budgetType, status
 */
export async function fetchServiceRequestLocationCounts({ q, category, county, city, urgency, budgetType, status, sort, view } = {}, { signal } = {}) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (county) params.set("county", county);
    if (city) params.set("city", city);
    if (urgency) params.set("urgency", urgency);
    if (budgetType) params.set("budgetType", budgetType);
    if (status) params.set("status", status);
    if (sort && sort !== "any") params.set("sort", sort);
    if (view && view !== "all") params.set("view", view);

    const url = `/api/services/requests/location-counts?${params.toString()}`;
    const res = await svcFetch(url, {
        credentials: "include",
        headers: { Accept: "application/json" },
        signal,
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to load request location counts.");

    return {
        counties: data?.counties && typeof data.counties === "object" ? data.counties : {},
        cities: data?.cities && typeof data.cities === "object" ? data.cities : {},
    };
}

export async function fetchServiceById(id, { signal } = {}) {
    const res = await svcFetch(`/api/services/${id}`, {
        credentials: "include",
        headers: { Accept: "application/json" },
        signal,
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to load service.");
    return data;
}

// ════════════════════════════════════════════════════════════
//  CREATE / UPDATE / DELETE
// ════════════════════════════════════════════════════════════

export async function createService(body) {
    const res = await svcFetch("/api/services", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to create service listing.");
    return data?.service || data;
}

export async function updateService(id, body) {
    const res = await svcFetch(`/api/services/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to update service listing.");
    return data?.service || data;
}

export async function deleteService(id) {
    const res = await svcFetch(`/api/services/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" },
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to delete service listing.");
    return data;
}

// ════════════════════════════════════════════════════════════
//  SERVICE STATUS (active / paused / archived)
// ════════════════════════════════════════════════════════════

export async function updateServiceStatus(id, status) {
    const res = await svcFetch(`/api/services/${id}/status`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ status }),
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to update service status.");
    return data?.service || data;
}

// ════════════════════════════════════════════════════════════
//  SERVICE SETTINGS (per-listing toggles)
// ════════════════════════════════════════════════════════════

export async function fetchServiceSettings(id) {
    const res = await svcFetch(`/api/services/${id}/settings`, {
        credentials: "include",
        headers: { Accept: "application/json" },
    });
    const data = await parseJsonSafe(res);
    if (!res.ok) return { settings: {} };
    return data;
}

export async function updateServiceSettings(id, settings) {
    const res = await svcFetch(`/api/services/${id}/settings`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ settings }),
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to save settings.");
    return data;
}

// ════════════════════════════════════════════════════════════
//  SERVICE STATS (admin dashboard)
// ════════════════════════════════════════════════════════════

export async function fetchServiceStats(id) {
    const res = await svcFetch(`/api/services/${id}/stats`, {
        credentials: "include",
        headers: { Accept: "application/json" },
    });
    const data = await parseJsonSafe(res);
    if (!res.ok) return { reviewCount: 0, reviewAvg: null, quoteRequestCount: 0, viewCount: 0 };
    return data;
}

// ════════════════════════════════════════════════════════════
//  LISTING LIMITS
// ════════════════════════════════════════════════════════════

export async function fetchServiceLimits({ providerType = "user", providerId } = {}) {
    const params = new URLSearchParams();
    params.set("providerType", providerType);
    if (providerId) params.set("providerId", String(providerId));

    const res = await svcFetch(`/api/services/limits?${params.toString()}`, {
        credentials: "include",
        headers: { Accept: "application/json" },
    });
    const data = await parseJsonSafe(res);
    if (!res.ok) return { canCreate: true, remaining: 99, maxAllowed: 3, activeCount: 0 };
    return data;
}

// ════════════════════════════════════════════════════════════
//  REVIEWS
// ════════════════════════════════════════════════════════════

export async function fetchServiceReviews(listingId, { sort = "newest", limit, offset, signal } = {}) {
    const params = new URLSearchParams();
    if (sort) params.set("sort", sort);
    if (limit) params.set("limit", String(limit));
    if (offset) params.set("offset", String(offset));

    const url = `/api/services/${listingId}/reviews?${params.toString()}`;
    const res = await svcFetch(url, {
        credentials: "include",
        headers: { Accept: "application/json" },
        signal,
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to load reviews.");

    return {
        reviews: Array.isArray(data?.reviews) ? data.reviews : [],
        total: data?.total ?? 0,
    };
}

export async function checkReviewEligibility(listingId) {
    const res = await svcFetch(`/api/services/${listingId}/review-eligibility`, {
        credentials: "include",
        headers: { Accept: "application/json" },
    });
    const data = await parseJsonSafe(res);
    if (!res.ok) return { eligible: false, reason: data?.error || "Unable to check eligibility." };
    return data;
}

export async function createServiceReview(listingId, body) {
    const res = await svcFetch(`/api/services/${listingId}/reviews`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to submit review.");
    return data?.review || data;
}

export async function updateServiceReview(listingId, reviewId, body) {
    const res = await svcFetch(`/api/services/${listingId}/reviews/${reviewId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to update review.");
    return data?.review || data;
}

export async function respondToReview(listingId, reviewId, response) {
    const res = await svcFetch(`/api/services/${listingId}/reviews/${reviewId}/respond`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ response }),
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to save response.");
    return data?.review || data;
}

export async function deleteServiceReview(listingId, reviewId) {
    const res = await svcFetch(`/api/services/${listingId}/reviews/${reviewId}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" },
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to delete review.");
    return data;
}

/**
 * Toggle "found helpful" on a service review.
 * POST /api/services/:listingId/reviews/:reviewId/helpful
 * Returns { helpful: boolean, helpfulCount: number }
 */
export async function toggleReviewHelpful(listingId, reviewId) {
    const res = await svcFetch(`/api/services/${listingId}/reviews/${reviewId}/helpful`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to toggle helpful.");
    return data;
}

// ════════════════════════════════════════════════════════════
//  QUOTE REQUESTS
// ════════════════════════════════════════════════════════════

export async function requestQuote(listingId, body) {
    const res = await svcFetch(`/api/services/${listingId}/quote`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to send quote request.");
    return data;
}

/**
 * Fetch quote requests for a listing (provider/owner view).
 */
export async function fetchQuoteRequests(listingId, { status, signal } = {}) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);

    const url = `/api/services/${listingId}/quotes?${params.toString()}`;
    const res = await svcFetch(url, {
        credentials: "include",
        headers: { Accept: "application/json" },
        signal,
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to load quote requests.");
    return {
        quotes: Array.isArray(data?.quotes) ? data.quotes : [],
        total: data?.total ?? 0,
    };
}

/**
 * Update a quote request (accept / decline / respond with message).
 */
export async function updateQuoteRequest(listingId, quoteId, body) {
    const res = await svcFetch(`/api/services/${listingId}/quotes/${quoteId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to update quote request.");
    return data?.quote || data;
}

// ════════════════════════════════════════════════════════════
//  SERVICE REQUESTS (community "looking for" requests)
// ════════════════════════════════════════════════════════════

export async function fetchServiceRequests({ status, category, county, city, limit, offset, signal, mine, q, sort, statewideOnly, urgency, budgetType, view } = {}) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (category && category !== "All") params.set("category", category);
    if (county) params.set("county", county);
    if (city) params.set("city", city);
    if (limit) params.set("limit", String(limit));
    if (offset) params.set("offset", String(offset));
    if (mine) params.set("mine", "1");
    if (q && q.trim()) params.set("q", q.trim());
    if (sort) params.set("sort", sort);
    if (statewideOnly) params.set("statewideOnly", "1");
    if (urgency) params.set("urgency", urgency);
    if (budgetType) params.set("budgetType", budgetType);
    if (view) params.set("view", view);

    const url = `/api/services/requests?${params.toString()}`;
    const res = await svcFetch(url, {
        credentials: "include",
        headers: { Accept: "application/json" },
        signal,
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to load service requests.");

    return {
        items: Array.isArray(data?.items) ? data.items : [],
        total: data?.total ?? 0,
    };
}

export async function createServiceRequest(body, photoFiles) {
    const form = new FormData();
    form.append("title", body.title || "");
    form.append("categorySlug", body.categorySlug || "");
    if (body.description) form.append("description", body.description);
    if (body.county) form.append("county", body.county);
    if (body.city) form.append("city", body.city);
    if (body.locationLabel) form.append("locationLabel", body.locationLabel);
    if (body.latitude != null) form.append("latitude", String(body.latitude));
    if (body.longitude != null) form.append("longitude", String(body.longitude));
    if (body.isStatewide) form.append("isStatewide", "true");
    if (body.urgency) form.append("urgency", body.urgency);
    if (body.budgetType) form.append("budgetType", body.budgetType);
    if (body.budgetMin != null) form.append("budgetMin", String(body.budgetMin));
    if (body.budgetMax != null) form.append("budgetMax", String(body.budgetMax));
    if (body.budgetNotes) form.append("budgetNotes", body.budgetNotes);
    if (body.timelineNotes) form.append("timelineNotes", body.timelineNotes);
    if (body.contactPreference) form.append("contactPreference", body.contactPreference);
    if (body.contactValue) form.append("contactValue", body.contactValue);
    if (body.requesterName) form.append("requesterName", body.requesterName);
    if (body.requesterAvatar) form.append("requesterAvatar", body.requesterAvatar);
    if (body.requesterHandle) form.append("requesterHandle", body.requesterHandle);
    if (body.requesterType) form.append("requesterType", body.requesterType);
    if (body.requesterProfileId) form.append("requesterProfileId", String(body.requesterProfileId));

    // Append actual photo files
    const files = Array.isArray(photoFiles) ? photoFiles : [];
    files.forEach((file) => {
        if (file) form.append("photos", file);
    });

    const res = await svcFetch("/api/services/requests", {
        method: "POST",
        credentials: "include",
        body: form,
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to create service request.");
    return data?.request || data;
}

export async function updateServiceRequest(id, body, photoFiles, existingPhotos) {
    const form = new FormData();
    if (body.title !== undefined) form.append("title", body.title || "");
    if (body.categorySlug !== undefined) form.append("categorySlug", body.categorySlug || "");
    if (body.description !== undefined) form.append("description", body.description || "");
    if (body.county !== undefined) form.append("county", body.county || "");
    if (body.city !== undefined) form.append("city", body.city || "");
    if (body.locationLabel !== undefined) form.append("locationLabel", body.locationLabel || "");
    if (body.latitude != null) form.append("latitude", String(body.latitude));
    if (body.longitude != null) form.append("longitude", String(body.longitude));
    if (body.isStatewide !== undefined) form.append("isStatewide", body.isStatewide ? "true" : "false");
    if (body.urgency !== undefined) form.append("urgency", body.urgency || "");
    if (body.budgetType !== undefined) form.append("budgetType", body.budgetType || "");
    if (body.budgetMin !== undefined) form.append("budgetMin", body.budgetMin != null ? String(body.budgetMin) : "");
    if (body.budgetMax !== undefined) form.append("budgetMax", body.budgetMax != null ? String(body.budgetMax) : "");
    if (body.budgetNotes !== undefined) form.append("budgetNotes", body.budgetNotes || "");
    if (body.timelineNotes !== undefined) form.append("timelineNotes", body.timelineNotes || "");
    if (body.contactPreference !== undefined) form.append("contactPreference", body.contactPreference || "");
    if (body.contactValue !== undefined) form.append("contactValue", body.contactValue || "");
    if (body.requesterName) form.append("requesterName", body.requesterName);
    if (body.requesterAvatar) form.append("requesterAvatar", body.requesterAvatar);
    if (body.requesterHandle) form.append("requesterHandle", body.requesterHandle);
    if (body.requesterType) form.append("requesterType", body.requesterType);
    if (body.requesterProfileId) form.append("requesterProfileId", String(body.requesterProfileId));

    // Existing kept photos (URLs)
    if (Array.isArray(existingPhotos)) {
        form.append("existingPhotos", JSON.stringify(existingPhotos));
    }

    // New photo files
    const files = Array.isArray(photoFiles) ? photoFiles : [];
    files.forEach((file) => {
        if (file) form.append("photos", file);
    });

    const res = await svcFetch(`/api/services/requests/${id}`, {
        method: "PUT",
        credentials: "include",
        body: form,
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to update service request.");
    return data?.request || data;
}

export async function fetchServiceRequestById(id, { signal } = {}) {
    const res = await svcFetch(`/api/services/requests/${id}`, {
        credentials: "include",
        headers: { Accept: "application/json" },
        signal,
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to load service request.");
    return data;
}

export async function deleteServiceRequest(id) {
    const res = await svcFetch(`/api/services/requests/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" },
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to delete service request.");
    return data;
}

// ════════════════════════════════════════════════════════════
//  SERVICE REQUEST RESPONSES
// ════════════════════════════════════════════════════════════

export async function fetchRequestResponses(requestId, { signal } = {}) {
    const res = await svcFetch(`/api/services/requests/${requestId}/responses`, {
        credentials: "include",
        headers: { Accept: "application/json" },
        signal,
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to load responses.");
    return {
        responses: Array.isArray(data?.responses) ? data.responses : [],
        total: data?.total ?? 0,
        isRequester: Boolean(data?.isRequester),
        myResponse: data?.myResponse || null,
    };
}

export async function createRequestResponse(requestId, body, photoFiles) {
    const form = new FormData();
    if (body.message) form.append("message", body.message);
    if (body.quoteType) form.append("quoteType", body.quoteType);
    if (body.quoteMin != null) form.append("quoteMin", String(body.quoteMin));
    if (body.quoteMax != null) form.append("quoteMax", String(body.quoteMax));
    if (body.estimatedTimeline) form.append("estimatedTimeline", body.estimatedTimeline);
    if (body.listingId) form.append("listingId", String(body.listingId));
    if (body.responderName) form.append("responderName", body.responderName);
    if (body.responderAvatar) form.append("responderAvatar", body.responderAvatar);
    if (body.responderHandle) form.append("responderHandle", body.responderHandle);
    if (body.responderType) form.append("responderType", body.responderType);
    if (body.responderProfileId) form.append("responderProfileId", String(body.responderProfileId));
    if (body.responderContactPref) form.append("responderContactPref", body.responderContactPref);
    if (body.responderContactVal) form.append("responderContactVal", body.responderContactVal);

    const files = Array.isArray(photoFiles) ? photoFiles : [];
    files.forEach((file) => {
        if (file) form.append("photos", file);
    });

    const res = await svcFetch(`/api/services/requests/${requestId}/responses`, {
        method: "POST",
        credentials: "include",
        body: form,
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to submit response.");
    return data?.response || data;
}

export async function acceptRequestResponse(requestId, responseId) {
    const res = await svcFetch(`/api/services/requests/${requestId}/responses/${responseId}/accept`, {
        method: "PUT",
        credentials: "include",
        headers: { Accept: "application/json" },
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to accept response.");
    return data?.response || data;
}

export async function declineRequestResponse(requestId, responseId) {
    const res = await svcFetch(`/api/services/requests/${requestId}/responses/${responseId}/decline`, {
        method: "PUT",
        credentials: "include",
        headers: { Accept: "application/json" },
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to decline response.");
    return data?.response || data;
}

export async function withdrawRequestResponse(requestId, responseId) {
    const res = await svcFetch(`/api/services/requests/${requestId}/responses/${responseId}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" },
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to withdraw response.");
    return data;
}

export async function closeServiceRequest(requestId) {
    const res = await svcFetch(`/api/services/requests/${requestId}/close`, {
        method: "PUT",
        credentials: "include",
        headers: { Accept: "application/json" },
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to update request status.");
    return data;
}

// ════════════════════════════════════════════════════════════
//  ADDRESS VALIDATION (geocoding via backend proxy)
// ════════════════════════════════════════════════════════════

export async function validateAddress({ street, city, county, state = "AL" }) {
    const params = new URLSearchParams();
    if (street) params.set("street", street);
    if (city) params.set("city", city);
    if (county) params.set("county", county);
    params.set("state", state);

    const res = await svcFetch(`/api/geocode/validate?${params.toString()}`, {
        credentials: "include",
        headers: { Accept: "application/json" },
    });
    const data = await parseJsonSafe(res);
    if (!res.ok) {
        return { valid: false, error: data?.error || "Address validation failed." };
    }
    return {
        valid: Boolean(data?.valid),
        latitude: data?.latitude ?? null,
        longitude: data?.longitude ?? null,
        formattedAddress: data?.formattedAddress ?? null,
        error: data?.error ?? null,
        remainingChecks: data?.remainingChecks ?? null,
    };
}

/**
 * Report a service listing.
 * @param {number|string} serviceId
 * @param {{ reason: string, details?: string }} payload
 */
export async function reportService(serviceId, { reason, details }) {
    const res = await svcFetch(`/api/services/${serviceId}/report`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || "Failed to submit report.");
    return data;
}

export async function reportServiceRequest(requestId, { reason, details }) {
    const res = await svcFetch(`/api/services/requests/${requestId}/report`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || "Failed to submit report.");
    return data;
}

// ════════════════════════════════════════════════════════════
//  DISMISS QUOTE REQUEST NOTIFICATION
//  Call this when the service owner sends a reply message so
//  the "requested a quote from you" notification is removed.
// ════════════════════════════════════════════════════════════

export async function dismissQuoteNotification(listingId) {
    if (!listingId) return;
    try {
        await svcFetch(`/api/services/${listingId}/quote-dismiss`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        });
    } catch {
        // Non-critical — quote notification cleanup is best-effort
    }
}

/* ─────────────────────────────────────────────────────────────────────────────
   Profile Check — does a user/business/artist have ANY service activity?
   Returns { hasActivity: bool, counts: { listings, requests } }
   ───────────────────────────────────────────────────────────────────────────── */

export async function fetchServiceProfileCheck({ userId, businessId, artistId } = {}) {
    let url;
    if (businessId) {
        url = `/api/services/profile-check/business/${businessId}`;
    } else if (artistId) {
        url = `/api/services/profile-check/artist/${artistId}`;
    } else if (userId) {
        url = `/api/services/profile-check/${userId}`;
    } else {
        throw new Error("userId, businessId, or artistId is required");
    }
    const res = await svcFetch(url, {
        credentials: "include",
        headers: { Accept: "application/json" },
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to check service activity.");
    return data; // { hasActivity, counts }
}

/* ─────────────────────────────────────────────────────────────────────────────
   Fetch service requests by a specific user (for profile pages)
   ───────────────────────────────────────────────────────────────────────────── */

export async function fetchServiceRequestsByUser({ userId, businessId, artistId, signal, ...params } = {}) {
    const query = { ...params };
    if (businessId) query.requesterBusinessId = businessId;
    else if (artistId) query.requesterArtistId = artistId;
    else if (userId) query.requesterUserId = userId;
    else throw new Error("userId, businessId, or artistId is required");

    const qs = new URLSearchParams(
        Object.entries(query).filter(([, v]) => v != null && v !== "")
    ).toString();

    const url = `/api/services/requests${qs ? `?${qs}` : ""}`;
    const res = await svcFetch(url, {
        credentials: "include",
        headers: { Accept: "application/json" },
        ...(signal ? { signal } : {}),
    });
    const data = await parseJsonSafe(res);
    throwOnError(res, data, "Failed to load service requests.");
    return data;
}

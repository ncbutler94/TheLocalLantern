/**
 * eventsApi
 * - Centralized API helpers for Events
 * - CRA proxy expected (e.g. /api/events/*)
 */

import axios from "../../../api/axiosInstance";

const BASE_URL = "/api/events";

/**
 * Read the active account slug from localStorage (same source as AccountContext).
 * Used to scope "mine" queries to the currently active profile.
 */
function getActiveAccount() {
    try {
        const raw = localStorage.getItem('ll:activeAccount');
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function getActiveAccountSlug() {
    const parsed = getActiveAccount();
    return parsed?.slug || parsed?.handle || null;
}

/**
 * Build HTTP headers that tell the backend which account is active.
 * Matches the pattern in AccountContext / businessApi authFetch.
 */
/**
 * Extract a numeric artist ID from the localStorage account object.
 * Handles: { artistId: 5 }, { artist_id: 5 }, { id: "artist:5" }, { id: 5 }
 */
function resolveArtistId(parsed) {
    if (!parsed) return 0;
    // Prefer explicit artistId / artist_id
    for (const key of ['artistId', 'artist_id']) {
        const n = Number(parsed[key]);
        if (Number.isFinite(n) && n > 0) return n;
    }
    // id might be "artist:123" (Header format)
    const idStr = String(parsed.id || '');
    if (idStr.startsWith('artist:')) {
        const n = Number(idStr.replace('artist:', ''));
        if (Number.isFinite(n) && n > 0) return n;
    }
    // Bare numeric id as last resort (only if type is artist)
    const n = Number(parsed.id);
    if (Number.isFinite(n) && n > 0) return n;
    return 0;
}

/**
 * Extract a numeric business ID from the localStorage account object.
 */
function resolveBusinessId(parsed) {
    if (!parsed) return 0;
    for (const key of ['businessId', 'business_id', 'id']) {
        const n = Number(parsed[key]);
        if (Number.isFinite(n) && n > 0) return n;
    }
    return 0;
}

function getActiveAccountHeaders() {
    const parsed = getActiveAccount();
    if (!parsed) return {};

    const type = String(parsed?.type || '').toLowerCase();

    if (type === 'business') {
        const businessId = resolveBusinessId(parsed);
        if (businessId > 0) return { 'x-account-type': 'business', 'x-business-id': String(businessId) };
    }
    if (type === 'artist') {
        const artistId = resolveArtistId(parsed);
        if (artistId > 0) return { 'x-account-type': 'artist', 'x-artist-id': String(artistId) };
    }
    return {};
}

function applyActiveAccountScope(params = {}) {
    const merged = { ...params };
    const activeAccount = getActiveAccount();
    const activeType = String(activeAccount?.type || '').toLowerCase();

    if (String(merged.view).toLowerCase() === 'mine') {
        const slug = getActiveAccountSlug();
        if (slug) merged.posterHandle = slug;

        if (activeType === 'business') {
            const businessId = resolveBusinessId(activeAccount);
            if (businessId > 0) merged.businessAccountId = businessId;
        } else if (activeType === 'artist') {
            const artistId = resolveArtistId(activeAccount);
            if (artistId > 0) merged.artistAccountId = artistId;
        }
    }

    return merged;
}

export async function fetchEvents(params = {}) {
    const merged = applyActiveAccountScope(params);
    const response = await axios.get(BASE_URL, { params: merged, headers: getActiveAccountHeaders() });
    return response.data;
}

export async function fetchEventCategoryCounts(params = {}) {
    const merged = applyActiveAccountScope(params);
    const response = await axios.get(`${BASE_URL}/category-counts`, { params: merged, headers: getActiveAccountHeaders() });
    return response.data;
}

export async function fetchEventLocationCounts(params = {}) {
    const merged = applyActiveAccountScope(params);
    const response = await axios.get(`${BASE_URL}/location-counts`, { params: merged, headers: getActiveAccountHeaders() });
    return response.data;
}

export async function fetchEventSubcategoryCounts(params = {}) {
    const merged = applyActiveAccountScope(params);
    const response = await axios.get(`${BASE_URL}/subcategory-counts`, { params: merged, headers: getActiveAccountHeaders() });
    return response.data;
}

// ✅ Needed by Create/Edit Event modal (step 2)
export async function fetchEventCategories() {
    const response = await axios.get(`${BASE_URL}/categories`);
    return response.data;
}

export async function fetchEventById(eventId) {
    if (!eventId) throw new Error("eventId is required");
    const response = await axios.get(`${BASE_URL}/${eventId}`, { headers: getActiveAccountHeaders() });
    return response.data;
}

export async function fetchEventEngagementSummary(eventId) {
    if (!eventId) throw new Error("eventId is required");
    const response = await axios.get(`${BASE_URL}/${eventId}/engagement/summary`, { headers: getActiveAccountHeaders() });
    return response.data;
}

export async function fetchFriendsGoing(eventId) {
    if (!eventId) throw new Error("eventId is required");
    const response = await axios.get(`${BASE_URL}/${eventId}/friends-going`, { headers: getActiveAccountHeaders() });
    return response.data;
}

/**
 * Batch-fetch friends-going for multiple events in parallel.
 * Returns a Map: eventId → friend[]
 * Silently swallows per-event failures (returns empty array for that event).
 */
export async function fetchBatchFriendsGoing(eventIds) {
    if (!Array.isArray(eventIds) || eventIds.length === 0) return {};
    const headers = getActiveAccountHeaders();
    const results = await Promise.allSettled(
        eventIds.map((id) =>
            axios
                .get(`${BASE_URL}/${id}/friends-going`, { headers })
                .then((r) => ({ id, friends: Array.isArray(r.data?.friends) ? r.data.friends : [] }))
        )
    );
    const map = {};
    for (const r of results) {
        if (r.status === "fulfilled" && r.value) {
            map[String(r.value.id)] = r.value.friends;
        }
    }
    return map;
}

export async function updateEventEngagement(eventId, payload) {
    if (!eventId) throw new Error("eventId is required");
    const response = await axios.post(`${BASE_URL}/${eventId}/engagement`, payload, { headers: getActiveAccountHeaders() });
    return response.data;
}

export async function createEvent(payload) {
    const response = await axios.post(BASE_URL, payload, { headers: getActiveAccountHeaders() });
    return response.data;
}

export async function updateEvent(eventId, payload) {
    if (!eventId) throw new Error("eventId is required");
    const response = await axios.put(`${BASE_URL}/${eventId}`, payload);
    return response.data;
}

export async function deleteEvent(eventId) {
    if (!eventId) throw new Error("eventId is required");
    const response = await axios.delete(`${BASE_URL}/${eventId}`);
    return response.data;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Comments API
   ───────────────────────────────────────────────────────────────────────────── */

export async function fetchEventComments(eventId, params = {}) {
    if (!eventId) throw new Error("eventId is required");
    const response = await axios.get(`${BASE_URL}/${eventId}/comments`, { params, headers: getActiveAccountHeaders() });
    return response.data;
}

export async function createEventComment(eventId, content, parentId = null) {
    if (!eventId) throw new Error("eventId is required");
    if (!content) throw new Error("content is required");
    const payload = { content };
    if (parentId) payload.parent_id = parentId;
    const response = await axios.post(`${BASE_URL}/${eventId}/comments`, payload, { headers: getActiveAccountHeaders() });
    return response.data;
}

export async function deleteEventComment(eventId, commentId) {
    if (!eventId) throw new Error("eventId is required");
    if (!commentId) throw new Error("commentId is required");
    const response = await axios.delete(`${BASE_URL}/comments/${commentId}`, { headers: getActiveAccountHeaders() });
    return response.data;
}

export async function likeEventComment(commentId) {
    if (!commentId) throw new Error("commentId is required");
    const response = await axios.post(`${BASE_URL}/comments/${commentId}/like`, {}, { headers: getActiveAccountHeaders() });
    return response.data;
}

export async function unlikeEventComment(commentId) {
    if (!commentId) throw new Error("commentId is required");
    const response = await axios.delete(`${BASE_URL}/comments/${commentId}/like`, { headers: getActiveAccountHeaders() });
    return response.data;
}

export async function pinEventComment(commentId) {
    if (!commentId) throw new Error("commentId is required");
    const response = await axios.post(`${BASE_URL}/comments/${commentId}/pin`, {}, { headers: getActiveAccountHeaders() });
    return response.data;
}

export async function unpinEventComment(commentId) {
    if (!commentId) throw new Error("commentId is required");
    const response = await axios.post(`${BASE_URL}/comments/${commentId}/unpin`, {}, { headers: getActiveAccountHeaders() });
    return response.data;
}

export async function flagEventComment(commentId, reason, details = "") {
    if (!commentId) throw new Error("commentId is required");
    if (!reason) throw new Error("reason is required");
    const response = await axios.post(`${BASE_URL}/comments/${commentId}/flag`, { reason, details }, { headers: getActiveAccountHeaders() });
    return response.data;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Report API
   ───────────────────────────────────────────────────────────────────────────── */

export async function reportEvent(eventId, payload) {
    if (!eventId) throw new Error("eventId is required");
    const response = await axios.post(`${BASE_URL}/${eventId}/report`, payload);
    return response.data;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Date/Time Formatting Helpers
   ───────────────────────────────────────────────────────────────────────────── */

export function getEventStartDateKeyCT(event) {
    if (!event || !event.start_at) return "";
    const raw = String(event.start_at);

    // If backend provides explicit date-only, prefer it.
    if (event.start_date) return String(event.start_date).slice(0, 10);

    // Common shapes:
    // - "2026-02-01 00:00:00"
    // - "2026-02-01T00:00:00.000Z"
    // - "2026-02-01"
    const datePart = raw.includes("T") ? raw.split("T")[0] : raw.split(" ")[0];
    return String(datePart).slice(0, 10);
}

function formatDateKeyAsShortUS(dateKey) {
    // dateKey: "YYYY-MM-DD" -> "Mon D, YYYY" without timezone shifting.
    if (!dateKey) return "";
    const [y, m, d] = dateKey.split("-").map((v) => Number(v));
    if (!y || !m || !d) return "";
    const dt = new Date(Date.UTC(y, m - 1, d));
    return new Intl.DateTimeFormat("en-US", {
        timeZone: "UTC",
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(dt);
}

export function formatEventDateTimeCT(event) {
    if (!event || !event.start_at) return "";
    const dateKey = getEventStartDateKeyCT(event);
    const dateStr = formatDateKeyAsShortUS(dateKey);

    // NEW: Use the explicit startHasTime flag from the API
    // If startHasTime is false or startTime is null, don't show time
    const isDateOnly = event.startHasTime === false || !event.startTime;

    if (isDateOnly) {
        return dateStr ? `${dateStr} (CT)` : "";
    }

    // If we have a startTime, format it directly without timezone conversion issues
    if (event.startTime) {
        const [hh, mm] = String(event.startTime).split(':').map(Number);
        const hour12 = hh % 12 || 12;
        const ampm = hh >= 12 ? 'PM' : 'AM';
        const timeStr = `${hour12}:${String(mm).padStart(2, '0')} ${ampm}`;
        return dateStr ? `${dateStr} • ${timeStr} CT` : `${timeStr} CT`;
    }

    // Fallback to parsing from start_at if no startTime field
    const tz = "America/Chicago";
    const d = new Date(event.start_at);
    const timeStr = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "numeric",
        minute: "2-digit",
    }).format(d);

    return dateStr ? `${dateStr} • ${timeStr} CT` : `${timeStr} CT`;
}

export function isEventTodayCT(event, now = new Date()) {
    const dateKey = getEventStartDateKeyCT(event);
    if (!dateKey) return false;

    // Build today's dateKey in CT.
    const nowKey = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Chicago",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(now);

    // en-CA yields YYYY-MM-DD
    return dateKey === nowKey;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Location Helpers
   ───────────────────────────────────────────────────────────────────────────── */

export function formatEventLocation(event) {
    if (!event) return "Statewide";

    const scope = String(event.locationScope || event.location_scope || "").toLowerCase();
    const city = String(event.city || "").trim();
    const county = String(event.county || "").trim();

    if (scope === "statewide" || (!city && !county)) return "Statewide";

    const countyLabel = county ? `${county} County` : "";
    if (city && countyLabel) return `${city}, ${countyLabel}`;
    return city || countyLabel || "Statewide";
}

export function getEventAddress(event) {
    if (!event) return null;
    return event.address || event.venueAddress || event.venue_address || null;
}

export function getEventVenueName(event) {
    if (!event) return null;
    return event.venueName || event.venue_name || null;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Category Helpers
   ───────────────────────────────────────────────────────────────────────────── */

const CATEGORY_LABELS = {
    "music-nightlife": "Music",
    "arts-culture": "Arts & Culture",
    "food-drink": "Food & Drink",
    "community-social": "Community & Social",
    "family-kids": "Family & Kids",
    "sports-recreation": "Sports & Recreation",
    "outdoors-nature": "Outdoors & Nature",
    "education-workshops": "Education & Workshops",
    "business-networking": "Business & Networking",
    "health-wellness": "Health & Wellness",
    "faith-spiritual": "Faith & Spiritual",
    "volunteer-fundraising": "Volunteer & Fundraising",
    "government-civic": "Government & Civic",
    "markets-shopping": "Markets & Shopping",
    "holidays-seasonal": "Holidays & Seasonal",
    other: "Other",
};

function slugToLabel(slug) {
    if (!slug) return "";
    return slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

export function getEventCategoryLabel(event) {
    if (!event) return "";

    const slug = String(event.category || event.categorySlug || "").trim().toLowerCase();
    const subcategorySlug = String(event.subcategory || event.subcategorySlug || "").trim().toLowerCase();
    const subcategoryLabel = String(event.subcategoryLabel || "").trim();
    const categoryLabel = String(event.categoryLabel || "").trim() || CATEGORY_LABELS[slug] || "";

    // If subcategory exists, show subcategory label
    if (subcategorySlug) {
        return subcategoryLabel || slugToLabel(subcategorySlug);
    }

    return categoryLabel;
}

export function getEventCategorySlug(event) {
    if (!event) return "";
    return String(event.category || event.categorySlug || "").trim().toLowerCase();
}

/**
 * Fire-and-forget: ask the backend to process @mentions in the event description.
 */
export async function processEventMentions(eventId) {
    if (!eventId) return;
    try {
        await axios.post(`${BASE_URL}/${eventId}/process-mentions`, {}, {
            headers: getActiveAccountHeaders(),
        });
    } catch {
        // best-effort
    }
}

/* ─────────────────────────────────────────────────────────────────────────────
   Edit History API
   ───────────────────────────────────────────────────────────────────────────── */

export async function fetchEventEdits(eventId) {
    if (!eventId) throw new Error("eventId is required");
    const response = await axios.get(`${BASE_URL}/${eventId}/edits`, {
        headers: getActiveAccountHeaders(),
    });
    return response.data;
}

export async function fetchEventEditLimit(eventId) {
    if (!eventId) throw new Error("eventId is required");
    const response = await axios.get(`${BASE_URL}/${eventId}/edit-limit`, {
        headers: getActiveAccountHeaders(),
    });
    return response.data;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Profile Check — does a user/business/artist have ANY event activity?
   Returns { hasActivity: bool, counts: { posted, liked, commented, reposted, rsvp, interested } }
   ───────────────────────────────────────────────────────────────────────────── */

export async function fetchEventProfileCheck({ userId, businessId, artistId } = {}) {
    let url;
    if (businessId) {
        url = `${BASE_URL}/profile-check/business/${businessId}`;
    } else if (artistId) {
        url = `${BASE_URL}/profile-check/artist/${artistId}`;
    } else if (userId) {
        url = `${BASE_URL}/profile-check/${userId}`;
    } else {
        throw new Error("userId, businessId, or artistId is required");
    }
    const response = await axios.get(url, { headers: getActiveAccountHeaders() });
    return response.data; // { hasActivity, counts }
}

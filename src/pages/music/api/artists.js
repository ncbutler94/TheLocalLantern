/**
 * Music Artists API helper (Updated for Admin Console)
 *
 * Location: src/pages/music/api/artists.js
 *
 * Changes from original:
 * - Added premium tier fields (isPremium, premiumTier, premiumExpiresAt)
 * - Added verification fields (isVerified, verificationStatus, verifiedAt)
 * - Added new profile fields (tagline, foundingYear, hometown, settings)
 * - Added team management API calls
 * - Added verification API calls
 * - Added subscription API calls
 */

import { serializeArtist, serializeArtistsList } from "./artistSerializer";
import { getAccountHeaders } from "../../../utils/getAccountHeadersStatic";
import { secureFetch } from "../../../utils/secureFetch";

function getBase() {
    const base = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");
    return base ? `${base}/api` : "/api";
}

/**
 * Wrapper around secureFetch() that auto-attaches account identity headers.
 * All music API calls go through this so the backend always knows
 * which account (personal / business / artist) is making the request.
 */
async function fetchWithAccount(url, options = {}) {
    const acctHeaders = getAccountHeaders();
    const merged = {
        ...options,
        credentials: "include",
        headers: {
            ...acctHeaders,
            ...(options.headers || {}),
        },
    };
    return secureFetch(url, merged);
}

async function parseJsonOrThrow(res) {
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
        const message =
            (data && (data.error || data.message)) ||
            `Request failed (${res.status})`;
        const err = new Error(message);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

// ============================================================================
// ARTIST CRUD
// ============================================================================

/**
 * Fetch the current user's artist accounts (profiles they own/manage).
 */
export async function fetchMyArtistAccounts() {
    const base = getBase();
    const url = `${base}/music/my-artists`;

    try {
        const res = await fetchWithAccount(url, {
            method: "GET",
        });

        if (!res.ok) {
            return { artists: [] };
        }

        const data = await res.json();
        const rawArtists = Array.isArray(data?.artists) ? data.artists : [];
        const serialized = serializeArtistsList(rawArtists);

        const artists = serialized.map((a, idx) => {
            // Grab the raw row so we can forward status / setup fields
            // that the serializer doesn't currently map.
            const raw = rawArtists[idx] || {};

            return {
                id: a.id,
                name: a.name,
                handle: a.handle,
                city: a.city,
                county: a.county,
                avatar_url: a.avatarUrl,
                avatarUrl: a.avatarUrl,
                cover_url: a.coverUrl,
                coverUrl: a.coverUrl,
                bio: a.bio,
                genres: a.genres,
                isStatewide: a.isStatewide,
                isPremium: a.isPremium,
                premiumTier: a.premiumTier,
                isVerified: a.isVerified,
                createdAt: a.createdAt,
                updatedAt: a.updatedAt,
                // Artist sub-type ('music' | 'artist'). The serializer already
                // normalizes this from music_artists.profile_type; we forward
                // it under both camelCase AND snake_case so the Header (which
                // checks both) can render the correct icon + subtitle label
                // for drafts and active artist accounts.
                profileType: a.profileType,
                profile_type: a.profileType,
                // Forward status and setup fields from the raw backend response
                // so the Header can determine whether the artist still needs setup.
                status: raw.status || null,
                setup_url: raw.setup_url || null,
                invite_url: raw.invite_url || null,
            };
        });

        return { artists };
    } catch (err) {
        console.error("[fetchMyArtistAccounts] error:", err);
        return { artists: [] };
    }
}

/**
 * List artists (directory)
 */
export async function listArtists({
                                      query = "",
                                      city = "",
                                      county = "",
                                      genre = "",
                                      view = "",
                                      type = "",
                                      limit = 24,
                                      cursor = null,
                                  } = {}) {
    const base = getBase();
    const qs = new URLSearchParams();

    if (query) qs.set("q", query);
    if (city) qs.set("city", city);
    if (county) qs.set("county", county);
    if (genre) qs.set("genre", genre);
    if (view && view !== "all") qs.set("view", view);
    if (type === "music" || type === "artist") qs.set("type", type);
    if (limit) qs.set("limit", String(limit));
    if (cursor) qs.set("cursor", String(cursor));

    const url = `${base}/music/artists?${qs.toString()}`;

    const res = await fetchWithAccount(url, {
        method: "GET",
        credentials: "include",
    });

    const data = await parseJsonOrThrow(res);

    if (Array.isArray(data)) {
        return serializeArtistsList(data);
    }

    const itemsRaw = Array.isArray(data?.items) ? data.items : [];
    return {
        ...data,
        items: serializeArtistsList(itemsRaw),
    };
}

/**
 * Get artist by id or handle
 */
export async function getArtist({ artistId, handle }) {
    const base = getBase();

    const idOrHandle = artistId || handle;
    if (!idOrHandle) {
        throw new Error("artistId or handle is required");
    }

    const url = `${base}/music/artists/${encodeURIComponent(idOrHandle)}`;

    const res = await fetchWithAccount(url, {
        method: "GET",
        credentials: "include",
    });

    const data = await parseJsonOrThrow(res);
    return serializeArtist(data);
}

/**
 * Create artist (requires personal account login)
 */
export async function createArtist(payload) {
    const base = getBase();

    const res = await fetchWithAccount(`${base}/music/artists`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload || {}),
    });

    const data = await parseJsonOrThrow(res);
    return serializeArtist(data);
}

/**
 * Update artist (owner/admin only)
 */
export async function updateArtist({ artistId, payload }) {
    if (!artistId) throw new Error("artistId is required");

    const base = getBase();

    const res = await fetchWithAccount(`${base}/music/artists/${encodeURIComponent(artistId)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload || {}),
    });

    const data = await parseJsonOrThrow(res);
    return serializeArtist(data);
}

/**
 * Delete artist (owner only)
 */
export async function deleteArtist({ artistId }) {
    if (!artistId) throw new Error("artistId is required");

    const base = getBase();

    const res = await fetchWithAccount(`${base}/music/artists/${encodeURIComponent(artistId)}`, {
        method: "DELETE",
        credentials: "include",
    });

    return parseJsonOrThrow(res);
}

/**
 * Check if a handle is available
 */
export async function checkHandleAvailable(handle, excludeArtistId) {
    const base = getBase();
    let url = `${base}/music/handles/check?handle=${encodeURIComponent(handle)}`;
    if (excludeArtistId) url += `&exclude_artist_id=${encodeURIComponent(excludeArtistId)}`;

    const res = await fetchWithAccount(url, {
        method: "GET",
        credentials: "include",
    });

    return parseJsonOrThrow(res);
}


// ============================================================================
// PHOTOS
// ============================================================================

/**
 * Add photos to an artist's gallery
 */
export async function addArtistPhotos({ artistId, photos }) {
    if (!artistId) throw new Error("artistId is required");
    if (!Array.isArray(photos) || photos.length === 0) {
        throw new Error("photos array is required");
    }

    const base = getBase();

    const res = await fetchWithAccount(`${base}/music/artists/${encodeURIComponent(artistId)}/photos`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos }),
    });

    return parseJsonOrThrow(res);
}

/**
 * Delete a photo from an artist's gallery
 */
export async function deleteArtistPhoto({ artistId, photoId }) {
    if (!artistId) throw new Error("artistId is required");
    if (!photoId) throw new Error("photoId is required");

    const base = getBase();

    const res = await fetchWithAccount(
        `${base}/music/artists/${encodeURIComponent(artistId)}/photos/${encodeURIComponent(photoId)}`,
        {
            method: "DELETE",
            credentials: "include",
        }
    );

    return parseJsonOrThrow(res);
}

/**
 * Reorder photos in gallery
 */
export async function reorderArtistPhotos({ artistId, photoIds }) {
    if (!artistId) throw new Error("artistId is required");
    if (!Array.isArray(photoIds)) throw new Error("photoIds array is required");

    const base = getBase();

    const res = await fetchWithAccount(
        `${base}/music/artists/${encodeURIComponent(artistId)}/photos/reorder`,
        {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photoIds }),
        }
    );

    return parseJsonOrThrow(res);
}


// ============================================================================
// TEAM MANAGEMENT
// ============================================================================

/**
 * Get team members and pending invites
 */
export async function getArtistTeam({ artistId }) {
    if (!artistId) throw new Error("artistId is required");

    const base = getBase();

    const res = await fetchWithAccount(`${base}/music/artists/${encodeURIComponent(artistId)}/team`, {
        method: "GET",
        credentials: "include",
    });

    return parseJsonOrThrow(res);
}

/**
 * Send email invite to join team
 */
export async function inviteArtistTeamMember({ artistId, email, role = "admin" }) {
    if (!artistId) throw new Error("artistId is required");
    if (!email) throw new Error("email is required");

    const base = getBase();

    const res = await fetchWithAccount(`${base}/music/artists/${encodeURIComponent(artistId)}/team/invite`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
    });

    return parseJsonOrThrow(res);
}

/**
 * Generate shareable invite link
 */
export async function generateArtistInviteLink({ artistId, role = "admin" }) {
    if (!artistId) throw new Error("artistId is required");

    const base = getBase();

    const res = await fetchWithAccount(`${base}/music/artists/${encodeURIComponent(artistId)}/team/invite-link`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
    });

    return parseJsonOrThrow(res);
}

/**
 * Accept an invite (via token)
 */
export async function acceptArtistInvite({ token }) {
    if (!token) throw new Error("token is required");

    const base = getBase();

    const res = await fetchWithAccount(`${base}/music/artists/invite/${encodeURIComponent(token)}/accept`, {
        method: "POST",
        credentials: "include",
    });

    return parseJsonOrThrow(res);
}

/**
 * Revoke a pending invite
 */
export async function revokeArtistInvite({ artistId, inviteId }) {
    if (!artistId) throw new Error("artistId is required");
    if (!inviteId) throw new Error("inviteId is required");

    const base = getBase();

    const res = await fetchWithAccount(
        `${base}/music/artists/${encodeURIComponent(artistId)}/team/invite/${encodeURIComponent(inviteId)}`,
        {
            method: "DELETE",
            credentials: "include",
        }
    );

    return parseJsonOrThrow(res);
}

/**
 * Remove a team member
 */
export async function removeArtistTeamMember({ artistId, userId }) {
    if (!artistId) throw new Error("artistId is required");
    if (!userId) throw new Error("userId is required");

    const base = getBase();

    const res = await fetchWithAccount(
        `${base}/music/artists/${encodeURIComponent(artistId)}/team/${encodeURIComponent(userId)}`,
        {
            method: "DELETE",
            credentials: "include",
        }
    );

    return parseJsonOrThrow(res);
}

/**
 * Transfer ownership to another team member
 */
export async function transferArtistOwnership({ artistId, newOwnerId }) {
    if (!artistId) throw new Error("artistId is required");
    if (!newOwnerId) throw new Error("newOwnerId is required");

    const base = getBase();

    const res = await fetchWithAccount(
        `${base}/music/artists/${encodeURIComponent(artistId)}/transfer-ownership`,
        {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newOwnerId }),
        }
    );

    return parseJsonOrThrow(res);
}


// ============================================================================
// VERIFICATION
// ============================================================================

/**
 * Get verification status
 */
export async function getArtistVerification({ artistId }) {
    if (!artistId) throw new Error("artistId is required");

    const base = getBase();

    const res = await fetchWithAccount(`${base}/music/artists/${encodeURIComponent(artistId)}/verification`, {
        method: "GET",
        credentials: "include",
    });

    return parseJsonOrThrow(res);
}

/**
 * Submit verification request
 */
export async function submitArtistVerification({ artistId, realName, evidenceLinks, additionalNotes }) {
    if (!artistId) throw new Error("artistId is required");

    const base = getBase();

    const res = await fetchWithAccount(`${base}/music/artists/${encodeURIComponent(artistId)}/verification`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ realName, evidenceLinks, additionalNotes }),
    });

    return parseJsonOrThrow(res);
}


// ============================================================================
// SUBSCRIPTION
// ============================================================================

/**
 * Get subscription status
 */
export async function getArtistSubscription({ artistId }) {
    if (!artistId) throw new Error("artistId is required");

    const base = getBase();

    const res = await fetchWithAccount(`${base}/music/artists/${encodeURIComponent(artistId)}/subscription`, {
        method: "GET",
        credentials: "include",
    });

    return parseJsonOrThrow(res);
}

/**
 * Create or upgrade subscription
 */
export async function createArtistSubscription({ artistId, tier, billingInterval = "monthly" }) {
    if (!artistId) throw new Error("artistId is required");
    if (!tier) throw new Error("tier is required");

    const base = getBase();

    const res = await fetchWithAccount(`${base}/music/artists/${encodeURIComponent(artistId)}/subscription`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, billingInterval }),
    });

    return parseJsonOrThrow(res);
}

/**
 * Cancel subscription
 */
export async function cancelArtistSubscription({ artistId }) {
    if (!artistId) throw new Error("artistId is required");

    const base = getBase();

    const res = await fetchWithAccount(`${base}/music/artists/${encodeURIComponent(artistId)}/subscription`, {
        method: "DELETE",
        credentials: "include",
    });

    return parseJsonOrThrow(res);
}


// ============================================================================
// GENRES (for genre picker)
// ============================================================================

/**
 * Fetch all available music genres
 */
export async function fetchMusicGenres() {
    const base = getBase();

    const res = await fetchWithAccount(`${base}/music/genres`, {
        method: "GET",
        credentials: "include",
    });

    const data = await parseJsonOrThrow(res);

    // Normalize response - could be { items: [...] } or just [...]
    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];

    return items.map((row) => {
        if (typeof row === "string") return { name: row, slug: row.toLowerCase().replace(/\s+/g, "-") };
        return {
            id: row.id,
            name: row.name || row.label || row.genre || "",
            slug: row.slug || row.name?.toLowerCase().replace(/\s+/g, "-") || "",
            isActive: row.is_active !== false,
            sortOrder: row.sort_order || 0,
        };
    }).filter((g) => g.name);
}


// ============================================================================
// LOCATION COUNTS (for filter badge display)
// ============================================================================

/**
 * Fetch location counts for artists — { counties: {...}, cities: {...} }
 * Used by ArtistsFilter to show county/city badge counts.
 */
export async function fetchArtistLocationCounts({ q, genre, county } = {}) {
    const base = getBase();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (genre) params.set("genre", genre);
    if (county) params.set("county", county);

    const url = `${base}/music/artists/location-counts?${params.toString()}`;

    try {
        const res = await fetchWithAccount(url, { method: "GET" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { counties: {}, cities: {} };
        return {
            counties: data?.counties && typeof data.counties === "object" ? data.counties : {},
            cities: data?.cities && typeof data.cities === "object" ? data.cities : {},
        };
    } catch {
        return { counties: {}, cities: {} };
    }
}

/**
 * Fetch location counts for artist posts — { counties: {...}, cities: {...} }
 * Posts inherit location from their parent artist.
 */
export async function fetchPostLocationCounts({ q, genre, county } = {}) {
    const base = getBase();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (genre) params.set("genre", genre);
    if (county) params.set("county", county);

    const url = `${base}/music/posts/location-counts?${params.toString()}`;

    try {
        const res = await fetchWithAccount(url, { method: "GET" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { counties: {}, cities: {} };
        return {
            counties: data?.counties && typeof data.counties === "object" ? data.counties : {},
            cities: data?.cities && typeof data.cities === "object" ? data.cities : {},
        };
    } catch {
        return { counties: {}, cities: {} };
    }
}


// ============================================================================
// LEGACY EXPORTS (for backwards compatibility)
// ============================================================================

/**
 * @deprecated Use inviteArtistTeamMember instead
 */
export async function inviteArtistAdmin({ artistId, toUserId, role = "admin" }) {
    if (!artistId) throw new Error("artistId is required");
    if (!toUserId) throw new Error("toUserId is required");

    const base = getBase();

    const res = await fetchWithAccount(`${base}/music/artists/${encodeURIComponent(artistId)}/invites`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId, role }),
    });

    return parseJsonOrThrow(res);
}


// ============================================================================
// ARTIST SETUP FLOW (mirrors business setup flow)
// ============================================================================

/**
 * Check if an artist handle/slug is available.
 * Calls GET /api/music/handles/check?handle=xxx&exclude_artist_id=yyy
 * @param {string} handle - The handle to check
 * @param {number|string} [excludeId] - Artist ID to exclude (for edits)
 * @returns {Promise<{available: boolean, message: string}>}
 */
export async function checkArtistSlug(handle, excludeId) {
    const base = getBase();
    const params = new URLSearchParams();
    params.set("handle", String(handle || "").trim());
    if (excludeId) params.set("exclude_artist_id", String(excludeId));

    const res = await secureFetch(`${base}/music/handles/check?${params.toString()}`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
    });

    try {
        const data = await res.json();
        if (!res.ok) return { available: false, message: "Failed to check handle." };
        return data || { available: false, message: "Failed to check handle." };
    } catch {
        return { available: false, message: "Failed to check handle." };
    }
}

/**
 * Create a new artist draft.
 * Calls POST /api/music/create-draft
 * @param {string} artistName - The artist name
 * @param {string} [profileType='music'] - 'music' for musicians, 'artist' for visual artists
 * @returns {Promise<{ok: boolean, artist_id: number, token: string, slug: string, setup_url: string}>}
 */
export async function createArtistDraft(artistName, profileType = "music") {
    if (!artistName || !String(artistName).trim()) {
        throw new Error("Artist name is required.");
    }

    const base = getBase();

    const normalizedType = (profileType === "artist") ? "artist" : "music";

    const res = await fetchWithAccount(`${base}/music/create-draft`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            artist_name: String(artistName).trim(),
            profile_type: normalizedType,
        }),
    });

    return parseJsonOrThrow(res);
}

/**
 * Fetch invite details for artist setup page.
 * Calls GET /api/music/invite/details?token=xxx
 * @param {string} token - The invite token
 * @returns {Promise<{invite: object, application: object, artist: object}>}
 */
export async function fetchArtistInviteDetails(token) {
    if (!token) throw new Error("Missing invite token.");

    const base = getBase();

    const res = await fetchWithAccount(
        `${base}/music/invite/details?token=${encodeURIComponent(token)}`,
        {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
        }
    );

    return parseJsonOrThrow(res);
}

/**
 * Save artist draft (without submitting for approval).
 * Calls POST /api/music/invite/save-draft
 * @param {string} token - The invite token
 * @param {object} profileData - The artist profile data to save
 * @returns {Promise<{ok: boolean, artist: object}>}
 */
export async function saveArtistDraft(token, profileData) {
    if (!token) throw new Error("Missing invite token.");

    const base = getBase();

    const res = await fetchWithAccount(`${base}/music/invite/save-draft`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...profileData }),
    });

    return parseJsonOrThrow(res);
}

/**
 * Complete artist setup and submit for approval.
 * Calls POST /api/music/invite/complete
 * @param {string} token - The invite token
 * @param {object} profileData - The artist profile data to submit
 * @returns {Promise<{ok: boolean, artist: object, pending_approval: boolean}>}
 */
export async function completeArtistSetup(token, profileData) {
    if (!token) throw new Error("Missing invite token.");

    const base = getBase();

    const res = await fetchWithAccount(`${base}/music/invite/complete`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...profileData }),
    });

    return parseJsonOrThrow(res);
}

/**
 * Delete an artist draft during setup.
 * Calls DELETE /api/music/invite/delete
 * @param {string} token - The invite token
 * @returns {Promise<{ok: boolean}>}
 */
export async function deleteArtistDraft(token) {
    if (!token) throw new Error("Missing invite token.");

    const base = getBase();

    const res = await fetchWithAccount(`${base}/music/invite/delete`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
    });

    return parseJsonOrThrow(res);
}

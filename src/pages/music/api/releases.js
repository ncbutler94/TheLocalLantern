/**
 * Music Releases & Tracks API helper (Frontend)
 *
 * Location: src/pages/music/api/releases.js
 *
 * Mirrors the pattern of artists.js — thin wrappers around fetch()
 * for the new /api/music/artists/:artistId/releases/* endpoints.
 */

import { getAccountHeaders } from "../../../utils/getAccountHeadersStatic";
import { secureFetch } from "../../../utils/secureFetch";

function getBase() {
    const base = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");
    return base ? `${base}/api` : "/api";
}

/**
 * Wrapper around secureFetch() that auto-attaches account identity headers.
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
// RELEASES
// ============================================================================

/**
 * List releases for an artist.
 * Returns { items: [...], total: N }
 */
export async function fetchReleases({ artistId }) {
    if (!artistId) throw new Error("artistId is required");
    const base = getBase();

    const res = await fetchWithAccount(
        `${base}/music/artists/${encodeURIComponent(artistId)}/releases`,
        { method: "GET", credentials: "include" }
    );

    return parseJsonOrThrow(res);
}

/**
 * Get a single release with its tracks.
 */
export async function fetchRelease({ artistId, releaseId }) {
    if (!artistId) throw new Error("artistId is required");
    if (!releaseId) throw new Error("releaseId is required");
    const base = getBase();

    const res = await fetchWithAccount(
        `${base}/music/artists/${encodeURIComponent(artistId)}/releases/${encodeURIComponent(releaseId)}`,
        { method: "GET", credentials: "include" }
    );

    return parseJsonOrThrow(res);
}

/**
 * Create a new release. Supports multipart (cover image) via FormData,
 * or plain JSON if no file is being uploaded.
 *
 * @param {Object} params
 * @param {number|string} params.artistId
 * @param {string} params.title
 * @param {string} [params.releaseType] - 'album' | 'ep' | 'single'
 * @param {string} [params.description]
 * @param {File}   [params.coverFile]   - Cover image File object
 * @param {string} [params.coverUrl]    - Existing cover URL (if no file)
 * @param {string} [params.releaseDate] - ISO date string
 * @param {string} [params.genre]
 * @param {string[]} [params.tags]
 * @param {number} [params.price]
 * @param {boolean} [params.isExplicit]
 */
export async function createRelease({
                                        artistId,
                                        title,
                                        releaseType = "single",
                                        description = "",
                                        coverFile = null,
                                        coverUrl = null,
                                        releaseDate = null,
                                        genre = "",
                                        tags = null,
                                        isExplicit = false,
                                    }) {
    if (!artistId) throw new Error("artistId is required");
    if (!title) throw new Error("title is required");
    const base = getBase();

    const fd = new FormData();
    fd.append("title", title);
    fd.append("release_type", releaseType);
    if (description) fd.append("description", description);
    if (coverFile) fd.append("cover", coverFile);
    else if (coverUrl) fd.append("cover_url", coverUrl);
    if (releaseDate) fd.append("release_date", releaseDate);
    if (genre) fd.append("genre", genre);
    if (tags && tags.length) fd.append("tags_json", JSON.stringify(tags));
    fd.append("is_explicit", isExplicit ? "1" : "0");

    const res = await fetchWithAccount(
        `${base}/music/artists/${encodeURIComponent(artistId)}/releases`,
        { method: "POST", credentials: "include", body: fd }
    );

    return parseJsonOrThrow(res);
}

/**
 * Update a release. Supports multipart (new cover) or JSON fields.
 */
export async function updateRelease({ artistId, releaseId, ...fields }) {
    if (!artistId) throw new Error("artistId is required");
    if (!releaseId) throw new Error("releaseId is required");
    const base = getBase();

    const hasCoverFile = fields.coverFile instanceof File;

    let fetchOptions;

    if (hasCoverFile) {
        const fd = new FormData();
        fd.append("cover", fields.coverFile);
        if (fields.title !== undefined) fd.append("title", fields.title);
        if (fields.releaseType !== undefined) fd.append("release_type", fields.releaseType);
        if (fields.description !== undefined) fd.append("description", fields.description);
        if (fields.releaseDate !== undefined) fd.append("release_date", fields.releaseDate || "");
        if (fields.genre !== undefined) fd.append("genre", fields.genre || "");
        if (fields.tags !== undefined) fd.append("tags_json", JSON.stringify(fields.tags || []));
        if (fields.isExplicit !== undefined) fd.append("is_explicit", fields.isExplicit ? "1" : "0");
        fetchOptions = { method: "PATCH", credentials: "include", body: fd };
    } else {
        const payload = {};
        if (fields.title !== undefined) payload.title = fields.title;
        if (fields.releaseType !== undefined) payload.release_type = fields.releaseType;
        if (fields.description !== undefined) payload.description = fields.description;
        if (fields.releaseDate !== undefined) payload.release_date = fields.releaseDate;
        if (fields.genre !== undefined) payload.genre = fields.genre;
        if (fields.coverUrl !== undefined) payload.cover_url = fields.coverUrl;
        if (fields.tags !== undefined) payload.tags_json = JSON.stringify(fields.tags || []);
        if (fields.isExplicit !== undefined) payload.is_explicit = fields.isExplicit ? 1 : 0;
        fetchOptions = {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        };
    }

    const res = await fetchWithAccount(
        `${base}/music/artists/${encodeURIComponent(artistId)}/releases/${encodeURIComponent(releaseId)}`,
        fetchOptions
    );

    return parseJsonOrThrow(res);
}

/**
 * Delete a release (and all its tracks).
 */
export async function deleteRelease({ artistId, releaseId }) {
    if (!artistId) throw new Error("artistId is required");
    if (!releaseId) throw new Error("releaseId is required");
    const base = getBase();

    const res = await fetchWithAccount(
        `${base}/music/artists/${encodeURIComponent(artistId)}/releases/${encodeURIComponent(releaseId)}`,
        { method: "DELETE", credentials: "include" }
    );

    return parseJsonOrThrow(res);
}


// ============================================================================
// TRACKS
// ============================================================================

/**
 * Upload a track to a release.
 *
 * @param {Object} params
 * @param {number|string} params.artistId
 * @param {number|string} params.releaseId
 * @param {string} params.title
 * @param {File}   params.audioFile  - The audio File object (required)
 * @param {number} [params.trackNumber]
 * @param {number} [params.discNumber]
 * @param {number} [params.durationMs]
 * @param {number} [params.price]
 * @param {boolean} [params.isFree]
 * @param {boolean} [params.isExplicit]
 * @param {boolean} [params.isDownloadable]
 * @param {string} [params.lyrics]
 * @param {Object} [params.credits]
 * @param {Function} [params.onProgress] - Upload progress callback (0-100)
 */
export async function uploadTrack({
                                      artistId,
                                      releaseId,
                                      title,
                                      audioFile,
                                      trackNumber = null,
                                      discNumber = 1,
                                      durationMs = null,
                                      isFree = false,
                                      isExplicit = false,
                                      isDownloadable = true,
                                      lyrics = null,
                                      credits = null,
                                      onProgress = null,
                                  }) {
    if (!artistId) throw new Error("artistId is required");
    if (!releaseId) throw new Error("releaseId is required");
    if (!title) throw new Error("title is required");
    if (!audioFile) throw new Error("audioFile is required");
    const base = getBase();

    const fd = new FormData();
    fd.append("audio", audioFile);
    fd.append("title", title);
    if (trackNumber != null) fd.append("track_number", String(trackNumber));
    fd.append("disc_number", String(discNumber));
    if (durationMs != null) fd.append("duration_ms", String(durationMs));
    fd.append("is_free", isFree ? "1" : "0");
    fd.append("is_explicit", isExplicit ? "1" : "0");
    fd.append("is_downloadable", isDownloadable ? "1" : "0");
    if (lyrics) fd.append("lyrics", lyrics);
    if (credits) fd.append("credits_json", JSON.stringify(credits));

    const url = `${base}/music/artists/${encodeURIComponent(artistId)}/releases/${encodeURIComponent(releaseId)}/tracks`;

    // Use XMLHttpRequest if onProgress is provided (fetch doesn't support upload progress)
    if (onProgress && typeof onProgress === "function") {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", url);
            xhr.withCredentials = true;

            // Attach account identity headers to XHR uploads
            const acctHeaders = getAccountHeaders();
            Object.entries(acctHeaders).forEach(([key, val]) => {
                xhr.setRequestHeader(key, val);
            });

            xhr.upload.addEventListener("progress", (e) => {
                if (e.lengthComputable) {
                    onProgress(Math.round((e.loaded / e.total) * 100));
                }
            });

            xhr.addEventListener("load", () => {
                try {
                    const data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(data);
                    } else {
                        const err = new Error(data?.message || `Upload failed (${xhr.status})`);
                        err.status = xhr.status;
                        err.data = data;
                        reject(err);
                    }
                } catch (e) {
                    reject(new Error("Failed to parse upload response"));
                }
            });

            xhr.addEventListener("error", () => reject(new Error("Upload network error")));
            xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

            xhr.send(fd);
        });
    }

    // Standard fetch (no progress)
    const res = await fetchWithAccount(url, {
        method: "POST",
        credentials: "include",
        body: fd,
    });

    return parseJsonOrThrow(res);
}

/**
 * Update track metadata.
 */
export async function updateTrack({ artistId, releaseId, trackId, ...fields }) {
    if (!artistId) throw new Error("artistId is required");
    if (!releaseId) throw new Error("releaseId is required");
    if (!trackId) throw new Error("trackId is required");
    const base = getBase();

    const payload = {};
    if (fields.title !== undefined) payload.title = fields.title;
    if (fields.trackNumber !== undefined) payload.track_number = fields.trackNumber;
    if (fields.discNumber !== undefined) payload.disc_number = fields.discNumber;
    if (fields.durationMs !== undefined) payload.duration_ms = fields.durationMs;
    if (fields.price !== undefined) payload.price = fields.price;
    if (fields.isFree !== undefined) payload.is_free = fields.isFree ? 1 : 0;
    if (fields.isExplicit !== undefined) payload.is_explicit = fields.isExplicit ? 1 : 0;
    if (fields.isDownloadable !== undefined) payload.is_downloadable = fields.isDownloadable ? 1 : 0;
    if (fields.lyrics !== undefined) payload.lyrics = fields.lyrics;
    if (fields.credits !== undefined) payload.credits_json = JSON.stringify(fields.credits || {});

    const res = await fetchWithAccount(
        `${base}/music/artists/${encodeURIComponent(artistId)}/releases/${encodeURIComponent(releaseId)}/tracks/${encodeURIComponent(trackId)}`,
        {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }
    );

    return parseJsonOrThrow(res);
}

/**
 * Delete a track.
 */
export async function deleteTrack({ artistId, releaseId, trackId }) {
    if (!artistId) throw new Error("artistId is required");
    if (!releaseId) throw new Error("releaseId is required");
    if (!trackId) throw new Error("trackId is required");
    const base = getBase();

    const res = await fetchWithAccount(
        `${base}/music/artists/${encodeURIComponent(artistId)}/releases/${encodeURIComponent(releaseId)}/tracks/${encodeURIComponent(trackId)}`,
        { method: "DELETE", credentials: "include" }
    );

    return parseJsonOrThrow(res);
}

/**
 * Reorder tracks within a release.
 * @param {number[]} trackIds - Track IDs in desired order
 */
export async function reorderTracks({ artistId, releaseId, trackIds }) {
    if (!artistId) throw new Error("artistId is required");
    if (!releaseId) throw new Error("releaseId is required");
    if (!Array.isArray(trackIds)) throw new Error("trackIds array is required");
    const base = getBase();

    const res = await fetchWithAccount(
        `${base}/music/artists/${encodeURIComponent(artistId)}/releases/${encodeURIComponent(releaseId)}/tracks/reorder`,
        {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ trackIds }),
        }
    );

    return parseJsonOrThrow(res);
}

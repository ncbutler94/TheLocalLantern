// src/pages/jobs/api/businesses.js

import { secureFetch } from "../../../utils/secureFetch";

/**
 * Businesses API helper (frontend)
 * - Used by Jobs to fetch the businesses the current user can manage (owner/admin).
 * - Kept under jobs/api for now to avoid coupling while Jobs scaffolds.
 *
 * Expected return shape:
 * - Array<{ id: number|string, name: string }>
 *
 * Notes:
 * - Uses CRA proxy via /api/* and includes credentials (cookie auth).
 * - Backend route in this repo is mounted at /api/business (singular), with GET /mine.
 * - We also tolerate older/alternate mounts (e.g. /api/businesses/mine).
 */

async function parseJsonSafe(res) {
    const text = await res.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function normalizeBusinessesPayload(data) {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
        if (Array.isArray(data.businesses)) return data.businesses;
        if (Array.isArray(data.items)) return data.items;
    }
    return [];
}

/**
 * Fetch businesses the current user can manage.
 *
 * Preferred backend route (current backend):
 *   GET /api/business/mine
 *
 * Legacy/alternate route (some scaffolds used):
 *   GET /api/businesses/mine
 */
export async function fetchMyBusinesses({ signal } = {}) {
    const candidates = ["/api/business/mine", "/api/businesses/mine"];

    let lastErr = null;

    for (let i = 0; i < candidates.length; i += 1) {
        const url = candidates[i];

        try {
            // eslint-disable-next-line no-await-in-loop
            const res = await secureFetch(url, {
                method: "GET",
                credentials: "include",
                headers: { Accept: "application/json" },
                signal,
            });

            // If this endpoint doesn't exist, try the next candidate.
            if (res.status === 404 && i < candidates.length - 1) {
                // eslint-disable-next-line no-continue
                continue;
            }

            const data = await parseJsonSafe(res);

            // ✅ If the endpoint is missing (404) OR the user simply has no businesses yet,
            // treat it as "no businesses" rather than an app-breaking error.
            if (res.status === 404) return [];

            if (!res.ok) {
                const message =
                    (data && typeof data === "object" && (data.error || data.message)) ||
                    "Failed to load your businesses.";
                const err = new Error(message);
                err.status = res.status;
                err.data = data;
                lastErr = err;
                // eslint-disable-next-line no-continue
                continue;
            }

            return normalizeBusinessesPayload(data);
        } catch (err) {
            // Abort should bubble out (React effects will ignore)
            if (err?.name === "AbortError") throw err;
            lastErr = err;
        }
    }

    // If every candidate failed (network/server), throw the last error so callers can show a warning.
    if (lastErr) throw lastErr;

    return [];
}

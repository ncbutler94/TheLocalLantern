// src/pages/jobs/hooks/useLivePoster.js
// ─────────────────────────────────────────────────────────────────────────────
// Live poster-identity lookup for job cards / job detail panels.
//
// WHY
//   The `jobs` table stores a snapshot of poster_name / poster_avatar /
//   poster_handle at creation time (see jobs route `normalizeJob`). For
//   business + artist jobs the server already joins the live entity at read
//   time, but for PERSONAL jobs the snapshot can go stale as soon as the user
//   renames, changes their handle, or swaps their profile picture.
//
//   The backend was recently tightened to always prefer the live joined user
//   row for personal jobs, but this hook is a belt-and-suspenders layer on the
//   client: even if the server-side join ever returns a null avatar (e.g. a
//   GCS signing hiccup, or a migrated legacy row where u.avatar_url is still
//   an expired signed URL), the card will self-heal by fetching the profile
//   directly from /users/public/:id and overriding the stale fields.
//
// USAGE
//   const live = useLivePoster(job);
//   const posterAvatar = live.avatarUrl || job.posterAvatar;
//   const posterName   = live.name      || job.posterName;
//   const posterHandle = live.handle    || job.posterHandle;
//   const posterPath   = live.profilePath || job.posterProfilePath;
//
//   `live` returns nulls until the lookup resolves, and remains null for
//   business/artist-owned jobs (we don't override those — the server join
//   is already the source of truth and entity identity shouldn't be
//   replaced with the owner user's identity).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import axios from "../../../api/axiosInstance";

const api = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

// Process-wide cache keyed by numeric user id.
// Values:  { avatarUrl, name, handle, profilePath }  |  null on confirmed miss
// Pending: Promise  (dedupes concurrent requests for the same id)
const profileCache = new Map();
const inflight = new Map();

async function fetchPublicProfile(userId) {
    const id = Number(userId);
    if (!Number.isFinite(id) || id <= 0) return null;

    if (profileCache.has(id)) return profileCache.get(id);
    if (inflight.has(id)) return inflight.get(id);

    const urls = [
        `${api}/users/public/${id}`,
        `/users/public/${id}`,
        `/api/users/public/${id}`,
    ].filter(Boolean);

    const p = (async () => {
        for (const url of urls) {
            try {
                // eslint-disable-next-line no-await-in-loop
                const res = await axios.get(url, { withCredentials: true, timeout: 8000 });
                const profile = res?.data?.profile || res?.data?.user || res?.data;
                if (!profile) continue;

                const handle = String(profile.handle || "").trim();
                const first = String(profile.first_name || "").trim();
                const last = String(profile.last_name || "").trim();
                const name = `${first} ${last}`.trim() || handle || null;
                // Server already hydrates profile_picture to a signed URL for us.
                const avatarUrl =
                    String(profile.profile_picture || profile.avatar_url || "").trim() || null;

                const entry = {
                    avatarUrl,
                    name,
                    handle: handle || null,
                    profilePath: handle ? `/${handle}` : null,
                };
                profileCache.set(id, entry);
                return entry;
            } catch {
                // try next URL
            }
        }
        // All attempts failed — cache the miss for a short period to prevent
        // hammering the endpoint, but don't cache forever: clear after 30s so a
        // transient error recovers.
        profileCache.set(id, null);
        setTimeout(() => {
            if (profileCache.get(id) === null) profileCache.delete(id);
        }, 30000);
        return null;
    })();

    inflight.set(id, p);
    try {
        return await p;
    } finally {
        inflight.delete(id);
    }
}

/**
 * Returns live poster data for a job row.
 *
 * Only resolves for jobs that are personally owned (no business_id / artist_id).
 * For business/artist jobs we return an empty object — the server-side join
 * for those is already the source of truth and the entity identity should
 * NOT be replaced with the owner's identity.
 *
 * Shape:
 *   { avatarUrl, name, handle, profilePath }   all nullable
 */
export default function useLivePoster(job) {
    const ownerType = String(job?.ownerType || job?.owner_type || "").toLowerCase();
    const businessId = Number(job?.businessId || job?.business_id || 0);
    const artistId = Number(job?.artistId || job?.artist_id || 0);
    const isEntityOwned = ownerType === "business" || businessId > 0 || artistId > 0;

    const posterUserId = Number(
        job?.posterUserId || job?.createdByUserId || job?.created_by_user_id || 0
    );

    const shouldLookUp = !isEntityOwned && posterUserId > 0;

    const [live, setLive] = useState(() =>
        shouldLookUp ? profileCache.get(posterUserId) || null : null
    );

    useEffect(() => {
        if (!shouldLookUp) {
            setLive(null);
            return undefined;
        }

        // If cache already has a hit, use it synchronously.
        const cached = profileCache.get(posterUserId);
        if (cached !== undefined) {
            setLive(cached || null);
            // Cache may hold null (confirmed miss) — treat that as "no override".
            if (cached) return undefined;
        }

        let cancelled = false;
        fetchPublicProfile(posterUserId).then((result) => {
            if (cancelled) return;
            setLive(result || null);
        });

        return () => {
            cancelled = true;
        };
    }, [shouldLookUp, posterUserId]);

    return live || { avatarUrl: null, name: null, handle: null, profilePath: null };
}

/**
 * Imperatively clear a user's cached profile — useful when the viewer edits
 * their own profile and wants all surfaces to re-fetch on next render.
 * Wire this to the same event your profile-edit flow already dispatches.
 */
export function invalidateLivePoster(userId) {
    const id = Number(userId);
    if (!Number.isFinite(id) || id <= 0) return;
    profileCache.delete(id);
    inflight.delete(id);
}

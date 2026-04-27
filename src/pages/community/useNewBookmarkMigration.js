// src/pages/community/useNewsBookmarkMigration.js
//
// One-shot hook: when a user signs in and there are bookmarks in
// localStorage, upload them to the server via POST /bookmarks/merge and
// then clear local storage.
//
// Where to mount:
//   Call this hook at the app root (or CommunityPage, or anywhere that
//   stays mounted across auth changes). It's defensive about when to
//   act — runs exactly once per viewer id per browser tab session and
//   skips silently if there's nothing to migrate or the feature is off.
//
// The hook is intentionally "fire and forget" from the UI's perspective:
//   - It doesn't show progress.
//   - It doesn't block rendering.
//   - On success, local storage is cleared and the remote cache is
//     reset so the next bookmark read pulls the merged set fresh.
//   - On failure, local storage is KEPT so we can retry on the next
//     session.

import { useEffect, useRef } from 'react';
import { secureFetch } from '../../utils/secureFetch';
import { isFeatureEnabled, resetRemoteCache } from './useNewsBookmark';

const STORAGE_KEY = 'll:newsBookmarks:v1';
const MIGRATION_FLAG_PREFIX = 'll:newsBookmarks:migrated:v1:';

function readLocalIds() {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map((v) => Number(v)).filter((n) => n > 0) : [];
    } catch {
        return [];
    }
}

function clearLocal() {
    if (typeof window === 'undefined') return;
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

function hasAlreadyMigrated(viewerId) {
    if (typeof window === 'undefined') return false;
    try {
        return window.localStorage.getItem(`${MIGRATION_FLAG_PREFIX}${viewerId}`) === '1';
    } catch {
        return false;
    }
}

function markMigrated(viewerId) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(`${MIGRATION_FLAG_PREFIX}${viewerId}`, '1');
    } catch { /* ignore */ }
}

/**
 * Run the localStorage → server bookmark migration for the given viewer.
 * Safe to call on every render — has internal guards to ensure it only
 * actually runs once per viewer per tab session.
 */
export default function useNewsBookmarkMigration(viewer) {
    const ranRef = useRef(false);
    const viewerId = viewer?.id != null ? String(viewer.id) : null;

    useEffect(() => {
        if (!isFeatureEnabled()) return;
        if (!viewerId) return;
        if (ranRef.current) return;
        if (hasAlreadyMigrated(viewerId)) return;

        const ids = readLocalIds();
        if (ids.length === 0) {
            // Nothing to migrate — still mark to avoid re-checking every
            // tab session.
            markMigrated(viewerId);
            ranRef.current = true;
            return;
        }

        ranRef.current = true;
        (async () => {
            try {
                const res = await secureFetch('/api/community/news/bookmarks/merge', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ articleIds: ids }),
                });
                if (!res.ok) {
                    // Keep local data for next-session retry. Reset our
                    // in-session run flag so a later mount can try again.
                    ranRef.current = false;
                    return;
                }
                // Merge succeeded — clear local set and invalidate the
                // remote cache so the next read gets the canonical list.
                clearLocal();
                resetRemoteCache();
                markMigrated(viewerId);
            } catch {
                // Network error — keep local, allow retry.
                ranRef.current = false;
            }
        })();
    }, [viewerId]);
}

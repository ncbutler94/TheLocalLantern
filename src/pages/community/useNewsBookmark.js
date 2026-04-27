// src/pages/community/useNewsBookmark.js
//
// Bookmark state for news articles.
//
// ─────────────────────────────────────────────────────────────────────
// Feature flag
// ─────────────────────────────────────────────────────────────────────
// The bookmark UI is gated on FEATURE_NEWS_BOOKMARKS. When false:
//   - useNewsBookmark still runs, but isBookmarked is always false
//     and toggle() is a no-op. Cards and the detail panel check
//     isFeatureEnabled() before rendering the bookmark buttons.
//   - This lets us ship slice 1's card/panel redesign without the
//     bookmark UI until slice 2's backend is in place.
// ─────────────────────────────────────────────────────────────────────
//
// ─────────────────────────────────────────────────────────────────────
// Storage strategy
// ─────────────────────────────────────────────────────────────────────
// Signed-in users: bookmarks live server-side in news_bookmarks.
//   - On first use in a session, we hydrate a viewer-scoped Set of IDs
//     from GET /api/community/news/bookmarks (just the IDs, not full
//     articles — very cheap).
//   - toggle() does an optimistic update, then a POST/DELETE. If the
//     server rejects, we roll back and broadcast the rollback.
//
// Signed-out users: bookmarks live in localStorage (same as slice 1).
//   - Slice 1 behavior preserved so pre-auth bookmarking keeps working.
//   - On sign-in, useNewsBookmarkMigration picks these up and uploads
//     via POST /api/community/news/bookmarks/merge (see that hook).
//
// Both paths emit the same window event (`ll:newsBookmarks:changed`)
// so every card and panel component stays in sync regardless of where
// the toggle happened.
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import { secureFetch } from '../../utils/secureFetch';

/* ─────────────────────────── feature flag ─────────────────────────── */

/**
 * Flip to true once the backend migration has run and the routes are
 * deployed. Tested independently of the card/panel UI rollout.
 *
 * Reads from window.__LL_FEATURES__.news_bookmarks if present (so QA
 * can flip it at runtime in the console); otherwise falls back to the
 * compile-time default below.
 */
const DEFAULT_FEATURE_ENABLED = true;

export function isFeatureEnabled() {
    if (typeof window === 'undefined') return DEFAULT_FEATURE_ENABLED;
    const runtime = window.__LL_FEATURES__?.news_bookmarks;
    if (typeof runtime === 'boolean') return runtime;
    return DEFAULT_FEATURE_ENABLED;
}

/* ─────────────────────────── local storage ─────────────────────────── */

const STORAGE_KEY = 'll:newsBookmarks:v1';
const EVENT_NAME = 'll:newsBookmarks:changed';

function safeRead() {
    if (typeof window === 'undefined') return new Set();
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return new Set();
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return new Set();
        return new Set(parsed.map((v) => String(v)));
    } catch {
        return new Set();
    }
}

function safeWrite(set) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
    } catch {
        // quota / private mode — silently swallow
    }
}

function broadcast(articleId, bookmarked, source = 'local') {
    if (typeof window === 'undefined') return;
    try {
        window.dispatchEvent(
            new CustomEvent(EVENT_NAME, {
                detail: { articleId: String(articleId), bookmarked, source },
            })
        );
    } catch {
        // ignore — very old browsers
    }
}

/* ─────────────────────────── remote cache ─────────────────────────── */

// In-memory cache of the signed-in user's bookmark set. Hydrated on first
// hook use; invalidated on sign-out and whenever the server returns an
// authoritative bookmark list (e.g., the Bookmarks view).
//
// This cache is per-browser-tab — if the user opens a second tab, that
// tab will hydrate its own cache via the initial GET, and the window
// event will keep them in sync after toggles.
let remoteCache = null; // Set<string> | null
let remoteCacheHydrating = null; // Promise | null (request in flight)

export function resetRemoteCache() {
    remoteCache = null;
    remoteCacheHydrating = null;
}

/**
 * Fetch the viewer's bookmark IDs. Returns a Set of string IDs.
 * Deduped via `remoteCacheHydrating` so concurrent mounts share one request.
 */
async function hydrateRemoteCache() {
    if (remoteCache) return remoteCache;
    if (remoteCacheHydrating) return remoteCacheHydrating;

    remoteCacheHydrating = (async () => {
        try {
            // The list endpoint returns full articles. For bookmark
            // state we only need IDs, but the backend doesn't have a
            // dedicated /ids endpoint and adding one for a few hundred
            // rows isn't worth it. We just take the ids from the full
            // response — the page size is capped server-side at 100.
            //
            // If a user ever has >100 bookmarks, the bookmark-state
            // hook would miss the oldest ones' state. That's unlikely
            // for the intended use case (personal reading list) but if
            // you hit it, add a `?fields=ids` variant to the endpoint.
            const res = await secureFetch('/api/community/news/bookmarks?limit=100', {
                credentials: 'include',
            });
            if (!res.ok) {
                // 401 = signed-out; other errors = treat as empty cache
                // and let the next attempt retry.
                remoteCache = new Set();
                return remoteCache;
            }
            const data = await res.json();
            const ids = Array.isArray(data?.articles)
                ? data.articles.map((a) => String(a.id))
                : [];
            remoteCache = new Set(ids);
            return remoteCache;
        } catch {
            remoteCache = new Set();
            return remoteCache;
        } finally {
            remoteCacheHydrating = null;
        }
    })();

    return remoteCacheHydrating;
}

/* ─────────────────────────── public helpers ─────────────────────────── */

export function getBookmarkedIds() {
    // Prefer remote cache when available (signed-in), else local.
    if (remoteCache) return Array.from(remoteCache);
    return Array.from(safeRead());
}

export function isArticleBookmarked(id) {
    if (id == null) return false;
    const key = String(id);
    if (remoteCache) return remoteCache.has(key);
    return safeRead().has(key);
}

export function onBookmarksChanged(handler) {
    if (typeof window === 'undefined' || typeof handler !== 'function') {
        return () => { /* noop */ };
    }
    const wrapped = (e) => handler(e.detail || {});
    window.addEventListener(EVENT_NAME, wrapped);
    const storageHandler = (e) => {
        if (e.key === STORAGE_KEY) handler({ articleId: null, bookmarked: null });
    };
    window.addEventListener('storage', storageHandler);
    return () => {
        window.removeEventListener(EVENT_NAME, wrapped);
        window.removeEventListener('storage', storageHandler);
    };
}

/* ─────────────────────────── hook ─────────────────────────── */

/**
 * Track bookmark state for a single article. Accepts an optional `viewer`
 * object (same shape the rest of the community code uses — has an `.id`
 * when authenticated). If viewer is null/undefined, falls back to
 * localStorage.
 *
 * @param {string|number|null} articleId
 * @param {{ viewer?: object | null }} [opts]
 */
export default function useNewsBookmark(articleId, opts = {}) {
    const id = articleId != null ? String(articleId) : null;
    const viewerId = opts?.viewer?.id != null ? String(opts.viewer.id) : null;
    const isSignedIn = Boolean(viewerId);
    const featureEnabled = isFeatureEnabled();

    const [isBookmarked, setIsBookmarked] = useState(() => {
        if (!id || !featureEnabled) return false;
        if (isSignedIn && remoteCache) return remoteCache.has(id);
        if (!isSignedIn) return safeRead().has(id);
        return false; // signed in but cache not hydrated yet
    });

    // Track which viewer this hook instance is locked to; a sign-in/out
    // during the hook's lifetime reseeds state from the correct source.
    const lastViewerRef = useRef(viewerId);

    // Hydrate remote cache on mount if signed in and no cache yet.
    useEffect(() => {
        if (!featureEnabled || !id || !isSignedIn) return;
        let cancelled = false;
        hydrateRemoteCache().then((cache) => {
            if (cancelled) return;
            setIsBookmarked(cache.has(id));
        });
        return () => {
            cancelled = true;
        };
    }, [featureEnabled, id, isSignedIn]);

    // Reseed state when the viewer identity changes (sign-in/out/switch).
    useEffect(() => {
        if (lastViewerRef.current === viewerId) return;
        lastViewerRef.current = viewerId;
        if (!id || !featureEnabled) {
            setIsBookmarked(false);
            return;
        }
        if (isSignedIn) {
            // After a sign-in, remote cache is stale; clear it so the
            // next read hydrates fresh.
            resetRemoteCache();
            hydrateRemoteCache().then((cache) => setIsBookmarked(cache.has(id)));
        } else {
            // Signed out: read from localStorage.
            setIsBookmarked(safeRead().has(id));
        }
    }, [id, isSignedIn, viewerId, featureEnabled]);

    // Listen for cross-component changes.
    useEffect(() => {
        if (!id || !featureEnabled) return undefined;
        const unsubscribe = onBookmarksChanged((detail) => {
            if (detail.articleId == null) {
                // Bulk change — re-read from the active source.
                if (isSignedIn) {
                    setIsBookmarked(Boolean(remoteCache?.has(id)));
                } else {
                    setIsBookmarked(safeRead().has(id));
                }
                return;
            }
            if (String(detail.articleId) === id) {
                setIsBookmarked(Boolean(detail.bookmarked));
            }
        });
        return unsubscribe;
    }, [id, featureEnabled, isSignedIn]);

    const [pending, setPending] = useState(false);

    const toggle = useCallback(async () => {
        if (!id || !featureEnabled || pending) return;

        if (!isSignedIn) {
            // Local-only toggle.
            const next = new Set(safeRead());
            let nowBookmarked;
            if (next.has(id)) {
                next.delete(id);
                nowBookmarked = false;
            } else {
                next.add(id);
                nowBookmarked = true;
            }
            safeWrite(next);
            setIsBookmarked(nowBookmarked);
            broadcast(id, nowBookmarked, 'local');
            return;
        }

        // Signed-in path — optimistic update then server call.
        const prev = isBookmarked;
        const next = !prev;

        // Optimistic update
        setIsBookmarked(next);
        setPending(true);
        if (!remoteCache) remoteCache = new Set();
        if (next) remoteCache.add(id); else remoteCache.delete(id);
        broadcast(id, next, 'remote-optimistic');

        try {
            const url = `/api/community/news/article/${encodeURIComponent(id)}/bookmark`;
            const res = await secureFetch(url, {
                method: next ? 'POST' : 'DELETE',
                credentials: 'include',
                headers: next ? { 'Content-Type': 'application/json' } : undefined,
                body: next ? JSON.stringify({}) : undefined,
            });

            if (!res.ok) {
                // Roll back.
                setIsBookmarked(prev);
                if (prev) remoteCache.add(id); else remoteCache.delete(id);
                broadcast(id, prev, 'remote-rollback');
                return;
            }
            // Server confirmed — broadcast the canonical state. (Most
            // listeners already updated on the optimistic broadcast;
            // this second event is a no-op for matching state.)
            broadcast(id, next, 'remote-confirmed');
        } catch {
            // Network error — roll back.
            setIsBookmarked(prev);
            if (prev) remoteCache.add(id); else remoteCache.delete(id);
            broadcast(id, prev, 'remote-rollback');
        } finally {
            setPending(false);
        }
    }, [id, featureEnabled, isSignedIn, isBookmarked, pending]);

    return {
        isBookmarked: featureEnabled ? isBookmarked : false,
        toggle,
        loading: pending,
        featureEnabled,
    };
}

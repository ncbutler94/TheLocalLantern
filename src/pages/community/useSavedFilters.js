// src/pages/community/useSavedFilters.js
//
// Saved filters hook — slice 3 of the community revamp.
//
// One hook per tab. The consumer passes `tab` (one of 'posts', 'groups',
// 'news') and gets back:
//
//   filters       — array of saved filters for this tab, defaults first
//   defaultFilter — the default filter for this tab (or null)
//   loading       — initial fetch state
//   error         — string or null
//
//   refresh()           — re-fetch
//   saveNew(input)      — create a new saved filter
//   update(id, input)   — update an existing one
//   remove(id)          — delete
//   setDefault(id, on)  — shortcut to toggle default
//
// The hook is lazy about auth: if the viewer is null, it returns empty
// state and never fetches. It listens for cross-tab save/delete events
// so if a filter is created in one browser tab, other tabs see it.

import { useCallback, useEffect, useRef, useState } from 'react';
import { secureFetch } from '../../utils/secureFetch';

const BASE = '/api/community/saved-filters';
const EVENT_NAME = 'll:savedFilters:changed';

function broadcast(tab, detail = {}) {
    if (typeof window === 'undefined') return;
    try {
        window.dispatchEvent(
            new CustomEvent(EVENT_NAME, { detail: { tab, ...detail } })
        );
    } catch { /* ignore */ }
}

export default function useSavedFilters({ tab, viewer } = {}) {
    const viewerId = viewer?.id != null ? String(viewer.id) : null;
    const isSignedIn = Boolean(viewerId);

    const [filters, setFilters] = useState([]);
    const [defaultFilter, setDefaultFilter] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const abortRef = useRef(null);

    const refresh = useCallback(async () => {
        if (!tab || !isSignedIn) {
            setFilters([]);
            setDefaultFilter(null);
            setLoading(false);
            return;
        }

        if (abortRef.current) {
            try { abortRef.current.abort(); } catch { /* ignore */ }
        }
        const ac = new AbortController();
        abortRef.current = ac;

        setLoading(true);
        setError(null);

        try {
            const res = await secureFetch(`${BASE}?tab=${encodeURIComponent(tab)}`, {
                credentials: 'include',
                signal: ac.signal,
            });
            if (!res.ok) {
                // 401 = not signed in (race with auth) — treat as empty
                if (res.status === 401) {
                    setFilters([]);
                    setDefaultFilter(null);
                    setError(null);
                    return;
                }
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.message || `Request failed (${res.status})`);
            }
            const data = await res.json();
            const list = Array.isArray(data?.filters) ? data.filters : [];
            setFilters(list);
            setDefaultFilter(list.find((f) => f.is_default) || null);
        } catch (err) {
            if (err.name === 'AbortError') return;
            // Log the raw backend message for debugging, but show the user
            // a neutral message — backend validators sometimes return
            // domain-irrelevant strings (e.g. "Invalid post id") and we
            // don't want those surfacing in the saved-filters menu.
            if (typeof console !== 'undefined' && console.warn) {
                console.warn('[savedFilters] list failed:', err.message);
            }
            setError('Could not load saved filters.');
        } finally {
            setLoading(false);
        }
    }, [tab, isSignedIn]);

    // Initial load + re-load when tab or viewer changes.
    useEffect(() => {
        void refresh();
        return () => {
            if (abortRef.current) {
                try { abortRef.current.abort(); } catch { /* ignore */ }
            }
        };
    }, [refresh]);

    // Cross-tab sync: when another mount broadcasts a change for our
    // tab, re-fetch.
    useEffect(() => {
        if (!tab || !isSignedIn) return undefined;
        const handler = (e) => {
            if (e?.detail?.tab === tab) void refresh();
        };
        window.addEventListener(EVENT_NAME, handler);
        return () => window.removeEventListener(EVENT_NAME, handler);
    }, [tab, isSignedIn, refresh]);

    /* ─────────────── mutations ─────────────── */

    const saveNew = useCallback(
        async ({ name, payload, isDefault = false }) => {
            if (!tab) throw new Error('Tab is required');
            const res = await secureFetch(BASE, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tab,
                    name: String(name || '').trim(),
                    payload: payload || {},
                    isDefault: Boolean(isDefault),
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg = data?.message || `Request failed (${res.status})`;
                const err = new Error(msg);
                err.status = res.status;
                throw err;
            }
            await refresh();
            broadcast(tab, { op: 'create', id: data?.filter?.id });
            return data?.filter || null;
        },
        [tab, refresh]
    );

    const update = useCallback(
        async (id, input) => {
            const res = await secureFetch(`${BASE}/${encodeURIComponent(id)}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input || {}),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const err = new Error(data?.message || `Request failed (${res.status})`);
                err.status = res.status;
                throw err;
            }
            await refresh();
            broadcast(tab, { op: 'update', id });
            return data?.filter || null;
        },
        [tab, refresh]
    );

    const remove = useCallback(
        async (id) => {
            const res = await secureFetch(`${BASE}/${encodeURIComponent(id)}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                const err = new Error(body?.message || `Request failed (${res.status})`);
                err.status = res.status;
                throw err;
            }
            await refresh();
            broadcast(tab, { op: 'delete', id });
        },
        [tab, refresh]
    );

    const setDefault = useCallback(
        async (id, on = true) => update(id, { isDefault: Boolean(on) }),
        [update]
    );

    return {
        filters,
        defaultFilter,
        loading,
        error,
        refresh,
        saveNew,
        update,
        remove,
        setDefault,
    };
}

// src/pages/community/useNewsArticles.js
//
// News fetching hook. Lazy, debounced, abortable.
//
// Slice 2 addition: `view` parameter.
//   - view='all' (default)  → /api/community/news (existing scoped list)
//   - view='bookmarks'      → /api/community/news/bookmarks (viewer's saved)
//
// When view='bookmarks':
//   - city/county/dateRange are ignored (the Bookmarks view is viewer-
//     scoped and cross-geographic by design — it's a reading list, not
//     a feed). Category and search still apply.
//   - The hook does nothing when the viewer is signed out — the caller
//     (CommunityFilter / CommunityPage) should hide the Bookmarks option
//     from the View dropdown for signed-out users.

import { useCallback, useEffect, useRef, useState } from 'react';
import { secureFetch } from '../../utils/secureFetch';

function buildScope({ selectedCity, selectedCounty }) {
    const city = String(selectedCity || '').trim();
    const county = String(selectedCounty || '').trim();
    const isStatewideCity = !city || /^(all\s*cities|statewide)$/i.test(city);
    const isStatewideCounty = !county || /^(all\s*counties|statewide)$/i.test(county);
    if (!isStatewideCity) return { scope: 'city', key: city, label: `${city}, AL` };
    if (!isStatewideCounty) return { scope: 'county', key: county, label: `${county} County, AL` };
    return { scope: 'alabama', key: '', label: 'Alabama' };
}

export default function useNewsArticles({
                                            enabled = false,
                                            selectedCity = '',
                                            selectedCounty = '',
                                            newsCategory = 'all',
                                            newsDateRange = 'week',
                                            newsView = 'all',
                                            searchQuery = '',
                                            searchDebounceMs = 400,
                                        } = {}) {
    const abortRef = useRef(null);
    const debounceTimerRef = useRef(null);

    const [state, setState] = useState({
        loading: false,
        articles: [],
        error: null,
        status: null,
        lastFetchedAt: null,
        message: null,
        scopeLabel: '',
    });

    const doFetch = useCallback(
        async (view, scope, key, category, search, dateRange) => {
            if (abortRef.current) {
                try { abortRef.current.abort(); } catch { /* ignore */ }
            }
            const ac = new AbortController();
            abortRef.current = ac;

            setState((s) => ({ ...s, loading: true, error: null }));

            // Two endpoints, one hook.
            let url;
            if (view === 'bookmarks') {
                const params = new URLSearchParams();
                if (category && category !== 'all') params.set('category', category);
                if (search) params.set('search', search);
                params.set('limit', '50');
                const qs = params.toString();
                url = `/api/community/news/bookmarks${qs ? `?${qs}` : ''}`;
            } else {
                const params = new URLSearchParams({ scope });
                if (key) params.set('key', key);
                if (category && category !== 'all') params.set('category', category);
                if (search) params.set('search', search);
                if (dateRange && dateRange !== 'week') params.set('dateRange', dateRange);
                url = `/api/community/news?${params.toString()}`;
            }

            try {
                const res = await secureFetch(url, {
                    credentials: 'include',
                    signal: ac.signal,
                });

                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    // 401 on bookmarks = viewer is signed out; render as
                    // a soft empty state rather than an error banner.
                    if (view === 'bookmarks' && res.status === 401) {
                        setState((s) => ({
                            ...s,
                            loading: false,
                            articles: [],
                            error: null,
                            status: 'signed_out',
                            message: 'Sign in to see your bookmarked articles.',
                        }));
                        return;
                    }
                    throw new Error(body?.message || `Request failed (${res.status})`);
                }

                const data = await res.json();
                setState((s) => ({
                    ...s,
                    loading: false,
                    articles: Array.isArray(data.articles) ? data.articles : [],
                    error: null,
                    status: data.status || null,
                    lastFetchedAt: data.last_fetched_at || null,
                    message: data.message || null,
                }));
            } catch (err) {
                if (err.name === 'AbortError') return;
                setState((s) => ({
                    ...s,
                    loading: false,
                    error: err.message || 'Could not load news.',
                }));
            }
        },
        []
    );

    useEffect(() => {
        if (!enabled) return undefined;

        const { scope, key, label } = buildScope({ selectedCity, selectedCounty });
        // Override label for the Bookmarks view so the filter bar can
        // show "Your Bookmarks" (or whatever the consumer picks from
        // state.scopeLabel) instead of the geographic label.
        const scopeLabel = newsView === 'bookmarks' ? 'Your Bookmarks' : label;
        setState((s) => ({ ...s, scopeLabel }));

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }

        debounceTimerRef.current = setTimeout(() => {
            debounceTimerRef.current = null;
            void doFetch(
                newsView,
                scope,
                key,
                newsCategory,
                String(searchQuery || '').trim(),
                newsDateRange
            );
        }, searchQuery ? searchDebounceMs : 0);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
        };
    }, [enabled, newsView, selectedCity, selectedCounty, newsCategory, newsDateRange, searchQuery, searchDebounceMs, doFetch]);

    // Listen for bookmark changes so the Bookmarks view stays in sync
    // when a user toggles a bookmark on from a card/detail panel.
    useEffect(() => {
        if (!enabled || newsView !== 'bookmarks') return undefined;
        const handler = () => {
            const { scope, key } = buildScope({ selectedCity, selectedCounty });
            void doFetch('bookmarks', scope, key, newsCategory, String(searchQuery || '').trim(), newsDateRange);
        };
        window.addEventListener('ll:newsBookmarks:changed', handler);
        return () => window.removeEventListener('ll:newsBookmarks:changed', handler);
    }, [enabled, newsView, selectedCity, selectedCounty, newsCategory, newsDateRange, searchQuery, doFetch]);

    useEffect(() => () => {
        if (abortRef.current) {
            try { abortRef.current.abort(); } catch { /* ignore */ }
        }
    }, []);

    const refresh = useCallback(() => {
        const { scope, key } = buildScope({ selectedCity, selectedCounty });
        void doFetch(
            newsView,
            scope,
            key,
            newsCategory,
            String(searchQuery || '').trim(),
            newsDateRange
        );
    }, [doFetch, newsView, selectedCity, selectedCounty, newsCategory, newsDateRange, searchQuery]);

    return { ...state, refresh };
}

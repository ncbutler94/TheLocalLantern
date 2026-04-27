// src/pages/community/useNewsArticleDetail.js
//
// Slice 2c — small hook for the news article detail panel.
//
// Fetches /api/community/news/article/:id (a Slice 2a endpoint) with
// credentials so the response includes viewer_liked, viewer_reposted,
// likes_count, reposts_count, comments_count when the user is signed in.
//
// Behavior:
//   • Lazy — only fetches when `articleId` is truthy
//   • Re-fetches on articleId change (e.g., user selects a different article)
//   • Refresh key: bumping `refreshKey` triggers a re-fetch without
//     requiring the articleId to change (e.g., after a comment is posted
//     and we want comments_count to update)
//   • Seeds from `initialArticle` (the list-view object) so the panel can
//     render immediately while the enriched payload is loading
//   • Aborts in-flight requests when params change / component unmounts

import { useCallback, useEffect, useRef, useState } from 'react';
import { secureFetch } from '../../../utils/secureFetch';

export default function useNewsArticleDetail({
                                                 articleId = null,
                                                 initialArticle = null,
                                                 refreshKey = 0,
                                             } = {}) {
    const abortRef = useRef(null);

    // Start with the list-view article (if provided) so the panel has
    // something to render on first paint. The enriched payload replaces
    // this as soon as the fetch resolves.
    const [state, setState] = useState({
        loading: Boolean(articleId),
        article: initialArticle || null,
        error: null,
    });

    const doFetch = useCallback(
        async (id) => {
            if (!id) return;

            // Abort any in-flight fetch for a previous article.
            if (abortRef.current) {
                try { abortRef.current.abort(); } catch { /* ignore */ }
            }
            const ac = new AbortController();
            abortRef.current = ac;

            setState((s) => ({ ...s, loading: true, error: null }));

            try {
                const res = await secureFetch(
                    `/api/community/news/article/${encodeURIComponent(id)}`,
                    { credentials: 'include', signal: ac.signal }
                );

                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body?.message || `Request failed (${res.status})`);
                }

                const data = await res.json();
                const article = data?.article || null;

                setState({
                    loading: false,
                    article,
                    error: article ? null : 'Article not found.',
                });
            } catch (err) {
                if (err?.name === 'AbortError') return;
                setState((s) => ({
                    ...s,
                    loading: false,
                    error: err?.message || 'Could not load article.',
                }));
            }
        },
        []
    );

    // Fetch when articleId changes OR when refreshKey bumps.
    useEffect(() => {
        if (articleId) {
            void doFetch(articleId);
        } else {
            // No id — reset to empty state (or fall back to seed).
            setState({ loading: false, article: initialArticle || null, error: null });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [articleId, refreshKey, doFetch]);

    // If the parent hands us a new initialArticle (e.g., user clicks a
    // different card on the list before the fetch settles), reflect that
    // optimistically without waiting for the request.
    useEffect(() => {
        if (initialArticle && (!state.article || state.article.id !== initialArticle.id)) {
            setState((s) => ({
                ...s,
                article: initialArticle,
                // If we're already loading for this id, keep the loading flag
                loading: Boolean(articleId) && s.loading,
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialArticle?.id]);

    // Cleanup on unmount
    useEffect(
        () => () => {
            if (abortRef.current) {
                try { abortRef.current.abort(); } catch { /* ignore */ }
            }
        },
        []
    );

    // Imperative refetch if the consumer wants to trigger without a refreshKey bump
    const refetch = useCallback(() => {
        if (articleId) void doFetch(articleId);
    }, [articleId, doFetch]);

    return {
        ...state,
        refetch,
    };
}

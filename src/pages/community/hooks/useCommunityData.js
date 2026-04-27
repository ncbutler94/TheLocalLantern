import { secureFetch } from '../../../utils/secureFetch';
// src/hooks/community/useCommunityData.js
import { useCallback, useEffect, useRef, useState } from 'react';

// ── Stable constant: extracted outside component to prevent infinite re-render loops. ──
// Creating this object inside the component body would produce a new reference on every
// render; if that reference is used in a useEffect dependency or compared via Object.is,
// it causes an infinite setState→render→effect→setState loop.
const EMPTY_GEOJSON = Object.freeze({ type: 'FeatureCollection', features: [] });

/**
 * Fetch community posts + build GeoJSON points for markers.
 *
 * Supports:
 * - view=all|mine|following|trending
 * - subtype (category/subtype filter)
 * - sort=newest|popular|trending|random
 * - randomSeed (stable pseudo-random ordering for paging when sort=random)
 * - includeTotal=1 (backend returns X-Total-Count)
 * - activeBusinessId (for business account engagement tracking)
 *
 * UPDATE: When view=trending, fetches from /api/community/trending
 * which uses the improved user-unique engagement scoring algorithm.
 */
export default function useCommunityData({
                                             city = '',
                                             county = '',
                                             counties = null,
                                             search = '',
                                             view = 'all',
                                             subtype = '',
                                             sort = 'newest',
                                             dateRange = 'all',
                                             window: timeWindow = '48h',
                                             limit = 25,
                                             offset = 0,
                                             randomSeed = '',
                                             includeStatewide = true,
                                             activeBusinessId = null,
                                             activeArtistId = null,
                                         } = {}) {
    const [posts, setPosts] = useState([]);
    const [points, setPoints] = useState(EMPTY_GEOJSON);
    const [totalCount, setTotalCount] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const abortRef = useRef(null);

    const normalizeCategory = useCallback((value) => {
        const v = String(value || '').trim().toLowerCase();
        if (v === 'community-chat' || v === 'community_chat' || v === 'community chat') return 'discussion';
        return v;
    }, []);


    const buildPoints = useCallback((items) => {
        const arr = Array.isArray(items) ? items : [];
        const features = arr
            .filter((p) => Number.isFinite(Number(p?.latitude)) && Number.isFinite(Number(p?.longitude)))
            .map((p) => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [Number(p.longitude), Number(p.latitude)],
                },
                properties: {
                    id: p.id,
                    // Keep map marker icon logic compatible with legacy discussion slug.
                    category: (() => {
                        const raw = String(p.category || '').trim().toLowerCase();
                        const normalized = normalizeCategory(raw);
                        return normalized === 'discussion' ? 'community-chat' : normalized;
                    })(),
                },
            }));

        return { type: 'FeatureCollection', features };
    }, [normalizeCategory]);

    const fetchData = useCallback(async () => {
        if (abortRef.current) {
            try {
                abortRef.current.abort();
            } catch {
                // ignore
            }
        }

        const controller = new AbortController();
        abortRef.current = controller;

        setIsLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();

            const v = String(view || 'all').trim().toLowerCase();
            const s = String(sort || 'newest').trim().toLowerCase();
            const st = normalizeCategory(subtype);

            // Determine if this request should go to the dedicated trending endpoint.
            // The trending endpoint uses the improved user-unique scoring algorithm
            // with COUNT(DISTINCT user_id), diversity bonus, and minimum-user threshold.
            const isTrending = v === 'trending' || s === 'trending';

            if (city) params.set('city', String(city).trim());
            // Radius expansion: when `counties` array has >1 entry, send as
            // comma-joined `counties` param so the backend uses IN(...) filtering.
            // Single-county or no-county falls back to the original `county` param.
            const countiesArr = Array.isArray(counties) ? counties.filter(Boolean) : [];
            if (countiesArr.length > 1) {
                params.set('counties', countiesArr.join(','));
            } else if (county) {
                params.set('county', String(county).trim());
            }
            if (st) params.set('subtype', st);
            if (timeWindow) params.set('window', String(timeWindow).trim().toLowerCase());

            if (isTrending) {
                // Trending endpoint: /api/community/trending
                // It handles its own sorting (always by score desc), so we only pass
                // location, subtype, window, limit, offset, and account IDs.
                // NOTE: dateRange is intentionally NOT sent for trending — the `window`
                // parameter (e.g. '48h') is the correct time filter, matching the
                // TrendingSummaryPanel which also only sends window, not dateRange.
            } else {
                // Standard feed endpoint: /api/community
                if (search) params.set('search', String(search).trim());
                if (v) params.set('view', v);
                if (s) params.set('sort', s);
                if (dateRange) params.set('dateRange', String(dateRange).trim().toLowerCase());

                if (s === 'random' && randomSeed) params.set('randomSeed', String(randomSeed));
            }

            params.set('limit', String(Number.isFinite(Number(limit)) ? Number(limit) : 100));
            params.set('offset', String(Number.isFinite(Number(offset)) ? Number(offset) : 0));
            if (includeStatewide) params.set('includeStatewide', '1');

            // Pass activeBusinessId for business account engagement tracking
            if (activeBusinessId && Number.isFinite(Number(activeBusinessId)) && Number(activeBusinessId) > 0) {
                params.set('activeBusinessId', String(activeBusinessId));
            }

            // Pass activeArtistId for artist account engagement tracking
            if (activeArtistId && Number.isFinite(Number(activeArtistId)) && Number(activeArtistId) > 0) {
                params.set('activeArtistId', String(activeArtistId));
            }

            params.set('includeTotal', '1');

            // Route to the correct endpoint
            const endpoint = isTrending
                ? `/api/community/trending?${params.toString()}`
                : `/api/community?${params.toString()}`;

            const res = await secureFetch(endpoint, {
                credentials: 'include',
                cache: 'no-store',
                signal: controller.signal,
            });

            if (!res.ok) {
                let message = '';

                try {
                    const payload = await res.json();
                    message = String(payload?.message || payload?.error || '').trim();
                } catch {
                    message = '';
                }

                setPosts([]);
                setPoints(EMPTY_GEOJSON);
                setTotalCount(null);
                setError(message || 'Failed to fetch');
                setIsLoading(false);
                return;
            }

            const data = await res.json();

            // Backend usually returns an array of posts.
            // Some code paths (e.g., fast-following lite mode with includeTotal=1) return { posts, total, limit, offset }.
            const arrRaw = Array.isArray(data) ? data : (Array.isArray(data?.posts) ? data.posts : []);
            const nowMs = Date.now();

            const isExpiredPublicSafety = (post) => {
                const rawCat = String(post?.category || '').trim().toLowerCase();
                const normalized = normalizeCategory(rawCat);
                const isPublicSafety =
                    normalized === 'public-safety-alerts' ||
                    normalized === 'public_safety_alerts' ||
                    normalized === 'publicsafety' ||
                    normalized === 'public-safety' ||
                    normalized === 'public safety' ||
                    normalized === 'public safety alerts';

                if (!isPublicSafety) return false;

                const expRaw = post?.expires_at ?? post?.expiresAt ?? post?.expires ?? null;
                if (!expRaw) return false;

                const d = new Date(expRaw);
                if (Number.isNaN(d.getTime())) return false;

                return d.getTime() <= nowMs;
            };

            const arr = arrRaw
                .filter((p) => !isExpiredPublicSafety(p))
                .map((p) => {
                    const cat = normalizeCategory(p?.category);
                    return cat && cat !== p?.category ? { ...p, category: cat } : p;
                });
            setPosts(arr);
            setPoints(buildPoints(arr));

            const headerVal = Number(res.headers.get('x-total-count'));
            if (Number.isFinite(headerVal)) {
                setTotalCount(headerVal);
            } else {
                const payloadTotal = Number(data?.total);
                setTotalCount(Number.isFinite(payloadTotal) ? payloadTotal : null);
            }
            setIsLoading(false);
        } catch (err) {
            const aborted = err?.name === 'AbortError';
            if (!aborted) {
                setPosts([]);
                setPoints(EMPTY_GEOJSON);
                setTotalCount(null);
                setError(String(err?.message || '').trim() || 'Failed to fetch');
                setIsLoading(false);
            }
        }
    }, [buildPoints, city, county, counties, dateRange, includeStatewide, limit, offset, randomSeed, search, sort, subtype, view, timeWindow, normalizeCategory, activeBusinessId, activeArtistId]);

    useEffect(() => {
        fetchData();
        return () => {
            if (abortRef.current) {
                try {
                    abortRef.current.abort();
                } catch {
                    // ignore
                }
            }
        };
    }, [fetchData]);

    return { posts, points, totalCount, isLoading, error, refetch: fetchData };
}

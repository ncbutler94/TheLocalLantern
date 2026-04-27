// src/pages/marketplace/hooks/useMarketplaceFeed.js
// Marketplace feed state + loading + pagination + category counts + location counts
//
// Mirrors useServicesFeed pattern EXACTLY:
// - refreshTick drives re-fetch
// - feedDepsKey (string of primitives) is the sole effect dependency
// - fetch function defined INSIDE the effect (closure captures current values)
// - loadMore reads cursor from a ref, filters from latest state
// - refresh() simply bumps refreshTick
//
// INFINITE-LOOP FIX:
// All dependency keys are built from PRIMITIVE values extracted from the
// filters object — never the object reference itself. This prevents the
// "new object on every render" problem where a fresh `{}` reference causes
// useMemo to recompute → new string → effect re-fires → setState → re-render → loop.

import { useCallback, useEffect, useRef, useState } from "react";
import { getListings, getCategoryCounts, getLocationCounts } from "../api/marketplace";

const DEFAULT_LIMIT = 100;
const MIN_REFRESH_MS = 350;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeResponse(data) {
    if (Array.isArray(data)) {
        return { items: data, nextCursor: null, hasMore: false, totalCount: null };
    }
    const items = data?.items || data?.listings || [];
    const nextCursor = data?.nextCursor ?? data?.cursor ?? null;
    let hasMore = Boolean(data?.hasMore);
    if (data?.hasMore === undefined) hasMore = Boolean(nextCursor);
    const totalCount = Number.isFinite(Number(data?.totalCount)) ? Number(data.totalCount) : null;
    return { items: Array.isArray(items) ? items : [], nextCursor, hasMore, totalCount };
}

/**
 * Stable empty object — used as the default when filters is falsy so that
 * we never create a new `{}` on every render (which would bust deps).
 */
const EMPTY_FILTERS = Object.freeze({});

export default function useMarketplaceFeed(filters, options = {}) {
    const limit = Number.isFinite(Number(options.limit)) ? Number(options.limit) : DEFAULT_LIMIT;

    const [items, setItems] = useState([]);
    const [hasMore, setHasMore] = useState(false);
    const [totalCount, setTotalCount] = useState(null);
    const cursorRef = useRef(null);

    const [isLoadingInitial, setIsLoadingInitial] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(null);

    const [categoryCounts, setCategoryCounts] = useState({});
    const [categoryCountsLoading, setCategoryCountsLoading] = useState(false);

    const [locationCounts, setLocationCounts] = useState({ counties: {}, cities: {} });
    const [locationCountsLoading, setLocationCountsLoading] = useState(false);

    const [refreshTick, setRefreshTick] = useState(0);

    // ── Extract primitive filter values to avoid object-reference deps ──
    // This is the KEY fix for the infinite-loop bug: we never put `f` or
    // `filters` in a dependency array. Instead we extract every value we
    // care about as a primitive (string / number / boolean).
    const f = filters && typeof filters === "object" ? filters : EMPTY_FILTERS;

    const fQuery            = String(f.query || "");
    const fSort             = String(f.sort || "newest");
    const fCategory         = String(f.category || "");
    const fCondition        = String(f.condition || "All");
    const fPriceMin         = Number(f.priceMin) || 0;
    const fPriceMax         = Number(f.priceMax) || 10000;
    const fCity             = String(f.city || "");
    const fCounty           = String(f.county || "");
    const fCounties         = Array.isArray(f.counties) ? f.counties.join(",") : "";
    const fIncludeStatewide = Boolean(f.includeStatewide);
    const fStatus           = String(f.status || "available");
    const fPriceModel       = String(f.priceModel || "");
    const fView             = String(f.view || "all");
    const fAccountCacheKey  = String(f.accountCacheKey || "");
    const fExcludeCategory  = String(f.excludeCategory || "");

    // ── Build a stable string key from all filter primitives ──
    // This is the SOLE dependency for the main fetch effect.
    const feedDepsKey = [
        fQuery, fSort, fCategory, fCondition, fPriceMin, fPriceMax,
        fCity, fCounty, fCounties, fIncludeStatewide, fStatus, fPriceModel,
        fView, fAccountCacheKey, fExcludeCategory, refreshTick,
    ].join("|");

    // Category-count deps — exclude category so counts stay stable while browsing
    const categoryDepsKey = [fQuery, fStatus, fCity, fCounty, fIncludeStatewide, fExcludeCategory, refreshTick].join("|");

    // Location-count deps
    const locationDepsKey = [fQuery, fStatus, fCondition, fCounty, refreshTick].join("|");

    // Keep a ref to the latest filters so loadMore can read them
    const filtersRef = useRef(f);
    filtersRef.current = f;

    // ── Main feed fetch ──
    // The async function is defined INSIDE the effect so that the closure
    // captures the current render's values (filters, limit, etc.).
    useEffect(() => {
        const controller = new AbortController();

        async function loadInitial() {
            setIsLoadingInitial(true);
            setIsRefreshing(true);
            setIsLoadingMore(false);
            setError(null);
            cursorRef.current = null;

            const startTs = Date.now();

            try {
                const data = await getListings(
                    {
                        query: fQuery,
                        sort: fSort,
                        category: fCategory,
                        condition: fCondition,
                        priceMin: fPriceMin,
                        priceMax: fPriceMax,
                        city: fCity,
                        county: fCounty,
                        counties: f.counties,
                        includeStatewide: fIncludeStatewide,
                        status: fStatus,
                        priceModel: fPriceModel,
                        view: fView,
                        excludeCategory: fExcludeCategory,
                        cursor: null,
                        limit,
                    },
                    { signal: controller.signal },
                );

                if (controller.signal.aborted) return;

                const normalized = normalizeResponse(data);

                // Minimum shimmer duration
                const elapsed = Date.now() - startTs;
                if (elapsed < MIN_REFRESH_MS) {
                    await sleep(MIN_REFRESH_MS - elapsed);
                }
                if (controller.signal.aborted) return;

                setItems(normalized.items);
                setHasMore(Boolean(normalized.hasMore));
                if (normalized.totalCount !== null) setTotalCount(normalized.totalCount);
                cursorRef.current = normalized.nextCursor || null;
            } catch (err) {
                if (err?.name === "AbortError") return;

                const elapsed = Date.now() - startTs;
                if (elapsed < MIN_REFRESH_MS) {
                    await sleep(MIN_REFRESH_MS - elapsed);
                }
                if (controller.signal.aborted) return;

                setError(err);
                setItems([]);
                setHasMore(false);
                setTotalCount(null);
                cursorRef.current = null;
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoadingInitial(false);
                    setIsRefreshing(false);
                }
            }
        }

        loadInitial();

        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [feedDepsKey]);

    // ── Category counts fetch ──
    useEffect(() => {
        const controller = new AbortController();

        async function loadCounts() {
            setCategoryCountsLoading(true);
            try {
                const data = await getCategoryCounts(
                    {
                        q: fQuery,
                        status: fStatus,
                        city: fCity,
                        county: fCounty,
                        includeStatewide: fIncludeStatewide,
                        excludeCategory: fExcludeCategory,
                    },
                    { signal: controller.signal },
                );

                if (controller.signal.aborted) return;
                const counts = data?.counts && typeof data.counts === "object" ? data.counts : {};
                setCategoryCounts(counts);
            } catch (err) {
                if (err?.name !== "AbortError") setCategoryCounts({});
            } finally {
                if (!controller.signal.aborted) setCategoryCountsLoading(false);
            }
        }

        loadCounts();

        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categoryDepsKey]);

    // ── Location counts fetch ──
    useEffect(() => {
        const controller = new AbortController();

        async function loadLocationCounts() {
            setLocationCountsLoading(true);
            try {
                const data = await getLocationCounts(
                    {
                        q: fQuery,
                        status: fStatus,
                        condition: fCondition,
                        county: fCounty,
                    },
                    { signal: controller.signal },
                );

                if (controller.signal.aborted) return;
                setLocationCounts({
                    counties: data?.counties && typeof data.counties === "object" ? data.counties : {},
                    cities: data?.cities && typeof data.cities === "object" ? data.cities : {},
                });
            } catch (err) {
                if (err?.name !== "AbortError") setLocationCounts({ counties: {}, cities: {} });
            } finally {
                if (!controller.signal.aborted) setLocationCountsLoading(false);
            }
        }

        loadLocationCounts();

        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locationDepsKey]);

    // ── refresh: just bump the tick — the effect does the rest ──
    const refresh = useCallback(() => {
        setRefreshTick((t) => t + 1);
    }, []);

    // ── loadMore: appends next page ──
    // Uses a ref for isLoading guard + cursor, but reads filters from
    // the latest state via filtersRef (same as useServicesFeed.loadMore).
    const isLoadingRef = useRef(false);
    isLoadingRef.current = isLoadingInitial || isLoadingMore || isRefreshing;

    const loadMore = useCallback(async () => {
        if (isLoadingRef.current) return;
        if (!cursorRef.current) return;

        setIsLoadingMore(true);
        setError(null);

        try {
            const currentFilters = filtersRef.current;
            const data = await getListings(
                {
                    query: currentFilters.query || "",
                    sort: currentFilters.sort || "newest",
                    category: currentFilters.category || "",
                    condition: currentFilters.condition || "All",
                    priceMin: Number(currentFilters.priceMin) || 0,
                    priceMax: Number(currentFilters.priceMax) || 10000,
                    city: currentFilters.city || "",
                    county: currentFilters.county || "",
                    counties: currentFilters.counties,
                    includeStatewide: Boolean(currentFilters.includeStatewide),
                    status: currentFilters.status || "available",
                    priceModel: currentFilters.priceModel || "",
                    view: currentFilters.view || "all",
                    excludeCategory: currentFilters.excludeCategory || "",
                    cursor: cursorRef.current,
                    limit,
                },
                {},
            );

            const normalized = normalizeResponse(data);
            setItems((prev) => {
                const seen = new Set(prev.map((p) => String(p.id)));
                const merged = [...prev];
                (normalized.items || []).forEach((n) => {
                    const id = String(n?.id);
                    if (!id || seen.has(id)) return;
                    seen.add(id);
                    merged.push(n);
                });
                return merged;
            });

            setHasMore(Boolean(normalized.hasMore));
            cursorRef.current = normalized.nextCursor || null;
        } catch (err) {
            if (err?.name !== "AbortError") setError(err);
        } finally {
            setIsLoadingMore(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [feedDepsKey, limit]);

    return {
        items,
        error,
        hasMore,
        cursor: cursorRef.current,
        totalCount,

        isLoadingInitial,
        isRefreshing,
        isLoadingMore,

        categoryCounts,
        categoryCountsLoading,

        locationCounts,
        locationCountsLoading,

        refresh,
        loadMore,
    };
}

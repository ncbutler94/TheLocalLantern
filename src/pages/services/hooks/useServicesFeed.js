// src/pages/services/hooks/useServicesFeed.js
//
// Full services feed hook — drives ServicesPage for both "Services" and "Requests" tabs.
//
// Returns the EXACT shape ServicesPage expects:
//   items, isLoading, isEmpty, error, refresh, loadMore, hasMore, totalCount,
//   categories, categoriesLoading,
//   myServices, myServicesLoading, myServicesError, myServicesTotalCount,
//   requestItems, requestsLoading, requestsError, requestsTotalCount,
//   refreshRequests, allRequestItems,
//   updateItemFavorite,
//   locationCounts, locationCountsLoading          ← NEW
//
// INFINITE-LOOP FIX:
// All effect dependency keys are built from PRIMITIVE values extracted from
// the options object — never the object reference itself.

import { useCallback, useEffect, useRef, useState } from "react";
import {
    fetchServicesFeed,
    fetchServiceCategories,
    fetchServiceLocationCounts,
    fetchServiceRequestLocationCounts,
    fetchMyServices,
    fetchServiceRequests,
} from "../api/servicesApi";

const DEFAULT_LIMIT = 25;
const MIN_REFRESH_MS = 350;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeResponse(data) {
    if (Array.isArray(data)) {
        return { items: data, nextCursor: null, hasMore: false, totalCount: null };
    }
    const items = data?.items || [];
    const nextCursor = data?.nextCursor ?? data?.cursor ?? null;
    let hasMore = Boolean(data?.hasMore);
    if (data?.hasMore === undefined) hasMore = Boolean(nextCursor);
    const raw = data?.total ?? data?.totalCount;
    const totalCount = Number.isFinite(Number(raw)) ? Number(raw) : null;
    return { items: Array.isArray(items) ? items : [], nextCursor, hasMore, totalCount };
}

/**
 * Stable empty objects — avoids creating a new `{}` reference on every render
 * which would bust dependency comparisons.
 */
const EMPTY_FILTERS = Object.freeze({});
const EMPTY_REQ_FILTERS = Object.freeze({});

export default function useServicesFeed(options) {
    const o = options && typeof options === "object" ? options : {};

    // ── Extract ALL primitive values from options up-front ──
    const search           = String(o.search || "");
    const sort             = String(o.sort || "any");
    const mode             = String(o.mode || "all");
    const myServicesStatus = String(o.myServicesStatus || "active");
    const serviceView      = String(o.view || "all");
    const accountCacheKey  = String(o.accountCacheKey || "");

    const f = o.filters && typeof o.filters === "object" ? o.filters : EMPTY_FILTERS;
    const fCategory       = String(f.category || "");
    const fPriceModel     = String(f.priceModel || "any");
    const fCity           = String(f.city || "");
    const fCounty         = String(f.county || "");
    const fCounties       = Array.isArray(f.counties) ? f.counties.join(",") : "";
    const fStatewideOnly  = Boolean(f.statewideOnly);

    const requestsView   = String(o.requestsView || "all");
    const requestsSort   = String(o.requestsSort || "newest");
    const requestsSearch = String(o.requestsSearch || "");

    const rf = o.requestsFilters && typeof o.requestsFilters === "object" ? o.requestsFilters : EMPTY_REQ_FILTERS;
    const rfCategory      = String(rf.category || "");
    const rfPriceModel    = String(rf.priceModel || "any");
    const rfCity          = String(rf.city || "");
    const rfCounty        = String(rf.county || "");
    const rfStatewideOnly = Boolean(rf.statewideOnly);
    const rfUrgency       = String(rf.urgency || "");
    const rfBudgetType    = String(rf.budgetType || "");

    // Keep refs to latest filter objects for loadMore closure
    const filtersRef = useRef(f);
    filtersRef.current = f;

    // ── Initial data for back-nav restore (skip first fetch) ──
    const initialItems        = o.initialItems || null;
    const initialTotalCount   = o.initialTotalCount ?? null;
    const initialRequestItems = o.initialRequestItems || null;
    const initialRequestsTotalCount = o.initialRequestsTotalCount ?? null;
    const hasInitialItems    = Array.isArray(initialItems) && initialItems.length > 0;
    const hasInitialRequests = Array.isArray(initialRequestItems) && initialRequestItems.length > 0;

    // ── Build stable string keys from primitives (sole effect deps) ──
    const feedDepsKey = [
        search, sort, fCategory, fPriceModel, fCity, fCounty, fCounties,
        fStatewideOnly, serviceView, accountCacheKey,
    ].join("|");

    const categoryDepsKey = [search, fCity, fCounty, fPriceModel, fStatewideOnly, accountCacheKey].join("|");
    const locationDepsKey = [search, fCategory, fCounty, fCity, fPriceModel, fStatewideOnly, sort, serviceView, accountCacheKey].join("|");
    const myDepsKey       = [myServicesStatus, accountCacheKey].join("|");
    const reqDepsKey      = [
        requestsSearch, requestsSort, rfCategory, rfPriceModel, rfCity, rfCounty,
        rfStatewideOnly, rfUrgency, rfBudgetType, requestsView, accountCacheKey,
    ].join("|");

    // ── State ──
    const [items, setItems]             = useState(() => hasInitialItems ? initialItems : []);
    const [hasMore, setHasMore]         = useState(false);
    const [totalCount, setTotalCount]   = useState(() => initialTotalCount != null && Number.isFinite(Number(initialTotalCount)) ? Number(initialTotalCount) : null);
    const cursorRef                     = useRef(null);
    const [isLoading, setIsLoading]     = useState(() => !hasInitialItems);
    const [error, setError]             = useState(null);

    const [categories, setCategories]           = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);

    const [locationCounts, setLocationCounts]       = useState({ counties: {}, cities: {} });
    const [locationCountsLoading, setLocationCountsLoading] = useState(false);

    const [requestLocationCounts, setRequestLocationCounts] = useState({ counties: {}, cities: {} });
    const [requestLocationCountsLoading, setRequestLocationCountsLoading] = useState(false);

    const [myServices, setMyServices]               = useState([]);
    const [myServicesLoading, setMyServicesLoading] = useState(false);
    const [myServicesError, setMyServicesError]     = useState(null);
    const [myServicesTotalCount, setMyServicesTotalCount] = useState(0);

    const [requestItems, setRequestItems]           = useState(() => hasInitialRequests ? initialRequestItems : []);
    const [allRequestItems, setAllRequestItems]     = useState([]);
    const [requestsLoading, setRequestsLoading]     = useState(() => !hasInitialRequests);
    const [requestsError, setRequestsError]         = useState(null);
    const [requestsTotalCount, setRequestsTotalCount] = useState(() => initialRequestsTotalCount != null && Number.isFinite(Number(initialRequestsTotalCount)) ? Number(initialRequestsTotalCount) : 0);

    const [refreshTick, setRefreshTick]             = useState(0);
    const [reqRefreshTick, setReqRefreshTick]       = useState(0);

    // Skip the initial fetch when restore data was provided
    const skipInitialFeedRef = useRef(hasInitialItems);
    const skipInitialReqRef  = useRef(hasInitialRequests);

    // Computed
    const isEmpty = !isLoading && items.length === 0;

    // ════════════════════════════════════════════════════════════
    // 1) MAIN FEED (services list)
    // ════════════════════════════════════════════════════════════
    useEffect(() => {
        if (skipInitialFeedRef.current) {
            skipInitialFeedRef.current = false;
            return;
        }
        const controller = new AbortController();

        async function load() {
            setIsLoading(true);
            setError(null);
            cursorRef.current = null;

            const startTs = Date.now();

            try {
                const data = await fetchServicesFeed({
                    search,
                    sort,
                    filters: {
                        category: fCategory,
                        priceModel: fPriceModel,
                        city: fCity,
                        county: fCounty,
                        counties: f.counties,
                        statewideOnly: fStatewideOnly,
                        view: serviceView,
                    },
                    limit: DEFAULT_LIMIT,
                    cursor: null,
                    signal: controller.signal,
                });

                if (controller.signal.aborted) return;
                const n = normalizeResponse(data);

                const elapsed = Date.now() - startTs;
                if (elapsed < MIN_REFRESH_MS) await sleep(MIN_REFRESH_MS - elapsed);
                if (controller.signal.aborted) return;

                setItems(n.items);
                setHasMore(Boolean(n.hasMore));
                if (n.totalCount !== null) setTotalCount(n.totalCount);
                cursorRef.current = n.nextCursor || null;
            } catch (err) {
                if (err?.name === "AbortError") return;
                const elapsed = Date.now() - startTs;
                if (elapsed < MIN_REFRESH_MS) await sleep(MIN_REFRESH_MS - elapsed);
                if (controller.signal.aborted) return;
                setError(err);
                setItems([]);
                setHasMore(false);
                setTotalCount(null);
                cursorRef.current = null;
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        }

        load();
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [feedDepsKey, refreshTick]);

    // ════════════════════════════════════════════════════════════
    // 2) CATEGORIES
    // ════════════════════════════════════════════════════════════
    useEffect(() => {
        const controller = new AbortController();

        async function load() {
            setCategoriesLoading(true);
            try {
                const data = await fetchServiceCategories({
                    search,
                    filters: {
                        priceModel: fPriceModel,
                        city: fCity,
                        county: fCounty,
                        counties: f.counties,
                        statewideOnly: fStatewideOnly,
                    },
                });

                if (controller.signal.aborted) return;
                setCategories(Array.isArray(data) ? data : []);
            } catch (err) {
                if (err?.name !== "AbortError") setCategories([]);
            } finally {
                if (!controller.signal.aborted) setCategoriesLoading(false);
            }
        }

        load();
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categoryDepsKey, refreshTick]);

    // ════════════════════════════════════════════════════════════
    // 3) LOCATION COUNTS (new — mirrors marketplace)
    // ════════════════════════════════════════════════════════════
    useEffect(() => {
        const controller = new AbortController();

        async function load() {
            setLocationCountsLoading(true);
            try {
                const data = await fetchServiceLocationCounts(
                    {
                        q: search,
                        category: fCategory,
                        county: fCounty,
                        counties: f.counties,
                        city: fCity,
                        priceModel: fPriceModel,
                        statewideOnly: fStatewideOnly,
                        sort,
                        view: serviceView,
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

        load();
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locationDepsKey, refreshTick]);

    // ════════════════════════════════════════════════════════════
    // 4) MY SERVICES
    // ════════════════════════════════════════════════════════════
    useEffect(() => {
        const controller = new AbortController();

        async function load() {
            setMyServicesLoading(true);
            setMyServicesError(null);
            try {
                const data = await fetchMyServices({
                    status: myServicesStatus,
                    search,
                    filters: {
                        category: fCategory,
                        priceModel: fPriceModel,
                    },
                    signal: controller.signal,
                });
                if (controller.signal.aborted) return;
                const arr = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
                setMyServices(arr);
                setMyServicesTotalCount(data?.total ?? arr.length);
            } catch (err) {
                if (err?.name !== "AbortError") {
                    setMyServicesError(err);
                    setMyServices([]);
                }
            } finally {
                if (!controller.signal.aborted) setMyServicesLoading(false);
            }
        }

        load();
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [myDepsKey, refreshTick]);

    // ════════════════════════════════════════════════════════════
    // 5) SERVICE REQUESTS
    // ════════════════════════════════════════════════════════════
    useEffect(() => {
        if (skipInitialReqRef.current) {
            skipInitialReqRef.current = false;
            return;
        }
        const controller = new AbortController();

        async function load() {
            setRequestsLoading(true);
            setRequestsError(null);
            try {
                const mine = requestsView === "mine";
                const data = await fetchServiceRequests({
                    status: "open",
                    category: rfCategory || undefined,
                    county: rfCounty || undefined,
                    city: rfCity || undefined,
                    statewideOnly: rfStatewideOnly || undefined,
                    urgency: rfUrgency || undefined,
                    budgetType: rfBudgetType || undefined,
                    q: requestsSearch || undefined,
                    sort: requestsSort || "newest",
                    mine: mine || undefined,
                    view: requestsView !== "all" ? requestsView : undefined,
                    limit: 100,
                    signal: controller.signal,
                });
                if (controller.signal.aborted) return;
                const arr = Array.isArray(data?.items) ? data.items : [];
                setRequestItems(arr);
                setRequestsTotalCount(data?.total ?? arr.length);
            } catch (err) {
                if (err?.name !== "AbortError") {
                    setRequestsError(err);
                    setRequestItems([]);
                    setRequestsTotalCount(0);
                }
            } finally {
                if (!controller.signal.aborted) setRequestsLoading(false);
            }
        }

        load();
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reqDepsKey, reqRefreshTick]);

    // 5b) ALL requests (unfiltered by category — for category counts in dropdown)
    // Includes search, sort, view, urgency, budgetType so counts reflect all active filters EXCEPT category.
    const allReqDepsKey = [requestsSearch, requestsSort, requestsView, rfCity, rfCounty, rfStatewideOnly, rfUrgency, rfBudgetType, accountCacheKey].join("|");
    useEffect(() => {
        const controller = new AbortController();

        async function load() {
            try {
                const data = await fetchServiceRequests({
                    q: requestsSearch || undefined,
                    sort: requestsSort || undefined,
                    view: requestsView !== "all" ? requestsView : undefined,
                    status: "open",
                    county: rfCounty || undefined,
                    city: rfCity || undefined,
                    statewideOnly: rfStatewideOnly || undefined,
                    urgency: rfUrgency || undefined,
                    budgetType: rfBudgetType || undefined,
                    limit: 200,
                    signal: controller.signal,
                });
                if (controller.signal.aborted) return;
                setAllRequestItems(Array.isArray(data?.items) ? data.items : []);
            } catch (err) {
                if (err?.name !== "AbortError") setAllRequestItems([]);
            }
        }

        load();
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allReqDepsKey, reqRefreshTick]);

    // ════════════════════════════════════════════════════════════
    // 6) REQUEST LOCATION COUNTS (for requests tab CityCountySelect badges)
    // ════════════════════════════════════════════════════════════
    const reqLocationDepsKey = [requestsSearch, rfCategory, rfCounty, rfCity, rfUrgency, rfBudgetType, requestsSort, requestsView, accountCacheKey].join("|");
    useEffect(() => {
        const controller = new AbortController();

        async function load() {
            setRequestLocationCountsLoading(true);
            try {
                const data = await fetchServiceRequestLocationCounts(
                    {
                        q: requestsSearch,
                        category: rfCategory,
                        county: rfCounty,
                        city: rfCity,
                        urgency: rfUrgency,
                        budgetType: rfBudgetType,
                        status: "open",
                        sort: requestsSort,
                        view: requestsView,
                    },
                    { signal: controller.signal },
                );
                if (controller.signal.aborted) return;
                setRequestLocationCounts({
                    counties: data?.counties && typeof data.counties === "object" ? data.counties : {},
                    cities: data?.cities && typeof data.cities === "object" ? data.cities : {},
                });
            } catch (err) {
                if (err?.name !== "AbortError") setRequestLocationCounts({ counties: {}, cities: {} });
            } finally {
                if (!controller.signal.aborted) setRequestLocationCountsLoading(false);
            }
        }

        load();
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reqLocationDepsKey, reqRefreshTick]);

    // ════════════════════════════════════════════════════════════
    // ACTIONS
    // ════════════════════════════════════════════════════════════

    const refresh = useCallback(() => {
        setRefreshTick((t) => t + 1);
        setReqRefreshTick((t) => t + 1);
    }, []);

    const refreshRequests = useCallback(() => {
        setReqRefreshTick((t) => t + 1);
    }, []);

    // loadMore — appends next page
    const isLoadingRef = useRef(false);
    isLoadingRef.current = isLoading;

    const loadMore = useCallback(async () => {
        if (isLoadingRef.current) return;
        if (!cursorRef.current) return;

        setIsLoading(true);
        setError(null);

        try {
            const currentF = filtersRef.current;
            const data = await fetchServicesFeed({
                search,
                sort,
                filters: {
                    category: currentF.category || "",
                    priceModel: currentF.priceModel || "any",
                    city: currentF.city || "",
                    county: currentF.county || "",
                    counties: currentF.counties,
                    statewideOnly: Boolean(currentF.statewideOnly),
                    view: serviceView,
                },
                limit: DEFAULT_LIMIT,
                cursor: cursorRef.current,
            });

            const n = normalizeResponse(data);
            setItems((prev) => {
                const seen = new Set(prev.map((p) => String(p.id)));
                const merged = [...prev];
                (n.items || []).forEach((item) => {
                    const id = String(item?.id);
                    if (!id || seen.has(id)) return;
                    seen.add(id);
                    merged.push(item);
                });
                return merged;
            });

            setHasMore(Boolean(n.hasMore));
            cursorRef.current = n.nextCursor || null;
        } catch (err) {
            if (err?.name !== "AbortError") setError(err);
        } finally {
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [feedDepsKey]);

    // updateItemFavorite — optimistically update a service card's fav state
    const updateItemFavorite = useCallback((serviceId, patch) => {
        const updater = (prev) =>
            prev.map((item) => {
                if (String(item.id) !== String(serviceId)) return item;
                return {
                    ...item,
                    // Must set ALL three key variants — the backend returns
                    // `isFavorited` and ServiceCard reads via a ?? chain that
                    // picks the first non-null/undefined value. If we only set
                    // `favorited` but `isFavorited: false` already exists on
                    // the object, the card never sees the update.
                    favorited: patch.favorited,
                    isFavorited: patch.favorited,
                    is_favorited: patch.favorited,
                    favoritesCount: patch.favoritesCount,
                    favorites_count: patch.favoritesCount,
                };
            });
        setItems(updater);
        setMyServices(updater);
    }, []);

    // ════════════════════════════════════════════════════════════
    // RETURN — matches the exact interface ServicesPage expects
    // ════════════════════════════════════════════════════════════
    return {
        // Main feed
        items,
        isLoading,
        isEmpty,
        error,
        refresh,
        loadMore,
        hasMore,
        totalCount,

        // Categories
        categories,
        categoriesLoading,

        // Location counts (new — for CityCountySelect badges)
        locationCounts,
        locationCountsLoading,

        // Request location counts (for requests tab CityCountySelect badges)
        requestLocationCounts,
        requestLocationCountsLoading,

        // My services
        myServices,
        myServicesLoading,
        myServicesError,
        myServicesTotalCount,

        // Requests
        requestItems,
        requestsLoading,
        requestsError,
        requestsTotalCount,
        refreshRequests,
        allRequestItems,

        // Optimistic update
        updateItemFavorite,
    };
}

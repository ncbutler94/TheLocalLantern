import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchEventCategoryCounts, fetchEventLocationCounts, fetchEvents } from "../api/eventsApi";

/**
 * useEventsFeed
 * - Centralizes feed state: items, loading, errors, pagination
 * - Provides refresh() and loadMore()
 * - Exposes isLoadingMore for better infinite-scroll UX
 * - Includes a minimum refresh shimmer duration to avoid UI "blink"
 *
 * Adds Community-style startLabel formatting:
 * - Today • 6:00 PM
 * - Tomorrow • 6:00 PM
 * - Sat • 6:00 PM (within next 7 days)
 * - Jan 27 • 6:00 PM (fallback)
 */

const PAGE_SIZE = 50;
const MIN_REFRESH_MS = 350;

const EMPTY_COUNTS = {};

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}


function normalizeAllLabel(value, allLabel) {
    const v = String(value ?? "").trim();
    if (!v) return "";
    if (String(allLabel || "").trim() && v.toLowerCase() === String(allLabel).trim().toLowerCase()) return "";
    // Common fallbacks
    if (v.toLowerCase() === "all cities" || v.toLowerCase() === "all counties") return "";
    return v;
}

function mapFiltersToParams(filters, pageToLoad) {
    const f = filters || {};

    return {
        page: pageToLoad,
        limit: PAGE_SIZE,
        includeTotal: pageToLoad === 1 ? 1 : 0,

        q: f.query || "",
        city: normalizeAllLabel(f.city, "All Cities"),
        county: normalizeAllLabel(f.county, "All Counties"),
        counties: (Array.isArray(f.counties) && f.counties.length > 1) ? f.counties.join(",") : "",
        category: f.category || "",
        subcategory: f.subcategory || "",
        view: f.view || "all",

        includeStatewide: Boolean(f.includeStatewide),

        sort: f.sort || "soonest",
        range: f.datePreset || "month",

        start: f.start || "",
        end: f.end || "",

        // Pass through posterType so callers can scope to artist/business events
        posterType: f.posterType || "",
    };
}

function getYmdInTimeZone(date, timeZone) {
    try {
        const fmt = new Intl.DateTimeFormat("en-US", {
            timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });

        const parts = fmt.formatToParts(date);
        const y = parts.find((p) => p.type === "year")?.value;
        const m = parts.find((p) => p.type === "month")?.value;
        const d = parts.find((p) => p.type === "day")?.value;
        if (!y || !m || !d) return null;
        return `${y}-${m}-${d}`;
    } catch (_err) {
        return null;
    }
}

function formatTime(date, timeZone) {
    try {
        return new Intl.DateTimeFormat("en-US", {
            timeZone,
            hour: "numeric",
            minute: "2-digit",
        }).format(date);
    } catch (_err) {
        return new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "2-digit",
        }).format(date);
    }
}

function formatMonthDay(date, timeZone) {
    try {
        return new Intl.DateTimeFormat("en-US", {
            timeZone,
            month: "short",
            day: "numeric",
        }).format(date);
    } catch (_err) {
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
        }).format(date);
    }
}

function formatWeekday(date, timeZone) {
    try {
        return new Intl.DateTimeFormat("en-US", {
            timeZone,
            weekday: "short",
        }).format(date);
    } catch (_err) {
        return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
    }
}

function formatStartLabel(startAt, timeZone) {
    if (!startAt) return "";
    const tz = timeZone || "America/Chicago";

    const d = new Date(startAt);
    if (Number.isNaN(d.getTime())) return String(startAt);

    const now = new Date();

    const ymdNow = getYmdInTimeZone(now, tz);
    const ymdEvent = getYmdInTimeZone(d, tz);

    if (ymdNow && ymdEvent) {
        if (ymdEvent === ymdNow) {
            return `Today • ${formatTime(d, tz)}`;
        }

        // Tomorrow in timezone: compare to now+1 day
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const ymdTomorrow = getYmdInTimeZone(tomorrow, tz);

        if (ymdTomorrow && ymdEvent === ymdTomorrow) {
            return `Tomorrow • ${formatTime(d, tz)}`;
        }

        // Within next 7 days
        const in7 = new Date(now);
        in7.setDate(in7.getDate() + 7);

        const eventMid = new Date(d);
        const nowMid = new Date(now);
        nowMid.setHours(0, 0, 0, 0);

        if (eventMid >= nowMid && eventMid <= in7) {
            return `${formatWeekday(d, tz)} • ${formatTime(d, tz)}`;
        }

        return `${formatMonthDay(d, tz)} • ${formatTime(d, tz)}`;
    }

    // Fallback if TZ formatting failed
    return `${formatMonthDay(d)} • ${formatTime(d)}`;
}

function shapeEventForUI(e) {
    if (!e) return null;

    const locationLabel =
        e.locationScope === "statewide"
            ? "Alabama (Statewide)"
            : e.locationScope === "county"
                ? e.county || "County"
                : e.city || "City";

    const startLabel = formatStartLabel(e.startAt, e.timezone);

    const organizerLabel = e.organizer
        ? `${e.organizer.firstName || ""} ${e.organizer.lastName || ""}`.trim()
        : "";

    return {
        ...e,
        locationLabel,
        startLabel,
        organizerLabel,
    };
}

export default function useEventsFeed({ filters }) {
    const [events, setEvents] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const [error, setError] = useState(null);

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [totalCount, setTotalCount] = useState(null);
    const [categoryCounts, setCategoryCounts] = useState(EMPTY_COUNTS);
    const [categoryCountsLoading, setCategoryCountsLoading] = useState(false);

    const [locationCounts, setLocationCounts] = useState(null);
    const [locationCountsLoading, setLocationCountsLoading] = useState(false);

    const lastRequestIdRef = useRef(0);

    const filtersKey = useMemo(() => JSON.stringify(filters || {}), [filters]);

    const loadPage = async (pageToLoad, { replace } = { replace: false }) => {
        const requestId = lastRequestIdRef.current + 1;
        lastRequestIdRef.current = requestId;

        const startTs = Date.now();

        try {
            setError(null);

            const isInitial = !replace && pageToLoad === 1;
            const isMore = !replace && pageToLoad > 1;

            if (replace) setIsRefreshing(true);
            else if (isMore) setIsLoadingMore(true);
            else if (isInitial) setIsLoading(true);

            const params = mapFiltersToParams(filters, pageToLoad);
            const data = await fetchEvents(params);

            if (lastRequestIdRef.current !== requestId) return;

            if (pageToLoad === 1) {
                const n = Number(data?.totalCount);
                setTotalCount(Number.isFinite(n) ? n : null);
            }

            const rawItems = Array.isArray(data?.items)
                ? data.items
                : Array.isArray(data)
                    ? data
                    : [];

            const items = rawItems.map(shapeEventForUI).filter(Boolean);

            const nextHasMore =
                typeof data?.hasMore === "boolean"
                    ? data.hasMore
                    : items.length >= PAGE_SIZE;

            if (replace) {
                const elapsed = Date.now() - startTs;
                if (elapsed < MIN_REFRESH_MS) {
                    await sleep(MIN_REFRESH_MS - elapsed);
                }
            }

            setHasMore(nextHasMore);
            setPage(pageToLoad);
            setEvents((prev) => (replace ? items : [...prev, ...items]));
        } catch (err) {
            if (lastRequestIdRef.current !== requestId) return;

            if (replace) {
                const elapsed = Date.now() - startTs;
                if (elapsed < MIN_REFRESH_MS) {
                    await sleep(MIN_REFRESH_MS - elapsed);
                }
            }

            setError(err);

            if (pageToLoad === 1) {
                setHasMore(false);
                setTotalCount(null);
            }
        } finally {
            if (lastRequestIdRef.current !== requestId) return;

            setIsLoading(false);
            setIsRefreshing(false);
            setIsLoadingMore(false);
        }
    };

    // Store loadPage in a ref so refresh/loadMore callbacks stay stable
    const loadPageRef = useRef(loadPage);
    loadPageRef.current = loadPage;

    const filtersRef = useRef(filters);
    filtersRef.current = filters;

    const pageRef = useRef(page);
    pageRef.current = page;

    const busyRef = useRef({ isLoading, isRefreshing, isLoadingMore, hasMore });
    busyRef.current = { isLoading, isRefreshing, isLoadingMore, hasMore };

    const refresh = useCallback(async () => {
        await loadPageRef.current(1, { replace: true });
    }, []);

    const loadMore = useCallback(async () => {
        const { isLoading: ld, isRefreshing: rf, isLoadingMore: lm, hasMore: hm } = busyRef.current;
        if (ld || rf || lm || !hm) return;
        await loadPageRef.current(pageRef.current + 1, { replace: false });
    }, []);

    const fetchCategoryCounts = useCallback(async () => {
        const f = filtersRef.current || {};
        const params = {
            q: f.query || "",
            city: normalizeAllLabel(f.city, "All Cities"),
            county: normalizeAllLabel(f.county, "All Counties"),
            view: f.view || "all",
            includeStatewide: Boolean(f.includeStatewide),
            range: f.datePreset || "month",
            start: f.start || "",
            end: f.end || "",
            posterType: f.posterType || "",
        };

        try {
            setCategoryCountsLoading(true);
            const data = await fetchEventCategoryCounts(params);
            const counts =
                data && typeof data === "object" && data.counts && typeof data.counts === "object"
                    ? data.counts
                    : {};
            setCategoryCounts(counts);
        } catch (_err) {
            setCategoryCounts(EMPTY_COUNTS);
        } finally {
            setCategoryCountsLoading(false);
        }
    }, []);

    const fetchLocationCountsCb = useCallback(async () => {
        const f = filtersRef.current || {};
        const params = {
            q: f.query || "",
            category: f.category || "",
            county: normalizeAllLabel(f.county, "All Counties"),
            view: f.view || "all",
            includeStatewide: Boolean(f.includeStatewide),
            range: f.datePreset || "month",
            start: f.start || "",
            end: f.end || "",
            posterType: f.posterType || "",
        };

        try {
            setLocationCountsLoading(true);
            const data = await fetchEventLocationCounts(params);
            setLocationCounts({
                counties: data?.counties && typeof data.counties === "object" ? data.counties : {},
                cities: data?.cities && typeof data.cities === "object" ? data.cities : {},
            });
        } catch (_err) {
            setLocationCounts(null);
        } finally {
            setLocationCountsLoading(false);
        }
    }, []);

    useEffect(() => {
        // On any filter change, reset list and refetch from scratch + update category counts.
        // eslint-disable-next-line no-void
        void refresh();
        // eslint-disable-next-line no-void
        void fetchCategoryCounts();
        // eslint-disable-next-line no-void
        void fetchLocationCountsCb();
    }, [filtersKey, refresh, fetchCategoryCounts, fetchLocationCountsCb]);

    return {
        events,
        totalCount,
        categoryCounts,
        categoryCountsLoading,
        locationCounts,
        locationCountsLoading,
        isLoading,
        isRefreshing,
        isLoadingMore,
        error,
        page,
        hasMore,
        refresh,
        loadMore,
    };
}
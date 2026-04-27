// src/pages/jobs/hooks/useJobsFeed.js
import { useEffect, useRef, useState } from "react";
import { fetchJobCategories, fetchJobsFeed, fetchMyJobs } from "../api/jobs";
import { getAccountHeaders } from "../../../utils/getAccountHeadersStatic";
import { secureFetch } from "../../../utils/secureFetch";

/**
 * useJobsFeed
 * ─────────────────────────────────────────────────────────────────────
 * INFINITE-LOOP FIX:
 * All effect dependencies are primitive strings produced by JSON.stringify.
 * We never put the `filters` object reference into a dependency array.
 * Instead, we serialise the filter values we care about into a stable
 * string key, then use that key as the sole "change detector" for each
 * fetch effect.  The `filters` object itself is read from a ref so the
 * effect closure always has the latest value without subscribing to it.
 * ─────────────────────────────────────────────────────────────────────
 */

// ── helpers ──────────────────────────────────────────────────────────
function stableFilterKey(search, sort, filters, tick) {
    const f = filters && typeof filters === "object" ? filters : {};
    return JSON.stringify({
        q: String(search || ""),
        sort: String(sort || "newest"),
        category: String(f.category || "All"),
        jobTypes: Array.isArray(f.jobTypes) ? [...f.jobTypes].sort() : [],
        workModes: Array.isArray(f.workModes) ? [...f.workModes].sort() : [],
        city: String(f.city || ""),
        county: String(f.county || ""),
        counties: Array.isArray(f.counties) ? [...f.counties].sort().join(",") : "",
        statewideOnly: Boolean(f.statewideOnly),
        salaryRange: String(f.salaryRange || ""),
        tick,
    });
}

function categoryFilterKey(search, sort, filters, tick) {
    const f = filters && typeof filters === "object" ? filters : {};
    return JSON.stringify({
        q: String(search || ""),
        sort: String(sort || "newest"),
        jobTypes: Array.isArray(f.jobTypes) ? [...f.jobTypes].sort() : [],
        workModes: Array.isArray(f.workModes) ? [...f.workModes].sort() : [],
        city: String(f.city || ""),
        county: String(f.county || ""),
        counties: Array.isArray(f.counties) ? [...f.counties].sort().join(",") : "",
        statewideOnly: Boolean(f.statewideOnly),
        salaryRange: String(f.salaryRange || ""),
        tick,
    });
}

function myJobsFilterKey(myJobsStatus, search, sort, filters, tick) {
    const f = filters && typeof filters === "object" ? filters : {};
    return JSON.stringify({
        myJobsStatus: String(myJobsStatus || "active"),
        q: String(search || ""),
        sort: String(sort || "newest"),
        category: String(f.category || "All"),
        jobTypes: Array.isArray(f.jobTypes) ? [...f.jobTypes].sort() : [],
        workModes: Array.isArray(f.workModes) ? [...f.workModes].sort() : [],
        city: String(f.city || ""),
        county: String(f.county || ""),
        counties: Array.isArray(f.counties) ? [...f.counties].sort().join(",") : "",
        statewideOnly: Boolean(f.statewideOnly),
        salaryRange: String(f.salaryRange || ""),
        tick,
    });
}

function allJobsFilterKey(search, sort, filters, tick) {
    const f = filters && typeof filters === "object" ? filters : {};
    return JSON.stringify({
        q: String(search || ""),
        sort: String(sort || "newest"),
        city: String(f.city || ""),
        county: String(f.county || ""),
        counties: Array.isArray(f.counties) ? [...f.counties].sort().join(",") : "",
        statewideOnly: Boolean(f.statewideOnly),
        salaryRange: String(f.salaryRange || ""),
        tick,
    });
}
// ─────────────────────────────────────────────────────────────────────

export default function useJobsFeed({ search, sort, filters, mode = "all", myJobsStatus = "active" }) {
    // ── state ────────────────────────────────────────────────────────
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const cursorRef = useRef(null);
    const [refreshTick, setRefreshTick] = useState(0);

    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [categoriesError, setCategoriesError] = useState(null);

    const [myJobs, setMyJobs] = useState([]);
    const [myJobsLoading, setMyJobsLoading] = useState(false);
    const [myJobsError, setMyJobsError] = useState(null);

    const [allJobs, setAllJobs] = useState([]);

    const [savedJobs, setSavedJobs] = useState([]);
    const [savedJobsLoading, setSavedJobsLoading] = useState(false);

    const [appliedJobs, setAppliedJobs] = useState([]);
    const [appliedJobsLoading, setAppliedJobsLoading] = useState(false);

    const [hasMyListings, setHasMyListings] = useState(false);

    // ── refs for latest values (read inside effects without subscribing) ──
    const filtersRef = useRef(filters);
    filtersRef.current = filters;
    const searchRef = useRef(search);
    searchRef.current = search;
    const sortRef = useRef(sort);
    sortRef.current = sort;
    const myJobsStatusRef = useRef(myJobsStatus);
    myJobsStatusRef.current = myJobsStatus;

    // ── stable string keys (ONLY primitives in dependency arrays) ────
    const feedKey = stableFilterKey(search, sort, filters, refreshTick);
    const catKey = categoryFilterKey(search, sort, filters, refreshTick);
    const myKey = myJobsFilterKey(myJobsStatus, search, sort, filters, refreshTick);
    const allKey = allJobsFilterKey(search, sort, filters, refreshTick);

    const isEmpty = !isLoading && items.length === 0;

    // ── Quick "has my listings" check ────────────────────────────────
    useEffect(() => {
        let alive = true;
        async function checkMyListings() {
            try {
                const data = await fetchMyJobs({ status: "all" });
                if (alive) setHasMyListings(Array.isArray(data) && data.length > 0);
            } catch {
                // tab just won't show
            }
        }
        checkMyListings();
        return () => { alive = false; };
    }, [refreshTick]);

    // ── Feed fetch (mode === "all") ──────────────────────────────────
    useEffect(() => {
        if (mode !== "all") return;
        const controller = new AbortController();

        async function loadInitial() {
            setIsLoading(true);
            setError(null);
            cursorRef.current = null;

            try {
                const res = await fetchJobsFeed({
                    search: searchRef.current,
                    sort: sortRef.current,
                    filters: filtersRef.current,
                    signal: controller.signal,
                });
                setItems(res.items || []);
                setHasMore(Boolean(res.hasMore));
                cursorRef.current = res.nextCursor || null;
            } catch (err) {
                if (err?.name !== "AbortError") setError(err);
            } finally {
                setIsLoading(false);
            }
        }

        loadInitial();
        return () => controller.abort();
        // feedKey already encodes search+sort+filters+tick — no object refs here
    }, [feedKey, mode]);

    // ── Category counts ──────────────────────────────────────────────
    useEffect(() => {
        const controller = new AbortController();

        async function loadCategories() {
            setCategoriesLoading(true);
            setCategoriesError(null);

            try {
                const rows = await fetchJobCategories({
                    search: searchRef.current,
                    sort: sortRef.current,
                    filters: filtersRef.current,
                    signal: controller.signal,
                });
                setCategories(Array.isArray(rows) ? rows : []);
            } catch (err) {
                if (err?.name !== "AbortError") setCategoriesError(err);
                setCategories([]);
            } finally {
                setCategoriesLoading(false);
            }
        }

        loadCategories();
        return () => controller.abort();
    }, [catKey]);

    // ── My Jobs ──────────────────────────────────────────────────────
    useEffect(() => {
        const controller = new AbortController();

        async function loadMyJobs() {
            setMyJobsLoading(true);
            setMyJobsError(null);

            try {
                const data = await fetchMyJobs({
                    signal: controller.signal,
                    status: myJobsStatusRef.current,
                    search: searchRef.current,
                    sort: sortRef.current,
                    filters: filtersRef.current,
                });
                setMyJobs(Array.isArray(data) ? data : []);
            } catch (err) {
                if (err?.name !== "AbortError") setMyJobsError(err);
                setMyJobs([]);
            } finally {
                setMyJobsLoading(false);
            }
        }

        loadMyJobs();
        return () => controller.abort();
    }, [myKey]);

    // ── All jobs (unfiltered — overview panel stats) ─────────────────
    useEffect(() => {
        if (mode !== "all") return;
        const controller = new AbortController();

        async function loadAllJobs() {
            try {
                const f = filtersRef.current && typeof filtersRef.current === "object" ? filtersRef.current : {};
                const res = await fetchJobsFeed({
                    search: searchRef.current,
                    sort: sortRef.current,
                    filters: {
                        city: f.city || "",
                        county: f.county || "",
                        statewideOnly: f.statewideOnly || false,
                    },
                    limit: 200,
                    signal: controller.signal,
                });
                setAllJobs(res.items || []);
            } catch (err) {
                if (err?.name !== "AbortError") setAllJobs([]);
            }
        }

        loadAllJobs();
        return () => controller.abort();
    }, [allKey, mode]);

    // ── Saved jobs ───────────────────────────────────────────────────
    useEffect(() => {
        const controller = new AbortController();
        async function loadSaved() {
            setSavedJobsLoading(true);
            try {
                const res = await secureFetch("/api/jobs/saved/list", {
                    credentials: "include",
                    headers: { Accept: "application/json", ...getAccountHeaders() },
                    signal: controller.signal,
                });
                if (!res.ok) { setSavedJobs([]); return; }
                const data = await res.json();
                setSavedJobs(Array.isArray(data?.items) ? data.items : []);
            } catch (err) {
                if (err?.name !== "AbortError") setSavedJobs([]);
            } finally {
                setSavedJobsLoading(false);
            }
        }
        loadSaved();
        return () => controller.abort();
    }, [refreshTick]);

    // ── Applied jobs ─────────────────────────────────────────────────
    useEffect(() => {
        const controller = new AbortController();
        async function loadApplied() {
            setAppliedJobsLoading(true);
            try {
                const res = await secureFetch("/api/jobs/applied/list", {
                    credentials: "include",
                    headers: { Accept: "application/json", ...getAccountHeaders() },
                    signal: controller.signal,
                });
                if (!res.ok) { setAppliedJobs([]); return; }
                const data = await res.json();
                setAppliedJobs(Array.isArray(data?.items) ? data.items : []);
            } catch (err) {
                if (err?.name !== "AbortError") setAppliedJobs([]);
            } finally {
                setAppliedJobsLoading(false);
            }
        }
        loadApplied();
        return () => controller.abort();
    }, [refreshTick]);

    // ── Actions ──────────────────────────────────────────────────────
    const refresh = () => {
        setRefreshTick((t) => t + 1);
    };

    const loadMore = async () => {
        if (!hasMore || isLoading) return;
        setIsLoading(true);

        try {
            const res = await fetchJobsFeed({
                search: searchRef.current,
                sort: sortRef.current,
                filters: filtersRef.current,
                cursor: cursorRef.current,
            });
            setItems((prev) => [...prev, ...(res.items || [])]);
            setHasMore(Boolean(res.hasMore));
            cursorRef.current = res.nextCursor || null;
        } catch (err) {
            if (err?.name !== "AbortError") setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        items,
        isLoading,
        isEmpty,
        error,
        refresh,
        loadMore,
        hasMore,
        categories,
        categoriesLoading,
        categoriesError,
        myJobs,
        myJobsLoading,
        myJobsError,
        allJobs,
        hasMyListings,
        savedJobs,
        savedJobsLoading,
        appliedJobs,
        appliedJobsLoading,
    };
}

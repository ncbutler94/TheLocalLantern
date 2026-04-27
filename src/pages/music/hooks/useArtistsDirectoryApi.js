import { useCallback, useEffect, useMemo, useState } from "react";
import { listArtists } from "../api/artists";
import { useActiveAccount } from "../../../components/AccountContext";

/**
 * useArtistsDirectoryApi
 * - API-backed artists directory hook
 * - Supports basic filtering (query/city/county/genre) + pagination-ready shape
 * - Tracks total count when API provides it
 *
 * Intended location:
 *   src/pages/music/hooks/useArtistsDirectoryApi.js
 */

function extractTotalCount(data, itemsLength) {
    const candidates = [
        data?.total,
        data?.totalCount,
        data?.total_count,
        data?.count,
        data?.meta?.total,
        data?.meta?.totalCount,
        data?.meta?.total_count,
    ];

    for (const c of candidates) {
        const n = Number(c);
        if (Number.isFinite(n) && n >= 0) return n;
    }

    // If API doesn't provide total, fall back to current length (still useful).
    return itemsLength;
}

// Stable no-op function defined outside the component to avoid reference changes.
const LOAD_MORE_NOOP = async () => {
    // Intentionally a no-op until the API is finalized
};

export default function useArtistsDirectoryApi({ refreshKey = 0, type = "" } = {}) {
    const { accountCacheKey } = useActiveAccount();

    const [query, setQuery] = useState("");
    const [city, setCity] = useState("");
    const [county, setCounty] = useState("");
    const [genre, setGenre] = useState("");
    const [view, setView] = useState("all");

    const [artists, setArtists] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Cursor/pagination placeholders
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);

    useEffect(() => {
        let active = true;

        (async () => {
            setLoading(true);
            setError("");

            try {
                const data = await listArtists({
                    query,
                    city,
                    county,
                    genre,
                    view,
                    type,
                    limit: 100,
                    cursor: null,
                });

                if (!active) return;

                // Expected API shape:
                // { items: [...], nextCursor: "abc" | null, totalCount?: number }
                // Serializer in api/artists.js normalizes each artist item for us.
                const items = Array.isArray(data?.items)
                    ? data.items
                    : Array.isArray(data)
                        ? data
                        : [];

                const nextCursor = data?.nextCursor ?? null;

                setArtists(items);
                setTotalCount(extractTotalCount(data, items.length));
                setCursor(nextCursor);
                setHasMore(Boolean(nextCursor));
                setLoading(false);
            } catch (e) {
                if (!active) return;
                const msg = e instanceof Error ? e.message : "Could not load artists directory.";
                setError(msg);
                setArtists([]);
                setTotalCount(0);
                setCursor(null);
                setHasMore(false);
                setLoading(false);
            }
        })();

        return () => {
            active = false;
        };
    }, [query, city, county, genre, view, type, accountCacheKey, refreshKey]);

    // Stable reset callback — state setters are always stable references,
    // so this callback never changes identity and cannot trigger re-render loops.
    const reset = useCallback(() => {
        setQuery("");
        setCity("");
        setCounty("");
        setGenre("");
        setView("all");
    }, []);

    const value = useMemo(
        () => ({
            artists,
            totalCount,
            loading,
            error,
            cursor,
            hasMore,
            filters: { query, city, county, genre, view },
            setQuery,
            setCity,
            setCounty,
            setGenre,
            setView,
            // pagination: stub for later infinite scroll
            loadMore: LOAD_MORE_NOOP,
            reset,
        }),
        [artists, totalCount, loading, error, cursor, hasMore, query, city, county, genre, view, reset]
    );

    return value;
}

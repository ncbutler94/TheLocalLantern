// src/pages/marketplace/hooks/useListingDetail.js
// Listing detail fetch + loading + error + view tracking
// Now accepts { activeBusinessId, activeArtistId } for per-account viewer state
//
// FIX: Removed circular dependency where `refresh` was both a dep of
// the useEffect AND depended on values that changed every render.
// Now the effect fires only when the *primitive* keys change, and
// `refresh` reads current values via refs to avoid stale closures.

import { useCallback, useEffect, useRef, useState } from "react";
import { getListingById, recordView } from "../api/marketplace";

function normalizeListingResponse(data) {
    if (!data) return null;
    if (data.item) return data.item;
    if (data.listing) return data.listing;
    return data;
}

export default function useListingDetail(listingId, { activeBusinessId, activeArtistId } = {}) {
    const abortRef = useRef(null);
    const viewedRef = useRef(null);

    const [item, setItem] = useState(null);
    const [isLoading, setIsLoading] = useState(Boolean(listingId));
    const [error, setError] = useState(null);

    // Store the latest values in refs so the stable `refresh` callback
    // always reads fresh data without needing to be recreated.
    const listingIdRef = useRef(listingId);
    const activeBusinessIdRef = useRef(activeBusinessId);
    const activeArtistIdRef = useRef(activeArtistId);

    listingIdRef.current = listingId;
    activeBusinessIdRef.current = activeBusinessId;
    activeArtistIdRef.current = activeArtistId;

    const cancelInFlight = useCallback(() => {
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }
    }, []);

    // Stable refresh — never changes identity, reads from refs.
    const refresh = useCallback(async () => {
        const currentListingId = listingIdRef.current;
        const currentBizId = activeBusinessIdRef.current;
        const currentArtId = activeArtistIdRef.current;

        if (!currentListingId) {
            setItem(null);
            setIsLoading(false);
            setError(null);
            return;
        }

        cancelInFlight();
        const controller = new AbortController();
        abortRef.current = controller;

        setIsLoading(true);
        setError(null);

        try {
            const data = await getListingById(
                currentListingId,
                { activeBusinessId: currentBizId, activeArtistId: currentArtId },
                { signal: controller.signal }
            );
            const normalized = normalizeListingResponse(data);

            if (!controller.signal.aborted) {
                setItem(normalized || null);
            }

            // Record view once per listing
            if (normalized && String(normalized.id) !== viewedRef.current) {
                viewedRef.current = String(normalized.id);
                recordView(normalized.id);
            }
        } catch (err) {
            if (err?.name === "AbortError") return;
            if (!controller.signal.aborted) {
                setError(err);
                setItem(null);
            }
        } finally {
            if (!controller.signal.aborted) {
                setIsLoading(false);
            }
            abortRef.current = null;
        }
    }, [cancelInFlight]);

    // Primitive keys — these are stable strings/numbers, never objects.
    const idKey = String(listingId || "");
    const bizKey = String(activeBusinessId || "");
    const artKey = String(activeArtistId || "");

    useEffect(() => {
        refresh();
        return () => cancelInFlight();
    }, [idKey, bizKey, artKey, refresh, cancelInFlight]);

    return {
        item,
        isLoading,
        error,
        refresh,
    };
}

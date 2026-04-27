import { useCallback, useState } from "react";
import { createArtist as createArtistApi } from "../api/artists";

/**
 * useCreateArtist
 * - Wraps createArtist() API call
 * - Keeps UI components clean (modal/pages)
 *
 * Intended location:
 *   src/pages/music/hooks/useCreateArtist.js
 */

export default function useCreateArtist() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const createArtist = useCallback(async (payload) => {
        setLoading(true);
        setError("");

        try {
            const data = await createArtistApi(payload);
            setLoading(false);
            return data;
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Could not create artist.";
            setError(msg);
            setLoading(false);
            throw e;
        }
    }, []);

    return { createArtist, loading, error, setError };
}

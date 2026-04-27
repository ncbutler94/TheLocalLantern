// src/pages/jobs/hooks/useMyBusinesses.js
import { useEffect, useState } from "react";
import { fetchMyBusinesses } from "../api/businesses";

/**
 * useMyBusinesses
 * - Fetches businesses the current user can manage (owner/admin) for Jobs posting.
 * - Kept inside jobs/hooks for now to avoid coupling while we scaffold.
 *
 * Returns:
 * - { businesses, isLoading, error }
 */
export default function useMyBusinesses() {
    const [businesses, setBusinesses] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        async function load() {
            setIsLoading(true);
            setError(null);

            try {
                const data = await fetchMyBusinesses({ signal: controller.signal });
                setBusinesses(Array.isArray(data) ? data : []);
            } catch (err) {
                if (err.name !== "AbortError") setError(err);
            } finally {
                setIsLoading(false);
            }
        }

        load();

        return () => controller.abort();
    }, []);

    return { businesses, isLoading, error };
}

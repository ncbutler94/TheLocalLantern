// src/hooks/useCommunityImage.js
//
// Fetches hero images from the community-image API based on
// the current county/city selection. Handles loading, error,
// caching, and image preloading so transitions feel smooth.

import { useState, useEffect, useRef, useCallback } from 'react';
import { secureFetch } from '../utils/secureFetch';

const IMAGE_CACHE = new Map();
const PRELOAD_CACHE = new Map();

/**
 * Preload an image URL into the browser cache.
 * Returns a promise that resolves when the image is loaded.
 */
function preloadImage(url) {
    if (!url) return Promise.resolve();
    if (PRELOAD_CACHE.has(url)) return PRELOAD_CACHE.get(url);

    const promise = new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => resolve(null);
        img.src = url;
    });

    PRELOAD_CACHE.set(url, promise);
    return promise;
}

/**
 * Build a cache key from county + city.
 */
function cacheKey(county, city) {
    return `${(county || '').toLowerCase()}::${(city || '').toLowerCase()}`;
}

/**
 * @param {string} county - Selected county name (e.g. "Calhoun")
 * @param {string} city   - Selected city name (e.g. "Piedmont") or "All Cities"
 * @returns {{ image, loading, error, imageReady }}
 *
 *   image      – the image object from the API (or null)
 *   loading    – true while the fetch is in-flight
 *   error      – error message string (or null)
 *   imageReady – true once the actual image file has been preloaded into the browser
 */
export default function useCommunityImage(county, city) {
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [imageReady, setImageReady] = useState(false);

    // Abort controller ref for cancelling in-flight fetches
    const abortRef = useRef(null);

    // Track the current request to avoid stale responses
    const requestIdRef = useRef(0);

    const fetchImage = useCallback(async (countyVal, cityVal) => {
        const normalCounty = (countyVal || '').trim().replace(/ County$/i, '');
        const normalCity = (cityVal || '').trim();

        const isAllCounty = !normalCounty || normalCounty === 'All Counties';
        const isAllCity = !normalCity || normalCity === 'All Cities';

        // Nothing selected → clear image
        if (isAllCounty && isAllCity) {
            setImage(null);
            setLoading(false);
            setError(null);
            setImageReady(false);
            return;
        }

        const key = cacheKey(normalCounty, normalCity);

        // Return cached result immediately
        if (IMAGE_CACHE.has(key)) {
            const cached = IMAGE_CACHE.get(key);
            setImage(cached);
            setError(null);
            setLoading(false);
            setImageReady(true);
            return;
        }

        // Cancel previous fetch
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const thisRequest = ++requestIdRef.current;

        setLoading(true);
        setError(null);
        setImageReady(false);

        try {
            // Build query params
            const params = new URLSearchParams();
            if (!isAllCounty) params.set('county', normalCounty);
            if (!isAllCity) params.set('city', normalCity);

            const res = await secureFetch(
                `/api/homepage/community-image?${params.toString()}`,
                { signal: controller.signal, credentials: 'include' }
            );

            // Stale response guard
            if (thisRequest !== requestIdRef.current) return;

            if (!res.ok) {
                if (res.status === 404) {
                    setImage(null);
                    setLoading(false);
                    // Not really an error — just no image available yet
                    return;
                }
                throw new Error(`Failed to load image (${res.status})`);
            }

            const data = await res.json();
            const img = data.image || null;

            // Cache it
            IMAGE_CACHE.set(key, img);
            setImage(img);
            setLoading(false);

            // Preload the actual image file for smooth transitions
            if (img?.image_url) {
                const loaded = await preloadImage(img.image_url);
                if (thisRequest === requestIdRef.current) {
                    setImageReady(!!loaded);
                }
            }
        } catch (err) {
            if (err.name === 'AbortError') return;
            if (thisRequest !== requestIdRef.current) return;
            setError(err.message);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchImage(county, city);

        return () => {
            if (abortRef.current) abortRef.current.abort();
        };
    }, [county, city, fetchImage]);

    return { image, loading, error, imageReady };
}

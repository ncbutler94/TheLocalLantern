import { secureFetch } from '../../../utils/secureFetch';
import { useEffect, useMemo, useRef, useState } from 'react';
import cityData from '../../../data/alabamaCities.json';
import countyData from '../../../data/alabamaCounties.json';
import { checkFieldsProfanity } from '../../../utils/profanityCheck';

/* ──────────────────────────────
   Shared constants
   ────────────────────────────── */
export const MAX_TITLE = 50;
export const MAX_DESCRIPTION = 5_000;
export const MAX_PHOTOS = 4;

/* ──────────────────────────────
   Helpers for city / county
   ────────────────────────────── */
const stripSuffix = (s) => String(s || '').replace(/ County$/i, '').trim();

/**
 * Extract coordinates from GeoJSON feature.
 * GeoJSON coordinates are [lng, lat], we return [lat, lng] for consistency.
 */
function getCoordinatesFromFeature(feature) {
    if (!feature?.geometry) return null;
    const { type, coordinates } = feature.geometry;

    // Point: coordinates = [lng, lat]
    if (type === 'Point' && Array.isArray(coordinates) && coordinates.length >= 2) {
        const [lng, lat] = coordinates;
        if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
        return null;
    }

    // Polygon: calculate centroid from bounding box
    // coordinates = [ [ [lng,lat], [lng,lat], ... ] ]
    if (type === 'Polygon' && Array.isArray(coordinates)) {
        let minLat = Infinity, maxLat = -Infinity;
        let minLng = Infinity, maxLng = -Infinity;

        for (const ring of coordinates) {
            if (!Array.isArray(ring)) continue;
            for (const pt of ring) {
                if (!Array.isArray(pt) || pt.length < 2) continue;
                const [lng, lat] = pt;
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
                if (lat < minLat) minLat = lat;
                if (lat > maxLat) maxLat = lat;
                if (lng < minLng) minLng = lng;
                if (lng > maxLng) maxLng = lng;
            }
        }

        if (Number.isFinite(minLat) && Number.isFinite(maxLat)) {
            return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
        }
        return null;
    }

    // MultiPolygon: calculate centroid from bounding box
    if (type === 'MultiPolygon' && Array.isArray(coordinates)) {
        let minLat = Infinity, maxLat = -Infinity;
        let minLng = Infinity, maxLng = -Infinity;

        for (const poly of coordinates) {
            if (!Array.isArray(poly)) continue;
            for (const ring of poly) {
                if (!Array.isArray(ring)) continue;
                for (const pt of ring) {
                    if (!Array.isArray(pt) || pt.length < 2) continue;
                    const [lng, lat] = pt;
                    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
                    if (lat < minLat) minLat = lat;
                    if (lat > maxLat) maxLat = lat;
                    if (lng < minLng) minLng = lng;
                    if (lng > maxLng) maxLng = lng;
                }
            }
        }

        if (Number.isFinite(minLat) && Number.isFinite(maxLat)) {
            return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
        }
        return null;
    }

    return null;
}

/** Returns [lat, lng] for a city or county, or null if unknown. */
export function coordsFromLocalData(city, county) {
    // Handle GeoJSON FeatureCollection format
    const cityFeatures = cityData?.features || (Array.isArray(cityData) ? cityData : []);
    const countyFeatures = countyData?.features || (Array.isArray(countyData) ? countyData : []);

    if (city) {
        const cityNorm = String(city).trim().toLowerCase();
        const hit = cityFeatures.find((f) => {
            const name = String(f?.properties?.NAME || f?.properties?.name || f?.name || '').trim().toLowerCase();
            return name === cityNorm;
        });
        if (hit) {
            const coords = getCoordinatesFromFeature(hit);
            if (coords) return coords;
        }
    }

    if (county) {
        const countyNorm = stripSuffix(county).toLowerCase();
        const hit = countyFeatures.find((f) => {
            const name = stripSuffix(f?.properties?.NAME || f?.properties?.name || f?.name || '').toLowerCase();
            return name === countyNorm;
        });
        if (hit) {
            const coords = getCoordinatesFromFeature(hit);
            if (coords) return coords;
        }
    }

    return null;
}

/* ─────────────────────────────────────────────────────────────
   Hook: useBasePostForm(options)

   NEW (Statewide location mode):
   - `statewide` is ON by default.
   - When statewide is ON: city/county are cleared + disabled in UI.
   - When statewide is toggled OFF: city/county auto-fill from the user's
     saved profile location if available; otherwise remain blank.
   - Validation: city and county are optional; statewide is always valid.
   - Coordinates should only be resolved when statewide is OFF AND county exists.
   - This hook does NOT use device GPS.

   Options:
   - defaultCity/defaultCounty: optional initial defaults (only applied when
     statewide is toggled OFF, unless you set defaultStatewide=false).
   - defaultStatewide: boolean (default true)
   ───────────────────────────────────────────────────────────── */
export default function useBasePostForm(options = {}) {
    const optDefaultCity = String(options.defaultCity || '').trim();
    const optDefaultCounty = String(options.defaultCounty || '').trim();
    const defaultStatewide = Object.prototype.hasOwnProperty.call(options, 'defaultStatewide')
        ? Boolean(options.defaultStatewide)
        : true;

    /* field state */
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [photos, setPhotos] = useState(Array(MAX_PHOTOS).fill(null));

    const [statewide, setStatewide] = useState(defaultStatewide);
    const [city, setCity] = useState('');
    const [county, setCounty] = useState('');

    /* meta */
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);

    /**
     * Run a client-side profanity check on title + description (+ any extra fields).
     * Returns { clean: true } or { clean: false, field: 'title'|'description'|... }
     *
     * Call this in handleSaveOrPost before submitting. If not clean, set the error
     * and return early. The backend will also check, but this gives instant feedback.
     *
     * @param {Record<string, string>} [extraFields] - additional fields to check
     */
    const checkContentProfanity = (extraFields = {}) => {
        const fields = {
            title,
            description,
            ...extraFields,
        };
        return checkFieldsProfanity(fields);
    };

    // Store user/profile defaults (so toggling statewide OFF can populate).
    const userDefaultCityRef = useRef('');
    const userDefaultCountyRef = useRef('');
    const fetchedUserDefaultsRef = useRef(false);

    /* ────────────────────────────────────────────────────────────
       Helpers
       ──────────────────────────────────────────────────────────── */
    const clearLocation = () => {
        setCity('');
        setCounty('');
    };

    const applyDefaultsToLocation = () => {
        const dc = optDefaultCity || userDefaultCityRef.current || '';
        const dco = optDefaultCounty || userDefaultCountyRef.current || '';

        // Only fill blanks; never overwrite user's manual input.
        setCity((prev) => (prev ? prev : dc));
        setCounty((prev) => (prev ? prev : dco));
    };

    const setStatewideSafe = (next) => {
        const nextVal = Boolean(next);
        setStatewide(nextVal);

        if (nextVal) {
            // When statewide is ON, location fields should be empty.
            clearLocation();
        } else {
            // When statewide is OFF, auto-fill from user defaults if available.
            applyDefaultsToLocation();
        }
    };

    const isLocationValid = useMemo(() => {
        // City and county are optional — always valid.
        return true;
    }, [statewide, county]);

    const locationError = '';

    /**
     * Check if a value represents "All" (statewide).
     */
    const isAllValue = (val) => {
        const v = String(val || '').trim().toLowerCase();
        return !v || v === 'all counties' || v === 'all cities' || v === 'all' || v === 'statewide';
    };

    /**
     * Return a sanitized city/county value safe for the backend.
     * Converts "All Counties" / "All Cities" / statewide placeholders → ''.
     */
    const sanitizeLocationValue = (val) => {
        const v = String(val || '').trim();
        const low = v.toLowerCase();
        if (!low || low === 'all counties' || low === 'all cities' || low === 'all' || low === 'statewide') {
            return '';
        }
        return v;
    };

    /**
     * Resolve coordinates for storage.
     * - Returns null when county is "All Counties" / blank (statewide post).
     * - Returns [lat, lng] based on selected city/county otherwise.
     *
     * NOTE: We no longer check the `statewide` state variable since forms now use
     * "All Counties"/"All Cities" dropdowns instead of a checkbox.
     */
    const resolveCoordinates = () => {
        const cty = String(city || '').trim();
        const cty2 = String(county || '').trim();
        // Treat "All Counties" / empty as statewide (no coordinates)
        if (!cty2 || isAllValue(cty2)) return null;
        if (cty && isAllValue(cty)) {
            // City is "All Cities" but county is specific - use county coords
            return coordsFromLocalData('', cty2);
        }
        return coordsFromLocalData(cty, cty2);
    };

    /* ────────────────────────────────────────────────────────────
       Fetch defaults from the database user (saved profile location).
       Non-fatal on failure. Does not use device geolocation.
       ──────────────────────────────────────────────────────────── */
    useEffect(() => {
        let cancelled = false;

        // Utility to extract city/county from various shapes
        const extractLocation = (obj) => {
            if (!obj || typeof obj !== 'object') return null;

            const candidates = [
                obj,
                obj.user,
                obj.me,
                obj.profile,
                obj.account,
                obj.data,
                obj.currentUser,
            ].filter(Boolean);

            for (const root of candidates) {
                const foundCounty =
                    (root.county ??
                        root.home_county ??
                        root.default_county ??
                        (root.location && root.location.county) ??
                        (root.address && root.address.county) ??
                        '') + '';
                const foundCity =
                    (root.city ??
                        root.home_city ??
                        root.default_city ??
                        (root.location && root.location.city) ??
                        (root.address && root.address.city) ??
                        '') + '';

                if (foundCounty || foundCity) {
                    return {
                        county: String(foundCounty).trim(),
                        city: String(foundCity).trim(),
                    };
                }
            }
            return null;
        };

        const stashDefaults = (loc) => {
            if (!loc) return;
            if (loc.city) userDefaultCityRef.current = loc.city;
            if (loc.county) userDefaultCountyRef.current = loc.county;
        };

        (async () => {
            // 1) Try global if your app sets one (zero-cost)
            try {
                const anyWin = typeof window !== 'undefined' ? window : null;
                const globalUser =
                    anyWin && (anyWin.__CURRENT_USER__ || anyWin.CURRENT_USER || anyWin.USER);
                const gLoc = extractLocation(globalUser);
                if (!cancelled && gLoc) {
                    stashDefaults(gLoc);
                    fetchedUserDefaultsRef.current = true;
                    // Apply defaults only if statewide is OFF (and fields are empty).
                    if (!statewide) applyDefaultsToLocation();
                    return;
                }
            } catch (e) {
                // ignore
            }

            // 2) Try common profile endpoints
            const endpoints = ['/users/profile', '/api/users/profile', '/api/me', '/me'];

            for (const url of endpoints) {
                if (cancelled) return;
                try {
                    const res = await secureFetch(url, { credentials: 'include' });
                    if (!res.ok) continue;

                    const data = await res.json();
                    const loc = extractLocation(data);

                    if (loc) {
                        if (cancelled) return;
                        stashDefaults(loc);
                        fetchedUserDefaultsRef.current = true;

                        if (!statewide) applyDefaultsToLocation();
                        return;
                    }
                } catch (e) {
                    // keep trying
                }
            }
        })();

        return () => {
            cancelled = true;
        };
        // We intentionally do NOT include applyDefaultsToLocation in deps to avoid
        // re-filling while the user is typing.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statewide]);

    /* ────────────────────────────────────────────────────────────
       If the caller provided defaults AND statewide is OFF initially,
       prime the fields once.
       ──────────────────────────────────────────────────────────── */
    useEffect(() => {
        if (statewide) return;
        if (optDefaultCity || optDefaultCounty) {
            setCity((prev) => (prev ? prev : optDefaultCity));
            setCounty((prev) => (prev ? prev : optDefaultCounty));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        // fields
        title,
        setTitle,
        description,
        setDescription,
        photos,
        setPhotos,

        // location
        statewide,
        setStatewide: setStatewideSafe,
        city,
        setCity,
        county,
        setCounty,
        isLocationValid,
        locationError,
        resolveCoordinates,
        sanitizeLocationValue,

        // validation flag for UI (used in many forms)
        attemptedSubmit,
        setAttemptedSubmit,

        // meta
        submitting,
        setSubmitting,
        error,
        setError,

        // profanity check (client-side backup)
        checkContentProfanity,
    };
}

// src/utils/geoRadius.js
//
// Geographic radius helpers for the Community page filter.
//
// Given the user's selected county, compute which Alabama counties fall within
// a given mile radius of it. Used to expand a single-county filter into a list
// of counties for the backend query.
//
// Data sources:
//   - src/data/alabamaCounties.json (GeoJSON FeatureCollection, Polygons)
//   - src/data/alabamaCities.json   (GeoJSON FeatureCollection, Points)
//
// Conventions:
//   - Coordinates throughout this module are [lat, lng] (NOT GeoJSON's [lng, lat]).
//   - Distances are in statute miles.
//   - County names are the bare name (e.g. "Houston"), no "County" suffix.

import countyData from '../data/alabamaCounties.json';
import cityData from '../data/alabamaCities.json';

/** Sentinel value meaning "include every county in the state". */
export const STATEWIDE = 'statewide';

/** Dropdown options exposed to the filter UI. Values are strings for MUI Select compatibility. */
export const RADIUS_OPTIONS = [
    { value: '0', label: 'County only' },
    { value: '25', label: '25 miles' },
    { value: '50', label: '50 miles' },
    { value: '100', label: '100 miles' },
    { value: STATEWIDE, label: 'Statewide' },
];

/** Default when a county IS selected — 100 mi covers most of Alabama from any county. */
export const DEFAULT_RADIUS_WHEN_COUNTY_SELECTED = '100';

/** Value the dropdown shows when no county is selected (dropdown is inert). */
export const RADIUS_VALUE_WHEN_NO_COUNTY = STATEWIDE;

// ---------------------------------------------------------------------------
// GeoJSON → centroid helpers
// ---------------------------------------------------------------------------

/**
 * Returns [lat, lng] for a GeoJSON feature. Points return their coordinate;
 * polygons/multipolygons return the midpoint of their bounding box, which is
 * close enough to the visual centroid for Alabama's roughly-square counties.
 */
function featureToLatLng(feature) {
    if (!feature || !feature.geometry) return null;
    const { type, coordinates } = feature.geometry;

    if (type === 'Point' && Array.isArray(coordinates) && coordinates.length >= 2) {
        const [lng, lat] = coordinates;
        if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
        return null;
    }

    const allRings = [];
    if (type === 'Polygon' && Array.isArray(coordinates)) {
        for (const ring of coordinates) {
            if (Array.isArray(ring)) allRings.push(ring);
        }
    } else if (type === 'MultiPolygon' && Array.isArray(coordinates)) {
        for (const poly of coordinates) {
            if (!Array.isArray(poly)) continue;
            for (const ring of poly) {
                if (Array.isArray(ring)) allRings.push(ring);
            }
        }
    } else {
        return null;
    }

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    for (const ring of allRings) {
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

    if (!Number.isFinite(minLat) || !Number.isFinite(maxLat) ||
        !Number.isFinite(minLng) || !Number.isFinite(maxLng)) {
        return null;
    }

    return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
}

/** Builds a Map<name, [lat,lng]> from a GeoJSON FeatureCollection. */
function buildCentroidMap(geo, nameKey = 'NAME') {
    const features = Array.isArray(geo) ? geo : (geo?.features || []);
    const out = new Map();
    if (!Array.isArray(features)) return out;

    for (const f of features) {
        const name = String(f?.properties?.[nameKey] || '').trim();
        if (!name) continue;
        const latLng = featureToLatLng(f);
        if (!latLng) continue;
        out.set(name, latLng);
    }
    return out;
}

// Precomputed once at import time. These Maps are small (67 counties, a few
// hundred cities) so the memory cost is trivial.
const COUNTY_CENTROIDS = buildCentroidMap(countyData, 'NAME');
const CITY_POINTS = buildCentroidMap(cityData, 'NAME');

/** All Alabama county names (sorted). */
export const ALL_COUNTY_NAMES = Array.from(COUNTY_CENTROIDS.keys()).sort((a, b) => a.localeCompare(b));

// ---------------------------------------------------------------------------
// Distance
// ---------------------------------------------------------------------------

const EARTH_RADIUS_MILES = 3958.7613;
const toRad = (deg) => (deg * Math.PI) / 180;

/** Great-circle distance between two [lat, lng] points in statute miles. */
export function haversineMiles(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) return Infinity;
    const [lat1, lng1] = a;
    const [lat2, lng2] = b;
    if (!Number.isFinite(lat1) || !Number.isFinite(lng1) ||
        !Number.isFinite(lat2) || !Number.isFinite(lng2)) return Infinity;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const s = Math.sin(dLat / 2) ** 2
        + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(s)));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the [lat, lng] centroid for a county, or null if unknown.
 */
export function getCountyCenter(countyName) {
    if (!countyName) return null;
    return COUNTY_CENTROIDS.get(String(countyName).trim()) || null;
}

/**
 * Returns the list of county names whose centroids are within `radius` miles
 * of the selected county's centroid.
 *
 *   - If countyName is empty/unknown and radius is STATEWIDE/falsy → []
 *     (caller should treat empty list as "no county filter", same as today).
 *   - If radius is 0 or falsy → [countyName] (the county itself, if known).
 *   - If radius is STATEWIDE → every county in the state.
 *   - Otherwise → counties within the radius (always includes the selected
 *     county itself, even if its own centroid-to-centroid distance rounds oddly).
 *
 * The returned list is sorted alphabetically for stable query keys / caching.
 */
export function countiesWithinRadius(countyName, radius) {
    const name = String(countyName || '').trim();

    // Statewide: return every county regardless of selection.
    if (radius === STATEWIDE) return ALL_COUNTY_NAMES.slice();

    // No county selected and radius isn't statewide → no county-based filtering.
    if (!name) return [];

    const center = COUNTY_CENTROIDS.get(name);
    if (!center) {
        // Unknown county name — fall back to using it as-is.
        return [name];
    }

    const miles = Number(String(radius));
    if (!Number.isFinite(miles) || miles <= 0) {
        // County-only.
        return [name];
    }

    const matches = [];
    for (const [otherName, otherCenter] of COUNTY_CENTROIDS) {
        if (otherName === name) {
            matches.push(otherName);
            continue;
        }
        if (haversineMiles(center, otherCenter) <= miles) {
            matches.push(otherName);
        }
    }
    matches.sort((a, b) => a.localeCompare(b));
    return matches;
}

/**
 * Convenience: returns true if a radius value means "the single selected county".
 * Used by the UI to decide whether to show the radius chip in active-filter bars.
 */
export function isCountyOnly(radius) {
    if (radius === STATEWIDE) return false;
    const n = Number(String(radius));
    return !Number.isFinite(n) || n <= 0;
}

/**
 * Convenience: returns true if the radius expands beyond a single county
 * (i.e. the filter affects more than just the selected county).
 */
export function isExpandedRadius(radius) {
    return !isCountyOnly(radius);
}

/**
 * Human-readable label for a radius value — used in active-filter chips.
 *   0 → 'County only'
 *   25 → 'Within 25 mi'
 *   STATEWIDE → 'Statewide'
 */
export function radiusLabel(radius) {
    if (radius === STATEWIDE) return 'Statewide';
    const n = Number(String(radius));
    if (!Number.isFinite(n) || n <= 0) return 'County only';
    return `Within ${n} mi`;
}

// src/utils/MapUtils.js
import L from 'leaflet';

/* ═══════════════════════════════════════════════════════════
   Map Constants
   ═══════════════════════════════════════════════════════════ */

/** Default center of the state-level map (Alabama centroid). */
export const DEFAULT_CENTER = [32.69, -86.79113];

/** Default zoom level for the full-state view. */
export const DEFAULT_ZOOM = 7.2;

/** Minimum zoom allowed — a touch below default so the map has
 *  slight zoom-out room but doesn't lose context of the state. */
export const MIN_ZOOM = 7;

/** Maximum zoom allowed (capped before street-level labels become visible). */
export const MAX_ZOOM = 14;

/** Zoom snap granularity — half-zoom increments. */
export const ZOOM_SNAP = 0.5;

/** Zoom delta for keyboard / button zoom steps. */
export const ZOOM_DELTA = 0.5;

/** Scroll-wheel sensitivity: pixels of scrolling per one zoom level. */
export const WHEEL_PX_PER_ZOOM_LEVEL = 120;


/* ═══════════════════════════════════════════════════════════
   Marker-Click Zoom & Animation
   ═══════════════════════════════════════════════════════════ */

/**
 * Zoom level to fly to when a marker or card is clicked.
 * 11 gives a good city-level view that keeps the marker and popup
 * fully visible, including markers in the northern-most counties.
 */
export const MARKER_CLICK_ZOOM = 11;

/** Duration (seconds) for flyTo animations when clicking markers. */
export const FLY_TO_DURATION = 0.8;

/** Duration (seconds) for panTo animations (popup fallback, prev/next). */
export const PAN_TO_DURATION = 0.5;


/* ═══════════════════════════════════════════════════════════
   Default MaxBounds Padding
   ═══════════════════════════════════════════════════════════ */

/**
 * Standard maxBounds padding used by all map views.
 * padNorth is larger so markers in northern Alabama (Huntsville, Florence)
 * are reachable when the map zooms in and pans north for the popup.
 */
export const DEFAULT_BOUNDS_PAD = Object.freeze({
    padH: 0.60,
    padV: 0.30,
    padNorth: 0.55,
});


/* ═══════════════════════════════════════════════════════════
   Statewide Detection
   ═══════════════════════════════════════════════════════════ */

/** Tolerance (degrees) for detecting whether a center is "statewide". */
const STATEWIDE_LAT_TOLERANCE = 0.5;
const STATEWIDE_LNG_TOLERANCE = 0.5;

/**
 * Check if the given center coordinates represent a "statewide" view
 * (i.e., close to the default state center or explicitly null/undefined).
 *
 * @param {number[]|null|undefined} center  [lat, lng] or falsy
 * @returns {boolean}
 */
export function isStatewideCenter(center) {
    if (!center || !Array.isArray(center) || center.length < 2) return true;
    const [lat, lng] = center;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return true;

    const latDiff = Math.abs(lat - DEFAULT_CENTER[0]);
    const lngDiff = Math.abs(lng - DEFAULT_CENTER[1]);

    return latDiff < STATEWIDE_LAT_TOLERANCE && lngDiff < STATEWIDE_LNG_TOLERANCE;
}


/* ═══════════════════════════════════════════════════════════
   North-Pan Offset (popup breathing room)
   ═══════════════════════════════════════════════════════════ */

/**
 * Pixel offsets used by various interactions to pan the map north
 * so the popup has breathing room above the marker.
 *
 * MARKER_CLICK_OFFSET_PX  — used when a card/marker is clicked (most generous)
 * RECENTER_OFFSET_PX      — used by the Recenter controller on initial flyTo
 * PAN_FALLBACK_OFFSET_PX  — used by the PanOnPopupOpen fallback after animation settles
 */
export const MARKER_CLICK_OFFSET_PX = 260;
export const RECENTER_OFFSET_PX = 250;
export const PAN_FALLBACK_OFFSET_PX = 220;

/**
 * Pan target slightly north of the marker so the popup has breathing room.
 *
 * @param {L.Map|null}           map          Leaflet map instance
 * @param {L.LatLng}             latlng       Marker position
 * @param {number}               [offsetPx]   Pixels to shift north (default: PAN_FALLBACK_OFFSET_PX)
 * @param {number|undefined}     [targetZoom] Zoom to project at (defaults to current map zoom)
 * @returns {L.LatLng}
 */
export function getNorthPanTarget(map, latlng, offsetPx = PAN_FALLBACK_OFFSET_PX, targetZoom) {
    if (!map || !latlng) return latlng;
    try {
        const z = targetZoom ?? map.getZoom?.();
        if (typeof z !== 'number') return latlng;
        const p = map.project(latlng, z);
        // Y grows downward in screen/pixel space. Subtracting moves the center north,
        // which makes the marker appear lower (more room for popup chrome).
        const targetPoint = L.point(p.x, p.y - offsetPx);
        return map.unproject(targetPoint, z);
    } catch {
        return latlng;
    }
}


/* ═══════════════════════════════════════════════════════════
   De-stack / Offset Helpers
   (Spread co-located markers into a ring so they don't overlap)
   ═══════════════════════════════════════════════════════════ */

const BASE_OFFSET_M = 40;
const DEG = Math.PI / 180;
const mToLat = (m) => m / 111_320;
const mToLng = (m, lat) => m / (111_320 * Math.cos(lat * DEG));

/**
 * Radius (meters) for spreading co-located markers at a given zoom.
 * @param {number} zoom
 * @returns {number}
 */
export const radiusForZoom = (zoom) => BASE_OFFSET_M * (18 - zoom + 1);

/**
 * Offset a coordinate around a ring so stacked markers don't overlap.
 *
 * @param {number[]} latLng  [lat, lng]
 * @param {number}   idx     Index of this marker in the group
 * @param {number}   total   Total markers in the group
 * @param {number}   zoom    Current map zoom
 * @returns {number[]}       [lat, lng] — possibly shifted
 */
export function offsetCoords([lat, lng], idx, total, zoom) {
    if (total === 1) return [lat, lng];
    const r = radiusForZoom(zoom);
    const angle = (2 * Math.PI * idx) / total;
    return [lat + mToLat(r) * Math.sin(angle), lng + mToLng(r, lat) * Math.cos(angle)];
}


/* ═══════════════════════════════════════════════════════════
   Bounds Helpers
   ═══════════════════════════════════════════════════════════ */

/**
 * Compute custom bounds that can pad horizontally/vertically differently.
 * Optionally allows a separate north padding (e.g., for header/toolbar clearance).
 *
 * @param {L.LatLngBounds} bounds  Base bounds
 * @param {Object}         opts
 * @param {number}         opts.padH      Horizontal padding ratio (default 0.12)
 * @param {number}         opts.padV      Vertical (south) padding ratio (default 0.12)
 * @param {number}         opts.padNorth  North padding ratio (default 0 → falls back to padV)
 * @returns {L.LatLngBounds}
 */
export function computeBoundsWithPad(bounds, { padH = 0.12, padV = 0.12, padNorth = 0 }) {
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const width = Math.abs(ne.lng - sw.lng);
    const height = Math.abs(ne.lat - sw.lat);

    const extraLng = width * padH;
    const southExtra = height * padV;
    const northExtra = height * (padNorth > 0 ? padNorth : padV);

    const newSw = L.latLng(sw.lat - southExtra, sw.lng - extraLng);
    const newNe = L.latLng(ne.lat + northExtra, ne.lng + extraLng);
    return L.latLngBounds(newSw, newNe);
}

/**
 * Build a fly-to payload object for marker click / prev / next navigation.
 * Ensures every call-site uses the same shape + offset logic.
 *
 * @param {L.Map|null}  map       Leaflet map instance
 * @param {number[]}    position  [lat, lng] of the marker
 * @param {number}      [offsetPx] North-pan offset in pixels (default: MARKER_CLICK_OFFSET_PX)
 * @returns {{ lat: number, lng: number, markerLat: number, markerLng: number }}
 */
export function buildMarkerClickPayload(map, position, offsetPx = MARKER_CLICK_OFFSET_PX) {
    const ll = L.latLng(position[0], position[1]);
    const panTarget = getNorthPanTarget(map, ll, offsetPx);
    return {
        lat: panTarget?.lat ?? position[0],
        lng: panTarget?.lng ?? position[1],
        markerLat: position[0],
        markerLng: position[1],
    };
}


/* ═══════════════════════════════════════════════════════════
   Alabama Mask (permanent outside-state shading)
   ═══════════════════════════════════════════════════════════ */

/**
 * Outer ring that covers the entire world — used with a hole polygon to
 * shade everything *outside* Alabama. Defined once at module level so
 * every call to `createAlabamaMask` shares the same frozen array.
 */
const MASK_OUTER_RING = Object.freeze([
    [-180, -90],
    [180, -90],
    [180, 90],
    [-180, 90],
    [-180, -90],
]);

/**
 * Add a permanent mask layer that shades everything outside Alabama.
 *
 * A dedicated `L.svg({ padding: 5.0 })` renderer is used so the mask's
 * SVG canvas extends 5× the viewport size in every direction.  This
 * ensures the mask is always pre-rendered beyond the draggable area and
 * never disappears or flickers during fast panning.
 *
 * `bringToBack()` is called after adding so counties, borders, and markers
 * all render on top of the mask.
 *
 * This utility is called **once** (guarded by a ref) so the mask layer is
 * truly permanent for the lifetime of the map.
 *
 * @param {L.Map}    map             Leaflet map instance
 * @param {object}   alabamaGeoJson  The alabama.json import (FeatureCollection)
 * @param {object}   [styleOpts]     Optional style overrides
 * @param {string}   [styleOpts.fillColor]    Fill for the shaded area (default: '#FFFFFF')
 * @param {number}   [styleOpts.fillOpacity]  Opacity of the fill (default: 0.75)
 * @param {string}   [styleOpts.borderColor]  Border around Alabama (default: 'rgba(0,0,0,0.10)')
 * @param {number}   [styleOpts.weight]       Border weight (default: 2)
 * @returns {L.GeoJSON} The mask layer (in case the caller needs to remove it)
 */
export function createAlabamaMask(map, alabamaGeoJson, styleOpts = {}) {
    if (!map || !alabamaGeoJson) return null;

    const {
        fillColor = '#FFFFFF',
        fillOpacity = 0.45,
        borderColor = 'rgba(0,0,0,0.10)',
        weight = 2,
    } = styleOpts;

    const hole = alabamaGeoJson.features[0].geometry.coordinates[0];

    // Create a dedicated SVG renderer with massive padding so the mask SVG
    // canvas extends far beyond the viewport in every direction.  This
    // prevents the "disappearing mask" during fast drags — the SVG is
    // pre-rendered well past the edges of the screen.
    const maskRenderer = L.svg({ padding: 5.0 });

    const maskLayer = L.geoJSON(
        {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [MASK_OUTER_RING, hole],
            },
        },
        {
            renderer: maskRenderer,
            interactive: false,
            style: {
                fillColor,
                fillOpacity,
                color: borderColor,
                weight,
            },
        },
    ).addTo(map);

    // Bring the mask SVG to the back of the overlay pane so GeoJSON borders,
    // county labels, and markers all render on top of it.
    try { maskLayer.bringToBack(); } catch { /* noop */ }

    return maskLayer;
}

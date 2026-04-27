// CommunityMap.jsx
import React, { useMemo } from 'react';
import CommunityMapView from './CommunityMapView';

// Default state center and zoom (must match MapUtils.js)
const DEFAULT_CENTER = [32.69, -86.79113];
const DEFAULT_ZOOM = 7.0;

// ── Stable fallback constants (defined outside the component to avoid
// creating new references on every render, which can trigger useEffect
// loops in downstream components like CommunityMapView). ──
const EMPTY_FEATURES = Object.freeze([]);
const EMPTY_POPUP_MAP = new Map(); // singleton; never mutated

// Tolerance for detecting "statewide" center
const STATEWIDE_LAT_TOLERANCE = 0.5;
const STATEWIDE_LNG_TOLERANCE = 0.5;

/**
 * Check if the given center coordinates represent a "statewide" view
 * (i.e., close to the default state center or explicitly null/undefined)
 */
function isStatewideCenter(center) {
    if (!center || !Array.isArray(center) || center.length < 2) return true;
    const [lat, lng] = center;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return true;

    const latDiff = Math.abs(lat - DEFAULT_CENTER[0]);
    const lngDiff = Math.abs(lng - DEFAULT_CENTER[1]);

    return latDiff < STATEWIDE_LAT_TOLERANCE && lngDiff < STATEWIDE_LNG_TOLERANCE;
}

/**
 * CommunityMap
 * ------------
 * Small, defensive wrapper around CommunityMapView so callers can safely pass
 * undefined/null/incorrect shapes without breaking the map.
 *
 * NOTE:
 * - CommunityMapView accepts a GeoJSON FeatureCollection OR an array of GeoJSON Features.
 * - This wrapper normalizes `data` to one of those shapes and stabilizes popupContentById.
 * - For statewide posts (center near default or null), uses DEFAULT_ZOOM to show whole state.
 */
export default function CommunityMap({
                                         data,
                                         mapRef,
                                         center,
                                         zoomLevel,
                                         hoveredId,
                                         openedPopupId,
                                         popupContentById,
                                         onMarkerClick,
                                         onPopupClose,
                                     }) {
    const safeData = useMemo(() => {
        if (data && typeof data === 'object') {
            // FeatureCollection shape
            if (data.type === 'FeatureCollection' && Array.isArray(data.features)) return data;
            // Array of features
            if (Array.isArray(data)) return data;
        }
        return EMPTY_FEATURES;
    }, [data]);

    const safePopupMap = useMemo(
        () => (popupContentById instanceof Map ? popupContentById : EMPTY_POPUP_MAP),
        [popupContentById]
    );

    // Determine effective center and zoom for statewide handling
    const effectiveCenter = useMemo(() => {
        if (isStatewideCenter(center)) {
            return DEFAULT_CENTER;
        }
        return center;
    }, [center]);

    const effectiveZoom = useMemo(() => {
        // If center is statewide (or not provided), use default zoom to show whole state.
        // The Recenter component in CommunityMapView will use flyToBounds for statewide
        // views, which auto-adapts to the container's aspect ratio (mobile vs desktop).
        if (isStatewideCenter(center)) {
            return DEFAULT_ZOOM;
        }
        // Otherwise use provided zoom or a reasonable default for zoomed-in view
        return zoomLevel ?? 11;
    }, [center, zoomLevel]);

    return (
        <CommunityMapView
            data={safeData}
            mapRef={mapRef}
            center={effectiveCenter}
            zoomLevel={effectiveZoom}
            hoveredId={hoveredId}
            openedPopupId={openedPopupId}
            popupContentById={safePopupMap}
            onMarkerClick={onMarkerClick}
            onPopupClose={onPopupClose}
        />
    );
}

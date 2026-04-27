// src/pages/community/CommunityMapView.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Chip, Drawer, IconButton, Typography, useMediaQuery } from '@mui/material';
import { alpha, styled, useTheme } from '@mui/material/styles';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PostPage from './PostDetailModal';
import SwipeableRightDrawer from '../../components/SwipeableRightDrawer';
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../components/MapView.css';

import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import RoomOutlinedIcon from '@mui/icons-material/RoomOutlined';

import alabama from '../../data/alabama.json';
import alabamaCounties from '../../data/alabamaCounties.json';
import alabamaCities from '../../data/alabamaCities.json';
import alabamaPlaces from '../../data/alabamaPlaces.json';

import {
    DEFAULT_CENTER,
    DEFAULT_ZOOM,
    MIN_ZOOM,
    MAX_ZOOM,
    ZOOM_SNAP,
    ZOOM_DELTA,
    WHEEL_PX_PER_ZOOM_LEVEL,
    MARKER_CLICK_ZOOM,
    FLY_TO_DURATION,
    PAN_TO_DURATION,
    MARKER_CLICK_OFFSET_PX,
    RECENTER_OFFSET_PX,
    PAN_FALLBACK_OFFSET_PX,
    DEFAULT_BOUNDS_PAD,
    isStatewideCenter,
    getNorthPanTarget,
    offsetCoords,
    computeBoundsWithPad,
    buildMarkerClickPayload,
    createAlabamaMask,
} from '../../utils/MapUtils';
import MapErrorBoundary from '../../components/MapErrorBoundary';
// ─── Security: sanitize any HTML string rendered in map popups to prevent XSS.
// DOMPurify strips <script>, on* handlers, javascript: URIs, etc.
// If DOMPurify isn't installed, we fall back to a strict text-only renderer.
let sanitizeHtml;
try {
    // eslint-disable-next-line global-require
    const DOMPurify = require('dompurify');
    sanitizeHtml = (dirty) => DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span', 'div', 'img', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'style'],
        ALLOW_DATA_ATTR: false,
    });
} catch {
    // Fallback: strip ALL HTML tags if DOMPurify is not available
    sanitizeHtml = (dirty) => String(dirty || '').replace(/<[^>]*>/g, '');
}


/* ───────────────────────────────────────────
   SVG-based map markers (themed, no PNGs)
   Uses MUI icon SVG paths + brand colors from theme.js
   ─────────────────────────────────────────── */

// Brand colors (matching theme.js BRAND tokens)
const BRAND_NAVY      = '#0F2D52';
const BRAND_NAVY_DARK = '#0A1F3A';
const BRAND_CRIMSON   = '#BF0D2E';
const BRAND_CRIMSON_D = '#980A24';
const BRAND_WHITE     = '#FFFFFF';
const BRAND_MIST      = '#F3F5F8';

// MUI icon SVG paths (24×24 viewBox) — one per community post category
// These match the icons used in COMMUNITY_CATEGORY_META / CommunityFilter
const ICON_PATHS = {
    // CampaignRounded — Announcements (megaphone, matches filter)
    announcement: 'M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1l5 6V3L5 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z',
    // ForumRounded — Discussion / Community Chat
    discussion: 'M20 6h-1v8c0 .55-.45 1-1 1H6v1c0 1.1.9 2 2 2h10l4 4V8c0-1.1-.9-2-2-2zm-3 5V4c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v13l4-4h9c1.1 0 2-.9 2-2z',
    // SearchRounded — Lost & Found
    'lost-and-found': 'M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.26 4.25c.41.41 1.07.41 1.48 0l.01-.01c.41-.41.41-1.07 0-1.48L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    // BarChartRounded — Polls
    poll: 'M7.5 21H2V9h5.5v12zm7.25-18h-5.5v18h5.5V3zM22 11h-5.5v10H22V11z',
    // ShieldRounded — Public Safety Alerts
    'public-safety-alerts': 'M11.3 2.26l-6 2.25C4.52 4.81 4 5.55 4 6.39v4.7c0 4.83 3.13 9.37 7.43 10.75.37.12.77.12 1.14 0C16.87 20.46 20 15.92 20 11.09v-4.7c0-.83-.52-1.58-1.3-1.87l-6-2.25c-.45-.18-.95-.18-1.4-.01zM12 11.99h0V6.51l5 1.87v3.7c0 .67-.08 1.33-.22 1.96-.16.7-.78 1.2-1.5 1.2h0c-.05 0-.1-.01-.15-.01H12V11.99zm0 0h0v3.24h-3.12c-.73 0-1.35-.5-1.5-1.2-.15-.63-.22-1.29-.22-1.96v-3.7l5-1.87v5.5h-0.16z',
    // ThumbUpRounded — Recommendations
    recommendations: 'M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z',
    // VolunteerActivismRounded — Volunteers
    volunteers: 'M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A2.01 2.01 0 0 0 18.06 7h-.12a2 2 0 0 0-1.9 1.37l-1.41 4.24L12.8 11.4a1.97 1.97 0 0 0-1.56-.42c-.77.12-1.36.79-1.36 1.57v.65l4.28 4.28c.37.37.88.58 1.41.58H18v4c0 .55.45 1 1 1s1-.45 1-1zm-7.5-10.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2 16v-7H9V9c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v6h1.5v7c0 .55.45 1 1 1h2c.55 0 1-.45 1-1z',
    // PanToolRounded — Help Requests (raised hand)
    'help-requests': 'M18 8.35V3.5C18 2.67 17.33 2 16.5 2S15 2.67 15 3.5v4.85h-1.5V1.5C13.5.67 12.83 0 12 0S10.5.67 10.5 1.5v6.85H9V2.5C9 1.67 8.33 1 7.5 1S6 1.67 6 2.5v8.22L3.85 8.57c-.48-.48-1.26-.48-1.74 0-.48.49-.48 1.27 0 1.76l5.75 7.14c.45.56 1.12.88 1.83.88H17c1.1 0 2-.9 2-2v-5.5c0-.83-.67-1.5-1.5-1.5H18z',
    // PeopleRounded — Default / generic community
    community: 'M16.67 13.13C18.04 14.06 19 15.32 19 17v3h4v-3c0-2.18-3.57-3.47-6.33-3.87zM15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4c-.47 0-.91.1-1.33.24a5.98 5.98 0 0 1 0 7.52c.42.14.86.24 1.33.24zM9 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 7c-2.67 0-8 1.34-8 4v2c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-2c0-2.66-5.33-4-8-4z',
};

/**
 * Build an inline SVG map marker pin with an embedded icon.
 *
 * Pin shape: a teardrop / map-pin silhouette rendered as an SVG.
 * The icon sits centered inside the circular head of the pin.
 *
 * @param {string} iconPath   – SVG path data for the 24×24 MUI icon
 * @param {string} pinFill    – Fill color for the pin body
 * @param {string} pinStroke  – Stroke color for the pin outline
 * @param {string} iconFill   – Fill color for the inner icon
 * @param {string} shadowFill – Color for the drop-shadow ellipse
 */
const buildMarkerSvg = (iconPath, pinFill, pinStroke, iconFill, shadowFill) => `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 40 56">
  <!-- Drop shadow ellipse -->
  <ellipse cx="20" cy="53" rx="8" ry="3" fill="${shadowFill}" opacity="0.18"/>
  <!-- Pin body (teardrop) -->
  <path d="M20 2C11.16 2 4 9.16 4 18c0 11.25 14.25 32 15.19 33.38a1 1 0 0 0 1.62 0C21.75 50 36 29.25 36 18c0-8.84-7.16-16-16-16z"
        fill="${pinFill}" stroke="${pinStroke}" stroke-width="1.5"/>
  <!-- White circle background for icon -->
  <circle cx="20" cy="18" r="11" fill="${BRAND_WHITE}" opacity="0.92"/>
  <!-- MUI icon (scaled from 24×24 to fit inside circle) -->
  <g transform="translate(11, 9) scale(0.75)">
    <path d="${iconPath}" fill="${iconFill}"/>
  </g>
</svg>`;

/**
 * Create a Leaflet DivIcon from an inline SVG string.
 */
const makeSvgDivIcon = (svgHtml) =>
    L.divIcon({
        className: 'community-div-icon',
        iconSize: [32, 44],
        iconAnchor: [16, 44],
        popupAnchor: [0, -44],
        html: `<div style="position:relative;width:32px;height:44px;" class="marker-icon-wrap">
      <div class="marker-icon" style="width:32px;height:44px;">${svgHtml}</div>
    </div>`,
    });

// Pre-build category → { base, active } icon pairs
// base  = navy pin with category icon
// active = crimson pin with category icon (hover/selected)
const CATEGORY_MARKER_DEFS = {};

const registerCategory = (keys, iconKey) => {
    const path = ICON_PATHS[iconKey] || ICON_PATHS.community;
    const base = makeSvgDivIcon(buildMarkerSvg(path, BRAND_NAVY, BRAND_NAVY_DARK, BRAND_NAVY, BRAND_NAVY_DARK));
    const active = makeSvgDivIcon(buildMarkerSvg(path, BRAND_CRIMSON, BRAND_CRIMSON_D, BRAND_CRIMSON, BRAND_CRIMSON_D));
    keys.forEach((k) => { CATEGORY_MARKER_DEFS[k] = { base, active }; });
};

// Announcements (CampaignRounded)
registerCategory(['announcement', 'announcements'], 'announcement');
// Discussion / Community Chat (ForumRounded)
registerCategory(['community-chat', 'discussion'], 'discussion');
// Lost & Found (SearchRounded)
registerCategory(['lost-and-found', 'lost-found'], 'lost-and-found');
// Polls (BarChartRounded)
registerCategory(['poll', 'polls'], 'poll');
// Public Safety Alerts (ShieldRounded)
registerCategory(['public-safety-alerts'], 'public-safety-alerts');
// Recommendations / Tips (ThumbUpRounded)
registerCategory(['recommendation', 'recommendations', 'tips', 'recommendations-tips'], 'recommendations');
// Volunteers (VolunteerActivismRounded)
registerCategory(['volunteers', 'volunteer', 'volunteer_requests'], 'volunteers');
// Help Requests (PanToolRounded — raised hand)
registerCategory([
    'help-requests', 'help_requests', 'helprequests', 'help-request', 'help request',
    'volunteer-and-help-requests', 'volunteer-help', 'volunteer-help-requests',
    'volunteer_help_requests', 'volunteer-requests',
], 'help-requests');
// Default / generic community / events (PeopleRounded)
registerCategory(['event', 'events', 'community'], 'community');

// Build flat lookup objects from CATEGORY_MARKER_DEFS
const CATEGORY_ICON_MAP = {};
const CATEGORY_ICON_MAP_GOLD = {};
Object.entries(CATEGORY_MARKER_DEFS).forEach(([key, { base, active }]) => {
    CATEGORY_ICON_MAP[key] = base;
    CATEGORY_ICON_MAP_GOLD[key] = active;
});

/* ───────────────────────────────────────────
   Map constants & wrapper
   ─────────────────────────────────────────── */
const RAW_BOUNDS = L.geoJSON(alabama.features[0]).getBounds();

const MapWrapper = styled(Box)(({ theme }) => ({
    position: 'relative',
    width: '100%',
    height: '100%',
    '& .leaflet-container': {
        width: '100%',
        height: '100%',
        backgroundColor: theme.palette.background.default,
        backgroundImage: `radial-gradient(900px 420px at 12% 8%, ${alpha(theme.palette.secondary.main, 0.06)} 0%, transparent 58%), radial-gradient(820px 420px at 92% 0%, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 62%)`,
    },

    // Center attribution just above the bottom of the panel
    '& .leaflet-control-attribution': {
        bottom: '32px !important',
        left: '50% !important',
        transform: 'translateX(-50%)',
        textAlign: 'center',
    },

    '& .leaflet-tooltip.ll-county-label': {
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        padding: 0,
        margin: 0,
        color: alpha(theme.palette.text.primary, 0.34),
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
    },
    '& .leaflet-tooltip.ll-county-label:before': { display: 'none' },

    '& .ll-city-label': { background: 'transparent', border: 'none' },
    '& .ll-city-label span': {
        display: 'inline-block',
        transform: 'translate(-50%, -50%)',
        whiteSpace: 'nowrap',
        color: alpha(theme.palette.text.primary, 0.38),
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.02em',
        textShadow: `0 1px 0 ${alpha(theme.palette.background.default, 0.85)}`,
        pointerEvents: 'none',
    },


    // ───────────────────────────────────────────
    // Polished popup styling (UI only)
    // ───────────────────────────────────────────
    '& .leaflet-popup': {
        marginBottom: 6,
    },
    '& .leaflet-popup-content-wrapper': {
        background: `${theme.palette.background.paper} !important`,
        color: `${theme.palette.text.primary} !important`,
        borderRadius: 18,
        padding: 0,
        overflow: 'visible',
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.custom.shadows.lg,
    },
    '& .leaflet-popup-content': {
        margin: 0,
        width: 'auto',
        lineHeight: 1.2,
        overflow: 'hidden',
        borderRadius: 18,
    },
    '& .leaflet-popup-tip': {
        background: `${theme.palette.background.paper} !important`,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.custom.shadows.md,
    },
    '& .leaflet-popup-close-button': {
        width: 28,
        height: 28,
        top: 10,
        right: 10,
        borderRadius: 999,
        color: theme.palette.text.secondary,
        background: `${theme.palette.background.paper} !important`,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.custom.shadows.sm,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    '& .leaflet-popup-close-button:hover': {
        color: theme.palette.text.primary,
        background: `${theme.palette.action.hover} !important`,
    },

    // In the map marker popup, we want owner Edit/Delete actions to be icon-only
    '& .ll-map-popup-content .ll-owner-action-label': {
        display: 'none',
    },
    '& .ll-map-popup-content .ll-owner-actions': {
        gap: 1,
    },
    '& .ll-map-popup-content .ll-owner-action-btn': {
        minWidth: 0,
        paddingLeft: 10,
        paddingRight: 10,
    },
    '& .ll-map-popup-content .ll-owner-action-btn .MuiButton-startIcon': {
        marginRight: 0,
        marginLeft: 0,
    },

    // Ensure MUI Tooltip / Popper / Menu portals inside Leaflet popups
    // don't leave ghost elements stranded at the viewport origin (0,0)
    // when their anchor unmounts or the popover closes.
    '& .leaflet-popup .MuiTooltip-popper[data-popper-reference-hidden="true"]': {
        visibility: 'hidden',
        pointerEvents: 'none',
    },
    '& .leaflet-popup .MuiPopover-root': {
        // Allow MUI popovers to escape the Leaflet popup clipping context
        position: 'fixed',
    },

    // MUI portals Tooltips to <body>, so also target them globally when
    // their reference anchor has been hidden (e.g. Leaflet popup closed/re-rendered).
    // The `*` selector is scoped to descendant of MapWrapper, but Popper portals
    // to body — so we add a <style> via the global override below instead.
}));

// Global style: hide any MUI Tooltip/Popper whose reference element has disappeared
// (Popper.js sets data-popper-reference-hidden="true" when the anchor is gone).
const GLOBAL_POPPER_CSS = `
.MuiTooltip-popper[data-popper-reference-hidden="true"],
.MuiPopper-root[data-popper-reference-hidden="true"] {
    visibility: hidden !important;
    pointer-events: none !important;
    opacity: 0 !important;
}
`;

/* ───────────────────────────────────────────
   Helper overlays (same as your original)
   ─────────────────────────────────────────── */
const RemovePrefix = () => {
    const map = useMap();
    useEffect(() => {
        try {
            map?.attributionControl?.setPrefix?.('');
        } catch {}
    }, [map]);
    return null;
};

/** Create a "hole" for Alabama; keep it themed. */

function featureToLatLng(feature) {
    if (!feature || !feature.geometry) return null;
    const { type, coordinates } = feature.geometry;

    if (type === 'Point' && Array.isArray(coordinates) && coordinates.length >= 2) {
        const [lng, lat] = coordinates;
        if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
    }
    return null;
}

function normalizeCityFeatures(geo) {
    const features = geo?.features || [];
    if (!Array.isArray(features)) return [];
    const out = [];
    for (const f of features) {
        const name = String(f?.properties?.NAME || '').trim();
        if (!name) continue;
        const latLng = featureToLatLng(f);
        if (!latLng) continue;
        out.push({ name, coordinates: latLng });
    }
    out.sort((a, b) => a.name.localeCompare(b.name));
    return out;
}

function CityLabels({ cities, minZoom = 9, maxLabels = 140 }) {
    const map = useMap();
    const [visible, setVisible] = useState([]);

    useEffect(() => {
        if (!map) return;

        const update = () => {
            const z = map.getZoom();
            if (z < minZoom) {
                setVisible([]);
                return;
            }

            const b = map.getBounds();
            const next = [];
            for (const c of cities) {
                const [lat, lng] = c.coordinates;
                if (b.contains([lat, lng])) next.push(c);
                if (next.length >= maxLabels) break;
            }
            setVisible(next);
        };

        update();
        map.on('zoomend', update);
        map.on('moveend', update);
        return () => {
            map.off('zoomend', update);
            map.off('moveend', update);
        };
    }, [map, cities, minZoom, maxLabels]);

    if (!visible.length) return null;

    return (
        <>
            {visible.map((c) => (
                <Marker
                    key={`city-label-${c.name}`}
                    position={c.coordinates}
                    interactive={false}
                    icon={L.divIcon({
                        className: 'll-city-label',
                        html: `<span>${c.name}</span>`,
                        iconSize: [0, 0],
                    })}
                />
            ))}
        </>
    );
}



function PlacesOutlines({ data, minZoom = 9 }) {
    const map = useMap();
    const theme = useTheme();
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (!map) return;

        const update = () => {
            try {
                setShow(map.getZoom() >= minZoom);
            } catch {
                setShow(false);
            }
        };

        update();
        map.on('zoomend', update);
        return () => {
            map.off('zoomend', update);
        };
    }, [map, minZoom]);

    if (!show) return null;

    return (
        <GeoJSON
            data={data}
            style={{
                color: alpha(theme.palette.text.primary, 0.12),
                weight: 1,
                fillOpacity: 0,
            }}
        />
    );
}

const MaskController = () => {
    const map = useMap();
    const theme = useTheme();
    const maskRef = useRef(null);

    useEffect(() => {
        if (!map || maskRef.current) return;
        maskRef.current = createAlabamaMask(map, alabama, {
            fillColor: theme.palette.background.default,
            fillOpacity: 0.45,
            borderColor: alpha(theme.palette.text.primary, 0.10),
            weight: 2,
        });
    }, [map]); // eslint-disable-line react-hooks/exhaustive-deps

    return null;
};

/** Keep the map's max bounds in sync (changes with expanded mode). */
const BoundsController = ({ bounds }) => {
    const map = useMap();
    useEffect(() => {
        try {
            map?.setMaxBounds?.(bounds);
        } catch {}
    }, [map, bounds]);
    return null;
};

/**
 * Keep the view steady at center/zoom that we control from parent.
 * NOW: Detects statewide centers and uses DEFAULT_ZOOM for them.
 * Also pans north when there's an open popup to ensure full visibility.
 */
/**
 * Check whether the Leaflet map container is actually visible with real
 * dimensions. Leaflet's own getSize() can return stale cached values,
 * so we read the DOM directly via offsetWidth/offsetHeight.
 */
const isMapContainerReady = (map) => {
    try {
        const el = map.getContainer?.();
        if (!el) return false;
        // offsetWidth/Height are 0 when the element (or an ancestor)
        // is display:none, or when the drawer hasn't finished painting.
        return el.offsetWidth > 0 && el.offsetHeight > 0;
    } catch {
        return false;
    }
};

const Recenter = ({ center, zoomLevel, openedPopupId, markerPosition }) => {
    const map = useMap();
    const lastKeyRef = useRef(null);
    const retryTimerRef = useRef(null);

    useEffect(() => {
        // Cleanup any pending retry on unmount or dep change
        return () => {
            if (retryTimerRef.current) {
                clearTimeout(retryTimerRef.current);
                retryTimerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!map) return;
        if (!center?.length) return;

        // Determine if this is a statewide view
        const isStatewide = isStatewideCenter(center);

        // Use DEFAULT_ZOOM for statewide, otherwise use provided zoom or calculate appropriate zoom
        // Respect the zoomLevel prop even for statewide — the parent (CommunityMap)
        // may pass a mobile-adjusted zoom that differs from DEFAULT_ZOOM.
        const effectiveZoom = isStatewide
            ? (zoomLevel ?? DEFAULT_ZOOM)
            : (zoomLevel ?? MARKER_CLICK_ZOOM);

        // For statewide, use exact default center
        const effectiveCenter = isStatewide ? DEFAULT_CENTER : center;

        // Include openedPopupId in the key so clicking a new pin always triggers recenter
        // even if the user manually zoomed/panned and center+zoom state didn't change.
        // Use marker position in the key (not openedPopupId) so that cycling
        // through stacked items at the SAME coordinate does not re-trigger flyTo.
        const posKey = markerPosition ? `${markerPosition[0].toFixed(5)},${markerPosition[1].toFixed(5)}` : '';
        const key = `${effectiveCenter[0].toFixed(5)},${effectiveCenter[1].toFixed(5)}|${effectiveZoom.toFixed(1)}|${posKey}`;

        if (lastKeyRef.current === key) {
            return;
        }

        lastKeyRef.current = key;

        /**
         * Guard: Leaflet's flyTo/panTo internally projects pixel coordinates using
         * the container's DOM dimensions. If the container has zero width/height
         * (e.g. the MUI Drawer is closed, animating in, or not yet painted), the
         * projection produces NaN, which crashes the animation loop.
         *
         * We check the actual DOM offsetWidth/offsetHeight (not Leaflet's cached
         * getSize which can be stale) and retry with increasing delays until the
         * container is ready, falling back to a non-animated setView.
         */
        const doRecenter = (retriesLeft) => {
            try {
                if (!isMapContainerReady(map)) {
                    // Container not visible/sized yet — invalidate cache and retry
                    try { map.invalidateSize({ animate: false }); } catch {}
                    if (retriesLeft > 0) {
                        retryTimerRef.current = setTimeout(() => doRecenter(retriesLeft - 1), 150);
                    } else {
                        // Last resort: setView without animation (no frame loop = no NaN)
                        try { map.setView(effectiveCenter, effectiveZoom, { animate: false }); } catch {}
                    }
                    return;
                }

                // Container is ready — tell Leaflet to re-measure before animating
                try { map.invalidateSize({ animate: false }); } catch {}

                // If already at the target zoom, panTo for a smooth slide
                // instead of flyTo which does a zoom-out-then-in arc.
                const currentZoom = map.getZoom();
                const alreadyAtZoom = Math.abs(currentZoom - effectiveZoom) < 0.5;

                if (openedPopupId && markerPosition && !isStatewide) {
                    const markerLatLng = L.latLng(markerPosition[0], markerPosition[1]);
                    const panTarget = getNorthPanTarget(map, markerLatLng, RECENTER_OFFSET_PX, effectiveZoom);
                    if (alreadyAtZoom) {
                        map.panTo([panTarget.lat, panTarget.lng], { animate: true, duration: PAN_TO_DURATION });
                    } else {
                        map.flyTo([panTarget.lat, panTarget.lng], effectiveZoom, { animate: true, duration: FLY_TO_DURATION });
                    }
                } else if (isStatewide) {
                    // For statewide views, use fitBounds so Leaflet auto-calculates
                    // the perfect zoom for the actual container dimensions. This
                    // ensures the full state fits on both wide desktop and narrow mobile.
                    try {
                        map.flyToBounds(RAW_BOUNDS, {
                            animate: true,
                            duration: FLY_TO_DURATION,
                            padding: [20, 12],   // small padding so edges aren't flush
                            maxZoom: DEFAULT_ZOOM, // don't zoom in past desktop default
                        });
                    } catch {
                        map.setView(effectiveCenter, effectiveZoom, { animate: false });
                    }
                } else {
                    if (alreadyAtZoom) {
                        map.panTo(effectiveCenter, { animate: true, duration: PAN_TO_DURATION });
                    } else {
                        map.flyTo(effectiveCenter, effectiveZoom, { animate: true, duration: FLY_TO_DURATION });
                    }
                }
            } catch {}
        };

        // Clear any pending retry from a previous key
        if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current);
            retryTimerRef.current = null;
        }

        doRecenter(8);
    }, [map, center, zoomLevel, openedPopupId, markerPosition]);

    return null;
};

/**
 * After a popup opens, pan the map north to ensure the popup is fully visible.
 * This handles the case where the popup opens but gets cut off at the top.
 */
const PanOnPopupOpen = ({ openedPopupId, markerRefs }) => {
    const map = useMap();
    const lastPannedIdRef = useRef(null);
    const lastPannedPosRef = useRef(null);

    useEffect(() => {
        if (!map || !openedPopupId) {
            lastPannedIdRef.current = null;
            lastPannedPosRef.current = null;
            return;
        }

        // Avoid re-panning for the same popup
        if (lastPannedIdRef.current === String(openedPopupId)) {
            return;
        }

        // Longer delay — Recenter handles the initial setView + zoom.
        // This acts as a fallback pan correction after the animation settles.
        const timeoutId = setTimeout(() => {
            try {
                // Guard: skip if the map container isn't visible yet
                if (!isMapContainerReady(map)) return;

                const marker = markerRefs?.current?.[String(openedPopupId)];
                if (!marker) return;

                const latlng = marker.getLatLng();
                if (!latlng) return;

                // Skip pan if the position is effectively the same (cycling within a group)
                const prev = lastPannedPosRef.current;
                if (prev && Math.abs(prev.lat - latlng.lat) < 0.00001 && Math.abs(prev.lng - latlng.lng) < 0.00001) {
                    lastPannedIdRef.current = String(openedPopupId);
                    return;
                }

                // By now the zoom animation from Recenter should be settled,
                // so map.getZoom() returns the correct target zoom.
                const panTarget = getNorthPanTarget(map, latlng, PAN_FALLBACK_OFFSET_PX);

                map.panTo(panTarget, { animate: true, duration: PAN_TO_DURATION });

                lastPannedIdRef.current = String(openedPopupId);
                lastPannedPosRef.current = latlng;
            } catch {}
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [map, openedPopupId, markerRefs]);

    return null;
};


/** Close the active post popup after the user zooms out more than 2 scroll-zoom steps. */
const ZoomDismissOnZoomOut = ({ openedPopupId, onPopupClose, maxZoomOutSteps = 2 }) => {
    const map = useMap();

    const openedIdRef = useRef(null);
    const lastZoomRef = useRef(null);
    const zoomOutStepsRef = useRef(0);
    const onCloseRef = useRef(onPopupClose);

    useEffect(() => {
        onCloseRef.current = onPopupClose;
    }, [onPopupClose]);

    useEffect(() => {
        const opened = openedPopupId != null ? String(openedPopupId) : null;
        openedIdRef.current = opened;
        zoomOutStepsRef.current = 0;
        try {
            lastZoomRef.current = map?.getZoom?.();
        } catch {
            lastZoomRef.current = null;
        }
    }, [openedPopupId, map]);

    useEffect(() => {
        if (!map) return undefined;

        const handleZoomEnd = () => {
            const opened = openedIdRef.current;
            let newZoom = null;
            try {
                newZoom = map.getZoom();
            } catch {
                newZoom = null;
            }

            const lastZoom = lastZoomRef.current;

            if (!opened) {
                lastZoomRef.current = newZoom;
                return;
            }

            if (typeof newZoom === 'number' && typeof lastZoom === 'number' && newZoom < lastZoom) {
                zoomOutStepsRef.current += 1;

                if (zoomOutStepsRef.current > maxZoomOutSteps) {
                    zoomOutStepsRef.current = 0;
                    openedIdRef.current = null;

                    try {
                        map.closePopup();
                    } catch {}

                    const fn = onCloseRef.current;
                    if (typeof fn === 'function') fn(opened);
                }
            } else if (typeof newZoom === 'number' && typeof lastZoom === 'number' && newZoom > lastZoom) {
                // If they zoom in again, reset the "zoom out" counter.
                zoomOutStepsRef.current = 0;
            }

            lastZoomRef.current = newZoom;
        };

        map.on('zoomend', handleZoomEnd);
        return () => {
            map.off('zoomend', handleZoomEnd);
        };
    }, [map, maxZoomOutSteps]);

    return null;
};

function normalizePostId(value) {
    if (value === null || typeof value === 'undefined') return null;
    const s = String(value).trim();
    if (!s) return null;
    const m = s.match(/(\d+)(?!.*\d)/);
    return m?.[1] ? m[1] : s;
}

function getFeaturePostId(feature) {
    const p = feature?.properties || {};
    return normalizePostId(p.id ?? p.post_id ?? p.postId ?? p.postID ?? feature?.id);
}

function getFeatureOwnerUserId(feature) {
    const p = feature?.properties || {};
    const raw =
        p.user_id ??
        p.userId ??
        p.author_id ??
        p.authorId ??
        p.owner_id ??
        p.ownerId ??
        p.created_by ??
        p.createdBy ??
        p.poster_id ??
        p.posterId ??
        null;

    if (raw === null || typeof raw === 'undefined') return null;
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
    const s = String(raw).trim();
    if (!s) return null;
    const n2 = Number(s);
    if (Number.isFinite(n2)) return n2;
    return null;
}

function resolvePopupNode(source, id) {
    if (!source) return null;

    const raw = id;
    const s = String(id);
    const norm = normalizePostId(id);

    // Map keys are strict: string "123" !== number 123.
    const candidates = [raw, s];

    if (norm && norm !== s) candidates.push(norm);
    const n1 = Number(s);
    if (Number.isFinite(n1)) candidates.push(n1);
    if (norm) {
        const n2 = Number(norm);
        if (Number.isFinite(n2)) candidates.push(n2);
    }

    // legacy keys (keep backwards compatibility)
    candidates.push(`c${s}`, `post-${s}`, `p${s}`);
    if (norm) candidates.push(`c${norm}`, `post-${norm}`, `p${norm}`);

    if (source instanceof Map) {
        for (const k of candidates) {
            if (source.has(k)) return source.get(k);
        }
        return null;
    }

    for (const k of candidates) {
        const v = source[k];
        if (v != null) return v;
    }
    return null;
}

function unwrapPopupPayload(value) {
    if (value === null || typeof value === 'undefined') return { node: null, meta: null };

    // HTML strings (legacy)
    if (typeof value === 'string') return { node: value, meta: null };

    // React elements (legacy)
    if (React.isValidElement(value)) return { node: value, meta: null };

    // Newer callers may pass an object wrapper: { content | html | node | element, meta, ... }
    if (typeof value === 'object') {
        const node =
            value.content ??
            value.node ??
            value.element ??
            value.jsx ??
            value.html ??
            null;

        const inferredMeta = {
            isResolved: value.isResolved ?? value.is_resolved ?? value.resolved ?? null,
            resolutionText: value.resolutionText ?? value.resolution_text ?? null,
            ownerUserId:
                value.ownerUserId ??
                value.owner_user_id ??
                value.userId ??
                value.user_id ??
                value.authorId ??
                value.author_id ??
                value.createdBy ??
                value.created_by ??
                value.ownerId ??
                value.owner_id ??
                null,
        };

        const hasInferred =
            (inferredMeta.isResolved !== null && typeof inferredMeta.isResolved !== 'undefined') ||
            (typeof inferredMeta.resolutionText === 'string' && inferredMeta.resolutionText.trim()) ||
            (inferredMeta.ownerUserId !== null && typeof inferredMeta.ownerUserId !== 'undefined');

        const meta = value.meta ?? (hasInferred ? inferredMeta : null);

        if (node !== null && typeof node !== 'undefined') {
            return { node, meta };
        }

        // If they passed the React node directly as an object (e.g., fragments/arrays), fall back.
        return { node: value, meta };
    }

    // Numbers, arrays, etc. are valid React nodes — just pass through.
    return { node: value, meta: null };
}

/* ════════════════════════════════════════════
   MapView component
   ════════════════════════════════════════════ */

// Hoisted outside the component so the default reference is stable across renders.
// Creating `{ features: [] }` inline in the parameter list would produce a brand-new
// object on every render, which destabilises every useMemo / useEffect that depends
// on `data` and causes an infinite update loop.
const EMPTY_FEATURE_COLLECTION = { features: [] };

export default function CommunityMap({
                                         data = EMPTY_FEATURE_COLLECTION,
                                         center = DEFAULT_CENTER,
                                         zoomLevel,
                                         hoveredId,
                                         mapRef,
                                         onMarkerClick,
                                         onPopupClose,
                                         openedPopupId,
                                         popupContentById,
                                         posts: postsProp,
                                         user,
                                         expanded = false,
                                         expandedPadH = 0.60,
                                         expandedPadV = 0.50,
                                         defaultPadH = 0.60,
                                         defaultPadV = 0.50,
                                     }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isDarkMode = theme.palette.mode === 'dark';

    // Build postsById lookup from the raw posts array
    const postsById = useMemo(() => {
        const map = new Map();
        const arr = Array.isArray(postsProp) ? postsProp : [];
        for (const post of arr) {
            if (!post || post.id == null) continue;
            const idStr = String(post.id);
            map.set(idStr, post);
            const idNum = Number(idStr);
            if (Number.isFinite(idNum)) map.set(idNum, post);
        }
        return map;
    }, [postsProp]);

    const tileUrlNoLabels = isDarkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png';

    const cityList = useMemo(() => normalizeCityFeatures(alabamaCities), []);

    const normalizedData = useMemo(() => {
        if (Array.isArray(data?.features)) return data;
        if (Array.isArray(data)) {
            const features = data
                .filter((p) => Number(p?.lat ?? p?.latitude) && Number(p?.lng ?? p?.longitude))
                .map((p) => {
                    const id = p.id ?? p.properties?.id;
                    const lat = Number(p.lat ?? p.latitude);
                    const lng = Number(p.lng ?? p.longitude);
                    const cat = String(p.category || 'event').toLowerCase();
                    const pics = Array.isArray(p.photos) ? p.photos.filter(Boolean) : [];
                    return {
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: [lng, lat] },
                        properties: { id, category: cat, photos: pics, title: p.title || '' },
                    };
                });
            return { features };
        }
        return EMPTY_FEATURE_COLLECTION;
    }, [data]);

    // Keep track of hidden/blocked users so the map can immediately remove their markers
    // when actions happen from the UserCardPopover (or anywhere else dispatching these events).
    const [hiddenUserIds, setHiddenUserIds] = useState(() => new Set());
    const [blockedUserIds, setBlockedUserIds] = useState(() => new Set());

    const filteredData = useMemo(() => {
        const features = Array.isArray(normalizedData?.features) ? normalizedData.features : [];

        if (hiddenUserIds.size === 0 && blockedUserIds.size === 0) return normalizedData;

        const hiddenOrBlocked = (ownerId) =>
            ownerId != null && (hiddenUserIds.has(Number(ownerId)) || blockedUserIds.has(Number(ownerId)));

        const nextFeatures = features.filter((f) => {
            const ownerId = getFeatureOwnerUserId(f);
            // If we can't determine an owner, keep it.
            if (ownerId === null) return true;
            return !hiddenOrBlocked(ownerId);
        });

        return { ...normalizedData, features: nextFeatures };
    }, [normalizedData, hiddenUserIds, blockedUserIds]);

    const markerRefs = useRef({});
    const [activeIdxByGroup, setActiveIdxByGroup] = useState({});
    const animRef = useRef(null);
    const iconElRef = useRef(null);
    const lastOpenedKeyRef = useRef(null);

    // Local hover/selection for marker icon swapping (navy ↔ crimson)
    const [hoveredMarkerIdLocal, setHoveredMarkerIdLocal] = useState(null);
    const [selectedMarkerIdLocal, setSelectedMarkerIdLocal] = useState(null);

    const hoveredKeyExternal = useMemo(() => {
        const k = normalizePostId(hoveredId);
        return k || (hoveredId != null ? String(hoveredId) : null);
    }, [hoveredId]);

    // Keep our local 'selected' marker in sync with the opened popup id
    useEffect(() => {
        const k = normalizePostId(openedPopupId);
        if (k) {
            setSelectedMarkerIdLocal(String(k));
        } else if (openedPopupId != null && String(openedPopupId).trim()) {
            setSelectedMarkerIdLocal(String(openedPopupId));
        } else {
            setSelectedMarkerIdLocal(null);
        }
    }, [openedPopupId]);


    // Keep map markers/popup in sync with global Hide/Block actions (e.g., from UserCardPopover).
    useEffect(() => {
        const getPopupOwnerUserId = (postId) => {
            if (!postId) return null;

            // Prefer reading the author from the GeoJSON feature (most reliable for Map filtering).
            const pid = normalizePostId(postId) || String(postId);
            const features = Array.isArray(filteredData?.features) ? filteredData.features : [];
            const feat = features.find((f) => {
                const fid = getFeaturePostId(f);
                return fid != null && String(fid) === String(pid);
            });
            const fromFeature = feat ? getFeatureOwnerUserId(feat) : null;
            if (fromFeature != null) return fromFeature;

            // Fallback: attempt to infer from popup payload meta (if provided by caller).
            const resolvedPayloadRaw = resolvePopupNode(popupContentById, postId);
            const { meta } = unwrapPopupPayload(resolvedPayloadRaw);
            const raw = meta?.ownerUserId ?? meta?.userId ?? meta?.authorId ?? null;
            if (raw === null || typeof raw === 'undefined') return null;
            const n = Number(raw);
            if (Number.isFinite(n)) return n;
            const s = String(raw).trim();
            if (!s) return null;
            const n2 = Number(s);
            if (Number.isFinite(n2)) return n2;
            return null;
        };

        const maybeCloseIfOwner = (userIdNum) => {
            const opened = openedPopupId != null ? String(openedPopupId).trim() : '';
            if (!opened) return;

            const ownerId = getPopupOwnerUserId(opened);
            if (!ownerId || Number(ownerId) !== Number(userIdNum)) return;

            try {
                mapRef?.current?.closePopup?.();
            } catch {}

            setSelectedMarkerIdLocal(null);
            if (typeof onPopupClose === 'function') onPopupClose(opened);
        };

        const handleHiddenChanged = (e) => {
            const d = e?.detail || {};
            const userIdNum = Number(d.userId);
            if (!Number.isFinite(userIdNum)) return;
            const hidden = Boolean(d.hidden);

            setHiddenUserIds((prev) => {
                const next = new Set(prev);
                if (hidden) next.add(userIdNum);
                else next.delete(userIdNum);
                return next;
            });

            if (hidden) maybeCloseIfOwner(userIdNum);
        };

        const handleBlockedChanged = (e) => {
            const d = e?.detail || {};
            const userIdNum = Number(d.userId);
            if (!Number.isFinite(userIdNum)) return;
            const blocked = Boolean(d.blocked);

            setBlockedUserIds((prev) => {
                const next = new Set(prev);
                if (blocked) next.add(userIdNum);
                else next.delete(userIdNum);
                return next;
            });

            // Blocking should effectively hide that user's posts UI-wise.
            if (blocked) {
                setHiddenUserIds((prev) => {
                    const next = new Set(prev);
                    next.add(userIdNum);
                    return next;
                });
            }

            if (blocked) maybeCloseIfOwner(userIdNum);
        };

        window.addEventListener('ll:user:hidden-changed', handleHiddenChanged);
        window.addEventListener('ll:user:blocked-changed', handleBlockedChanged);

        return () => {
            window.removeEventListener('ll:user:hidden-changed', handleHiddenChanged);
            window.removeEventListener('ll:user:blocked-changed', handleBlockedChanged);
        };
    }, [openedPopupId, popupContentById, mapRef, onPopupClose, filteredData]);


    // cleanup any previous hover animation, then apply for hovered marker
    useEffect(() => {
        if (animRef.current) {
            try {
                animRef.current.cancel?.();
            } catch {}
            animRef.current = null;
        }
        if (iconElRef.current) {
            try {
                iconElRef.current.style.transform = '';
            } catch {}
            iconElRef.current = null;
        }

        if (hoveredId != null) {
            const hid = normalizePostId(hoveredId) || String(hoveredId);
            const marker = markerRefs.current[`c${hid}`];
            const img = marker?.getElement()?.querySelector('.marker-icon');
            if (img) {
                iconElRef.current = img;
                img.style.transformOrigin = '50% 100%';
                animRef.current = img.animate(
                    [{ transform: 'translateY(0)' }, { transform: 'translateY(-15px)' }],
                    {
                        duration: 600,
                        iterations: Infinity,
                        easing: 'ease-in-out',
                        direction: 'alternate',
                    }
                );
            }
        }

        return () => {
            if (animRef.current) {
                try {
                    animRef.current.cancel?.();
                } catch {}
                animRef.current = null;
            }
            if (iconElRef.current) {
                try {
                    iconElRef.current.style.transform = '';
                } catch {}
                iconElRef.current = null;
            }
        };
    }, [hoveredId]);

    // Group by coord then by category using a normalized post id
    const coordCat = useMemo(() => {
        const out = {};
        (filteredData.features || []).forEach((f) => {
            const coords = f?.geometry?.coordinates;
            if (!Array.isArray(coords) || coords.length < 2) return;
            const [lng, lat] = coords;
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

            const coordKey = `${lat.toFixed(6)}_${lng.toFixed(6)}`;
            const cat = String(f?.properties?.category || 'event').toLowerCase();
            const id = getFeaturePostId(f);
            if (id == null) return;

            ((out[coordKey] ||= {})[cat] ||= []).push(id);
        });
        return out;
    }, [filteredData]);

    const markerEntries = useMemo(() => {
        const entries = [];
        const currentZoom = mapRef?.current?.getZoom?.() ?? DEFAULT_ZOOM;

        Object.entries(coordCat).forEach(([coordKey, catMap]) => {
            const catKeys = Object.keys(catMap).sort();
            catKeys.forEach((cat, i) => {
                const ids = catMap[cat];
                const firstId = ids?.[0];
                if (firstId == null) return;

                const feature = (filteredData.features || []).find(
                    (ff) => String(getFeaturePostId(ff)) === String(firstId)
                );
                if (!feature) return;

                const coords = feature?.geometry?.coordinates;
                if (!Array.isArray(coords) || coords.length < 2) return;

                const [lng, lat] = coords;
                const position = offsetCoords([lat, lng], i, catKeys.length, currentZoom);
                entries.push({ groupKey: `${coordKey}|${cat}`, position, cat, ids });
            });
        });

        return entries;
    }, [coordCat, filteredData, mapRef]);

    // Map of id -> group index (for stacked marker navigation)
    const idToGroupIndex = useMemo(() => {
        const map = new Map();
        markerEntries.forEach(({ groupKey, ids }) => {
            (ids || []).forEach((id, idx) => {
                const key = normalizePostId(id) || String(id);
                map.set(key, { groupKey, idx });
            });
        });
        return map;
    }, [markerEntries]);

    // Keep active index synced to openedPopupId (so stacked markers open the correct post)
    useEffect(() => {
        const openedKey = normalizePostId(openedPopupId);
        if (!openedKey) return;

        const info = idToGroupIndex.get(openedKey);
        if (!info) return;

        setActiveIdxByGroup((prev) => {
            const current = prev?.[info.groupKey];
            if (current === info.idx) return prev;
            return { ...prev, [info.groupKey]: info.idx };
        });
    }, [openedPopupId, idToGroupIndex]);

    // Only open the popup once it is actually rendered for the currently selected id.
    const openReady = useMemo(() => {
        const openedKey = normalizePostId(openedPopupId);
        if (!openedKey) return null;
        for (const { groupKey, ids } of markerEntries) {
            const idx = activeIdxByGroup[groupKey] ?? 0;
            const active = ids?.[idx];
            const activeKey = normalizePostId(active);
            if (activeKey && String(activeKey) === String(openedKey)) {
                return { key: String(openedKey), groupKey };
            }
        }
        return null;
    }, [openedPopupId, markerEntries, activeIdxByGroup]);

    useEffect(() => {
        if (!openReady) {
            if (openedPopupId == null) lastOpenedKeyRef.current = null;
            return;
        }

        if (lastOpenedKeyRef.current === openReady.key) return;
        const marker = markerRefs.current[openReady.key];
        if (!marker) return;
        try {
            marker.openPopup();
            lastOpenedKeyRef.current = openReady.key;
        } catch {}
    }, [openReady, openedPopupId]);

    // Get the marker position for the currently opened popup (for north pan calculation)
    const openedMarkerPosition = useMemo(() => {
        if (!openedPopupId) return null;
        const openedKey = normalizePostId(openedPopupId);
        if (!openedKey) return null;

        for (const { ids, position } of markerEntries) {
            const idx = activeIdxByGroup[ids?.[0] ? `${position[0].toFixed(6)}_${position[1].toFixed(6)}` : ''] ?? 0;
            for (const id of ids || []) {
                if (String(normalizePostId(id)) === String(openedKey)) {
                    return position;
                }
            }
        }
        return null;
    }, [openedPopupId, markerEntries, activeIdxByGroup]);

    const maxBounds = useMemo(() => {
        const h = expanded ? expandedPadH : defaultPadH;
        const v = expanded ? expandedPadV : defaultPadV;
        return computeBoundsWithPad(RAW_BOUNDS, { padH: h, padV: v, padNorth: DEFAULT_BOUNDS_PAD.padNorth });
    }, [expanded, expandedPadH, expandedPadV, defaultPadH, defaultPadV]);

    // ── Mobile slide-over: post detail ──
    // Layer 0: map with Leaflet popups (same as desktop)
    // Layer 2: post detail (PostPage embedded) — slides in from the right
    const [mobileLayer, setMobileLayer] = useState(0);        // 0=map, 2=detail
    const [mobileDetailPostId, setMobileDetailPostId] = useState(null);

    // The post object for the detail layer
    const mobileDetailPost = useMemo(() => {
        if (!isMobile || !mobileDetailPostId) return null;
        const key = normalizePostId(mobileDetailPostId) || String(mobileDetailPostId);
        if (postsById) {
            const candidates = [key, mobileDetailPostId, Number(key), String(mobileDetailPostId)];
            if (postsById instanceof Map) {
                for (const k of candidates) {
                    const v = postsById.get(k);
                    if (v) return v;
                }
                // Last resort: iterate
                for (const [mk, mv] of postsById) {
                    if (String(normalizePostId(mk) || mk) === String(key)) return mv;
                }
            } else {
                for (const k of candidates) {
                    const v = postsById[k];
                    if (v) return v;
                }
            }
        }
        // Fallback: try to pull minimal data from GeoJSON features
        const feature = (filteredData.features || []).find(
            (f) => String(getFeaturePostId(f)) === String(key)
        );
        if (feature?.properties) {
            return { id: key, ...feature.properties };
        }
        return null;
    }, [isMobile, mobileDetailPostId, postsById, filteredData]);

    const handleMobileDrawerClose = useCallback(() => {
        setMobileLayer(0);
        setMobileDetailPostId(null);
    }, []);

    // ── Close mobile detail drawer on browser back button ──
    useEffect(() => {
        if (mobileLayer !== 2) return;
        window.history.pushState({ mobileDetail: true }, '');
        const handlePopState = () => { setMobileLayer(0); setMobileDetailPostId(null); };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [mobileLayer]);

    // Reset mobile drawer if the popup is closed externally (e.g. parent map
    // drawer closing, zoom-dismiss). Without this the keepMounted inner Drawer
    // stays visible as a blank screen when the map itself is dismissed.
    useEffect(() => {
        if (isMobile && openedPopupId == null && mobileLayer === 2) {
            setMobileLayer(0);
            setMobileDetailPostId(null);
        }
    }, [isMobile, openedPopupId, mobileLayer]);

    return (
        <MapErrorBoundary>
            <MapWrapper>
                {/* Global fix: hide MUI Tooltips/Poppers whose anchor has been removed */}
                <style dangerouslySetInnerHTML={{ __html: GLOBAL_POPPER_CSS }} />
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 12,
                        right: 12,
                        zIndex: 1000,
                        pointerEvents: 'none',
                    }}
                >
                    <Chip
                        label="Pins show approximate area (city/county)"
                        size="small"
                        icon={<RoomOutlinedIcon />}
                        sx={(theme) => ({
                            backgroundColor: alpha(theme.palette.background.paper, 0.78),
                            color: theme.palette.text.secondary,
                            fontSize: 11,
                            fontWeight: 600,
                            height: 22,
                            borderRadius: 999,
                            border: `1px solid ${alpha(theme.palette.divider, 0.55)}`,
                            boxShadow: `0 8px 18px ${alpha(theme.palette.text.primary, 0.08)}`,
                            backdropFilter: 'blur(6px)',
                            '& .MuiChip-icon': {
                                fontSize: 16,
                                color: theme.palette.text.secondary,
                            },
                        })}
                    />
                </Box>

                <div style={{ width: '100%', height: '100%' }}>
                    <MapContainer
                        center={center}
                        zoom={zoomLevel ?? DEFAULT_ZOOM}
                        whenCreated={(m) => (mapRef.current = m)}
                        scrollWheelZoom
                        wheelPxPerZoomLevel={WHEEL_PX_PER_ZOOM_LEVEL}
                        minZoom={MIN_ZOOM}
                        maxZoom={MAX_ZOOM}
                        maxBounds={maxBounds}
                        maxBoundsViscosity={1}
                        zoomSnap={ZOOM_SNAP}
                        zoomDelta={ZOOM_DELTA}
                        doubleClickZoom={false}
                        touchZoom={false}
                        keyboard={false}
                        zoomControl={false}
                        closePopupOnClick={false}
                        attributionControl={false}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <RemovePrefix />
                        <BoundsController bounds={maxBounds} />
                        <MaskController />
                        <Recenter
                            center={center}
                            zoomLevel={zoomLevel}
                            openedPopupId={openedPopupId}
                            markerPosition={openedMarkerPosition}
                        />

                        {/* Pan north after popup opens to ensure full visibility */}
                        <PanOnPopupOpen
                            openedPopupId={openedPopupId}
                            markerRefs={markerRefs}
                        />

                        <ZoomDismissOnZoomOut openedPopupId={openedPopupId} onPopupClose={onPopupClose} />

                        <TileLayer key={`tile-${isDarkMode ? 'dark' : 'light'}`} url={tileUrlNoLabels} />

                        <GeoJSON
                            key={`counties-${isDarkMode ? 'd' : 'l'}`}
                            data={alabamaCounties}
                            onEachFeature={(feature, layer) => {
                                const name = feature?.properties?.NAME;
                                if (name) {
                                    layer.bindTooltip(String(name), {
                                        permanent: true,
                                        direction: 'center',
                                        className: 'll-county-label',
                                        interactive: false,
                                    });
                                }
                            }}
                            style={{
                                color: alpha(theme.palette.text.primary, isDarkMode ? 0.18 : 0.10),
                                weight: 1,
                                fillColor: alpha(theme.palette.text.primary, isDarkMode ? 0.06 : 0.04),
                                fillOpacity: 1,
                            }}
                        />

                        <GeoJSON
                            key={`al-border-${isDarkMode ? 'd' : 'l'}`}
                            data={alabama}
                            style={{
                                color: alpha(theme.palette.text.primary, isDarkMode ? 0.35 : 0.24),
                                weight: 2.5,
                                fillOpacity: 0,
                            }}
                        />

                        <PlacesOutlines data={alabamaPlaces} minZoom={9} />
                        <CityLabels cities={cityList} minZoom={9} />

                        {/* markers */}
                        {markerEntries.map(({ groupKey, position, cat, ids }) => {
                            const idx = activeIdxByGroup[groupKey] ?? 0;
                            const activeId = ids?.[idx];
                            const activeKey = normalizePostId(activeId) || (activeId != null ? String(activeId) : null);

                            const openedKey =
                                normalizePostId(openedPopupId) || (openedPopupId != null ? String(openedPopupId) : null);

                            const isOpen = !!openedKey && !!activeKey && String(openedKey) === String(activeKey);

                            const baseIcon = CATEGORY_ICON_MAP[cat] || CATEGORY_MARKER_DEFS.community.base;
                            const goldIcon = CATEGORY_ICON_MAP_GOLD[cat] || CATEGORY_MARKER_DEFS.community.active;

                            const isHovered =
                                !!activeKey &&
                                ((hoveredMarkerIdLocal != null && String(hoveredMarkerIdLocal) === String(activeKey)) ||
                                    (hoveredKeyExternal != null && String(hoveredKeyExternal) === String(activeKey)));

                            const isSelected =
                                !!activeKey &&
                                (isOpen ||
                                    (selectedMarkerIdLocal != null && String(selectedMarkerIdLocal) === String(activeKey)));

                            const icon = isHovered || isSelected ? goldIcon : baseIcon;

                            const resolvedPayloadRaw = resolvePopupNode(popupContentById, activeKey ?? activeId);
                            const { node: resolvedContent } = unwrapPopupPayload(resolvedPayloadRaw);
                            const hasResolvedContent = resolvedContent !== null && typeof resolvedContent !== 'undefined';
                            const popupKey = `popup-${String(activeKey ?? activeId)}-${hasResolvedContent ? 'ready' : 'loading'}`;

                            return (
                                <Marker
                                    key={`marker-${groupKey}`}
                                    position={position}
                                    icon={icon}
                                    ref={(m) => {
                                        if (!m) return;
                                        (ids || []).forEach((id) => {
                                            const raw = id != null ? String(id) : null;
                                            const norm = normalizePostId(id);
                                            if (raw) {
                                                markerRefs.current[raw] = m;
                                                markerRefs.current[`c${raw}`] = m;
                                            }
                                            if (norm) {
                                                markerRefs.current[norm] = m;
                                                markerRefs.current[`c${norm}`] = m;
                                            }
                                        });
                                    }}
                                    eventHandlers={{
                                        mouseover: () => {
                                            const k = activeKey ?? activeId;
                                            const kk = normalizePostId(k) || (k != null ? String(k) : null);
                                            if (kk) setHoveredMarkerIdLocal(String(kk));
                                        },
                                        mouseout: () => {
                                            setHoveredMarkerIdLocal(null);
                                        },
                                        click: (e) => {
                                            if (activeId == null) return;
                                            setActiveIdxByGroup((p) => ({ ...p, [groupKey]: idx }));
                                            const ll = e?.latlng;
                                            const clickId = activeKey ?? activeId;
                                            const sel = normalizePostId(clickId) || (clickId != null ? String(clickId) : null);
                                            if (sel) setSelectedMarkerIdLocal(String(sel));

                                            if (isMobile) {
                                                // Mobile: same as desktop — open the Leaflet popup
                                                if (ll && typeof ll.lat === 'number' && typeof ll.lng === 'number') {
                                                    const payload = buildMarkerClickPayload(
                                                        mapRef?.current,
                                                        [ll.lat, ll.lng],
                                                        MARKER_CLICK_OFFSET_PX,
                                                    );
                                                    onMarkerClick?.(clickId, payload);
                                                } else {
                                                    onMarkerClick?.(clickId);
                                                }
                                            } else if (ll && typeof ll.lat === 'number' && typeof ll.lng === 'number') {
                                                const payload = buildMarkerClickPayload(
                                                    mapRef?.current,
                                                    [ll.lat, ll.lng],
                                                    MARKER_CLICK_OFFSET_PX,
                                                );
                                                onMarkerClick?.(clickId, payload);
                                            } else {
                                                onMarkerClick?.(clickId);
                                            }
                                        },
                                    }}
                                >
                                    {isOpen && (
                                        <Popup
                                            key={popupKey}
                                            closeButton
                                            closeOnClick={false}
                                            autoPan={false}
                                            onClose={() => {
                                                const k = normalizePostId(activeKey ?? activeId) ||
                                                    ((activeKey ?? activeId) != null ? String(activeKey ?? activeId) : null);
                                                if (k && selectedMarkerIdLocal != null && String(selectedMarkerIdLocal) === String(k)) {
                                                    setSelectedMarkerIdLocal(null);
                                                }
                                                onPopupClose?.(activeKey ?? activeId);
                                                // Also close mobile drawer if open
                                                if (isMobile) handleMobileDrawerClose();
                                            }}
                                            maxWidth={isMobile ? 320 : 500}
                                        >
                                            {(() => {
                                                const hasStack = Array.isArray(ids) && ids.length > 1;

                                                const goPrev = (e) => {
                                                    e.stopPropagation();
                                                    const newIdx = Math.max(idx - 1, 0);
                                                    setActiveIdxByGroup((p) => ({ ...p, [groupKey]: newIdx }));
                                                    const nextId = ids[newIdx];
                                                    const nextKey = normalizePostId(nextId) || nextId;
                                                    const payload = buildMarkerClickPayload(
                                                        mapRef?.current,
                                                        position,
                                                        MARKER_CLICK_OFFSET_PX,
                                                    );
                                                    onMarkerClick?.(nextKey, payload);
                                                };

                                                const goNext = (e) => {
                                                    e.stopPropagation();
                                                    const newIdx = Math.min(idx + 1, ids.length - 1);
                                                    setActiveIdxByGroup((p) => ({ ...p, [groupKey]: newIdx }));
                                                    const nextId = ids[newIdx];
                                                    const nextKey = normalizePostId(nextId) || nextId;
                                                    const payload = buildMarkerClickPayload(
                                                        mapRef?.current,
                                                        position,
                                                        MARKER_CLICK_OFFSET_PX,
                                                    );
                                                    onMarkerClick?.(nextKey, payload);
                                                };

                                                return (
                                                    <Box
                                                        sx={{
                                                            width: isMobile ? 'min(320px, 85vw)' : 'min(500px, 90vw)',
                                                            maxWidth: '100%',
                                                        }}
                                                    >
                                                        {/* Crossfade wrapper — smoothly transitions content when cycling */}
                                                        <Box
                                                            key={`content-${activeKey}`}
                                                            className="ll-map-popup-content"
                                                            onClick={isMobile ? (e) => {
                                                                // On mobile, tapping the popup content opens the post detail drawer
                                                                // Don't trigger if they clicked a link, button, or interactive element
                                                                const tag = e.target?.tagName?.toLowerCase();
                                                                if (tag === 'a' || tag === 'button' || e.target.closest?.('button') || e.target.closest?.('a')) return;
                                                                const postId = activeKey ?? activeId;
                                                                if (postId) {
                                                                    setMobileDetailPostId(postId);
                                                                    setMobileLayer(2);
                                                                }
                                                            } : undefined}
                                                            sx={{
                                                                p: hasResolvedContent ? 0 : 1.25,
                                                                animation: hasStack ? "popupCardFadeIn 220ms cubic-bezier(.2,.8,.2,1) both" : "none",
                                                                "@keyframes popupCardFadeIn": {
                                                                    "0%": { opacity: 0, transform: "translateY(4px)" },
                                                                    "100%": { opacity: 1, transform: "translateY(0)" },
                                                                },
                                                                ...(isMobile ? { cursor: 'pointer' } : {}),
                                                            }}
                                                        >
                                                            {hasResolvedContent ? (
                                                                typeof resolvedContent === 'string' ? (
                                                                    // Security: sanitize HTML to prevent XSS from user-generated content
                                                                    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(resolvedContent) }} />
                                                                ) : (
                                                                    resolvedContent
                                                                )
                                                            ) : (
                                                                <Typography variant="body2" color="text.secondary">
                                                                    Loading post…
                                                                </Typography>
                                                            )}
                                                        </Box>

                                                        {/* Mobile: "Tap to view details" hint */}
                                                        {isMobile && hasResolvedContent && (
                                                            <Box
                                                                onClick={() => {
                                                                    const postId = activeKey ?? activeId;
                                                                    if (postId) {
                                                                        setMobileDetailPostId(postId);
                                                                        setMobileLayer(2);
                                                                    }
                                                                }}
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    gap: 0.75,
                                                                    px: 1.25,
                                                                    py: 1,
                                                                    borderTop: '1px solid',
                                                                    borderColor: 'divider',
                                                                    bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                                                                    cursor: 'pointer',
                                                                    '&:active': { bgcolor: (t) => alpha(t.palette.primary.main, 0.10) },
                                                                }}
                                                            >
                                                                <Typography
                                                                    sx={{
                                                                        fontSize: 12,
                                                                        fontWeight: 700,
                                                                        color: 'primary.main',
                                                                        letterSpacing: '0.01em',
                                                                    }}
                                                                >
                                                                    Tap to view details
                                                                </Typography>
                                                                <ChevronRightRoundedIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                                            </Box>
                                                        )}

                                                        {hasStack && (
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 1,
                                                                    px: 1.25,
                                                                    py: 1,
                                                                    borderTop: '1px solid',
                                                                    borderColor: 'divider',
                                                                    bgcolor: 'background.paper',
                                                                }}
                                                            >
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={goPrev}
                                                                    disabled={idx <= 0}
                                                                    sx={{
                                                                        width: 32,
                                                                        height: 32,
                                                                        borderRadius: 999,
                                                                        border: '1px solid',
                                                                        borderColor: 'divider',
                                                                        bgcolor: 'background.paper',
                                                                        boxShadow: (t) => t.custom.shadows.sm,
                                                                    }}
                                                                >
                                                                    <ChevronLeftRoundedIcon fontSize="small" />
                                                                </IconButton>

                                                                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                                                                    <Chip
                                                                        size="small"
                                                                        label={`${idx + 1}/${ids.length}`}
                                                                        sx={{
                                                                            fontWeight: 800,
                                                                            borderRadius: 999,
                                                                            bgcolor: (t) => alpha(t.palette.primary.main, 0.10),
                                                                            border: '1px solid',
                                                                            borderColor: (t) => alpha(t.palette.primary.main, 0.25),
                                                                        }}
                                                                    />
                                                                </Box>

                                                                <IconButton
                                                                    size="small"
                                                                    onClick={goNext}
                                                                    disabled={idx >= ids.length - 1}
                                                                    sx={{
                                                                        width: 32,
                                                                        height: 32,
                                                                        borderRadius: 999,
                                                                        border: '1px solid',
                                                                        borderColor: 'divider',
                                                                        bgcolor: 'background.paper',
                                                                        boxShadow: (t) => t.custom.shadows.sm,
                                                                    }}
                                                                >
                                                                    <ChevronRightRoundedIcon fontSize="small" />
                                                                </IconButton>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                );
                                            })()}
                                        </Popup>
                                    )}
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </div>
            </MapWrapper>

            {/* ── Mobile post detail slide-over (opens when tapping popup content) ── */}
            {isMobile && (
                <SwipeableRightDrawer
                    open={mobileLayer === 2}
                    onClose={handleMobileDrawerClose}
                    ModalProps={{ keepMounted: false }}
                    SlideProps={{ direction: 'left' }}
                    PaperProps={{
                        sx: {
                            width: '100%',
                            maxWidth: '100vw',
                            bgcolor: 'background.default',
                            boxShadow: (t) => t.custom?.shadows?.xl || '0 25px 50px -12px rgba(0,0,0,.25)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        },
                    }}
                >
                    {/* ── Sticky "Back to Map" header ── */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 1,
                            py: 0.75,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            minHeight: 48,
                            flexShrink: 0,
                            zIndex: 2,
                        }}
                    >
                        <IconButton
                            size="small"
                            onClick={handleMobileDrawerClose}
                            sx={{
                                width: 34,
                                height: 34,
                                borderRadius: 999,
                            }}
                        >
                            <ArrowBackRoundedIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 700,
                                color: 'text.primary',
                                flex: 1,
                                fontSize: 14,
                            }}
                        >
                            Back to Map
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={handleMobileDrawerClose}
                            sx={{
                                width: 34,
                                height: 34,
                                borderRadius: 999,
                            }}
                        >
                            <CloseRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>

                    {/* ── Post detail content ── */}
                    <Box
                        sx={{
                            flex: 1,
                            overflowY: 'auto',
                            WebkitOverflowScrolling: 'touch',
                            bgcolor: 'background.paper',
                        }}
                    >
                        {mobileDetailPost ? (
                            <PostPage
                                embedded
                                post={mobileDetailPost}
                                user={user || null}
                                hideCategoryChip={false}
                            />
                        ) : (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Loading post…
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </SwipeableRightDrawer>
            )}

        </MapErrorBoundary>
    );
}

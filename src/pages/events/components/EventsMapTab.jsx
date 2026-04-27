// src/pages/events/components/EventsMapTab.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapErrorBoundary from "../../../components/MapErrorBoundary";
import { secureFetch } from "../../../utils/secureFetch";
import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    RadioGroup,
    FormControlLabel,
    Radio,
    Snackbar,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { alpha, styled, useTheme } from "@mui/material/styles";
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../../../components/MapView.css";

import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseIcon from "@mui/icons-material/Close";
import RoomOutlinedIcon from "@mui/icons-material/RoomOutlined";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import PersonIcon from "@mui/icons-material/Person";

// Category icons
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import TheaterComedyRoundedIcon from "@mui/icons-material/TheaterComedyRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import ChildCareRoundedIcon from "@mui/icons-material/ChildCareRounded";
import SportsSoccerRoundedIcon from "@mui/icons-material/SportsSoccerRounded";
import ParkRoundedIcon from "@mui/icons-material/ParkRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import SpaRoundedIcon from "@mui/icons-material/SpaRounded";
import ChurchRoundedIcon from "@mui/icons-material/ChurchRounded";
import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivismRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";

// Action bar icons
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";

import alabama from "../../../data/alabama.json";
import alabamaCounties from "../../../data/alabamaCounties.json";
import alabamaCities from "../../../data/alabamaCities.json";
import alabamaPlaces from "../../../data/alabamaPlaces.json";

import {
    DEFAULT_CENTER,
    DEFAULT_ZOOM,
    MIN_ZOOM,
    MAX_ZOOM,
    ZOOM_SNAP,
    ZOOM_DELTA,
    WHEEL_PX_PER_ZOOM_LEVEL,
    isStatewideCenter,
    getNorthPanTarget,
    offsetCoords,
    MARKER_CLICK_ZOOM,
    FLY_TO_DURATION,
    PAN_TO_DURATION,
    DEFAULT_BOUNDS_PAD,
    MARKER_CLICK_OFFSET_PX,
    RECENTER_OFFSET_PX,
    computeBoundsWithPad,
    createAlabamaMask,
} from "../../../utils/MapUtils";

import { BRAND } from "../../../themes";

/* ───────────────────────────────────────────
   SVG-based event markers (themed, no PNGs)
   Uses MUI icon SVG paths + brand colors from theme.js
   ─────────────────────────────────────────── */

// Brand colors sourced from theme.js BRAND tokens (single source of truth)
const BRAND_NAVY      = BRAND.navy;
const BRAND_NAVY_DARK = BRAND.navyDark;
const BRAND_CRIMSON   = BRAND.crimson;
const BRAND_CRIMSON_D = BRAND.crimsonDark;
const BRAND_WHITE     = BRAND.white;

// MUI icon SVG paths (24×24 viewBox) — one per event category
const EVENT_ICON_PATHS = {
    'music-nightlife':      'M12 3v9.28a4.39 4.39 0 0 0-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z',
    'arts-culture':         'M2 16.5C2 19.54 4.46 22 7.5 22s5.5-2.46 5.5-5.5V1.5C10 1.22 9.78 1 9.5 1H4c-.28 0-.5.22-.5.5v6c0 .28.22.5.5.5h2l-4 9zm7.37-3.19L12 7.5V16.5c0 2.48-2.02 4.5-4.5 4.5S3 18.98 3 16.5c0-1.42.66-2.69 1.69-3.5h4.68zM22 6.5C22 3.46 19.54 1 16.5 1S11 3.46 11 6.5V8l4.36 10.13C16.29 20.37 18.12 22 20.5 22c.28 0 .5-.22.5-.5v-6c0-.28-.22-.5-.5-.5H18l4-9z',
    'food-drink':           'M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z',
    'community-social':     'M16.67 13.13C18.04 14.06 19 15.32 19 17v3h4v-3c0-2.18-3.57-3.47-6.33-3.87zM15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4c-.47 0-.91.1-1.33.24a5.98 5.98 0 0 1 0 7.52c.42.14.86.24 1.33.24zM9 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 7c-2.67 0-8 1.34-8 4v2c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-2c0-2.66-5.33-4-8-4z',
    'family-kids':          'M13 2v8h2c0-1.1.9-2 2-2V4c0-1.1-.9-2-2-2h-2zm-2 12c-1.1 0-2 .9-2 2h6c0-1.1-.9-2-2-2h-2zm-4-2c-1.66 0-3 1.34-3 3h4V8H4c-1.1 0-2 .9-2 2v2h5zm10 0h5v-2c0-1.1-.9-2-2-2h-4v4h4c0-1.66-1.34-3-3-3zm-5 6H8v2h10v-2h-6z',
    'sports-recreation':    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 4.3l3.38 1.02L14.4 11H12V6.3zm-2 0V11H8.6l-1.98-3.68L10 6.3zM5.64 10.22L8.4 11l-1.96 3.65-2.35-.7c-.24-.82-.38-1.68-.4-2.58l1.95-.15zM9.25 20.1l-.6-2.41L12 16l3.35 1.69-.6 2.41c-.88.32-1.8.5-2.75.5s-1.87-.18-2.75-.5zM17.56 14.65L15.6 11l2.76-.78 1.95.15c-.02.9-.16 1.76-.4 2.58l-2.35.7z',
    'outdoors-nature':      'M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z',
    'education-workshops':  'M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z',
    'business-networking':  'M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z',
    'health-wellness':      'M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43z',
    'faith-spiritual':      'M18 12.22V7l-1.5-6L15 7v5.22l-2 4.56V22h8v-5.22l-2-4.56zM11.5 22v-5.22l-2-4.56V7L8 1 6.5 7v5.22l-2 4.56V22h7z',
    'volunteer-fundraising': 'M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A2.01 2.01 0 0 0 18.06 7h-.12a2 2 0 0 0-1.9 1.37l-1.41 4.24L12.8 11.4a1.97 1.97 0 0 0-1.56-.42c-.77.12-1.36.79-1.36 1.57v.65l4.28 4.28c.37.37.88.58 1.41.58H18v4c0 .55.45 1 1 1s1-.45 1-1zm-7.5-10.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2 16v-7H9V9c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v6h1.5v7c0 .55.45 1 1 1h2c.55 0 1-.45 1-1z',
    'government-civic':     'M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4.5-9L2 6v2h19V6l-9.5-5z',
    'markets-shopping':     'M18.36 9l.6 3H5.04l.6-3h12.72M20 4H4v2h16V4zm0 3H4l-1 5v2h1v6h10v-6h4v6h2v-6h1v-2l-1-5zM6 18v-4h6v4H6z',
    'holidays-seasonal':    'M12 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-4C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 2c2.76 0 5 2.24 5 5 0 2.88-2.88 7.19-5 9.88C9.92 16.21 7 11.85 7 9c0-2.76 2.24-5 5-5z',
    // CalendarMonthRounded — default
    other:                  'M19 4h-1V3c0-.55-.45-1-1-1s-1 .45-1 1v1H8V3c0-.55-.45-1-1-1s-1 .45-1 1v1H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 15c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1V9h14v10zM7 11h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z',
};

const DEFAULT_EVENT_ICON = EVENT_ICON_PATHS.other;

const buildMarkerSvg = (iconPath, pinFill, pinStroke, iconFill) => `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 40 56">
  <ellipse cx="20" cy="53" rx="8" ry="3" fill="${pinStroke}" opacity="0.18"/>
  <path d="M20 2C11.16 2 4 9.16 4 18c0 11.25 14.25 32 15.19 33.38a1 1 0 0 0 1.62 0C21.75 50 36 29.25 36 18c0-8.84-7.16-16-16-16z"
        fill="${pinFill}" stroke="${pinStroke}" stroke-width="1.5"/>
  <circle cx="20" cy="18" r="11" fill="${BRAND_WHITE}" opacity="0.92"/>
  <g transform="translate(11, 9) scale(0.75)">
    <path d="${iconPath}" fill="${iconFill}"/>
  </g>
</svg>`;

const makeSvgDivIcon = (svgHtml) =>
    L.divIcon({
        className: "events-div-icon",
        iconSize: [32, 44],
        iconAnchor: [16, 44],
        popupAnchor: [0, -44],
        html: `<div style="position:relative;width:32px;height:44px;" class="marker-icon-wrap">
      <div class="marker-icon" style="width:32px;height:44px;">${svgHtml}</div>
    </div>`,
    });

// Pre-build & cache category → { base, active } icon pairs
const EVENT_MARKER_CACHE = {};

function getEventMarkerIcons(categorySlug) {
    const key = String(categorySlug || 'other').toLowerCase();
    if (EVENT_MARKER_CACHE[key]) return EVENT_MARKER_CACHE[key];
    const path = EVENT_ICON_PATHS[key] || DEFAULT_EVENT_ICON;
    const base = makeSvgDivIcon(buildMarkerSvg(path, BRAND_NAVY, BRAND_NAVY_DARK, BRAND_NAVY));
    const active = makeSvgDivIcon(buildMarkerSvg(path, BRAND_CRIMSON, BRAND_CRIMSON_D, BRAND_CRIMSON));
    EVENT_MARKER_CACHE[key] = { base, active };
    return EVENT_MARKER_CACHE[key];
}

/* ───────────────────────────────────────────
   Map constants & wrapper
   ─────────────────────────────────────────── */

const RAW_BOUNDS = L.geoJSON(alabama.features[0]).getBounds();

const MapWrapper = styled(Box)(({ theme }) => ({
    position: "relative",
    width: "100%",
    height: "100%",
    "& .leaflet-container": {
        width: "100%",
        height: "100%",
        backgroundColor: theme.palette.background.default,
        backgroundImage: `radial-gradient(900px 420px at 12% 8%, ${alpha(theme.palette.secondary.main, 0.06)} 0%, transparent 58%), radial-gradient(820px 420px at 92% 0%, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 62%)`,
    },
    "& .leaflet-control-attribution": {
        bottom: "32px !important",
        left: "50% !important",
        transform: "translateX(-50%)",
        textAlign: "center",
    },
    "& .leaflet-tooltip.ll-county-label": {
        background: "transparent",
        border: "none",
        boxShadow: "none",
        padding: 0,
        margin: 0,
        color: alpha(theme.palette.text.primary, 0.34),
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
    },
    "& .leaflet-tooltip.ll-county-label:before": { display: "none" },
    "& .ll-city-label": { background: "transparent", border: "none" },
    "& .ll-city-label span": {
        display: "inline-block",
        transform: "translate(-50%, -50%)",
        whiteSpace: "nowrap",
        color: alpha(theme.palette.text.primary, 0.38),
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.02em",
        textShadow: `0 1px 0 ${alpha(theme.palette.background.default, 0.85)}`,
        pointerEvents: "none",
    },
    // Popup styling (matches community)
    "& .leaflet-popup": { marginBottom: 6 },
    "& .leaflet-popup-content-wrapper": {
        background: `${theme.palette.background.paper} !important`,
        color: `${theme.palette.text.primary} !important`,
        borderRadius: 18,
        padding: 0,
        overflow: "hidden",
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: (t) => `0 16px 48px ${alpha(t.palette.text.primary, 0.18)}`,
    },
    "& .leaflet-popup-content": { margin: 0, width: "auto", lineHeight: 1.2 },
    "& .leaflet-popup-tip": {
        background: `${theme.palette.background.paper} !important`,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: (t) => `0 10px 28px ${alpha(t.palette.text.primary, 0.12)}`,
    },
    "& .leaflet-popup-close-button": {
        width: 28, height: 28, top: 10, right: 10, borderRadius: 999,
        color: theme.palette.text.secondary,
        background: `${theme.palette.background.paper} !important`,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: (t) => `0 8px 18px ${alpha(t.palette.text.primary, 0.14)}`,
        display: "flex", alignItems: "center", justifyContent: "center",
    },
    "& .leaflet-popup-close-button:hover": {
        color: theme.palette.text.primary,
        background: `${theme.palette.action.hover} !important`,
    },
}));

/* ───────────────────────────────────────────
   Helper overlays (same as community)
   ─────────────────────────────────────────── */
const RemovePrefix = () => {
    const map = useMap();
    useEffect(() => { try { map?.attributionControl?.setPrefix?.(""); } catch {} }, [map]);
    return null;
};

function featureToLatLng(feature) {
    if (!feature?.geometry) return null;
    const { type, coordinates } = feature.geometry;
    if (type === "Point" && Array.isArray(coordinates) && coordinates.length >= 2) {
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
        const name = String(f?.properties?.NAME || "").trim();
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
            if (z < minZoom) { setVisible([]); return; }
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
        map.on("zoomend", update);
        map.on("moveend", update);
        return () => { map.off("zoomend", update); map.off("moveend", update); };
    }, [map, cities, minZoom, maxLabels]);

    if (!visible.length) return null;
    return (
        <>
            {visible.map((c) => (
                <Marker
                    key={`city-label-${c.name}`}
                    position={c.coordinates}
                    interactive={false}
                    icon={L.divIcon({ className: "ll-city-label", html: `<span>${c.name}</span>`, iconSize: [0, 0] })}
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
        const update = () => { try { setShow(map.getZoom() >= minZoom); } catch { setShow(false); } };
        update();
        map.on("zoomend", update);
        return () => { map.off("zoomend", update); };
    }, [map, minZoom]);

    if (!show) return null;
    return (
        <GeoJSON
            data={data}
            style={{ color: alpha(theme.palette.text.primary, 0.12), weight: 1, fillOpacity: 0 }}
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

const BoundsController = ({ bounds }) => {
    const map = useMap();
    useEffect(() => { try { map?.setMaxBounds?.(bounds); } catch {} }, [map, bounds]);
    return null;
};

/**
 * Check if the map container has real DOM dimensions.
 * Leaflet's map.getSize() returns STALE cached values — do NOT use it.
 * Instead we check the actual DOM element via map.getContainer().
 * Returns false if the container is hidden/animating-in (zero dimensions).
 */
function isMapContainerReady(map) {
    try {
        const el = map.getContainer();
        return el && el.offsetWidth > 0 && el.offsetHeight > 0;
    } catch {
        return false;
    }
}

const Recenter = ({ center, zoomLevel, openedPopupId, markerPosition }) => {
    const map = useMap();
    const lastKeyRef = useRef(null);

    useEffect(() => {
        if (!map || !center?.length) return;
        const isStatewide = isStatewideCenter(center);
        const effectiveZoom = isStatewide ? DEFAULT_ZOOM : (zoomLevel ?? MARKER_CLICK_ZOOM);
        const effectiveCenter = isStatewide ? DEFAULT_CENTER : center;

        // Use marker position in the key (not openedPopupId) so that cycling
        // through stacked items at the SAME coordinate does not re-trigger flyTo.
        const posKey = markerPosition ? `${markerPosition[0].toFixed(5)},${markerPosition[1].toFixed(5)}` : '';
        const key = `${effectiveCenter[0].toFixed(5)},${effectiveCenter[1].toFixed(5)}|${effectiveZoom.toFixed(1)}|${posKey}`;
        if (lastKeyRef.current === key) return;
        lastKeyRef.current = key;

        // Retry helper — when the drawer is animating in, the map container may
        // have zero dimensions which causes Leaflet NaN crashes.  We retry with
        // invalidateSize() up to 8 times at 150ms intervals, then fall back to
        // setView (no animation) which avoids NaN entirely.
        let attempt = 0;
        const MAX_RETRIES = 8;
        const RETRY_MS = 150;

        function tryMove() {
            if (!isMapContainerReady(map)) {
                attempt++;
                if (attempt <= MAX_RETRIES) {
                    try { map.invalidateSize({ animate: false }); } catch {}
                    setTimeout(tryMove, RETRY_MS);
                    return;
                }
                // Last resort — setView with no animation (no NaN risk)
                try {
                    if (isStatewide && RAW_BOUNDS) {
                        map.fitBounds(RAW_BOUNDS, { padding: [20, 12], maxZoom: DEFAULT_ZOOM, animate: false });
                    } else {
                        map.setView(effectiveCenter, effectiveZoom, { animate: false });
                    }
                } catch {}
                return;
            }

            try {
                // Statewide: use flyToBounds so Leaflet auto-calculates the
                // perfect zoom for whatever container dimensions exist (phone vs desktop).
                if (isStatewide && RAW_BOUNDS) {
                    map.flyToBounds(RAW_BOUNDS, { padding: [20, 12], maxZoom: DEFAULT_ZOOM, duration: FLY_TO_DURATION });
                    return;
                }

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
                } else {
                    if (alreadyAtZoom) {
                        map.panTo(effectiveCenter, { animate: true, duration: PAN_TO_DURATION });
                    } else {
                        map.flyTo(effectiveCenter, effectiveZoom, { animate: true, duration: FLY_TO_DURATION });
                    }
                }
            } catch {}
        }

        tryMove();
    }, [map, center, zoomLevel, openedPopupId, markerPosition]);
    return null;
};

const PanOnPopupOpen = ({ openedPopupId, markerRefs }) => {
    const map = useMap();
    const lastPannedIdRef = useRef(null);
    const lastPannedPosRef = useRef(null);

    useEffect(() => {
        if (!map || !openedPopupId) { lastPannedIdRef.current = null; lastPannedPosRef.current = null; return; }
        if (lastPannedIdRef.current === String(openedPopupId)) return;
        const timeoutId = setTimeout(() => {
            try {
                if (!isMapContainerReady(map)) return; // Guard: skip pan if container has zero dimensions
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
                const panTarget = getNorthPanTarget(map, latlng, RECENTER_OFFSET_PX);
                map.panTo(panTarget, { animate: true, duration: PAN_TO_DURATION });
                lastPannedIdRef.current = String(openedPopupId);
                lastPannedPosRef.current = latlng;
            } catch {}
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [map, openedPopupId, markerRefs]);
    return null;
};

const ZoomDismissOnZoomOut = ({ openedPopupId, onPopupClose, maxZoomOutSteps = 2 }) => {
    const map = useMap();
    const openedIdRef = useRef(null);
    const lastZoomRef = useRef(null);
    const zoomOutStepsRef = useRef(0);
    const onCloseRef = useRef(onPopupClose);

    useEffect(() => { onCloseRef.current = onPopupClose; }, [onPopupClose]);

    useEffect(() => {
        openedIdRef.current = openedPopupId != null ? String(openedPopupId) : null;
        zoomOutStepsRef.current = 0;
        try { lastZoomRef.current = map?.getZoom?.(); } catch { lastZoomRef.current = null; }
    }, [openedPopupId, map]);

    useEffect(() => {
        if (!map) return undefined;
        const handleZoomEnd = () => {
            const opened = openedIdRef.current;
            let newZoom = null;
            try { newZoom = map.getZoom(); } catch { newZoom = null; }
            const lastZoom = lastZoomRef.current;
            if (!opened) { lastZoomRef.current = newZoom; return; }
            if (typeof newZoom === "number" && typeof lastZoom === "number" && newZoom < lastZoom) {
                zoomOutStepsRef.current += 1;
                if (zoomOutStepsRef.current > maxZoomOutSteps) {
                    zoomOutStepsRef.current = 0;
                    openedIdRef.current = null;
                    try { map.closePopup(); } catch {}
                    if (typeof onCloseRef.current === "function") onCloseRef.current(opened);
                }
            } else if (typeof newZoom === "number" && typeof lastZoom === "number" && newZoom > lastZoom) {
                zoomOutStepsRef.current = 0;
            }
            lastZoomRef.current = newZoom;
        };
        map.on("zoomend", handleZoomEnd);
        return () => { map.off("zoomend", handleZoomEnd); };
    }, [map, maxZoomOutSteps]);
    return null;
};

/* ───────────────────────────────────────────
   Category maps (matches EventCard)
   ─────────────────────────────────────────── */
const EVENT_CATEGORY_ICONS = {
    "music-nightlife": MusicNoteRoundedIcon,
    "arts-culture": TheaterComedyRoundedIcon,
    "food-drink": RestaurantRoundedIcon,
    "community-social": PeopleAltRoundedIcon,
    "family-kids": ChildCareRoundedIcon,
    "sports-recreation": SportsSoccerRoundedIcon,
    "outdoors-nature": ParkRoundedIcon,
    "education-workshops": SchoolRoundedIcon,
    "business-networking": BusinessCenterRoundedIcon,
    "health-wellness": SpaRoundedIcon,
    "faith-spiritual": ChurchRoundedIcon,
    "volunteer-fundraising": VolunteerActivismRoundedIcon,
    "government-civic": AccountBalanceRoundedIcon,
    "markets-shopping": StorefrontRoundedIcon,
    "holidays-seasonal": CelebrationRoundedIcon,
    other: CategoryRoundedIcon,
};

const CATEGORY_LABELS = {
    "music-nightlife": "Music",
    "arts-culture": "Arts & Culture",
    "food-drink": "Food & Drink",
    "community-social": "Community & Social",
    "family-kids": "Family & Kids",
    "sports-recreation": "Sports & Recreation",
    "outdoors-nature": "Outdoors & Nature",
    "education-workshops": "Education & Workshops",
    "business-networking": "Business & Networking",
    "health-wellness": "Health & Wellness",
    "faith-spiritual": "Faith & Spiritual",
    "volunteer-fundraising": "Volunteer & Fundraising",
    "government-civic": "Government & Civic",
    "markets-shopping": "Markets & Shopping",
    "holidays-seasonal": "Holidays & Seasonal",
    other: "Other",
};

// Lantern gold → uses theme warning.dark
const toStr = (v) => (v == null ? "" : String(v));

/* ───────────────────────────────────────────
   Date/Time helpers (from EventCard)
   ─────────────────────────────────────────── */
function isDateOnlyValue(raw, event) {
    const s = toStr(raw).trim();
    if (!s) return true;
    const startHasTime = event?.startHasTime ?? event?.start_has_time;
    if (startHasTime === false) return true;
    if (startHasTime === true) return false;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return true;
    if (s.includes(" 00:00:00") || s.includes("T00:00:00")) return true;
    return false;
}

function parseDateTimeLocal(raw, event) {
    const s = toStr(raw).trim();
    if (!s) return { dateObj: null, hours: 0, minutes: 0, isDateOnly: true };
    const dateOnly = isDateOnlyValue(s, event);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const [y, m, day] = s.split("-").map(Number);
        return { dateObj: new Date(y, m - 1, day), hours: 0, minutes: 0, isDateOnly: true };
    }
    const mysqlMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
    if (mysqlMatch) {
        const [, y, m, day, hh, mm] = mysqlMatch.map(Number);
        return { dateObj: new Date(y, m - 1, day, hh, mm), hours: hh, minutes: mm, isDateOnly: dateOnly };
    }
    const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (isoMatch) {
        const [, y, m, day, hh, mm] = isoMatch.map(Number);
        return { dateObj: new Date(y, m - 1, day, hh, mm), hours: hh, minutes: mm, isDateOnly: dateOnly };
    }
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return { dateObj: null, hours: 0, minutes: 0, isDateOnly: true };
    return { dateObj: d, hours: d.getHours(), minutes: d.getMinutes(), isDateOnly: dateOnly };
}

function isSameDay(a, b) {
    if (!a || !b) return false;
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDayLabel(d) {
    if (!d) return "";
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const d0 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (isSameDay(d0, today)) return "Today";
    if (isSameDay(d0, tomorrow)) return "Tomorrow";
    return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(d);
}

function formatTimeFromParts(hours, minutes) {
    const h = hours % 12 || 12;
    const ampm = hours < 12 ? "AM" : "PM";
    return `${h}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

function buildWhenLabel(event) {
    const rawStart = event?.startAt || event?.start_at;
    const rawEnd = event?.endAt || event?.end_at;
    const startParsed = parseDateTimeLocal(rawStart, event);
    const endParsed = parseDateTimeLocal(rawEnd, { ...event, startHasTime: event?.endHasTime ?? event?.end_has_time });
    if (!startParsed.dateObj) return "";
    const startDay = formatDayLabel(startParsed.dateObj);
    const showStartTime = !startParsed.isDateOnly;
    const startTime = showStartTime ? formatTimeFromParts(startParsed.hours, startParsed.minutes) : "";
    if (!endParsed.dateObj) return showStartTime ? `${startDay} · ${startTime}` : startDay;
    const endDay = formatDayLabel(endParsed.dateObj);
    const showEndTime = !endParsed.isDateOnly;
    const endTime = showEndTime ? formatTimeFromParts(endParsed.hours, endParsed.minutes) : "";
    if (isSameDay(startParsed.dateObj, endParsed.dateObj)) {
        if (showStartTime && showEndTime) return `${startDay} · ${startTime} – ${endTime}`;
        if (!showStartTime && showEndTime) return `${startDay} · ${endTime}`;
        return startDay;
    }
    const left = showStartTime ? `${startDay} · ${startTime}` : startDay;
    const right = showEndTime ? `${endDay} · ${endTime}` : endDay;
    return `${left} – ${right}`;
}

function formatLocationLabel(event) {
    const scope = toStr(event?.locationScope || event?.location_scope).toLowerCase();
    const city = toStr(event?.city).trim();
    const county = toStr(event?.county).trim();
    if (scope === "statewide" || (!city && !county)) return "Alabama (Statewide)";
    const countyLabel = county ? `${county} County` : "";
    if (city && countyLabel) return `${city}, ${countyLabel}`;
    return city || countyLabel || "Alabama (Statewide)";
}

function pickMainPhoto(event) {
    const direct = toStr(event?.mainPhotoUrl || event?.main_photo_url || event?.photoUrl || event?.photo_url).trim();
    if (direct) return direct;
    const arr = event?.photos || event?.photoUrls || event?.photo_urls;
    if (Array.isArray(arr) && arr.length) {
        const first = typeof arr[0] === "string" ? arr[0] : arr[0]?.url;
        return toStr(first).trim() || "";
    }
    return "";
}

function getCategoryInfo(event) {
    const slug = toStr(event?.category || event?.categorySlug || event?.category_slug).trim().toLowerCase();
    const subcategorySlug = toStr(event?.subcategory || event?.subcategorySlug || event?.subcategory_slug).trim().toLowerCase();
    const subcategoryLabel = toStr(event?.subcategoryLabel || event?.subcategory_label).trim();
    const categoryLabel = toStr(event?.categoryLabel || event?.category_label).trim() || CATEGORY_LABELS[slug] || "";
    let displayLabel = categoryLabel;
    if (subcategorySlug) displayLabel = subcategoryLabel || subcategorySlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    return { slug, label: displayLabel };
}

function formatCount(count) {
    const num = Number(count) || 0;
    if (num < 1000) return num > 0 ? String(num) : "0";
    if (num < 10000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}k`;
    return `${Math.round(num / 1000)}k`;
}

/* ───────────────────────────────────────────
   Engagement API
   ─────────────────────────────────────────── */
async function postEngagement(eventId, type, action = "toggle") {
    try {
        const res = await secureFetch(`/api/events/${encodeURIComponent(eventId)}/engagement`, {
            method: "POST", credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, action }),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch { return null; }
}

const EVENT_ENGAGEMENT_EVT = "ll:event:engagement-changed";

function broadcastEngagement(eventId, patch) {
    try {
        const cache = (typeof window !== "undefined" && window.__llEventEngagementState) || {};
        const key = String(eventId);
        cache[key] = { ...(cache[key] || {}), ...patch, t: Date.now() };
        if (typeof window !== "undefined") window.__llEventEngagementState = cache;
        window.dispatchEvent(new CustomEvent(EVENT_ENGAGEMENT_EVT, { detail: { eventId, ...patch } }));
    } catch {}
}

async function postReport(eventId, reason, details) {
    try {
        const res = await secureFetch(`/api/events/${encodeURIComponent(eventId)}/report`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason, details }),
        });
        return res.ok;
    } catch {
        return false;
    }
}

/* ───────────────────────────────────────────
   Report Dialog (matches EventCard)
   ─────────────────────────────────────────── */
function ReportEventDialog({ open, onClose, onSubmit }) {
    const [reason, setReason] = useState("");
    const [details, setDetails] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const resetDialog = () => {
        onClose();
        setTimeout(() => {
            setReason("");
            setDetails("");
            setSubmitted(false);
            setSubmitting(false);
        }, 250);
    };

    const handleSubmit = async () => {
        if (!reason) return;
        setSubmitting(true);
        await onSubmit({ reason, details });
        setSubmitting(false);
        setSubmitted(true);
    };

    return (
        <Dialog
            open={open}
            onClose={resetDialog}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    overflow: "hidden",
                },
            }}
        >
            {submitted ? (
                <>
                    <DialogContent sx={{ textAlign: "center", py: 5, px: 3 }}>
                        <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
                            <CheckCircleRoundedIcon sx={{ fontSize: 48, color: "success.main" }} />
                        </Box>
                        <Typography sx={{ fontWeight: 800, fontSize: 18, mb: 1 }}>
                            Thank you for your report
                        </Typography>
                        <Typography sx={{ fontSize: 14, color: "text.secondary", lineHeight: 1.5 }}>
                            We take reports seriously and will review this event. If it violates our community guidelines, we'll take appropriate action.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5 }}>
                        <Button
                            onClick={resetDialog}
                            fullWidth
                            variant="contained"
                            disableElevation
                            sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2, py: 1 }}
                        >
                            Done
                        </Button>
                    </DialogActions>
                </>
            ) : (
                <>
                    <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1.5, fontWeight: 800, fontSize: 18 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <FlagOutlinedIcon sx={{ fontSize: 22, color: "text.secondary" }} />
                            Report event
                        </Box>
                        <IconButton size="small" onClick={resetDialog} aria-label="Close">
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 0, pb: 1 }}>
                        <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 2, lineHeight: 1.5 }}>
                            Why are you reporting this event? Your report is anonymous.
                        </Typography>
                        <RadioGroup
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        >
                            {[
                                { value: "spam", label: "Spam or scam" },
                                { value: "misleading", label: "Misleading information" },
                                { value: "inappropriate", label: "Inappropriate content" },
                                { value: "cancelled", label: "Event was cancelled" },
                                { value: "duplicate", label: "Duplicate event" },
                                { value: "wrong-location", label: "Wrong location" },
                                { value: "harassment", label: "Harassment or hate" },
                                { value: "other", label: "Other" },
                            ].map((opt) => (
                                <FormControlLabel
                                    key={opt.value}
                                    value={opt.value}
                                    control={<Radio size="small" />}
                                    label={<Typography sx={{ fontSize: 14 }}>{opt.label}</Typography>}
                                    sx={{
                                        mx: 0,
                                        py: 0.25,
                                        px: 1,
                                        borderRadius: 2,
                                        "&:hover": { bgcolor: "action.hover" },
                                    }}
                                />
                            ))}
                        </RadioGroup>

                        <TextField
                            multiline
                            minRows={3}
                            maxRows={6}
                            fullWidth
                            placeholder="Add any additional details that might help us review this report…"
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            inputProps={{ maxLength: 1000 }}
                            sx={{ mt: 2, "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 14 } }}
                        />
                        <Typography sx={{ fontSize: 11, color: "text.disabled", mt: 0.5, textAlign: "right" }}>
                            {details.length}/1000
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                        <Button
                            onClick={resetDialog}
                            sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2, color: "text.secondary" }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            disableElevation
                            disabled={!reason || submitting}
                            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
                            sx={{
                                fontWeight: 700,
                                textTransform: "none",
                                borderRadius: 2,
                                px: 3,
                            }}
                        >
                            Submit report
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
}

/* ───────────────────────────────────────────
   EventMapPopupCard — rich popup card
   ─────────────────────────────────────────── */
function EventMapPopupCard({ event, onSelectEvent }) {
    const evt = event || {};
    const eventId = evt.id || evt.event_id;
    const title = toStr(evt.title) || "Untitled event";
    const whenLabel = buildWhenLabel(evt);
    const locationLabel = formatLocationLabel(evt);
    const addressStr = toStr(evt.address || evt.venue_address || evt.venueAddress).trim();
    const categoryInfo = getCategoryInfo(evt);
    const mainPhoto = pickMainPhoto(evt);
    const description = toStr(evt.description || evt.desc || "").trim();

    const organizer = evt.organizer || null;
    const organizerLabel = (() => {
        const fromParts = `${toStr(organizer?.firstName || organizer?.first_name)} ${toStr(organizer?.lastName || organizer?.last_name)}`.trim();
        return toStr(evt.organizerLabel || evt.organizer_label) || fromParts || "Organizer";
    })();
    const handleLabel = toStr(organizer?.handle || organizer?.username || evt.organizerHandle || evt.organizer_handle);
    const avatarUrl = toStr(organizer?.avatarUrl || organizer?.avatar_url || organizer?.profile_picture || evt.avatarUrl) || "";

    const CategoryIcon = categoryInfo.slug ? (EVENT_CATEGORY_ICONS[categoryInfo.slug] || CategoryRoundedIcon) : null;

    // Engagement state
    const engCounts = evt.engagement?.counts || {};
    const viewerEng = evt.viewerEngagement || evt.viewer_engagement || {};

    const [hasRsvpd, setHasRsvpd] = useState(Boolean(viewerEng.rsvp || evt.viewerRsvp || evt.viewer_rsvp));
    const [isInterested, setIsInterested] = useState(Boolean(viewerEng.interested || evt.viewerInterested || evt.viewer_interested));
    const [hasLiked, setHasLiked] = useState(Boolean(viewerEng.like || evt.viewerLiked || evt.viewer_liked));
    const [rsvpCount, setRsvpCount] = useState(Number(engCounts.rsvp || evt.rsvpCount || evt.rsvp_count || 0));
    const [interestedCount, setInterestedCount] = useState(Number(engCounts.interested || evt.interestedCount || evt.interested_count || 0));
    const [likeCount, setLikeCount] = useState(Number(engCounts.like || evt.likeCount || evt.like_count || 0));
    const [commentCount, setCommentCount] = useState(Number(engCounts.comment || engCounts.comments || evt.commentCount || evt.comment_count || 0));
    const [rsvpBusy, setRsvpBusy] = useState(false);
    const [interestedBusy, setInterestedBusy] = useState(false);
    const [likeBusy, setLikeBusy] = useState(false);


    // Report dialog
    const [reportOpen, setReportOpen] = useState(false);
    const [toast, setToast] = useState({ open: false, msg: "" });

    // Hover states
    const [likeHover, setLikeHover] = useState(false);
    const [commentHover, setCommentHover] = useState(false);
    const [repostHover, setRepostHover] = useState(false);
    const [shareHover, setShareHover] = useState(false);

    // Listen for cross-card engagement sync
    useEffect(() => {
        if (!eventId) return;
        const handler = (e) => {
            const d = e?.detail;
            if (!d || String(d.eventId) !== String(eventId)) return;
            if (d.hasRsvpd != null) setHasRsvpd(d.hasRsvpd);
            if (d.isInterested != null) setIsInterested(d.isInterested);
            if (d.hasLiked != null) setHasLiked(d.hasLiked);
            if (d.rsvpCount != null) setRsvpCount(d.rsvpCount);
            if (d.interestedCount != null) setInterestedCount(d.interestedCount);
            if (d.likeCount != null) setLikeCount(d.likeCount);
            if (d.commentCount != null) setCommentCount(d.commentCount);
        };
        window.addEventListener(EVENT_ENGAGEMENT_EVT, handler);
        return () => window.removeEventListener(EVENT_ENGAGEMENT_EVT, handler);
    }, [eventId]);

    const handleRsvp = useCallback(async (e) => {
        e.stopPropagation();
        if (rsvpBusy || !eventId) return;
        setRsvpBusy(true);
        const next = !hasRsvpd;
        const nc = Math.max(0, rsvpCount + (next ? 1 : -1));
        setHasRsvpd(next);
        setRsvpCount(nc);
        broadcastEngagement(eventId, { hasRsvpd: next, rsvpCount: nc });
        const result = await postEngagement(eventId, "rsvp", "toggle");
        if (result) {
            setHasRsvpd(result.didSet);
            setRsvpCount(result.counts?.rsvp ?? nc);
            broadcastEngagement(eventId, { hasRsvpd: result.didSet, rsvpCount: result.counts?.rsvp ?? nc });
        }
        setRsvpBusy(false);
    }, [rsvpBusy, hasRsvpd, rsvpCount, eventId]);

    const handleInterested = useCallback(async (e) => {
        e.stopPropagation();
        if (interestedBusy || !eventId) return;
        setInterestedBusy(true);
        const next = !isInterested;
        const nc = Math.max(0, interestedCount + (next ? 1 : -1));
        setIsInterested(next);
        setInterestedCount(nc);
        broadcastEngagement(eventId, { isInterested: next, interestedCount: nc });
        const result = await postEngagement(eventId, "interested", "toggle");
        if (result) {
            setIsInterested(result.didSet);
            setInterestedCount(result.counts?.interested ?? nc);
            broadcastEngagement(eventId, { isInterested: result.didSet, interestedCount: result.counts?.interested ?? nc });
        }
        setInterestedBusy(false);
    }, [interestedBusy, isInterested, interestedCount, eventId]);

    const handleLike = useCallback(async (e) => {
        e.stopPropagation();
        if (likeBusy || !eventId) return;
        setLikeBusy(true);
        const next = !hasLiked;
        const nc = Math.max(0, likeCount + (next ? 1 : -1));
        setHasLiked(next);
        setLikeCount(nc);
        broadcastEngagement(eventId, { hasLiked: next, likeCount: nc });
        const result = await postEngagement(eventId, "like", "toggle");
        if (result) {
            setHasLiked(result.didSet);
            setLikeCount(result.counts?.like ?? nc);
            broadcastEngagement(eventId, { hasLiked: result.didSet, likeCount: result.counts?.like ?? nc });
        }
        setLikeBusy(false);
    }, [likeBusy, hasLiked, likeCount, eventId]);

    const pillSx = {
        display: "inline-flex", alignItems: "center", gap: 0.5, px: 1, py: 0.35,
        borderRadius: 999, cursor: "pointer", userSelect: "none",
        transition: "background 140ms ease",
        "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
    };
    const iconBoxSx = { display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22 };
    const actionIconSx = (isActive, isHovering) => ({
        fontSize: 19,
        color: isActive ? "secondary.main" : (isHovering ? "secondary.main" : "text.secondary"),
        transition: "color 140ms ease",
    });

    const isOwner = Boolean(evt?.isOwner || evt?.is_owner);

    return (
        <Box sx={{ width: "min(400px, 88vw)", maxWidth: "100%", position: "relative" }}>



            {/* Clickable card body → event detail */}
            <Box
                sx={{ cursor: "pointer" }}
                onClick={(e) => { e.stopPropagation(); onSelectEvent?.(evt); }}
            >
                <Box sx={{ p: 1.75, pb: 1 }}>
                    {/* Photo + title/category/date/location */}
                    <Box sx={{ display: "flex", gap: 1.5, pr: 3 }}>
                        {mainPhoto ? (
                            <Box
                                component="img" src={mainPhoto} loading="lazy" alt=""
                                sx={{ width: 80, height: 80, objectFit: "cover", borderRadius: "10px", border: "1px solid", borderColor: "divider", flexShrink: 0, mt: 0.25 }}
                            />
                        ) : null}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            {/* Title — 2 lines, word-break for long strings */}
                            <Typography sx={{
                                fontWeight: 900, fontSize: 14.5, lineHeight: 1.25, mb: 0.4,
                                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                                overflowWrap: "anywhere", wordBreak: "break-word",
                            }}>
                                {title}
                            </Typography>

                            {/* Category chip under title */}
                            {categoryInfo.label ? (
                                <Chip
                                    icon={CategoryIcon ? <CategoryIcon sx={{ fontSize: 12 }} /> : undefined}
                                    label={categoryInfo.label}
                                    size="small"
                                    sx={(t) => ({
                                        height: 20, fontSize: 9.5, fontWeight: 800, mb: 0.4,
                                        bgcolor: alpha(t.palette.primary.main, 0.1), color: "primary.main",
                                        "& .MuiChip-icon": { color: "primary.main", ml: 0.5 },
                                    })}
                                />
                            ) : null}

                            {/* Date */}
                            {whenLabel ? (
                                <Typography sx={{ fontSize: 11.5, color: (t) => alpha(t.palette.text.primary, 0.6), fontWeight: 700, mb: 0.15 }}>{whenLabel}</Typography>
                            ) : null}

                            {/* Location */}
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <LocationOnRoundedIcon sx={{ fontSize: 13, color: "primary.main", flexShrink: 0 }} />
                                <Typography sx={{ fontSize: 11, color: "primary.main", fontWeight: 700 }} noWrap>
                                    {addressStr ? `${addressStr}, ${locationLabel}` : locationLabel}
                                </Typography>
                            </Stack>
                        </Box>
                    </Box>

                    {/* Description — truncated with inline "...more" */}
                    {description ? (() => {
                        const MAX = 90;
                        const truncated = description.length > MAX;
                        const shown = truncated ? description.slice(0, MAX).trimEnd() : description;
                        return (
                            <Typography sx={{
                                mt: 0.75, fontSize: 12, lineHeight: 1.45, color: (t) => alpha(t.palette.text.primary, 0.65),
                                overflowWrap: "anywhere", wordBreak: "break-word",
                            }}>
                                {shown}
                                {truncated && (
                                    <Typography
                                        component="span"
                                        sx={{ fontSize: 12, fontWeight: 700, color: "primary.main", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                                        onClick={(e) => { e.stopPropagation(); onSelectEvent?.(evt); }}
                                    >
                                        ...more
                                    </Typography>
                                )}
                            </Typography>
                        );
                    })() : null}

                    {/* Organizer row (bottom) */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                        <Avatar src={avatarUrl || undefined} alt={organizerLabel}
                                sx={(t) => ({ width: 26, height: 26, border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.18), bgcolor: alpha(t.palette.primary.main, 0.08) })}
                        >
                            {!avatarUrl ? <PersonIcon sx={{ fontSize: 14 }} /> : null}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: 11, lineHeight: 1.2, color: (t) => alpha(t.palette.text.primary, 0.65) }} noWrap>
                                Posted by {organizerLabel}
                            </Typography>
                            {handleLabel ? (
                                <Typography sx={{ fontSize: 9.5, opacity: 0.5, fontWeight: 700 }} noWrap>@{handleLabel}</Typography>
                            ) : null}
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* RSVP + Interested */}
            <Stack direction="row" spacing={1} sx={{ px: 1.5, py: 1, borderTop: "1px solid", borderColor: "divider" }}>
                <Button
                    variant={hasRsvpd ? "contained" : "outlined"}
                    size="small"
                    disabled={rsvpBusy}
                    startIcon={hasRsvpd ? <CheckCircleRoundedIcon /> : <EventAvailableRoundedIcon />}
                    onClick={handleRsvp}
                    sx={{
                        flex: 1, borderRadius: 2, textTransform: "none", fontWeight: 800, fontSize: 11, py: 0.5,
                        ...(hasRsvpd
                            ? { bgcolor: (t) => t.palette.secondary.main, color: (t) => t.palette.secondary.contrastText, "&:hover": { bgcolor: (t) => t.palette.secondary.dark } }
                            : { borderColor: (t) => alpha(t.palette.text.primary, 0.14), color: (t) => t.palette.secondary.main, "&:hover": { bgcolor: (t) => alpha(t.palette.secondary.main, t.palette.mode === 'dark' ? 0.10 : 0.04), borderColor: (t) => alpha(t.palette.secondary.main, 0.34) } }),
                    }}
                >
                    {hasRsvpd ? "Going" : "RSVP"}{rsvpCount > 0 ? ` (${formatCount(rsvpCount)})` : ""}
                </Button>
                <Button
                    variant={isInterested ? "contained" : "outlined"}
                    size="small"
                    disabled={interestedBusy}
                    startIcon={isInterested ? <StarRoundedIcon /> : <StarBorderRoundedIcon />}
                    onClick={handleInterested}
                    sx={{
                        flex: 1, borderRadius: 2, textTransform: "none", fontWeight: 800, fontSize: 11, py: 0.5,
                        ...(isInterested
                            ? { bgcolor: (t) => t.palette.primary.main, color: (t) => t.palette.primary.contrastText, "&:hover": { bgcolor: (t) => t.palette.primary.dark } }
                            : { borderColor: (t) => alpha(t.palette.text.primary, 0.14), color: "text.secondary", "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.10 : 0.04), borderColor: (t) => alpha(t.palette.primary.main, 0.34), color: "primary.main" } }),
                    }}
                >
                    Interested{interestedCount > 0 ? ` (${formatCount(interestedCount)})` : ""}
                </Button>
            </Stack>

            {/* Action bar */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1, py: 0.35, borderTop: "1px solid", borderColor: "divider" }}>
                <Tooltip title={hasLiked ? "Unlike" : "Like"}>
                    <Box onClick={handleLike} onMouseEnter={() => setLikeHover(true)} onMouseLeave={() => setLikeHover(false)} role="button" sx={pillSx}>
                        <Box sx={iconBoxSx}>
                            {hasLiked ? <FavoriteRoundedIcon sx={actionIconSx(true, likeHover)} /> : <FavoriteBorderRoundedIcon sx={actionIconSx(false, likeHover)} />}
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 12, color: hasLiked ? "secondary.main" : (likeHover ? "secondary.main" : "text.secondary"), lineHeight: 1 }}>
                            {formatCount(likeCount)}
                        </Typography>
                    </Box>
                </Tooltip>
                <Tooltip title="Comment">
                    <Box onClick={(e) => { e.stopPropagation(); onSelectEvent?.(evt); }} onMouseEnter={() => setCommentHover(true)} onMouseLeave={() => setCommentHover(false)} role="button" sx={pillSx}>
                        <Box sx={iconBoxSx}>
                            <ChatBubbleOutlineRoundedIcon sx={{ ...actionIconSx(false, commentHover), transform: "scale(0.92)" }} />
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 12, color: commentHover ? "secondary.main" : "text.secondary", lineHeight: 1 }}>
                            {formatCount(commentCount)}
                        </Typography>
                    </Box>
                </Tooltip>
                <Tooltip title="Repost">
                    <Box onClick={(e) => e.stopPropagation()} onMouseEnter={() => setRepostHover(true)} onMouseLeave={() => setRepostHover(false)} role="button" sx={pillSx}>
                        <Box sx={iconBoxSx}><RepeatRoundedIcon sx={actionIconSx(false, repostHover)} /></Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 12, color: repostHover ? "secondary.main" : "text.secondary", lineHeight: 1 }}>0</Typography>
                    </Box>
                </Tooltip>
                <Tooltip title="Share">
                    <Box onClick={(e) => e.stopPropagation()} onMouseEnter={() => setShareHover(true)} onMouseLeave={() => setShareHover(false)} role="button" sx={pillSx}>
                        <Box sx={iconBoxSx}><ShareRoundedIcon sx={{ ...actionIconSx(false, shareHover), transform: "scale(0.86)" }} /></Box>
                    </Box>
                </Tooltip>
            </Box>

            {/* Report dialog (matches EventCard) */}
            <ReportEventDialog
                open={reportOpen}
                onClose={() => setReportOpen(false)}
                onSubmit={async ({ reason, details }) => {
                    const ok = await postReport(eventId, reason, details);
                    if (!ok) {
                        setToast({ open: true, msg: "Could not send report. Please try again." });
                    }
                }}
            />

            {/* Toast */}
            <Snackbar
                open={toast.open}
                autoHideDuration={4000}
                onClose={() => setToast({ open: false, msg: "" })}
                message={toast.msg}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            />
        </Box>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   EventsMapTab
   ═══════════════════════════════════════════════════════════════════ */
// Hoisted outside the component so the default reference is stable across renders.
const EMPTY_EVENTS = [];

export default function EventsMapTab({ events = EMPTY_EVENTS, onSelectEvent, focusEventId, onFocusEventHandled, hoveredCardId, center: centerProp, zoomLevel: zoomLevelProp }) {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const tileUrl = isDarkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_matter/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png';
    const mapRefLocal = useRef(null);
    const cityList = useMemo(() => normalizeCityFeatures(alabamaCities), []);

    // Lookup of event id → event object
    const eventById = useMemo(() => {
        const m = new Map();
        (Array.isArray(events) ? events : []).forEach((e) => {
            if (e?.id != null) m.set(String(e.id), e);
        });
        return m;
    }, [events]);

    // Normalize events into GeoJSON features
    const normalizedData = useMemo(() => {
        const arr = Array.isArray(events) ? events : [];
        const features = arr
            .filter((e) => Number.isFinite(Number(e?.latitude)) && Number.isFinite(Number(e?.longitude)))
            .map((e) => ({
                type: "Feature",
                geometry: { type: "Point", coordinates: [Number(e.longitude), Number(e.latitude)] },
                properties: { id: String(e.id) },
            }));
        return { type: "FeatureCollection", features };
    }, [events]);

    const unmappableCount = (Array.isArray(events) ? events.length : 0) - normalizedData.features.length;

    // Marker refs, active index for stacked groups, animation refs
    const markerRefs = useRef({});
    const [activeIdxByGroup, setActiveIdxByGroup] = useState({});
    const animRef = useRef(null);
    const iconElRef = useRef(null);
    const lastOpenedKeyRef = useRef(null);

    // Hover & selection state
    const [hoveredMarkerIdLocal, setHoveredMarkerIdLocal] = useState(null);
    const [selectedMarkerIdLocal, setSelectedMarkerIdLocal] = useState(null);
    const [openedPopupId, setOpenedPopupId] = useState(null);

    // Map center/zoom state — Recenter reads these (matches BusinessesMapTab pattern)
    const [mapCenter, setMapCenter] = useState(centerProp || DEFAULT_CENTER);
    const [mapZoom, setMapZoom] = useState(zoomLevelProp || DEFAULT_ZOOM);

    // Sync parent-driven center/zoom (radius filter changes) into internal state
    useEffect(() => {
        if (centerProp) setMapCenter(centerProp);
    }, [centerProp]);
    useEffect(() => {
        if (zoomLevelProp != null) setMapZoom(zoomLevelProp);
    }, [zoomLevelProp]);

    // Effective values: prefer parent props when available (ensures Recenter
    // always sees the latest radius-driven zoom even before useEffect fires)
    const effectiveCenter = centerProp || mapCenter;
    const effectiveZoom = zoomLevelProp != null ? zoomLevelProp : mapZoom;

    // Merge card hover with map hover — card hover takes priority when set
    const effectiveHoveredId = hoveredCardId != null ? String(hoveredCardId) : hoveredMarkerIdLocal;

    // Keep selected in sync with opened popup
    useEffect(() => {
        setSelectedMarkerIdLocal(openedPopupId != null ? String(openedPopupId) : null);
    }, [openedPopupId]);

    // Hover bounce animation (same as community)
    useEffect(() => {
        if (animRef.current) { try { animRef.current.cancel?.(); } catch {} animRef.current = null; }
        if (iconElRef.current) { try { iconElRef.current.style.transform = ""; } catch {} iconElRef.current = null; }

        if (effectiveHoveredId != null) {
            const marker = markerRefs.current[String(effectiveHoveredId)];
            const img = marker?.getElement()?.querySelector(".marker-icon");
            if (img) {
                iconElRef.current = img;
                img.style.transformOrigin = "50% 100%";
                animRef.current = img.animate(
                    [{ transform: "translateY(0)" }, { transform: "translateY(-15px)" }],
                    { duration: 600, iterations: Infinity, easing: "ease-in-out", direction: "alternate" }
                );
            }
        }

        return () => {
            if (animRef.current) { try { animRef.current.cancel?.(); } catch {} animRef.current = null; }
            if (iconElRef.current) { try { iconElRef.current.style.transform = ""; } catch {} iconElRef.current = null; }
        };
    }, [effectiveHoveredId]);

    // Group by coordinate
    const coordGroups = useMemo(() => {
        const out = {};
        (normalizedData.features || []).forEach((f) => {
            const coords = f?.geometry?.coordinates;
            if (!Array.isArray(coords) || coords.length < 2) return;
            const [lng, lat] = coords;
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
            const coordKey = `${lat.toFixed(6)}_${lng.toFixed(6)}`;
            const id = String(f?.properties?.id || "");
            if (!id) return;
            (out[coordKey] ||= []).push(id);
        });
        return out;
    }, [normalizedData]);

    const markerEntries = useMemo(() => {
        const entries = [];
        const currentZoom = mapRefLocal?.current?.getZoom?.() ?? DEFAULT_ZOOM;
        Object.entries(coordGroups).forEach(([coordKey, ids]) => {
            const firstId = ids?.[0];
            if (!firstId) return;
            const feature = (normalizedData.features || []).find(
                (ff) => String(ff?.properties?.id) === String(firstId)
            );
            if (!feature) return;
            const coords = feature?.geometry?.coordinates;
            if (!Array.isArray(coords) || coords.length < 2) return;
            const [lng, lat] = coords;
            const position = offsetCoords([lat, lng], 0, 1, currentZoom);
            entries.push({ groupKey: coordKey, position, ids });
        });
        return entries;
    }, [coordGroups, normalizedData]);

    // Map of id -> group info
    const idToGroupIndex = useMemo(() => {
        const m = new Map();
        markerEntries.forEach(({ groupKey, ids }) => {
            (ids || []).forEach((id, idx) => { m.set(String(id), { groupKey, idx }); });
        });
        return m;
    }, [markerEntries]);

    // Keep active index synced to openedPopupId
    useEffect(() => {
        if (!openedPopupId) return;
        const info = idToGroupIndex.get(String(openedPopupId));
        if (!info) return;
        setActiveIdxByGroup((prev) => {
            if (prev?.[info.groupKey] === info.idx) return prev;
            return { ...prev, [info.groupKey]: info.idx };
        });
    }, [openedPopupId, idToGroupIndex]);

    // Open popup once ready
    const openReady = useMemo(() => {
        if (!openedPopupId) return null;
        const openedKey = String(openedPopupId);
        for (const { groupKey, ids } of markerEntries) {
            const idx = activeIdxByGroup[groupKey] ?? 0;
            const active = ids?.[idx];
            if (active && String(active) === openedKey) return { key: openedKey, groupKey };
        }
        return null;
    }, [openedPopupId, markerEntries, activeIdxByGroup]);

    useEffect(() => {
        if (!openReady) { if (openedPopupId == null) lastOpenedKeyRef.current = null; return; }
        if (lastOpenedKeyRef.current === openReady.key) return;
        const marker = markerRefs.current[openReady.key];
        if (!marker) return;
        try { marker.openPopup(); lastOpenedKeyRef.current = openReady.key; } catch {}
    }, [openReady, openedPopupId]);

    // Marker position for opened popup (north pan)
    const openedMarkerPosition = useMemo(() => {
        if (!openedPopupId) return null;
        const openedKey = String(openedPopupId);
        for (const { ids, position } of markerEntries) {
            for (const id of ids || []) { if (String(id) === openedKey) return position; }
        }
        return null;
    }, [openedPopupId, markerEntries]);

    const handlePopupClose = (id) => {
        if (id != null && selectedMarkerIdLocal != null && String(selectedMarkerIdLocal) === String(id)) {
            setSelectedMarkerIdLocal(null);
        }
        setOpenedPopupId(null);
    };

    // External focus: when a card's address is clicked, pan to the marker and open its popup
    useEffect(() => {
        if (!focusEventId) return;
        const idStr = String(focusEventId);

        // Check if the focused event is statewide (no pin on map)
        const focusedEvent = (events || []).find((e) => String(e?.id || e?.event_id || "") === idStr);
        const scope = String(focusedEvent?.locationScope || focusedEvent?.location_scope || "").toLowerCase();
        const isStw = scope === "statewide" || (!String(focusedEvent?.city || "").trim() && !String(focusedEvent?.county || "").trim());

        if (isStw) {
            // Statewide event: zoom out to full state, close popups
            setMapCenter(DEFAULT_CENTER);
            setMapZoom(DEFAULT_ZOOM);
            setOpenedPopupId(null);
            setSelectedMarkerIdLocal(null);
            if (typeof onFocusEventHandled === "function") onFocusEventHandled();
            return;
        }

        const info = idToGroupIndex.get(idStr);
        if (!info) {
            // Event not on the map (no coordinates)
            if (typeof onFocusEventHandled === "function") onFocusEventHandled();
            return;
        }
        // Set active index for stacked markers, open popup
        setActiveIdxByGroup((prev) => ({ ...prev, [info.groupKey]: info.idx }));
        setSelectedMarkerIdLocal(idStr);
        setOpenedPopupId(idStr);

        // Pan to the marker
        const entry = markerEntries.find((e) => e.groupKey === info.groupKey);
        if (entry) {
            const lat = entry.position[0];
            const lng = entry.position[1];
            setMapCenter([lat, lng]);
            setMapZoom(MARKER_CLICK_ZOOM);
        }
        // Clear the focus so it doesn't re-trigger
        if (typeof onFocusEventHandled === "function") onFocusEventHandled();
    }, [focusEventId, events, idToGroupIndex, markerEntries, onFocusEventHandled]);

    const maxBounds = useMemo(() => computeBoundsWithPad(RAW_BOUNDS, DEFAULT_BOUNDS_PAD), []);
    const primaryMain = theme.palette.primary.main;

    return (
        <MapErrorBoundary>
            <MapWrapper>
                {/* Approximate location chip + OSM attribution */}
                <Box sx={{ position: "absolute", bottom: unmappableCount > 0 ? 44 : 12, right: 12, zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
                    <Chip
                        label="Pins show approximate area (city/county)"
                        size="small"
                        icon={<RoomOutlinedIcon />}
                        sx={(t) => ({
                            backgroundColor: alpha(t.palette.background.paper, 0.78),
                            color: t.palette.text.secondary,
                            fontSize: 11, fontWeight: 600, height: 22, borderRadius: 999,
                            border: `1px solid ${alpha(t.palette.divider, 0.55)}`,
                            boxShadow: `0 8px 18px ${alpha(t.palette.text.primary, 0.08)}`,
                            backdropFilter: "blur(6px)",
                            pointerEvents: "none",
                            "& .MuiChip-icon": { fontSize: 16, color: t.palette.text.secondary },
                        })}
                    />
                    <Typography
                        component="a"
                        href="https://www.openstreetmap.org/copyright"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={(t) => ({
                            fontSize: 9.5, fontWeight: 600, color: alpha(t.palette.text.secondary, 0.6),
                            textDecoration: "none",
                            px: 0.75, py: 0.15, borderRadius: 1,
                            bgcolor: alpha(t.palette.background.paper, 0.7),
                            backdropFilter: "blur(4px)",
                            "&:hover": { color: t.palette.primary.main, textDecoration: "underline" },
                        })}
                    >
                        © OpenStreetMap contributors
                    </Typography>
                </Box>

                {/* Unmappable events note */}
                {unmappableCount > 0 && (
                    <Box sx={{
                        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 1000,
                        py: 0.75, px: 1.5, bgcolor: alpha(primaryMain, 0.06),
                        borderTop: "1px solid", borderColor: "divider",
                    }}>
                        <Typography sx={{ fontSize: 11, color: "text.secondary", textAlign: "center", fontWeight: 600 }}>
                            {unmappableCount} event{unmappableCount !== 1 ? "s" : ""} without a location pin {unmappableCount === 1 ? "is" : "are"} not shown
                        </Typography>
                    </Box>
                )}

                {/* Empty state */}
                {normalizedData.features.length === 0 && (
                    <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 999, textAlign: "center", p: 3, pointerEvents: "none" }}>
                        <Box sx={{
                            px: 3, py: 2.5, borderRadius: 2.5,
                            bgcolor: alpha(theme.palette.background.paper, 0.92),
                            backdropFilter: "blur(8px)",
                            border: `1px solid ${theme.palette.divider}`,
                            boxShadow: (t) => `0 8px 32px ${alpha(t.palette.text.primary, 0.10)}`,
                        }}>
                            <LocationOnRoundedIcon sx={{ fontSize: 36, color: "text.disabled", mb: 1 }} />
                            <Typography sx={{ fontWeight: 700, fontSize: 14, color: "text.secondary" }}>
                                No events with location pins
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: "text.disabled", mt: 0.5 }}>
                                Events will appear here when organizers add a map pin
                            </Typography>
                        </Box>
                    </Box>
                )}

                <div style={{ width: "100%", height: "100%" }}>
                    <MapContainer
                        center={DEFAULT_CENTER}
                        zoom={DEFAULT_ZOOM}
                        whenCreated={(m) => { mapRefLocal.current = m; }}
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
                        attributionControl={false}
                        closePopupOnClick={false}
                        attributionControl={false}
                        style={{ width: "100%", height: "100%" }}
                    >
                        <RemovePrefix />
                        <TileLayer
                            key={`tile-${isDarkMode ? 'dark' : 'light'}`}
                            url={tileUrl}
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <BoundsController bounds={maxBounds} />
                        <MaskController />
                        <Recenter center={effectiveCenter} zoomLevel={effectiveZoom} openedPopupId={openedPopupId} markerPosition={openedMarkerPosition} />
                        <PanOnPopupOpen openedPopupId={openedPopupId} markerRefs={markerRefs} />
                        <ZoomDismissOnZoomOut openedPopupId={openedPopupId} onPopupClose={handlePopupClose} />

                        {/* County boundaries with labels */}
                        <GeoJSON
                            key={`counties-${isDarkMode ? 'd' : 'l'}`}
                            data={alabamaCounties}
                            onEachFeature={(feature, layer) => {
                                const name = feature?.properties?.NAME;
                                if (name) layer.bindTooltip(String(name), { permanent: true, direction: "center", className: "ll-county-label", interactive: false });
                            }}
                            style={{ color: alpha(theme.palette.text.primary, isDarkMode ? 0.18 : 0.10), weight: 1, fillColor: alpha(theme.palette.text.primary, isDarkMode ? 0.06 : 0.04), fillOpacity: 1 }}
                        />

                        {/* Alabama border */}
                        <GeoJSON key={`al-border-${isDarkMode ? 'd' : 'l'}`} data={alabama} style={{ color: alpha(theme.palette.text.primary, isDarkMode ? 0.35 : 0.24), weight: 2.5, fillOpacity: 0 }} />

                        <PlacesOutlines data={alabamaPlaces} minZoom={9} />
                        <CityLabels cities={cityList} minZoom={9} />

                        {/* Event markers */}
                        {markerEntries.map(({ groupKey, position, ids }) => {
                            const idx = activeIdxByGroup[groupKey] ?? 0;
                            const activeId = ids?.[idx];
                            const activeKey = activeId != null ? String(activeId) : null;
                            const openedKey = openedPopupId != null ? String(openedPopupId) : null;
                            const isOpen = !!openedKey && !!activeKey && openedKey === activeKey;
                            const isHovered = !!activeKey && effectiveHoveredId != null && String(effectiveHoveredId) === activeKey;
                            const isSelected = !!activeKey && (isOpen || (selectedMarkerIdLocal != null && String(selectedMarkerIdLocal) === activeKey));
                            const activeEvent = activeKey ? eventById.get(activeKey) : null;
                            const evtCatSlug = String(activeEvent?.category || activeEvent?.categorySlug || activeEvent?.category_slug || 'other').toLowerCase();
                            const { base: evtBase, active: evtActive } = getEventMarkerIcons(evtCatSlug);
                            const icon = (isHovered || isSelected) ? evtActive : evtBase;

                            return (
                                <Marker
                                    key={`marker-${groupKey}`}
                                    position={position}
                                    icon={icon}
                                    ref={(m) => {
                                        if (!m) return;
                                        (ids || []).forEach((id) => { markerRefs.current[String(id)] = m; });
                                    }}
                                    eventHandlers={{
                                        mouseover: () => { if (activeKey) setHoveredMarkerIdLocal(activeKey); },
                                        mouseout: () => { setHoveredMarkerIdLocal(null); },
                                        click: (e) => {
                                            if (activeId == null) return;
                                            setActiveIdxByGroup((p) => ({ ...p, [groupKey]: idx }));
                                            if (activeKey) setSelectedMarkerIdLocal(activeKey);
                                            setOpenedPopupId(activeKey);
                                            const lat = position[0];
                                            const lng = position[1];
                                            if (Number.isFinite(lat) && Number.isFinite(lng)) {
                                                setMapCenter([lat, lng]);
                                                setMapZoom(MARKER_CLICK_ZOOM);
                                            }
                                        },
                                    }}
                                >
                                    {isOpen && (
                                        <Popup
                                            closeButton
                                            closeOnClick={false}
                                            autoPan={false}
                                            onClose={() => handlePopupClose(activeKey)}
                                            maxWidth={500}
                                        >
                                            {(() => {
                                                const hasStack = Array.isArray(ids) && ids.length > 1;

                                                const goPrev = (e) => {
                                                    e.stopPropagation();
                                                    const newIdx = Math.max(idx - 1, 0);
                                                    setActiveIdxByGroup((p) => ({ ...p, [groupKey]: newIdx }));
                                                    const nextId = ids[newIdx];
                                                    setOpenedPopupId(String(nextId));
                                                };

                                                const goNext = (e) => {
                                                    e.stopPropagation();
                                                    const newIdx = Math.min(idx + 1, ids.length - 1);
                                                    setActiveIdxByGroup((p) => ({ ...p, [groupKey]: newIdx }));
                                                    const nextId = ids[newIdx];
                                                    setOpenedPopupId(String(nextId));
                                                };

                                                return (
                                                    <Box>
                                                        {/* Crossfade wrapper — smoothly transitions content when cycling */}
                                                        <Box
                                                            key={`content-${activeKey}`}
                                                            sx={{
                                                                animation: hasStack ? "popupCardFadeIn 220ms cubic-bezier(.2,.8,.2,1) both" : "none",
                                                                "@keyframes popupCardFadeIn": {
                                                                    "0%": { opacity: 0, transform: "translateY(4px)" },
                                                                    "100%": { opacity: 1, transform: "translateY(0)" },
                                                                },
                                                            }}
                                                        >
                                                            <EventMapPopupCard
                                                                event={activeEvent}
                                                                onSelectEvent={onSelectEvent}
                                                            />
                                                        </Box>

                                                        {/* Stacked navigation arrows */}
                                                        {hasStack && (
                                                            <Box sx={{
                                                                display: "flex", alignItems: "center", gap: 1,
                                                                px: 1.25, py: 1, borderTop: "1px solid", borderColor: "divider", bgcolor: "background.paper",
                                                            }}>
                                                                <IconButton
                                                                    size="small" onClick={goPrev} disabled={idx <= 0}
                                                                    sx={{ width: 32, height: 32, borderRadius: 999, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", boxShadow: (t) => `0 6px 14px ${alpha(t.palette.text.primary, 0.10)}` }}
                                                                >
                                                                    <ChevronLeftRoundedIcon fontSize="small" />
                                                                </IconButton>
                                                                <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
                                                                    <Chip
                                                                        size="small"
                                                                        label={`${idx + 1}/${ids.length}`}
                                                                        sx={{ fontWeight: 800, borderRadius: 999, bgcolor: alpha(primaryMain, 0.10), border: "1px solid", borderColor: alpha(primaryMain, 0.25) }}
                                                                    />
                                                                </Box>
                                                                <IconButton
                                                                    size="small" onClick={goNext} disabled={idx >= ids.length - 1}
                                                                    sx={{ width: 32, height: 32, borderRadius: 999, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", boxShadow: (t) => `0 6px 14px ${alpha(t.palette.text.primary, 0.10)}` }}
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
        </MapErrorBoundary>
    );
}
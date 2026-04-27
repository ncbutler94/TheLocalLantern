// src/pages/business/components/BusinessesMapTab.jsx
// Business map tab — adapted from EventsMapTab.jsx
// Shows business + business-post markers on a Leaflet map of Alabama.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Avatar,
    Box,
    Chip,
    IconButton,
    Rating,
    Stack,
    Tooltip,
    Typography,
    Snackbar,
} from "@mui/material";
import { alpha, styled, useTheme } from "@mui/material/styles";
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../../../components/MapView.css";

import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import RoomOutlinedIcon from "@mui/icons-material/RoomOutlined";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import VerifiedIcon from "@mui/icons-material/Verified";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/X";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import SvgIcon from "@mui/material/SvgIcon";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import HowToRegRoundedIcon from "@mui/icons-material/HowToRegRounded";

import ShareDialog from "../../../components/ShareDialog";
import { ReportDialog } from "../../../components/ActionBar";
import { useActiveAccount } from "../../../components/AccountContext";
import { useAuth } from "../../../components/AuthModalContext";
import { secureFetch } from "../../../utils/secureFetch";

// Category icons
import RestaurantIcon from "@mui/icons-material/Restaurant";
import StorefrontIcon from "@mui/icons-material/Storefront";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import HomeRepairServiceIcon from "@mui/icons-material/HomeRepairService";
import YardIcon from "@mui/icons-material/Yard";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import SchoolIcon from "@mui/icons-material/School";
import PetsIcon from "@mui/icons-material/Pets";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import TheaterComedyIcon from "@mui/icons-material/TheaterComedy";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import BuildIcon from "@mui/icons-material/Build";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";

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
    getNorthPanTarget,
    isStatewideCenter,
    offsetCoords,
    MARKER_CLICK_ZOOM,
    FLY_TO_DURATION,
    PAN_TO_DURATION,
    DEFAULT_BOUNDS_PAD,
    RECENTER_OFFSET_PX,
    computeBoundsWithPad,
    createAlabamaMask,
} from "../../../utils/MapUtils";
import MapErrorBoundary from '../../../components/MapErrorBoundary';

/* ───────────────────────────────────────────
   SVG-based business markers (themed, no PNGs)
   Uses MUI icon SVG paths + brand colors from theme.js
   ─────────────────────────────────────────── */

// Brand colors (matching theme.js BRAND tokens)
const BRAND_NAVY      = '#0F2D52';
const BRAND_NAVY_DARK = '#0A1F3A';
const BRAND_CRIMSON   = '#BF0D2E';
const BRAND_CRIMSON_D = '#980A24';
const BRAND_WHITE     = '#FFFFFF';

// MUI icon SVG paths (24×24 viewBox) — one per business category
const BIZ_ICON_PATHS = {
    food_drink:           'M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z',
    shopping_retail:      'M18.36 9l.6 3H5.04l.6-3h12.72M20 4H4v2h16V4zm0 3H4l-1 5v2h1v6h10v-6h4v6h2v-6h1v-2l-1-5zM6 18v-4h6v4H6z',
    automotive:           'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z',
    home_services:        'M18 16h-2v-1H8v1H6v-1H2v5h20v-5h-4v1zm2-8h-3V4c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v4H4c-1.1 0-2 .9-2 2v4h4v-2h2v2h8v-2h2v2h4v-4c0-1.1-.9-2-2-2zm-5 0H9V4h6v4z',
    home_garden:          'M12 22c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9zM5.6 10.25c0 1.38 1.12 2.5 2.5 2.5.53 0 1.01-.16 1.42-.44l-.02.19c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5l-.02-.19c.4.28.89.44 1.42.44 1.38 0 2.5-1.12 2.5-2.5 0-1-.59-1.85-1.43-2.25.84-.4 1.43-1.25 1.43-2.25 0-1.38-1.12-2.5-2.5-2.5-.53 0-1.01.16-1.42.44l.02-.19C14.5 2.12 13.38 1 12 1S9.5 2.12 9.5 3.5l.02.19c-.4-.28-.89-.44-1.42-.44-1.38 0-2.5 1.12-2.5 2.5 0 1 .59 1.85 1.43 2.25-.84.4-1.43 1.25-1.43 2.25zM12 5.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5S9.5 9.38 9.5 8s1.12-2.5 2.5-2.5zM3 13c0 4.97 4.03 9 9 9-4.97 0-9-4.03-9-9z',
    health_wellness:      'M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-8-2h4v2h-4V4zm1 15h-2v-3H8v-2h3v-3h2v3h3v2h-3v3z',
    beauty_personal_care: 'M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm0 12c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM19 3l-6 6 2 2 7-7V3h-3z',
    fitness_recreation:   'M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43z',
    professional_services:'M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z',
    education_childcare:  'M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z',
    pets_animals:         'M4.5 9.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M9 5.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M15 5.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M19.5 9.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.17-.84-1.86-.84-.69 0-1.39.3-1.86.84-.87 1.02-1.6 1.89-2.48 2.91-1.31 1.31-2.92 2.76-2.62 4.79.29 1.02 1.02 2.0 2.09 2.35 1.39.45 2.79.22 3.87-.49.5-.33 1.02-.33 1.52 0 1.08.71 2.49.95 3.87.49 1.02-.35 1.78-1.33 2.09-2.35.3-2.03-1.31-3.48-2.62-4.79z',
    travel_lodging:       'M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z',
    arts_entertainment:   'M2 16.5C2 19.54 4.46 22 7.5 22s5.5-2.46 5.5-5.5V1.5C10 1.22 9.78 1 9.5 1H4c-.28 0-.5.22-.5.5v6c0 .28.22.5.5.5h2l-4 9zm7.37-3.19L12 7.5V16.5c0 2.48-2.02 4.5-4.5 4.5S3 18.98 3 16.5c0-1.42.66-2.69 1.69-3.5h4.68zM22 6.5C22 3.46 19.54 1 16.5 1S11 3.46 11 6.5V8l4.36 10.13C16.29 20.37 18.12 22 20.5 22c.28 0 .5-.22.5-.5v-6c0-.28-.22-.5-.5-.5H18l4-9z',
    community_nonprofit:  'M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A2.01 2.01 0 0 0 18.06 7h-.12a2 2 0 0 0-1.9 1.37l-1.41 4.24L12.8 11.4a1.97 1.97 0 0 0-1.56-.42c-.77.12-1.36.79-1.36 1.57v.65l4.28 4.28c.37.37.88.58 1.41.58H18v4c0 .55.45 1 1 1s1-.45 1-1zm-7.5-10.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2 16v-7H9V9c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v6h1.5v7c0 .55.45 1 1 1h2c.55 0 1-.45 1-1z',
    technology_repair:    'M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z',
    // StorefrontRounded — default / other
    other:                'M18.36 9l.6 3H5.04l.6-3h12.72M20 4H4v2h16V4zm0 3H4l-1 5v2h1v6h10v-6h4v6h2v-6h1v-2l-1-5zM6 18v-4h6v4H6z',
};

// Default storefront icon path
const DEFAULT_BIZ_ICON = BIZ_ICON_PATHS.other;

/**
 * Build an inline SVG map marker pin with an embedded icon.
 */
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

/**
 * Create a Leaflet DivIcon from an inline SVG string.
 */
const makeSvgDivIcon = (svgHtml) =>
    L.divIcon({
        className: "businesses-div-icon",
        iconSize: [32, 44],
        iconAnchor: [16, 44],
        popupAnchor: [0, -44],
        html: `<div style="position:relative;width:32px;height:44px;" class="marker-icon-wrap">
      <div class="marker-icon" style="width:32px;height:44px;">${svgHtml}</div>
    </div>`,
    });

// Pre-build category → { base, active } icon pairs
const BIZ_MARKER_CACHE = {};

function getBizMarkerIcons(categoryKey) {
    const key = String(categoryKey || 'other').toLowerCase();
    if (BIZ_MARKER_CACHE[key]) return BIZ_MARKER_CACHE[key];
    const path = BIZ_ICON_PATHS[key] || DEFAULT_BIZ_ICON;
    const base = makeSvgDivIcon(buildMarkerSvg(path, BRAND_NAVY, BRAND_NAVY_DARK, BRAND_NAVY));
    const active = makeSvgDivIcon(buildMarkerSvg(path, BRAND_CRIMSON, BRAND_CRIMSON_D, BRAND_CRIMSON));
    BIZ_MARKER_CACHE[key] = { base, active };
    return BIZ_MARKER_CACHE[key];
}

// Fallback default icons (StorefrontRounded)
const bizDefaultIcons = getBizMarkerIcons('other');

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
    // Popup styling (matches events)
    "& .leaflet-popup": { marginBottom: 6 },
    "& .leaflet-popup-content-wrapper": {
        background: `${theme.palette.background.paper} !important`,
        color: `${theme.palette.text.primary} !important`,
        borderRadius: 18,
        padding: 0,
        overflow: "hidden",
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.custom.shadows.lg,
    },
    "& .leaflet-popup-content": { margin: 0, width: "auto", lineHeight: 1.2, position: "relative", zIndex: 10 },
    "& .leaflet-popup-tip": {
        background: `${theme.palette.background.paper} !important`,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.custom.shadows.md,
    },
    "& .leaflet-popup-close-button": {
        width: 28, height: 28, top: 10, right: 10, borderRadius: 999,
        color: theme.palette.text.secondary,
        background: `${theme.palette.background.paper} !important`,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.custom.shadows.md,
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 15,
    },
    "& .leaflet-popup-close-button:hover": {
        color: theme.palette.text.primary,
        background: `${theme.palette.action.hover} !important`,
    },
}));

/* ───────────────────────────────────────────
   Helper overlays (same as events)
   ─────────────────────────────────────────── */
const RemovePrefix = () => {
    const map = useMap();
    useEffect(() => { try { map?.attributionControl?.setPrefix?.(""); } catch {} }, [map]);
    return null;
};

/** Reliably syncs the Leaflet map instance to an external ref (works in both react-leaflet v3 & v4). */
const MapRefSync = ({ mapRef }) => {
    const map = useMap();
    useEffect(() => {
        if (map && mapRef) mapRef.current = map;
    }, [map, mapRef]);
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
    const isDark = theme.palette.mode === 'dark';
    const placeStyle = useMemo(() => ({
        color: alpha(theme.palette.text.primary, isDark ? 0.20 : 0.12), weight: 1, fillOpacity: 0,
    }), [isDark, theme]);
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
            key={`places-${isDark ? 'dark' : 'light'}`}
            data={data}
            style={placeStyle}
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

/** Bounding box of Alabama GeoJSON — used by Recenter for statewide flyToBounds.
 *  RAW_BOUNDS is defined at module level (~line 181). */

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
        // Clicking a genuinely different pin still recenters because the position changes.
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

/** Leaflet needs invalidateSize when the container animates in (e.g. AnimatePresence fade). */
const InvalidateSizeOnMount = () => {
    const map = useMap();
    useEffect(() => {
        if (!map) return;
        const ids = [0, 100, 250, 500].map((ms) =>
            setTimeout(() => { try { map.invalidateSize({ animate: false }); } catch {} }, ms)
        );
        return () => ids.forEach(clearTimeout);
    }, [map]);
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
   Business category maps
   ─────────────────────────────────────────── */
const BUSINESS_CATEGORY_ICONS = {
    food_drink: RestaurantIcon,
    shopping_retail: StorefrontIcon,
    automotive: DirectionsCarIcon,
    home_services: HomeRepairServiceIcon,
    home_garden: YardIcon,
    health_wellness: MedicalServicesIcon,
    beauty_personal_care: ContentCutIcon,
    fitness_recreation: FitnessCenterIcon,
    professional_services: BusinessCenterIcon,
    education_childcare: SchoolIcon,
    pets_animals: PetsIcon,
    travel_lodging: TravelExploreIcon,
    arts_entertainment: TheaterComedyIcon,
    community_nonprofit: VolunteerActivismIcon,
    technology_repair: BuildIcon,
    other: CategoryRoundedIcon,
};

const CATEGORY_LABELS = {
    food_drink: "Food & Drink",
    shopping_retail: "Shopping & Retail",
    automotive: "Automotive",
    home_services: "Home Services",
    home_garden: "Home & Garden",
    health_wellness: "Health & Wellness",
    beauty_personal_care: "Beauty & Personal Care",
    fitness_recreation: "Fitness & Recreation",
    professional_services: "Professional Services",
    education_childcare: "Education & Childcare",
    pets_animals: "Pets & Animals",
    travel_lodging: "Travel & Lodging",
    arts_entertainment: "Arts & Entertainment",
    community_nonprofit: "Community & Nonprofit",
    technology_repair: "Technology & Repair",
    other: "Other",
};

const toStr = (v) => (v == null ? "" : String(v));

function formatWebsiteUrl(url) {
    if (!url) return "";
    return String(url).replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
}

function formatLocationLabel(biz) {
    const city = toStr(biz?.city).trim();
    const county = toStr(biz?.county).trim();
    const isStatewide = Boolean(biz?.is_statewide || biz?.isStatewide);
    if (isStatewide || (!city && !county)) return "Statewide Alabama";
    const countyLabel = county ? `${county} County` : "";
    if (city && countyLabel) return `${city}, ${countyLabel}`;
    return city || countyLabel || "Statewide Alabama";
}

/* ───────────────────────────────────────────
   Follow helpers (matching BusinessDirectoryCard)
   ─────────────────────────────────────────── */
const BUSINESS_FOLLOW_EVENT = "ll:business:follow-changed";

function getBusinessFollowStateCache() {
    if (typeof window === "undefined") return {};
    if (!window.__llBusinessFollowStateCache) window.__llBusinessFollowStateCache = {};
    return window.__llBusinessFollowStateCache;
}

function readBusinessFollowState(businessId, accountKey) {
    if (!businessId) return null;
    return getBusinessFollowStateCache()[`${String(businessId)}:${accountKey || "personal"}`] || null;
}

function writeBusinessFollowState(businessId, isFollowing, accountKey) {
    if (!businessId) return;
    getBusinessFollowStateCache()[`${String(businessId)}:${accountKey || "personal"}`] = { isFollowing: Boolean(isFollowing), t: Date.now() };
}

async function toggleBusinessFollowState({ businessId, isFollowing, getAccountPayload, getAccountHeaders }) {
    const payload = { target_id: Number(businessId), target_type: "business", action: isFollowing ? "unfollow" : "follow" };
    try { Object.assign(payload, typeof getAccountPayload === "function" ? getAccountPayload() : {}); } catch { /* ignore */ }
    const headers = typeof getAccountHeaders === "function" ? (getAccountHeaders() || {}) : {};
    const res = await secureFetch("/api/follows/toggle", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error("Follow toggle failed");
    const data = await res.json().catch(() => null);
    return Boolean(data?.following ?? data?.isFollowing ?? !isFollowing);
}

/* ───────────────────────────────────────────
   BusinessMapPopupCard — rich popup card
   ─────────────────────────────────────────── */
function buildSocialUrl(url, platform) {
    if (!url) return "";
    const s = String(url).trim();
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    switch (platform) {
        case "facebook": return `https://facebook.com/${s.replace(/^@/, "")}`;
        case "instagram": return `https://instagram.com/${s.replace(/^@/, "")}`;
        case "twitter": return `https://x.com/${s.replace(/^@/, "")}`;
        case "linkedin": return `https://linkedin.com/in/${s.replace(/^@/, "")}`;
        case "etsy": return `https://etsy.com/shop/${s.replace(/^@/, "")}`;
        default: return s;
    }
}

function BusinessMapPopupCard({ item, onSelect }) {
    const biz = item || {};
    const name = toStr(biz.name) || "Untitled business";
    const locationLabel = formatLocationLabel(biz);
    const addressStr = toStr(biz.address).trim();
    const categoryKey = toStr(biz.category_key || biz.categoryKey).trim().toLowerCase();
    const categoryLabel = CATEGORY_LABELS[categoryKey] || "";
    const CategoryIcon = categoryKey ? (BUSINESS_CATEGORY_ICONS[categoryKey] || CategoryRoundedIcon) : null;
    const logoUrl = toStr(biz.avatar_url || biz.avatarUrl || biz.logo_url || biz.logo_url || biz.logoUrl).trim();
    const description = toStr(biz.description).trim();
    const website = toStr(biz.website_url || biz.websiteUrl).trim();
    const rating = Number(biz.avg_rating || biz.rating || 0);
    const reviewCount = Number(biz.review_count || biz.reviewCount || 0);

    // ── Business settings ──
    const bizSettings = biz?.settings || biz?.businessSettings || biz;
    const businessAllowReviews = (() => {
        if (!bizSettings) return true;
        const v = bizSettings.allow_reviews ?? bizSettings.allowReviews;
        if (v == null) return true;
        if (typeof v === 'boolean') return v;
        return Number(v) !== 0;
    })();

    // Social links
    const facebookUrl = toStr(biz.facebook_url || biz.facebookUrl).trim();
    const instagramUrl = toStr(biz.instagram_url || biz.instagramUrl).trim();
    const twitterUrl = toStr(biz.twitter_url || biz.twitterUrl).trim();
    const linkedinUrl = toStr(biz.linkedin_url || biz.linkedinUrl).trim();
    const etsyUrl = toStr(biz.etsy_url || biz.etsyUrl).trim();
    const hasSocials = facebookUrl || instagramUrl || twitterUrl || website;

    // Verified — match directory card logic: only show when explicitly verified
    const businessIsVerified = Boolean(
        biz.is_verified === true || biz.is_verified === 1 || biz.is_verified === "1" ||
        biz.isVerified === true || biz.isVerified === 1 || biz.isVerified === "1"
    );

    // Avatar error state
    const [avatarError, setAvatarError] = useState(false);
    const hasValidLogo = logoUrl && !avatarError;

    // Follow state (matching BusinessDirectoryCard)
    const {
        isBusinessAccount: isBA,
        activeBusinessId: aBizId,
        getAccountPayload,
        getAccountHeaders,
        accountCacheKey = "personal",
    } = useActiveAccount();
    const auth = useAuth();
    const viewer = auth?.user || null;
    const isOwnBusiness = Boolean(isBA && aBizId && biz.id && String(aBizId) === String(biz.id));
    const [localFollowing, setLocalFollowing] = useState(() => {
        const cached = readBusinessFollowState(Number(biz.id || 0), accountCacheKey);
        return cached ? Boolean(cached.isFollowing) : false;
    });
    const [followBusy, setFollowBusy] = useState(false);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [bizReportOpen, setBizReportOpen] = useState(false);
    const [copyLinkToast, setCopyLinkToast] = useState(false);
    const [hideBusy, setHideBusy] = useState(false);
    const [blockBusy, setBlockBusy] = useState(false);
    const [hideBlockToast, setHideBlockToast] = useState('');
    const isOwner = isOwnBusiness;

    // Stable refs for account helpers (prevent stale closures)
    const getAccountPayloadRef = useRef(getAccountPayload);
    getAccountPayloadRef.current = getAccountPayload;
    const getAccountHeadersRef = useRef(getAccountHeaders);
    getAccountHeadersRef.current = getAccountHeaders;

    // Listen for follow changes from other components
    useEffect(() => {
        const businessId = Number(biz.id || 0);
        if (!businessId) return undefined;
        const handler = (e) => {
            const detail = e?.detail || {};
            if (Number(detail.businessId) !== businessId) return;
            if (detail.accountCacheKey && detail.accountCacheKey !== accountCacheKey) return;
            setLocalFollowing(Boolean(detail.isFollowing));
        };
        window.addEventListener(BUSINESS_FOLLOW_EVENT, handler);
        return () => window.removeEventListener(BUSINESS_FOLLOW_EVENT, handler);
    }, [biz.id, accountCacheKey]);

    const handleFollowToggle = useCallback(async (event) => {
        event.stopPropagation();
        event.preventDefault();
        const businessId = Number(biz.id || 0);
        if (!businessId || followBusy || isOwnBusiness) return;
        if (!viewer?.id) {
            if (typeof auth?.requireAuth === "function") { try { await auth.requireAuth(); } catch { /* ignore */ } }
            return;
        }
        const previous = Boolean(localFollowing);
        setFollowBusy(true);
        setLocalFollowing(!previous);
        writeBusinessFollowState(businessId, !previous, accountCacheKey);
        try {
            const next = await toggleBusinessFollowState({ businessId, isFollowing: previous, getAccountPayload, getAccountHeaders });
            setLocalFollowing(next);
            writeBusinessFollowState(businessId, next, accountCacheKey);
            window.dispatchEvent(new CustomEvent(BUSINESS_FOLLOW_EVENT, { detail: { businessId, isFollowing: next, accountCacheKey, source: "mapPopup" } }));
        } catch {
            setLocalFollowing(previous);
            writeBusinessFollowState(businessId, previous, accountCacheKey);
        } finally {
            setFollowBusy(false);
        }
    }, [biz.id, followBusy, isOwnBusiness, viewer?.id, auth, localFollowing, getAccountPayload, getAccountHeaders, accountCacheKey]);


    const handleCopyLink = () => {
        const slug = toStr(biz.slug || biz.handle || '').trim();
        const path = slug ? `/${slug}` : `/business/${encodeURIComponent(String(biz.id || ''))}`;
        const url = `${window.location.origin}${path}`;
        navigator.clipboard.writeText(url)
            .then(() => setCopyLinkToast(true))
            .catch(() => setCopyLinkToast(true));
    };

    const handleReportClick = () => {
        setBizReportOpen(true);
    };

    const submitBizReport = async ({ reason, details }) => {
        const bizId = biz?.id;
        if (!bizId) return;
        const urls = [
            `/api/business/${encodeURIComponent(bizId)}/report`,
            `/api/business/${encodeURIComponent(bizId)}/flag`,
        ];
        for (const url of urls) {
            try {
                const res = await secureFetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason, details }),
                });
                if (res.ok) break;
            } catch { /* try fallback */ }
        }
    };

    const handleHideBusiness = useCallback(async () => {
        const bizId = Number(biz.id || 0);
        if (!bizId || hideBusy || blockBusy) return;
        setHideBusy(true);
        const displayName = String(biz.name || 'Business').trim() || 'Business';
        try {
            const apiBase = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');
            const hdrs = { 'Content-Type': 'application/json', ...(getAccountHeadersRef.current?.() || {}) };
            const payload = { target_id: bizId, target_type: 'business', action: 'hide' };
            const urls = [`${apiBase}/api/users/hide`, '/api/users/hide'];
            for (const url of urls) {
                try {
                    const res = await secureFetch(url, { method: 'POST', credentials: 'include', headers: hdrs, body: JSON.stringify(payload) });
                    if (res.ok) {
                        try { window.dispatchEvent(new CustomEvent('ll:user:hidden-changed', { detail: { userId: bizId, targetType: 'business', hidden: true } })); } catch { /* */ }
                        try { window.dispatchEvent(new CustomEvent('ll:business:hidden-changed', { detail: { businessId: bizId, hidden: true, source: 'mapPopup' } })); } catch { /* */ }
                        try { window.dispatchEvent(new CustomEvent('ll:business:directory-refresh')); } catch { /* */ }
                        setHideBlockToast(`Posts from ${displayName} hidden`);
                        return;
                    }
                } catch { /* try next */ }
            }
        } catch { /* */ } finally { setHideBusy(false); }
    }, [biz.id, biz.name, hideBusy, blockBusy]);

    const handleBlockBusiness = useCallback(async () => {
        const bizId = Number(biz.id || 0);
        if (!bizId || hideBusy || blockBusy) return;
        setBlockBusy(true);
        const displayName = String(biz.name || 'Business').trim() || 'Business';
        try {
            const apiBase = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');
            const hdrs = { 'Content-Type': 'application/json', ...(getAccountHeadersRef.current?.() || {}) };
            const payload = { target_id: bizId, target_type: 'business', action: 'block' };
            const urls = [`${apiBase}/api/users/block`, '/api/users/block'];
            for (const url of urls) {
                try {
                    const res = await secureFetch(url, { method: 'POST', credentials: 'include', headers: hdrs, body: JSON.stringify(payload) });
                    if (res.ok) {
                        try { window.dispatchEvent(new CustomEvent('ll:user:blocked-changed', { detail: { userId: bizId, targetType: 'business', blocked: true } })); } catch { /* */ }
                        try { window.dispatchEvent(new CustomEvent('ll:user:hidden-changed', { detail: { userId: bizId, targetType: 'business', hidden: true } })); } catch { /* */ }
                        try { window.dispatchEvent(new CustomEvent('ll:business:blocked-changed', { detail: { businessId: bizId, blocked: true, source: 'mapPopup' } })); } catch { /* */ }
                        try { window.dispatchEvent(new CustomEvent('ll:business:directory-refresh')); } catch { /* */ }
                        setHideBlockToast(`${displayName} blocked`);
                        return;
                    }
                } catch { /* try next */ }
            }
        } catch { /* */ } finally { setBlockBusy(false); }
    }, [biz.id, biz.name, hideBusy, blockBusy]);

    return (
        <Box sx={{ width: "min(400px, 88vw)", maxWidth: "100%", position: "relative" }}>


            {/* Clickable card body */}
            <Box
                sx={{ cursor: "pointer" }}
                onClick={(e) => { e.stopPropagation(); onSelect?.(biz); }}
            >
                <Box sx={{ p: 1.75, pb: 1.25 }}>
                    {/* Logo + name/category/rating/location */}
                    <Box sx={{ display: "flex", gap: 1.5, pr: 3 }}>
                        <Avatar
                            src={hasValidLogo ? logoUrl : undefined}
                            onError={() => setAvatarError(true)}
                            alt={name}
                            sx={(t) => ({
                                width: 56, height: 56, borderRadius: 2, flexShrink: 0, mt: 0.25,
                                border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.18),
                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                color: "primary.main",
                            })}
                            imgProps={{ referrerPolicy: "no-referrer" }}
                        >
                            <StorefrontOutlinedIcon sx={{ fontSize: 28 }} />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            {/* Name + Verified */}
                            <Stack direction="row" spacing={0.4} alignItems="center" sx={{ mb: 0.3 }}>
                                <Typography sx={{
                                    fontWeight: 900, fontSize: 14.5, lineHeight: 1.25,
                                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                                    overflowWrap: "anywhere", wordBreak: "break-word",
                                }}>
                                    {name}
                                </Typography>
                                {businessIsVerified && (
                                    <Tooltip title="Verified Business" arrow>
                                        <VerifiedIcon sx={{ fontSize: 15, color: "primary.main", flexShrink: 0 }} />
                                    </Tooltip>
                                )}
                            </Stack>

                            {/* Category chip */}
                            {categoryLabel ? (
                                <Chip
                                    icon={CategoryIcon ? <CategoryIcon sx={{ fontSize: 12 }} /> : undefined}
                                    label={categoryLabel}
                                    size="small"
                                    sx={(t) => ({
                                        height: 20, fontSize: 9.5, fontWeight: 800, mb: 0.4,
                                        bgcolor: alpha(t.palette.primary.main, 0.1), color: "primary.main",
                                        "& .MuiChip-icon": { color: "primary.main", ml: 0.5 },
                                    })}
                                />
                            ) : null}

                            {/* Rating — only show if reviews are enabled and exist */}
                            {businessAllowReviews && reviewCount > 0 ? (
                                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.15 }}>
                                    <Rating value={rating} readOnly precision={0.5} size="small" sx={{ fontSize: 13 }} />
                                    <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: "text.secondary" }}>
                                        {rating.toFixed(1)} ({reviewCount})
                                    </Typography>
                                </Stack>
                            ) : null}

                            {/* Location — street on one line, city/county on next */}
                            <Box sx={{ mt: businessAllowReviews && reviewCount > 0 ? 0 : 0.15 }}>
                                {addressStr && (
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                        <LocationOnRoundedIcon sx={{ fontSize: 13, color: "primary.main", flexShrink: 0 }} />
                                        <Typography sx={{ fontSize: 11.5, color: "primary.main", fontWeight: 700, lineHeight: 1.3 }} noWrap>
                                            {addressStr}
                                        </Typography>
                                    </Stack>
                                )}
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                    {!addressStr && <LocationOnRoundedIcon sx={{ fontSize: 13, color: "primary.main", flexShrink: 0 }} />}
                                    <Typography sx={{ fontSize: 11, color: "primary.main", fontWeight: 700, ml: addressStr ? 2.25 : 0 }} noWrap>
                                        {locationLabel}
                                    </Typography>
                                </Stack>
                            </Box>
                        </Box>
                    </Box>

                    {/* Description — truncated */}
                    {description ? (() => {
                        const MAX = 90;
                        const truncated = description.length > MAX;
                        const shown = truncated ? description.slice(0, MAX).trimEnd() : description;
                        return (
                            <Typography sx={{
                                mt: 0.75, fontSize: 12, lineHeight: 1.45, color: "text.secondary",
                                overflowWrap: "anywhere", wordBreak: "break-word",
                            }}>
                                {shown}
                                {truncated && (
                                    <Typography
                                        component="span"
                                        sx={{ fontSize: 12, fontWeight: 700, color: "primary.main", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                                        onClick={(e) => { e.stopPropagation(); onSelect?.(biz); }}
                                    >
                                        ...more
                                    </Typography>
                                )}
                            </Typography>
                        );
                    })() : null}
                </Box>
            </Box>

            {/* Footer: Follow + Share | Social icons */}
            <Box sx={{
                px: 1.5, py: 0.75, borderTop: "1px solid", borderColor: "divider",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1,
            }}>
                {/* Left: Follow + Share (matching directory card) */}
                <Stack direction="row" alignItems="center" spacing={0.5}>
                    {!isOwnBusiness && (
                        <Tooltip title={localFollowing ? "Unfollow" : "Follow"} arrow>
                            <Box
                                onClick={handleFollowToggle}
                                role="button"
                                tabIndex={0}
                                sx={{
                                    display: "inline-flex", alignItems: "center", gap: 0.5,
                                    px: 1.25, py: 0.5, borderRadius: 999, cursor: "pointer",
                                    transition: (t) => `background ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                    "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
                                    "&:active": { transform: "scale(0.97)" },
                                    opacity: followBusy ? 0.72 : 1,
                                }}
                            >
                                {localFollowing
                                    ? <HowToRegRoundedIcon sx={{ fontSize: 22, color: "primary.main" }} />
                                    : <PersonAddAlt1RoundedIcon sx={{ fontSize: 22, color: "text.secondary" }} />}
                            </Box>
                        </Tooltip>
                    )}
                    <Tooltip title="Share" arrow>
                        <Box
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShareDialogOpen(true); }}
                            role="button"
                            tabIndex={0}
                            sx={{
                                display: "inline-flex", alignItems: "center", gap: 0.5,
                                px: 1.25, py: 0.5, borderRadius: 999, cursor: "pointer",
                                transition: (t) => `background ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
                                "&:active": { transform: "scale(0.97)" },
                            }}
                        >
                            <ShareRoundedIcon sx={{ fontSize: 22, color: "text.secondary" }} />
                        </Box>
                    </Tooltip>
                </Stack>

                {/* Right: Social icons */}
                {hasSocials ? (
                    <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
                        {website ? (
                            <Tooltip title={`Visit ${formatWebsiteUrl(website)}`} arrow>
                                <IconButton
                                    size="small"
                                    onClick={(e) => { e.stopPropagation(); window.open(website.startsWith("http") ? website : `https://${website}`, "_blank", "noopener,noreferrer"); }}
                                    sx={(t) => ({ width: { xs: 36, sm: 28 }, height: { xs: 36, sm: 28 }, color: t.palette.mode === "dark" ? t.palette.text.primary : t.palette.text.secondary, "&:hover": { bgcolor: alpha(t.palette.text.primary, 0.08) } })}
                                >
                                    <LanguageRoundedIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                        ) : null}
                        {facebookUrl ? (
                            <Tooltip title="Facebook" arrow>
                                <IconButton
                                    size="small"
                                    onClick={(e) => { e.stopPropagation(); window.open(buildSocialUrl(facebookUrl, "facebook"), "_blank", "noopener,noreferrer"); }}
                                    sx={{ width: { xs: 36, sm: 28 }, height: { xs: 36, sm: 28 }, color: (t) => t.custom.social.facebook, "&:hover": { bgcolor: (t) => alpha(t.custom.social.facebook, 0.1) } }}
                                >
                                    <FacebookIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                        ) : null}
                        {instagramUrl ? (
                            <Tooltip title="Instagram" arrow>
                                <IconButton
                                    size="small"
                                    onClick={(e) => { e.stopPropagation(); window.open(buildSocialUrl(instagramUrl, "instagram"), "_blank", "noopener,noreferrer"); }}
                                    sx={{ width: { xs: 36, sm: 28 }, height: { xs: 36, sm: 28 }, color: (t) => t.custom.social.instagram, "&:hover": { bgcolor: (t) => alpha(t.custom.social.instagram, 0.1) } }}
                                >
                                    <InstagramIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                        ) : null}
                        {twitterUrl ? (
                            <Tooltip title="X (Twitter)" arrow>
                                <IconButton
                                    size="small"
                                    onClick={(e) => { e.stopPropagation(); window.open(buildSocialUrl(twitterUrl, "twitter"), "_blank", "noopener,noreferrer"); }}
                                    sx={{ width: { xs: 36, sm: 28 }, height: { xs: 36, sm: 28 }, color: "text.primary", "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.08) } }}
                                >
                                    <XIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </Tooltip>
                        ) : null}
                        {linkedinUrl ? (
                            <Tooltip title="LinkedIn" arrow>
                                <IconButton
                                    size="small"
                                    onClick={(e) => { e.stopPropagation(); window.open(buildSocialUrl(linkedinUrl, "linkedin"), "_blank", "noopener,noreferrer"); }}
                                    sx={(t) => ({ width: { xs: 36, sm: 28 }, height: { xs: 36, sm: 28 }, color: t.palette.mode === "dark" ? "#5A9BD5" : "#0A66C2", "&:hover": { bgcolor: alpha(t.palette.mode === "dark" ? "#5A9BD5" : "#0A66C2", 0.1) } })}
                                >
                                    <LinkedInIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                        ) : null}
                        {etsyUrl ? (
                            <Tooltip title="Etsy Shop" arrow>
                                <IconButton
                                    size="small"
                                    onClick={(e) => { e.stopPropagation(); window.open(buildSocialUrl(etsyUrl, "etsy"), "_blank", "noopener,noreferrer"); }}
                                    sx={{ width: { xs: 36, sm: 28 }, height: { xs: 36, sm: 28 }, color: "#F1641E", "&:hover": { bgcolor: (t) => alpha("#F1641E", 0.1) } }}
                                >
                                    <StorefrontRoundedIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                        ) : null}
                    </Stack>
                ) : null}
            </Box>

            <ShareDialog
                contentType="business"
                open={shareDialogOpen}
                onClose={() => setShareDialogOpen(false)}
                business={biz}
                viewer={viewer}
            />

            <ReportDialog
                open={bizReportOpen}
                onClose={() => setBizReportOpen(false)}
                onSubmit={submitBizReport}
                title="Report Business"
            />

            <Snackbar
                open={Boolean(copyLinkToast)}
                autoHideDuration={2500}
                onClose={() => setCopyLinkToast(false)}
                message="Link copied to clipboard"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />

            <Snackbar
                open={Boolean(hideBlockToast)}
                autoHideDuration={3000}
                onClose={() => setHideBlockToast('')}
                message={hideBlockToast}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
        </Box>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   Hoisted GeoJSON styles & callbacks — MUST live outside the
   component so react-leaflet sees stable references.  Creating
   these inline would give a new object every render, which makes
   GeoJSON re-mount ⇒ setState ⇒ re-render ⇒ infinite loop.
   ═══════════════════════════════════════════════════════════════════ */
/* GeoJSON styles moved inside component as useMemo (theme-aware) */

const COUNTY_ON_EACH_FEATURE = (feature, layer) => {
    const name = feature?.properties?.NAME;
    if (name) {
        layer.bindTooltip(String(name), {
            permanent: true,
            direction: "center",
            className: "ll-county-label",
            interactive: false,
        });
    }
};

/* ═══════════════════════════════════════════════════════════════════
   BusinessesMapTab
   ═══════════════════════════════════════════════════════════════════ */

// Hoisted outside the component so the default reference is stable across renders.
// Creating `[]` inline in the parameter list would produce a brand-new array on every
// render, which destabilises every useMemo / useEffect that depends on `items`.
const EMPTY_ITEMS = [];

export default function BusinessesMapTab({ items = EMPTY_ITEMS, onSelectItem, focusItemId, onFocusItemHandled, hoveredCardId, popupContentById, mode = "businesses", center: centerProp, zoomLevel: zoomLevelProp }) {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const tileUrl = isDarkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png';
    const tileUrlNoLabels = isDarkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png';

    // Theme-aware GeoJSON styles (stable via useMemo)
    const countyGeojsonStyle = useMemo(() => ({
        color: alpha(theme.palette.text.primary, isDarkMode ? 0.18 : 0.10),
        weight: 1,
        fillColor: alpha(theme.palette.text.primary, isDarkMode ? 0.06 : 0.04),
        fillOpacity: 0,
    }), [isDarkMode, theme]);

    const countyStyleBiz = useMemo(() => ({
        color: alpha(theme.palette.text.primary, isDarkMode ? 0.14 : 0.08),
        weight: 0.75,
        fillOpacity: 0,
    }), [isDarkMode, theme]);

    const alabamaBorderStyle = useMemo(() => ({
        color: alpha(theme.palette.text.primary, isDarkMode ? 0.35 : 0.24),
        weight: 2.5,
        fillOpacity: 0,
    }), [isDarkMode, theme]);

    const isPostsMode = mode === "posts";
    const mapRefLocal = useRef(null);
    const cityList = useMemo(() => normalizeCityFeatures(alabamaCities), []);

    // Lookup of item id → item object
    const itemById = useMemo(() => {
        const m = new Map();
        (Array.isArray(items) ? items : []).forEach((e) => {
            if (e?.id != null) m.set(String(e.id), e);
        });
        return m;
    }, [items]);

    // Normalize items into GeoJSON features
    const normalizedData = useMemo(() => {
        const arr = Array.isArray(items) ? items : [];
        const features = arr
            .filter((e) => Number.isFinite(Number(e?.latitude)) && Number.isFinite(Number(e?.longitude)))
            .map((e) => ({
                type: "Feature",
                geometry: { type: "Point", coordinates: [Number(e.longitude), Number(e.latitude)] },
                properties: { id: String(e.id) },
            }));
        return { type: "FeatureCollection", features };
    }, [items]);

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

    // Map center/zoom state — driven like CommunityPage (Recenter reads these)
    const [mapCenter, setMapCenter] = useState(centerProp || DEFAULT_CENTER);
    const [mapZoom, setMapZoom] = useState(zoomLevelProp || DEFAULT_ZOOM);

    // Sync parent-driven center/zoom (e.g. radius filter changes) into internal state
    useEffect(() => {
        if (centerProp) setMapCenter(centerProp);
    }, [centerProp]);
    useEffect(() => {
        if (zoomLevelProp != null) setMapZoom(zoomLevelProp);
    }, [zoomLevelProp]);

    // Merge card hover with map hover — card hover takes priority when set
    const effectiveHoveredId = hoveredCardId != null ? String(hoveredCardId) : hoveredMarkerIdLocal;

    // Keep selected in sync with opened popup
    useEffect(() => {
        setSelectedMarkerIdLocal(openedPopupId != null ? String(openedPopupId) : null);
    }, [openedPopupId]);

    // Hover bounce animation (same as events)
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

    const handlePopupClose = useCallback((id) => {
        if (id != null && selectedMarkerIdLocal != null && String(selectedMarkerIdLocal) === String(id)) {
            setSelectedMarkerIdLocal(null);
        }
        setOpenedPopupId(null);
    }, [selectedMarkerIdLocal]);

    // External focus: when a card's location is clicked, pan to the marker and open its popup
    useEffect(() => {
        if (!focusItemId) return;
        const idStr = String(focusItemId);

        const info = idToGroupIndex.get(idStr);
        if (!info) {
            if (typeof onFocusItemHandled === "function") onFocusItemHandled();
            return;
        }
        setActiveIdxByGroup((prev) => ({ ...prev, [info.groupKey]: info.idx }));
        setSelectedMarkerIdLocal(idStr);
        setOpenedPopupId(idStr);

        const entry = markerEntries.find((e) => e.groupKey === info.groupKey);
        if (entry) {
            const [lat, lng] = entry.position;
            setMapCenter([lat, lng]);
            setMapZoom(MARKER_CLICK_ZOOM);
        }
        if (typeof onFocusItemHandled === "function") onFocusItemHandled();
    }, [focusItemId, idToGroupIndex, markerEntries, onFocusItemHandled]);

    const maxBounds = useMemo(() => computeBoundsWithPad(RAW_BOUNDS, DEFAULT_BOUNDS_PAD), []);
    const primaryMain = theme.palette.primary.main;

    return (
        <MapErrorBoundary>
            <MapWrapper>
                {/* Approximate location chip + OSM attribution */}
                <Box sx={{ position: "absolute", bottom: 12, right: 12, zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
                    <Chip
                        label="Pins show approximate area (city/county)"
                        size="small"
                        icon={<RoomOutlinedIcon />}
                        sx={(t) => ({
                            backgroundColor: alpha(t.palette.background.paper, 0.78),
                            color: t.palette.text.secondary,
                            fontSize: 11, fontWeight: 600, height: 22, borderRadius: 999,
                            border: `1px solid ${alpha(t.palette.divider, 0.55)}`,
                            boxShadow: `0 8px 18px ${alpha(t.palette.common.black, 0.08)}`,
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

                {/* Empty state */}
                {normalizedData.features.length === 0 && (
                    <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 999, textAlign: "center", p: 3, pointerEvents: "none" }}>
                        <Box sx={{
                            px: 3, py: 2.5, borderRadius: 2.5,
                            bgcolor: alpha(theme.palette.background.paper, 0.92),
                            backdropFilter: "blur(8px)",
                            border: `1px solid ${theme.palette.divider}`,
                            boxShadow: theme.custom.shadows.md,
                        }}>
                            <LocationOnRoundedIcon sx={{ fontSize: 36, color: "text.disabled", mb: 1 }} />
                            <Typography sx={{ fontWeight: 700, fontSize: 14, color: "text.secondary" }}>
                                No businesses with location pins
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: "text.disabled", mt: 0.5 }}>
                                Businesses will appear here when they have a city or address set
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
                        style={{ width: "100%", height: "100%" }}
                    >
                        <RemovePrefix />
                        <MapRefSync mapRef={mapRefLocal} />
                        <InvalidateSizeOnMount />
                        {/* Business directory → OSM tiles (street names built-in);
                            Business posts → CartoDB Voyager nolabels + custom overlays */}
                        {isPostsMode ? (
                            <TileLayer
                                key={`tile-${isDarkMode ? 'dark' : 'light'}-nolabel`}
                                url={tileUrlNoLabels}
                            />
                        ) : (
                            <TileLayer
                                key={`tile-${isDarkMode ? 'dark' : 'light'}`}
                                url={tileUrl}
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                        )}
                        <BoundsController bounds={maxBounds} />
                        <MaskController />
                        <Recenter center={mapCenter} zoomLevel={mapZoom} openedPopupId={openedPopupId} markerPosition={openedMarkerPosition} />
                        <PanOnPopupOpen openedPopupId={openedPopupId} markerRefs={markerRefs} />
                        <ZoomDismissOnZoomOut openedPopupId={openedPopupId} onPopupClose={handlePopupClose} />

                        {/* County boundaries — posts mode gets labels + fills; businesses mode gets thin lines only */}
                        <GeoJSON
                            key={`counties-${isPostsMode ? 'posts' : 'biz'}-${isDarkMode ? 'd' : 'l'}`}
                            data={alabamaCounties}
                            onEachFeature={isPostsMode ? COUNTY_ON_EACH_FEATURE : undefined}
                            style={isPostsMode ? countyGeojsonStyle : countyStyleBiz}
                        />

                        {/* Alabama border */}
                        <GeoJSON key={`al-border-${isDarkMode ? 'd' : 'l'}`} data={alabama} style={alabamaBorderStyle} />

                        {/* Places outlines + city text labels only for posts
                            (OSM tiles already have labels for businesses) */}
                        {isPostsMode && <PlacesOutlines data={alabamaPlaces} minZoom={9} />}
                        {isPostsMode && <CityLabels cities={cityList} minZoom={9} />}

                        {/* Business markers */}
                        {markerEntries.map(({ groupKey, position, ids }) => {
                            const idx = activeIdxByGroup[groupKey] ?? 0;
                            const activeId = ids?.[idx];
                            const activeKey = activeId != null ? String(activeId) : null;
                            const openedKey = openedPopupId != null ? String(openedPopupId) : null;
                            const isOpen = !!openedKey && !!activeKey && openedKey === activeKey;
                            const isHovered = !!activeKey && effectiveHoveredId != null && String(effectiveHoveredId) === activeKey;
                            const isSelected = !!activeKey && (isOpen || (selectedMarkerIdLocal != null && String(selectedMarkerIdLocal) === activeKey));
                            const activeItem = activeKey ? itemById.get(activeKey) : null;
                            const catKey = String(activeItem?.category_key || activeItem?.categoryKey || 'other').toLowerCase();
                            const { base: bizBase, active: bizActive } = getBizMarkerIcons(catKey);
                            const icon = (isHovered || isSelected) ? bizActive : bizBase;

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
                                                    setOpenedPopupId(String(ids[newIdx]));
                                                };

                                                const goNext = (e) => {
                                                    e.stopPropagation();
                                                    const newIdx = Math.min(idx + 1, ids.length - 1);
                                                    setActiveIdxByGroup((p) => ({ ...p, [groupKey]: newIdx }));
                                                    setOpenedPopupId(String(ids[newIdx]));
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
                                                            {(() => {
                                                                // If custom popup content map is provided, use it
                                                                if (popupContentById) {
                                                                    const customContent = popupContentById.get?.(activeKey)
                                                                        || popupContentById.get?.(activeId)
                                                                        || popupContentById.get?.(Number(activeKey))
                                                                        || (popupContentById[activeKey])
                                                                        || null;
                                                                    if (customContent) {
                                                                        return (
                                                                            <Box
                                                                                ref={(node) => {
                                                                                    // Leaflet calls disableClickPropagation on the popup content
                                                                                    // wrapper, which attaches native listeners that call
                                                                                    // stopPropagation(). This prevents React synthetic events
                                                                                    // (delegated at the root) from ever firing.
                                                                                    //
                                                                                    // Fix: find the wrapper and remove Leaflet's specific listeners
                                                                                    // by looking for the _leaflet_disable_click flag.
                                                                                    if (!node) return;
                                                                                    const wrapper = node.closest?.('.leaflet-popup-content-wrapper');
                                                                                    if (!wrapper || wrapper._llFixed) return;
                                                                                    wrapper._llFixed = true;
                                                                                    // Leaflet stores a flag when disableClickPropagation is called.
                                                                                    // We can't easily remove the exact listener, so instead we
                                                                                    // add our own capture-phase listener that re-dispatches a
                                                                                    // new event from the React root, bypassing Leaflet's block.
                                                                                    //
                                                                                    // Simpler: prevent Leaflet's stopPropagation from taking effect
                                                                                    // by overriding stopPropagation on the event object during the
                                                                                    // capture phase for events originating inside our content.
                                                                                    const contentNode = node;
                                                                                    ['click', 'dblclick', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'pointerdown', 'pointerup'].forEach((evtName) => {
                                                                                        wrapper.addEventListener(evtName, function(e) {
                                                                                            if (contentNode.contains(e.target)) {
                                                                                                // Override stopPropagation so Leaflet's listener
                                                                                                // (which runs later in bubbling) becomes a no-op
                                                                                                e.stopPropagation = function() {};
                                                                                            }
                                                                                        }, true); // capture phase — runs before Leaflet's bubbling listener
                                                                                    });
                                                                                }}
                                                                                sx={{ width: "min(400px, 88vw)", maxWidth: "100%", position: "relative", zIndex: 10 }}
                                                                                onClickCapture={(e) => {
                                                                                    const target = e.target;
                                                                                    if (target?.closest?.('.MuiDialog-root') || target?.closest?.('.MuiMenu-root') || target?.closest?.('.MuiPopover-root')) {
                                                                                        e.stopPropagation();
                                                                                    }
                                                                                }}
                                                                            >
                                                                                {customContent}
                                                                            </Box>
                                                                        );
                                                                    }
                                                                }
                                                                // Default: business directory popup card
                                                                return (
                                                                    <BusinessMapPopupCard
                                                                        item={activeItem}
                                                                        onSelect={onSelectItem}
                                                                    />
                                                                );
                                                            })()}
                                                        </Box>

                                                        {/* Stacked navigation arrows */}
                                                        {hasStack && (
                                                            <Box sx={{
                                                                display: "flex", alignItems: "center", gap: 1,
                                                                px: 1.25, py: 1, borderTop: "1px solid", borderColor: "divider", bgcolor: "background.paper",
                                                            }}>
                                                                <IconButton
                                                                    size="small" onClick={goPrev} disabled={idx <= 0}
                                                                    sx={{ width: 32, height: 32, borderRadius: 999, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", boxShadow: theme.custom.shadows.sm }}
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
                                                                    sx={{ width: 32, height: 32, borderRadius: 999, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", boxShadow: theme.custom.shadows.sm }}
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

// src/pages/services/components/ServicesMapTab.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import MapErrorBoundary from "../../../components/MapErrorBoundary";
import {
    Avatar,
    Box,
    Chip,
    IconButton,
    Snackbar,
    Stack,
    Typography,
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
import PersonIcon from "@mui/icons-material/Person";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import RequestQuoteRoundedIcon from "@mui/icons-material/RequestQuoteRounded";

import { ReportDialog } from "../../../components/ActionBar";
import { secureFetch } from "../../../utils/secureFetch";

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
    offsetCoords,
    MARKER_CLICK_ZOOM,
    FLY_TO_DURATION,
    PAN_TO_DURATION,
    DEFAULT_BOUNDS_PAD,
    RECENTER_OFFSET_PX,
    isStatewideCenter,
    computeBoundsWithPad,
    createAlabamaMask,
} from "../../../utils/MapUtils";

import { getServiceCategoryInfo } from "../utils/serviceHelpers";
import { BRAND } from "../../../themes";

/* ── SVG-based service markers (themed, no PNGs) ── */

// Brand colors sourced from theme.js BRAND tokens (single source of truth)
const BRAND_NAVY      = BRAND.navy;
const BRAND_NAVY_DARK = BRAND.navyDark;
const BRAND_CRIMSON   = BRAND.crimson;
const BRAND_CRIMSON_D = BRAND.crimsonDark;
const BRAND_WHITE     = BRAND.white;

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

const makeSvgDivIcon = (svgHtml, className) =>
    L.divIcon({
        className,
        iconSize: [32, 44],
        iconAnchor: [16, 44],
        popupAnchor: [0, -44],
        html: `<div style="position:relative;width:32px;height:44px;" class="marker-icon-wrap">
      <div class="marker-icon" style="width:32px;height:44px;">${svgHtml}</div>
    </div>`,
    });

const BUILD_ICON_PATH = 'M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z';
const HAND_ICON_PATH = 'M18 8.35V3.5C18 2.67 17.33 2 16.5 2S15 2.67 15 3.5v4.85h-1.5V1.5C13.5.67 12.83 0 12 0S10.5.67 10.5 1.5v6.85H9V2.5C9 1.67 8.33 1 7.5 1S6 1.67 6 2.5v8.22L3.85 8.57c-.48-.48-1.26-.48-1.74 0-.48.49-.48 1.27 0 1.76l5.75 7.14c.45.56 1.12.88 1.83.88H17c1.1 0 2-.9 2-2v-5.5c0-.83-.67-1.5-1.5-1.5H18z';

const serviceDivIcon = makeSvgDivIcon(buildMarkerSvg(BUILD_ICON_PATH, BRAND_NAVY, BRAND_NAVY_DARK, BRAND_NAVY), "services-div-icon");
const serviceDivIconGold = makeSvgDivIcon(buildMarkerSvg(BUILD_ICON_PATH, BRAND_CRIMSON, BRAND_CRIMSON_D, BRAND_CRIMSON), "services-div-icon");

const requestDivIcon = makeSvgDivIcon(buildMarkerSvg(HAND_ICON_PATH, BRAND_NAVY, BRAND_NAVY_DARK, BRAND_NAVY), "services-div-icon");
const requestDivIconGold = makeSvgDivIcon(buildMarkerSvg(HAND_ICON_PATH, BRAND_CRIMSON, BRAND_CRIMSON_D, BRAND_CRIMSON), "services-div-icon");

/* ───────────────────────────────────────────
   Map constants & hoisted GeoJSON styles
   ─────────────────────────────────────────── */
const toStr = (v) => (v == null ? "" : String(v));

const RAW_BOUNDS = L.geoJSON(alabama.features[0]).getBounds();

/*
 * ── HOISTED GeoJSON style objects & callbacks ──────────────────────
 * These MUST live outside any component so their references are stable
 * across renders.  Creating them inline causes React-Leaflet to detect
 * "new" props every render → setState in useEffect → infinite loop.
 */
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

/* ── Styled wrapper (matches MusicMapView exactly) ── */
const MapWrapper = styled(Box)(({ theme: t }) => ({
    position: "relative",
    width: "100%",
    height: "100%",
    "& .leaflet-container": {
        width: "100%",
        height: "100%",
        backgroundColor: t.palette.background.default,
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
        color: alpha(t.palette.text.primary, 0.34),
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
        color: alpha(t.palette.text.primary, 0.38),
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.02em",
        pointerEvents: "none",
    },
    "& .leaflet-popup": { marginBottom: 6 },
    "& .leaflet-popup-content-wrapper": {
        background: `${t.palette.background.paper} !important`,
        color: `${t.palette.text.primary} !important`,
        borderRadius: 18,
        padding: 0,
        overflow: "hidden",
        border: `1px solid ${t.palette.divider}`,
        boxShadow: t.palette.mode === 'dark'
            ? `0 16px 48px rgba(0,0,0,0.45)`
            : `0 16px 48px ${alpha(t.palette.text.primary, 0.18)}`,
    },
    "& .leaflet-popup-content": { margin: 0, width: "auto !important", maxWidth: "none !important", lineHeight: 1.2 },
    "& .leaflet-popup-tip": {
        background: `${t.palette.background.paper} !important`,
        border: `1px solid ${t.palette.divider}`,
        boxShadow: t.palette.mode === 'dark'
            ? `0 10px 28px rgba(0,0,0,0.35)`
            : `0 10px 28px ${alpha(t.palette.text.primary, 0.12)}`,
    },
    "& .leaflet-popup-close-button": {
        width: 28,
        height: 28,
        top: 8,
        right: 8,
        borderRadius: 999,
        color: t.palette.text.secondary,
        background: alpha(t.palette.background.paper, 0.95),
        border: `1px solid ${t.palette.divider}`,
        boxShadow: t.palette.mode === 'dark'
            ? `0 2px 6px rgba(0,0,0,0.30)`
            : `0 2px 6px ${alpha(t.palette.text.primary, 0.15)}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 30,
        fontSize: 18,
        fontWeight: 700,
    },
    "& .leaflet-popup-close-button:hover": {
        color: t.palette.text.primary,
        background: `${t.palette.action.hover} !important`,
    },
}));

/* ───────────────────────────────────────────
   Helper overlays (matches MusicMapView)
   ─────────────────────────────────────────── */
const RemovePrefix = () => {
    const map = useMap();
    useEffect(() => { try { map?.attributionControl?.setPrefix?.(""); } catch { /* noop */ } }, [map]);
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
    const placeTheme = useTheme();
    const isDark = placeTheme.palette.mode === 'dark';
    const placeStyle = useMemo(() => ({
        color: alpha(placeTheme.palette.text.primary, isDark ? 0.20 : 0.12), weight: 1, fillOpacity: 0,
    }), [isDark, placeTheme]);
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
    const themeRef = useTheme();
    const maskRef = useRef(null);

    useEffect(() => {
        if (!map || maskRef.current) return;
        maskRef.current = createAlabamaMask(map, alabama, {
            fillColor: themeRef.palette.background.default,
            fillOpacity: 0.45,
            borderColor: alpha(themeRef.palette.text.primary, 0.10),
            weight: 2,
        });
    }, [map]); // eslint-disable-line react-hooks/exhaustive-deps

    return null;
};

const BoundsController = ({ bounds }) => {
    const map = useMap();
    useEffect(() => { try { map?.setMaxBounds?.(bounds); } catch { /* noop */ } }, [map, bounds]);
    return null;
};

/** Captures the Leaflet map instance into a ref */
const MapRefSetter = ({ mapRef }) => {
    const map = useMap();
    useEffect(() => {
        if (map) mapRef.current = map;
    }, [map, mapRef]);
    return null;
};

/**
 * isMapContainerReady – check actual DOM element dimensions.
 * Leaflet's map.getSize() returns STALE cached values; checking
 * the container element directly avoids NaN crashes from flyTo/panTo
 * when the drawer is still animating in or hidden via keepMounted.
 */
function isMapContainerReady(map) {
    try {
        const el = map.getContainer();
        return el && el.offsetWidth > 0 && el.offsetHeight > 0;
    } catch {
        return false;
    }
}

/**
 * Recenter – mirrors CommunityPage pattern:
 * - isMapContainerReady guard before any flyTo/panTo (prevents NaN crash)
 * - Retries up to 8× at 150ms with invalidateSize()
 * - Falls back to setView({ animate: false }) as last resort
 * - flyToBounds for statewide views (auto-fits any container aspect ratio)
 */
const Recenter = ({ center, zoomLevel, openedPopupId, markerPosition }) => {
    const map = useMap();
    const lastKeyRef = useRef(null);

    useEffect(() => {
        if (!map) return;
        if (!center?.length) return;

        const isStatewide = isStatewideCenter(center);
        const effectiveZoom = isStatewide ? DEFAULT_ZOOM : (zoomLevel ?? MARKER_CLICK_ZOOM);
        const effectiveCenter = isStatewide ? DEFAULT_CENTER : center;

        const posKey = markerPosition ? `${markerPosition[0].toFixed(5)},${markerPosition[1].toFixed(5)}` : '';
        const key = `${effectiveCenter[0].toFixed(5)},${effectiveCenter[1].toFixed(5)}|${effectiveZoom.toFixed(1)}|${posKey}`;

        if (lastKeyRef.current === key) return;
        lastKeyRef.current = key;

        let retries = 0;
        const maxRetries = 8;
        let retryTimer = null;

        const doRecenter = () => {
            if (!isMapContainerReady(map)) {
                if (retries < maxRetries) {
                    retries += 1;
                    try { map.invalidateSize({ animate: false }); } catch { /* noop */ }
                    retryTimer = setTimeout(doRecenter, 150);
                    return;
                }
                // Last resort: setView without animation (no NaN risk)
                try { map.setView(effectiveCenter, effectiveZoom, { animate: false }); } catch { /* noop */ }
                return;
            }

            try {
                if (isStatewide) {
                    map.flyToBounds(RAW_BOUNDS, { padding: [20, 12], maxZoom: DEFAULT_ZOOM });
                } else {
                    const currentZoom = map.getZoom();
                    const alreadyAtZoom = Math.abs(currentZoom - effectiveZoom) < 0.5;

                    if (openedPopupId && markerPosition) {
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
                }
            } catch { /* noop */ }
        };

        doRecenter();

        return () => { if (retryTimer) clearTimeout(retryTimer); };
    }, [map, center, zoomLevel, openedPopupId, markerPosition]);

    return null;
};

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

        if (lastPannedIdRef.current === String(openedPopupId)) return;

        let retries = 0;
        const maxRetries = 8;
        let retryTimer = null;

        const doPan = () => {
            if (!isMapContainerReady(map)) {
                if (retries < maxRetries) {
                    retries += 1;
                    try { map.invalidateSize({ animate: false }); } catch { /* noop */ }
                    retryTimer = setTimeout(doPan, 150);
                    return;
                }
                return; // give up — no NaN crash
            }
            try {
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
            } catch { /* noop */ }
        };

        const timeoutId = setTimeout(doPan, 500);
        return () => { clearTimeout(timeoutId); if (retryTimer) clearTimeout(retryTimer); };
    }, [map, openedPopupId, markerRefs]);

    return null;
};

/**
 * ZoomDismissOnZoomOut – close popup after user zooms out 2+ consecutive steps.
 * Mirrors MusicMapView exactly.
 */
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
                    try { map.closePopup(); } catch { /* noop */ }
                    const fn = onCloseRef.current;
                    if (typeof fn === "function") fn(opened);
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
   ServiceMapPopupCard — simple popup card
   ─────────────────────────────────────────── */
function ServiceMapPopupCard({ service, onSelectService }) {
    const svc = service || {};
    const title = toStr(svc.title) || "Untitled service";
    const streetAddress = toStr(svc.streetAddress || svc.street_address || "").trim();
    const city = toStr(svc.city || "").trim();
    const state = toStr(svc.state || "AL").trim();
    const zip = toStr(svc.zip || svc.zipCode || svc.zip_code || "").trim();
    const rawLocationLabel = toStr(svc.locationLabel || svc.location_label || "Alabama (Statewide)");
    const locationLabel = (() => {
        // If we have a street address, build a full marketplace-style address line
        if (streetAddress) {
            const parts = [streetAddress];
            if (city) parts.push(city);
            if (city && state) parts[parts.length - 1] = `${city}, ${state}`;
            else if (state) parts.push(state);
            if (zip) parts[parts.length - 1] = `${parts[parts.length - 1]} ${zip}`;
            return parts.join(", ");
        }
        // Fallback to original county/city label
        const lower = rawLocationLabel.toLowerCase().trim();
        if (!lower) return "Alabama (Statewide)";
        if (lower === "statewide" || lower === "alabama") return "Alabama (Statewide)";
        if (lower.includes("statewide")) return rawLocationLabel;
        if (rawLocationLabel.toLowerCase().includes("county")) return rawLocationLabel;
        const county = toStr(svc.county).trim();
        if (county && rawLocationLabel.endsWith(county)) {
            return rawLocationLabel.slice(0, -county.length) + county + " County";
        }
        return rawLocationLabel;
    })();
    const description = toStr(svc.description || svc.summary || "").trim();
    const providerName = toStr(svc.providerName || svc.provider_name || "Provider");
    const providerHandle = toStr(svc.providerHandle || svc.provider_handle || "");
    const providerAvatar = toStr(svc.providerAvatar || svc.provider_avatar || "");
    const serviceAvatar = toStr(svc.serviceAvatarUrl || svc.service_avatar_url || "");
    const displayAvatar = serviceAvatar || providerAvatar;
    const categorySlug = toStr(svc.categorySlug || svc.category_slug || "");
    const catInfo = categorySlug ? getServiceCategoryInfo(categorySlug) : null;
    const CatIcon = catInfo?.Icon || null;

    const [reportOpen, setReportOpen] = useState(false);
    const [copyLinkToast, setCopyLinkToast] = useState(false);
    const serviceId = svc.id || svc.service_id || null;

    const submitReport = async ({ reason, details }) => {
        try {
            await secureFetch("/api/services/" + serviceId + "/report", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason, details }),
            });
        } catch { /* noop */ }
    };

    return (
        <Box sx={{ width: "min(400px, 88vw)", maxWidth: "100%", cursor: "pointer", position: "relative" }}
             onClick={() => { if (document.querySelector('.MuiDialog-root, .MuiMenu-root, .MuiPopover-root')) return; if (typeof onSelectService === "function") onSelectService(svc); }}>


            <Box sx={{ p: 1.75, pb: 1.25 }}>
                {/* Avatar + Title + Category + Location */}
                <Box sx={{ display: "flex", gap: 1.5, pr: 3 }}>
                    <Avatar
                        src={displayAvatar || undefined}
                        alt={title}
                        sx={(t) => ({
                            width: 56, height: 56, borderRadius: "50%", flexShrink: 0, mt: 0.25,
                            border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.18),
                            bgcolor: alpha(t.palette.primary.main, 0.08),
                            color: "primary.main",
                        })}
                        imgProps={{ referrerPolicy: "no-referrer" }}
                    >
                        <PersonIcon sx={{ fontSize: 28 }} />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {/* Title */}
                        <Typography sx={{
                            fontWeight: 900, fontSize: 14.5, lineHeight: 1.25, mb: 0.4,
                            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                            overflowWrap: "anywhere", wordBreak: "break-word",
                        }}>
                            {title}
                        </Typography>

                        {/* Category chip */}
                        {catInfo && (
                            <Chip
                                size="small"
                                icon={CatIcon ? <CatIcon sx={{ fontSize: 12 }} /> : undefined}
                                label={catInfo.name}
                                sx={(t) => ({
                                    mb: 0.4, height: 20, fontSize: 9.5, fontWeight: 800,
                                    bgcolor: alpha(t.palette.primary.main, 0.1), color: "primary.main",
                                    "& .MuiChip-icon": { color: "primary.main", ml: 0.5 },
                                })}
                            />
                        )}

                        {/* Location — street address style (marketplace) */}
                        <Stack direction="row" spacing={0.5} alignItems="flex-start">
                            <LocationOnRoundedIcon sx={{ fontSize: 13, color: "primary.main", flexShrink: 0, mt: 0.15 }} />
                            <Typography sx={{
                                fontSize: 11, color: "primary.main", fontWeight: 700, lineHeight: 1.3,
                                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                                overflowWrap: "anywhere", wordBreak: "break-word",
                            }}>
                                {locationLabel}
                            </Typography>
                        </Stack>
                    </Box>
                </Box>

                {/* Description */}
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
                                    onClick={(e) => { e.stopPropagation(); onSelectService?.(svc); }}
                                >
                                    ...more
                                </Typography>
                            )}
                        </Typography>
                    );
                })() : null}

                {/* Provider row */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                    <Avatar src={providerAvatar || undefined} alt={providerName}
                            sx={(t) => ({ width: 26, height: 26, border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.18), bgcolor: alpha(t.palette.primary.main, 0.08) })}
                    >
                        {!providerAvatar ? <PersonIcon sx={{ fontSize: 14 }} /> : null}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 11, lineHeight: 1.2, color: (t) => alpha(t.palette.text.primary, 0.65) }} noWrap>
                            {providerName}
                        </Typography>
                        {providerHandle ? (
                            <Typography sx={{ fontSize: 9.5, opacity: 0.5, fontWeight: 700 }} noWrap>@{providerHandle}</Typography>
                        ) : null}
                    </Box>
                </Box>
            </Box>

            <ReportDialog
                open={reportOpen}
                onClose={() => setReportOpen(false)}
                onSubmit={submitReport}
                title="Report Service"
            />

            <Snackbar
                open={copyLinkToast}
                autoHideDuration={2000}
                onClose={() => setCopyLinkToast(false)}
                message="Link copied to clipboard"
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            />
        </Box>
    );
}

/* ───────────────────────────────────────────
   RequestMapPopupCard — popup card for requests
   Mirrors ServiceRequestCard layout: requester at top, title, chips, description, location.
   ─────────────────────────────────────────── */
function RequestMapPopupCard({ request, onSelectRequest, onEditRequest, onDeleteRequest, onReportRequest, user, activeAccount }) {
    const req = request || {};
    const title = toStr(req.title) || "Untitled request";
    const description = toStr(req.description || "").trim();
    const requesterName = toStr(req.requesterName || req.requester_name || "Someone");
    const requesterHandle = toStr(req.requesterHandle || req.requester_handle || "");
    const avatarUrl = toStr(req.requesterAvatar || req.requester_avatar || "");
    const categorySlug = toStr(req.categorySlug || req.category_slug || "");
    const catInfo = categorySlug ? getServiceCategoryInfo(categorySlug) : null;
    const CatIcon = catInfo?.Icon || null;
    const urgency = toStr(req.urgency || "flexible");
    const urgencyLabel = urgency === "asap" ? "ASAP" : urgency === "within_week" ? "This Week" : urgency === "within_month" ? "This Month" : "Flexible";
    const urgencyColor = urgency === "asap" ? "error" : urgency === "within_week" ? "warning" : urgency === "within_month" ? "info" : "default";
    const hasTimelineChip = urgency && urgency !== "flexible";
    const isFilled = req.status === "filled";

    const createdAt = req.createdAt || req.created_at || "";
    const timeAgo = (() => {
        const d = createdAt ? new Date(createdAt) : null;
        if (!d || Number.isNaN(d.valueOf())) return "";
        const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
        if (s < 60) return "1m ago";
        const m = Math.floor(s / 60);
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}hr ago`;
        const dy = Math.floor(h / 24);
        if (dy < 7) return `${dy}d ago`;
        const w = Math.floor(dy / 7);
        if (w < 5) return `${w}wk ago`;
        const mo = Math.floor(dy / 30);
        if (mo < 12) return `${mo}mo ago`;
        return `${Math.floor(dy / 365)}yr ago`;
    })();

    const rawLocationLabel = toStr(req.locationLabel || req.location_label || "");
    const locationLabel = (() => {
        if (req.isStatewide || req.is_statewide) return "Alabama (Statewide)";
        const lower = rawLocationLabel.toLowerCase().trim();
        if (!lower) {
            const parts = [req.city, req.county ? `${req.county} County` : ""].filter(Boolean);
            return parts.join(", ") || "Alabama (Statewide)";
        }
        if (lower === "statewide" || lower === "alabama") return "Alabama (Statewide)";
        return rawLocationLabel;
    })();

    const budgetDisplay = (() => {
        const hasMin = req.budgetMin != null && Number.isFinite(Number(req.budgetMin));
        const hasMax = req.budgetMax != null && Number.isFinite(Number(req.budgetMax));
        const suffix = req.budgetType === "hourly" ? "/hr" : "";
        if (hasMin && hasMax && Number(req.budgetMin) !== Number(req.budgetMax))
            return `$${Number(req.budgetMin).toLocaleString()}–$${Number(req.budgetMax).toLocaleString()}${suffix}`;
        if (hasMin) return `$${Number(req.budgetMin).toLocaleString()}${suffix}`;
        if (hasMax) return `Up to $${Number(req.budgetMax).toLocaleString()}${suffix}`;
        if (req.budgetNotes) return req.budgetNotes;
        return "";
    })();
    const hasBudgetChip = Boolean(budgetDisplay);

    const DESC_MAX = 100;
    const descTruncated = description.length > DESC_MAX;
    const descShown = descTruncated ? description.slice(0, DESC_MAX).trimEnd() : description;

    // Ownership check — must match the ACTIVE account, not just
    // the underlying user.  Personal account cannot edit/delete business/artist
    // requests and vice versa (matches ServiceRequestCard + ServiceRequestDetailPage).
    const isOwner = (() => {
        if (!user && !activeAccount) return false;
        if (typeof req.isRequester === "boolean") return req.isRequester;

        const viewerUserId = user?.id || user?.user_id;
        const acctType = String(activeAccount?.type || "personal").toLowerCase().trim();
        const acctId = activeAccount?.id || null;
        const isOnPersonalAccount = acctType === "personal" || (!activeAccount?.type);

        const reqOwnerType = String(
            req.requesterAccountType || req.requester_account_type ||
            req.requesterType || req.requester_type ||
            req.accountType || req.account_type || ""
        ).toLowerCase().trim() || "personal";

        const ownerBizId = req.requesterBusinessId || req.requester_business_id || null;
        const ownerArtId = req.requesterArtistId || req.requester_artist_id || null;
        const ownerUserId = req.requesterId || req.requester_id || req.requester_user_id || req.user_id || req.owner_id || null;

        // Business request → only match when active account IS that business
        if ((reqOwnerType === "business" || ownerBizId) && acctType === "business" && acctId && ownerBizId) {
            return String(acctId) === String(ownerBizId);
        }
        // Artist request → only match when active account IS that artist
        if ((reqOwnerType === "artist" || reqOwnerType === "music" || reqOwnerType === "music_artist" || ownerArtId)
            && (acctType === "artist" || acctType === "music") && acctId && ownerArtId) {
            return String(acctId) === String(ownerArtId);
        }
        // Personal request → only match when on personal account and user ID matches
        if (isOnPersonalAccount && viewerUserId && ownerUserId) {
            // Only match if the request itself is personal (not business/artist)
            if (reqOwnerType === "personal" || (!ownerBizId && !ownerArtId)) {
                return String(viewerUserId) === String(ownerUserId);
            }
        }
        return false;
    })();


    return (
        <Box sx={{ width: "min(400px, 88vw)", maxWidth: "100%", cursor: "pointer" }}
             onClick={() => { if (document.querySelector('.MuiDialog-root, .MuiMenu-root, .MuiPopover-root')) return; if (typeof onSelectRequest === "function") onSelectRequest(req); }}>
            <Box sx={{ p: 1.75, pb: 1.25 }}>
                {/* ── Requester row: avatar + name/handle/time ── */}
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 0.75 }}>
                    <Avatar
                        src={avatarUrl || undefined}
                        alt={requesterName}
                        sx={(t) => ({
                            width: 36, height: 36, flexShrink: 0,
                            border: "1.5px solid",
                            borderColor: alpha(t.palette.text.primary, 0.06),
                            bgcolor: alpha(t.palette.primary.main, 0.08),
                            color: "primary.main",
                        })}
                    >
                        {!avatarUrl ? <PersonIcon sx={{ fontSize: 17 }} /> : null}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={{ fontWeight: 750, fontSize: 14, lineHeight: 1.2, display: "block" }} noWrap>
                            {requesterName}
                        </Typography>
                        {requesterHandle && (
                            <Typography sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.3, display: "block" }} noWrap>
                                @{requesterHandle.replace(/^@/, "")}
                            </Typography>
                        )}
                        {timeAgo && (
                            <Typography sx={{ fontSize: 11, color: "text.secondary", lineHeight: 1.3, display: "block" }}>
                                {timeAgo}
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* ── Title ── */}
                <Typography sx={{
                    fontWeight: 800, fontSize: 14.5, lineHeight: 1.25, mb: 0.4,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    overflow: "hidden", wordBreak: "break-word",
                }}>
                    {title}
                </Typography>

                {/* ── Category chip — under title ── */}
                {catInfo && (
                    <Chip
                        size="small"
                        icon={CatIcon ? <CatIcon sx={{ fontSize: 12 }} /> : undefined}
                        label={catInfo.name}
                        sx={(t) => ({
                            height: 22, borderRadius: 999, fontWeight: 800, fontSize: 10,
                            mb: 0.5,
                            bgcolor: alpha(t.palette.primary.main, 0.08),
                            color: t.palette.primary.main,
                            border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.25),
                            "& .MuiChip-icon": { color: t.palette.primary.main, ml: 0.4 },
                            "& .MuiChip-label": { px: 0.75 },
                            maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis",
                        })}
                    />
                )}

                {/* ── Timeline & Budget chips ── */}
                {(hasTimelineChip || hasBudgetChip || isFilled) && (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mb: 0.5, rowGap: 0.5 }}>
                        {hasTimelineChip && (
                            <Chip
                                size="small"
                                icon={<ScheduleRoundedIcon sx={{ fontSize: 11 }} />}
                                label={urgencyLabel}
                                color={urgencyColor}
                                variant="outlined"
                                sx={{ height: 22, borderRadius: 999, fontWeight: 800, fontSize: 10,
                                    "& .MuiChip-label": { px: 0.6 }, "& .MuiChip-icon": { ml: 0.4 } }}
                            />
                        )}
                        {hasBudgetChip && (
                            <Chip
                                size="small"
                                label={budgetDisplay}
                                sx={(t) => ({
                                    height: 22, borderRadius: 999, fontWeight: 800, fontSize: 10,
                                    bgcolor: alpha(t.palette.success.main, 0.07),
                                    color: t.palette.success.dark,
                                    border: "1px solid", borderColor: alpha(t.palette.success.main, 0.22),
                                    "& .MuiChip-label": { px: 0.6 },
                                })}
                            />
                        )}
                        {isFilled && (
                            <Chip size="small" label="Filled" color="success"
                                  sx={{ height: 22, borderRadius: 999, fontWeight: 800, fontSize: 10 }} />
                        )}
                    </Stack>
                )}

                {/* ── Description ── */}
                {description && (
                    <Typography sx={{
                        mt: 0.5, fontSize: 12, lineHeight: 1.45,
                        color: "text.secondary",
                        display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
                        overflow: "hidden", wordBreak: "break-word",
                    }}>
                        {descShown}
                        {descTruncated && (
                            <Typography component="span" sx={{ fontSize: 12, fontWeight: 700, color: "primary.main" }}>
                                ...more
                            </Typography>
                        )}
                    </Typography>
                )}

                {/* ── Location (bottom) ── */}
                {locationLabel && (
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 1 }}>
                        <LocationOnRoundedIcon sx={{ fontSize: 13, color: "primary.main", flexShrink: 0 }} />
                        <Typography sx={{ fontSize: 11, color: "primary.main", fontWeight: 700 }} noWrap>
                            {locationLabel}
                        </Typography>
                    </Stack>
                )}
            </Box>
        </Box>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   ServicesMapTab
   ═══════════════════════════════════════════════════════════════════ */
// Hoisted outside the component so the default references are stable across renders.
const EMPTY_SERVICES = [];
const EMPTY_REQUESTS = [];

export default function ServicesMapTab({
                                           services = EMPTY_SERVICES, onSelectService, focusServiceId, onFocusServiceHandled, hoveredCardId,
                                           mode = "services", requests = EMPTY_REQUESTS, onSelectRequest, focusRequestId, onFocusRequestHandled,
                                           onEditRequest, onDeleteRequest, onReportRequest, user, activeAccount,
                                           center: centerProp, zoomLevel: zoomLevelProp,
                                       }) {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const tileUrl = isDarkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png';
    const tileUrlNoLabels = isDarkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png';

    const COUNTY_STYLE = useMemo(() => ({
        color: alpha(theme.palette.text.primary, isDarkMode ? 0.18 : 0.10),
        weight: 1,
        fillColor: alpha(theme.palette.text.primary, isDarkMode ? 0.06 : 0.04),
        fillOpacity: 1,
    }), [isDarkMode, theme]);

    const COUNTY_STYLE_SERVICES = useMemo(() => ({
        color: alpha(theme.palette.text.primary, isDarkMode ? 0.14 : 0.08),
        weight: 0.75,
        fillOpacity: 0,
    }), [isDarkMode, theme]);

    const STATE_BORDER_STYLE = useMemo(() => ({
        color: alpha(theme.palette.text.primary, isDarkMode ? 0.35 : 0.24),
        weight: 2.5,
        fillOpacity: 0,
    }), [isDarkMode, theme]);

    const cityList = useMemo(() => normalizeCityFeatures(alabamaCities), []);
    const mapRef = useRef(null);
    const markerRefs = useRef({});
    const [activeIdxByGroup, setActiveIdxByGroup] = useState({});
    const [openedPopupId, setOpenedPopupId] = useState(null);
    const [center, setCenter] = useState(centerProp || DEFAULT_CENTER);
    const [zoomLevel, setZoomLevel] = useState(zoomLevelProp || DEFAULT_ZOOM);

    // Sync parent-driven center/zoom (radius filter changes) into internal state
    useEffect(() => {
        if (centerProp) setCenter(centerProp);
    }, [centerProp]);
    useEffect(() => {
        if (zoomLevelProp != null) setZoomLevel(zoomLevelProp);
    }, [zoomLevelProp]);

    // Effective values: prefer parent props when available (ensures Recenter
    // always sees the latest radius-driven zoom even before useEffect fires)
    const effectiveCenter = centerProp || center;
    const effectiveZoom = zoomLevelProp != null ? zoomLevelProp : zoomLevel;
    const [hoveredMarkerIdLocal, setHoveredMarkerIdLocal] = useState(null);

    // Refs for hover bounce animation
    const animRef = useRef(null);
    const iconElRef = useRef(null);
    const lastOpenedKeyRef = useRef(null);

    const isReqMode = mode === "requests";
    const activeItems = isReqMode ? requests : services;

    // ── Stable refs for callback props ──
    // Using refs avoids putting these in useEffect dependency arrays,
    // which would cause effects to re-fire every render when parent
    // passes inline arrow functions (the root cause of the infinite loop).
    const onFocusServiceHandledRef = useRef(onFocusServiceHandled);
    const onFocusRequestHandledRef = useRef(onFocusRequestHandled);

    useEffect(() => { onFocusServiceHandledRef.current = onFocusServiceHandled; }, [onFocusServiceHandled]);
    useEffect(() => { onFocusRequestHandledRef.current = onFocusRequestHandled; }, [onFocusRequestHandled]);

    // Lookup of item id → item object
    const serviceById = useMemo(() => {
        const m = new Map();
        (Array.isArray(activeItems) ? activeItems : []).forEach((s) => {
            if (s?.id != null) m.set(String(s.id), s);
        });
        return m;
    }, [activeItems]);

    // Build list of items that have coordinates (mirrors MusicMapView artistsWithCoords)
    const itemsWithCoords = useMemo(() => {
        return (Array.isArray(activeItems) ? activeItems : []).filter((s) => {
            const lat = Number(s?.latitude);
            const lng = Number(s?.longitude);
            return Number.isFinite(lat) && Number.isFinite(lng);
        });
    }, [activeItems]);

    const unmappableCount = (Array.isArray(activeItems) ? activeItems.length : 0) - itemsWithCoords.length;

    // Count how many services have street-level precision
    const streetLevelCount = useMemo(() => {
        if (isReqMode) return 0;
        return (Array.isArray(services) ? services : []).filter(
            (s) => s?.streetAddress && Number.isFinite(Number(s?.latitude)) && Number.isFinite(Number(s?.longitude))
        ).length;
    }, [services, isReqMode]);

    // Group items by coordinate key (mirrors MusicMapView coordGroups)
    const coordGroups = useMemo(() => {
        const out = {};
        itemsWithCoords.forEach((s) => {
            const lat = Number(s.latitude);
            const lng = Number(s.longitude);
            const coordKey = `${lat.toFixed(6)}_${lng.toFixed(6)}`;
            const id = s.id;
            if (id == null) return;
            if (!out[coordKey]) out[coordKey] = { lat, lng, ids: [] };
            out[coordKey].ids.push(id);
        });
        return out;
    }, [itemsWithCoords]);

    const markerEntries = useMemo(() => {
        const entries = [];
        const currentZoom = mapRef?.current?.getZoom?.() ?? DEFAULT_ZOOM;
        Object.entries(coordGroups).forEach(([coordKey, group]) => {
            const position = offsetCoords([group.lat, group.lng], 0, 1, currentZoom);
            entries.push({ groupKey: coordKey, position, ids: group.ids });
        });
        return entries;
    }, [coordGroups]);

    // Lookup: id → groupKey + idx
    const idToGroupIndex = useMemo(() => {
        const m = new Map();
        markerEntries.forEach(({ groupKey, ids }) => {
            (ids || []).forEach((id, idx) => { m.set(String(id), { groupKey, idx }); });
        });
        return m;
    }, [markerEntries]);

    // Resolve the marker position for the currently opened popup
    const openedMarkerPosition = useMemo(() => {
        if (!openedPopupId) return null;
        const openedKey = String(openedPopupId);
        for (const { ids, position } of markerEntries) {
            for (const id of ids || []) {
                if (String(id) === openedKey) return position;
            }
        }
        return null;
    }, [openedPopupId, markerEntries]);

    // Keep active index synced when openedPopupId changes
    useEffect(() => {
        if (!openedPopupId) return;
        const info = idToGroupIndex.get(String(openedPopupId));
        if (!info) return;
        setActiveIdxByGroup((prev) => {
            if (prev?.[info.groupKey] === info.idx) return prev;
            return { ...prev, [info.groupKey]: info.idx };
        });
    }, [openedPopupId, idToGroupIndex]);

    // Open popup on the correct marker when openedPopupId changes
    useEffect(() => {
        if (!openedPopupId) { lastOpenedKeyRef.current = null; return; }
        if (lastOpenedKeyRef.current === String(openedPopupId)) return;
        const marker = markerRefs.current[String(openedPopupId)];
        if (!marker) return;
        try { marker.openPopup(); lastOpenedKeyRef.current = String(openedPopupId); } catch { /* noop */ }
    }, [openedPopupId, markerEntries]);

    // Merge card hover with map hover — card hover takes priority
    const effectiveHoveredId = hoveredCardId != null ? String(hoveredCardId) : hoveredMarkerIdLocal;

    // Hover bounce animation (mirrors MusicMapView)
    useEffect(() => {
        if (animRef.current) { try { animRef.current.cancel?.(); } catch { /* noop */ } animRef.current = null; }
        if (iconElRef.current) { try { iconElRef.current.style.transform = ""; } catch { /* noop */ } iconElRef.current = null; }

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
            if (animRef.current) { try { animRef.current.cancel?.(); } catch { /* noop */ } animRef.current = null; }
            if (iconElRef.current) { try { iconElRef.current.style.transform = ""; } catch { /* noop */ } iconElRef.current = null; }
        };
    }, [effectiveHoveredId]);

    // Handler: popup dismissed — only clear if closing popup matches current (mirrors MusicMapView)
    const handlePopupClose = (closingId) => {
        setOpenedPopupId((prev) => {
            if (closingId == null) return null;
            const closingStr = String(closingId);
            const prevStr = prev != null ? String(prev) : null;
            if (prevStr === closingStr) return null;
            return prev;
        });
    };

    // External focus: service location clicked → pan to marker and open popup
    // NOTE: onFocusServiceHandled is accessed via ref to avoid dependency-array churn.
    useEffect(() => {
        if (!focusServiceId) return;
        const idStr = String(focusServiceId);

        const focusedService = (services || []).find((s) => String(s?.id || "") === idStr);
        const isStw = Boolean(focusedService?.isStatewide || focusedService?.is_statewide) ||
            (!String(focusedService?.city || "").trim() && !String(focusedService?.county || "").trim());

        if (isStw) {
            setOpenedPopupId(null);
            setCenter(DEFAULT_CENTER);
            setZoomLevel(DEFAULT_ZOOM);
            if (typeof onFocusServiceHandledRef.current === "function") onFocusServiceHandledRef.current();
            return;
        }

        const info = idToGroupIndex.get(idStr);
        if (!info) {
            if (typeof onFocusServiceHandledRef.current === "function") onFocusServiceHandledRef.current();
            return;
        }
        setActiveIdxByGroup((prev) => ({ ...prev, [info.groupKey]: info.idx }));
        setOpenedPopupId(idStr);

        const entry = markerEntries.find((e) => e.groupKey === info.groupKey);
        if (entry) {
            const lat = entry.position[0];
            const lng = entry.position[1];
            setCenter([lat, lng]);
            setZoomLevel(MARKER_CLICK_ZOOM);
        }
        if (typeof onFocusServiceHandledRef.current === "function") onFocusServiceHandledRef.current();
    }, [focusServiceId, services, idToGroupIndex, markerEntries]);

    // External focus: request location clicked → pan to marker and open popup
    // NOTE: onFocusRequestHandled is accessed via ref to avoid dependency-array churn.
    useEffect(() => {
        if (!focusRequestId) return;
        const idStr = String(focusRequestId);

        const focusedReq = (requests || []).find((r) => String(r?.id || "") === idStr);
        const isStw = Boolean(focusedReq?.isStatewide || focusedReq?.is_statewide) ||
            (!String(focusedReq?.city || "").trim() && !String(focusedReq?.county || "").trim());

        if (isStw) {
            setOpenedPopupId(null);
            setCenter(DEFAULT_CENTER);
            setZoomLevel(DEFAULT_ZOOM);
            if (typeof onFocusRequestHandledRef.current === "function") onFocusRequestHandledRef.current();
            return;
        }

        const info = idToGroupIndex.get(idStr);
        if (!info) {
            if (typeof onFocusRequestHandledRef.current === "function") onFocusRequestHandledRef.current();
            return;
        }
        setActiveIdxByGroup((prev) => ({ ...prev, [info.groupKey]: info.idx }));
        setOpenedPopupId(idStr);

        const entry = markerEntries.find((e) => e.groupKey === info.groupKey);
        if (entry) {
            const lat = entry.position[0];
            const lng = entry.position[1];
            setCenter([lat, lng]);
            setZoomLevel(MARKER_CLICK_ZOOM);
        }
        if (typeof onFocusRequestHandledRef.current === "function") onFocusRequestHandledRef.current();
    }, [focusRequestId, requests, idToGroupIndex, markerEntries]);

    const maxBounds = useMemo(() => computeBoundsWithPad(RAW_BOUNDS, DEFAULT_BOUNDS_PAD), []);

    return (
        <MapErrorBoundary>
            <MapWrapper>
                {/* Approximate location chip + OSM attribution */}
                <Box sx={{ position: "absolute", bottom: unmappableCount > 0 ? 44 : 12, right: 12, zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5, pointerEvents: "none" }}>
                    <Chip
                        label={isReqMode
                            ? "Pins show approximate area (city/county)"
                            : streetLevelCount > 0 && streetLevelCount >= itemsWithCoords.length
                                ? "Pins show street-level location"
                                : streetLevelCount > 0
                                    ? "Some pins show street-level, others approximate area"
                                    : "Pins show approximate area (city/county)"
                        }
                        size="small"
                        icon={<RoomOutlinedIcon />}
                        sx={(t) => ({
                            backgroundColor: alpha(t.palette.background.paper, 0.78),
                            color: t.palette.text.secondary,
                            fontSize: 11, fontWeight: 600, height: 22, borderRadius: 999,
                            border: `1px solid ${alpha(t.palette.divider, 0.55)}`,
                            boxShadow: `0 8px 18px ${alpha(t.palette.mode === "dark" ? "#000" : t.palette.text.primary, t.palette.mode === "dark" ? 0.22 : 0.08)}`,
                            backdropFilter: "blur(6px)",
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
                            pointerEvents: "auto",
                            "&:hover": { color: t.palette.primary.main, textDecoration: "underline" },
                        })}
                    >
                        © OpenStreetMap contributors
                    </Typography>
                </Box>

                {/* Unmappable services note */}
                {unmappableCount > 0 && (
                    <Box sx={{
                        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 1000,
                        py: 0.75, px: 1.5, bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
                        borderTop: "1px solid", borderColor: "divider",
                    }}>
                        <Typography sx={{ fontSize: 11, color: "text.secondary", textAlign: "center", fontWeight: 600 }}>
                            {unmappableCount} {isReqMode ? "request" : "service"}{unmappableCount !== 1 ? "s" : ""} without a location pin {unmappableCount === 1 ? "is" : "are"} not shown
                        </Typography>
                    </Box>
                )}

                {/* Empty state */}
                {itemsWithCoords.length === 0 && (
                    <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 999, textAlign: "center", p: 3, pointerEvents: "none" }}>
                        <Box sx={(t) => ({
                            px: 3, py: 2.5, borderRadius: 2.5,
                            bgcolor: alpha(t.palette.background.paper, 0.92),
                            backdropFilter: "blur(8px)",
                            border: `1px solid ${t.palette.divider}`,
                            boxShadow: `0 8px 32px ${alpha(t.palette.mode === "dark" ? "#000" : t.palette.text.primary, t.palette.mode === "dark" ? 0.28 : 0.1)}`,
                        })}>
                            <LocationOnRoundedIcon sx={{ fontSize: 36, color: "text.disabled", mb: 1 }} />
                            <Typography sx={{ fontWeight: 700, fontSize: 14, color: "text.secondary" }}>
                                {isReqMode ? "No requests with location pins" : "No services with location pins"}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: "text.disabled", mt: 0.5 }}>
                                {isReqMode ? "Requests will appear here when people add location details" : "Services will appear here when providers add location details"}
                            </Typography>
                        </Box>
                    </Box>
                )}

                <div style={{ width: "100%", height: "100%" }}>
                    <MapContainer
                        center={DEFAULT_CENTER}
                        zoom={DEFAULT_ZOOM}
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
                        style={{ width: "100%", height: "100%" }}
                    >
                        <RemovePrefix />
                        <MapRefSetter mapRef={mapRef} />
                        <BoundsController bounds={maxBounds} />
                        <MaskController />

                        <Recenter
                            center={effectiveCenter}
                            zoomLevel={effectiveZoom}
                            openedPopupId={openedPopupId}
                            markerPosition={openedMarkerPosition}
                        />

                        <PanOnPopupOpen
                            openedPopupId={openedPopupId}
                            markerRefs={markerRefs}
                        />

                        <ZoomDismissOnZoomOut
                            openedPopupId={openedPopupId}
                            onPopupClose={handlePopupClose}
                        />

                        {/* Services tab → OSM tiles (street names built-in);
                        Requests tab → CartoDB Voyager nolabels + custom overlays */}
                        {isReqMode ? (
                            <TileLayer
                                key={`tile-${isDarkMode ? 'dark' : 'light'}-nolabel`}
                                url={tileUrlNoLabels}
                            />
                        ) : (
                            <TileLayer
                                key={`tile-${isDarkMode ? 'dark' : 'light'}`}
                                url={tileUrl}
                            />
                        )}

                        <GeoJSON
                            key={`counties-${isReqMode ? 'req' : 'svc'}-${isDarkMode ? 'd' : 'l'}`}
                            data={alabamaCounties}
                            onEachFeature={isReqMode ? COUNTY_ON_EACH_FEATURE : undefined}
                            style={isReqMode ? COUNTY_STYLE : COUNTY_STYLE_SERVICES}
                        />

                        <GeoJSON
                            key={`al-border-${isDarkMode ? 'd' : 'l'}`}
                            data={alabama}
                            style={STATE_BORDER_STYLE}
                        />

                        {/* Places outlines + city text labels only for requests
                        (OSM tiles already have labels for services) */}
                        {isReqMode && <PlacesOutlines data={alabamaPlaces} minZoom={9} />}
                        {isReqMode && <CityLabels cities={cityList} minZoom={9} />}

                        {/* Service / Request markers */}
                        {markerEntries.map(({ groupKey, position, ids }) => {
                            const idx = activeIdxByGroup[groupKey] ?? 0;
                            const activeId = ids?.[idx];
                            const activeKey = activeId != null ? String(activeId) : null;
                            const isOpen = openedPopupId != null && activeKey != null && String(openedPopupId) === activeKey;
                            const hasStack = ids.length > 1;

                            const isHovered = activeKey != null && effectiveHoveredId != null && String(effectiveHoveredId) === activeKey;
                            const isSelected = isOpen;
                            const icon = (isHovered || isSelected)
                                ? (isReqMode ? requestDivIconGold : serviceDivIconGold)
                                : (isReqMode ? requestDivIcon : serviceDivIcon);
                            const activeService = activeKey ? serviceById.get(activeKey) : null;

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
                                        click: () => {
                                            if (activeId == null) return;
                                            setActiveIdxByGroup((p) => ({ ...p, [groupKey]: idx }));
                                            setOpenedPopupId(activeKey);
                                            setHoveredMarkerIdLocal(null);

                                            const lat = position[0];
                                            const lng = position[1];
                                            setCenter([lat, lng]);
                                            setZoomLevel(MARKER_CLICK_ZOOM);
                                        },
                                    }}
                                >
                                    {isOpen && (
                                        <Popup
                                            closeButton
                                            closeOnClick={false}
                                            autoPan={false}
                                            onClose={() => { handlePopupClose(activeKey); }}
                                        >
                                            <Box sx={{ width: "min(420px, calc(100vw - 40px))", maxWidth: "100%" }}>
                                                {/* Crossfade wrapper — smoothly transitions content when cycling */}
                                                <Box
                                                    key={`content-${activeKey}`}
                                                    className="ll-map-popup-content"
                                                    sx={{
                                                        p: 0,
                                                        animation: hasStack ? "popupCardFadeIn 220ms cubic-bezier(.2,.8,.2,1) both" : "none",
                                                        "@keyframes popupCardFadeIn": {
                                                            "0%": { opacity: 0, transform: "translateY(4px)" },
                                                            "100%": { opacity: 1, transform: "translateY(0)" },
                                                        },
                                                    }}
                                                >
                                                    {isReqMode ? (
                                                        <RequestMapPopupCard
                                                            request={activeService}
                                                            onSelectRequest={onSelectRequest}
                                                            onEditRequest={onEditRequest}
                                                            onDeleteRequest={onDeleteRequest}
                                                            onReportRequest={onReportRequest}
                                                            user={user}
                                                            activeAccount={activeAccount}
                                                        />
                                                    ) : (
                                                        <ServiceMapPopupCard
                                                            service={activeService}
                                                            onSelectService={onSelectService}
                                                        />
                                                    )}
                                                </Box>

                                                {hasStack && (
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 1,
                                                            px: 1.25,
                                                            py: 1,
                                                            borderTop: "1px solid",
                                                            borderColor: "divider",
                                                            bgcolor: "background.paper",
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
                                                                border: "1px solid",
                                                                borderColor: "divider",
                                                                bgcolor: "background.paper",
                                                                boxShadow: (t) => `0 6px 14px ${alpha(t.palette.mode === "dark" ? "#000" : t.palette.text.primary, t.palette.mode === "dark" ? 0.28 : 0.1)}`,
                                                            }}
                                                        >
                                                            <ChevronLeftRoundedIcon fontSize="small" />
                                                        </IconButton>

                                                        <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
                                                            <Chip
                                                                size="small"
                                                                label={`${idx + 1}/${ids.length}`}
                                                                sx={(t) => ({
                                                                    fontWeight: 800,
                                                                    borderRadius: 999,
                                                                    bgcolor: alpha(t.palette.info.main, 0.10),
                                                                    border: "1px solid",
                                                                    borderColor: alpha(t.palette.info.main, 0.25),
                                                                })}
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
                                                                border: "1px solid",
                                                                borderColor: "divider",
                                                                bgcolor: "background.paper",
                                                                boxShadow: (t) => `0 6px 14px ${alpha(t.palette.mode === "dark" ? "#000" : t.palette.text.primary, t.palette.mode === "dark" ? 0.28 : 0.1)}`,
                                                            }}
                                                        >
                                                            <ChevronRightRoundedIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                )}
                                            </Box>
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

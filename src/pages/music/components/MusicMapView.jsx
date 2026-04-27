// src/pages/music/components/MusicMapView.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import MapErrorBoundary from "../../../components/MapErrorBoundary";
import { secureFetch } from "../../../utils/secureFetch";
import { Avatar, Box, Chip, IconButton, Typography } from "@mui/material";
import VerifiedIcon from "@mui/icons-material/Verified";
import { alpha, styled, useTheme } from "@mui/material/styles";
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../../../components/MapView.css";

import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import RoomOutlinedIcon from "@mui/icons-material/RoomOutlined";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import { getCategoryIcon, isVisualArtistProfile } from "../utils/artistCategoryIcons";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import HeadphonesRoundedIcon from "@mui/icons-material/HeadphonesRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import PianoRoundedIcon from "@mui/icons-material/PianoRounded";
import RadioRoundedIcon from "@mui/icons-material/RadioRounded";
import AlbumRoundedIcon from "@mui/icons-material/AlbumRounded";
import NightlifeRoundedIcon from "@mui/icons-material/NightlifeRounded";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import WavesRoundedIcon from "@mui/icons-material/WavesRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import RecordVoiceOverRoundedIcon from "@mui/icons-material/RecordVoiceOverRounded";
import SelfImprovementRoundedIcon from "@mui/icons-material/SelfImprovementRounded";
import TheaterComedyRoundedIcon from "@mui/icons-material/TheaterComedyRounded";
import NaturePeopleRoundedIcon from "@mui/icons-material/NaturePeopleRounded";
import WhatshotRoundedIcon from "@mui/icons-material/WhatshotRounded";
import QueueMusicRoundedIcon from "@mui/icons-material/QueueMusicRounded";
import LibraryMusicRoundedIcon from "@mui/icons-material/LibraryMusicRounded";

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
    offsetCoords,
    MARKER_CLICK_ZOOM,
    FLY_TO_DURATION,
    PAN_TO_DURATION,
    DEFAULT_BOUNDS_PAD,
    RECENTER_OFFSET_PX,
    isStatewideCenter,
    getNorthPanTarget,
    computeBoundsWithPad,
    createAlabamaMask,
} from "../../../utils/MapUtils";

import { BRAND } from "../../../themes";

const API_BASE = (() => {
    const raw = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
    return raw ? `${raw}/api` : "/api";
})();

function getArtistId(artist) {
    if (!artist) return null;
    const raw = artist.id ?? artist.artist_id ?? null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
}

async function fetchFollowCounts(artistId) {
    if (!artistId) return { followers: 0, following: 0 };
    try {
        const res = await secureFetch(`${API_BASE}/follows/counts/artist/${artistId}`, {
            credentials: "include",
        });
        if (!res.ok) return { followers: 0, following: 0 };
        const data = await res.json();
        return {
            followers: Number(data?.followers) || 0,
            following: Number(data?.following) || 0,
        };
    } catch {
        return { followers: 0, following: 0 };
    }
}

/* ── SVG-based music markers (themed, no PNGs) ── */

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

const MUSIC_ICON_PATH = 'M12 3v9.28a4.39 4.39 0 0 0-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z';
const musicDivIcon = makeSvgDivIcon(buildMarkerSvg(MUSIC_ICON_PATH, BRAND_NAVY, BRAND_NAVY_DARK, BRAND_NAVY), "music-div-icon");
const musicDivIconGold = makeSvgDivIcon(buildMarkerSvg(MUSIC_ICON_PATH, BRAND_CRIMSON, BRAND_CRIMSON_D, BRAND_CRIMSON), "music-div-icon");

/* Visual artist marker icon (PaletteRounded — matches the palette icon used
   across the app for profile_type='artist' rows). Kept alongside the music
   marker so each pin reflects the artist's sub-type at a glance. */
const ARTIST_ICON_PATH = 'M12 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.04 10 9c0 3.31-2.69 6-6 6h-1.77c-.28 0-.5.22-.5.5 0 .12.05.23.13.33.41.47.64 1.06.64 1.67A2.5 2.5 0 0 1 12 22zm-5.5-9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm3-4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm3 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z';
const artistDivIcon = makeSvgDivIcon(buildMarkerSvg(ARTIST_ICON_PATH, BRAND_NAVY, BRAND_NAVY_DARK, BRAND_NAVY), "artist-div-icon");
const artistDivIconGold = makeSvgDivIcon(buildMarkerSvg(ARTIST_ICON_PATH, BRAND_CRIMSON, BRAND_CRIMSON_D, BRAND_CRIMSON), "artist-div-icon");

/* Post marker icon (ForumRounded — matches Posts tab icon) */
const POST_ICON_PATH = 'M20 6h-1v8c0 .55-.45 1-1 1H6v1c0 1.1.9 2 2 2h10l4 4V8c0-1.1-.9-2-2-2zm-3 5V4c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v13l4-4h9c1.1 0 2-.9 2-2z';
const postDivIcon = makeSvgDivIcon(buildMarkerSvg(POST_ICON_PATH, BRAND_NAVY, BRAND_NAVY_DARK, BRAND_NAVY), "post-div-icon");
const postDivIconGold = makeSvgDivIcon(buildMarkerSvg(POST_ICON_PATH, BRAND_CRIMSON, BRAND_CRIMSON_D, BRAND_CRIMSON), "post-div-icon");

/* ── Map constants ── */

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

/* ── Styled wrapper (matches JobsMapView exactly) ── */
const MapWrapper = styled(Box)(({ theme: t }) => ({
    position: "relative",
    width: "100%",
    height: "100%",
    // On mobile, ensure the map fills the screen edge-to-edge (no parent padding/margin gaps)
    [t.breakpoints.down('sm')]: {
        margin: 0,
        padding: 0,
        borderRadius: 0,
        overflow: "hidden",
    },
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

/* ── Map-internal helpers ── */
const RemovePrefix = () => {
    const map = useMap();
    useEffect(() => {
        try { map?.attributionControl?.setPrefix?.(""); } catch { /* noop */ }
    }, [map]);
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
const Recenter = ({ center, zoomLevel, openedArtistId, markerPosition }) => {
    const map = useMap();
    const lastKeyRef = useRef(null);

    useEffect(() => {
        if (!map) return;
        if (!center?.length) return;

        const isStatewide = isStatewideCenter(center);
        const effectiveZoom = isStatewide ? DEFAULT_ZOOM : (zoomLevel ?? MARKER_CLICK_ZOOM);
        const effectiveCenter = isStatewide ? DEFAULT_CENTER : center;

        // Use marker position in the key (not openedArtistId) so that cycling
        // through stacked items at the SAME coordinate does not re-trigger flyTo.
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
                try {
                    if (isStatewide) {
                        map.setView(effectiveCenter, effectiveZoom, { animate: false });
                    } else {
                        map.setView(effectiveCenter, effectiveZoom, { animate: false });
                    }
                } catch { /* noop */ }
                return;
            }

            try {
                if (isStatewide) {
                    // flyToBounds auto-calculates zoom for any container dimensions
                    map.flyToBounds(RAW_BOUNDS, { padding: [20, 12], maxZoom: DEFAULT_ZOOM });
                } else {
                    const currentZoom = map.getZoom();
                    const alreadyAtZoom = Math.abs(currentZoom - effectiveZoom) < 0.5;

                    if (openedArtistId && markerPosition) {
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
    }, [map, center, zoomLevel, openedArtistId, markerPosition]);

    return null;
};

const PanOnPopupOpen = ({ openedArtistId, markerRefs }) => {
    const map = useMap();
    const lastPannedIdRef = useRef(null);
    const lastPannedPosRef = useRef(null);

    useEffect(() => {
        if (!map || !openedArtistId) { lastPannedIdRef.current = null; lastPannedPosRef.current = null; return; }
        if (lastPannedIdRef.current === String(openedArtistId)) return;
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
                const marker = markerRefs?.current?.[String(openedArtistId)];
                if (!marker) return;
                const latlng = marker.getLatLng();
                if (!latlng) return;
                // Skip pan if the position is effectively the same (cycling within a group)
                const prev = lastPannedPosRef.current;
                if (prev && Math.abs(prev.lat - latlng.lat) < 0.00001 && Math.abs(prev.lng - latlng.lng) < 0.00001) {
                    lastPannedIdRef.current = String(openedArtistId);
                    return;
                }
                const panTarget = getNorthPanTarget(map, latlng, RECENTER_OFFSET_PX);
                map.panTo(panTarget, { animate: true, duration: PAN_TO_DURATION });
                lastPannedIdRef.current = String(openedArtistId);
                lastPannedPosRef.current = latlng;
            } catch {}
        };

        const timeoutId = setTimeout(doPan, 500);
        return () => { clearTimeout(timeoutId); if (retryTimer) clearTimeout(retryTimer); };
    }, [map, openedArtistId, markerRefs]);
    return null;
};

/**
 * ZoomDismissOnZoomOut – close popup after user zooms out 2+ consecutive steps.
 * Mirrors JobsMapView exactly.
 */
const ZoomDismissOnZoomOut = ({ openedArtistId, onPopupClose, maxZoomOutSteps = 2 }) => {
    const map = useMap();

    const openedIdRef = useRef(null);
    const lastZoomRef = useRef(null);
    const zoomOutStepsRef = useRef(0);
    const onCloseRef = useRef(onPopupClose);

    useEffect(() => {
        onCloseRef.current = onPopupClose;
    }, [onPopupClose]);

    useEffect(() => {
        const opened = openedArtistId != null ? String(openedArtistId) : null;
        openedIdRef.current = opened;
        zoomOutStepsRef.current = 0;
        try { lastZoomRef.current = map?.getZoom?.(); } catch { lastZoomRef.current = null; }
    }, [openedArtistId, map]);

    useEffect(() => {
        if (!map) return undefined;

        const handleZoomEnd = () => {
            const opened = openedIdRef.current;
            let newZoom = null;
            try { newZoom = map.getZoom(); } catch { newZoom = null; }

            const lastZoom = lastZoomRef.current;

            if (!opened) {
                lastZoomRef.current = newZoom;
                return;
            }

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

/* ── Genre icon lookup (matches MusicFilterBar / ArtistDetailPanel) ── */
function getGenreIcon(genre) {
    const g = String(genre || "").toLowerCase().trim();
    if (g.includes("rock") || g.includes("metal") || g.includes("punk") || g.includes("grunge")) return BoltRoundedIcon;
    if (g.includes("pop")) return StarRoundedIcon;
    if (g.includes("hip") || g.includes("hop") || g.includes("rap")) return MicRoundedIcon;
    if (g.includes("r&b") || g.includes("rnb") || g.includes("soul") || g.includes("motown")) return FavoriteRoundedIcon;
    if (g.includes("country") || g.includes("folk") || g.includes("bluegrass") || g.includes("americana")) return NaturePeopleRoundedIcon;
    if (g.includes("jazz") || g.includes("classical") || g.includes("orchestra") || g.includes("symphony")) return PianoRoundedIcon;
    if (g.includes("electronic") || g.includes("edm") || g.includes("techno") || g.includes("house") || g.includes("trance")) return HeadphonesRoundedIcon;
    if (g.includes("blues")) return WavesRoundedIcon;
    if (g.includes("reggae") || g.includes("ska") || g.includes("dub")) return SelfImprovementRoundedIcon;
    if (g.includes("indie") || g.includes("alternative") || g.includes("alt")) return AlbumRoundedIcon;
    if (g.includes("latin") || g.includes("salsa") || g.includes("reggaeton") || g.includes("bachata")) return CelebrationRoundedIcon;
    if (g.includes("gospel") || g.includes("christian") || g.includes("worship") || g.includes("spiritual")) return FavoriteRoundedIcon;
    if (g.includes("dance") || g.includes("disco") || g.includes("club")) return NightlifeRoundedIcon;
    if (g.includes("acapella") || g.includes("a capella") || g.includes("vocal")) return RecordVoiceOverRoundedIcon;
    if (g.includes("bollywood") || g.includes("indian") || g.includes("desi")) return TheaterComedyRoundedIcon;
    if (g.includes("funk")) return GraphicEqRoundedIcon;
    if (g.includes("world") || g.includes("african") || g.includes("caribbean")) return RadioRoundedIcon;
    if (g.includes("experimental") || g.includes("ambient") || g.includes("noise")) return GraphicEqRoundedIcon;
    if (g.includes("hot") || g.includes("fire") || g.includes("trending")) return WhatshotRoundedIcon;
    if (g.includes("soundtrack") || g.includes("score") || g.includes("film")) return QueueMusicRoundedIcon;
    if (g.includes("new age") || g.includes("meditation") || g.includes("relaxation")) return SelfImprovementRoundedIcon;
    if (g.includes("opera")) return LibraryMusicRoundedIcon;
    return MusicNoteRoundedIcon;
}

/* ── Inline popup card (mirrors JobsMapView popup card structure) ── */
function safeStr(v) {
    return typeof v === "string" ? v : v == null ? "" : String(v);
}

function ArtistPopupCard({ artist, onOpenArtist }) {
    const a = artist || {};
    const name = safeStr(a.name).trim() || "Artist";
    const handle = safeStr(a.handle).trim().replace(/^@/, "");
    const bio = safeStr(a.bio).trim();

    // Branch the popup card on profile_type so visual artists get the palette
    // avatar fallback + art-category chip icons, musicians get the music-note
    // fallback + genre icons. Uses the shared helper already consumed by
    // ArtistCard and ArtistsFilter for consistency.
    const isVisualArtist = isVisualArtistProfile(a);
    const DefaultAvatarIcon = isVisualArtist ? PaletteRoundedIcon : MusicNoteRoundedIcon;
    const chipIconResolver = isVisualArtist ? getCategoryIcon : getGenreIcon;

    const city = safeStr(a.city).trim();
    const countyRaw = safeStr(a.county).trim();
    const countyLabel = countyRaw ? countyRaw.replace(/\s+County$/i, "").trim() : "";
    const locationLabel = city && countyLabel ? `${city}, ${countyLabel} County` : city || (countyLabel ? `${countyLabel} County` : "") || "";

    const rawGenres = (() => {
        if (Array.isArray(a.genres) && a.genres.length > 0) return a.genres;
        const gj = a.genres_json || a.genresJson;
        if (Array.isArray(gj)) return gj;
        if (typeof gj === "string" && gj.trim()) {
            try { return JSON.parse(gj); } catch { return []; }
        }
        return [];
    })();
    const genres = rawGenres.map((g) => safeStr(g).trim()).filter(Boolean);
    const shownGenres = genres.slice(0, 3);
    const extraGenresCount = Math.max(0, genres.length - shownGenres.length);

    const fallbackFollowersCount = (() => {
        const v = Number(a.followers_count ?? a.followersCount ?? a.followers);
        return Number.isFinite(v) && v >= 0 ? v : 0;
    })();
    const fallbackFollowingCount = (() => {
        const v = Number(a.following_count ?? a.followingCount ?? a.following);
        return Number.isFinite(v) && v >= 0 ? v : 0;
    })();
    const artistId = getArtistId(a);
    const [followCounts, setFollowCounts] = useState({
        followers: fallbackFollowersCount,
        following: fallbackFollowingCount,
    });

    useEffect(() => {
        let cancelled = false;
        setFollowCounts({
            followers: fallbackFollowersCount,
            following: fallbackFollowingCount,
        });

        if (!artistId) return () => {
            cancelled = true;
        };

        fetchFollowCounts(artistId).then((counts) => {
            if (!cancelled) setFollowCounts(counts);
        });

        return () => {
            cancelled = true;
        };
    }, [artistId, fallbackFollowersCount, fallbackFollowingCount]);

    const avatarSrc =
        safeStr(a.avatar_url).trim() ||
        safeStr(a.avatarUrl).trim() ||
        "";

    const coverSrc =
        safeStr(a.cover_url).trim() ||
        safeStr(a.coverUrl).trim() ||
        "";

    const initials = safeStr(name).split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).filter(Boolean).join("") || "♪";

    const handleClick = () => {
        if (typeof onOpenArtist === "function") onOpenArtist(a);
    };

    const isOwner = false;

    const genreChipSx = (t) => ({
        fontWeight: 900,
        borderRadius: 999,
        height: 24,
        fontSize: 11.5,
        bgcolor: alpha(t.palette.primary.main, 0.08),
        color: t.palette.text.primary,
        border: `1px solid ${alpha(t.palette.primary.main, 0.16)}`,
        "& .MuiChip-icon": { color: t.palette.primary.main },
    });

    return (
        <Box
            onClick={handleClick}
            sx={{
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                width: { xs: "min(340px, calc(100vw - 48px))", sm: 420 },
                minHeight: { xs: 260, sm: 300 },
                overflow: "hidden",
                position: "relative",
                "&:hover": {},
                transition: (t) => `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
            }}
        >


            {/* Cover photo banner — mr leaves room for X button */}
            {coverSrc ? (
                <Box
                    sx={(t) => ({
                        width: "100%",
                        height: 120,
                        overflow: "hidden",
                        position: "relative",
                        bgcolor: alpha(t.palette.primary.main, 0.06),
                        flexShrink: 0,
                        mr: "38px",
                    })}
                >
                    <Box
                        component="img"
                        src={coverSrc}
                        alt=""
                        sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 0,
                            background: (t) => `linear-gradient(to bottom, ${alpha(t.palette.text.primary, 0)} 40%, ${alpha(t.palette.text.primary, 0.25)} 100%)`,
                        }}
                    />
                </Box>
            ) : null}

            {/* Profile section — outer box pulls up into cover when present */}
            <Box
                sx={{
                    px: 2,
                    mt: coverSrc ? "-28px" : 0,
                    pt: coverSrc ? 0 : 1.75,
                    position: "relative",
                    zIndex: 2,
                }}
            >
                {/* Horizontal row: avatar + info */}
                <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1.25 }}>
                    {/* Avatar */}
                    <Avatar
                        src={avatarSrc || undefined}
                        alt={name}
                        sx={(t) => ({
                            width: 56,
                            height: 56,
                            flexShrink: 0,
                            border: `3px solid ${t.palette.background.paper}`,
                            bgcolor: alpha(t.palette.primary.main, 0.08),
                            color: t.palette.primary.main,
                            boxShadow: `0 2px 8px ${alpha(t.palette.mode === "dark" ? "#000" : t.palette.text.primary, t.palette.mode === "dark" ? 0.34 : 0.12)}`,
                            '& .MuiAvatar-img': { objectFit: 'cover', transform: 'scale(1.15)' },
                        })}
                        imgProps={{ referrerPolicy: "no-referrer" }}
                    >
                        <DefaultAvatarIcon sx={{ fontSize: 26 }} />
                    </Avatar>

                    {/* Info column */}
                    <Box sx={{ minWidth: 0, flex: 1, pt: coverSrc ? "28px" : 0, pb: 0.25 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
                            <Typography
                                noWrap
                                sx={{ fontWeight: 880, fontSize: "1.0rem", lineHeight: 1.3, color: "text.primary", minWidth: 0 }}
                            >
                                {name}
                            </Typography>
                            {Boolean(a.isVerified ?? a.is_verified) ? (
                                <VerifiedIcon sx={{ fontSize: 18, color: "info.main", flexShrink: 0 }} />
                            ) : null}
                        </Box>

                        {handle ? (
                            <Typography
                                noWrap
                                sx={{ fontWeight: 700, fontSize: "0.74rem", color: "text.secondary", mt: 0.1 }}
                            >
                                @{handle}
                            </Typography>
                        ) : null}
                    </Box>
                </Box>

                {/* Stats row — below avatar row */}
                <Box sx={{ mt: 0.5, display: "flex", alignItems: "baseline", gap: 1.1, flexWrap: "wrap" }}>
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.35 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.78rem", color: "text.primary" }}>
                            {followCounts.followers}
                        </Typography>
                        <Typography sx={{ color: "text.secondary", fontSize: "0.73rem" }}>
                            {(followCounts.followers || 0) === 1 ? "Follower" : "Followers"}
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.35 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.78rem", color: "text.primary" }}>
                            {followCounts.following}
                        </Typography>
                        <Typography sx={{ color: "text.secondary", fontSize: "0.73rem" }}>
                            Following
                        </Typography>
                    </Box>
                </Box>

                {/* Genre chips */}
                {shownGenres.length > 0 && (
                    <Box sx={{ mt: 0.75, display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
                        {shownGenres.map((g, i) => {
                            const GenreIcon = chipIconResolver(g);
                            return (
                                <Chip
                                    key={`${g}-${i}`}
                                    size="small"
                                    icon={<GenreIcon sx={{ fontSize: 14 }} />}
                                    label={g}
                                    sx={genreChipSx}
                                />
                            );
                        })}
                        {extraGenresCount > 0 ? (
                            <Chip
                                size="small"
                                label={`+${extraGenresCount}`}
                                sx={(t) => ({
                                    ...genreChipSx(t),
                                    bgcolor: alpha(t.palette.text.primary, 0.06),
                                    borderColor: alpha(t.palette.text.primary, 0.12),
                                })}
                            />
                        ) : null}
                    </Box>
                )}
            </Box>

            {/* Bio with inline "...more" */}
            {bio ? (
                <Box sx={{ px: 2, pt: 0.75 }}>
                    <Typography
                        component="div"
                        sx={(t) => ({
                            color: alpha(t.palette.text.primary, 0.72),
                            fontSize: 13,
                            lineHeight: 1.45,
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                        })}
                    >
                        {bio.length > 180 ? bio.slice(0, 180).trimEnd() : bio}
                        {bio.length > 180 ? (
                            <Typography
                                component="span"
                                sx={(t) => ({
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: t.palette.primary.main,
                                    cursor: "pointer",
                                    "&:hover": { textDecoration: "underline" },
                                })}
                            >
                                ...more
                            </Typography>
                        ) : null}
                    </Typography>
                </Box>
            ) : null}

            {/* Footer row: location — pinned to bottom (matches JobsMapView) */}
            <Box sx={{
                px: 2, pt: 0.6, pb: 1.5, mt: "auto",
                display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1,
            }}>
                {locationLabel ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, flexShrink: 0 }}>
                        <LocationOnRoundedIcon sx={{ fontSize: 14, color: "primary.main" }} />
                        <Typography noWrap sx={{ fontWeight: 700, fontSize: "0.73rem", color: "primary.main", maxWidth: { xs: 160, sm: 180 } }}>
                            {locationLabel}
                        </Typography>
                    </Box>
                ) : null}
            </Box>
        </Box>
    );
}

/* ════════════════════════════════════════════
   PostPopupCard — popup card for music posts (matches BusinessMapPopupCard format)
   ════════════════════════════════════════════ */
function PostPopupCard({ post, onOpenPost }) {
    const p = post || {};
    const title = safeStr(p.title).trim() || "Untitled post";
    const body = safeStr(p.description || p.body || p.content).trim();
    // Shorter truncation on mobile to prevent overflow
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;
    const truncLimit = isMobile ? 60 : 90;
    const truncatedBody = body.length > truncLimit ? `${body.slice(0, truncLimit).trimEnd()}` : body;
    const hasMore = body.length > truncLimit;

    const actorName = safeStr(p.artist_name || p.artistName || p.name).trim() || "Artist";
    const actorHandle = safeStr(p.artist_handle || p.artistHandle || p.handle).trim().replace(/^@/, "");
    const avatarSrc = safeStr(p.artist_avatar_url || p.artistAvatarUrl || p.avatar_url).trim() || "";
    const [avatarError, setAvatarError] = useState(false);

    const city = safeStr(p.city).trim();
    const countyRaw = safeStr(p.county).trim();
    const countyLabel = countyRaw
        ? (countyRaw.toLowerCase().includes("county") ? countyRaw : `${countyRaw} County`)
        : "";
    const locationStr = [city, countyLabel].filter(Boolean).join(", ");

    const rawGenres = (() => {
        if (Array.isArray(p.artistGenres)) return p.artistGenres;
        if (Array.isArray(p.genres)) return p.genres;
        return [];
    })();
    const genres = rawGenres.map((g) => safeStr(g).trim()).filter(Boolean).slice(0, 2);

    return (
        <Box sx={{
            width: { xs: "min(340px, calc(100vw - 48px))", sm: "min(400px, 88vw)" },
            maxWidth: "100%",
        }}>
            <Box
                sx={{ cursor: "pointer", "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.08 : 0.02) } }}
                onClick={(e) => { e.stopPropagation(); onOpenPost?.(p); }}
            >
                <Box sx={{ p: 1.75, pb: { xs: 1.75, sm: 1.25 } }}>
                    <Box sx={{ display: "flex", gap: 1.5, pr: 3 }}>
                        <Avatar
                            src={!avatarError && avatarSrc ? avatarSrc : undefined}
                            onError={() => setAvatarError(true)}
                            alt={actorName}
                            sx={(t) => ({
                                width: 48, height: 48, borderRadius: "50%", flexShrink: 0, mt: 0.25,
                                border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.18),
                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                color: "primary.main",
                            })}
                            imgProps={{ referrerPolicy: "no-referrer" }}
                        >
                            <MusicNoteRoundedIcon sx={{ fontSize: 24 }} />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{
                                fontWeight: 900, fontSize: 14.5, lineHeight: 1.25, mb: 0.15,
                                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                                overflowWrap: "anywhere", wordBreak: "break-word",
                            }}>
                                {title}
                            </Typography>
                            <Typography sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary", lineHeight: 1.3, mb: 0.3 }}>
                                {actorName}{actorHandle ? ` · @${actorHandle}` : ""}
                            </Typography>

                            {genres.length > 0 ? (
                                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 0.4 }}>
                                    {genres.map((g) => {
                                        const GenreIcon = getGenreIcon(g);
                                        return (
                                            <Chip
                                                key={g}
                                                icon={<GenreIcon sx={{ fontSize: 12 }} />}
                                                label={g}
                                                size="small"
                                                sx={(t) => ({
                                                    height: 20, fontSize: 9.5, fontWeight: 800,
                                                    bgcolor: alpha(t.palette.primary.main, 0.1), color: "primary.main",
                                                    "& .MuiChip-icon": { color: "primary.main", ml: 0.5 },
                                                })}
                                            />
                                        );
                                    })}
                                </Box>
                            ) : null}
                        </Box>
                    </Box>

                    {/* Location — always on its own line below header */}
                    {locationStr ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, mt: 0.5 }}>
                            <LocationOnRoundedIcon sx={{ fontSize: 13, color: "primary.main", flexShrink: 0 }} />
                            <Typography noWrap sx={{ fontSize: 11, color: "primary.main", fontWeight: 700, lineHeight: 1.3 }}>
                                {locationStr}
                            </Typography>
                        </Box>
                    ) : null}

                    {truncatedBody ? (
                        <Typography sx={{
                            mt: 0.75, fontSize: 12, lineHeight: 1.45, color: "text.secondary",
                            overflowWrap: "anywhere", wordBreak: "break-word",
                        }}>
                            {truncatedBody}
                            {hasMore && (
                                <Typography
                                    component="span"
                                    sx={{ fontSize: 12, fontWeight: 700, color: "primary.main", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                                    onClick={(e) => { e.stopPropagation(); onOpenPost?.(p); }}
                                >
                                    ...more
                                </Typography>
                            )}
                        </Typography>
                    ) : null}
                </Box>
            </Box>
        </Box>
    );
}

/* ════════════════════════════════════════════
   MusicMapView component
   ════════════════════════════════════════════ */
// Hoisted outside the component so the default reference is stable across renders.
const EMPTY_ARTISTS = [];
const EMPTY_POSTS = [];

export default function MusicMapView({
                                         // --- mode ---
                                         mode = "artists",
                                         // --- artists mode props ---
                                         artists = EMPTY_ARTISTS,
                                         onSelectArtist,
                                         selectedArtistId,
                                         focusArtistId,
                                         focusStatewide,
                                         onFocusArtistHandled,
                                         // --- posts mode props ---
                                         posts = EMPTY_POSTS,
                                         onSelectPost,
                                         focusPostId,
                                         onFocusPostHandled,
                                         hoveredPostId,
                                     }) {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const tileUrlNoLabels = isDarkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png';

    const COUNTY_STYLE = useMemo(() => ({
        color: alpha(theme.palette.text.primary, isDarkMode ? 0.18 : 0.10),
        weight: 1,
        fillColor: alpha(theme.palette.text.primary, isDarkMode ? 0.06 : 0.04),
        fillOpacity: 1,
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
    const [openedArtistId, setOpenedArtistId] = useState(null);
    const [center, setCenter] = useState(DEFAULT_CENTER);
    const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);
    const [hoveredArtistId, setHoveredArtistId] = useState(null);

    // Refs for hover bounce animation (same as JobsMapView)
    const animRef = useRef(null);
    const iconElRef = useRef(null);

    // Build list of artists that have coordinates
    const artistsWithCoords = useMemo(() => {
        return (Array.isArray(artists) ? artists : []).filter((a) => {
            const lat = Number(a?.latitude);
            const lng = Number(a?.longitude);
            return Number.isFinite(lat) && Number.isFinite(lng);
        });
    }, [artists]);

    // Group artists by coordinate key
    const coordGroups = useMemo(() => {
        const out = {};
        artistsWithCoords.forEach((a) => {
            const lat = Number(a.latitude);
            const lng = Number(a.longitude);
            const coordKey = `${lat.toFixed(6)}_${lng.toFixed(6)}`;
            const id = a.id ?? a.artist_id;
            if (id == null) return;
            if (!out[coordKey]) out[coordKey] = { lat, lng, ids: [], artistMap: {} };
            out[coordKey].ids.push(id);
            out[coordKey].artistMap[id] = a;
        });
        return out;
    }, [artistsWithCoords]);

    const markerEntries = useMemo(() => {
        const entries = [];
        const currentZoom = mapRef?.current?.getZoom?.() ?? DEFAULT_ZOOM;
        Object.entries(coordGroups).forEach(([coordKey, group]) => {
            const position = offsetCoords([group.lat, group.lng], 0, 1, currentZoom);
            entries.push({ groupKey: coordKey, position, ids: group.ids, artistMap: group.artistMap });
        });
        return entries;
    }, [coordGroups]);

    // Lookup: artistId → groupKey + idx
    const idToGroup = useMemo(() => {
        const m = new Map();
        markerEntries.forEach(({ groupKey, ids }) => {
            ids.forEach((id, idx) => { m.set(String(id), { groupKey, idx }); });
        });
        return m;
    }, [markerEntries]);

    // Resolve the marker position for the currently opened popup
    const openedMarkerPosition = useMemo(() => {
        if (!openedArtistId) return null;
        const openedKey = String(openedArtistId);
        for (const { ids, position } of markerEntries) {
            for (const id of ids) {
                if (String(id) === openedKey) return position;
            }
        }
        return null;
    }, [openedArtistId, markerEntries]);

    // Keep active index synced when selectedArtistId changes externally
    useEffect(() => {
        if (!selectedArtistId) return;
        const info = idToGroup.get(String(selectedArtistId));
        if (!info) return;
        setActiveIdxByGroup((prev) => {
            if (prev[info.groupKey] === info.idx) return prev;
            return { ...prev, [info.groupKey]: info.idx };
        });
    }, [selectedArtistId, idToGroup]);

    // Sync opened popup to selected + zoom to artist position
    useEffect(() => {
        setOpenedArtistId(selectedArtistId ?? null);

        if (selectedArtistId) {
            for (const { ids, position } of markerEntries) {
                const match = ids.some((id) => String(id) === String(selectedArtistId));
                if (match) {
                    const lat = position[0];
                    const lng = position[1];
                    setCenter([lat, lng]);
                    setZoomLevel(MARKER_CLICK_ZOOM);
                    break;
                }
            }
        }
    }, [selectedArtistId, markerEntries]);

    // Open popup on the correct marker when openedArtistId changes
    const lastOpenedRef = useRef(null);
    useEffect(() => {
        if (!openedArtistId) { lastOpenedRef.current = null; return; }
        if (lastOpenedRef.current === String(openedArtistId)) return;
        const marker = markerRefs.current[String(openedArtistId)];
        if (!marker) return;
        try { marker.openPopup(); lastOpenedRef.current = String(openedArtistId); } catch { /* noop */ }
    }, [openedArtistId, markerEntries]);

    // Hover bounce animation (mirrors JobsMapView)
    useEffect(() => {
        if (animRef.current) {
            try { animRef.current.cancel?.(); } catch { /* noop */ }
            animRef.current = null;
        }
        if (iconElRef.current) {
            try { iconElRef.current.style.transform = ""; } catch { /* noop */ }
            iconElRef.current = null;
        }

        if (hoveredArtistId != null) {
            const marker = markerRefs.current[String(hoveredArtistId)];
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
            if (animRef.current) {
                try { animRef.current.cancel?.(); } catch { /* noop */ }
                animRef.current = null;
            }
            if (iconElRef.current) {
                try { iconElRef.current.style.transform = ""; } catch { /* noop */ }
                iconElRef.current = null;
            }
        };
    }, [hoveredArtistId]);

    // Handler: popup dismissed — only clear if closing popup matches current (mirrors JobsMapView)
    const handlePopupClose = (closingId) => {
        setOpenedArtistId((prev) => {
            if (closingId == null) return null;
            const closingStr = String(closingId);
            const prevStr = prev != null ? String(prev) : null;
            if (prevStr === closingStr) return null;
            return prev;
        });
    };

    // External focus: when a card's location is clicked, pan to the marker and open its popup
    useEffect(() => {
        if (!focusArtistId) return;
        const idStr = String(focusArtistId);
        const info = idToGroup.get(idStr);
        if (!info) {
            if (typeof onFocusArtistHandled === "function") onFocusArtistHandled();
            return;
        }
        setActiveIdxByGroup((prev) => ({ ...prev, [info.groupKey]: info.idx }));
        setOpenedArtistId(focusArtistId);

        const entry = markerEntries.find((e) => e.groupKey === info.groupKey);
        if (entry) {
            const lat = entry.position[0];
            const lng = entry.position[1];
            setCenter([lat, lng]);
            setZoomLevel(MARKER_CLICK_ZOOM);
        }
        if (typeof onFocusArtistHandled === "function") onFocusArtistHandled();
    }, [focusArtistId, idToGroup, markerEntries, onFocusArtistHandled]);

    // Statewide focus: zoom out to show the full state
    useEffect(() => {
        if (!focusStatewide) return;
        setOpenedArtistId(null);
        setCenter(DEFAULT_CENTER);
        setZoomLevel(DEFAULT_ZOOM);
        if (typeof onFocusArtistHandled === "function") onFocusArtistHandled();
    }, [focusStatewide, onFocusArtistHandled]);

    /* ────────────────────────────────────────────────────────────────
       Posts mode — parallel state for when mode === "posts"
       ──────────────────────────────────────────────────────────────── */
    const isPostsMode = mode === "posts";
    const postMarkerRefs = useRef({});
    const [postActiveIdxByGroup, setPostActiveIdxByGroup] = useState({});
    const [openedPostIdState, setOpenedPostIdState] = useState(null);
    const [hoveredPostIdLocal, setHoveredPostIdLocal] = useState(null);
    const postAnimRef = useRef(null);
    const postIconElRef = useRef(null);
    const lastOpenedPostRef = useRef(null);

    const effectiveHoveredPostId = hoveredPostId != null ? String(hoveredPostId) : hoveredPostIdLocal;

    const postsWithCoords = useMemo(() => {
        if (!isPostsMode) return [];
        return (Array.isArray(posts) ? posts : []).filter((p) => {
            const lat = Number(p?.latitude);
            const lng = Number(p?.longitude);
            return Number.isFinite(lat) && Number.isFinite(lng);
        });
    }, [posts, isPostsMode]);

    const postCoordGroups = useMemo(() => {
        const out = {};
        postsWithCoords.forEach((p) => {
            const lat = Number(p.latitude);
            const lng = Number(p.longitude);
            const coordKey = `${lat.toFixed(6)}_${lng.toFixed(6)}`;
            const id = p.id ?? p.post_id;
            if (id == null) return;
            if (!out[coordKey]) out[coordKey] = { lat, lng, ids: [], postMap: {} };
            out[coordKey].ids.push(id);
            out[coordKey].postMap[id] = p;
        });
        return out;
    }, [postsWithCoords]);

    const postMarkerEntries = useMemo(() => {
        const entries = [];
        const currentZoom = mapRef?.current?.getZoom?.() ?? DEFAULT_ZOOM;
        Object.entries(postCoordGroups).forEach(([coordKey, group]) => {
            const position = offsetCoords([group.lat, group.lng], 0, 1, currentZoom);
            entries.push({ groupKey: coordKey, position, ids: group.ids, postMap: group.postMap });
        });
        return entries;
    }, [postCoordGroups]);

    const postIdToGroup = useMemo(() => {
        const m = new Map();
        postMarkerEntries.forEach(({ groupKey, ids }) => {
            ids.forEach((id, idx) => { m.set(String(id), { groupKey, idx }); });
        });
        return m;
    }, [postMarkerEntries]);

    const openedPostMarkerPosition = useMemo(() => {
        if (!openedPostIdState) return null;
        const openedKey = String(openedPostIdState);
        for (const { ids, position } of postMarkerEntries) {
            for (const id of ids) {
                if (String(id) === openedKey) return position;
            }
        }
        return null;
    }, [openedPostIdState, postMarkerEntries]);

    // Open popup on the correct marker when openedPostIdState changes
    useEffect(() => {
        if (!isPostsMode) return;
        if (!openedPostIdState) { lastOpenedPostRef.current = null; return; }
        if (lastOpenedPostRef.current === String(openedPostIdState)) return;
        const marker = postMarkerRefs.current[String(openedPostIdState)];
        if (!marker) return;
        try { marker.openPopup(); lastOpenedPostRef.current = String(openedPostIdState); } catch { /* noop */ }
    }, [isPostsMode, openedPostIdState, postMarkerEntries]);

    // Hover bounce animation for posts
    useEffect(() => {
        if (!isPostsMode) return;
        if (postAnimRef.current) { try { postAnimRef.current.cancel?.(); } catch {} postAnimRef.current = null; }
        if (postIconElRef.current) { try { postIconElRef.current.style.transform = ""; } catch {} postIconElRef.current = null; }

        if (effectiveHoveredPostId != null) {
            const marker = postMarkerRefs.current[String(effectiveHoveredPostId)];
            const img = marker?.getElement()?.querySelector(".marker-icon");
            if (img) {
                postIconElRef.current = img;
                img.style.transformOrigin = "50% 100%";
                postAnimRef.current = img.animate(
                    [{ transform: "translateY(0)" }, { transform: "translateY(-15px)" }],
                    { duration: 600, iterations: Infinity, easing: "ease-in-out", direction: "alternate" }
                );
            }
        }

        return () => {
            if (postAnimRef.current) { try { postAnimRef.current.cancel?.(); } catch {} postAnimRef.current = null; }
            if (postIconElRef.current) { try { postIconElRef.current.style.transform = ""; } catch {} postIconElRef.current = null; }
        };
    }, [isPostsMode, effectiveHoveredPostId]);

    const handlePostPopupClose = (closingId) => {
        setOpenedPostIdState((prev) => {
            if (closingId == null) return null;
            return prev != null && String(prev) === String(closingId) ? null : prev;
        });
    };

    // Focus post: when a card's location is clicked
    useEffect(() => {
        if (!isPostsMode || !focusPostId) return;
        const idStr = String(focusPostId);
        const info = postIdToGroup.get(idStr);
        if (!info) {
            if (typeof onFocusPostHandled === "function") onFocusPostHandled();
            return;
        }
        setPostActiveIdxByGroup((prev) => ({ ...prev, [info.groupKey]: info.idx }));
        setOpenedPostIdState(focusPostId);

        const entry = postMarkerEntries.find((e) => e.groupKey === info.groupKey);
        if (entry) {
            const lat = entry.position[0];
            const lng = entry.position[1];
            setCenter([lat, lng]);
            setZoomLevel(MARKER_CLICK_ZOOM);
        }
        if (typeof onFocusPostHandled === "function") onFocusPostHandled();
    }, [isPostsMode, focusPostId, postIdToGroup, postMarkerEntries, onFocusPostHandled]);

    const maxBounds = useMemo(() => computeBoundsWithPad(RAW_BOUNDS, DEFAULT_BOUNDS_PAD), []);

    return (
        <MapErrorBoundary>
            <MapWrapper>
                <Box sx={{ position: "absolute", bottom: 12, right: 12, zIndex: 1000, pointerEvents: "none" }}>
                    <Chip
                        label="Pins show approximate area"
                        size="small"
                        icon={<RoomOutlinedIcon />}
                        sx={(t) => ({
                            backgroundColor: alpha(t.palette.background.paper, 0.78),
                            color: t.palette.text.secondary,
                            fontSize: 11,
                            fontWeight: 600,
                            height: 22,
                            borderRadius: 999,
                            border: `1px solid ${alpha(t.palette.divider, 0.55)}`,
                            boxShadow: `0 8px 18px ${alpha(t.palette.mode === "dark" ? "#000" : t.palette.text.primary, t.palette.mode === "dark" ? 0.22 : 0.08)}`,
                            backdropFilter: "blur(6px)",
                            "& .MuiChip-icon": { fontSize: 16, color: t.palette.text.secondary },
                        })}
                    />
                </Box>

                {/* Empty state */}
                {artistsWithCoords.length === 0 && !isPostsMode && (() => {
                    const totalArtists = Array.isArray(artists) ? artists.length : 0;
                    const unpinnedCount = totalArtists - artistsWithCoords.length;
                    // Infer scope from the incoming artists list so the empty
                    // state icon matches the current tab. If every artist (or
                    // the first one, when there are no artists at all we still
                    // show music-note) has profile_type='artist', use palette;
                    // otherwise default to music-note.
                    const emptyIsVisualScope = totalArtists > 0 && artists.every((a) => {
                        const pt = String(a?.profile_type || a?.profileType || '').toLowerCase();
                        return pt === 'artist';
                    });
                    const EmptyIcon = emptyIsVisualScope ? PaletteRoundedIcon : MusicNoteRoundedIcon;
                    return (
                        <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 999, textAlign: "center", p: 3, pointerEvents: "none" }}>
                            <Box sx={{ px: 3, py: 2.5, borderRadius: 2.5, bgcolor: alpha(theme.palette.background.paper, 0.92), backdropFilter: "blur(8px)", border: `1px solid ${theme.palette.divider}`, boxShadow: `0 8px 32px ${alpha(theme.palette.mode === "dark" ? "#000" : theme.palette.text.primary, theme.palette.mode === "dark" ? 0.28 : 0.1)}` }}>
                                <EmptyIcon sx={{ fontSize: 36, color: "text.disabled", mb: 1 }} />
                                <Typography sx={{ fontWeight: 700, fontSize: 14, color: "text.secondary" }}>No artists with location pins</Typography>
                                <Typography sx={{ fontSize: 12, color: "text.disabled", mt: 0.5 }}>
                                    {unpinnedCount > 0
                                        ? `${unpinnedCount} artist${unpinnedCount !== 1 ? "s" : ""} found, but ${unpinnedCount === 1 ? "doesn't" : "don't"} have a map pin set`
                                        : "Artists will appear here when they add a map pin"}
                                </Typography>
                            </Box>
                        </Box>
                    );
                })()}

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
                            center={center}
                            zoomLevel={zoomLevel}
                            openedArtistId={isPostsMode ? openedPostIdState : openedArtistId}
                            markerPosition={isPostsMode ? openedPostMarkerPosition : openedMarkerPosition}
                        />

                        <PanOnPopupOpen
                            openedArtistId={isPostsMode ? openedPostIdState : openedArtistId}
                            markerRefs={isPostsMode ? postMarkerRefs : markerRefs}
                        />

                        <ZoomDismissOnZoomOut
                            openedArtistId={isPostsMode ? openedPostIdState : openedArtistId}
                            onPopupClose={isPostsMode ? handlePostPopupClose : handlePopupClose}
                        />

                        <TileLayer key={`tile-${isDarkMode ? 'dark' : 'light'}`} url={tileUrlNoLabels} />

                        <GeoJSON
                            key={`counties-${isDarkMode ? 'd' : 'l'}`}
                            data={alabamaCounties}
                            onEachFeature={COUNTY_ON_EACH_FEATURE}
                            style={COUNTY_STYLE}
                        />

                        <GeoJSON
                            key={`al-border-${isDarkMode ? 'd' : 'l'}`}
                            data={alabama}
                            style={STATE_BORDER_STYLE}
                        />

                        <PlacesOutlines data={alabamaPlaces} minZoom={9} />
                        <CityLabels cities={cityList} minZoom={9} />

                        {/* Artist markers (artists mode) */}
                        {!isPostsMode && markerEntries.map(({ groupKey, position, ids, artistMap }) => {
                            const idx = activeIdxByGroup[groupKey] ?? 0;
                            const activeId = ids[idx];
                            const activeArtist = artistMap[activeId];
                            const isOpen = openedArtistId != null && String(openedArtistId) === String(activeId);
                            const hasStack = ids.length > 1;

                            const isHovered = hoveredArtistId != null && String(hoveredArtistId) === String(activeId);
                            const isSelected = isOpen;
                            // Pick the marker icon based on the active artist's sub-type
                            // so visual artists render as a palette and musicians as a
                            // music note. Hover/selected states swap to the crimson
                            // variant regardless of sub-type. Defaults to the music
                            // icon when profile_type is missing / unknown.
                            const activeProfileType = String(
                                activeArtist?.profile_type || activeArtist?.profileType || ''
                            ).toLowerCase();
                            const isVisualArtistMarker = activeProfileType === 'artist';
                            const icon = isHovered || isSelected
                                ? (isVisualArtistMarker ? artistDivIconGold : musicDivIconGold)
                                : (isVisualArtistMarker ? artistDivIcon : musicDivIcon);

                            const goPrev = (e) => {
                                e.stopPropagation();
                                const newIdx = Math.max(idx - 1, 0);
                                setActiveIdxByGroup((p) => ({ ...p, [groupKey]: newIdx }));
                                const nextId = ids[newIdx];
                                setOpenedArtistId(nextId);
                            };

                            const goNext = (e) => {
                                e.stopPropagation();
                                const newIdx = Math.min(idx + 1, ids.length - 1);
                                setActiveIdxByGroup((p) => ({ ...p, [groupKey]: newIdx }));
                                const nextId = ids[newIdx];
                                setOpenedArtistId(nextId);
                            };

                            return (
                                <Marker
                                    key={`marker-${groupKey}`}
                                    position={position}
                                    icon={icon}
                                    ref={(m) => {
                                        if (!m) return;
                                        ids.forEach((id) => { markerRefs.current[String(id)] = m; });
                                    }}
                                    eventHandlers={{
                                        mouseover: () => {
                                            if (activeId != null) setHoveredArtistId(String(activeId));
                                        },
                                        mouseout: () => {
                                            setHoveredArtistId(null);
                                        },
                                        click: () => {
                                            setActiveIdxByGroup((p) => ({ ...p, [groupKey]: idx }));
                                            setOpenedArtistId(activeId);
                                            setHoveredArtistId(null);

                                            const lat = position[0];
                                            const lng = position[1];
                                            // Small offset for Recenter dedup busting
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
                                            onClose={() => { handlePopupClose(activeId); }}
                                        >
                                            <Box sx={{ width: { xs: "min(340px, calc(100vw - 48px))", sm: "min(420px, calc(100vw - 40px))" }, maxWidth: "100%" }}>
                                                {/* Crossfade wrapper — smoothly transitions content when cycling */}
                                                <Box
                                                    key={`content-${activeId}`}
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
                                                    {activeArtist ? (
                                                        <ArtistPopupCard
                                                            artist={activeArtist}
                                                            onOpenArtist={(a) => {
                                                                if (typeof onSelectArtist === "function") onSelectArtist(a);
                                                            }}
                                                        />
                                                    ) : (
                                                        <Box sx={{ p: 1.25 }}>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Loading artist…
                                                            </Typography>
                                                        </Box>
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
                                                                sx={{
                                                                    fontWeight: 800,
                                                                    borderRadius: 999,
                                                                    bgcolor: (t) => alpha(t.palette.info.main, 0.10),
                                                                    border: "1px solid",
                                                                    borderColor: (t) => alpha(t.palette.info.main, 0.25),
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

                        {/* Post markers (posts mode) */}
                        {isPostsMode && postMarkerEntries.map(({ groupKey, position, ids, postMap }) => {
                            const idx = postActiveIdxByGroup[groupKey] ?? 0;
                            const activeId = ids[idx];
                            const activePost = postMap[activeId];
                            const isOpen = openedPostIdState != null && String(openedPostIdState) === String(activeId);
                            const hasStack = ids.length > 1;

                            const isHovered = effectiveHoveredPostId != null && String(effectiveHoveredPostId) === String(activeId);
                            const isSelected = isOpen;
                            const icon = isHovered || isSelected ? postDivIconGold : postDivIcon;

                            const goPrev = (e) => {
                                e.stopPropagation();
                                const newIdx = Math.max(idx - 1, 0);
                                setPostActiveIdxByGroup((p) => ({ ...p, [groupKey]: newIdx }));
                                setOpenedPostIdState(ids[newIdx]);
                            };

                            const goNext = (e) => {
                                e.stopPropagation();
                                const newIdx = Math.min(idx + 1, ids.length - 1);
                                setPostActiveIdxByGroup((p) => ({ ...p, [groupKey]: newIdx }));
                                setOpenedPostIdState(ids[newIdx]);
                            };

                            return (
                                <Marker
                                    key={`post-marker-${groupKey}`}
                                    position={position}
                                    icon={icon}
                                    ref={(m) => {
                                        if (!m) return;
                                        ids.forEach((id) => { postMarkerRefs.current[String(id)] = m; });
                                    }}
                                    eventHandlers={{
                                        mouseover: () => {
                                            if (activeId != null) setHoveredPostIdLocal(String(activeId));
                                        },
                                        mouseout: () => {
                                            setHoveredPostIdLocal(null);
                                        },
                                        click: () => {
                                            setPostActiveIdxByGroup((p) => ({ ...p, [groupKey]: idx }));
                                            setOpenedPostIdState(activeId);
                                            setHoveredPostIdLocal(null);

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
                                            onClose={() => { handlePostPopupClose(activeId); }}
                                        >
                                            <Box sx={{ width: { xs: "min(340px, calc(100vw - 48px))", sm: "min(420px, calc(100vw - 40px))" }, maxWidth: "100%" }}>
                                                <Box
                                                    key={`post-content-${activeId}`}
                                                    sx={{
                                                        animation: hasStack ? "popupPostFadeIn 220ms cubic-bezier(.2,.8,.2,1) both" : "none",
                                                        "@keyframes popupPostFadeIn": {
                                                            "0%": { opacity: 0, transform: "translateY(4px)" },
                                                            "100%": { opacity: 1, transform: "translateY(0)" },
                                                        },
                                                    }}
                                                >
                                                    {activePost ? (
                                                        <PostPopupCard
                                                            post={activePost}
                                                            onOpenPost={(p) => {
                                                                if (typeof onSelectPost === "function") onSelectPost(p);
                                                            }}
                                                        />
                                                    ) : (
                                                        <Box sx={{ p: 1.25 }}>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Loading post…
                                                            </Typography>
                                                        </Box>
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
                                                                sx={{
                                                                    fontWeight: 800,
                                                                    borderRadius: 999,
                                                                    bgcolor: (t) => alpha(t.palette.info.main, 0.10),
                                                                    border: "1px solid",
                                                                    borderColor: (t) => alpha(t.palette.info.main, 0.25),
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

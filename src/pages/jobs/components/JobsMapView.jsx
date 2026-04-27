// src/pages/jobs/components/JobsMapView.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import MapErrorBoundary from "../../../components/MapErrorBoundary";
import { Alert, Box, Avatar, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, Radio, RadioGroup, Stack, TextField, Typography, useMediaQuery } from "@mui/material";
import { alpha, styled, useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import { deleteJob } from "../api/jobs";
import CreateJobModal from "../modals/CreateJobModal";
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../../../components/MapView.css";

import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import RoomOutlinedIcon from "@mui/icons-material/RoomOutlined";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";

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
    RECENTER_OFFSET_PX,
    computeBoundsWithPad,
    createAlabamaMask,
} from "../../../utils/MapUtils";


import { getCategoryInfo, getJobTypeLabel } from "../utils/jobHelpers";
import UserCardPopover from "../../../components/UserCardPopover";
import { BRAND } from "../../../themes";

/* ── SVG-based job markers (themed, no PNGs) ── */

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

const JOB_ICON_PATH = 'M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z';
const jobDivIcon = makeSvgDivIcon(buildMarkerSvg(JOB_ICON_PATH, BRAND_NAVY, BRAND_NAVY_DARK, BRAND_NAVY), "job-div-icon");
const jobDivIconGold = makeSvgDivIcon(buildMarkerSvg(JOB_ICON_PATH, BRAND_CRIMSON, BRAND_CRIMSON_D, BRAND_CRIMSON), "job-div-icon");

/* ── Map constants ── */

const RAW_BOUNDS = L.geoJSON(alabama.features[0]).getBounds();

/* ── Styled wrapper ── */
const MapWrapper = styled(Box)(({ theme }) => ({
    position: "relative",
    width: "100%",
    height: "100%",
    "& .leaflet-container": {
        width: "100%",
        height: "100%",
        backgroundColor: theme.palette.background.default,
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
        pointerEvents: "none",
    },
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
    "& .leaflet-popup-content": { margin: 0, width: "auto !important", maxWidth: "none !important", lineHeight: 1.2 },
    "& .leaflet-popup-tip": {
        background: `${theme.palette.background.paper} !important`,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: (t) => `0 10px 28px ${alpha(t.palette.text.primary, 0.12)}`,
    },
    "& .leaflet-popup-close-button": {
        width: 28,
        height: 28,
        top: 8,
        right: 8,
        borderRadius: 999,
        color: theme.palette.text.secondary,
        bgcolor: (t) => alpha(t.palette.background.paper, 0.95),
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: (t) => `0 2px 6px ${alpha(t.palette.text.primary, 0.15)}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 30,
        fontSize: 18,
        fontWeight: 700,
    },
    "& .leaflet-popup-close-button:hover": {
        color: theme.palette.text.primary,
        background: `${theme.palette.action.hover} !important`,
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
    useEffect(() => { try { map?.setMaxBounds?.(bounds); } catch { /* noop */ } }, [map, bounds]);
    return null;
};

const MapRefSetter = ({ mapRef }) => {
    const map = useMap();
    useEffect(() => {
        if (map) mapRef.current = map;
    }, [map, mapRef]);
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

const Recenter = ({ center, zoomLevel, openedJobId, markerPosition }) => {
    const map = useMap();
    const lastKeyRef = useRef(null);

    useEffect(() => {
        if (!map) return;
        if (!center?.length) return;

        const isStatewide = isStatewideCenter(center);
        const effectiveZoom = isStatewide ? DEFAULT_ZOOM : (zoomLevel ?? MARKER_CLICK_ZOOM);
        const effectiveCenter = isStatewide ? DEFAULT_CENTER : center;

        // Use marker position in the key (not openedJobId) so that cycling
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

                if (openedJobId && markerPosition && !isStatewide) {
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
            } catch { /* noop */ }
        }

        tryMove();
    }, [map, center, zoomLevel, openedJobId, markerPosition]);

    return null;
};

const PanOnPopupOpen = ({ openedJobId, markerRefs }) => {
    const map = useMap();
    const lastPannedIdRef = useRef(null);
    const lastPannedPosRef = useRef(null);

    useEffect(() => {
        if (!map || !openedJobId) {
            lastPannedIdRef.current = null;
            lastPannedPosRef.current = null;
            return;
        }

        if (lastPannedIdRef.current === String(openedJobId)) return;

        const timeoutId = setTimeout(() => {
            try {
                if (!isMapContainerReady(map)) return; // Guard: skip pan if container has zero dimensions
                const marker = markerRefs?.current?.[String(openedJobId)];
                if (!marker) return;

                const latlng = marker.getLatLng();
                if (!latlng) return;

                // Skip pan if the position is effectively the same (cycling within a group)
                const prev = lastPannedPosRef.current;
                if (prev && Math.abs(prev.lat - latlng.lat) < 0.00001 && Math.abs(prev.lng - latlng.lng) < 0.00001) {
                    lastPannedIdRef.current = String(openedJobId);
                    return;
                }

                const panTarget = getNorthPanTarget(map, latlng, RECENTER_OFFSET_PX);
                map.panTo(panTarget, { animate: true, duration: PAN_TO_DURATION });
                lastPannedIdRef.current = String(openedJobId);
                lastPannedPosRef.current = latlng;
            } catch { /* noop */ }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [map, openedJobId, markerRefs]);

    return null;
};

const ZoomDismissOnZoomOut = ({ openedJobId, onPopupClose, maxZoomOutSteps = 2 }) => {
    const map = useMap();

    const openedIdRef = useRef(null);
    const lastZoomRef = useRef(null);
    const zoomOutStepsRef = useRef(0);
    const onCloseRef = useRef(onPopupClose);

    useEffect(() => {
        onCloseRef.current = onPopupClose;
    }, [onPopupClose]);

    useEffect(() => {
        const opened = openedJobId != null ? String(openedJobId) : null;
        openedIdRef.current = opened;
        zoomOutStepsRef.current = 0;
        try { lastZoomRef.current = map?.getZoom?.(); } catch { lastZoomRef.current = null; }
    }, [openedJobId, map]);

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

/* ── helpers ── */
function safeStr(v) {
    return typeof v === "string" ? v : v == null ? "" : String(v);
}

const timeAgoCompact = (input) => {
    const d = input ? new Date(input) : null;
    if (!d || Number.isNaN(d.valueOf())) return "";
    const diffMs = Math.max(0, Date.now() - d.getTime());
    const s = Math.floor(diffMs / 1000);
    if (s < 60) return "1m ago";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}hr ago`;
    const dys = Math.floor(h / 24);
    if (dys < 7) return `${dys}d ago`;
    const w = Math.floor(dys / 7);
    if (w < 5) return `${w}wk ago`;
    const mo = Math.floor(dys / 30);
    if (mo < 12) return `${mo}mo ago`;
    const y = Math.floor(dys / 365);
    return `${y}yr ago`;
};

const resolveAvatar = (job) => {
    const poster = safeStr(job?.posterAvatar || job?.poster_avatar).trim();
    if (poster) return poster;
    const logo = safeStr(job?.logoUrl || job?.logo_url).trim();
    if (logo) return logo;
    return "";
};

/* ── Inline popup card for job ── */
function JobPopupCard({ job, onOpenJob, onOpenUserCard, onReport, onEdit, onDelete, isMobile, user, activeAccount }) {
    const j = job || {};
    const title = safeStr(j.title).trim() || "Untitled job";
    const posterName = safeStr(j.posterName || j.poster_name).trim();
    const companyName = safeStr(j.company || j.companyName || j.company_name).trim();
    const headerName = posterName || companyName || "Someone";
    const avatarSrc = resolveAvatar(j);

    const rawLocationLabel = safeStr(j.locationLabel || j.location_label).trim() || "Alabama (Statewide)";
    const locationLabel = rawLocationLabel && rawLocationLabel !== "Alabama (Statewide)" && !rawLocationLabel.toLowerCase().includes("county")
        ? `${rawLocationLabel} County`
        : rawLocationLabel;
    const pay = safeStr(j.pay).trim();
    const jobTypeRaw = safeStr(j.jobType || j.job_type).trim();
    const jobTypeLabel = getJobTypeLabel(jobTypeRaw);
    const workMode = safeStr(j.workMode || j.work_mode).trim();
    const categorySlug = safeStr(j.categoryName || j.category).trim();
    const catInfo = categorySlug ? getCategoryInfo(categorySlug) : null;
    const CatIcon = catInfo?.Icon || null;
    const createdAt = j.createdAt || j.created_at || "";
    const posterHandle = safeStr(j.posterHandle || j.poster_handle).trim();
    const accountHandle = safeStr(j.accountHandle || j.account_handle).trim();
    const accountName = safeStr(j.accountName || j.account_name).trim();
    const accountAvatarUrl = safeStr(j.accountAvatarUrl || j.account_avatar_url).trim();
    const businessSlug = safeStr(j.businessSlug || j.business_slug).trim();
    const artistHandle = safeStr(j.artistHandle || j.artist_handle).trim();
    const isBusiness = j.ownerType === "business";
    const isArtist = !isBusiness && Boolean(j.artistId || j.artist_id || j.posterArtistId || j.poster_artist_id);

    const handleClick = () => {
        if (typeof onOpenJob === "function") onOpenJob(j);
    };

    const chipSx = (t) => ({
        fontWeight: 800,
        borderRadius: 999,
        height: 22,
        fontSize: 11,
        bgcolor: alpha(t.palette.primary.main, 0.08),
        color: t.palette.primary.main,
        border: `1px solid ${alpha(t.palette.primary.main, 0.2)}`,
        "& .MuiChip-label": { px: 0.7, lineHeight: 1 },
        "& .MuiChip-icon": { ml: 0.4, color: t.palette.primary.main },
    });


    // Ownership detection — if you created the job, you own it.
    // The userId match is the authoritative check. The backend's isOwner
    // adds account-scope awareness (business vs personal) but may return
    // false when the viewer isn't on the matching account type. We fall
    // back to a simple creator check so edit/delete always appears for
    // the poster regardless of which account tab they're browsing from.
    const viewerId = Number(user?.id || 0);
    const posterId = Number(j?.posterUserId || j?.createdByUserId || j?.created_by_user_id || 0);
    const clientIsOwner = Boolean(viewerId && posterId && viewerId === posterId);
    const isOwner = Boolean(j?.isOwner) || clientIsOwner;

    return (
        <Box
            onClick={handleClick}
            sx={{
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                width: isMobile ? "min(320px, 85vw)" : 420,
                minHeight: isMobile ? 160 : 200,
                overflow: "hidden",
                position: "relative",
                "&:hover": {},
                transition: (t) => `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
            }}
        >


            {/* Header — avatar + poster + time */}
            <Box sx={{ px: 2, pt: 1.75 }}>
                <Box
                    onClick={(e) => {
                        e.stopPropagation();
                        if (typeof onOpenUserCard !== "function") return;
                        const resolvedHandle = isBusiness
                            ? (businessSlug || accountHandle || posterHandle || null)
                            : isArtist
                                ? (artistHandle || accountHandle || posterHandle || null)
                                : (posterHandle || accountHandle || null);
                        const cardData = {
                            id: j.posterUserId || j.created_by_user_id || j.createdByUserId || undefined,
                            user_id: j.posterUserId || j.created_by_user_id || j.createdByUserId || undefined,
                            handle: resolvedHandle,
                            profilePath: j.posterProfilePath || j.poster_profile_path || null,
                            first_name: headerName,
                            last_name: "",
                            avatar_url: avatarSrc,
                            account_name: accountName || companyName || undefined,
                            account_handle: accountHandle || undefined,
                            account_avatar_url: accountAvatarUrl || avatarSrc,
                        };
                        if (isBusiness) {
                            cardData.account_type = "business";
                            cardData.business_id = j.businessId || j.business_id || j.pageId || j.page_id || undefined;
                            cardData.business_name = companyName || accountName || headerName;
                            cardData.business_slug = businessSlug || accountHandle || posterHandle || undefined;
                            cardData.business_avatar_url = accountAvatarUrl || avatarSrc;
                        } else if (isArtist) {
                            cardData.account_type = "artist";
                            cardData.artist_id = j.artistId || j.artist_id || j.posterArtistId || j.poster_artist_id || undefined;
                            cardData.artist_name = posterName || accountName || headerName;
                            cardData.artist_handle = artistHandle || accountHandle || posterHandle || undefined;
                            cardData.artist_avatar_url = accountAvatarUrl || avatarSrc;
                        }
                        onOpenUserCard(e.currentTarget, cardData);
                    }}
                    sx={{
                        display: "inline-flex",
                        alignItems: "flex-start",
                        gap: 1.25,
                        borderRadius: 2,
                        px: 0.75,
                        py: 0.6,
                        ml: -0.75,
                        cursor: onOpenUserCard ? "pointer" : "default",
                        transition: (t) => `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                        "&:hover": onOpenUserCard ? { bgcolor: (t) => alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.10 : 0.04) } : {},
                    }}
                >
                    <Avatar
                        src={avatarSrc || undefined}
                        sx={(t) => ({
                            width: 44, height: 44, flexShrink: 0,
                            border: `2px solid ${alpha(t.palette.text.primary, 0.06)}`,
                            '& .MuiAvatar-img': { objectFit: 'cover', transform: 'scale(1.15)' },
                            bgcolor: alpha(t.palette.primary.main, 0.08),
                            color: t.palette.primary.main,
                        })}
                        imgProps={{ referrerPolicy: "no-referrer" }}
                    >
                        {isBusiness ? <StorefrontOutlinedIcon sx={{ fontSize: 24 }} />
                            : isArtist ? <MusicNoteRoundedIcon sx={{ fontSize: 22 }} />
                                : <PersonRoundedIcon sx={{ fontSize: 24 }} />}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography noWrap sx={{ fontWeight: 800, fontSize: "0.88rem", lineHeight: 1.3 }}>
                            {headerName}
                        </Typography>
                        {isBusiness && companyName && companyName !== posterName ? (
                            <Typography noWrap variant="caption" sx={{ color: "text.secondary", lineHeight: 1.3 }}>
                                {companyName}
                            </Typography>
                        ) : null}
                        {posterHandle ? (
                            <Typography noWrap variant="caption" sx={{ color: "text.secondary", fontWeight: 600, lineHeight: 1.3 }}>
                                @{posterHandle}
                            </Typography>
                        ) : null}
                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.1 }}>
                            {timeAgoCompact(createdAt)}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Title */}
            <Box sx={{ px: 2, pt: 1 }}>
                <Typography sx={{
                    fontWeight: 850, fontSize: "1.0rem", lineHeight: 1.25,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    wordBreak: "break-word", overflowWrap: "anywhere",
                }}>
                    {title}
                </Typography>
            </Box>

            {/* Pay badge */}
            {pay ? (
                <Box sx={{ px: 2, pt: 0.5 }}>
                    <Box sx={(t) => ({
                        display: "inline-flex", alignItems: "center", gap: 0,
                        px: 0.75, py: 0.2,
                        borderRadius: 999, bgcolor: alpha(t.palette.success.main, 0.08),
                        border: "1px solid", borderColor: alpha(t.palette.success.main, 0.2),
                    })}>
                        <Typography variant="body2" sx={{ fontWeight: 900, color: "success.dark", fontSize: 12.5, lineHeight: 1 }}>
                            ${"\u00A0"}{pay.replace(/^\$\s*/, "")}
                        </Typography>
                    </Box>
                </Box>
            ) : null}

            {/* Chips: category, job type, work mode */}
            {(catInfo || jobTypeLabel || workMode) ? (
                <Box sx={{ px: 2, pt: 0.6, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {catInfo ? (
                        <Chip
                            size="small"
                            icon={CatIcon ? <CatIcon sx={{ fontSize: 13 }} /> : undefined}
                            label={catInfo.name}
                            sx={chipSx}
                        />
                    ) : null}
                    {jobTypeLabel ? (
                        <Chip size="small" label={jobTypeLabel} sx={chipSx} />
                    ) : null}
                    {workMode ? (
                        <Chip size="small" label={workMode} sx={chipSx} />
                    ) : null}
                </Box>
            ) : null}

            {/* Footer row: location only — pinned to bottom */}
            <Box sx={{
                px: 2, pt: 0.6, pb: isMobile ? 0.5 : 1.5, mt: "auto",
                display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1,
            }}>
                {locationLabel ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, flexShrink: 0 }}>
                        <LocationOnRoundedIcon sx={{ fontSize: 14, color: "primary.main" }} />
                        <Typography noWrap sx={{ fontWeight: 700, fontSize: "0.73rem", color: "primary.main", maxWidth: 180 }}>
                            {locationLabel}
                        </Typography>
                    </Box>
                ) : null}
            </Box>

            {/* Mobile: "Tap to view details" hint (matching CommunityMapView) */}
            {isMobile && (
                <Box
                    onClick={(e) => {
                        e.stopPropagation();
                        handleClick();
                    }}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.75,
                        px: 1.25,
                        py: 1,
                        borderTop: "1px solid",
                        borderColor: "divider",
                        bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                        cursor: "pointer",
                        "&:active": { bgcolor: (t) => alpha(t.palette.primary.main, 0.10) },
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "primary.main",
                            letterSpacing: "0.01em",
                        }}
                    >
                        Tap to view details
                    </Typography>
                    <ChevronRightRoundedIcon sx={{ fontSize: 16, color: "primary.main" }} />
                </Box>
            )}
        </Box>
    );
}

/* ════════════════════════════════════════════
   JobsMapView component
   ════════════════════════════════════════════ */
// Hoisted outside the component so the default reference is stable across renders.
const EMPTY_JOBS = [];

export default function JobsMapView({
                                        jobs = EMPTY_JOBS,
                                        onSelectJob,
                                        selectedJobId,
                                        focusJobId,
                                        focusStatewide,
                                        onFocusJobHandled,
                                        onReport,
                                        onEdit,
                                        onDelete,
                                        user,
                                        activeAccount,
                                        center: centerProp,
                                        zoomLevel: zoomLevelProp,
                                    }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isDarkMode = theme.palette.mode === 'dark';
    const tileUrlNoLabels = isDarkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png';
    const cityList = useMemo(() => normalizeCityFeatures(alabamaCities), []);
    const mapRef = useRef(null);
    const markerRefs = useRef({});
    const [activeIdxByGroup, setActiveIdxByGroup] = useState({});
    const [openedJobId, setOpenedJobId] = useState(null);
    const [center, setCenter] = useState(centerProp || DEFAULT_CENTER);
    const [zoomLevel, setZoomLevel] = useState(zoomLevelProp || DEFAULT_ZOOM);
    const [hoveredJobId, setHoveredJobId] = useState(null);
    const [userCardAnchorEl, setUserCardAnchorEl] = useState(null);
    const [userCardUser, setUserCardUser] = useState(null);

    // Sync parent-driven center/zoom (radius filter changes) into internal state
    useEffect(() => {
        if (centerProp) setCenter(centerProp);
    }, [centerProp]);
    useEffect(() => {
        if (zoomLevelProp != null) setZoomLevel(zoomLevelProp);
    }, [zoomLevelProp]);

    // ── Menu action handlers ──
    // Use setTimeout so the Menu's MUI modal backdrop fully unmounts
    // before the parent opens its own dialog (prevents race-condition dismissal).

    // Built-in report dialog (matches the inline report dialog used across jobs pages)
    const [reportOpen, setReportOpen] = useState(false);
    const [reportJob, setReportJob] = useState(null);
    const [reportReason, setReportReason] = useState("");
    const [reportDetails, setReportDetails] = useState("");
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [reportSubmitted, setReportSubmitted] = useState(false);
    const reportOpenTsRef = useRef(0);

    const openReportDialog = (job) => {
        setReportJob(job);
        setReportReason("");
        setReportDetails("");
        setReportSubmitted(false);
        setReportSubmitting(false);
        setTimeout(() => {
            reportOpenTsRef.current = Date.now();
            setReportOpen(true);
        }, 200);
    };

    const closeReportDialog = () => {
        if (Date.now() - reportOpenTsRef.current < 400) return;
        reportOpenTsRef.current = 0;
        setReportOpen(false);
        setReportJob(null);
    };

    const submitReportToApi = async (reason, details) => {
        const jobId = reportJob?.id;
        if (!jobId) return;
        const urls = [
            `/api/jobs/${encodeURIComponent(jobId)}/report`,
            `/api/jobs/${encodeURIComponent(jobId)}/flag`,
        ];
        for (const url of urls) {
            try {
                const res = await fetch(url, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reason, details }),
                });
                if (res.ok) return;
            } catch { /* try next */ }
        }
    };

    const handleReport = (job) => {
        if (typeof onReport === "function") {
            setTimeout(() => onReport(job), 150);
        } else {
            openReportDialog(job);
        }
    };

    // ── Delete dialog (matches JobDetailPanel) ──
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTargetJob, setDeleteTargetJob] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);
    const deleteOpenTsRef = useRef(0);

    // ── Edit modal (uses CreateJobModal in edit mode, same as JobCard's parent) ──
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const editOpenTsRef = useRef(0);

    const handleEdit = (job) => {
        if (typeof onEdit === "function") {
            setTimeout(() => onEdit(job), 150);
        } else {
            // Fallback: open CreateJobModal in edit mode
            setEditingJob(job);
            setTimeout(() => {
                editOpenTsRef.current = Date.now();
                setEditModalOpen(true);
            }, 200);
        }
    };

    const closeEditModal = () => {
        if (Date.now() - editOpenTsRef.current < 400) return;
        editOpenTsRef.current = 0;
        setEditModalOpen(false);
        setEditingJob(null);
    };

    const handleDelete = (job) => {
        if (typeof onDelete === "function") {
            setTimeout(() => onDelete(job), 150);
        } else {
            // Open self-contained delete confirmation dialog
            setDeleteTargetJob(job);
            setDeleteError(null);
            setIsDeleting(false);
            setTimeout(() => {
                deleteOpenTsRef.current = Date.now();
                setDeleteDialogOpen(true);
            }, 200);
        }
    };

    const closeDeleteDialog = () => {
        if (Date.now() - deleteOpenTsRef.current < 400) return;
        deleteOpenTsRef.current = 0;
        setDeleteDialogOpen(false);
        setDeleteTargetJob(null);
        setDeleteError(null);
    };

    const confirmDelete = async () => {
        if (!deleteTargetJob?.id || isDeleting) return;
        setIsDeleting(true);
        setDeleteError(null);
        try {
            await deleteJob(deleteTargetJob.id);
            deleteOpenTsRef.current = 0;
            setDeleteDialogOpen(false);
            setDeleteTargetJob(null);
            // Close the popup and refresh the map
            setOpenedJobId(null);
            window.dispatchEvent(new CustomEvent("ll:job:deleted", { detail: { jobId: deleteTargetJob.id } }));
            window.dispatchEvent(new CustomEvent("ll:jobs:refresh"));
        } catch (err) {
            setDeleteError(err);
            setIsDeleting(false);
        }
    };


    const handleOpenUserCard = (anchorEl, userData) => {
        setUserCardAnchorEl(anchorEl || null);
        setUserCardUser(userData || null);
    };

    const handleCloseUserCard = () => {
        setUserCardAnchorEl(null);
        setUserCardUser(null);
    };

    // Refs for hover bounce animation
    const animRef = useRef(null);
    const iconElRef = useRef(null);

    // Build list of jobs that have coordinates
    const jobsWithCoords = useMemo(() => {
        return (Array.isArray(jobs) ? jobs : []).filter((j) => {
            const lat = Number(j?.latitude);
            const lng = Number(j?.longitude);
            return Number.isFinite(lat) && Number.isFinite(lng);
        });
    }, [jobs]);

    // Group jobs by coordinate key
    const coordGroups = useMemo(() => {
        const out = {};
        jobsWithCoords.forEach((j) => {
            const lat = Number(j.latitude);
            const lng = Number(j.longitude);
            const coordKey = `${lat.toFixed(6)}_${lng.toFixed(6)}`;
            const id = j.id;
            if (id == null) return;
            if (!out[coordKey]) out[coordKey] = { lat, lng, ids: [], jobMap: {} };
            out[coordKey].ids.push(id);
            out[coordKey].jobMap[id] = j;
        });
        return out;
    }, [jobsWithCoords]);

    const markerEntries = useMemo(() => {
        const entries = [];
        const currentZoom = mapRef?.current?.getZoom?.() ?? DEFAULT_ZOOM;
        Object.entries(coordGroups).forEach(([coordKey, group]) => {
            const position = offsetCoords([group.lat, group.lng], 0, 1, currentZoom);
            entries.push({ groupKey: coordKey, position, ids: group.ids, jobMap: group.jobMap });
        });
        return entries;
    }, [coordGroups]);

    // Lookup: jobId → groupKey + idx
    const idToGroup = useMemo(() => {
        const m = new Map();
        markerEntries.forEach(({ groupKey, ids }) => {
            ids.forEach((id, idx) => { m.set(String(id), { groupKey, idx }); });
        });
        return m;
    }, [markerEntries]);

    // Resolve the marker position for the currently opened popup
    const openedMarkerPosition = useMemo(() => {
        if (!openedJobId) return null;
        const openedKey = String(openedJobId);
        for (const { ids, position } of markerEntries) {
            for (const id of ids) {
                if (String(id) === openedKey) return position;
            }
        }
        return null;
    }, [openedJobId, markerEntries]);

    // Keep active index synced when selectedJobId changes externally
    useEffect(() => {
        if (!selectedJobId) return;
        const info = idToGroup.get(String(selectedJobId));
        if (!info) return;
        setActiveIdxByGroup((prev) => {
            if (prev[info.groupKey] === info.idx) return prev;
            return { ...prev, [info.groupKey]: info.idx };
        });
    }, [selectedJobId, idToGroup]);

    // Sync opened popup to selected + zoom to job position
    useEffect(() => {
        setOpenedJobId(selectedJobId ?? null);

        if (selectedJobId) {
            for (const { ids, position } of markerEntries) {
                const match = ids.some((id) => String(id) === String(selectedJobId));
                if (match) {
                    const lat = position[0];
                    const lng = position[1];
                    // Small offset for Recenter dedup busting; actual popup positioning
                    // is handled by Recenter's getNorthPanTarget (340px pixel offset)
                    setCenter([lat, lng]);
                    setZoomLevel(MARKER_CLICK_ZOOM);
                    break;
                }
            }
        }
    }, [selectedJobId, markerEntries]);

    // Open popup on the correct marker when openedJobId changes
    const lastOpenedRef = useRef(null);
    useEffect(() => {
        if (!openedJobId) { lastOpenedRef.current = null; return; }
        if (lastOpenedRef.current === String(openedJobId)) return;
        const marker = markerRefs.current[String(openedJobId)];
        if (!marker) return;
        try { marker.openPopup(); lastOpenedRef.current = String(openedJobId); } catch { /* noop */ }
    }, [openedJobId, markerEntries]);

    // Hover bounce animation
    useEffect(() => {
        if (animRef.current) {
            try { animRef.current.cancel?.(); } catch { /* noop */ }
            animRef.current = null;
        }
        if (iconElRef.current) {
            try { iconElRef.current.style.transform = ""; } catch { /* noop */ }
            iconElRef.current = null;
        }

        if (hoveredJobId != null) {
            const marker = markerRefs.current[String(hoveredJobId)];
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
    }, [hoveredJobId]);

    // Handler: popup dismissed — only clear if closing popup matches current
    const handlePopupClose = (closingId) => {
        setOpenedJobId((prev) => {
            if (closingId == null) return null;
            const closingStr = String(closingId);
            const prevStr = prev != null ? String(prev) : null;
            if (prevStr === closingStr) return null;
            return prev;
        });
    };

    // External focus: when a card's location is clicked, pan to the marker and open its popup
    useEffect(() => {
        if (!focusJobId) return;
        const idStr = String(focusJobId);
        const info = idToGroup.get(idStr);
        if (!info) {
            if (typeof onFocusJobHandled === "function") onFocusJobHandled();
            return;
        }
        setActiveIdxByGroup((prev) => ({ ...prev, [info.groupKey]: info.idx }));
        setOpenedJobId(focusJobId);

        // Pan to the marker
        const entry = markerEntries.find((e) => e.groupKey === info.groupKey);
        if (entry) {
            const lat = entry.position[0];
            const lng = entry.position[1];
            setCenter([lat, lng]);
            setZoomLevel(MARKER_CLICK_ZOOM);
        }
        if (typeof onFocusJobHandled === "function") onFocusJobHandled();
    }, [focusJobId, idToGroup, markerEntries, onFocusJobHandled]);

    // Statewide focus: zoom out to show the full state
    useEffect(() => {
        if (!focusStatewide) return;
        setOpenedJobId(null);
        setCenter(DEFAULT_CENTER);
        setZoomLevel(DEFAULT_ZOOM);
        if (typeof onFocusJobHandled === "function") onFocusJobHandled();
    }, [focusStatewide, onFocusJobHandled]);

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
                            boxShadow: `0 8px 18px ${alpha(t.palette.text.primary, 0.08)}`,
                            backdropFilter: "blur(6px)",
                            "& .MuiChip-icon": { fontSize: 16, color: t.palette.text.secondary },
                        })}
                    />
                </Box>

                {/* Empty state — no jobs with location pins */}
                {jobsWithCoords.length === 0 && (
                    <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 999, textAlign: "center", p: 3, pointerEvents: "none" }}>
                        <Box sx={(t) => ({
                            px: 3, py: 2.5, borderRadius: 2.5,
                            bgcolor: alpha(t.palette.background.paper, 0.92),
                            backdropFilter: "blur(8px)",
                            border: `1px solid ${t.palette.divider}`,
                            boxShadow: `0 8px 32px ${alpha(t.palette.mode === "dark" ? "#000" : t.palette.text.primary, t.palette.mode === "dark" ? 0.28 : 0.1)}`,
                        })}>
                            <WorkRoundedIcon sx={{ fontSize: 36, color: "text.disabled", mb: 1 }} />
                            <Typography sx={{ fontWeight: 700, fontSize: 14, color: "text.secondary" }}>No jobs with location pins</Typography>
                            <Typography sx={{ fontSize: 12, color: "text.disabled", mt: 0.5 }}>Jobs will appear here when employers add a map pin</Typography>
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
                            center={center}
                            zoomLevel={zoomLevel}
                            openedJobId={openedJobId}
                            markerPosition={openedMarkerPosition}
                        />

                        <PanOnPopupOpen
                            openedJobId={openedJobId}
                            markerRefs={markerRefs}
                        />

                        <ZoomDismissOnZoomOut
                            openedJobId={openedJobId}
                            onPopupClose={handlePopupClose}
                        />

                        <TileLayer key={`tile-${isDarkMode ? 'dark' : 'light'}`} url={tileUrlNoLabels} />

                        <GeoJSON
                            key={`counties-${isDarkMode ? 'd' : 'l'}`}
                            data={alabamaCounties}
                            onEachFeature={(feature, layer) => {
                                const name = feature?.properties?.NAME;
                                if (name) {
                                    layer.bindTooltip(String(name), {
                                        permanent: true,
                                        direction: "center",
                                        className: "ll-county-label",
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

                        {/* Job markers */}
                        {markerEntries.map(({ groupKey, position, ids, jobMap }) => {
                            const idx = activeIdxByGroup[groupKey] ?? 0;
                            const activeId = ids[idx];
                            const activeJob = jobMap[activeId];
                            const isOpen = openedJobId != null && String(openedJobId) === String(activeId);
                            const hasStack = ids.length > 1;

                            const isHovered = hoveredJobId != null && String(hoveredJobId) === String(activeId);
                            const isSelected = isOpen;
                            const icon = isHovered || isSelected ? jobDivIconGold : jobDivIcon;

                            const goPrev = (e) => {
                                e.stopPropagation();
                                const newIdx = Math.max(idx - 1, 0);
                                setActiveIdxByGroup((p) => ({ ...p, [groupKey]: newIdx }));
                                const nextId = ids[newIdx];
                                setOpenedJobId(nextId);
                            };

                            const goNext = (e) => {
                                e.stopPropagation();
                                const newIdx = Math.min(idx + 1, ids.length - 1);
                                setActiveIdxByGroup((p) => ({ ...p, [groupKey]: newIdx }));
                                const nextId = ids[newIdx];
                                setOpenedJobId(nextId);
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
                                            if (activeId != null) setHoveredJobId(String(activeId));
                                        },
                                        mouseout: () => {
                                            setHoveredJobId(null);
                                        },
                                        click: () => {
                                            setActiveIdxByGroup((p) => ({ ...p, [groupKey]: idx }));
                                            setOpenedJobId(activeId);
                                            setHoveredJobId(null);

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
                                            <Box sx={{ width: isMobile ? "min(320px, 85vw)" : "min(420px, calc(100vw - 40px))", maxWidth: "100%" }}>
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
                                                    {activeJob ? (
                                                        <JobPopupCard
                                                            job={activeJob}
                                                            onOpenJob={(j) => {
                                                                if (typeof onSelectJob === "function") onSelectJob(j);
                                                            }}
                                                            onOpenUserCard={handleOpenUserCard}
                                                            onReport={handleReport}
                                                            onEdit={handleEdit}
                                                            onDelete={handleDelete}
                                                            isMobile={isMobile}
                                                            user={user}
                                                            activeAccount={activeAccount}
                                                        />
                                                    ) : (
                                                        <Box sx={{ p: 1.25 }}>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Loading job…
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
                                                                boxShadow: (t) => `0 6px 14px ${alpha(t.palette.text.primary, 0.10)}`,
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
                                                                boxShadow: (t) => `0 6px 14px ${alpha(t.palette.text.primary, 0.10)}`,
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
                <UserCardPopover
                    anchorEl={userCardAnchorEl}
                    onClose={handleCloseUserCard}
                    user={userCardUser}
                />
                <Dialog
                    open={reportOpen}
                    onClose={(e, reason) => {
                        // While showing the confirmation, only allow close via the Done button
                        if (reportSubmitted) return;
                        closeReportDialog();
                    }}
                    maxWidth="xs"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 3 } }}
                >
                    {reportSubmitted ? (
                        <>
                            <DialogContent sx={{ pt: 4, pb: 1, textAlign: "center" }}>
                                <Box sx={{
                                    width: 56, height: 56, borderRadius: "50%",
                                    bgcolor: (t) => alpha(t.palette.success.main, 0.12),
                                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                                    mb: 2,
                                }}>
                                    <Box component="svg" viewBox="0 0 24 24" sx={{ width: 32, height: 32, color: "success.main" }}>
                                        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </Box>
                                </Box>
                                <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 1.5 }}>
                                    Thank you for your report
                                </Typography>
                                <Typography sx={{ fontSize: 14, color: "text.secondary", lineHeight: 1.6, maxWidth: 320, mx: "auto" }}>
                                    We take reports seriously and will review this job. If it violates our community guidelines, we&apos;ll take appropriate action.
                                </Typography>
                            </DialogContent>
                            <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    disableElevation
                                    onClick={() => { reportOpenTsRef.current = 0; setReportOpen(false); setReportJob(null); setReportSubmitted(false); }}
                                    sx={{
                                        fontWeight: 800,
                                        textTransform: "none",
                                        borderRadius: 2.5,
                                        py: 1.25,
                                        fontSize: 15,
                                        bgcolor: "text.primary",
                                        color: "background.paper",
                                        "&:hover": { bgcolor: "text.primary", opacity: 0.9 },
                                    }}
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
                                    Report job
                                </Box>
                                <IconButton size="small" onClick={() => { reportOpenTsRef.current = 0; setReportOpen(false); setReportJob(null); }} aria-label="Close">
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </DialogTitle>
                            <DialogContent sx={{ pt: 0, pb: 1 }}>
                                <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 2, lineHeight: 1.5 }}>
                                    Why are you reporting this job? Your report is anonymous.
                                </Typography>
                                <RadioGroup value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
                                    {[
                                        { value: "spam", label: "Spam or misleading" },
                                        { value: "inappropriate", label: "Inappropriate content" },
                                        { value: "scam", label: "Scam or fraud" },
                                        { value: "other", label: "Other" },
                                    ].map((opt) => (
                                        <FormControlLabel
                                            key={opt.value} value={opt.value}
                                            control={<Radio size="small" />}
                                            label={<Typography sx={{ fontSize: 14 }}>{opt.label}</Typography>}
                                            sx={{ mx: 0, py: 0.25, px: 1, borderRadius: 2, "&:hover": { bgcolor: "action.hover" } }}
                                        />
                                    ))}
                                </RadioGroup>
                                <TextField
                                    multiline minRows={3} maxRows={6} fullWidth
                                    placeholder="Add any additional details that might help us review this report…"
                                    value={reportDetails}
                                    onChange={(e) => setReportDetails(e.target.value)}
                                    inputProps={{ maxLength: 1000 }}
                                    sx={{ mt: 2, "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 14 } }}
                                />
                                <Typography sx={{ fontSize: 11, color: "text.disabled", mt: 0.5, textAlign: "right" }}>
                                    {reportDetails.length}/1000
                                </Typography>
                            </DialogContent>
                            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                                <Button onClick={() => { reportOpenTsRef.current = 0; setReportOpen(false); setReportJob(null); }} sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2, color: "text.secondary" }}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={async () => {
                                        setReportSubmitting(true);
                                        await submitReportToApi(reportReason, reportDetails);
                                        setReportSubmitting(false);
                                        setReportSubmitted(true);
                                    }}
                                    variant="contained" disableElevation
                                    disabled={!reportReason || reportSubmitting}
                                    startIcon={reportSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
                                    sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2, px: 3 }}
                                >
                                    Submit report
                                </Button>
                            </DialogActions>
                        </>
                    )}
                </Dialog>

                {/* Delete confirmation dialog (matches JobDetailPanel) */}
                <Dialog
                    open={deleteDialogOpen}
                    onClose={(e, reason) => {
                        if (isDeleting) return;
                        closeDeleteDialog();
                    }}
                    maxWidth="xs"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 3 } }}
                >
                    <DialogTitle sx={{ pr: 6 }}>
                        <Typography sx={{ fontWeight: 950, fontSize: 16 }}>Delete Job</Typography>
                        <IconButton
                            aria-label="Close"
                            onClick={() => { deleteOpenTsRef.current = 0; setDeleteDialogOpen(false); setDeleteTargetJob(null); }}
                            disabled={isDeleting}
                            sx={{ position: "absolute", right: 12, top: 12 }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={2}>
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                Are you sure you want to delete &quot;{deleteTargetJob?.title}&quot;? This cannot be undone.
                            </Typography>
                            {deleteError && (
                                <Alert severity="error" sx={{ borderRadius: 2 }}>
                                    {deleteError.message || "Failed to delete."}
                                </Alert>
                            )}
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Button
                                    variant="outlined"
                                    onClick={() => { deleteOpenTsRef.current = 0; setDeleteDialogOpen(false); setDeleteTargetJob(null); }}
                                    disabled={isDeleting}
                                    sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                                >
                                    {isDeleting ? "Deleting…" : "Delete"}
                                </Button>
                            </Stack>
                        </Stack>
                    </DialogContent>
                </Dialog>

                {/* Edit job modal (same CreateJobModal used across the jobs page) */}
                <CreateJobModal
                    open={editModalOpen}
                    onClose={() => { editOpenTsRef.current = 0; setEditModalOpen(false); setEditingJob(null); }}
                    editingJob={editingJob}
                    onCreated={(updatedJob) => {
                        editOpenTsRef.current = 0;
                        setEditModalOpen(false);
                        setEditingJob(null);
                        window.dispatchEvent(new CustomEvent("ll:jobs:refresh"));
                    }}
                />
            </MapWrapper>
        </MapErrorBoundary>
    );
}

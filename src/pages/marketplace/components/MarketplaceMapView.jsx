// src/pages/marketplace/components/MarketplaceMapView.jsx
//
// Leaflet-based map view for marketplace listings.
// Mirrors EventsMapTab: Alabama mask, county/city labels, PNG markers,
// hover bounce, popup cards, zoom-dismiss, north-pan, de-stacking.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapErrorBoundary from "../../../components/MapErrorBoundary";
import PropTypes from "prop-types";
import {
    Avatar,
    Box,
    Chip,
    IconButton,
    Snackbar,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import { alpha, styled, useTheme } from "@mui/material/styles";
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../../../components/MapView.css";

import RoomOutlinedIcon from "@mui/icons-material/RoomOutlined";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

import ReportContentDialog from "../../../components/ReportContentDialog";
import DeleteListingConfirmDialog from "./DeleteListingConfirmDialog";
import { useAuth } from "../../../components/AuthModalContext";
import { useActiveAccount } from "../../../components/AccountContext";
import { getAccountHeaders } from "../../../utils/getAccountHeadersStatic";
import axios from "../../../api/axiosInstance";

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
    MARKER_CLICK_OFFSET_PX,
    RECENTER_OFFSET_PX,
    isStatewideCenter,
    computeBoundsWithPad,
    createAlabamaMask,
} from "../../../utils/MapUtils";

import { BRAND } from "../../../themes";

/* ── SVG-based marketplace markers (themed, no PNGs) ── */

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

const CART_ICON_PATH = 'M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 3c0 .55.45 1 1 1h1l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h11c.55 0 1-.45 1-1s-.45-1-1-1H7l1.1-2h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A.996.996 0 0 0 20.01 4H5.21l-.67-1.43a.993.993 0 0 0-.9-.57H2c-.55 0-1 .45-1 1zm16 15c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z';
const defaultIcon = makeSvgDivIcon(buildMarkerSvg(CART_ICON_PATH, BRAND_NAVY, BRAND_NAVY_DARK, BRAND_NAVY), "marketplace-div-icon");
const goldIcon = makeSvgDivIcon(buildMarkerSvg(CART_ICON_PATH, BRAND_CRIMSON, BRAND_CRIMSON_D, BRAND_CRIMSON), "marketplace-div-icon");

/* ─── Map constants ─── */
const RAW_BOUNDS = L.geoJSON(alabama.features[0]).getBounds();

/* ─── Styled wrapper (matches events theme) ─── */
const MapWrapper = styled(Box)(({ theme }) => ({
    position: "relative",
    width: "100%",
    height: "100%",
    "& .leaflet-container": {
        width: "100%",
        height: "100%",
        backgroundColor: theme.palette.background.default,
        backgroundImage: theme.palette.mode === 'dark' ? 'none' : `radial-gradient(900px 420px at 12% 8%, ${alpha(theme.palette.secondary.main, 0.06)} 0%, transparent 58%), radial-gradient(820px 420px at 92% 0%, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 62%)`,
    },
    "& .leaflet-control-attribution": { bottom: "32px !important", left: "50% !important", transform: "translateX(-50%)", textAlign: "center" },
    "& .leaflet-tooltip.ll-county-label": { background: "transparent", border: "none", boxShadow: "none", padding: 0, margin: 0, color: alpha(theme.palette.mode === "dark" ? "#000" : theme.palette.text.primary, theme.palette.mode === "dark" ? 0.5 : 0.34), fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" },
    "& .leaflet-tooltip.ll-county-label:before": { display: "none" },
    "& .ll-city-label": { background: "transparent", border: "none" },
    "& .ll-city-label span": { display: "inline-block", transform: "translate(-50%, -50%)", whiteSpace: "nowrap", color: alpha(theme.palette.text.primary, 0.38), fontSize: 10, fontWeight: 600, letterSpacing: "0.02em", textShadow: `0 1px 0 ${alpha(theme.palette.background.default, 0.85)}`, pointerEvents: "none" },
    "& .leaflet-popup": { marginBottom: 6 },
    "& .leaflet-popup-content-wrapper": { background: `${theme.palette.background.paper} !important`, color: `${theme.palette.text.primary} !important`, borderRadius: 18, padding: 0, overflow: "hidden", border: `1px solid ${theme.palette.divider}`, boxShadow: theme.palette.mode === 'dark' ? `0 16px 48px rgba(0,0,0,0.45)` : `0 16px 48px ${alpha(theme.palette.text.primary, 0.18)}` },
    "& .leaflet-popup-content": { margin: 0, width: "auto", lineHeight: 1.2 },
    "& .leaflet-popup-tip": { background: `${theme.palette.background.paper} !important`, border: `1px solid ${theme.palette.divider}`, boxShadow: theme.palette.mode === 'dark' ? `0 10px 28px rgba(0,0,0,0.35)` : `0 10px 28px ${alpha(theme.palette.text.primary, 0.12)}` },
    "& .leaflet-popup-close-button": { width: 28, height: 28, top: 10, right: 10, borderRadius: 999, color: theme.palette.text.secondary, background: `${theme.palette.background.paper} !important`, border: `1px solid ${theme.palette.divider}`, boxShadow: theme.palette.mode === 'dark' ? `0 8px 18px rgba(0,0,0,0.30)` : `0 8px 18px ${alpha(theme.palette.text.primary, 0.14)}`, display: "flex", alignItems: "center", justifyContent: "center" },
    "& .leaflet-popup-close-button:hover": { color: theme.palette.text.primary, background: `${theme.palette.action.hover} !important` },
    "& .marketplace-div-icon": { background: "transparent", border: "none" },
}));

/* ─── Map helper components (same as events) ─── */
const RemovePrefix = () => { const map = useMap(); useEffect(() => { try { map?.attributionControl?.setPrefix?.(""); } catch {} }, [map]); return null; };

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

function CityLabels({ cities, minZoom, maxLabels }) {
    const map = useMap();
    const [visible, setVisible] = useState([]);
    useEffect(() => {
        if (!map) return undefined;
        const mz = minZoom || 9;
        const ml = maxLabels || 140;
        const update = () => {
            const z = map.getZoom();
            if (z < mz) { setVisible([]); return; }
            const b = map.getBounds();
            const next = [];
            for (const c of cities) { const [lat, lng] = c.coordinates; if (b.contains([lat, lng])) next.push(c); if (next.length >= ml) break; }
            setVisible(next);
        };
        update();
        map.on("zoomend", update);
        map.on("moveend", update);
        return () => { map.off("zoomend", update); map.off("moveend", update); };
    }, [map, cities, minZoom, maxLabels]);
    if (!visible.length) return null;
    return (<>{visible.map((c) => (<Marker key={`city-${c.name}`} position={c.coordinates} interactive={false} icon={L.divIcon({ className: "ll-city-label", html: `<span>${c.name}</span>`, iconSize: [0, 0] })} />))}</>);
}

function PlacesOutlines({ data, minZoom }) {
    const map = useMap();
    const theme = useTheme();
    const [show, setShow] = useState(false);
    useEffect(() => {
        if (!map) return undefined;
        const mz = minZoom || 9;
        const update = () => { try { setShow(map.getZoom() >= mz); } catch { setShow(false); } };
        update();
        map.on("zoomend", update);
        return () => { map.off("zoomend", update); };
    }, [map, minZoom]);
    if (!show) return null;
    return <GeoJSON data={data} style={{ color: alpha(theme.palette.text.primary, 0.12), weight: 1, fillOpacity: 0 }} />;
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

const BoundsController = ({ bounds }) => { const map = useMap(); useEffect(() => { try { map?.setMaxBounds?.(bounds); } catch {} }, [map, bounds]); return null; };

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

const Recenter = ({ center, zoomLevel, openedPopupId, markerPosition }) => {
    const map = useMap();
    const lastKeyRef = useRef(null);
    useEffect(() => {
        if (!map || !center?.length) return;

        const isStatewide = isStatewideCenter(center);
        const ez = isStatewide ? DEFAULT_ZOOM : (zoomLevel ?? MARKER_CLICK_ZOOM);
        const ec = isStatewide ? DEFAULT_CENTER : center;

        const posKey = markerPosition ? `${markerPosition[0].toFixed(5)},${markerPosition[1].toFixed(5)}` : '';
        const key = `${ec[0].toFixed(5)},${ec[1].toFixed(5)}|${ez.toFixed(1)}|${posKey}`;
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
                try { map.setView(ec, ez, { animate: false }); } catch { /* noop */ }
                return;
            }

            try {
                if (isStatewide) {
                    map.flyToBounds(RAW_BOUNDS, { padding: [20, 12], maxZoom: DEFAULT_ZOOM });
                } else {
                    const currentZoom = map.getZoom();
                    const alreadyAtZoom = Math.abs(currentZoom - ez) < 0.5;

                    if (openedPopupId && markerPosition) {
                        const ml = L.latLng(markerPosition[0], markerPosition[1]);
                        const pt = getNorthPanTarget(map, ml, RECENTER_OFFSET_PX, ez);
                        if (alreadyAtZoom) {
                            map.panTo([pt.lat, pt.lng], { animate: true, duration: PAN_TO_DURATION });
                        } else {
                            map.flyTo([pt.lat, pt.lng], ez, { animate: true, duration: FLY_TO_DURATION });
                        }
                    } else {
                        if (alreadyAtZoom) {
                            map.panTo(ec, { animate: true, duration: PAN_TO_DURATION });
                        } else {
                            map.flyTo(ec, ez, { animate: true, duration: FLY_TO_DURATION });
                        }
                    }
                }
            } catch {}
        };

        doRecenter();

        return () => { if (retryTimer) clearTimeout(retryTimer); };
    }, [map, center, zoomLevel, openedPopupId, markerPosition]);
    return null;
};

const PanOnPopupOpen = ({ openedPopupId, markerRefs }) => {
    const map = useMap();
    const lastRef = useRef(null);
    const lastPannedPosRef = useRef(null);
    useEffect(() => {
        if (!map || !openedPopupId) { lastRef.current = null; lastPannedPosRef.current = null; return; }
        if (lastRef.current === String(openedPopupId)) return;

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
                return;
            }
            try {
                const marker = markerRefs?.current?.[String(openedPopupId)];
                if (!marker) return;
                const ll = marker.getLatLng();
                if (!ll) return;
                const prev = lastPannedPosRef.current;
                if (prev && Math.abs(prev.lat - ll.lat) < 0.00001 && Math.abs(prev.lng - ll.lng) < 0.00001) {
                    lastRef.current = String(openedPopupId);
                    return;
                }
                const pt = getNorthPanTarget(map, ll, RECENTER_OFFSET_PX);
                map.panTo(pt, { animate: true, duration: PAN_TO_DURATION });
                lastRef.current = String(openedPopupId);
                lastPannedPosRef.current = ll;
            } catch {}
        };

        const tid = setTimeout(doPan, 500);
        return () => { clearTimeout(tid); if (retryTimer) clearTimeout(retryTimer); };
    }, [map, openedPopupId, markerRefs]);
    return null;
};

const ZoomDismissOnZoomOut = ({ openedPopupId, onPopupClose, maxZoomOutSteps }) => {
    const map = useMap();
    const openedRef = useRef(null);
    const lastZRef = useRef(null);
    const stepsRef = useRef(0);
    const cbRef = useRef(onPopupClose);
    const maxSteps = maxZoomOutSteps ?? 2;
    useEffect(() => { cbRef.current = onPopupClose; }, [onPopupClose]);
    useEffect(() => { openedRef.current = openedPopupId != null ? String(openedPopupId) : null; stepsRef.current = 0; try { lastZRef.current = map?.getZoom?.(); } catch { lastZRef.current = null; } }, [openedPopupId, map]);
    useEffect(() => {
        if (!map) return undefined;
        const handler = () => {
            const opened = openedRef.current;
            let nz = null; try { nz = map.getZoom(); } catch { nz = null; }
            const lz = lastZRef.current;
            if (!opened) { lastZRef.current = nz; return; }
            if (typeof nz === "number" && typeof lz === "number" && nz < lz) { stepsRef.current += 1; if (stepsRef.current > maxSteps) { stepsRef.current = 0; openedRef.current = null; try { map.closePopup(); } catch {} if (typeof cbRef.current === "function") cbRef.current(opened); } }
            else if (typeof nz === "number" && typeof lz === "number" && nz > lz) { stepsRef.current = 0; }
            lastZRef.current = nz;
        };
        map.on("zoomend", handler);
        return () => { map.off("zoomend", handler); };
    }, [map, maxSteps]);
    return null;
};

/* ─── Listing display helpers ─── */
function formatPrice(priceCents, priceModel) {
    if (priceModel === "free") return "Free";
    if (priceModel === "trade") return "Trade Only";
    const c = Number.isFinite(Number(priceCents)) ? Number(priceCents) : 0;
    if (priceModel === "negotiable" && c === 0) return "Make Offer";
    const d = Math.round(c) / 100;
    const f = d.toLocaleString(undefined, { style: "currency", currency: "USD" });
    if (priceModel === "negotiable") return `${f} OBO`;
    return f;
}
function formatLocation(listing) {
    if (listing?.isStatewide) return "Statewide";
    const p = [];
    if (listing?.city) p.push(listing.city);
    if (listing?.county) p.push(`${listing.county} County`);
    return p.length ? p.join(", ") : "";
}
function timeAgo(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const ms = Date.now() - d.getTime();
    const min = Math.floor(ms / 60000);
    if (min < 1) return "Just now";
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const dy = Math.floor(hr / 24);
    if (dy < 7) return `${dy}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function getImageSrc(listing) {
    if (!listing) return null;
    if (listing.coverPhotoUrl) return listing.coverPhotoUrl;
    if (listing.photoUrl) return listing.photoUrl;
    const fp = Array.isArray(listing.photos) ? listing.photos[0] : null;
    if (fp) return typeof fp === "string" ? fp : fp?.url || null;
    return null;
}

/* ── Yard sale date/time display ── */
function parseStoredPipe(stored) { if (!stored) return ["", ""]; const r = String(stored); if (r.includes("|")) { const p = r.split("|"); return [p[0] || "", p[1] || ""]; } return [r, ""]; }
function fmtDateShort(ds) { if (!ds) return ""; const p = String(ds).split("-").map(Number); if (p.length !== 3) return ds; const dt = new Date(p[0], p[1] - 1, p[2]); if (Number.isNaN(dt.getTime())) return ds; return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); }
function fmtTimeShort(ts) { if (!ts) return ""; const [h, m] = String(ts).split(":").map(Number); if (!Number.isFinite(h) || !Number.isFinite(m)) return ts; const ap = h >= 12 ? "PM" : "AM"; const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h; return `${h12}:${String(m).padStart(2, "0")} ${ap}`; }
function formatYardSaleDateDisplay(storedDate, storedHours) {
    const [sD, eD] = parseStoredPipe(storedDate);
    const [sT, eT] = parseStoredPipe(storedHours);
    const dp = sD ? (eD && eD !== sD ? `${fmtDateShort(sD)} \u2013 ${fmtDateShort(eD)}` : fmtDateShort(sD)) : String(storedDate || "");
    const tp = sT ? (eT ? `${fmtTimeShort(sT)} \u2013 ${fmtTimeShort(eT)}` : fmtTimeShort(sT)) : String(storedHours || "");
    if (dp && tp) return `${dp} \u2022 ${tp}`;
    return dp || tp || "";
}

/* ─── PopupCard ─── */
function PopupCard({ listing, onSelect, onEdit, onDelete, onFlag, onMarkSold, onRelist, user }) {
    const theme = useTheme();
    const auth = useAuth();
    const { isBusinessAccount, isArtistAccount, activeAccount } = useActiveAccount();
    const viewer = user || auth?.user || null;

    // Ownership logic (matching ListingCard's useListingOwnership)
    const { isOwnerAnyAccount, needsAccountSwitch } = useMemo(() => {
        if (!viewer || !listing) return { isOwnerAnyAccount: false, needsAccountSwitch: false };
        const isNonPersonal = isBusinessAccount || isArtistAccount;
        const sellerHandle = String(listing?.sellerHandle || listing?.seller?.handle || "").toLowerCase().trim();
        const activeId = isNonPersonal
            ? String(activeAccount?.slug || activeAccount?.handle || "").toLowerCase().trim()
            : String(viewer?.handle || "").toLowerCase().trim();
        if (listing?.isOwner != null) {
            const bo = Boolean(listing.isOwner);
            if (isNonPersonal) {
                const isActive = Boolean(activeId && sellerHandle && activeId === sellerHandle);
                return { isOwnerAnyAccount: bo, needsAccountSwitch: bo && !isActive };
            }
            return { isOwnerAnyAccount: bo, needsAccountSwitch: false };
        }
        const isActive = Boolean(activeId && sellerHandle && activeId === sellerHandle);
        return { isOwnerAnyAccount: isActive, needsAccountSwitch: false };
    }, [viewer, listing, isBusinessAccount, isArtistAccount, activeAccount]);

    const [copyLinkToast, setCopyLinkToast] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const img = getImageSrc(listing);
    const price = formatPrice(listing?.priceCents, listing?.priceModel);
    const loc = formatLocation(listing);
    const posted = timeAgo(listing?.createdAt);
    const isSold = listing?.status === "sold";
    const isYS = listing?.category === "Yard Sales";
    const ysDate = isYS ? formatYardSaleDateDisplay(listing?.yardSaleDate, listing?.yardSaleHours) : "";

    const handleConfirmDelete = useCallback(async () => {
        setDeleteOpen(false);
        if (onDelete) { onDelete(listing); return; }
        // Fallback direct API delete
        try {
            await axios.delete(`/api/marketplace/listings/${listing?.id}`, { withCredentials: true, headers: { ...getAccountHeaders() } });
            try { window.dispatchEvent(new CustomEvent("ll:marketplace:refresh")); } catch { /* */ }
        } catch { /* silent */ }
    }, [listing, onDelete]);

    const tooltipSx = { fontSize: 11, fontWeight: 700 };

    return (
        <Box onClick={() => { if (document.querySelector('.MuiDialog-root, .MuiMenu-root, .MuiPopover-root')) return; onSelect?.(listing); }} sx={{ cursor: "pointer", width: { xs: 260, sm: 300 } }}>
            {img && (<Box component="img" src={img} alt={listing?.title || "Listing"} sx={{ width: "100%", height: 150, objectFit: "cover", display: "block", filter: isSold ? "grayscale(0.3) brightness(0.9)" : "none" }} />)}
            <Box sx={{ p: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 0.75, mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 14, lineHeight: 1.25, flex: 1, minWidth: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {listing?.title || "Untitled listing"}
                    </Typography>
                    {isSold && (<Chip label="SOLD" size="small" sx={{ height: 20, fontSize: 9, fontWeight: 950, color: "error.main", bgcolor: alpha(theme.palette.error.main, 0.08), flexShrink: 0 }} />)}
                </Box>
                {!isYS && (<Typography sx={{ fontWeight: 950, fontSize: 16, color: isSold ? "text.disabled" : "success.dark", textDecoration: isSold ? "line-through" : "none", mb: 0.5 }}>{price}</Typography>)}
                {isYS && ysDate && (<Stack direction="row" spacing={0.4} alignItems="center" sx={{ mb: 0.5 }}><EventRoundedIcon sx={{ fontSize: 12, color: "secondary.main" }} /><Typography sx={{ fontSize: 11, fontWeight: 700, color: "secondary.main" }}>{ysDate}</Typography></Stack>)}
                {isYS && listing?.yardSaleAddress ? (
                    <Stack direction="row" spacing={0.4} alignItems="center" sx={{ mb: 0.5 }}><LocationOnRoundedIcon sx={{ fontSize: 12, color: "success.dark" }} /><Typography sx={{ fontSize: 11, fontWeight: 700, color: "success.dark" }}>{listing.yardSaleAddress}{loc ? `, ${loc}` : ""}</Typography></Stack>
                ) : loc ? (
                    <Stack direction="row" spacing={0.4} alignItems="center" sx={{ mb: 0.5 }}><LocationOnRoundedIcon sx={{ fontSize: 12, color: "primary.main" }} /><Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary" }}>{loc}</Typography></Stack>
                ) : null}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.75 }}>
                    <Avatar src={listing?.sellerAvatarUrl || ""} alt={listing?.sellerName || ""} sx={{ width: 22, height: 22, fontSize: 9, fontWeight: 900 }}>{(listing?.sellerName || "U")[0]}</Avatar>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary", flex: 1, minWidth: 0 }}>{listing?.sellerName || "Unknown"}</Typography>
                    <Typography sx={{ fontSize: 10, fontWeight: 600, color: "text.disabled" }}>{posted}</Typography>
                </Box>
            </Box>

            <Snackbar open={copyLinkToast} autoHideDuration={2000} onClose={() => setCopyLinkToast(false)} message="Link copied to clipboard" anchorOrigin={{ vertical: "bottom", horizontal: "center" }} />

            <ReportContentDialog
                open={reportOpen}
                onClose={() => setReportOpen(false)}
                onSubmit={async ({ reason, details }) => {
                    try {
                        await axios.post(`/api/marketplace/listings/${listing?.id}/report`, { reason, details }, { withCredentials: true, headers: { ...getAccountHeaders() } });
                    } catch { /* dialog handles success state */ }
                }}
                title="Report listing"
            />

            <DeleteListingConfirmDialog
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
                listingTitle={listing?.title || ""}
            />
        </Box>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   MarketplaceMapView
   ═══════════════════════════════════════════════════════════════════ */
export default function MarketplaceMapView({ items, isLoading, onSelectListing, selectedListingId, focusListingId, onFocusListingHandled, hoveredCardId, onEdit, onDelete, onFlag, onMarkSold, onRelist, user, center: centerProp, zoomLevel: zoomLevelProp }) {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const tileUrl = isDarkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png';
    const mapRefLocal = useRef(null);
    const cityList = useMemo(() => normalizeCityFeatures(alabamaCities), []);

    const listingById = useMemo(() => {
        const m = new Map();
        (Array.isArray(items) ? items : []).forEach((it) => { if (it?.id != null) m.set(String(it.id), it); });
        return m;
    }, [items]);

    const normalizedData = useMemo(() => {
        const arr = Array.isArray(items) ? items : [];
        const features = arr
            .filter((it) => Number.isFinite(Number(it?.latitude)) && Number.isFinite(Number(it?.longitude)) && (Number(it.latitude) !== 0 || Number(it.longitude) !== 0))
            .map((it) => ({ type: "Feature", geometry: { type: "Point", coordinates: [Number(it.longitude), Number(it.latitude)] }, properties: { id: String(it.id) } }));
        return { type: "FeatureCollection", features };
    }, [items]);

    const unmappableCount = (Array.isArray(items) ? items.length : 0) - normalizedData.features.length;

    const markerRefs = useRef({});
    const [activeIdxByGroup, setActiveIdxByGroup] = useState({});
    const animRef = useRef(null);
    const iconElRef = useRef(null);
    const lastOpenedKeyRef = useRef(null);

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

    const effectiveHoveredId = hoveredCardId != null ? String(hoveredCardId) : hoveredMarkerIdLocal;

    useEffect(() => { setSelectedMarkerIdLocal(openedPopupId != null ? String(openedPopupId) : null); }, [openedPopupId]);

    // Hover bounce (same as events)
    useEffect(() => {
        if (animRef.current) { try { animRef.current.cancel?.(); } catch {} animRef.current = null; }
        if (iconElRef.current) { try { iconElRef.current.style.transform = ""; } catch {} iconElRef.current = null; }
        if (effectiveHoveredId != null) {
            const marker = markerRefs.current[String(effectiveHoveredId)];
            const img = marker?.getElement()?.querySelector(".marker-icon");
            if (img) { iconElRef.current = img; img.style.transformOrigin = "50% 100%"; animRef.current = img.animate([{ transform: "translateY(0)" }, { transform: "translateY(-15px)" }], { duration: 600, iterations: Infinity, easing: "ease-in-out", direction: "alternate" }); }
        }
        return () => { if (animRef.current) { try { animRef.current.cancel?.(); } catch {} animRef.current = null; } if (iconElRef.current) { try { iconElRef.current.style.transform = ""; } catch {} iconElRef.current = null; } };
    }, [effectiveHoveredId]);

    // Group by coordinate
    const coordGroups = useMemo(() => {
        const out = {};
        (normalizedData.features || []).forEach((f) => { const c = f?.geometry?.coordinates; if (!Array.isArray(c) || c.length < 2) return; const [lng, lat] = c; if (!Number.isFinite(lat) || !Number.isFinite(lng)) return; const k = `${lat.toFixed(6)}_${lng.toFixed(6)}`; const id = String(f?.properties?.id || ""); if (!id) return; (out[k] ||= []).push(id); });
        return out;
    }, [normalizedData]);

    const markerEntries = useMemo(() => {
        const entries = [];
        const cz = mapRefLocal?.current?.getZoom?.() ?? DEFAULT_ZOOM;
        Object.entries(coordGroups).forEach(([ck, ids]) => { const fid = ids?.[0]; if (!fid) return; const feat = (normalizedData.features || []).find((ff) => String(ff?.properties?.id) === String(fid)); if (!feat) return; const co = feat?.geometry?.coordinates; if (!Array.isArray(co) || co.length < 2) return; const [lng, lat] = co; const pos = offsetCoords([lat, lng], 0, 1, cz); entries.push({ groupKey: ck, position: pos, ids }); });
        return entries;
    }, [coordGroups, normalizedData]);

    const idToGroupIndex = useMemo(() => { const m = new Map(); markerEntries.forEach(({ groupKey, ids }) => { (ids || []).forEach((id, idx) => { m.set(String(id), { groupKey, idx }); }); }); return m; }, [markerEntries]);

    useEffect(() => { if (!openedPopupId) return; const info = idToGroupIndex.get(String(openedPopupId)); if (!info) return; setActiveIdxByGroup((prev) => { if (prev?.[info.groupKey] === info.idx) return prev; return { ...prev, [info.groupKey]: info.idx }; }); }, [openedPopupId, idToGroupIndex]);

    const openReady = useMemo(() => { if (!openedPopupId) return null; const ok = String(openedPopupId); for (const { groupKey, ids } of markerEntries) { const idx = activeIdxByGroup[groupKey] ?? 0; const a = ids?.[idx]; if (a && String(a) === ok) return { key: ok, groupKey }; } return null; }, [openedPopupId, markerEntries, activeIdxByGroup]);

    useEffect(() => { if (!openReady) { if (openedPopupId == null) lastOpenedKeyRef.current = null; return; } if (lastOpenedKeyRef.current === openReady.key) return; const marker = markerRefs.current[openReady.key]; if (!marker) return; try { marker.openPopup(); lastOpenedKeyRef.current = openReady.key; } catch {} }, [openReady, openedPopupId]);

    const openedMarkerPosition = useMemo(() => { if (!openedPopupId) return null; const ok = String(openedPopupId); for (const { ids, position } of markerEntries) { for (const id of ids || []) { if (String(id) === ok) return position; } } return null; }, [openedPopupId, markerEntries]);

    const handlePopupClose = (id) => { if (id != null && selectedMarkerIdLocal != null && String(selectedMarkerIdLocal) === String(id)) { setSelectedMarkerIdLocal(null); } setOpenedPopupId(null); };

    // External focus (from card address click)
    useEffect(() => {
        if (!focusListingId) return;
        const idStr = String(focusListingId);
        const info = idToGroupIndex.get(idStr);
        if (!info) { if (typeof onFocusListingHandled === "function") onFocusListingHandled(); return; }
        setActiveIdxByGroup((prev) => ({ ...prev, [info.groupKey]: info.idx }));
        setSelectedMarkerIdLocal(idStr);
        setOpenedPopupId(idStr);
        const entry = markerEntries.find((e) => e.groupKey === info.groupKey);
        if (entry) { const lat = entry.position[0]; const lng = entry.position[1]; setMapCenter([lat, lng]); setMapZoom(MARKER_CLICK_ZOOM); }
        if (typeof onFocusListingHandled === "function") onFocusListingHandled();
    }, [focusListingId, idToGroupIndex, markerEntries, onFocusListingHandled]);

    const maxBounds = useMemo(() => computeBoundsWithPad(RAW_BOUNDS, DEFAULT_BOUNDS_PAD), []);
    const primaryMain = theme.palette.primary.main;

    return (
        <MapErrorBoundary>
            <MapWrapper>
                {/* Approximate location chip + OSM attribution */}
                <Box sx={{ position: "absolute", bottom: unmappableCount > 0 ? 44 : 12, right: 12, zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
                    <Chip label="Pins show approximate area (city/county)" size="small" icon={<RoomOutlinedIcon />} sx={(t) => ({ backgroundColor: alpha(t.palette.background.paper, 0.78), color: t.palette.text.secondary, fontSize: 11, fontWeight: 600, height: 22, borderRadius: 999, border: `1px solid ${alpha(t.palette.divider, 0.55)}`, boxShadow: `0 8px 18px ${alpha(t.palette.mode === "dark" ? "#000" : t.palette.text.primary, t.palette.mode === "dark" ? 0.22 : 0.08)}`, backdropFilter: "blur(6px)", pointerEvents: "none", "& .MuiChip-icon": { fontSize: 16, color: t.palette.text.secondary } })} />
                    <Typography component="a" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" sx={(t) => ({ fontSize: 9.5, fontWeight: 600, color: alpha(t.palette.text.secondary, 0.6), textDecoration: "none", px: 0.75, py: 0.15, borderRadius: 1, bgcolor: alpha(t.palette.background.paper, 0.7), backdropFilter: "blur(4px)", "&:hover": { color: t.palette.primary.main, textDecoration: "underline" } })}>
                        © OpenStreetMap contributors
                    </Typography>
                </Box>

                {/* Unmappable listings note */}
                {unmappableCount > 0 && (
                    <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 1000, py: 0.75, px: 1.5, bgcolor: alpha(primaryMain, 0.06), borderTop: "1px solid", borderColor: "divider" }}>
                        <Typography sx={{ fontSize: 11, color: "text.secondary", textAlign: "center", fontWeight: 600 }}>
                            {unmappableCount} listing{unmappableCount !== 1 ? "s" : ""} without a location pin {unmappableCount === 1 ? "is" : "are"} not shown
                        </Typography>
                    </Box>
                )}

                {/* Empty state */}
                {normalizedData.features.length === 0 && (
                    <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 999, textAlign: "center", p: 3, pointerEvents: "none" }}>
                        <Box sx={{ px: 3, py: 2.5, borderRadius: 2.5, bgcolor: alpha(theme.palette.background.paper, 0.92), backdropFilter: "blur(8px)", border: `1px solid ${theme.palette.divider}`, boxShadow: `0 8px 32px ${alpha(theme.palette.mode === "dark" ? "#000" : theme.palette.text.primary, theme.palette.mode === "dark" ? 0.28 : 0.1)}` }}>
                            <StorefrontRoundedIcon sx={{ fontSize: 36, color: "text.disabled", mb: 1 }} />
                            <Typography sx={{ fontWeight: 700, fontSize: 14, color: "text.secondary" }}>No listings with location pins</Typography>
                            <Typography sx={{ fontSize: 12, color: "text.disabled", mt: 0.5 }}>Listings will appear here when sellers add a map pin</Typography>
                        </Box>
                    </Box>
                )}

                <div style={{ width: "100%", height: "100%" }}>
                    <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} whenCreated={(m) => { mapRefLocal.current = m; }} scrollWheelZoom wheelPxPerZoomLevel={WHEEL_PX_PER_ZOOM_LEVEL} minZoom={MIN_ZOOM} maxZoom={MAX_ZOOM} maxBounds={maxBounds} maxBoundsViscosity={1} zoomSnap={ZOOM_SNAP} zoomDelta={ZOOM_DELTA} doubleClickZoom={false} touchZoom={false} keyboard={false} zoomControl={false} attributionControl={false} closePopupOnClick={false} style={{ width: "100%", height: "100%" }}>
                        <RemovePrefix />
                        <TileLayer key={`tile-${isDarkMode ? 'dark' : 'light'}`} url={tileUrl} attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                        <BoundsController bounds={maxBounds} />
                        <MaskController />
                        <Recenter center={effectiveCenter} zoomLevel={effectiveZoom} openedPopupId={openedPopupId} markerPosition={openedMarkerPosition} />
                        <PanOnPopupOpen openedPopupId={openedPopupId} markerRefs={markerRefs} />
                        <ZoomDismissOnZoomOut openedPopupId={openedPopupId} onPopupClose={handlePopupClose} />

                        <GeoJSON key={`counties-${isDarkMode ? 'd' : 'l'}`} data={alabamaCounties} onEachFeature={(feature, layer) => { const name = feature?.properties?.NAME; if (name) layer.bindTooltip(String(name), { permanent: true, direction: "center", className: "ll-county-label", interactive: false }); }} style={{ color: alpha(theme.palette.text.primary, isDarkMode ? 0.18 : 0.10), weight: 1, fillColor: alpha(theme.palette.text.primary, isDarkMode ? 0.06 : 0.04), fillOpacity: 1 }} />
                        <GeoJSON key={`al-border-${isDarkMode ? 'd' : 'l'}`} data={alabama} style={{ color: alpha(theme.palette.text.primary, isDarkMode ? 0.35 : 0.24), weight: 2.5, fillOpacity: 0 }} />
                        <PlacesOutlines data={alabamaPlaces} minZoom={9} />
                        <CityLabels cities={cityList} minZoom={9} />

                        {markerEntries.map(({ groupKey, position, ids }) => {
                            const idx = activeIdxByGroup[groupKey] ?? 0;
                            const activeId = ids?.[idx];
                            const activeKey = activeId != null ? String(activeId) : null;
                            const openedKey = openedPopupId != null ? String(openedPopupId) : null;
                            const isOpen = !!openedKey && !!activeKey && openedKey === activeKey;
                            const isHovered = !!activeKey && effectiveHoveredId != null && String(effectiveHoveredId) === activeKey;
                            const isSelected = !!activeKey && (isOpen || (selectedMarkerIdLocal != null && String(selectedMarkerIdLocal) === activeKey));
                            const icon = (isHovered || isSelected) ? goldIcon : defaultIcon;
                            const activeListing = activeKey ? listingById.get(activeKey) : null;

                            return (
                                <Marker key={`marker-${groupKey}`} position={position} icon={icon} ref={(m) => { if (!m) return; (ids || []).forEach((id) => { markerRefs.current[String(id)] = m; }); }} eventHandlers={{ mouseover: () => { if (activeKey) setHoveredMarkerIdLocal(activeKey); }, mouseout: () => { setHoveredMarkerIdLocal(null); }, click: (e) => { if (activeId == null) return; setActiveIdxByGroup((p) => ({ ...p, [groupKey]: idx })); if (activeKey) setSelectedMarkerIdLocal(activeKey); setOpenedPopupId(activeKey); const lat = position[0]; const lng = position[1]; if (Number.isFinite(lat) && Number.isFinite(lng)) { setMapCenter([lat, lng]); setMapZoom(MARKER_CLICK_ZOOM); } } }}>
                                    {isOpen && (
                                        <Popup closeButton closeOnClick={false} autoPan={false} onClose={() => handlePopupClose(activeKey)} maxWidth={500}>
                                            {(() => {
                                                const hasStack = Array.isArray(ids) && ids.length > 1;
                                                const goPrev = (ev) => { ev.stopPropagation(); const ni = Math.max(idx - 1, 0); setActiveIdxByGroup((p) => ({ ...p, [groupKey]: ni })); const nid = ids[ni]; setOpenedPopupId(String(nid)); };
                                                const goNext = (ev) => { ev.stopPropagation(); const ni = Math.min(idx + 1, ids.length - 1); setActiveIdxByGroup((p) => ({ ...p, [groupKey]: ni })); const nid = ids[ni]; setOpenedPopupId(String(nid)); };
                                                return (
                                                    <Box>
                                                        <Box key={`content-${activeKey}`} sx={{ animation: hasStack ? "popupCardFadeIn 220ms cubic-bezier(.2,.8,.2,1) both" : "none", "@keyframes popupCardFadeIn": { "0%": { opacity: 0, transform: "translateY(4px)" }, "100%": { opacity: 1, transform: "translateY(0)" } } }}>
                                                            <PopupCard listing={activeListing} onSelect={onSelectListing} onEdit={onEdit} onDelete={onDelete} onFlag={onFlag} onMarkSold={onMarkSold} onRelist={onRelist} user={user} />
                                                        </Box>
                                                        {hasStack && (
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.25, py: 1, borderTop: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                                                                <IconButton size="small" onClick={goPrev} disabled={idx <= 0} sx={{ width: 32, height: 32, borderRadius: 999, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", boxShadow: (t) => `0 6px 14px ${alpha(t.palette.mode === "dark" ? "#000" : t.palette.text.primary, t.palette.mode === "dark" ? 0.28 : 0.1)}` }}><ChevronLeftRoundedIcon fontSize="small" /></IconButton>
                                                                <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}><Chip size="small" label={`${idx + 1}/${ids.length}`} sx={{ fontWeight: 800, borderRadius: 999, bgcolor: alpha(primaryMain, 0.10), border: "1px solid", borderColor: alpha(primaryMain, 0.25) }} /></Box>
                                                                <IconButton size="small" onClick={goNext} disabled={idx >= ids.length - 1} sx={{ width: 32, height: 32, borderRadius: 999, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", boxShadow: (t) => `0 6px 14px ${alpha(t.palette.mode === "dark" ? "#000" : t.palette.text.primary, t.palette.mode === "dark" ? 0.28 : 0.1)}` }}><ChevronRightRoundedIcon fontSize="small" /></IconButton>
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

MarketplaceMapView.propTypes = {
    items: PropTypes.array,
    isLoading: PropTypes.bool,
    onSelectListing: PropTypes.func,
    selectedListingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    focusListingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onFocusListingHandled: PropTypes.func,
    hoveredCardId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    onFlag: PropTypes.func,
    onMarkSold: PropTypes.func,
    onRelist: PropTypes.func,
    user: PropTypes.object,
};
MarketplaceMapView.defaultProps = { items: [], isLoading: false, onSelectListing: undefined, selectedListingId: null, focusListingId: null, onFocusListingHandled: undefined, hoveredCardId: null, onEdit: undefined, onDelete: undefined, onFlag: undefined, onMarkSold: undefined, onRelist: undefined, user: null };

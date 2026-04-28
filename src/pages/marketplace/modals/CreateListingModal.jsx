import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import ImageCropDialog from "../../../components/ImageCropDialog";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Checkbox,
    CircularProgress,
    ClickAwayListener,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    FormControlLabel,
    IconButton,
    InputAdornment,
    InputLabel,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Paper,
    Popper,
    Select,
    Stack,
    Step,
    StepLabel,
    Stepper,
    TextField,
    Slide,
    Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import AddPhotoAlternateRoundedIcon from "@mui/icons-material/AddPhotoAlternateRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import LocalMallRoundedIcon from "@mui/icons-material/LocalMallRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import CloseIcon from "@mui/icons-material/Close";
import axios from "../../../api/axiosInstance";
import { secureFetch } from "../../../utils/secureFetch";

// Category icons (match MarketplaceFilters)
import KitchenRoundedIcon from "@mui/icons-material/KitchenRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import ChildFriendlyRoundedIcon from "@mui/icons-material/ChildFriendlyRounded";
import PedalBikeRoundedIcon from "@mui/icons-material/PedalBikeRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import HikingRoundedIcon from "@mui/icons-material/HikingRounded";
import SmartphoneRoundedIcon from "@mui/icons-material/SmartphoneRounded";
import CheckroomRoundedIcon from "@mui/icons-material/CheckroomRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import LaptopRoundedIcon from "@mui/icons-material/LaptopRounded";
import DevicesRoundedIcon from "@mui/icons-material/DevicesRounded";
import YardRoundedIcon from "@mui/icons-material/YardRounded";
import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivismRounded";
import ChairRoundedIcon from "@mui/icons-material/ChairRounded";
import FaceRetouchingNaturalRoundedIcon from "@mui/icons-material/FaceRetouchingNaturalRounded";
import HandymanRoundedIcon from "@mui/icons-material/HandymanRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import DiamondRoundedIcon from "@mui/icons-material/DiamondRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import PetsRoundedIcon from "@mui/icons-material/PetsRounded";
import FitnessCenterRoundedIcon from "@mui/icons-material/FitnessCenterRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import SportsEsportsRoundedIcon from "@mui/icons-material/SportsEsportsRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";

import { createListing, updateListing } from "../api/marketplace";
import CityCountySelect from "../../../components/CityCountySelect";
import PhotosUploadSection from "../../../components/PhotosUploadSection";
import { useActiveAccount } from "../../../components/AccountContext";
import RichTextEditor from "../../../components/RichTextEditor";
import { stripHtml } from "../../../utils/richTextUtils";
import { checkFieldsProfanity } from '../../../utils/profanityCheck';
import { checkGeocodeRateLimit, recordGeocodeResult } from "../../../utils/geocodeRateLimit";

// Local GeoJSON data for resolving city/county → lat/lng (same data the events forms use)
import cityData from "../../../data/alabamaCities.json";
import countyData from "../../../data/alabamaCounties.json";

/* ── Coordinate helpers (copied from CreateEditEventModal) ── */
const stripCountySuffix = (s) => String(s || "").replace(/ County$/i, "").trim();

function getCoordinatesFromFeature(feature) {
    if (!feature?.geometry) return null;
    const { type, coordinates } = feature.geometry;

    if (type === "Point" && Array.isArray(coordinates) && coordinates.length >= 2) {
        const [lng, lat] = coordinates;
        if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
        return null;
    }

    const calcCentroid = (rings) => {
        let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
        for (const ring of rings) {
            if (!Array.isArray(ring)) continue;
            for (const pt of ring) {
                if (!Array.isArray(pt) || pt.length < 2) continue;
                const [pLng, pLat] = pt;
                if (!Number.isFinite(pLat) || !Number.isFinite(pLng)) continue;
                if (pLat < minLat) minLat = pLat;
                if (pLat > maxLat) maxLat = pLat;
                if (pLng < minLng) minLng = pLng;
                if (pLng > maxLng) maxLng = pLng;
            }
        }
        if (Number.isFinite(minLat) && Number.isFinite(maxLat)) {
            return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
        }
        return null;
    };

    if (type === "Polygon" && Array.isArray(coordinates)) return calcCentroid(coordinates);
    if (type === "MultiPolygon" && Array.isArray(coordinates)) {
        const flat = coordinates.flatMap((poly) => (Array.isArray(poly) ? poly : []));
        return calcCentroid(flat);
    }
    return null;
}

function resolveLocationCoords(city, county) {
    const cityFeatures = cityData?.features || (Array.isArray(cityData) ? cityData : []);
    const countyFeatures = countyData?.features || (Array.isArray(countyData) ? countyData : []);

    if (city) {
        const cityNorm = String(city).trim().toLowerCase();
        const hit = cityFeatures.find((f) => {
            const name = String(f?.properties?.NAME || f?.properties?.name || f?.name || "").trim().toLowerCase();
            return name === cityNorm;
        });
        if (hit) {
            const coords = getCoordinatesFromFeature(hit);
            if (coords) return coords;
        }
    }

    if (county) {
        const countyNorm = stripCountySuffix(county).toLowerCase();
        const hit = countyFeatures.find((f) => {
            const name = stripCountySuffix(f?.properties?.NAME || f?.properties?.name || f?.name || "").toLowerCase();
            return name === countyNorm;
        });
        if (hit) {
            const coords = getCoordinatesFromFeature(hit);
            if (coords) return coords;
        }
    }

    return null;
}

/* ── Constants (OUTSIDE component — prevents re-render / infinite loop) ── */

const MAX_PHOTOS = 8;
const ADDRESS_MAX = 255;
const ADDRESS_TYPING_DELAY = 1200; // ms to wait after user stops typing before validating address

const MENTION_RE_MATCH = /(?:^|\s)@([a-zA-Z0-9_]{1,30})$/;
const MENTION_EXTRACT_RE = /@([a-zA-Z0-9_]{1,30})/g;

const CATEGORIES = [
    { id: "Appliances", icon: KitchenRoundedIcon },
    { id: "Arts & Crafts", icon: PaletteRoundedIcon },
    { id: "Automotive", icon: DirectionsCarRoundedIcon },
    { id: "Baby & Kids", icon: ChildFriendlyRoundedIcon },
    { id: "Bikes & Scooters", icon: PedalBikeRoundedIcon },
    { id: "Books & Media", icon: MenuBookRoundedIcon },
    { id: "Camping & Outdoors", icon: HikingRoundedIcon },
    { id: "Cell Phones", icon: SmartphoneRoundedIcon },
    { id: "Clothing & Shoes", icon: CheckroomRoundedIcon },
    { id: "Collectibles", icon: EmojiEventsRoundedIcon },
    { id: "Computers & Tablets", icon: LaptopRoundedIcon },
    { id: "Electronics", icon: DevicesRoundedIcon },
    { id: "Farm & Garden", icon: YardRoundedIcon },
    { id: "Free Stuff", icon: VolunteerActivismRoundedIcon },
    { id: "Furniture", icon: ChairRoundedIcon },
    { id: "Health & Beauty", icon: FaceRetouchingNaturalRoundedIcon },
    { id: "Home Improvement", icon: HandymanRoundedIcon },
    { id: "Household", icon: HomeRoundedIcon },
    { id: "Jewelry & Accessories", icon: DiamondRoundedIcon },
    { id: "Musical Instruments", icon: MusicNoteRoundedIcon },
    { id: "Office Supplies", icon: BusinessCenterRoundedIcon },
    { id: "Pet Supplies", icon: PetsRoundedIcon },
    { id: "Sporting Goods", icon: FitnessCenterRoundedIcon },
    { id: "Tickets", icon: ConfirmationNumberRoundedIcon },
    { id: "Tools", icon: ConstructionRoundedIcon },
    { id: "Toys & Games", icon: SmartToyRoundedIcon },
    { id: "Video Games", icon: SportsEsportsRoundedIcon },
    { id: "Other", icon: CategoryRoundedIcon },
];

const CONDITIONS = ["New", "Like New", "Good", "Fair", "For parts"];

const STEP_LABELS = ["Guidelines", "Details", "Photos", "Location"];

const MARKETPLACE_RULES = [
    "Be honest and accurate in your listing description and photos.",
    "No illegal, stolen, recalled, or prohibited items.",
    "No weapons, drugs, tobacco, alcohol, or hazardous materials.",
    "Respect other users \u2014 no harassment, scams, or fraud.",
    "Meet in safe, public locations for exchanges.",
    "You are solely responsible for your transactions.",
    "Listings that violate these guidelines will be removed.",
];

/* ── Stable sx objects (defined OUTSIDE the component to prevent re-renders) ── */
const INPUT_SX = {
    "& .MuiOutlinedInput-root": { borderRadius: 2 },
};

const TEXTAREA_SX = {
    "& .MuiOutlinedInput-root": { borderRadius: 2 },
    "& textarea": { resize: "none" },
};

const ADDRESS_FIELD_NAME = "listing-addr-field";
const ADDRESS_FIELD_ID = "listing-addr-input";

const STEPPER_LABEL_SX = {
    "& .MuiStepLabel-label": { fontSize: 12, fontWeight: 700 },
};

const DIALOG_PAPER_CREATE_SX = {
    borderRadius: 3,
    height: "85vh",
    maxHeight: 780,
    display: "flex",
    flexDirection: "column",
};

const DIALOG_PAPER_EDIT_SX = {
    bgcolor: "background.paper",
    borderRadius: 3,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    height: { xs: "92vh", md: "88vh" },
    maxHeight: "95vh",
};

/* ─── @mention helpers ──────────────────────────────────────────── */

function getMentionMatch(text, cursorIndex) {
    const before = text.slice(0, cursorIndex);
    const m = MENTION_RE_MATCH.exec(before);
    if (!m) return null;
    return {
        query: m[1],
        start: m.index + (m[0][0] === " " || m[0][0] === "\n" ? 1 : 0),
        end: cursorIndex,
    };
}

function extractMentionHandles(text) {
    if (!text) return [];
    const handles = [];
    let match;
    while ((match = MENTION_EXTRACT_RE.exec(text)) !== null) {
        const h = match[1].toLowerCase();
        if (!handles.includes(h)) handles.push(h);
    }
    return handles;
}

function getMentionAnchorVirtualEl(textareaEl, caretIndex) {
    if (!textareaEl) return null;
    const mirror = document.createElement("div");
    const style = window.getComputedStyle(textareaEl);
    ["fontFamily", "fontSize", "fontWeight", "letterSpacing", "lineHeight",
        "paddingTop", "paddingLeft", "paddingRight", "borderWidth", "boxSizing",
        "whiteSpace", "wordWrap", "overflowWrap",
    ].forEach((p) => { mirror.style[p] = style[p]; });
    mirror.style.position = "absolute";
    mirror.style.left = "-9999px";
    mirror.style.top = "-9999px";
    mirror.style.width = `${textareaEl.clientWidth}px`;
    mirror.style.visibility = "hidden";
    mirror.textContent = textareaEl.value.slice(0, caretIndex);
    const span = document.createElement("span");
    span.textContent = "|";
    mirror.appendChild(span);
    document.body.appendChild(mirror);
    const spanRect = span.getBoundingClientRect();
    const taRect = textareaEl.getBoundingClientRect();
    const top = taRect.top + (spanRect.top - mirror.getBoundingClientRect().top) - textareaEl.scrollTop;
    const left = taRect.left + (spanRect.left - mirror.getBoundingClientRect().left);
    document.body.removeChild(mirror);
    return {
        getBoundingClientRect: () => ({ top, bottom: top + 20, left, right: left + 4, width: 4, height: 20, x: left, y: top }),
        contextElement: textareaEl,
    };
}

function MentionAccountBadge({ item }) {
    if (item.is_verified) return <VerifiedRoundedIcon sx={{ fontSize: 13, ml: 0.25, color: "primary.main" }} />;
    if (item.account_type === "business") return <StorefrontRoundedIcon sx={{ fontSize: 13, ml: 0.25, color: "text.secondary" }} />;
    if (item.account_type === "artist") return <MusicNoteRoundedIcon sx={{ fontSize: 13, ml: 0.25, color: "text.secondary" }} />;
    return null;
}

function MentionPopper({ open, anchorEl, results, activeIdx, loading, onSelect, onClose }) {
    return (
        <Popper open={open} anchorEl={anchorEl} placement="bottom-start" sx={{ zIndex: 1500 }} modifiers={[{ name: "offset", options: { offset: [0, 4] } }]}>
            <ClickAwayListener onClickAway={onClose}>
                <Paper elevation={6} sx={{ width: 280, maxHeight: 220, overflowY: "auto", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                    {loading && results.length === 0 ? (
                        <Box sx={{ p: 1.5 }}><Typography variant="caption" color="text.secondary">Searching…</Typography></Box>
                    ) : results.length === 0 ? (
                        <Box sx={{ p: 1.5 }}><Typography variant="caption" color="text.secondary">No users found</Typography></Box>
                    ) : (
                        <List dense disablePadding>
                            {results.map((u, i) => (
                                <ListItemButton key={u.id || i} selected={i === activeIdx} onClick={() => onSelect(u)} sx={{ px: 1.5, py: 0.6 }}>
                                    <Avatar src={u.avatar_url || ""} sx={{ width: 28, height: 28, mr: 1, fontSize: 13 }}>
                                        {(u.display_name || u.handle || "?")[0]}
                                    </Avatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                                <Typography sx={{ fontSize: 13, fontWeight: 700 }} noWrap>{u.display_name || u.handle}</Typography>
                                                <MentionAccountBadge item={u} />
                                            </Box>
                                        }
                                        secondary={<Typography sx={{ fontSize: 11.5, color: "text.secondary" }} noWrap>@{u.handle}</Typography>}
                                    />
                                </ListItemButton>
                            ))}
                        </List>
                    )}
                </Paper>
            </ClickAwayListener>
        </Popper>
    );
}

/* ─── End @mention helpers ──────────────────────────────────────── */

/* ─── Yard sale date/time helpers ─────────────────────────────── */

function todayDateValue() {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

function isBeforeToday(dateStr) {
    if (!dateStr) return false;
    const parts = String(dateStr).split("-").map(Number);
    if (parts.length !== 3) return false;
    const [y, m, d] = parts;
    if (!y || !m || !d) return false;
    const selected = new Date(y, m - 1, d);
    if (Number.isNaN(selected.getTime())) return false;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return selected.getTime() < today.getTime();
}

/** Returns an error string if the date is impossible (e.g., Feb 30), or "" if valid. */
function validateDateReal(dateStr) {
    if (!dateStr) return "";
    const parts = String(dateStr).split("-").map(Number);
    if (parts.length !== 3) return "Invalid date format.";
    const [y, m, d] = parts;
    if (!y || !m || !d) return "Invalid date.";
    if (m < 1 || m > 12) return "Invalid month.";
    if (d < 1 || d > 31) return "Invalid day.";
    const dt = new Date(y, m - 1, d);
    if (Number.isNaN(dt.getTime())) return "Invalid date.";
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
        return `${dt.toLocaleDateString("en-US", { month: "long" })} doesn\u2019t have ${d} days.`;
    }
    return "";
}

/** Format YYYY-MM-DD to "Saturday, March 15" */
function formatDateDisplay(dateStr) {
    if (!dateStr) return "";
    const parts = String(dateStr).split("-").map(Number);
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    const dt = new Date(y, m - 1, d);
    if (Number.isNaN(dt.getTime())) return dateStr;
    return dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

/** Format HH:MM to "7:00 AM" */
function formatTimeDisplay(timeStr) {
    if (!timeStr) return "";
    const [hRaw, mRaw] = String(timeStr).split(":").map(Number);
    if (!Number.isFinite(hRaw) || !Number.isFinite(mRaw)) return timeStr;
    const ampm = hRaw >= 12 ? "PM" : "AM";
    const h12 = hRaw === 0 ? 12 : hRaw > 12 ? hRaw - 12 : hRaw;
    return `${h12}:${String(mRaw).padStart(2, "0")} ${ampm}`;
}

/** Compose display date string from start/end dates */
function composeYardSaleDateDisplay(startDate, endDate) {
    if (!startDate) return "";
    const s = formatDateDisplay(startDate);
    if (!endDate || endDate === startDate) return s;
    const e = formatDateDisplay(endDate);
    return `${s} \u2013 ${e}`;
}

/** Compose display hours string from start/end times */
function composeYardSaleHoursDisplay(startTime, endTime) {
    if (!startTime) return "";
    const s = formatTimeDisplay(startTime);
    if (!endTime) return s;
    const e = formatTimeDisplay(endTime);
    return `${s} \u2013 ${e}`;
}

/** Parse stored "YYYY-MM-DD|YYYY-MM-DD" back to [start, end] */
function parseYardSaleDateStored(stored) {
    if (!stored) return ["", ""];
    const raw = String(stored);
    if (raw.includes("|")) {
        const parts = raw.split("|");
        return [parts[0] || "", parts[1] || ""];
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return [raw, ""];
    return [raw, ""];
}

/** Parse stored "HH:MM|HH:MM" back to [start, end] */
function parseYardSaleHoursStored(stored) {
    if (!stored) return ["", ""];
    const raw = String(stored);
    if (raw.includes("|")) {
        const parts = raw.split("|");
        return [parts[0] || "", parts[1] || ""];
    }
    return [raw, ""];
}

/* ─── End yard sale helpers ───────────────────────────────────── */

function makeId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const MAX_PRICE_CENTS = 99999999; // $999,999.99 — safe for INT column

function dollarsToCents(value) {
    const cleaned = String(value || "").replace(/[^0-9.]/g, "");
    if (!cleaned) return null;
    const n = Number(cleaned);
    if (!Number.isFinite(n) || n < 0) return null;
    const cents = Math.round(n * 100);
    if (cents > MAX_PRICE_CENTS) return null;
    return cents;
}

function centsToDollarsString(priceCents) {
    const cents = Number.isFinite(Number(priceCents)) ? Number(priceCents) : 0;
    const dollars = (cents / 100).toFixed(2);
    return dollars === "0.00" ? "" : dollars;
}

/**
 * Sanitize a price input value to only allow valid dollar amounts.
 * - Strips everything except digits and decimal point
 * - Only allows one decimal point
 * - Limits to 2 decimal places
 * - Caps at $999,999.99
 */
function sanitizePriceInput(raw) {
    // Strip non-digit, non-dot chars
    let val = String(raw || "").replace(/[^0-9.]/g, "");
    // Remove leading zeros (but keep "0." and "0")
    val = val.replace(/^0+(\d)/, "$1");
    // Only allow one decimal point
    const parts = val.split(".");
    if (parts.length > 2) {
        val = parts[0] + "." + parts.slice(1).join("");
    }
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
        val = parts[0] + "." + parts[1].slice(0, 2);
    }
    // Cap the whole-dollar portion to prevent overflow
    const wholePart = val.split(".")[0];
    if (wholePart.length > 6) {
        val = wholePart.slice(0, 6) + (val.includes(".") ? "." + (val.split(".")[1] || "") : "");
    }
    return val;
}

function buildInitialForm(listing) {
    if (!listing) {
        return {
            title: "",
            category: "",
            condition: "Good",
            priceModel: "fixed",
            priceDollars: "",
            description: "",
            meetupNotes: "",
            city: "",
            county: "",
            latitude: "",
            longitude: "",
            yardSaleStartDate: "",
            yardSaleEndDate: "",
            yardSaleStartTime: "",
            yardSaleEndTime: "",
            yardSaleAddress: "",
        };
    }
    const rawPm = listing.priceModel || listing.price_model || "";
    const pm = rawPm
        ? String(rawPm)
        : Number(listing.priceCents || listing.price_cents || 0) === 0
            ? "negotiable"
            : "fixed";

    const rawDate = listing.yardSaleDate || listing.yard_sale_date || "";
    const rawHours = listing.yardSaleHours || listing.yard_sale_hours || "";
    const [parsedStartDate, parsedEndDate] = parseYardSaleDateStored(rawDate);
    const [parsedStartTime, parsedEndTime] = parseYardSaleHoursStored(rawHours);

    return {
        title: String(listing.title || ""),
        category: String(listing.category || ""),
        condition: String(listing.condition || "Good"),
        priceModel: pm,
        priceDollars: pm === "fixed" ? centsToDollarsString(listing.priceCents || listing.price_cents) : "",
        description: String(listing.description || ""),
        meetupNotes: String(listing.meetupNotes || listing.meetup_notes || ""),
        city: String(listing.city || ""),
        county: String(listing.county || ""),
        latitude: listing.latitude != null ? String(listing.latitude) : "",
        longitude: listing.longitude != null ? String(listing.longitude) : "",
        yardSaleStartDate: parsedStartDate,
        yardSaleEndDate: parsedEndDate,
        yardSaleStartTime: parsedStartTime,
        yardSaleEndTime: parsedEndTime,
        yardSaleAddress: String(listing.yardSaleAddress || listing.yard_sale_address || ""),
    };
}

function buildInitialPhotos(listing) {
    if (!listing) return [];

    // 1) Try listing.photos — could be array of strings or array of { url, id, ... }
    let raw = Array.isArray(listing.photos) ? listing.photos : [];

    // 2) If photos array is empty, try to parse a JSON string (some APIs store it this way)
    if (raw.length === 0 && typeof listing.photos === "string" && listing.photos.trim()) {
        try {
            const parsed = JSON.parse(listing.photos);
            if (Array.isArray(parsed)) raw = parsed;
        } catch { /* not valid JSON */ }
    }

    // 3) Build from the photos array
    //    Shape must match what PhotosUploadSection expects:
    //    { id, url, preview?, file?, existing? }
    const results = raw
        .map((p) => {
            const url = typeof p === "string" ? p : (p?.url || p?.photo_url || "");
            if (!url) return null;
            return {
                id: p?.id ? String(p.id) : makeId(),
                url,
                preview: url,
                file: null,
                existing: true,
            };
        })
        .filter(Boolean);

    // 4) Fallback: if photos array was empty but we have a cover photo URL, use that
    if (results.length === 0) {
        const fallbackUrl =
            listing.coverPhotoUrl ||
            listing.cover_photo_url ||
            listing.photoUrl ||
            listing.photo_url ||
            "";
        if (fallbackUrl) {
            results.push({
                id: makeId(),
                url: fallbackUrl,
                preview: fallbackUrl,
                file: null,
                existing: true,
            });
        }
    }

    return results;
}

/* ===================================================================
   STEP COMPONENTS (used by CREATE mode stepper)
   =================================================================== */

/* ── Mobile fullscreen category picker (matches filter fullscreen pattern) ── */
const SlideUpTransition = React.forwardRef(function SlideUp(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

function MobileCategoryPicker({ open, onClose, categories, selectedCategory, onSelect }) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen
            TransitionComponent={SlideUpTransition}
            PaperProps={{ sx: { bgcolor: "background.paper", pt: 'env(safe-area-inset-top, 0px)' } }}
        >
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1, flexShrink: 0 }}>
                <IconButton edge="start" onClick={onClose} aria-label="close" sx={{ mr: 0.5 }}>
                    <ArrowBackRoundedIcon />
                </IconButton>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    Select a Category
                </Typography>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ p: 0 }}>
                <List disablePadding>
                    {categories.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = cat.id === selectedCategory;
                        return (
                            <ListItemButton
                                key={cat.id}
                                onClick={() => onSelect(cat.id)}
                                selected={isSelected}
                                sx={{
                                    py: 1.5,
                                    px: 2.5,
                                    ...(isSelected && {
                                        bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                                    }),
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    <Icon sx={{ fontSize: 22, color: "primary.main" }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary={cat.id}
                                    primaryTypographyProps={{
                                        fontSize: 15,
                                        fontWeight: isSelected ? 800 : 600,
                                    }}
                                />
                                {isSelected && (
                                    <CheckRoundedIcon sx={{ fontSize: 20, color: "primary.main" }} />
                                )}
                            </ListItemButton>
                        );
                    })}
                </List>
            </DialogContent>
        </Dialog>
    );
}

function StepGuidelines({ form, setForm, agreedToRules, setAgreedToRules, disabled, forceYardSale = false }) {
    const isYardSale = form.category === "Yard Sales";
    const _sgTheme = useTheme();
    const _sgMobile = useMediaQuery(_sgTheme.breakpoints.down("sm"));
    const [catPickerOpen, setCatPickerOpen] = useState(false);

    const handleCategoryChange = useCallback((val) => {
        setForm((p) => {
            const next = { ...p, category: val };
            if (val === "Yard Sales") {
                next.condition = "";
                next.priceModel = "negotiable";
                next.priceDollars = "";
            } else if (p.category === "Yard Sales") {
                if (!next.condition) next.condition = "Good";
                next.yardSaleStartDate = "";
                next.yardSaleEndDate = "";
                next.yardSaleStartTime = "";
                next.yardSaleEndTime = "";
                next.yardSaleAddress = "";
            }
            return next;
        });
    }, [setForm]);

    return (
        <Stack spacing={2.5}>
            {/* Rules card */}
            <Box
                sx={(t) => ({
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: alpha(t.palette.warning.main, 0.06),
                    border: "1px solid",
                    borderColor: alpha(t.palette.warning.main, 0.25),
                })}
            >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
                    <GavelRoundedIcon sx={{ fontSize: 20, color: "warning.dark" }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "warning.dark" }}>
                        Marketplace Guidelines
                    </Typography>
                </Stack>
                <Stack spacing={0.75}>
                    {MARKETPLACE_RULES.map((rule, i) => (
                        <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                            <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.5, minWidth: 16 }}>
                                {i + 1}.
                            </Typography>
                            <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.5 }}>
                                {rule}
                            </Typography>
                        </Stack>
                    ))}
                </Stack>
            </Box>

            <FormControlLabel
                control={
                    <Checkbox
                        checked={agreedToRules}
                        onChange={(e) => setAgreedToRules(e.target.checked)}
                        disabled={disabled}
                        sx={{ "& .MuiSvgIcon-root": { fontSize: 22 } }}
                    />
                }
                label={
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        I agree to follow these marketplace guidelines
                    </Typography>
                }
            />

            <Divider />

            {/* Category selector — hidden when forceYardSale is true */}
            {!forceYardSale && (
                <>
                    {_sgMobile ? (
                        /* ── Mobile: tappable field that opens fullscreen picker ── */
                        <>
                            <Box
                                onClick={() => { if (!disabled) setCatPickerOpen(true); }}
                                sx={(t) => ({
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.25,
                                    px: 1.75,
                                    py: 1.5,
                                    borderRadius: 2,
                                    border: "1px solid",
                                    borderColor: form.category
                                        ? alpha(t.palette.primary.main, 0.35)
                                        : "rgba(0,0,0,0.23)",
                                    bgcolor: form.category
                                        ? alpha(t.palette.primary.main, 0.04)
                                        : "transparent",
                                    cursor: disabled ? "default" : "pointer",
                                    opacity: disabled ? 0.5 : 1,
                                    transition: "border-color 0.2s, background-color 0.2s",
                                })}
                            >
                                {(() => {
                                    if (form.category) {
                                        const catObj = CATEGORIES.find((c) => c.id === form.category);
                                        const CatIcon = catObj?.icon || CategoryRoundedIcon;
                                        return <CatIcon sx={{ fontSize: 22, color: "primary.main" }} />;
                                    }
                                    return <CategoryRoundedIcon sx={{ fontSize: 22, color: "text.disabled" }} />;
                                })()}
                                <Typography
                                    variant="body1"
                                    sx={{
                                        flex: 1,
                                        fontWeight: form.category ? 700 : 400,
                                        color: form.category ? "text.primary" : "text.secondary",
                                    }}
                                >
                                    {form.category || "Select a category *"}
                                </Typography>
                                <ArrowForwardRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                            </Box>

                            <MobileCategoryPicker
                                open={catPickerOpen}
                                onClose={() => setCatPickerOpen(false)}
                                categories={CATEGORIES}
                                selectedCategory={form.category}
                                onSelect={(val) => {
                                    handleCategoryChange(val);
                                    setCatPickerOpen(false);
                                }}
                            />
                        </>
                    ) : (
                        /* ── Desktop: standard dropdown Select ── */
                        <FormControl fullWidth disabled={disabled}>
                            <InputLabel id="cl-category">Category *</InputLabel>
                            <Select
                                labelId="cl-category"
                                label="Category *"
                                value={form.category}
                                onChange={(e) => handleCategoryChange(String(e.target.value))}
                                sx={{ borderRadius: 2 }}
                                renderValue={(val) => {
                                    if (!val) return "Select a category";
                                    const catObj = CATEGORIES.find((c) => c.id === val);
                                    const CatIcon = catObj?.icon || CategoryRoundedIcon;
                                    return (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <CatIcon sx={{ fontSize: 20, color: "primary.main" }} />
                                            <span>{val}</span>
                                        </Box>
                                    );
                                }}
                                MenuProps={{ PaperProps: { sx: { maxHeight: 340 } } }}
                            >
                                {CATEGORIES.map((cat) => {
                                    const Icon = cat.icon;
                                    return (
                                        <MenuItem key={cat.id} value={cat.id}>
                                            <ListItemIcon sx={{ minWidth: 32 }}>
                                                <Icon sx={{ fontSize: 20, color: "primary.main" }} />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={cat.id}
                                                primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}
                                            />
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>
                    )}
                </>
            )}


        </Stack>
    );
}

function StepDetails({ form, setForm, disabled, fieldErrors, clearFieldError }) {
    const isYardSale = form.category === "Yard Sales";
    const minDate = todayDateValue();

    return (
        <Stack spacing={2.5}>
            <TextField
                label={isYardSale ? "Yard Sale Title *" : "Title *"}
                value={form.title}
                onChange={(e) => { setForm((p) => ({ ...p, title: e.target.value })); clearFieldError("title"); }}
                placeholder={
                    isYardSale
                        ? 'e.g., "Multi-family yard sale \u2014 furniture, toys, clothes & more"'
                        : 'e.g., "Barely-used KitchenAid mixer"'
                }
                fullWidth
                autoFocus
                disabled={disabled}
                error={Boolean(fieldErrors?.title)}
                helperText={fieldErrors?.title || ""}
                inputProps={{ maxLength: 120, autoComplete: "off" }}
                sx={INPUT_SX}
            />

            {/* -- Yard Sale: date & hours (NO pricing) -- */}
            {isYardSale ? (
                <Stack spacing={2}>
                    {/* Date section banner */}
                    <Box
                        sx={(t) => ({
                            display: "flex",
                            alignItems: "center",
                            gap: 1.25,
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: alpha(t.palette.info.main, 0.06),
                            border: "1px solid",
                            borderColor: alpha(t.palette.info.main, 0.18),
                        })}
                    >
                        <EventRoundedIcon sx={{ fontSize: 20, color: "info.main" }} />
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "text.secondary" }}>
                            When is your yard sale? Pick the date(s) and hours so buyers can plan ahead.
                        </Typography>
                    </Box>

                    {/* Start Date & End Date */}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <TextField
                            label="Start Date *"
                            type="date"
                            value={form.yardSaleStartDate}
                            onChange={(e) => { setForm((p) => ({ ...p, yardSaleStartDate: e.target.value })); clearFieldError("yardSaleStartDate"); }}
                            fullWidth
                            disabled={disabled}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ min: minDate }}
                            error={Boolean(fieldErrors?.yardSaleStartDate)}
                            helperText={fieldErrors?.yardSaleStartDate || ""}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EventRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={INPUT_SX}
                        />
                        <TextField
                            label="End Date (optional)"
                            type="date"
                            value={form.yardSaleEndDate}
                            onChange={(e) => { setForm((p) => ({ ...p, yardSaleEndDate: e.target.value })); clearFieldError("yardSaleEndDate"); }}
                            fullWidth
                            disabled={disabled}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ min: form.yardSaleStartDate || minDate }}
                            error={Boolean(fieldErrors?.yardSaleEndDate)}
                            helperText={fieldErrors?.yardSaleEndDate || "Leave blank for a single-day sale"}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EventRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={INPUT_SX}
                        />
                    </Stack>

                    {/* Start Time & End Time */}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <TextField
                            label="Start Time *"
                            type="time"
                            value={form.yardSaleStartTime}
                            onChange={(e) => { setForm((p) => ({ ...p, yardSaleStartTime: e.target.value })); clearFieldError("yardSaleStartTime"); }}
                            fullWidth
                            disabled={disabled}
                            InputLabelProps={{ shrink: true }}
                            error={Boolean(fieldErrors?.yardSaleStartTime)}
                            helperText={fieldErrors?.yardSaleStartTime || ""}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <AccessTimeRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={INPUT_SX}
                        />
                        <TextField
                            label="End Time *"
                            type="time"
                            value={form.yardSaleEndTime}
                            onChange={(e) => { setForm((p) => ({ ...p, yardSaleEndTime: e.target.value })); clearFieldError("yardSaleEndTime"); }}
                            fullWidth
                            disabled={disabled}
                            InputLabelProps={{ shrink: true }}
                            error={Boolean(fieldErrors?.yardSaleEndTime)}
                            helperText={fieldErrors?.yardSaleEndTime || ""}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <AccessTimeRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={INPUT_SX}
                        />
                    </Stack>

                    {/* Preview of formatted date/time */}
                    {form.yardSaleStartDate && form.yardSaleStartTime && !fieldErrors?.yardSaleStartDate && (
                        <Box
                            sx={(t) => ({
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                px: 1.5,
                                py: 1,
                                borderRadius: 2,
                                bgcolor: alpha(t.palette.success.main, 0.06),
                                border: "1px solid",
                                borderColor: alpha(t.palette.success.main, 0.15),
                            })}
                        >
                            <EventRoundedIcon sx={{ fontSize: 16, color: "success.dark" }} />
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "success.dark", fontSize: 13 }}>
                                {composeYardSaleDateDisplay(form.yardSaleStartDate, form.yardSaleEndDate)}
                                {" \u2022 "}
                                {composeYardSaleHoursDisplay(form.yardSaleStartTime, form.yardSaleEndTime)}
                            </Typography>
                        </Box>
                    )}
                </Stack>
            ) : (
                /* -- Standard item fields: condition + pricing -- */
                <>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <FormControl fullWidth disabled={disabled} error={Boolean(fieldErrors?.condition)}>
                            <InputLabel id="cl-condition">Condition *</InputLabel>
                            <Select
                                labelId="cl-condition"
                                label="Condition *"
                                value={form.condition}
                                onChange={(e) => { setForm((p) => ({ ...p, condition: e.target.value })); clearFieldError("condition"); }}
                                sx={{ borderRadius: 2 }}
                            >
                                {CONDITIONS.map((c) => (
                                    <MenuItem key={c} value={c}>{c}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth disabled={disabled}>
                            <InputLabel id="cl-pricemodel">Pricing *</InputLabel>
                            <Select
                                labelId="cl-pricemodel"
                                label="Pricing *"
                                value={form.priceModel}
                                onChange={(e) => setForm((p) => ({ ...p, priceModel: e.target.value }))}
                                sx={{ borderRadius: 2 }}
                            >
                                <MenuItem value="fixed">Fixed Price</MenuItem>
                                <MenuItem value="negotiable">Or Best Offer (OBO)</MenuItem>
                                <MenuItem value="free">Free</MenuItem>
                                <MenuItem value="trade">Trade Only</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>

                    {form.priceModel === "fixed" ? (
                        <TextField
                            label="Price *"
                            value={form.priceDollars}
                            onChange={(e) => { const v = sanitizePriceInput(e.target.value); setForm((p) => ({ ...p, priceDollars: v })); clearFieldError("priceDollars"); }}
                            placeholder="0.00"
                            fullWidth
                            disabled={disabled}
                            error={Boolean(fieldErrors?.priceDollars)}
                            helperText={fieldErrors?.priceDollars || "Max $999,999.99"}
                            inputProps={{ inputMode: "decimal", maxLength: 10, autoComplete: "off" }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            sx={INPUT_SX}
                        />
                    ) : null}
                </>
            )}

            <Divider />

            <RichTextEditor
                label="Description"
                value={form.description}
                onChange={(html) => { setForm((p) => ({ ...p, description: html })); clearFieldError("description"); }}
                required
                maxLength={2000}
                placeholder={
                    isYardSale
                        ? "What kinds of items will be for sale? Furniture, kids\u2019 toys, clothing, tools? Any big-ticket items? Use @ to tag people."
                        : "What's included? Any flaws? Why are you selling? Use @ to tag people."
                }
                minRows={isYardSale ? 6 : 8}
                error={Boolean(fieldErrors?.description)}
                helperText={fieldErrors?.description || ""}
            />
        </Stack>
    );
}

function StepPhotos({ photos, setPhotos, disabled, isYardSale }) {
    const hasPhotos = Array.isArray(photos) && photos.filter(Boolean).length > 0;

    return (
        <Stack spacing={1}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                Add Photos {!isYardSale && <Typography component="span" sx={{ color: "error.main", fontWeight: 900 }}>*</Typography>}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {isYardSale
                    ? "Photos are optional but yard sales with photos get way more visitors! First photo is the cover."
                    : "At least 1 photo is required. First photo is the cover. Drag to reorder."
                }
            </Typography>

            <PhotosUploadSection
                photos={photos}
                setPhotos={setPhotos}
                disabled={disabled}
                maxPhotos={MAX_PHOTOS}
                title=""
                helperText=""
                addButtonText="Add photos"
            />
        </Stack>
    );
}

function StepLocation({ form, setForm, disabled, isYardSale, addressError, addressValidating, fieldErrors, clearFieldError }) {
    const hasCity = Boolean(form.city?.trim());
    const hasCounty = Boolean(form.county?.trim());

    const formCity = form.city;
    const formCounty = form.county;
    const formLat = form.latitude;
    const formLng = form.longitude;

    useEffect(() => {
        if (formLat || formLng) return;
        const cityVal = String(formCity || "").trim();
        const countyVal = String(formCounty || "").trim();
        if (!cityVal && !countyVal) return;
        if (isYardSale) return;

        const coords = resolveLocationCoords(cityVal, countyVal);
        if (coords && Array.isArray(coords) && coords.length >= 2) {
            setForm((p) => ({
                ...p,
                latitude: String(coords[0]),
                longitude: String(coords[1]),
            }));
        }
    }, [formCity, formCounty, formLat, formLng, isYardSale, setForm]);

    const handleCountyChange = (v) => {
        const next = v === "All Counties" ? "" : v;
        setForm((p) => ({ ...p, county: next, latitude: "", longitude: "" }));
        clearFieldError("county");
    };

    const handleCityChange = (v) => {
        const next = v === "All Cities" ? "" : v;
        setForm((p) => ({ ...p, city: next, latitude: "", longitude: "" }));
        clearFieldError("city");
    };

    return (
        <Stack spacing={2.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                {isYardSale ? "Where is the yard sale?" : "Where is this item located?"}
            </Typography>

            <CityCountySelect
                county={form.county || "All Counties"}
                setCounty={handleCountyChange}
                city={form.city || "All Cities"}
                setCity={handleCityChange}
                emptyCountyLabel="County"
                emptyCityLabel="City"
                countyRequired={isYardSale}
                cityRequired={isYardSale}
            />

            {isYardSale && (fieldErrors?.county || fieldErrors?.city) && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {fieldErrors?.county && fieldErrors?.city
                        ? "County and city are required for yard sales."
                        : fieldErrors?.county || fieldErrors?.city}
                </Alert>
            )}

            {/* -- Yard Sale: street address field -- */}
            {isYardSale && (
                <>
                    <TextField
                        label="Street Address *"
                        value={form.yardSaleAddress}
                        onChange={(e) => {
                            setForm((p) => ({ ...p, yardSaleAddress: e.target.value.slice(0, ADDRESS_MAX), latitude: "", longitude: "" }));
                            clearFieldError("yardSaleAddress");
                        }}
                        placeholder={
                            !hasCity || !hasCounty
                                ? "Select county and city first"
                                : 'e.g., "123 Oak Street"'
                        }
                        fullWidth
                        disabled={disabled || addressValidating || !hasCity || !hasCounty}
                        error={Boolean(addressError || fieldErrors?.yardSaleAddress)}
                        helperText={
                            addressError || fieldErrors?.yardSaleAddress ||
                            (!hasCity || !hasCounty
                                ? "Select a county and city above to enable address entry."
                                : "Enter the street address where the yard sale will be held. We\u2019ll verify it when you post.")
                        }
                        inputProps={{
                            maxLength: ADDRESS_MAX,
                            autoComplete: "new-password",
                            autoCorrect: "off",
                            autoCapitalize: "off",
                            spellCheck: "false",
                            "data-form-type": "other",
                            "data-lpignore": "true",
                            "data-1p-ignore": "true",
                        }}
                        name={ADDRESS_FIELD_NAME}
                        id={ADDRESS_FIELD_ID}
                        InputProps={{
                            autoComplete: "new-password",
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LocationOnOutlinedIcon sx={{ fontSize: 18, color: (addressError || fieldErrors?.yardSaleAddress) ? "error.main" : "text.secondary" }} />
                                </InputAdornment>
                            ),
                            endAdornment: addressValidating ? (
                                <InputAdornment position="end">
                                    <CircularProgress size={18} />
                                </InputAdornment>
                            ) : null,
                        }}
                        sx={INPUT_SX}
                    />
                    <Divider />
                </>
            )}
        </Stack>
    );
}

/* ===================================================================
   MAIN COMPONENT
   =================================================================== */

export default function CreateListingModal({
                                               open,
                                               onClose,
                                               onCreated,
                                               onUpdated,
                                               user,
                                               mode,
                                               listingId,
                                               initialListing,
                                               forceYardSale = false,
                                           }) {
    const isAuthed = Boolean(user?.id || user?.user_id);
    const isEdit = mode === "edit";

    // Mobile: make dialogs full-screen (matches CreateJobModal pattern)
    const _clmTheme = useTheme();
    const _clmMobile = useMediaQuery(_clmTheme.breakpoints.down('sm'));

    // Active account context (business / artist / personal)
    const { activeAccount, activeAccountType, activeBusinessId, activeArtistId, isBusinessAccount, isArtistAccount } = useActiveAccount();

    const [step, setStep] = useState(0);
    const [form, setForm] = useState(() => buildInitialForm(initialListing));
    const [photos, setPhotos] = useState(() => buildInitialPhotos(initialListing));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [agreedToRules, setAgreedToRules] = useState(false);
    const contentRef = useRef(null);
    const scrollBoxRef = useRef(null);

    // ── Crop dialog state ──
    const LISTING_COVER_ASPECT = 4 / 3;
    const [cropOpen, setCropOpen] = useState(false);
    const [cropFile, setCropFile] = useState(null);
    const [cropOriginalPhotos, setCropOriginalPhotos] = useState(null); // snapshot before crop
    const prevPhotosLenRef = useRef(0);

    const isYardSale = form.category === "Yard Sales";

    // -- Address validation state --
    const [addressError, setAddressError] = useState("");
    const [addressValidating, setAddressValidating] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    // -- Street address typing timeout (debounce) for edit mode --
    const addressTypingTimerRef = useRef(null);
    const [addressDirty, setAddressDirty] = useState(false);

    // Sync form + photos on open
    useEffect(() => {
        if (!open) return;
        const f = buildInitialForm(initialListing);
        // Force yard sale category when launched from yard sales tab
        if (forceYardSale && !isEdit && !initialListing) {
            f.category = "Yard Sales";
            f.condition = "";
            f.priceModel = "negotiable";
            f.priceDollars = "";
        }
        // Auto-resolve lat/lng from city/county if not already set (and not a yard sale)
        if (!f.latitude && !f.longitude && f.category !== "Yard Sales") {
            const cityVal = String(f.city || "").trim();
            const countyVal = String(f.county || "").trim();
            if (cityVal || countyVal) {
                const coords = resolveLocationCoords(cityVal, countyVal);
                if (coords && Array.isArray(coords) && coords.length >= 2) {
                    f.latitude = String(coords[0]);
                    f.longitude = String(coords[1]);
                }
            }
        }
        setForm(f);
        setPhotos(buildInitialPhotos(initialListing));
        setSubmitError("");
        setAddressError("");
        setAddressValidating(false);
        setAddressDirty(false);
        setFieldErrors({});
        setIsSubmitting(false);
        setStep(isEdit ? 1 : 0);
        if (!isEdit) setAgreedToRules(false);
        // Reset crop state
        setCropOpen(false);
        setCropFile(null);
        prevPhotosLenRef.current = buildInitialPhotos(initialListing).length;
        // Clear any pending address timer
        if (addressTypingTimerRef.current) {
            clearTimeout(addressTypingTimerRef.current);
            addressTypingTimerRef.current = null;
        }
    }, [open, initialListing, isEdit, forceYardSale]);

    // Revoke object URLs on unmount
    useEffect(() => {
        return () => {
            photos.forEach((p) => {
                if (p?.file && p?.url) {
                    try { URL.revokeObjectURL(p.url); } catch { /* ignore */ }
                }
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Detect when a new cover photo is added → open crop dialog ──
    useEffect(() => {
        const prevLen = prevPhotosLenRef.current;
        const curLen = (Array.isArray(photos) ? photos : []).length;
        prevPhotosLenRef.current = curLen;

        // Only trigger when going from 0 photos to 1+ (new cover photo added)
        if (prevLen === 0 && curLen > 0) {
            const firstPhoto = photos[0];
            // Only if there's a raw File (not an existing/remote photo from an edit)
            if (firstPhoto?.file && firstPhoto.file instanceof File) {
                setCropFile(firstPhoto.file);
                setCropOpen(true);
            }
        }
    }, [photos]);

    /** Called when the user confirms the crop */
    const handleCropConfirm = useCallback((croppedBlob) => {
        setCropOpen(false);
        const originalName = cropFile?.name || "cropped.jpg";
        const croppedFile = new File([croppedBlob], originalName, { type: "image/jpeg" });
        const croppedUrl = URL.createObjectURL(croppedFile);

        // Replace the first photo's file and url with the cropped version
        setPhotos((prev) => {
            const arr = Array.isArray(prev) ? [...prev] : [];
            if (arr.length === 0) return arr;
            // Revoke the old blob URL
            if (arr[0]?.url && arr[0]?.file) {
                try { URL.revokeObjectURL(arr[0].url); } catch { /* */ }
            }
            arr[0] = { ...arr[0], file: croppedFile, url: croppedUrl };
            return arr;
        });
        setCropFile(null);
    }, [cropFile]);

    /** Called when the user skips cropping */
    const handleCropSkip = useCallback(() => {
        setCropOpen(false);
        setCropFile(null);
        // Photos stay as-is
    }, []);

    const handleCropClose = useCallback(() => {
        setCropOpen(false);
        setCropFile(null);
    }, []);

    // Clean up address typing timer on unmount
    useEffect(() => {
        return () => {
            if (addressTypingTimerRef.current) {
                clearTimeout(addressTypingTimerRef.current);
            }
        };
    }, []);

    // Auto-fill city/county from profile on first open (create mode only)
    const profileFetched = useRef(false);
    useEffect(() => {
        if (!open || isEdit || profileFetched.current) return;
        profileFetched.current = true;
        (async () => {
            try {
                const res = await secureFetch("/users/profile", { credentials: "include" });
                if (!res.ok) return;
                const obj = await res.json();
                const root = obj?.user || obj?.me || obj?.profile || obj;
                const profileCity = String(root?.city || root?.home_city || "").trim();
                const profileCounty = String(root?.county || root?.home_county || "").trim();
                setForm((prev) => {
                    const nextCity = prev.city || profileCity;
                    const nextCounty = prev.county || profileCounty;
                    let lat = prev.latitude;
                    let lng = prev.longitude;
                    if (!lat && !lng && (nextCity || nextCounty) && prev.category !== "Yard Sales") {
                        const coords = resolveLocationCoords(nextCity, nextCounty);
                        if (coords && Array.isArray(coords) && coords.length >= 2) {
                            lat = String(coords[0]);
                            lng = String(coords[1]);
                        }
                    }
                    return {
                        ...prev,
                        city: nextCity,
                        county: nextCounty,
                        latitude: lat,
                        longitude: lng,
                    };
                });
            } catch { /* silent */ }
        })();
    }, [open, isEdit]);

    const handleClose = () => {
        if (isSubmitting) return;
        setSubmitError("");
        setAddressError("");
        setFieldErrors({});
        profileFetched.current = false;
        if (addressTypingTimerRef.current) {
            clearTimeout(addressTypingTimerRef.current);
            addressTypingTimerRef.current = null;
        }
        onClose();
    };

    const clearFieldError = (key) => {
        setFieldErrors((prev) => {
            if (!prev || !prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
        if (key === "yardSaleAddress") setAddressError("");
    };

    /* ── Address geocode validation (with persistent rate limiting) ── */
    const validateYardSaleAddress = async () => {
        const addr = String(form.yardSaleAddress || "").trim();
        if (!addr) {
            setAddressError("Street address is required for yard sales.");
            return { ok: false };
        }

        const hasCity = Boolean(form.city?.trim());
        const hasCounty = Boolean(form.county?.trim());

        // Persistent rate limit check (survives page refresh / modal close)
        const rateCheck = checkGeocodeRateLimit();
        if (!rateCheck.allowed) {
            setAddressError(rateCheck.message);
            return { ok: false };
        }

        setAddressValidating(true);
        setAddressError("");

        try {
            const parts = [addr];
            if (hasCity) parts.push(form.city.trim());
            if (hasCounty) parts.push(`${form.county.trim()} County`);
            parts.push("Alabama");
            const fullAddress = parts.join(", ");

            const res = await secureFetch("/api/geocode", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address: fullAddress }),
            });

            const data = await res.json().catch(() => null);

            if (res.ok && data?.lat && data?.lng) {
                const isStateFallback =
                    Math.abs(data.lat - 32.318) < 0.1 &&
                    Math.abs(data.lng - (-86.902)) < 0.1;

                if (isStateFallback) {
                    recordGeocodeResult(false);
                    setAddressError("This address could not be found. Please check the street address and try again.");
                    setAddressValidating(false);
                    return { ok: false };
                }

                const locType = String(data.location_type || "").toUpperCase();
                if (locType === "APPROXIMATE" || locType === "GEOMETRIC_CENTER") {
                    recordGeocodeResult(false);
                    setAddressError("This address could not be verified. Please enter a valid street address.");
                    setAddressValidating(false);
                    return { ok: false };
                }

                recordGeocodeResult(true);
                setAddressValidating(false);
                return { ok: true, lat: String(data.lat), lng: String(data.lng) };
            }

            recordGeocodeResult(false);
            setAddressError("This address could not be found. Please check the street address and try again.");
            setAddressValidating(false);
            return { ok: false };
        } catch {
            recordGeocodeResult(false);
            setAddressError("Failed to validate address. Please try again.");
            setAddressValidating(false);
            return { ok: false };
        }
    };

    /* ── Street address debounced auto-validation (edit mode) ── */
    const handleAddressChangeEdit = (e) => {
        const val = e.target.value.slice(0, ADDRESS_MAX);
        setForm((p) => ({ ...p, yardSaleAddress: val, latitude: "", longitude: "" }));
        clearFieldError("yardSaleAddress");
        setAddressDirty(true);

        // Clear any pending validation timer
        if (addressTypingTimerRef.current) {
            clearTimeout(addressTypingTimerRef.current);
            addressTypingTimerRef.current = null;
        }

        // If address is now empty, clear errors and don't validate
        if (!val.trim()) {
            setAddressError("");
            setAddressValidating(false);
            return;
        }

        // Set a new debounce timer — validate after user stops typing
        addressTypingTimerRef.current = setTimeout(async () => {
            // Only auto-validate if we have city + county
            const hasCity = Boolean(form.city?.trim());
            const hasCounty = Boolean(form.county?.trim());
            if (!hasCity || !hasCounty) return;

            const result = await validateYardSaleAddress();
            if (result.ok) {
                setForm((p) => ({
                    ...p,
                    latitude: result.lat,
                    longitude: result.lng,
                }));
            }
        }, ADDRESS_TYPING_DELAY);
    };

    /* ── Scroll to first error ── */
    const scrollToFirstError = () => {
        setTimeout(() => {
            const container = isEdit ? scrollBoxRef.current : contentRef.current;
            if (!container) return;
            const errEl =
                container.querySelector("[aria-invalid='true']") ||
                container.querySelector(".Mui-error") ||
                container.querySelector(".MuiFormHelperText-root.Mui-error") ||
                container.querySelector(".MuiAlert-standardError");
            if (errEl) {
                errEl.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }, 80);
    };

    /* ── Auto-resolve coords for edit-mode location (non-yard-sale) ── */
    const formCity = form.city;
    const formCounty = form.county;
    const formLat = form.latitude;
    const formLng = form.longitude;

    useEffect(() => {
        if (!isEdit) return;
        if (formLat || formLng) return;
        const cityVal = String(formCity || "").trim();
        const countyVal = String(formCounty || "").trim();
        if (!cityVal && !countyVal) return;
        if (isYardSale) return;

        const coords = resolveLocationCoords(cityVal, countyVal);
        if (coords && Array.isArray(coords) && coords.length >= 2) {
            setForm((p) => ({
                ...p,
                latitude: String(coords[0]),
                longitude: String(coords[1]),
            }));
        }
    }, [formCity, formCounty, formLat, formLng, isYardSale, isEdit]);

    /* ── Validate all fields (edit mode — single-page validation) ── */
    const validateAllEdit = () => {
        const errs = {};

        if (!form.title.trim()) errs.title = "Title is required.";
        else {
            const titleCheck = checkFieldsProfanity({ title: form.title });
            if (!titleCheck.clean) errs.title = "Title contains inappropriate language. Please revise.";
        }

        const strippedDescEdit = stripHtml(form.description).trim();
        if (!strippedDescEdit) errs.description = "Description is required.";
        else {
            const descCheck = checkFieldsProfanity({ description: strippedDescEdit });
            if (!descCheck.clean) errs.description = "Description contains inappropriate language. Please revise.";
        }

        if (isYardSale) {
            if (!form.yardSaleStartDate) {
                errs.yardSaleStartDate = "Start date is required.";
            } else {
                const dateErr = validateDateReal(form.yardSaleStartDate);
                if (dateErr) errs.yardSaleStartDate = dateErr;
                else if (isBeforeToday(form.yardSaleStartDate)) errs.yardSaleStartDate = "Date must be today or later.";
            }

            if (form.yardSaleEndDate) {
                const endDateErr = validateDateReal(form.yardSaleEndDate);
                if (endDateErr) errs.yardSaleEndDate = endDateErr;
                else if (form.yardSaleStartDate && form.yardSaleEndDate < form.yardSaleStartDate) errs.yardSaleEndDate = "End date cannot be before start date.";
            }

            if (!form.yardSaleStartTime) errs.yardSaleStartTime = "Start time is required.";
            if (!form.yardSaleEndTime) {
                errs.yardSaleEndTime = "End time is required.";
            } else {
                const sameDay = form.yardSaleStartDate && (!form.yardSaleEndDate || form.yardSaleEndDate === form.yardSaleStartDate);
                if (sameDay && form.yardSaleStartTime && form.yardSaleEndTime <= form.yardSaleStartTime) {
                    errs.yardSaleEndTime = "End time must be after start time.";
                }
            }

            if (!form.county?.trim()) errs.county = "County is required for yard sales.";
            if (!form.city?.trim()) errs.city = "City is required for yard sales.";
            if (!form.yardSaleAddress?.trim()) errs.yardSaleAddress = "Street address is required for yard sales.";
        } else {
            if (!form.condition) errs.condition = "Condition is required.";
            if (form.priceModel === "fixed") {
                const cents = dollarsToCents(form.priceDollars);
                if (cents === null || cents <= 0) errs.priceDollars = "Enter a valid price (max $999,999.99).";
            }
        }

        const validPhotos = Array.isArray(photos) ? photos.filter(Boolean) : [];
        if (validPhotos.length < 1 && !isYardSale) errs._general = "At least 1 photo is required.";

        setFieldErrors(errs);
        if (errs._general) setSubmitError(errs._general);
        else setSubmitError("");
        return Object.keys(errs).length === 0;
    };

    // -- Step validation for CREATE mode (sets fieldErrors, returns true if valid) --
    const validateStep = (stepIdx) => {
        const errs = {};

        if (stepIdx === 0) {
            if (!agreedToRules) errs._general = "Please agree to the marketplace guidelines.";
            if (!form.category) errs._general = "Please select a category.";
        }

        if (stepIdx === 1) {
            if (!form.title.trim()) errs.title = "Title is required.";
            else {
                const titleCheck = checkFieldsProfanity({ title: form.title });
                if (!titleCheck.clean) errs.title = "Title contains inappropriate language. Please revise.";
            }

            const strippedDesc = stripHtml(form.description).trim();
            if (!strippedDesc) errs.description = "Description is required.";
            else {
                const descCheck = checkFieldsProfanity({ description: strippedDesc });
                if (!descCheck.clean) errs.description = "Description contains inappropriate language. Please revise.";
            }

            if (isYardSale) {
                if (!form.yardSaleStartDate) {
                    errs.yardSaleStartDate = "Start date is required.";
                } else {
                    const dateErr = validateDateReal(form.yardSaleStartDate);
                    if (dateErr) errs.yardSaleStartDate = dateErr;
                    else if (isBeforeToday(form.yardSaleStartDate)) errs.yardSaleStartDate = "Date must be today or later.";
                }

                if (form.yardSaleEndDate) {
                    const endDateErr = validateDateReal(form.yardSaleEndDate);
                    if (endDateErr) errs.yardSaleEndDate = endDateErr;
                    else if (form.yardSaleStartDate && form.yardSaleEndDate < form.yardSaleStartDate) errs.yardSaleEndDate = "End date cannot be before start date.";
                }

                if (!form.yardSaleStartTime) errs.yardSaleStartTime = "Start time is required.";
                if (!form.yardSaleEndTime) {
                    errs.yardSaleEndTime = "End time is required.";
                } else {
                    const sameDay = form.yardSaleStartDate && (!form.yardSaleEndDate || form.yardSaleEndDate === form.yardSaleStartDate);
                    if (sameDay && form.yardSaleStartTime && form.yardSaleEndTime <= form.yardSaleStartTime) {
                        errs.yardSaleEndTime = "End time must be after start time.";
                    }
                }
            } else {
                if (!form.condition) errs.condition = "Condition is required.";
                if (form.priceModel === "fixed") {
                    const cents = dollarsToCents(form.priceDollars);
                    if (cents === null || cents <= 0) errs.priceDollars = "Enter a valid price (max $999,999.99).";
                }
            }
        }

        if (stepIdx === 2 && !isYardSale) {
            const valid = Array.isArray(photos) ? photos.filter(Boolean) : [];
            if (valid.length < 1) errs._general = "At least 1 photo is required.";
        }

        if (stepIdx === 3 && isYardSale) {
            if (!form.county?.trim()) errs.county = "County is required for yard sales.";
            if (!form.city?.trim()) errs.city = "City is required for yard sales.";
            if (!form.yardSaleAddress?.trim()) errs.yardSaleAddress = "Street address is required for yard sales.";
        }

        setFieldErrors(errs);
        if (errs._general) setSubmitError(errs._general);
        else setSubmitError("");
        return Object.keys(errs).length === 0;
    };

    // Quick-check for button disable (lightweight, no error messages)
    const canAdvanceQuick = useMemo(() => {
        if (!isAuthed) return false;
        if (isEdit) return true; // Edit mode uses single-page, always allow button
        if (step === 0) return agreedToRules && Boolean(form.category);
        return true;
    }, [isAuthed, step, form.category, agreedToRules, isEdit]);

    const isLastStep = step === STEP_LABELS.length - 1;

    const handleNext = () => {
        if (!canAdvanceQuick) return;
        const valid = validateStep(step);
        if (!valid) {
            scrollToFirstError();
            return;
        }
        if (isLastStep) {
            handleSubmit();
            return;
        }
        setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
        if (contentRef.current) contentRef.current.scrollTop = 0;
    };

    const handleBack = () => {
        setSubmitError("");
        setAddressError("");
        setFieldErrors({});
        setStep((s) => Math.max(s - 1, isEdit ? 1 : 0));
        if (contentRef.current) contentRef.current.scrollTop = 0;
    };

    // -- Submit --
    const handleSubmit = async () => {
        if (!isAuthed || isSubmitting) return;

        // Client-side profanity check
        const strippedDesc = stripHtml(String(form.description || '')).trim();
        const profanityResult = checkFieldsProfanity({ title: form.title, description: strippedDesc });
        if (!profanityResult.clean) {
            setFieldErrors(prev => ({ ...prev, [profanityResult.field]: `Your ${profanityResult.field} contains inappropriate language. Please revise.` }));
            scrollToFirstError();
            return;
        }

        // For edit mode, validate all fields at once
        if (isEdit) {
            const valid = validateAllEdit();
            if (!valid) {
                scrollToFirstError();
                return;
            }
        }

        // Validate location step fields first (before showing spinner)
        if (!isEdit && isYardSale) {
            const errs = {};
            if (!form.county?.trim()) errs.county = "County is required for yard sales.";
            if (!form.city?.trim()) errs.city = "City is required for yard sales.";
            if (!form.yardSaleAddress?.trim()) errs.yardSaleAddress = "Street address is required for yard sales.";
            if (Object.keys(errs).length > 0) {
                setFieldErrors(errs);
                scrollToFirstError();
                return;
            }
        }

        // Clear any pending address timer before submitting
        if (addressTypingTimerRef.current) {
            clearTimeout(addressTypingTimerRef.current);
            addressTypingTimerRef.current = null;
        }

        setIsSubmitting(true);
        setSubmitError("");
        setAddressError("");
        setFieldErrors({});

        // For yard sales: always geocode the address at submit time to verify it.
        let geocodedLat = form.latitude || "";
        let geocodedLng = form.longitude || "";

        if (isYardSale) {
            const geocodeResult = await validateYardSaleAddress();
            if (!geocodeResult.ok) {
                setIsSubmitting(false);
                if (!isEdit && step !== 3) setStep(3);
                // Give the DOM a moment to render the error, then scroll to it
                setTimeout(() => scrollToFirstError(), 120);
                return;
            }
            geocodedLat = geocodeResult.lat;
            geocodedLng = geocodeResult.lng;
        }

        try {
            let priceCents = 0;
            if (!isYardSale && form.priceModel === "fixed") {
                const cents = dollarsToCents(form.priceDollars);
                if (cents === null) {
                    setSubmitError("Enter a valid price (max $999,999.99).");
                    setIsSubmitting(false);
                    return;
                }
                priceCents = cents;
            }

            const safePhotos = Array.isArray(photos) ? photos.filter(Boolean) : [];

            if (safePhotos.length === 0 && !isYardSale) {
                setSubmitError("At least 1 photo is required. Please go back and add a photo.");
                setIsSubmitting(false);
                return;
            }

            // Compose yard sale date and hours for storage (pipe-delimited)
            const composedDate = isYardSale
                ? (form.yardSaleEndDate && form.yardSaleEndDate !== form.yardSaleStartDate
                    ? `${form.yardSaleStartDate}|${form.yardSaleEndDate}`
                    : form.yardSaleStartDate)
                : "";
            const composedHours = isYardSale
                ? `${form.yardSaleStartTime}|${form.yardSaleEndTime}`
                : "";

            // Read active account fresh from localStorage
            const freshAcct = (() => {
                try {
                    const raw = localStorage.getItem('ll:activeAccount');
                    if (!raw) return null;
                    return JSON.parse(raw);
                } catch { return null; }
            })();
            const freshType = String(freshAcct?.type || '').toLowerCase();
            const freshIsBiz = freshType === 'business' && freshAcct?.id;
            const freshIsArt = freshType === 'artist' && freshAcct?.id;

            const appendAccountContext = (fd) => {
                if (freshIsBiz) {
                    fd.append("business_id", String(freshAcct.id));
                    fd.append("account_type", "business");
                    fd.append("account_handle", freshAcct.slug || freshAcct.handle || "");
                    fd.append("account_name", freshAcct.name || "");
                    fd.append("account_avatar_url", freshAcct.avatar_url || freshAcct.logo_url || "");
                } else if (freshIsArt) {
                    fd.append("artist_id", String(freshAcct.id));
                    fd.append("account_type", "artist");
                    fd.append("account_handle", freshAcct.handle || "");
                    fd.append("account_name", freshAcct.name || "");
                    fd.append("account_avatar_url", freshAcct.avatar_url || "");
                } else {
                    fd.append("account_type", "personal");
                }
            };

            if (isEdit) {
                const fd = new FormData();
                fd.append("title", form.title.trim());
                fd.append("category", form.category);
                fd.append("condition", isYardSale ? "" : form.condition);
                fd.append("priceModel", isYardSale ? "negotiable" : form.priceModel);
                fd.append("priceCents", isYardSale ? "0" : String(priceCents));
                fd.append("description", form.description.trim());
                fd.append("mentionedHandles", JSON.stringify(extractMentionHandles(form.description)));
                fd.append("meetupNotes", form.meetupNotes.trim());
                fd.append("city", form.city.trim());
                fd.append("county", form.county.trim());
                fd.append("isStatewide", "0");
                if (geocodedLat) fd.append("latitude", geocodedLat);
                if (geocodedLng) fd.append("longitude", geocodedLng);
                fd.append("yardSaleDate", composedDate);
                fd.append("yardSaleHours", composedHours);
                fd.append("yardSaleAddress", isYardSale ? form.yardSaleAddress.trim() : "");
                appendAccountContext(fd);

                const orderTokens = [];
                let newIndex = 0;
                safePhotos.forEach((p) => {
                    if (p.existing && p.url) {
                        orderTokens.push(String(p.url).trim());
                    } else if (p.file) {
                        fd.append("photos", p.file);
                        orderTokens.push(`__new__:${newIndex}`);
                        newIndex += 1;
                    }
                });
                fd.append("photo_order", JSON.stringify(orderTokens));

                await updateListing(listingId, fd);
                onUpdated?.();
            } else {
                const fd = new FormData();
                fd.append("title", form.title.trim());
                fd.append("category", form.category);
                fd.append("condition", isYardSale ? "" : form.condition);
                fd.append("priceModel", isYardSale ? "negotiable" : form.priceModel);
                fd.append("priceCents", isYardSale ? "0" : String(priceCents));
                fd.append("description", form.description.trim());
                fd.append("mentionedHandles", JSON.stringify(extractMentionHandles(form.description)));
                fd.append("meetupNotes", form.meetupNotes.trim());
                fd.append("city", form.city.trim());
                fd.append("county", form.county.trim());
                fd.append("isStatewide", "0");
                if (geocodedLat) fd.append("latitude", geocodedLat);
                if (geocodedLng) fd.append("longitude", geocodedLng);
                fd.append("yardSaleDate", composedDate);
                fd.append("yardSaleHours", composedHours);
                fd.append("yardSaleAddress", isYardSale ? form.yardSaleAddress.trim() : "");
                appendAccountContext(fd);

                safePhotos.forEach((p) => {
                    if (p?.file) fd.append("photos", p.file);
                });

                await createListing(fd);
                onCreated?.();
            }

            onClose();
        } catch (err) {
            setSubmitError(err?.message || (isEdit ? "Could not update listing." : "Could not create listing."));
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ── Edit-mode county/city handlers ── */
    const handleCountyChangeEdit = (v) => {
        const next = v === "All Counties" ? "" : v;
        setForm((p) => ({ ...p, county: next, latitude: "", longitude: "", yardSaleAddress: isYardSale ? "" : p.yardSaleAddress }));
        clearFieldError("county");
        setAddressError("");
    };

    const handleCityChangeEdit = (v) => {
        const next = v === "All Cities" ? "" : v;
        setForm((p) => ({ ...p, city: next, latitude: "", longitude: "", yardSaleAddress: isYardSale ? "" : p.yardSaleAddress }));
        clearFieldError("city");
        setAddressError("");
    };

    /* ===================================================================
       EDIT MODE — single-page render (like CreateEditEventModal)
       =================================================================== */
    if (isEdit) {
        const d = !isAuthed || isSubmitting;
        const minDate = todayDateValue();
        const editHasCity = Boolean(form.city?.trim());
        const editHasCounty = Boolean(form.county?.trim());

        const sectionDivider = (
            <Divider sx={{ my: { xs: 2.5, sm: 3 } }} />
        );

        return (
            <Dialog
                open={open}
                onClose={(_, reason) => {
                    if (reason === "backdropClick") return;
                    handleClose();
                }}
                fullWidth
                maxWidth="sm"
                fullScreen={_clmMobile}
                sx={{ zIndex: (t) => t.zIndex.modal + 50 }}
                PaperProps={{ sx: { ...DIALOG_PAPER_EDIT_SX, borderRadius: _clmMobile ? 0 : 3, height: _clmMobile ? '100%' : DIALOG_PAPER_EDIT_SX.height, maxHeight: _clmMobile ? '100%' : DIALOG_PAPER_EDIT_SX.maxHeight, ...(_clmMobile && { pt: 'env(safe-area-inset-top, 0px)' }) } }}
            >
                {/* ── HEADER ── */}
                <DialogTitle sx={{ p: 0, flexShrink: 0 }}>
                    <Box
                        sx={{
                            px: { xs: 2.5, sm: 3 },
                            pt: 2.25,
                            pb: 1.75,
                            display: "flex",
                            alignItems: "center",
                            gap: 1.25,
                        }}
                    >
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 2.5,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                                color: "primary.main",
                                flexShrink: 0,
                            }}
                        >
                            <EditNoteRoundedIcon sx={{ fontSize: 20 }} />
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                                sx={{
                                    fontWeight: 900,
                                    fontSize: { xs: 18, sm: 20 },
                                    lineHeight: 1.15,
                                    letterSpacing: "-0.02em",
                                    color: "text.primary",
                                }}
                            >
                                Edit Listing
                            </Typography>
                            <Typography sx={{ fontSize: 12.5, color: "text.secondary", mt: 0.15, lineHeight: 1.3 }}>
                                Update your listing details below
                            </Typography>
                        </Box>

                        <IconButton
                            size="small"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            sx={{
                                color: "text.secondary",
                                bgcolor: (t) => alpha(t.palette.text.primary, 0.04),
                                "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.08) },
                            }}
                            aria-label="Close"
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <Divider />
                </DialogTitle>

                {/* ── SCROLLABLE CONTENT ── */}
                <DialogContent sx={{ p: 0, flex: 1, minHeight: 0, overflow: "hidden" }}>
                    <Box
                        ref={scrollBoxRef}
                        sx={{
                            height: "100%",
                            overflowY: "auto",
                            px: { xs: 2.5, sm: 3 },
                            py: { xs: 2.5, sm: 3 },
                        }}
                    >
                        {!isAuthed && (
                            <Alert severity="info" sx={{ mb: 2, borderRadius: 2.5 }}>
                                You need to log in to edit a listing.
                            </Alert>
                        )}
                        {submitError && (
                            <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }}>
                                {submitError}
                            </Alert>
                        )}

                        {/* ── SECTION: Category (read-only in edit) ── */}
                        <Box
                            sx={(t) => ({
                                display: "flex",
                                alignItems: "center",
                                gap: 1.25,
                                px: 2,
                                py: 1.5,
                                borderRadius: 2.5,
                                bgcolor: alpha(t.palette.primary.main, 0.05),
                                border: "1px solid",
                                borderColor: alpha(t.palette.primary.main, 0.12),
                                mb: 1,
                            })}
                        >
                            {(() => {
                                const catObj = CATEGORIES.find((c) => c.id === form.category);
                                const CatIcon = catObj?.icon || CategoryRoundedIcon;
                                return <CatIcon sx={{ fontSize: 20, color: "primary.main" }} />;
                            })()}
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                                {form.category || "No category"}
                            </Typography>
                        </Box>

                        {sectionDivider}

                        {/* ── SECTION: Details ── */}
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2 }}>
                            Details
                        </Typography>

                        <Stack spacing={2.5}>
                            <TextField
                                label={isYardSale ? "Yard Sale Title *" : "Title *"}
                                value={form.title}
                                onChange={(e) => { setForm((p) => ({ ...p, title: e.target.value })); clearFieldError("title"); }}
                                fullWidth
                                disabled={d}
                                error={Boolean(fieldErrors?.title)}
                                helperText={fieldErrors?.title || ""}
                                inputProps={{ maxLength: 120, autoComplete: "off" }}
                                sx={INPUT_SX}
                            />

                            {/* Yard sale date/time or standard condition/price */}
                            {isYardSale ? (
                                <Stack spacing={2}>
                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                        <TextField
                                            label="Start Date *"
                                            type="date"
                                            value={form.yardSaleStartDate}
                                            onChange={(e) => { setForm((p) => ({ ...p, yardSaleStartDate: e.target.value })); clearFieldError("yardSaleStartDate"); }}
                                            fullWidth
                                            disabled={d}
                                            InputLabelProps={{ shrink: true }}
                                            inputProps={{ min: minDate }}
                                            error={Boolean(fieldErrors?.yardSaleStartDate)}
                                            helperText={fieldErrors?.yardSaleStartDate || ""}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <EventRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            sx={INPUT_SX}
                                        />
                                        <TextField
                                            label="End Date (optional)"
                                            type="date"
                                            value={form.yardSaleEndDate}
                                            onChange={(e) => { setForm((p) => ({ ...p, yardSaleEndDate: e.target.value })); clearFieldError("yardSaleEndDate"); }}
                                            fullWidth
                                            disabled={d}
                                            InputLabelProps={{ shrink: true }}
                                            inputProps={{ min: form.yardSaleStartDate || minDate }}
                                            error={Boolean(fieldErrors?.yardSaleEndDate)}
                                            helperText={fieldErrors?.yardSaleEndDate || "Leave blank for a single-day sale"}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <EventRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            sx={INPUT_SX}
                                        />
                                    </Stack>
                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                        <TextField
                                            label="Start Time *"
                                            type="time"
                                            value={form.yardSaleStartTime}
                                            onChange={(e) => { setForm((p) => ({ ...p, yardSaleStartTime: e.target.value })); clearFieldError("yardSaleStartTime"); }}
                                            fullWidth
                                            disabled={d}
                                            InputLabelProps={{ shrink: true }}
                                            error={Boolean(fieldErrors?.yardSaleStartTime)}
                                            helperText={fieldErrors?.yardSaleStartTime || ""}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <AccessTimeRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            sx={INPUT_SX}
                                        />
                                        <TextField
                                            label="End Time *"
                                            type="time"
                                            value={form.yardSaleEndTime}
                                            onChange={(e) => { setForm((p) => ({ ...p, yardSaleEndTime: e.target.value })); clearFieldError("yardSaleEndTime"); }}
                                            fullWidth
                                            disabled={d}
                                            InputLabelProps={{ shrink: true }}
                                            error={Boolean(fieldErrors?.yardSaleEndTime)}
                                            helperText={fieldErrors?.yardSaleEndTime || ""}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <AccessTimeRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            sx={INPUT_SX}
                                        />
                                    </Stack>
                                    {form.yardSaleStartDate && form.yardSaleStartTime && !fieldErrors?.yardSaleStartDate && (
                                        <Box
                                            sx={(t) => ({
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                                px: 1.5,
                                                py: 1,
                                                borderRadius: 2,
                                                bgcolor: alpha(t.palette.success.main, 0.06),
                                                border: "1px solid",
                                                borderColor: alpha(t.palette.success.main, 0.15),
                                            })}
                                        >
                                            <EventRoundedIcon sx={{ fontSize: 16, color: "success.dark" }} />
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: "success.dark", fontSize: 13 }}>
                                                {composeYardSaleDateDisplay(form.yardSaleStartDate, form.yardSaleEndDate)}
                                                {" \u2022 "}
                                                {composeYardSaleHoursDisplay(form.yardSaleStartTime, form.yardSaleEndTime)}
                                            </Typography>
                                        </Box>
                                    )}
                                </Stack>
                            ) : (
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                    <FormControl fullWidth disabled={d} error={Boolean(fieldErrors?.condition)}>
                                        <InputLabel id="cl-edit-condition">Condition *</InputLabel>
                                        <Select
                                            labelId="cl-edit-condition"
                                            label="Condition *"
                                            value={form.condition}
                                            onChange={(e) => { setForm((p) => ({ ...p, condition: e.target.value })); clearFieldError("condition"); }}
                                            sx={{ borderRadius: 2 }}
                                        >
                                            {CONDITIONS.map((c) => (
                                                <MenuItem key={c} value={c}>{c}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl fullWidth disabled={d}>
                                        <InputLabel id="cl-edit-pricemodel">Pricing *</InputLabel>
                                        <Select
                                            labelId="cl-edit-pricemodel"
                                            label="Pricing *"
                                            value={form.priceModel}
                                            onChange={(e) => setForm((p) => ({ ...p, priceModel: e.target.value }))}
                                            sx={{ borderRadius: 2 }}
                                        >
                                            <MenuItem value="fixed">Fixed Price</MenuItem>
                                            <MenuItem value="negotiable">Or Best Offer (OBO)</MenuItem>
                                            <MenuItem value="free">Free</MenuItem>
                                            <MenuItem value="trade">Trade Only</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Stack>
                            )}

                            {!isYardSale && form.priceModel === "fixed" && (
                                <TextField
                                    label="Price *"
                                    value={form.priceDollars}
                                    onChange={(e) => { const v = sanitizePriceInput(e.target.value); setForm((p) => ({ ...p, priceDollars: v })); clearFieldError("priceDollars"); }}
                                    placeholder="0.00"
                                    fullWidth
                                    disabled={d}
                                    error={Boolean(fieldErrors?.priceDollars)}
                                    helperText={fieldErrors?.priceDollars || "Max $999,999.99"}
                                    inputProps={{ inputMode: "decimal", maxLength: 10, autoComplete: "off" }}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                    sx={INPUT_SX}
                                />
                            )}

                            <RichTextEditor
                                label="Description"
                                value={form.description}
                                onChange={(html) => { setForm((p) => ({ ...p, description: html })); clearFieldError("description"); }}
                                required
                                maxLength={2000}
                                placeholder={
                                    isYardSale
                                        ? "What kinds of items will be for sale? Use @ to tag people."
                                        : "What's included? Any flaws? Why are you selling? Use @ to tag people."
                                }
                                minRows={6}
                                error={Boolean(fieldErrors?.description)}
                                helperText={fieldErrors?.description || ""}
                            />
                        </Stack>

                        {sectionDivider}

                        {/* ── SECTION: Photos ── */}
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>
                            Photos {!isYardSale && <Typography component="span" sx={{ color: "error.main", fontWeight: 900 }}>*</Typography>}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            {isYardSale
                                ? "Photos are optional but yard sales with photos get way more visitors! First photo is the cover."
                                : "At least 1 photo required. First photo is the cover. Drag to reorder."
                            }
                        </Typography>

                        <PhotosUploadSection
                            photos={photos}
                            setPhotos={setPhotos}
                            disabled={d}
                            maxPhotos={MAX_PHOTOS}
                            title=""
                            helperText=""
                            addButtonText="Add photos"
                        />

                        {sectionDivider}

                        {/* ── SECTION: Location ── */}
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2 }}>
                            {isYardSale ? "Location" : "Item Location"}
                        </Typography>

                        <Stack spacing={2.5}>
                            <CityCountySelect
                                county={form.county || "All Counties"}
                                setCounty={handleCountyChangeEdit}
                                city={form.city || "All Cities"}
                                setCity={handleCityChangeEdit}
                                emptyCountyLabel="County"
                                emptyCityLabel="City"
                                countyRequired={isYardSale}
                                cityRequired={isYardSale}
                            />

                            {isYardSale && (fieldErrors?.county || fieldErrors?.city) && (
                                <Alert severity="error" sx={{ borderRadius: 2 }}>
                                    {fieldErrors?.county && fieldErrors?.city
                                        ? "County and city are required for yard sales."
                                        : fieldErrors?.county || fieldErrors?.city}
                                </Alert>
                            )}

                            {isYardSale && (
                                <>
                                    <TextField
                                        label="Street Address *"
                                        value={form.yardSaleAddress}
                                        onChange={handleAddressChangeEdit}
                                        placeholder={
                                            !editHasCity || !editHasCounty
                                                ? "Select county and city first"
                                                : 'e.g., "123 Oak Street"'
                                        }
                                        fullWidth
                                        disabled={d || addressValidating || !editHasCity || !editHasCounty}
                                        error={Boolean(addressError || fieldErrors?.yardSaleAddress)}
                                        helperText={
                                            addressError || fieldErrors?.yardSaleAddress ||
                                            (addressValidating
                                                ? "Validating address..."
                                                : !editHasCity || !editHasCounty
                                                    ? "Select a county and city above to enable address entry."
                                                    : "We\u2019ll verify the address when you save.")
                                        }
                                        inputProps={{
                                            maxLength: ADDRESS_MAX,
                                            autoComplete: "new-password",
                                            autoCorrect: "off",
                                            autoCapitalize: "off",
                                            spellCheck: "false",
                                            "data-form-type": "other",
                                            "data-lpignore": "true",
                                            "data-1p-ignore": "true",
                                        }}
                                        name={ADDRESS_FIELD_NAME}
                                        id={ADDRESS_FIELD_ID}
                                        InputProps={{
                                            autoComplete: "new-password",
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LocationOnOutlinedIcon sx={{ fontSize: 18, color: (addressError || fieldErrors?.yardSaleAddress) ? "error.main" : "text.secondary" }} />
                                                </InputAdornment>
                                            ),
                                            endAdornment: addressValidating ? (
                                                <InputAdornment position="end">
                                                    <CircularProgress size={18} />
                                                </InputAdornment>
                                            ) : null,
                                        }}
                                        sx={INPUT_SX}
                                    />
                                </>
                            )}

                            {addressError && isYardSale && (
                                <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setAddressError("")}>
                                    {addressError}
                                </Alert>
                            )}

                        </Stack>

                        {/* Bottom spacer */}
                        <Box sx={{ pb: 2 }} />
                    </Box>
                </DialogContent>

                {/* ── FOOTER ── */}
                <Box sx={{ flexShrink: 0 }}>
                    <Divider />
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, px: { xs: 2.5, sm: 3 }, py: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={!isAuthed || isSubmitting || addressValidating}
                            endIcon={
                                isSubmitting || addressValidating
                                    ? <CircularProgress size={16} color="inherit" />
                                    : <CheckRoundedIcon />
                            }
                        >
                            {addressValidating
                                ? "Validating..."
                                : isSubmitting
                                    ? (Array.isArray(photos) && photos.some((p) => p?.file)
                                        ? "Uploading photos..."
                                        : "Saving...")
                                    : "Save Changes"
                            }
                        </Button>
                    </Box>
                </Box>

                {/* ── Image Crop Dialog (for cover photo — edit mode) ── */}
                <ImageCropDialog
                    open={cropOpen}
                    file={cropFile}
                    aspectRatio={LISTING_COVER_ASPECT}
                    aspectLabel="listing cover photo"
                    onConfirm={handleCropConfirm}
                    onSkip={handleCropSkip}
                    onClose={handleCropClose}
                />
            </Dialog>
        );
    }

    /* ===================================================================
       CREATE MODE — stepper-based render (original flow)
       =================================================================== */

    const renderStep = () => {
        const d = !isAuthed || isSubmitting;
        switch (step) {
            case 0:
                return (
                    <StepGuidelines
                        form={form}
                        setForm={setForm}
                        agreedToRules={agreedToRules}
                        setAgreedToRules={setAgreedToRules}
                        disabled={d}
                        forceYardSale={forceYardSale}
                    />
                );
            case 1:
                return (
                    <StepDetails
                        form={form}
                        setForm={setForm}
                        disabled={d}
                        fieldErrors={fieldErrors}
                        clearFieldError={clearFieldError}
                    />
                );
            case 2:
                return <StepPhotos photos={photos} setPhotos={setPhotos} disabled={d} isYardSale={isYardSale} />;
            case 3:
                return (
                    <StepLocation
                        form={form}
                        setForm={setForm}
                        disabled={d}
                        isYardSale={isYardSale}
                        addressError={addressError}
                        addressValidating={addressValidating}
                        fieldErrors={fieldErrors}
                        clearFieldError={clearFieldError}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
            fullScreen={_clmMobile}
            PaperProps={{ sx: { ...DIALOG_PAPER_CREATE_SX, borderRadius: _clmMobile ? 0 : 3, height: _clmMobile ? '100%' : DIALOG_PAPER_CREATE_SX.height, maxHeight: _clmMobile ? '100%' : DIALOG_PAPER_CREATE_SX.maxHeight, ...(_clmMobile && { pt: 'env(safe-area-inset-top, 0px)' }) } }}
        >
            <DialogTitle sx={{ p: 0, flexShrink: 0 }}>
                <Box sx={{ px: { xs: 2.5, sm: 3 }, pt: 2.25, pb: 1.75, display: "flex", alignItems: "center", gap: 1.25 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2.5, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: (t) => alpha(t.palette.primary.main, 0.1), color: "primary.main", flexShrink: 0 }}>
                        {isYardSale ? <YardRoundedIcon sx={{ fontSize: 20 }} /> : <ShoppingCartRoundedIcon sx={{ fontSize: 20 }} />}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        {isYardSale
                            ? "Post a Yard Sale"
                            : "Sell an Item"
                        }
                    </Typography>
                </Box>
            </DialogTitle>

            {/* Stepper */}
            <Box sx={{ px: 3, pb: 1, flexShrink: 0 }}>
                <Stepper
                    activeStep={step}
                    alternativeLabel
                    sx={STEPPER_LABEL_SX}
                >
                    {STEP_LABELS.map((label, idx) => (
                        <Step
                            key={label}
                            completed={idx < step}
                            sx={{ cursor: idx < step ? "pointer" : "default" }}
                            onClick={() => { if (idx < step) setStep(idx); }}
                        >
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Box>

            <DialogContent ref={contentRef} sx={{ pt: 1.5, flex: 1, overflow: "auto" }}>
                {!isAuthed ? (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        You need to log in to create a listing.
                    </Alert>
                ) : null}

                {submitError ? <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert> : null}

                {renderStep()}
            </DialogContent>

            {/* Navigation footer */}
            <DialogActions sx={{ p: 2, justifyContent: "space-between", gap: 1, flexShrink: 0 }}>
                {step > 0 ? (
                    <Button
                        variant="outlined"
                        onClick={handleBack}
                        disabled={isSubmitting}
                        startIcon={<ArrowBackRoundedIcon />}
                    >
                        Back
                    </Button>
                ) : (
                    <Box />
                )}

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Button
                        variant="outlined"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={!canAdvanceQuick || isSubmitting || addressValidating}
                        endIcon={
                            isSubmitting || addressValidating
                                ? <CircularProgress size={16} color="inherit" />
                                : isLastStep ? <CheckRoundedIcon /> : <ArrowForwardRoundedIcon />
                        }
                    >
                        {addressValidating
                            ? "Validating..."
                            : isSubmitting
                                ? (Array.isArray(photos) && photos.some((p) => p?.file)
                                    ? "Uploading photos..."
                                    : "Listing...")
                                : isLastStep
                                    ? isYardSale ? "Post Yard Sale" : "List Item"
                                    : "Next"}
                    </Button>
                </Box>
            </DialogActions>

            {/* ── Image Crop Dialog (for cover photo) ── */}
            <ImageCropDialog
                open={cropOpen}
                file={cropFile}
                aspectRatio={LISTING_COVER_ASPECT}
                aspectLabel="listing cover photo"
                onConfirm={handleCropConfirm}
                onSkip={handleCropSkip}
                onClose={handleCropClose}
            />
        </Dialog>
    );
}

CreateListingModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onCreated: PropTypes.func,
    onUpdated: PropTypes.func,
    user: PropTypes.object,
    mode: PropTypes.oneOf(["create", "edit"]),
    listingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    initialListing: PropTypes.object,
    forceYardSale: PropTypes.bool,
};

CreateListingModal.defaultProps = {
    onCreated: undefined,
    onUpdated: undefined,
    user: null,
    mode: "create",
    listingId: undefined,
    initialListing: null,
    forceYardSale: false,
};

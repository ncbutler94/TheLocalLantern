// src/pages/admin/DiscoverHighlightsAdmin.jsx
import { Fragment, useEffect, useRef, useState } from "react";
import { secureFetch } from "../../utils/secureFetch";
import DOMPurify from "dompurify";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Collapse,
    Divider,
    Fade,
    FormControlLabel,
    IconButton,
    MenuItem,
    Paper,
    Popover,
    Snackbar,
    Stack,
    Switch,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import CloseIcon from "@mui/icons-material/Close";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import AddPhotoAlternateRoundedIcon from "@mui/icons-material/AddPhotoAlternateRounded";
import CropOriginalRoundedIcon from "@mui/icons-material/CropOriginalRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import FormatBoldRoundedIcon from "@mui/icons-material/FormatBoldRounded";
import FormatItalicRoundedIcon from "@mui/icons-material/FormatItalicRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import PreviewRoundedIcon from "@mui/icons-material/PreviewRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivismRounded";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import NatureRoundedIcon from "@mui/icons-material/NatureRounded";
import ParkRoundedIcon from "@mui/icons-material/ParkRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import SportsSoccerRoundedIcon from "@mui/icons-material/SportsSoccerRounded";
import FitnessCenterRoundedIcon from "@mui/icons-material/FitnessCenterRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import BrushRoundedIcon from "@mui/icons-material/BrushRounded";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import PetsRoundedIcon from "@mui/icons-material/PetsRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import ChildCareRoundedIcon from "@mui/icons-material/ChildCareRounded";
import ChurchRoundedIcon from "@mui/icons-material/ChurchRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import ZoomOutMapRoundedIcon from "@mui/icons-material/ZoomOutMapRounded";
import YouTubeIcon from "@mui/icons-material/YouTube";
import XIcon from "@mui/icons-material/X";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";

// ─── Icon map ──────────────────────────────────────────
const ICON_MAP = {
    Star: StarRoundedIcon,
    Favorite: FavoriteRoundedIcon,
    Fire: LocalFireDepartmentRoundedIcon,
    Celebrate: CelebrationRoundedIcon,
    Trophy: EmojiEventsRoundedIcon,
    Volunteer: VolunteerActivismRoundedIcon,
    Nature: NatureRoundedIcon,
    Park: ParkRoundedIcon,
    Handshake: HandshakeRoundedIcon,
    School: SchoolRoundedIcon,
    Sports: SportsSoccerRoundedIcon,
    Fitness: FitnessCenterRoundedIcon,
    Restaurant: RestaurantRoundedIcon,
    Brush: BrushRoundedIcon,
    Camera: CameraAltRoundedIcon,
    Pets: PetsRoundedIcon,
    Car: DirectionsCarRoundedIcon,
    Home: HomeRoundedIcon,
    Check: CheckCircleRoundedIcon,
    Info: InfoRoundedIcon,
    Lightbulb: LightbulbRoundedIcon,
    Sparkle: AutoAwesomeRoundedIcon,
    Globe: PublicRoundedIcon,
    Child: ChildCareRoundedIcon,
    Church: ChurchRoundedIcon,
    Building: AccountBalanceRoundedIcon,
    Community: GroupsRoundedIcon,
};

const ICON_KEYS = Object.keys(ICON_MAP);

const CTA_ICON_OPTIONS = [
    { value: "OpenInNew", label: "Open link", icon: OpenInNewRoundedIcon },
    { value: "Link", label: "General link", icon: LinkRoundedIcon },
    { value: "Info", label: "Learn more", icon: InfoRoundedIcon },
    { value: "Check", label: "Get started", icon: CheckCircleRoundedIcon },
    { value: "Volunteer", label: "Get involved", icon: VolunteerActivismRoundedIcon },
    { value: "Favorite", label: "Support / donate", icon: FavoriteRoundedIcon },
    { value: "Celebration", label: "RSVP / celebrate", icon: CelebrationRoundedIcon },
    { value: "Trophy", label: "Featured / awards", icon: EmojiEventsRoundedIcon },
    { value: "Community", label: "Community page", icon: GroupsRoundedIcon },
    { value: "Storefront", label: "Business page", icon: StorefrontRoundedIcon },
    { value: "Music", label: "Music / artist", icon: MusicNoteRoundedIcon },
    { value: "Build", label: "Services / quote", icon: BuildRoundedIcon },
    { value: "Phone", label: "Call", icon: PhoneRoundedIcon },
    { value: "Email", label: "Email", icon: EmailRoundedIcon },
    { value: "Place", label: "Location / map", icon: PlaceRoundedIcon },
    { value: "Globe", label: "Website", icon: PublicRoundedIcon },
    { value: "Lightbulb", label: "Ideas / tips", icon: LightbulbRoundedIcon },
    { value: "Star", label: "Highlight", icon: StarRoundedIcon },
];

const CTA_ICON_MAP = Object.fromEntries(CTA_ICON_OPTIONS.map((option) => [option.value, option.icon]));

// ─── API helpers ────────────────────────────────────────

function getCsrfToken() {
    const meta = typeof document !== "undefined" ? document.querySelector('meta[name="csrf-token"]') : null;
    const metaToken = meta?.getAttribute?.("content");
    if (metaToken) return metaToken;
    const cookieStr = typeof document !== "undefined" ? document.cookie || "" : "";
    if (!cookieStr) return "";
    const pick = (name) => {
        const match = cookieStr.split(";").map((c) => c.trim()).find((c) => c.toLowerCase().startsWith(`${name.toLowerCase()}=`));
        if (!match) return "";
        const [, v] = match.split("=");
        try { return decodeURIComponent(v || ""); } catch { return v || ""; }
    };
    return pick("XSRF-TOKEN") || pick("xsrf-token") || pick("csrfToken") || pick("csrf-token") || pick("csrf") || "";
}

function apiHeaders(extra) {
    const csrf = getCsrfToken();
    return { Accept: "application/json", ...(csrf ? { "X-CSRF-Token": csrf } : {}), ...(extra || {}) };
}

async function apiFetch(url, opts = {}) {
    const res = await secureFetch(url, { credentials: "include", ...opts, headers: apiHeaders(opts.headers) });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        const msg = data?.error || data?.message || `Request failed (${res.status})`;
        throw new Error(msg);
    }
    return data;
}

// ─── GCS Upload ─────────────────────────────────────────

const ALLOWED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_MEDIA_BYTES = 15 * 1024 * 1024;

async function uploadToGcs(file, folder) {
    if (!file) throw new Error("No file selected");
    if (!ALLOWED_MEDIA_TYPES.has(file.type)) throw new Error("Only JPG, PNG, WEBP, or GIF allowed");
    if (file.size > MAX_MEDIA_BYTES) throw new Error("File must be under 15 MB");

    const { uploadUrl, publicUrl } = await apiFetch("/api/uploads/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder, fileName: file.name, contentType: file.type }),
    });

    const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
    });
    if (!putRes.ok) throw new Error("Upload to storage failed");

    return publicUrl;
}

// ─── Empty form state ───────────────────────────────────

const EMPTY_FORM = {
    page_type: "services",
    is_active: true,
    sort_order: 0,
    title: "",
    subtitle: "",
    tagline: "",
    video_id: "",
    video_thumbnail_url: "",
    logo_url: "",
    cover_photo_url: "",
    cover_position: "center",
    avatar_position: "center",
    owner_name: "",
    owner_title: "Owner / Operator",
    owner_avatar_url: "",
    owner_location: "",
    owner_phone: "",
    owner_email: "",
    additional_owners: [],
    owner_section_title: "",
    owner_avatar_position: "center",
    owner_about: "",
    facebook_url: "",
    instagram_url: "",
    twitter_url: "",
    youtube_url: "",
    tiktok_url: "",
    website_url: "",
    badge_text: "Licensed & Insured",
    badge_icon: "CheckCircle",
    description: "",
    about_photo_url: "",
    about_photos: [],
    bio_photos: [],
    highlight_title: "",
    highlight_body: "",
    highlight_photo_url: "",
    highlight_video_id: "",
    highlight_video_thumbnail_url: "",
    highlight_sections: [],
    services_list: [],
    music_links: { spotify: "", appleMusic: "", soundcloud: "", youtube: "", bandcamp: "" },
    cta_primary_label: "Request a Quote",
    cta_primary_link: "",
    cta_primary_icon: "Build",
    cta_secondary_label: "View Service Page",
    cta_secondary_link: "",
    cta_secondary_icon: "OpenInNew",
    accent_color: "",
    highlight_color: "",
    badge_color: "",
    spotlight_label: "",
    spotlight_text_color: "",
    spotlight_bg_color: "",
};

const ARTIST_DEFAULTS = {
    page_type: "artists",
    owner_title: "Solo Artist",
    badge_text: "",
    cta_primary_label: "Stream Now",
    cta_primary_icon: "Music",
    cta_secondary_label: "Book for Event",
    cta_secondary_icon: "Celebration",
};

const BUSINESS_DEFAULTS = {
    page_type: "business",
    owner_title: "Owner / Operator",
    badge_text: "",
    badge_icon: "CheckCircle",
    cta_primary_label: "Request a Quote",
    cta_primary_icon: "Build",
    cta_secondary_label: "View Business Page",
    cta_secondary_icon: "Storefront",
};

const COMMUNITY_DEFAULTS = {
    page_type: "community",
    owner_title: "Organizer",
    badge_text: "",
    cta_primary_label: "Learn More",
    cta_primary_icon: "Info",
    cta_secondary_label: "Get Involved",
    cta_secondary_icon: "Volunteer",
    owner_section_title: "Community Leaders",
};

// ─── Accent Color Picker ─────────────────────────────

const ACCENT_PRESETS = [
    { value: "#E91E63", label: "Pink" },
    { value: "#9C27B0", label: "Purple" },
    { value: "#673AB7", label: "Deep Purple" },
    { value: "#3F51B5", label: "Indigo" },
    { value: "#2196F3", label: "Blue" },
    { value: "#00897B", label: "Teal" },
    { value: "#4CAF50", label: "Green" },
    { value: "#FF9800", label: "Orange" },
    { value: "#F44336", label: "Red" },
    { value: "#795548", label: "Brown" },
    { value: "#607D8B", label: "Blue Grey" },
    { value: "#FF5722", label: "Deep Orange" },
    { value: "#8BC34A", label: "Light Green" },
    { value: "#00BCD4", label: "Cyan" },
    { value: "#FFC107", label: "Amber" },
    { value: "#1B5E20", label: "Forest" },
];

function AccentColorPicker({ label, value, onChange }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const [customInput, setCustomInput] = useState("");
    const open = Boolean(anchorEl);

    const handleOpen = (e) => {
        setAnchorEl(e.currentTarget);
        setCustomInput(value || "");
    };

    const handleSelect = (color) => {
        onChange(color);
        setAnchorEl(null);
    };

    const handleCustomApply = () => {
        if (customInput && /^#([0-9A-Fa-f]{3}){1,2}$/.test(customInput.trim())) {
            onChange(customInput.trim());
            setAnchorEl(null);
        }
    };

    const handleClear = () => {
        onChange("");
        setAnchorEl(null);
    };

    const displayColor = value || "#9e9e9e";

    return (
        <>
            <Stack direction="row" spacing={1.25} alignItems="center">
                <PaletteRoundedIcon sx={{ fontSize: 18, color: value || "text.secondary" }} />
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, flex: 1 }}>
                    {label || "Color"}
                </Typography>
                <Tooltip title={`Choose ${(label || "color").toLowerCase()}`} arrow>
                    <Box
                        onClick={handleOpen}
                        sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1.5,
                            bgcolor: displayColor,
                            border: "2px solid",
                            borderColor: (t) => alpha(t.palette.common.black, 0.15),
                            cursor: "pointer",
                            transition: "box-shadow 0.15s",
                            boxShadow: open ? `0 0 0 2px ${displayColor}44` : "none",
                            "&:hover": { boxShadow: `0 0 0 3px ${displayColor}44` },
                        }}
                    />
                </Tooltip>
                {value && (
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary", fontFamily: "monospace" }}>
                        {value}
                    </Typography>
                )}
            </Stack>
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{ paper: { sx: { borderRadius: 3, p: 2, width: 280 } } }}
            >
                <IconButton onClick={() => setAnchorEl(null)} size="small" sx={{ position: "absolute", top: 6, right: 6 }}>
                    <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: "text.secondary", mb: 1.25, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Preset Colors
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 0.75, mb: 2 }}>
                    {ACCENT_PRESETS.map((preset) => (
                        <Tooltip key={preset.value} title={preset.label} arrow>
                            <Box
                                onClick={() => handleSelect(preset.value)}
                                sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 1,
                                    bgcolor: preset.value,
                                    cursor: "pointer",
                                    border: value === preset.value ? "2.5px solid" : "1.5px solid",
                                    borderColor: value === preset.value ? "text.primary" : (t) => alpha(t.palette.common.black, 0.12),
                                    transition: "transform 0.1s, border-color 0.1s",
                                    "&:hover": { transform: "scale(1.15)" },
                                }}
                            />
                        </Tooltip>
                    ))}
                </Box>
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: "text.secondary", mb: 0.75, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Custom Hex
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                        size="small"
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleCustomApply(); }}
                        placeholder="#E91E63"
                        sx={{ flex: 1 }}
                        InputProps={{ sx: { fontSize: 12, fontFamily: "monospace" } }}
                    />
                    <Button
                        size="small"
                        variant="contained"
                        onClick={handleCustomApply}
                        disabled={!customInput || !/^#([0-9A-Fa-f]{3}){1,2}$/.test(customInput.trim())}
                        sx={{ textTransform: "none", fontWeight: 800, fontSize: 11, minWidth: 56, borderRadius: 1.5 }}
                    >
                        Apply
                    </Button>
                </Stack>
                {value && (
                    <Button size="small" onClick={handleClear} sx={{ textTransform: "none", fontWeight: 700, fontSize: 11, color: "text.secondary", mt: 1, px: 0 }}>
                        Reset to default
                    </Button>
                )}
            </Popover>
        </>
    );
}

const EMPTY_HIGHLIGHT_SECTION = {
    icon: "Star",
    title: "",
    body: "",
    photo_url: "",
    gif_url: "",
    photo_position: { x: 50, y: 50 },
    photo_size: 100,
};

// ─── Render icon from key ──────────────────────────────

function RenderIcon({ name, sx }) {
    const Comp = ICON_MAP[name] || CTA_ICON_MAP[name];
    if (!Comp) return <StarRoundedIcon sx={sx} />;
    return <Comp sx={sx} />;
}

// ─── Icon Picker ───────────────────────────────────────

function IconPicker({ value, onChange }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    return (
        <>
            <Tooltip title="Choose icon" arrow>
                <IconButton
                    size="small"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={(t) => ({
                        width: 36,
                        height: 36,
                        border: "2px solid",
                        borderColor: alpha(t.palette.primary.main, 0.25),
                        bgcolor: alpha(t.palette.primary.main, 0.06),
                        "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.12) },
                    })}
                >
                    <RenderIcon name={value} sx={{ fontSize: 20, color: "primary.main" }} />
                </IconButton>
            </Tooltip>
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                slotProps={{ paper: { sx: { borderRadius: 3, p: 1.5, maxWidth: 280 } } }}
            >
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: "text.secondary", mb: 1, textTransform: "uppercase", letterSpacing: 0.5, px: 0.5 }}>
                    Pick an icon
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}>
                    {ICON_KEYS.map((key) => (
                        <IconButton
                            key={key}
                            size="small"
                            onClick={() => { onChange(key); setAnchorEl(null); }}
                            sx={(t) => ({
                                width: 32,
                                height: 32,
                                borderRadius: 1.5,
                                bgcolor: value === key ? alpha(t.palette.primary.main, 0.15) : "transparent",
                                "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.1) },
                            })}
                        >
                            <RenderIcon name={key} sx={{ fontSize: 18, color: value === key ? "primary.main" : "text.secondary" }} />
                        </IconButton>
                    ))}
                </Box>
            </Popover>
        </>
    );
}

function CtaIconSelect({ label, value, onChange }) {
    return (
        <TextField
            select
            label={label}
            size="small"
            fullWidth
            value={value || "OpenInNew"}
            onChange={(e) => onChange(e.target.value)}
            SelectProps={{ renderValue: (selected) => {
                    const option = CTA_ICON_OPTIONS.find((item) => item.value === selected) || CTA_ICON_OPTIONS[0];
                    const IconComp = option.icon;
                    return (
                        <Stack direction="row" spacing={1} alignItems="center">
                            <IconComp sx={{ fontSize: 18, color: "primary.main" }} />
                            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{option.label}</Typography>
                        </Stack>
                    );
                } }}
        >
            {CTA_ICON_OPTIONS.map((option) => {
                const IconComp = option.icon;
                return (
                    <MenuItem key={option.value} value={option.value}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <IconComp sx={{ fontSize: 18, color: "primary.main" }} />
                            <Typography sx={{ fontSize: 13 }}>{option.label}</Typography>
                        </Stack>
                    </MenuItem>
                );
            })}
        </TextField>
    );
}

function PreviewCtaButtons({ form, sx }) {
    const primaryIconName = form.cta_primary_icon || "OpenInNew";
    const secondaryIconName = form.cta_secondary_icon || "OpenInNew";

    if (!form.cta_primary_label && !form.cta_secondary_label) return null;

    return (
        <Box sx={sx}>
            {form.cta_primary_label && (
                <Button
                    variant="contained"
                    fullWidth
                    startIcon={<RenderIcon name={primaryIconName} sx={{ fontSize: 18 }} />}
                    sx={{
                        textTransform: "none",
                        fontWeight: 900,
                        fontSize: 14,
                        py: 1.25,
                        borderRadius: 2.5,
                        mb: form.cta_secondary_label ? 1 : 0,
                    }}
                >
                    {form.cta_primary_label}
                </Button>
            )}
            {form.cta_secondary_label && (
                <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<RenderIcon name={secondaryIconName} sx={{ fontSize: 18 }} />}
                    sx={{
                        textTransform: "none",
                        fontWeight: 800,
                        fontSize: 13,
                        py: 1,
                        borderRadius: 2.5,
                        borderColor: "divider",
                        color: "text.primary",
                    }}
                >
                    {form.cta_secondary_label}
                </Button>
            )}
            {(form.cta_primary_link || form.cta_secondary_link) && (
                <Typography sx={{ mt: 1, fontSize: 11, color: "text.secondary", lineHeight: 1.5 }}>
                    {form.cta_primary_link ? `Primary: ${form.cta_primary_link}` : ""}
                    {form.cta_primary_link && form.cta_secondary_link ? " • " : ""}
                    {form.cta_secondary_link ? `Secondary: ${form.cta_secondary_link}` : ""}
                </Typography>
            )}
        </Box>
    );
}

// ─── WYSIWYG Editor ────────────────────────────────────

function WysiwygEditor({ label, value, onChange, placeholder, minHeight }) {
    const editorRef = useRef(null);
    const internalFlag = useRef(false);
    const savedSelection = useRef(null);

    const [linkAnchor, setLinkAnchor] = useState(null);
    const [linkUrl, setLinkUrl] = useState("https://");
    const [linkText, setLinkText] = useState("");

    useEffect(() => {
        if (internalFlag.current) {
            internalFlag.current = false;
            return;
        }
        const el = editorRef.current;
        if (el && el.innerHTML !== (value || "")) {
            el.innerHTML = value || "";
        }
    }, [value]);

    const emitChange = () => {
        internalFlag.current = true;
        const html = editorRef.current?.innerHTML || "";
        onChange(html === "<br>" ? "" : html);
    };

    const exec = (cmd, val) => {
        document.execCommand(cmd, false, val || null);
        editorRef.current?.focus();
        emitChange();
    };

    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            savedSelection.current = sel.getRangeAt(0).cloneRange();
        }
    };

    const restoreSelection = () => {
        const sel = window.getSelection();
        if (sel && savedSelection.current) {
            sel.removeAllRanges();
            sel.addRange(savedSelection.current);
        }
    };

    const handleOpenLink = (e) => {
        e.preventDefault();
        saveSelection();
        const sel = window.getSelection();
        const selectedText = sel ? sel.toString().trim() : "";
        setLinkText(selectedText);
        setLinkUrl("https://");
        setLinkAnchor(e.currentTarget);
    };

    const handleInsertLink = () => {
        setLinkAnchor(null);
        if (!linkUrl || linkUrl === "https://") return;
        editorRef.current?.focus();
        restoreSelection();
        if (linkText && (!savedSelection.current || savedSelection.current.collapsed)) {
            const a = document.createElement("a");
            a.href = linkUrl;
            a.textContent = linkText;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                range.insertNode(a);
                range.setStartAfter(a);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        } else {
            document.execCommand("createLink", false, linkUrl);
            const links = editorRef.current?.querySelectorAll("a");
            if (links) {
                links.forEach((a) => {
                    if (a.href === linkUrl || a.getAttribute("href") === linkUrl) {
                        a.target = "_blank";
                        a.rel = "noopener noreferrer";
                    }
                });
            }
        }
        emitChange();
    };

    const handleLinkKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleInsertLink();
        }
    };

    return (
        <Box>
            {label && (
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: "text.secondary", mb: 0.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {label}
                </Typography>
            )}
            <Paper
                variant="outlined"
                sx={(t) => ({
                    borderRadius: 2,
                    overflow: "hidden",
                    borderColor: alpha(t.palette.divider, 0.8),
                    "&:focus-within": { borderColor: t.palette.primary.main, boxShadow: `0 0 0 1px ${t.palette.primary.main}` },
                })}
            >
                <Stack
                    direction="row"
                    spacing={0.25}
                    sx={(t) => ({ px: 0.75, py: 0.5, bgcolor: alpha(t.palette.action.hover, 0.4), borderBottom: "1px solid", borderColor: "divider" })}
                >
                    <Tooltip title="Bold" arrow><IconButton size="small" onMouseDown={(e) => { e.preventDefault(); exec("bold"); }} sx={{ width: 28, height: 28 }}><FormatBoldRoundedIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                    <Tooltip title="Italic" arrow><IconButton size="small" onMouseDown={(e) => { e.preventDefault(); exec("italic"); }} sx={{ width: 28, height: 28 }}><FormatItalicRoundedIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                    <Tooltip title="Bullet list" arrow><IconButton size="small" onMouseDown={(e) => { e.preventDefault(); exec("insertUnorderedList"); }} sx={{ width: 28, height: 28 }}><FormatListBulletedRoundedIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                    <Tooltip title="Insert link" arrow><IconButton size="small" onMouseDown={handleOpenLink} sx={{ width: 28, height: 28 }}><LinkRoundedIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                </Stack>
                <Box
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={emitChange}
                    onBlur={emitChange}
                    data-placeholder={placeholder || "Start typing..."}
                    sx={{
                        px: 1.5,
                        py: 1.25,
                        minHeight: minHeight || 80,
                        fontSize: 13,
                        lineHeight: 1.65,
                        outline: "none",
                        color: "text.primary",
                        "& b, & strong": { fontWeight: 800 },
                        "& i, & em": { fontStyle: "italic" },
                        "& ul": { pl: 2.5, my: 0.5 },
                        "& li": { mb: 0.25 },
                        "& a": { color: "primary.main", textDecoration: "underline" },
                        "&:empty::before": {
                            content: "attr(data-placeholder)",
                            color: "text.disabled",
                            pointerEvents: "none",
                        },
                    }}
                />
            </Paper>

            {/* ── Link insertion popover ── */}
            <Popover
                open={Boolean(linkAnchor)}
                anchorEl={linkAnchor}
                onClose={() => setLinkAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                slotProps={{
                    paper: {
                        sx: (t) => ({
                            mt: 0.75,
                            p: 2,
                            borderRadius: 2.5,
                            width: 340,
                            boxShadow: `0 8px 32px ${alpha(t.palette.common.black, 0.18)}`,
                            border: "1px solid",
                            borderColor: alpha(t.palette.primary.main, 0.12),
                        }),
                    },
                }}
            >
                <Stack spacing={1.75}>
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                        <LinkRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} />
                        <Typography sx={{ fontWeight: 900, fontSize: 13, color: "text.primary" }}>
                            Insert Link
                        </Typography>
                    </Stack>
                    <TextField
                        label="URL"
                        size="small"
                        fullWidth
                        autoFocus
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        onKeyDown={handleLinkKeyDown}
                        placeholder="https://example.com"
                        InputProps={{ sx: { fontSize: 13 } }}
                    />
                    <TextField
                        label="Display text (optional)"
                        size="small"
                        fullWidth
                        value={linkText}
                        onChange={(e) => setLinkText(e.target.value)}
                        onKeyDown={handleLinkKeyDown}
                        placeholder="Click here"
                        helperText="Leave blank to use selected text"
                        InputProps={{ sx: { fontSize: 13 } }}
                        FormHelperTextProps={{ sx: { fontSize: 10.5, mt: 0.35 } }}
                    />
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                            size="small"
                            onClick={() => setLinkAnchor(null)}
                            sx={{ textTransform: "none", fontWeight: 700, fontSize: 12, color: "text.secondary" }}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="small"
                            variant="contained"
                            onClick={handleInsertLink}
                            disabled={!linkUrl || linkUrl === "https://"}
                            startIcon={<LinkRoundedIcon sx={{ fontSize: "14px !important" }} />}
                            sx={{ textTransform: "none", fontWeight: 900, fontSize: 12, borderRadius: 999, px: 2 }}
                        >
                            Insert
                        </Button>
                    </Stack>
                </Stack>
            </Popover>
        </Box>
    );
}

// ─── Media Upload Field (image + GIF) ──────────────────

function MediaUploadField({ label, helperText, value, onChange, folder, acceptGif }) {
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");

    const acceptStr = acceptGif
        ? "image/jpeg,image/png,image/webp,image/gif"
        : "image/jpeg,image/png,image/webp";

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (inputRef.current) inputRef.current.value = "";

        setUploading(true);
        setUploadError("");
        try {
            const url = await uploadToGcs(file, folder || "discover-highlights");
            onChange(url);
        } catch (err) {
            setUploadError(err.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <Box>
            {label && (
                <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 0.5, color: "text.primary" }}>
                    {label}
                </Typography>
            )}
            {helperText && (
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.75 }}>
                    {helperText}
                </Typography>
            )}

            {value && (
                <Box sx={{ mb: 1, position: "relative", display: "inline-block" }}>
                    <Box
                        component="img"
                        src={value}
                        alt={label || "Media"}
                        sx={{ maxWidth: "100%", maxHeight: 140, borderRadius: 2, border: "1px solid", borderColor: "divider", objectFit: "cover" }}
                    />
                    <IconButton
                        size="small"
                        onClick={() => { onChange(""); setUploadError(""); }}
                        sx={{ position: "absolute", top: 4, right: 4, bgcolor: "rgba(0,0,0,0.55)", color: "#fff", "&:hover": { bgcolor: "rgba(0,0,0,0.75)" }, width: 22, height: 22 }}
                    >
                        <CloseIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                </Box>
            )}

            <Stack direction="row" spacing={1} alignItems="center">
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={uploading ? <CircularProgress size={14} /> : <CloudUploadRoundedIcon sx={{ fontSize: "16px !important" }} />}
                    disabled={uploading}
                    onClick={() => inputRef.current?.click()}
                    sx={{ textTransform: "none", fontWeight: 700, fontSize: 12, borderRadius: 2 }}
                >
                    {uploading ? "Uploading\u2026" : value ? "Replace" : "Upload"}
                </Button>
            </Stack>

            {uploadError && (
                <Typography variant="caption" sx={{ color: "error.main", mt: 0.5, display: "block" }}>{uploadError}</Typography>
            )}

            <input ref={inputRef} type="file" accept={acceptStr} style={{ display: "none" }} onChange={handleFileChange} />
        </Box>
    );
}

// ─── Draggable / Resizable Image ───────────────────────

function DraggableResizableImage({ src, position, size, onPositionChange, onSizeChange, containerSx }) {
    const containerRef = useRef(null);
    const dragging = useRef(false);
    const startPos = useRef({ x: 0, y: 0, posX: 50, posY: 50 });

    const posX = position?.x ?? 50;
    const posY = position?.y ?? 50;
    const imgSize = size ?? 100;

    const handleMouseDown = (e) => {
        e.preventDefault();
        dragging.current = true;
        startPos.current = { x: e.clientX, y: e.clientY, posX, posY };

        const handleMouseMove = (ev) => {
            if (!dragging.current) return;
            const container = containerRef.current;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const dx = ((ev.clientX - startPos.current.x) / rect.width) * 100;
            const dy = ((ev.clientY - startPos.current.y) / rect.height) * 100;
            const newX = Math.max(0, Math.min(100, startPos.current.posX - dx));
            const newY = Math.max(0, Math.min(100, startPos.current.posY - dy));
            onPositionChange({ x: Math.round(newX), y: Math.round(newY) });
        };

        const handleMouseUp = () => {
            dragging.current = false;
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };

    if (!src) return null;

    return (
        <Box
            ref={containerRef}
            sx={{
                position: "relative",
                overflow: "hidden",
                borderRadius: 2.5,
                cursor: "grab",
                "&:active": { cursor: "grabbing" },
                ...containerSx,
            }}
            onMouseDown={handleMouseDown}
        >
            <Box
                component="img"
                src={src}
                alt=""
                draggable={false}
                sx={{
                    width: `${imgSize}%`,
                    height: `${imgSize}%`,
                    minWidth: "100%",
                    minHeight: "100%",
                    objectFit: "cover",
                    objectPosition: `${posX}% ${posY}%`,
                    pointerEvents: "none",
                    display: "block",
                }}
            />
            <Box sx={{ position: "absolute", bottom: 4, right: 4, display: "flex", gap: 0.5 }}>
                <Tooltip title="Drag to reposition" arrow>
                    <Box sx={{ bgcolor: "rgba(0,0,0,0.55)", borderRadius: 1, px: 0.75, py: 0.25, display: "flex", alignItems: "center", gap: 0.5 }}>
                        <ZoomOutMapRoundedIcon sx={{ fontSize: 13, color: "white" }} />
                        <Typography sx={{ fontSize: 9, color: "white", fontWeight: 700 }}>Drag</Typography>
                    </Box>
                </Tooltip>
            </Box>
            {onSizeChange && (
                <Stack direction="row" spacing={0.25} sx={{ position: "absolute", top: 4, right: 4 }}>
                    <IconButton
                        size="small"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => onSizeChange(Math.min(200, imgSize + 10))}
                        sx={{ width: 22, height: 22, bgcolor: "rgba(0,0,0,0.55)", color: "white", "&:hover": { bgcolor: "rgba(0,0,0,0.7)" } }}
                    >
                        <Typography sx={{ fontSize: 14, fontWeight: 900, lineHeight: 1 }}>+</Typography>
                    </IconButton>
                    <IconButton
                        size="small"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => onSizeChange(Math.max(100, imgSize - 10))}
                        sx={{ width: 22, height: 22, bgcolor: "rgba(0,0,0,0.55)", color: "white", "&:hover": { bgcolor: "rgba(0,0,0,0.7)" } }}
                    >
                        <Typography sx={{ fontSize: 14, fontWeight: 900, lineHeight: 1 }}>&minus;</Typography>
                    </IconButton>
                </Stack>
            )}
        </Box>
    );
}

// ─── Rich HTML renderer (safe subset) ──────────────────

function RichHtml({ html, sx }) {
    if (!html) return null;
    return (
        <Typography
            component="div"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
            sx={{
                fontSize: 13.5,
                lineHeight: 1.7,
                color: "text.primary",
                "& b, & strong": { fontWeight: 800 },
                "& i, & em": { fontStyle: "italic" },
                "& ul": { pl: 2.5, my: 0.5 },
                "& li": { mb: 0.25, fontSize: 13.5 },
                "& a": { color: "primary.main", textDecoration: "underline" },
                "& p": { my: 0.5 },
                ...sx,
            }}
        />
    );
}


function TinyTikTokIcon({ size = 14 }) {
    return (
        <Box component="span" sx={{ display: "flex", alignItems: "center", lineHeight: 0 }}>
            <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-2.1-2.79v-3.5a6.37 6.37 0 0 0-.79-.05 6.34 6.34 0 1 0 4.99 10.31V13.1a8.16 8.16 0 0 0 5.58 2.2V11.9a4.85 4.85 0 0 1-3.58-1.63V6.69h3.12Z" />
            </svg>
        </Box>
    );
}


function normalizeSocialHref(url) {
    if (!url) return "";
    const trimmed = String(url).trim();
    if (!trimmed) return "";
    if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
    if (trimmed.startsWith("/")) return trimmed;
    return `https://${trimmed}`;
}

function getSocialIconMeta(key) {
    const socialKey = String(key || "").toLowerCase();
    if (socialKey.includes("instagram")) return { label: "Instagram", icon: <InstagramIcon sx={{ fontSize: 14 }} />, color: "#E4405F" };
    if (socialKey.includes("facebook")) return { label: "Facebook", icon: <FacebookIcon sx={{ fontSize: 14 }} />, color: "#1877F2" };
    if (socialKey.includes("twitter") || socialKey === "x" || socialKey.includes("x.com")) return { label: "X", icon: <XIcon sx={{ fontSize: 14 }} />, color: null };
    if (socialKey.includes("youtube")) return { label: "YouTube", icon: <YouTubeIcon sx={{ fontSize: 14 }} />, color: "#FF0000" };
    if (socialKey.includes("tiktok")) return { label: "TikTok", icon: <TinyTikTokIcon size={14} />, color: null };
    if (socialKey.includes("website") || socialKey.includes("web")) return { label: "Website", icon: <LanguageRoundedIcon sx={{ fontSize: 14 }} />, color: null };
    return { label: "Link", icon: <LinkRoundedIcon sx={{ fontSize: 14 }} />, color: null };
}

function SocialIconLinks({ entries, size = 28 }) {
    if (!Array.isArray(entries) || entries.length === 0) return null;
    return (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
            {entries.map(([key, value]) => {
                const href = normalizeSocialHref(value);
                if (!href) return null;
                const meta = getSocialIconMeta(key);
                return (
                    <Tooltip key={key} title={meta.label} arrow>
                        <IconButton
                            component="a"
                            href={href}
                            target={href.startsWith("/") || href.startsWith("tel:") || href.startsWith("mailto:") ? undefined : "_blank"}
                            rel={href.startsWith("/") ? undefined : "noopener noreferrer"}
                            size="small"
                            sx={(t) => ({
                                width: size,
                                height: size,
                                color: meta.color || t.palette.text.primary,
                                bgcolor: alpha(meta.color || t.palette.text.primary, 0.08),
                                "&:hover": {
                                    bgcolor: alpha(meta.color || t.palette.text.primary, 0.18),
                                },
                            })}
                        >
                            {meta.icon}
                        </IconButton>
                    </Tooltip>
                );
            })}
        </Stack>
    );
}

// ═══════════════════════════════════════════════════════
// COMMUNITY PREVIEW — renders exactly how Discover shows it
// ═══════════════════════════════════════════════════════

function CommunityPreview({ form, isEditing }) {
    const accent = form.accent_color || null;
    const hlColor = form.highlight_color || null;
    const badgeColor = form.badge_color || null;
    const hasCover = Boolean(form.cover_photo_url);
    const hasAbout = Boolean(form.description);
    const hasOwner = Boolean(form.owner_name || form.owner_avatar_url || form.owner_title);
    const sections = Array.isArray(form.highlight_sections) ? form.highlight_sections : [];
    const hasLegacyHighlight = Boolean(form.highlight_title || form.highlight_body || form.highlight_photo_url);
    const hasServices = Array.isArray(form.services_list) && form.services_list.length > 0;
    const socialEntries = [
        ["facebook_url", form.facebook_url],
        ["instagram_url", form.instagram_url],
        ["twitter_url", form.twitter_url],
        ["youtube_url", form.youtube_url],
        ["tiktok_url", form.tiktok_url],
        ["website_url", form.website_url],
    ].filter(([, value]) => Boolean(String(value || "").trim()));
    const hasSocials = socialEntries.length > 0;

    return (
        <Paper
            elevation={isEditing ? 6 : 2}
            sx={(t) => ({
                borderRadius: 4,
                overflow: "hidden",
                bgcolor: t.palette.background.paper,
                border: isEditing ? `2px solid ${alpha(t.palette.primary.main, 0.3)}` : "1px solid",
                borderColor: isEditing ? undefined : alpha(t.palette.divider, 0.5),
                transition: "box-shadow 0.3s, border-color 0.3s",
            })}
        >
            {/* ══ Cover Photo ══ */}
            {hasCover ? (
                <Box sx={{ position: "relative", width: "100%", height: { xs: 210, sm: 250 }, overflow: "hidden" }}>
                    <Box component="img" src={form.cover_photo_url} alt="Cover" sx={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${form.cover_position || "center"}`, display: "block" }} />
                    {form.tagline && (
                        <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, p: 1.5, background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}>
                            <Typography sx={{ fontSize: 11, color: "white", fontWeight: 700, fontStyle: "italic" }}>{form.tagline}</Typography>
                        </Box>
                    )}
                </Box>
            ) : (
                <Box sx={{ width: "100%", height: { xs: 210, sm: 250 }, bgcolor: "grey.100", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CropOriginalRoundedIcon sx={{ fontSize: 40, color: "grey.300" }} />
                </Box>
            )}

            {/* ══ Header: Logo + Title + Social icons ══ */}
            <Box sx={{ px: 2, pt: 2, pb: 1.25, display: "flex", alignItems: "center", gap: 1.25, borderBottom: "1px solid", borderColor: (t) => alpha(t.palette.divider, 0.5) }}>
                <Avatar
                    src={form.logo_url || undefined}
                    sx={{ width: 52, height: 52, border: "2px solid", borderColor: (t) => alpha(t.palette.primary.main, 0.15), flexShrink: 0 }}
                    imgProps={{ style: { objectPosition: form.avatar_position || "center" } }}
                >
                    {!form.logo_url && <GroupsRoundedIcon sx={{ fontSize: 26, color: "grey.400" }} />}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 950, fontSize: 17, lineHeight: 1.2, minWidth: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {form.title || "Untitled Spotlight"}
                        </Typography>
                        {hasSocials && <SocialIconLinks entries={socialEntries} size={28} />}
                    </Stack>
                    {form.subtitle && (
                        <Typography sx={{ fontWeight: 700, fontSize: 11, color: "primary.main", letterSpacing: "0.03em", textTransform: "uppercase", mt: 0.15 }}>
                            {form.subtitle}
                        </Typography>
                    )}
                    {form.badge_text && (
                        <Chip
                            icon={<RenderIcon name={form.badge_icon} sx={{ fontSize: "12px !important" }} />}
                            label={form.badge_text}
                            size="small"
                            sx={{
                                fontWeight: 800, fontSize: 10.5, height: 22, borderRadius: 999, mt: 0.35,
                                ...(badgeColor
                                    ? { bgcolor: badgeColor, color: "#fff", "& .MuiChip-icon": { color: "#fff" } }
                                    : { color: "primary.main", border: "1px solid", borderColor: "primary.main" }),
                            }}
                        />
                    )}
                    {form.owner_location && (
                        <Stack direction="row" spacing={0.35} alignItems="center" sx={{ mt: 0.15 }}>
                            <PlaceRoundedIcon sx={{ fontSize: 12, color: "text.disabled" }} />
                            <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "text.secondary" }}>{form.owner_location}</Typography>
                        </Stack>
                    )}
                </Box>
            </Box>

            {/* ══ About — photo floated left of text ══ */}
            {hasAbout && (
                <Box sx={{ px: 2, pt: 2 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 14, mb: 1 }}>About {form.title || ""}</Typography>
                    <Box sx={{ position: "relative", overflow: "hidden" }}>
                        {form.about_photo_url && (
                            <Box component="img" src={form.about_photo_url} alt="About" sx={{ float: "left", width: { xs: 120, sm: 140 }, height: "auto", maxHeight: 180, objectFit: "contain", borderRadius: 2.5, mr: 1.75, mb: 0.75 }} />
                        )}
                        <RichHtml html={form.description} sx={{ fontSize: 13, lineHeight: 1.65, color: "text.secondary", fontWeight: 500 }} />
                        <Box sx={{ clear: "both" }} />
                    </Box>
                </Box>
            )}

            {hasAbout && <Divider sx={{ mx: 2, mt: 1.5 }} />}

            {/* ══ Highlight Sections — image left, text right (like Services) ══ */}
            {sections.length > 0 && sections.map((sec, idx) => (
                <Box key={idx} sx={{ px: 2, pt: 2 }}>
                    <Box sx={(t) => ({ borderRadius: 3, overflow: "hidden", border: "1px solid", borderColor: alpha(hlColor || t.palette.primary.main, 0.18), bgcolor: alpha(hlColor || t.palette.primary.main, 0.02) })}>
                        {/* Section header bar with icon + title */}
                        <Box sx={(t) => ({ px: 1.75, py: 0.9, bgcolor: alpha(hlColor || t.palette.primary.main, 0.07), borderBottom: "1px solid", borderColor: alpha(hlColor || t.palette.primary.main, 0.12), display: "flex", alignItems: "center", gap: 0.75 })}>
                            <RenderIcon name={sec.icon} sx={{ fontSize: 16, color: hlColor || "primary.main" }} />
                            <Typography sx={{ fontWeight: 900, fontSize: 11.5, color: hlColor || "primary.dark", letterSpacing: "0.04em", textTransform: "uppercase" }}>{sec.title || "Highlight"}</Typography>
                        </Box>
                        {/* Image left + text right */}
                        {(sec.photo_url || sec.body) && (
                            <Box sx={{ p: 1.75, overflow: "hidden" }}>
                                {sec.photo_url && (
                                    <Box component="img" src={sec.photo_url} alt={sec.title} sx={{ float: "left", width: { xs: "100%", sm: 150 }, height: "auto", maxHeight: 180, objectFit: "contain", borderRadius: 2, mr: 1.75, mb: 0.75, display: "block" }} />
                                )}
                                {sec.body && (
                                    <RichHtml html={sec.body} sx={{ fontSize: 12.5, lineHeight: 1.55, color: "text.secondary", fontWeight: 500 }} />
                                )}
                                <Box sx={{ clear: "both" }} />
                            </Box>
                        )}
                    </Box>
                </Box>
            ))}

            {/* ══ Legacy single highlight ══ */}
            {sections.length === 0 && hasLegacyHighlight && (
                <Box sx={{ px: 2, pt: 2 }}>
                    <Box sx={(t) => ({ borderRadius: 3, overflow: "hidden", border: "1px solid", borderColor: alpha(hlColor || t.palette.primary.main, 0.18), bgcolor: alpha(hlColor || t.palette.primary.main, 0.02) })}>
                        <Box sx={(t) => ({ px: 1.75, py: 0.9, bgcolor: alpha(hlColor || t.palette.primary.main, 0.07), borderBottom: "1px solid", borderColor: alpha(hlColor || t.palette.primary.main, 0.12), display: "flex", alignItems: "center", gap: 0.75 })}>
                            <StarRoundedIcon sx={{ fontSize: 16, color: hlColor || "primary.main" }} />
                            <Typography sx={{ fontWeight: 900, fontSize: 11.5, color: hlColor || "primary.dark", letterSpacing: "0.04em", textTransform: "uppercase" }}>{form.highlight_title || "Highlight"}</Typography>
                        </Box>
                        <Box sx={{ p: 1.75, overflow: "hidden" }}>
                            {form.highlight_photo_url && (
                                <Box component="img" src={form.highlight_photo_url} alt="" sx={{ float: "left", width: { xs: "100%", sm: 150 }, height: "auto", maxHeight: 180, objectFit: "contain", borderRadius: 2, mr: 1.75, mb: 0.75, display: "block" }} />
                            )}
                            <RichHtml html={form.highlight_body} sx={{ fontSize: 12.5, lineHeight: 1.55, color: "text.secondary", fontWeight: 500 }} />
                            <Box sx={{ clear: "both" }} />
                        </Box>
                    </Box>
                </Box>
            )}

            {/* ══ Organizer / Contact — Services-style with big photo ══ */}
            {hasOwner && (
                <>
                    <Divider sx={{ mx: 2, mt: 2 }} />
                    <Box sx={{ px: 2, pt: 2 }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 13, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.25 }}>
                            {form.owner_section_title || "Community Leaders"}
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="center">
                            {form.owner_avatar_url ? (
                                <Box
                                    component="img"
                                    src={form.owner_avatar_url}
                                    alt={form.owner_name}
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 2.5,
                                        objectFit: "cover",
                                        objectPosition: form.owner_avatar_position || "center",
                                        border: "2px solid",
                                        borderColor: (t) => alpha(t.palette.primary.main, 0.12),
                                        boxShadow: (t) => `0 2px 12px ${alpha(t.palette.common.black, 0.08)}`,
                                        flexShrink: 0,
                                    }}
                                />
                            ) : (
                                <Avatar sx={{ width: 80, height: 80, borderRadius: 2.5, bgcolor: "grey.200" }}>
                                    <GroupsRoundedIcon sx={{ fontSize: 32, color: "grey.500" }} />
                                </Avatar>
                            )}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                {form.owner_name && (
                                    <Typography sx={{ fontWeight: 900, fontSize: 15.5, lineHeight: 1.2 }}>{form.owner_name}</Typography>
                                )}
                                {form.owner_title && (
                                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: "text.secondary", mt: 0.15 }}>{form.owner_title}</Typography>
                                )}
                                {(form.owner_phone || form.owner_email) && (
                                    <Stack spacing={0.3} sx={{ mt: 0.75 }}>
                                        {form.owner_phone && (
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <PhoneRoundedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                                                <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "text.secondary" }}>{form.owner_phone}</Typography>
                                            </Stack>
                                        )}
                                        {form.owner_email && (
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <EmailRoundedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                                                <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "primary.main" }}>{form.owner_email}</Typography>
                                            </Stack>
                                        )}
                                    </Stack>
                                )}
                            </Box>
                        </Stack>
                    </Box>
                </>
            )}

            {/* ══ Additional owners ══ */}
            {(form.additional_owners || []).filter((ao) => ao && ao.name).length > 0 && (
                <Box sx={{ px: 2, pb: 1.5 }}>
                    {form.additional_owners.filter((ao) => ao && ao.name).map((ao, idx) => (
                        <Stack key={idx} direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1 }}>
                            {ao.avatar_url ? (
                                <Avatar src={ao.avatar_url} sx={{ width: 36, height: 36, borderRadius: 2 }} />
                            ) : (
                                <Avatar sx={{ width: 36, height: 36, bgcolor: "grey.200", borderRadius: 2, fontSize: 14 }}>
                                    {(ao.name || "?")[0]}
                                </Avatar>
                            )}
                            <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{ao.name}</Typography>
                                {ao.title && <Typography sx={{ fontSize: 11, color: "text.secondary" }}>{ao.title}</Typography>}
                            </Box>
                        </Stack>
                    ))}
                </Box>
            )}

            <Divider sx={{ mx: 2, mt: 1 }} />

            {/* ══ CTAs — full width stacked ══ */}
            <PreviewCtaButtons form={form} sx={{ px: 2, pt: 2, pb: 3 }} />
        </Paper>
    );
}

// ═══════════════════════════════════════════════════════
// BUSINESS PREVIEW — commercial / storefront Discover card
// ═══════════════════════════════════════════════════════

function BusinessPreview({ form, isEditing }) {
    const accent = form.accent_color || null;
    const hlColor = form.highlight_color || null;
    const badgeColor = form.badge_color || null;
    const hasCover = Boolean(form.cover_photo_url);
    const hasLogo = Boolean(form.logo_url);
    const hasAbout = Boolean(form.description);
    const hasOwner = Boolean(form.owner_name || form.owner_avatar_url || form.owner_title);
    const sections = Array.isArray(form.highlight_sections) ? form.highlight_sections : [];
    const hasLegacyHighlight = Boolean(form.highlight_title || form.highlight_body || form.highlight_photo_url);
    const hasServices = Array.isArray(form.services_list) && form.services_list.length > 0;
    const hasGallery = Array.isArray(form.bio_photos) && form.bio_photos.filter(Boolean).length > 0;
    const galleryPhotos = hasGallery ? form.bio_photos.filter(Boolean) : [];
    const hasVideo = Boolean(form.video_id);
    const additionalOwners = Array.isArray(form.additional_owners) ? form.additional_owners.filter((ao) => ao && (ao.name || ao.avatar_url)) : [];

    const socialEntries = [
        ["website_url", form.website_url],
        ["facebook_url", form.facebook_url],
        ["instagram_url", form.instagram_url],
        ["twitter_url", form.twitter_url],
        ["youtube_url", form.youtube_url],
        ["tiktok_url", form.tiktok_url],
    ].filter(([, value]) => Boolean(String(value || "").trim()));
    const hasSocials = socialEntries.length > 0;

    const [galleryIdx, setGalleryIdx] = useState(0);

    return (
        <Paper
            elevation={isEditing ? 6 : 2}
            sx={(t) => ({
                borderRadius: 4,
                overflow: "hidden",
                bgcolor: t.palette.background.paper,
                border: isEditing ? `2px solid ${alpha(t.palette.primary.main, 0.3)}` : "1px solid",
                borderColor: isEditing ? undefined : alpha(t.palette.divider, 0.5),
                transition: "box-shadow 0.3s, border-color 0.3s",
            })}
        >

            {/* ══ COVER PHOTO with gradient + title overlay ══ */}
            {hasCover ? (
                <Box sx={{ position: "relative", width: "100%", height: { xs: 150, sm: 180 }, overflow: "hidden", bgcolor: "grey.900" }}>
                    <Box
                        component="img"
                        src={form.cover_photo_url}
                        alt="Cover"
                        sx={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${form.cover_position || "center"}`, display: "block" }}
                    />
                    <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.04) 100%)" }} />
                    <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, px: 2, pb: 1.5 }}>
                        <Typography sx={{ fontWeight: 950, fontSize: { xs: 20, sm: 24 }, lineHeight: 1.05, letterSpacing: "-0.02em", color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>
                            {form.title || "Untitled Business"}
                        </Typography>
                        {form.subtitle && (
                            <Typography sx={{ fontWeight: 700, fontSize: 11, color: "rgba(255,255,255,0.82)", mt: 0.3, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                                {form.subtitle}
                            </Typography>
                        )}
                    </Box>
                </Box>
            ) : (
                /* No-cover fallback header */
                <Box sx={{ px: 2, pt: 2.5, pb: 0 }}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        {hasLogo ? (
                            <Avatar
                                src={form.logo_url}
                                sx={{ width: 52, height: 52, border: "2px solid", borderColor: (t) => alpha(t.palette.primary.main, 0.15) }}
                                imgProps={{ style: { objectPosition: form.avatar_position || "center" } }}
                            />
                        ) : (
                            <Avatar sx={{ width: 52, height: 52, bgcolor: "grey.200", border: "2px solid", borderColor: "divider" }}>
                                <StorefrontRoundedIcon sx={{ fontSize: 24, color: "grey.400" }} />
                            </Avatar>
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 950, fontSize: { xs: 18, sm: 20 }, lineHeight: 1.15, letterSpacing: "-0.02em", minWidth: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {form.title || "Untitled Business"}
                                </Typography>
                                {hasSocials && <SocialIconLinks entries={socialEntries} size={24} />}
                            </Stack>
                            {form.subtitle && (
                                <Typography sx={{ fontWeight: 700, fontSize: 12, color: "primary.main", mt: 0.25, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                                    {form.subtitle}
                                </Typography>
                            )}
                        </Box>
                    </Stack>
                </Box>
            )}

            {/* ══ COMPACT INFO STRIP (when cover exists: avatar + title + social) ══ */}
            <Box
                sx={{
                    px: 2,
                    py: 1.25,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    borderBottom: "1px solid",
                    borderColor: (t) => alpha(t.palette.divider, 0.5),
                }}
            >
                {hasCover && (
                    <Avatar
                        src={form.logo_url || undefined}
                        sx={{ width: 48, height: 48, border: "2px solid", borderColor: (t) => alpha(t.palette.primary.main, 0.15), flexShrink: 0 }}
                        imgProps={{ style: { objectPosition: form.avatar_position || "center" } }}
                    >
                        {!form.logo_url && <StorefrontRoundedIcon sx={{ fontSize: 22, color: "grey.400" }} />}
                    </Avatar>
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    {hasCover && (
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ minWidth: 0, mb: form.subtitle || form.owner_location ? 0.25 : 0 }}>
                            <Typography sx={{ fontWeight: 950, fontSize: { xs: 17, sm: 19 }, lineHeight: 1.15, letterSpacing: "-0.02em", minWidth: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {form.title || "Untitled Business"}
                            </Typography>
                            {hasSocials && <SocialIconLinks entries={socialEntries} size={24} />}
                        </Stack>
                    )}
                    {!hasCover && form.owner_location && (
                        <Stack direction="row" spacing={0.35} alignItems="center">
                            <PlaceRoundedIcon sx={{ fontSize: 12, color: "text.disabled" }} />
                            <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "text.secondary" }}>{form.owner_location}</Typography>
                        </Stack>
                    )}
                    {hasCover && (
                        <>
                            {form.subtitle && !form.owner_location && (
                                <Typography sx={{ fontWeight: 700, fontSize: 11, color: "primary.main", letterSpacing: "0.03em", textTransform: "uppercase", lineHeight: 1.2 }}>
                                    {form.subtitle}
                                </Typography>
                            )}
                            {form.owner_location && (
                                <Stack direction="row" spacing={0.35} alignItems="center" sx={{ mt: 0.15 }}>
                                    <PlaceRoundedIcon sx={{ fontSize: 12, color: "text.disabled" }} />
                                    <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "text.secondary" }}>{form.owner_location}</Typography>
                                </Stack>
                            )}
                        </>
                    )}
                </Box>
            </Box>

            {/* ══ VIDEO — under title ══ */}
            {hasVideo && (
                <Box sx={{ px: 2, pt: 2 }}>
                    <Box sx={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: 2.5, overflow: "hidden", bgcolor: "black" }}>
                        {form.video_thumbnail_url ? (
                            <Box component="img" src={form.video_thumbnail_url} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.85 }} />
                        ) : (
                            <Box sx={{ width: "100%", height: "100%", bgcolor: (t) => alpha(t.palette.common.black, 0.92) }} />
                        )}
                        <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Box sx={{ width: 52, height: 52, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.92)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.35)" }}>
                                <Box sx={{ width: 0, height: 0, borderTop: "10px solid transparent", borderBottom: "10px solid transparent", borderLeft: "16px solid", borderLeftColor: "common.black", ml: "3px" }} />
                            </Box>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* ══ ABOUT ══ */}
            {hasAbout && (
                <Box sx={{ px: 2, pt: 2.5 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 15, mb: 1.25 }}>About {form.title || ""}</Typography>
                    <RichHtml html={form.description} />
                </Box>
            )}

            {hasAbout && <Divider sx={{ mx: 2, mt: 2.5 }} />}

            {/* ══ MEET THE OWNERS — big photo + name + title + about text ══ */}
            {hasOwner && (
                <Box sx={{ px: 2, pt: 2 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 13, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.25 }}>
                        {form.owner_section_title || (additionalOwners.length > 0 ? "Meet the Team" : "Meet the Owner")}
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                            component="img"
                            src={form.owner_avatar_url || "/default-avatar.png"}
                            alt={form.owner_name}
                            sx={{
                                width: 90,
                                height: 90,
                                borderRadius: 2.5,
                                objectFit: "cover",
                                objectPosition: form.owner_avatar_position || "center",
                                border: "2px solid",
                                borderColor: (t) => alpha(t.palette.primary.main, 0.12),
                                boxShadow: (t) => `0 2px 12px ${alpha(t.palette.common.black, 0.08)}`,
                                flexShrink: 0,
                            }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 900, fontSize: 16, lineHeight: 1.2 }}>
                                {form.owner_name}
                            </Typography>
                            {form.owner_title && (
                                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "text.secondary", mt: 0.15 }}>
                                    {form.owner_title}
                                </Typography>
                            )}
                            {(form.owner_phone || form.owner_email) && (
                                <Stack spacing={0.3} sx={{ mt: 0.75 }}>
                                    {form.owner_phone && (
                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                            <PhoneRoundedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                                            <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "text.secondary" }}>{form.owner_phone}</Typography>
                                        </Stack>
                                    )}
                                    {form.owner_email && (
                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                            <EmailRoundedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                                            <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "primary.main" }}>{form.owner_email}</Typography>
                                        </Stack>
                                    )}
                                </Stack>
                            )}
                        </Box>
                    </Stack>
                    {form.owner_about && (
                        <Typography sx={{ fontSize: 12.5, lineHeight: 1.6, color: "text.secondary", mt: 1.25, fontWeight: 500, whiteSpace: "pre-line" }}>
                            {form.owner_about}
                        </Typography>
                    )}

                    {/* Additional owners */}
                    {additionalOwners.map((ao, aoIdx) => (
                        <Fragment key={aoIdx}>
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
                                <Box
                                    component="img"
                                    src={ao.avatar_url || "/default-avatar.png"}
                                    alt={ao.name || "Team member"}
                                    sx={{
                                        width: 90,
                                        height: 90,
                                        borderRadius: 2.5,
                                        objectFit: "cover",
                                        objectPosition: ao.avatar_position || "center",
                                        border: "2px solid",
                                        borderColor: (t) => alpha(t.palette.primary.main, 0.10),
                                        boxShadow: (t) => `0 2px 10px ${alpha(t.palette.common.black, 0.06)}`,
                                        flexShrink: 0,
                                    }}
                                />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 900, fontSize: 15, lineHeight: 1.2 }}>{ao.name}</Typography>
                                    {ao.title && (
                                        <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "text.secondary", mt: 0.15 }}>{ao.title}</Typography>
                                    )}
                                    {(ao.phone || ao.email) && (
                                        <Stack spacing={0.25} sx={{ mt: 0.5 }}>
                                            {ao.phone && (
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <PhoneRoundedIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                                                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: "text.secondary" }}>{ao.phone}</Typography>
                                                </Stack>
                                            )}
                                            {ao.email && (
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <EmailRoundedIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                                                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: "primary.main" }}>{ao.email}</Typography>
                                                </Stack>
                                            )}
                                        </Stack>
                                    )}
                                </Box>
                            </Stack>
                            {ao.about && (
                                <Typography sx={{ fontSize: 12.5, lineHeight: 1.6, color: "text.secondary", mt: 1, fontWeight: 500, whiteSpace: "pre-line" }}>
                                    {ao.about}
                                </Typography>
                            )}
                        </Fragment>
                    ))}
                </Box>
            )}

            {hasOwner && <Divider sx={{ mx: 2, mt: 2.5 }} />}

            {/* ══ HIGHLIGHT SECTIONS — card style ══ */}
            {sections.length > 0 && sections.map((sec, idx) => (
                <Box key={idx} sx={{ px: 2, pt: 2.5 }}>
                    <Box sx={(t) => ({ borderRadius: 3, overflow: "hidden", border: `1px solid ${alpha(hlColor || t.palette.primary.main, 0.15)}`, bgcolor: alpha(hlColor || t.palette.primary.main, 0.03) })}>
                        <Box sx={(t) => ({ px: 1.75, py: 0.9, bgcolor: alpha(hlColor || t.palette.primary.main, 0.07), borderBottom: `1px solid ${alpha(hlColor || t.palette.primary.main, 0.12)}`, display: "flex", alignItems: "center", gap: 0.75 })}>
                            <RenderIcon name={sec.icon} sx={{ fontSize: 16, color: hlColor || "primary.main" }} />
                            <Typography sx={{ fontWeight: 900, fontSize: 11.5, color: hlColor || "primary.dark", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                                {sec.title || "Highlight"}
                            </Typography>
                        </Box>
                        {(sec.photo_url || sec.gif_url || sec.body) && (
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.75} alignItems={{ xs: "stretch", sm: "center" }} sx={{ p: 1.75 }}>
                                {(sec.photo_url || sec.gif_url) && (
                                    <Box component="img" src={sec.gif_url || sec.photo_url} alt={sec.title} sx={{ width: { xs: "100%", sm: 160 }, flexShrink: 0, height: "auto", maxHeight: 200, objectFit: "contain", borderRadius: 2 }} />
                                )}
                                {sec.body && (
                                    <RichHtml html={sec.body} />
                                )}
                            </Stack>
                        )}
                    </Box>
                </Box>
            ))}

            {/* Legacy single highlight — card style */}
            {sections.length === 0 && hasLegacyHighlight && (
                <Box sx={{ px: 2, pt: 2.5 }}>
                    <Box sx={(t) => ({ borderRadius: 3, overflow: "hidden", border: `1px solid ${alpha(hlColor || t.palette.primary.main, 0.15)}`, bgcolor: alpha(hlColor || t.palette.primary.main, 0.03) })}>
                        {form.highlight_title && (
                            <Box sx={(t) => ({ px: 1.75, py: 0.9, bgcolor: alpha(hlColor || t.palette.primary.main, 0.07), borderBottom: `1px solid ${alpha(hlColor || t.palette.primary.main, 0.12)}`, display: "flex", alignItems: "center", gap: 0.75 })}>
                                <StarRoundedIcon sx={{ fontSize: 16, color: hlColor || "primary.main" }} />
                                <Typography sx={{ fontWeight: 900, fontSize: 11.5, color: hlColor || "primary.dark", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                                    {form.highlight_title}
                                </Typography>
                            </Box>
                        )}
                        {(form.highlight_photo_url || form.highlight_body) && (
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.75} alignItems={{ xs: "stretch", sm: "center" }} sx={{ p: 1.75 }}>
                                {form.highlight_photo_url && (
                                    <Box component="img" src={form.highlight_photo_url} alt="" sx={{ width: { xs: "100%", sm: 160 }, flexShrink: 0, height: "auto", maxHeight: 200, objectFit: "contain", borderRadius: 2 }} />
                                )}
                                {form.highlight_body && (
                                    <RichHtml html={form.highlight_body} />
                                )}
                            </Stack>
                        )}
                    </Box>
                </Box>
            )}

            {(sections.length > 0 || hasLegacyHighlight) && <Divider sx={{ mx: 2, mt: 2 }} />}

            {/* ══ GALLERY ══ */}
            {hasGallery && (
                <Box sx={{ px: 2, pt: 2 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 13, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1 }}>Gallery</Typography>
                    <Box sx={{ display: "flex", gap: 1, overflow: "hidden", borderRadius: 2 }}>
                        {galleryPhotos.slice(galleryIdx, galleryIdx + 3).map((url, idx) => (
                            <Box key={galleryIdx + idx} component="img" src={url} alt={`Photo ${galleryIdx + idx + 1}`} sx={{ height: 90, width: 120, objectFit: "cover", borderRadius: 2, border: "1px solid", borderColor: (t) => alpha(t.palette.divider, 0.4), flexShrink: 0 }} />
                        ))}
                    </Box>
                </Box>
            )}

            {hasGallery && <Divider sx={{ mx: 2, mt: 2 }} />}

            {/* ══ SERVICES OFFERED ══ */}
            {hasServices && (
                <Box sx={{ px: 2, pt: 2 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 15, mb: 1.25 }}>Services Offered</Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                        {form.services_list.map((s) => (
                            <Chip key={s} label={s} size="small" variant="outlined" sx={(t) => ({ fontWeight: 700, fontSize: 12, borderColor: alpha(t.palette.text.primary, 0.12) })} />
                        ))}
                    </Box>
                </Box>
            )}

            {hasServices && <Divider sx={{ mx: 2, mt: 2.5 }} />}

            {/* ══ CTAs ══ */}
            <PreviewCtaButtons form={form} sx={{ px: 2, pt: 2, pb: 3 }} />
        </Paper>
    );
}

// ═══════════════════════════════════════════════════════
// ARTIST PREVIEW — matches ArtistDiscoverTab.jsx exactly
// ═══════════════════════════════════════════════════════

function ArtistPreview({ form, isEditing }) {
    const accent = form.accent_color || null;
    const hlColor = form.highlight_color || null;
    const badgeColor = form.badge_color || null;
    const hasCover = Boolean(form.cover_photo_url);
    const hasAbout = Boolean(form.description);
    const sections = Array.isArray(form.highlight_sections) ? form.highlight_sections : [];
    const hasLegacyHighlight = Boolean(form.highlight_title || form.highlight_body || form.highlight_photo_url);
    const genres = Array.isArray(form.services_list) ? form.services_list : [];
    const ml = form.music_links || {};
    const hasStreaming = Boolean(ml.spotify || ml.appleMusic || ml.youtube || ml.soundcloud || ml.bandcamp);
    const socialEntries = [
        ["facebook_url", form.facebook_url],
        ["instagram_url", form.instagram_url],
        ["twitter_url", form.twitter_url],
        ["youtube_url", form.youtube_url],
        ["tiktok_url", form.tiktok_url],
        ["website_url", form.website_url],
    ].filter(([, value]) => Boolean(String(value || "").trim()));
    const hasSocials = socialEntries.length > 0;
    const hasContact = Boolean(form.owner_phone || form.owner_email);
    const hasVideo = Boolean(form.video_id);
    const bioPhotos = [
        ...(Array.isArray(form.bio_photos) ? form.bio_photos : []),
        ...(form.about_photo_url && !(Array.isArray(form.bio_photos) && form.bio_photos.length > 0) ? [form.about_photo_url] : []),
    ];

    return (
        <Paper
            elevation={isEditing ? 6 : 2}
            sx={(t) => ({
                borderRadius: 4,
                overflow: "hidden",
                bgcolor: t.palette.background.paper,
                border: isEditing ? `2px solid ${alpha(t.palette.primary.main, 0.3)}` : "1px solid",
                borderColor: isEditing ? undefined : alpha(t.palette.divider, 0.5),
                transition: "box-shadow 0.3s, border-color 0.3s",
            })}
        >
            {/* ══ CINEMATIC COVER — name overlaid ON image ══ */}
            {hasCover ? (
                <Box sx={{ position: "relative", width: "100%", height: { xs: 180, sm: 220 }, overflow: "hidden", bgcolor: "grey.900" }}>
                    <Box component="img" src={form.cover_photo_url} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${form.cover_position || "center"}`, display: "block" }} />
                    <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.05) 100%)" }} />
                    <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, px: 2, pb: 2 }}>
                        <Typography sx={{ fontWeight: 950, fontSize: { xs: 24, sm: 30 }, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>
                            {form.title || "Artist Name"}
                        </Typography>
                        {form.tagline && (
                            <Typography sx={{ fontWeight: 600, fontSize: { xs: 12, sm: 13.5 }, color: "rgba(255,255,255,0.82)", mt: 0.25, fontStyle: "italic", lineHeight: 1.35 }}>
                                {form.tagline}
                            </Typography>
                        )}
                    </Box>
                </Box>
            ) : (
                <Box sx={(t) => ({ px: 2, pt: 2.5, pb: 1.5, bgcolor: alpha(t.palette.secondary?.main || "#D4A843", 0.03) })}>
                    <Typography sx={{ fontWeight: 950, fontSize: { xs: 22, sm: 26 }, lineHeight: 1.1, letterSpacing: "-0.02em", color: "text.primary" }}>
                        {form.title || "Artist Name"}
                    </Typography>
                    {form.tagline && (
                        <Typography sx={{ fontWeight: 600, fontSize: 13, color: "text.secondary", mt: 0.25, fontStyle: "italic" }}>
                            {form.tagline}
                        </Typography>
                    )}
                </Box>
            )}

            {/* ══ COMPACT INFO STRIP — bigger avatar, name beside it, genre, location, socials ══ */}
            <Box sx={{ px: 2, py: 1.25, display: "flex", alignItems: "center", gap: 1.25, borderBottom: "1px solid", borderColor: (t) => alpha(t.palette.divider, 0.5) }}>
                <Avatar
                    src={form.logo_url || undefined}
                    sx={{ width: 52, height: 52, border: "2px solid", borderColor: (t) => alpha(t.palette.secondary?.main || "#D4A843", 0.15), flexShrink: 0 }}
                    imgProps={{ style: { objectPosition: form.avatar_position || "center" } }}
                >
                    {!form.logo_url && <MusicNoteRoundedIcon sx={{ fontSize: 24, color: "grey.400" }} />}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    {form.subtitle && (
                        <Typography sx={{ fontWeight: 700, fontSize: 11, color: "secondary.main", letterSpacing: "0.03em", textTransform: "uppercase", lineHeight: 1.2 }}>
                            {form.subtitle}
                        </Typography>
                    )}
                    {form.owner_location && (
                        <Stack direction="row" spacing={0.35} alignItems="center" sx={{ mt: 0.15 }}>
                            <PlaceRoundedIcon sx={{ fontSize: 12, color: "text.disabled" }} />
                            <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "text.secondary" }}>{form.owner_location}</Typography>
                        </Stack>
                    )}
                </Box>
                {/* Social icons — clickable branded SVGs */}
                <Stack direction="row" spacing={0.25} alignItems="center">
                    {form.facebook_url && (
                        <IconButton component="a" href={form.facebook_url} target="_blank" rel="noopener noreferrer" size="small" sx={{ width: 28, height: 28 }}>
                            <Box component="svg" viewBox="0 0 24 24" sx={{ width: 14, height: 14, display: "block" }}><path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" /></Box>
                        </IconButton>
                    )}
                    {form.instagram_url && (
                        <IconButton component="a" href={form.instagram_url} target="_blank" rel="noopener noreferrer" size="small" sx={{ width: 28, height: 28 }}>
                            <Box component="svg" viewBox="0 0 24 24" sx={{ width: 14, height: 14, display: "block" }}><defs><linearGradient id="ig-prev2" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#FFDC80" /><stop offset="25%" stopColor="#F77737" /><stop offset="50%" stopColor="#E1306C" /><stop offset="75%" stopColor="#C13584" /><stop offset="100%" stopColor="#833AB4" /></linearGradient></defs><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.403a4.088 4.088 0 011.47.957c.453.453.778.91.957 1.47.163.46.35 1.26.404 2.43.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.404 2.43a4.088 4.088 0 01-.957 1.47 4.088 4.088 0 01-1.47.957c-.46.163-1.26.35-2.43.404-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.43-.404a4.088 4.088 0 01-1.47-.957 4.088 4.088 0 01-.957-1.47c-.163-.46-.35-1.26-.404-2.43C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.404-2.43a4.088 4.088 0 01.957-1.47A4.088 4.088 0 015.064 2.293c.46-.163 1.26-.35 2.43-.404C8.76 1.831 9.14 1.82 12 1.82zm0-1.657C8.741.163 8.332.175 7.052.234 5.775.293 4.902.5 4.14.81a5.726 5.726 0 00-2.08 1.356A5.726 5.726 0 00.705 4.245C.4 5.007.19 5.88.134 7.157.075 8.437.063 8.846.063 12.106s.012 3.668.07 4.948c.058 1.277.265 2.15.572 2.912a5.726 5.726 0 001.356 2.08 5.726 5.726 0 002.08 1.356c.762.306 1.636.513 2.912.571 1.28.059 1.689.07 4.948.07s3.668-.012 4.948-.07c1.277-.058 2.15-.265 2.912-.571a5.726 5.726 0 002.08-1.356 5.726 5.726 0 001.356-2.08c.306-.762.513-1.636.571-2.912.059-1.28.07-1.689.07-4.948s-.012-3.668-.07-4.948c-.058-1.277-.265-2.15-.571-2.912a5.726 5.726 0 00-1.356-2.08A5.726 5.726 0 0019.86.81c-.762-.306-1.636-.513-2.912-.571C15.668.175 15.259.163 12 .163zm0 5.838a5.838 5.838 0 100 11.676 5.838 5.838 0 000-11.676zm0 9.838a4 4 0 110-8 4 4 0 010 8zm6.406-10.845a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z" fill="url(#ig-prev2)" /></Box>
                        </IconButton>
                    )}
                    {form.tiktok_url && (
                        <IconButton component="a" href={form.tiktok_url} target="_blank" rel="noopener noreferrer" size="small" sx={{ width: 28, height: 28 }}>
                            <Box component="svg" viewBox="0 0 24 24" sx={{ width: 14, height: 14, display: "block" }}><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" fill="#000" /></Box>
                        </IconButton>
                    )}
                    {form.website_url && (
                        <IconButton component="a" href={form.website_url.startsWith("http") ? form.website_url : `https://${form.website_url}`} target="_blank" rel="noopener noreferrer" size="small" sx={{ width: 28, height: 28 }}>
                            <Box component="svg" viewBox="0 0 24 24" sx={{ width: 14, height: 14, display: "block", color: "text.secondary" }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor" /></Box>
                        </IconButton>
                    )}
                    {form.owner_email && (
                        <IconButton component="a" href={`mailto:${form.owner_email}`} size="small" sx={{ width: 28, height: 28 }}>
                            <EmailRoundedIcon sx={{ fontSize: 15, color: "text.secondary" }} />
                        </IconButton>
                    )}
                </Stack>
            </Box>

            {/* ══ STREAMING LINKS — branded clickable buttons ══ */}
            {hasStreaming && (
                <Box sx={{ px: 2, pt: 2 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 11, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.08em", mb: 1 }}>
                        Listen On
                    </Typography>
                    <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
                        {ml.spotify && (
                            <Button component="a" href={ml.spotify} target="_blank" rel="noopener noreferrer" size="small" variant="text" disableElevation startIcon={<Box component="svg" viewBox="0 0 24 24" sx={{ width: 15, height: 15, display: "block" }}><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" fill="#1DB954" /></Box>} sx={(t) => ({ textTransform: "none", fontWeight: 700, fontSize: 12, borderRadius: 999, px: 1.75, py: 0.6, bgcolor: alpha(t.palette.text.primary, 0.06), color: "text.primary", "&:hover": { bgcolor: alpha(t.palette.text.primary, 0.1) } })}>Spotify</Button>
                        )}
                        {ml.appleMusic && (
                            <Button component="a" href={ml.appleMusic} target="_blank" rel="noopener noreferrer" size="small" variant="text" disableElevation startIcon={<Box component="svg" viewBox="0 0 361 361" sx={{ width: 15, height: 15, display: "block" }}><linearGradient id="am-prev2" x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stopColor="#FA233B" /><stop offset="100%" stopColor="#FB5C74" /></linearGradient><rect width="361" height="361" rx="80" fill="url(#am-prev2)" /><path d="M255 96.7v131.8c0 14.6-9 26.3-25.3 29.7-6 1.3-12.3 1-17.8-1.5-7.6-3.5-12.2-10.2-12.8-18.6-.7-10 4.3-18.4 13.2-22.7 5.6-2.7 11.7-3.7 17.8-4.5 4-.5 8-1.2 11-3.8 2-1.7 3-4 3-6.8V137l-88 19.7v103c0 14.8-8.8 26.4-25.3 29.9-5.9 1.3-12 1-17.4-1.3-7.8-3.3-12.6-9.9-13.3-18.3-.9-10.2 4-18.8 13-23.2 5.5-2.7 11.5-3.8 17.6-4.6 4.2-.6 8.3-1.3 11.3-4 1.8-1.5 2.8-3.7 2.9-6.2V115c0-3.5 1-6.3 4-8.3 2-1.3 4.3-2 6.7-2.5l78-17.5c3.5-.8 7-1.5 10.6-.7 4.6 1.1 7.3 4.1 7.6 8.9.1.6.1 1.2.1 1.8z" fill="#fff" /></Box>} sx={(t) => ({ textTransform: "none", fontWeight: 700, fontSize: 12, borderRadius: 999, px: 1.75, py: 0.6, bgcolor: alpha(t.palette.text.primary, 0.06), color: "text.primary", "&:hover": { bgcolor: alpha(t.palette.text.primary, 0.1) } })}>Apple Music</Button>
                        )}
                        {ml.youtube && (
                            <Button component="a" href={ml.youtube} target="_blank" rel="noopener noreferrer" size="small" variant="text" disableElevation startIcon={<Box component="svg" viewBox="0 0 24 24" sx={{ width: 15, height: 15, display: "block" }}><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FF0000" /></Box>} sx={(t) => ({ textTransform: "none", fontWeight: 700, fontSize: 12, borderRadius: 999, px: 1.75, py: 0.6, bgcolor: alpha(t.palette.text.primary, 0.06), color: "text.primary", "&:hover": { bgcolor: alpha(t.palette.text.primary, 0.1) } })}>YouTube</Button>
                        )}
                        {ml.soundcloud && (
                            <Button component="a" href={ml.soundcloud} target="_blank" rel="noopener noreferrer" size="small" variant="text" disableElevation startIcon={<MusicNoteRoundedIcon sx={{ fontSize: "15px !important", color: "#FF5500" }} />} sx={(t) => ({ textTransform: "none", fontWeight: 700, fontSize: 12, borderRadius: 999, px: 1.75, py: 0.6, bgcolor: alpha(t.palette.text.primary, 0.06), color: "text.primary", "&:hover": { bgcolor: alpha(t.palette.text.primary, 0.1) } })}>SoundCloud</Button>
                        )}
                        {ml.bandcamp && (
                            <Button component="a" href={ml.bandcamp} target="_blank" rel="noopener noreferrer" size="small" variant="text" disableElevation startIcon={<MusicNoteRoundedIcon sx={{ fontSize: "15px !important", color: "#1DA0C3" }} />} sx={(t) => ({ textTransform: "none", fontWeight: 700, fontSize: 12, borderRadius: 999, px: 1.75, py: 0.6, bgcolor: alpha(t.palette.text.primary, 0.06), color: "text.primary", "&:hover": { bgcolor: alpha(t.palette.text.primary, 0.1) } })}>Bandcamp</Button>
                        )}
                    </Stack>
                </Box>
            )}

            {/* ══ ABOUT — bio text with about_photo floated left, then gallery below ══ */}
            {(hasAbout || bioPhotos.length > 0 || form.about_photo_url) && (
                <Box sx={{ px: 2, pt: 2 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 14, mb: 1 }}>About {form.title || "Artist"}</Typography>

                    {/* About photo floated left of description text */}
                    <Box sx={{ position: "relative", overflow: "hidden" }}>
                        {form.about_photo_url && (
                            <Box
                                component="img"
                                src={form.about_photo_url}
                                alt={`About ${form.title}`}
                                sx={{
                                    float: "left",
                                    width: { xs: 120, sm: 140 },
                                    height: "auto",
                                    maxHeight: 180,
                                    objectFit: "contain",
                                    borderRadius: 2.5,
                                    mr: 1.75,
                                    mb: 0.75,
                                }}
                            />
                        )}
                        {hasAbout && (
                            <RichHtml html={form.description} sx={{ fontSize: 13, lineHeight: 1.65, color: "text.secondary", fontWeight: 500 }} />
                        )}
                        <Box sx={{ clear: "both" }} />
                    </Box>

                    {/* Bio photos gallery — below the about text */}
                    {bioPhotos.length > 0 && (
                        <Box
                            sx={{
                                display: "flex",
                                gap: 1,
                                overflowX: "auto",
                                pb: 1,
                                mt: 1.25,
                                "&::-webkit-scrollbar": { height: 4 },
                                "&::-webkit-scrollbar-thumb": { bgcolor: (t) => alpha(t.palette.text.primary, 0.15), borderRadius: 2 },
                            }}
                        >
                            {bioPhotos.map((url, idx) => (
                                <Box
                                    key={idx}
                                    component="img"
                                    src={url}
                                    alt=""
                                    sx={{
                                        width: bioPhotos.length === 1 ? "100%" : 140,
                                        height: bioPhotos.length === 1 ? 170 : 110,
                                        objectFit: "cover",
                                        objectPosition: idx === 0 ? "top center" : "center",
                                        borderRadius: 2,
                                        border: "1px solid",
                                        borderColor: (t) => alpha(t.palette.divider, 0.4),
                                        flexShrink: 0,
                                    }}
                                />
                            ))}
                        </Box>
                    )}
                </Box>
            )}

            {/* ══ HIGHLIGHT SECTIONS (multi) ══ */}
            {sections.length > 0 && sections.map((sec, idx) => (
                <Box key={idx} sx={{ px: 2, pt: 2 }}>
                    <Box sx={(t) => ({ borderRadius: 3, overflow: "hidden", border: "1px solid", borderColor: alpha(t.palette.divider, 0.6), bgcolor: alpha(t.palette.common.black, 0.02) })}>
                        <Box sx={(t) => ({ px: 1.75, py: 0.9, bgcolor: alpha(hlColor || t.palette.secondary?.main || "#D4A843", 0.06), borderBottom: "1px solid", borderColor: alpha(hlColor || t.palette.secondary?.main || "#D4A843", 0.1), display: "flex", alignItems: "center", gap: 0.75 })}>
                            <RenderIcon name={sec.icon} sx={{ fontSize: 16, color: hlColor || "secondary.main" }} />
                            <Typography sx={{ fontWeight: 900, fontSize: 11.5, color: hlColor || "secondary.dark", letterSpacing: "0.04em", textTransform: "uppercase" }}>{sec.title || "Highlight"}</Typography>
                        </Box>
                        {(sec.photo_url || sec.body) && (
                            <Box sx={{ p: 1.75, overflow: "hidden" }}>
                                {sec.photo_url && (
                                    <Box component="img" src={sec.photo_url} alt={sec.title} sx={{ float: "left", width: { xs: "100%", sm: 150 }, height: "auto", maxHeight: 180, objectFit: "contain", borderRadius: 2, mr: 1.75, mb: 0.75, display: "block" }} />
                                )}
                                {sec.body && (
                                    <RichHtml html={sec.body} sx={{ fontSize: 12.5, lineHeight: 1.55, color: "text.secondary", fontWeight: 500 }} />
                                )}
                                <Box sx={{ clear: "both" }} />
                            </Box>
                        )}
                    </Box>
                </Box>
            ))}

            {/* ══ Legacy single highlight (backward compat) ══ */}
            {sections.length === 0 && hasLegacyHighlight && (
                <Box sx={{ px: 2, pt: 2 }}>
                    <Box sx={(t) => ({ borderRadius: 3, overflow: "hidden", border: "1px solid", borderColor: alpha(t.palette.divider, 0.6), bgcolor: alpha(t.palette.common.black, 0.02) })}>
                        <Box sx={(t) => ({ px: 1.75, py: 0.9, bgcolor: alpha(hlColor || t.palette.secondary?.main || "#D4A843", 0.06), borderBottom: "1px solid", borderColor: alpha(hlColor || t.palette.secondary?.main || "#D4A843", 0.1), display: "flex", alignItems: "center", gap: 0.75 })}>
                            <StarRoundedIcon sx={{ fontSize: 16, color: hlColor || "secondary.main" }} />
                            <Typography sx={{ fontWeight: 900, fontSize: 11.5, color: hlColor || "secondary.dark", letterSpacing: "0.04em", textTransform: "uppercase" }}>Featured Release</Typography>
                        </Box>
                        <Box sx={{ p: 1.75, overflow: "hidden" }}>
                            {form.highlight_photo_url && (
                                <Box component="img" src={form.highlight_photo_url} alt={form.highlight_title} sx={{ float: "left", width: { xs: "100%", sm: 150 }, height: "auto", maxHeight: 180, objectFit: "contain", borderRadius: 2, mr: 1.75, mb: 0.75, display: "block" }} />
                            )}
                            {form.highlight_title && <Typography sx={{ fontWeight: 900, fontSize: 14.5, lineHeight: 1.2, color: "text.primary", mb: 0.5 }}>{form.highlight_title}</Typography>}
                            {form.highlight_body && <RichHtml html={form.highlight_body} sx={{ fontSize: 12.5, lineHeight: 1.55, color: "text.secondary", fontWeight: 500 }} />}
                            <Box sx={{ clear: "both" }} />
                        </Box>
                    </Box>
                </Box>
            )}

            {/* ══ VIDEO — below about section ══ */}
            {hasVideo && (
                <Box sx={{ px: 2, pt: 2 }}>
                    <Box sx={{ position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: 3, overflow: "hidden", bgcolor: "grey.900" }}>
                        {form.video_thumbnail_url ? (
                            <Box component="img" src={form.video_thumbnail_url} alt="Video thumbnail" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        ) : (
                            <Box sx={{ position: "absolute", inset: 0, bgcolor: "grey.800" }} />
                        )}
                        <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Box sx={{ width: 52, height: 52, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.92)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.35)" }}>
                                <Box sx={{ width: 0, height: 0, borderTop: "11px solid transparent", borderBottom: "11px solid transparent", borderLeft: "18px solid", borderLeftColor: "common.black", ml: "3px" }} />
                            </Box>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* ══ CONTACT ROW ══ */}
            {hasContact && (
                <Box sx={{ px: 2, pt: 1.5 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
                        {form.owner_phone && (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <PhoneRoundedIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "text.secondary" }}>{form.owner_phone}</Typography>
                            </Stack>
                        )}
                        {form.owner_email && !hasSocials && (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <EmailRoundedIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "secondary.main" }}>{form.owner_email}</Typography>
                            </Stack>
                        )}
                    </Stack>
                </Box>
            )}

            <Divider sx={{ mx: 2, mt: 2, mb: 0 }} />

            {/* ══ CTAs ══ */}
            <PreviewCtaButtons form={form} sx={{ px: 2, pt: 2, pb: 3 }} />
        </Paper>
    );
}

// ═══════════════════════════════════════════════════════
// SERVICES PREVIEW — matches DiscoverTab.jsx layout exactly
// ═══════════════════════════════════════════════════════

function ServicesPreview({ form, isEditing }) {
    const accent = form.accent_color || null;
    const hlColor = form.highlight_color || null;
    const badgeColor = form.badge_color || null;
    const hasCover = Boolean(form.cover_photo_url);
    const hasLogo = Boolean(form.logo_url);
    const hasAbout = Boolean(form.description);
    const hasOwner = Boolean(form.owner_name || form.owner_avatar_url || form.owner_title);
    const sections = Array.isArray(form.highlight_sections) ? form.highlight_sections : [];
    const hasLegacyHighlight = Boolean(form.highlight_title || form.highlight_body || form.highlight_photo_url);
    const hasServices = Array.isArray(form.services_list) && form.services_list.length > 0;
    const hasVideo = Boolean(form.video_id);
    const additionalOwners = Array.isArray(form.additional_owners) ? form.additional_owners.filter((ao) => ao && ao.name) : [];

    const descText = form.description || "";
    const DESC_COLLAPSE = 220;
    const descIsLong = descText.length > DESC_COLLAPSE;

    return (
        <Paper
            elevation={isEditing ? 6 : 2}
            sx={(t) => ({
                borderRadius: 4,
                overflow: "hidden",
                bgcolor: t.palette.background.paper,
                border: isEditing ? `2px solid ${alpha(t.palette.primary.main, 0.3)}` : "1px solid",
                borderColor: isEditing ? undefined : alpha(t.palette.divider, 0.5),
                transition: "box-shadow 0.3s, border-color 0.3s",
            })}
        >
            {/* ── Spotlight Header Bar ── */}
            <Box
                sx={(t) => ({
                    px: 2,
                    py: 0.75,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    bgcolor: form.spotlight_bg_color || alpha(accent || t.palette.primary.main, 0.06),
                    borderBottom: `1px solid ${alpha(accent || t.palette.primary.main, 0.12)}`,
                })}
            >
                <BuildRoundedIcon sx={{ fontSize: 15, color: form.spotlight_text_color || accent || "primary.main" }} />
                <Typography sx={{ fontWeight: 900, fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: form.spotlight_text_color || accent || "primary.main", flex: 1 }}>
                    {form.spotlight_label || "Service Spotlight"}
                </Typography>
            </Box>

            {/* ── Cover Photo Hero ── */}
            {hasCover && (
                <Box
                    sx={{
                        position: "relative",
                        width: "100%",
                        height: { xs: 150, sm: 170 },
                        flexShrink: 0,
                        bgcolor: "grey.200",
                        overflow: "hidden",
                    }}
                >
                    <Box
                        component="img"
                        src={form.cover_photo_url}
                        alt=""
                        sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: `center ${form.cover_position || "center"}`,
                            display: "block",
                        }}
                    />
                    <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 50, background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.12))" }} />
                </Box>
            )}

            {/* ── Business Header: Logo + Name + Subtitle + Location ── */}
            <Box sx={{ px: 2, pt: hasCover ? 2 : 2.5, position: "relative", zIndex: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Avatar
                        src={form.logo_url || undefined}
                        sx={{
                            width: 48,
                            height: 48,
                            mt: 0.25,
                            border: "2px solid",
                            borderColor: (t) => alpha(t.palette.primary.main, 0.15),
                        }}
                        imgProps={{ style: { objectPosition: form.avatar_position || "center" } }}
                    >
                        {!form.logo_url && <BuildRoundedIcon sx={{ fontSize: 22, color: "grey.400" }} />}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            sx={{
                                fontWeight: 950,
                                fontSize: { xs: 18, sm: 20 },
                                lineHeight: 1.15,
                                letterSpacing: "-0.02em",
                                color: "text.primary",
                            }}
                        >
                            {form.title || "Untitled Service"}
                        </Typography>
                        {form.subtitle && (
                            <Typography
                                sx={{
                                    fontWeight: 700,
                                    fontSize: 11.5,
                                    color: "primary.main",
                                    mt: 0.25,
                                    letterSpacing: "0.03em",
                                    textTransform: "uppercase",
                                }}
                            >
                                {form.subtitle}
                            </Typography>
                        )}
                        {form.owner_location && (
                            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.4 }}>
                                <PlaceRoundedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "text.secondary" }}>
                                    {form.owner_location}
                                </Typography>
                            </Stack>
                        )}
                    </Box>
                </Stack>
            </Box>

            {/* ── Video (below header) ── */}
            {hasVideo && (
                <Box sx={{ px: 2, pt: 2, position: "relative" }}>
                    <Box
                        sx={{
                            position: "relative",
                            width: "100%",
                            paddingTop: "56.25%",
                            borderRadius: 3,
                            overflow: "hidden",
                            bgcolor: "grey.900",
                        }}
                    >
                        {form.video_thumbnail_url ? (
                            <Box
                                component="img"
                                src={form.video_thumbnail_url}
                                alt="Video thumbnail"
                                sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                        ) : (
                            <Box sx={{ position: "absolute", inset: 0, bgcolor: "grey.800" }} />
                        )}
                        <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Box
                                sx={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: "50%",
                                    bgcolor: "rgba(255,255,255,0.92)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
                                }}
                            >
                                <Box sx={{ width: 0, height: 0, borderTop: "11px solid transparent", borderBottom: "11px solid transparent", borderLeft: "18px solid", borderLeftColor: "common.black", ml: "3px" }} />
                            </Box>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* ── Owner Section ── */}
            {hasOwner && (
                <>
                    <Divider sx={{ mx: 2, mt: 2.5, mb: 0 }} />
                    <Box sx={{ px: 2, pt: 2 }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 13, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.25 }}>
                            {form.owner_section_title || (additionalOwners.length > 0 ? "Meet the Team" : "Meet the Owner")}
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="center">
                            {form.owner_avatar_url ? (
                                <Box
                                    component="img"
                                    src={form.owner_avatar_url}
                                    alt={form.owner_name}
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 2.5,
                                        objectFit: "cover",
                                        objectPosition: form.owner_avatar_position || "center",
                                        border: "2px solid",
                                        borderColor: (t) => alpha(t.palette.primary.main, 0.12),
                                        boxShadow: (t) => `0 2px 12px ${alpha(t.palette.common.black, 0.08)}`,
                                        flexShrink: 0,
                                    }}
                                />
                            ) : (
                                <Avatar sx={{ width: 80, height: 80, borderRadius: 2.5, bgcolor: "grey.200" }}>
                                    {(form.owner_name || "?")[0]}
                                </Avatar>
                            )}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Stack direction="row" alignItems="center" spacing={0.75}>
                                    <Typography sx={{ fontWeight: 900, fontSize: 15.5, lineHeight: 1.2 }}>
                                        {form.owner_name}
                                    </Typography>
                                    {form.facebook_url && (
                                        <Box sx={{ width: 18, height: 18, borderRadius: "50%", bgcolor: "#1877F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <Typography sx={{ color: "white", fontSize: 10, fontWeight: 900, lineHeight: 1 }}>f</Typography>
                                        </Box>
                                    )}
                                    {form.instagram_url && (
                                        <Box sx={{ width: 18, height: 18, borderRadius: "50%", background: "linear-gradient(45deg, #FFDC80, #F77737, #E1306C, #833AB4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", border: "1.5px solid white" }} />
                                        </Box>
                                    )}
                                </Stack>
                                {form.owner_title && (
                                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: "text.secondary", mt: 0.15 }}>
                                        {form.owner_title}
                                    </Typography>
                                )}
                                {(form.owner_phone || form.owner_email) && (
                                    <Stack spacing={0.3} sx={{ mt: 0.75 }}>
                                        {form.owner_phone && (
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <PhoneRoundedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                                                <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "text.secondary" }}>{form.owner_phone}</Typography>
                                            </Stack>
                                        )}
                                        {form.owner_email && (
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <EmailRoundedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                                                <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "primary.main" }}>{form.owner_email}</Typography>
                                            </Stack>
                                        )}
                                    </Stack>
                                )}
                            </Box>
                        </Stack>

                        {/* Additional team members */}
                        {additionalOwners.map((ao, aoIdx) => (
                            <Stack key={aoIdx} direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
                                {ao.avatar_url ? (
                                    <Box
                                        component="img"
                                        src={ao.avatar_url}
                                        alt={ao.name}
                                        sx={{
                                            width: 80,
                                            height: 80,
                                            borderRadius: 2.5,
                                            objectFit: "cover",
                                            objectPosition: ao.avatar_position || "center",
                                            border: "2px solid",
                                            borderColor: (t) => alpha(t.palette.primary.main, 0.10),
                                            boxShadow: (t) => `0 2px 10px ${alpha(t.palette.common.black, 0.06)}`,
                                            flexShrink: 0,
                                        }}
                                    />
                                ) : (
                                    <Avatar sx={{ width: 80, height: 80, borderRadius: 2.5, bgcolor: "grey.200", fontSize: 20, fontWeight: 700 }}>
                                        {(ao.name || "?")[0]}
                                    </Avatar>
                                )}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 900, fontSize: 15, lineHeight: 1.2 }}>{ao.name}</Typography>
                                    {ao.title && <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "text.secondary", mt: 0.15 }}>{ao.title}</Typography>}
                                    {(ao.phone || ao.email) && (
                                        <Stack spacing={0.3} sx={{ mt: 0.5 }}>
                                            {ao.phone && (
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <PhoneRoundedIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                                                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: "text.secondary" }}>{ao.phone}</Typography>
                                                </Stack>
                                            )}
                                            {ao.email && (
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <EmailRoundedIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                                                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: "primary.main" }}>{ao.email}</Typography>
                                                </Stack>
                                            )}
                                        </Stack>
                                    )}
                                </Box>
                            </Stack>
                        ))}
                    </Box>
                </>
            )}

            <Divider sx={{ mx: 2, mt: 2.5, mb: 0 }} />

            {/* ── About Section — float photo, text wraps ── */}
            {(hasAbout || form.about_photo_url) && (
                <Box sx={{ px: 2, pt: 2 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 15, mb: 1.25 }}>
                        About {form.title || "This Service"}
                    </Typography>

                    <Box sx={{ position: "relative", overflow: "hidden" }}>
                        {form.about_photo_url && (
                            <Box
                                component="img"
                                src={form.about_photo_url}
                                alt={`About ${form.title}`}
                                sx={{
                                    float: "left",
                                    width: { xs: 120, sm: 140 },
                                    height: "auto",
                                    maxHeight: 180,
                                    objectFit: "contain",
                                    borderRadius: 2.5,
                                    mr: 1.75,
                                    mb: 0.75,
                                }}
                            />
                        )}
                        {hasAbout && (
                            <RichHtml
                                html={form.description}
                                sx={{
                                    fontSize: 13.5,
                                    lineHeight: 1.65,
                                    color: "text.secondary",
                                    fontWeight: 500,
                                }}
                            />
                        )}
                        <Box sx={{ clear: "both" }} />
                    </Box>

                </Box>
            )}

            {/* ── Highlight Sections (multi) ── */}
            {sections.length > 0 && sections.map((sec, idx) => (
                <Box key={idx} sx={{ px: 2, pt: 2 }}>
                    <Box
                        sx={(t) => ({
                            borderRadius: 2.5,
                            overflow: "hidden",
                            bgcolor: alpha(hlColor || t.palette.primary.main, 0.04),
                            border: "1px solid",
                            borderColor: alpha(hlColor || t.palette.primary.main, 0.12),
                        })}
                    >
                        <Box
                            sx={(t) => ({
                                px: 2,
                                py: 1,
                                bgcolor: alpha(hlColor || t.palette.primary.main, 0.07),
                                borderBottom: "1px solid",
                                borderColor: alpha(hlColor || t.palette.primary.main, 0.10),
                                display: "flex",
                                alignItems: "center",
                                gap: 0.75,
                            })}
                        >
                            <RenderIcon name={sec.icon} sx={{ fontSize: 17, color: hlColor || "primary.main" }} />
                            <Typography sx={{ fontWeight: 900, fontSize: 12, color: hlColor || "primary.dark", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                                {sec.title || "Highlight"}
                            </Typography>
                        </Box>
                        {(sec.photo_url || sec.gif_url || sec.body) && (
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1.75}
                                alignItems="flex-start"
                                sx={{ p: 2 }}
                            >
                                {(sec.photo_url || sec.gif_url) && (
                                    <Box
                                        component="img"
                                        src={sec.gif_url || sec.photo_url}
                                        alt={sec.title}
                                        sx={{
                                            width: { xs: "100%", sm: 130 },
                                            height: { xs: 150, sm: 115 },
                                            objectFit: "cover",
                                            objectPosition: `${sec.photo_position?.x ?? 50}% ${sec.photo_position?.y ?? 50}%`,
                                            borderRadius: 2,
                                            flexShrink: 0,
                                        }}
                                    />
                                )}
                                {sec.body && (
                                    <RichHtml html={sec.body} sx={{ fontSize: 13, lineHeight: 1.6, color: "text.secondary", fontWeight: 500, flex: 1 }} />
                                )}
                            </Stack>
                        )}
                    </Box>
                </Box>
            ))}

            {/* ── Legacy single highlight (backward compat) ── */}
            {sections.length === 0 && hasLegacyHighlight && (
                <Box sx={{ px: 2, pt: 2 }}>
                    <Box
                        sx={(t) => ({
                            borderRadius: 2.5,
                            overflow: "hidden",
                            bgcolor: alpha(hlColor || t.palette.primary.main, 0.04),
                            border: "1px solid",
                            borderColor: alpha(hlColor || t.palette.primary.main, 0.12),
                        })}
                    >
                        <Box
                            sx={(t) => ({
                                px: 2,
                                py: 1,
                                bgcolor: alpha(hlColor || t.palette.primary.main, 0.07),
                                borderBottom: "1px solid",
                                borderColor: alpha(hlColor || t.palette.primary.main, 0.10),
                                display: "flex",
                                alignItems: "center",
                                gap: 0.75,
                            })}
                        >
                            <StarRoundedIcon sx={{ fontSize: 17, color: hlColor || "primary.main" }} />
                            <Typography sx={{ fontWeight: 900, fontSize: 12, color: hlColor || "primary.dark", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                                {form.highlight_title}
                            </Typography>
                        </Box>
                        {form.highlight_video_id && (
                            <Box sx={{ px: 2, pt: 2 }}>
                                <Box sx={{ position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: 3, overflow: "hidden", bgcolor: "grey.900" }}>
                                    {form.highlight_video_thumbnail_url && (
                                        <Box component="img" src={form.highlight_video_thumbnail_url} alt="" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                                    )}
                                    <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.92)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: 3 }}>
                                            <Box sx={{ width: 0, height: 0, borderTop: "10px solid transparent", borderBottom: "10px solid transparent", borderLeft: "16px solid", borderLeftColor: "common.black", ml: "2px" }} />
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        )}
                        {(form.highlight_photo_url || form.highlight_body) && (
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1.75}
                                alignItems="flex-start"
                                sx={{ p: 2, pt: form.highlight_video_id ? 1.5 : 2 }}
                            >
                                {form.highlight_photo_url && (
                                    <Box
                                        component="img"
                                        src={form.highlight_photo_url}
                                        alt={form.highlight_title}
                                        sx={{
                                            width: { xs: "100%", sm: 130 },
                                            height: { xs: 150, sm: 115 },
                                            objectFit: "cover",
                                            borderRadius: 2,
                                            flexShrink: 0,
                                        }}
                                    />
                                )}
                                {form.highlight_body && (
                                    <RichHtml html={form.highlight_body} sx={{ fontSize: 13, lineHeight: 1.6, color: "text.secondary", fontWeight: 500, flex: 1 }} />
                                )}
                            </Stack>
                        )}
                    </Box>
                </Box>
            )}

            {/* ── Services Chips ── */}
            {hasServices && (
                <>
                    <Divider sx={{ mx: 2, mt: 2.5, mb: 0 }} />
                    <Box sx={{ px: 2, pt: 2 }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 15, mb: 1.25 }}>
                            Services Offered
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                            {form.services_list.map((svc) => (
                                <Chip
                                    key={svc}
                                    label={svc}
                                    size="small"
                                    variant="outlined"
                                    sx={(t) => ({
                                        fontWeight: 700,
                                        fontSize: 12,
                                        borderColor: alpha(t.palette.text.primary, 0.12),
                                    })}
                                />
                            ))}
                        </Box>
                    </Box>
                </>
            )}

            <Divider sx={{ mx: 2, mt: 2.5, mb: 0 }} />

            {/* ── CTAs (full width, matches DiscoverTab) ── */}
            <PreviewCtaButtons form={form} sx={{ px: 2, pt: 2, pb: 3 }} />
        </Paper>
    );
}

// ═══════════════════════════════════════════════════════
// HIGHLIGHT SECTION EDITOR
// ═══════════════════════════════════════════════════════

function HighlightSectionEditor({ section, index, onChange, onRemove, setSaveError }) {
    const updateField = (field, value) => {
        onChange(index, { ...section, [field]: value });
    };

    return (
        <Paper
            variant="outlined"
            sx={(t) => ({
                p: 2,
                borderRadius: 2.5,
                borderColor: alpha(t.palette.primary.main, 0.15),
                bgcolor: alpha(t.palette.primary.main, 0.015),
                position: "relative",
            })}
        >
            <IconButton
                size="small"
                onClick={onRemove}
                sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 24,
                    height: 24,
                    bgcolor: "error.main",
                    color: "white",
                    "&:hover": { bgcolor: "error.dark" },
                }}
            >
                <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>

            <Stack spacing={2} sx={{ pt: 1 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ pr: 4 }}>
                    <IconPicker value={section.icon || "Star"} onChange={(v) => updateField("icon", v)} />
                    <TextField
                        label="Section Title"
                        size="small"
                        fullWidth
                        value={section.title || ""}
                        onChange={(e) => updateField("title", e.target.value)}
                        placeholder="e.g. Upcoming Events, Our Mission"
                    />
                </Stack>

                <WysiwygEditor
                    label="Section Content"
                    value={section.body || ""}
                    onChange={(html) => updateField("body", html)}
                    placeholder="Describe this highlight..."
                    minHeight={60}
                />

                <MediaUploadField
                    label="Section Image"
                    helperText="JPG, PNG, WEBP or GIF"
                    value={section.photo_url || ""}
                    onChange={(url) => updateField("photo_url", url)}
                    folder="discover-highlights/sections"
                    acceptGif
                />
            </Stack>
        </Paper>
    );
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

export default function DiscoverHighlightsAdmin() {
    const [pageFilter, setPageFilter] = useState("community");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [editingId, setEditingId] = useState(null);
    const [creatingNew, setCreatingNew] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [saveSuccess, setSaveSuccess] = useState("");

    const [serviceInput, setServiceInput] = useState("");

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [expandedSections, setExpandedSections] = useState({
        basics: true,
        media: true,
        about: true,
        highlights: true,
        gallery: true,
        streaming: false,
        organizer: false,
        services: false,
        ctas: false,
        social: false,
    });

    const isArtist = pageFilter === "artists";
    const isBusiness = pageFilter === "business";
    const isCommunity = pageFilter === "community";
    const isEditing = editingId !== null || creatingNew;

    // ── Load ──
    const load = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await apiFetch(`/api/admin/discover-highlights?page=${pageFilter}`);
            setItems(Array.isArray(data?.items) ? data.items : []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        closeForm();
    }, [pageFilter]);

    // ── Section toggle ──
    const toggleSection = (key) => {
        setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    // ── Open form ──
    const openCreate = () => {
        setEditingId(null);
        setCreatingNew(true);
        const defaults = isArtist
            ? { ...EMPTY_FORM, ...ARTIST_DEFAULTS }
            : isBusiness
                ? { ...EMPTY_FORM, ...BUSINESS_DEFAULTS }
                : isCommunity
                    ? { ...EMPTY_FORM, ...COMMUNITY_DEFAULTS }
                    : { ...EMPTY_FORM, page_type: pageFilter };
        setForm(defaults);
        setServiceInput("");
        setSaveError("");
    };

    const openEdit = (item) => {
        setCreatingNew(false);
        setEditingId(item.id);
        setForm({
            page_type:           item.page_type || "services",
            is_active:           Boolean(item.is_active),
            sort_order:          item.sort_order || 0,
            title:               item.title || "",
            subtitle:            item.subtitle || "",
            tagline:             item.tagline || "",
            video_id:            item.video_id || "",
            video_thumbnail_url: item.video_thumbnail_url || "",
            logo_url:            item.logo_url || "",
            cover_photo_url:     item.cover_photo_url || "",
            cover_position:      item.cover_position || "center",
            avatar_position:     item.avatar_position || "center",
            owner_name:          item.owner_name || "",
            owner_title:         item.owner_title || "Owner / Operator",
            owner_avatar_url:    item.owner_avatar_url || "",
            owner_location:      item.owner_location || "",
            owner_phone:         item.owner_phone || "",
            owner_email:         item.owner_email || "",
            additional_owners:   Array.isArray(item.additional_owners) ? item.additional_owners : [],
            owner_section_title: item.owner_section_title || "",
            owner_avatar_position: item.owner_avatar_position || "center",
            owner_about:         item.owner_about || "",
            facebook_url:        item.facebook_url || "",
            instagram_url:       item.instagram_url || "",
            twitter_url:         item.twitter_url || "",
            youtube_url:         item.youtube_url || "",
            tiktok_url:          item.tiktok_url || "",
            website_url:         item.website_url || "",
            badge_text:          item.badge_text || "",
            badge_icon:          item.badge_icon || "CheckCircle",
            description:         item.description || "",
            about_photo_url:     item.about_photo_url || "",
            about_photos:        Array.isArray(item.about_photos) ? item.about_photos : [],
            bio_photos:          Array.isArray(item.bio_photos) ? item.bio_photos : [],
            highlight_title:     item.highlight_title || "",
            highlight_body:      item.highlight_body || "",
            highlight_photo_url: item.highlight_photo_url || "",
            highlight_video_id:  item.highlight_video_id || "",
            highlight_video_thumbnail_url: item.highlight_video_thumbnail_url || "",
            highlight_sections:  Array.isArray(item.highlight_sections) ? item.highlight_sections : [],
            services_list:       Array.isArray(item.services_list) ? item.services_list : [],
            music_links:         item.music_links && typeof item.music_links === "object" ? item.music_links : { spotify: "", appleMusic: "", soundcloud: "", youtube: "", bandcamp: "" },
            cta_primary_label:   item.cta_primary_label || "Request a Quote",
            cta_primary_link:    item.cta_primary_link || "",
            cta_primary_icon:    item.cta_primary_icon || "Build",
            cta_secondary_label: item.cta_secondary_label || "View Service Page",
            cta_secondary_link:  item.cta_secondary_link || "",
            cta_secondary_icon:  item.cta_secondary_icon || "OpenInNew",
            accent_color:        item.accent_color || "",
            highlight_color:     item.highlight_color || "",
            badge_color:         item.badge_color || "",
            spotlight_label:     item.spotlight_label || "",
            spotlight_text_color: item.spotlight_text_color || "",
            spotlight_bg_color:  item.spotlight_bg_color || "",
        });
        setServiceInput("");
        setSaveError("");
    };

    const closeForm = () => {
        setEditingId(null);
        setCreatingNew(false);
        setSaving(false);
        setSaveError("");
    };

    // ── Save ──
    const handleSave = async () => {
        if (!form.title.trim()) { setSaveError("Title is required."); return; }
        setSaving(true);
        setSaveError("");
        try {
            const payload = { ...form, title: form.title.trim() };
            if (editingId) {
                await apiFetch(`/api/admin/discover-highlights/${editingId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            } else {
                await apiFetch("/api/admin/discover-highlights", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            }
            setSaveSuccess(editingId ? `"${form.title.trim()}" saved successfully` : `"${form.title.trim()}" created successfully`);
            closeForm();
            load();
        } catch (err) {
            setSaveError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // ── Delete ──
    const handleDelete = async () => {
        if (!deleteTarget?.id) return;
        setDeleting(true);
        try {
            await apiFetch(`/api/admin/discover-highlights/${deleteTarget.id}`, { method: "DELETE" });
            setDeleteTarget(null);
            if (editingId === deleteTarget.id) closeForm();
            load();
        } catch { /* ignore */ } finally { setDeleting(false); }
    };

    // ── Quick toggle active ──
    const toggleActive = async (item) => {
        try {
            await apiFetch(`/api/admin/discover-highlights/${item.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: !item.is_active }),
            });
            load();
        } catch { /* ignore */ }
    };

    // ── Service chip helpers ──
    const addService = () => {
        const val = serviceInput.trim();
        if (!val || form.services_list.includes(val)) return;
        setForm((prev) => ({ ...prev, services_list: [...prev.services_list, val] }));
        setServiceInput("");
    };

    const removeService = (label) => {
        setForm((prev) => ({ ...prev, services_list: prev.services_list.filter((s) => s !== label) }));
    };

    const handleServiceKeyDown = (e) => {
        if (e.key === "Enter") { e.preventDefault(); addService(); }
    };

    // ── Field helpers ──
    const setField = (name) => (e) => {
        const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const setPhotoField = (name) => (url) => {
        setForm((prev) => ({ ...prev, [name]: url }));
    };

    // ── Highlight section helpers ──
    const addHighlightSection = () => {
        setForm((prev) => ({
            ...prev,
            highlight_sections: [...prev.highlight_sections, { ...EMPTY_HIGHLIGHT_SECTION }],
        }));
    };

    const updateHighlightSection = (idx, updated) => {
        setForm((prev) => {
            const arr = [...prev.highlight_sections];
            arr[idx] = updated;
            return { ...prev, highlight_sections: arr };
        });
    };

    const removeHighlightSection = (idx) => {
        setForm((prev) => ({
            ...prev,
            highlight_sections: prev.highlight_sections.filter((_, i) => i !== idx),
        }));
    };

    // ── Collapsible section header ──
    // ────────────────────── Render ──────────────────────

    return (
        <Stack spacing={2}>
            {/* ── Page type tabs ── */}
            <Paper variant="outlined" sx={(t) => ({ borderRadius: 2.5, borderColor: alpha(t.palette.divider, 0.5), overflow: "hidden" })}>
                <Tabs
                    value={pageFilter}
                    onChange={(_, v) => setPageFilter(v)}
                    variant="fullWidth"
                    sx={{
                        minHeight: 40,
                        "& .MuiTab-root": { minHeight: 40, textTransform: "none", fontWeight: 800, fontSize: 13, color: "text.primary", opacity: 0.7, "&.Mui-selected": { opacity: 1 } },
                        "& .MuiTabs-indicator": { height: 3, borderRadius: "3px 3px 0 0" },
                    }}
                >
                    <Tab icon={<GroupsRoundedIcon sx={{ fontSize: 17 }} />} iconPosition="start" label="Community" value="community" />
                    <Tab icon={<StorefrontRoundedIcon sx={{ fontSize: 17 }} />} iconPosition="start" label="Businesses" value="business" />
                    <Tab icon={<MusicNoteRoundedIcon sx={{ fontSize: 17 }} />} iconPosition="start" label="Artists" value="artists" />
                    <Tab icon={<BuildRoundedIcon sx={{ fontSize: 17 }} />} iconPosition="start" label="Services" value="services" />
                </Tabs>
            </Paper>

            {/* Header */}
            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography sx={{ fontWeight: 900, fontSize: 16 }}>
                    Discover Highlights — {isArtist ? "Artists" : isBusiness ? "Businesses" : isCommunity ? "Community" : "Services"}
                </Typography>
                <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddRoundedIcon />}
                    onClick={openCreate}
                    disabled={isEditing}
                    sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999 }}
                >
                    New Highlight
                </Button>
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}

            {/* Content area — stable height, no layout shift on tab change */}
            <Box sx={{ position: "relative", minHeight: 120 }}>
                {/* Loading overlay */}
                {loading && (
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: "rgba(255,255,255,0.7)",
                            borderRadius: 2.5,
                            pointerEvents: "none",
                        }}
                    >
                        <CircularProgress size={28} />
                    </Box>
                )}

                <Stack spacing={2} sx={{ opacity: loading ? 0.35 : 1, transition: "opacity 180ms ease" }}>
                    {items.length === 0 && !loading && !error && !creatingNew && (
                        <Paper
                            variant="outlined"
                            sx={(t) => ({ p: 3, textAlign: "center", borderRadius: 2.5, borderColor: alpha(t.palette.primary.main, 0.14) })}
                        >
                            <Typography sx={{ fontWeight: 800, color: "text.secondary", mb: 0.5 }}>No highlights yet</Typography>
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                Create your first Discover highlight for the {isArtist ? "Artists" : isBusiness ? "Businesses" : isCommunity ? "Community" : "Services"} page.
                            </Typography>
                        </Paper>
                    )}

                    {/* ══════════════ CREATE NEW — Inline ══════════════ */}
                    <Collapse in={creatingNew} timeout={400}>
                        <Fade in={creatingNew} timeout={500}>
                            <Box>
                                {creatingNew && (
                                    <InlineEditorPanel
                                        title="New Discover Highlight"
                                        form={form}
                                        setForm={setForm}
                                        saving={saving}
                                        saveError={saveError}
                                        setSaveError={setSaveError}
                                        onSave={handleSave}
                                        onCancel={closeForm}
                                        isArtist={isArtist}
                                        isBusiness={isBusiness}
                                        isCommunity={isCommunity}
                                        isNew
                                        serviceInput={serviceInput}
                                        setServiceInput={setServiceInput}
                                        addService={addService}
                                        removeService={removeService}
                                        handleServiceKeyDown={handleServiceKeyDown}
                                        setField={setField}
                                        setPhotoField={setPhotoField}
                                        addHighlightSection={addHighlightSection}
                                        updateHighlightSection={updateHighlightSection}
                                        removeHighlightSection={removeHighlightSection}
                                        expandedSections={expandedSections}
                                        toggleSection={toggleSection}
                                    />
                                )}
                            </Box>
                        </Fade>
                    </Collapse>

                    {/* Items list */}
                    {items.map((item) => (
                        <Box key={item.id}>
                            <Paper
                                variant="outlined"
                                sx={(t) => ({
                                    p: 2,
                                    borderRadius: 2.5,
                                    borderColor: editingId === item.id
                                        ? t.palette.primary.main
                                        : alpha(t.palette.primary.main, 0.14),
                                    bgcolor: item.is_active
                                        ? t.palette.background.paper
                                        : alpha(t.palette.action.disabledBackground, 0.15),
                                    opacity: item.is_active ? 1 : 0.75,
                                    transition: "border-color 0.3s, box-shadow 0.3s",
                                    boxShadow: editingId === item.id ? `0 0 0 2px ${alpha(t.palette.primary.main, 0.2)}` : "none",
                                })}
                            >
                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                    <DragIndicatorRoundedIcon sx={{ color: "text.disabled", fontSize: 20 }} />
                                    <Avatar src={item.logo_url || item.owner_avatar_url || undefined} sx={{ width: 36, height: 36 }}>
                                        <ImageRoundedIcon sx={{ fontSize: 18 }} />
                                    </Avatar>
                                    {item.video_id && <VideocamRoundedIcon sx={{ color: "primary.main", fontSize: 20 }} />}
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography sx={{ fontWeight: 900, fontSize: 14, lineHeight: 1.3 }}>{item.title}</Typography>
                                        {item.subtitle && <Typography variant="caption" sx={{ color: "text.secondary" }}>{item.subtitle}</Typography>}
                                    </Box>
                                    <IconButton size="small" onClick={() => toggleActive(item)} sx={{ color: item.is_active ? "success.main" : "text.disabled" }}>
                                        {item.is_active ? <VisibilityRoundedIcon sx={{ fontSize: 20 }} /> : <VisibilityOffRoundedIcon sx={{ fontSize: 20 }} />}
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => editingId === item.id ? closeForm() : openEdit(item)}
                                        sx={{ color: editingId === item.id ? "primary.main" : undefined }}
                                    >
                                        {editingId === item.id ? <ExpandLessRoundedIcon sx={{ fontSize: 18 }} /> : <EditRoundedIcon sx={{ fontSize: 18 }} />}
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={() => setDeleteTarget(item)}>
                                        <DeleteRoundedIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Stack>
                            </Paper>

                            {/* ── Inline edit panel (fade in below item) ── */}
                            <Collapse in={editingId === item.id} timeout={400}>
                                <Fade in={editingId === item.id} timeout={500}>
                                    <Box>
                                        {editingId === item.id && (
                                            <InlineEditorPanel
                                                title={`Editing — ${item.title}`}
                                                form={form}
                                                setForm={setForm}
                                                saving={saving}
                                                saveError={saveError}
                                                setSaveError={setSaveError}
                                                onSave={handleSave}
                                                onCancel={closeForm}
                                                isArtist={isArtist}
                                                isBusiness={isBusiness}
                                                isCommunity={isCommunity}
                                                isNew={false}
                                                serviceInput={serviceInput}
                                                setServiceInput={setServiceInput}
                                                addService={addService}
                                                removeService={removeService}
                                                handleServiceKeyDown={handleServiceKeyDown}
                                                setField={setField}
                                                setPhotoField={setPhotoField}
                                                addHighlightSection={addHighlightSection}
                                                updateHighlightSection={updateHighlightSection}
                                                removeHighlightSection={removeHighlightSection}
                                                expandedSections={expandedSections}
                                                toggleSection={toggleSection}
                                            />
                                        )}
                                    </Box>
                                </Fade>
                            </Collapse>
                        </Box>
                    ))}

                    {/* ══════════════ DELETE CONFIRMATION ══════════════ */}
                    <Collapse in={Boolean(deleteTarget)} timeout={300}>
                        <Fade in={Boolean(deleteTarget)} timeout={400}>
                            <Paper
                                variant="outlined"
                                sx={(t) => ({
                                    p: 2.5,
                                    borderRadius: 2.5,
                                    borderColor: t.palette.error.main,
                                    bgcolor: alpha(t.palette.error.main, 0.04),
                                })}
                            >
                                <Stack spacing={1.5}>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                                        <Typography sx={{ fontWeight: 950, fontSize: 16 }}>Delete Highlight</Typography>
                                        <IconButton size="small" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                                            <CloseIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Stack>
                                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                        Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? This cannot be undone.
                                    </Typography>
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <Button onClick={() => setDeleteTarget(null)} disabled={deleting} sx={{ textTransform: "none", fontWeight: 700 }}>Cancel</Button>
                                        <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting} sx={{ textTransform: "none", fontWeight: 900, borderRadius: 999, px: 3 }}>
                                            {deleting ? "Deleting\u2026" : "Delete"}
                                        </Button>
                                    </Stack>
                                </Stack>
                            </Paper>
                        </Fade>
                    </Collapse>
                </Stack>
            </Box>

            {/* ══ Save Success Snackbar ══ */}
            <Snackbar
                open={Boolean(saveSuccess)}
                autoHideDuration={3500}
                onClose={() => setSaveSuccess("")}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert onClose={() => setSaveSuccess("")} severity="success" variant="filled" sx={{ fontWeight: 800, borderRadius: 2.5 }}>
                    {saveSuccess}
                </Alert>
            </Snackbar>
        </Stack>
    );
}

// ═══════════════════════════════════════════════════════
// COLLAPSIBLE SECTION HEADER (stable — defined outside render)
// ═══════════════════════════════════════════════════════

function SectionHeader({ expanded, onToggle, label }) {
    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
    };

    return (
        <Box
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
            sx={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                userSelect: "none",
                gap: 0.5,
                py: 1,
                px: 0.5,
                mx: -0.5,
                borderRadius: 1,
                position: "relative",
                zIndex: 2,
                "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.04) },
                "&:active": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
            }}
        >
            {expanded ? (
                <ExpandLessRoundedIcon sx={{ fontSize: 20, color: "text.secondary" }} />
            ) : (
                <ExpandMoreRoundedIcon sx={{ fontSize: 20, color: "text.secondary" }} />
            )}
            <Typography sx={{ fontWeight: 900, fontSize: 13, color: "text.secondary", textTransform: "uppercase", letterSpacing: 1 }}>
                {label}
            </Typography>
        </Box>
    );
}

// ═══════════════════════════════════════════════════════
// INLINE EDITOR PANEL
// ═══════════════════════════════════════════════════════

function InlineEditorPanel({
                               title,
                               form,
                               setForm,
                               saving,
                               saveError,
                               setSaveError,
                               onSave,
                               onCancel,
                               isArtist,
                               isBusiness,
                               isCommunity,
                               isNew,
                               serviceInput,
                               setServiceInput,
                               addService,
                               removeService,
                               handleServiceKeyDown,
                               setField,
                               setPhotoField,
                               addHighlightSection,
                               updateHighlightSection,
                               removeHighlightSection,
                               expandedSections,
                               toggleSection,
                           }) {
    return (
        <Paper
            variant="outlined"
            sx={(t) => ({
                mt: 1,
                borderRadius: 3,
                borderColor: alpha(t.palette.primary.main, 0.2),
                overflow: "hidden",
            })}
        >
            {/* Header bar — sticky */}
            <Box
                sx={(t) => ({
                    px: 2.5,
                    py: 1.5,
                    bgcolor: alpha(t.palette.primary.main, 0.06),
                    borderBottom: "1px solid",
                    borderColor: alpha(t.palette.primary.main, 0.12),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1,
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    backdropFilter: "blur(12px)",
                })}
            >
                <Typography sx={{ fontWeight: 950, fontSize: 15 }}>{title}</Typography>
                <Stack direction="row" spacing={1}>
                    <Button
                        onClick={onCancel}
                        disabled={saving}
                        size="small"
                        sx={{ textTransform: "none", fontWeight: 700 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={onSave}
                        disabled={saving}
                        startIcon={<SaveRoundedIcon sx={{ fontSize: "16px !important" }} />}
                        sx={{ textTransform: "none", fontWeight: 900, borderRadius: 999, px: 2.5 }}
                    >
                        {saving ? "Saving\u2026" : isNew ? "Create" : "Update"}
                    </Button>
                </Stack>
            </Box>

            {/* Body: Form + Preview side by side */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "1fr minmax(560px, 720px)" },
                    gap: 0,
                }}
            >
                {/* ── LEFT: Form controls ── */}
                <Box sx={{ p: { xs: 2, sm: 2.5 }, maxHeight: "75vh", overflowY: "auto" }}>
                    <Stack spacing={2.5}>
                        {saveError && <Alert severity="error" onClose={() => setSaveError("")}>{saveError}</Alert>}

                        {/* ── BASICS ── */}
                        <SectionHeader expanded={expandedSections.basics} onToggle={() => toggleSection("basics")} label="Basics" />
                        <Collapse in={expandedSections.basics} timeout={300}>
                            <Stack spacing={2} sx={{ pt: 0.5 }}>
                                <TextField
                                    label={isArtist ? "Artist / Band Name *" : isCommunity ? "Spotlight Title *" : "Business / Title *"}
                                    size="small"
                                    fullWidth
                                    value={form.title}
                                    onChange={setField("title")}
                                    placeholder={isArtist ? "e.g. The Delta Saints" : isCommunity ? "e.g. Harvest Festival 2026" : isBusiness ? "e.g. Richardson Landworks LLC" : "e.g. Richardson Landworks"}
                                />
                                <TextField
                                    label={isCommunity ? "Subtitle / Tagline" : "Subtitle"}
                                    size="small"
                                    fullWidth
                                    value={form.subtitle}
                                    onChange={setField("subtitle")}
                                    placeholder={isArtist ? "e.g. Southern Rock / Blues" : isCommunity ? "e.g. Celebrating 10 years of community" : isBusiness ? "e.g. Land Clearing & Site Prep" : "e.g. Land Clearing"}
                                />
                                {isArtist && (
                                    <TextField label="Tagline" size="small" fullWidth value={form.tagline} onChange={setField("tagline")} placeholder="e.g. Rising country voice" />
                                )}
                                <FormControlLabel
                                    control={<Switch checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />}
                                    label={<Typography sx={{ fontSize: 13, fontWeight: 700, ml: 0.5 }}>Active</Typography>}
                                />
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <IconPicker value={form.badge_icon || "CheckCircle"} onChange={(v) => setForm((p) => ({ ...p, badge_icon: v }))} />
                                    <TextField label="Badge Text" size="small" fullWidth value={form.badge_text} onChange={setField("badge_text")} placeholder="e.g. Licensed & Insured" />
                                </Stack>
                                <Divider sx={{ my: 0.5 }} />
                                <Typography sx={{ fontSize: 11, fontWeight: 800, color: "text.disabled", textTransform: "uppercase", letterSpacing: 0.5 }}>
                                    Custom Colors (optional)
                                </Typography>
                                <AccentColorPicker
                                    label="Highlight Sections"
                                    value={form.highlight_color}
                                    onChange={(color) => setForm((p) => ({ ...p, highlight_color: color }))}
                                />
                                <AccentColorPicker
                                    label="Badge Color"
                                    value={form.badge_color}
                                    onChange={(color) => setForm((p) => ({ ...p, badge_color: color }))}
                                />
                            </Stack>
                        </Collapse>

                        <Divider />

                        {/* ── MEDIA (Cover + Logo) ── */}
                        <SectionHeader expanded={expandedSections.media} onToggle={() => toggleSection("media")} label={`Cover Photo & ${isCommunity ? "Logo / Icon" : "Logo"}`} />
                        <Collapse in={expandedSections.media} timeout={300}>
                            <Stack spacing={2} sx={{ pt: 0.5 }}>
                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "110px 1fr" }, gap: 2, alignItems: "start" }}>
                                    {/* Avatar */}
                                    <Box>
                                        <Typography sx={{ fontSize: 12, fontWeight: 800, color: "text.secondary", mb: 0.75, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                            {isArtist ? "Avatar" : "Logo"}
                                        </Typography>
                                        <Box
                                            component="label"
                                            sx={(t) => ({
                                                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                                width: 100, height: 100, borderRadius: "50%", cursor: "pointer",
                                                border: form.logo_url ? "3px solid" : "2px dashed",
                                                borderColor: form.logo_url ? alpha(t.palette.primary.main, 0.25) : "divider",
                                                overflow: "hidden", position: "relative", mx: "auto",
                                                bgcolor: form.logo_url ? "transparent" : alpha(t.palette.text.primary, 0.02),
                                                transition: "border-color 0.15s",
                                                "&:hover": { borderColor: t.palette.primary.main },
                                            })}
                                        >
                                            {form.logo_url ? (
                                                <Box component="img" src={form.logo_url} alt="Avatar" sx={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: form.avatar_position || "center" }} />
                                            ) : (
                                                <AddPhotoAlternateRoundedIcon sx={{ fontSize: 28, color: "text.disabled" }} />
                                            )}
                                            <input type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                try { const url = await uploadToGcs(file, "discover-highlights/logos"); setForm((p) => ({ ...p, logo_url: url })); } catch (err) { setSaveError(err.message); }
                                                e.target.value = "";
                                            }} />
                                        </Box>
                                        {form.logo_url && (
                                            <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center" sx={{ mt: 1 }}>
                                                <TextField select size="small" value={form.avatar_position} onChange={setField("avatar_position")} sx={{ width: 80, "& .MuiInputBase-input": { fontSize: 11, py: 0.5, px: 1 } }}>
                                                    <MenuItem value="top">Top</MenuItem>
                                                    <MenuItem value="center">Center</MenuItem>
                                                    <MenuItem value="bottom">Bottom</MenuItem>
                                                </TextField>
                                                <IconButton size="small" onClick={() => setForm((p) => ({ ...p, logo_url: "" }))} sx={{ width: 24, height: 24 }}>
                                                    <CloseIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Stack>
                                        )}
                                    </Box>

                                    {/* Cover photo */}
                                    <Box>
                                        <Typography sx={{ fontSize: 12, fontWeight: 800, color: "text.secondary", mb: 0.75, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                            Cover Photo
                                        </Typography>
                                        <Box
                                            component="label"
                                            sx={(t) => ({
                                                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                                width: "100%", minHeight: 140, height: { xs: 140, sm: 170 }, borderRadius: 3, cursor: "pointer",
                                                border: form.cover_photo_url ? "none" : "2px dashed",
                                                borderColor: "divider", overflow: "hidden", position: "relative",
                                                bgcolor: form.cover_photo_url ? "transparent" : alpha(t.palette.text.primary, 0.02),
                                                transition: "border-color 0.15s",
                                                "&:hover": form.cover_photo_url
                                                    ? { "& .cover-overlay": { opacity: 1 } }
                                                    : { borderColor: t.palette.primary.main },
                                            })}
                                        >
                                            {form.cover_photo_url ? (
                                                <>
                                                    <Box component="img" src={form.cover_photo_url} alt="Cover" sx={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${form.cover_position || "center"}`, display: "block" }} />
                                                    <Box className="cover-overlay" sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.15s" }}>
                                                        <Stack alignItems="center" spacing={0.5}>
                                                            <CropOriginalRoundedIcon sx={{ fontSize: 28, color: "white" }} />
                                                            <Typography sx={{ fontSize: 12, fontWeight: 800, color: "white" }}>Change Cover</Typography>
                                                        </Stack>
                                                    </Box>
                                                </>
                                            ) : (
                                                <Stack alignItems="center" spacing={0.5}>
                                                    <CropOriginalRoundedIcon sx={{ fontSize: 28, color: "text.disabled" }} />
                                                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary" }}>Add cover photo</Typography>
                                                </Stack>
                                            )}
                                            <input type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                try { const url = await uploadToGcs(file, "discover-highlights/covers"); setForm((p) => ({ ...p, cover_photo_url: url })); } catch (err) { setSaveError(err.message); }
                                                e.target.value = "";
                                            }} />
                                        </Box>
                                        {form.cover_photo_url && (
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                                                <TextField select size="small" value={form.cover_position} onChange={setField("cover_position")} sx={{ flex: 1, "& .MuiInputBase-input": { fontSize: 11, py: 0.5, px: 1 } }}>
                                                    <MenuItem value="top">Top</MenuItem>
                                                    <MenuItem value="20%">Upper third</MenuItem>
                                                    <MenuItem value="center">Center</MenuItem>
                                                    <MenuItem value="80%">Lower third</MenuItem>
                                                    <MenuItem value="bottom">Bottom</MenuItem>
                                                </TextField>
                                                <IconButton size="small" onClick={() => setForm((p) => ({ ...p, cover_photo_url: "" }))} sx={{ width: 24, height: 24 }}>
                                                    <CloseIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Stack>
                                        )}
                                    </Box>
                                </Box>

                                {/* Bunny Video ID */}
                                <TextField label="Bunny Video ID" size="small" fullWidth value={form.video_id} onChange={setField("video_id")} placeholder="e.g. 9f24ee56-dfdb-4bb2-974c-7494c812f484" helperText="Optional — Bunny Stream GUID" />

                                {form.video_id && (
                                    <MediaUploadField label="Video Thumbnail" helperText="Custom thumbnail shown before video plays" value={form.video_thumbnail_url} onChange={setPhotoField("video_thumbnail_url")} folder="discover-highlights/video-thumbs" />
                                )}
                            </Stack>
                        </Collapse>

                        <Divider />

                        {/* ── ABOUT SECTION ── */}
                        <SectionHeader expanded={expandedSections.about} onToggle={() => toggleSection("about")} label={isArtist ? "Bio" : "About Section"} />
                        <Collapse in={expandedSections.about} timeout={300}>
                            <Stack spacing={2} sx={{ pt: 0.5 }}>
                                <WysiwygEditor
                                    label={isArtist ? "Artist Bio" : "About Description"}
                                    value={form.description}
                                    onChange={(html) => setForm((p) => ({ ...p, description: html }))}
                                    placeholder={isArtist ? "Tell your story — background, influences, what drives your music..." : isBusiness ? "Describe your business, what you offer, and what makes you unique..." : "Write about this community spotlight..."}
                                    minHeight={100}
                                />

                                {!isBusiness && (
                                    <MediaUploadField
                                        label="About Photo"
                                        helperText="Primary photo alongside the about text. Supports GIFs."
                                        value={form.about_photo_url}
                                        onChange={setPhotoField("about_photo_url")}
                                        folder="discover-highlights/about"
                                        acceptGif
                                    />
                                )}

                            </Stack>
                        </Collapse>

                        <Divider />

                        {/* ── GALLERY / BIO PHOTOS (Business + Artists) ── */}
                        {(isBusiness || isArtist) && (
                            <>
                                <SectionHeader expanded={expandedSections.gallery} onToggle={() => toggleSection("gallery")} label={isArtist ? "Bio / Press Photos" : "Gallery Photos"} />
                                <Collapse in={expandedSections.gallery} timeout={300}>
                                    <Stack spacing={2} sx={{ pt: 0.5 }}>
                                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                            {isArtist
                                                ? "Press shots, live performance photos, album art — up to 6 photos or GIFs."
                                                : "Showcase your work, storefront, or team — up to 6 photos or GIFs."}
                                        </Typography>
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                            {(form.bio_photos || []).map((url, idx) => (
                                                <Box key={idx} sx={{ position: "relative", width: 90, height: 90 }}>
                                                    <Box component="img" src={url} alt="" sx={{ width: 90, height: 90, objectFit: "cover", borderRadius: 2, border: "1px solid", borderColor: "divider" }} />
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setForm((p) => ({ ...p, bio_photos: p.bio_photos.filter((_, i) => i !== idx) }))}
                                                        sx={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, bgcolor: "error.main", color: "white", fontSize: 12, "&:hover": { bgcolor: "error.dark" } }}
                                                    >
                                                        <CloseIcon sx={{ fontSize: 12 }} />
                                                    </IconButton>
                                                </Box>
                                            ))}
                                            {(form.bio_photos || []).length < 6 && (
                                                <Button
                                                    variant="outlined"
                                                    component="label"
                                                    sx={{ width: 90, height: 90, minWidth: 0, borderRadius: 2, borderStyle: "dashed", display: "flex", flexDirection: "column", fontSize: 11, fontWeight: 700, textTransform: "none" }}
                                                >
                                                    + Photo
                                                    <input type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        if (file.size > 15 * 1024 * 1024) { setSaveError("File must be under 15MB"); return; }
                                                        try {
                                                            const url = await uploadToGcs(file, "discover-highlights/gallery");
                                                            setForm((p) => ({ ...p, bio_photos: [...(p.bio_photos || []), url] }));
                                                        } catch (err) { setSaveError(err.message); }
                                                        e.target.value = "";
                                                    }} />
                                                </Button>
                                            )}
                                        </Box>
                                    </Stack>
                                </Collapse>

                                <Divider />
                            </>
                        )}

                        {/* ── HIGHLIGHT SECTIONS ── */}
                        <SectionHeader expanded={expandedSections.highlights} onToggle={() => toggleSection("highlights")} label="Highlight Sections" />
                        <Collapse in={expandedSections.highlights} timeout={300}>
                            <Stack spacing={2} sx={{ pt: 0.5 }}>
                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    Add multiple highlight sections with icons, rich text, and images or GIFs.
                                </Typography>

                                {(form.highlight_sections || []).map((sec, idx) => (
                                    <HighlightSectionEditor
                                        key={idx}
                                        section={sec}
                                        index={idx}
                                        onChange={updateHighlightSection}
                                        onRemove={() => removeHighlightSection(idx)}
                                        setSaveError={setSaveError}
                                    />
                                ))}

                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<AddRoundedIcon />}
                                    onClick={addHighlightSection}
                                    sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999, alignSelf: "flex-start" }}
                                >
                                    Add Highlight Section
                                </Button>
                            </Stack>
                        </Collapse>

                        <Divider />

                        {/* ── ORGANIZER ── */}
                        <SectionHeader expanded={expandedSections.organizer} onToggle={() => toggleSection("organizer")} label={isArtist ? "Artist Details" : isBusiness ? "Owner / Team" : isCommunity ? "Organizer / Contact" : "Owner / Contact"} />
                        <Collapse in={expandedSections.organizer} timeout={300}>
                            <Stack spacing={2} sx={{ pt: 0.5 }}>
                                {!isArtist && (
                                    <TextField label="Section Heading" size="small" fullWidth value={form.owner_section_title} onChange={setField("owner_section_title")} placeholder="e.g. Meet the Team" />
                                )}
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                                    <TextField label={isArtist ? "Real Name / Members" : isCommunity ? "Organizer Name" : isBusiness ? "Owner Name" : "Owner Name"} size="small" fullWidth value={form.owner_name} onChange={setField("owner_name")} />
                                    <TextField label={isArtist ? "Artist Type" : isCommunity ? "Role / Title" : isBusiness ? "Title / Role" : "Title"} size="small" fullWidth value={form.owner_title} onChange={setField("owner_title")} placeholder={isArtist ? "e.g. Solo Artist, Band, Producer" : ""} />
                                </Stack>
                                <MediaUploadField label={isArtist ? "Secondary Photo" : isCommunity ? "Organizer Photo" : "Owner Photo"} value={form.owner_avatar_url} onChange={setPhotoField("owner_avatar_url")} folder="discover-highlights/owners" acceptGif />
                                {form.owner_avatar_url && (
                                    <TextField select size="small" label="Photo crop" value={form.owner_avatar_position} onChange={setField("owner_avatar_position")} sx={{ width: 140 }}>
                                        <MenuItem value="top">Top</MenuItem>
                                        <MenuItem value="center">Center</MenuItem>
                                        <MenuItem value="bottom">Bottom</MenuItem>
                                    </TextField>
                                )}
                                {!isArtist && (
                                    <TextField label="Owner Bio" size="small" fullWidth multiline minRows={2} maxRows={4} value={form.owner_about} onChange={setField("owner_about")} />
                                )}
                                <TextField label="Location" size="small" fullWidth value={form.owner_location} onChange={setField("owner_location")} placeholder={isArtist ? "e.g. Birmingham, AL" : "e.g. Baldwin County, AL"} />
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                                    <TextField label={isArtist ? "Booking Phone" : "Phone"} size="small" fullWidth value={form.owner_phone} onChange={setField("owner_phone")} />
                                    <TextField label={isArtist ? "Booking Email" : "Email"} size="small" fullWidth value={form.owner_email} onChange={setField("owner_email")} />
                                </Stack>

                                {/* Additional Owners */}
                                {!isArtist && (
                                    <>
                                        <Typography sx={{ fontSize: 12, fontWeight: 800, color: "text.secondary", textTransform: "uppercase" }}>Additional Team Members</Typography>
                                        {(form.additional_owners || []).map((ao, aoIdx) => (
                                            <Paper key={aoIdx} variant="outlined" sx={{ p: 1.5, pt: 2, borderRadius: 2, position: "relative" }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setForm((p) => ({ ...p, additional_owners: p.additional_owners.filter((_, i) => i !== aoIdx) }))}
                                                    sx={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, bgcolor: "error.main", color: "white", zIndex: 1, "&:hover": { bgcolor: "error.dark" } }}
                                                >
                                                    <CloseIcon sx={{ fontSize: 12 }} />
                                                </IconButton>
                                                <Stack spacing={1}>
                                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ pr: 3.5 }}>
                                                        <TextField label="Name" size="small" fullWidth value={ao.name || ""} onChange={(e) => setForm((p) => { const arr = [...p.additional_owners]; arr[aoIdx] = { ...arr[aoIdx], name: e.target.value }; return { ...p, additional_owners: arr }; })} />
                                                        <TextField label="Title" size="small" fullWidth value={ao.title || ""} onChange={(e) => setForm((p) => { const arr = [...p.additional_owners]; arr[aoIdx] = { ...arr[aoIdx], title: e.target.value }; return { ...p, additional_owners: arr }; })} />
                                                    </Stack>
                                                    <MediaUploadField label="Photo" value={ao.avatar_url || ""} onChange={(url) => setForm((p) => { const arr = [...p.additional_owners]; arr[aoIdx] = { ...arr[aoIdx], avatar_url: url }; return { ...p, additional_owners: arr }; })} folder="discover-highlights/owners" />
                                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                                        <TextField label="Phone" size="small" fullWidth value={ao.phone || ""} onChange={(e) => setForm((p) => { const arr = [...p.additional_owners]; arr[aoIdx] = { ...arr[aoIdx], phone: e.target.value }; return { ...p, additional_owners: arr }; })} />
                                                        <TextField label="Email" size="small" fullWidth value={ao.email || ""} onChange={(e) => setForm((p) => { const arr = [...p.additional_owners]; arr[aoIdx] = { ...arr[aoIdx], email: e.target.value }; return { ...p, additional_owners: arr }; })} />
                                                    </Stack>
                                                    <TextField label="Bio" size="small" fullWidth multiline minRows={2} maxRows={4} value={ao.about || ""} onChange={(e) => setForm((p) => { const arr = [...p.additional_owners]; arr[aoIdx] = { ...arr[aoIdx], about: e.target.value }; return { ...p, additional_owners: arr }; })} />
                                                </Stack>
                                            </Paper>
                                        ))}
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<AddRoundedIcon />}
                                            onClick={() => setForm((p) => ({ ...p, additional_owners: [...(p.additional_owners || []), { name: "", title: "", avatar_url: "", phone: "", email: "", about: "" }] }))}
                                            sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999, alignSelf: "flex-start" }}
                                        >
                                            Add Team Member
                                        </Button>
                                    </>
                                )}
                            </Stack>
                        </Collapse>

                        <Divider />

                        {/* ── SERVICES / TAGS ── */}
                        {!isCommunity && (
                            <>
                                <SectionHeader expanded={expandedSections.services} onToggle={() => toggleSection("services")} label={isArtist ? "Genre Tags" : isBusiness ? "Services Offered" : "Services List"} />
                                <Collapse in={expandedSections.services} timeout={300}>
                                    <Stack spacing={1.5} sx={{ pt: 0.5 }}>
                                        <Stack direction="row" spacing={1} alignItems="flex-start">
                                            <TextField label="Add tag" size="small" fullWidth value={serviceInput} onChange={(e) => setServiceInput(e.target.value)} onKeyDown={handleServiceKeyDown} placeholder="Type and press Enter" />
                                            <Button variant="outlined" size="small" onClick={addService} disabled={!serviceInput.trim()} sx={{ textTransform: "none", fontWeight: 800, minWidth: 60, mt: "1px" }}>Add</Button>
                                        </Stack>
                                        {form.services_list.length > 0 && (
                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                                                {form.services_list.map((svc) => (
                                                    <Chip key={svc} label={svc} size="small" variant="outlined" onDelete={() => removeService(svc)} sx={{ fontWeight: 700, fontSize: 12 }} />
                                                ))}
                                            </Box>
                                        )}
                                    </Stack>
                                </Collapse>

                                <Divider />
                            </>
                        )}

                        {/* ── STREAMING LINKS (Artist only) ── */}
                        {isArtist && (
                            <>
                                <SectionHeader expanded={expandedSections.streaming} onToggle={() => toggleSection("streaming")} label="Streaming & Music Links" />
                                <Collapse in={expandedSections.streaming} timeout={300}>
                                    <Stack spacing={1.5} sx={{ pt: 0.5 }}>
                                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                            Add links to your music on major platforms — they appear as branded buttons in the preview.
                                        </Typography>
                                        <TextField label="Spotify URL" size="small" fullWidth value={form.music_links?.spotify || ""} onChange={(e) => setForm((p) => ({ ...p, music_links: { ...p.music_links, spotify: e.target.value } }))} placeholder="https://open.spotify.com/artist/..." />
                                        <TextField label="Apple Music URL" size="small" fullWidth value={form.music_links?.appleMusic || ""} onChange={(e) => setForm((p) => ({ ...p, music_links: { ...p.music_links, appleMusic: e.target.value } }))} placeholder="https://music.apple.com/..." />
                                        <TextField label="YouTube URL" size="small" fullWidth value={form.music_links?.youtube || ""} onChange={(e) => setForm((p) => ({ ...p, music_links: { ...p.music_links, youtube: e.target.value } }))} placeholder="https://youtube.com/..." />
                                        <TextField label="SoundCloud URL" size="small" fullWidth value={form.music_links?.soundcloud || ""} onChange={(e) => setForm((p) => ({ ...p, music_links: { ...p.music_links, soundcloud: e.target.value } }))} placeholder="https://soundcloud.com/..." />
                                        <TextField label="Bandcamp URL" size="small" fullWidth value={form.music_links?.bandcamp || ""} onChange={(e) => setForm((p) => ({ ...p, music_links: { ...p.music_links, bandcamp: e.target.value } }))} placeholder="https://....bandcamp.com" />
                                    </Stack>
                                </Collapse>

                                <Divider />
                            </>
                        )}

                        {/* ── SOCIAL LINKS ── */}
                        <SectionHeader expanded={expandedSections.social} onToggle={() => toggleSection("social")} label="Links & Social" />
                        <Collapse in={expandedSections.social} timeout={300}>
                            <Stack spacing={1.5} sx={{ pt: 0.5 }}>
                                <TextField label="Website URL" size="small" fullWidth value={form.website_url} onChange={setField("website_url")} placeholder="https://..." />
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                                    <TextField label="Facebook" size="small" fullWidth value={form.facebook_url} onChange={setField("facebook_url")} placeholder="https://facebook.com/..." />
                                    <TextField label="Instagram" size="small" fullWidth value={form.instagram_url} onChange={setField("instagram_url")} placeholder="https://instagram.com/..." />
                                </Stack>
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                                    <TextField label="X / Twitter" size="small" fullWidth value={form.twitter_url} onChange={setField("twitter_url")} placeholder="https://x.com/..." />
                                    <TextField label="YouTube" size="small" fullWidth value={form.youtube_url} onChange={setField("youtube_url")} placeholder="https://youtube.com/..." />
                                </Stack>
                                <TextField label="TikTok" size="small" fullWidth value={form.tiktok_url} onChange={setField("tiktok_url")} placeholder="https://tiktok.com/@..." />
                            </Stack>
                        </Collapse>

                        <Divider />

                        {/* ── CTAs ── */}
                        <SectionHeader expanded={expandedSections.ctas} onToggle={() => toggleSection("ctas")} label="Call-to-Action Buttons" />
                        <Collapse in={expandedSections.ctas} timeout={300}>
                            <Stack spacing={1.5} sx={{ pt: 0.5 }}>
                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    Pick a label, destination URL, and icon for each button. Good options include Learn more, Get involved, Donate, Call, Email, View page, or RSVP.
                                </Typography>
                                <Stack spacing={1.5}>
                                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: "text.secondary", textTransform: "uppercase" }}>Primary Button</Typography>
                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                                        <TextField label="Primary Label" size="small" fullWidth value={form.cta_primary_label} onChange={setField("cta_primary_label")} />
                                        <TextField label="Primary Link" size="small" fullWidth value={form.cta_primary_link} onChange={setField("cta_primary_link")} placeholder="/community, https://..., tel:..., mailto:..." />
                                    </Stack>
                                    <CtaIconSelect label="Primary Icon" value={form.cta_primary_icon || "OpenInNew"} onChange={(value) => setForm((prev) => ({ ...prev, cta_primary_icon: value }))} />
                                </Stack>
                                <Stack spacing={1.5}>
                                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: "text.secondary", textTransform: "uppercase" }}>Secondary Button</Typography>
                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                                        <TextField label="Secondary Label" size="small" fullWidth value={form.cta_secondary_label} onChange={setField("cta_secondary_label")} />
                                        <TextField label="Secondary Link" size="small" fullWidth value={form.cta_secondary_link} onChange={setField("cta_secondary_link")} placeholder="/community, https://..., tel:..., mailto:..." />
                                    </Stack>
                                    <CtaIconSelect label="Secondary Icon" value={form.cta_secondary_icon || "OpenInNew"} onChange={(value) => setForm((prev) => ({ ...prev, cta_secondary_icon: value }))} />
                                </Stack>
                            </Stack>
                        </Collapse>
                    </Stack>
                </Box>

                {/* ── RIGHT: Live Preview ── */}
                <Box
                    sx={(t) => ({
                        p: { xs: 2, sm: 2.5 },
                        bgcolor: alpha(t.palette.action.hover, 0.25),
                        borderLeft: { xs: "none", lg: "1px solid" },
                        borderTop: { xs: "1px solid", lg: "none" },
                        borderColor: alpha(t.palette.divider, 0.5),
                        maxHeight: "75vh",
                        overflowY: "auto",
                    })}
                >
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 2 }}>
                        <PreviewRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                        <Typography sx={{ fontWeight: 900, fontSize: 13, color: "text.secondary", textTransform: "uppercase", letterSpacing: 1 }}>
                            Live Preview
                        </Typography>
                    </Stack>
                    {isArtist ? (
                        <ArtistPreview form={form} isEditing />
                    ) : isBusiness ? (
                        <BusinessPreview form={form} isEditing />
                    ) : isCommunity ? (
                        <CommunityPreview form={form} isEditing />
                    ) : (
                        <ServicesPreview form={form} isEditing />
                    )}
                </Box>
            </Box>

        </Paper>
    )};


// src/pages/music/pages/ArtistProfilePage.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { alpha } from "@mui/material/styles";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    Chip,
    CircularProgress,
    ClickAwayListener,
    Collapse,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Drawer,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    List,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    MenuItem,
    Paper,
    Popper,
    Select,
    Skeleton,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
    useTheme,
    useMediaQuery,
    Radio,
    RadioGroup,
    FormControlLabel,
    LinearProgress,
    ListItemIcon,
    Slide,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import AlbumRoundedIcon from "@mui/icons-material/AlbumRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import HowToRegRoundedIcon from "@mui/icons-material/HowToRegRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import ShareDialog from "../../../components/ShareDialog";
import SmartMenu from "../../../components/SmartMenu";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import HeadphonesRoundedIcon from "@mui/icons-material/HeadphonesRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/X";
import YouTubeIcon from "@mui/icons-material/YouTube";
import FacebookIcon from "@mui/icons-material/Facebook";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import DynamicFeedRoundedIcon from "@mui/icons-material/DynamicFeedRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LinkIcon from "@mui/icons-material/Link";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PushPinRoundedIcon from "@mui/icons-material/PushPinRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import TuneIcon from "@mui/icons-material/Tune";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import RefreshIcon from "@mui/icons-material/Refresh";
import SortIcon from "@mui/icons-material/Sort";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import FavoriteIcon from "@mui/icons-material/Favorite";
import RepeatIcon from "@mui/icons-material/Repeat";
import ForumIcon from "@mui/icons-material/Forum";

// Genre icons (matching ArtistDetailPanel)
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import PianoRoundedIcon from "@mui/icons-material/PianoRounded";
import RadioRoundedIcon from "@mui/icons-material/RadioRounded";
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
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import MicExternalOnRoundedIcon from "@mui/icons-material/MicExternalOnRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";

import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import HomeRepairServiceIcon from "@mui/icons-material/HomeRepairService";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";

import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import MemoryRoundedIcon from "@mui/icons-material/MemoryRounded";
import LocalHospitalRoundedIcon from "@mui/icons-material/LocalHospitalRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import HandymanRoundedIcon from "@mui/icons-material/HandymanRounded";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import PrecisionManufacturingRoundedIcon from "@mui/icons-material/PrecisionManufacturingRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import CleaningServicesRoundedIcon from "@mui/icons-material/CleaningServicesRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import GppGoodRoundedIcon from "@mui/icons-material/GppGoodRounded";
import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivismRounded";
import AgricultureRoundedIcon from "@mui/icons-material/AgricultureRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";

import { useAuth } from "../../../components/AuthModalContext";
import { useActiveAccount } from "../../../components/AccountContext";
import { getAccountHeaders } from "../../../utils/getAccountHeadersStatic";
import { getProfileSubTabsSx, getProfileFilterBarSx, getProfileSelectSx } from "../../../themes/theme";
import SearchInput from "../../../components/SearchInput";
import AccountAvatar from "../../../components/AccountAvatar";
import { getCategoryIcon } from "../utils/artistCategoryIcons";
import UserCardPopover from "../../../components/UserCardPopover";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import ActionBar, { ReportDialog } from "../../../components/ActionBar";
import ReportContentDialog from "../../../components/ReportContentDialog";
import { fetchEvents } from "../../events/api/eventsApi";
import EventCard from "../../events/components/EventCard";
import EventDetailPanel from "../../events/components/EventDetailPanel";

import JobDetailPanel from "../../jobs/components/JobDetailPanel";
import JobCard from "../../jobs/components/JobCard";
import CreateJobModal from "../../jobs/modals/CreateJobModal";
import { deleteJob as deleteJobApi, renewJob as renewJobApi } from "../../jobs/api/jobs";
import ServiceCard from "../../services/components/ServiceCard";
import ServicePopupDialog from "../../services/components/ServicePopupDialog";
import { getServiceCategoryInfo } from "../../services/utils/serviceHelpers";
import defaultAvatar from "../../../assets/profile/default_avatar.png";
import axios from "../../../api/axiosInstance";
import { secureFetch } from "../../../utils/secureFetch";
import ContentFadeIn from "../../../components/ContentFadeIn";
import PulsingDots from "../../../components/PulsingDots";
import PhotosUploadSection from "../../../components/PhotosUploadSection";
import { ProfilePostCard } from "../../profile/userProfile/ProfilePostsList";
import { MusicPostCardItem } from "../components/MusicPostsList";
import BusinessPostCard from "../../business/components/BusinessPostCard";
import PostPage from "../../community/PostDetailModal";
import BusinessPostDetailModal from "../../business/components/BusinessPostDetailModal";
import MusicPostDetailPanel from "../components/MusicPostDetailPanel";
import SuccessSnackbar, { useSuccessSnackbar } from '../../../components/SuccessSnackbar';
import useRateLimit from '../../../utils/useRateLimit';
import RateLimitDialog from '../../../components/RateLimitDialog';
import RichTextEditor from '../../../components/RichTextEditor';
import NetworkErrorState, { isNetworkError } from '../../../components/NetworkErrorState';
import { PhotoCommentsDialog } from '../../profile/userProfile/ProfileHeader';
import MobileActivityShell from '../../../components/MobileActivityShell';
import useChromeTop from '../../../hooks/useChromeTop';
import { topRightInsetSx, bottomInsetSx } from '../../../utils/safeArea';

/* ── GCS upload helpers ── */
async function getSignedUploadUrl({ folder, fileName, contentType }) {
    const res = await secureFetch("/api/uploads/signed-url", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folder, fileName, contentType }) });
    if (!res.ok) throw new Error("Failed to get upload URL");
    return res.json();
}
async function uploadToSignedUrl({ uploadUrl, file, contentType }) {
    const res = await secureFetch(uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
    if (!res.ok) throw new Error("Upload failed");
}

// Highlight section icon map for profile page
const HL_PROFILE_ICONS = {
    Star: StarRoundedIcon,
    Favorite: FavoriteRoundedIcon,
    MusicNote: MusicNoteRoundedIcon,
    Album: AlbumRoundedIcon,
    Groups: GroupsRoundedIcon,
    Trophy: EmojiEventsRoundedIcon,
    CheckCircle: CheckCircleRoundedIcon,
    Mic: MicExternalOnRoundedIcon,
    Campaign: CampaignRoundedIcon,
};
function HlProfileIcon({ name, ...props }) {
    const Icon = HL_PROFILE_ICONS[name] || StarRoundedIcon;
    return <Icon {...props} />;
}

// ============================
// Constants
// ============================
const COVER_ASPECT_RATIO = 3.5;
const ABOUT_COLLAPSED_HEIGHT = 160;
const BODY_CHAR_LIMIT = 300;
const POST_BODY_CHAR_LIMIT = 2000;
const MAX_POST_PHOTOS = 4;

// ─── Event helpers ────────────────────────────────────────────────────────────

function isPastEvent(event) {
    if (!event?.startAt && !event?.start_at) return false;
    const start = new Date(event.startAt || event.start_at);
    // Compare against start of today so events happening today are not considered past
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return start < startOfToday;
}

// ─── Event category / time helpers ───────────────────────────────────────────
const EVENT_CATEGORY_LABELS = {
    'music-nightlife': 'Concerts',
    'arts-culture': 'Arts & Culture',
    'food-drink': 'Food & Drink',
    'community-social': 'Community & Social',
    'family-kids': 'Family & Kids',
    'sports-recreation': 'Sports & Recreation',
    'outdoors-nature': 'Outdoors & Nature',
    'education-workshops': 'Education & Workshops',
    'business-networking': 'Business & Networking',
    'health-wellness': 'Health & Wellness',
    'faith-spiritual': 'Faith & Spiritual',
    'volunteer-fundraising': 'Volunteer & Fundraising',
    'government-civic': 'Government & Civic',
    'markets-shopping': 'Markets & Shopping',
    'holidays-seasonal': 'Holidays & Seasonal',
    other: 'Other',
};
function eventCategoryLabel(slug) {
    return EVENT_CATEGORY_LABELS[String(slug || '').toLowerCase()] || slug || '';
}

function formatEventDate(event) {
    if (!event) return '';
    const raw = event.startAt || event.start_at || event.start_date || event.startDate;
    if (!raw) return '';
    let str = typeof raw === 'string' ? raw : String(raw);
    if (!/Z|[+-]\d{2}:\d{2}/.test(str)) str += 'Z';
    const d = new Date(str);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
function eventTimeAgo(raw) {
    if (!raw) return '';
    let str = typeof raw === 'string' ? raw : String(raw);
    if (!/Z|[+-]\d{2}:\d{2}/.test(str)) str += 'Z';
    const d = new Date(str);
    if (Number.isNaN(d.getTime())) return '';
    const diff = Math.max(0, Date.now() - d.getTime());
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return 'Just now';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

// ─── @Mention helpers ─────────────────────────────────────────────────────────

const MENTION_RE_MATCH = /(?:^|\s)@([a-zA-Z0-9_]{1,30})$/;

function getMentionMatch(text, cursorIndex) {
    if (!text || cursorIndex <= 0) return null;
    const before = text.slice(0, cursorIndex);
    const m = before.match(MENTION_RE_MATCH);
    if (!m) return null;
    const query = m[1];
    const start = before.lastIndexOf("@" + query);
    return { query, start, end: cursorIndex };
}

function getMentionAnchorVirtualEl(textareaEl, caretIndex) {
    if (!textareaEl) return null;
    const mirror = document.createElement("div");
    const cs = window.getComputedStyle(textareaEl);
    [
        "font", "fontSize", "fontFamily", "fontWeight", "fontStyle",
        "letterSpacing", "wordSpacing", "lineHeight", "textTransform",
        "padding", "paddingTop", "paddingLeft", "paddingRight", "paddingBottom",
        "border", "borderWidth", "boxSizing", "width", "whiteSpace", "overflowWrap", "wordWrap",
    ].forEach((p) => { mirror.style[p] = cs[p]; });
    mirror.style.position = "absolute";
    mirror.style.left = "-9999px";
    mirror.style.top = "-9999px";
    mirror.style.visibility = "hidden";
    mirror.style.whiteSpace = "pre-wrap";
    mirror.style.overflowWrap = "break-word";

    const textBefore = textareaEl.value.slice(0, caretIndex);
    mirror.textContent = textBefore;
    const span = document.createElement("span");
    span.textContent = "|";
    mirror.appendChild(span);
    document.body.appendChild(mirror);
    const spanRect = span.getBoundingClientRect();
    const taRect = textareaEl.getBoundingClientRect();
    const offsetX = spanRect.left - mirror.getBoundingClientRect().left;
    const offsetY = spanRect.top - mirror.getBoundingClientRect().top;
    document.body.removeChild(mirror);

    const x = taRect.left + offsetX;
    const y = taRect.top + offsetY - textareaEl.scrollTop + 20;

    return { getBoundingClientRect: () => ({ top: y, bottom: y, left: x, right: x, width: 0, height: 0 }) };
}

function MentionAccountBadge({ item }) {
    if (!item) return null;
    const isVerified = item.is_verified === true || item.is_verified === 1;
    const type = String(item.account_type || "").toLowerCase();
    const profileType = String(item.profile_type || item.profileType || "").toLowerCase();
    const isMentionVisualArtist = type === "artist" && profileType === "artist";
    return (
        <>
            {isVerified && <VerifiedRoundedIcon sx={{ fontSize: 13, color: "primary.main", ml: 0.25 }} />}
            {type === "business" && <StorefrontRoundedIcon sx={{ fontSize: 13, color: "text.secondary", ml: 0.25 }} />}
            {type === "artist" && !isMentionVisualArtist && <MusicNoteRoundedIcon sx={{ fontSize: 13, color: "text.secondary", ml: 0.25 }} />}
            {isMentionVisualArtist && <PaletteRoundedIcon sx={{ fontSize: 13, color: "text.secondary", ml: 0.25 }} />}
        </>
    );
}

function renderMentionPopper({ open, anchorEl, results, loading, activeIdx, onSelect, onClose }) {
    return (
        <Popper open={open} anchorEl={anchorEl} placement="bottom-start" style={{ zIndex: 1500 }}
                modifiers={[{ name: "offset", options: { offset: [0, 4] } }]}>
            <ClickAwayListener onClickAway={onClose}>
                <Paper elevation={6} sx={{ width: 280, maxHeight: 220, overflow: "auto", borderRadius: 2 }}>
                    {loading && <Box sx={{ p: 1.5, textAlign: "center" }}><CircularProgress size={18} /></Box>}
                    {!loading && !results.length && <Typography variant="body2" sx={{ p: 1.5, color: "text.secondary" }}>No users found</Typography>}
                    {!loading && results.length > 0 && (
                        <List dense disablePadding>
                            {results.map((u, i) => (
                                <ListItemButton key={u.id || i} selected={i === activeIdx}
                                                onMouseDown={(e) => { e.preventDefault(); onSelect(u); }}
                                                sx={{ py: 0.5, px: 1.25 }}>
                                    <ListItemAvatar sx={{ minWidth: 36 }}>
                                        <Avatar src={u.avatar_url || u.profile_picture || undefined}
                                                sx={{ width: 28, height: 28, fontSize: 13 }}>
                                            {(u.name || u.username || "?")[0]}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={<Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }} noWrap>
                                                {u.name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username}
                                            </Typography>
                                            <MentionAccountBadge item={u} />
                                        </Box>}
                                        secondary={<Typography variant="caption" color="text.secondary" noWrap>@{u.handle || u.username}</Typography>}
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

/**
 * useMentionField – reusable hook for @mention on any TextField
 * Returns { mentionProps, mentionPopper } to spread on the TextField and render next to it.
 */
function useMentionField(text, setText, inputRef) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeIdx, setActiveIdx] = useState(0);
    const [anchorEl, setAnchorEl] = useState(null);
    const caretRef = useRef(0);
    const startRef = useRef(0);
    const endRef = useRef(0);
    const abortRef = useRef(null);

    const close = () => { setOpen(false); setResults([]); setQuery(""); setActiveIdx(0); };

    const insert = (user) => {
        const handle = user.handle || user.username || "";
        const before = text.slice(0, startRef.current);
        const after = text.slice(endRef.current);
        const next = before + "@" + handle + " " + after;
        setText(next);
        close();
        setTimeout(() => { const el = inputRef.current; if (el) { const pos = before.length + handle.length + 2; el.selectionStart = pos; el.selectionEnd = pos; el.focus(); } }, 0);
    };

    useEffect(() => {
        if (!open || !query) { setResults([]); return; }
        const ctrl = new AbortController();
        abortRef.current?.abort();
        abortRef.current = ctrl;
        const tid = setTimeout(async () => {
            try {
                setLoading(true);
                const res = await axios.get("/api/community/users/search", { params: { q: query, limit: 8 }, signal: ctrl.signal });
                if (!ctrl.signal.aborted) { setResults(Array.isArray(res.data) ? res.data : []); setActiveIdx(0); }
            } catch { if (!ctrl.signal.aborted) setResults([]); }
            finally { if (!ctrl.signal.aborted) setLoading(false); }
        }, 200);
        return () => { clearTimeout(tid); ctrl.abort(); };
    }, [open, query]);

    const onChange = (e) => {
        const val = e.target.value;
        setText(val);
        const cursor = e.target.selectionStart || 0;
        caretRef.current = cursor;
        const match = getMentionMatch(val, cursor);
        if (match) {
            startRef.current = match.start;
            endRef.current = match.end;
            setQuery(match.query);
            setAnchorEl(getMentionAnchorVirtualEl(e.target, cursor));
            if (!open) setOpen(true);
        } else { close(); }
    };

    const onKeyDown = (e) => {
        if (open && results.length > 0) {
            if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => (i + 1) % results.length); return; }
            if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => (i - 1 + results.length) % results.length); return; }
            if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insert(results[activeIdx]); return; }
            if (e.key === "Escape") { e.preventDefault(); close(); return; }
        }
    };

    const popper = renderMentionPopper({
        open: open && Boolean(anchorEl),
        anchorEl,
        results,
        loading,
        activeIdx,
        onSelect: insert,
        onClose: close,
    });

    return { onChange, onKeyDown, popper };
}

async function uploadPhotosToGCS(photoItems) {
    const urls = [];
    for (const item of photoItems) {
        if (!item.file) continue;
        try {
            const signedRes = await secureFetch("/api/uploads/signed-url", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json", ...getAccountHeaders() },
                body: JSON.stringify({
                    folder: "artist-posts",
                    fileName: item.file.name || `photo-${Date.now()}.jpg`,
                    contentType: item.file.type || "image/jpeg",
                }),
            });
            if (!signedRes.ok) continue;
            const { uploadUrl, publicUrl } = await signedRes.json();
            const putRes = await fetch(uploadUrl, {
                method: "PUT",
                headers: { "Content-Type": item.file.type || "image/jpeg" },
                body: item.file,
            });
            if (putRes.ok) urls.push(publicUrl);
        } catch {
            // skip failed uploads
        }
    }
    return urls;
}

const POST_SORT_OPTIONS = [
    { value: "newest", label: "Newest" },
    { value: "popular", label: "Most Popular" },
];

const JOB_CATEGORY_LABELS = {
    'administrative-office': 'Administrative & Office',
    'accounting-finance': 'Accounting & Finance',
    'sales-business-development': 'Sales & Business Dev',
    'customer-service-support': 'Customer Service & Support',
    'marketing-creative-communications': 'Marketing & Creative',
    'technology-data': 'Technology & Data',
    healthcare: 'Healthcare',
    'education-childcare': 'Education & Childcare',
    'skilled-trades-maintenance': 'Skilled Trades & Maintenance',
    'construction-contracting': 'Construction & Contracting',
    'manufacturing-production': 'Manufacturing & Production',
    'warehouse-transportation-logistics': 'Warehouse & Logistics',
    'hospitality-food-service': 'Hospitality & Food Service',
    'retail-merchandising': 'Retail & Merchandising',
    'cleaning-security-general-labor': 'Cleaning & General Labor',
    'professional-services': 'Professional Services',
    'government-public-safety-community': 'Government & Public Safety',
    'nonprofit-social-services': 'Nonprofit & Social Services',
    'agriculture-outdoor-environmental': 'Agriculture & Outdoor',
    other: 'Other',
};
const JOB_CATEGORY_ICONS = {
    'administrative-office': BusinessCenterRoundedIcon,
    'accounting-finance': AccountBalanceRoundedIcon,
    'sales-business-development': TrendingUpRoundedIcon,
    'customer-service-support': SupportAgentRoundedIcon,
    'marketing-creative-communications': CampaignRoundedIcon,
    'technology-data': MemoryRoundedIcon,
    healthcare: LocalHospitalRoundedIcon,
    'education-childcare': SchoolRoundedIcon,
    'skilled-trades-maintenance': HandymanRoundedIcon,
    'construction-contracting': ConstructionRoundedIcon,
    'manufacturing-production': PrecisionManufacturingRoundedIcon,
    'warehouse-transportation-logistics': LocalShippingRoundedIcon,
    'hospitality-food-service': RestaurantRoundedIcon,
    'retail-merchandising': StorefrontRoundedIcon,
    'cleaning-security-general-labor': CleaningServicesRoundedIcon,
    'professional-services': GavelRoundedIcon,
    'government-public-safety-community': GppGoodRoundedIcon,
    'nonprofit-social-services': VolunteerActivismRoundedIcon,
    'agriculture-outdoor-environmental': AgricultureRoundedIcon,
    other: CategoryRoundedIcon,
};
function jobCategoryLabel(slug) {
    return JOB_CATEGORY_LABELS[String(slug || '').toLowerCase()] || slug || '';
}
function ProfileCategoryRow({ Icon, label }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            {Icon && <Icon sx={{ fontSize: 20, color: 'primary.main', flexShrink: 0 }} />}
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {label}
            </Typography>
        </Box>
    );
}

/* ── Shared dropdown styling (matches BusinessEngagementTabs) ── */
const PROFILE_CONTROL_SX = Object.freeze({
    '& .MuiOutlinedInput-root': {
        borderRadius: 999,
        backgroundColor: (t) => {
            const isDark = t.palette.mode === 'dark';
            const frost = t.custom?.brand?.frost || (isDark ? '#232D3D' : '#E7EBF1');
            return isDark ? alpha(frost, 0.6) : alpha(t.palette.common.white, 0.92);
        },
        backdropFilter: 'saturate(140%) blur(10px)',
        minHeight: 40,
        overflow: 'hidden',
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: (t) => alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.18 : 0.14),
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: (t) => alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.28 : 0.22),
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: (t) => alpha(t.palette.primary.main, 0.50),
            boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.10)}`,
        },
    },
    '& .MuiInputLabel-root': { fontWeight: 600, fontSize: '0.875rem', color: 'text.secondary' },
    '& .MuiSelect-select': {
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        display: 'flex', alignItems: 'center', gap: 1,
        minHeight: 'unset', fontSize: '0.875rem', fontWeight: 700, letterSpacing: '-0.01em',
    },
    '& .MuiInputBase-input': {
        fontWeight: 700,
        letterSpacing: '-0.01em',
    },
});
const profileMenuProps = Object.freeze({
    disableScrollLock: true,
    PaperProps: {
        sx: (t) => ({
            mt: 0.75, bgcolor: 'background.paper', backgroundImage: 'none',
            maxHeight: 340, borderRadius: 2.5,
            border: '1px solid', borderColor: alpha(t.palette.primary.main, 0.12),
            boxShadow: `0 16px 34px ${alpha(t.palette.text.primary, 0.12)}`,
            '& .MuiMenuItem-root': { minHeight: 42, fontSize: '0.875rem', fontWeight: 600 },
        }),
    },
});

// Stable tab definitions – defined outside the component to avoid
// creating new JSX elements on every render (prevents re-render loops).
const ARTIST_PROFILE_TABS = [
    { label: "Overview", mobileLabel: "About", icon: <MusicNoteRoundedIcon sx={{ fontSize: 18 }} /> },
];

// ============================
// Post API Helpers
// ============================

async function fetchArtistPosts({ artistId, sort = "newest", type, limit = 50, offset = 0 }) {
    const params = new URLSearchParams({ sort, limit: String(limit), offset: String(offset) });
    if (type && type !== "all") params.set("type", type);
    const res = await secureFetch(`/api/music/artists/${artistId}/posts?${params.toString()}`, {
        credentials: "include",
        headers: { ...getAccountHeaders() },
    });
    if (!res.ok) throw new Error("Failed to fetch posts");
    return res.json();
}

async function createArtistPost(artistId, data) {
    const res = await secureFetch(`/api/music/artists/${artistId}/posts`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getAccountHeaders() },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create post");
    }
    return res.json();
}

async function updateArtistPost(artistId, postId, data) {
    const res = await secureFetch(`/api/music/artists/${artistId}/posts/${postId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getAccountHeaders() },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update post");
    }
    return res.json();
}

async function deleteArtistPost(artistId, postId) {
    const res = await secureFetch(`/api/music/artists/${artistId}/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
        headers: { ...getAccountHeaders() },
    });
    if (!res.ok) throw new Error("Failed to delete post");
    return res.json();
}

async function pinArtistPost(artistId, postId) {
    const res = await secureFetch(`/api/music/artists/${artistId}/posts/${postId}/pin`, {
        method: "POST",
        credentials: "include",
        headers: { ...getAccountHeaders() },
    });
    if (!res.ok) throw new Error("Failed to pin post");
    return res.json();
}

async function unpinArtistPost(artistId, postId) {
    const res = await secureFetch(`/api/music/artists/${artistId}/posts/${postId}/pin`, {
        method: "DELETE",
        credentials: "include",
        headers: { ...getAccountHeaders() },
    });
    if (!res.ok) throw new Error("Failed to unpin post");
    return res.json();
}

// ============================
// Date/Time Helpers
// ============================

function formatRelativeTime(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ============================
// Genre Icon Mapping (matching ArtistDetailPanel)
// ============================
function getGenreIcon(genre) {
    const g = String(genre || "").toLowerCase().trim();
    if (g.includes("rock") || g.includes("metal") || g.includes("punk")) return BoltRoundedIcon;
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
    return MusicNoteRoundedIcon;
}

// ============================
// Helper Functions
// ============================

function safeJsonParse(val, fallback = null) {
    if (!val) return fallback;
    if (typeof val === "object") return val;
    try {
        return JSON.parse(val);
    } catch {
        return fallback;
    }
}

function buildSocialUrl(value, platform) {
    if (!value) return "";
    const val = String(value).trim();
    if (!val) return "";
    if (val.startsWith("http://") || val.startsWith("https://")) return val;
    const domains = {
        facebook: "facebook.com",
        instagram: "instagram.com",
        twitter: "x.com",
        youtube: "youtube.com",
        tiktok: "tiktok.com/@",
        spotify: "open.spotify.com/artist",
        soundcloud: "soundcloud.com",
        bandcamp: "bandcamp.com",
        appleMusic: "music.apple.com",
        linktree: "linktr.ee",
    };
    const domain = domains[platform] || "";
    if (!domain) {
        if (val.includes(".")) return `https://${val}`;
        return val;
    }
    if (val.startsWith(domain) || val.startsWith(`www.${domain}`)) {
        return `https://${val}`;
    }
    const username = val.replace(/^@/, "");
    if (platform === "tiktok") return `https://tiktok.com/@${username}`;
    return `https://${domain}/${username}`;
}

function getLinkIcon(key, size = 20) {
    const k = String(key).toLowerCase();
    if (k.includes("instagram")) return <InstagramIcon sx={{ fontSize: size }} />;
    if (k.includes("twitter") || k.includes("x.com") || k === "x") return <XIcon sx={{ fontSize: size }} />;
    if (k.includes("youtube")) return <YouTubeIcon sx={{ fontSize: size }} />;
    if (k.includes("facebook")) return <FacebookIcon sx={{ fontSize: size }} />;
    if (k.includes("tiktok")) {
        return (
            <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
                <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.44V13.1a8.16 8.16 0 005.58 2.2V11.9a4.85 4.85 0 01-3.58-1.63V6.69h3.58z" /></svg>
            </Box>
        );
    }
    if (k.includes("spotify")) {
        return (
            <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
                <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg>
            </Box>
        );
    }
    if (k.includes("soundcloud")) {
        return (
            <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
                <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.05-.1-.084-.1zm-.899 1.67c-.06 0-.091.037-.104.09L0 15.479l.165 1.308c.014.057.045.09.111.09.068 0 .09-.033.104-.09l.21-1.319-.21-1.334c-.014-.064-.036-.09-.104-.09zm1.83-1.62c-.074 0-.12.06-.12.135l-.21 2.07.21 2.134c0 .075.046.135.12.135.074 0 .12-.06.12-.135l.24-2.134-.24-2.07c0-.075-.046-.12-.12-.12v-.015zm.945-.57c-.09 0-.135.075-.135.15l-.193 2.19.193 2.176c0 .09.045.149.135.149.075 0 .135-.06.135-.15l.21-2.175-.21-2.19c0-.075-.06-.15-.135-.15zm1.065-.375c-.105 0-.165.09-.165.165l-.18 2.385.18 2.31c0 .095.06.18.165.18.089 0 .164-.085.164-.18l.195-2.31-.195-2.385c0-.09-.059-.165-.164-.165zm1.14-.12c-.12 0-.195.105-.195.195l-.165 2.385.165 2.37c0 .105.075.195.195.195.104 0 .18-.09.18-.195l.195-2.37-.195-2.385c0-.09-.076-.195-.18-.195zm1.155-.12c-.135 0-.225.12-.225.225l-.15 2.385.15 2.385c0 .12.09.225.225.225.119 0 .225-.105.225-.225l.165-2.385-.165-2.385c0-.105-.106-.225-.225-.225zm1.2.045c-.149 0-.254.135-.254.255l-.15 2.19.15 2.4c0 .135.105.255.254.255.135 0 .255-.12.255-.255l.15-2.4-.15-2.19c0-.12-.12-.255-.255-.255zm1.215-.09c-.165 0-.285.15-.285.285l-.135 2.13.135 2.43c0 .15.12.285.285.285.15 0 .285-.135.285-.285l.15-2.43-.15-2.13c0-.135-.135-.285-.285-.285zm1.215-.03c-.18 0-.315.165-.315.315L9.75 14.4l.12 2.43c0 .165.135.315.315.315.165 0 .315-.15.315-.315l.135-2.43-.135-2.385c0-.15-.15-.315-.315-.315zm1.23.105c-.195 0-.345.18-.345.345l-.105 2.19.105 2.445c0 .18.15.345.345.345.18 0 .345-.165.345-.345l.12-2.445-.12-2.19c0-.165-.165-.345-.345-.345zm1.245-.06c-.21 0-.375.195-.375.375l-.09 2.205.09 2.445c0 .195.165.375.375.375.195 0 .375-.18.375-.375l.105-2.445-.105-2.205c0-.18-.18-.375-.375-.375zm1.26-.015c-.225 0-.405.21-.405.405l-.075 2.175.075 2.445c0 .21.18.405.405.405.21 0 .405-.195.405-.405l.09-2.445-.09-2.175c0-.195-.195-.405-.405-.405zm1.275.06c-.24 0-.435.225-.435.435l-.06 2.085.06 2.445c0 .225.195.435.435.435.225 0 .42-.21.42-.435l.075-2.445-.075-2.085c0-.21-.195-.435-.42-.435zm1.29.09c-.255 0-.45.24-.45.465l-.045 1.965.045 2.43c0 .24.195.465.45.465.24 0 .45-.225.45-.465l.06-2.43-.06-1.965c0-.225-.21-.465-.45-.465zm1.305.255c-.27 0-.48.255-.48.495l-.03 1.665.03 2.4c0 .255.21.495.48.495.255 0 .48-.24.48-.495l.045-2.4-.045-1.665c0-.24-.225-.495-.48-.495zm1.32.465c-.285 0-.51.27-.51.525l-.015 1.155.015 2.37c0 .27.225.525.51.525.27 0 .51-.255.51-.525l.03-2.37-.03-1.155c0-.255-.24-.525-.51-.525zm1.335.6c-.3 0-.54.285-.54.54v.69l.015 2.325c0 .27.24.555.525.555.27 0 .54-.285.54-.555l.015-2.325v-.69c0-.255-.255-.54-.54-.54h-.015zm3.39-.45c-.405 0-.795.075-1.155.195-.24-2.715-2.535-4.86-5.355-4.86-.72 0-1.425.15-2.055.405-.24.12-.315.24-.315.465v9.555c0 .24.18.465.435.48h8.445c1.395 0 2.52-1.17 2.52-2.61s-1.125-2.63-2.52-2.63z" /></svg>
            </Box>
        );
    }
    if (k.includes("bandcamp")) {
        return (
            <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
                <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z" /></svg>
            </Box>
        );
    }
    if (k.includes("apple") && k.includes("music")) {
        return (
            <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
                <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043A5.022 5.022 0 0019.7.237C19.103.1 18.496.04 17.89.003 17.717-.004 17.543 0 17.37 0H6.63c-.174 0-.347-.004-.521.003C5.503.04 4.896.1 4.3.237a5.023 5.023 0 00-1.875.655C1.307 1.625.561 2.624.245 3.935A9.23 9.23 0 00.003 6.124C-.003 6.297 0 6.47 0 6.643v10.714c0 .173-.003.347.003.52a9.23 9.23 0 00.242 2.19c.316 1.31 1.062 2.31 2.18 3.042.568.38 1.196.645 1.874.655.607.138 1.214.197 1.821.235.173.007.347.003.52.003h10.74c.174 0 .347.004.521-.003.607-.038 1.214-.097 1.821-.235a5.023 5.023 0 001.875-.655c1.118-.733 1.863-1.732 2.18-3.043.17-.713.236-1.441.24-2.19.003-.173 0-.347 0-.52V6.643c0-.173.004-.346-.003-.52zM16.95 17.22c-.12.15-.27.28-.44.37-.33.17-.69.25-1.07.27-.17.01-.34 0-.51-.03a2.1 2.1 0 01-.79-.33c-.44-.35-.7-.81-.74-1.38-.04-.51.13-.97.47-1.34.39-.41.88-.63 1.44-.66.44-.02.84.09 1.19.36v-5l-5.56 1.68v5.94c.01.18 0 .36-.04.54-.1.57-.42 1-.93 1.29-.27.15-.57.24-.88.27-.18.01-.36 0-.54-.02a2.06 2.06 0 01-.82-.35c-.42-.34-.67-.78-.72-1.33-.05-.54.12-1 .47-1.38.38-.41.87-.63 1.42-.66.44-.02.85.09 1.2.37V7.19c0-.13.03-.24.1-.35.1-.16.24-.26.42-.3l6.4-1.93c.04-.01.07-.02.11-.02.25-.05.44.09.46.35v10c.01.19 0 .38-.05.57-.1.55-.41.97-.91 1.26z" /></svg>
            </Box>
        );
    }
    if (k.includes("linktree")) {
        return (
            <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
                <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M7.953 15.066l-.038-4.2-4.058-.048L7.07 7.645.903 4.395l2.955-2.063L7.14 6.65l3.285-4.317.84.84-2.34 4.29 4.17.048-3.225 3.15 4.08 3.225-2.955 2.07-3.285-4.318-3.285 4.317-2.955-2.069 4.473-3.72zm8.147 0l.037-4.2 4.059-.048-3.213-3.173L23.1 4.395l-2.955-2.063-3.282 4.318L13.578 2.333l-.84.84 2.34 4.29-4.17.048 3.225 3.15-4.08 3.225 2.955 2.07 3.285-4.318 3.285 4.317 2.955-2.069-4.473-3.72zM10.5 18.75h3v5.25h-3z" /></svg>
            </Box>
        );
    }
    if (k.includes("email") || k.includes("mail")) return <MailOutlineRoundedIcon sx={{ fontSize: size }} />;
    if (k.includes("website") || k.includes("web") || k.includes("home")) return <LanguageRoundedIcon sx={{ fontSize: size }} />;
    return <LinkRoundedIcon sx={{ fontSize: size }} />;
}

function getLinkPlatform(key) {
    const k = String(key).toLowerCase();
    if (k.includes("instagram")) return "instagram";
    if (k.includes("twitter") || k.includes("x.com") || k === "x") return "twitter";
    if (k.includes("youtube")) return "youtube";
    if (k.includes("facebook")) return "facebook";
    if (k.includes("tiktok")) return "tiktok";
    if (k.includes("spotify")) return "spotify";
    if (k.includes("soundcloud")) return "soundcloud";
    if (k.includes("bandcamp")) return "bandcamp";
    if (k.includes("apple") && k.includes("music")) return "appleMusic";
    if (k.includes("linktree")) return "linktree";
    return null;
}

function getLinkColor(key) {
    const k = String(key).toLowerCase();
    if (k.includes("instagram")) return "#E4405F";
    if (k.includes("twitter") || k.includes("x.com") || k === "x") return "#000000";
    if (k.includes("youtube")) return "#FF0000";
    if (k.includes("facebook")) return "#1877F2";
    if (k.includes("tiktok")) return "#000000";
    if (k.includes("spotify")) return "#1DB954";
    if (k.includes("soundcloud")) return "#FF5500";
    if (k.includes("bandcamp")) return "#1DA0C3";
    if (k.includes("apple") && k.includes("music")) return "#FA243C";
    if (k.includes("linktree")) return "#43E660";
    return null;
}

function isStreamingPlatform(key) {
    const k = String(key).toLowerCase();
    return (
        k.includes("spotify") || k.includes("soundcloud") || k.includes("bandcamp") ||
        k.includes("applemusic") || k.includes("apple_music") || k.includes("apple music") ||
        k.includes("tidal") || k.includes("deezer") || k.includes("amazon") ||
        k.includes("youtube") || k.includes("yt")
    );
}

function sortLinksStreamingFirst(entries) {
    const streaming = [];
    const social = [];
    for (const entry of entries) {
        if (isStreamingPlatform(entry[0])) streaming.push(entry);
        else social.push(entry);
    }
    return [...streaming, ...social];
}

// ============================
// SectionHeader Component
// ============================
function SectionHeader({ icon, title, action }) {
    return (
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ color: "primary.main" }}>{icon}</Box>
                <Typography variant="h6" fontWeight={700}>{title}</Typography>
            </Stack>
            {action}
        </Stack>
    );
}

// ============================
// EmptyStateCard Component
// ============================
function EmptyStateCard({ icon, title, description }) {
    return (
        <Box sx={{ textAlign: "center", py: 5 }}>
            <Box sx={{ color: "primary.main", mb: 1.5 }}>{icon}</Box>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5, color: "primary.main" }}>{title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: "auto" }}>
                {description}
            </Typography>
        </Box>
    );
}

// ============================
// PhotoLightbox Component
// ============================
function PhotoLightbox({ open, onClose, images, currentIndex, onNavigate, name }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    if (!open || !images || images.length === 0) return null;

    const currentImage = images[currentIndex] || images[0];
    const imageUrl = typeof currentImage === "string" ? currentImage : currentImage?.url;
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < images.length - 1;

    const handlePrev = (e) => {
        e.stopPropagation();
        if (hasPrev) onNavigate(currentIndex - 1);
    };

    const handleNext = (e) => {
        e.stopPropagation();
        if (hasNext) onNavigate(currentIndex + 1);
    };

    const handleKeyDown = (e) => {
        if (e.key === "ArrowLeft" && hasPrev) onNavigate(currentIndex - 1);
        if (e.key === "ArrowRight" && hasNext) onNavigate(currentIndex + 1);
        if (e.key === "Escape") onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen={isMobile}
            maxWidth="lg"
            fullWidth
            onKeyDown={handleKeyDown}
            sx={{ zIndex: 100001 }}
            PaperProps={{
                sx: {
                    bgcolor: (t) => alpha(t.palette.text.primary, 0.95),
                    ...(!isMobile && { maxHeight: "90vh", m: { xs: 1, sm: 2 } }),
                    overflow: "hidden",
                },
            }}
        >
            <Box sx={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: "absolute",
                        ...topRightInsetSx(),
                        color: "white",
                        bgcolor: (t) => alpha(t.palette.text.primary, 0.5),
                        "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.7) },
                        zIndex: 10,
                    }}
                >
                    <CloseRoundedIcon />
                </IconButton>

                {hasPrev && (
                    <IconButton
                        onClick={handlePrev}
                        sx={{
                            position: "absolute",
                            left: 8,
                            color: "white",
                            bgcolor: (t) => alpha(t.palette.text.primary, 0.5),
                            "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.7) },
                        }}
                    >
                        <ChevronLeftRoundedIcon />
                    </IconButton>
                )}

                {hasNext && (
                    <IconButton
                        onClick={handleNext}
                        sx={{
                            position: "absolute",
                            right: 8,
                            color: "white",
                            bgcolor: (t) => alpha(t.palette.text.primary, 0.5),
                            "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.7) },
                        }}
                    >
                        <ChevronRightRoundedIcon />
                    </IconButton>
                )}

                <Box
                    component="img"
                    src={imageUrl}
                    alt={`${name} photo ${currentIndex + 1}`}
                    sx={{
                        maxWidth: "100%",
                        maxHeight: "85vh",
                        objectFit: "contain",
                    }}
                />

                <Typography
                    sx={{
                        position: "absolute",
                        bottom: 8,
                        left: "50%",
                        transform: "translateX(-50%)",
                        color: "white",
                        bgcolor: (t) => alpha(t.palette.text.primary, 0.5),
                        px: 2,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: "0.875rem",
                    }}
                >
                    {currentIndex + 1} / {images.length}
                </Typography>
            </Box>
        </Dialog>
    );
}

// ============================
// PhotoGallery Component
// ============================
function PhotoGallery({ images, name, onPhotoClick, maxDisplay, isOverview = false, onViewAll }) {
    if (!images || images.length === 0) return null;

    const displayImages = maxDisplay ? images.slice(0, maxDisplay) : images;
    const remaining = maxDisplay ? images.length - maxDisplay : 0;

    const handlePhotoClick = (img, index) => {
        if (onPhotoClick) {
            const photoId = typeof img === 'string' ? null : (img.id || img.photo_id || null);
            const photoUrl = typeof img === 'string' ? img : img.url;
            onPhotoClick(photoId, photoUrl, index);
        }
    };

    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: isOverview ? "repeat(2, 1fr)" : { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" },
                gap: 1,
            }}
        >
            {displayImages.map((img, idx) => {
                const url = typeof img === "string" ? img : img?.url;
                const isLastWithMore = maxDisplay && idx === maxDisplay - 1 && remaining > 0;
                return (
                    <Box
                        key={idx}
                        onClick={() => handlePhotoClick(img, idx)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePhotoClick(img, idx); }}
                        sx={{
                            position: "relative",
                            paddingTop: "100%",
                            borderRadius: 2,
                            overflow: "hidden",
                            cursor: "pointer",
                            "&:hover img": { transform: "scale(1.05)" },
                        }}
                    >
                        <Box
                            component="img"
                            src={url}
                            alt={`${name} photo ${idx + 1}`}
                            sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                transition: "transform 0.3s",
                            }}
                        />
                        {/* +N overlay on last photo in overview */}
                        {isLastWithMore && (
                            <Box
                                onClick={(e) => { e.stopPropagation(); onViewAll?.(); }}
                                sx={{
                                    position: "absolute",
                                    inset: 0,
                                    bgcolor: (t) => alpha(t.palette.common.black, 0.50),
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    zIndex: 1,
                                }}
                            >
                                <Typography variant="h5" fontWeight={700} color="white">+{remaining}</Typography>
                            </Box>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
}

// ============================
// InlineStatItem Component
// ============================
function InlineStatItem({ value, label, onClick }) {
    const formattedValue = typeof value === "number"
        ? value >= 1000000
            ? `${(value / 1000000).toFixed(1)}M`
            : value >= 1000
                ? `${(value / 1000).toFixed(1)}K`
                : value.toLocaleString()
        : value;

    return (
        <Stack
            direction="row"
            alignItems="baseline"
            spacing={0.5}
            onClick={onClick}
            sx={onClick ? { cursor: "pointer", "&:hover .stat-label": { textDecoration: "underline" } } : undefined}
        >
            <Typography variant="body2" fontWeight={700}>{formattedValue}</Typography>
            <Typography className="stat-label" variant="caption" color="text.secondary">{label}</Typography>
        </Stack>
    );
}

// ============================
// ArtistPostCard Component (flat list style – matches BusinessPostCard)
// ============================
/* ────────────────────────────────────────────────────────────────
   Photo helpers — match ProfilePostsList / UserProfilePage exactly
   ──────────────────────────────────────────────────────────────── */

function extractMediaUrls(post) {
    if (!post) return [];
    let processed = [];
    const { photos } = post;
    if (Array.isArray(photos)) {
        processed = photos.filter((p) => p && typeof p === 'string' && p !== 'null');
    } else if (typeof photos === 'string' && photos !== 'null' && photos.trim()) {
        try {
            const parsed = JSON.parse(photos);
            if (Array.isArray(parsed)) processed = parsed.filter((p) => p && typeof p === 'string' && p !== 'null');
        } catch { processed = [photos]; }
    }
    if (!processed.length) {
        const oneOffs = [
            post.photo_url, post.photo, post.image_url, post.image,
            post.thumbnail, post.main_photo_url, post.cover, post.cover_url,
            post.media_url, post.coverImage, post.cover_image,
        ].filter((u) => typeof u === 'string' && u && u !== 'null').slice(0, 1);
        if (oneOffs.length) processed = oneOffs;
    }
    if (!processed.length && post.mediaUrl) {
        try {
            const parsed = JSON.parse(post.mediaUrl);
            if (Array.isArray(parsed)) processed = parsed.filter((u) => typeof u === 'string' && u);
            else if (typeof post.mediaUrl === 'string' && post.mediaUrl !== 'null') processed = [post.mediaUrl];
        } catch {
            if (typeof post.mediaUrl === 'string' && post.mediaUrl !== 'null' && post.mediaUrl.trim()) processed = [post.mediaUrl];
        }
    }
    if (!processed.length && Array.isArray(post.community_photos)) {
        processed = post.community_photos.map((r) => r?.url || r?.photo_url || r?.path || null).filter(Boolean);
    }
    if (!processed.length && typeof post.photos_json === 'string') {
        try { const arr = JSON.parse(post.photos_json); if (Array.isArray(arr)) processed = arr.filter((u) => typeof u === 'string' && u); } catch { /* ignore */ }
    }
    return processed;
}

/**
 * normalizePost — mirrors BusinessEngagementTabs normalizePost exactly.
 * Ensures viewerLiked / viewerReposted and counts are always present and typed.
 */
function normalizeEngagementPost(post) {
    if (!post) return null;
    let photos = [];
    if (post.photos) {
        if (typeof post.photos === 'string') {
            try {
                const parsed = JSON.parse(post.photos);
                photos = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
            } catch {
                if (post.photos !== 'null' && post.photos.trim()) photos = [post.photos];
            }
        } else if (Array.isArray(post.photos)) {
            photos = post.photos.filter(Boolean);
        }
    }
    return {
        ...post,
        photos,
        likesCount: Number(post.likesCount ?? post.likes_count ?? post.like_count ?? post.likes ?? 0),
        commentsCount: Number(post.commentsCount ?? post.comments_count ?? post.comment_count ?? post.comments ?? 0),
        repostsCount: Number(post.repostsCount ?? post.reposts_count ?? post.repost_count ?? post.reposts ?? 0),
        viewerLiked: Boolean(post.viewerLiked ?? post.viewer_liked ?? post.liked ?? post.is_liked ?? false),
        viewerReposted: Boolean(post.viewerReposted ?? post.viewer_reposted ?? post.reposted ?? post.is_reposted ?? false),
    };
}

function ArtistEngagementPhotoGrid({ mediaUrls, onOpenLightbox }) {
    if (!mediaUrls || mediaUrls.length === 0) return null;
    const count = mediaUrls.length;
    const imgCell = (url, idx, sx = {}) => (
        <Box key={idx} onClick={(e) => { e.stopPropagation(); onOpenLightbox(idx); }}
             sx={{ position: 'relative', cursor: 'pointer', overflow: 'hidden', '&:hover img': { transform: 'scale(1.03)' }, ...sx }}>
            <Box component="img" src={url} alt="" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)' }} />
        </Box>
    );
    const overlay = (extra) => (
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: (t) => alpha(t.palette.common.black, 0.55), display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <Typography sx={{ color: 'common.white', fontWeight: 800, fontSize: '1.5rem' }}>+{extra}</Typography>
        </Box>
    );
    if (count === 1) return (<Box sx={{ borderRadius: 2.5, overflow: 'hidden', mt: 1.5 }}><Box onClick={(e) => { e.stopPropagation(); onOpenLightbox(0); }} sx={{ position: 'relative', cursor: 'pointer', '&:hover img': { transform: 'scale(1.02)' } }}><Box component="img" src={mediaUrls[0]} alt="" sx={{ width: '100%', maxHeight: 600, objectFit: 'contain', display: 'block', transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)' }} /></Box></Box>);
    if (count === 2) return (<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 220, sm: 280, md: 320 }, mt: 1.5 }}>{imgCell(mediaUrls[0], 0)}{imgCell(mediaUrls[1], 1)}</Box>);
    if (count === 3) return (<Box sx={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gridTemplateRows: '1fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 260, sm: 340, md: 400 }, mt: 1.5 }}>{imgCell(mediaUrls[0], 0, { gridRow: '1 / 3' })}{imgCell(mediaUrls[1], 1)}{imgCell(mediaUrls[2], 2)}</Box>);
    if (count === 4) return (<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '2fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 300, sm: 380, md: 440 }, mt: 1.5 }}>{imgCell(mediaUrls[0], 0, { gridColumn: '1 / 4' })}{imgCell(mediaUrls[1], 1)}{imgCell(mediaUrls[2], 2)}{imgCell(mediaUrls[3], 3)}</Box>);
    const extra = count - 5;
    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 2fr 2fr', gridTemplateRows: '1fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 280, sm: 360, md: 420 }, mt: 1.5 }}>
            {imgCell(mediaUrls[0], 0, { gridRow: '1 / 3' })}{imgCell(mediaUrls[1], 1)}{imgCell(mediaUrls[2], 2)}{imgCell(mediaUrls[3], 3)}
            <Box onClick={(e) => { e.stopPropagation(); onOpenLightbox(4); }} sx={{ position: 'relative', cursor: 'pointer', overflow: 'hidden', '&:hover img': { transform: 'scale(1.03)' } }}>
                <Box component="img" src={mediaUrls[4]} alt="" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)' }} />
                {extra > 0 && overlay(extra)}
            </Box>
        </Box>
    );
}

function ArtistPostCard({ post, canManage, onPin, onUnpin, onEdit, onDelete, artistName, artistAvatar, artistId, artistHandle, user, activeTab, onPreview, profileType }) {
    const navigate = useNavigate();
    const apcTheme = useTheme();
    const apcIsMobile = useMediaQuery(apcTheme.breakpoints.down("sm"));
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [bodyExpanded, setBodyExpanded] = useState(false);
    const [pinning, setPinning] = useState(false);

    const isPinned = Boolean(post.isPinned);

    // Character limit for truncated body
    const POST_BODY_TRUNCATE = 280;

    // Extract photos from mediaUrl
    let mediaUrls = [];
    if (post.mediaUrl) {
        try {
            const parsed = JSON.parse(post.mediaUrl);
            mediaUrls = Array.isArray(parsed) ? parsed : [post.mediaUrl];
        } catch {
            mediaUrls = [post.mediaUrl];
        }
    }
    mediaUrls = mediaUrls.filter((u) => u && typeof u === "string");

    const shouldTruncateBody = post.body && post.body.length > POST_BODY_TRUNCATE && !bodyExpanded;

    const handleNavigateToPost = () => {
        // Save scroll + tab so artist profile restores seamlessly on return
        try {
            const storeKey = artistHandle || artistId;
            sessionStorage.setItem(`ll:artistProfile:${storeKey}:scrollY`, String(window.scrollY || 0));
            sessionStorage.setItem(`ll:artistProfile:${storeKey}:activeTab`, String(activeTab ?? 1));
            sessionStorage.setItem(`ll:artistProfile:${storeKey}:restore`, "1");
        } catch {
            // ignore
        }
        navigate(`/${artistHandle}/posts/${post.id}`, {
            state: {
                fromProfile: true,
                backProfileName: artistName,
                backProfileHandle: artistHandle,
                backToProfileUrl: `/${artistHandle}`,
            },
        });
    };

    const handleMenuClose = () => setMenuAnchor(null);

    const handleMenuOpen = (e) => {
        e.stopPropagation();
        setMenuAnchor(e.currentTarget);
    };

    const handlePinToggle = async () => {
        handleMenuClose();
        setPinning(true);
        try {
            if (isPinned) {
                await onUnpin?.(post.id);
            } else {
                await onPin?.(post.id);
            }
        } finally {
            setPinning(false);
        }
    };

    const handleCardClick = (e) => {
        const target = e.target;
        const isInteractive = target.closest('button, a, [role="button"], .MuiChip-root, .MuiIconButton-root, .MuiMenu-root, [data-interactive="true"]');
        if (isInteractive) return;
        if (onPreview) {
            onPreview({ ...post, artist_id: post.artist_id || artistId, artistName: post.artistName || artistName, artistAvatar: post.artistAvatar || artistAvatar, artistHandle: post.artistHandle || artistHandle });
        } else {
            handleNavigateToPost();
        }
    };

    // Clicking any photo opens the post detail (same as clicking the card body),
    // rather than a picture-only lightbox. The `index` arg is kept for call-site
    // compatibility but is no longer used.
    const openLightbox = (_index) => {
        if (onPreview) {
            onPreview({
                ...post,
                artist_id: post.artist_id || artistId,
                artistName: post.artistName || artistName,
                artistAvatar: post.artistAvatar || artistAvatar,
                artistHandle: post.artistHandle || artistHandle,
            });
        } else {
            handleNavigateToPost();
        }
    };

    // Photo grid layout — Facebook-style with generous sizing and +N overlay
    const renderPhotoGrid = () => {
        if (mediaUrls.length === 0) return null;

        const count = mediaUrls.length;

        // Shared image box style
        const imgCell = (url, idx, sx = {}) => (
            <Box
                key={idx}
                onClick={(e) => { e.stopPropagation(); openLightbox(idx); }}
                sx={{
                    position: "relative",
                    cursor: "pointer",
                    overflow: "hidden",
                    "&:hover img": { transform: "scale(1.03)" },
                    ...sx,
                }}
            >
                <Box
                    component="img"
                    src={url}
                    alt=""
                    sx={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                />
            </Box>
        );

        const overlay = (extra) => (
            <Box sx={{
                position: "absolute", inset: 0,
                bgcolor: (t) => alpha(t.palette.common.black, 0.55),
                display: "flex", alignItems: "center", justifyContent: "center",
                pointerEvents: "none",
            }}>
                <Typography sx={{ color: "common.white", fontWeight: 800, fontSize: "1.5rem" }}>+{extra}</Typography>
            </Box>
        );

        // 1 photo — full width, tall
        if (count === 1) {
            return (
                <Box sx={{ borderRadius: 2.5, overflow: "hidden" }}>
                    <Box
                        onClick={(e) => { e.stopPropagation(); openLightbox(0); }}
                        sx={{ position: "relative", cursor: "pointer", "&:hover img": { transform: "scale(1.02)" } }}
                    >
                        <Box
                            component="img"
                            src={mediaUrls[0]}
                            alt=""
                            sx={{
                                width: "100%",
                                maxHeight: 600,
                                objectFit: "contain",
                                display: "block",
                                transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                            }}
                        />
                    </Box>
                </Box>
            );
        }

        // 2 photos — side by side, equal height
        if (count === 2) {
            return (
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.5, borderRadius: 2.5, overflow: "hidden", height: { xs: 220, sm: 280, md: 320 } }}>
                    {imgCell(mediaUrls[0], 0)}
                    {imgCell(mediaUrls[1], 1)}
                </Box>
            );
        }

        // 3 photos — big left, two stacked right
        if (count === 3) {
            return (
                <Box sx={{ display: "grid", gridTemplateColumns: "3fr 2fr", gridTemplateRows: "1fr 1fr", gap: 0.5, borderRadius: 2.5, overflow: "hidden", height: { xs: 260, sm: 340, md: 400 } }}>
                    {imgCell(mediaUrls[0], 0, { gridRow: "1 / 3" })}
                    {imgCell(mediaUrls[1], 1)}
                    {imgCell(mediaUrls[2], 2)}
                </Box>
            );
        }

        // 4 photos — big top, three on bottom
        if (count === 4) {
            return (
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "2fr 1fr", gap: 0.5, borderRadius: 2.5, overflow: "hidden", height: { xs: 300, sm: 380, md: 440 } }}>
                    {imgCell(mediaUrls[0], 0, { gridColumn: "1 / 4" })}
                    {imgCell(mediaUrls[1], 1)}
                    {imgCell(mediaUrls[2], 2)}
                    {imgCell(mediaUrls[3], 3)}
                </Box>
            );
        }

        // 5+ photos — big left, two right, two bottom-right with +N on last
        const extra = count - 5;
        return (
            <Box sx={{ display: "grid", gridTemplateColumns: "3fr 2fr 2fr", gridTemplateRows: "1fr 1fr", gap: 0.5, borderRadius: 2.5, overflow: "hidden", height: { xs: 280, sm: 360, md: 420 } }}>
                {imgCell(mediaUrls[0], 0, { gridRow: "1 / 3" })}
                {imgCell(mediaUrls[1], 1)}
                {imgCell(mediaUrls[2], 2)}
                {imgCell(mediaUrls[3], 3)}
                <Box
                    onClick={(e) => { e.stopPropagation(); openLightbox(4); }}
                    sx={{
                        position: "relative",
                        cursor: "pointer",
                        overflow: "hidden",
                        "&:hover img": { transform: "scale(1.03)" },
                    }}
                >
                    <Box
                        component="img"
                        src={mediaUrls[4]}
                        alt=""
                        sx={{
                            position: "absolute", inset: 0, width: "100%", height: "100%",
                            objectFit: "cover", display: "block",
                            transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                    />
                    {extra > 0 && overlay(extra)}
                </Box>
            </Box>
        );
    };

    return (
        <>
            <Box
                onClick={handleCardClick}
                sx={{
                    py: 2.5,
                    borderBottom: "1px solid",
                    borderColor: (t) => alpha(t.palette.text.primary, 0.08),
                    "&:last-child": { borderBottom: "none" },
                    bgcolor: "transparent",
                    px: { xs: 2, sm: 3 },
                    cursor: "pointer",
                    transition: "background-color 180ms ease",
                    "&:hover": {
                        bgcolor: (t) => alpha(t.palette.text.primary, 0.03),
                    },
                }}
            >
                {/* Post Header */}
                <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.5 }}>
                    <Avatar
                        src={artistAvatar || undefined}
                        sx={(t) => ({
                            width: { xs: 40, sm: 48 },
                            height: { xs: 40, sm: 48 },
                            flexShrink: 0,
                            bgcolor: alpha(t.palette.primary.main, 0.08),
                            color: t.palette.primary.main,
                            border: "2px solid",
                            borderColor: alpha(t.palette.text.primary, 0.06),
                        })}
                    >
                        {profileType === "artist"
                            ? <PaletteRoundedIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                            : <MusicNoteRoundedIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap">
                            <Typography variant="body2" fontWeight={700} noWrap>{artistName}</Typography>
                        </Stack>
                        {artistHandle && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2, mt: -0.25 }} noWrap>
                                @{artistHandle}
                            </Typography>
                        )}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                                {formatRelativeTime(post.createdAt)}
                            </Typography>
                            {Boolean(post.isEdited || post.edited_at || post.editedAt || (post.updated_at && post.created_at && String(post.updated_at) !== String(post.created_at))) && (
                                <>
                                    <Typography variant="caption" color="text.disabled">&bull;</Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: "primary.main" }}>
                                        Edited
                                    </Typography>
                                </>
                            )}
                        </Box>
                    </Box>

                    {/* Pin badge and menu */}
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        {isPinned && (
                            <Chip
                                icon={<PushPinRoundedIcon sx={{ fontSize: 14, transform: "rotate(45deg)" }} />}
                                label="Pinned"
                                size="small"
                                sx={{
                                    fontWeight: 700,
                                    fontSize: "0.7rem",
                                    bgcolor: (t) => alpha(t.palette.warning.main, 0.10),
                                    border: (t) => `1px solid ${alpha(t.palette.warning.main, 0.28)}`,
                                    color: "warning.dark",
                                    "& .MuiChip-icon": { color: "warning.dark" },
                                }}
                            />
                        )}
                        {canManage && (
                            <IconButton size="small" onClick={handleMenuOpen} disabled={pinning}>
                                {pinning ? <CircularProgress size={16} /> : <MoreVertRoundedIcon sx={{ fontSize: 18 }} />}
                            </IconButton>
                        )}
                        <SmartMenu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
                            <MenuItem onClick={() => { handleMenuClose(); onEdit?.(post); }}>
                                <EditRoundedIcon sx={{ fontSize: 18, mr: 1.5, color: "text.secondary" }} /> Edit Post
                            </MenuItem>
                            <MenuItem onClick={() => { handleMenuClose(); setDeleteConfirmOpen(true); }} sx={{ color: "error.main" }}>
                                <DeleteRoundedIcon sx={{ fontSize: 18, mr: 1.5 }} /> Delete Post
                            </MenuItem>
                            <Divider sx={{ my: 0.5 }} />
                            <MenuItem onClick={handlePinToggle}>
                                <PushPinRoundedIcon sx={{ fontSize: 18, mr: 1.5, color: "text.secondary" }} /> {isPinned ? "Unpin Post" : "Pin to Top"}
                            </MenuItem>
                        </SmartMenu>
                    </Stack>
                </Stack>

                {/* Title */}
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1, lineHeight: 1.3, wordBreak: "break-word", overflowWrap: "break-word" }}>
                    {post.title}
                </Typography>

                {/* Body text */}
                {post.body && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            mb: 1,
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.5,
                            fontSize: '0.85rem',
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                            display: '-webkit-box',
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}
                    >
                        {post.body.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()}
                    </Typography>
                )}

                {/* Photo grid */}
                {renderPhotoGrid()}

                {/* Location — below photos, matches PostList / BusinessPostCard pattern */}
                {(() => {
                    const locCity = String(post?.city || '').trim();
                    const locCounty = String(post?.county || '').trim();
                    const locCountyLabel = locCounty
                        ? (locCounty.toLowerCase().includes('county') ? locCounty : `${locCounty} County`)
                        : '';
                    const locationStr = [locCity, locCountyLabel].filter(Boolean).join(', ');
                    if (!locationStr) return null;
                    return (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                gap: 0.5,
                                mt: 1,
                                '&:hover .post-loc-icon, &:hover .post-loc-text': { color: 'secondary.main' },
                            }}
                        >
                            <LocationOnRoundedIcon className="post-loc-icon" sx={{ fontSize: 15, color: 'primary.main', transition: (t) => `color ${t.custom?.motion?.fast || 150}ms ${t.custom?.motion?.ease || 'ease'}` }} />
                            <Typography
                                variant="body2"
                                className="post-loc-text"
                                sx={{
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    color: 'primary.main',
                                    lineHeight: 1.2,
                                    transition: (t) => `color ${t.custom?.motion?.fast || 150}ms ${t.custom?.motion?.ease || 'ease'}`,
                                }}
                            >
                                {locationStr}
                            </Typography>
                        </Box>
                    );
                })()}

                {/* Action bar — fit-content so clicking empty space opens the post */}
                <Box sx={{ mt: 1.5 }}>
                    <Box onClick={(e) => e.stopPropagation()} sx={{ width: 'fit-content' }}>
                        <ActionBar
                            user={user}
                            postId={post.id}
                            post={{
                                ...post,
                                artist_id: artistId,
                                shareUrl: `${window.location.origin}/${artistHandle}/posts/${post.id}`,
                            }}
                            initialLikes={Number(post.likeCount ?? post.like_count ?? 0)}
                            initiallyLiked={Boolean(post.viewerLiked ?? post.viewer_liked ?? false)}
                            commentsCount={Number(post.commentCount ?? post.comment_count ?? 0)}
                            initialReposts={Number(post.repostCount ?? post.repost_count ?? 0)}
                            initiallyReposted={Boolean(post.viewerReposted ?? post.viewer_reposted ?? false)}
                            onComment={onPreview ? () => onPreview({ ...post, artist_id: post.artist_id || artistId, artistName: post.artistName || artistName, artistAvatar: post.artistAvatar || artistAvatar, artistHandle: post.artistHandle || artistHandle }) : handleNavigateToPost}
                            showBoost
                            useShareDialog
                        />
                    </Box>
                </Box>
            </Box>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth sx={{ zIndex: 100001 }}>
                <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography variant="h6" fontWeight={700}>Delete Post?</Typography>
                    <IconButton size="small" onClick={() => setDeleteConfirmOpen(false)}><CloseRoundedIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to delete this post? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => { setDeleteConfirmOpen(false); onDelete?.(post.id); }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

// ============================
// Post Preview Dialog (opens post in overlay instead of navigating away)
// ============================
/**
 * Determines the "kind" of a post so we can render the right detail modal.
 *   - "artist"   → MusicPostDetailPanel  (music_artist_posts)
 *   - "business" → BusinessPostDetailModal (business_page_posts)
 *   - "user"     → PostPage              (community posts)
 */
function detectPostKind(post) {
    if (!post) return "user";
    // Artist post – has artist_id or artistId and no business page id
    const hasArtist = Boolean(
        post.artist_id || post.artistId || post.artistName || post.artist_name ||
        post.artistHandle || post.artist_handle
    );
    // Business post – has business/page id
    const hasBusiness = Boolean(
        post.business_id || post.businessId || post.businessPageId ||
        post.business_page_id || post.page_id || post.pageId ||
        post.businessName || post.business_name || post.pageName || post.page_name
    );
    if (hasArtist && !hasBusiness) return "artist";
    if (hasBusiness) return "business";
    return "user";
}

const SlideRightTransition = React.forwardRef(function SlideRightTransition(props, ref) {
    return <Slide direction="left" ref={ref} {...props} />;
});

function PostDetailDialog({ post, open, onClose, user, onCommentSuccess, scrollToCommentId, highlightCommentId }) {
    const postKind = detectPostKind(post);
    const theme = useTheme();
    const isMobileDialog = useMediaQuery(theme.breakpoints.down("md"));

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            fullScreen={isMobileDialog}
            scroll="paper"
            disableScrollLock
            TransitionComponent={isMobileDialog ? SlideRightTransition : undefined}
            PaperProps={{
                sx: {
                    borderRadius: isMobileDialog ? 0 : 3,
                    maxHeight: isMobileDialog ? "100vh" : "92vh",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                },
            }}
            slotProps={{
                backdrop: {
                    sx: {
                        bgcolor: (t) => alpha(t.palette.common.black, 0.55),
                        backdropFilter: "blur(4px)",
                    },
                },
            }}
            sx={{ zIndex: 100001 }}
        >
            {/* ── Close header bar ── */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: isMobileDialog ? "flex-start" : "flex-end",
                    px: isMobileDialog ? 1.5 : 2,
                    py: 1,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    flexShrink: 0,
                    gap: 1,
                }}
            >
                <IconButton
                    onClick={onClose}
                    size="small"
                    aria-label="Close"
                    sx={{
                        color: "text.primary",
                        "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.08) },
                    }}
                >
                    {isMobileDialog ? <ArrowBackRoundedIcon sx={{ fontSize: 22 }} /> : <CloseRoundedIcon fontSize="small" />}
                </IconButton>
                {isMobileDialog && <Typography sx={{ fontWeight: 800, fontSize: 16 }}>Post</Typography>}
            </Box>

            {/* ── Scrollable post content ── */}
            {post && (
                <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
                    {postKind === "artist" && (
                        <MusicPostDetailPanel post={post} user={user} onLocationClick={() => {}} onCommentSuccess={onCommentSuccess} scrollToCommentId={scrollToCommentId} highlightCommentId={highlightCommentId} />
                    )}
                    {postKind === "business" && (
                        <BusinessPostDetailModal embedded post={post} user={user} onViewPage={() => {}} onShare={() => {}} onLocationClick={() => {}} onCommentSuccess={onCommentSuccess} scrollToCommentId={scrollToCommentId} highlightCommentId={highlightCommentId} />
                    )}
                    {postKind === "user" && (
                        <PostPage embedded post={post} user={user} hideCategoryChip={false} onLocationClick={() => {}} scrollToCommentId={scrollToCommentId} highlightCommentId={highlightCommentId} />
                    )}
                </Box>
            )}
        </Dialog>
    );
}

// ============================
// Inline Photos Upload (matches community pattern)
// ============================
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

function ArtistPostPhotosSection({ photos, setPhotos, disabled, maxPhotos = 4 }) {
    const fileInputRef = useRef(null);
    const [isDropActive, setIsDropActive] = useState(false);
    const [photoError, setPhotoError] = useState("");
    const remaining = maxPhotos - photos.length;

    const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const addFiles = (files) => {
        setPhotoError("");
        const validFiles = [];
        for (const f of files) {
            if (!ALLOWED_IMAGE_TYPES.has(f.type)) {
                setPhotoError("Only JPEG, PNG, and WebP images are allowed.");
                continue;
            }
            if (f.size > MAX_PHOTO_BYTES) {
                setPhotoError("Each photo must be under 10 MB.");
                continue;
            }
            validFiles.push(f);
        }
        const slots = maxPhotos - photos.length;
        if (slots <= 0) return;
        const toAdd = validFiles.slice(0, slots).map((f) => ({
            id: makeId(),
            url: URL.createObjectURL(f),
            file: f,
        }));
        setPhotos((prev) => [...prev, ...toAdd]);
    };

    const removePhoto = (idx) => {
        setPhotos((prev) => {
            const next = [...prev];
            const removed = next.splice(idx, 1)[0];
            if (removed && !removed.existingUrl) {
                try { URL.revokeObjectURL(removed.url); } catch { /* ignore */ }
            }
            return next;
        });
    };

    const handleBrowseClick = () => {
        if (disabled || remaining <= 0) return;
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) addFiles(files);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const onDropZoneDragOver = (e) => {
        e.preventDefault();
        if (!isDropActive) setIsDropActive(true);
    };

    const onDropZoneDragLeave = () => setIsDropActive(false);

    const onDropZoneDrop = (e) => {
        e.preventDefault();
        setIsDropActive(false);
        if (disabled || remaining <= 0) return;
        const files = Array.from(e.dataTransfer?.files || []);
        if (files.length > 0) addFiles(files);
    };

    return (
        <Box sx={{ mt: 1, borderTop: "1px solid", borderColor: "divider", pt: 2, display: "flex", flexDirection: "column", gap: 1.25 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PhotoLibraryRoundedIcon fontSize="small" />
                    <Typography variant="subtitle2" fontWeight={700}>Photos</Typography>
                    <Typography variant="caption" color="text.secondary">
                        Add up to {maxPhotos} photos to your post
                    </Typography>
                </Box>
                <Button variant="outlined" size="small" onClick={handleBrowseClick} disabled={disabled || remaining <= 0}>
                    Add photos
                </Button>
                <input ref={fileInputRef} hidden accept="image/*" type="file" multiple onChange={handleFileChange} />
            </Box>

            {photoError && <Alert severity="warning" sx={{ mt: 0.5 }} onClose={() => setPhotoError("")}>{photoError}</Alert>}

            <Box
                role="button"
                tabIndex={0}
                onClick={handleBrowseClick}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleBrowseClick(); }}
                onDragOver={onDropZoneDragOver}
                onDragLeave={onDropZoneDragLeave}
                onDrop={onDropZoneDrop}
                sx={{
                    border: "2px dashed",
                    borderColor: isDropActive ? "primary.main" : "divider",
                    borderRadius: 2,
                    p: 1.25,
                    cursor: disabled || remaining <= 0 ? "default" : "pointer",
                    bgcolor: isDropActive ? "action.hover" : "transparent",
                    transition: "background-color 120ms ease, border-color 120ms ease",
                    outline: "none",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 0.25, pb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        Drag & drop images here, or click to browse.
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {photos.length} / {maxPhotos}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, minmax(0, 1fr))" },
                        gap: 1,
                    }}
                >
                    {Array.from({ length: maxPhotos }).map((_, slotIdx) => {
                        const p = photos[slotIdx] || null;
                        if (!p) {
                            return (
                                <Box
                                    key={`slot-${slotIdx}`}
                                    sx={{
                                        height: { xs: 110, sm: 96 },
                                        border: "1px solid",
                                        borderColor: "divider",
                                        borderRadius: 2,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 0.25,
                                        bgcolor: "background.paper",
                                    }}
                                >
                                    <Typography variant="caption" fontWeight={700} color="text.secondary">Photo</Typography>
                                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
                                        {remaining <= 0 ? "Limit reached" : "Drop or click"}
                                    </Typography>
                                </Box>
                            );
                        }
                        return (
                            <Box
                                key={p.id || slotIdx}
                                sx={{
                                    position: "relative",
                                    height: { xs: 110, sm: 96 },
                                    borderRadius: 2,
                                    overflow: "hidden",
                                    border: "1px solid",
                                    borderColor: "divider",
                                }}
                            >
                                <Box
                                    component="img"
                                    src={p.url || p.existingUrl}
                                    alt={`Photo ${slotIdx + 1}`}
                                    sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                />
                                <IconButton
                                    size="small"
                                    onClick={(e) => { e.stopPropagation(); removePhoto(slotIdx); }}
                                    disabled={disabled}
                                    sx={{
                                        position: "absolute",
                                        top: 4,
                                        right: 4,
                                        bgcolor: (t) => alpha(t.palette.text.primary, 0.5),
                                        color: "white",
                                        "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.7) },
                                        width: 24,
                                        height: 24,
                                    }}
                                >
                                    <CloseRoundedIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </Box>
    );
}

// ============================
// CreateArtistPostDialog Component
// ============================
function CreateArtistPostDialog({ open, onClose, artistId, artistName, onPostCreated }) {
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [photos, setPhotos] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const bodyInputRef = useRef(null);

    const mentionBody = useMentionField(body, setBody, bodyInputRef);

    const handleClose = () => {
        setTitle("");
        setBody("");
        setPhotos([]);
        setError(null);
        onClose();
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError(null);
        try {
            // Upload photos to GCS first
            let mediaUrl = null;
            if (photos.length > 0) {
                const urls = await uploadPhotosToGCS(photos);
                if (urls.length > 0) {
                    mediaUrl = JSON.stringify(urls);
                }
            }

            await createArtistPost(artistId, {
                type: "update",
                title: title.trim(),
                body: body.trim(),
                media_url: mediaUrl,
            });
            handleClose();
            onPostCreated?.();
        } catch (err) {
            setError(err?.message || "Failed to create post. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { maxHeight: "90vh" } }} sx={{ zIndex: 100001 }}>
            <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
                <Typography variant="h6" fontWeight={800}>New Post</Typography>
                <IconButton onClick={handleClose} size="small"><CloseRoundedIcon /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ overflowY: "auto", overflowX: "hidden" }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Share an update with your followers as {artistName}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <TextField
                    fullWidth
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    sx={{ mb: 2 }}
                    inputProps={{ maxLength: 180 }}
                    helperText={`${title.length}/180`}
                    required
                />

                <Box sx={{ position: "relative", mb: 0 }}>
                    <TextField
                        inputRef={bodyInputRef}
                        fullWidth
                        label="Description"
                        value={body}
                        onChange={(e) => { const v = e.target.value.slice(0, POST_BODY_CHAR_LIMIT); e.target.value = v; mentionBody.onChange(e); }}
                        onKeyDown={mentionBody.onKeyDown}
                        multiline
                        rows={4}
                        placeholder="Tell your followers what's happening..."
                        inputProps={{ maxLength: POST_BODY_CHAR_LIMIT }}
                        helperText={`${body.length}/${POST_BODY_CHAR_LIMIT}`}
                    />
                    {mentionBody.popper}
                </Box>

                <ArtistPostPhotosSection
                    photos={photos}
                    setPhotos={setPhotos}
                    disabled={submitting}
                    maxPhotos={MAX_POST_PHOTOS}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!title.trim() || submitting}
                    startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
                >
                    {submitting ? "Publishing..." : "Publish Post"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ============================
// EditArtistPostDialog Component
// ============================
function EditArtistPostDialog({ open, onClose, post, artistId, artistName, onPostUpdated }) {
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [photos, setPhotos] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (post && open) {
            setTitle(post.title || "");
            setBody(post.body || "");

            // Load existing photos from mediaUrl (JSON array of URLs)
            let existingPhotos = [];
            if (post.mediaUrl) {
                try {
                    const parsed = JSON.parse(post.mediaUrl);
                    const urls = Array.isArray(parsed) ? parsed : [post.mediaUrl];
                    existingPhotos = urls
                        .filter((u) => u && typeof u === "string")
                        .map((url) => ({ id: `existing-${url}`, url, existingUrl: url }));
                } catch {
                    if (typeof post.mediaUrl === "string" && post.mediaUrl.startsWith("http")) {
                        existingPhotos = [{ id: `existing-${post.mediaUrl}`, url: post.mediaUrl, existingUrl: post.mediaUrl }];
                    }
                }
            }
            setPhotos(existingPhotos);
        }
    }, [post, open]);

    const handleClose = () => {
        setError(null);
        onClose();
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError(null);
        try {
            // Separate new files from existing URLs
            const existingUrls = photos.filter((p) => p.existingUrl).map((p) => p.existingUrl);
            const newFiles = photos.filter((p) => p.file);

            let newUrls = [];
            if (newFiles.length > 0) {
                newUrls = await uploadPhotosToGCS(newFiles);
            }

            const allUrls = [...existingUrls, ...newUrls];
            const mediaUrl = allUrls.length > 0 ? JSON.stringify(allUrls) : null;

            await updateArtistPost(artistId, post.id, {
                title: title.trim(),
                body: body.trim(),
                media_url: mediaUrl,
            });
            handleClose();
            onPostUpdated?.();
        } catch (err) {
            setError(err?.message || "Failed to update post. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { maxHeight: "90vh" } }} sx={{ zIndex: 100001 }}>
            <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
                <Typography variant="h6" fontWeight={800}>Edit Post</Typography>
                <IconButton onClick={handleClose} size="small"><CloseRoundedIcon /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ overflowY: "auto", overflowX: "hidden" }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Update your post for {artistName}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <TextField
                    fullWidth
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    sx={{ mb: 2 }}
                    inputProps={{ maxLength: 180 }}
                    helperText={`${title.length}/180`}
                    required
                />

                <Box sx={{
                    '& .ProseMirror, & .tiptap, & [contenteditable="true"]': {
                        height: 280,
                        overflowY: 'auto',
                    },
                }}>
                    <RichTextEditor
                        label="Description"
                        value={body}
                        onChange={(html) => setBody(html)}
                        maxLength={POST_BODY_CHAR_LIMIT}
                        placeholder="Tell your followers what's happening..."
                        minRows={10}
                    />
                </Box>

                <ArtistPostPhotosSection
                    photos={photos}
                    setPhotos={setPhotos}
                    disabled={submitting}
                    maxPhotos={MAX_POST_PHOTOS}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!title.trim() || submitting}
                    startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
                >
                    {submitting ? "Saving..." : "Save Changes"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ─── Follow API helpers ─────────────────────────────────────────────────────

const FOLLOW_API_BASE_PP = (() => {
    const raw = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
    return raw ? `${raw}/api` : "/api";
})();

function getArtistIdPP(artist) {
    if (!artist) return null;
    const raw = artist.id ?? artist.artist_id ?? null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
}

async function fetchArtistFollowStatePP(artist, acctHeaders) {
    const artistId = getArtistIdPP(artist);
    if (!artistId) return { isFollowing: false };
    try {
        const qs = new URLSearchParams({ target_id: String(artistId), target_type: "artist" });
        const res = await secureFetch(`${FOLLOW_API_BASE_PP}/follows/status?${qs}`, {
            credentials: "include",
            headers: { Accept: "application/json", ...(acctHeaders || {}) },
        });
        if (!res.ok) return { isFollowing: false };
        const data = await res.json();
        return { isFollowing: Boolean(data?.following) };
    } catch {
        return { isFollowing: false };
    }
}

async function callArtistFollowApiPP(artist, currentlyFollowing, acctHeaders, acctPayload) {
    const artistId = getArtistIdPP(artist);
    if (!artistId) throw new Error("No artist ID");
    const res = await secureFetch(`${FOLLOW_API_BASE_PP}/follows/toggle`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(acctHeaders || {}) },
        body: JSON.stringify({
            target_id: artistId,
            target_type: "artist",
            action: currentlyFollowing ? "unfollow" : "follow",
            ...(acctPayload || {}),
        }),
    });
    if (!res.ok) throw new Error("Follow request failed");
    return res.json();
}

async function fetchArtistFollowCountsPP(artistId, viewerUserId, acctHeaders) {
    if (!artistId) return { followers: 0, following: 0 };
    try {
        // Use the same /follows/social/ endpoint that SocialHome and the popup dialog use.
        // This returns the actual follower/following arrays, so .length matches the popup exactly.
        if (viewerUserId) {
            const res = await secureFetch(
                `${FOLLOW_API_BASE_PP}/follows/social/${encodeURIComponent(viewerUserId)}?account_type=artist&account_id=${artistId}`,
                {
                    credentials: "include",
                    headers: { Accept: "application/json", ...(acctHeaders || {}) },
                }
            );
            if (res.ok) {
                const data = await res.json();
                const followersArr = Array.isArray(data?.followers) ? data.followers : [];
                const followingArr = Array.isArray(data?.following) ? data.following : [];
                return { followers: followersArr.length, following: followingArr.length };
            }
        }
        // Fallback to counts endpoint if no viewer or social endpoint fails
        const res = await secureFetch(`${FOLLOW_API_BASE_PP}/follows/counts/artist/${artistId}`, {
            credentials: "include",
        });
        if (!res.ok) return { followers: 0, following: 0 };
        const data = await res.json();
        return { followers: Number(data?.followers) || 0, following: Number(data?.following) || 0 };
    } catch {
        return { followers: 0, following: 0 };
    }
}

// ============================
// ArtistProfilePage Component
// ============================
export default function ArtistProfilePage({ user: userProp, artistData: artistDataProp, embedded = false, onBack }) {
    const { handle, handleOrId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const isMobileSm = useMediaQuery(theme.breakpoints.down("sm"));
    const chromeTop = useChromeTop();

    // ── Listen for auth:token-expired from secureFetch / axiosInstance ──
    useEffect(() => {
        const handleTokenExpired = () => navigate('/login', { replace: true });
        window.addEventListener('auth:token-expired', handleTokenExpired);
        return () => window.removeEventListener('auth:token-expired', handleTokenExpired);
    }, [navigate]);

    // Use prop user if provided, otherwise fall back to context
    const auth = useAuth();
    const { user: contextUser } = auth || {};
    const user = userProp || contextUser;

    // Get active account info to determine if we're on the artist's profile
    const {
        activeAccount,
        accountCacheKey,
        isBusinessAccount,
        isArtistAccount,
        activeBusinessId,
        activeArtistId,
        activeAccountType,
        getAccountHeaders: getAcctHdrs,
        getAccountPayload: getAcctPayload,
    } = useActiveAccount();

    // ── Success confirmation snackbar ──
    const { showSuccess, snackbarProps: successSnackbarProps } = useSuccessSnackbar();

    /* ---------- rate limiting for posts, events, jobs ---------- */
    const { checkLimit: checkPostLimit, recordAction: recordPost } = useRateLimit('community-post', {
        burstMax: 3, burstWindowMs: 60_000, maxPerHour: 15,
    });
    const { checkLimit: checkEventLimit, recordAction: recordEventCreate } = useRateLimit('event-create', {
        burstMax: 3, burstWindowMs: 120_000, maxPerHour: 10,
    });
    const { checkLimit: checkJobLimit, recordAction: recordJobCreate } = useRateLimit('job-create', {
        burstMax: 3, burstWindowMs: 120_000, maxPerHour: 10,
    });
    const [rateLimitOpen, setRateLimitOpen] = useState(false);
    const [rateLimitInfo, setRateLimitInfo] = useState({
        retryAfterSec: 10, reason: 'cooldown', actionLabel: 'posts',
    });

    const handleOpenCreatePost = useCallback(() => {
        const result = checkPostLimit();
        if (!result.allowed) {
            setRateLimitInfo({ retryAfterSec: result.retryAfterSec, reason: result.reason, actionLabel: 'posts' });
            setRateLimitOpen(true);
            return;
        }
        setCreatePostOpen(true);
    }, [checkPostLimit]);





    // ── Stable refs for context functions to prevent infinite update loops ──
    const getAcctHdrsRef = useRef(getAcctHdrs);
    getAcctHdrsRef.current = getAcctHdrs;
    const getAcctPayloadRef = useRef(getAcctPayload);
    getAcctPayloadRef.current = getAcctPayload;

    // Use handleOrId (from /:handleOrId route) or handle (from /music/artist/:handle route)
    // When embedded (in drawer), fall back to the prop data's handle
    const artistHandle = handleOrId || handle || (embedded ? (artistDataProp?.handle || artistDataProp?.slug || String(artistDataProp?.id || '')) : undefined);

    // ── Scroll + Tab Restore ──────────────────────────────────────────────────
    // Read sessionStorage synchronously in useState initializer (before any effects).
    const [_restoreState] = useState(() => {
        const key = handleOrId || handle;
        if (!key) return null;
        try {
            if (sessionStorage.getItem(`ll:artistProfile:${key}:restore`) !== "1") return null;
            const tab = Number(sessionStorage.getItem(`ll:artistProfile:${key}:activeTab`));
            const scrollY = Number(sessionStorage.getItem(`ll:artistProfile:${key}:scrollY`) || 0);
            // Clean up
            sessionStorage.removeItem(`ll:artistProfile:${key}:restore`);
            sessionStorage.removeItem(`ll:artistProfile:${key}:activeTab`);
            sessionStorage.removeItem(`ll:artistProfile:${key}:scrollY`);
            return {
                tab: Number.isFinite(tab) && tab >= 0 ? tab : 0,
                scrollY: Number.isFinite(scrollY) ? scrollY : 0,
            };
        } catch {
            return null;
        }
    });

    const [artist, setArtist] = useState(artistDataProp || null);
    const [loading, setLoading] = useState(!artistDataProp);
    const [error, setError] = useState(null);
    const [rawLoadError, setRawLoadError] = useState(null);

    // Initialize activeTab from restore state to avoid wrong-tab flash
    const [activeTab, setActiveTab] = useState(_restoreState?.tab ?? 0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followBusy, setFollowBusy] = useState(false);
    const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
    const [followsRefreshNonce, setFollowsRefreshNonce] = useState(0);
    const [followsDialogOpen, setFollowsDialogOpen] = useState(false);
    const [followsDialogTab, setFollowsDialogTab] = useState(0);
    const [aboutExpanded, setAboutExpanded] = useState(false);
    const [aboutOverflows, setAboutOverflows] = useState(false);
    const aboutRef = useRef(null);

    // Sticky sidebar + posts header state (matching BusinessPublicPage)
    const [isHeaderSticky, setIsHeaderSticky] = useState(false);
    const [isSidebarSticky, setIsSidebarSticky] = useState(false);
    const [sidebarStickyTop, setSidebarStickyTop] = useState(16);
    const [engagementMode, setEngagementMode] = useState("activity"); // "activity" | "events"

    // ── Mobile Activity tab state (matching BusinessPublicPage / BusinessEngagementTabs) ──
    const [mobileActivityFilterOpen, setMobileActivityFilterOpen] = useState(false);
    const [mobileActivitySearchVisible, setMobileActivitySearchVisible] = useState(false);
    const [mobileEventSearchVisible, setMobileEventSearchVisible] = useState(false);
    const [mobileEventFilterOpen, setMobileEventFilterOpen] = useState(false);
    const [mobileJobsSearchVisible, setMobileJobsSearchVisible] = useState(false);
    const [mobileJobsFilterOpen, setMobileJobsFilterOpen] = useState(false);
    const [mobileServicesSearchVisible, setMobileServicesSearchVisible] = useState(false);
    const [mobileServicesFilterOpen, setMobileServicesFilterOpen] = useState(false);
    const sidebarRef = useRef(null);
    const sidebarContentRef = useRef(null);
    const postsHeaderRef = useRef(null);
    const contentTopRef = useRef(null);

    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [avatarImgLoaded, setAvatarImgLoaded] = useState(true);
    const [canManage, setCanManage] = useState(false);

    // Photo report state
    const [photoReportOpen, setPhotoReportOpen] = useState(false);
    const [photoReportTarget, setPhotoReportTarget] = useState(null);

    const handlePhotoReportOpen = useCallback((photoType, photoUrl, photoId) => {
        setPhotoReportTarget({ photoType, photoUrl: photoUrl || '', photoId: photoId || null, ownerId: Number(artist?.owner_user_id || artist?.ownerUserId || 0) });
        setPhotoReportOpen(true);
    }, [artist]);

    const handlePhotoReportSubmit = useCallback(async ({ reason, details }) => {
        if (!photoReportTarget) return;
        try {
            await secureFetch('/api/photos/report', {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason, details, photo_type: photoReportTarget.photoType, photo_url: photoReportTarget.photoUrl, photo_id: photoReportTarget.photoId, owner_user_id: photoReportTarget.ownerId }),
            });
        } catch { /* handled by ReportDialog */ }
        setPhotoReportOpen(false);
        setPhotoReportTarget(null);
    }, [photoReportTarget]);

    // Posts state
    const [posts, setPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const [postsLoadingMore, setPostsLoadingMore] = useState(false);
    const [postsHasMore, setPostsHasMore] = useState(false);
    const [postsTotal, setPostsTotal] = useState(0);
    const [postSortBy, setPostSortBy] = useState("newest");
    const [postDateFrom, setPostDateFrom] = useState("");
    const [postDateTo, setPostDateTo] = useState("");
    const [createPostOpen, setCreatePostOpen] = useState(false);
    const [editPostOpen, setEditPostOpen] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [previewPost, setPreviewPost] = useState(null);
    const openPreviewPost = useCallback((p) => {
        if (!p) { setPreviewPost(null); return; }
        // Enrich with account_type so PostDetailDialog / detail panels
        // know which default avatar icon to use (MusicNote, Storefront, Person)
        const enriched = { ...p };
        if (!enriched.account_type) {
            const cat = String(enriched.category || '').toLowerCase();
            const pType = String(enriched.postType || enriched.post_type || '').toLowerCase();
            if (cat === 'artist_post' || pType === 'artist' || enriched.artist_id || enriched.artistId) {
                enriched.account_type = 'artist';
            } else if (cat === 'business_post' || pType === 'business' || enriched.business_id || enriched.businessId) {
                enriched.account_type = 'business';
            }
        }
        setPreviewPost(enriched);
    }, []);
    const postsLoadMoreRef = useRef(null);

    // Post sub-tab state (Posts | Comments | Likes | Reposts)
    const [postSubTab, setPostSubTab] = useState(0); // 0=Posts, 1=Comments, 2=Likes, 3=Reposts
    const [postEngagementLikes, setPostEngagementLikes] = useState([]);
    const [postEngagementReposts, setPostEngagementReposts] = useState([]);
    const [postEngagementComments, setPostEngagementComments] = useState([]);
    const [postEngagementLoading, setPostEngagementLoading] = useState(false);
    const postEngagementLoadedForRef = useRef(null); // tracks which artistId we loaded for

    // Search state for posts/engagement (matches BusinessEngagementTabs)
    const [localPostSearch, setLocalPostSearch] = useState('');
    const [localPostSearchTerm, setLocalPostSearchTerm] = useState('');

    // Post comment scroll/highlight state (matches BusinessPublicPage)
    const [postScrollToCommentId, setPostScrollToCommentId] = useState(null);
    const [postHighlightCommentId, setPostHighlightCommentId] = useState(null);

    // Photo lightbox for engagement tabs (Likes/Reposts)
    const [engLightboxOpen, setEngLightboxOpen] = useState(false);
    const [engLightboxUrls, setEngLightboxUrls] = useState([]);
    const [engLightboxIdx, setEngLightboxIdx] = useState(0);

    // UserCardPopover state for engagement tabs (Likes/Reposts/Comments)
    const [engUserCardAnchor, setEngUserCardAnchor] = useState(null);
    const [engUserCardUser, setEngUserCardUser] = useState(null);
    const handleEngOpenUserCard = useCallback((el, author) => {
        setEngUserCardAnchor(el);
        setEngUserCardUser({
            id: author?.id || author?.user_id || author?.userId,
            first_name: author?.first_name || author?.name?.split(' ')[0] || author?.artist_name || author?.business_name || '',
            last_name: author?.last_name || author?.name?.split(' ').slice(1).join(' ') || '',
            handle: author?.handle || author?.artist_handle || author?.business_slug || '',
            avatar_url: author?.avatar_url || author?.profile_picture || author?.artist_avatar_url || author?.business_avatar_url || '',
            account_type: author?.account_type || undefined,
            artist_id: author?.artist_id || undefined,
            artist_name: author?.artist_name || undefined,
            artist_handle: author?.artist_handle || undefined,
            artist_avatar_url: author?.artist_avatar_url || undefined,
            business_id: author?.business_id || undefined,
            business_name: author?.business_name || undefined,
            business_slug: author?.business_slug || undefined,
            business_avatar_url: author?.business_avatar_url || undefined,
        });
    }, []);

    // Events state (inlined from ArtistEventsSection for scroll-restore parity with BusinessPublicPage)
    const [artistEvents, setArtistEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [eventFilterRange, setEventFilterRange] = useState("all");
    const [eventSortBy, setEventSortBy] = useState("soonest");
    const [eventDateFrom, setEventDateFrom] = useState('');
    const [eventDateTo, setEventDateTo] = useState('');
    const [isEventsHeaderSticky, setIsEventsHeaderSticky] = useState(false);
    const eventsHeaderRef = useRef(null);

    // Event view mode: "posted" (artist's own events), "going" (RSVP'd), "interested"
    const [eventViewMode, setEventViewMode] = useState("posted");
    const [artistGoingEvents, setArtistGoingEvents] = useState([]);
    const [artistGoingLoading, setArtistGoingLoading] = useState(false);
    const [artistInterestedEvents, setArtistInterestedEvents] = useState([]);
    const [artistInterestedLoading, setArtistInterestedLoading] = useState(false);

    // Event search state (matches BusinessPublicPage EventsSubTabs)
    const [eventSearchQuery, setEventSearchQuery] = useState('');
    const [committedEventSearchQuery, setCommittedEventSearchQuery] = useState('');
    const [showEventFilters, setShowEventFilters] = useState(true); // used by activeTab === -1 events section

    // Event sub-tab state (Events | Comments | Likes | Reposts)
    const [eventSubTab, setEventSubTab] = useState(0); // 0=Events, 1=Comments, 2=Likes, 3=Reposts
    const [eventEngagementEvents, setEventEngagementEvents] = useState([]); // events for likes/reposts sub-tabs
    const [eventEngagementLoading, setEventEngagementLoading] = useState(false);
    const [eventEngagementComments, setEventEngagementComments] = useState([]); // grouped comment entries
    const [eventCommentsLoading, setEventCommentsLoading] = useState(false);

    // Event detail popup state (matches BusinessPublicPage)
    const [selectedEventPopup, setSelectedEventPopup] = useState(null);
    const [eventScrollToCommentId, setEventScrollToCommentId] = useState(null);
    const [eventHighlightCommentId, setEventHighlightCommentId] = useState(null);

    // Quick message state
    const [quickMsgOpen, setQuickMsgOpen] = useState(false);
    const [profileShareOpen, setProfileShareOpen] = useState(false);
    const [artistMenuEl, setArtistMenuEl] = useState(null);
    const [artistReportOpen, setArtistReportOpen] = useState(false);
    const [blockedByMe, setBlockedByMe] = useState(false);
    const [hiddenPostsByMe, setHiddenPostsByMe] = useState(false);
    const [blockBusy, setBlockBusy] = useState(false);
    const [hideBusy, setHideBusy] = useState(false);

    // ── Moderation: blocked / hidden user IDs + entity IDs (for engagement filtering) ──
    const [engBlockedUserIds, setEngBlockedUserIds] = useState(() => new Set());
    const [engBlockedBusinessIds, setEngBlockedBusinessIds] = useState(() => new Set());
    const [engBlockedArtistIds, setEngBlockedArtistIds] = useState(() => new Set());
    const [engViewerFollowingIds, setEngViewerFollowingIds] = useState(() => new Set());
    const [engViewerGroupIds, setEngViewerGroupIds] = useState(() => new Set());
    const [engPrivateGroupIds, setEngPrivateGroupIds] = useState(() => new Set());

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await axios.get('/api/users/moderation-state', { withCredentials: true });
                if (!alive) return;
                const d = res?.data || {};
                const blocked = Array.isArray(d.blocked_user_ids) ? d.blocked_user_ids : [];
                const hiddenUsers = Array.isArray(d.hidden_user_ids) ? d.hidden_user_ids : [];
                const hiddenPosts = Array.isArray(d.hidden_post_user_ids) ? d.hidden_post_user_ids : [];
                const legacyOwners = Array.isArray(d.blocked_owner_ids_legacy) ? d.blocked_owner_ids_legacy : [];
                const combined = new Set();
                for (const id of [...blocked, ...hiddenUsers, ...hiddenPosts, ...legacyOwners]) {
                    combined.add(Number(id)); combined.add(String(id));
                }
                if (alive) setEngBlockedUserIds(combined);

                const bizIds = Array.isArray(d.blocked_business_ids) ? d.blocked_business_ids : [];
                const hiddenBizIds = Array.isArray(d.hidden_post_business_ids) ? d.hidden_post_business_ids : [];
                const bSet = new Set();
                for (const id of [...bizIds, ...hiddenBizIds]) { bSet.add(Number(id)); bSet.add(String(id)); }
                if (alive) setEngBlockedBusinessIds(bSet);

                const artIds = Array.isArray(d.blocked_artist_ids) ? d.blocked_artist_ids : [];
                const hiddenArtIds = Array.isArray(d.hidden_post_artist_ids) ? d.hidden_post_artist_ids : [];
                const aSet = new Set();
                for (const id of [...artIds, ...hiddenArtIds]) { aSet.add(Number(id)); aSet.add(String(id)); }
                if (alive) setEngBlockedArtistIds(aSet);

                const followingArr = Array.isArray(d.viewer_following_ids) ? d.viewer_following_ids : [];
                if (alive && followingArr.length > 0) {
                    setEngViewerFollowingIds(new Set(followingArr.map(Number).filter((n) => n > 0)));
                }
            } catch { /* non-critical */ }
        })();
        return () => { alive = false; };
    }, []);

    // Fetch viewer's group memberships for private group filtering
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await axios.get('/api/groups/my-memberships', { withCredentials: true });
                if (!alive) return;
                const ids = Array.isArray(res?.data?.group_ids) ? res.data.group_ids : [];
                const privIds = Array.isArray(res?.data?.private_group_ids) ? res.data.private_group_ids : [];
                setEngViewerGroupIds(new Set(ids.map(Number)));
                setEngPrivateGroupIds(new Set(privIds.map(Number)));
            } catch { /* non-critical */ }
        })();
        return () => { alive = false; };
    }, []);

    // ── Engagement filtering helper — shared across likes, reposts, comments ──
    const engFilterItem = useCallback((item, isComment = false) => {
        const src = isComment ? (item?.post || item) : item;
        // Blocked/hidden user check
        const authorId = Number(src?.user_id ?? src?.author_id ?? src?.created_by_user_id ?? 0);
        if (authorId && (engBlockedUserIds.has(authorId) || engBlockedUserIds.has(String(authorId)))) return false;
        const bizOwnerId = Number(src?.businessOwnerId ?? src?.business_owner_id ?? src?.owner_id ?? 0);
        if (bizOwnerId && (engBlockedUserIds.has(bizOwnerId) || engBlockedUserIds.has(String(bizOwnerId)))) return false;
        const bizId = Number(src?.business_id ?? src?.businessId ?? src?.businessPageId ?? src?.business_page_id ?? 0);
        if (bizId && (engBlockedBusinessIds.has(bizId) || engBlockedBusinessIds.has(String(bizId)))) return false;
        const artId = Number(src?.artist_id ?? src?.artistId ?? 0);
        if (artId && (engBlockedArtistIds.has(artId) || engBlockedArtistIds.has(String(artId)))) return false;
        // Private group check
        const gid = Number(src?.group_id ?? src?.groupId ?? 0);
        if (gid) {
            const gVis = String(src?.group_visibility ?? src?.groupVisibility ?? '').toLowerCase();
            if (gVis === 'private' || gVis === 'hidden') { if (!engViewerGroupIds.has(gid)) return false; }
            else if (engPrivateGroupIds.has(gid)) { if (!engViewerGroupIds.has(gid)) return false; }
        }
        // Followers-only post check
        if (engViewerFollowingIds.size > 0) {
            const vis = String(src?.visibility || '').toLowerCase().trim();
            if (vis === 'followers' || vis === 'private') {
                const viewerId = Number(user?.id || user?.user?.id || 0);
                if (viewerId && authorId && viewerId === authorId) { /* own post — keep */ }
                else if (authorId && engViewerFollowingIds.has(authorId)) { /* following — keep */ }
                else return false;
            }
        }
        return true;
    }, [engBlockedUserIds, engBlockedBusinessIds, engBlockedArtistIds, engViewerGroupIds, engPrivateGroupIds, engViewerFollowingIds, user]);

    // ── Live block/hide events: immediately remove affected items from engagement arrays ──
    useEffect(() => {
        const handleEngBlockOrHide = (e) => {
            const uid = Number(e?.detail?.userId || 0);
            if (!uid) return;
            const targetType = String(e?.detail?.targetType || '').toLowerCase();
            const isActive = e.type === 'll:user:blocked-changed' ? Boolean(e?.detail?.blocked) : Boolean(e?.detail?.hidden);

            // Update the moderation sets
            if (targetType === 'business') {
                setEngBlockedBusinessIds((prev) => {
                    const next = new Set(prev);
                    if (isActive) { next.add(uid); next.add(String(uid)); }
                    else { next.delete(uid); next.delete(String(uid)); }
                    return next;
                });
            } else if (targetType === 'artist') {
                setEngBlockedArtistIds((prev) => {
                    const next = new Set(prev);
                    if (isActive) { next.add(uid); next.add(String(uid)); }
                    else { next.delete(uid); next.delete(String(uid)); }
                    return next;
                });
            } else {
                setEngBlockedUserIds((prev) => {
                    const next = new Set(prev);
                    if (isActive) { next.add(uid); next.add(String(uid)); }
                    else { next.delete(uid); next.delete(String(uid)); }
                    return next;
                });
            }

            // Immediately filter engagement arrays to remove affected items
            if (isActive) {
                const matchesTarget = (item, isComment = false) => {
                    const src = isComment ? (item?.post || item) : item;
                    if (targetType === 'business') {
                        const bId = Number(src?.business_id ?? src?.businessId ?? src?.businessPageId ?? src?.business_page_id ?? 0);
                        if (bId === uid) return true;
                        const ownerId = Number(src?.businessOwnerId ?? src?.business_owner_id ?? src?.owner_id ?? 0);
                        if (ownerId === uid) return true;
                    } else if (targetType === 'artist') {
                        const aId = Number(src?.artist_id ?? src?.artistId ?? 0);
                        if (aId === uid) return true;
                    } else {
                        const authorId = Number(src?.user_id ?? src?.author_id ?? src?.created_by_user_id ?? 0);
                        if (authorId === uid) return true;
                        const ownerId = Number(src?.businessOwnerId ?? src?.business_owner_id ?? src?.owner_id ?? 0);
                        if (ownerId === uid) return true;
                    }
                    return false;
                };
                setPostEngagementLikes((prev) => prev.filter((p) => !matchesTarget(p)));
                setPostEngagementReposts((prev) => prev.filter((p) => !matchesTarget(p)));
                setPostEngagementComments((prev) => prev.filter((c) => !matchesTarget(c, true)));
            }
        };
        window.addEventListener('ll:user:blocked-changed', handleEngBlockOrHide);
        window.addEventListener('ll:user:hidden-changed', handleEngBlockOrHide);
        return () => {
            window.removeEventListener('ll:user:blocked-changed', handleEngBlockOrHide);
            window.removeEventListener('ll:user:hidden-changed', handleEngBlockOrHide);
        };
    }, []);

    // Jobs & Services state — lightweight check + popup state
    const [artistHasJobs, setArtistHasJobs] = useState(false);
    const [artistHasServices, setArtistHasServices] = useState(false);
    const [selectedJobPopup, setSelectedJobPopup] = useState(null);
    const [selectedServicePopup, setSelectedServicePopup] = useState(null);

    // Lifted jobs filter state (shared between mobile sticky header and ArtistJobsSection)
    const [jobsSort, setJobsSort] = useState('newest');
    const [jobsCategory, setJobsCategory] = useState('');
    const [localJobSearchTerm, setLocalJobSearchTerm] = useState('');
    const [localJobSearch, setLocalJobSearch] = useState('');

    // Lifted services filter state (shared between mobile sticky header and ArtistServicesSection)
    const [servicesView, setServicesView] = useState('offered');
    const [servicesCategory, setServicesCategory] = useState('');
    const [localServiceSearchTerm, setLocalServiceSearchTerm] = useState('');
    const [localServiceSearch, setLocalServiceSearch] = useState('');

    // Job create/edit/delete state
    const [createJobOpen, setCreateJobOpen] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [deleteConfirmJob, setDeleteConfirmJob] = useState(null);
    const [jobsRefreshNonce, setJobsRefreshNonce] = useState(0);

    // Photo comments dialog state (avatar/cover/gallery engagement)
    const [photoCommentsOpen, setPhotoCommentsOpen] = useState(false);
    const [photoCommentsType, setPhotoCommentsType] = useState('avatar'); // 'avatar' | 'cover' | 'gallery'
    const [photoCommentsPhotoId, setPhotoCommentsPhotoId] = useState(null);
    const [photoCommentsPhotoUrl, setPhotoCommentsPhotoUrl] = useState('');
    const [photoCommentsLoading, setPhotoCommentsLoading] = useState(false);
    const [pendingPhotoHighlightId, setPendingPhotoHighlightId] = useState(null);
    const [photoPreviewSrc, setPhotoPreviewSrc] = useState('');

    // Gallery photos fetched from API (with DB record IDs for like/comment support)
    const [artistGalleryPhotos, setArtistGalleryPhotos] = useState([]);
    const [artistGalleryLoaded, setArtistGalleryLoaded] = useState(false);

    // Get state from navigation (for back button)
    const fromMusic = embedded || location.state?.fromMusic || false;
    const musicReturnState = location.state?.musicReturnState || null;

    // Fetch artist data (skip if artistDataProp was provided)
    useEffect(() => {
        // If we already have artist data from prop, don't fetch
        if (artistDataProp) {
            setArtist(artistDataProp);
            setLoading(false);
            return;
        }

        let cancelled = false;

        const fetchArtist = async () => {
            if (!artistHandle) {
                setError("No artist handle provided.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            setRawLoadError(null);

            try {
                const res = await secureFetch(`/api/music/artists/${encodeURIComponent(artistHandle)}`, {
                    credentials: "include",
                    headers: { ...getAccountHeaders() },
                });

                if (!res.ok) {
                    if (res.status === 404) {
                        throw new Error("Artist not found.");
                    }
                    throw new Error("Failed to load artist.");
                }

                const data = await res.json();
                if (!cancelled) {
                    setArtist(data);
                }
            } catch (err) {
                if (!cancelled) {
                    setRawLoadError(err);
                    setError(err.message || "Failed to load artist.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchArtist();

        return () => {
            cancelled = true;
        };
    }, [artistHandle, artistDataProp]);

    // Check if about text overflows
    useEffect(() => {
        if (aboutRef.current) {
            setAboutOverflows(aboutRef.current.scrollHeight > ABOUT_COLLAPSED_HEIGHT);
        }
    }, [artist]);

    // Check if current user can manage this artist
    useEffect(() => {
        if (!artist || !user) {
            setCanManage(false);
            return;
        }

        const userId = user.id || user.user_id;
        if (!userId) {
            setCanManage(false);
            return;
        }

        const artistId = artist.id;
        const artistOwnerUserId = artist.owner_user_id || artist.ownerUserId;

        // If user is the owner, they can manage
        if (artistOwnerUserId && String(artistOwnerUserId) === String(userId)) {
            setCanManage(true);
            return;
        }

        // Otherwise, check team membership via API
        let cancelled = false;

        (async () => {
            try {
                const res = await secureFetch(`/api/music/artists/${artistId}/team`, {
                    credentials: "include",
                    headers: { ...getAccountHeaders() },
                });
                if (!res.ok) {
                    if (!cancelled) setCanManage(false);
                    return;
                }
                const data = await res.json();
                const isMember = Array.isArray(data?.members) && data.members.some(
                    (m) => String(m.userId || m.user_id) === String(userId)
                );
                if (!cancelled) setCanManage(isMember);
            } catch {
                if (!cancelled) setCanManage(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [artist, user]);

    // Scroll restore: fires once after artist data loads (loading goes false).
    // At that point the full page DOM is rendered and tall enough to scroll to.
    const didRestoreScrollRef = useRef(false);
    useEffect(() => {
        if (!_restoreState || _restoreState.scrollY <= 0) return;
        if (loading) return; // still loading — wait
        if (didRestoreScrollRef.current) return; // already restored
        didRestoreScrollRef.current = true;

        const targetY = _restoreState.scrollY;
        // Immediately scroll
        window.scrollTo(0, targetY);

        // Poll to keep scrolling in case late-rendering content (events, photos)
        // grows the page after the initial paint.
        const deadline = Date.now() + 4000;
        const id = setInterval(() => {
            window.scrollTo(0, targetY);
            const cur = window.scrollY || 0;
            if (Math.abs(cur - targetY) < 15 || Date.now() > deadline) {
                clearInterval(id);
            }
        }, 50);
        return () => clearInterval(id);
    }, [_restoreState, loading]);

    // Fetch posts when artist loads or sort changes (initial page)
    useEffect(() => {
        let cancelled = false;
        async function loadPosts() {
            if (!artist?.id) return;
            setPostsLoading(true);
            setPosts([]);
            setPostsHasMore(false);
            setPostsTotal(0);
            try {
                const res = await fetchArtistPosts({
                    artistId: artist.id,
                    sort: postSortBy,
                    limit: 50,
                    offset: 0,
                });
                if (!cancelled) {
                    const items = res?.items || [];
                    const total = Number(res?.total || items.length);
                    setPosts(items);
                    setPostsTotal(total);
                    setPostsHasMore(items.length < total);
                }
            } catch {
                if (!cancelled) {
                    setPosts([]);
                    setPostsTotal(0);
                    setPostsHasMore(false);
                }
            } finally {
                if (!cancelled) setPostsLoading(false);
            }
        }
        loadPosts();
        return () => { cancelled = true; };
    }, [artist?.id, postSortBy]);

    // ── Load post engagement (Comments, Likes, Reposts sub-tabs) ──
    useEffect(() => {
        const aId = artist?.id;
        const oId = artist?.owner_user_id || artist?.ownerUserId;
        if (!aId || !oId || postSubTab === 0) return;

        // Skip if we already loaded for this exact artist
        if (postEngagementLoadedForRef.current === aId) return;

        let alive = true;
        const controller = new AbortController();

        (async () => {
            setPostEngagementLoading(true);
            // Clear stale data immediately
            setPostEngagementLikes([]);
            setPostEngagementReposts([]);
            setPostEngagementComments([]);
            try {
                const acctHeaders = (() => { try { return getAccountHeaders(); } catch { return {}; } })();
                const res = await axios.get(`/api/users/${oId}/engagement/posts`, {
                    params: { types: 'likes,reposts,comments', limit: 500 },
                    withCredentials: true,
                    signal: controller.signal,
                    headers: { ...acctHeaders },
                });
                if (!alive) return;
                const data = res?.data || {};

                // Normalize likes/reposts and force the viewer flags
                // (if a post is on the Likes tab, the viewer liked it; same for Reposts)
                const mapN = (arr) => (Array.isArray(arr) ? arr : []).map(normalizeEngagementPost).filter(Boolean);
                const normalizedLikes = mapN(data?.likes).map((p) => ({
                    ...p,
                    viewerLiked: true,
                    viewer_liked: true,
                }));
                const normalizedReposts = mapN(data?.reposts).map((p) => ({
                    ...p,
                    viewerReposted: true,
                    viewer_reposted: true,
                }));

                setPostEngagementLikes(normalizedLikes);
                setPostEngagementReposts(normalizedReposts);
                setPostEngagementComments(Array.isArray(data?.comments) ? data.comments : []);
                postEngagementLoadedForRef.current = aId;

                // ── Hydrate fresh counts in the background (non-blocking) ──
                // Only hydrate community posts — artist and business posts already
                // return correct counts from the activity endpoints.
                const communityPosts = [...normalizedLikes, ...normalizedReposts].filter(
                    (p) => p && p.id && String(p.category || '').toLowerCase() !== 'business_post' && String(p.category || '').toLowerCase() !== 'artist_post' && String(p.postType || '').toLowerCase() !== 'business' && String(p.postType || '').toLowerCase() !== 'artist'
                );
                const postIdsToHydrate = [...new Set(communityPosts.map((p) => p.id))];
                if (postIdsToHydrate.length > 0) {
                    setTimeout(() => {
                        if (!alive) return;
                        (async () => {
                            try {
                                const BATCH = 10;
                                const freshMap = {};
                                for (let i = 0; i < postIdsToHydrate.length; i += BATCH) {
                                    if (!alive) return;
                                    const batch = postIdsToHydrate.slice(i, i + BATCH);
                                    const hydrateQp = new URLSearchParams();
                                    if (aId) hydrateQp.set('activeArtistId', aId);
                                    const hydrateQs = hydrateQp.toString() ? `?${hydrateQp.toString()}` : '';
                                    const hydrateHeaders = (() => { try { return getAccountHeaders(); } catch { return {}; } })();

                                    await Promise.allSettled(
                                        batch.map((id) =>
                                            secureFetch(`/api/community/${encodeURIComponent(id)}${hydrateQs}`, {
                                                credentials: 'include',
                                                headers: { ...hydrateHeaders },
                                            })
                                                .then((r) => (r.ok ? r.json() : null))
                                                .then((d) => {
                                                    const row = Array.isArray(d) ? d[0] : d;
                                                    if (row && row.id) freshMap[String(row.id)] = row;
                                                })
                                                .catch(() => {})
                                        )
                                    );
                                }
                                if (!alive || Object.keys(freshMap).length === 0) return;

                                const mergeCounts = (posts) =>
                                    posts.map((p) => {
                                        const fresh = freshMap[String(p?.id)];
                                        if (!fresh) return p;
                                        return {
                                            ...p,
                                            likesCount: Number(fresh.likesCount ?? fresh.likes_count ?? fresh.like_count ?? fresh.likes ?? p.likesCount ?? 0),
                                            likes_count: Number(fresh.likes_count ?? fresh.likesCount ?? fresh.like_count ?? fresh.likes ?? p.likes_count ?? 0),
                                            commentsCount: Number(fresh.commentsCount ?? fresh.comments_count ?? fresh.comment_count ?? fresh.comments ?? p.commentsCount ?? 0),
                                            comments_count: Number(fresh.comments_count ?? fresh.commentsCount ?? fresh.comment_count ?? fresh.comments ?? p.comments_count ?? 0),
                                            repostsCount: Number(fresh.repostsCount ?? fresh.reposts_count ?? fresh.repost_count ?? fresh.reposts ?? p.repostsCount ?? 0),
                                            reposts_count: Number(fresh.reposts_count ?? fresh.repostsCount ?? fresh.repost_count ?? fresh.reposts ?? p.reposts_count ?? 0),
                                            viewerLiked: fresh.viewerLiked ?? fresh.viewer_liked ?? fresh.liked ?? fresh.is_liked ?? p.viewerLiked,
                                            viewer_liked: fresh.viewer_liked ?? fresh.viewerLiked ?? fresh.liked ?? fresh.is_liked ?? p.viewer_liked,
                                            viewerReposted: fresh.viewerReposted ?? fresh.viewer_reposted ?? fresh.reposted ?? fresh.is_reposted ?? p.viewerReposted,
                                            viewer_reposted: fresh.viewer_reposted ?? fresh.viewerReposted ?? fresh.reposted ?? fresh.is_reposted ?? p.viewer_reposted,
                                            first_name: p.first_name || fresh.first_name,
                                            last_name: p.last_name || fresh.last_name,
                                            handle: p.handle || fresh.handle,
                                            avatar_url: p.avatar_url || fresh.avatar_url,
                                            profile_picture: p.profile_picture || fresh.profile_picture,
                                            business_name: p.business_name || fresh.business_name || fresh.businessName,
                                            business_slug: p.business_slug || fresh.business_slug || fresh.businessSlug,
                                            business_avatar_url: p.business_avatar_url || fresh.business_avatar_url || fresh.businessAvatarUrl,
                                            artist_name: p.artist_name || fresh.artist_name || fresh.artistName,
                                            artist_handle: p.artist_handle || fresh.artist_handle || fresh.artistHandle,
                                            artist_avatar_url: p.artist_avatar_url || fresh.artist_avatar_url || fresh.artistAvatarUrl,
                                            account_type: p.account_type || fresh.account_type,
                                            account_name: p.account_name || fresh.account_name,
                                        };
                                    });

                                setPostEngagementLikes((prev) => mergeCounts(prev));
                                setPostEngagementReposts((prev) => mergeCounts(prev));
                            } catch { /* best-effort */ }
                        })();
                    }, 100);
                }
            } catch {
                if (alive) {
                    setPostEngagementLikes([]);
                    setPostEngagementReposts([]);
                    setPostEngagementComments([]);
                }
            } finally {
                if (alive) setPostEngagementLoading(false);
            }
        })();

        return () => { alive = false; controller.abort(); };
    }, [artist?.id, artist?.owner_user_id, artist?.ownerUserId, postSubTab, accountCacheKey]);

    // ── Load artist events (inlined – matches business profile pattern) ──
    const ownerUserId = artist?.owner_user_id || artist?.ownerUserId;
    useEffect(() => {
        const aId = artist?.id;
        const oId = ownerUserId;
        if (!aId) { setEventsLoading(false); return; }
        let cancelled = false;
        (async () => {
            setEventsLoading(true);
            try {
                const params = {
                    sort: "soonest",
                    range: "all",
                    limit: 50,
                    includeTotal: 1,
                    artistAccountId: aId,
                };
                // Also pass organizerUserId so backend scopes to events
                // created by this user under this artist account
                if (oId) params.organizerUserId = oId;
                const data = await fetchEvents(params);
                const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
                if (!cancelled) setArtistEvents(items);
            } catch {
                if (!cancelled) setArtistEvents([]);
            } finally {
                if (!cancelled) setEventsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [artist?.id, accountCacheKey]);

    // ── Load events this artist is Going to (RSVP) ──
    useEffect(() => {
        const aId = artist?.id;
        if (!aId || eventViewMode !== 'going') return;
        let cancelled = false;
        (async () => {
            setArtistGoingLoading(true);
            try {
                const data = await fetchEvents({
                    sort: 'soonest',
                    range: 'all',
                    limit: 50,
                    includeStatewide: 1,
                    engagementArtistId: aId,
                    engagementType: 'rsvp',
                });
                const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
                if (!cancelled) setArtistGoingEvents(items);
            } catch {
                if (!cancelled) setArtistGoingEvents([]);
            } finally {
                if (!cancelled) setArtistGoingLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [artist?.id, eventViewMode, accountCacheKey]);

    // ── Load events this artist is Interested in ──
    useEffect(() => {
        const aId = artist?.id;
        if (!aId || eventViewMode !== 'interested') return;
        let cancelled = false;
        (async () => {
            setArtistInterestedLoading(true);
            try {
                const data = await fetchEvents({
                    sort: 'soonest',
                    range: 'all',
                    limit: 50,
                    includeStatewide: 1,
                    engagementArtistId: aId,
                    engagementType: 'interested',
                });
                const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
                if (!cancelled) setArtistInterestedEvents(items);
            } catch {
                if (!cancelled) setArtistInterestedEvents([]);
            } finally {
                if (!cancelled) setArtistInterestedLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [artist?.id, eventViewMode, accountCacheKey]);

    // ── Load events for Likes / Reposts sub-tabs (engagement by this artist) ──
    useEffect(() => {
        const aId = artist?.id;
        if (!aId || (eventSubTab !== 2 && eventSubTab !== 3)) return;
        let cancelled = false;
        const controller = new AbortController();

        (async () => {
            setEventEngagementLoading(true);
            try {
                const engagementType = eventSubTab === 2 ? 'like' : 'repost';
                const data = await fetchEvents({
                    sort: 'recent',
                    range: 'custom',
                    limit: 50,
                    includeStatewide: 1,
                    engagementArtistId: aId,
                    engagementType,
                });
                const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
                if (!cancelled) setEventEngagementEvents(items);
            } catch {
                if (!cancelled) setEventEngagementEvents([]);
            } finally {
                if (!cancelled) setEventEngagementLoading(false);
            }
        })();
        return () => { cancelled = true; controller.abort(); };
    }, [artist?.id, eventSubTab, accountCacheKey]);

    // ── Load artist event comments (Comments sub-tab) ──
    useEffect(() => {
        const aId = artist?.id;
        if (!aId || eventSubTab !== 1) return;
        let alive = true;
        const controller = new AbortController();

        (async () => {
            setEventCommentsLoading(true);
            try {
                const res = await axios.get(`/api/events/artist/${aId}/event-comments`, {
                    signal: controller.signal,
                    withCredentials: true,
                });
                if (!alive) return;
                const data = res.data;
                setEventEngagementComments(Array.isArray(data?.comments) ? data.comments : []);
            } catch {
                if (alive) setEventEngagementComments([]);
            } finally {
                if (alive) setEventCommentsLoading(false);
            }
        })();

        return () => { alive = false; controller.abort(); };
    }, [artist?.id, eventSubTab]);

    // ── Check if artist has jobs ──────────────────────────────────────────
    useEffect(() => {
        if (!artist?.id) return;
        let alive = true;
        const ctrl = new AbortController();
        (async () => {
            try {
                const hdrs = getAccountHeaders() || {};
                const res = await axios.get('/api/jobs/feed', {
                    params: { posterArtistId: artist.id, limit: 1 },
                    signal: ctrl.signal, withCredentials: true, headers: { ...hdrs },
                });
                if (!alive) return;
                const items = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
                setArtistHasJobs(items.length > 0);
            } catch { if (alive) setArtistHasJobs(false); }
        })();
        return () => { alive = false; ctrl.abort(); };
    }, [artist?.id]);

    // ── Check if artist has services ──────────────────────────────────────
    useEffect(() => {
        if (!artist?.id) return;
        let alive = true;
        const ctrl = new AbortController();
        (async () => {
            try {
                const hdrs = getAccountHeaders() || {};
                const res = await axios.get('/api/services/feed', {
                    params: { posterArtistId: artist.id, limit: 1 },
                    signal: ctrl.signal, withCredentials: true, headers: { ...hdrs },
                });
                if (!alive) return;
                const items = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
                setArtistHasServices(items.length > 0);
            } catch { if (alive) setArtistHasServices(false); }
        })();
        return () => { alive = false; ctrl.abort(); };
    }, [artist?.id]);

    // Sticky detection for events header (events tab removed from main tabs)
    useEffect(() => {
        if (activeTab !== -1) {
            setIsEventsHeaderSticky(false);
            return;
        }
        const handleScroll = () => {
            if (eventsHeaderRef.current) {
                const rect = eventsHeaderRef.current.getBoundingClientRect();
                setIsEventsHeaderSticky(rect.top <= 1);
            }
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [activeTab]);

    // ── Sticky sidebar (matching BusinessPublicPage — smooth, theme-aware) ──────────
    useEffect(() => {
        if (activeTab !== 0 || isMobile) return;

        const calculateStickyTop = () => {
            if (sidebarContentRef.current) {
                const sidebarHeight = sidebarContentRef.current.getBoundingClientRect().height;
                const viewportHeight = window.innerHeight;
                const padding = 16;

                if (sidebarHeight + padding * 2 <= viewportHeight) {
                    // Sidebar fits in viewport — just pin to top
                    setSidebarStickyTop(padding);
                } else {
                    // Sidebar taller than viewport — use negative top so it sticks
                    // when the bottom of sidebar aligns with viewport bottom
                    setSidebarStickyTop(viewportHeight - sidebarHeight - padding);
                }
            }
        };

        const handleScroll = () => {
            if (postsHeaderRef.current) {
                const rect = postsHeaderRef.current.getBoundingClientRect();
                setIsHeaderSticky(rect.top <= 1);
            }

            calculateStickyTop();
        };

        // Use ResizeObserver to recalculate when sidebar content changes size
        let resizeObserver = null;
        if (sidebarContentRef.current && typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(() => {
                calculateStickyTop();
            });
            resizeObserver.observe(sidebarContentRef.current);
        }

        // Initial calculation after layout settles
        const raf = requestAnimationFrame(() => {
            calculateStickyTop();
            handleScroll();
        });

        // Also recalculate after a short delay to catch late-loading content
        const delayTimer = setTimeout(() => {
            calculateStickyTop();
            handleScroll();
        }, 300);

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', calculateStickyTop, { passive: true });
        return () => {
            cancelAnimationFrame(raf);
            clearTimeout(delayTimer);
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', calculateStickyTop);
            if (resizeObserver) resizeObserver.disconnect();
        };
    }, [activeTab, isMobile]);

    // Hydrate follow state + counts — re-check on artist change or account switch
    useEffect(() => {
        if (!artist?.id || !user) {
            setIsFollowing(false);
            setFollowCounts({ followers: 0, following: 0 });
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const hdrs = typeof getAcctHdrsRef.current === 'function' ? getAcctHdrsRef.current() : {};
                const [{ isFollowing: f }, counts] = await Promise.all([
                    fetchArtistFollowStatePP(artist, hdrs),
                    fetchArtistFollowCountsPP(artist.id, user?.public_id || user?.id || user?.handle, hdrs),
                ]);
                if (!cancelled) {
                    setIsFollowing(f);
                    setFollowCounts(counts);
                }
            } catch {
                if (!cancelled) {
                    setIsFollowing(false);
                    setFollowCounts({ followers: 0, following: 0 });
                }
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [artist?.id, user?.id, accountCacheKey]);

    // Listen for follow changes from cards, detail panel, etc.
    useEffect(() => {
        const aid = artist?.id;
        if (!aid) return;
        const handler = (e) => {
            const { artistId: evtId, isFollowing: nowFollowing } = e.detail || {};
            if (evtId && Number(evtId) === Number(aid)) {
                setIsFollowing(Boolean(nowFollowing));
                const hdrs = typeof getAcctHdrsRef.current === 'function' ? getAcctHdrsRef.current() : {};
                fetchArtistFollowCountsPP(aid, user?.public_id || user?.id || user?.handle, hdrs).then((c) => setFollowCounts(c)).catch(() => {});
            }
        };
        window.addEventListener("ll:artist:follow-changed", handler);
        return () => window.removeEventListener("ll:artist:follow-changed", handler);
    }, [artist?.id]);

    const handleFollowClick = useCallback(async () => {
        if (!artist || followBusy) return;
        if (!user || !(user.id || user.user_id || user.handle)) {
            try {
                const authCtx = auth || {};
                if (typeof authCtx.open === 'function') authCtx.open();
                else if (typeof authCtx.openLoginPopup === 'function') authCtx.openLoginPopup();
                else if (typeof authCtx.openLoginModal === 'function') authCtx.openLoginModal();
                else if (typeof authCtx.openLogin === 'function') authCtx.openLogin();
            } catch { /* ignore */ }
            try {
                window.dispatchEvent(new CustomEvent('open-auth-modal'));
                window.dispatchEvent(new CustomEvent('open-login'));
                window.dispatchEvent(new CustomEvent('open-auth-dialog'));
                window.dispatchEvent(new CustomEvent('open-login-popup'));
            } catch { /* ignore */ }
            return;
        }
        setFollowBusy(true);
        const prev = isFollowing;
        setIsFollowing(!prev);
        setFollowCounts((c) => ({ ...c, followers: Math.max(0, c.followers + (prev ? -1 : 1)) }));
        try {
            const hdrs = typeof getAcctHdrsRef.current === 'function' ? getAcctHdrsRef.current() : {};
            const payload = typeof getAcctPayloadRef.current === 'function' ? getAcctPayloadRef.current() : {};
            const result = await callArtistFollowApiPP(artist, prev, hdrs, payload);
            const nowFollowing = Boolean(result?.following ?? result?.isFollowing);
            setIsFollowing(nowFollowing);
            fetchArtistFollowCountsPP(artist.id, user?.public_id || user?.id || user?.handle, hdrs).then((c) => setFollowCounts(c)).catch(() => {});
            setFollowsRefreshNonce((n) => n + 1);
            window.dispatchEvent(new CustomEvent("ll:artist:follow-changed", {
                detail: { artistId: artist.id, isFollowing: nowFollowing, source: "profilePage" },
            }));
        } catch {
            setIsFollowing(prev);
            setFollowCounts((c) => ({ ...c, followers: Math.max(0, c.followers + (prev ? 1 : -1)) }));
        } finally {
            setFollowBusy(false);
        }
    }, [artist, user, followBusy, isFollowing, auth]);

    const artistMenuOpen = Boolean(artistMenuEl);
    // Only hide report when the active account IS this artist (matches BusinessDirectoryCard pattern)
    const isActiveArtistAccount = (() => {
        if (!activeAccount || !artist) return false;
        const artistId = String(artist.id || '');
        const candidateIds = [
            activeAccount.id, activeAccount.artist_id, activeAccount.artistId,
            activeAccount.profile_id, activeAccount.profileId,
        ].filter(Boolean).map(String);
        if (artistId && candidateIds.includes(artistId)) return true;
        const artistHandleLower = String(artist.handle || '').toLowerCase();
        const candidateHandles = [
            activeAccount.handle, activeAccount.artist_handle, activeAccount.artistHandle,
        ].filter(Boolean).map((h) => String(h).toLowerCase());
        if (artistHandleLower && candidateHandles.includes(artistHandleLower)) return true;
        return false;
    })();
    const canReportArtist = Boolean(artist?.id) && !isActiveArtistAccount;

    const handleArtistCopyLink = useCallback(() => {
        setArtistMenuEl(null);
        const slugOrHandle = String(artist?.handle || artist?.id || "").trim();
        if (!slugOrHandle) return;
        const url = `${window.location.origin}/${slugOrHandle}`;
        navigator.clipboard.writeText(url).then(() => showSuccess("Link copied to clipboard")).catch(() => showSuccess("Link copied to clipboard"));
    }, [artist?.handle, artist?.id, showSuccess]);

    const handleArtistReportClick = useCallback(() => {
        setArtistMenuEl(null);
        setArtistReportOpen(true);
    }, []);

    const submitArtistReport = useCallback(async ({ reason, details }) => {
        const artistId = artist?.id;
        if (!artistId) return;
        try {
            await secureFetch(`/api/music/artists/${encodeURIComponent(artistId)}/report`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json", ...getAccountHeaders() },
                body: JSON.stringify({ reason, details }),
            });
        } catch {
            // silent
        }
    }, [artist?.id]);

    const handleBlockArtist = useCallback(async () => {
        const artId = Number(artist?.id || 0);
        if (!artId || blockBusy || hideBusy) return;
        setArtistMenuEl(null);
        setBlockBusy(true);
        try {
            const hdrs = { 'Content-Type': 'application/json', ...getAccountHeaders() };
            const res = await secureFetch('/api/users/block', { method: 'POST', credentials: 'include', headers: hdrs, body: JSON.stringify({ target_id: artId, target_type: 'artist', action: 'block' }) });
            if (res.ok) {
                try { window.dispatchEvent(new CustomEvent('ll:user:blocked-changed', { detail: { userId: artId, targetType: 'artist', blocked: true } })); } catch { /* */ }
                setBlockedByMe(true);
                setHiddenPostsByMe(true);
            }
        } catch { /* */ } finally { setBlockBusy(false); }
    }, [artist?.id, blockBusy, hideBusy]);

    const handleUnblockArtist = useCallback(async () => {
        const artId = Number(artist?.id || 0);
        if (!artId) return;
        try {
            const hdrs = { 'Content-Type': 'application/json', ...getAccountHeaders() };
            await secureFetch('/api/users/block', { method: 'POST', credentials: 'include', headers: hdrs, body: JSON.stringify({ target_id: artId, target_type: 'artist', action: 'unblock' }) });
            try { window.dispatchEvent(new CustomEvent('ll:user:blocked-changed', { detail: { userId: artId, targetType: 'artist', blocked: false } })); } catch { /* */ }
            setBlockedByMe(false);
            window.location.reload();
        } catch { /* */ }
    }, [artist?.id]);

    const handleHideArtist = useCallback(async () => {
        const artId = Number(artist?.id || 0);
        if (!artId || blockBusy || hideBusy) return;
        setArtistMenuEl(null);
        setHideBusy(true);
        try {
            const hdrs = { 'Content-Type': 'application/json', ...getAccountHeaders() };
            const res = await secureFetch('/api/users/hide', { method: 'POST', credentials: 'include', headers: hdrs, body: JSON.stringify({ target_id: artId, target_type: 'artist', action: 'hide' }) });
            if (res.ok) {
                try { window.dispatchEvent(new CustomEvent('ll:user:hidden-changed', { detail: { userId: artId, targetType: 'artist', hidden: true } })); } catch { /* */ }
                setHiddenPostsByMe(true);
            }
        } catch { /* */ } finally { setHideBusy(false); }
    }, [artist?.id, blockBusy, hideBusy]);

    const handleUnhideArtist = useCallback(async () => {
        const artId = Number(artist?.id || 0);
        if (!artId) return;
        try {
            const hdrs = { 'Content-Type': 'application/json', ...getAccountHeaders() };
            await secureFetch('/api/users/hide', { method: 'POST', credentials: 'include', headers: hdrs, body: JSON.stringify({ target_id: artId, target_type: 'artist', action: 'unhide' }) });
            try { window.dispatchEvent(new CustomEvent('ll:user:hidden-changed', { detail: { userId: artId, targetType: 'artist', hidden: false } })); } catch { /* */ }
            setHiddenPostsByMe(false);
        } catch { /* */ }
    }, [artist?.id]);

    // Load more posts (infinite scroll) — use ref to avoid stale closures in observer
    const loadMoreRef = useRef(null);
    loadMoreRef.current = async () => {
        if (!artist?.id || postsLoadingMore || !postsHasMore) return;
        setPostsLoadingMore(true);
        try {
            const currentLen = posts.length;
            const res = await fetchArtistPosts({
                artistId: artist.id,
                sort: postSortBy,
                limit: 50,
                offset: currentLen,
            });
            const items = res?.items || [];
            const total = Number(res?.total || 0);
            setPosts((prev) => [...prev, ...items]);
            setPostsTotal(total);
            setPostsHasMore(currentLen + items.length < total);
        } catch {
            // silent
        } finally {
            setPostsLoadingMore(false);
        }
    };

    // IntersectionObserver for infinite scroll sentinel
    useEffect(() => {
        const sentinel = postsLoadMoreRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    loadMoreRef.current?.();
                }
            },
            { rootMargin: '200px' }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [postsHasMore, postsLoadingMore, postsLoading]);

    const handlePostCreated = async () => {
        if (!artist?.id) return;
        try {
            const res = await fetchArtistPosts({ artistId: artist.id, sort: postSortBy, limit: 50, offset: 0 });
            const items = res?.items || [];
            const total = Number(res?.total || items.length);
            setPosts(items);
            setPostsTotal(total);
            setPostsHasMore(items.length < total);
        } catch {
            // Ignore
        }
    };

    const handlePinPost = async (postId) => {
        if (!artist?.id) return;
        await pinArtistPost(artist.id, postId);
        await handlePostCreated();
        showSuccess('Post pinned');
    };

    const handleUnpinPost = async (postId) => {
        if (!artist?.id) return;
        await unpinArtistPost(artist.id, postId);
        await handlePostCreated();
        showSuccess('Post unpinned');
    };

    const handleDeletePost = async (postId) => {
        if (!artist?.id) return;
        try {
            await deleteArtistPost(artist.id, postId);
            await handlePostCreated();
            showSuccess('Post deleted successfully');
        } catch (err) {
            console.error('[Delete post]', err);
        }
    };

    const handleEditPost = (post) => {
        setEditingPost(post);
        setEditPostOpen(true);
    };

    const handleOpenLightbox = (photoIdOrIndex, photoUrl, index) => {
        // When called from PhotoGallery: (photoId, photoUrl, index) — photoId may be null or a DB id
        // When called from engagement tabs: (index) — only one arg, no photoUrl
        // If we have a non-null photoId AND a photoUrl string, it's a gallery photo with DB support
        if (photoIdOrIndex != null && photoUrl && typeof photoUrl === 'string') {
            openGalleryPhotoComments(photoIdOrIndex, photoUrl);
            return;
        }
        // Fallback to lightbox for photos without DB IDs or plain index calls
        const idx = typeof index === 'number' ? index : (typeof photoIdOrIndex === 'number' ? photoIdOrIndex : 0);
        setLightboxIndex(idx);
        setLightboxOpen(true);
    };

    const handleCloseLightbox = () => {
        setLightboxOpen(false);
    };

    const handleNavigateLightbox = (index) => {
        setLightboxIndex(index);
    };

    // Navigate to event detail (optionally scrolling to a comment)
    const openArtistEventComment = useCallback((commentItem, eventObj) => {
        if (!eventObj?.id) return;
        const viewOnly = Boolean(commentItem?._viewEventOnly);
        const commentId = viewOnly ? null : (Number(commentItem?.comment_id || commentItem?.id || 0) || null);
        setEventScrollToCommentId(commentId);
        setEventHighlightCommentId(commentId);
        setSelectedEventPopup(eventObj);
    }, []);

    const openArtistPhotoComments = useCallback(async (kind) => {
        const aId = artist?.id;
        if (!aId) return;
        const aUrl = kind === 'cover'
            ? (artist?.cover_url || artist?.coverUrl || '')
            : (artist?.avatar_url || artist?.avatarUrl || '');
        if (!aUrl) return;
        // Don't open for default/placeholder avatars
        if (kind === 'avatar' && (aUrl.includes('default_avatar') || aUrl.includes('default_artist'))) return;
        setPhotoCommentsLoading(true);
        try {
            const r = await axios.get(`/api/music/artists/${aId}/photos/special/${kind}`, { withCredentials: true });
            const photo = r.data?.photo;
            if (photo?.id) {
                setPhotoCommentsType(kind === 'cover' ? 'cover' : 'avatar');
                setPhotoCommentsPhotoId(photo.id);
                setPhotoCommentsPhotoUrl(photo.url || aUrl);
                setPhotoCommentsOpen(true);
            }
        } catch {
            // silently fail
        } finally {
            setPhotoCommentsLoading(false);
        }
    }, [artist]);

    const openGalleryPhotoComments = useCallback((photoId, photoUrl) => {
        if (!photoId) return;
        setPhotoCommentsType('gallery');
        setPhotoCommentsPhotoId(photoId);
        setPhotoCommentsPhotoUrl(photoUrl || '');
        setPhotoCommentsOpen(true);
    }, []);

    // Fetch artist gallery photos from API (with DB record IDs for like/comment support)
    useEffect(() => {
        const aId = artist?.id;
        if (!aId) return;
        let alive = true;
        (async () => {
            try {
                const r = await axios.get(`/api/music/artists/${aId}/photos`, { withCredentials: true });
                const items = Array.isArray(r.data?.photos) ? r.data.photos : [];
                if (alive) {
                    setArtistGalleryPhotos(items);
                    setArtistGalleryLoaded(true);
                }
            } catch {
                if (alive) setArtistGalleryLoaded(true);
            }
        })();
        return () => { alive = false; };
    }, [artist?.id]);

    // Auto-open photo comments dialog when arriving from a notification
    const [pendingArtistPhotoNotif, setPendingArtistPhotoNotif] = useState(null);

    // Step 1: Capture notification state from location
    useEffect(() => {
        const st = location?.state || {};
        if (!st.llOpenPhotoComments || !artist?.id) return;
        const nextId = st.llPhotoCommentId ? String(st.llPhotoCommentId) : null;
        setPendingPhotoHighlightId(nextId);
        const pType = String(st.llPhotoType || 'avatar').toLowerCase();

        if (pType === 'cover') {
            openArtistPhotoComments('cover');
            navigate(location.pathname, { replace: true, state: null });
        } else if (pType === 'gallery' && st.llPhotoId) {
            // Store pending — will be resolved once gallery photos are loaded
            setPendingArtistPhotoNotif({
                galleryPhotoId: Number(st.llPhotoId) || null,
                galleryPhotoUrl: st.llPhotoUrl || null,
            });
            navigate(location.pathname, { replace: true, state: null });
        } else {
            openArtistPhotoComments('avatar');
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location, navigate, artist?.id, openArtistPhotoComments, openGalleryPhotoComments]);

    // Step 2: Once gallery photos are loaded and we have a pending notification, open the dialog
    useEffect(() => {
        if (!pendingArtistPhotoNotif) return;
        if (!artistGalleryLoaded) return; // wait for gallery photos to finish loading

        const { galleryPhotoId, galleryPhotoUrl } = pendingArtistPhotoNotif;

        // Resolve the photo URL: prefer notification data, fall back to loaded gallery photos
        let resolvedUrl = galleryPhotoUrl || null;
        if (!resolvedUrl && artistGalleryPhotos.length > 0) {
            const match = artistGalleryPhotos.find((p) => Number(p.id) === Number(galleryPhotoId));
            if (match) resolvedUrl = match.url || null;
        }

        openGalleryPhotoComments(galleryPhotoId, resolvedUrl);
        setPendingArtistPhotoNotif(null);
    }, [pendingArtistPhotoNotif, artistGalleryLoaded, artistGalleryPhotos, openGalleryPhotoComments]);

    // ---- Loading State ----
    // When restoring from a subpage (event/post), skip the loading skeleton.
    // Showing the skeleton and then swapping to the full page causes a DOM tree
    // change that resets window scroll to 0.  Instead, show a tall empty container
    // that preserves scroll position while data loads in the background.
    if (loading && !_restoreState) {
        return (
            <Box sx={{ bgcolor: { xs: "background.paper", md: "background.default" }, minHeight: { xs: `calc(100vh - ${chromeTop}px)`, md: "100vh" }, pt: { xs: `${chromeTop}px`, md: 0 }, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PulsingDots />
            </Box>
        );
    }

    // ---- Error State ----
    if ((error || !artist) && !loading) {
        if (isNetworkError(rawLoadError)) {
            return (
                <Box sx={{ bgcolor: { xs: "background.paper", md: "background.default" }, minHeight: { xs: `calc(100vh - ${chromeTop}px)`, md: "100vh" }, pt: { xs: `${chromeTop}px`, md: 0 }, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <NetworkErrorState onRetry={() => window.location.reload()} />
                </Box>
            );
        }
        return (
            <Container maxWidth="md" sx={{ py: 8 }}>
                {fromMusic && !embedded && (
                    <Button
                        startIcon={<ArrowBackRoundedIcon />}
                        onClick={() => navigate("/music", {
                            state: {
                                restoreArtists: true,
                                selectedArtistHandle: artistHandle,
                                ...(musicReturnState || {}),
                            },
                        })}
                        sx={{
                            textTransform: "none",
                            fontWeight: 700,
                            mb: 1.5,
                            color: "text.secondary",
                            "&:hover": { color: "primary.main", bgcolor: "action.hover" },
                        }}
                    >
                        Back to Artists
                    </Button>
                )}
                <Alert
                    severity="error"
                    action={
                        <Button color="inherit" size="small" onClick={() => navigate(-1)}>Go Back</Button>
                    }
                >
                    {error || "Artist not found."}
                </Alert>
            </Container>
        );
    }

    // ---- Restoring but still loading: render a tall invisible placeholder ----
    // This prevents a DOM structure swap (skeleton→full page) that resets scroll to 0.
    // The placeholder is tall enough to hold the saved scroll position while data loads.
    if (loading && _restoreState) {
        return (
            <Box sx={{ bgcolor: "background.default", minHeight: Math.max(2000, (_restoreState.scrollY || 0) + window.innerHeight + 200) }} />
        );
    }

    // ---- Parse and normalize artist data ----
    const safeArtist = artist || {};
    const name = safeArtist.name || "Unknown Artist";
    const displayHandle = safeArtist.handle || "";
    const city = safeArtist.city || "";
    const countyRaw = safeArtist.county || "";
    const isStatewide = Boolean(safeArtist.is_statewide || safeArtist.isStatewide);
    const isVerified = Boolean(safeArtist.is_verified || safeArtist.isVerified);

    // Check if the user is currently logged into this artist's profile.
    // The activeAccount object stored by the Header may carry the artist ID in
    // several possible fields (id, artist_id, artistId, profile_id, profileId)
    // and/or the handle.  We match on any of them against the current artist.
    const isOnArtistProfile = (() => {
        if (!canManage || !activeAccount || !artist) return false;

        const artistId = String(artist.id || '');
        const artistHandleLower = String(artist.handle || '').toLowerCase();

        // Try matching the active account's various ID fields against the artist ID
        const candidateIds = [
            activeAccount.id,
            activeAccount.artist_id,
            activeAccount.artistId,
            activeAccount.profile_id,
            activeAccount.profileId,
            activeAccount.business_id,
            activeAccount.businessId,
        ].filter(Boolean).map(String);

        if (artistId && candidateIds.includes(artistId)) return true;

        // Fallback: match on handle
        const candidateHandles = [
            activeAccount.handle,
            activeAccount.artist_handle,
            activeAccount.artistHandle,
            activeAccount.username,
        ].filter(Boolean).map((h) => String(h).toLowerCase());

        if (artistHandleLower && candidateHandles.includes(artistHandleLower)) return true;

        // Fallback: match on name (case-insensitive)
        const artistNameLower = String(artist.name || '').toLowerCase().trim();
        const acctNameLower = String(activeAccount.name || activeAccount.display_name || activeAccount.displayName || '').toLowerCase().trim();
        if (artistNameLower && acctNameLower && artistNameLower === acctNameLower) return true;

        return false;
    })();

    // ── Artist settings (from settings_json column in music_artists) ──
    // Default to true (enabled) when the setting doesn't exist for backward compatibility.
    const artistSettings = (() => {
        const raw = artist?.settings_json || artist?.settingsJson || artist?.settings;
        if (!raw) return {};
        if (typeof raw === 'string') {
            try { return JSON.parse(raw); } catch { return {}; }
        }
        if (typeof raw === 'object') return raw;
        return {};
    })();

    const artistAllowMessages = (() => {
        const v = artistSettings.allow_messages ?? artistSettings.allowMessages;
        if (v == null) return true;
        if (typeof v === 'boolean') return v;
        return Number(v) !== 0;
    })();

    const artistAllowReviews = (() => {
        const v = artistSettings.allow_reviews ?? artistSettings.allowReviews;
        if (v == null) return true;
        if (typeof v === 'boolean') return v;
        return Number(v) !== 0;
    })();

    const countyLabel = countyRaw
        ? /county$/i.test(String(countyRaw).trim())
            ? String(countyRaw).trim()
            : `${String(countyRaw).trim()} County`
        : "";

    const locationLabel = isStatewide ? "Statewide" : [city, countyLabel].filter(Boolean).join(", ");

    const genres = safeJsonParse(safeArtist.genres_json, []) || safeArtist.genres || [];
    const linksObj = safeJsonParse(safeArtist.links_json, {}) || safeArtist.links || {};
    const linkEntries = Object.entries(linksObj).filter(([, v]) => Boolean(v));

    // Visual artist (painter/photographer) vs musician. Reads from serialized
    // profileType first, then the raw snake_case fallback for safety.
    const isVisualArtist = String(safeArtist.profileType || safeArtist.profile_type || "").toLowerCase() === "artist";

    const bio = safeArtist.bio || "";
    const tagline = String(safeArtist.tagline || "").trim();
    const foundingYear = safeArtist.foundingYear || safeArtist.founding_year || safeArtist.founding_year || "";
    const hometown = String(safeArtist.hometown || "").trim();

    // Parse highlight sections from settings
    const profileHighlightSections = (() => {
        const raw = safeArtist.settings_json || safeArtist.settingsJson || safeArtist.settings;
        let s = {};
        if (raw && typeof raw === "string") { try { s = JSON.parse(raw); } catch { s = {}; } }
        else if (raw && typeof raw === "object") { s = raw; }
        return Array.isArray(s.highlightSections) ? s.highlightSections.filter((sec) => sec.title?.trim() || sec.body?.trim() || sec.photoUrl) : [];
    })();

    const avatarSrc = safeArtist.avatar_url || safeArtist.avatarUrl || "";
    const hasRealAvatar = Boolean(avatarSrc && !avatarSrc.includes("default_avatar") && !avatarSrc.includes("default_artist"));
    const coverSrcRaw = safeArtist.cover_url || safeArtist.coverUrl || "";
    const coverSrc = (coverSrcRaw && coverSrcRaw !== "null" && coverSrcRaw !== "undefined" && !coverSrcRaw.includes("default_cover")) ? coverSrcRaw : "";

    const photoCandidates =
        safeArtist.photos || safeArtist.photoUrls || safeArtist.images ||
        safeJsonParse(safeArtist.photos_json, []) || [];

    const photosRaw = Array.isArray(photoCandidates)
        ? photoCandidates
            .map((p) => {
                if (typeof p === "string") return p;
                if (p && typeof p === "object" && p.url) return p.url;
                return null;
            })
            .filter(Boolean)
        : [];

    // Prefer API-fetched photos (have DB record IDs for like/comment support);
    // fall back to raw photo URLs while the fetch is in progress.
    const photos = artistGalleryLoaded && artistGalleryPhotos.length > 0
        ? artistGalleryPhotos
        : photosRaw;

    const followersCount = followCounts.followers;
    const followingCount = followCounts.following;
    const monthlyListeners = Number(safeArtist.monthly_listeners ?? safeArtist.monthlyListeners ?? 0);
    const tracksCount = Number(safeArtist.tracks_count ?? safeArtist.tracksCount ?? 0);

    // All links shown as header icons
    const headerLinks = linkEntries;
    const hasSocials = headerLinks.length > 0;

    const hasPhotos = photos.length > 0;

    // ── Client-side filter + sort for events (matching business profile) ──
    const sortedArtistEvents = (() => {
        // For going/interested view modes, use the dedicated data sources
        if (eventViewMode === 'going') {
            const sorted = [...artistGoingEvents];
            sorted.sort((a, b) => new Date(a.startAt || a.start_at || 0) - new Date(b.startAt || b.start_at || 0));
            return sorted;
        }
        if (eventViewMode === 'interested') {
            const sorted = [...artistInterestedEvents];
            sorted.sort((a, b) => new Date(a.startAt || a.start_at || 0) - new Date(b.startAt || b.start_at || 0));
            return sorted;
        }

        let filtered = artistEvents;

        // Date picker filters
        if (eventDateFrom || eventDateTo) {
            const fromMs = eventDateFrom ? new Date(eventDateFrom + 'T00:00:00').getTime() : 0;
            const toMs = eventDateTo ? new Date(eventDateTo + 'T23:59:59').getTime() : Infinity;
            filtered = filtered.filter((e) => {
                const s = new Date(e.startAt || e.start_at || 0).getTime();
                return s >= fromMs && s <= toMs;
            });
        }

        // Sort by event start date (soonest first)
        const sorted = [...filtered];
        sorted.sort((a, b) => new Date(a.startAt || a.start_at || 0) - new Date(b.startAt || b.start_at || 0));
        return sorted;
    })();

    const hasArtistEvents = sortedArtistEvents.length > 0;

    const handleEventClick = (evt) => {
        if (!evt?.id) return;
        setEventScrollToCommentId(null);
        setEventHighlightCommentId(null);
        setSelectedEventPopup(evt);
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const scrollToContentTop = () => {
        // Scroll so the Overview/Events/Photos tabs sit at the top of the viewport
        const tabsEl = document.getElementById("artist-tabs");
        if (tabsEl) {
            // Calculate absolute offset from top of document
            let top = 0;
            let el = tabsEl;
            while (el) {
                top += el.offsetTop || 0;
                el = el.offsetParent;
            }
            window.scrollTo({ top, behavior: "smooth" });
        } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleEventCreated = () => {
        recordEventCreate();
        const aId = artist?.id;
        if (!aId) return;
        (async () => {
            try {
                const data = await fetchEvents({
                    sort: "soonest",
                    range: "all",
                    limit: 50,
                    includeTotal: 1,
                    artistAccountId: aId,
                });
                const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
                setArtistEvents(items);
            } catch {
                // silent
            }
        })();
        showSuccess('Event saved successfully');
    };

    // ── Job action handlers ──
    const handleJobCreated = () => {
        const wasEdit = Boolean(editingJob);
        if (!wasEdit) recordJobCreate();
        setCreateJobOpen(false);
        setEditingJob(null);
        setJobsRefreshNonce((n) => n + 1);
        setArtistHasJobs(true);
        showSuccess(wasEdit ? 'Job updated successfully' : 'Job created successfully');
    };

    const handleEditJob = (job) => {
        setEditingJob(job);
        setCreateJobOpen(true);
    };

    const handleDeleteJobConfirm = async () => {
        if (!deleteConfirmJob?.id) return;
        try {
            await deleteJobApi(deleteConfirmJob.id);
            setDeleteConfirmJob(null);
            setSelectedJobPopup(null);
            setJobsRefreshNonce((n) => n + 1);
            showSuccess('Job deleted successfully');
        } catch (err) {
            console.error('[Delete job]', err);
        }
    };

    const handleRenewJob = async (job) => {
        if (!job?.id) return;
        try {
            await renewJobApi(job.id, 30);
            setJobsRefreshNonce((n) => n + 1);
            showSuccess('Job listing extended successfully');
        } catch (err) {
            console.error('[Renew job]', err);
        }
    };

    const tabs = [
        ...ARTIST_PROFILE_TABS,
        ...(isMobile ? [{ label: "Activity", icon: <DynamicFeedRoundedIcon sx={{ fontSize: 18 }} /> }] : []),
        { label: "Photos", icon: <PhotoLibraryRoundedIcon sx={{ fontSize: 18 }} /> },
    ];

    // Tab indices shift depending on whether the mobile-only Activity tab is present
    const ACTIVITY_TAB = isMobile ? 1 : -1; // -1 = not present on desktop
    const PHOTOS_TAB = isMobile ? 2 : 1;

    const handleBackToArtists = () => {
        if (embedded && onBack) {
            onBack();
            return;
        }
        navigate("/music", {
            state: {
                restoreArtists: true,
                selectedArtistHandle: artistHandle,
                ...(musicReturnState || {}),
            },
        });
    };

    return (
        <ContentFadeIn triggerKey={handleOrId}>
            <Box sx={{ bgcolor: { xs: "background.paper", md: "background.default" }, minHeight: { xs: `calc(100vh - ${chromeTop}px)`, md: "100vh" }, pt: { xs: `${chromeTop}px`, md: 0 }, pb: { xs: 0, md: 4 } }}>
                <Container maxWidth={false} sx={{ pt: { xs: 0, md: 2 }, px: { xs: 0, md: 3 }, maxWidth: 1400 }}>
                    {/* Cover Photo + Header Card + Tabs — one seamless block (matches BusinessPublicPage) */}
                    <Paper sx={{ overflow: "hidden", borderBottom: "1px solid", borderColor: "divider", borderRadius: { xs: 0, md: undefined }, boxShadow: { xs: 'none', md: undefined } }}>
                        {/* Back to Artists button — inside seamless block (hidden when embedded in drawer) */}
                        {fromMusic && !embedded && (
                            <Box sx={{ px: { xs: 2, sm: 3 }, py: 1.25, borderBottom: "1px solid", borderColor: "divider" }}>
                                <Button
                                    startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 18 }} />}
                                    onClick={handleBackToArtists}
                                    sx={{
                                        px: 1.5, py: 0.5, minWidth: 0, fontWeight: 800, fontSize: 13, textTransform: "none", borderRadius: 999, color: "primary.main", "&:hover": { bgcolor: "action.hover" },
                                    }}
                                >
                                    Return to Artists
                                </Button>
                            </Box>
                        )}

                        {/* Cover Photo */}
                        {coverSrc && (
                            <Box
                                onClick={() => openArtistPhotoComments('cover')}
                                sx={{
                                    position: "relative",
                                    width: "100%",
                                    paddingTop: { xs: `${100 / 2.2}%`, sm: `${100 / COVER_ASPECT_RATIO}%` },
                                    overflow: "hidden",
                                    bgcolor: "primary.main",
                                    cursor: "pointer",
                                    WebkitTapHighlightColor: "transparent",
                                }}
                            >
                                <Box
                                    onClick={() => openArtistPhotoComments('cover')}
                                    sx={{
                                        position: "absolute",
                                        inset: 0,
                                        backgroundImage: (t) => `linear-gradient(to bottom, transparent 60%, ${alpha(t.palette.common.black, 0.30)}), url(${coverSrc})`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                    }}
                                />
                            </Box>
                        )}

                        <Box sx={{ p: { xs: 2, sm: 3 } }}>
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={{ xs: 2, sm: 3 }}
                                alignItems={{ xs: "center", sm: "flex-start" }}
                            >
                                {/* Avatar — matches BusinessPublicPage sizing */}
                                <Box
                                    onClick={() => avatarImgLoaded && openArtistPhotoComments('avatar')}
                                    onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && avatarImgLoaded) openArtistPhotoComments('avatar'); }}
                                    role={avatarImgLoaded ? 'button' : undefined}
                                    tabIndex={avatarImgLoaded ? 0 : undefined}
                                    sx={{ position: 'relative', cursor: avatarImgLoaded ? "pointer" : "default", WebkitTapHighlightColor: "transparent" }}
                                >
                                    <Avatar
                                        variant="circular"
                                        src={hasRealAvatar ? avatarSrc : undefined}
                                        sx={(t) => ({
                                            width: { xs: 110, sm: 140 },
                                            height: { xs: 110, sm: 140 },
                                            border: "4px solid",
                                            borderColor: "background.paper",
                                            boxShadow: 3,
                                            fontSize: 44,
                                            mt: coverSrc ? { xs: -7, sm: -8 } : { xs: 3, sm: 0 },
                                            cursor: avatarImgLoaded ? "pointer" : "default",
                                            transition: "transform 0.2s ease",
                                            "&:hover": avatarImgLoaded ? { transform: "scale(1.03)" } : {},
                                            // Stack the 8% primary tint over a solid paper layer so the
                                            // cover photo doesn't bleed through when no avatar is set.
                                            // `bgcolor: alpha(primary, 0.08)` alone is translucent and
                                            // rendered the default icon barely visible on top of cover art.
                                            background: `linear-gradient(${alpha(t.palette.primary.main, 0.08)}, ${alpha(t.palette.primary.main, 0.08)}), ${t.palette.background.paper}`,
                                            color: t.palette.primary.main,
                                            "& .MuiAvatar-img": {
                                                objectFit: "cover",
                                                transform: "scale(1.15)",
                                            },
                                        })}
                                        imgProps={{
                                            referrerPolicy: "no-referrer",
                                            onLoad: () => setAvatarImgLoaded(true),
                                            onError: () => setAvatarImgLoaded(false),
                                        }}
                                    >
                                        {isVisualArtist
                                            ? <PaletteRoundedIcon sx={{ fontSize: { xs: 48, sm: 64 } }} />
                                            : <MusicNoteRoundedIcon sx={{ fontSize: { xs: 48, sm: 64 } }} />}
                                    </Avatar>
                                    {/* Online indicator — shown when the artist owner is online.
                                        Backend should populate artist.owner_is_online (or ownerIsOnline). */}
                                    {!canManage && Boolean(artist?.owner_is_online || artist?.ownerIsOnline) && (
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                bottom: { xs: 6, sm: 10 },
                                                right: { xs: 2, sm: 4 },
                                                width: { xs: 28, sm: 32 },
                                                height: { xs: 28, sm: 32 },
                                                borderRadius: '50%',
                                                bgcolor: '#44b700',
                                                border: '3px solid',
                                                borderColor: 'background.paper',
                                                zIndex: 2,
                                                pointerEvents: 'none',
                                            }}
                                        />
                                    )}
                                </Box>

                                <Box sx={{ flex: 1, textAlign: { xs: "center", sm: "left" }, minWidth: 0 }}>
                                    {/* Top row: Name and actions */}
                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        alignItems={{ xs: "center", sm: "flex-start" }}
                                        justifyContent="space-between"
                                        spacing={1}
                                    >
                                        <Box>
                                            {/* Name + verified */}
                                            <Stack
                                                direction="row"
                                                alignItems="center"
                                                justifyContent={{ xs: "center", sm: "flex-start" }}
                                                spacing={0.5}
                                                flexWrap="wrap"
                                            >
                                                <Typography
                                                    variant="h5"
                                                    fontWeight={800}
                                                >
                                                    {name}
                                                </Typography>
                                                {isVerified && (
                                                    <Tooltip title="Verified Artist" arrow>
                                                        <VerifiedRoundedIcon color="primary" />
                                                    </Tooltip>
                                                )}
                                            </Stack>

                                            {/* Handle */}
                                            {displayHandle && (
                                                <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mt: 0.25 }}>
                                                    @{displayHandle}
                                                </Typography>
                                            )}

                                            {/* Tagline */}
                                            {tagline && (
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        mt: 0.5,
                                                        fontWeight: 600,
                                                        fontStyle: "italic",
                                                        color: "text.secondary",
                                                        lineHeight: 1.4,
                                                        textAlign: { xs: "center", sm: "left" },
                                                    }}
                                                >
                                                    {tagline}
                                                </Typography>
                                            )}

                                            {/* Location - moved above followers */}
                                            {locationLabel && (
                                                <Stack
                                                    direction="row"
                                                    alignItems="center"
                                                    justifyContent={{ xs: "center", sm: "flex-start" }}
                                                    spacing={0.5}
                                                    sx={{ mt: 0.5 }}
                                                >
                                                    <LocationOnRoundedIcon sx={{ fontSize: 14, color: "primary.main" }} />
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ color: "primary.main", fontWeight: 700, fontSize: 12 }}
                                                    >
                                                        {locationLabel}
                                                    </Typography>
                                                </Stack>
                                            )}

                                            {/* Stats row - followers, releases, etc */}
                                            <Stack
                                                direction="row"
                                                alignItems="center"
                                                justifyContent={{ xs: "center", sm: "flex-start" }}
                                                spacing={1.5}
                                                divider={<Divider orientation="vertical" flexItem />}
                                                sx={{ mt: 0.75 }}
                                            >
                                                <InlineStatItem value={followersCount} label="Followers" onClick={() => { setFollowsDialogTab(0); setFollowsDialogOpen(true); }} />
                                                <InlineStatItem value={followingCount} label="Following" onClick={() => { setFollowsDialogTab(1); setFollowsDialogOpen(true); }} />
                                                {monthlyListeners > 0 && (
                                                    <InlineStatItem value={monthlyListeners} label="Listeners" />
                                                )}
                                                {tracksCount > 0 && (
                                                    <InlineStatItem value={tracksCount} label="Tracks" />
                                                )}
                                            </Stack>
                                        </Box>

                                        {/* Top right actions: Follow, Message, Share, 3-dot menu, Edit Profile */}
                                        <Stack direction="row" spacing={0.75} alignItems="center">
                                            {/* Follow button - show for logged-in non-admins OR admins on a different account */}
                                            {Boolean(user) && (!canManage || !isOnArtistProfile) && (
                                                isMobile ? (
                                                    <Tooltip title={isFollowing ? 'Following' : 'Follow'} arrow>
                                                        <IconButton
                                                            onClick={handleFollowClick}
                                                            disabled={followBusy}
                                                            sx={{
                                                                width: 36,
                                                                height: 36,
                                                                border: '1px solid',
                                                                borderColor: isFollowing ? 'primary.main' : (t) => alpha(t.palette.text.primary, 0.2),
                                                                borderRadius: 999,
                                                                color: isFollowing ? 'primary.main' : 'text.secondary',
                                                                bgcolor: isFollowing ? (t) => alpha(t.palette.primary.main, 0.06) : 'transparent',
                                                                '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
                                                            }}
                                                        >
                                                            {isFollowing
                                                                ? <HowToRegRoundedIcon sx={{ fontSize: 20 }} />
                                                                : <PersonAddRoundedIcon sx={{ fontSize: 20 }} />}
                                                        </IconButton>
                                                    </Tooltip>
                                                ) : (
                                                    <Button
                                                        variant={isFollowing ? "outlined" : "contained"}
                                                        startIcon={isFollowing ? <HowToRegRoundedIcon /> : <PersonAddRoundedIcon />}
                                                        onClick={handleFollowClick}
                                                        disabled={followBusy}
                                                        sx={{ textTransform: "none", fontWeight: 700, fontSize: 13, borderRadius: 999, px: 2 }}
                                                    >
                                                        {isFollowing ? "Following" : "Follow"}
                                                    </Button>
                                                )
                                            )}

                                            {/* Message button - show for logged-in non-admins OR admins on a different account, and only when messages are enabled */}
                                            {Boolean(user) && (!canManage || !isOnArtistProfile) && artistAllowMessages && (
                                                <Tooltip title="Message" arrow>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setQuickMsgOpen(true)}
                                                        sx={{ width: 36, height: 36, border: "1px solid", borderColor: "divider", color: "text.secondary", "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) } }}
                                                    >
                                                        <MailOutlineRoundedIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}

                                            {/* Share button */}
                                            <Tooltip title="Share" arrow>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setProfileShareOpen(true)}
                                                    sx={{ width: 36, height: 36, border: "1px solid", borderColor: "divider", color: "text.secondary", "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) } }}
                                                >
                                                    <ShareOutlinedIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </Tooltip>

                                            {/* 3-dot overflow menu — far right */}
                                            {(canReportArtist || artist?.id) && (
                                                <Tooltip title="More" arrow>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => setArtistMenuEl(e.currentTarget)}
                                                        sx={{ width: 36, height: 36, border: "1px solid", borderColor: "divider", color: "text.secondary", "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) } }}
                                                    >
                                                        <MoreVertRoundedIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            )}

                                            {/* Edit Profile — only when on the artist's own account; placed at far right */}
                                            {canManage && isOnArtistProfile && (
                                                <Button
                                                    component={Link}
                                                    to={`/artists/${artist?.id || artistHandle}/admin`}
                                                    variant="outlined"
                                                    startIcon={<EditRoundedIcon sx={{ fontSize: 16 }} />}
                                                    sx={{ textTransform: "none", fontWeight: 700, fontSize: 13, borderRadius: 999, px: 2 }}
                                                >
                                                    Edit Profile
                                                </Button>
                                            )}
                                        </Stack>
                                    </Stack>

                                    {/* Bottom row: Genre chips on left, social icons on right */}
                                    <Stack
                                        direction="row"
                                        alignItems="center"
                                        justifyContent={{ xs: "center", sm: "space-between" }}
                                        sx={{ mt: 1.5 }}
                                        flexWrap="wrap"
                                        useFlexGap
                                    >
                                        {/* Genre chips */}
                                        {genres.length > 0 ? (
                                            <Stack
                                                direction="row"
                                                alignItems="center"
                                                spacing={0.5}
                                                flexWrap="wrap"
                                                useFlexGap
                                                sx={{ flex: 1, minWidth: 0 }}
                                            >
                                                {genres.slice(0, 6).map((g) => {
                                                    // For visual artists, the genres_json field holds art
                                                    // categories (Painting, Photography, etc.), so pick an
                                                    // appropriate icon from the category helper instead of
                                                    // the music-genre icon map.
                                                    const GenreIcon = isVisualArtist ? getCategoryIcon(g) : getGenreIcon(g);
                                                    return (
                                                        <Chip
                                                            key={g}
                                                            icon={<GenreIcon sx={{ fontSize: "13px !important" }} />}
                                                            label={g}
                                                            size="small"
                                                            sx={(t) => ({
                                                                height: 26,
                                                                borderRadius: 2,
                                                                fontWeight: 700,
                                                                fontSize: "0.73rem",
                                                                bgcolor: alpha(t.palette.primary.main, 0.07),
                                                                color: t.palette.text.primary,
                                                                "& .MuiChip-label": { px: 0.9, lineHeight: 1 },
                                                                "& .MuiChip-icon": { color: t.palette.primary.main },
                                                            })}
                                                        />
                                                    );
                                                })}
                                            </Stack>
                                        ) : (
                                            <Box sx={{ flex: 1 }} />
                                        )}
                                    </Stack>

                                </Box>
                            </Stack>

                            {/* Social/streaming icons removed — shown in About sidebar instead */}
                        </Box>

                        {/* Tabs — MUI Tabs matching BusinessPublicPage */}
                        <Tabs id="artist-tabs" value={activeTab} onChange={(e, newVal) => { setActiveTab(newVal); if (isMobile) { const tabsEl = document.getElementById('artist-tabs'); if (tabsEl) { requestAnimationFrame(() => { tabsEl.scrollIntoView({ block: 'nearest', behavior: 'auto' }); }); } } }} variant={isMobile ? "fullWidth" : "standard"} scrollButtons={false} sx={(t) => ({ borderTop: isMobile ? "none" : "1px solid", borderBottom: isMobile ? "1px solid" : "none", borderColor: "divider", bgcolor: "background.paper", px: { xs: 1, sm: 2 }, "& .MuiTabs-indicator": { height: 3, borderRadius: '3px 3px 0 0', backgroundColor: t.palette.text.primary }, "& .MuiTab-root": { minHeight: 48, textTransform: "none", fontWeight: 700, fontSize: isMobile ? '0.72rem' : '0.85rem', letterSpacing: '-0.01em', color: alpha(t.palette.text.primary, 0.55), borderRadius: 0, bgcolor: "transparent", transition: `color ${t.custom?.motion?.base || 200}ms ${t.custom?.motion?.ease || 'ease'}`, "&.Mui-selected": { color: t.palette.text.primary }, '& .MuiSvgIcon-root': { color: alpha(t.palette.text.primary, 0.5), transition: `color ${t.custom?.motion?.fast || 150}ms ${t.custom?.motion?.ease || 'ease'}` }, '&.Mui-selected .MuiSvgIcon-root': { color: t.palette.text.primary }, '&:hover .MuiSvgIcon-root': { color: t.palette.text.primary } } })}>
                            {tabs.map((tab, idx) => <Tab key={idx} label={<Stack direction={isMobile ? "column" : "row"} alignItems="center" spacing={isMobile ? 0.25 : 0.75}>{tab.icon}<span>{isMobile && tab.mobileLabel ? tab.mobileLabel : tab.label}</span></Stack>} />)}
                        </Tabs>
                    </Paper>

                    {/* Tab content with breathing room */}
                    <Box ref={contentTopRef} sx={{ pt: { xs: 0, md: 2.5 }, bgcolor: { xs: 'background.paper', md: 'transparent' } }}>

                        {/* ── Blocked / Hidden notice ── */}
                        {blockedByMe && !canManage && (
                            <Box sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
                                <Card variant="outlined" sx={(t) => ({ borderRadius: 3, overflow: 'hidden', borderColor: alpha(t.palette.error.main, 0.22), boxShadow: `0 14px 44px ${alpha(t.palette.text.primary, 0.10)}`, bgcolor: 'background.paper' })}>
                                    <Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                        <Box sx={(t) => ({ width: 36, height: 36, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(t.palette.error.main, 0.10), border: `1px solid ${alpha(t.palette.error.main, 0.20)}`, flexShrink: 0 })}>
                                            <BlockRoundedIcon fontSize="small" />
                                        </Box>
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.25 }}>You blocked {artist?.name || 'this artist'}</Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>You won't see their posts or be able to interact with their profile until you unblock them.</Typography>
                                            <Button variant="outlined" onClick={handleUnblockArtist} sx={(t) => ({ mt: 1.25, borderRadius: 999, textTransform: 'none', fontWeight: 900, borderColor: alpha(t.palette.error.main, 0.35), color: 'error.main', '&:hover': { borderColor: alpha(t.palette.error.main, 0.55), bgcolor: alpha(t.palette.error.main, 0.06) } })}>
                                                Unblock
                                            </Button>
                                        </Box>
                                    </Box>
                                </Card>
                            </Box>
                        )}
                        {!blockedByMe && hiddenPostsByMe && !canManage && (
                            <Box sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
                                <Card variant="outlined" sx={(t) => ({ borderRadius: 3, overflow: 'hidden', borderColor: alpha(t.palette.primary.main, 0.14), boxShadow: `0 14px 44px ${alpha(t.palette.text.primary, 0.10)}`, bgcolor: 'background.paper' })}>
                                    <Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                        <Box sx={(t) => ({ width: 36, height: 36, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(t.palette.primary.main, 0.10), border: `1px solid ${alpha(t.palette.primary.main, 0.14)}`, flexShrink: 0 })}>
                                            <VisibilityOffRoundedIcon fontSize="small" />
                                        </Box>
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.25 }}>You've hidden posts from {artist?.name || 'this artist'}</Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>Their posts won't show up for you until you unhide them.</Typography>
                                            <Button variant="outlined" onClick={handleUnhideArtist} sx={{ mt: 1.25, borderRadius: 999, textTransform: 'none', fontWeight: 900 }}>
                                                Unhide posts
                                            </Button>
                                        </Box>
                                    </Box>
                                </Card>
                            </Box>
                        )}

                        {/* ============ OVERVIEW TAB (two-column layout matching BusinessPublicPage) ============ */}
                        {activeTab === 0 && (
                            <Stack direction={{ xs: "column", md: "row" }} spacing={2.5}>
                                {/* LEFT SIDEBAR */}
                                <Box
                                    ref={sidebarRef}
                                    data-artist-sidebar={isMobile ? 'mobile' : undefined}
                                    sx={{
                                        width: { xs: "100%", md: 440 },
                                        flexShrink: 0,
                                        order: { xs: 0, md: 0 },
                                        alignSelf: { md: "stretch" },
                                    }}
                                >
                                    {/* Mobile: strip Paper card styling — no shadows, borders, or radius. Background inherits from parent (paper). */}
                                    {isMobile && (
                                        <style>{`
                                            [data-artist-sidebar="mobile"] .MuiPaper-root {
                                                box-shadow: none !important;
                                                border-radius: 0 !important;
                                                background-color: inherit !important;
                                                background-image: none !important;
                                                border: none !important;
                                            }
                                            [data-artist-sidebar="mobile"] .MuiCard-root {
                                                box-shadow: none !important;
                                                border-radius: 0 !important;
                                                border: none !important;
                                            }
                                        `}</style>
                                    )}
                                    <Box
                                        ref={sidebarContentRef}
                                        sx={{
                                            position: { md: "sticky" },
                                            top: { md: sidebarStickyTop },
                                            transition: (t) => `top ${t.custom?.motion?.base || 200}ms ${t.custom?.motion?.ease || 'ease'}`,
                                        }}
                                    >
                                        <Stack spacing={{ xs: 0, sm: 2.5 }}>
                                            {/* About Card */}
                                            <Paper sx={{ p: { xs: 1.75, sm: 2.5 } }}>
                                                {!isMobile && <SectionHeader icon={isVisualArtist ? <PaletteRoundedIcon sx={{ fontSize: 20 }} /> : <MusicNoteRoundedIcon sx={{ fontSize: 20 }} />} title="About" />}

                                                {/* Bio */}
                                                {bio ? (
                                                    <Box>
                                                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7, wordBreak: "break-word", overflowWrap: "anywhere" }}>
                                                            {bio.length > 700 && !aboutExpanded ? `${bio.slice(0, 700).trim()}...` : bio}
                                                        </Typography>
                                                        {bio.length > 700 && (
                                                            <Typography component="span" onClick={() => setAboutExpanded((v) => !v)} sx={{ fontSize: 12, fontWeight: 800, color: "primary.main", cursor: "pointer", mt: 0.5, display: "inline-block", "&:hover": { textDecoration: "underline" } }}>
                                                                {aboutExpanded ? "Show less" : "Read more"}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                ) : (
                                                    <Box sx={{ minHeight: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <Typography variant="body2" color="text.secondary" fontStyle="italic">No bio provided yet.</Typography>
                                                    </Box>
                                                )}

                                                {/* Quick Facts: Founding Year + Hometown */}
                                                {(foundingYear || hometown) && (
                                                    <>
                                                        <Divider sx={{ my: 2 }} />
                                                        <Stack spacing={0.75}>
                                                            {foundingYear && (
                                                                <Stack direction="row" spacing={0.75} alignItems="center">
                                                                    <CalendarMonthRoundedIcon sx={{ fontSize: 17, color: "text.secondary" }} />
                                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>
                                                                        Est. {foundingYear}
                                                                    </Typography>
                                                                </Stack>
                                                            )}
                                                            {hometown && (
                                                                <Stack direction="row" spacing={0.75} alignItems="center">
                                                                    <HomeRoundedIcon sx={{ fontSize: 17, color: "text.secondary" }} />
                                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>
                                                                        From {hometown}
                                                                    </Typography>
                                                                </Stack>
                                                            )}
                                                        </Stack>
                                                    </>
                                                )}

                                                {/* Highlight Sections (matching BusinessPublicPage layout) */}
                                                {profileHighlightSections.length > 0 && (
                                                    <>
                                                        <Divider sx={{ my: 2 }} />
                                                        {profileHighlightSections.map((sec, hlIdx) => {
                                                            // Photo-only highlight: drop the card chrome (border, bg, title bar).
                                                            // The photo alone already reads as its own item and the card frame
                                                            // plus a "Highlight" placeholder title felt redundant.
                                                            const isPhotoOnly = Boolean(sec.photoUrl) && !sec.title?.trim() && !sec.body?.trim();
                                                            if (isPhotoOnly) {
                                                                return (
                                                                    <Box key={hlIdx} sx={{ mb: 1.5, borderRadius: 2.5, overflow: 'hidden' }}>
                                                                        <Box
                                                                            component="img"
                                                                            src={sec.photoUrl}
                                                                            alt="Highlight"
                                                                            referrerPolicy="no-referrer"
                                                                            onClick={() => setPhotoPreviewSrc(sec.photoUrl)}
                                                                            sx={{ width: '100%', height: 'auto', maxHeight: 319, objectFit: 'cover', display: 'block', cursor: 'pointer', transition: 'opacity 0.15s', '&:hover': { opacity: 0.85 } }}
                                                                        />
                                                                    </Box>
                                                                );
                                                            }
                                                            return (
                                                                <Box key={hlIdx} sx={{ mb: 1.5, borderRadius: 2.5, overflow: 'hidden', border: '1px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.15), bgcolor: (t) => alpha(t.palette.primary.main, 0.03) }}>
                                                                    {sec.title?.trim() && (
                                                                        <Box sx={{ px: 1.5, py: 0.65, bgcolor: (t) => alpha(t.palette.primary.main, 0.07), borderBottom: '1px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.12), display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                                            <HlProfileIcon name={sec.icon} sx={{ fontSize: 15, color: 'primary.main' }} />
                                                                            <Typography sx={{ fontWeight: 900, fontSize: 11, color: 'primary.dark', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{sec.title}</Typography>
                                                                        </Box>
                                                                    )}
                                                                    {(sec.photoUrl || sec.body) && (
                                                                        <Box>
                                                                            {sec.photoUrl && <Box component="img" src={sec.photoUrl} alt={sec.title || 'Highlight'} referrerPolicy="no-referrer" onClick={() => setPhotoPreviewSrc(sec.photoUrl)} sx={{ width: '100%', height: 'auto', maxHeight: 319, objectFit: 'cover', display: 'block', cursor: 'pointer', transition: 'opacity 0.15s', '&:hover': { opacity: 0.85 } }} />}
                                                                            {sec.body && <Box sx={{ px: 1.5, py: 1.25 }}><Typography sx={{ fontSize: 12, lineHeight: 1.55, color: 'text.secondary', fontWeight: 500, whiteSpace: 'pre-line' }}>{sec.body}</Typography></Box>}
                                                                        </Box>
                                                                    )}
                                                                </Box>
                                                            );
                                                        })}
                                                    </>
                                                )}

                                                {/* Streaming Links — musicians only */}
                                                {!isVisualArtist && (() => {
                                                    const streamingLinks = headerLinks.filter(([k]) => isStreamingPlatform(k));
                                                    if (streamingLinks.length === 0) return null;
                                                    return (
                                                        <>
                                                            <Divider sx={{ my: 2 }} />
                                                            <SectionHeader icon={<HeadphonesRoundedIcon sx={{ fontSize: 20 }} />} title="Stream Now" />
                                                            <Stack spacing={0.5}>
                                                                {streamingLinks.map(([k, v]) => {
                                                                    const platform = getLinkPlatform(k);
                                                                    const color = getLinkColor(k);
                                                                    const label = String(k)
                                                                        .replace(/_/g, " ")
                                                                        .replace(/([a-z])([A-Z])/g, "$1 $2")
                                                                        .replace(/\b\w/g, (l) => l.toUpperCase());
                                                                    return (
                                                                        <Box
                                                                            key={k}
                                                                            component="a"
                                                                            href={buildSocialUrl(String(v), platform || "")}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            sx={{
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                gap: 1.5,
                                                                                textDecoration: "none",
                                                                                color: "text.primary",
                                                                                py: 1,
                                                                                px: 1.5,
                                                                                mx: -1.5,
                                                                                borderRadius: 1.5,
                                                                                "&:hover": { bgcolor: "action.hover" },
                                                                            }}
                                                                        >
                                                                            <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: alpha(color || theme.palette.primary.main, 0.1), display: "flex", alignItems: "center", justifyContent: "center", color: color || "primary.main" }}>
                                                                                {getLinkIcon(k, 18)}
                                                                            </Box>
                                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                                <Typography variant="body2" fontWeight={600} color={color || "primary.main"} noWrap>{label}</Typography>
                                                                            </Box>
                                                                            <OpenInNewRoundedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                                                                        </Box>
                                                                    );
                                                                })}
                                                            </Stack>
                                                        </>
                                                    );
                                                })()}

                                                {/* Social Links — Connect section. For visual artists,
                                                    show every non-snapchat link here since there's no
                                                    separate Stream Now section for them. Musicians keep
                                                    the streaming-filtered behavior. */}
                                                {(() => {
                                                    const socialLinks = isVisualArtist
                                                        ? headerLinks.filter(([k]) => !String(k).toLowerCase().includes("snapchat"))
                                                        : headerLinks.filter(([k]) => !isStreamingPlatform(k) && !String(k).toLowerCase().includes("snapchat"));
                                                    if (socialLinks.length === 0) return null;
                                                    return (
                                                        <>
                                                            <Divider sx={{ my: 2 }} />
                                                            <SectionHeader icon={<LinkRoundedIcon sx={{ fontSize: 20 }} />} title="Connect" />
                                                            <Stack spacing={0.5}>
                                                                {socialLinks.map(([k, v]) => {
                                                                    const platform = getLinkPlatform(k);
                                                                    const color = getLinkColor(k);
                                                                    const label = String(k)
                                                                        .replace(/_/g, " ")
                                                                        .replace(/([a-z])([A-Z])/g, "$1 $2")
                                                                        .replace(/\b\w/g, (l) => l.toUpperCase());
                                                                    return (
                                                                        <Box
                                                                            key={k}
                                                                            component="a"
                                                                            href={buildSocialUrl(String(v), platform || "")}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            sx={{
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                gap: 1.5,
                                                                                textDecoration: "none",
                                                                                color: "text.primary",
                                                                                py: 1,
                                                                                px: 1.5,
                                                                                mx: -1.5,
                                                                                borderRadius: 1.5,
                                                                                "&:hover": { bgcolor: "action.hover" },
                                                                            }}
                                                                        >
                                                                            <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: alpha(color || theme.palette.primary.main, 0.1), display: "flex", alignItems: "center", justifyContent: "center", color: color || "primary.main" }}>
                                                                                {getLinkIcon(k, 18)}
                                                                            </Box>
                                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                                <Typography variant="body2" fontWeight={600} color={color || "primary.main"} noWrap>{label}</Typography>
                                                                            </Box>
                                                                            <OpenInNewRoundedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                                                                        </Box>
                                                                    );
                                                                })}
                                                            </Stack>
                                                        </>
                                                    );
                                                })()}
                                            </Paper>

                                            {/* Followers & Following Card — hidden on mobile */}
                                            {!isMobile && (
                                                <Paper sx={{ p: { xs: 1.75, sm: 2.5 } }}>
                                                    <ArtistFollowsPreview
                                                        artistId={artist?.id}
                                                        artistName={name}
                                                        viewerUserId={user?.public_id || user?.id || user?.handle}
                                                        acctHeaders={typeof getAcctHdrs === 'function' ? getAcctHdrs() : {}}
                                                        user={user}
                                                        refreshNonce={followsRefreshNonce}
                                                        onOpenAll={(tab) => { setFollowsDialogTab(tab); setFollowsDialogOpen(true); }}
                                                    />
                                                </Paper>
                                            )}

                                            {/* Photos Preview Card */}
                                            <Paper sx={{ p: { xs: 1.75, sm: 2.5 } }}>
                                                <SectionHeader
                                                    icon={<PhotoLibraryRoundedIcon sx={{ fontSize: 20 }} />}
                                                    title="Photos"
                                                    action={hasPhotos && (
                                                        <Button size="small" onClick={() => setActiveTab(PHOTOS_TAB)} endIcon={<ChevronRightRoundedIcon sx={{ fontSize: 16 }} />} sx={{ textTransform: 'none', fontWeight: 700 }}>
                                                            View All
                                                        </Button>
                                                    )}
                                                />
                                                {hasPhotos ? (
                                                    <PhotoGallery
                                                        images={photos}
                                                        name={name}
                                                        maxDisplay={4}
                                                        isOverview
                                                        onViewAll={() => setActiveTab(PHOTOS_TAB)}
                                                        onPhotoClick={(photoId, photoUrl) => {
                                                            if (photoId) {
                                                                openGalleryPhotoComments(photoId, photoUrl);
                                                            } else {
                                                                // fallback for photos without DB IDs
                                                                const idx = photos.findIndex((p) => (typeof p === 'string' ? p : p?.url) === photoUrl);
                                                                setLightboxIndex(idx >= 0 ? idx : 0);
                                                                setLightboxOpen(true);
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <EmptyStateCard icon={<PhotoLibraryRoundedIcon sx={{ fontSize: 40 }} />} title="No photos yet" description={`${name} hasn't added any photos yet.`} />
                                                )}
                                            </Paper>
                                        </Stack>
                                    </Box>
                                </Box>


                                {/* RIGHT COLUMN — Activity / Events Feed — hidden on mobile (shown in Activity tab) */}
                                <Box sx={{ flex: 1, minWidth: 0, order: { xs: 0, md: 1 }, display: { xs: 'none', md: 'block' } }}>
                                    <Paper sx={{ overflow: "visible" }}>
                                        {/* ── Top bar: pill tabs + New Post + Return to top (scrolls with page, not sticky) ── */}
                                        <Box
                                            ref={postsHeaderRef}
                                            sx={{
                                                zIndex: 10,
                                                bgcolor: "background.paper",
                                                borderBottom: "1px solid",
                                                borderColor: "divider",
                                            }}
                                        >
                                            <Stack
                                                direction="row"
                                                alignItems="center"
                                                justifyContent="space-between"
                                                sx={{
                                                    px: { xs: 1.25, sm: 2 },
                                                    py: { xs: 0.75, sm: 1 },
                                                    overflowX: 'auto',
                                                    overflowY: 'hidden',
                                                    WebkitOverflowScrolling: 'touch',
                                                    scrollbarWidth: 'none',
                                                    '&::-webkit-scrollbar': { display: 'none' },
                                                }}
                                                useFlexGap
                                                gap={1}
                                            >
                                                {/* Pill tabs: Activity | Events | Jobs | Services */}
                                                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
                                                    {[
                                                        { key: "activity", label: "Activity", icon: <DynamicFeedRoundedIcon /> },
                                                        { key: "events", label: "Events", icon: <EventRoundedIcon /> },
                                                        ...(artistHasJobs ? [{ key: "jobs", label: "Jobs", icon: <WorkOutlineRoundedIcon /> }] : []),
                                                        ...(artistHasServices ? [{ key: "services", label: "Services", icon: <BusinessCenterIcon /> }] : []),
                                                    ].map((tab) => {
                                                        const active = engagementMode === tab.key;
                                                        return (
                                                            <Button
                                                                key={tab.key}
                                                                role="tab"
                                                                aria-selected={active}
                                                                onClick={() => {
                                                                    setEngagementMode(tab.key);
                                                                    scrollToContentTop();
                                                                }}
                                                                variant="text"
                                                                disableElevation
                                                                startIcon={React.cloneElement(tab.icon, {
                                                                    sx: (t) => ({
                                                                        fontSize: 22,
                                                                        opacity: active ? 1 : 0.72,
                                                                        color: active ? t.palette.primary.main : t.palette.text.secondary,
                                                                    }),
                                                                })}
                                                                sx={(t) => ({
                                                                    borderRadius: 999,
                                                                    textTransform: "none",
                                                                    fontFamily: t.typography.fontFamily,
                                                                    fontWeight: active ? 950 : 700,
                                                                    letterSpacing: "-0.01em",
                                                                    fontSize: { xs: 12.5, md: 13.5 },
                                                                    lineHeight: 1,
                                                                    "& .MuiButton-startIcon": { marginRight: 0.9 },
                                                                    height: 38,
                                                                    px: { xs: 1.25, md: 1.75 },
                                                                    whiteSpace: 'nowrap',
                                                                    flexShrink: 0,
                                                                    color: active ? t.palette.primary.main : t.palette.text.secondary,
                                                                    backgroundColor: active ? alpha(t.palette.primary.main, 0.08) : "transparent",
                                                                    border: "1px solid",
                                                                    borderColor: active ? alpha(t.palette.primary.main, 0.2) : "transparent",
                                                                    boxShadow: "none",
                                                                    transition: `all ${t.custom?.motion?.base ?? 200}ms ${t.custom?.motion?.ease ?? "cubic-bezier(.2,.8,.2,1)"}`,
                                                                    "&:hover": {
                                                                        backgroundColor: active ? alpha(t.palette.primary.main, 0.1) : alpha(t.palette.text.primary, 0.04),
                                                                        color: active ? t.palette.primary.main : t.palette.text.primary,
                                                                    },
                                                                    "&:focus-visible": {
                                                                        outline: "none",
                                                                        boxShadow: `0 0 0 3px ${alpha(t.palette.primary.main, 0.20)}`,
                                                                    },
                                                                })}
                                                            >
                                                                {tab.label}
                                                            </Button>
                                                        );
                                                    })}
                                                </Stack>

                                                {/* Right side: Return to top (New Post moved to search bar row) */}
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    {isHeaderSticky && (
                                                        <Tooltip title="Return to top">
                                                            <IconButton size="small" onClick={scrollToContentTop} sx={{ bgcolor: "action.hover", "&:hover": { bgcolor: "action.selected" } }}>
                                                                <KeyboardArrowUpIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Stack>
                                            </Stack>

                                            {/* ══════ ACTIVITY MODE ══════ */}
                                            {engagementMode === "activity" && (
                                                <>
                                                    {/* Post sub-tabs — Posts | Comments | Likes | Reposts */}
                                                    <Box sx={(t) => ({ flexShrink: 0, borderBottom: "1px solid", borderColor: alpha(t.palette.primary.main, 0.08), bgcolor: "background.paper" })}>
                                                        <Tabs value={postSubTab} onChange={(_, v) => { setPostSubTab(v); setPreviewPost(null); setPostScrollToCommentId(null); setPostHighlightCommentId(null); setEngUserCardAnchor(null); scrollToContentTop(); }} variant="fullWidth" sx={(t) => ({ ...getProfileSubTabsSx(t), minHeight: 44, backgroundColor: 'transparent', background: 'transparent', '& .MuiTab-root': { ...getProfileSubTabsSx(t)['& .MuiTab-root'], minHeight: 44 }, '& .MuiTabs-indicator': { backgroundColor: t.palette.secondary.main }, '& .MuiTab-root.Mui-selected': { color: t.palette.secondary.main } })}>
                                                            <Tab icon={<ArticleRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Posts" />
                                                            <Tab icon={<ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Comments" />
                                                            <Tab icon={<FavoriteIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Likes" />
                                                            <Tab icon={<RepeatIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Reposts" />
                                                        </Tabs>
                                                    </Box>
                                                </>
                                            )}

                                            {/* ══════ EVENTS MODE (sub-tabs + filters inside sticky) ══════ */}
                                            {engagementMode === "events" && (
                                                <>
                                                    {/* Event sub-tabs */}
                                                    <Box sx={(t) => ({ flexShrink: 0, borderBottom: "1px solid", borderColor: alpha(t.palette.primary.main, 0.08), bgcolor: "background.paper" })}>
                                                        <Tabs value={eventSubTab} onChange={(_, v) => { setEventSubTab(v); scrollToContentTop(); }} variant="fullWidth" sx={(t) => ({ ...getProfileSubTabsSx(t), minHeight: 44, backgroundColor: 'transparent', background: 'transparent', '& .MuiTab-root': { ...getProfileSubTabsSx(t)['& .MuiTab-root'], minHeight: 44 }, '& .MuiTabs-indicator': { backgroundColor: t.palette.secondary.main }, '& .MuiTab-root.Mui-selected': { color: t.palette.secondary.main } })}>
                                                            <Tab icon={<EventRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Events" />
                                                            <Tab icon={<ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Comments" />
                                                            <Tab icon={<FavoriteIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Likes" />
                                                            <Tab icon={<RepeatIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Reposts" />
                                                        </Tabs>
                                                    </Box>
                                                </>
                                            )}

                                        </Box>
                                        {/* ── END sticky header ── */}

                                        {/* ══════ ACTIVITY CONTENT (below sticky) ══════ */}
                                        {engagementMode === "activity" && (
                                            <>
                                                {/* Photo lightbox for engagement tabs (Likes/Reposts) */}
                                                <Dialog open={engLightboxOpen} onClose={() => setEngLightboxOpen(false)} fullScreen={isMobileSm} maxWidth="lg" fullWidth sx={{ zIndex: 100001 }} PaperProps={{ sx: { bgcolor: 'common.black', ...(!isMobileSm && { maxHeight: '90vh' }), overflow: 'hidden' } }}>
                                                    <IconButton onClick={() => setEngLightboxOpen(false)} sx={{ position: 'absolute', top: 8, right: 8, color: 'common.white', zIndex: 1, bgcolor: (t) => alpha(t.palette.common.black, 0.55), '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.75) } }}><CloseRoundedIcon /></IconButton>
                                                    {engLightboxUrls.length > 1 && (<><IconButton onClick={() => setEngLightboxIdx((p) => (p - 1 + engLightboxUrls.length) % engLightboxUrls.length)} sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'common.white', bgcolor: (t) => alpha(t.palette.common.black, 0.50), '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.70) } }}><ChevronLeftRoundedIcon /></IconButton><IconButton onClick={() => setEngLightboxIdx((p) => (p + 1) % engLightboxUrls.length)} sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'common.white', bgcolor: (t) => alpha(t.palette.common.black, 0.50), '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.70) } }}><ChevronRightRoundedIcon /></IconButton></>)}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, height: isMobileSm ? '100%' : '80vh' }}><Box component="img" src={engLightboxUrls[engLightboxIdx]} alt="" sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /></Box>
                                                </Dialog>

                                                {/* UserCardPopover moved to component root for mobile accessibility */}

                                                {/* Search bar + Clear filters + New Post — always visible across all sub-tabs (matches BusinessEngagementTabs) */}
                                                <Box sx={{ px: 1.5, pt: 1.25, pb: 0.5, bgcolor: 'background.paper', zIndex: 7 }}>
                                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.75 }}>
                                                        <SearchInput
                                                            placeholder={postSubTab === 0 ? 'Search posts…' : postSubTab === 1 ? 'Search comments…' : postSubTab === 2 ? 'Search likes…' : 'Search reposts…'}
                                                            value={localPostSearchTerm}
                                                            onChange={(e) => setLocalPostSearchTerm(e?.target?.value ?? '')}
                                                            onSearch={() => setLocalPostSearch(localPostSearchTerm)}
                                                            onClear={() => { setLocalPostSearchTerm(''); setLocalPostSearch(''); }}
                                                            inputProps={{ name: 'll-artist-posts-search' }}
                                                        />
                                                        <Tooltip title="Clear all filters" arrow>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => {
                                                                    setLocalPostSearchTerm(''); setLocalPostSearch('');
                                                                    setPostSortBy('newest');
                                                                    setPostDateFrom(''); setPostDateTo('');
                                                                }}
                                                                sx={(t) => ({
                                                                    width: 36, height: 36, flexShrink: 0,
                                                                    borderRadius: 999,
                                                                    border: '1px solid',
                                                                    borderColor: alpha(t.palette.primary.main, 0.12),
                                                                    bgcolor: alpha(t.palette.text.primary, 0.03),
                                                                    '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.06), borderColor: alpha(t.palette.primary.main, 0.18) },
                                                                })}
                                                                aria-label="Clear filters"
                                                            >
                                                                <RestartAltRoundedIcon sx={{ fontSize: 18 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        {postSubTab === 0 && canManage && isOnArtistProfile && (
                                                            <Button
                                                                variant="contained"
                                                                size="small"
                                                                startIcon={<AddRoundedIcon />}
                                                                onClick={handleOpenCreatePost}
                                                                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999, flexShrink: 0, whiteSpace: 'nowrap' }}
                                                            >
                                                                New Post
                                                            </Button>
                                                        )}
                                                    </Stack>

                                                    {/* Filter dropdowns — Sort + dates on all sub-tabs (matches BusinessEngagementTabs grid) */}
                                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1, pb: 0.75 }}>
                                                        <FormControl size="small" fullWidth sx={PROFILE_CONTROL_SX}>
                                                            <InputLabel shrink>Sort by</InputLabel>
                                                            <Select
                                                                label="Sort by"
                                                                value={postSortBy}
                                                                onChange={(e) => setPostSortBy(e.target.value)}
                                                                MenuProps={profileMenuProps}
                                                            >
                                                                {POST_SORT_OPTIONS.map((opt) => (
                                                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                                                ))}
                                                            </Select>
                                                        </FormControl>

                                                        <TextField
                                                            size="small"
                                                            label="From"
                                                            type="date"
                                                            value={postDateFrom}
                                                            onChange={(e) => setPostDateFrom(e.target.value)}
                                                            InputLabelProps={{ shrink: true }}
                                                            sx={{ ...PROFILE_CONTROL_SX, '& .MuiInputBase-input': { fontSize: 13 } }}
                                                        />
                                                        <TextField
                                                            size="small"
                                                            label="To"
                                                            type="date"
                                                            value={postDateTo}
                                                            onChange={(e) => setPostDateTo(e.target.value)}
                                                            InputLabelProps={{ shrink: true }}
                                                            sx={{ ...PROFILE_CONTROL_SX, '& .MuiInputBase-input': { fontSize: 13 } }}
                                                        />
                                                    </Box>
                                                </Box>

                                                {/* Feed – always visible */}
                                                <Box sx={{ minHeight: 280 }}>
                                                    <ContentFadeIn triggerKey={postSubTab}>
                                                        <Box key={`post-subtab-${postSubTab}`}>
                                                            {postSubTab === 1 ? (
                                                                postEngagementLoading ? (<PulsingDots />) : (() => {
                                                                    const q = localPostSearch.trim().toLowerCase();
                                                                    // Apply moderation + privacy filtering first
                                                                    const moderatedComments = postEngagementComments.filter((item) => engFilterItem(item, true));
                                                                    let visibleComments = q
                                                                        ? moderatedComments.filter((item) => {
                                                                            const post0 = item?.post || item;
                                                                            const body = String(post0?.body || post0?.content || post0?.title || '').toLowerCase();
                                                                            const commentText = String(item?.comment?.content || item?.comment?.text || item?.comment?.body || '').toLowerCase();
                                                                            return body.includes(q) || commentText.includes(q);
                                                                        })
                                                                        : [...moderatedComments];
                                                                    // Apply date filters to comments
                                                                    if (postDateFrom) { const from = new Date(postDateFrom); from.setHours(0, 0, 0, 0); visibleComments = visibleComments.filter((item) => { const c = item?.comment || item; const d = new Date(c?.created_at || c?.createdAt || 0); return d >= from; }); }
                                                                    if (postDateTo) { const to = new Date(postDateTo); to.setHours(23, 59, 59, 999); visibleComments = visibleComments.filter((item) => { const c = item?.comment || item; const d = new Date(c?.created_at || c?.createdAt || 0); return d <= to; }); }
                                                                    if (visibleComments.length === 0) {
                                                                        return (
                                                                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, py: 6 }}>
                                                                                <ChatBubbleOutlineIcon sx={{ fontSize: 48, color: "primary.main" }} />
                                                                                <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "primary.main" }}>{q ? 'No comments match your search' : 'No current activity'}</Typography>
                                                                                <Typography color="text.secondary" sx={{ fontSize: "0.82rem", textAlign: "center", maxWidth: 300 }}>
                                                                                    {q ? 'Try adjusting your search.' : (canManage && isOnArtistProfile ? "You haven't commented on any posts yet." : "This artist hasn't commented on any posts yet.")}
                                                                                </Typography>
                                                                            </Box>
                                                                        );
                                                                    }

                                                                    // Group comments by post (matching BusinessEngagementTabs pattern)
                                                                    const groupMap = new Map();
                                                                    const groupOrder = [];
                                                                    visibleComments.forEach((item) => {
                                                                        const post0 = item?.post || {};
                                                                        const comment = item?.comment || item;
                                                                        const pid = Number(post0?.id || comment?.post_id || 0);
                                                                        if (!pid) return;
                                                                        if (!groupMap.has(pid)) {
                                                                            groupMap.set(pid, { post: post0, comments: [] });
                                                                            groupOrder.push(pid);
                                                                        }
                                                                        groupMap.get(pid).comments.push(comment);
                                                                    });

                                                                    // Sort groups (respecting sort direction)
                                                                    groupOrder.sort((a, b) => {
                                                                        if (postSortBy === 'popular') {
                                                                            const pa = groupMap.get(a)?.post || {};
                                                                            const pb = groupMap.get(b)?.post || {};
                                                                            const la = Number(pb?.likesCount || pb?.likes_count || pb?.like_count || 0) - Number(pa?.likesCount || pa?.likes_count || pa?.like_count || 0);
                                                                            if (la !== 0) return la;
                                                                        }
                                                                        const ca = groupMap.get(a)?.comments || [];
                                                                        const cb = groupMap.get(b)?.comments || [];
                                                                        const latestA = Math.max(...ca.map((c) => new Date(c?.created_at || c?.createdAt || 0).getTime()));
                                                                        const latestB = Math.max(...cb.map((c) => new Date(c?.created_at || c?.createdAt || 0).getTime()));
                                                                        return latestB - latestA;
                                                                    });

                                                                    const truncate = (t, n) => {
                                                                        const s = String(t || '').trim();
                                                                        return s.length > n ? `${s.slice(0, n)}…` : s;
                                                                    };

                                                                    return (
                                                                        <Box sx={{ display: 'grid', gap: 2, p: { xs: 1.25, sm: 2 } }}>
                                                                            {groupOrder.map((pid) => {
                                                                                const g = groupMap.get(pid);
                                                                                const post0 = g.post;
                                                                                const cmts = g.comments;
                                                                                const total = cmts.length;
                                                                                const postTitle = truncate(post0?.title || post0?.body || 'Post', 80);
                                                                                const postAuthorName = post0?.artist_name || post0?.business_name || post0?.post_author_name || [post0?.first_name, post0?.last_name].filter(Boolean).join(' ') || post0?.handle || 'Someone';
                                                                                const postHandle = post0?.handle || post0?.artist_handle || post0?.business_slug || '';
                                                                                const postAuthorAvatar = post0?.avatar_url || post0?.profile_picture || post0?.artist_avatar_url || post0?.business_avatar_url || '';
                                                                                const postAuthorVerified = Boolean(post0?.is_verified);
                                                                                const postCategory = post0?.category || '';
                                                                                const postAuthorAccountType = (() => {
                                                                                    const cat = String(postCategory).toLowerCase();
                                                                                    if (cat === 'business_post' || cat === 'business') return 'business';
                                                                                    if (cat === 'artist_post' || cat === 'artist') return 'artist';
                                                                                    return 'user';
                                                                                })();

                                                                                return (
                                                                                    <Box
                                                                                        key={`comment-group-${pid}`}
                                                                                        onClick={() => {
                                                                                            setPostScrollToCommentId(null);
                                                                                            setPostHighlightCommentId(null);
                                                                                            openPreviewPost(post0);
                                                                                        }}
                                                                                        sx={(t) => ({
                                                                                            border: '1px solid',
                                                                                            borderColor: alpha(t.palette.text.primary, 0.10),
                                                                                            borderRadius: 2,
                                                                                            bgcolor: 'background.paper',
                                                                                            overflow: 'hidden',
                                                                                            cursor: 'pointer',
                                                                                            boxShadow: `0 10px 26px ${alpha(t.palette.text.primary, 0.08)}`,
                                                                                            '&:hover': { borderColor: t.palette.primary.main },
                                                                                        })}
                                                                                    >
                                                                                        {/* Post header with gradient */}
                                                                                        <Box
                                                                                            sx={(t) => ({
                                                                                                px: 1.5,
                                                                                                py: 1,
                                                                                                display: 'flex',
                                                                                                alignItems: 'center',
                                                                                                justifyContent: 'space-between',
                                                                                                gap: 1,
                                                                                                background: `linear-gradient(90deg, ${alpha(
                                                                                                    t.custom?.brand?.brass || '#A87822',
                                                                                                    0.14
                                                                                                )} 0%, ${alpha(t.palette.background.paper, 0)} 75%)`,
                                                                                                borderBottom: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                                                                                            })}
                                                                                        >
                                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                                                                                                <AccountAvatar
                                                                                                    src={postAuthorAvatar}
                                                                                                    alt={postAuthorName}
                                                                                                    accountType={postAuthorAccountType}
                                                                                                    size={38}
                                                                                                    sx={(t) => ({
                                                                                                        border: '2px solid',
                                                                                                        borderColor: alpha(t.palette.text.primary, 0.06),
                                                                                                    })}
                                                                                                />
                                                                                                <Box sx={{ minWidth: 0 }}>
                                                                                                    <Typography sx={{ fontWeight: 900 }} noWrap title={String(post0?.title || '')}>
                                                                                                        {postTitle}
                                                                                                    </Typography>
                                                                                                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                                                                                        {postAuthorName}
                                                                                                        {postAuthorVerified && <VerifiedRoundedIcon sx={{ fontSize: 13, color: 'primary.main' }} />}
                                                                                                        {postHandle && postAuthorName !== postHandle ? ` @${postHandle.replace(/^@/, '')}` : ''}
                                                                                                    </Typography>
                                                                                                </Box>
                                                                                            </Box>

                                                                                            {/* Comment count chip */}
                                                                                            <Box
                                                                                                sx={(t) => ({
                                                                                                    display: 'inline-flex',
                                                                                                    alignItems: 'center',
                                                                                                    gap: 0.4,
                                                                                                    px: 0.75,
                                                                                                    py: 0.25,
                                                                                                    borderRadius: 999,
                                                                                                    bgcolor: alpha(t.palette.primary.main, 0.08),
                                                                                                    border: '1px solid',
                                                                                                    borderColor: alpha(t.palette.primary.main, 0.2),
                                                                                                    flexShrink: 0,
                                                                                                })}
                                                                                            >
                                                                                                <ChatBubbleOutlineIcon sx={{ fontSize: 13, color: 'primary.main' }} />
                                                                                                <Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'primary.main', whiteSpace: 'nowrap' }}>
                                                                                                    {total} comment{total !== 1 ? 's' : ''}
                                                                                                </Typography>
                                                                                            </Box>
                                                                                        </Box>

                                                                                        {/* Individual comment rows */}
                                                                                        <Box sx={{ px: 1.5, py: 1.25, display: 'grid', gap: 1 }}>
                                                                                            {cmts.slice(0, 3).map((c, ci) => {
                                                                                                const cText = String(c?.content || c?.body || c?.text || '').trim();
                                                                                                const isReply = Boolean(c?.parent_id || c?.parentId);
                                                                                                const cTime = c?.created_at || c?.createdAt || '';
                                                                                                // Use the artist's avatar/name/handle
                                                                                                const cAvatar = avatarSrc || undefined;
                                                                                                const cName = name;
                                                                                                const cHandle = displayHandle || artistHandle || '';
                                                                                                const cCommentId = Number(c?.comment_id || c?.id || 0) || null;

                                                                                                return (
                                                                                                    <Box
                                                                                                        key={c?.id || c?.comment_id || ci}
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            setPostScrollToCommentId(cCommentId);
                                                                                                            setPostHighlightCommentId(cCommentId);
                                                                                                            openPreviewPost(post0);
                                                                                                        }}
                                                                                                        sx={(t) => ({
                                                                                                            border: '1px solid',
                                                                                                            borderColor: alpha(t.palette.text.primary, 0.08),
                                                                                                            borderRadius: 2,
                                                                                                            px: 1.25,
                                                                                                            py: 1,
                                                                                                            bgcolor: alpha(t.palette.primary.main, 0.02),
                                                                                                            cursor: 'pointer',
                                                                                                            '&:hover': { borderColor: alpha(t.palette.primary.main, 0.32) },
                                                                                                        })}
                                                                                                    >
                                                                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                                                                                                <Avatar
                                                                                                                    src={cAvatar}
                                                                                                                    alt={cName}
                                                                                                                    imgProps={{ referrerPolicy: 'no-referrer' }}
                                                                                                                    sx={(t) => ({
                                                                                                                        width: 34, height: 34, flexShrink: 0,
                                                                                                                        bgcolor: alpha(t.palette.primary.main, 0.08),
                                                                                                                        color: t.palette.primary.main,
                                                                                                                        border: '1.5px solid',
                                                                                                                        borderColor: alpha(t.palette.text.primary, 0.06),
                                                                                                                        '& .MuiAvatar-img': { objectFit: 'cover', transform: 'scale(1.15)' },
                                                                                                                    })}
                                                                                                                >
                                                                                                                    {isVisualArtist ? <PaletteRoundedIcon sx={{ fontSize: 18 }} /> : <MusicNoteRoundedIcon sx={{ fontSize: 18 }} />}
                                                                                                                </Avatar>
                                                                                                                <Box sx={{ minWidth: 0 }}>
                                                                                                                    <Typography variant="body2" sx={{ fontWeight: 900, lineHeight: 1.1 }} noWrap title={cName}>
                                                                                                                        {cName}
                                                                                                                    </Typography>
                                                                                                                    <Typography variant="caption" color="text.secondary" noWrap>
                                                                                                                        {cHandle ? `@${cHandle.replace(/^@/, '')}` : ''}
                                                                                                                        {isReply ? ' • Reply' : ''}
                                                                                                                    </Typography>
                                                                                                                </Box>
                                                                                                            </Box>
                                                                                                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                                                                                                {cTime ? formatRelativeTime(cTime) : ''}
                                                                                                            </Typography>
                                                                                                        </Box>
                                                                                                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                                                                                                            {truncate(cText, 260)}
                                                                                                        </Typography>
                                                                                                        {/* Comment photos */}
                                                                                                        {(() => {
                                                                                                            const cImages = Array.isArray(c?.images) ? c.images.filter(Boolean) : (c?.image ? [c.image] : []);
                                                                                                            if (cImages.length === 0) return null;
                                                                                                            return (
                                                                                                                <Box sx={{ display: 'flex', gap: 0.75, mt: 0.75, flexWrap: 'wrap' }}>
                                                                                                                    {cImages.slice(0, 4).map((imgUrl, imgIdx) => (
                                                                                                                        <Box
                                                                                                                            key={imgIdx}
                                                                                                                            component="img"
                                                                                                                            src={imgUrl}
                                                                                                                            alt={`comment photo ${imgIdx + 1}`}
                                                                                                                            referrerPolicy="no-referrer"
                                                                                                                            sx={(t) => ({
                                                                                                                                width: cImages.length === 1 ? 120 : 64,
                                                                                                                                height: cImages.length === 1 ? 120 : 64,
                                                                                                                                borderRadius: 1.5,
                                                                                                                                objectFit: 'cover',
                                                                                                                                border: '1px solid',
                                                                                                                                borderColor: alpha(t.palette.text.primary, 0.1),
                                                                                                                                cursor: 'pointer',
                                                                                                                            })}
                                                                                                                        />
                                                                                                                    ))}
                                                                                                                </Box>
                                                                                                            );
                                                                                                        })()}
                                                                                                    </Box>
                                                                                                );
                                                                                            })}

                                                                                            {total > 3 && (
                                                                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                                                                                                    View all comments on this post
                                                                                                </Typography>
                                                                                            )}
                                                                                        </Box>
                                                                                    </Box>
                                                                                );
                                                                            })}
                                                                        </Box>
                                                                    );
                                                                })()
                                                            ) : postSubTab === 2 || postSubTab === 3 ? (
                                                                postEngagementLoading ? (<PulsingDots />) : (() => {
                                                                    let rawItems = postSubTab === 2 ? postEngagementLikes : postEngagementReposts;
                                                                    // Apply moderation + privacy filtering
                                                                    rawItems = rawItems.filter((p) => engFilterItem(p, false));
                                                                    const q = localPostSearch.trim().toLowerCase();
                                                                    let items = q
                                                                        ? rawItems.filter((p) => {
                                                                            const body = String(p?.body || p?.content || p?.title || '').toLowerCase();
                                                                            const author = String(p?.first_name || '').toLowerCase() + ' ' + String(p?.last_name || '').toLowerCase();
                                                                            const handle = String(p?.handle || '').toLowerCase();
                                                                            return body.includes(q) || author.includes(q) || handle.includes(q);
                                                                        })
                                                                        : [...rawItems];
                                                                    // Apply date filters
                                                                    if (postDateFrom) { const from = new Date(postDateFrom); from.setHours(0, 0, 0, 0); items = items.filter((p) => { const d = new Date(p?.created_at || p?.createdAt || p?.liked_at || p?.reposted_at || 0); return d >= from; }); }
                                                                    if (postDateTo) { const to = new Date(postDateTo); to.setHours(23, 59, 59, 999); items = items.filter((p) => { const d = new Date(p?.created_at || p?.createdAt || p?.liked_at || p?.reposted_at || 0); return d <= to; }); }
                                                                    // Apply sort
                                                                    const _engTs = (p) => new Date(p?.liked_at || p?.reposted_at || p?.created_at || p?.createdAt || 0);
                                                                    if (postSortBy === 'popular') {
                                                                        items.sort((a, b) => {
                                                                            const la = Number(b?.likesCount || b?.likes_count || b?.like_count || 0) - Number(a?.likesCount || a?.likes_count || a?.like_count || 0);
                                                                            if (la !== 0) return la;
                                                                            return _engTs(b) - _engTs(a);
                                                                        });
                                                                    } else {
                                                                        items.sort((a, b) => _engTs(b) - _engTs(a));
                                                                    }
                                                                    if (items.length === 0) {
                                                                        return (
                                                                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, py: 6 }}>
                                                                                {postSubTab === 2 ? <FavoriteIcon sx={{ fontSize: 48, color: "primary.main" }} /> : <RepeatIcon sx={{ fontSize: 48, color: "primary.main" }} />}
                                                                                <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "primary.main" }}>{q ? 'No results match your search' : 'No current activity'}</Typography>
                                                                                <Typography color="text.secondary" sx={{ fontSize: "0.82rem", textAlign: "center", maxWidth: 300 }}>
                                                                                    {q ? 'Try adjusting your search.' : (postSubTab === 2
                                                                                            ? (canManage && isOnArtistProfile ? "You haven't liked any posts yet." : "This artist hasn't liked any posts yet.")
                                                                                            : (canManage && isOnArtistProfile ? "You haven't reposted any posts yet." : "This artist hasn't reposted any posts yet.")
                                                                                    )}
                                                                                </Typography>
                                                                            </Box>
                                                                        );
                                                                    }
                                                                    return (<Box data-flat-posts="1" sx={{ display: "flex", flexDirection: "column", gap: 0 }}><style>{`
                                                            [data-flat-posts] [data-post-id],
                                                            [data-flat-posts] [data-post-id][class],
                                                            [data-flat-posts] [data-business-post-id],
                                                            [data-flat-posts] [data-business-post-id][class],
                                                            [data-flat-posts] .MuiCard-root[data-post-id],
                                                            [data-flat-posts] .MuiPaper-root[data-post-id],
                                                            [data-flat-posts] .MuiCard-root[data-business-post-id],
                                                            [data-flat-posts] .MuiPaper-root[data-business-post-id],
                                                            [data-flat-posts] .MuiCard-root.MuiCard-root[data-post-id],
                                                            [data-flat-posts] .MuiPaper-root.MuiPaper-root[data-post-id],
                                                            [data-flat-posts] .MuiCard-root.MuiCard-root[data-business-post-id],
                                                            [data-flat-posts] .MuiPaper-root.MuiPaper-root[data-business-post-id] {
                                                                box-shadow: none !important;
                                                                border: none !important;
                                                                border-radius: 0 !important;
                                                                transform: none !important;
                                                                transition: none !important;
                                                                min-height: auto !important;
                                                                background-image: none !important;
                                                                background-color: transparent !important;
                                                                background: transparent !important;
                                                                overflow: visible !important;
                                                                padding: 0 !important;
                                                                margin: 0 !important;
                                                                outline: none !important;
                                                            }
                                                            [data-flat-posts] [data-post-id]:hover,
                                                            [data-flat-posts] [data-post-id][class]:hover,
                                                            [data-flat-posts] [data-business-post-id]:hover,
                                                            [data-flat-posts] [data-business-post-id][class]:hover,
                                                            [data-flat-posts] .MuiCard-root[data-post-id]:hover,
                                                            [data-flat-posts] .MuiPaper-root[data-post-id]:hover,
                                                            [data-flat-posts] .MuiCard-root[data-business-post-id]:hover,
                                                            [data-flat-posts] .MuiPaper-root[data-business-post-id]:hover {
                                                                box-shadow: none !important;
                                                                transform: none !important;
                                                                background-color: transparent !important;
                                                                background: transparent !important;
                                                            }
                                                            [data-flat-posts] [data-post-id]::before,
                                                            [data-flat-posts] [data-post-id]::after,
                                                            [data-flat-posts] [data-business-post-id]::before,
                                                            [data-flat-posts] [data-business-post-id]::after {
                                                                display: none !important;
                                                            }
                                                            [data-flat-posts] [data-post-id] > .MuiCardActions-root,
                                                            [data-flat-posts] [data-business-post-id] > .MuiCardActions-root {
                                                                padding: 0 !important;
                                                                border: none !important;
                                                            }
                                                            [data-flat-posts] :has(> .post-loc-icon) {
                                                                width: fit-content !important;
                                                                max-width: fit-content !important;
                                                                margin-left: auto !important;
                                                            }
                                                            [data-flat-posts] [data-post-id] img[loading="lazy"][alt=""],
                                                            [data-flat-posts] [data-profile-post-id] img[loading="lazy"][alt=""],
                                                            [data-flat-posts] [data-business-post-id] img[loading="lazy"][alt=""] { display: none !important; }
                                                            [data-flat-posts] [data-post-id] .MuiBox-root:has(> .MuiBox-root > img[loading="lazy"][alt=""]),
                                                            [data-flat-posts] [data-profile-post-id] .MuiBox-root:has(> .MuiBox-root > img[loading="lazy"][alt=""]),
                                                            [data-flat-posts] [data-business-post-id] .MuiBox-root:has(> .MuiBox-root > img[loading="lazy"][alt=""]) { display: none !important; }
                                                            [data-flat-posts] [data-profile-post-id] .MuiBox-root:has(> .MuiBox-root > img[loading="lazy"]) { display: none !important; }
                                                            [data-flat-posts] [data-business-post-id] > .MuiBox-root,
                                                            [data-flat-posts] [data-profile-post-id] > .MuiCard-root > .MuiBox-root,
                                                            [data-flat-posts] [data-profile-post-id] > .MuiPaper-root > .MuiBox-root {
                                                                padding-left: 0 !important;
                                                                padding-right: 0 !important;
                                                                padding-top: 0 !important;
                                                            }
                                                            [data-flat-posts] [data-business-post-id] > .MuiCardActions-root,
                                                            [data-flat-posts] [data-profile-post-id] > .MuiCard-root > .MuiCardActions-root,
                                                            [data-flat-posts] [data-profile-post-id] > .MuiPaper-root > .MuiCardActions-root,
                                                            [data-flat-posts] [data-profile-post-id] .MuiCardActions-root {
                                                                padding-left: 0 !important;
                                                                padding-right: 0 !important;
                                                                padding-bottom: 0 !important;
                                                                border-top: none !important;
                                                                margin-top: 0 !important;
                                                            }
                                                            [data-flat-posts] .ll-author-link,
                                                            [data-flat-posts] [data-profile-post-id] .ll-author-link {
                                                                width: fit-content !important;
                                                                max-width: fit-content !important;
                                                                flex: 0 1 auto !important;
                                                            }
                                                            /* Restore MusicPostCardItem inner padding — prevents body text flush-left */
                                                            [data-flat-posts] .music-post-card > .MuiBox-root {
                                                                padding-left: 16px !important;
                                                                padding-right: 16px !important;
                                                            }
                                                            [data-flat-posts] .music-post-card > .MuiCardActions-root {
                                                                padding-left: 16px !important;
                                                                padding-right: 16px !important;
                                                            }
                                                        `}</style>{items.map((p) => {
                                                                        const pId = Number(p?.id || 0);
                                                                        const pType = String(p?.postType || p?.post_type || '').toLowerCase();
                                                                        const pCat = String(p?.category || '').toLowerCase();
                                                                        const isArtistPost = pType === 'artist' || pCat === 'artist_post';
                                                                        const isBusinessPost = pType === 'business' || pCat === 'business_post';
                                                                        // Check if this post belongs to the current artist (don't show user card for own posts)
                                                                        const isOwnPost = isArtistPost && (
                                                                            Number(p?.artist_id || p?.artistId) === Number(artist?.id) ||
                                                                            String(p?.artist_handle || p?.artistHandle || '').toLowerCase() === String(displayHandle || artistHandle || '').toLowerCase()
                                                                        );
                                                                        const urls = extractMediaUrls(p);
                                                                        const photoGrid = urls.length > 0 ? <ArtistEngagementPhotoGrid mediaUrls={urls} onOpenLightbox={(idx) => { setEngLightboxUrls(urls); setEngLightboxIdx(idx); setEngLightboxOpen(true); }} /> : null;
                                                                        const wrapSx = (t) => ({ borderBottom: "1px solid", borderColor: alpha(t.palette.text.primary, 0.08), "&:last-child": { borderBottom: "none" }, py: 2.5, px: { xs: 2, sm: 3 }, cursor: "pointer", transition: `background-color ${t.custom?.motion?.base || 180}ms ease`, overflow: "hidden", "&:hover": { bgcolor: alpha(t.palette.text.primary, 0.03) }, "& .MuiPaper-root, & > .MuiBox-root": { bgcolor: "transparent !important", boxShadow: "none !important" } });
                                                                        const handleWrapClick = (e) => { if (e.target?.closest?.('.MuiIconButton-root, [role="menuitem"], [role="button"], .MuiMenuItem-root, a[href], .MuiChip-root, .ll-author-link')) return; openPreviewPost(p); };

                                                                        if (isArtistPost) {
                                                                            return (
                                                                                <Box key={`pe-${pId}`} data-profile-post-id={String(pId)} onClick={handleWrapClick} sx={wrapSx}>
                                                                                    <MusicPostCardItem post={p} user={user} hoveredId={null} setHoveredId={() => {}} onCardClick={() => openPreviewPost(p)} onOpenUserCard={isOwnPost ? () => {} : handleEngOpenUserCard} renderBeforeActions={photoGrid} />
                                                                                </Box>
                                                                            );
                                                                        }
                                                                        if (isBusinessPost) {
                                                                            return (
                                                                                <Box key={`pe-${pId}`} data-profile-post-id={String(pId)} onClick={handleWrapClick} sx={wrapSx}>
                                                                                    <BusinessPostCard post={p} user={user} hoveredId={null} setHoveredId={() => {}} onCardClick={() => openPreviewPost(p)} onOpenUserCard={handleEngOpenUserCard} renderBeforeActions={photoGrid} />
                                                                                </Box>
                                                                            );
                                                                        }
                                                                        return (
                                                                            <Box key={`pe-${pId}`} data-profile-post-id={String(pId)} onClick={handleWrapClick} sx={wrapSx}>
                                                                                <ProfilePostCard post={p} user={user} hoveredId={null} setHoveredId={() => {}} onCardClick={() => openPreviewPost(p)} onEditPost={() => {}} onDeletePost={() => {}} onOpenUserCard={handleEngOpenUserCard} onOpenShare={() => {}} previewLineClamp={4} disableHover renderBeforeActions={photoGrid} />
                                                                            </Box>
                                                                        );
                                                                    })}</Box>);
                                                                })()
                                                            ) : (
                                                                (() => {
                                                                    let dateFilteredPosts = posts;
                                                                    // Apply search filter
                                                                    const q = localPostSearch.trim().toLowerCase();
                                                                    if (q) {
                                                                        dateFilteredPosts = dateFilteredPosts.filter(p => {
                                                                            const title = String(p?.title || '').toLowerCase();
                                                                            const body = String(p?.body || p?.content || '').toLowerCase();
                                                                            return title.includes(q) || body.includes(q);
                                                                        });
                                                                    }
                                                                    // Apply date filters
                                                                    if (postDateFrom) { const from = new Date(postDateFrom); from.setHours(0, 0, 0, 0); dateFilteredPosts = dateFilteredPosts.filter(p => new Date(p.createdAt || p.created_at || 0) >= from); }
                                                                    if (postDateTo) { const to = new Date(postDateTo); to.setHours(23, 59, 59, 999); dateFilteredPosts = dateFilteredPosts.filter(p => new Date(p.createdAt || p.created_at || 0) <= to); }
                                                                    // Apply client-side sort (matches BusinessEngagementTabs)
                                                                    if (postSortBy === 'popular') {
                                                                        dateFilteredPosts = [...dateFilteredPosts].sort((a, b) => {
                                                                            const la = Number(b?.likesCount || b?.likes_count || b?.like_count || b?.likeCount || 0) - Number(a?.likesCount || a?.likes_count || a?.like_count || a?.likeCount || 0);
                                                                            if (la !== 0) return la;
                                                                            return new Date(b?.createdAt || b?.created_at || 0) - new Date(a?.createdAt || a?.created_at || 0);
                                                                        });
                                                                    } else {
                                                                        dateFilteredPosts = [...dateFilteredPosts].sort((a, b) => new Date(b?.createdAt || b?.created_at || 0) - new Date(a?.createdAt || a?.created_at || 0));
                                                                    }
                                                                    return postsLoading ? (<PulsingDots />) : dateFilteredPosts.length > 0 ? (<>{dateFilteredPosts.map((post) => (<ArtistPostCard key={post.id} post={post} canManage={canManage && isOnArtistProfile} onPin={handlePinPost} onUnpin={handleUnpinPost} onEdit={handleEditPost} onDelete={handleDeletePost} artistName={name} artistAvatar={avatarSrc} artistId={artist?.id} artistHandle={displayHandle || artistHandle} user={user} activeTab={activeTab} onPreview={openPreviewPost} profileType={isVisualArtist ? "artist" : "music"} />))}{postsLoadingMore && <PulsingDots sx={{ py: 3 }} />}{postsHasMore && !postsLoadingMore && <Box ref={postsLoadMoreRef} sx={{ height: 1 }} />}</>) : (<Box sx={{ textAlign: "center", py: 6 }}><ArticleRoundedIcon sx={{ fontSize: 56, color: "primary.main", mb: 1.5 }} /><Typography variant="h6" fontWeight={700} sx={{ mb: 0.5, color: "primary.main" }}>{q || postDateFrom || postDateTo ? 'No posts match your filters' : 'No posts yet'}</Typography><Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320, mx: "auto", mb: canManage ? 2.5 : 0 }}>{q || postDateFrom || postDateTo ? 'Try adjusting your filters or search.' : (canManage ? "Share updates, deals, and announcements with your followers." : `${name} hasn't posted anything yet. Check back later!`)}</Typography>{canManage && isOnArtistProfile && !q && !postDateFrom && !postDateTo && (<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={handleOpenCreatePost} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>Create First Post</Button>)}</Box>);
                                                                })()
                                                            )}
                                                        </Box>
                                                    </ContentFadeIn>
                                                </Box>
                                            </>
                                        )}

                                        {/* ══════ EVENTS CONTENT (below sticky) ══════ */}
                                        {engagementMode === "events" && (
                                            <>
                                                {/* Search bar + Clear filters — always visible across all event sub-tabs (matches BusinessPublicPage EventsSubTabs) */}
                                                <Box sx={{ px: 1.5, pt: 1.25, pb: 0.5, bgcolor: 'background.paper', zIndex: 7 }}>
                                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.75 }}>
                                                        <SearchInput
                                                            placeholder={eventSubTab === 0 ? 'Search events…' : eventSubTab === 1 ? 'Search comments…' : eventSubTab === 2 ? 'Search likes…' : 'Search reposts…'}
                                                            value={eventSearchQuery}
                                                            onChange={(e) => setEventSearchQuery(e?.target?.value ?? '')}
                                                            onSearch={() => setCommittedEventSearchQuery(eventSearchQuery.trim())}
                                                            onClear={() => { setEventSearchQuery(''); setCommittedEventSearchQuery(''); }}
                                                            inputProps={{ name: 'll-artist-events-search' }}
                                                        />
                                                        <Tooltip title="Clear all filters" arrow>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => {
                                                                    setEventSearchQuery(''); setCommittedEventSearchQuery('');
                                                                    setEventViewMode('posted');
                                                                    setEventFilterRange('all');
                                                                    setEventDateFrom(''); setEventDateTo('');
                                                                }}
                                                                sx={(t) => ({
                                                                    width: 36, height: 36, flexShrink: 0,
                                                                    borderRadius: 999,
                                                                    border: '1px solid',
                                                                    borderColor: alpha(t.palette.primary.main, 0.12),
                                                                    bgcolor: alpha(t.palette.text.primary, 0.03),
                                                                    '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.06), borderColor: alpha(t.palette.primary.main, 0.18) },
                                                                })}
                                                                aria-label="Clear filters"
                                                            >
                                                                <RestartAltRoundedIcon sx={{ fontSize: 18 }} />
                                                            </IconButton>
                                                        </Tooltip>

                                                    </Stack>

                                                    {/* Filter dropdowns — View mode on Events sub-tab, date pickers on all */}
                                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: eventSubTab === 0 ? '1fr 1fr 1fr' : '1fr 1fr' }, gap: 1, pb: 0.75 }}>
                                                        {eventSubTab === 0 && (
                                                            <FormControl size="small" fullWidth sx={PROFILE_CONTROL_SX}>
                                                                <InputLabel shrink>View</InputLabel>
                                                                <Select label="View" value={eventViewMode} onChange={(e) => { setEventViewMode(e.target.value); setEventDateFrom(''); setEventDateTo(''); }} MenuProps={profileMenuProps}>
                                                                    <MenuItem value="posted">All</MenuItem>
                                                                    <MenuItem value="going">Going</MenuItem>
                                                                    <MenuItem value="interested">Interested</MenuItem>
                                                                </Select>
                                                            </FormControl>
                                                        )}
                                                        <TextField
                                                            size="small"
                                                            type="date"
                                                            label="From"
                                                            InputLabelProps={{ shrink: true }}
                                                            value={eventDateFrom}
                                                            onChange={(e) => setEventDateFrom(e.target.value || '')}
                                                            sx={{
                                                                ...PROFILE_CONTROL_SX,
                                                                '& .MuiInputBase-input': { fontSize: 13 },
                                                            }}
                                                        />
                                                        <TextField
                                                            size="small"
                                                            type="date"
                                                            label="To"
                                                            InputLabelProps={{ shrink: true }}
                                                            value={eventDateTo}
                                                            onChange={(e) => setEventDateTo(e.target.value || '')}
                                                            sx={{
                                                                ...PROFILE_CONTROL_SX,
                                                                '& .MuiInputBase-input': { fontSize: 13 },
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>

                                                {/* Events content area */}
                                                <Box sx={{ p: { xs: 2, sm: 3 }, minHeight: 280 }}>
                                                    <ContentFadeIn triggerKey={eventSubTab}>
                                                        {/* ── Comments sub-tab ── */}
                                                        {eventSubTab === 1 ? (
                                                            eventCommentsLoading ? (<PulsingDots />) : eventEngagementComments.length === 0 ? (
                                                                <Box sx={{ textAlign: "center", py: 6 }}>
                                                                    <ChatBubbleOutlineIcon sx={{ fontSize: 56, color: "primary.main", mb: 1.5 }} />
                                                                    <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5, color: "primary.main" }}>No current activity</Typography>
                                                                    <Typography variant="body2" color="text.secondary">{canManage ? "You haven't commented on any events yet." : `${name} hasn't commented on any events yet.`}</Typography>
                                                                </Box>
                                                            ) : (() => {
                                                                // Filter comments by search
                                                                let filteredEvtComments = eventEngagementComments;
                                                                if (committedEventSearchQuery) {
                                                                    const q = committedEventSearchQuery.toLowerCase();
                                                                    filteredEvtComments = filteredEvtComments.filter((group) => {
                                                                        const ev = group?.event || {};
                                                                        const comments = Array.isArray(group?.comments) ? group.comments : [];
                                                                        return String(ev?.title || '').toLowerCase().includes(q) ||
                                                                            comments.some((c) => String(c?.content || '').toLowerCase().includes(q));
                                                                    });
                                                                }
                                                                // Apply date filters to event comments
                                                                if (eventDateFrom) {
                                                                    const from = new Date(eventDateFrom); from.setHours(0, 0, 0, 0);
                                                                    filteredEvtComments = filteredEvtComments.filter((group) => {
                                                                        const comments = Array.isArray(group?.comments) ? group.comments : [];
                                                                        return comments.some((c) => new Date(c?.created_at || c?.createdAt || 0) >= from);
                                                                    });
                                                                }
                                                                if (eventDateTo) {
                                                                    const to = new Date(eventDateTo); to.setHours(23, 59, 59, 999);
                                                                    filteredEvtComments = filteredEvtComments.filter((group) => {
                                                                        const comments = Array.isArray(group?.comments) ? group.comments : [];
                                                                        return comments.some((c) => new Date(c?.created_at || c?.createdAt || 0) <= to);
                                                                    });
                                                                }
                                                                if (filteredEvtComments.length === 0) {
                                                                    return (
                                                                        <Box sx={{ textAlign: "center", py: 6 }}>
                                                                            <ChatBubbleOutlineIcon sx={{ fontSize: 56, color: "primary.main", mb: 1.5 }} />
                                                                            <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5, color: "primary.main" }}>No comments match your filters</Typography>
                                                                            <Typography variant="body2" color="text.secondary">Try adjusting your search or date range.</Typography>
                                                                        </Box>
                                                                    );
                                                                }
                                                                const ecTruncate = (t, n) => { const s0 = String(t || '').trim(); return s0.length > n ? `${s0.slice(0, n)}…` : s0; };
                                                                return (
                                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                                                        {filteredEvtComments.map((group) => {
                                                                            const ev0 = group.event || {};
                                                                            const comments = Array.isArray(group.comments) ? group.comments : [];
                                                                            const total = comments.length;
                                                                            const latest = comments[0] || null;
                                                                            const eventPhoto = String(ev0?.mainPhotoUrl || ev0?.image_url || ev0?.photoUrl || '').trim();

                                                                            return (
                                                                                <Box
                                                                                    key={`ec-${ev0.id}`}
                                                                                    sx={(t) => ({
                                                                                        border: '1px solid',
                                                                                        borderColor: alpha(t.palette.text.primary, 0.10),
                                                                                        borderRadius: 2,
                                                                                        bgcolor: 'background.paper',
                                                                                        overflow: 'hidden',
                                                                                        cursor: 'pointer',
                                                                                        boxShadow: `0 4px 14px ${alpha(t.palette.text.primary, 0.06)}`,
                                                                                        '&:hover': { borderColor: t.palette.primary.main },
                                                                                    })}
                                                                                >
                                                                                    {/* Event header — gold gradient */}
                                                                                    <Box
                                                                                        onClick={() => openArtistEventComment({ _viewEventOnly: true }, ev0)}
                                                                                        sx={(t) => ({
                                                                                            px: 1.5,
                                                                                            py: 1,
                                                                                            display: 'flex',
                                                                                            alignItems: 'center',
                                                                                            justifyContent: 'space-between',
                                                                                            gap: 1,
                                                                                            background: `linear-gradient(90deg, ${alpha(t.custom?.brand?.brass || '#A87822', 0.14)} 0%, ${alpha(t.palette.background.paper, 0)} 75%)`,
                                                                                            borderBottom: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                                                                                        })}
                                                                                    >
                                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                                                                                            {eventPhoto ? (
                                                                                                <Avatar src={eventPhoto} alt={String(ev0?.title || '')} sx={{ width: 38, height: 38, flexShrink: 0 }} />
                                                                                            ) : (
                                                                                                <Avatar sx={(t) => ({ width: 38, height: 38, flexShrink: 0, bgcolor: t.palette.primary.light })}>
                                                                                                    <EventRoundedIcon sx={{ fontSize: 20, color: '#fff' }} />
                                                                                                </Avatar>
                                                                                            )}
                                                                                            <Box sx={{ minWidth: 0 }}>
                                                                                                <Typography sx={{ fontWeight: 900, fontSize: 14 }} noWrap title={String(ev0?.title || '')}>
                                                                                                    {String(ev0?.title || '').trim() || 'Event'}
                                                                                                </Typography>
                                                                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                                                                    {formatEventDate(ev0) || (latest?.created_at ? formatRelativeTime(latest.created_at) : '')}
                                                                                                </Typography>
                                                                                            </Box>
                                                                                        </Box>
                                                                                        {/* Comment count chip */}
                                                                                        <Box
                                                                                            sx={(t) => ({
                                                                                                display: 'inline-flex',
                                                                                                alignItems: 'center',
                                                                                                gap: 0.5,
                                                                                                px: 1.1,
                                                                                                py: 0.4,
                                                                                                borderRadius: 999,
                                                                                                border: `1px solid ${alpha(t.palette.primary.main, 0.16)}`,
                                                                                                bgcolor: alpha(t.palette.primary.main, 0.06),
                                                                                            })}
                                                                                        >
                                                                                            <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main' }}>
                                                                                                {total === 1 ? '1 comment' : `${total} comments`}
                                                                                            </Typography>
                                                                                        </Box>
                                                                                    </Box>

                                                                                    {/* Comment rows (up to 3) */}
                                                                                    <Box sx={{ px: 1.5, py: 1.25, display: 'grid', gap: 1 }}>
                                                                                        {comments.slice(0, 3).map((c) => {
                                                                                            const cText = String(c?.content || '').trim();
                                                                                            const isReply = !!c?.parent_id;
                                                                                            const cTime = c?.created_at || null;
                                                                                            const commentId = Number(c?.comment_id || c?.id || 0) || undefined;

                                                                                            const commenterAvatar = c?.account_avatar_url || c?.user_avatar || c?.avatar_url || c?.profile_picture || c?.profileImageUrl || c?.commenterAvatar || avatarSrc;
                                                                                            const commenterName = c?.account_name || c?.user_name || c?.commenter_name || c?.author_name || c?.name || (c?.first_name ? `${c.first_name}${c.last_name ? ` ${c.last_name}` : ''}`.trim() : '') || name;
                                                                                            const commenterHandle = c?.account_handle || c?.user_handle || c?.handle || c?.commenter_handle || (displayHandle || artistHandle ? String(displayHandle || artistHandle).replace(/^@+/, '') : '');

                                                                                            return (
                                                                                                <Box
                                                                                                    key={`ec-c-${c?.id || c?.comment_id || ''}`}
                                                                                                    onClick={(e) => { e.stopPropagation(); openArtistEventComment(c, ev0); }}
                                                                                                    sx={(t) => ({
                                                                                                        border: '1px solid',
                                                                                                        borderColor: alpha(t.palette.text.primary, 0.08),
                                                                                                        borderRadius: 2,
                                                                                                        px: 1.25,
                                                                                                        py: 1,
                                                                                                        bgcolor: alpha(t.palette.primary.main, 0.02),
                                                                                                        cursor: 'pointer',
                                                                                                        '&:hover': { borderColor: alpha(t.palette.primary.main, 0.32) },
                                                                                                    })}
                                                                                                >
                                                                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                                                                                            <Avatar
                                                                                                                src={commenterAvatar}
                                                                                                                alt={commenterName}
                                                                                                                imgProps={{ referrerPolicy: 'no-referrer' }}
                                                                                                                sx={(t) => ({
                                                                                                                    width: 34, height: 34, flexShrink: 0,
                                                                                                                    bgcolor: alpha(t.palette.primary.main, 0.08),
                                                                                                                    color: t.palette.primary.main,
                                                                                                                    border: '1.5px solid',
                                                                                                                    borderColor: alpha(t.palette.text.primary, 0.06),
                                                                                                                    '& .MuiAvatar-img': { objectFit: 'cover', transform: 'scale(1.15)' },
                                                                                                                })}
                                                                                                            >
                                                                                                                {isVisualArtist ? <PaletteRoundedIcon sx={{ fontSize: 18 }} /> : <MusicNoteRoundedIcon sx={{ fontSize: 18 }} />}
                                                                                                            </Avatar>
                                                                                                            <Box sx={{ minWidth: 0 }}>
                                                                                                                <Typography variant="body2" sx={{ fontWeight: 900, lineHeight: 1.1 }} noWrap>
                                                                                                                    {commenterName}
                                                                                                                </Typography>
                                                                                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                                                                                    {commenterHandle ? `@${commenterHandle}` : ''}
                                                                                                                    {isReply ? ' • Reply' : ''}
                                                                                                                </Typography>
                                                                                                            </Box>
                                                                                                        </Box>
                                                                                                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                                                                                            {cTime ? formatRelativeTime(cTime) : ''}
                                                                                                        </Typography>
                                                                                                    </Box>
                                                                                                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                                                                                                        {ecTruncate(cText, 260)}
                                                                                                    </Typography>
                                                                                                    {/* Comment photos */}
                                                                                                    {(() => {
                                                                                                        const cImages = Array.isArray(c?.images) ? c.images.filter(Boolean) : (c?.image ? [c.image] : []);
                                                                                                        if (cImages.length === 0) return null;
                                                                                                        return (
                                                                                                            <Box sx={{ display: 'flex', gap: 0.75, mt: 0.75, flexWrap: 'wrap' }}>
                                                                                                                {cImages.slice(0, 4).map((imgUrl, imgIdx) => (
                                                                                                                    <Box
                                                                                                                        key={imgIdx}
                                                                                                                        component="img"
                                                                                                                        src={imgUrl}
                                                                                                                        alt={`comment photo ${imgIdx + 1}`}
                                                                                                                        referrerPolicy="no-referrer"
                                                                                                                        sx={(t) => ({
                                                                                                                            width: cImages.length === 1 ? 120 : 64,
                                                                                                                            height: cImages.length === 1 ? 120 : 64,
                                                                                                                            borderRadius: 1.5,
                                                                                                                            objectFit: 'cover',
                                                                                                                            border: '1px solid',
                                                                                                                            borderColor: alpha(t.palette.text.primary, 0.1),
                                                                                                                            cursor: 'pointer',
                                                                                                                        })}
                                                                                                                    />
                                                                                                                ))}
                                                                                                            </Box>
                                                                                                        );
                                                                                                    })()}
                                                                                                </Box>
                                                                                            );
                                                                                        })}
                                                                                        {total > 3 && (
                                                                                            <Typography
                                                                                                variant="caption"
                                                                                                color="text.secondary"
                                                                                                sx={{ fontWeight: 800, cursor: 'pointer' }}
                                                                                                onClick={(e) => { e.stopPropagation(); openArtistEventComment({ _viewEventOnly: true }, ev0); }}
                                                                                            >
                                                                                                View all comments on this event
                                                                                            </Typography>
                                                                                        )}
                                                                                    </Box>
                                                                                </Box>
                                                                            );
                                                                        })}
                                                                    </Box>
                                                                );
                                                            })()
                                                        ) : (
                                                            /* ── Events / Likes / Reposts sub-tabs ── */
                                                            (() => {
                                                                const evtData = eventSubTab === 2 ? eventEngagementEvents : eventSubTab === 3 ? eventEngagementEvents : sortedArtistEvents;
                                                                const evtLoading = eventSubTab === 0
                                                                    ? (eventViewMode === 'going' ? artistGoingLoading : eventViewMode === 'interested' ? artistInterestedLoading : eventsLoading)
                                                                    : eventEngagementLoading;
                                                                // Search filter
                                                                let filteredEvts = evtData;
                                                                if (committedEventSearchQuery) {
                                                                    const q = committedEventSearchQuery.toLowerCase();
                                                                    filteredEvts = filteredEvts.filter((evt) =>
                                                                        String(evt?.title || '').toLowerCase().includes(q) ||
                                                                        String(evt?.description || '').toLowerCase().includes(q) ||
                                                                        String(evt?.category || '').toLowerCase().includes(q)
                                                                    );
                                                                }
                                                                // Apply date filters
                                                                if (eventDateFrom) {
                                                                    const from = new Date(eventDateFrom); from.setHours(0, 0, 0, 0);
                                                                    filteredEvts = filteredEvts.filter((evt) => {
                                                                        const d = new Date(evt?.startAt || evt?.start_at || evt?.created_at || evt?.createdAt || 0);
                                                                        return d >= from;
                                                                    });
                                                                }
                                                                if (eventDateTo) {
                                                                    const to = new Date(eventDateTo); to.setHours(23, 59, 59, 999);
                                                                    filteredEvts = filteredEvts.filter((evt) => {
                                                                        const d = new Date(evt?.startAt || evt?.start_at || evt?.created_at || evt?.createdAt || 0);
                                                                        return d <= to;
                                                                    });
                                                                }
                                                                return evtLoading ? (<PulsingDots />) : filteredEvts.length > 0 ? (
                                                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                                                                        {filteredEvts.map((evt) => (
                                                                            <EventCard key={evt.id} event={evt} onClick={() => handleEventClick(evt)} user={user} />
                                                                        ))}
                                                                    </Box>
                                                                ) : (
                                                                    <Box sx={{ textAlign: "center", py: 6 }}>
                                                                        {eventSubTab === 2 ? <FavoriteIcon sx={{ fontSize: 56, color: "primary.main", mb: 1.5 }} />
                                                                            : eventSubTab === 3 ? <RepeatIcon sx={{ fontSize: 56, color: "primary.main", mb: 1.5 }} />
                                                                                : <EventRoundedIcon sx={{ fontSize: 56, color: "primary.main", mb: 1.5 }} />}
                                                                        <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5, color: "primary.main" }}>
                                                                            {committedEventSearchQuery || eventDateFrom || eventDateTo ? 'No events match your filters'
                                                                                : eventSubTab === 2 ? 'No current activity'
                                                                                    : eventSubTab === 3 ? 'No current activity'
                                                                                        : eventViewMode === 'going' ? "Not going to any events"
                                                                                            : eventViewMode === 'interested' ? "Not interested in any events"
                                                                                                : "No events found"}
                                                                        </Typography>
                                                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.82rem" }}>
                                                                            {committedEventSearchQuery || eventDateFrom || eventDateTo ? 'Try adjusting your search or date range.'
                                                                                : eventSubTab === 2 ? (canManage ? "You haven't liked any events yet." : `${name} hasn't liked any events yet.`)
                                                                                    : eventSubTab === 3 ? (canManage ? "You haven't reposted any events yet." : `${name} hasn't reposted any events yet.`)
                                                                                        : eventViewMode === 'going' ? (canManage ? "You haven't RSVP'd to any events yet." : `${name} hasn't RSVP'd to any events yet.`)
                                                                                            : eventViewMode === 'interested' ? (canManage ? "You haven't marked any events as interested yet." : `${name} hasn't marked any events as interested yet.`)
                                                                                                : (canManage ? "You haven't posted any events yet." : `${name} hasn't posted any events yet.`)}
                                                                        </Typography>
                                                                    </Box>
                                                                );
                                                            })()
                                                        )}
                                                    </ContentFadeIn>
                                                </Box>


                                            </>
                                        )}

                                        {/* ══════ JOBS MODE ══════ */}
                                        {engagementMode === "jobs" && (
                                            <ArtistJobsSection
                                                artistId={artist?.id}
                                                user={user}
                                                activeAccount={activeAccount}
                                                canManage={canManage && isOnArtistProfile}
                                                onJobClick={setSelectedJobPopup}
                                                onEditJob={handleEditJob}
                                                onDeleteJob={(job) => setDeleteConfirmJob(job)}
                                                onRenewJob={handleRenewJob}
                                                refreshNonce={jobsRefreshNonce}
                                            />
                                        )}

                                        {/* ══════ SERVICES MODE ══════ */}
                                        {engagementMode === "services" && (
                                            <ArtistServicesSection
                                                artistId={artist?.id}
                                                ownerUserId={artist?.owner_user_id || artist?.ownerUserId}
                                                user={user}
                                                onServiceClick={setSelectedServicePopup}
                                                canManage={canManage && isOnArtistProfile}
                                                artistName={name}
                                            />
                                        )}
                                    </Paper>
                                </Box>
                            </Stack>
                        )}


                        {/* ============ EVENTS TAB (removed from main tabs) ============ */}
                        {activeTab === -1 && (
                            <ContentFadeIn triggerKey="events">
                                <Paper sx={{ overflow: "visible" }}>

                                    {/* Event sub-tabs — Events | Comments | Likes | Reposts */}
                                    <Box
                                        sx={{
                                            flexShrink: 0,
                                            borderBottom: '1px solid',
                                            borderColor: 'divider',
                                            bgcolor: 'transparent',
                                        }}
                                    >
                                        <Tabs
                                            value={eventSubTab}
                                            onChange={(_, v) => {
                                                setEventSubTab(v);
                                            }}
                                            variant="fullWidth"
                                            sx={(t) => ({
                                                ...getProfileSubTabsSx(t),
                                                minHeight: 44,
                                                backgroundColor: 'transparent',
                                                background: 'transparent',
                                                '& .MuiTab-root': {
                                                    ...getProfileSubTabsSx(t)['& .MuiTab-root'],
                                                    minHeight: 44,
                                                },
                                                '& .MuiTabs-indicator': { backgroundColor: t.palette.secondary.main },
                                                '& .MuiTab-root.Mui-selected': { color: t.palette.secondary.main },
                                            })}
                                        >
                                            <Tab icon={<EventRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Events" />
                                            <Tab icon={<ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Comments" />
                                            <Tab icon={<FavoriteIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Likes" />
                                            <Tab icon={<RepeatIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Reposts" />
                                        </Tabs>
                                    </Box>

                                    {/* Sticky header for events (only on Events sub-tab) */}
                                    <Collapse in={eventSubTab === 0} unmountOnExit={false} timeout={250}>
                                        <Box
                                            ref={eventsHeaderRef}
                                            sx={{
                                                p: { xs: 1.5, sm: 2 },
                                                position: "sticky",
                                                top: 0,
                                                zIndex: 10,
                                                bgcolor: "background.paper",
                                                borderBottom: "1px solid",
                                                borderColor: "divider",
                                                boxShadow: isEventsHeaderSticky ? 2 : 0,
                                                transition: (t) => `box-shadow ${t.custom.motion.slow}ms ${t.custom.motion.ease}`,
                                            }}
                                        >
                                            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Box sx={{ color: "primary.main" }}><EventRoundedIcon /></Box>
                                                    <Typography variant="h6" fontWeight={700}>Events</Typography>
                                                    {hasArtistEvents && (
                                                        <Chip label={sortedArtistEvents.length} size="small" sx={{ fontWeight: 600 }} />
                                                    )}
                                                </Stack>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    {isEventsHeaderSticky && (
                                                        <Tooltip title="Back to top">
                                                            <IconButton
                                                                size="small"
                                                                onClick={scrollToContentTop}
                                                                sx={{
                                                                    bgcolor: "action.hover",
                                                                    "&:hover": { bgcolor: "action.selected" },
                                                                }}
                                                            >
                                                                <KeyboardArrowUpIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip title={showEventFilters ? "Hide Filters" : "Show Filters"}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => setShowEventFilters((p) => !p)}
                                                            color={showEventFilters ? "primary" : "default"}
                                                        >
                                                            {showEventFilters ? <TuneIcon /> : <TuneOutlinedIcon />}
                                                        </IconButton>
                                                    </Tooltip>
                                                    {showEventFilters && (eventViewMode !== "posted" || eventDateFrom || eventDateTo) && (
                                                        <Tooltip title="Clear filters">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => {
                                                                    setEventViewMode("posted");
                                                                    setEventFilterRange("all");
                                                                    setEventDateFrom('');
                                                                    setEventDateTo('');
                                                                }}
                                                                color="default"
                                                            >
                                                                <RefreshIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}

                                                </Stack>
                                            </Stack>

                                            {/* Collapsible filters */}
                                            <Collapse in={showEventFilters}>
                                                <Stack
                                                    direction={{ xs: "column", sm: "row" }}
                                                    spacing={2}
                                                    sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider" }}
                                                >
                                                    <FormControl size="small" sx={{ minWidth: 150 }}>
                                                        <InputLabel>View</InputLabel>
                                                        <Select
                                                            value={eventViewMode}
                                                            label="View"
                                                            onChange={(e) => { setEventViewMode(e.target.value); setEventDateFrom(''); setEventDateTo(''); }}
                                                        >
                                                            <MenuItem value="posted">All</MenuItem>
                                                            <MenuItem value="going">Going</MenuItem>
                                                            <MenuItem value="interested">Interested</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                    <TextField
                                                        size="small"
                                                        type="date"
                                                        label="From"
                                                        InputLabelProps={{ shrink: true }}
                                                        value={eventDateFrom}
                                                        onChange={(e) => setEventDateFrom(e.target.value || '')}
                                                        sx={{
                                                            minWidth: 150,
                                                            ...PROFILE_CONTROL_SX,
                                                            '& .MuiInputBase-input': { fontSize: 13 },
                                                        }}
                                                    />
                                                    <TextField
                                                        size="small"
                                                        type="date"
                                                        label="To"
                                                        InputLabelProps={{ shrink: true }}
                                                        value={eventDateTo}
                                                        onChange={(e) => setEventDateTo(e.target.value || '')}
                                                        sx={{
                                                            minWidth: 150,
                                                            ...PROFILE_CONTROL_SX,
                                                            '& .MuiInputBase-input': { fontSize: 13 },
                                                        }}
                                                    />
                                                </Stack>
                                            </Collapse>
                                        </Box>
                                    </Collapse>

                                    {/* Events content area */}
                                    <Box sx={{ p: { xs: 2, sm: 3 }, minHeight: 280 }}>
                                        <ContentFadeIn triggerKey={eventSubTab}>
                                            {eventSubTab === 1 ? (
                                                /* ── Comments sub-tab ── */
                                                eventCommentsLoading ? (
                                                    <PulsingDots />
                                                ) : eventEngagementComments.length === 0 ? (
                                                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, py: 6, color: "text.secondary" }}>
                                                        <ChatBubbleOutlineIcon sx={{ fontSize: 48, color: "primary.main" }} />
                                                        <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "primary.main" }}>No current activity</Typography>
                                                        <Typography color="text.secondary" sx={{ fontSize: "0.82rem", textAlign: "center", maxWidth: 300 }}>
                                                            {canManage && isOnArtistProfile
                                                                ? "You don't have any comments on events yet."
                                                                : "This artist doesn't have any comments on events yet."}
                                                        </Typography>
                                                    </Box>
                                                ) : (
                                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                                        {eventEngagementComments.map((group) => {
                                                            const ev0 = group.event || {};
                                                            const comments = Array.isArray(group.comments) ? group.comments : [];
                                                            const total = comments.length;
                                                            const latest = comments[0] || null;
                                                            const eventPhoto = String(ev0?.mainPhotoUrl || ev0?.image_url || ev0?.photoUrl || "").trim();
                                                            const ecTruncate = (t, n) => {
                                                                const s0 = String(t || "").trim();
                                                                if (!s0) return "";
                                                                return s0.length > n ? `${s0.slice(0, n)}…` : s0;
                                                            };

                                                            return (
                                                                <Box
                                                                    key={`ec-${ev0.id}`}
                                                                    role="button"
                                                                    tabIndex={0}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter" || e.key === " ") {
                                                                            e.preventDefault();
                                                                            if (latest) openArtistEventComment({ ...latest, _viewEventOnly: true }, ev0);
                                                                        }
                                                                    }}
                                                                    onClick={() => {
                                                                        if (latest) openArtistEventComment({ ...latest, _viewEventOnly: true }, ev0);
                                                                    }}
                                                                    sx={(t) => ({
                                                                        border: "1px solid",
                                                                        borderColor: alpha(t.palette.text.primary, 0.10),
                                                                        borderRadius: 2,
                                                                        bgcolor: "background.paper",
                                                                        overflow: "hidden",
                                                                        cursor: "pointer",
                                                                        boxShadow: `0 4px 14px ${alpha(t.palette.text.primary, 0.06)}`,
                                                                        "&:hover": { borderColor: t.palette.primary.main },
                                                                    })}
                                                                >
                                                                    {/* Event header — gold gradient */}
                                                                    <Box
                                                                        sx={(t) => ({
                                                                            px: 1.5,
                                                                            py: 1,
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            justifyContent: "space-between",
                                                                            gap: 1,
                                                                            background: `linear-gradient(90deg, ${alpha(t.custom?.brand?.brass || '#A87822', 0.14)} 0%, ${alpha(t.palette.background.paper, 0)} 75%)`,
                                                                            borderBottom: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                                                                        })}
                                                                    >
                                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
                                                                            {eventPhoto ? (
                                                                                <Avatar
                                                                                    src={eventPhoto}
                                                                                    alt={String(ev0?.title || "")}
                                                                                    sx={{ width: 38, height: 38, flexShrink: 0 }}
                                                                                />
                                                                            ) : (
                                                                                <Avatar sx={(t) => ({ width: 38, height: 38, flexShrink: 0, bgcolor: t.palette.primary.light })}>
                                                                                    <EventRoundedIcon sx={{ fontSize: 20, color: "#fff" }} />
                                                                                </Avatar>
                                                                            )}
                                                                            <Box sx={{ minWidth: 0 }}>
                                                                                <Typography sx={{ fontWeight: 900, fontSize: 14 }} noWrap title={String(ev0?.title || "")}>
                                                                                    {String(ev0?.title || "").trim() || "Event"}
                                                                                </Typography>
                                                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                                                    {formatEventDate(ev0) || (latest?.created_at ? eventTimeAgo(latest.created_at) : "")}
                                                                                </Typography>
                                                                            </Box>
                                                                        </Box>
                                                                        <Box
                                                                            sx={(t) => ({
                                                                                display: "inline-flex",
                                                                                alignItems: "center",
                                                                                gap: 0.5,
                                                                                px: 1.1,
                                                                                py: 0.4,
                                                                                borderRadius: 999,
                                                                                border: `1px solid ${alpha(t.palette.primary.main, 0.16)}`,
                                                                                bgcolor: alpha(t.palette.primary.main, 0.06),
                                                                            })}
                                                                        >
                                                                            <Typography variant="caption" sx={{ fontWeight: 900, color: "primary.main" }}>
                                                                                {total === 1 ? "1 comment" : `${total} comments`}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Box>

                                                                    {/* Comment rows */}
                                                                    <Box sx={{ px: 1.5, py: 1.25, display: "grid", gap: 1 }}>
                                                                        {comments.slice(0, 3).map((c) => {
                                                                            const cText = String(c?.content || "").trim();
                                                                            const isReply = !!c?.parent_id;
                                                                            const cTime = c?.created_at || null;

                                                                            const commenterAvatar = c?.account_avatar_url || c?.user_avatar || c?.avatar_url || c?.profile_picture || c?.profileImageUrl || c?.commenterAvatar || avatarSrc || defaultAvatar;
                                                                            const commenterName = c?.account_name || c?.user_name || c?.commenter_name || c?.author_name || c?.name || (c?.first_name ? `${c.first_name}${c.last_name ? ` ${c.last_name}` : ""}`.trim() : "") || safeArtist.name || "Artist";
                                                                            const commenterHandle = c?.account_handle || c?.user_handle || c?.handle || c?.commenter_handle || (safeArtist.handle ? String(safeArtist.handle).trim().replace(/^@+/, "") : "");

                                                                            return (
                                                                                <Box
                                                                                    key={`ec-c-${c?.id || c?.comment_id || ""}`}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        openArtistEventComment(c, ev0);
                                                                                    }}
                                                                                    sx={(t) => ({
                                                                                        border: "1px solid",
                                                                                        borderColor: alpha(t.palette.text.primary, 0.08),
                                                                                        borderRadius: 2,
                                                                                        px: 1.25,
                                                                                        py: 1,
                                                                                        bgcolor: alpha(t.palette.primary.main, 0.02),
                                                                                        "&:hover": { borderColor: alpha(t.palette.primary.main, 0.32) },
                                                                                    })}
                                                                                >
                                                                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                                                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                                                                                            <Avatar
                                                                                                src={commenterAvatar}
                                                                                                alt={commenterName}
                                                                                                sx={{ width: 34, height: 34 }}
                                                                                                imgProps={{ referrerPolicy: "no-referrer" }}
                                                                                            />
                                                                                            <Box sx={{ minWidth: 0 }}>
                                                                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                                                                    <Typography
                                                                                                        variant="body2"
                                                                                                        sx={{ fontWeight: 900, lineHeight: 1.1 }}
                                                                                                        noWrap
                                                                                                    >
                                                                                                        {commenterName}
                                                                                                    </Typography>
                                                                                                </Box>
                                                                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                                                                    {commenterHandle ? `@${commenterHandle}` : ""}
                                                                                                    {isReply ? " • Reply" : ""}
                                                                                                </Typography>
                                                                                            </Box>
                                                                                        </Box>
                                                                                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                                                                                            {cTime ? eventTimeAgo(cTime) : ""}
                                                                                        </Typography>
                                                                                    </Box>
                                                                                    <Typography
                                                                                        variant="body2"
                                                                                        sx={{
                                                                                            fontWeight: 800,
                                                                                            color: "text.primary",
                                                                                            mt: 0.5,
                                                                                            whiteSpace: "pre-wrap",
                                                                                            overflowWrap: "anywhere",
                                                                                        }}
                                                                                    >
                                                                                        {ecTruncate(cText, 260)}
                                                                                    </Typography>
                                                                                    {/* Comment photos */}
                                                                                    {(() => {
                                                                                        const cImages = Array.isArray(c?.images) ? c.images.filter(Boolean) : (c?.image ? [c.image] : []);
                                                                                        if (cImages.length === 0) return null;
                                                                                        return (
                                                                                            <Box sx={{ display: 'flex', gap: 0.75, mt: 0.75, flexWrap: 'wrap' }}>
                                                                                                {cImages.slice(0, 4).map((imgUrl, imgIdx) => (
                                                                                                    <Box
                                                                                                        key={imgIdx}
                                                                                                        component="img"
                                                                                                        src={imgUrl}
                                                                                                        alt={`comment photo ${imgIdx + 1}`}
                                                                                                        referrerPolicy="no-referrer"
                                                                                                        sx={(t) => ({
                                                                                                            width: cImages.length === 1 ? 120 : 64,
                                                                                                            height: cImages.length === 1 ? 120 : 64,
                                                                                                            borderRadius: 1.5,
                                                                                                            objectFit: 'cover',
                                                                                                            border: '1px solid',
                                                                                                            borderColor: alpha(t.palette.text.primary, 0.1),
                                                                                                            cursor: 'pointer',
                                                                                                        })}
                                                                                                    />
                                                                                                ))}
                                                                                            </Box>
                                                                                        );
                                                                                    })()}
                                                                                </Box>
                                                                            );
                                                                        })}
                                                                        {total > 3 && (
                                                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                                                                                View all comments on this event
                                                                            </Typography>
                                                                        )}
                                                                    </Box>
                                                                </Box>
                                                            );
                                                        })}
                                                    </Box>
                                                )
                                            ) : eventSubTab === 2 || eventSubTab === 3 ? (
                                                /* ── Likes / Reposts sub-tabs ── */
                                                eventEngagementLoading ? (
                                                    <PulsingDots />
                                                ) : eventEngagementEvents.length === 0 ? (
                                                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, py: 6, color: "text.secondary" }}>
                                                        {eventSubTab === 2
                                                            ? <FavoriteIcon sx={{ fontSize: 48, color: "primary.main" }} />
                                                            : <RepeatIcon sx={{ fontSize: 48, color: "primary.main" }} />}
                                                        <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "primary.main" }}>No current activity</Typography>
                                                        <Typography color="text.secondary" sx={{ fontSize: "0.82rem", textAlign: "center", maxWidth: 300 }}>
                                                            {canManage && isOnArtistProfile
                                                                ? (eventSubTab === 2 ? "You haven't liked any events yet." : "You haven't reposted any events yet.")
                                                                : (eventSubTab === 2 ? "This artist hasn't liked any events yet." : "This artist hasn't reposted any events yet.")}
                                                        </Typography>
                                                    </Box>
                                                ) : (
                                                    <Box sx={{
                                                        display: "grid",
                                                        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                                                        gap: 2,
                                                    }}>
                                                        {eventEngagementEvents.map((evt) => (
                                                            <EventCard
                                                                key={evt.id}
                                                                event={evt}
                                                                user={user}
                                                                onClick={() => handleEventClick(evt)}
                                                            />
                                                        ))}
                                                    </Box>
                                                )
                                            ) : (
                                                /* ── Events sub-tab (default) ── */
                                                (() => {
                                                    const isGoingOrInterested = eventViewMode === 'going' || eventViewMode === 'interested';
                                                    const viewLoading = eventViewMode === 'going' ? artistGoingLoading : eventViewMode === 'interested' ? artistInterestedLoading : eventsLoading;
                                                    return viewLoading ? (
                                                        <PulsingDots />
                                                    ) : hasArtistEvents ? (
                                                        <Box sx={{
                                                            display: "grid",
                                                            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                                                            gap: 2,
                                                        }}>
                                                            {sortedArtistEvents.map((evt) => (
                                                                <EventCard
                                                                    key={evt.id}
                                                                    event={evt}
                                                                    user={user}
                                                                    onClick={() => handleEventClick(evt)}
                                                                />
                                                            ))}
                                                        </Box>
                                                    ) : (
                                                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, py: 6, color: "text.secondary" }}>
                                                            <EventRoundedIcon sx={{ fontSize: 56, color: "primary.main" }} />
                                                            <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "primary.main" }}>
                                                                {eventViewMode === 'going' ? "Not going to any events"
                                                                    : eventViewMode === 'interested' ? "Not interested in any events"
                                                                        : "No events yet"}
                                                            </Typography>
                                                            <Typography color="text.secondary" sx={{ fontSize: "0.82rem", textAlign: "center", maxWidth: 300 }}>
                                                                {eventViewMode === 'going' ? (canManage ? "You haven't RSVP'd to any events yet." : `${name} hasn't RSVP'd to any events yet.`)
                                                                    : eventViewMode === 'interested' ? (canManage ? "You haven't marked any events as interested yet." : `${name} hasn't marked any events as interested yet.`)
                                                                        : (canManage && isOnArtistProfile ? "Create your first event to let fans know where to find you." : "This artist hasn\u2019t posted any events yet.")}
                                                            </Typography>

                                                        </Box>
                                                    );
                                                })()
                                            )}
                                        </ContentFadeIn>
                                    </Box>
                                </Paper>


                            </ContentFadeIn>
                        )}

                        {/* ============ PHOTOS TAB ============ */}
                        {activeTab === PHOTOS_TAB && (
                            <ContentFadeIn triggerKey="photos">
                                <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: { xs: 0, sm: undefined }, boxShadow: { xs: 'none', sm: undefined } }}>
                                    <SectionHeader icon={<PhotoLibraryRoundedIcon />} title="All Photos" />
                                    {hasPhotos ? (
                                        <PhotoGallery
                                            images={photos}
                                            name={name}
                                            onPhotoClick={(photoId, photoUrl) => {
                                                if (photoId) {
                                                    openGalleryPhotoComments(photoId, photoUrl);
                                                } else {
                                                    handleOpenLightbox(photoId, photoUrl);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <EmptyStateCard
                                            icon={<PhotoLibraryRoundedIcon sx={{ fontSize: 64 }} />}
                                            title="No Photos Yet"
                                            description={`${name} hasn't added any photos yet.`}
                                        />
                                    )}
                                </Paper>
                            </ContentFadeIn>
                        )}


                        {/* ============ ACTIVITY TAB (mobile only — using shared MobileActivityShell) ============ */}
                        {activeTab === ACTIVITY_TAB && isMobile && (
                            <MobileActivityShell
                                open={true}
                                onClose={() => setActiveTab(0)}
                                name={name}
                                handle={displayHandle}
                                avatarSrc={avatarSrc}
                                accountType="artist"
                                {...(embedded ? { zIndex: 1500 } : {})}
                                detailContent={
                                    previewPost ? (() => {
                                        const postKind = detectPostKind(previewPost);
                                        return (
                                            <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                                                {postKind === 'artist' && (
                                                    <MusicPostDetailPanel post={previewPost} user={user} onLocationClick={() => {}} onCommentSuccess={showSuccess} scrollToCommentId={postScrollToCommentId} highlightCommentId={postHighlightCommentId} />
                                                )}
                                                {postKind === 'business' && (
                                                    <BusinessPostDetailModal embedded post={previewPost} user={user} onViewPage={() => {}} onShare={() => {}} onLocationClick={() => {}} onCommentSuccess={showSuccess} scrollToCommentId={postScrollToCommentId} highlightCommentId={postHighlightCommentId} />
                                                )}
                                                {postKind === 'user' && (
                                                    <PostPage embedded post={previewPost} user={user} hideCategoryChip={false} onLocationClick={() => {}} scrollToCommentId={postScrollToCommentId} highlightCommentId={postHighlightCommentId} />
                                                )}
                                            </Box>
                                        );
                                    })() : selectedEventPopup ? (
                                        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
                                            <EventDetailPanel
                                                event={selectedEventPopup}
                                                user={user}
                                                onRequireAuth={() => {}}
                                                onEventUpdate={(updated) => setSelectedEventPopup((prev) => prev ? { ...prev, ...updated } : prev)}
                                                scrollToCommentId={eventScrollToCommentId}
                                                highlightCommentId={eventHighlightCommentId}
                                            />
                                        </Box>
                                    ) : selectedJobPopup ? (
                                        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
                                            <JobDetailPanel
                                                job={selectedJobPopup}
                                                jobId={selectedJobPopup?.id}
                                                user={user}
                                                loggedInUser={user}
                                                activeAccount={activeAccount}
                                                onClose={() => setSelectedJobPopup(null)}
                                                onDeleted={() => { setSelectedJobPopup(null); setJobsRefreshNonce((n) => n + 1); showSuccess('Job deleted successfully'); }}
                                                onEdit={(job) => { setSelectedJobPopup(null); handleEditJob(job); }}
                                                onRenew={(job) => { handleRenewJob(job); }}
                                            />
                                        </Box>
                                    ) : selectedServicePopup ? (
                                        <ServicePopupDialog
                                            service={selectedServicePopup}
                                            open={true}
                                            onClose={() => setSelectedServicePopup(null)}
                                            user={user}
                                            embedded
                                        />
                                    ) : null
                                }
                                detailTitle={previewPost ? 'Post' : selectedEventPopup ? 'Event' : selectedJobPopup ? 'Job' : selectedServicePopup ? 'Service' : ''}
                                onDetailClose={() => {
                                    if (previewPost) {
                                        setPreviewPost(null);
                                        setPostScrollToCommentId(null);
                                        setPostHighlightCommentId(null);
                                    } else if (selectedEventPopup) {
                                        setSelectedEventPopup(null);
                                        setEventScrollToCommentId(null);
                                        setEventHighlightCommentId(null);
                                    } else if (selectedJobPopup) {
                                        setSelectedJobPopup(null);
                                    } else if (selectedServicePopup) {
                                        setSelectedServicePopup(null);
                                    }
                                }}
                                createMenuItems={canManage && isOnArtistProfile ? [
                                    { icon: <ForumIcon />, label: 'New Post', onClick: handleOpenCreatePost },
                                ] : null}
                                stickyHeader={
                                    <>
                                        {/* ── Pill tabs (circular, icon above label) ── */}
                                        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                                            <Stack direction="row" spacing={0} alignItems="stretch" justifyContent="center" sx={{ px: 0.5, py: 0.5 }}>
                                                {[
                                                    { key: "activity", label: "Activity", icon: <DynamicFeedRoundedIcon />, show: true },
                                                    { key: "events", label: "Events", icon: <EventRoundedIcon />, show: true },
                                                    ...(artistHasJobs ? [{ key: "jobs", label: "Jobs", icon: <WorkOutlineRoundedIcon />, show: true }] : []),
                                                    ...(artistHasServices ? [{ key: "services", label: "Services", icon: <BusinessCenterIcon />, show: true }] : []),
                                                ].filter((t) => t.show).map((tab) => {
                                                    const isActive = engagementMode === tab.key;
                                                    return (
                                                        <Box
                                                            key={tab.key}
                                                            onClick={() => setEngagementMode(tab.key)}
                                                            sx={(t) => ({
                                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                                flex: 1, py: 0.6, cursor: 'pointer',
                                                                mx: 0.25,
                                                                borderRadius: 999,
                                                                backgroundColor: isActive ? alpha(t.palette.primary.main, 0.08) : 'transparent',
                                                                border: '1px solid',
                                                                borderColor: isActive ? alpha(t.palette.primary.main, 0.2) : 'transparent',
                                                                color: isActive ? t.palette.primary.main : t.palette.text.secondary,
                                                                transition: `all ${t.custom?.motion?.base || 200}ms ${t.custom?.motion?.ease || 'ease'}`,
                                                                '&:hover': {
                                                                    backgroundColor: isActive ? alpha(t.palette.primary.main, 0.1) : alpha(t.palette.text.primary, 0.04),
                                                                    color: isActive ? t.palette.primary.main : t.palette.text.primary,
                                                                },
                                                            })}
                                                        >
                                                            {React.cloneElement(tab.icon, { sx: { fontSize: 18, opacity: isActive ? 1 : 0.72 } })}
                                                            <Typography sx={{ fontSize: '0.6rem', fontWeight: isActive ? 900 : 700, lineHeight: 1, mt: 0.25, whiteSpace: 'nowrap' }}>
                                                                {tab.label}
                                                            </Typography>
                                                        </Box>
                                                    );
                                                })}
                                            </Stack>
                                        </Box>

                                        {/* Activity mode — icon-only sub-tabs */}
                                        {engagementMode === "activity" && (
                                            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                                                <Stack direction="row" spacing={0} alignItems="center" justifyContent="center" sx={{ px: 1 }}>
                                                    {[
                                                        { count: posts.length, icon: <ForumIcon />, idx: 0 },
                                                        { count: postEngagementComments.length, icon: <ChatBubbleOutlineIcon />, idx: 1 },
                                                        { count: postEngagementLikes.length, icon: <FavoriteIcon />, idx: 2 },
                                                        { count: postEngagementReposts.length, icon: <RepeatIcon />, idx: 3 },
                                                    ].map((sub) => {
                                                        const isActive = postSubTab === sub.idx;
                                                        return (
                                                            <Box key={sub.idx} onClick={() => { setPostSubTab(sub.idx); setPreviewPost(null); setPostScrollToCommentId(null); setPostHighlightCommentId(null); }}
                                                                 sx={(t) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.4, flex: 1, py: 1, cursor: 'pointer', borderBottom: '2px solid', borderColor: isActive ? t.palette.secondary.main : 'transparent', color: isActive ? 'secondary.main' : 'text.disabled', transition: 'color 150ms ease, border-color 150ms ease', '&:hover': { color: isActive ? 'secondary.main' : 'text.secondary' } })}
                                                            >
                                                                {React.cloneElement(sub.icon, { sx: { fontSize: 18 } })}
                                                                {sub.count > 0 && <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, lineHeight: 1 }}>{sub.count}</Typography>}
                                                            </Box>
                                                        );
                                                    })}
                                                    <Box onClick={() => setMobileActivitySearchVisible((v) => !v)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1, py: 1, cursor: 'pointer', color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}>
                                                        <SearchRoundedIcon sx={{ fontSize: 18 }} />
                                                    </Box>
                                                    <Box onClick={() => setMobileActivityFilterOpen((v) => !v)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1, py: 1, cursor: 'pointer', color: (mobileActivityFilterOpen || postSortBy !== 'newest' || postDateFrom || postDateTo) ? 'primary.main' : 'text.disabled', '&:hover': { color: 'text.secondary' } }}>
                                                        <TuneRoundedIcon sx={{ fontSize: 18 }} />
                                                    </Box>
                                                </Stack>
                                            </Box>
                                        )}

                                        {/* Events mode — icon-only sub-tabs */}
                                        {engagementMode === "events" && (
                                            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                                                <Stack direction="row" spacing={0} alignItems="center" justifyContent="center" sx={{ px: 1 }}>
                                                    {[<EventRoundedIcon />, <ChatBubbleOutlineIcon />, <FavoriteIcon />, <RepeatIcon />].map((icon, idx) => {
                                                        const isActive = eventSubTab === idx;
                                                        return (
                                                            <Box key={idx} onClick={() => setEventSubTab(idx)} sx={(t) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, py: 1, cursor: 'pointer', borderBottom: '2px solid', borderColor: isActive ? t.palette.secondary.main : 'transparent', color: isActive ? 'secondary.main' : 'text.disabled', transition: 'color 150ms ease, border-color 150ms ease', '&:hover': { color: isActive ? 'secondary.main' : 'text.secondary' } })}>
                                                                {React.cloneElement(icon, { sx: { fontSize: 18 } })}
                                                            </Box>
                                                        );
                                                    })}
                                                    <Box onClick={() => setMobileEventSearchVisible((v) => !v)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1, py: 1, cursor: 'pointer', color: mobileEventSearchVisible ? 'primary.main' : 'text.disabled', '&:hover': { color: 'text.secondary' } }}>
                                                        <SearchRoundedIcon sx={{ fontSize: 18 }} />
                                                    </Box>
                                                    <Box onClick={() => setMobileEventFilterOpen((v) => !v)} sx={(t) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1, py: 1, cursor: 'pointer', color: (mobileEventFilterOpen || eventViewMode !== 'posted' || eventDateFrom || eventDateTo) ? 'primary.main' : 'text.disabled', '&:hover': { color: 'text.secondary' } })}>
                                                        <TuneRoundedIcon sx={{ fontSize: 18 }} />
                                                    </Box>
                                                </Stack>
                                            </Box>
                                        )}

                                        {/* Events search collapse */}
                                        <Collapse in={mobileEventSearchVisible && engagementMode === 'events'}>
                                            <Box sx={{ px: 1.5, py: 1, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                                                <SearchInput placeholder="Search events…" value={eventSearchQuery} onChange={(e) => setEventSearchQuery(e?.target?.value ?? '')}
                                                             onSearch={() => setCommittedEventSearchQuery(eventSearchQuery.trim())}
                                                             onClear={() => { setEventSearchQuery(''); setCommittedEventSearchQuery(''); }}
                                                             inputProps={{ name: 'll-artist-mobile-events-search' }}
                                                             autoFocus
                                                />
                                            </Box>
                                        </Collapse>

                                        {/* Events — inline filter dropdowns */}
                                        <Collapse in={mobileEventFilterOpen && engagementMode === 'events'}>
                                            <Box sx={{ px: 1.5, py: 1.5, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                                                <Box sx={{ display: 'grid', gridTemplateColumns: eventSubTab === 0 ? '1fr 1fr 1fr' : '1fr 1fr', gap: 1, mb: 1 }}>
                                                    {eventSubTab === 0 && (
                                                        <FormControl size="small" fullWidth sx={PROFILE_CONTROL_SX}>
                                                            <InputLabel shrink>View</InputLabel>
                                                            <Select label="View" value={eventViewMode} onChange={(e) => { setEventViewMode(e.target.value); setEventDateFrom(''); setEventDateTo(''); }} MenuProps={profileMenuProps}>
                                                                <MenuItem value="posted">All</MenuItem>
                                                                <MenuItem value="going">Going</MenuItem>
                                                                <MenuItem value="interested">Interested</MenuItem>
                                                            </Select>
                                                        </FormControl>
                                                    )}
                                                    <TextField size="small" label="From" type="date" value={eventDateFrom} onChange={(e) => setEventDateFrom(e.target.value || '')} InputLabelProps={{ shrink: true, sx: { fontSize: 12 } }} fullWidth sx={{ ...PROFILE_CONTROL_SX, '& .MuiInputBase-input': { fontSize: 11, px: 1 }, '& .MuiOutlinedInput-root': { ...PROFILE_CONTROL_SX['& .MuiOutlinedInput-root'], minHeight: 36 } }} />
                                                    <TextField size="small" label="To" type="date" value={eventDateTo} onChange={(e) => setEventDateTo(e.target.value || '')} InputLabelProps={{ shrink: true, sx: { fontSize: 12 } }} fullWidth sx={{ ...PROFILE_CONTROL_SX, '& .MuiInputBase-input': { fontSize: 11, px: 1 }, '& .MuiOutlinedInput-root': { ...PROFILE_CONTROL_SX['& .MuiOutlinedInput-root'], minHeight: 36 } }} />
                                                </Box>
                                                {(eventViewMode !== 'posted' || eventDateFrom || eventDateTo) && (
                                                    <Button size="small" onClick={() => { setEventViewMode('posted'); setEventDateFrom(''); setEventDateTo(''); }} startIcon={<ClearRoundedIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: 'none', fontWeight: 700, fontSize: 12, color: 'text.secondary' }}>
                                                        Clear filters
                                                    </Button>
                                                )}
                                            </Box>
                                        </Collapse>

                                        {/* Activity search collapse */}
                                        <Collapse in={mobileActivitySearchVisible && engagementMode === 'activity'}>
                                            <Box sx={{ px: 1.5, py: 1, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                                                <SearchInput placeholder="Search…" value={localPostSearchTerm} onChange={(e) => setLocalPostSearchTerm(e?.target?.value ?? '')} onSearch={() => setLocalPostSearch(localPostSearchTerm)} onClear={() => { setLocalPostSearchTerm(''); setLocalPostSearch(''); }} inputProps={{ name: 'll-artist-mobile-posts-search' }} autoFocus />
                                            </Box>
                                        </Collapse>

                                        {/* Activity inline filter dropdowns */}
                                        <Collapse in={mobileActivityFilterOpen && engagementMode === 'activity'}>
                                            <Box sx={{ px: 1.5, py: 1.5, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mb: 1 }}>
                                                    <FormControl size="small" fullWidth sx={PROFILE_CONTROL_SX}>
                                                        <InputLabel shrink>Sort by</InputLabel>
                                                        <Select label="Sort by" value={postSortBy} onChange={(e) => setPostSortBy(e.target.value)} MenuProps={profileMenuProps}>
                                                            {POST_SORT_OPTIONS.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                                                        </Select>
                                                    </FormControl>
                                                    <TextField size="small" label="From" type="date" value={postDateFrom} onChange={(e) => setPostDateFrom(e.target.value)} InputLabelProps={{ shrink: true, sx: { fontSize: 12 } }} fullWidth sx={{ ...PROFILE_CONTROL_SX, '& .MuiInputBase-input': { fontSize: 11, px: 1 }, '& .MuiOutlinedInput-root': { ...PROFILE_CONTROL_SX['& .MuiOutlinedInput-root'], minHeight: 36 } }} />
                                                    <TextField size="small" label="To" type="date" value={postDateTo} onChange={(e) => setPostDateTo(e.target.value)} InputLabelProps={{ shrink: true, sx: { fontSize: 12 } }} fullWidth sx={{ ...PROFILE_CONTROL_SX, '& .MuiInputBase-input': { fontSize: 11, px: 1 }, '& .MuiOutlinedInput-root': { ...PROFILE_CONTROL_SX['& .MuiOutlinedInput-root'], minHeight: 36 } }} />
                                                </Box>
                                                {(postSortBy !== 'newest' || postDateFrom || postDateTo) && (
                                                    <Button size="small" onClick={() => { setPostSortBy('newest'); setPostDateFrom(''); setPostDateTo(''); }} startIcon={<ClearRoundedIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: 'none', fontWeight: 700, fontSize: 12, color: 'text.secondary' }}>
                                                        Clear filters
                                                    </Button>
                                                )}
                                            </Box>
                                        </Collapse>

                                        {/* Jobs mode — search & filter icons */}
                                        {engagementMode === "jobs" && (
                                            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                                                <Stack direction="row" spacing={0} alignItems="center" justifyContent="center" sx={{ px: 1 }}>
                                                    <Box sx={{ flex: 1 }} />
                                                    <Box onClick={() => setMobileJobsSearchVisible((v) => !v)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1, py: 1, cursor: 'pointer', color: mobileJobsSearchVisible ? 'primary.main' : 'text.disabled', '&:hover': { color: 'text.secondary' } }}>
                                                        <SearchRoundedIcon sx={{ fontSize: 18 }} />
                                                    </Box>
                                                    <Box onClick={() => setMobileJobsFilterOpen((v) => !v)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1, py: 1, cursor: 'pointer', color: mobileJobsFilterOpen ? 'primary.main' : 'text.disabled', '&:hover': { color: 'text.secondary' } }}>
                                                        <TuneRoundedIcon sx={{ fontSize: 18 }} />
                                                    </Box>
                                                </Stack>
                                            </Box>
                                        )}



                                        {/* Jobs search collapse */}
                                        <Collapse in={mobileJobsSearchVisible && engagementMode === 'jobs'}>
                                            <Box sx={{ px: 1.5, py: 1, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                                                <SearchInput placeholder="Search jobs…" value={localJobSearchTerm} onChange={(e) => setLocalJobSearchTerm(e?.target?.value ?? '')} onSearch={() => setLocalJobSearch(localJobSearchTerm)} onClear={() => { setLocalJobSearchTerm(''); setLocalJobSearch(''); }} inputProps={{ name: 'll-artist-mobile-jobs-search' }} autoFocus />
                                            </Box>
                                        </Collapse>

                                        {/* Jobs filter collapse */}
                                        <Collapse in={mobileJobsFilterOpen && engagementMode === 'jobs'}>
                                            <Box sx={{ px: 1.5, py: 1.5, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
                                                    <FormControl size="small" fullWidth sx={PROFILE_CONTROL_SX}>
                                                        <InputLabel shrink>Sort by</InputLabel>
                                                        <Select label="Sort by" value={jobsSort} onChange={(e) => setJobsSort(e.target.value)} MenuProps={profileMenuProps}>
                                                            <MenuItem value="newest">Newest</MenuItem>
                                                            <MenuItem value="expiring">Expiring Soon</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                    <FormControl size="small" fullWidth sx={PROFILE_CONTROL_SX}>
                                                        <InputLabel shrink>Category</InputLabel>
                                                        <Select label="Category" value={jobsCategory} onChange={(e) => setJobsCategory(e.target.value)} displayEmpty renderValue={(v) => v ? jobCategoryLabel(v) : 'All Categories'} MenuProps={profileMenuProps}>
                                                            <MenuItem value="">All Categories</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                </Box>
                                                {(jobsSort !== 'newest' || jobsCategory) && (
                                                    <Button size="small" onClick={() => { setJobsSort('newest'); setJobsCategory(''); }} startIcon={<ClearRoundedIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: 'none', fontWeight: 700, fontSize: 12, color: 'text.secondary' }}>
                                                        Clear filters
                                                    </Button>
                                                )}
                                            </Box>
                                        </Collapse>




                                    </>
                                }
                            >

                                {/* Activity content — posts feed */}
                                {engagementMode === "activity" && (
                                    <>
                                        <Box sx={{ minHeight: 280, px: { xs: 0, sm: 2 }, pt: 1.5 }}>
                                            <ContentFadeIn triggerKey={postSubTab}>
                                                {postSubTab === 0 ? (() => {
                                                    const q = localPostSearch.trim().toLowerCase();
                                                    const dateFilteredPosts = posts.filter((post) => {
                                                        if (q && ![post?.title, post?.body, post?.content].some((f) => String(f || '').toLowerCase().includes(q))) return false;
                                                        if (!postDateFrom && !postDateTo) return true;
                                                        const d = new Date(post?.created_at || post?.date_created || 0);
                                                        if (postDateFrom) { const from = new Date(postDateFrom); from.setHours(0,0,0,0); if (d < from) return false; }
                                                        if (postDateTo) { const to = new Date(postDateTo); to.setHours(23,59,59,999); if (d > to) return false; }
                                                        return true;
                                                    });
                                                    return postsLoading ? (<PulsingDots />) : dateFilteredPosts.length > 0 ? (<>{dateFilteredPosts.map((post) => (<ArtistPostCard key={post.id} post={post} canManage={canManage && isOnArtistProfile} onPin={handlePinPost} onUnpin={handleUnpinPost} onEdit={handleEditPost} onDelete={handleDeletePost} artistName={name} artistAvatar={avatarSrc} artistId={artist?.id} artistHandle={displayHandle || artistHandle} user={user} activeTab={activeTab} onPreview={openPreviewPost} profileType={isVisualArtist ? "artist" : "music"} />))}{postsLoadingMore && <PulsingDots sx={{ py: 3 }} />}{postsHasMore && !postsLoadingMore && <Box ref={postsLoadMoreRef} sx={{ height: 1 }} />}</>) : (<Box sx={{ textAlign: "center", py: 6 }}><ArticleRoundedIcon sx={{ fontSize: 56, color: "primary.main", mb: 1.5 }} /><Typography variant="h6" fontWeight={700} sx={{ mb: 0.5, color: "primary.main" }}>{q || postDateFrom || postDateTo ? 'No posts match your filters' : 'No posts yet'}</Typography><Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320, mx: "auto", mb: canManage ? 2.5 : 0 }}>{q || postDateFrom || postDateTo ? 'Try adjusting your filters or search.' : (canManage ? "Share updates, deals, and announcements with your followers." : `${name} hasn't posted anything yet. Check back later!`)}</Typography>{canManage && isOnArtistProfile && !q && !postDateFrom && !postDateTo && (<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={handleOpenCreatePost} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>Create First Post</Button>)}</Box>);
                                                })() : postSubTab === 1 ? (
                                                    postEngagementLoading ? (<PulsingDots />) : (() => {
                                                        const q = localPostSearch.trim().toLowerCase();
                                                        const moderatedComments = postEngagementComments.filter((item) => engFilterItem(item, true));
                                                        let visibleComments = q
                                                            ? moderatedComments.filter((item) => {
                                                                const post0 = item?.post || item;
                                                                const body = String(post0?.body || post0?.content || post0?.title || '').toLowerCase();
                                                                const commentText = String(item?.comment?.content || item?.comment?.text || item?.comment?.body || '').toLowerCase();
                                                                return body.includes(q) || commentText.includes(q);
                                                            })
                                                            : [...moderatedComments];
                                                        if (postDateFrom) { const from = new Date(postDateFrom); from.setHours(0, 0, 0, 0); visibleComments = visibleComments.filter((item) => { const c = item?.comment || item; const d = new Date(c?.created_at || c?.createdAt || 0); return d >= from; }); }
                                                        if (postDateTo) { const to = new Date(postDateTo); to.setHours(23, 59, 59, 999); visibleComments = visibleComments.filter((item) => { const c = item?.comment || item; const d = new Date(c?.created_at || c?.createdAt || 0); return d <= to; }); }
                                                        if (visibleComments.length === 0) {
                                                            return (
                                                                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, py: 6 }}>
                                                                    <ChatBubbleOutlineIcon sx={{ fontSize: 48, color: "primary.main" }} />
                                                                    <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "primary.main" }}>{q ? 'No comments match your search' : 'No current activity'}</Typography>
                                                                    <Typography color="text.secondary" sx={{ fontSize: "0.82rem", textAlign: "center", maxWidth: 300 }}>
                                                                        {q ? 'Try adjusting your search.' : (canManage && isOnArtistProfile ? "You haven't commented on any posts yet." : "This artist hasn't commented on any posts yet.")}
                                                                    </Typography>
                                                                </Box>
                                                            );
                                                        }

                                                        const groupMap = new Map();
                                                        const groupOrder = [];
                                                        visibleComments.forEach((item) => {
                                                            const post0 = item?.post || {};
                                                            const comment = item?.comment || item;
                                                            const pid = Number(post0?.id || comment?.post_id || 0);
                                                            if (!pid) return;
                                                            if (!groupMap.has(pid)) {
                                                                groupMap.set(pid, { post: post0, comments: [] });
                                                                groupOrder.push(pid);
                                                            }
                                                            groupMap.get(pid).comments.push(comment);
                                                        });

                                                        groupOrder.sort((a, b) => {
                                                            if (postSortBy === 'popular') {
                                                                const pa = groupMap.get(a)?.post || {};
                                                                const pb = groupMap.get(b)?.post || {};
                                                                const la = Number(pb?.likesCount || pb?.likes_count || pb?.like_count || 0) - Number(pa?.likesCount || pa?.likes_count || pa?.like_count || 0);
                                                                if (la !== 0) return la;
                                                            }
                                                            const ca = groupMap.get(a)?.comments || [];
                                                            const cb = groupMap.get(b)?.comments || [];
                                                            const latestA = Math.max(...ca.map((c) => new Date(c?.created_at || c?.createdAt || 0).getTime()));
                                                            const latestB = Math.max(...cb.map((c) => new Date(c?.created_at || c?.createdAt || 0).getTime()));
                                                            return latestB - latestA;
                                                        });

                                                        const truncate = (t, n) => {
                                                            const s = String(t || '').trim();
                                                            return s.length > n ? `${s.slice(0, n)}…` : s;
                                                        };

                                                        return (
                                                            <Box sx={{ display: 'grid', gap: 2, p: { xs: 1.25, sm: 2 } }}>
                                                                {groupOrder.map((pid) => {
                                                                    const g = groupMap.get(pid);
                                                                    const post0 = g.post;
                                                                    const cmts = g.comments;
                                                                    const total = cmts.length;
                                                                    const postTitle = truncate(post0?.title || post0?.body || 'Post', 80);
                                                                    const postAuthorName = post0?.artist_name || post0?.business_name || post0?.post_author_name || [post0?.first_name, post0?.last_name].filter(Boolean).join(' ') || post0?.handle || 'Someone';
                                                                    const postHandle = post0?.handle || post0?.artist_handle || post0?.business_slug || '';
                                                                    const postAuthorAvatar = post0?.avatar_url || post0?.profile_picture || post0?.artist_avatar_url || post0?.business_avatar_url || '';
                                                                    const postAuthorVerified = Boolean(post0?.is_verified);
                                                                    const postCategory = post0?.category || '';
                                                                    const postAuthorAccountType = (() => {
                                                                        const cat = String(postCategory).toLowerCase();
                                                                        if (cat === 'business_post' || cat === 'business') return 'business';
                                                                        if (cat === 'artist_post' || cat === 'artist') return 'artist';
                                                                        return 'user';
                                                                    })();

                                                                    return (
                                                                        <Box
                                                                            key={`comment-group-${pid}`}
                                                                            onClick={() => {
                                                                                setPostScrollToCommentId(null);
                                                                                setPostHighlightCommentId(null);
                                                                                openPreviewPost(post0);
                                                                            }}
                                                                            sx={(t) => ({
                                                                                border: '1px solid',
                                                                                borderColor: alpha(t.palette.text.primary, 0.10),
                                                                                borderRadius: 2,
                                                                                bgcolor: 'background.paper',
                                                                                overflow: 'hidden',
                                                                                cursor: 'pointer',
                                                                                boxShadow: `0 10px 26px ${alpha(t.palette.text.primary, 0.08)}`,
                                                                                '&:hover': { borderColor: t.palette.primary.main },
                                                                            })}
                                                                        >
                                                                            {/* Post header with gradient */}
                                                                            <Box
                                                                                sx={(t) => ({
                                                                                    px: 1.5,
                                                                                    py: 1,
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'space-between',
                                                                                    gap: 1,
                                                                                    background: `linear-gradient(90deg, ${alpha(
                                                                                        t.custom?.brand?.brass || '#A87822',
                                                                                        0.14
                                                                                    )} 0%, ${alpha(t.palette.background.paper, 0)} 75%)`,
                                                                                    borderBottom: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                                                                                })}
                                                                            >
                                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                                                                                    <AccountAvatar
                                                                                        src={postAuthorAvatar}
                                                                                        alt={postAuthorName}
                                                                                        accountType={postAuthorAccountType}
                                                                                        size={38}
                                                                                        sx={(t) => ({
                                                                                            border: '2px solid',
                                                                                            borderColor: alpha(t.palette.text.primary, 0.06),
                                                                                        })}
                                                                                    />
                                                                                    <Box sx={{ minWidth: 0 }}>
                                                                                        <Typography sx={{ fontWeight: 900 }} noWrap title={String(post0?.title || '')}>
                                                                                            {postTitle}
                                                                                        </Typography>
                                                                                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                                                                            {postAuthorName}
                                                                                            {postAuthorVerified && <VerifiedRoundedIcon sx={{ fontSize: 13, color: 'primary.main' }} />}
                                                                                            {postHandle && postAuthorName !== postHandle ? ` @${postHandle.replace(/^@/, '')}` : ''}
                                                                                        </Typography>
                                                                                    </Box>
                                                                                </Box>

                                                                                <Box
                                                                                    sx={(t) => ({
                                                                                        display: 'inline-flex',
                                                                                        alignItems: 'center',
                                                                                        gap: 0.4,
                                                                                        px: 0.75,
                                                                                        py: 0.25,
                                                                                        borderRadius: 999,
                                                                                        bgcolor: alpha(t.palette.primary.main, 0.08),
                                                                                        border: '1px solid',
                                                                                        borderColor: alpha(t.palette.primary.main, 0.2),
                                                                                        flexShrink: 0,
                                                                                    })}
                                                                                >
                                                                                    <ChatBubbleOutlineIcon sx={{ fontSize: 13, color: 'primary.main' }} />
                                                                                    <Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'primary.main', whiteSpace: 'nowrap' }}>
                                                                                        {total} comment{total !== 1 ? 's' : ''}
                                                                                    </Typography>
                                                                                </Box>
                                                                            </Box>

                                                                            {/* Individual comment rows */}
                                                                            <Box sx={{ px: 1.5, py: 1.25, display: 'grid', gap: 1 }}>
                                                                                {cmts.slice(0, 3).map((c, ci) => {
                                                                                    const cText = String(c?.content || c?.body || c?.text || '').trim();
                                                                                    const isReply = Boolean(c?.parent_id || c?.parentId);
                                                                                    const cTime = c?.created_at || c?.createdAt || '';
                                                                                    const cAvatar = avatarSrc || undefined;
                                                                                    const cName = name;
                                                                                    const cHandle = displayHandle || artistHandle || '';
                                                                                    const cCommentId = Number(c?.comment_id || c?.id || 0) || null;

                                                                                    return (
                                                                                        <Box
                                                                                            key={c?.id || c?.comment_id || ci}
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                setPostScrollToCommentId(cCommentId);
                                                                                                setPostHighlightCommentId(cCommentId);
                                                                                                openPreviewPost(post0);
                                                                                            }}
                                                                                            sx={(t) => ({
                                                                                                border: '1px solid',
                                                                                                borderColor: alpha(t.palette.text.primary, 0.08),
                                                                                                borderRadius: 2,
                                                                                                px: 1.25,
                                                                                                py: 1,
                                                                                                bgcolor: alpha(t.palette.primary.main, 0.02),
                                                                                                cursor: 'pointer',
                                                                                                '&:hover': { borderColor: alpha(t.palette.primary.main, 0.32) },
                                                                                            })}
                                                                                        >
                                                                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                                                                                    <Avatar
                                                                                                        src={cAvatar}
                                                                                                        alt={cName}
                                                                                                        imgProps={{ referrerPolicy: 'no-referrer' }}
                                                                                                        sx={(t) => ({
                                                                                                            width: 34, height: 34, flexShrink: 0,
                                                                                                            bgcolor: alpha(t.palette.primary.main, 0.08),
                                                                                                            color: t.palette.primary.main,
                                                                                                            border: '1.5px solid',
                                                                                                            borderColor: alpha(t.palette.text.primary, 0.06),
                                                                                                            '& .MuiAvatar-img': { objectFit: 'cover', transform: 'scale(1.15)' },
                                                                                                        })}
                                                                                                    >
                                                                                                        {isVisualArtist ? <PaletteRoundedIcon sx={{ fontSize: 18 }} /> : <MusicNoteRoundedIcon sx={{ fontSize: 18 }} />}
                                                                                                    </Avatar>
                                                                                                    <Box sx={{ minWidth: 0 }}>
                                                                                                        <Typography variant="body2" sx={{ fontWeight: 900, lineHeight: 1.1 }} noWrap title={cName}>
                                                                                                            {cName}
                                                                                                        </Typography>
                                                                                                        <Typography variant="caption" color="text.secondary" noWrap>
                                                                                                            {cHandle ? `@${cHandle.replace(/^@/, '')}` : ''}
                                                                                                            {isReply ? ' • Reply' : ''}
                                                                                                        </Typography>
                                                                                                    </Box>
                                                                                                </Box>
                                                                                                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                                                                                    {cTime ? formatRelativeTime(cTime) : ''}
                                                                                                </Typography>
                                                                                            </Box>
                                                                                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                                                                                                {truncate(cText, 260)}
                                                                                            </Typography>
                                                                                            {(() => {
                                                                                                const cImages = Array.isArray(c?.images) ? c.images.filter(Boolean) : (c?.image ? [c.image] : []);
                                                                                                if (cImages.length === 0) return null;
                                                                                                return (
                                                                                                    <Box sx={{ display: 'flex', gap: 0.75, mt: 0.75, flexWrap: 'wrap' }}>
                                                                                                        {cImages.slice(0, 4).map((imgUrl, imgIdx) => (
                                                                                                            <Box
                                                                                                                key={imgIdx}
                                                                                                                component="img"
                                                                                                                src={imgUrl}
                                                                                                                alt={`comment photo ${imgIdx + 1}`}
                                                                                                                referrerPolicy="no-referrer"
                                                                                                                sx={(t) => ({
                                                                                                                    width: cImages.length === 1 ? 120 : 64,
                                                                                                                    height: cImages.length === 1 ? 120 : 64,
                                                                                                                    borderRadius: 1.5,
                                                                                                                    objectFit: 'cover',
                                                                                                                    border: '1px solid',
                                                                                                                    borderColor: alpha(t.palette.text.primary, 0.1),
                                                                                                                    cursor: 'pointer',
                                                                                                                })}
                                                                                                            />
                                                                                                        ))}
                                                                                                    </Box>
                                                                                                );
                                                                                            })()}
                                                                                        </Box>
                                                                                    );
                                                                                })}

                                                                                {total > 3 && (
                                                                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                                                                                        View all comments on this post
                                                                                    </Typography>
                                                                                )}
                                                                            </Box>
                                                                        </Box>
                                                                    );
                                                                })}
                                                            </Box>
                                                        );
                                                    })()
                                                ) : postSubTab === 2 || postSubTab === 3 ? (
                                                    postEngagementLoading ? (<PulsingDots />) : (() => {
                                                        let rawItems = postSubTab === 2 ? postEngagementLikes : postEngagementReposts;
                                                        // Apply moderation + privacy filtering
                                                        rawItems = rawItems.filter((p) => engFilterItem(p, false));
                                                        const q = localPostSearch.trim().toLowerCase();
                                                        let items = q
                                                            ? rawItems.filter((p) => {
                                                                const body = String(p?.body || p?.content || p?.title || '').toLowerCase();
                                                                const author = String(p?.first_name || '').toLowerCase() + ' ' + String(p?.last_name || '').toLowerCase();
                                                                const handle = String(p?.handle || '').toLowerCase();
                                                                return body.includes(q) || author.includes(q) || handle.includes(q);
                                                            })
                                                            : [...rawItems];
                                                        if (postDateFrom) { const from = new Date(postDateFrom); from.setHours(0, 0, 0, 0); items = items.filter((p) => { const d = new Date(p?.created_at || p?.createdAt || p?.liked_at || p?.reposted_at || 0); return d >= from; }); }
                                                        if (postDateTo) { const to = new Date(postDateTo); to.setHours(23, 59, 59, 999); items = items.filter((p) => { const d = new Date(p?.created_at || p?.createdAt || p?.liked_at || p?.reposted_at || 0); return d <= to; }); }
                                                        const _engTs = (p) => new Date(p?.liked_at || p?.reposted_at || p?.created_at || p?.createdAt || 0);
                                                        if (postSortBy === 'popular') {
                                                            items.sort((a, b) => {
                                                                const la = Number(b?.likesCount || b?.likes_count || b?.like_count || 0) - Number(a?.likesCount || a?.likes_count || a?.like_count || 0);
                                                                if (la !== 0) return la;
                                                                return _engTs(b) - _engTs(a);
                                                            });
                                                        } else {
                                                            items.sort((a, b) => _engTs(b) - _engTs(a));
                                                        }
                                                        if (items.length === 0) {
                                                            return (
                                                                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, py: 6 }}>
                                                                    {postSubTab === 2 ? <FavoriteIcon sx={{ fontSize: 48, color: "primary.main" }} /> : <RepeatIcon sx={{ fontSize: 48, color: "primary.main" }} />}
                                                                    <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "primary.main" }}>{q ? 'No results match your search' : 'No current activity'}</Typography>
                                                                    <Typography color="text.secondary" sx={{ fontSize: "0.82rem", textAlign: "center", maxWidth: 300 }}>
                                                                        {q ? 'Try adjusting your search.' : (postSubTab === 2
                                                                                ? (canManage && isOnArtistProfile ? "You haven't liked any posts yet." : "This artist hasn't liked any posts yet.")
                                                                                : (canManage && isOnArtistProfile ? "You haven't reposted any posts yet." : "This artist hasn't reposted any posts yet.")
                                                                        )}
                                                                    </Typography>
                                                                </Box>
                                                            );
                                                        }
                                                        return (<Box data-flat-posts="1" sx={{ display: "flex", flexDirection: "column", gap: 0 }}><style>{`
                                                        [data-flat-posts] [data-post-id],
                                                        [data-flat-posts] [data-post-id][class],
                                                        [data-flat-posts] [data-business-post-id],
                                                        [data-flat-posts] [data-business-post-id][class],
                                                        [data-flat-posts] .MuiCard-root[data-post-id],
                                                        [data-flat-posts] .MuiPaper-root[data-post-id],
                                                        [data-flat-posts] .MuiCard-root[data-business-post-id],
                                                        [data-flat-posts] .MuiPaper-root[data-business-post-id],
                                                        [data-flat-posts] .MuiCard-root.MuiCard-root[data-post-id],
                                                        [data-flat-posts] .MuiPaper-root.MuiPaper-root[data-post-id],
                                                        [data-flat-posts] .MuiCard-root.MuiCard-root[data-business-post-id],
                                                        [data-flat-posts] .MuiPaper-root.MuiPaper-root[data-business-post-id] {
                                                            box-shadow: none !important;
                                                            border: none !important;
                                                            border-radius: 0 !important;
                                                            transform: none !important;
                                                            transition: none !important;
                                                            min-height: auto !important;
                                                            background-image: none !important;
                                                            background-color: transparent !important;
                                                            background: transparent !important;
                                                            overflow: visible !important;
                                                            padding: 0 !important;
                                                            margin: 0 !important;
                                                            outline: none !important;
                                                        }
                                                        [data-flat-posts] [data-post-id]:hover,
                                                        [data-flat-posts] [data-post-id][class]:hover,
                                                        [data-flat-posts] [data-business-post-id]:hover,
                                                        [data-flat-posts] [data-business-post-id][class]:hover,
                                                        [data-flat-posts] .MuiCard-root[data-post-id]:hover,
                                                        [data-flat-posts] .MuiPaper-root[data-post-id]:hover,
                                                        [data-flat-posts] .MuiCard-root[data-business-post-id]:hover,
                                                        [data-flat-posts] .MuiPaper-root[data-business-post-id]:hover {
                                                            box-shadow: none !important;
                                                            transform: none !important;
                                                            background-color: transparent !important;
                                                            background: transparent !important;
                                                        }
                                                        [data-flat-posts] [data-post-id]::before,
                                                        [data-flat-posts] [data-post-id]::after,
                                                        [data-flat-posts] [data-business-post-id]::before,
                                                        [data-flat-posts] [data-business-post-id]::after {
                                                            display: none !important;
                                                        }
                                                        [data-flat-posts] [data-post-id] > .MuiCardActions-root,
                                                        [data-flat-posts] [data-business-post-id] > .MuiCardActions-root {
                                                            padding: 0 !important;
                                                            border: none !important;
                                                        }
                                                        [data-flat-posts] :has(> .post-loc-icon) {
                                                            width: fit-content !important;
                                                            max-width: fit-content !important;
                                                            margin-left: auto !important;
                                                        }
                                                        [data-flat-posts] [data-post-id] img[loading="lazy"][alt=""],
                                                        [data-flat-posts] [data-profile-post-id] img[loading="lazy"][alt=""],
                                                        [data-flat-posts] [data-business-post-id] img[loading="lazy"][alt=""] { display: none !important; }
                                                        [data-flat-posts] [data-post-id] .MuiBox-root:has(> .MuiBox-root > img[loading="lazy"][alt=""]),
                                                        [data-flat-posts] [data-profile-post-id] .MuiBox-root:has(> .MuiBox-root > img[loading="lazy"][alt=""]),
                                                        [data-flat-posts] [data-business-post-id] .MuiBox-root:has(> .MuiBox-root > img[loading="lazy"][alt=""]) { display: none !important; }
                                                        [data-flat-posts] [data-profile-post-id] .MuiBox-root:has(> .MuiBox-root > img[loading="lazy"]) { display: none !important; }
                                                        [data-flat-posts] [data-business-post-id] > .MuiBox-root,
                                                        [data-flat-posts] [data-profile-post-id] > .MuiCard-root > .MuiBox-root,
                                                        [data-flat-posts] [data-profile-post-id] > .MuiPaper-root > .MuiBox-root {
                                                            padding-left: 0 !important;
                                                            padding-right: 0 !important;
                                                            padding-top: 0 !important;
                                                        }
                                                        [data-flat-posts] [data-business-post-id] > .MuiCardActions-root,
                                                        [data-flat-posts] [data-profile-post-id] > .MuiCard-root > .MuiCardActions-root,
                                                        [data-flat-posts] [data-profile-post-id] > .MuiPaper-root > .MuiCardActions-root,
                                                        [data-flat-posts] [data-profile-post-id] .MuiCardActions-root {
                                                            padding-left: 0 !important;
                                                            padding-right: 0 !important;
                                                            padding-bottom: 0 !important;
                                                            border-top: none !important;
                                                            margin-top: 0 !important;
                                                        }
                                                        [data-flat-posts] .ll-author-link,
                                                        [data-flat-posts] [data-profile-post-id] .ll-author-link {
                                                            width: fit-content !important;
                                                            max-width: fit-content !important;
                                                            flex: 0 1 auto !important;
                                                        }
                                                        /* Restore MusicPostCardItem inner padding — prevents body text flush-left */
                                                        [data-flat-posts] .music-post-card > .MuiBox-root {
                                                            padding-left: 16px !important;
                                                            padding-right: 16px !important;
                                                        }
                                                        [data-flat-posts] .music-post-card > .MuiCardActions-root {
                                                            padding-left: 16px !important;
                                                            padding-right: 16px !important;
                                                        }
                                                    `}</style>{items.map((p) => {
                                                            const pId = Number(p?.id || 0);
                                                            const pType = String(p?.postType || p?.post_type || '').toLowerCase();
                                                            const pCat = String(p?.category || '').toLowerCase();
                                                            const isArtistPost = pType === 'artist' || pCat === 'artist_post';
                                                            const isBusinessPost = pType === 'business' || pCat === 'business_post';
                                                            const isOwnPost = isArtistPost && (
                                                                Number(p?.artist_id || p?.artistId) === Number(artist?.id) ||
                                                                String(p?.artist_handle || p?.artistHandle || '').toLowerCase() === String(displayHandle || artistHandle || '').toLowerCase()
                                                            );
                                                            const urls = extractMediaUrls(p);
                                                            const photoGrid = urls.length > 0 ? <ArtistEngagementPhotoGrid mediaUrls={urls} onOpenLightbox={(idx) => { setEngLightboxUrls(urls); setEngLightboxIdx(idx); setEngLightboxOpen(true); }} /> : null;
                                                            const wrapSx = (t) => ({ borderBottom: "1px solid", borderColor: alpha(t.palette.text.primary, 0.08), "&:last-child": { borderBottom: "none" }, py: 2.5, px: { xs: 2, sm: 3 }, cursor: "pointer", transition: `background-color ${t.custom?.motion?.base || 180}ms ease`, overflow: "hidden", "&:hover": { bgcolor: alpha(t.palette.text.primary, 0.03) }, "& .MuiPaper-root, & > .MuiBox-root": { bgcolor: "transparent !important", boxShadow: "none !important" } });
                                                            const handleWrapClick = (e) => { if (e.target?.closest?.('.MuiIconButton-root, [role="menuitem"], [role="button"], .MuiMenuItem-root, a[href], .MuiChip-root, .ll-author-link')) return; openPreviewPost(p); };

                                                            if (isArtistPost) {
                                                                return (
                                                                    <Box key={`pe-${pId}`} data-profile-post-id={String(pId)} onClick={handleWrapClick} sx={wrapSx}>
                                                                        <MusicPostCardItem post={p} user={user} hoveredId={null} setHoveredId={() => {}} onCardClick={() => openPreviewPost(p)} onOpenUserCard={isOwnPost ? () => {} : handleEngOpenUserCard} renderBeforeActions={photoGrid} />
                                                                    </Box>
                                                                );
                                                            }
                                                            if (isBusinessPost) {
                                                                return (
                                                                    <Box key={`pe-${pId}`} data-profile-post-id={String(pId)} onClick={handleWrapClick} sx={wrapSx}>
                                                                        <BusinessPostCard post={p} user={user} hoveredId={null} setHoveredId={() => {}} onCardClick={() => openPreviewPost(p)} onOpenUserCard={handleEngOpenUserCard} renderBeforeActions={photoGrid} />
                                                                    </Box>
                                                                );
                                                            }
                                                            return (
                                                                <Box key={`pe-${pId}`} data-profile-post-id={String(pId)} onClick={handleWrapClick} sx={wrapSx}>
                                                                    <ProfilePostCard post={p} user={user} hoveredId={null} setHoveredId={() => {}} onCardClick={() => openPreviewPost(p)} onEditPost={() => {}} onDeletePost={() => {}} onOpenUserCard={handleEngOpenUserCard} onOpenShare={() => {}} previewLineClamp={4} disableHover renderBeforeActions={photoGrid} />
                                                                </Box>
                                                            );
                                                        })}</Box>);
                                                    })()
                                                ) : null}
                                            </ContentFadeIn>
                                        </Box>
                                    </>
                                )}

                                {/* Events content */}
                                {engagementMode === "events" && (
                                    <Box sx={{ p: { xs: 0, sm: 2 }, minHeight: 280 }}>
                                        <ContentFadeIn triggerKey={eventSubTab}>
                                            {eventSubTab === 0 ? (eventsLoading ? (<PulsingDots />) : (() => {
                                                let filteredEvts = sortedArtistEvents;
                                                if (committedEventSearchQuery) {
                                                    const q = committedEventSearchQuery.toLowerCase();
                                                    filteredEvts = filteredEvts.filter((evt) =>
                                                        String(evt?.title || '').toLowerCase().includes(q) ||
                                                        String(evt?.description || '').toLowerCase().includes(q) ||
                                                        String(evt?.category || '').toLowerCase().includes(q)
                                                    );
                                                }
                                                if (eventDateFrom) { const from = new Date(eventDateFrom); from.setHours(0, 0, 0, 0); filteredEvts = filteredEvts.filter((evt) => new Date(evt?.startAt || evt?.start_at || evt?.created_at || evt?.createdAt || 0) >= from); }
                                                if (eventDateTo) { const to = new Date(eventDateTo); to.setHours(23, 59, 59, 999); filteredEvts = filteredEvts.filter((evt) => new Date(evt?.startAt || evt?.start_at || evt?.created_at || evt?.createdAt || 0) <= to); }
                                                return filteredEvts.length === 0 ? (
                                                    <Box sx={{ textAlign: "center", py: 6 }}>
                                                        <EventRoundedIcon sx={{ fontSize: 56, color: "primary.main", mb: 1.5 }} />
                                                        <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5, color: "primary.main" }}>{committedEventSearchQuery || eventDateFrom || eventDateTo ? 'No events match your filters' : 'No events yet'}</Typography>
                                                        {(committedEventSearchQuery || eventDateFrom || eventDateTo) && <Typography variant="body2" color="text.secondary">Try adjusting your search or date range.</Typography>}
                                                    </Box>
                                                ) : (
                                                    <Stack spacing={2} sx={{ px: 1.5, pt: 1 }}>{filteredEvts.map((ev) => (<EventCard key={ev.id} event={ev} onClick={() => setSelectedEventPopup(ev)} compact />))}</Stack>
                                                );
                                            })()) : eventSubTab === 1 ? (
                                                eventCommentsLoading ? (<PulsingDots />) : (() => {
                                                    let filteredEvtComments = eventEngagementComments;
                                                    if (committedEventSearchQuery) {
                                                        const q = committedEventSearchQuery.toLowerCase();
                                                        filteredEvtComments = filteredEvtComments.filter((group) => {
                                                            const ev = group?.event || {};
                                                            const comments = Array.isArray(group?.comments) ? group.comments : [];
                                                            return String(ev?.title || '').toLowerCase().includes(q) ||
                                                                comments.some((c) => String(c?.content || '').toLowerCase().includes(q));
                                                        });
                                                    }
                                                    if (eventDateFrom) { const from = new Date(eventDateFrom); from.setHours(0, 0, 0, 0); filteredEvtComments = filteredEvtComments.filter((group) => { const comments = Array.isArray(group?.comments) ? group.comments : []; return comments.some((c) => new Date(c?.created_at || c?.createdAt || 0) >= from); }); }
                                                    if (eventDateTo) { const to = new Date(eventDateTo); to.setHours(23, 59, 59, 999); filteredEvtComments = filteredEvtComments.filter((group) => { const comments = Array.isArray(group?.comments) ? group.comments : []; return comments.some((c) => new Date(c?.created_at || c?.createdAt || 0) <= to); }); }
                                                    if (filteredEvtComments.length === 0) {
                                                        return (
                                                            <Box sx={{ textAlign: "center", py: 6 }}>
                                                                <ChatBubbleOutlineIcon sx={{ fontSize: 56, color: "primary.main", mb: 1.5 }} />
                                                                <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5, color: "primary.main" }}>No comments match your filters</Typography>
                                                                <Typography variant="body2" color="text.secondary">Try adjusting your search or date range.</Typography>
                                                            </Box>
                                                        );
                                                    }
                                                    const ecTruncate = (t, n) => { const s0 = String(t || '').trim(); return s0.length > n ? `${s0.slice(0, n)}…` : s0; };
                                                    return (
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                                            {filteredEvtComments.map((group) => {
                                                                const ev0 = group.event || {};
                                                                const comments = Array.isArray(group.comments) ? group.comments : [];
                                                                const total = comments.length;
                                                                const latest = comments[0] || null;
                                                                const eventPhoto = String(ev0?.mainPhotoUrl || ev0?.image_url || ev0?.photoUrl || '').trim();

                                                                return (
                                                                    <Box
                                                                        key={`ec-${ev0.id}`}
                                                                        sx={(t) => ({
                                                                            border: '1px solid',
                                                                            borderColor: alpha(t.palette.text.primary, 0.10),
                                                                            borderRadius: 2,
                                                                            bgcolor: 'background.paper',
                                                                            overflow: 'hidden',
                                                                            cursor: 'pointer',
                                                                            boxShadow: `0 4px 14px ${alpha(t.palette.text.primary, 0.06)}`,
                                                                            '&:hover': { borderColor: t.palette.primary.main },
                                                                        })}
                                                                    >
                                                                        {/* Event header — gold gradient */}
                                                                        <Box
                                                                            onClick={() => openArtistEventComment({ _viewEventOnly: true }, ev0)}
                                                                            sx={(t) => ({
                                                                                px: 1.5,
                                                                                py: 1,
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'space-between',
                                                                                gap: 1,
                                                                                background: `linear-gradient(90deg, ${alpha(t.custom?.brand?.brass || '#A87822', 0.14)} 0%, ${alpha(t.palette.background.paper, 0)} 75%)`,
                                                                                borderBottom: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                                                                            })}
                                                                        >
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                                                                                {eventPhoto ? (
                                                                                    <Avatar src={eventPhoto} alt={String(ev0?.title || '')} sx={{ width: 38, height: 38, flexShrink: 0 }} />
                                                                                ) : (
                                                                                    <Avatar sx={(t) => ({ width: 38, height: 38, flexShrink: 0, bgcolor: t.palette.primary.light })}>
                                                                                        <EventRoundedIcon sx={{ fontSize: 20, color: '#fff' }} />
                                                                                    </Avatar>
                                                                                )}
                                                                                <Box sx={{ minWidth: 0 }}>
                                                                                    <Typography sx={{ fontWeight: 900, fontSize: 14 }} noWrap title={String(ev0?.title || '')}>
                                                                                        {String(ev0?.title || '').trim() || 'Event'}
                                                                                    </Typography>
                                                                                    <Typography variant="caption" color="text.secondary" noWrap>
                                                                                        {formatEventDate(ev0) || (latest?.created_at ? formatRelativeTime(latest.created_at) : '')}
                                                                                    </Typography>
                                                                                </Box>
                                                                            </Box>
                                                                            <Box
                                                                                sx={(t) => ({
                                                                                    display: 'inline-flex',
                                                                                    alignItems: 'center',
                                                                                    gap: 0.5,
                                                                                    px: 1.1,
                                                                                    py: 0.4,
                                                                                    borderRadius: 999,
                                                                                    border: `1px solid ${alpha(t.palette.primary.main, 0.16)}`,
                                                                                    bgcolor: alpha(t.palette.primary.main, 0.06),
                                                                                })}
                                                                            >
                                                                                <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main' }}>
                                                                                    {total === 1 ? '1 comment' : `${total} comments`}
                                                                                </Typography>
                                                                            </Box>
                                                                        </Box>

                                                                        {/* Comment rows (up to 3) */}
                                                                        <Box sx={{ px: 1.5, py: 1.25, display: 'grid', gap: 1 }}>
                                                                            {comments.slice(0, 3).map((c) => {
                                                                                const cText = String(c?.content || '').trim();
                                                                                const isReply = !!c?.parent_id;
                                                                                const cTime = c?.created_at || null;

                                                                                const commenterAvatar = c?.account_avatar_url || c?.user_avatar || c?.avatar_url || c?.profile_picture || c?.profileImageUrl || c?.commenterAvatar || avatarSrc;
                                                                                const commenterName = c?.account_name || c?.user_name || c?.commenter_name || c?.author_name || c?.name || (c?.first_name ? `${c.first_name}${c.last_name ? ` ${c.last_name}` : ''}`.trim() : '') || name;
                                                                                const commenterHandle = c?.account_handle || c?.user_handle || c?.handle || c?.commenter_handle || (displayHandle || artistHandle ? String(displayHandle || artistHandle).replace(/^@+/, '') : '');

                                                                                return (
                                                                                    <Box
                                                                                        key={`ec-c-${c?.id || c?.comment_id || ''}`}
                                                                                        onClick={(e) => { e.stopPropagation(); openArtistEventComment(c, ev0); }}
                                                                                        sx={(t) => ({
                                                                                            border: '1px solid',
                                                                                            borderColor: alpha(t.palette.text.primary, 0.08),
                                                                                            borderRadius: 2,
                                                                                            px: 1.25,
                                                                                            py: 1,
                                                                                            bgcolor: alpha(t.palette.primary.main, 0.02),
                                                                                            cursor: 'pointer',
                                                                                            '&:hover': { borderColor: alpha(t.palette.primary.main, 0.32) },
                                                                                        })}
                                                                                    >
                                                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                                                                                <Avatar
                                                                                                    src={commenterAvatar}
                                                                                                    alt={commenterName}
                                                                                                    imgProps={{ referrerPolicy: 'no-referrer' }}
                                                                                                    sx={(t) => ({
                                                                                                        width: 34, height: 34, flexShrink: 0,
                                                                                                        bgcolor: alpha(t.palette.primary.main, 0.08),
                                                                                                        color: t.palette.primary.main,
                                                                                                        border: '1.5px solid',
                                                                                                        borderColor: alpha(t.palette.text.primary, 0.06),
                                                                                                        '& .MuiAvatar-img': { objectFit: 'cover', transform: 'scale(1.15)' },
                                                                                                    })}
                                                                                                >
                                                                                                    {isVisualArtist ? <PaletteRoundedIcon sx={{ fontSize: 18 }} /> : <MusicNoteRoundedIcon sx={{ fontSize: 18 }} />}
                                                                                                </Avatar>
                                                                                                <Box sx={{ minWidth: 0 }}>
                                                                                                    <Typography variant="body2" sx={{ fontWeight: 900, lineHeight: 1.1 }} noWrap>
                                                                                                        {commenterName}
                                                                                                    </Typography>
                                                                                                    <Typography variant="caption" color="text.secondary" noWrap>
                                                                                                        {commenterHandle ? `@${commenterHandle}` : ''}
                                                                                                        {isReply ? ' • Reply' : ''}
                                                                                                    </Typography>
                                                                                                </Box>
                                                                                            </Box>
                                                                                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                                                                                {cTime ? formatRelativeTime(cTime) : ''}
                                                                                            </Typography>
                                                                                        </Box>
                                                                                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                                                                                            {ecTruncate(cText, 260)}
                                                                                        </Typography>
                                                                                        {(() => {
                                                                                            const cImages = Array.isArray(c?.images) ? c.images.filter(Boolean) : (c?.image ? [c.image] : []);
                                                                                            if (cImages.length === 0) return null;
                                                                                            return (
                                                                                                <Box sx={{ display: 'flex', gap: 0.75, mt: 0.75, flexWrap: 'wrap' }}>
                                                                                                    {cImages.slice(0, 4).map((imgUrl, imgIdx) => (
                                                                                                        <Box
                                                                                                            key={imgIdx}
                                                                                                            component="img"
                                                                                                            src={imgUrl}
                                                                                                            alt={`comment photo ${imgIdx + 1}`}
                                                                                                            referrerPolicy="no-referrer"
                                                                                                            sx={(t) => ({
                                                                                                                width: cImages.length === 1 ? 120 : 64,
                                                                                                                height: cImages.length === 1 ? 120 : 64,
                                                                                                                borderRadius: 1.5,
                                                                                                                objectFit: 'cover',
                                                                                                                border: '1px solid',
                                                                                                                borderColor: alpha(t.palette.text.primary, 0.1),
                                                                                                                cursor: 'pointer',
                                                                                                            })}
                                                                                                        />
                                                                                                    ))}
                                                                                                </Box>
                                                                                            );
                                                                                        })()}
                                                                                    </Box>
                                                                                );
                                                                            })}
                                                                            {total > 3 && (
                                                                                <Typography
                                                                                    variant="caption"
                                                                                    color="text.secondary"
                                                                                    sx={{ fontWeight: 800, cursor: 'pointer' }}
                                                                                    onClick={(e) => { e.stopPropagation(); openArtistEventComment({ _viewEventOnly: true }, ev0); }}
                                                                                >
                                                                                    View all comments on this event
                                                                                </Typography>
                                                                            )}
                                                                        </Box>
                                                                    </Box>
                                                                );
                                                            })}
                                                        </Box>
                                                    );
                                                })()
                                            ) : (
                                                /* ── Events / Likes / Reposts sub-tabs ── */
                                                (() => {
                                                    const evtData = eventSubTab === 2 ? eventEngagementEvents : eventSubTab === 3 ? eventEngagementEvents : sortedArtistEvents;
                                                    const evtLoading = eventSubTab === 0
                                                        ? (eventViewMode === 'going' ? artistGoingLoading : eventViewMode === 'interested' ? artistInterestedLoading : eventsLoading)
                                                        : eventEngagementLoading;
                                                    let filteredEvts = evtData;
                                                    if (committedEventSearchQuery) {
                                                        const q = committedEventSearchQuery.toLowerCase();
                                                        filteredEvts = filteredEvts.filter((evt) =>
                                                            String(evt?.title || '').toLowerCase().includes(q) ||
                                                            String(evt?.description || '').toLowerCase().includes(q) ||
                                                            String(evt?.category || '').toLowerCase().includes(q)
                                                        );
                                                    }
                                                    if (eventDateFrom) { const from = new Date(eventDateFrom); from.setHours(0, 0, 0, 0); filteredEvts = filteredEvts.filter((evt) => new Date(evt?.startAt || evt?.start_at || evt?.created_at || evt?.createdAt || 0) >= from); }
                                                    if (eventDateTo) { const to = new Date(eventDateTo); to.setHours(23, 59, 59, 999); filteredEvts = filteredEvts.filter((evt) => new Date(evt?.startAt || evt?.start_at || evt?.created_at || evt?.createdAt || 0) <= to); }
                                                    return evtLoading ? (<PulsingDots />) : filteredEvts.length > 0 ? (
                                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
                                                            {filteredEvts.map((evt) => (
                                                                <EventCard key={evt.id} event={evt} onClick={() => handleEventClick(evt)} user={user} />
                                                            ))}
                                                        </Box>
                                                    ) : (
                                                        <Box sx={{ textAlign: "center", py: 6 }}>
                                                            {eventSubTab === 2 ? <FavoriteIcon sx={{ fontSize: 56, color: "primary.main", mb: 1.5 }} />
                                                                : eventSubTab === 3 ? <RepeatIcon sx={{ fontSize: 56, color: "primary.main", mb: 1.5 }} />
                                                                    : <EventRoundedIcon sx={{ fontSize: 56, color: "primary.main", mb: 1.5 }} />}
                                                            <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5, color: "primary.main" }}>
                                                                {committedEventSearchQuery || eventDateFrom || eventDateTo ? 'No events match your filters'
                                                                    : eventSubTab === 2 ? 'No current activity'
                                                                        : eventSubTab === 3 ? 'No current activity'
                                                                            : "No events found"}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.82rem" }}>
                                                                {eventSubTab === 2 ? (canManage ? "You haven't liked any events yet." : `${name} hasn't liked any events yet.`)
                                                                    : eventSubTab === 3 ? (canManage ? "You haven't reposted any events yet." : `${name} hasn't reposted any events yet.`)
                                                                        : (canManage ? "You haven't posted any events yet." : `${name} hasn't posted any events yet.`)}
                                                            </Typography>
                                                        </Box>
                                                    );
                                                })()
                                            )}
                                        </ContentFadeIn>
                                    </Box>
                                )}

                                {/* Jobs content */}
                                {engagementMode === "jobs" && (<ArtistJobsSection artistId={artist?.id} user={user} activeAccount={activeAccount} canManage={canManage && isOnArtistProfile} onJobClick={setSelectedJobPopup} onEditJob={handleEditJob} onDeleteJob={(job) => setDeleteConfirmJob(job)} onRenewJob={handleRenewJob} refreshNonce={jobsRefreshNonce} hideHeader externalSort={jobsSort} externalCategory={jobsCategory} externalSearch={localJobSearch} />)}

                                {/* Services content */}
                                {engagementMode === "services" && (<ArtistServicesSection artistId={artist?.id} ownerUserId={artist?.owner_user_id || artist?.ownerUserId} user={user} onServiceClick={setSelectedServicePopup} canManage={canManage && isOnArtistProfile} artistName={name} hideHeader externalView={servicesView} externalCategory={servicesCategory} externalSearch={localServiceSearch} />)}
                            </MobileActivityShell>
                        )}
                    </Box>
                </Container>

                {/* UserCardPopover — portaled, works across all tabs including mobile activity */}
                <UserCardPopover
                    anchorEl={engUserCardAnchor}
                    onClose={() => setEngUserCardAnchor(null)}
                    user={engUserCardUser}
                    onViewProfile={(u) => {
                        const path = u?.handle || u?.id;
                        if (path) window.location.assign(`/${path}`);
                    }}
                />

                {/* Photo Lightbox */}
                <PhotoLightbox
                    open={lightboxOpen}
                    onClose={handleCloseLightbox}
                    images={photos}
                    currentIndex={lightboxIndex}
                    onNavigate={handleNavigateLightbox}
                    name={name}
                />

                {/* Create Post Dialog */}
                <CreateArtistPostDialog
                    open={createPostOpen}
                    onClose={() => setCreatePostOpen(false)}
                    artistId={artist?.id}
                    artistName={name}
                    onPostCreated={() => { recordPost(); handlePostCreated(); showSuccess('Your post has been published!'); }}
                />

                {/* Edit Post Dialog */}
                <EditArtistPostDialog
                    open={editPostOpen}
                    onClose={() => { setEditPostOpen(false); setEditingPost(null); }}
                    post={editingPost}
                    artistId={artist?.id}
                    artistName={name}
                    onPostUpdated={() => { handlePostCreated(); showSuccess('Post updated successfully'); }}
                />

                {/* Quick Message Dialog for Artist */}
                <ArtistQuickMessageDialog
                    open={quickMsgOpen}
                    onClose={() => setQuickMsgOpen(false)}
                    onSent={() => { setQuickMsgOpen(false); showSuccess("Message sent!"); }}
                    recipient={{
                        type: "artist",
                        id: artist?.id,
                        name: name || artist?.handle || "Artist",
                        avatar_url: artist?.avatar_url || artist?.avatarUrl || null,
                    }}
                />

                {/* Share Artist Profile Dialog */}
                <ShareDialog
                    contentType="artist"
                    open={profileShareOpen}
                    onClose={() => setProfileShareOpen(false)}
                    artist={artist}
                    viewer={user}
                    sx={{ zIndex: 100001 }}
                />

                <SmartMenu
                    anchorEl={artistMenuEl}
                    open={artistMenuOpen}
                    onClose={() => setArtistMenuEl(null)}
                    onClick={(e) => e.stopPropagation()}
                    disableScrollLock
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    PaperProps={{
                        sx: {
                            mt: 0.5,
                            borderRadius: 2.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: (t) => t.custom?.shadows?.lg || `0 12px 40px ${alpha(t.palette.text.primary, 0.15)}`,
                            minWidth: 200,
                            py: 0.5,
                        },
                    }}
                >
                    <MenuItem onClick={handleArtistCopyLink} sx={{ py: 1 }}>
                        <ListItemIcon>
                            <LinkIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Copy link" />
                    </MenuItem>
                    {canReportArtist ? [
                        <Divider key="report-divider" sx={{ my: 0.5 }} />,
                        <MenuItem key="report-item" onClick={handleArtistReportClick} sx={{ py: 1 }}>
                            <ListItemIcon>
                                <FlagOutlinedIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Report artist" />
                        </MenuItem>,
                    ] : null}
                    {user?.id && !canManage && !isActiveArtistAccount && (
                        <MenuItem onClick={hiddenPostsByMe ? handleUnhideArtist : handleHideArtist} disabled={hideBusy || blockBusy} sx={{ py: 1 }}>
                            <ListItemIcon><VisibilityOffRoundedIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary={hiddenPostsByMe ? 'Unhide posts' : 'Hide posts'} />
                        </MenuItem>
                    )}
                    {user?.id && !canManage && !isActiveArtistAccount && (
                        <MenuItem onClick={blockedByMe ? handleUnblockArtist : handleBlockArtist} disabled={hideBusy || blockBusy} sx={{ py: 1, color: blockedByMe ? 'text.primary' : 'error.main' }}>
                            <ListItemIcon sx={{ color: blockedByMe ? 'text.primary' : 'error.main' }}><BlockRoundedIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary={blockedByMe ? 'Unblock artist' : 'Block artist'} />
                        </MenuItem>
                    )}
                </SmartMenu>

                <ReportContentDialog
                    open={artistReportOpen}
                    onClose={() => setArtistReportOpen(false)}
                    onSubmit={submitArtistReport}
                    title="Report artist"
                    sx={{ zIndex: 100001 }}
                />

                {/* ── Artist Followers / Following Dialog ── */}
                <ArtistFollowsDialogPP
                    open={followsDialogOpen}
                    onClose={() => setFollowsDialogOpen(false)}
                    artistId={artist?.id}
                    artistName={safeArtist.name || "Artist"}
                    initialTab={followsDialogTab}
                    viewerUserId={user?.id}
                    acctHeaders={typeof getAcctHdrs === 'function' ? getAcctHdrs() : {}}
                />

                {/* ═══════════ Job Detail Popup ═══════════ */}
                {/* On mobile activity tab, the MobileActivityShell DetailPanel handles job detail */}
                <Dialog
                    open={Boolean(selectedJobPopup) && !(activeTab === ACTIVITY_TAB && isMobile)}
                    onClose={() => setSelectedJobPopup(null)}
                    maxWidth="md"
                    fullWidth
                    fullScreen={isMobile}
                    disableScrollLock
                    PaperProps={{
                        sx: {
                            borderRadius: isMobile ? 0 : 3,
                            height: isMobile ? '100%' : '92vh',
                            maxHeight: isMobile ? '100%' : '92vh',
                            overflow: 'hidden',
                            width: isMobile ? '100%' : 'min(780px, 90vw)',
                            position: 'relative',
                        },
                    }}
                    sx={{ zIndex: 100001 }}
                >
                    {selectedJobPopup && (
                        <>
                            <Box
                                sx={(t) => ({
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: 48,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    px: 1.5,
                                    bgcolor: alpha(t.palette.background.paper, 0.95),
                                    backdropFilter: 'blur(8px)',
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    zIndex: 10,
                                })}
                            >
                                <IconButton size="small" onClick={() => setSelectedJobPopup(null)} aria-label="Close">
                                    <CloseRoundedIcon fontSize="small" />
                                </IconButton>
                            </Box>
                            <Box sx={{ position: 'absolute', top: 48, left: 0, right: 0, bottom: 0, overflowY: 'auto' }}>
                                <JobDetailPanel
                                    job={selectedJobPopup}
                                    jobId={selectedJobPopup?.id}
                                    user={user}
                                    loggedInUser={user}
                                    activeAccount={activeAccount}
                                    onClose={() => setSelectedJobPopup(null)}
                                    onDeleted={() => { setSelectedJobPopup(null); setJobsRefreshNonce((n) => n + 1); showSuccess('Job deleted successfully'); }}
                                    onEdit={(job) => { setSelectedJobPopup(null); handleEditJob(job); }}
                                    onRenew={(job) => { handleRenewJob(job); }}
                                />
                            </Box>
                        </>
                    )}
                </Dialog>


                {/* ═══════════ Service Detail Popup ═══════════ */}
                <ServicePopupDialog
                    service={selectedServicePopup}
                    open={Boolean(selectedServicePopup) && !(activeTab === ACTIVITY_TAB && isMobile)}
                    onClose={() => setSelectedServicePopup(null)}
                    user={user}
                    sx={{ zIndex: 100001 }}
                />

                <PhotoCommentsDialog
                    open={photoCommentsOpen}
                    onClose={() => { setPhotoCommentsOpen(false); setPhotoCommentsType('avatar'); setPhotoCommentsPhotoId(null); setPhotoCommentsPhotoUrl(''); setPendingPhotoHighlightId(null); }}
                    profileHandleOrId={artistHandle || artist?.id}
                    viewerId={user?.id}
                    isOwner={canManage}
                    highlightCommentId={pendingPhotoHighlightId}
                    photoType={photoCommentsType === 'gallery' ? undefined : photoCommentsType}
                    photoId={photoCommentsPhotoId}
                    photoUrl={photoCommentsPhotoUrl}
                    apiPrefix="/api/music/artists"
                    onSuccess={showSuccess}
                    allPhotos={photoCommentsType === 'gallery' ? photos : undefined}
                    onNavigatePhoto={photoCommentsType === 'gallery' ? (newPhotoId, newPhotoUrl) => {
                        setPhotoCommentsPhotoId(newPhotoId);
                        setPhotoCommentsPhotoUrl(newPhotoUrl || '');
                    } : undefined}
                    onReportPhoto={handlePhotoReportOpen}
                    sx={{ zIndex: 100001 }}
                />

                {/* Photo report dialog */}
                <ReportDialog
                    open={photoReportOpen}
                    onClose={() => { setPhotoReportOpen(false); setPhotoReportTarget(null); }}
                    onSubmit={handlePhotoReportSubmit}
                    title="Report Photo"
                    sx={{ zIndex: 100001 }}
                />

                {/* ═══════════ Create / Edit Job Modal ═══════════ */}
                <CreateJobModal
                    open={createJobOpen}
                    onClose={() => { setCreateJobOpen(false); setEditingJob(null); }}
                    onCreated={handleJobCreated}
                    editingJob={editingJob}
                    sx={{ zIndex: 100001 }}
                />

                {/* ═══════════ Delete Job Confirmation ═══════════ */}
                <Dialog open={Boolean(deleteConfirmJob)} onClose={() => setDeleteConfirmJob(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }} sx={{ zIndex: 100001 }}>
                    <DialogTitle sx={{ fontWeight: 900 }}>Delete Job</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary">
                            Are you sure you want to delete <strong>{deleteConfirmJob?.title || 'this job'}</strong>? This action cannot be undone.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setDeleteConfirmJob(null)} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 999 }}>Cancel</Button>
                        <Button variant="contained" color="error" onClick={handleDeleteJobConfirm} sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999 }}>Delete</Button>
                    </DialogActions>
                </Dialog>

                {/* ═══════════ Post Detail Popup (slides from right on mobile) ═══════════ */}
                {/* On mobile activity tab, the MobileActivityShell DetailPanel handles post detail */}
                <PostDetailDialog
                    post={previewPost}
                    open={Boolean(previewPost) && !(activeTab === ACTIVITY_TAB && isMobile)}
                    onClose={() => { setPreviewPost(null); setPostScrollToCommentId(null); setPostHighlightCommentId(null); }}
                    user={user}
                    onCommentSuccess={showSuccess}
                    scrollToCommentId={postScrollToCommentId}
                    highlightCommentId={postHighlightCommentId}
                />

                {/* ═══════════ Event Detail Popup (matches BusinessPublicPage) ═══════════ */}
                {/* On mobile activity tab, the MobileActivityShell DetailPanel handles event detail */}
                <Dialog
                    open={Boolean(selectedEventPopup) && !(activeTab === ACTIVITY_TAB && isMobile)}
                    onClose={() => { setSelectedEventPopup(null); setEventScrollToCommentId(null); setEventHighlightCommentId(null); }}
                    maxWidth="md"
                    fullWidth
                    fullScreen={isMobile}
                    disableScrollLock
                    PaperProps={{
                        sx: {
                            borderRadius: isMobile ? 0 : 3,
                            height: isMobile ? '100%' : '92vh',
                            maxHeight: isMobile ? '100%' : '92vh',
                            overflow: 'hidden',
                            width: isMobile ? '100%' : 'min(780px, 90vw)',
                            position: 'relative',
                        },
                    }}
                    slotProps={{
                        backdrop: {
                            sx: {
                                bgcolor: (t) => alpha(t.palette.common.black, 0.55),
                                backdropFilter: 'blur(4px)',
                            },
                        },
                    }}
                    sx={{ zIndex: 100001 }}
                >
                    {selectedEventPopup && (
                        <>
                            {/* Close button header */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    px: 1.5,
                                    py: 0.75,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: 'background.paper',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 10,
                                    flexShrink: 0,
                                }}
                            >
                                <IconButton size="small" onClick={() => { setSelectedEventPopup(null); setEventScrollToCommentId(null); setEventHighlightCommentId(null); }} aria-label="Close">
                                    <CloseRoundedIcon fontSize="small" />
                                </IconButton>
                            </Box>
                            {/* Scrollable content area */}
                            <Box sx={{ overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
                                <EventDetailPanel
                                    event={selectedEventPopup}
                                    user={user}
                                    onRequireAuth={() => {}}
                                    onEventUpdate={(updated) => setSelectedEventPopup((prev) => prev ? { ...prev, ...updated } : prev)}
                                    scrollToCommentId={eventScrollToCommentId}
                                    highlightCommentId={eventHighlightCommentId}
                                />
                            </Box>
                        </>
                    )}
                </Dialog>

                <RateLimitDialog
                    open={rateLimitOpen}
                    onClose={() => setRateLimitOpen(false)}
                    retryAfterSec={rateLimitInfo.retryAfterSec}
                    reason={rateLimitInfo.reason}
                    actionLabel={rateLimitInfo.actionLabel}
                    sx={{ zIndex: 100001 }}
                />

                {/* ═══════════ Photo Preview Dialog (matching BusinessPublicPage) ═══════════ */}
                <Dialog open={Boolean(photoPreviewSrc)} onClose={() => setPhotoPreviewSrc('')} fullScreen={isMobileSm} maxWidth="md" sx={{ zIndex: 100001 }} PaperProps={{ sx: { bgcolor: 'black', borderRadius: isMobileSm ? 0 : 2, overflow: 'hidden', position: 'relative' } }}>
                    <IconButton onClick={() => setPhotoPreviewSrc('')} sx={{ position: 'absolute', top: 8, right: 8, color: 'white', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }, zIndex: 1 }}>
                        <CloseRoundedIcon />
                    </IconButton>
                    {photoPreviewSrc && <Box component="img" src={photoPreviewSrc} alt="" referrerPolicy="no-referrer" sx={{ display: 'block', maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', mx: 'auto' }} />}
                </Dialog>

                <SuccessSnackbar {...successSnackbarProps} />

            </Box>
        </ContentFadeIn>
    );
}

/* ─── Artist Follows Preview (sidebar mini-grid, matches FollowsSection) ─── */
const FOLLOWS_PREVIEW_MAX = 6;

function ArtistFollowsPreview({ artistId, artistName, viewerUserId, acctHeaders, user, refreshNonce, onOpenAll }) {
    const navigate = useNavigate();
    const [tab, setTab] = useState(0);
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!artistId || !viewerUserId) { setFollowers([]); setFollowing([]); setLoading(false); return; }
        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                const res = await secureFetch(
                    `${FOLLOW_API_BASE_PP}/follows/social/${encodeURIComponent(viewerUserId)}?account_type=artist&account_id=${artistId}`,
                    { credentials: "include", headers: { Accept: "application/json", ...(acctHeaders || {}) } }
                );
                if (cancelled) return;
                if (!res.ok) { setLoading(false); return; }
                const data = await res.json();
                setFollowers(Array.isArray(data?.followers) ? data.followers : []);
                setFollowing(Array.isArray(data?.following) ? data.following : []);
            } catch {
                if (!cancelled) { setFollowers([]); setFollowing([]); }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [artistId, viewerUserId, acctHeaders, refreshNonce]);

    const list = tab === 0 ? followers : following;
    const preview = list.slice(0, FOLLOWS_PREVIEW_MAX);

    const goProfile = (u) => {
        if (!u) return;
        navigate(`/${encodeURIComponent(u.handle || u.id)}`);
    };

    const tabSx = (t) => ({
        fontWeight: 700, textTransform: "none", fontSize: "0.85rem", minHeight: 40,
        color: alpha(t.palette.primary.main, 0.7),
        "&.Mui-selected": { color: "primary.main" },
    });

    return (
        <Box sx={{ display: "flex", flexDirection: "column" }}>
            {/* Header row */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography sx={{ fontWeight: 900, fontSize: "1.05rem" }}>Followers &amp; Following</Typography>
                <Button
                    size="small"
                    onClick={() => onOpenAll?.(tab)}
                    sx={{ textTransform: "uppercase", fontWeight: 800, fontSize: "0.7rem", color: "text.secondary", "&:hover": { color: "primary.main" } }}
                >
                    View All
                </Button>
            </Stack>

            {/* Tabs */}
            <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{ mb: 1, minHeight: 40, "& .MuiTabs-indicator": { backgroundColor: "secondary.main", height: 3, borderRadius: "3px 3px 0 0" } }}
            >
                <Tab label={`Followers (${followers.length})`} sx={tabSx} />
                <Tab label={`Following (${following.length})`} sx={tabSx} />
            </Tabs>

            {/* Fixed-height scrollable grid */}
            <Box sx={{ pt: 0.5 }}>
                {loading ? (
                    <Box sx={{ p: 3, textAlign: "center" }}>
                        <CircularProgress size={24} sx={{ color: "primary.main" }} />
                    </Box>
                ) : preview.length === 0 ? (
                    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1.5 }}>
                        <Box sx={(t) => ({ width: 56, height: 56, borderRadius: "50%", bgcolor: alpha(t.palette.primary.main, 0.08), display: "flex", alignItems: "center", justifyContent: "center" })}>
                            {tab === 0
                                ? <PersonOutlineOutlinedIcon sx={{ fontSize: 28, color: "primary.main" }} />
                                : <PersonAddRoundedIcon sx={{ fontSize: 28, color: "primary.main" }} />}
                        </Box>
                        <Typography color="text.secondary" sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                            {tab === 0 ? "No followers yet" : "Not following anyone"}
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))" }, gridAutoRows: "1fr", gap: 1 }}>
                        {preview.map((u) => {
                            const uName = `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.display_name || u.name || (u.handle ? `@${u.handle}` : "User");
                            const uHandle = u.handle || u.username || "";
                            const uAvatar = u.avatar_url || u.profile_picture || "";
                            const acctType = String(u.account_type || "").toLowerCase();
                            const isBiz = acctType === "business";
                            const isArt = acctType === "artist";
                            // Visual artist sub-type — tolerant of missing field
                            const uProfileType = String(u.profile_type || u.profileType || "").toLowerCase();
                            const isArtVisual = isArt && uProfileType === "artist";
                            const hasRealAvatar = Boolean(uAvatar && uAvatar !== "null" && !uAvatar.includes("default_avatar"));
                            const badge = isArt
                                ? (isArtVisual
                                    ? { label: "Artist", Icon: PaletteRoundedIcon, color: "info.main" }
                                    : { label: "Artist", Icon: MusicNoteRoundedIcon, color: "info.main" })
                                : isBiz ? { label: "Business", Icon: StorefrontRoundedIcon, color: "secondary.main" }
                                    : null;

                            return (
                                <Box
                                    key={`${u.account_type || "p"}-${u.id}`}
                                    onClick={() => goProfile(u)}
                                    sx={(t) => ({
                                        cursor: "pointer", borderRadius: 2.5, p: 0, height: "100%",
                                        display: "flex", flexDirection: "column", alignItems: "stretch",
                                        bgcolor: "background.paper", border: "1px solid",
                                        borderColor: alpha(t.palette.primary.main, 0.12),
                                        boxShadow: `0 2px 8px ${alpha(t.palette.primary.main, 0.06)}`,
                                        overflow: "hidden",
                                        transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
                                        "&:hover": {
                                            borderColor: alpha(t.palette.primary.main, 0.35),
                                            boxShadow: `0 8px 24px ${alpha(t.palette.primary.main, 0.12)}`,
                                        },
                                    })}
                                >
                                    <Box sx={(t) => ({
                                        width: "100%", aspectRatio: "1 / 0.85",
                                        display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                                        ...(isBiz || isArt
                                            ? { bgcolor: alpha(t.palette.primary.main, 0.06), color: t.palette.primary.main }
                                            : { bgcolor: alpha(t.palette.text.primary, 0.04), color: t.palette.text.secondary }),
                                    })}>
                                        {hasRealAvatar ? (
                                            <Box component="img" src={uAvatar} alt={uName} onError={(e) => { e.currentTarget.style.display = "none"; }}
                                                 sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                        ) : (
                                            isBiz ? <StorefrontRoundedIcon sx={{ fontSize: 40 }} />
                                                : isArt
                                                    ? (isArtVisual ? <PaletteRoundedIcon sx={{ fontSize: 38 }} /> : <MusicNoteRoundedIcon sx={{ fontSize: 38 }} />)
                                                    : <PersonRoundedIcon sx={{ fontSize: 40 }} />
                                        )}
                                    </Box>
                                    <Box sx={{ px: 0.75, pt: 0.5, pb: 0.75, textAlign: "center", minWidth: 0, minHeight: 62 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                                            <Typography variant="body2" noWrap title={uName}
                                                        sx={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "primary.main", fontSize: "0.8rem" }}>
                                                {uName}
                                            </Typography>
                                            {Boolean(u.is_verified) && <VerifiedRoundedIcon sx={{ fontSize: 14, color: "primary.main", flexShrink: 0 }} />}
                                        </Box>
                                        {uHandle && (
                                            <Typography variant="caption" noWrap title={`@${uHandle}`}
                                                        sx={(t) => ({ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: alpha(t.palette.primary.main, 0.6), fontWeight: 500, fontSize: "0.68rem" })}>
                                                @{uHandle}
                                            </Typography>
                                        )}
                                        {badge ? (() => {
                                            const BadgeIcon = badge.Icon;
                                            return (
                                                <Box sx={(t) => ({ display: "inline-flex", alignItems: "center", gap: 0.3, mt: 0.25, px: 0.6, py: 0.15, borderRadius: 1, bgcolor: alpha(t.palette[badge.color.split(".")[0]]?.main || t.palette.secondary.main, 0.12) })}>
                                                    <BadgeIcon sx={{ fontSize: 12, color: badge.color }} />
                                                    <Typography variant="caption" sx={{ fontSize: "0.68rem", fontWeight: 700, color: badge.color, lineHeight: 1.2 }}>{badge.label}</Typography>
                                                </Box>
                                            );
                                        })() : null}
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </Box>
        </Box>
    );
}

/* ─── Artist Followers / Following Dialog (matches FollowsSection popup) ─── */
function ArtistFollowsDialogPP({ open, onClose, artistId, artistName, initialTab, viewerUserId, acctHeaders }) {
    const navigate = useNavigate();
    const [tab, setTab] = useState(initialTab || 0);
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [appliedQuery, setAppliedQuery] = useState("");
    const dialogScrollRef = useRef(null);

    useEffect(() => {
        if (open) setTab(initialTab || 0);
    }, [open, initialTab]);

    // Reset search when switching tabs
    useEffect(() => {
        if (!open) return;
        setSearchText("");
        setAppliedQuery("");
        if (dialogScrollRef.current) dialogScrollRef.current.scrollTop = 0;
    }, [tab, open]);

    useEffect(() => {
        if (!open || !artistId || !viewerUserId) return;
        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                const res = await secureFetch(
                    `${FOLLOW_API_BASE_PP}/follows/social/${viewerUserId}?account_type=artist&account_id=${artistId}`,
                    { credentials: "include", headers: { Accept: "application/json", ...(acctHeaders || {}) } }
                );
                if (cancelled) return;
                if (!res.ok) { setLoading(false); return; }
                const data = await res.json();
                setFollowers(Array.isArray(data?.followers) ? data.followers : []);
                setFollowing(Array.isArray(data?.following) ? data.following : []);
            } catch {
                if (!cancelled) { setFollowers([]); setFollowing([]); }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [open, artistId, viewerUserId, acctHeaders]);

    const handleClose = () => { setSearchText(""); setAppliedQuery(""); onClose(); };

    const handleApplySearch = () => {
        setAppliedQuery(searchText);
        if (dialogScrollRef.current) dialogScrollRef.current.scrollTop = 0;
    };
    const handleClearSearch = () => {
        setSearchText("");
        setAppliedQuery("");
        if (dialogScrollRef.current) dialogScrollRef.current.scrollTop = 0;
    };

    const list = tab === 0 ? followers : following;
    const normalizedQuery = appliedQuery.trim().toLowerCase();
    const filtered = normalizedQuery
        ? list.filter((u) => {
            const n = String(u.name || `${u.first_name || ""} ${u.last_name || ""}`).toLowerCase();
            const h = String(u.handle || "").toLowerCase();
            const d = String(u.display_name || "").toLowerCase();
            return n.includes(normalizedQuery) || h.includes(normalizedQuery) || d.includes(normalizedQuery);
        })
        : list;

    // Sort alphabetically
    const sorted = filtered.slice().sort((a, b) => {
        const norm = (s) => String(s || "").toLowerCase().trim();
        const aKey = norm(a.last_name || a.first_name) ? `${norm(a.last_name)} ${norm(a.first_name)}`.trim() : (norm(a.display_name || a.name || a.handle));
        const bKey = norm(b.last_name || b.first_name) ? `${norm(b.last_name)} ${norm(b.first_name)}`.trim() : (norm(b.display_name || b.name || b.handle));
        return aKey.localeCompare(bKey, undefined, { sensitivity: "base" });
    });

    const handleUserClick = (u) => {
        if (!u) return;
        const slug = u.handle || u.id;
        navigate(`/${slug}`);
        handleClose();
    };

    const getAcctBadge = (u) => {
        const acctType = String(u?.account_type || "").toLowerCase();
        const uProfileType = String(u?.profile_type || u?.profileType || "").toLowerCase();
        if (acctType === "artist") {
            return (uProfileType === "artist")
                ? { label: "Artist", Icon: PaletteRoundedIcon, color: "info.main" }
                : { label: "Artist", Icon: MusicNoteRoundedIcon, color: "info.main" };
        }
        if (acctType === "business") return { label: "Business", Icon: StorefrontRoundedIcon, color: "secondary.main" };
        return null;
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="md"
            PaperProps={{
                sx: (t) => ({
                    width: 980,
                    maxWidth: "96vw",
                    height: { xs: "92vh", sm: "90vh", md: "88vh" },
                    maxHeight: "92vh",
                    borderRadius: 3,
                    overflow: "hidden",
                    bgcolor: "background.paper",
                    border: `1px solid ${alpha(t.palette.primary.main, 0.1)}`,
                    boxShadow: `0 24px 80px ${alpha(t.palette.primary.main, 0.25)}`,
                }),
            }}
            sx={{ zIndex: 100001 }}
        >
            <DialogTitle
                sx={(t) => ({
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    alignItems: "center",
                    py: 1.5,
                    px: { xs: 1.5, sm: 2.5 },
                    borderBottom: 1,
                    borderColor: alpha(t.palette.primary.main, 0.1),
                    bgcolor: "background.paper",
                    background: `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.03)} 0%, ${alpha(t.palette.primary.main, 0.05)} 100%)`,
                })}
            >
                <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main" }}>
                    {artistName}
                </Typography>
                <IconButton
                    aria-label="Close"
                    onClick={handleClose}
                    size="small"
                    sx={(t) => ({
                        bgcolor: alpha(t.palette.primary.main, 0.08),
                        "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.15) },
                    })}
                >
                    <CloseRoundedIcon />
                </IconButton>
            </DialogTitle>

            <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100% - 56px)", overflow: "hidden" }}>
                {/* Tabs + search */}
                <Box sx={{ flexShrink: 0 }}>
                    <Tabs
                        value={tab}
                        onChange={(_, v) => setTab(v)}
                        sx={(t) => ({
                            borderBottom: 1,
                            borderColor: alpha(t.palette.primary.main, 0.1),
                            px: { xs: 1, sm: 2 },
                            "& .MuiTabs-indicator": { backgroundColor: "secondary.main", height: 3, borderRadius: "3px 3px 0 0" },
                        })}
                    >
                        <Tab label={`Followers (${followers.length})`} sx={{ fontWeight: 700, textTransform: "none", fontSize: "0.85rem", minHeight: 40 }} />
                        <Tab label={`Following (${following.length})`} sx={{ fontWeight: 700, textTransform: "none", fontSize: "0.85rem", minHeight: 40 }} />
                    </Tabs>

                    {/* Search bar */}
                    <Box sx={(t) => ({ p: { xs: 1.25, sm: 2 }, borderBottom: 1, borderColor: alpha(t.palette.primary.main, 0.08), bgcolor: alpha(t.palette.primary.main, 0.02) })}>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search by name or username…"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleApplySearch(); }}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={(t) => ({ color: alpha(t.palette.primary.main, 0.5) })} /></InputAdornment>,
                                    endAdornment: searchText ? (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => setSearchText("")} sx={{ p: 0.25 }}><ClearRoundedIcon fontSize="small" /></IconButton>
                                        </InputAdornment>
                                    ) : null,
                                }}
                                sx={(t) => ({
                                    "& .MuiOutlinedInput-root": {
                                        bgcolor: "background.paper", borderRadius: 2,
                                        "& fieldset": { borderColor: alpha(t.palette.primary.main, 0.2) },
                                        "&:hover fieldset": { borderColor: alpha(t.palette.primary.main, 0.4) },
                                        "&.Mui-focused fieldset": { borderColor: "primary.main" },
                                    },
                                })}
                            />
                            <Button variant="contained" onClick={handleApplySearch} sx={{ textTransform: "none", fontWeight: 700, bgcolor: "primary.main", borderRadius: 2, px: 2.5, "&:hover": { bgcolor: "primary.light" } }}>
                                Search
                            </Button>
                            <Button onClick={handleClearSearch} disabled={!appliedQuery} sx={{ textTransform: "none", fontWeight: 600, color: "primary.main" }}>
                                Clear
                            </Button>
                        </Box>
                    </Box>
                </Box>

                {/* Scrollable list */}
                <Box
                    ref={dialogScrollRef}
                    sx={(t) => ({
                        flex: "1 1 auto", minHeight: 0, overflowY: "auto",
                        px: { xs: 1.25, sm: 2 }, pb: 2, pt: 1.5,
                        bgcolor: alpha(t.palette.primary.main, 0.015),
                    })}
                >
                    {loading ? (
                        <Stack spacing={1.5} sx={{ px: 2, pt: 1 }}>
                            {[0, 1, 2, 3].map((i) => (
                                <Stack key={i} direction="row" spacing={1.5} alignItems="center">
                                    <Skeleton variant="rounded" width={72} height={72} sx={{ borderRadius: 2 }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Skeleton width="60%" height={16} />
                                        <Skeleton width="40%" height={14} sx={{ mt: 0.5 }} />
                                    </Box>
                                </Stack>
                            ))}
                        </Stack>
                    ) : list.length === 0 ? (
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 6, gap: 2 }}>
                            <Box sx={(t) => ({ width: 72, height: 72, borderRadius: "50%", bgcolor: alpha(t.palette.primary.main, 0.08), display: "flex", alignItems: "center", justifyContent: "center" })}>
                                {tab === 0 ? <PeopleAltRoundedIcon sx={{ fontSize: 36, color: "primary.main" }} /> : <PersonAddRoundedIcon sx={{ fontSize: 36, color: "primary.main" }} />}
                            </Box>
                            <Box sx={{ textAlign: "center" }}>
                                <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", color: "text.primary", mb: 0.5 }}>
                                    {tab === 0 ? "No followers yet" : "Not following anyone"}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280 }}>
                                    {tab === 0 ? "When people follow this artist, they'll show up here." : "Accounts that this artist follows will appear here."}
                                </Typography>
                            </Box>
                        </Box>
                    ) : normalizedQuery && filtered.length === 0 ? (
                        <Typography sx={{ p: 2 }} color="text.secondary">No results.</Typography>
                    ) : (
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(1, minmax(0, 1fr))", sm: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
                            {sorted.map((u) => {
                                const displayName = u.name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || "Unknown";
                                const handleStr = u.handle ? `@${u.handle}` : "";
                                const avatarUrl = u.avatar_url || defaultAvatar;
                                const isVerified = Boolean(u.is_verified);
                                const badge = getAcctBadge(u);
                                const hasRealAvatar = Boolean(avatarUrl && avatarUrl !== "null" && !avatarUrl.includes("default_avatar"));
                                const acctType = String(u.account_type || "").toLowerCase();
                                const uProfileType = String(u.profile_type || u.profileType || "").toLowerCase();
                                const isVisualArtistUser = acctType === "artist" && uProfileType === "artist";

                                return (
                                    <Box
                                        key={`${u.account_type || "p"}-${u.id}`}
                                        onClick={() => handleUserClick(u)}
                                        sx={(t) => ({
                                            display: "grid",
                                            gridTemplateColumns: "auto 1fr",
                                            alignItems: "center",
                                            gap: 1,
                                            p: 1,
                                            borderRadius: 2.5,
                                            bgcolor: "background.paper",
                                            border: "1px solid",
                                            borderColor: alpha(t.palette.primary.main, 0.12),
                                            boxShadow: `0 2px 8px ${alpha(t.palette.primary.main, 0.05)}`,
                                            cursor: "pointer",
                                            transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
                                            "&:hover": {
                                                boxShadow: `0 8px 24px ${alpha(t.palette.primary.main, 0.12)}`,
                                                borderColor: alpha(t.palette.primary.main, 0.3),
                                            },
                                        })}
                                    >
                                        <Avatar
                                            src={hasRealAvatar ? avatarUrl : undefined}
                                            variant="rounded"
                                            sx={(t) => ({
                                                width: { xs: 72, sm: 80 },
                                                height: { xs: 72, sm: 80 },
                                                borderRadius: 2,
                                                border: `2px solid ${alpha(t.palette.primary.main, 0.1)}`,
                                                bgcolor: acctType === "artist" ? alpha(t.palette.primary.main, 0.06) : alpha(t.palette.text.primary, 0.04),
                                                color: acctType === "artist" ? t.palette.primary.main : t.palette.text.secondary,
                                            })}
                                            imgProps={{ referrerPolicy: "no-referrer" }}
                                        >
                                            {acctType === "artist"
                                                ? (isVisualArtistUser ? <PaletteRoundedIcon sx={{ fontSize: 36 }} /> : <MusicNoteRoundedIcon sx={{ fontSize: 36 }} />)
                                                : acctType === "business" ? <StorefrontRoundedIcon sx={{ fontSize: 36 }} />
                                                    : <PeopleAltRoundedIcon sx={{ fontSize: 36 }} />}
                                        </Avatar>

                                        <Box sx={{ minWidth: 0 }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                <Typography
                                                    noWrap
                                                    title={displayName}
                                                    sx={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "primary.main", fontSize: "0.85rem" }}
                                                >
                                                    {displayName}
                                                </Typography>
                                                {isVerified && <VerifiedRoundedIcon sx={{ fontSize: 14, color: "primary.main", flexShrink: 0 }} />}
                                            </Box>
                                            {handleStr && (
                                                <Typography noWrap sx={(t) => ({ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: alpha(t.palette.primary.main, 0.6), fontSize: "0.75rem" })}>
                                                    {handleStr}
                                                </Typography>
                                            )}
                                            {(u.city || u.county) && (
                                                <Typography sx={{ color: "text.disabled", fontSize: "0.7rem", mt: 0.15 }}>
                                                    {[u.city, u.county].filter(Boolean).join(", ")}
                                                </Typography>
                                            )}
                                            {badge ? (() => {
                                                const BadgeIcon = badge.Icon;
                                                return (
                                                    <Box sx={(t) => ({ display: "inline-flex", alignItems: "center", gap: 0.3, mt: 0.25, px: 0.6, py: 0.15, borderRadius: 1, bgcolor: alpha(t.palette[badge.color.split(".")[0]]?.main || t.palette.secondary.main, 0.12) })}>
                                                        <BadgeIcon sx={{ fontSize: 12, color: badge.color }} />
                                                        <Typography variant="caption" sx={{ fontSize: "0.68rem", fontWeight: 700, color: badge.color, lineHeight: 1.2 }}>
                                                            {badge.label}
                                                        </Typography>
                                                    </Box>
                                                );
                                            })() : null}
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </Box>
            </Box>
        </Dialog>
    );
}

/* ─── ArtistJobsSection — fetches and renders jobs with JobCard (matches BusinessEngagementTabs) ─── */
function ArtistJobsSection({ artistId, user, activeAccount, canManage, onJobClick, onEditJob, onDeleteJob, onRenewJob, refreshNonce = 0, hideHeader = false, externalSort, externalCategory, externalSearch }) {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    // Use external state if provided, otherwise internal
    const [_jobsSort, _setJobsSort] = useState('newest');
    const [_jobsCategory, _setJobsCategory] = useState('');
    const [_localJobSearchTerm, _setLocalJobSearchTerm] = useState('');
    const [_localJobSearch, _setLocalJobSearch] = useState('');
    const jobsSort = externalSort ?? _jobsSort;
    const jobsCategory = externalCategory ?? _jobsCategory;
    const localJobSearch = externalSearch ?? _localJobSearch;
    const localJobSearchTerm = externalSearch != null ? externalSearch : _localJobSearchTerm;
    const setJobsSort = externalSort != null ? () => {} : _setJobsSort;
    const setJobsCategory = externalCategory != null ? () => {} : _setJobsCategory;
    const setLocalJobSearchTerm = externalSearch != null ? () => {} : _setLocalJobSearchTerm;
    const setLocalJobSearch = externalSearch != null ? () => {} : _setLocalJobSearch;

    useEffect(() => {
        if (!artistId) { setLoading(false); return; }
        let alive = true;
        const ctrl = new AbortController();
        (async () => {
            setLoading(true);
            try {
                const hdrs = getAccountHeaders() || {};
                const res = await axios.get('/api/jobs/feed', {
                    params: { posterArtistId: artistId, limit: 200 },
                    signal: ctrl.signal, withCredentials: true, headers: { ...hdrs },
                });
                if (!alive) return;
                const items = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
                // Mark jobs as owned when viewing own profile so JobCard shows edit/delete/renew
                const enriched = canManage
                    ? items.map((item) => ({ ...item, isOwner: true }))
                    : items;
                setJobs(enriched);
            } catch { if (alive) setJobs([]); }
            finally { if (alive) setLoading(false); }
        })();
        return () => { alive = false; ctrl.abort(); };
    }, [artistId, refreshNonce, canManage]);

    const filteredJobs = React.useMemo(() => {
        let list = [...jobs];
        if (localJobSearch) {
            const q = localJobSearch.toLowerCase();
            list = list.filter((j) => {
                const title = String(j?.title || '').toLowerCase();
                const desc = String(j?.description || j?.body || '').toLowerCase();
                const cat = String(j?.category || j?.job_category || '').toLowerCase();
                return title.includes(q) || desc.includes(q) || cat.includes(q);
            });
        }
        if (jobsCategory) {
            list = list.filter((j) => {
                const cat = String(j?.category || j?.job_category || '').trim().toLowerCase();
                return cat === jobsCategory.toLowerCase();
            });
        }
        if (jobsSort === 'newest') {
            list.sort((a, b) => new Date(b?.created_at || b?.date_created || b?.posted_at || 0) - new Date(a?.created_at || a?.date_created || a?.posted_at || 0));
        } else if (jobsSort === 'expiring') {
            list.sort((a, b) => {
                const rawA = a?.expires_at || a?.expiresAt || a?.expiry_date || a?.expiryDate || a?.application_deadline || a?.deadline || a?.valid_until || null;
                const rawB = b?.expires_at || b?.expiresAt || b?.expiry_date || b?.expiryDate || b?.application_deadline || b?.deadline || b?.valid_until || null;
                const dateA = rawA ? new Date(rawA).getTime() : Infinity;
                const dateB = rawB ? new Date(rawB).getTime() : Infinity;
                // Jobs with no expiry go to the end; otherwise soonest-expiring first
                if (dateA !== dateB) return dateA - dateB;
                // Tiebreaker: newest first
                return new Date(b?.created_at || b?.date_created || 0) - new Date(a?.created_at || a?.date_created || 0);
            });
        }
        return list;
    }, [jobs, jobsCategory, jobsSort, localJobSearch]);

    const handleClick = (job) => {
        if (onJobClick) { onJobClick(job); return; }
        if (job?.id) navigate(`/jobs/${job.id}`);
    };

    return (
        <>
            {/* Search bar + Clear — matches BusinessEngagementTabs */}
            {!hideHeader && (
                <Box sx={{ px: 1.5, pt: 1.25, pb: 0.5, bgcolor: 'background.paper', zIndex: 7 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.75 }}>
                        <SearchInput
                            placeholder="Search jobs…"
                            value={localJobSearchTerm}
                            onChange={(e) => setLocalJobSearchTerm(e?.target?.value ?? '')}
                            onSearch={() => setLocalJobSearch(localJobSearchTerm)}
                            onClear={() => { setLocalJobSearchTerm(''); setLocalJobSearch(''); }}
                            inputProps={{ name: 'll-artist-jobs-search' }}
                        />
                        <Tooltip title="Clear all filters" arrow>
                            <IconButton
                                size="small"
                                onClick={() => {
                                    setLocalJobSearchTerm(''); setLocalJobSearch('');
                                    setJobsSort('newest'); setJobsCategory('');
                                }}
                                sx={(t) => ({
                                    width: 36, height: 36, flexShrink: 0,
                                    borderRadius: 999,
                                    border: '1px solid',
                                    borderColor: alpha(t.palette.primary.main, 0.12),
                                    bgcolor: alpha(t.palette.text.primary, 0.03),
                                    '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.06), borderColor: alpha(t.palette.primary.main, 0.18) },
                                })}
                                aria-label="Clear filters"
                            >
                                <RestartAltRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>

                    </Stack>

                    {/* Filter dropdowns */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1, pb: 0.75 }}>
                        <FormControl size="small" fullWidth sx={PROFILE_CONTROL_SX}>
                            <InputLabel shrink>Sort by</InputLabel>
                            <Select label="Sort by" value={jobsSort} onChange={(e) => setJobsSort(e.target.value)} MenuProps={profileMenuProps}>
                                <MenuItem value="newest">Newest</MenuItem>
                                <MenuItem value="expiring">Expiring Soon</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl size="small" fullWidth sx={PROFILE_CONTROL_SX}>
                            <InputLabel shrink>Category</InputLabel>
                            <Select label="Category" value={jobsCategory} onChange={(e) => setJobsCategory(e.target.value)} displayEmpty renderValue={(v) => {
                                if (!v) return 'All Categories';
                                const label = jobCategoryLabel(v);
                                const Icon = JOB_CATEGORY_ICONS[v] || CategoryRoundedIcon;
                                return (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                        <Icon sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                                        {label}
                                    </Box>
                                );
                            }} MenuProps={profileMenuProps}>
                                <MenuItem value="">All Categories</MenuItem>
                                {(() => {
                                    const countMap = {};
                                    jobs.forEach((j) => { const c = String(j?.category || j?.job_category || '').trim().toLowerCase(); if (c) countMap[c] = (countMap[c] || 0) + 1; });
                                    return Object.keys(JOB_CATEGORY_LABELS)
                                        .filter((key) => (countMap[key] || 0) > 0)
                                        .map((key) => {
                                            const Icon = JOB_CATEGORY_ICONS[key] || CategoryRoundedIcon;
                                            const count = countMap[key] || 0;
                                            return (
                                                <MenuItem key={key} value={key}>
                                                    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                        <ProfileCategoryRow Icon={Icon} label={jobCategoryLabel(key)} />
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>{count}</Typography>
                                                    </Box>
                                                </MenuItem>
                                            );
                                        });
                                })()}
                            </Select>
                        </FormControl>
                    </Box>
                </Box>
            )}
            <Box sx={{ p: 1.5, minHeight: 200 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
                ) : filteredJobs.length === 0 ? (
                    <Box sx={{ py: 8, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <WorkOutlineRoundedIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
                        <Typography sx={{ fontWeight: 800, fontSize: 18, color: 'text.primary', mt: 1 }}>{jobsCategory ? 'No jobs in this category' : 'No job listings'}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 320 }}>{jobsCategory ? 'Try selecting a different category.' : "This artist hasn't posted any job listings yet."}</Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
                        {filteredJobs.map((job) => (
                            <JobCard key={job.id} job={job} onClick={() => handleClick(job)} user={user} activeAccount={activeAccount} onEdit={onEditJob} onDelete={onDeleteJob} onRenew={onRenewJob} disableHoverEffects />
                        ))}
                    </Box>
                )}
            </Box>
        </>
    );
}

/* ─── ArtistServicesSection — fetches and renders services with ServiceCard (matches BusinessEngagementTabs) ─── */
function ArtistServicesSection({ artistId, ownerUserId, user, onServiceClick, canManage = false, artistName = '', hideHeader = false, externalView, externalCategory, externalSearch }) {
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [favServices, setFavServices] = useState([]);
    const [favLoading, setFavLoading] = useState(false);
    const [_servicesView, _setServicesView] = useState('offered');
    const [_servicesCategory, _setServicesCategory] = useState('');
    const [_localServiceSearchTerm, _setLocalServiceSearchTerm] = useState('');
    const [_localServiceSearch, _setLocalServiceSearch] = useState('');
    const servicesView = externalView ?? _servicesView;
    const servicesCategory = externalCategory ?? _servicesCategory;
    const localServiceSearch = externalSearch ?? _localServiceSearch;
    const localServiceSearchTerm = externalSearch != null ? externalSearch : _localServiceSearchTerm;
    const setServicesView = externalView != null ? () => {} : _setServicesView;
    const setServicesCategory = externalCategory != null ? () => {} : _setServicesCategory;
    const setLocalServiceSearchTerm = externalSearch != null ? () => {} : _setLocalServiceSearchTerm;
    const setLocalServiceSearch = externalSearch != null ? () => {} : _setLocalServiceSearch;

    // Fetch offered services
    useEffect(() => {
        if (!artistId) { setLoading(false); return; }
        let alive = true;
        const ctrl = new AbortController();
        (async () => {
            setLoading(true);
            try {
                const hdrs = getAccountHeaders() || {};
                const res = await axios.get('/api/services/feed', {
                    params: { posterArtistId: artistId, limit: 200 },
                    signal: ctrl.signal, withCredentials: true, headers: { ...hdrs },
                });
                if (!alive) return;
                const items = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
                setServices(items);
            } catch { if (alive) setServices([]); }
            finally { if (alive) setLoading(false); }
        })();
        return () => { alive = false; ctrl.abort(); };
    }, [artistId]);

    // Fetch favorite services
    useEffect(() => {
        if (!ownerUserId) return;
        let alive = true;
        const ctrl = new AbortController();
        (async () => {
            setFavLoading(true);
            try {
                const hdrs = getAccountHeaders() || {};
                const res = await axios.get(`/api/services/user/${ownerUserId}/favorites`, {
                    signal: ctrl.signal, withCredentials: true, headers: { ...hdrs },
                });
                if (!alive) return;
                const items = Array.isArray(res.data?.items) ? res.data.items : [];
                setFavServices(items);
            } catch { if (alive) setFavServices([]); }
            finally { if (alive) setFavLoading(false); }
        })();
        return () => { alive = false; ctrl.abort(); };
    }, [ownerUserId]);

    const source = servicesView === 'favorites' ? favServices : services;
    const isSourceLoading = servicesView === 'favorites' ? favLoading : loading;

    const filteredServices = React.useMemo(() => {
        let list = [...source];
        if (localServiceSearch) {
            const q = localServiceSearch.toLowerCase();
            list = list.filter((s) => {
                const title = String(s?.title || s?.name || '').toLowerCase();
                const desc = String(s?.description || s?.body || '').toLowerCase();
                const cat = String(s?.categorySlug || s?.category_slug || s?.categoryName || '').toLowerCase();
                return title.includes(q) || desc.includes(q) || cat.includes(q);
            });
        }
        if (servicesCategory) {
            list = list.filter((s) => {
                const slug = String(s?.categorySlug || s?.category_slug || '').trim().toLowerCase();
                return slug === servicesCategory.toLowerCase();
            });
        }
        return list;
    }, [source, servicesCategory, localServiceSearch]);

    const handleClick = (svc) => {
        if (onServiceClick) { onServiceClick(svc); return; }
        if (svc?.id) navigate(`/services/${svc.id}`);
    };

    const firstName = String(artistName || '').split(/\s+/)[0] || 'Artist';

    return (
        <>


            <Box sx={{ p: 1.5, minHeight: 200 }}>
                {isSourceLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
                ) : filteredServices.length === 0 ? (
                    <Box sx={{ py: 8, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        {servicesView === 'favorites'
                            ? <FavoriteRoundedIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
                            : <BusinessCenterIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />}
                        <Typography sx={{ fontWeight: 800, fontSize: 18, color: 'text.primary', mt: 1 }}>
                            {servicesView === 'favorites'
                                ? 'No Favorite Services'
                                : 'No services yet'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 320 }}>
                            {servicesView === 'favorites'
                                ? `${canManage ? "You haven't" : `${firstName} hasn't`} favorited any services yet.`
                                : `${canManage ? "You haven't" : `${firstName} hasn't`} posted any service listings yet.`}
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
                        {filteredServices.map((svc) => (
                            <ServiceCard key={svc.id} service={svc} onClick={() => handleClick(svc)} user={user} />
                        ))}
                    </Box>
                )}
            </Box>
        </>
    );
}

/* ─── Artist Quick Message Rate-Limit Tracker (sessionStorage-backed, shared across pages) ─── */
const _ARTIST_MSG_WINDOW = 10 * 60 * 1000;
const _ARTIST_MSG_MAX = 5;
const _ARTIST_MSG_STORAGE_PREFIX = "ll:artistMsgTrack:";

function _getArtistMsgEntries(recipientKey) {
    const now = Date.now();
    const storageKey = _ARTIST_MSG_STORAGE_PREFIX + String(recipientKey);
    try {
        const raw = sessionStorage.getItem(storageKey);
        if (!raw) return [];
        return JSON.parse(raw).filter(t => now - t < _ARTIST_MSG_WINDOW);
    } catch { return []; }
}

function _trackArtistMsg(recipientKey) {
    const now = Date.now();
    const storageKey = _ARTIST_MSG_STORAGE_PREFIX + String(recipientKey);
    const entries = _getArtistMsgEntries(recipientKey);
    entries.push(now);
    try { sessionStorage.setItem(storageKey, JSON.stringify(entries)); } catch { /* */ }
}

function _isArtistLimited(recipientKey) {
    return _getArtistMsgEntries(recipientKey).length >= _ARTIST_MSG_MAX;
}

/* ─── Reusable Quick Message Dialog for Artists ─── */
function ArtistQuickMessageDialog({ open, onClose, onSent, recipient }) {
    const aqmTheme = useTheme();
    const aqmIsMobile = useMediaQuery(aqmTheme.breakpoints.down('md'));
    const [body, setBody] = useState("");
    const [photos, setPhotos] = useState([]);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [cooldown, setCooldown] = useState(0);
    const [limitReached, setLimitReached] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!open) {
            const timer = setTimeout(() => {
                setBody("");
                setPhotos([]);
                setError("");
                setCooldown(0);
                setSuccess(false);
            }, 200);
            return () => clearTimeout(timer);
        }
        if (open && recipient?.id && _isArtistLimited(recipient.id)) {
            setLimitReached(true);
        }
    }, [open, recipient?.id]);

    const handleSend = async () => {
        if (!recipient?.id || (!body.trim() && photos.length === 0) || cooldown > 0) return;
        if (_isArtistLimited(recipient.id)) { setLimitReached(true); return; }
        setSending(true);
        setError("");
        try {
            const photoPayload = [];
            for (const p of photos) {
                if (p.file) {
                    try {
                        const ct = p.file.type || "image/jpeg";
                        const sn = `${Date.now()}_msg_${p.file.name || "photo.jpg"}`;
                        const s = await getSignedUploadUrl({ folder: "music/messages", fileName: sn, contentType: ct });
                        if (s?.uploadUrl) { await uploadToSignedUrl({ uploadUrl: s.uploadUrl, file: p.file, contentType: ct }); photoPayload.push({ url: String(s.publicUrl || "").trim(), objectPath: String(s.objectPath || "").trim() }); }
                    } catch { /* skip */ }
                }
            }
            const hdrs = getAccountHeaders();
            await axios.post("/api/messages/send", {
                recipient_type: "artist",
                recipient_id: recipient.id,
                body: body.trim(),
                photos: photoPayload,
            }, { withCredentials: true, headers: { ...hdrs } });
            _trackArtistMsg(recipient.id);
            photos.forEach((p) => { if (p?.url && !p._existing) { try { URL.revokeObjectURL(p.url); } catch {} } });
            setPhotos([]);
            setSuccess(true);
        } catch (err) {
            const status = err?.response?.status;
            const data = err?.response?.data;
            if (status === 429) {
                const wait = Number(data?.retryAfterSeconds) || 15;
                setError(data?.message || data?.error || "You're sending messages too quickly. Please wait a moment.");
                setCooldown(wait);
                const timer = setInterval(() => {
                    setCooldown(prev => {
                        if (prev <= 1) { clearInterval(timer); setError(""); return 0; }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                setError(data?.message || err?.message || "Failed to send message.");
            }
        } finally {
            setSending(false);
        }
    };

    const handleClose = () => {
        if (sending) return;
        photos.forEach((p) => { if (p?.url && !p._existing) { try { URL.revokeObjectURL(p.url); } catch {} } });
        setPhotos([]);
        onClose();
    };

    return (
        <>
            <Dialog
                open={open && !limitReached}
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
                fullScreen={aqmIsMobile}
                disableScrollLock
                PaperProps={{ sx: { borderRadius: aqmIsMobile ? 0 : 3, maxHeight: aqmIsMobile ? "100vh" : "85vh", ...(aqmIsMobile && { display: "flex", flexDirection: "column" }) } }}
                sx={{ zIndex: 100001 }}
            >
                <DialogTitle sx={{ pr: 6, ...(aqmIsMobile && { borderBottom: "1px solid", borderColor: "divider", flexShrink: 0 }) }}>
                    {!success && (
                        <Typography sx={{ fontWeight: 950, fontSize: 16 }}>Contact Artist</Typography>
                    )}
                    <IconButton aria-label="Close" onClick={handleClose} disabled={sending}
                                sx={{ position: "absolute", right: 12, top: 12 }}>
                        <CloseRoundedIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={aqmIsMobile ? { flex: 1, overflowY: "auto", pb: 0, display: "flex", flexDirection: "column" } : undefined}>
                    {success ? (
                        <Stack spacing={2} sx={{ py: 2, ...(aqmIsMobile && { flex: 1, justifyContent: "center" }) }}>
                            <Box sx={{ textAlign: "center" }}>
                                <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 48, color: "success.main", mb: 1 }} />
                                <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 0.5 }}>Message Sent!</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    The artist will receive your message and get back to you soon.
                                </Typography>
                            </Box>
                            <Button variant="contained" fullWidth onClick={() => { onSent(); }}
                                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, ...(aqmIsMobile && { py: 1.5, fontSize: "1rem" }) }}>
                                Done
                            </Button>
                        </Stack>
                    ) : (
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: "text.secondary" }}>To:</Typography>
                                <Chip
                                    avatar={<Avatar src={recipient?.avatar_url || undefined} imgProps={{ referrerPolicy: "no-referrer" }} sx={{ bgcolor: (t) => alpha(t.palette.primary.main, 0.08), color: "primary.main", width: 24, height: 24 }}>{String(recipient?.profile_type || recipient?.profileType || "").toLowerCase() === "artist" ? <PaletteRoundedIcon sx={{ fontSize: 14 }} /> : <MusicNoteRoundedIcon sx={{ fontSize: 14 }} />}</Avatar>}
                                    label={recipient?.name || "Artist"}
                                    sx={{ fontWeight: 700, fontSize: "0.8rem" }}
                                />
                            </Box>
                            <Box sx={(t) => ({ p: 1.5, borderRadius: 2, bgcolor: alpha(t.palette.primary.main, 0.04), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.1) })}>
                                <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{recipient?.name || "Artist"}</Typography>
                                <Typography variant="caption" color="text.secondary">Music Artist</Typography>
                            </Box>
                            <TextField
                                label="Message"
                                placeholder="Describe what you need, timeline, budget, etc."
                                multiline
                                minRows={aqmIsMobile ? 4 : 5}
                                maxRows={aqmIsMobile ? 8 : 10}
                                value={body}
                                onChange={(e) => { setBody(e.target.value.slice(0, 2000)); if (error) setError(""); }}
                                inputProps={{ maxLength: 2000 }}
                                fullWidth
                                error={Boolean(error)}
                                helperText={error || `${body.length} / 2,000`}
                                FormHelperTextProps={{ sx: { textAlign: error ? "left" : "right", mr: 0.5, fontWeight: 600, fontSize: "0.75rem" } }}
                                sx={{ "& .MuiOutlinedInput-root": { backgroundColor: "background.paper" } }}
                            />
                            <PhotosUploadSection photos={photos} setPhotos={setPhotos} disabled={sending}
                                                 maxPhotos={4} title="Photos (optional)" helperText="Add up to 4 photos to help describe what you need."
                                                 addButtonText="Add photos" />
                        </Stack>
                    )}
                </DialogContent>
                {/* Pinned bottom actions — only show when not in success state */}
                {!success && (
                    <Box sx={{ flexShrink: 0, borderTop: "1px solid", borderColor: "divider", p: 2, pb: aqmIsMobile ? bottomInsetSx({ basePadding: 16 }).paddingBottom : 2, bgcolor: "background.paper" }}>
                        {sending && <LinearProgress sx={{ mb: 1.5, borderRadius: 1 }} />}
                        <Stack direction="row" spacing={1.5} justifyContent={aqmIsMobile ? "stretch" : "flex-end"}>
                            <Button variant="outlined" onClick={handleClose} disabled={sending}
                                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, ...(aqmIsMobile && { flex: 1, py: 1.4, fontSize: "0.95rem" }) }}>
                                Cancel
                            </Button>
                            <Button variant="contained" onClick={handleSend} disabled={(!body.trim() && photos.length === 0) || sending || cooldown > 0}
                                    startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendRoundedIcon />}
                                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, ...(aqmIsMobile && { flex: 2, py: 1.4, fontSize: "0.95rem" }) }}>
                                {cooldown > 0 ? `Wait ${cooldown}s` : sending ? "Sending\u2026" : "Send Message"}
                            </Button>
                        </Stack>
                    </Box>
                )}
            </Dialog>

            {/* Rate limit reached dialog */}
            <Dialog open={limitReached} onClose={() => { setLimitReached(false); onClose(); }} maxWidth="xs" fullWidth
                    disableScrollLock sx={{ zIndex: 100001 }} PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogContent sx={{ textAlign: "center", py: 4, px: 3 }}>
                    <AccessTimeRoundedIcon sx={{ fontSize: 48, color: "warning.main", mb: 2 }} />
                    <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 1 }}>Slow down a bit!</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        You've sent several messages to this artist recently. Give them a chance to respond before sending more.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: "center" }}>
                    <Button variant="contained" onClick={() => { setLimitReached(false); onClose(); }}
                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, px: 4 }}>
                        Got it
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

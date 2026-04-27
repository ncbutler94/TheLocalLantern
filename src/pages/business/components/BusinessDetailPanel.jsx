// src/pages/business/components/BusinessDetailPanel.jsx
//
// BusinessDetailPanel
// -------------------
// Right-rail detail panel for the Businesses tab on BusinessHubPage.
// Shows a rich business preview when a directory card is selected.
// Fetches full business data via slug for additional detail (hours, gallery, address).
//
// Tabs: About | Photos | Reviews
//
// Exports: BusinessDetailPanel (default)

import React, { Fragment, useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useNavigate } from 'react-router-dom';
import axios from '../../../api/axiosInstance';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Collapse,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Paper,
    Radio,
    RadioGroup,
    Select,
    Skeleton,
    Stack,
    Tab,
    Tabs,
    Tooltip,
    Typography,
} from '@mui/material';

// Icons
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import XIcon from '@mui/icons-material/X';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import SvgIcon from '@mui/material/SvgIcon';
import PhotoLibraryRoundedIcon from '@mui/icons-material/PhotoLibraryRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import ReviewsRoundedIcon from '@mui/icons-material/ReviewsRounded';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import ImageNotSupportedRoundedIcon from '@mui/icons-material/ImageNotSupportedRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import DynamicFeedRoundedIcon from '@mui/icons-material/DynamicFeedRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ShareIcon from '@mui/icons-material/Share';
import ShareDialog from '../../../components/ShareDialog';
import DataSourceAttribution from '../../../components/DataSourceAttribution';
import VerifiedIcon from '@mui/icons-material/Verified';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import HotelRoundedIcon from '@mui/icons-material/HotelRounded';
import PersonIcon from '@mui/icons-material/Person';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import ForestRoundedIcon from '@mui/icons-material/ForestRounded';
// Additional icons for expanded highlight section icon set
import LocalCafeRoundedIcon from '@mui/icons-material/LocalCafeRounded';
import CakeRoundedIcon from '@mui/icons-material/CakeRounded';
import LocalBarRoundedIcon from '@mui/icons-material/LocalBarRounded';
import NatureRoundedIcon from '@mui/icons-material/NatureRounded';
import ParkRoundedIcon from '@mui/icons-material/ParkRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import HandymanRoundedIcon from '@mui/icons-material/HandymanRounded';
import ConstructionRoundedIcon from '@mui/icons-material/ConstructionRounded';
import ElectricalServicesRoundedIcon from '@mui/icons-material/ElectricalServicesRounded';
import PlumbingRoundedIcon from '@mui/icons-material/PlumbingRounded';
import AgricultureRoundedIcon from '@mui/icons-material/AgricultureRounded';
import ShoppingBagRoundedIcon from '@mui/icons-material/ShoppingBagRounded';
import LocalMallRoundedIcon from '@mui/icons-material/LocalMallRounded';
import LocalFloristRoundedIcon from '@mui/icons-material/LocalFloristRounded';
import LocalGasStationRoundedIcon from '@mui/icons-material/LocalGasStationRounded';
import CarRepairRoundedIcon from '@mui/icons-material/CarRepairRounded';
import SelfImprovementRoundedIcon from '@mui/icons-material/SelfImprovementRounded';
import SpaRoundedIcon from '@mui/icons-material/SpaRounded';
import FaceRoundedIcon from '@mui/icons-material/FaceRounded';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import BrushRoundedIcon from '@mui/icons-material/BrushRounded';
import ChildCareRoundedIcon from '@mui/icons-material/ChildCareRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import HistoryEduRoundedIcon from '@mui/icons-material/HistoryEduRounded';
import LuggageRoundedIcon from '@mui/icons-material/LuggageRounded';
import FlightRoundedIcon from '@mui/icons-material/FlightRounded';
import ComputerRoundedIcon from '@mui/icons-material/ComputerRounded';
import PhoneAndroidRoundedIcon from '@mui/icons-material/PhoneAndroidRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import HandshakeRoundedIcon from '@mui/icons-material/HandshakeRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import GppGoodRoundedIcon from '@mui/icons-material/GppGoodRounded';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import RestaurantRoundedIcon from '@mui/icons-material/RestaurantRounded';
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded';
import HomeRepairServiceRoundedIcon from '@mui/icons-material/HomeRepairServiceRounded';
import YardRoundedIcon from '@mui/icons-material/YardRounded';
import MedicalServicesRoundedIcon from '@mui/icons-material/MedicalServicesRounded';
import ContentCutRoundedIcon from '@mui/icons-material/ContentCutRounded';
import FitnessCenterRoundedIcon from '@mui/icons-material/FitnessCenterRounded';
import BusinessCenterRoundedIcon from '@mui/icons-material/BusinessCenterRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import PetsRoundedIcon from '@mui/icons-material/PetsRounded';
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded';
import TheaterComedyRoundedIcon from '@mui/icons-material/TheaterComedyRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PushPinIcon from '@mui/icons-material/PushPin';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ActionBar, { ReportDialog } from '../../../components/ActionBar';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ReplyRoundedIcon from '@mui/icons-material/ReplyRounded';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import LinearProgress from '@mui/material/LinearProgress';
import TextField from '@mui/material/TextField';
import Rating from '@mui/material/Rating';

// Category Icons (same mapping as BusinessDirectoryCard)
import RestaurantIcon from '@mui/icons-material/Restaurant';
import StorefrontIcon from '@mui/icons-material/Storefront';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService';
import YardIcon from '@mui/icons-material/Yard';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import SchoolIcon from '@mui/icons-material/School';
import PetsIcon from '@mui/icons-material/Pets';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import BuildIcon from '@mui/icons-material/Build';
import CategoryIcon from '@mui/icons-material/Category';

// Entity type icons
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';

import defaultAvatar from '../../../assets/profile/default_avatar.png';
import { PhotoCommentsDialog } from '../../profile/userProfile/ProfileHeader';
import { getAccountHeaders } from '../../../utils/getAccountHeadersStatic';
import { secureFetch } from '../../../utils/secureFetch';

import { fetchBusinessPublicBySlug, fetchBusinessPosts, fetchBusinessReviews, submitBusinessReview, deleteBusinessReview, toggleReviewHelpful, replyToBusinessReview, deleteReviewReply } from '../api/businessApi';
import PhotosUploadSection from '../../../components/PhotosUploadSection';
import UserCardPopover from '../../../components/UserCardPopover';
import BusinessPostDetailModal from './BusinessPostDetailModal';
import BusinessEngagementTabs from './BusinessEngagementTabs';
import MusicPostDetailPanel from '../../music/components/MusicPostDetailPanel';
import PostPage from '../../community/PostDetailModal';
import { DetailPanel } from '../../../components/MobileActivityShell';
import { useActiveAccount } from '../../../components/AccountContext';
import { CATEGORY_CONFIG, DEFAULT_CATEGORY_CONFIG } from '../config/categoryConfig';
import SmartMenu from '../../../components/SmartMenu';
import SuccessSnackbar from '../../../components/SuccessSnackbar';

/* ── GCS upload helpers ── */
async function getSignedUploadUrl({ folder, fileName, contentType }) {
    const res = await secureFetch("/api/uploads/signed-url", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folder, fileName, contentType }) });
    if (!res.ok) throw new Error("Failed to get upload URL");
    return res.json();
}
async function uploadToSignedUrl({ uploadUrl, file, contentType }) {
    // GCS direct upload — intentionally raw fetch (external domain, no CSRF needed)
    const res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
    if (!res.ok) throw new Error("Upload failed");
}

// ─── Highlight Section Icons ────────────────────────────────────────────────
const HL_ICONS = {
    // Generic
    Star: StarRoundedIcon, Favorite: FavoriteRoundedIcon, CheckCircle: CheckCircleRoundedIcon,
    Trophy: EmojiEventsRoundedIcon, Shield: GppGoodRoundedIcon, Build: BuildRoundedIcon,
    // Community / people
    Groups: GroupsRoundedIcon, Volunteer: VolunteerActivismIcon, Handshake: HandshakeRoundedIcon,
    People: PeopleRoundedIcon,
    // Food & drink
    Restaurant: RestaurantRoundedIcon, RestaurantMenu: RestaurantMenuRoundedIcon,
    Coffee: LocalCafeRoundedIcon, Cake: CakeRoundedIcon, Bar: LocalBarRoundedIcon,
    // Location / environment
    Place: PlaceRoundedIcon, Forest: ForestRoundedIcon, Nature: NatureRoundedIcon,
    Park: ParkRoundedIcon, Home: HomeRoundedIcon,
    // Services / trades
    Handyman: HandymanRoundedIcon, ConstructionOutlined: ConstructionRoundedIcon,
    Electric: ElectricalServicesRoundedIcon, Plumbing: PlumbingRoundedIcon,
    Agriculture: AgricultureRoundedIcon,
    // Retail / shopping
    Storefront: StorefrontRoundedIcon, ShoppingBag: ShoppingBagRoundedIcon,
    LocalMall: LocalMallRoundedIcon, LocalFlorist: LocalFloristRoundedIcon,
    // Auto
    DirectionsCar: DirectionsCarRoundedIcon, LocalGasStation: LocalGasStationRoundedIcon,
    CarRepair: CarRepairRoundedIcon,
    // Wellness
    MedicalServices: MedicalServicesRoundedIcon, FitnessCenter: FitnessCenterRoundedIcon,
    SelfImprovement: SelfImprovementRoundedIcon, Spa: SpaRoundedIcon,
    // Beauty
    ContentCut: ContentCutRoundedIcon, Face: FaceRoundedIcon,
    // Pets
    Pets: PetsRoundedIcon,
    // Arts & entertainment
    TheaterComedy: TheaterComedyRoundedIcon, MusicNote: MusicNoteRoundedIcon,
    Palette: PaletteRoundedIcon, Brush: BrushRoundedIcon,
    // Education / family
    School: SchoolRoundedIcon, Child: ChildCareRoundedIcon, MenuBook: MenuBookRoundedIcon,
    // History / heritage
    History: HistoryEduRoundedIcon, AccountBalance: AccountBalanceRoundedIcon,
    // Travel / lodging
    Hotel: HotelRoundedIcon, Luggage: LuggageRoundedIcon, Flight: FlightRoundedIcon,
    // Tech
    Computer: ComputerRoundedIcon, Phone: PhoneAndroidRoundedIcon,
    // Time / hours
    Schedule: ScheduleRoundedIcon, AccessTime: AccessTimeRoundedIcon,
};
function HlIconRender({ name: iconName, ...props }) {
    const Icon = HL_ICONS[iconName] || StarRoundedIcon;
    return <Icon {...props} />;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_ICON = {
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
    other: CategoryIcon,
};

const CATEGORY_LABELS = {
    food_drink: 'Food & Drink',
    shopping_retail: 'Shopping & Retail',
    automotive: 'Automotive',
    home_services: 'Home Services',
    home_garden: 'Home & Garden',
    health_wellness: 'Health & Wellness',
    beauty_personal_care: 'Beauty & Personal Care',
    fitness_recreation: 'Fitness & Recreation',
    professional_services: 'Professional Services',
    education_childcare: 'Education & Childcare',
    pets_animals: 'Pets & Animals',
    travel_lodging: 'Travel & Lodging',
    arts_entertainment: 'Arts & Entertainment',
    community_nonprofit: 'Community & Nonprofit',
    technology_repair: 'Technology & Repair',
    other: 'Other',
};

const ENTITY_TYPE_CONFIG = {
    business: { label: 'Business', icon: StorefrontRoundedIcon },
    organization: { label: 'Organization', icon: GroupsRoundedIcon },
    nonprofit: { label: 'Nonprofit', icon: VolunteerActivismIcon },
    government: { label: 'Government', icon: AccountBalanceRoundedIcon },
};

const CATEGORY_ICON_MAP = {
    food_drink: RestaurantRoundedIcon, shopping_retail: StorefrontRoundedIcon,
    automotive: DirectionsCarRoundedIcon, home_services: HomeRepairServiceRoundedIcon,
    home_garden: YardRoundedIcon, health_wellness: MedicalServicesRoundedIcon,
    beauty_personal_care: ContentCutRoundedIcon, fitness_recreation: FitnessCenterRoundedIcon,
    professional_services: BusinessCenterRoundedIcon, education_childcare: SchoolRoundedIcon,
    pets_animals: PetsRoundedIcon, travel_lodging: TravelExploreRoundedIcon,
    arts_entertainment: TheaterComedyRoundedIcon, community_nonprofit: VolunteerActivismIcon,
    technology_repair: BuildRoundedIcon, other: CategoryRoundedIcon,
};
const ENTITY_ICON_MAP = {
    business: StorefrontRoundedIcon,
    nonprofit: VolunteerActivismIcon,
    organization: GroupsRoundedIcon,
    government: AccountBalanceRoundedIcon,
};

const BUILDER_ICON_MAP = {
    menu: RestaurantMenuRoundedIcon,
    service_menu: LocalOfferRoundedIcon,
    provider: GroupsRoundedIcon,
    class: EventRoundedIcon,
    accommodation: HotelRoundedIcon,
};

function SectionHeading({ icon: Icon, children }) {
    return (
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
            {Icon && <Icon sx={{ fontSize: 16, color: 'text.secondary' }} />}
            <Typography sx={{ fontWeight: 900, fontSize: 14 }}>{children}</Typography>
        </Stack>
    );
}

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',
};

// ─── Post Filter / Sort Constants ────────────────────────────────────────────

const POST_TYPE_FILTERS = [
    { value: 'all', label: 'All Types' },
    { value: 'update', label: 'Updates' },
    { value: 'deal', label: 'Deals' },
    { value: 'announcement', label: 'Announcements' },
];

const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'popular', label: 'Most Popular' },
];

const POSTS_PAGE_SIZE = 50;

const DATE_RANGE_OPTIONS = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Format a count for compact display in tab labels.
 * e.g. 0 → '', 7 → '7', 999 → '999', 1000 → '1k', 10100 → '10.1k', 1000000 → '1M'
 */
function formatCount(n) {
    const num = Number(n || 0);
    if (num <= 0) return '';
    if (num < 1000) return String(num);
    if (num < 10000) {
        const k = num / 1000;
        const rounded = Math.round(k * 10) / 10;
        return rounded % 1 === 0 ? `${Math.round(rounded)}k` : `${rounded}k`;
    }
    if (num < 1000000) {
        const k = num / 1000;
        const rounded = Math.round(k * 10) / 10;
        return rounded % 1 === 0 ? `${Math.round(rounded)}k` : `${rounded}k`;
    }
    const m = num / 1000000;
    const rounded = Math.round(m * 10) / 10;
    return rounded % 1 === 0 ? `${Math.round(rounded)}M` : `${rounded}M`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCategoryIcon(key) {
    const k = String(key || '').toLowerCase().replace(/[^a-z_]/g, '');
    return CATEGORY_ICON[k] || CategoryIcon;
}

function getCategoryLabel(key) {
    const k = String(key || '').toLowerCase().replace(/[^a-z_]/g, '');
    return CATEGORY_LABELS[k] || '';
}

function getEntityConfig(type) {
    const k = String(type || 'business').toLowerCase().replace(/[^a-z]/g, '');
    return ENTITY_TYPE_CONFIG[k] || ENTITY_TYPE_CONFIG.business;
}

function formatPhone(p) {
    const d = String(p || '').replace(/\D/g, '');
    if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    if (d.length === 11 && d[0] === '1') return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
    return p || '';
}

function formatWebsite(url) {
    return String(url || '').trim().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

function formatTo12Hr(timeStr) {
    if (!timeStr) return '';
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    const period = h >= 12 ? 'PM' : 'AM';
    if (h === 0) h = 12;
    else if (h > 12) h = h - 12;
    return `${h}:${m} ${period}`;
}

function buildSocialUrl(url, platform) {
    if (!url) return '';
    const s = String(url).trim();
    if (s.startsWith('http://') || s.startsWith('https://')) return s;
    const handle = s.replace(/^@/, '');
    if (platform === 'facebook') return `https://facebook.com/${handle}`;
    if (platform === 'instagram') return `https://instagram.com/${handle}`;
    if (platform === 'twitter') return `https://x.com/${handle}`;
    if (platform === 'linkedin') return `https://linkedin.com/in/${handle}`;
    if (platform === 'etsy') return `https://etsy.com/shop/${handle}`;
    return s;
}

function parseHours(hoursData) {
    if (!hoursData) return null;
    const parsed = typeof hoursData === 'string' ? (() => { try { return JSON.parse(hoursData); } catch { return null; } })() : hoursData;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
}

function formatHoursTime(time) {
    if (!time) return '';
    const [h, m] = String(time).split(':');
    const hour = parseInt(h, 10);
    const minute = m || '00';
    if (isNaN(hour)) return String(time);
    if (hour === 0) return `12:${minute} AM`;
    if (hour < 12) return `${hour}:${minute} AM`;
    if (hour === 12) return `12:${minute} PM`;
    return `${hour - 12}:${minute} PM`;
}

function formatRelativeTime(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    let then;
    const dateString = String(dateStr);
    if (dateString.endsWith('Z') || dateString.includes('+')) {
        // Already has explicit timezone info — parse as-is
        then = new Date(dateString);
    } else if (dateString.includes('T')) {
        // Has T separator but no timezone — treat as UTC
        then = new Date(dateString + 'Z');
    } else {
        // Raw "YYYY-MM-DD HH:MM:SS" from DB — these are UTC, append Z
        then = new Date(dateString.replace(' ', 'T') + 'Z');
    }
    if (isNaN(then.getTime())) return '';
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    if (diffSec < 0) return 'Just now';
    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour} ${diffHour === 1 ? 'hr' : 'hrs'} ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    if (diffWeek < 4) return `${diffWeek}w ago`;
    if (diffMonth < 12) return `${diffMonth}mo ago`;
    return then.toLocaleDateString();
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const dateString = String(dateStr);
    let date;
    if (dateString.endsWith('Z') || dateString.includes('+')) {
        date = new Date(dateString);
    } else if (dateString.includes('T')) {
        date = new Date(dateString + 'Z');
    } else {
        date = new Date(dateString.replace(' ', 'T') + 'Z');
    }
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isExpired(dateStr) {
    if (!dateStr) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr);
    return expiry < now;
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ label }) {
    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 2,
                    py: 3,
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        maxWidth: 420,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1.1,
                        textAlign: 'center',
                    }}
                >
                    <Box
                        sx={{
                            width: 88,
                            height: 88,
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid',
                            borderColor: (t) => alpha(t.palette.common.black, 0.06),
                            bgcolor: (t) => alpha(t.palette.common.black, 0.03),
                            boxShadow: (t) => t.custom.shadows.xs,
                        }}
                    >
                        <StorefrontRoundedIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
                        {label || 'Select a business'}
                    </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 14, lineHeight: 1.45 }}>
                        Choose a business from the directory to see its full profile, photos, and hours.
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}

EmptyState.propTypes = { label: PropTypes.string };

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function DetailSkeleton() {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Profile area (no cover) */}
            <Box sx={{ px: { xs: 1.5, sm: 2 }, pt: 2, position: 'relative', zIndex: 2 }}>
                <Skeleton variant="circular" sx={{ width: { xs: 68, sm: 90 }, height: { xs: 68, sm: 90 } }} />
                <Skeleton height={26} width="60%" sx={{ mt: 1 }} />
                <Skeleton height={16} width="40%" sx={{ mt: 0.5 }} />
                <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                    <Skeleton variant="rounded" width={110} height={24} sx={{ borderRadius: 999 }} />
                    <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: 999 }} />
                </Box>
            </Box>
            {/* Contact */}
            <Box sx={{ px: { xs: 1.5, sm: 2 }, mt: 2 }}>
                <Skeleton height={16} width="80%" />
                <Skeleton height={16} width="60%" sx={{ mt: 0.5 }} />
            </Box>
            {/* Tabs */}
            <Box sx={{ px: { xs: 1.5, sm: 2 }, mt: 2 }}>
                <Skeleton height={40} width="100%" />
            </Box>
            {/* Content */}
            <Box sx={{ px: { xs: 1.5, sm: 2 }, mt: 2 }}>
                <Skeleton height={14} width="100%" />
                <Skeleton height={14} width="90%" sx={{ mt: 0.5 }} />
                <Skeleton height={14} width="75%" sx={{ mt: 0.5 }} />
            </Box>
        </Box>
    );
}

// ─── Photo Gallery ───────────────────────────────────────────────────────────

function PhotoGallery({ photos, onPhotoClick }) {
    const [lbOpen, setLbOpen] = useState(false);
    const [lbIdx, setLbIdx] = useState(0);

    const items = Array.isArray(photos) ? photos.filter(Boolean) : [];

    if (items.length === 0) {
        return (
            <Box
                sx={{
                    py: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                }}
            >
                <ImageNotSupportedRoundedIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'primary.main' }}>
                    No photos yet
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: '0.82rem', textAlign: 'center', maxWidth: 260 }}>
                    Photos will appear here once this business adds them.
                </Typography>
            </Box>
        );
    }

    const handleClick = (item, i) => {
        if (onPhotoClick) {
            const photoId = typeof item === 'string' ? null : (item.id || item.photo_id || null);
            const photoUrl = typeof item === 'string' ? item : item.url;
            onPhotoClick(photoId, photoUrl);
        } else {
            setLbIdx(i);
            setLbOpen(true);
        }
    };

    const urls = items.map((p) => (typeof p === 'string' ? p : p.url));
    const safeLbIdx = Math.max(0, Math.min(lbIdx, urls.length - 1));

    return (
        <Box>
            {/* Thumbnail grid */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                    gap: 1,
                }}
            >
                {items.map((item, i) => (
                    <Box
                        key={i}
                        onClick={() => handleClick(item, i)}
                        sx={(t) => ({
                            position: 'relative',
                            aspectRatio: '1',
                            borderRadius: 2,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            bgcolor: alpha(t.palette.text.primary, 0.04),
                            border: '1px solid',
                            borderColor: alpha(t.palette.divider, 0.5),
                            transition: `transform ${t.custom.motion.fast}ms ${t.custom.motion.ease}, box-shadow ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                            '&:hover': {
                                transform: 'scale(1.03)',
                                boxShadow: `0 4px 16px ${alpha(t.palette.text.primary, 0.12)}`,
                            },
                            '&:hover .photo-overlay': { opacity: 1 },
                        })}
                    >
                        <Box
                            component="img"
                            src={typeof item === 'string' ? item : item.url}
                            alt={`Photo ${i + 1}`}
                            referrerPolicy="no-referrer"
                            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        <Box
                            className="photo-overlay"
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                bgcolor: (t) => alpha(t.palette.common.black, 0.15),
                                opacity: 0,
                                transition: 'opacity 200ms ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <PhotoLibraryRoundedIcon sx={{ fontSize: 24, color: 'common.white', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))' }} />
                        </Box>
                    </Box>
                ))}
            </Box>

            {/* Lightbox dialog */}
            <Dialog
                open={lbOpen}
                onClose={() => setLbOpen(false)}
                maxWidth="md"
                fullWidth
                disableScrollLock
                PaperProps={{ sx: { borderRadius: 3, bgcolor: 'common.black', overflow: 'hidden' } }}
            >
                <Box sx={{ position: 'relative' }}>
                    <IconButton
                        onClick={() => setLbOpen(false)}
                        sx={{
                            position: 'absolute', top: 8, right: 8, zIndex: 10,
                            color: 'common.white',
                            bgcolor: (t) => alpha(t.palette.common.black, 0.4),
                            '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.6) },
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                    <Box sx={{ width: '100%', aspectRatio: '16/10', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'common.black' }}>
                        <Box
                            component="img"
                            src={urls[safeLbIdx]}
                            alt={`Photo ${safeLbIdx + 1}`}
                            referrerPolicy="no-referrer"
                            sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                    </Box>
                    {urls.length > 1 && (
                        <>
                            <IconButton
                                onClick={() => setLbIdx((p) => (p - 1 + urls.length) % urls.length)}
                                sx={{
                                    position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                                    color: 'common.white',
                                    bgcolor: (t) => alpha(t.palette.common.black, 0.45),
                                    '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.65) },
                                }}
                            >
                                <ArrowBackIosNewRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                            <IconButton
                                onClick={() => setLbIdx((p) => (p + 1) % urls.length)}
                                sx={{
                                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                                    color: 'common.white',
                                    bgcolor: (t) => alpha(t.palette.common.black, 0.45),
                                    '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.65) },
                                }}
                            >
                                <ArrowForwardIosRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                            <Box sx={{
                                position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
                                color: 'common.white', fontSize: '0.82rem', fontWeight: 700,
                                bgcolor: (t) => alpha(t.palette.common.black, 0.5),
                                px: 1.5, py: 0.35, borderRadius: 999,
                            }}>
                                {safeLbIdx + 1} / {urls.length}
                            </Box>
                        </>
                    )}
                </Box>
                {urls.length > 1 && (
                    <Stack direction="row" spacing={0.75} sx={{ p: 1.5, overflowX: 'auto', bgcolor: 'common.black' }}>
                        {urls.map((url, i) => (
                            <Box
                                key={i}
                                component="img"
                                src={url}
                                alt=""
                                onClick={() => setLbIdx(i)}
                                referrerPolicy="no-referrer"
                                sx={{
                                    width: 56, height: 56, objectFit: 'cover',
                                    borderRadius: 1.5, cursor: 'pointer', flexShrink: 0,
                                    border: '2px solid',
                                    borderColor: i === safeLbIdx ? 'common.white' : 'transparent',
                                    opacity: i === safeLbIdx ? 1 : 0.5,
                                    transition: 'all 150ms ease',
                                    '&:hover': { opacity: 0.9 },
                                }}
                            />
                        ))}
                    </Stack>
                )}
            </Dialog>
        </Box>
    );
}

PhotoGallery.propTypes = { photos: PropTypes.array, onPhotoClick: PropTypes.func };

// ─── Hours Table ─────────────────────────────────────────────────────────────

function HoursTable({ hours }) {
    const parsed = parseHours(hours);

    // Check whether any day has real hours data
    const hasAnyRealHours = parsed && DAY_ORDER.some((day) => {
        const entry = parsed[day];
        if (!entry) return false;
        if (entry.closed) return true;
        const open = String(entry.open || '').trim();
        const close = String(entry.close || '').trim();
        return open.length > 0 && close.length > 0;
    });

    const showTable = parsed && hasAnyRealHours;

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayIndex = new Date().getDay();
    const todayKey = days[todayIndex];

    return (
        <Box>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                <AccessTimeRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography sx={{ fontWeight: 800, fontSize: '0.85rem' }}>Hours</Typography>
            </Stack>

            {!showTable ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Hours are not available for this business.
                </Typography>
            ) : (
                <Box
                    sx={(t) => ({
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: t.palette.divider,
                        overflow: 'hidden',
                    })}
                >
                    {DAY_ORDER.map((day) => {
                        const entry = parsed[day];
                        const isToday = day === todayKey;
                        const isClosed = !entry || entry.closed;

                        let timeStr = 'Closed';
                        if (!isClosed) {
                            if (entry.allDay) {
                                timeStr = '24 hours today';
                            } else {
                                const open = String(entry.open || '').trim();
                                const close = String(entry.close || '').trim();
                                if (open && close) {
                                    timeStr = `${formatHoursTime(open)} – ${formatHoursTime(close)}`;
                                } else {
                                    timeStr = '-';
                                }
                            }
                        }

                        return (
                            <Box
                                key={day}
                                sx={(t) => ({
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    px: 1.5,
                                    py: 0.75,
                                    bgcolor: isToday
                                        ? alpha(t.palette.primary.main, 0.05)
                                        : 'transparent',
                                    borderBottom: day !== 'sunday' ? `1px solid ${t.palette.divider}` : 'none',
                                })}
                            >
                                <Typography
                                    sx={{
                                        fontSize: '0.8rem',
                                        fontWeight: isToday ? 850 : 600,
                                        color: isToday ? 'primary.dark' : 'text.primary',
                                    }}
                                >
                                    {DAY_LABELS[day]}
                                    {isToday && (
                                        <Box
                                            component="span"
                                            sx={{
                                                ml: 0.75,
                                                fontSize: '0.65rem',
                                                fontWeight: 900,
                                                color: 'primary.main',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            Today
                                        </Box>
                                    )}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: '0.8rem',
                                        fontWeight: isToday ? 800 : 600,
                                        color: isClosed ? 'text.disabled' : 'text.primary',
                                    }}
                                >
                                    {timeStr}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
}

HoursTable.propTypes = { hours: PropTypes.any };

// ─── Helpful Button ──────────────────────────────────────────────────────────

function HelpfulButton({ review, businessId, viewerId, onUpdate }) {
    const [busy, setBusy] = useState(false);
    const isOwn = viewerId > 0 && Number(review.userId) === viewerId;
    const active = Boolean(review.viewerFoundHelpful);
    const count = Number(review.helpfulCount || 0);

    const handleClick = async () => {
        if (!viewerId || isOwn || busy) return;
        setBusy(true);
        try {
            const resp = await toggleReviewHelpful(businessId, review.id);
            if (onUpdate) {
                onUpdate(review.id, Number(resp.helpfulCount || 0), Boolean(resp.viewerFoundHelpful));
            }
        } catch {
            // silent
        } finally {
            setBusy(false);
        }
    };

    return (
        <Button
            size="small"
            variant="text"
            disabled={busy || isOwn || !viewerId}
            startIcon={active ? <ThumbUpIcon sx={{ fontSize: '14px !important' }} /> : <ThumbUpOutlinedIcon sx={{ fontSize: '14px !important' }} />}
            onClick={handleClick}
            sx={(t) => ({
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.75rem',
                color: active ? t.palette.primary.main : t.palette.text.secondary,
                borderRadius: 2,
                px: 1,
                py: 0.25,
                minHeight: 0,
                '&:hover': {
                    bgcolor: alpha(t.palette.primary.main, 0.08),
                },
                '&.Mui-disabled': {
                    color: t.palette.text.disabled,
                },
            })}
        >
            Helpful{count > 0 ? ` (${count})` : ''}
        </Button>
    );
}

HelpfulButton.propTypes = {
    review: PropTypes.object.isRequired,
    businessId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    viewerId: PropTypes.number,
    onUpdate: PropTypes.func,
};

// ─── Reviews Tab (full implementation) ──────────────────────────────────────

const REVIEW_SORT_OPTIONS = [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'highest', label: 'Highest' },
    { value: 'lowest', label: 'Lowest' },
];

const MAX_REVIEW_PHOTOS = 4;

function ReviewsTab({ businessId, user, onReviewCountChange, isOwnBusiness, isNonPersonalAccount, highlightReviewId: highlightReviewIdProp, highlightReviewerId: highlightReviewerIdProp }) {
    const theme = useTheme();
    const isMobileReview = useMediaQuery(theme.breakpoints.down('md'));

    // Ref to avoid onReviewCountChange in useCallback deps (prevents infinite loops)
    const onReviewCountChangeRef = useRef(onReviewCountChange);
    onReviewCountChangeRef.current = onReviewCountChange;

    const [reviews, setReviews] = useState([]);
    const [total, setTotal] = useState(0);
    const [averageRating, setAverageRating] = useState(0);
    const [ratingCounts, setRatingCounts] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    const [userReview, setUserReview] = useState(null);
    const [serverIsTeamMember, setServerIsTeamMember] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('newest');

    const [formOpen, setFormOpen] = useState(false);
    const [formRating, setFormRating] = useState(0);
    const [formTitle, setFormTitle] = useState('');
    const [formBody, setFormBody] = useState('');
    const [formPhotos, setFormPhotos] = useState([]);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);

    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxPhotos, setLightboxPhotos] = useState([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    // Owner reply state
    const [replyingToId, setReplyingToId] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [replyPhotos, setReplyPhotos] = useState([]);
    const [replySaving, setReplySaving] = useState(false);
    const [replyError, setReplyError] = useState('');
    const [replyDeleteConfirmId, setReplyDeleteConfirmId] = useState(null);

    // UserCardPopover state
    const [cardAnchorEl, setCardAnchorEl] = useState(null);
    const [cardUser, setCardUser] = useState(null);

    // Review 3-dot menu state
    const [reviewMenuAnchor, setReviewMenuAnchor] = useState(null);
    const [reviewMenuReview, setReviewMenuReview] = useState(null);
    const [reviewMenuIsReply, setReviewMenuIsReply] = useState(false);

    // Review report dialog state
    const [reviewReportOpen, setReviewReportOpen] = useState(false);
    const [reviewReportTarget, setReviewReportTarget] = useState(null);
    const [reviewReportIsReply, setReviewReportIsReply] = useState(false);

    const viewerId = Number(user?.id || 0);

    const handleReviewAvatarClick = (e, review) => {
        const reviewUserId = review.userId || review.user_id;
        if (!reviewUserId) return;
        setCardAnchorEl(e.currentTarget);
        setCardUser({
            id: reviewUserId,
            first_name: review.firstName || '',
            last_name: review.lastName || '',
            handle: review.handle || review.username || '',
            avatar_url: review.profileImageUrl || '',
        });
    };

    const handleCardClose = () => {
        setCardAnchorEl(null);
    };

    const handleCardViewProfile = (u) => {
        const profilePath = u?.handle || u?.id;
        if (profilePath) window.location.assign(`/${profilePath}`);
    };

    const cardIsSelf = Boolean(
        user?.id != null && cardUser?.id != null && String(user.id) === String(cardUser.id)
    );

    const [refreshing, setRefreshing] = useState(false);
    const hasLoadedOnceRef = useRef(false);

    const loadReviews = useCallback(async () => {
        if (!businessId) return;
        if (hasLoadedOnceRef.current) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        try {
            const resp = await fetchBusinessReviews({ businessId, limit: 50, offset: 0, sort: sortBy });
            setReviews(Array.isArray(resp?.items) ? resp.items : []);
            setTotal(Number(resp?.total || 0));
            setAverageRating(Number(resp?.averageRating || 0));
            setRatingCounts(resp?.ratingCounts || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
            setUserReview(resp?.userReview || null);
            setServerIsTeamMember(Boolean(resp?.viewerIsTeamMember));
            if (onReviewCountChangeRef.current) onReviewCountChangeRef.current(Number(resp?.total || 0), Number(resp?.averageRating || 0));
            // Broadcast review stats change
            try {
                window.dispatchEvent(new CustomEvent('ll:business:review-changed', {
                    detail: { businessId, reviewCount: Number(resp?.total || 0), averageRating: Number(resp?.averageRating || 0), _source: 'detailPanel' }
                }));
            } catch { /* */ }
        } catch (err) {
            setReviews([]);
            setTotal(0);
            setAverageRating(0);
            setRatingCounts({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
            setUserReview(null);
        } finally {
            setLoading(false);
            setRefreshing(false);
            hasLoadedOnceRef.current = true;
        }
    }, [businessId, sortBy]);

    useEffect(() => { loadReviews(); }, [loadReviews]);

    // Listen for review changes from other components (e.g. public page)
    useEffect(() => {
        const handler = (e) => {
            const d = e.detail;
            if (!d || !businessId || String(d.businessId) !== String(businessId)) return;
            if (d._source === 'detailPanel') return; // ignore own dispatches
            loadReviews();
        };
        window.addEventListener('ll:business:review-changed', handler);
        return () => window.removeEventListener('ll:business:review-changed', handler);
    }, [businessId, loadReviews]);

    const openWriteForm = useCallback(() => {
        if (userReview) {
            setFormRating(userReview.rating || 0);
            setFormTitle(userReview.title || '');
            setFormBody(userReview.body || '');
            // Convert existing URLs to PhotosUploadSection format: { id, url, _existing }
            const existing = Array.isArray(userReview.photoUrls) ? userReview.photoUrls
                : Array.isArray(userReview.photo_urls) ? userReview.photo_urls
                    : [];
            setFormPhotos(existing.filter(Boolean).map((url) => ({ id: url, url, _existing: true })));
        } else {
            setFormRating(0);
            setFormTitle('');
            setFormBody('');
            setFormPhotos([]);
        }
        setFormError('');
        setFormOpen(true);
    }, [userReview]);

    const closeForm = useCallback(() => { setFormOpen(false); setFormError(''); }, []);

    const handleSubmitReview = useCallback(async () => {
        if (!formRating) { setFormError('Please select a rating.'); return; }
        setFormSubmitting(true);
        setFormError('');
        try {
            // Separate existing kept URLs from new File objects
            const existingUrls = formPhotos.filter((p) => p._existing).map((p) => p.url);
            const newFiles = formPhotos.filter((p) => p.file instanceof File).map((p) => p.file);

            await submitBusinessReview(businessId, {
                rating: formRating,
                title: formTitle,
                body: formBody,
                photos: newFiles,
                _existingPhotoUrls: existingUrls,
            });
            setFormOpen(false);
            formPhotos.forEach((p) => { if (p?.url && !p._existing) { try { URL.revokeObjectURL(p.url); } catch {} } });
            setFormPhotos([]);
            await loadReviews();
        } catch (err) {
            setFormError(String(err?.message || 'Failed to submit review.'));
        } finally {
            setFormSubmitting(false);
        }
    }, [formRating, formTitle, formBody, formPhotos, businessId, loadReviews]);

    const handleDeleteReview = useCallback(async () => {
        setDeleteSubmitting(true);
        try {
            await deleteBusinessReview(businessId);
            setUserReview(null);
            setFormOpen(false);
            setDeleteConfirmOpen(false);
            await loadReviews();
        } catch {
            setDeleteConfirmOpen(false);
        } finally {
            setDeleteSubmitting(false);
        }
    }, [businessId, loadReviews]);

    const handleOpenReply = (reviewId, existingReply, existingReplyPhotos) => {
        setReplyingToId(reviewId);
        setReplyText(existingReply || '');
        const rpUrls = Array.isArray(existingReplyPhotos) ? existingReplyPhotos.filter(Boolean) : [];
        setReplyPhotos(rpUrls.map((u) => ({ id: u, url: u, _existing: true })));
        setReplyError('');
    };

    const handleCancelReply = () => {
        if (replySaving) return;
        setReplyingToId(null);
        setReplyText('');
        setReplyPhotos([]);
        setReplyError('');
    };

    const handleSaveReply = async (reviewId) => {
        const body = replyText.trim();
        if (!body) { setReplyError('Reply cannot be empty.'); return; }
        if (body.length > 2000) { setReplyError('Reply must be under 2000 characters.'); return; }
        setReplySaving(true);
        setReplyError('');
        try {
            // Collect photos: existing URLs + new File objects
            const photosToUpload = replyPhotos.map((p) => {
                if (p._existing && p.url) return p.url;
                if (p.file instanceof File) return p;
                return null;
            }).filter(Boolean);

            const resp = await replyToBusinessReview(businessId, reviewId, body, photosToUpload);
            setReviews((prev) =>
                prev.map((r) =>
                    r.id === reviewId
                        ? { ...r, ownerReply: resp.ownerReply || body, ownerReplyAt: resp.ownerReplyAt || new Date().toISOString(), replyByName: resp.replyByName || null, replyByAvatar: resp.replyByAvatar || null, replyByHandle: resp.replyByHandle || null, replyPhotoUrls: resp.replyPhotoUrls || [] }
                        : r
                )
            );
            setReplyingToId(null);
            setReplyText('');
            setReplyPhotos([]);
        } catch (err) {
            setReplyError(err?.message || 'Failed to save reply.');
        } finally {
            setReplySaving(false);
        }
    };

    const handleDeleteReplyConfirm = async (reviewId) => {
        setReplySaving(true);
        try {
            await deleteReviewReply(businessId, reviewId);
            setReviews((prev) =>
                prev.map((r) =>
                    r.id === reviewId
                        ? { ...r, ownerReply: null, ownerReplyAt: null, replyByName: null, replyByAvatar: null, replyByHandle: null, replyPhotoUrls: [] }
                        : r
                )
            );
            setReplyDeleteConfirmId(null);
            setReplyingToId(null);
        } catch (err) {
            setReplyError(err?.message || 'Failed to delete reply.');
        } finally {
            setReplySaving(false);
        }
    };

    const openLightbox = useCallback((photos, idx) => {
        setLightboxPhotos(photos);
        setLightboxIndex(idx);
        setLightboxOpen(true);
    }, []);

    const maxCount = Math.max(1, ...Object.values(ratingCounts));

    if (loading) {
        return (<Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress size={28} /></Box>);
    }

    const canWrite = viewerId > 0 && !isOwnBusiness && !serverIsTeamMember && !isNonPersonalAccount;
    const hasReviews = reviews.length > 0;

    return (
        <Box>
            {/* Summary Header */}
            {hasReviews && (
                <Box sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                        <Box sx={{ textAlign: 'center', minWidth: 72 }}>
                            <Typography sx={{ fontWeight: 900, fontSize: '2rem', lineHeight: 1 }}>{averageRating.toFixed(1)}</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.25 }}>
                                <Rating
                                    value={averageRating}
                                    precision={0.5}
                                    readOnly
                                    size="small"
                                />
                            </Box>
                            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 700, mt: 0.25 }}>
                                {total} review{total !== 1 ? 's' : ''}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            {[5, 4, 3, 2, 1].map((star) => (
                                <Stack key={star} direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.25 }}>
                                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, width: 10, textAlign: 'right' }}>{star}</Typography>
                                    <StarRoundedIcon sx={{ fontSize: 12, color: 'warning.main' }} />
                                    <Box sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: alpha(theme.palette.divider, 0.3), overflow: 'hidden' }}>
                                        <Box sx={{ width: `${(ratingCounts[star] / maxCount) * 100}%`, height: '100%', borderRadius: 4, bgcolor: 'warning.main', transition: (t) => `width ${t.custom.motion.slow}ms ${t.custom.motion.ease}` }} />
                                    </Box>
                                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: 'text.secondary', width: 20, textAlign: 'right' }}>{ratingCounts[star]}</Typography>
                                </Stack>
                            ))}
                        </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>Sort</InputLabel>
                            <Select value={sortBy} label="Sort" onChange={(e) => setSortBy(e.target.value)} sx={{ fontSize: '0.78rem' }}>
                                {REVIEW_SORT_OPTIONS.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Box sx={{ flex: 1 }} />
                        {canWrite && !userReview && (
                            <Button variant="contained" size="small"
                                    startIcon={<RateReviewRoundedIcon sx={{ fontSize: '15px !important' }} />}
                                    onClick={openWriteForm}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800, fontSize: '0.78rem', px: 1.5 }}
                            >
                                Write a Review
                            </Button>
                        )}
                    </Stack>
                </Box>
            )}

            {/* Empty State */}
            {!hasReviews && (
                <Box sx={{ py: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <ReviewsRoundedIcon sx={{ fontSize: 44, color: 'primary.main' }} />
                    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'primary.main' }}>
                        {(isOwnBusiness || serverIsTeamMember) ? 'No reviews on your business yet' : 'No reviews yet'}
                    </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: '0.82rem', textAlign: 'center', maxWidth: 280 }}>
                        {(isOwnBusiness || serverIsTeamMember)
                            ? 'When customers share their experience, their reviews will show up here. Great service leads to great reviews!'
                            : 'Be the first to share your experience with this business.'}
                    </Typography>
                    {canWrite && (
                        <Button variant="contained" size="small" startIcon={<RateReviewRoundedIcon sx={{ fontSize: '16px !important' }} />}
                                onClick={openWriteForm}
                                sx={{ mt: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 800, fontSize: '0.82rem', px: 2.5, py: 0.75 }}
                        >Write a Review</Button>
                    )}
                </Box>
            )}

            {/* Review List */}
            <Box
                sx={{
                    opacity: refreshing ? 0.35 : 1,
                    transition: (t) => `opacity ${t.custom.motion.slow}ms ${t.custom.motion.ease}`,
                    pointerEvents: refreshing ? 'none' : 'auto',
                }}
            >
                {hasReviews && reviews.map((review) => {
                    const photos = Array.isArray(review.photoUrls) ? review.photoUrls.filter(Boolean)
                        : Array.isArray(review.photo_urls) ? review.photo_urls.filter(Boolean)
                            : [];
                    const displayName = [review.firstName, review.lastName].filter(Boolean).join(' ') || review.username || 'Anonymous';
                    const avatarSrc = review.profileImageUrl || '';
                    const isOwn = viewerId > 0 && Number(review.userId) === viewerId;
                    const isHighlighted = Boolean(highlightReviewIdProp || highlightReviewerIdProp) && (
                        String(review.id) === String(highlightReviewIdProp) ||
                        Number(review.id) === Number(highlightReviewIdProp) ||
                        (highlightReviewerIdProp && Number(review.userId) === Number(highlightReviewerIdProp))
                    );

                    return (
                        <Box
                            key={review.id}
                            data-review-id={review.id}
                            id={isHighlighted ? `review-highlight-${review.id}` : undefined}
                            sx={(t) => ({
                                py: 2,
                                px: isHighlighted ? 1.5 : 0,
                                ...(isHighlighted ? {
                                    borderRadius: 2.5,
                                    border: '2px solid',
                                    borderColor: `${alpha(t.custom?.brand?.brass || '#A87822', 0.45)} !important`,
                                    bgcolor: alpha(t.custom?.brand?.brass || '#A87822', 0.06),
                                    boxShadow: `0 0 16px ${alpha(t.custom?.brand?.brass || '#A87822', 0.15)}`,
                                    my: 1,
                                } : {
                                    borderBottom: '1px solid',
                                    borderColor: t.palette.divider,
                                    '&:last-child': { borderBottom: 'none' },
                                }),
                            })}
                        >
                            {/* Header row: avatar, name, rating, time, actions */}
                            <Stack direction="row" spacing={1.25} alignItems="flex-start">
                                <Avatar
                                    src={avatarSrc || undefined}
                                    sx={(t) => ({
                                        width: 36, height: 36, flexShrink: 0, mt: 0.25, cursor: 'pointer',
                                        bgcolor: alpha(t.palette.primary.main, 0.08),
                                        color: t.palette.primary.main,
                                        fontSize: '0.85rem', fontWeight: 800,
                                        '& .MuiAvatar-img': { objectFit: 'cover', transform: 'scale(1.15)' },
                                    })}
                                    imgProps={{ referrerPolicy: 'no-referrer' }}
                                    onClick={(e) => handleReviewAvatarClick(e, review)}
                                >
                                    <PersonRoundedIcon sx={{ fontSize: 20 }} />
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                        <Typography
                                            sx={{ fontWeight: 800, fontSize: '0.85rem', lineHeight: 1.2, cursor: 'pointer', '&:hover': { textDecoration: 'underline' },
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%',
                                            }}
                                            onClick={(e) => handleReviewAvatarClick(e, review)}
                                        >
                                            {displayName}
                                        </Typography>
                                        {isOwn && (
                                            <Chip
                                                label="You"
                                                size="small"
                                                sx={{ height: 18, fontSize: '0.6rem', fontWeight: 900 }}
                                            />
                                        )}
                                    </Stack>
                                    {(review.handle || review.username) && (
                                        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600, lineHeight: 1.2 }}>
                                            @{review.handle || review.username}
                                        </Typography>
                                    )}
                                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                                        <Rating
                                            value={Number(review.rating)}
                                            precision={0.5}
                                            readOnly
                                            size="small"
                                            sx={{
                                                '& .MuiRating-icon': { fontSize: 15 },
                                            }}
                                        />
                                        <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 600 }}>
                                            {formatRelativeTime(review.updatedAt && review.updatedAt !== review.createdAt ? review.updatedAt : review.createdAt)}
                                        </Typography>
                                        {review.updatedAt && review.updatedAt !== review.createdAt && (
                                            <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled', fontWeight: 600, fontStyle: 'italic' }}>
                                                (edited)
                                            </Typography>
                                        )}
                                    </Stack>
                                </Box>
                                {(isOwn || viewerId > 0) && (
                                    <IconButton
                                        size="small"
                                        onClick={(e) => { setReviewMenuAnchor(e.currentTarget); setReviewMenuReview(review); setReviewMenuIsReply(false); }}
                                        sx={(t) => ({ width: 32, height: 32, flexShrink: 0, border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`, borderRadius: 999, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } })}
                                    >
                                        <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </Stack>

                            {/* Title */}
                            {review.title && (
                                <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', mt: 1, lineHeight: 1.3 }}>
                                    {review.title}
                                </Typography>
                            )}

                            {/* Body */}
                            {review.body && (
                                <Typography
                                    sx={{
                                        fontSize: '0.84rem',
                                        color: 'text.primary',
                                        lineHeight: 1.6,
                                        mt: review.title ? 0.5 : 1,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {review.body}
                                </Typography>
                            )}

                            {/* Photos – nicer rounded grid with hover */}
                            {photos.length > 0 && (
                                <Stack
                                    direction="row"
                                    spacing={0.75}
                                    sx={{
                                        mt: 1.25,
                                        overflowX: 'auto',
                                        pb: 0.5,
                                        '&::-webkit-scrollbar': { height: 4 },
                                        '&::-webkit-scrollbar-thumb': { borderRadius: 2, bgcolor: (t) => alpha(t.palette.common.black, 0.12) },
                                    }}
                                >
                                    {photos.map((url, idx) => (
                                        <Box
                                            key={idx}
                                            onClick={() => openLightbox(photos, idx)}
                                            sx={{
                                                position: 'relative',
                                                width: 88,
                                                height: 88,
                                                flexShrink: 0,
                                                borderRadius: 2,
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                '&:hover img': { transform: 'scale(1.05)' },
                                                '&:hover': { boxShadow: (t) => t.custom.shadows.xs },
                                            }}
                                        >
                                            <Box
                                                component="img"
                                                src={url}
                                                alt={`Review photo ${idx + 1}`}
                                                referrerPolicy="no-referrer"
                                                sx={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    display: 'block',
                                                    transition: (t) => `transform ${t.custom.motion.slow}ms ${t.custom.motion.ease}`,
                                                }}
                                            />
                                        </Box>
                                    ))}
                                </Stack>
                            )}

                            {/* Helpful button + Reply button */}
                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1.25 }}>
                                <HelpfulButton
                                    review={review}
                                    businessId={businessId}
                                    viewerId={viewerId}
                                    onUpdate={(reviewId, helpfulCount, viewerFoundHelpful) => {
                                        setReviews((prev) =>
                                            prev.map((r) =>
                                                r.id === reviewId
                                                    ? { ...r, helpfulCount, viewerFoundHelpful }
                                                    : r
                                            )
                                        );
                                    }}
                                />
                                {isOwnBusiness && !review.ownerReply && replyingToId !== review.id && (
                                    <Button
                                        size="small"
                                        startIcon={<ReplyRoundedIcon sx={{ fontSize: 14 }} />}
                                        onClick={() => handleOpenReply(review.id, '')}
                                        sx={{
                                            color: 'text.secondary',
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            fontSize: '0.72rem',
                                            borderRadius: 2,
                                            px: 1,
                                            minHeight: 0,
                                            '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
                                        }}
                                    >
                                        Reply
                                    </Button>
                                )}
                            </Stack>

                            {/* Owner reply display */}
                            {review.ownerReply && replyingToId !== review.id && (
                                <Box
                                    sx={(t) => ({
                                        mt: 1.5,
                                        ml: 2,
                                        pl: 1.5,
                                        py: 1.25,
                                        borderLeft: '3px solid',
                                        borderColor: t.palette.primary.main,
                                        bgcolor: alpha(t.palette.primary.main, 0.04),
                                        borderRadius: '0 8px 8px 0',
                                    })}
                                >
                                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Avatar
                                                src={review.replyByAvatar || undefined}
                                                imgProps={{ referrerPolicy: 'no-referrer' }}
                                                sx={(t) => ({
                                                    width: 28, height: 28,
                                                    bgcolor: alpha(t.palette.primary.main, 0.12),
                                                    color: t.palette.primary.main,
                                                    '& .MuiAvatar-img': { objectFit: 'cover', transform: 'scale(1.15)' },
                                                })}
                                            >
                                                <PersonRoundedIcon sx={{ fontSize: 16 }} />
                                            </Avatar>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <Typography sx={{ fontWeight: 900, fontSize: '0.78rem', lineHeight: 1.2 }}>
                                                        {review.replyByName || 'Owner'}
                                                    </Typography>
                                                    <Chip
                                                        icon={<StarRoundedIcon sx={{ fontSize: '10px !important' }} />}
                                                        label="Owner"
                                                        size="small"
                                                        sx={{ height: 18, fontSize: '0.55rem', fontWeight: 900, bgcolor: 'secondary.main', color: 'common.white', '& .MuiChip-icon': { color: 'common.white', ml: 0.25 }, '& .MuiChip-label': { px: 0.5 } }}
                                                    />
                                                </Stack>
                                                {review.replyByHandle && (
                                                    <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 600, lineHeight: 1.2 }}>
                                                        @{review.replyByHandle}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Stack>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => { setReviewMenuAnchor(e.currentTarget); setReviewMenuReview(review); setReviewMenuIsReply(true); }}
                                            sx={{ flexShrink: 0, color: 'text.secondary' }}
                                        >
                                            <MoreVertIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Stack>
                                    <Typography sx={{ fontSize: '0.8rem', color: 'text.primary', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                        {review.ownerReply}
                                    </Typography>
                                    {/* Reply photos */}
                                    {Array.isArray(review.replyPhotoUrls) && review.replyPhotoUrls.filter(Boolean).length > 0 && (
                                        <Stack direction="row" spacing={0.75} sx={{ mt: 1, overflowX: 'auto', pb: 0.5, '&::-webkit-scrollbar': { height: 4 }, '&::-webkit-scrollbar-thumb': { borderRadius: 2, bgcolor: (t) => alpha(t.palette.common.black, 0.12) } }}>
                                            {review.replyPhotoUrls.filter(Boolean).map((url, idx) => (
                                                <Box key={idx} onClick={() => openLightbox(review.replyPhotoUrls.filter(Boolean), idx)} sx={{ width: 72, height: 72, flexShrink: 0, borderRadius: 1.5, overflow: 'hidden', cursor: 'pointer', border: '1px solid', borderColor: 'divider', '&:hover img': { transform: 'scale(1.05)' } }}>
                                                    <Box component="img" src={url} alt={`Reply photo ${idx + 1}`} referrerPolicy="no-referrer" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 200ms ease' }} />
                                                </Box>
                                            ))}
                                        </Stack>
                                    )}
                                </Box>
                            )}

                            {/* Inline reply form */}
                            {replyingToId === review.id && (
                                <Box
                                    sx={(t) => ({
                                        mt: 1.5,
                                        ml: 2,
                                        pl: 1.5,
                                        py: 1.5,
                                        borderLeft: '3px solid',
                                        borderColor: t.palette.primary.main,
                                        bgcolor: alpha(t.palette.primary.main, 0.04),
                                        borderRadius: '0 8px 8px 0',
                                    })}
                                >
                                    <Typography sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'primary.dark', mb: 1 }}>
                                        {review.ownerReply ? 'Edit Response' : 'Reply as Owner'}
                                    </Typography>
                                    {replyError && (
                                        <Typography variant="caption" color="error.main" sx={{ display: 'block', mb: 1 }}>{replyError}</Typography>
                                    )}
                                    <TextField
                                        fullWidth
                                        multiline
                                        minRows={2}
                                        maxRows={6}
                                        placeholder="Write your response..."
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value.slice(0, 2000))}
                                        disabled={replySaving}
                                        size="small"
                                        sx={{ mb: 1, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.82rem' } }}
                                    />
                                    <Box sx={{ mb: 1 }}>
                                        <PhotosUploadSection
                                            photos={replyPhotos}
                                            setPhotos={setReplyPhotos}
                                            disabled={replySaving}
                                            maxPhotos={4}
                                            title=""
                                            helperText="Add up to 4 photos."
                                            addButtonText="Add photos"
                                        />
                                    </Box>
                                    <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                                        <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
                                            {replyText.length}/2000
                                        </Typography>
                                        <Stack direction="row" spacing={1}>
                                            <Button size="small" onClick={handleCancelReply} disabled={replySaving} sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.72rem' }}>
                                                Cancel
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                onClick={() => handleSaveReply(review.id)}
                                                disabled={replySaving || !replyText.trim()}
                                                sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.72rem', borderRadius: 2 }}
                                            >
                                                {replySaving ? 'Saving...' : (review.ownerReply ? 'Update' : 'Post Reply')}
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </Box>
                            )}
                        </Box>
                    );
                })}
            </Box>

            {/* Delete Reply Confirmation */}
            <Dialog open={Boolean(replyDeleteConfirmId)} onClose={() => setReplyDeleteConfirmId(null)} maxWidth="xs" fullWidth fullScreen={isMobileReview} PaperProps={{ sx: { borderRadius: isMobileReview ? 0 : 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, pr: 6 }}>
                    Delete Response?
                    <IconButton onClick={() => setReplyDeleteConfirmId(null)} sx={{ position: 'absolute', top: 8, right: 8 }}><CloseIcon sx={{ fontSize: 20 }} /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        This will permanently remove your response to this review.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setReplyDeleteConfirmId(null)} disabled={replySaving} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => handleDeleteReplyConfirm(replyDeleteConfirmId)}
                        disabled={replySaving}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                    >
                        {replySaving ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Write / Edit Review Dialog */}
            <Dialog open={formOpen && !deleteConfirmOpen} onClose={formSubmitting ? undefined : closeForm} maxWidth="sm" fullWidth fullScreen={isMobileReview}
                    PaperProps={{ sx: { borderRadius: isMobileReview ? 0 : 3, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}>
                {/* Header */}
                <Box sx={{ p: 2.5, pb: 0, position: 'relative', flexShrink: 0 }}>
                    <IconButton onClick={closeForm} disabled={formSubmitting} sx={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32 }}>
                        <CloseIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                    <Typography sx={{ fontWeight: 900, fontSize: '1.05rem', mb: 2, pr: 4 }}>
                        {userReview ? 'Edit Your Review' : 'Write a Review'}
                    </Typography>
                </Box>
                {/* Scrollable form content */}
                <Box sx={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', px: 2.5, pb: 1 }}>
                    <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', mb: 0.5 }}>Your Rating *</Typography>
                        <Rating value={formRating} precision={1} onChange={(_e, val) => setFormRating(val || 0)} size="large" />
                    </Box>
                    <TextField fullWidth label="Review Title (optional)" value={formTitle} onChange={(e) => setFormTitle(e.target.value.slice(0, 160))}
                               size="small" inputProps={{ maxLength: 160 }} sx={{ mb: 1.5 }}
                    />
                    <TextField fullWidth label="Your Review" value={formBody} onChange={(e) => setFormBody(e.target.value)}
                               multiline minRows={3} maxRows={8} size="small" sx={{ mb: 1.5 }}
                    />
                    <Box sx={{ mb: 1.5 }}>
                        <PhotosUploadSection
                            photos={formPhotos}
                            setPhotos={setFormPhotos}
                            disabled={formSubmitting}
                            maxPhotos={MAX_REVIEW_PHOTOS}
                            title="Photos (optional)"
                            helperText="Add up to 4 photos of your experience."
                            addButtonText="Add photos"
                        />
                    </Box>
                    {formError && <Typography sx={{ fontSize: '0.8rem', color: 'error.main', fontWeight: 700, mb: 1 }}>{formError}</Typography>}
                </Box>
                {/* Sticky bottom buttons */}
                <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0, bgcolor: 'background.paper' }}>
                    <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                        {userReview && (
                            <Button size="small" color="error" startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: '15px !important' }} />}
                                    onClick={() => setDeleteConfirmOpen(true)} disabled={formSubmitting}
                                    sx={{ textTransform: 'none', fontWeight: 800, fontSize: '0.78rem', mr: 'auto' }}
                            >Delete</Button>
                        )}
                        <Button size="small" onClick={closeForm} disabled={formSubmitting} sx={{ textTransform: 'none', fontWeight: 800, fontSize: '0.78rem' }}>Cancel</Button>
                        <Button variant="contained" size="small" onClick={handleSubmitReview} disabled={formSubmitting || !formRating}
                                sx={{ textTransform: 'none', fontWeight: 800, fontSize: '0.78rem', borderRadius: 2, px: 2 }}
                        >{formSubmitting ? 'Saving…' : (userReview ? 'Update' : 'Submit')}</Button>
                    </Stack>
                    {formSubmitting && <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />}
                </Box>
            </Dialog>

            {/* Delete Review Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onClose={deleteSubmitting ? undefined : () => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth
                    PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }} sx={{ zIndex: (t) => t.zIndex.modal + 30 }}>
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Box sx={(t) => ({ width: 56, height: 56, borderRadius: '50%', bgcolor: alpha(t.palette.error.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 })}>
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 28, color: 'error.main' }} />
                    </Box>
                    <Typography variant="h6" fontWeight={900} sx={{ mb: 0.75 }}>Delete Your Review?</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, mb: 2.5, maxWidth: 280, mx: 'auto' }}>
                        This will permanently remove your review and rating. This action cannot be undone.
                    </Typography>
                    <Stack direction="row" spacing={1.5} justifyContent="center">
                        <Button variant="outlined" onClick={() => setDeleteConfirmOpen(false)} disabled={deleteSubmitting}
                                sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 999, px: 3 }}>Cancel</Button>
                        <Button variant="contained" color="error" onClick={handleDeleteReview} disabled={deleteSubmitting}
                                startIcon={deleteSubmitting ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineRoundedIcon sx={{ fontSize: '16px !important' }} />}
                                sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 999, px: 3 }}>
                            {deleteSubmitting ? 'Deleting…' : 'Delete Review'}
                        </Button>
                    </Stack>
                </Box>
            </Dialog>

            {/* Review / Reply 3-dot Menu */}
            <SmartMenu
                anchorEl={reviewMenuAnchor}
                open={Boolean(reviewMenuAnchor)}
                onClose={() => { setReviewMenuAnchor(null); setReviewMenuReview(null); setReviewMenuIsReply(false); }}
                disableScrollLock
                onClick={(e) => e.stopPropagation()}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
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
                {/* ── Review actions (not reply) ── */}
                {reviewMenuReview && !reviewMenuIsReply && viewerId > 0 && Number(reviewMenuReview.userId) === viewerId && (
                    <MenuItem onClick={() => { setReviewMenuAnchor(null); setReviewMenuReview(null); setReviewMenuIsReply(false); openWriteForm(); }} sx={{ py: 1 }}>
                        <ListItemIcon><EditRoundedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Edit review" />
                    </MenuItem>
                )}
                {reviewMenuReview && !reviewMenuIsReply && viewerId > 0 && Number(reviewMenuReview.userId) === viewerId && (
                    <MenuItem onClick={() => { setReviewMenuAnchor(null); setReviewMenuReview(null); setReviewMenuIsReply(false); setDeleteConfirmOpen(true); }} sx={{ py: 1, color: 'error.main' }}>
                        <ListItemIcon sx={{ color: 'error.main' }}><DeleteOutlineRoundedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Delete review" />
                    </MenuItem>
                )}
                {reviewMenuReview && !reviewMenuIsReply && viewerId > 0 && Number(reviewMenuReview.userId) !== viewerId && (
                    <MenuItem onClick={() => { const r = reviewMenuReview; setReviewMenuAnchor(null); setReviewMenuReview(null); setReviewMenuIsReply(false); setReviewReportTarget(r); setReviewReportIsReply(false); setReviewReportOpen(true); }} sx={{ py: 1 }}>
                        <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Report review" />
                    </MenuItem>
                )}
                {/* ── Reply actions ── */}
                {reviewMenuReview && reviewMenuIsReply && isOwnBusiness && (
                    <MenuItem onClick={() => { const rid = reviewMenuReview.id; const rt = reviewMenuReview.ownerReply || ''; const rp = reviewMenuReview.replyPhotoUrls || []; setReviewMenuAnchor(null); setReviewMenuReview(null); setReviewMenuIsReply(false); handleOpenReply(rid, rt, rp); }} sx={{ py: 1 }}>
                        <ListItemIcon><EditRoundedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Edit reply" />
                    </MenuItem>
                )}
                {reviewMenuReview && reviewMenuIsReply && isOwnBusiness && (
                    <MenuItem onClick={() => { const rid = reviewMenuReview.id; setReviewMenuAnchor(null); setReviewMenuReview(null); setReviewMenuIsReply(false); setReplyDeleteConfirmId(rid); }} sx={{ py: 1, color: 'error.main' }}>
                        <ListItemIcon sx={{ color: 'error.main' }}><DeleteOutlineRoundedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Delete reply" />
                    </MenuItem>
                )}
                {reviewMenuReview && reviewMenuIsReply && !isOwnBusiness && viewerId > 0 && (
                    <MenuItem onClick={() => { const r = reviewMenuReview; setReviewMenuAnchor(null); setReviewMenuReview(null); setReviewMenuIsReply(false); setReviewReportTarget(r); setReviewReportIsReply(true); setReviewReportOpen(true); }} sx={{ py: 1 }}>
                        <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Report reply" />
                    </MenuItem>
                )}
            </SmartMenu>

            {/* Review Report Dialog */}
            <ReportDialog
                open={reviewReportOpen}
                onClose={() => { setReviewReportOpen(false); setReviewReportTarget(null); setReviewReportIsReply(false); }}
                onSubmit={async ({ reason, details }) => {
                    const target = reviewReportTarget;
                    const reviewId = target?.id;
                    const bizId = businessId;
                    const isReply = reviewReportIsReply;
                    if (!reviewId || !bizId) return;
                    const payload = { reason, details, reviewType: 'business', isReply };
                    const urls = [
                        `/api/business/${encodeURIComponent(bizId)}/reviews/${encodeURIComponent(reviewId)}/report`,
                        `/api/business/reviews/${encodeURIComponent(reviewId)}/report`,
                    ];
                    for (const url of urls) {
                        try {
                            const res = await secureFetch(url, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                            if (res.ok) return;
                        } catch { /* try next */ }
                    }
                }}
                title={reviewReportIsReply ? 'Report Reply' : 'Report Review'}
            />

            {/* Photo Lightbox */}
            <Dialog
                open={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                maxWidth={false}
                fullScreen={isMobileReview}
                PaperProps={{
                    sx: isMobileReview
                        ? {
                            bgcolor: '#000',
                            m: 0, borderRadius: 0,
                            display: 'flex', flexDirection: 'column',
                            justifyContent: 'center', alignItems: 'center',
                        }
                        : {
                            bgcolor: 'rgba(0,0,0,0.92)',
                            borderRadius: 3,
                            maxWidth: '90vw', maxHeight: '90vh',
                            overflow: 'hidden',
                            display: 'flex', flexDirection: 'column',
                            justifyContent: 'center', alignItems: 'center',
                        },
                }}
                sx={isMobileReview ? { zIndex: (t) => t.zIndex.modal + 10 } : {}}
            >
                <IconButton onClick={() => setLightboxOpen(false)}
                            sx={{ position: 'absolute', top: 8, right: 8, color: 'common.white', bgcolor: (t) => alpha(t.palette.common.white, 0.15), zIndex: 2, '&:hover': { bgcolor: (t) => alpha(t.palette.common.white, 0.25) } }}
                ><CloseIcon /></IconButton>
                {lightboxPhotos.length > 1 && (
                    <Typography sx={{
                        position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
                        color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700, zIndex: 2,
                    }}>
                        {Math.min(lightboxIndex, lightboxPhotos.length - 1) + 1} / {lightboxPhotos.length}
                    </Typography>
                )}
                {lightboxPhotos.length > 0 && (
                    <Box component="img" src={lightboxPhotos[Math.min(lightboxIndex, lightboxPhotos.length - 1)]} alt=""
                         sx={{ maxWidth: isMobileReview ? '100vw' : '85vw', maxHeight: isMobileReview ? '80vh' : '80vh', objectFit: 'contain', display: 'block', userSelect: 'none' }} referrerPolicy="no-referrer"
                    />
                )}
                {lightboxPhotos.length > 1 && (
                    [
                        <IconButton key="lb-prev" onClick={() => setLightboxIndex((p) => (p - 1 + lightboxPhotos.length) % lightboxPhotos.length)}
                                    sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'common.white', bgcolor: (t) => alpha(t.palette.common.white, 0.15), '&:hover': { bgcolor: (t) => alpha(t.palette.common.white, 0.25) } }}
                        ><ArrowBackIosNewRoundedIcon /></IconButton>,
                        <IconButton key="lb-next" onClick={() => setLightboxIndex((p) => (p + 1) % lightboxPhotos.length)}
                                    sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'common.white', bgcolor: (t) => alpha(t.palette.common.white, 0.15), '&:hover': { bgcolor: (t) => alpha(t.palette.common.white, 0.25) } }}
                        ><ArrowForwardIosRoundedIcon /></IconButton>,
                    ]
                )}
            </Dialog>

            {/* User Card Popover for review avatars */}
            <UserCardPopover
                anchorEl={cardAnchorEl}
                onClose={handleCardClose}
                user={cardUser}
                isSelf={cardIsSelf}
                onViewProfile={handleCardViewProfile}
                viewProfileOnly={cardIsSelf}
            />
        </Box>
    );
}

// ─── Post Preview Card (read-only, matches BusinessPublicPage style) ────────

function PostPreviewCard({ post, business, user, onClick, onCommentClick }) {
    const theme = useTheme();
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const postType = (post.type || 'update').toLowerCase();
    const isDeal = postType === 'deal';
    const dealExpired = isDeal && post.validUntil && isExpired(post.validUntil);
    const isPinned = Boolean(post.isPinned);

    let mediaUrls = [];
    if (post.mediaUrl) {
        try {
            const parsed = JSON.parse(post.mediaUrl);
            mediaUrls = Array.isArray(parsed) ? parsed : [post.mediaUrl];
        } catch {
            mediaUrls = [post.mediaUrl];
        }
    }

    const typeStyles = {
        deal: {
            chipBg: alpha(theme.palette.success.main, 0.12),
            chipColor: theme.palette.success.dark,
            icon: <LocalOfferIcon sx={{ fontSize: 14 }} />,
        },
        announcement: {
            chipBg: alpha(theme.palette.info.main, 0.12),
            chipColor: theme.palette.info.dark,
            icon: <NotesOutlinedIcon sx={{ fontSize: 14 }} />,
        },
        update: {
            chipBg: alpha(theme.palette.warning.main, 0.12),
            chipColor: theme.palette.warning.dark,
            icon: <ArticleRoundedIcon sx={{ fontSize: 14 }} />,
        },
    };
    const style = typeStyles[postType] || typeStyles.update;

    const hasPhotos = mediaUrls.length > 0;
    const mainPhoto = mediaUrls[0] || '';
    const extraPhotos = mediaUrls.length - 1;

    return (
        <>
            <Box
                onClick={onClick}
                sx={{
                    py: 1.5,
                    px: 1.5,
                    cursor: onClick ? 'pointer' : 'default',
                    transition: (t) => `background-color ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                    ...(onClick ? { '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.025) } } : {}),
                }}
            >
                {/* Header row */}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Avatar
                        src={business?.avatar_url || business?.avatarUrl}
                        sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14 }}
                    >
                        {business?.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap">
                            <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', lineHeight: 1.3 }}>{business?.name}</Typography>
                            <VerifiedIcon sx={{ fontSize: 13, color: 'info.main' }} />
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>{formatRelativeTime(post.createdAt)}</Typography>
                    </Box>
                    {isPinned && (
                        <Chip
                            icon={<PushPinIcon sx={{ fontSize: 10 }} />}
                            label="Pinned"
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: '0.6rem',
                                fontWeight: 600,
                                bgcolor: alpha(theme.palette.warning.main, 0.12),
                                color: (t) => t.palette.warning.dark,
                                border: '1px solid',
                                borderColor: alpha(theme.palette.warning.main, 0.30),
                                '& .MuiChip-icon': { color: (t) => t.palette.warning.main },
                            }}
                        />
                    )}
                </Stack>

                {/* Type badge */}
                {postType !== 'update' && (
                    <Chip
                        icon={style.icon}
                        label={postType.charAt(0).toUpperCase() + postType.slice(1)}
                        size="small"
                        sx={{ mb: 1, height: 20, fontSize: '0.6rem', fontWeight: 600, bgcolor: style.chipBg, color: style.chipColor, '& .MuiChip-icon': { color: style.chipColor } }}
                    />
                )}
                {dealExpired && (
                    <Chip label="Expired" size="small" sx={{ ml: 1, mb: 1, height: 20, fontSize: '0.6rem', fontWeight: 600, bgcolor: 'error.light', color: 'error.contrastText' }} />
                )}

                {/* Horizontal body: photo left, text right (matches PostList) */}
                <Box sx={{ display: 'flex', gap: hasPhotos ? 1.5 : 0, mb: 0.5 }}>
                    {hasPhotos && (
                        <Box
                            sx={{ position: 'relative', width: { xs: 100, sm: 110 }, height: { xs: 100, sm: 110 }, flexShrink: 0 }}
                            onClick={(e) => { e.stopPropagation(); setLightboxIndex(0); setLightboxOpen(true); }}
                        >
                            <Box
                                component="img"
                                src={mainPhoto}
                                loading="lazy"
                                alt=""
                                sx={{
                                    width: '100%', height: '100%', objectFit: 'cover',
                                    borderRadius: '10px', border: '1px solid', borderColor: (t) => alpha(t.palette.common.black, 0.08),
                                    boxShadow: (t) => t.custom.shadows.xs, display: 'block', cursor: 'pointer',
                                }}
                            />
                            {extraPhotos > 0 && (
                                <Box sx={{
                                    position: 'absolute', left: '50%', bottom: 5, transform: 'translateX(-50%)',
                                    px: 0.8, py: 0.15, borderRadius: 999, bgcolor: (t) => alpha(t.palette.common.black, 0.70),
                                    backdropFilter: 'blur(4px)', fontSize: '0.65rem', fontWeight: 700,
                                    color: 'common.white', lineHeight: 1.2, whiteSpace: 'nowrap', userSelect: 'none',
                                }}>
                                    +{extraPhotos} more
                                </Box>
                            )}
                        </Box>
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {post.title && (
                            <Typography sx={{
                                fontWeight: 700, fontSize: '0.92rem', lineHeight: 1.3, wordBreak: 'break-word', mb: 0.5,
                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>
                                {post.title}
                            </Typography>
                        )}
                        {isDeal && post.discountText && (
                            <Typography variant="body2" fontWeight={800} color="success.dark" sx={{ mb: 0.5, fontSize: '0.8rem' }}>{post.discountText}</Typography>
                        )}
                        {post.body && (
                            <Typography variant="body2" color="text.secondary" sx={{
                                fontSize: '0.8rem', lineHeight: 1.5, wordBreak: 'break-word',
                                display: '-webkit-box', WebkitLineClamp: hasPhotos ? 3 : 4, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>
                                {post.body}
                            </Typography>
                        )}
                        {isDeal && post.validUntil && (
                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                                <ScheduleIcon sx={{ fontSize: 11, color: dealExpired ? 'error.main' : 'text.secondary' }} />
                                <Typography variant="caption" color={dealExpired ? 'error.main' : 'text.secondary'} sx={{ fontSize: '0.7rem' }}>
                                    {dealExpired ? 'Expired' : `Valid until ${formatDate(post.validUntil)}`}
                                </Typography>
                            </Stack>
                        )}
                    </Box>
                </Box>

                {/* Action Bar */}
                <Box onClick={(e) => e.stopPropagation()} sx={{ mt: 1, pt: 0.5 }}>
                    <ActionBar
                        variant="business"
                        user={user?.user || user}
                        postId={post.id}
                        post={post}
                        initialLikes={Number(post.likeCount ?? post.likesCount ?? post.likes_count ?? post.like_count ?? post.likes ?? 0)}
                        initiallyLiked={Boolean(post.viewerLiked ?? post.viewer_liked ?? post.liked ?? post.is_liked)}
                        commentsCount={Number(post.commentCount ?? post.commentsCount ?? post.comments_count ?? post.comment_count ?? post.comments ?? 0)}
                        initialReposts={Number(post.repostCount ?? post.repostsCount ?? post.reposts_count ?? post.repost_count ?? post.reposts ?? 0)}
                        initiallyReposted={Boolean(post.viewerReposted ?? post.viewer_reposted ?? post.reposted ?? post.is_reposted)}
                        useShareDialog
                        onComment={onCommentClick || onClick}
                    />
                </Box>
            </Box>

            {/* Lightbox */}
            <Dialog open={lightboxOpen} onClose={() => setLightboxOpen(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { bgcolor: 'black', maxHeight: '90vh' } }}>
                <IconButton onClick={() => setLightboxOpen(false)} sx={{ position: 'absolute', top: 8, right: 8, color: 'white', zIndex: 1 }}><CloseIcon /></IconButton>
                {mediaUrls.length > 1 && [
                    <IconButton key="lb-prev" onClick={() => setLightboxIndex((prev) => (prev - 1 + mediaUrls.length) % mediaUrls.length)} sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'white', bgcolor: (t) => alpha(t.palette.common.black, 0.50), '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.70) } }}><ChevronLeftIcon /></IconButton>,
                    <IconButton key="lb-next" onClick={() => setLightboxIndex((prev) => (prev + 1) % mediaUrls.length)} sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'white', bgcolor: (t) => alpha(t.palette.common.black, 0.50), '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.70) } }}><ChevronRightIcon /></IconButton>,
                ]}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, height: '80vh' }}>
                    <Box component="img" src={mediaUrls[lightboxIndex]} alt="" sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </Box>
            </Dialog>
        </>
    );
}

PostPreviewCard.propTypes = { post: PropTypes.object.isRequired, business: PropTypes.object, user: PropTypes.object, onClick: PropTypes.func, onCommentClick: PropTypes.func };

// ─── Posts Tab (pure list — detail is rendered by BusinessDetailPanel) ────────

function PostsTab({ businessId, business, user, onPostCountChange, filterType, sortBy, dateRange, onSelectPost, onCommentPost }) {
    const { activeBusinessId: acctBizId, activeArtistId: acctArtId } = useActiveAccount();
    const [posts, setPosts] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);

    const sentinelRef = useRef(null);
    const offsetRef = useRef(0);

    const onPostCountChangeRef = useRef(onPostCountChange);
    onPostCountChangeRef.current = onPostCountChange;

    useEffect(() => {
        if (!businessId) {
            setPosts([]);
            setTotalCount(0);
            setLoading(false);
            setHasMore(false);
            return;
        }

        let cancelled = false;
        setPosts([]);
        setLoading(true);
        offsetRef.current = 0;

        fetchBusinessPosts({
            businessId,
            limit: POSTS_PAGE_SIZE,
            offset: 0,
            sort: sortBy,
            type: filterType,
            activeBusinessId: acctBizId || null,
            activeArtistId: acctArtId || null,
        })
            .then((data) => {
                if (cancelled) return;
                const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
                const total = Number(data?.total || items.length);
                setPosts(items);
                setTotalCount(total);
                offsetRef.current = items.length;
                setHasMore(items.length < total);
                setLoading(false);
                if (onPostCountChangeRef.current) onPostCountChangeRef.current(total);
            })
            .catch(() => {
                if (!cancelled) {
                    setPosts([]);
                    setTotalCount(0);
                    setLoading(false);
                    setHasMore(false);
                }
            });

        return () => { cancelled = true; };
    }, [businessId, filterType, sortBy, acctBizId, acctArtId]);

    const loadMore = useCallback(() => {
        if (loadingMore || !hasMore || !businessId) return;
        setLoadingMore(true);

        fetchBusinessPosts({
            businessId,
            limit: POSTS_PAGE_SIZE,
            offset: offsetRef.current,
            sort: sortBy,
            type: filterType,
            activeBusinessId: acctBizId || null,
            activeArtistId: acctArtId || null,
        })
            .then((data) => {
                const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
                setPosts((prev) => [...prev, ...items]);
                offsetRef.current += items.length;
                setHasMore(offsetRef.current < (Number(data?.total) || 0));
                setLoadingMore(false);
            })
            .catch(() => {
                setLoadingMore(false);
            });
    }, [loadingMore, hasMore, businessId, sortBy, filterType, acctBizId, acctArtId]);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { rootMargin: '200px' }
        );
        observer.observe(sentinel);
        return () => { observer.disconnect(); };
    }, [loadMore]);

    const filtersActive = filterType !== 'all' || sortBy !== 'newest' || (dateRange && dateRange !== 'all');

    // Apply client-side date range filtering based on dropdown value
    const dateFilteredPosts = (() => {
        if (!dateRange || dateRange === 'all') return posts;
        const now = new Date();
        let from;
        if (dateRange === 'today') {
            from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (dateRange === 'week') {
            from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        } else if (dateRange === 'month') {
            from = new Date(now.getFullYear(), now.getMonth(), 1);
        } else {
            return posts;
        }
        return posts.filter((p) => new Date(p.createdAt || 0) >= from);
    })();

    if (loading) {
        return (
            <Box>
                {[1, 2, 3].map((n) => (
                    <Box key={n} sx={{ mb: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                            <Skeleton variant="circular" width={34} height={34} />
                            <Box sx={{ flex: 1 }}>
                                <Skeleton height={14} width="50%" />
                                <Skeleton height={12} width="30%" sx={{ mt: 0.5 }} />
                            </Box>
                        </Stack>
                        <Skeleton height={16} width="80%" />
                        <Skeleton height={14} width="60%" sx={{ mt: 0.5 }} />
                        <Skeleton variant="rounded" height={80} sx={{ mt: 1, borderRadius: 2 }} />
                    </Box>
                ))}
            </Box>
        );
    }

    return (
        <Box>
            {dateFilteredPosts.length === 0 ? (
                <Box sx={{ py: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <ArticleRoundedIcon sx={{ fontSize: 44, color: 'primary.main' }} />
                    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'primary.main' }}>
                        {filtersActive ? 'No matching posts' : 'No posts yet'}
                    </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: '0.82rem', textAlign: 'center', maxWidth: 260 }}>
                        {filtersActive
                            ? 'Try changing or resetting your filters.'
                            : "This business hasn\u2019t published any posts yet."}
                    </Typography>
                </Box>
            ) : (
                <Stack spacing={0} divider={<Divider />}>
                    {dateFilteredPosts.map((post) => (
                        <PostPreviewCard
                            key={post.id || post._id}
                            post={post}
                            business={business}
                            user={user}
                            onClick={() => onSelectPost?.(post)}
                            onCommentClick={() => onCommentPost?.(post)}
                        />
                    ))}
                </Stack>
            )}

            <Box ref={sentinelRef} sx={{ height: 1 }} />

            {loadingMore && (
                <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={24} />
                </Box>
            )}

            {!hasMore && posts.length > 0 && !loadingMore && (
                <Typography color="text.disabled" sx={{ textAlign: 'center', fontSize: '0.75rem', py: 2, fontWeight: 600 }}>
                    {posts.length >= totalCount ? "You\u2019ve seen all posts" : ''}
                </Typography>
            )}
        </Box>
    );
}

PostsTab.propTypes = {
    businessId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    business: PropTypes.object,
    user: PropTypes.object,
    onPostCountChange: PropTypes.func,
    filterType: PropTypes.string,
    sortBy: PropTypes.string,
    dateRange: PropTypes.string,
    onSelectPost: PropTypes.func,
    onCommentPost: PropTypes.func,
};

// Report dialog now uses shared ReportDialog from ActionBar

// ─── Main Component ──────────────────────────────────────────────────────────

const BUSINESS_FOLLOW_EVENT = 'll:business:follow-changed';

function getBusinessFollowStateCache() {
    if (typeof window === 'undefined') return {};
    if (!window.__llBusinessFollowStateCache) window.__llBusinessFollowStateCache = {};
    return window.__llBusinessFollowStateCache;
}

function readBusinessFollowState(businessId, accountKey) {
    if (!businessId) return null;
    return getBusinessFollowStateCache()[`${String(businessId)}:${accountKey || 'personal'}`] || null;
}

function writeBusinessFollowState(businessId, isFollowing, accountKey) {
    if (!businessId) return;
    getBusinessFollowStateCache()[`${String(businessId)}:${accountKey || 'personal'}`] = {
        isFollowing: Boolean(isFollowing),
        t: Date.now(),
    };
}

const DESC_MAX_HEIGHT = 160; // px – collapsed description max height

// ─── Post type detection (matches BusinessPublicPage pattern) ────────────────
function detectPostKind(post) {
    if (!post) return 'user';
    const cat = String(post?.category || '').toLowerCase().trim();
    if (cat === 'business_post') return 'business';
    if (cat === 'artist_post') return 'artist';
    const pType = String(post?.postType || post?.post_type || '').toLowerCase().trim();
    if (pType === 'business') return 'business';
    if (pType === 'artist') return 'artist';
    const hasArtist = Boolean(post.artist_id || post.artistId || post.artistName || post.artist_name || post.artistHandle || post.artist_handle);
    const hasBusiness = Boolean(post.business_id || post.businessId || post.businessPageId || post.business_page_id || post.page_id || post.pageId || post.businessName || post.business_name || post.pageName || post.page_name);
    if (hasArtist && !hasBusiness) return 'artist';
    if (hasBusiness) return 'business';
    return 'user';
}

export default function BusinessDetailPanel({
                                                business,
                                                emptyLabel,
                                                onViewPage,
                                                user,
                                                isOwnBusiness: isOwnBusinessProp,
                                                onReviewChange,
                                                onLocationClick,
                                                isFollowing: isFollowingProp,
                                                onDeselect,
                                                initialTab = 0,
                                                highlightReviewId: highlightReviewIdProp = null,
                                                highlightReviewerId: highlightReviewerIdProp = null,
                                                followerCount: followerCountProp = null,
                                                followingCount: followingCountProp = null,
                                                onFollowersClick,
                                                onFollowingClick,
                                            }) {
    const navigate = useNavigate();
    const bdpTheme = useTheme();
    const isMobile = useMediaQuery(bdpTheme.breakpoints.down('md'));
    const {
        accountCacheKey = 'personal',
        getAccountParams,
        getAccountPayload,
        getAccountHeaders: getAcctHeaders,
        isBusinessAccount: isBA,
        activeBusinessId: aBizId,
        isArtistAccount: isAA,
        activeArtistId: aArtId,
        activeAccount: acctObj,
    } = useActiveAccount();

    // ── Stable refs for context functions that may return new references each
    //    render.  Using refs in effects avoids infinite update loops caused by
    //    unstable identity in dependency arrays. ──
    const getAccountParamsRef = useRef(getAccountParams);
    getAccountParamsRef.current = getAccountParams;
    const getAccountPayloadRef = useRef(getAccountPayload);
    getAccountPayloadRef.current = getAccountPayload;
    const getAcctHeadersRef = useRef(getAcctHeaders);
    getAcctHeadersRef.current = getAcctHeaders;
    const [activeTab, setActiveTab] = useState(initialTab || 0);
    const [fullData, setFullData] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [descExpanded, setDescExpanded] = useState(false);
    const [photoPreviewSrc, setPhotoPreviewSrc] = useState('');
    // Panel-level photo lightbox (cover, avatar, gallery)
    const [panelLightboxOpen, setPanelLightboxOpen] = useState(false);
    const [panelLightboxPhotos, setPanelLightboxPhotos] = useState([]);
    const [panelLightboxIndex, setPanelLightboxIndex] = useState(0);
    const [panelLightboxCaptions, setPanelLightboxCaptions] = useState([]);
    // Panel-level photo lightbox handler — defined here (before any early
    // returns) so it follows React's Rules of Hooks. Opens any photo set
    // (cover, avatar, gallery, highlight images) in a full-screen viewer.
    const openPanelLightbox = useCallback((photos, idx = 0, captions = []) => {
        const clean = (Array.isArray(photos) ? photos : [photos]).filter(Boolean);
        if (!clean.length) return;
        setPanelLightboxPhotos(clean);
        setPanelLightboxIndex(Math.max(0, Math.min(idx, clean.length - 1)));
        setPanelLightboxCaptions(Array.isArray(captions) ? captions : []);
        setPanelLightboxOpen(true);
    }, []);
    const [builderExpanded, setBuilderExpanded] = useState(false);
    const [hoursExpanded, setHoursExpanded] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const [postCount, setPostCount] = useState(0);

    // ── Photo comments/likes state ──
    const [photoCommentsOpen, setPhotoCommentsOpen] = useState(false);
    const [photoCommentsType, setPhotoCommentsType] = useState('avatar'); // 'avatar' | 'cover' | 'gallery'
    const [photoCommentsPhotoId, setPhotoCommentsPhotoId] = useState(null);
    const [photoCommentsPhotoUrl, setPhotoCommentsPhotoUrl] = useState(null);
    const [bizGalleryPhotos, setBizGalleryPhotos] = useState([]);
    const [bizGalleryLoaded, setBizGalleryLoaded] = useState(false);
    const [reviewCountLocal, setReviewCountLocal] = useState(null);
    const [averageRatingLocal, setAverageRatingLocal] = useState(null);
    const [postFilterType, setPostFilterType] = useState('all');
    const [postSortBy, setPostSortBy] = useState('newest');
    const [postDateRange, setPostDateRange] = useState('all');

    // ── Mobile activity fullscreen dialog ──
    const [activityOpen, setActivityOpen] = useState(false);
    const [activitySelectedPost, setActivitySelectedPost] = useState(null);
    const [activityScrollCommentId, setActivityScrollCommentId] = useState(null);
    const [activityHighlightCommentId, setActivityHighlightCommentId] = useState(null);

    // ── Activity: posts state (for mobile BusinessEngagementTabs) ──
    const [activityPosts, setActivityPosts] = useState([]);
    const [activityPostsLoading, setActivityPostsLoading] = useState(false);

    // ── Activity: jobs / services / events detection ──
    const [bizHasJobs, setBizHasJobs] = useState(false);
    const [bizHasServices, setBizHasServices] = useState(false);
    const [bizHasEvents, setBizHasEvents] = useState(false);
    const [bizEventsCount, setBizEventsCount] = useState(0);

    // ── Lifted post-detail state (fills entire right panel) ──
    const [selectedPost, setSelectedPost] = useState(null);
    const [freshPost, setFreshPost] = useState(null);
    const detailFetchRef = useRef(0);
    const pendingFocusRef = useRef(false);
    const scrollWrapRef = useRef(null);
    const savedScrollPosRef = useRef(0);

    // ── Listen for block/hide events: deselect this business if it was blocked ──
    useEffect(() => {
        const currentBizId = Number(business?.id || 0);
        if (!currentBizId) return undefined;
        const onBlockedChanged = (e) => {
            const { userId, targetType, blocked } = e?.detail || {};
            if (!blocked) return;
            if (targetType === 'business' && Number(userId) === currentBizId) {
                if (typeof onDeselect === 'function') onDeselect();
                try { window.dispatchEvent(new CustomEvent('ll:business:directory-refresh')); } catch { /* */ }
            }
        };
        const onHiddenChanged = (e) => {
            const { userId, targetType, hidden } = e?.detail || {};
            if (!hidden) return;
            if (targetType === 'business' && Number(userId) === currentBizId) {
                if (typeof onDeselect === 'function') onDeselect();
                try { window.dispatchEvent(new CustomEvent('ll:business:directory-refresh')); } catch { /* */ }
            }
        };
        window.addEventListener('ll:user:blocked-changed', onBlockedChanged);
        window.addEventListener('ll:user:hidden-changed', onHiddenChanged);
        return () => {
            window.removeEventListener('ll:user:blocked-changed', onBlockedChanged);
            window.removeEventListener('ll:user:hidden-changed', onHiddenChanged);
        };
    }, [business?.id, onDeselect]);

    const getScrollParent = (el) => {
        if (!el) return null;
        let node = el.parentElement;
        while (node) {
            const s = window.getComputedStyle(node);
            if (s.overflowY === 'auto' || s.overflowY === 'scroll') return node;
            node = node.parentElement;
        }
        return null;
    };

    const handleSelectPost = useCallback((post) => {
        // Save current scroll position before switching to detail view
        const wrapper = scrollWrapRef.current;
        if (wrapper) {
            const sp = getScrollParent(wrapper);
            if (sp) savedScrollPosRef.current = sp.scrollTop;
        }
        setSelectedPost(post);
        setFreshPost(null);
        // Scroll to top so detail starts at top
        requestAnimationFrame(() => {
            const w = scrollWrapRef.current;
            if (!w) return;
            const sp = getScrollParent(w);
            if (sp) sp.scrollTop = 0;
        });
    }, []);

    const handleCommentPost = useCallback((post) => {
        if (selectedPost && String(selectedPost.id) === String(post.id)) {
            const el = document.getElementById('business-comments-composer');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const input = el.querySelector('input, textarea');
                if (input) input.focus();
            }
            return;
        }
        // Save scroll position before switching
        const wrapper = scrollWrapRef.current;
        if (wrapper) {
            const sp = getScrollParent(wrapper);
            if (sp) savedScrollPosRef.current = sp.scrollTop;
        }
        pendingFocusRef.current = true;
        setSelectedPost(post);
        setFreshPost(null);
        requestAnimationFrame(() => {
            const w = scrollWrapRef.current;
            if (!w) return;
            const sp = getScrollParent(w);
            if (sp) sp.scrollTop = 0;
        });
    }, [selectedPost]);

    // Re-fetch selected post with per-account viewer state
    useEffect(() => {
        const pid = selectedPost?.id;
        if (!pid) { setFreshPost(null); return; }
        const reqId = ++detailFetchRef.current;
        let cancelled = false;
        const acctQs = new URLSearchParams(getAccountParamsRef.current());
        const qs = acctQs.toString() ? `?${acctQs.toString()}` : '';
        const urls = [
            `/api/business/posts/${encodeURIComponent(pid)}${qs}`,
            `/api/business-posts/${encodeURIComponent(pid)}${qs}`,
        ];
        (async () => {
            for (const url of urls) {
                try {
                    const res = await secureFetch(url, { credentials: 'include', cache: 'no-store' });
                    if (res.ok) {
                        const data = await res.json().catch(() => null);
                        const fetched = data?.post || data;
                        if (!cancelled && reqId === detailFetchRef.current && fetched && typeof fetched === 'object') {
                            setFreshPost(fetched);
                        }
                        return;
                    }
                } catch { /* try next */ }
            }
        })();
        return () => { cancelled = true; };
    }, [selectedPost?.id, accountCacheKey]);

    // Auto-focus comment composer after detail opens
    useEffect(() => {
        if (!selectedPost || !pendingFocusRef.current) return;
        pendingFocusRef.current = false;
        const timer = setTimeout(() => {
            const el = document.getElementById('business-comments-composer');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const input = el.querySelector('input, textarea');
                if (input) input.focus();
            }
        }, 320);
        return () => clearTimeout(timer);
    }, [selectedPost]);

    // Clear selected post when business changes
    const prevBizIdRef = useRef(business?.id);
    useEffect(() => {
        if (prevBizIdRef.current !== business?.id) {
            setSelectedPost(null);
            setFreshPost(null);
        }
        prevBizIdRef.current = business?.id;
    }, [business?.id]);

    const displayPost = (() => {
        if (!selectedPost) return null;
        if (freshPost && String(freshPost.id) === String(selectedPost.id)) return freshPost;
        return selectedPost;
    })();

    // ── Follow state: account-aware with shared cache/event sync ──
    const [isFollowing, setIsFollowing] = useState(Boolean(isFollowingProp));
    const [followBusy, setFollowBusy] = useState(false);

    const viewer = user || null;
    const viewerId = Number(viewer?.id || 0);
    const followTargetId = Number(business?.id || 0);

    useEffect(() => {
        const cached = readBusinessFollowState(followTargetId, accountCacheKey);
        if (cached && typeof cached.isFollowing === 'boolean') {
            setIsFollowing(Boolean(cached.isFollowing));
            return;
        }
        setIsFollowing(Boolean(isFollowingProp));
    }, [followTargetId, isFollowingProp, accountCacheKey]);

    useEffect(() => {
        let cancelled = false;
        if (!followTargetId || !viewerId || isOwnBusinessProp) {
            setIsFollowing(false);
            return undefined;
        }

        // Use /api/follows/status — the same endpoint UserCardPopover uses.
        // The older /api/users/follow-states does not reliably resolve
        // account-scoped follow state for business targets.
        const qs = new URLSearchParams({
            target_id: String(followTargetId),
            target_type: 'business',
        });
        const headers = typeof getAcctHeadersRef.current === 'function' ? (getAcctHeadersRef.current() || {}) : {};
        secureFetch(`/api/follows/status?${qs.toString()}`, {
            credentials: 'include',
            headers: { Accept: 'application/json', ...headers },
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (cancelled || !data) return;
                const next = Boolean(data.following);
                setIsFollowing(next);
                writeBusinessFollowState(followTargetId, next, accountCacheKey);
            })
            .catch(() => {
                if (!cancelled) setIsFollowing(Boolean(readBusinessFollowState(followTargetId, accountCacheKey)?.isFollowing || false));
            });

        return () => {
            cancelled = true;
        };
    }, [followTargetId, viewerId, accountCacheKey, isOwnBusinessProp]);

    useEffect(() => {
        const handler = (e) => {
            const detail = e.detail || {};
            if (Number(detail.businessId) !== followTargetId) return;
            if (detail.accountCacheKey && detail.accountCacheKey !== accountCacheKey) return;
            setIsFollowing(Boolean(detail.isFollowing));
            writeBusinessFollowState(followTargetId, Boolean(detail.isFollowing), accountCacheKey);
        };
        window.addEventListener(BUSINESS_FOLLOW_EVENT, handler);
        return () => window.removeEventListener(BUSINESS_FOLLOW_EVENT, handler);
    }, [followTargetId, accountCacheKey]);

    // 3-dot menu + report dialog
    const [bizMenuEl, setBizMenuEl] = useState(null);
    const bizMenuOpen = Boolean(bizMenuEl);
    const [bizReportOpen, setBizReportOpen] = useState(false);
    const [bizReportSubmitted, setBizReportSubmitted] = useState(false);
    const [copyLinkToast, setCopyLinkToast] = useState(false);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [quickMsgOpen, setQuickMsgOpen] = useState(false);
    const [hideBusy, setHideBusy] = useState(false);
    const [blockBusy, setBlockBusy] = useState(false);

    const handlePostCountChange = useCallback((count) => {
        setPostCount(count);
    }, []);

    // Store onReviewChange in a ref to avoid dependency loops
    const onReviewChangeRef = useRef(onReviewChange);
    onReviewChangeRef.current = onReviewChange;

    const handleReviewCountChange = useCallback((count, avg) => {
        setReviewCountLocal(count);
        if (avg != null) setAverageRatingLocal(avg);
        // Bubble up to parent so directory card can update
        if (onReviewChangeRef.current && business?.id) {
            onReviewChangeRef.current(business.id, count, avg);
        }
    }, [business?.id]);

    // Listen for review changes from other components (e.g. public page) to update header stats
    useEffect(() => {
        const handler = (e) => {
            const d = e.detail;
            if (!d || !business?.id || String(d.businessId) !== String(business.id)) return;
            if (d._source === 'detailPanel') return; // ignore own dispatches
            setReviewCountLocal(Number(d.reviewCount || 0));
            setAverageRatingLocal(Number(d.averageRating || 0));
        };
        window.addEventListener('ll:business:review-changed', handler);
        return () => window.removeEventListener('ll:business:review-changed', handler);
    }, [business?.id]);

    const slug = String(business?.slug || business?.page_slug || '').trim();
    const hasSelection = Boolean(business && (business.id || business.name));

    // ── Photo comments callbacks ──
    const slugOrId = business?.slug || business?.handle || business?.id;

    const openAvatarComments = useCallback(() => {
        const avatarUrl = business?.avatar_url || business?.avatarUrl;
        if (!avatarUrl || avatarUrl.includes('default_avatar') || avatarUrl.includes('default_business')) return;
        if (!slugOrId) return;
        setPhotoCommentsType('avatar');
        setPhotoCommentsPhotoId(null);
        setPhotoCommentsPhotoUrl(null);
        setPhotoCommentsOpen(true);
    }, [business?.avatar_url, business?.avatarUrl, slugOrId]);

    const openCoverComments = useCallback(() => {
        const coverUrl = business?.cover_url || business?.coverUrl;
        if (!coverUrl || !slugOrId) return;
        setPhotoCommentsType('cover');
        setPhotoCommentsPhotoId(null);
        setPhotoCommentsPhotoUrl(null);
        setPhotoCommentsOpen(true);
    }, [business?.cover_url, business?.coverUrl, slugOrId]);

    const openGalleryPhotoComments = useCallback((photoId, photoUrl) => {
        if (!photoId) return;
        setPhotoCommentsType('gallery');
        setPhotoCommentsPhotoId(photoId);
        setPhotoCommentsPhotoUrl(photoUrl || null);
        setPhotoCommentsOpen(true);
    }, []);

    // ── Fetch gallery photos with DB IDs (for like/comment support) ──
    useEffect(() => {
        if (!slugOrId) return;
        let alive = true;
        (async () => {
            try {
                const r = await axios.get(`/api/business/photos/${encodeURIComponent(slugOrId)}`, { withCredentials: true });
                const items = Array.isArray(r.data?.photos) ? r.data.photos : [];
                if (alive) { setBizGalleryPhotos(items); setBizGalleryLoaded(true); }
            } catch { if (alive) setBizGalleryLoaded(true); }
        })();
        return () => { alive = false; };
    }, [slugOrId]);

    const handleFollowToggle = useCallback(async () => {
        if (!followTargetId || !viewerId || followBusy) return;

        const previous = Boolean(isFollowing);
        const payload = {
            target_id: followTargetId,
            target_type: 'business',
            action: previous ? 'unfollow' : 'follow',
        };
        try {
            const acctPayload = typeof getAccountPayloadRef.current === 'function' ? getAccountPayloadRef.current() : {};
            // Merge account context but preserve our target fields
            const { target_id: _tid, target_type: _tt, action: _a, ...safeAcct } = acctPayload || {};
            Object.assign(payload, safeAcct);
        } catch {
            // ignore
        }

        const headers = typeof getAcctHeadersRef.current === 'function' ? (getAcctHeadersRef.current() || {}) : {};

        setFollowBusy(true);
        setIsFollowing(!previous);
        writeBusinessFollowState(followTargetId, !previous, accountCacheKey);

        try {
            const res = await secureFetch('/api/follows/toggle', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Follow toggle failed');

            const data = await res.json().catch(() => null);
            const nowFollowing = Boolean(data?.following ?? data?.isFollowing ?? !previous);
            setIsFollowing(nowFollowing);
            writeBusinessFollowState(followTargetId, nowFollowing, accountCacheKey);
            window.dispatchEvent(new CustomEvent(BUSINESS_FOLLOW_EVENT, {
                detail: { businessId: followTargetId, isFollowing: nowFollowing, accountCacheKey, source: 'detail' },
            }));
        } catch {
            setIsFollowing(previous);
            writeBusinessFollowState(followTargetId, previous, accountCacheKey);
        } finally {
            setFollowBusy(false);
        }
    }, [followTargetId, viewerId, followBusy, isFollowing, accountCacheKey]);

    const handleBizCopyLink = useCallback(() => {
        setBizMenuEl(null);
        const url = `${window.location.origin}/${slug}`;
        navigator.clipboard.writeText(url).then(() => setCopyLinkToast(true)).catch(() => setCopyLinkToast(true));
    }, [slug]);

    const handleBizReportClick = useCallback(() => {
        setBizMenuEl(null);
        setBizReportOpen(true);
        setBizReportSubmitted(false);
    }, []);

    const submitBizReport = useCallback(async ({ reason, details }) => {
        const bizId = business?.id;
        if (!bizId) return;
        const urls = [
            `/api/business/${encodeURIComponent(bizId)}/report`,
            `/api/business/${encodeURIComponent(bizId)}/flag`,
        ];
        for (const url of urls) {
            try {
                const res = await secureFetch(url, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason, details }) });
                if (res.ok) { setBizReportSubmitted(true); return; }
            } catch { /* try next */ }
        }
    }, [business?.id]);

    const handleHideBusiness = useCallback(async () => {
        const bizId = Number(business?.id || 0);
        if (!bizId || hideBusy || blockBusy) return;
        setBizMenuEl(null);
        setHideBusy(true);
        const displayName = String(business?.name || 'Business').trim() || 'Business';
        try {
            const hdrs = { 'Content-Type': 'application/json', ...(typeof getAcctHeadersRef.current === 'function' ? (getAcctHeadersRef.current() || {}) : {}) };
            const payload = { target_id: bizId, target_type: 'business', action: 'hide' };
            if (isBA && aBizId) payload.actor_business_id = Number(aBizId);
            if (isAA && aArtId) payload.actor_artist_id = Number(aArtId);
            const urls = ['/api/users/hide'];
            for (const url of urls) {
                try {
                    const res = await secureFetch(url, { method: 'POST', credentials: 'include', headers: hdrs, body: JSON.stringify(payload) });
                    if (res.ok) {
                        try { window.dispatchEvent(new CustomEvent('ll:user:hidden-changed', { detail: { userId: bizId, targetType: 'business', hidden: true, displayName, toastMessage: `Posts from ${displayName} hidden` } })); } catch { /* */ }
                        try { window.dispatchEvent(new CustomEvent('ll:business:hidden-changed', { detail: { businessId: bizId, hidden: true, source: 'detail', displayName } })); } catch { /* */ }
                        try { window.dispatchEvent(new CustomEvent('ll:business:directory-refresh')); } catch { /* */ }
                        if (typeof onDeselect === 'function') onDeselect();
                        return;
                    }
                } catch { /* */ }
            }
        } catch { /* */ } finally { setHideBusy(false); }
    }, [business?.id, business?.name, hideBusy, blockBusy, onDeselect, isBA, aBizId, isAA, aArtId]);

    const handleBlockBusiness = useCallback(async () => {
        const bizId = Number(business?.id || 0);
        if (!bizId || hideBusy || blockBusy) return;
        setBizMenuEl(null);
        setBlockBusy(true);
        const displayName = String(business?.name || 'Business').trim() || 'Business';
        try {
            const hdrs = { 'Content-Type': 'application/json', ...(typeof getAcctHeadersRef.current === 'function' ? (getAcctHeadersRef.current() || {}) : {}) };
            const payload = { target_id: bizId, target_type: 'business', action: 'block' };
            if (isBA && aBizId) payload.actor_business_id = Number(aBizId);
            if (isAA && aArtId) payload.actor_artist_id = Number(aArtId);
            const urls = ['/api/users/block'];
            for (const url of urls) {
                try {
                    const res = await secureFetch(url, { method: 'POST', credentials: 'include', headers: hdrs, body: JSON.stringify(payload) });
                    if (res.ok) {
                        try { window.dispatchEvent(new CustomEvent('ll:user:blocked-changed', { detail: { userId: bizId, targetType: 'business', blocked: true, displayName, toastMessage: `${displayName} blocked` } })); } catch { /* */ }
                        try { window.dispatchEvent(new CustomEvent('ll:user:hidden-changed', { detail: { userId: bizId, targetType: 'business', hidden: true, displayName } })); } catch { /* */ }
                        try { window.dispatchEvent(new CustomEvent('ll:business:blocked-changed', { detail: { businessId: bizId, blocked: true, source: 'detail', displayName } })); } catch { /* */ }
                        try { window.dispatchEvent(new CustomEvent('ll:business:directory-refresh')); } catch { /* */ }
                        if (typeof onDeselect === 'function') onDeselect();
                        return;
                    }
                } catch { /* */ }
            }
        } catch { /* */ } finally { setBlockBusy(false); }
    }, [business?.id, business?.name, hideBusy, blockBusy, onDeselect, isBA, aBizId, isAA, aArtId]);

    const hasMapPin = Boolean(
        business?.latitude && business?.longitude &&
        Number.isFinite(Number(business.latitude)) && Number.isFinite(Number(business.longitude))
    );

    // Reset tab + collapse description when business changes

    // Scroll to highlighted review after data loads
    useEffect(() => {
        if ((!highlightReviewIdProp && !highlightReviewerIdProp) || activeTab !== 3) return;
        const timer = setTimeout(() => {
            let el = highlightReviewIdProp ? document.getElementById(`review-highlight-${highlightReviewIdProp}`) : null;
            if (!el) el = document.querySelector('[id^="review-highlight-"]');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 600);
        return () => clearTimeout(timer);
    }, [highlightReviewIdProp, highlightReviewerIdProp, activeTab, fullData]);

    useEffect(() => {
        setActiveTab(initialTab || 0);
        setDescExpanded(false);
        setAvatarError(false);
        setPostCount(0);
        setReviewCountLocal(null);
        setAverageRatingLocal(null);
        setPostFilterType('all');
        setPostSortBy('newest');
        setPostDateRange('all');

        // Lightweight fetch: get just the review count for the header + card
        const bizId = business?.id;
        if (!bizId) return;

        // ── SKIP for unclaimed businesses ──
        // Unclaimed business IDs live in `unclaimed_businesses`, not `businesses`.
        // Fetching reviews/posts against this ID would return empty results and
        // overwrite the Google rating with 0. We want to keep showing the Google
        // rating from the prop data for unclaimed profiles.
        if (business?.is_unclaimed) {
            return;
        }

        let cancelled = false;
        // Pre-fetch both review count and post count
        Promise.all([
            fetchBusinessReviews({ businessId: bizId, limit: 1, offset: 0, sort: 'newest' }).catch(() => null),
            fetchBusinessPosts({ businessId: bizId, limit: 500, offset: 0 }).catch(() => null),
        ]).then(([reviewResp, postsResp]) => {
            if (cancelled) return;
            if (reviewResp) {
                const count = Number(reviewResp?.total || 0);
                const avg = Number(reviewResp?.averageRating || 0);
                setReviewCountLocal(count);
                setAverageRatingLocal(avg);
                if (onReviewChangeRef.current) onReviewChangeRef.current(bizId, count, avg);
            }
            if (postsResp) {
                const total = Number(postsResp?.total || (Array.isArray(postsResp?.items) ? postsResp.items.length : 0));
                if (total > 0) setPostCount(total);
            }
        });
        return () => { cancelled = true; };
    }, [business?.id]);

    // ── Activity: fetch posts for mobile BusinessEngagementTabs ──
    useEffect(() => {
        const bizId = business?.id;
        if (!bizId) { setActivityPosts([]); setActivityPostsLoading(false); return; }
        let cancelled = false;
        setActivityPostsLoading(true);
        fetchBusinessPosts({ businessId: bizId, limit: 500, offset: 0 })
            .then((data) => {
                if (cancelled) return;
                const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
                setActivityPosts(items);
            })
            .catch(() => { if (!cancelled) setActivityPosts([]); })
            .finally(() => { if (!cancelled) setActivityPostsLoading(false); });
        return () => { cancelled = true; };
    }, [business?.id]);

    // ── Activity: check if business has jobs ──
    useEffect(() => {
        const bizId = business?.id;
        if (!bizId) { setBizHasJobs(false); return; }
        let alive = true;
        const ctrl = new AbortController();
        (async () => {
            try {
                const hdrs = getAccountHeaders() || {};
                const res = await axios.get('/api/jobs/feed', {
                    params: { posterBusinessId: bizId, limit: 1 },
                    signal: ctrl.signal, withCredentials: true,
                    headers: { ...hdrs, 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
                });
                if (!alive) return;
                const items = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
                setBizHasJobs(items.length > 0);
            } catch { if (alive) setBizHasJobs(false); }
        })();
        return () => { alive = false; ctrl.abort(); };
    }, [business?.id]);

    // ── Activity: check if business has services ──
    useEffect(() => {
        const bizId = business?.id;
        if (!bizId) { setBizHasServices(false); return; }
        let alive = true;
        const ctrl = new AbortController();
        (async () => {
            try {
                const hdrs = getAccountHeaders() || {};
                const res = await axios.get('/api/services/feed', {
                    params: { posterBusinessId: bizId, limit: 1 },
                    signal: ctrl.signal, withCredentials: true,
                    headers: { ...hdrs, 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
                });
                if (!alive) return;
                const items = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
                setBizHasServices(items.length > 0);
            } catch { if (alive) setBizHasServices(false); }
        })();
        return () => { alive = false; ctrl.abort(); };
    }, [business?.id]);

    // ── Activity: check if business has events ──
    useEffect(() => {
        const bizId = business?.id;
        if (!bizId) { setBizHasEvents(false); setBizEventsCount(0); return; }
        let alive = true;
        const ctrl = new AbortController();
        (async () => {
            try {
                const hdrs = getAccountHeaders() || {};
                const res = await axios.get('/api/events', {
                    params: { businessAccountId: bizId, limit: 1, includeTotal: 1, range: 'all' },
                    signal: ctrl.signal, withCredentials: true, headers: { ...hdrs },
                });
                if (!alive) return;
                const items = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
                const total = Number(res.data?.totalCount || items.length);
                setBizHasEvents(total > 0);
                setBizEventsCount(total);
            } catch { if (alive) { setBizHasEvents(false); setBizEventsCount(0); } }
        })();
        return () => { alive = false; ctrl.abort(); };
    }, [business?.id]);

    // Fetch full business data when selected.
    //
    // Photo/avatar/cover URLs in `fullData` are GCS signed URLs that expire
    // (default 1 hour server-side). If this panel stays mounted past the TTL,
    // any <img> re-fetch hits GCS with "ExpiredToken". To prevent that:
    //   1. Refetch on a 30-minute interval (well under the signed-URL TTL).
    //   2. Refetch when the window regains focus, debounced to once per minute.
    // Refreshes are silent — no loading spinner — so the UI doesn't flicker.
    useEffect(() => {
        if (!slug) {
            setFullData(null);
            return;
        }

        let cancelled = false;
        let inFlight = false;
        let lastFetchAt = 0;

        const REFRESH_INTERVAL_MS = 30 * 60 * 1000;   // 30 min
        const FOCUS_DEBOUNCE_MS   = 60 * 1000;        // 60 sec

        const load = ({ isInitial }) => {
            if (cancelled || inFlight) return;
            inFlight = true;
            if (isInitial) setLoadingDetail(true);

            fetchBusinessPublicBySlug(slug)
                .then((resp) => {
                    if (cancelled) return;
                    setFullData(resp?.business || resp || null);
                    if (isInitial) setLoadingDetail(false);
                    lastFetchAt = Date.now();
                })
                .catch(() => {
                    if (cancelled) return;
                    // Only null out data / clear spinner on the initial load.
                    // Silent refresh failures should leave the current (possibly
                    // stale-URL) data in place rather than blank the panel.
                    if (isInitial) {
                        setFullData(null);
                        setLoadingDetail(false);
                    }
                })
                .finally(() => {
                    inFlight = false;
                });
        };

        load({ isInitial: true });

        const interval = setInterval(() => load({ isInitial: false }), REFRESH_INTERVAL_MS);

        const onFocus = () => {
            if (Date.now() - lastFetchAt < FOCUS_DEBOUNCE_MS) return;
            load({ isInitial: false });
        };
        window.addEventListener('focus', onFocus);

        return () => {
            cancelled = true;
            clearInterval(interval);
            window.removeEventListener('focus', onFocus);
        };
    }, [slug]);

    if (!hasSelection) {
        return <EmptyState label={emptyLabel} />;
    }

    // Merge list data with full fetched data
    const biz = fullData || business || {};

    // Auto-generated Google Places profile (hasn't been claimed by the owner yet)
    const isUnclaimed = Boolean(biz.is_unclaimed);
    // Photo attributions (Google ToS requires displaying author credit near each photo)
    const photoAttributions = Array.isArray(biz.photo_attributions) ? biz.photo_attributions : [];

    const name = String(biz.name || '').trim();
    const description = String(biz.description || '').trim();
    const coverUrl = String(biz.cover_url || biz.coverUrl || '').trim();
    const logoUrl = String(biz.avatar_url || biz.avatarUrl || biz.logo_url || '').trim();
    const hasValidLogo = logoUrl && !avatarError;
    const categoryKey = String(biz.category_key || biz.categoryKey || '').trim();
    const entityType = String(biz.entity_type || biz.entityType || 'business').trim();
    const city = String(biz.city || '').trim();
    const countyRaw = String(biz.county || '').trim();
    const county = countyRaw && !/county\s*$/i.test(countyRaw) ? `${countyRaw} County` : countyRaw;
    const address = String(biz.address || '').trim();
    const isStatewide = Boolean(biz.is_statewide || biz.isStatewide);
    const phone = String(biz.phone || '').trim();
    const email = String(biz.email_public || biz.emailPublic || biz.email || '').trim();
    const website = String(biz.website_url || biz.websiteUrl || '').trim();
    const facebookUrl = String(biz.facebook_url || biz.facebookUrl || '').trim();
    const instagramUrl = String(biz.instagram_url || biz.instagramUrl || '').trim();
    const twitterUrl = String(biz.twitter_url || biz.twitterUrl || '').trim();
    const linkedinUrl = String(biz.linkedin_url || biz.linkedinUrl || '').trim();
    const etsyUrl = String(biz.etsy_url || biz.etsyUrl || '').trim();
    const rating = averageRatingLocal != null ? averageRatingLocal : Number(biz.rating || biz.avg_rating || 0);
    const reviewCount = reviewCountLocal != null ? reviewCountLocal : Number(biz.review_count || biz.reviewCount || 0);
    const hours = biz.hours || biz.hours_json || null;
    const gallery = Array.isArray(biz.gallery) ? biz.gallery : (Array.isArray(biz.gallery_json) ? biz.gallery_json : []);

    // ── Business settings (from business_settings table or embedded in business object) ──
    const bizSettings = biz?.settings || biz?.businessSettings || biz;
    const businessAllowMessages = (() => {
        if (!bizSettings) return true;
        const v = bizSettings.allow_messages ?? bizSettings.allowMessages;
        if (v == null) return true;
        if (typeof v === 'boolean') return v;
        return Number(v) !== 0;
    })();
    const businessAllowReviews = (() => {
        if (!bizSettings) return true;
        const v = bizSettings.allow_reviews ?? bizSettings.allowReviews;
        if (v == null) return true;
        if (typeof v === 'boolean') return v;
        return Number(v) !== 0;
    })();
    const businessHoursVisible = (() => {
        if (!bizSettings) return true;
        const v = bizSettings.hours_visibility ?? bizSettings.hoursVisibility;
        if (v == null) return true;
        return String(v).toLowerCase() !== 'hidden';
    })();

    const location = isStatewide
        ? 'Statewide · Alabama'
        : [city, county].filter(Boolean).join(', ');

    const category = getCategoryLabel(categoryKey) || String(biz.category || '').trim();
    const CatIcon = getCategoryIcon(categoryKey);
    const entityConfig = getEntityConfig(entityType);
    const EntIcon = entityConfig.icon;

    const hasSocials = Boolean(facebookUrl || instagramUrl || twitterUrl || linkedinUrl || etsyUrl || website);

    const parsedHours = (() => {
        if (!hours) return null;
        if (typeof hours === 'string') { try { return JSON.parse(hours); } catch { return null; } }
        if (typeof hours === 'object') return hours;
        return null;
    })();
    const hasHours = parsedHours && DAY_ORDER.some((d) => {
        const dh = parsedHours[d];
        return dh && (dh.closed || dh.allDay || dh.open || dh.close);
    });

    const galleryPhotos = bizGalleryLoaded && bizGalleryPhotos.length > 0
        ? bizGalleryPhotos
        : (gallery.length > 0 ? gallery : (coverUrl ? [coverUrl] : []));

    // ── Discover / Spotlight fields ──
    const subtitle = String(biz.subtitle || biz.category || '').trim();
    const badgeText = String(biz.badge_text || biz.badgeText || '').trim();
    const isVerified = Boolean(biz.is_verified || biz.isVerified);

    const rawServices = biz.services_offered_json || biz.servicesOfferedJson || biz.services_offered;
    const servicesOffered = (() => {
        if (Array.isArray(rawServices)) return rawServices.filter(Boolean);
        if (typeof rawServices === 'string') {
            try { const p = JSON.parse(rawServices); return Array.isArray(p) ? p.filter(Boolean) : []; } catch { return []; }
        }
        return [];
    })();

    const rawOwnerInfo = biz.owner_info_json || biz.ownerInfoJson || biz.owner_info;
    const ownerInfo = (() => {
        if (rawOwnerInfo && typeof rawOwnerInfo === 'object' && !Array.isArray(rawOwnerInfo)) return rawOwnerInfo;
        if (typeof rawOwnerInfo === 'string') {
            try { return JSON.parse(rawOwnerInfo) || {}; } catch { return {}; }
        }
        return {};
    })();
    const hasOwnerInfo = Boolean(ownerInfo.name || ownerInfo.avatar_url);
    const additionalOwners = Array.isArray(ownerInfo.additional_owners)
        ? ownerInfo.additional_owners.filter((ao) => ao && (ao.name || ao.avatar_url))
        : [];

    const rawHighlights = biz.highlight_sections_json || biz.highlightSectionsJson || biz.highlight_sections;
    const highlightSections = (() => {
        if (Array.isArray(rawHighlights)) return rawHighlights.filter(Boolean);
        if (typeof rawHighlights === 'string') {
            try { const p = JSON.parse(rawHighlights); return Array.isArray(p) ? p.filter(Boolean) : []; } catch { return []; }
        }
        return [];
    })();

    // ── Category-specific data (Phase 2) ──
    const rawCategoryData = biz.category_data_json || biz.categoryDataJson || biz.category_data;
    const categoryData = (() => {
        if (rawCategoryData && typeof rawCategoryData === 'object' && !Array.isArray(rawCategoryData)) return rawCategoryData;
        if (typeof rawCategoryData === 'string') {
            try { return JSON.parse(rawCategoryData) || {}; } catch { return {}; }
        }
        return {};
    })();

    const catCfg = (categoryKey && CATEGORY_CONFIG[categoryKey]) || DEFAULT_CATEGORY_CONFIG;

    // Determine ownership using the same pattern as BusinessPublicPage:
    // Only treat as "own business" when actively switched to this business account.
    // Being on a personal account that owns this business, or an artist account
    // linked to it, should NOT expose management UI — the user must switch into
    // the business account first. This way they see the normal visitor UI
    // (follow, message, report, etc.) instead of "Edit Profile".
    const bizId = biz?.id || business?.id;
    const isOwnBusiness = Boolean(
        isBA && aBizId && bizId && String(aBizId) === String(bizId)
    );
    // Broader check used to gate destructive actions (hide posts / block).
    // A user who owns or is linked to this business — from any active account —
    // should never be shown the option to block/hide it. This is wider than
    // isOwnBusiness (which is scoped to the active business account) and matches
    // the logic in BusinessDirectoryCard.
    const bizOwnerUserId = Number(
        biz?.owner_user_id || business?.owner_user_id ||
        biz?.submitted_by_user_id || business?.submitted_by_user_id ||
        biz?.user_id || business?.user_id ||
        0
    );
    const isLinkedToBusiness = Boolean(
        isOwnBusiness ||
        (viewerId > 0 && bizOwnerUserId > 0 && Number(viewerId) === bizOwnerUserId)
    );
    const viewerRole = String(acctObj?.role || '').toLowerCase();
    const canManageBusiness = isOwnBusiness && viewerRole === 'owner';

    return (
        <>
            <Box ref={scrollWrapRef} data-biz-detail-scroll sx={{ bgcolor: 'background.paper', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
                {selectedPost ? (
                    <Box sx={{ bgcolor: 'background.paper' }}>
                        {/* Back button */}
                        <Box
                            sx={(t) => ({
                                bgcolor: 'background.paper',
                                borderBottom: '1px solid',
                                borderColor: alpha(t.palette.divider, 0.5),
                                px: 1.5,
                                py: 1,
                            })}
                        >
                            <Button
                                size="small"
                                variant="text"
                                startIcon={<ArrowBackIosNewRoundedIcon sx={{ fontSize: '14px !important' }} />}
                                onClick={() => {
                                    setSelectedPost(null);
                                    setFreshPost(null);
                                    // Restore saved scroll position
                                    requestAnimationFrame(() => {
                                        const wrapper = scrollWrapRef.current;
                                        if (!wrapper) return;
                                        const sp = getScrollParent(wrapper);
                                        if (sp) sp.scrollTop = savedScrollPosRef.current || 0;
                                    });
                                }}
                                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, fontSize: '0.82rem' }}
                            >
                                Back to {name || 'posts'}
                            </Button>
                        </Box>
                        {displayPost && (
                            <Box sx={{ px: 0 }}>
                                <BusinessPostDetailModal
                                    embedded
                                    post={displayPost}
                                    user={user}
                                />
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Box sx={{ bgcolor: 'background.paper' }}>
                        {/* ═══ COVER PHOTO ═══ */}
                        {coverUrl && (
                            <Box sx={{ position: 'relative', width: '100%', height: { xs: 220, sm: 280, md: 320 }, overflow: 'hidden', cursor: 'pointer' }}
                                 onClick={() => {
                                     // Unclaimed: plain lightbox (no comments/likes).
                                     // Claimed: open the photo comments popup (same as BusinessPublicPage).
                                     if (isUnclaimed) {
                                         const allPhotos = [coverUrl, ...gallery.filter((g) => g && g !== coverUrl)];
                                         const captions = photoAttributions.map((a) =>
                                             a && a.displayName ? `Photo by ${a.displayName} via Google Maps` : ''
                                         );
                                         openPanelLightbox(allPhotos, 0, captions);
                                     } else {
                                         openCoverComments();
                                     }
                                 }}>
                                <Box component="img" src={coverUrl} alt="Cover" sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
                                {/* Photo attribution strip (Google ToS) */}
                                {isUnclaimed && photoAttributions[0]?.displayName && (
                                    <Box sx={(t) => ({
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        px: 1.25,
                                        py: 0.5,
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 100%)',
                                        pointerEvents: 'none',
                                    })}>
                                        <Typography sx={{
                                            fontSize: 10,
                                            fontWeight: 500,
                                            color: 'rgba(255,255,255,0.85)',
                                            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                                        }}>
                                            Photo by {photoAttributions[0].displayName} · Google Maps
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        )}

                        {/* ═══ HEADER: LOGO + TITLE + ACTIONS ═══ */}
                        <Box sx={{ px: 2, pt: coverUrl ? 1.5 : 2, pb: 0.5 }}>
                            <Stack direction="row" spacing={1.25} alignItems="flex-start">
                                <Avatar
                                    src={hasValidLogo ? logoUrl : undefined}
                                    onError={() => setAvatarError(true)}
                                    alt={name}
                                    onClick={() => {
                                        if (!hasValidLogo) return;
                                        // Unclaimed: lightbox only (no comments). Claimed: photo comments dialog.
                                        if (isUnclaimed) {
                                            openPanelLightbox([logoUrl, coverUrl, ...gallery].filter(Boolean), 0);
                                        } else {
                                            openAvatarComments();
                                        }
                                    }}
                                    sx={{
                                        width: 64, height: 64, flexShrink: 0,
                                        border: '2px solid', borderColor: (t) => alpha(t.palette.divider, 0.3),
                                        bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                                        color: 'primary.main',
                                        cursor: hasValidLogo ? 'pointer' : 'default',
                                    }}
                                    imgProps={{ referrerPolicy: 'no-referrer' }}
                                >
                                    <StorefrontOutlinedIcon sx={{ fontSize: 28 }} />
                                </Avatar>

                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 950, fontSize: '1.05rem', lineHeight: 1.2, color: 'text.primary', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                        {name || 'Untitled Business'}
                                    </Typography>
                                    {isUnclaimed ? (
                                        <Typography
                                            sx={(t) => ({
                                                fontSize: 10.5,
                                                color: 'text.secondary',
                                                fontWeight: 700,
                                                mt: 0.15,
                                                letterSpacing: '0.06em',
                                                textTransform: 'uppercase',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 0.5,
                                            })}
                                        >
                                            <Box
                                                component="span"
                                                sx={(t) => ({
                                                    display: 'inline-block',
                                                    width: 6,
                                                    height: 6,
                                                    borderRadius: '50%',
                                                    bgcolor: alpha(t.palette.text.secondary, 0.5),
                                                })}
                                            />
                                            Unclaimed Listing
                                        </Typography>
                                    ) : slug && (
                                        <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 600, mt: 0.15 }}>
                                            @{slug}
                                        </Typography>
                                    )}
                                    {subtitle && (
                                        <Typography sx={{ fontSize: 11, color: 'primary.main', fontWeight: 700, mt: 0.15, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                                            {subtitle}
                                        </Typography>
                                    )}
                                    {/* Category & Entity Type chips */}
                                    {(category || entityType) && (
                                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.4, flexWrap: 'wrap', rowGap: 0.4 }}>
                                            {category && (() => {
                                                const ChipCatIcon = CATEGORY_ICON_MAP[categoryKey] || CategoryRoundedIcon;
                                                return (
                                                    <Chip
                                                        icon={<ChipCatIcon sx={{ fontSize: '14px !important' }} />}
                                                        label={category}
                                                        size="small"
                                                        sx={(t) => { const c = t.palette.mode === 'dark' ? t.palette.primary.light : t.palette.primary.main; return { fontSize: 11, fontWeight: 800, height: 24, borderRadius: 999, bgcolor: alpha(t.palette.primary.main, 0.08), color: c, border: '1px solid', borderColor: alpha(t.palette.primary.main, 0.25), '& .MuiChip-label': { px: 0.9, lineHeight: 1 }, '& .MuiChip-icon': { ml: 0.5, color: c } }; }}
                                                    />
                                                );
                                            })()}
                                            {entityType && entityType !== 'business' && (() => {
                                                const ChipEntIcon = ENTITY_ICON_MAP[entityType] || StorefrontRoundedIcon;
                                                return (
                                                    <Chip
                                                        icon={<ChipEntIcon sx={{ fontSize: '13px !important' }} />}
                                                        label={entityConfig.label}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontSize: 10.5, fontWeight: 700, height: 22, borderRadius: 999, '& .MuiChip-icon': { color: 'text.secondary' } }}
                                                    />
                                                );
                                            })()}
                                        </Stack>
                                    )}
                                    {businessAllowReviews && (
                                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                                            <Rating value={rating} precision={0.5} readOnly size="small" />
                                            <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>({reviewCountLocal || reviewCount})</Typography>
                                        </Stack>
                                    )}
                                    {(followerCountProp != null || followingCountProp != null) && (
                                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.35 }}>
                                            {followerCountProp != null && (
                                                <Stack
                                                    direction="row" spacing={0.35} alignItems="baseline"
                                                    onClick={onFollowersClick}
                                                    sx={{ cursor: onFollowersClick ? 'pointer' : 'default', '&:hover .fc-lbl': onFollowersClick ? { textDecoration: 'underline' } : {} }}
                                                >
                                                    <Typography sx={{ fontWeight: 800, fontSize: 12.5, lineHeight: 1 }}>{followerCountProp}</Typography>
                                                    <Typography className="fc-lbl" sx={{ fontWeight: 600, fontSize: 11, color: 'text.secondary', lineHeight: 1 }}>Followers</Typography>
                                                </Stack>
                                            )}
                                            {followingCountProp != null && (
                                                <Stack
                                                    direction="row" spacing={0.35} alignItems="baseline"
                                                    onClick={onFollowingClick}
                                                    sx={{ cursor: onFollowingClick ? 'pointer' : 'default', '&:hover .fc-lbl': onFollowingClick ? { textDecoration: 'underline' } : {} }}
                                                >
                                                    <Typography sx={{ fontWeight: 800, fontSize: 12.5, lineHeight: 1 }}>{followingCountProp}</Typography>
                                                    <Typography className="fc-lbl" sx={{ fontWeight: 600, fontSize: 11, color: 'text.secondary', lineHeight: 1 }}>Following</Typography>
                                                </Stack>
                                            )}
                                        </Stack>
                                    )}
                                </Box>

                                {/* Action buttons */}
                                <Stack direction="row" spacing={0.4} alignItems="center" sx={{ flexShrink: 0, mt: 0.25 }}>
                                    {canManageBusiness ? (
                                        <>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<EditRoundedIcon sx={{ fontSize: '13px !important' }} />}
                                                onClick={() => { if (slug) window.location.assign(`/${slug}/admin`); }}
                                                disabled={!slug}
                                                sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 900, fontSize: '0.72rem', px: 1, py: 0.35, minHeight: 0, minWidth: 0, whiteSpace: 'nowrap', bgcolor: 'background.paper', color: 'primary.main', borderColor: 'primary.main', '&:hover': { borderColor: 'primary.dark', bgcolor: (t) => alpha(t.palette.primary.main, 0.04) } }}
                                            >
                                                Edit Profile
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            {viewerId > 0 && !isOwnBusiness && (
                                                isMobile ? (
                                                    <Tooltip title={isFollowing ? 'Following' : 'Follow'} arrow>
                                                        <IconButton
                                                            size="small"
                                                            onClick={handleFollowToggle}
                                                            disabled={followBusy}
                                                            sx={{
                                                                flexShrink: 0,
                                                                width: 32,
                                                                height: 32,
                                                                border: '1px solid',
                                                                borderColor: isFollowing ? 'primary.main' : (t) => alpha(t.palette.text.primary, 0.2),
                                                                borderRadius: 1.5,
                                                                color: isFollowing ? 'primary.main' : 'text.secondary',
                                                                bgcolor: isFollowing ? (t) => alpha(t.palette.primary.main, 0.06) : 'transparent',
                                                                '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
                                                            }}
                                                        >
                                                            {isFollowing
                                                                ? <HowToRegRoundedIcon sx={{ fontSize: 18 }} />
                                                                : <PersonAddRoundedIcon sx={{ fontSize: 18 }} />}
                                                        </IconButton>
                                                    </Tooltip>
                                                ) : (
                                                    <Button
                                                        size="small"
                                                        variant={isFollowing ? 'outlined' : 'contained'}
                                                        startIcon={isFollowing ? <HowToRegRoundedIcon sx={{ fontSize: '14px !important' }} /> : <PersonAddRoundedIcon sx={{ fontSize: '13px !important' }} />}
                                                        onClick={handleFollowToggle}
                                                        disabled={followBusy}
                                                        sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 900, fontSize: '0.72rem', px: 1, py: 0.35, minHeight: 0, minWidth: 0, whiteSpace: 'nowrap' }}
                                                    >
                                                        {isFollowing ? 'Following' : 'Follow'}
                                                    </Button>
                                                )
                                            )}
                                            <IconButton
                                                size="small"
                                                onClick={(e) => setBizMenuEl(e.currentTarget)}
                                                sx={{ flexShrink: 0, color: 'text.secondary' }}
                                            >
                                                <MoreVertIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                            <SmartMenu
                                                anchorEl={bizMenuEl}
                                                open={bizMenuOpen}
                                                onClose={() => setBizMenuEl(null)}
                                                disableScrollLock
                                                onClick={(e) => e.stopPropagation()}
                                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
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
                                                <MenuItem onClick={handleBizCopyLink} sx={{ py: 1 }}>
                                                    <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
                                                    <ListItemText primary="Copy link" />
                                                </MenuItem>
                                                {!isLinkedToBusiness && (
                                                    <MenuItem onClick={handleBizReportClick} sx={{ py: 1 }}>
                                                        <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                                                        <ListItemText primary="Report" />
                                                    </MenuItem>
                                                )}
                                                {viewerId > 0 && !isLinkedToBusiness && (
                                                    <MenuItem onClick={handleHideBusiness} disabled={hideBusy || blockBusy} sx={{ py: 1 }}>
                                                        <ListItemIcon><VisibilityOffRoundedIcon fontSize="small" /></ListItemIcon>
                                                        <ListItemText primary="Hide posts" />
                                                    </MenuItem>
                                                )}
                                                {viewerId > 0 && !isLinkedToBusiness && (
                                                    <MenuItem onClick={handleBlockBusiness} disabled={hideBusy || blockBusy} sx={{ py: 1, color: 'error.main' }}>
                                                        <ListItemIcon sx={{ color: 'error.main' }}><BlockRoundedIcon fontSize="small" /></ListItemIcon>
                                                        <ListItemText primary="Block" />
                                                    </MenuItem>
                                                )}
                                            </SmartMenu>
                                        </>
                                    )}
                                </Stack>
                            </Stack>

                            {/* Phone & Email */}
                            {(phone || email) && (
                                <Stack spacing={0.25} sx={{ mt: 0.75 }}>
                                    {phone && (
                                        <Stack direction="row" spacing={0.5} alignItems="center" component="a" href={`tel:${phone}`}
                                               sx={{ textDecoration: 'none', cursor: 'pointer', '&:hover .ci-icon': { color: 'secondary.main' }, '&:hover .ci-text': { color: 'secondary.main', textDecoration: 'underline' } }}>
                                            <PhoneRoundedIcon className="ci-icon" sx={{ fontSize: 14, color: 'primary.main', transition: 'color 0.15s' }} />
                                            <Typography className="ci-text" sx={{ fontSize: 12, color: 'text.primary', fontWeight: 700, transition: 'color 0.15s' }}>
                                                {formatPhone(phone)}
                                            </Typography>
                                        </Stack>
                                    )}
                                    {email && (
                                        <Stack direction="row" spacing={0.5} alignItems="center" component="a" href={`mailto:${email}`}
                                               sx={{ textDecoration: 'none', cursor: 'pointer', '&:hover .ci-icon': { color: 'secondary.main' }, '&:hover .ci-text': { color: 'secondary.main', textDecoration: 'underline' } }}>
                                            <EmailRoundedIcon className="ci-icon" sx={{ fontSize: 14, color: 'primary.main', transition: 'color 0.15s' }} />
                                            <Typography className="ci-text" sx={{ fontSize: 12, color: 'text.primary', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.15s' }}>
                                                {email}
                                            </Typography>
                                        </Stack>
                                    )}
                                </Stack>
                            )}

                            {/* Location row — socials appear here when hours hidden (desktop) or always below on mobile */}
                            {(location || address) && (
                                <Box sx={{ mt: phone || email ? 0.25 : 0.75 }}>
                                    <Stack direction="row" alignItems="center">
                                        <Stack
                                            direction="row" spacing={0.5} alignItems="center" sx={{ flex: 1, minWidth: 0, cursor: hasMapPin && onLocationClick ? 'pointer' : 'default', '&:hover .loc-text': { color: 'secondary.main' }, '&:hover .loc-icon': { color: 'secondary.main' } }}
                                            onClick={hasMapPin && onLocationClick ? () => onLocationClick(business) : undefined}
                                        >
                                            {isStatewide ? <PublicRoundedIcon className="loc-icon" sx={{ fontSize: 14, color: 'primary.main', transition: 'color 0.15s' }} /> : <LocationOnIcon className="loc-icon" sx={{ fontSize: 14, color: 'primary.main', transition: 'color 0.15s' }} />}
                                            <Typography className="loc-text" sx={{ fontSize: 12, color: 'primary.main', fontWeight: 700, lineHeight: 1.2, transition: 'color 0.15s' }}>
                                                {isStatewide ? 'Statewide · Alabama' : [address, city, county].filter(Boolean).join(', ')}
                                            </Typography>
                                        </Stack>
                                        {/* Desktop: socials inline when hours hidden */}
                                        {!isMobile && !(businessHoursVisible && hasHours && parsedHours) && hasSocials && (
                                            <Stack direction="row" spacing={0.4} alignItems="center" sx={{ flexShrink: 0 }}>
                                                {website && (<Tooltip title={`Visit ${formatWebsite(website)}`} arrow><IconButton component="a" href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" size="small" sx={(t) => ({ width: 26, height: 26, p: 0, color: t.palette.mode === 'dark' ? t.palette.text.primary : t.palette.text.secondary, '&:hover': { color: 'primary.main' } })}><LanguageRoundedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>)}
                                                {facebookUrl && (<Tooltip title="Facebook" arrow><IconButton component="a" href={buildSocialUrl(facebookUrl, 'facebook')} target="_blank" rel="noopener noreferrer" size="small" sx={{ width: 26, height: 26, p: 0 }}><FacebookIcon sx={{ fontSize: 17, color: (t) => t.custom?.social?.facebook || '#1877F2' }} /></IconButton></Tooltip>)}
                                                {instagramUrl && (<Tooltip title="Instagram" arrow><IconButton component="a" href={buildSocialUrl(instagramUrl, 'instagram')} target="_blank" rel="noopener noreferrer" size="small" sx={{ width: 26, height: 26, p: 0 }}><InstagramIcon sx={{ fontSize: 17, color: (t) => t.custom?.social?.instagram || '#E4405F' }} /></IconButton></Tooltip>)}
                                                {twitterUrl && (<Tooltip title="X (Twitter)" arrow><IconButton component="a" href={buildSocialUrl(twitterUrl, 'twitter')} target="_blank" rel="noopener noreferrer" size="small" sx={{ width: 26, height: 26, p: 0 }}><XIcon sx={{ fontSize: 15, color: 'text.primary' }} /></IconButton></Tooltip>)}
                                                {linkedinUrl && (<Tooltip title="LinkedIn" arrow><IconButton component="a" href={buildSocialUrl(linkedinUrl, 'linkedin')} target="_blank" rel="noopener noreferrer" size="small" sx={{ width: 26, height: 26, p: 0 }}><LinkedInIcon sx={(t) => ({ fontSize: 17, color: t.palette.mode === 'dark' ? '#5A9BD5' : '#0A66C2' })} /></IconButton></Tooltip>)}
                                                {etsyUrl && (<Tooltip title="Etsy Shop" arrow><IconButton component="a" href={buildSocialUrl(etsyUrl, 'etsy')} target="_blank" rel="noopener noreferrer" size="small" sx={{ width: 26, height: 26, p: 0 }}><StorefrontRoundedIcon sx={{ fontSize: 17, color: '#F1641E' }} /></IconButton></Tooltip>)}
                                            </Stack>
                                        )}
                                    </Stack>
                                    {/* Mobile: socials right-aligned under address */}
                                    {isMobile && hasSocials && (
                                        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end" sx={{ mt: 0.5 }}>
                                            {website && (<IconButton component="a" href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" size="small" sx={(t) => ({ width: 28, height: 28, p: 0, color: t.palette.mode === 'dark' ? t.palette.text.primary : t.palette.text.secondary })}><LanguageRoundedIcon sx={{ fontSize: 18 }} /></IconButton>)}
                                            {facebookUrl && (<IconButton component="a" href={buildSocialUrl(facebookUrl, 'facebook')} target="_blank" rel="noopener noreferrer" size="small" sx={{ width: 28, height: 28, p: 0 }}><FacebookIcon sx={{ fontSize: 18, color: (t) => t.custom?.social?.facebook || '#1877F2' }} /></IconButton>)}
                                            {instagramUrl && (<IconButton component="a" href={buildSocialUrl(instagramUrl, 'instagram')} target="_blank" rel="noopener noreferrer" size="small" sx={{ width: 28, height: 28, p: 0 }}><InstagramIcon sx={{ fontSize: 18, color: (t) => t.custom?.social?.instagram || '#E4405F' }} /></IconButton>)}
                                            {twitterUrl && (<IconButton component="a" href={buildSocialUrl(twitterUrl, 'twitter')} target="_blank" rel="noopener noreferrer" size="small" sx={{ width: 28, height: 28, p: 0 }}><XIcon sx={{ fontSize: 16, color: 'text.primary' }} /></IconButton>)}
                                            {linkedinUrl && (<IconButton component="a" href={buildSocialUrl(linkedinUrl, 'linkedin')} target="_blank" rel="noopener noreferrer" size="small" sx={{ width: 28, height: 28, p: 0 }}><LinkedInIcon sx={(t) => ({ fontSize: 18, color: t.palette.mode === 'dark' ? '#5A9BD5' : '#0A66C2' })} /></IconButton>)}
                                            {etsyUrl && (<IconButton component="a" href={buildSocialUrl(etsyUrl, 'etsy')} target="_blank" rel="noopener noreferrer" size="small" sx={{ width: 28, height: 28, p: 0 }}><StorefrontRoundedIcon sx={{ fontSize: 18, color: '#F1641E' }} /></IconButton>)}
                                        </Stack>
                                    )}
                                </Box>
                            )}

                            {/* Hours row — only shown when hours are visible; socials appear here in this case */}
                            {businessHoursVisible && hasHours && parsedHours && (
                                <Stack direction="row" alignItems="center" sx={{ mt: 0.5 }}>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        {(() => {
                                            const now = new Date();
                                            const todayIdx = now.getDay();
                                            const DAY_ORD = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                                            const DAY_DISP = { sunday: 'Sun', monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat' };
                                            const todayKey = DAY_ORD[todayIdx];
                                            const todayData = parsedHours[todayKey];

                                            let statusLabel = 'Closed';
                                            let statusColor = 'error.main';
                                            let detailLabel = '';

                                            if (todayData) {
                                                if (todayData.allDay) {
                                                    statusLabel = 'Open';
                                                    statusColor = 'success.main';
                                                    detailLabel = '24 hours today';
                                                } else if (!todayData.closed && todayData.open && todayData.close) {
                                                    const nowMins = now.getHours() * 60 + now.getMinutes();
                                                    const [oh, om] = (todayData.open || '0:0').split(':').map(Number);
                                                    const [ch, cm] = (todayData.close || '0:0').split(':').map(Number);
                                                    const openMins = oh * 60 + (om || 0);
                                                    const closeMins = ch * 60 + (cm || 0);
                                                    if (closeMins > openMins) {
                                                        if (nowMins >= openMins && nowMins < closeMins) {
                                                            statusLabel = 'Open'; statusColor = 'success.main';
                                                            detailLabel = `Closes ${formatTo12Hr(todayData.close)}`;
                                                        } else {
                                                            statusLabel = 'Closed'; statusColor = 'error.main';
                                                            detailLabel = nowMins < openMins ? `Opens ${formatTo12Hr(todayData.open)}` : '';
                                                        }
                                                    } else {
                                                        if (nowMins >= openMins || nowMins < closeMins) {
                                                            statusLabel = 'Open'; statusColor = 'success.main';
                                                            detailLabel = `Closes ${formatTo12Hr(todayData.close)}`;
                                                        } else {
                                                            statusLabel = 'Closed'; statusColor = 'error.main';
                                                            detailLabel = `Opens ${formatTo12Hr(todayData.open)}`;
                                                        }
                                                    }
                                                } else {
                                                    statusLabel = 'Closed'; statusColor = 'error.main';
                                                    for (let i = 1; i <= 7; i++) {
                                                        const nextIdx = (todayIdx + i) % 7;
                                                        const nextKey = DAY_ORD[nextIdx];
                                                        const nextData = parsedHours[nextKey];
                                                        if (nextData && !nextData.closed && (nextData.allDay || (nextData.open && nextData.close))) {
                                                            detailLabel = `Opens ${DAY_DISP[nextKey]}${nextData.allDay ? '' : ` ${formatTo12Hr(nextData.open)}`}`;
                                                            break;
                                                        }
                                                    }
                                                }
                                            } else {
                                                for (let i = 1; i <= 7; i++) {
                                                    const nextIdx = (todayIdx + i) % 7;
                                                    const nextKey = DAY_ORD[nextIdx];
                                                    const nextData = parsedHours[nextKey];
                                                    if (nextData && !nextData.closed && (nextData.allDay || (nextData.open && nextData.close))) {
                                                        detailLabel = `Opens ${DAY_DISP[nextKey]}${nextData.allDay ? '' : ` ${formatTo12Hr(nextData.open)}`}`;
                                                        break;
                                                    }
                                                }
                                            }

                                            return (
                                                <Stack
                                                    direction="row" spacing={0.5} alignItems="center"
                                                    onClick={() => setHoursExpanded((v) => !v)}
                                                    sx={{ cursor: 'pointer', py: 0.25, userSelect: 'none', '&:hover': { opacity: 0.8 } }}
                                                >
                                                    <AccessTimeRoundedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                                                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: statusColor }}>{statusLabel}</Typography>
                                                    {detailLabel && (
                                                        <>
                                                            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 500 }}>&middot;</Typography>
                                                            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>{detailLabel}</Typography>
                                                        </>
                                                    )}
                                                    <ExpandMoreRoundedIcon sx={{ fontSize: 16, color: 'text.secondary', transition: 'transform 0.2s', transform: hoursExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                                                </Stack>
                                            );
                                        })()}
                                    </Box>

                                    {/* Social icons on the hours row when hours are visible — desktop only */}
                                    {!isMobile && hasSocials && (
                                        <Stack direction="row" spacing={0.4} alignItems="center" sx={{ flexShrink: 0 }}>
                                            {website && (
                                                <Tooltip title={`Visit ${formatWebsite(website)}`} arrow>
                                                    <IconButton component="a" href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" size="small" sx={(t) => ({ width: 26, height: 26, p: 0, color: t.palette.mode === 'dark' ? t.palette.text.primary : t.palette.text.secondary, '&:hover': { color: 'primary.main' } })}>
                                                        <LanguageRoundedIcon sx={{ fontSize: 17 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {facebookUrl && (
                                                <Tooltip title="Facebook" arrow>
                                                    <IconButton component="a" href={buildSocialUrl(facebookUrl, 'facebook')} target="_blank" rel="noopener noreferrer" size="small" sx={{ width: 26, height: 26, p: 0 }}>
                                                        <FacebookIcon sx={{ fontSize: 17, color: (t) => t.custom?.social?.facebook || '#1877F2' }} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {instagramUrl && (
                                                <Tooltip title="Instagram" arrow>
                                                    <IconButton component="a" href={buildSocialUrl(instagramUrl, 'instagram')} target="_blank" rel="noopener noreferrer" size="small" sx={{ width: 26, height: 26, p: 0 }}>
                                                        <InstagramIcon sx={{ fontSize: 17, color: (t) => t.custom?.social?.instagram || '#E4405F' }} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {twitterUrl && (
                                                <Tooltip title="X (Twitter)" arrow>
                                                    <IconButton component="a" href={buildSocialUrl(twitterUrl, 'twitter')} target="_blank" rel="noopener noreferrer" size="small" sx={{ width: 26, height: 26, p: 0 }}>
                                                        <XIcon sx={{ fontSize: 15, color: 'text.primary' }} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {linkedinUrl && (
                                                <Tooltip title="LinkedIn" arrow>
                                                    <IconButton component="a" href={buildSocialUrl(linkedinUrl, 'linkedin')} target="_blank" rel="noopener noreferrer" size="small" sx={{ width: 26, height: 26, p: 0 }}>
                                                        <LinkedInIcon sx={(t) => ({ fontSize: 17, color: t.palette.mode === 'dark' ? '#5A9BD5' : '#0A66C2' })} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {etsyUrl && (
                                                <Tooltip title="Etsy Shop" arrow>
                                                    <IconButton component="a" href={buildSocialUrl(etsyUrl, 'etsy')} target="_blank" rel="noopener noreferrer" size="small" sx={{ width: 26, height: 26, p: 0 }}>
                                                        <StorefrontRoundedIcon sx={{ fontSize: 17, color: '#F1641E' }} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Stack>
                                    )}
                                </Stack>
                            )}

                            {/* Expandable hours table */}
                            {businessHoursVisible && hasHours && parsedHours && (
                                <Collapse in={hoursExpanded}>
                                    {(() => {
                                        const now = new Date();
                                        const todayIdx = now.getDay();
                                        const DAY_ORD = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                                        const DAY_DISP = { sunday: 'Sun', monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat' };
                                        const todayKey = DAY_ORD[todayIdx];
                                        return (
                                            <Box sx={(t) => ({ mt: 0.75, bgcolor: alpha(t.palette.primary.main, 0.03), border: '1px solid', borderColor: alpha(t.palette.primary.main, 0.1), borderRadius: 2, px: 1.5, py: 0.75 })}>
                                                <Stack spacing={0}>
                                                    {DAY_ORD.map((day) => {
                                                        const dh = parsedHours[day];
                                                        const isToday = day === todayKey;
                                                        let label = '\u2013';
                                                        if (dh) {
                                                            if (dh.closed) label = '\u2013';
                                                            else if (dh.allDay) label = '24 hours today';
                                                            else if (dh.open && dh.close) label = `${formatTo12Hr(dh.open)} \u2013 ${formatTo12Hr(dh.close)}`;
                                                        }
                                                        const isOpen = dh && (dh.allDay || (!dh.closed && dh.open && dh.close));
                                                        return (
                                                            <Stack key={day} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5, borderBottom: '1px solid', borderColor: 'divider', '&:last-of-type': { borderBottom: 'none' } }}>
                                                                <Stack direction="row" spacing={0.75} alignItems="center">
                                                                    <Typography sx={{ fontSize: 12, fontWeight: isToday ? 900 : 600, color: isToday ? 'text.primary' : 'text.secondary', minWidth: 28 }}>{DAY_DISP[day]}</Typography>
                                                                    {isToday && <Chip label="Today" size="small" sx={{ fontSize: 9, fontWeight: 800, height: 18, bgcolor: 'success.main', color: '#fff', borderRadius: 999 }} />}
                                                                </Stack>
                                                                <Typography sx={{ fontSize: 12, fontWeight: isToday ? 800 : 600, color: isToday && isOpen ? 'success.main' : 'text.secondary' }}>{label}</Typography>
                                                            </Stack>
                                                        );
                                                    })}
                                                </Stack>
                                                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                                                    <AccessTimeRoundedIcon sx={{ fontSize: 10, color: 'text.disabled' }} />
                                                    <Typography sx={{ fontSize: 10, color: 'text.disabled', fontWeight: 500 }}>Hours may vary on holidays</Typography>
                                                </Stack>
                                            </Box>
                                        );
                                    })()}
                                </Collapse>
                            )}
                        </Box>

                        {/* ─── Full-width action buttons ─── */}
                        <Divider sx={{ mt: 1.5 }} />
                        {isUnclaimed && (
                            <>
                                <Stack direction="row" spacing={0.75} sx={{ px: 2, pt: 1.25, pb: 1 }}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        startIcon={<StorefrontRoundedIcon sx={{ fontSize: '18px !important' }} />}
                                        onClick={() => {
                                            // Future: route to claim flow. For now, a placeholder alert.
                                            // TODO: navigate(`/claim/${biz.id}`) once the claim flow is built.
                                            const claimUrl = `/claim-business/${encodeURIComponent(biz.id || '')}`;
                                            if (typeof navigate === 'function') navigate(claimUrl);
                                        }}
                                        sx={(t) => ({
                                            borderRadius: 999,
                                            textTransform: 'none',
                                            fontWeight: 900,
                                            fontSize: '0.85rem',
                                            py: 0.9,
                                            minHeight: 40,
                                            background: `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.primary.dark} 100%)`,
                                            boxShadow: `0 4px 12px ${alpha(t.palette.primary.main, 0.3)}`,
                                            '&:hover': {
                                                background: `linear-gradient(135deg, ${t.palette.primary.dark} 0%, ${t.palette.primary.main} 100%)`,
                                                boxShadow: `0 6px 18px ${alpha(t.palette.primary.main, 0.4)}`,
                                            },
                                        })}
                                    >
                                        Claim This Business
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<ShareIcon sx={{ fontSize: '16px !important' }} />}
                                        onClick={() => setShareDialogOpen(true)}
                                        sx={{
                                            borderRadius: 999,
                                            textTransform: 'none',
                                            fontWeight: 900,
                                            fontSize: '0.8rem',
                                            py: 0.75,
                                            minHeight: 40,
                                            minWidth: 100,
                                            borderColor: 'divider',
                                            color: 'text.primary',
                                            '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
                                        }}
                                    >
                                        Share
                                    </Button>
                                </Stack>
                                <Box sx={{ px: 2, pb: 1 }}>
                                    <DataSourceAttribution
                                        dataSource={biz.data_source}
                                        sourceId={biz.source_id}
                                        variant="detail"
                                    />
                                </Box>
                            </>
                        )}
                        {!isUnclaimed && !isOwnBusiness && (
                            <Stack direction="row" spacing={0.75} sx={{ px: 2, pt: 1.25, pb: 1 }}>
                                {businessAllowMessages && (
                                    <Button variant="contained" fullWidth startIcon={<MailOutlineRoundedIcon sx={{ fontSize: '16px !important' }} />} onClick={() => setQuickMsgOpen(true)}
                                            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, fontSize: '0.8rem', py: 0.75, minHeight: 36 }}>
                                        Message
                                    </Button>
                                )}
                                {!isMobile && slug && (
                                    <Button variant="outlined" fullWidth startIcon={<OpenInNewRoundedIcon sx={{ fontSize: '16px !important' }} />} onClick={() => navigate(`/${encodeURIComponent(slug)}`)}
                                            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, fontSize: '0.8rem', py: 0.75, minHeight: 36, borderColor: 'divider', color: 'text.primary', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}>
                                        View Profile
                                    </Button>
                                )}
                                <Button variant="outlined" fullWidth startIcon={<ShareIcon sx={{ fontSize: '16px !important' }} />} onClick={() => setShareDialogOpen(true)}
                                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, fontSize: '0.8rem', py: 0.75, minHeight: 36, borderColor: 'divider', color: 'text.primary', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}>
                                    Share
                                </Button>
                            </Stack>
                        )}
                        {!isUnclaimed && isOwnBusiness && (
                            <Stack direction="row" spacing={0.75} sx={{ px: 2, pt: 1.25, pb: 1 }}>
                                {!isMobile && (
                                    <Button variant="outlined" fullWidth startIcon={<OpenInNewRoundedIcon sx={{ fontSize: '16px !important' }} />} onClick={() => navigate(`/${encodeURIComponent(slug)}`)}
                                            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, fontSize: '0.8rem', py: 0.75, minHeight: 36, borderColor: 'divider', color: 'text.primary', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}>
                                        View Profile
                                    </Button>
                                )}
                                <Button variant="outlined" fullWidth startIcon={<ShareIcon sx={{ fontSize: '16px !important' }} />} onClick={() => setShareDialogOpen(true)}
                                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, fontSize: '0.8rem', py: 0.75, minHeight: 36, borderColor: 'divider', color: 'text.primary', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}>
                                    Share
                                </Button>
                            </Stack>
                        )}

                        {/* ─── Sticky Tabs Container ─── */}
                        <Box
                            sx={{
                                position: 'sticky',
                                top: 0,
                                zIndex: 10,
                                bgcolor: 'background.paper',
                                pt: 0,
                                pb: 0,
                            }}
                        >
                            <Tabs
                                value={activeTab}
                                onChange={(_e, v) => {
                                    // On mobile, tab 1 is Activity which opens a dialog — don't switch tab
                                    if (isMobile && v === 1) return;
                                    setActiveTab(v);
                                }}
                                variant="fullWidth"
                                sx={(t) => ({
                                    minHeight: { xs: 44, md: 38 },
                                    flexShrink: 0,
                                    borderRadius: 0,
                                    padding: 0,
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    boxShadow: 'none',
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    px: 1,
                                    '& .MuiTabs-indicator': {
                                        height: 3,
                                        borderRadius: '3px 3px 0 0',
                                        backgroundColor: t.palette.text.primary,
                                    },
                                    '& .MuiTab-root': {
                                        minHeight: 44,
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        fontSize: '0.72rem',
                                        letterSpacing: '-0.01em',
                                        py: { xs: 0.75, md: 0 },
                                        px: 1,
                                        minWidth: 0,
                                        borderRadius: 0,
                                        color: alpha(t.palette.text.primary, 0.55),
                                        '&.Mui-selected': { color: t.palette.text.primary },
                                        '& .MuiSvgIcon-root': { color: alpha(t.palette.text.primary, 0.5) },
                                        '&.Mui-selected .MuiSvgIcon-root': { color: t.palette.text.primary },
                                    },
                                })}
                            >
                                <Tab label={<Stack direction="column" alignItems="center" spacing={0.25}><StorefrontOutlinedIcon sx={{ fontSize: 20 }} /><span>About</span></Stack>} value={0} />
                                {!isUnclaimed && isMobile && (
                                    <Tab label={<Stack direction="column" alignItems="center" spacing={0.25}><DynamicFeedRoundedIcon sx={{ fontSize: 20 }} /><span>Activity</span></Stack>} value={1} onClick={(e) => { e.preventDefault(); setActivityOpen(true); }} />
                                )}
                                {!isUnclaimed && !isMobile && (
                                    <Tab icon={<ArticleRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={`Posts${postCount > 0 ? ` (${formatCount(postCount)})` : ''}`} value={1} />
                                )}
                                <Tab label={<Stack direction="column" alignItems="center" spacing={0.25}><PhotoLibraryRoundedIcon sx={{ fontSize: 20 }} /><span>{`Photos${galleryPhotos.length > 0 ? ` (${galleryPhotos.length})` : ''}`}</span></Stack>} value={2} />
                                {businessAllowReviews && (
                                    <Tab label={<Stack direction="column" alignItems="center" spacing={0.25}><ReviewsRoundedIcon sx={{ fontSize: 20 }} /><span>Reviews</span></Stack>} value={3} />
                                )}
                            </Tabs>

                            {activeTab === 1 && !isMobile && (
                                <Box sx={{ px: { xs: 1.5, sm: 2 }, pt: 1.5, pb: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        alignItems="center"
                                    >
                                        <FormControl size="small" sx={{ minWidth: 0, flex: 1 }}>
                                            <InputLabel>Type</InputLabel>
                                            <Select value={postFilterType} label="Type" onChange={(e) => setPostFilterType(e.target.value)} sx={{ fontSize: '0.78rem' }}>
                                                {POST_TYPE_FILTERS.map((opt) => (
                                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <FormControl size="small" sx={{ minWidth: 0, flex: 1 }}>
                                            <InputLabel>Sort By</InputLabel>
                                            <Select value={postSortBy} label="Sort By" onChange={(e) => setPostSortBy(e.target.value)} sx={{ fontSize: '0.78rem' }}>
                                                {SORT_OPTIONS.map((opt) => (
                                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <FormControl size="small" sx={{ minWidth: 0, flex: 1 }}>
                                            <InputLabel>Date Range</InputLabel>
                                            <Select value={postDateRange} label="Date Range" onChange={(e) => setPostDateRange(e.target.value)} sx={{ fontSize: '0.78rem' }}>
                                                {DATE_RANGE_OPTIONS.map((opt) => (
                                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        {(postFilterType !== 'all' || postSortBy !== 'newest' || postDateRange !== 'all') && (
                                            <Tooltip title="Clear filters">
                                                <IconButton size="small" onClick={() => { setPostFilterType('all'); setPostSortBy('newest'); setPostDateRange('all'); }} sx={{ width: 30, height: 30, flexShrink: 0 }}>
                                                    <RefreshIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Stack>
                                </Box>
                            )}
                        </Box>

                        {/* ─── Tab Content ─── */}
                        <Box sx={{ px: { xs: 1.5, sm: 2 }, py: 1.75 }}>
                            {loadingDetail ? (
                                <Box>
                                    <Skeleton height={14} width="100%" />
                                    <Skeleton height={14} width="90%" sx={{ mt: 0.5 }} />
                                    <Skeleton height={14} width="75%" sx={{ mt: 0.5 }} />
                                    <Skeleton height={14} width="60%" sx={{ mt: 0.5 }} />
                                </Box>
                            ) : (
                                <>
                                    {/* ABOUT TAB — Discover-style layout */}
                                    {activeTab === 0 && (
                                        <Box>

                                            {/* ═══ ABOUT — description ═══ */}
                                            {description ? (
                                                <Box>
                                                    <SectionHeading>About {name || ''}</SectionHeading>
                                                    <Box>
                                                        <Box sx={{ position: 'relative' }}>
                                                            <Box sx={{ maxHeight: descExpanded ? 'none' : DESC_MAX_HEIGHT, overflowY: descExpanded ? 'visible' : 'hidden', position: 'relative' }}>
                                                                <Typography sx={{ fontSize: 12.5, lineHeight: 1.65, color: 'text.secondary', fontWeight: 500, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                                                    {description}
                                                                </Typography>
                                                            </Box>
                                                            {!descExpanded && description.length > 200 && (
                                                                <Box sx={(t) => ({ position: 'absolute', bottom: 0, left: 0, right: 0, height: 64, background: `linear-gradient(to bottom, ${alpha(t.palette.background.paper, 0)} 0%, ${t.palette.background.paper} 85%)`, pointerEvents: 'none' })} />
                                                            )}
                                                            {description.length > 200 && (
                                                                <Button size="small" onClick={() => setDescExpanded((prev) => !prev)} sx={{ mt: descExpanded ? 0.5 : -0.25, position: 'relative', zIndex: 2, textTransform: 'none', fontWeight: 850, fontSize: '0.78rem', px: 0, minWidth: 0, color: 'primary.main', '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}>
                                                                    {descExpanded ? 'Read less' : 'Read more'}
                                                                </Button>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            ) : null}

                                            {/* ═══ MEET THE OWNERS ═══ */}
                                            {hasOwnerInfo && (
                                                <>
                                                    {description && <Divider sx={{ my: 2 }} />}
                                                    <SectionHeading icon={PersonIcon}>{ownerInfo.section_title || (additionalOwners.length > 0 ? 'Meet the Owners' : 'Meet the Owner')}</SectionHeading>
                                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                                        <Avatar src={ownerInfo.avatar_url || undefined} alt={ownerInfo.name || 'Owner'} sx={{ width: 90, height: 90, borderRadius: 2.5, border: '2px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.12), boxShadow: (t) => `0 2px 12px ${alpha(t.palette.common.black, 0.08)}` }} imgProps={{ referrerPolicy: 'no-referrer' }}>
                                                            <PersonIcon sx={{ fontSize: 28, color: 'text.disabled' }} />
                                                        </Avatar>
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Typography sx={{ fontWeight: 900, fontSize: 13.5, lineHeight: 1.2 }}>{ownerInfo.name}</Typography>
                                                            {ownerInfo.title && <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: 'text.secondary', mt: 0.15 }}>{ownerInfo.title}</Typography>}
                                                        </Box>
                                                    </Stack>
                                                    {ownerInfo.about && <Typography sx={{ fontSize: 12, lineHeight: 1.6, color: 'text.secondary', mt: 1, fontWeight: 500 }}>{ownerInfo.about}</Typography>}
                                                    {additionalOwners.map((ao, aoIdx) => (
                                                        <Fragment key={aoIdx}>
                                                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.5 }}>
                                                                <Avatar src={ao.avatar_url || undefined} alt={ao.name || 'Team'} sx={{ width: 48, height: 48, borderRadius: 2, border: '2px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.10) }} imgProps={{ referrerPolicy: 'no-referrer' }}>
                                                                    <PersonIcon sx={{ fontSize: 22, color: 'text.disabled' }} />
                                                                </Avatar>
                                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                    <Typography sx={{ fontWeight: 900, fontSize: 13, lineHeight: 1.2 }}>{ao.name}</Typography>
                                                                    {ao.title && <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: 'text.secondary', mt: 0.15 }}>{ao.title}</Typography>}
                                                                </Box>
                                                            </Stack>
                                                            {ao.about && <Typography sx={{ fontSize: 12, lineHeight: 1.6, color: 'text.secondary', mt: 0.75, fontWeight: 500 }}>{ao.about}</Typography>}
                                                        </Fragment>
                                                    ))}
                                                </>
                                            )}

                                            {/* ═══ HIGHLIGHT SECTIONS ═══ */}
                                            {highlightSections.length > 0 && (
                                                <>
                                                    <Divider sx={{ my: 2 }} />
                                                    {highlightSections.map((sec, idx) => (
                                                        <Box key={idx} sx={{ mb: 1.5 }}>
                                                            <Box sx={(t) => ({ borderRadius: 2.5, overflow: 'hidden', border: `1px solid ${alpha(t.palette.primary.main, 0.15)}`, bgcolor: alpha(t.palette.primary.main, 0.03) })}>
                                                                {sec.title && (
                                                                    <Box sx={(t) => ({ px: 1.5, py: 0.65, bgcolor: alpha(t.palette.primary.main, 0.07), borderBottom: `1px solid ${alpha(t.palette.primary.main, 0.12)}`, display: 'flex', alignItems: 'center', gap: 0.75 })}>
                                                                        <HlIconRender name={sec.icon} sx={{ fontSize: 15, color: 'primary.main' }} />
                                                                        <Typography sx={{ fontWeight: 900, fontSize: 11, color: 'primary.dark', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{sec.title}</Typography>
                                                                    </Box>
                                                                )}
                                                                {(sec.photo_url || sec.body) && (
                                                                    <Box>
                                                                        {sec.photo_url && <Box component="img" src={sec.photo_url} alt={sec.title || 'Highlight'} referrerPolicy="no-referrer" onClick={() => setPhotoPreviewSrc(sec.photo_url)} sx={{ width: '100%', height: 'auto', maxHeight: 319, objectFit: 'cover', display: 'block', cursor: 'pointer', transition: 'opacity 0.15s', '&:hover': { opacity: 0.85 } }} />}
                                                                        {sec.body && <Box sx={{ px: 1.5, py: 1.25 }}><Typography sx={{ fontSize: 12, lineHeight: 1.55, color: 'text.secondary', fontWeight: 500 }}>{sec.body}</Typography></Box>}
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                        </Box>
                                                    ))}
                                                </>
                                            )}

                                            {/* ═══ COMBINED SERVICES & PRICING ═══ */}
                                            {(() => {
                                                const cd = categoryData || {};
                                                const hasPrice = cd.price_range;
                                                const extraFields = (catCfg.extraFields || []).filter((f) => {
                                                    const val = cd[f.key];
                                                    if (Array.isArray(val)) return val.length > 0;
                                                    return Boolean(val);
                                                });
                                                const hasCategoryDetails = hasPrice || extraFields.length > 0;

                                                const builderCfg = catCfg.builder;
                                                const isServiceMenu = builderCfg && builderCfg.type === 'service_menu';
                                                const svcMenuItems = isServiceMenu ? (Array.isArray(cd[builderCfg.dataKey]) ? cd[builderCfg.dataKey] : []).filter((it) => it && it.name) : [];

                                                const hasAnything = servicesOffered.length > 0 || hasCategoryDetails || svcMenuItems.length > 0;
                                                if (!hasAnything) return null;

                                                const labelSx = { fontSize: 10.5, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.4 };
                                                const SVC_LIMIT = 3;
                                                const visibleSvc = builderExpanded ? svcMenuItems : svcMenuItems.slice(0, SVC_LIMIT);
                                                const hasMoreSvc = svcMenuItems.length > SVC_LIMIT;
                                                const hasPricingData = hasPrice || svcMenuItems.some((it) => it.price);
                                                const servicesHeading = hasPricingData ? (catCfg.servicesLabel || 'Services & Pricing') : 'Services';

                                                return (
                                                    <>
                                                        <Divider sx={{ my: 2 }} />
                                                        <SectionHeading icon={CatIcon}>{servicesHeading}</SectionHeading>

                                                        {/* Service chips */}
                                                        {servicesOffered.length > 0 && (
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: hasCategoryDetails || svcMenuItems.length > 0 ? 1.5 : 0 }}>
                                                                {servicesOffered.map((svc) => (
                                                                    <Chip key={svc} label={svc} size="small" variant="outlined" sx={{ fontSize: 11, fontWeight: 700, height: 24, borderRadius: 999 }} />
                                                                ))}
                                                            </Box>
                                                        )}

                                                        {/* Category details */}
                                                        {hasCategoryDetails && (
                                                            <Stack spacing={1.5} sx={{ mb: svcMenuItems.length > 0 ? 1.5 : 0 }}>
                                                                {hasPrice && (
                                                                    <Box>
                                                                        <Typography sx={labelSx}>Price Range</Typography>
                                                                        <Chip
                                                                            label={`${cd.price_range} · ${cd.price_range === '$' ? 'Budget-friendly' : cd.price_range === '$$' ? 'Moderate' : cd.price_range === '$$$' ? 'Upscale' : 'Premium'}`}
                                                                            size="small"
                                                                            sx={(t) => ({ fontWeight: 700, fontSize: 11, height: 26, bgcolor: alpha(t.palette.primary.main, 0.08), color: 'primary.dark', borderRadius: 999 })}
                                                                        />
                                                                    </Box>
                                                                )}
                                                                {extraFields.map((f) => {
                                                                    const val = cd[f.key];
                                                                    if (f.type === 'toggle') return null;
                                                                    if (f.type === 'multiselect' && Array.isArray(val)) {
                                                                        return (
                                                                            <Box key={f.key}>
                                                                                <Typography sx={labelSx}>{f.label}</Typography>
                                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                                    {val.map((v) => <Chip key={v} label={v} size="small" variant="outlined" sx={{ fontSize: 10, fontWeight: 600, height: 22, borderRadius: 999 }} />)}
                                                                                </Box>
                                                                            </Box>
                                                                        );
                                                                    }
                                                                    if (f.type === 'select' || f.type === 'text') {
                                                                        return (
                                                                            <Box key={f.key}>
                                                                                <Typography sx={labelSx}>{f.label}</Typography>
                                                                                <Typography sx={{ fontSize: 12, color: 'text.primary', fontWeight: 700 }}>{val}</Typography>
                                                                            </Box>
                                                                        );
                                                                    }
                                                                    return null;
                                                                })}
                                                                {(() => {
                                                                    const toggles = extraFields.filter((f) => f.type === 'toggle' && cd[f.key]);
                                                                    if (toggles.length === 0) return null;
                                                                    return (
                                                                        <Stack spacing={0}>
                                                                            {toggles.map((f) => (
                                                                                <Stack key={f.key} direction="row" alignItems="center" spacing={0.75} sx={{ py: 0.35 }}>
                                                                                    <CheckCircleRoundedIcon sx={{ fontSize: 18, color: 'success.main' }} />
                                                                                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.primary' }}>{f.label}</Typography>
                                                                                </Stack>
                                                                            ))}
                                                                        </Stack>
                                                                    );
                                                                })()}
                                                            </Stack>
                                                        )}

                                                        {/* Inline service_menu builder items */}
                                                        {svcMenuItems.length > 0 && (
                                                            <>
                                                                <Stack spacing={1.25}>
                                                                    {visibleSvc.map((item, idx) => (
                                                                        <Box key={idx} sx={(t) => ({ borderRadius: 2.5, overflow: 'hidden', border: `1px solid ${alpha(t.palette.primary.main, 0.15)}`, bgcolor: alpha(t.palette.primary.main, 0.03) })}>
                                                                            {item.photo_url && <Box component="img" src={item.photo_url} alt={item.name} referrerPolicy="no-referrer" onClick={() => setPhotoPreviewSrc(item.photo_url)} sx={{ width: '100%', height: 'auto', maxHeight: 200, objectFit: 'cover', display: 'block', cursor: 'pointer', transition: 'opacity 0.15s', '&:hover': { opacity: 0.85 } }} />}
                                                                            <Box sx={{ p: 1.25 }}>
                                                                                <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                                                                                    <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: 'text.primary' }}>{item.name}</Typography>
                                                                                    {item.price && <Typography sx={{ fontWeight: 800, fontSize: 13, color: 'primary.main', flexShrink: 0, ml: 1 }}>${item.price}</Typography>}
                                                                                </Stack>
                                                                                {item.description && <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 500, lineHeight: 1.4, mt: 0.25 }}>{item.description}</Typography>}
                                                                                {item.duration && <Typography sx={{ fontSize: 10.5, color: 'text.disabled', fontWeight: 600, mt: 0.25 }}>{item.duration}</Typography>}
                                                                            </Box>
                                                                        </Box>
                                                                    ))}
                                                                </Stack>
                                                                {hasMoreSvc && (
                                                                    <Typography onClick={() => setBuilderExpanded((v) => !v)} sx={{ fontSize: 12, fontWeight: 800, color: 'primary.main', cursor: 'pointer', mt: 1, textAlign: 'center', '&:hover': { textDecoration: 'underline' } }}>
                                                                        {builderExpanded ? 'Show less' : `View all services (${svcMenuItems.length - SVC_LIMIT} more)`}
                                                                    </Typography>
                                                                )}
                                                            </>
                                                        )}
                                                    </>
                                                );
                                            })()}

                                            {/* ═══ CATEGORY BUILDER DATA (non-service_menu types) ═══ */}
                                            {(() => {
                                                const cd = categoryData || {};
                                                const builderCfg = catCfg.builder;
                                                if (!builderCfg) return null;
                                                if (builderCfg.type === 'service_menu') return null;
                                                const dataKey = builderCfg.dataKey;
                                                const rawItems = Array.isArray(cd[dataKey]) ? cd[dataKey] : [];
                                                if (rawItems.length === 0) return null;
                                                const title = builderCfg.builderTitle || 'Details';
                                                const BuilderIcon = BUILDER_ICON_MAP[builderCfg.type] || InfoRoundedIcon;
                                                const PREVIEW_LIMIT = builderCfg.type === 'accommodation' || builderCfg.type === 'menu' ? 2 : 3;

                                                if (builderCfg.type === 'menu') {
                                                    const sections = rawItems.filter((s) => s && (s.title || (s.items && s.items.length > 0)));
                                                    if (sections.length === 0) return null;
                                                    const visible = builderExpanded ? sections : sections.slice(0, PREVIEW_LIMIT);
                                                    const hasMore = sections.length > PREVIEW_LIMIT;
                                                    return (<><Divider sx={{ my: 2 }} /><SectionHeading icon={BuilderIcon}>{title}</SectionHeading><Stack spacing={1.5}>{visible.map((section, sIdx) => (<Box key={sIdx} sx={(t) => ({ borderRadius: 2.5, overflow: 'hidden', border: `1px solid ${alpha(t.palette.primary.main, 0.12)}` })}>{section.title && (<Box sx={(t) => ({ px: 1.5, py: 0.6, bgcolor: alpha(t.palette.primary.main, 0.06), borderBottom: `1px solid ${alpha(t.palette.primary.main, 0.1)}` })}><Typography sx={{ fontWeight: 900, fontSize: 11, color: 'primary.dark', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{section.title}</Typography></Box>)}<Stack spacing={0}>{(section.items || []).filter((it) => it.name).map((item, iIdx) => (<Box key={iIdx} sx={{ borderBottom: '1px solid', borderColor: 'divider', '&:last-of-type': { borderBottom: 'none' } }}>{item.photo_url && <Box component="img" src={item.photo_url} alt={item.name} referrerPolicy="no-referrer" onClick={() => setPhotoPreviewSrc(item.photo_url)} sx={{ width: '100%', height: 'auto', maxHeight: 200, objectFit: 'cover', display: 'block', cursor: 'pointer', '&:hover': { opacity: 0.85 } }} />}<Box sx={{ px: 1.5, py: 1 }}><Stack direction="row" justifyContent="space-between" alignItems="baseline"><Typography sx={{ fontWeight: 800, fontSize: 12 }}>{item.name}</Typography>{item.price && <Typography sx={{ fontWeight: 800, fontSize: 12, color: 'primary.main', flexShrink: 0, ml: 1 }}>${item.price}</Typography>}</Stack>{item.description && <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500, mt: 0.15, lineHeight: 1.4 }}>{item.description}</Typography>}</Box></Box>))}</Stack></Box>))}</Stack>{hasMore && <Typography onClick={() => setBuilderExpanded((v) => !v)} sx={{ fontSize: 12, fontWeight: 800, color: 'primary.main', cursor: 'pointer', mt: 1, textAlign: 'center', '&:hover': { textDecoration: 'underline' } }}>{builderExpanded ? 'Show less' : `View full menu (${sections.length - PREVIEW_LIMIT} more)`}</Typography>}</>);
                                                }
                                                if (builderCfg.type === 'provider') {
                                                    const valid = rawItems.filter((it) => it && it.name);
                                                    if (valid.length === 0) return null;
                                                    const visible = builderExpanded ? valid : valid.slice(0, PREVIEW_LIMIT);
                                                    const hasMore = valid.length > PREVIEW_LIMIT;
                                                    return (<><Divider sx={{ my: 2 }} /><SectionHeading icon={BuilderIcon}>{title}</SectionHeading><Stack spacing={1}>{visible.map((item, idx) => (<Stack key={idx} spacing={0} sx={(t) => ({ borderRadius: 2, overflow: 'hidden', bgcolor: alpha(t.palette.primary.main, 0.03), border: `1px solid ${alpha(t.palette.primary.main, 0.1)}` })}><Avatar variant="square" src={item.photo_url || undefined} alt={item.name} onClick={item.photo_url ? () => setPhotoPreviewSrc(item.photo_url) : undefined} sx={{ width: '100%', height: 140, borderRadius: 0, bgcolor: (t) => alpha(t.palette.primary.main, 0.08), cursor: item.photo_url ? 'pointer' : 'default', transition: 'opacity 0.15s', '&:hover': item.photo_url ? { opacity: 0.85 } : {}, '& img': { objectFit: 'cover' } }} imgProps={{ referrerPolicy: 'no-referrer' }}>{item.name?.[0]?.toUpperCase() || 'P'}</Avatar><Box sx={{ p: 1.25 }}><Stack direction="row" spacing={0.5} alignItems="baseline"><Typography sx={{ fontWeight: 800, fontSize: 12 }}>{item.name}</Typography>{item.title && <Typography sx={{ fontSize: 10.5, color: 'text.secondary', fontWeight: 600 }}>{item.title}</Typography>}</Stack>{item.specialty && <Chip label={item.specialty} size="small" sx={{ fontSize: 10, fontWeight: 700, height: 20, borderRadius: 999, mt: 0.25 }} />}{item.bio && <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500, mt: 0.5, lineHeight: 1.45 }}>{item.bio}</Typography>}</Box></Stack>))}</Stack>{hasMore && <Typography onClick={() => setBuilderExpanded((v) => !v)} sx={{ fontSize: 12, fontWeight: 800, color: 'primary.main', cursor: 'pointer', mt: 1, textAlign: 'center', '&:hover': { textDecoration: 'underline' } }}>{builderExpanded ? 'Show less' : `View all team (${valid.length - PREVIEW_LIMIT} more)`}</Typography>}</>);
                                                }
                                                if (builderCfg.type === 'class') {
                                                    const valid = rawItems.filter((it) => it && it.name);
                                                    if (valid.length === 0) return null;
                                                    const visible = builderExpanded ? valid : valid.slice(0, PREVIEW_LIMIT);
                                                    const hasMore = valid.length > PREVIEW_LIMIT;
                                                    return (<><Divider sx={{ my: 2 }} /><SectionHeading icon={BuilderIcon}>{title}</SectionHeading><Stack spacing={1}>{visible.map((item, idx) => (<Stack key={idx} spacing={0} sx={(t) => ({ borderRadius: 2, overflow: 'hidden', bgcolor: alpha(t.palette.primary.main, 0.03), border: `1px solid ${alpha(t.palette.primary.main, 0.1)}` })}>{item.photo_url && <Box component="img" src={item.photo_url} alt={item.name} referrerPolicy="no-referrer" onClick={() => setPhotoPreviewSrc(item.photo_url)} sx={{ width: '100%', height: 'auto', maxHeight: 200, objectFit: 'cover', display: 'block', cursor: 'pointer', '&:hover': { opacity: 0.85 } }} />}<Box sx={{ p: 1.25 }}><Typography sx={{ fontWeight: 800, fontSize: 12 }}>{item.name}</Typography><Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>{item.instructor && <Typography sx={{ fontSize: 10.5, color: 'text.secondary', fontWeight: 600 }}>with {item.instructor}</Typography>}{item.schedule && <Chip label={item.schedule} size="small" sx={{ fontSize: 9.5, fontWeight: 700, height: 18, borderRadius: 999 }} />}</Stack>{item.description && <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500, mt: 0.35, lineHeight: 1.4 }}>{item.description}</Typography>}</Box></Stack>))}</Stack>{hasMore && <Typography onClick={() => setBuilderExpanded((v) => !v)} sx={{ fontSize: 12, fontWeight: 800, color: 'primary.main', cursor: 'pointer', mt: 1, textAlign: 'center', '&:hover': { textDecoration: 'underline' } }}>{builderExpanded ? 'Show less' : `View all (${valid.length - PREVIEW_LIMIT} more)`}</Typography>}</>);
                                                }
                                                if (builderCfg.type === 'accommodation') {
                                                    const valid = rawItems.filter((it) => it && it.name);
                                                    if (valid.length === 0) return null;
                                                    const visible = builderExpanded ? valid : valid.slice(0, PREVIEW_LIMIT);
                                                    const hasMore = valid.length > PREVIEW_LIMIT;
                                                    return (<><Divider sx={{ my: 2 }} /><SectionHeading icon={BuilderIcon}>{title}</SectionHeading><Stack spacing={1.5}>{visible.map((item, idx) => (<Box key={idx} sx={(t) => ({ borderRadius: 2.5, overflow: 'hidden', border: `1px solid ${alpha(t.palette.primary.main, 0.12)}` })}>{item.photo_url && <Box component="img" src={item.photo_url} alt={item.name} referrerPolicy="no-referrer" onClick={() => setPhotoPreviewSrc(item.photo_url)} sx={{ width: '100%', height: 140, objectFit: 'cover', display: 'block', cursor: 'pointer', transition: 'opacity 0.15s', '&:hover': { opacity: 0.85 } }} />}<Box sx={{ px: 1.5, py: 1 }}><Stack direction="row" justifyContent="space-between" alignItems="baseline"><Typography sx={{ fontWeight: 900, fontSize: 13 }}>{item.name}</Typography>{item.price_per_night && <Typography sx={{ fontWeight: 800, fontSize: 12, color: 'primary.main', flexShrink: 0 }}>${item.price_per_night}<Typography component="span" sx={{ fontSize: 10, fontWeight: 500, color: 'text.secondary' }}>/night</Typography></Typography>}</Stack>{item.description && <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500, mt: 0.25, lineHeight: 1.4 }}>{item.description}</Typography>}{(item.amenities || []).length > 0 && <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4, mt: 0.75 }}>{item.amenities.map((a) => <Chip key={a} label={a} size="small" variant="outlined" sx={{ fontSize: 9.5, fontWeight: 600, height: 20, borderRadius: 999 }} />)}</Box>}</Box></Box>))}</Stack>{hasMore && <Typography onClick={() => setBuilderExpanded((v) => !v)} sx={{ fontSize: 12, fontWeight: 800, color: 'primary.main', cursor: 'pointer', mt: 1, textAlign: 'center', '&:hover': { textDecoration: 'underline' } }}>{builderExpanded ? 'Show less' : `View all rooms (${valid.length - PREVIEW_LIMIT} more)`}</Typography>}</>);
                                                }
                                                return null;
                                            })()}
                                        </Box>
                                    )}

                                    {/* POSTS TAB — desktop only (mobile uses Activity dialog) */}
                                    {activeTab === 1 && !isMobile && (
                                        <PostsTab
                                            businessId={biz.id}
                                            business={biz}
                                            user={user}
                                            onPostCountChange={handlePostCountChange}
                                            filterType={postFilterType}
                                            sortBy={postSortBy}
                                            dateRange={postDateRange}
                                            onSelectPost={handleSelectPost}
                                            onCommentPost={handleCommentPost}
                                        />
                                    )}

                                    {/* PHOTOS TAB */}
                                    {activeTab === 2 && (
                                        <PhotoGallery photos={galleryPhotos} onPhotoClick={openGalleryPhotoComments} />
                                    )}

                                    {/* REVIEWS TAB - UNCLAIMED: community features gated behind claim */}
                                    {activeTab === 3 && businessAllowReviews && isUnclaimed && (
                                        <Box sx={{ px: { xs: 1.5, sm: 2 }, py: 3 }}>
                                            <Box sx={(t) => ({
                                                p: { xs: 2.5, sm: 3 },
                                                borderRadius: 3,
                                                bgcolor: alpha(t.palette.primary.main, 0.04),
                                                border: '1px solid',
                                                borderColor: alpha(t.palette.primary.main, 0.12),
                                                textAlign: 'center',
                                            })}>
                                                <ReviewsRoundedIcon sx={{
                                                    fontSize: 44, color: 'primary.main', mb: 1.5, opacity: 0.7,
                                                }} />
                                                <Typography sx={{
                                                    fontWeight: 800,
                                                    fontSize: 16,
                                                    mb: 1,
                                                    color: 'text.primary',
                                                }}>
                                                    Reviews unlock when this business is claimed
                                                </Typography>
                                                <Typography sx={{
                                                    fontSize: 13,
                                                    color: 'text.secondary',
                                                    lineHeight: 1.6,
                                                    mb: 2.5,
                                                    maxWidth: 420,
                                                    mx: 'auto',
                                                }}>
                                                    The Local Lantern only shows community reviews on profiles where
                                                    the owner is part of the conversation. Once {biz.name || 'this business'} is
                                                    claimed, customers can share their experiences and the owner can respond.
                                                </Typography>
                                                <Button
                                                    variant="contained"
                                                    onClick={() => {
                                                        const claimUrl = `/claim-business/${encodeURIComponent(biz.id || '')}`;
                                                        if (typeof navigate === 'function') navigate(claimUrl);
                                                    }}
                                                    sx={{
                                                        borderRadius: 999,
                                                        textTransform: 'none',
                                                        fontWeight: 800,
                                                        px: 3,
                                                        py: 1,
                                                    }}
                                                >
                                                    Claim this business
                                                </Button>
                                                {Number(biz.google_rating) > 0 && (
                                                    <Typography sx={{
                                                        mt: 2.5,
                                                        fontSize: 11,
                                                        color: 'text.secondary',
                                                        fontStyle: 'italic',
                                                    }}>
                                                        {Number(biz.google_rating).toFixed(1)} stars from {Number(biz.google_review_count || 0).toLocaleString()} reviews on Google
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    )}
                                    {activeTab === 3 && businessAllowReviews && !isUnclaimed && (
                                        <ReviewsTab
                                            businessId={biz.id}
                                            user={user}
                                            onReviewCountChange={handleReviewCountChange}
                                            isOwnBusiness={isOwnBusiness}
                                            isNonPersonalAccount={isBA || isAA}
                                            highlightReviewId={highlightReviewIdProp}
                                            highlightReviewerId={highlightReviewerIdProp}
                                        />
                                    )}
                                </>
                            )}
                        </Box>
                    </Box>
                )}
            </Box>

            {/* Business report dialog */}
            <ReportDialog
                open={bizReportOpen}
                onClose={() => setBizReportOpen(false)}
                onSubmit={submitBizReport}
                title="Report Business"
            />

            {/* Photo preview lightbox */}
            <Dialog open={Boolean(photoPreviewSrc)} onClose={() => setPhotoPreviewSrc('')} maxWidth="md" PaperProps={{ sx: { bgcolor: 'black', borderRadius: 2, overflow: 'hidden', position: 'relative' } }}>
                <IconButton onClick={() => setPhotoPreviewSrc('')} sx={{ position: 'absolute', top: 8, right: 8, color: 'white', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }, zIndex: 1 }}>
                    <CloseIcon />
                </IconButton>
                {photoPreviewSrc && <Box component="img" src={photoPreviewSrc} alt="" referrerPolicy="no-referrer" sx={{ display: 'block', maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', mx: 'auto' }} />}
            </Dialog>

            {/* Panel-level photo lightbox (cover, avatar, gallery) */}
            <Dialog
                open={panelLightboxOpen}
                onClose={() => setPanelLightboxOpen(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{ sx: { bgcolor: '#0b0b0b', borderRadius: 2, overflow: 'hidden', position: 'relative', maxHeight: '92vh' } }}
            >
                <IconButton
                    onClick={() => setPanelLightboxOpen(false)}
                    sx={{ position: 'absolute', top: 12, right: 12, color: 'white', bgcolor: 'rgba(0,0,0,0.55)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }, zIndex: 10 }}
                >
                    <CloseIcon />
                </IconButton>

                {panelLightboxPhotos.length > 1 && (
                    <>
                        <IconButton
                            onClick={() => setPanelLightboxIndex((i) => (i - 1 + panelLightboxPhotos.length) % panelLightboxPhotos.length)}
                            sx={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', color: 'white', bgcolor: 'rgba(0,0,0,0.55)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }, zIndex: 10 }}
                        >
                            <ChevronLeftIcon />
                        </IconButton>
                        <IconButton
                            onClick={() => setPanelLightboxIndex((i) => (i + 1) % panelLightboxPhotos.length)}
                            sx={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)', color: 'white', bgcolor: 'rgba(0,0,0,0.55)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }, zIndex: 10 }}
                        >
                            <ChevronRightIcon />
                        </IconButton>
                    </>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: { xs: '60vh', sm: '70vh' }, p: 2 }}>
                    {panelLightboxPhotos[panelLightboxIndex] && (
                        <Box
                            component="img"
                            src={panelLightboxPhotos[panelLightboxIndex]}
                            alt=""
                            referrerPolicy="no-referrer"
                            sx={{ display: 'block', maxWidth: '100%', maxHeight: '78vh', objectFit: 'contain', borderRadius: 1 }}
                        />
                    )}

                    {/* Caption / attribution */}
                    {(panelLightboxCaptions[panelLightboxIndex] || panelLightboxPhotos.length > 1) && (
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2, width: '100%', maxWidth: 720, px: 1 }}>
                            <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 500 }}>
                                {panelLightboxCaptions[panelLightboxIndex] || ''}
                            </Typography>
                            {panelLightboxPhotos.length > 1 && (
                                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, ml: 'auto' }}>
                                    {panelLightboxIndex + 1} / {panelLightboxPhotos.length}
                                </Typography>
                            )}
                        </Stack>
                    )}
                </Box>
            </Dialog>

            {/* Quick message dialog */}
            <QuickMessageDialog
                open={quickMsgOpen}
                onClose={() => setQuickMsgOpen(false)}
                recipient={{
                    type: 'business',
                    id: Number(business?.id || 0),
                    name: name || 'Business',
                    avatar_url: logoUrl || null,
                    handle: slug || null,
                }}
            />

            {/* Copy link toast */}
            <SuccessSnackbar
                open={copyLinkToast}
                onClose={() => setCopyLinkToast(false)}
                message="Link copied to clipboard"
            />

            {/* Share business dialog */}
            <ShareDialog
                contentType="business"
                open={shareDialogOpen}
                onClose={() => setShareDialogOpen(false)}
                business={business || fullData}
                viewer={user}
            />

            {/* ═══ Mobile Activity fullscreen dialog ═══ */}
            {isMobile && (
                <Dialog
                    open={activityOpen}
                    fullScreen
                    onClose={() => { setActivityOpen(false); setActiveTab(0); setActivitySelectedPost(null); }}
                    PaperProps={{ sx: { bgcolor: 'background.paper', borderRadius: 0, overflowY: 'auto', overflowX: 'hidden', display: 'block' } }}
                    TransitionProps={{ unmountOnExit: true }}
                    disableScrollLock
                >
                    <BusinessEngagementTabs
                        business={fullData || business}
                        viewer={user}
                        isOwnBusiness={isOwnBusiness}
                        stickyTabs
                        mobileFullscreen
                        businessSlug={slug}
                        posts={activityPosts}
                        postsLoading={activityPostsLoading}
                        hasEvents={bizHasEvents}
                        eventsCount={bizEventsCount}
                        hasJobs={bizHasJobs}
                        hasServices={bizHasServices}
                        onPostClick={(post) => {
                            setActivityScrollCommentId(null);
                            setActivityHighlightCommentId(null);
                            const p = post ? { ...post, id: post.id || post.post_id || post.postId } : null;
                            setActivitySelectedPost(p);
                        }}
                        onCommentClick={(post, commentId) => {
                            if (!post) return;
                            const pid = post.id || post.post_id || post.postId;
                            if (!pid) return;
                            setActivityScrollCommentId(commentId);
                            setActivityHighlightCommentId(commentId);
                            setActivitySelectedPost({ ...post, id: pid });
                        }}
                        activityBarContent={
                            <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1, minHeight: 48 }}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <IconButton size="small" onClick={() => { setActivityOpen(false); setActiveTab(0); setActivitySelectedPost(null); }} sx={{ color: 'text.primary' }}>
                                        <ArrowBackRoundedIcon sx={{ fontSize: 22 }} />
                                    </IconButton>
                                    <Typography sx={{ fontWeight: 800, fontSize: 16 }}>Activity</Typography>
                                </Stack>
                                <Stack direction="row" alignItems="center" spacing={0.75} onClick={() => { setActivityOpen(false); setActiveTab(0); setActivitySelectedPost(null); }} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography sx={{ fontWeight: 800, fontSize: 13, lineHeight: 1.1 }}>{name}</Typography>
                                        {slug && <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: 11, lineHeight: 1, display: 'block' }}>@{slug}</Typography>}
                                    </Box>
                                    <Avatar src={hasValidLogo ? logoUrl : undefined} alt={name} imgProps={{ referrerPolicy: 'no-referrer' }} sx={(t) => ({ width: 32, height: 32, border: '1px solid', borderColor: 'divider', ...(!hasValidLogo ? { bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main } : {}) })}>
                                        <StorefrontOutlinedIcon sx={{ fontSize: 18 }} />
                                    </Avatar>
                                </Stack>
                            </Box>
                        }
                    />

                    {/* Detail panel — slides in from the right over the activity view */}
                    <DetailPanel
                        open={Boolean(activitySelectedPost)}
                        onClose={() => { setActivitySelectedPost(null); setActivityScrollCommentId(null); setActivityHighlightCommentId(null); }}
                        title="Post"
                    >
                        {activitySelectedPost && (() => {
                            const postKind = detectPostKind(activitySelectedPost);
                            return (
                                <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                                    {postKind === 'business' && (
                                        <BusinessPostDetailModal
                                            key={`biz-${activitySelectedPost?.id}`}
                                            embedded
                                            post={activitySelectedPost}
                                            user={user}
                                            onViewPage={() => {}}
                                            onShare={() => {}}
                                            onLocationClick={() => {}}
                                            scrollToCommentId={activityScrollCommentId}
                                            highlightCommentId={activityHighlightCommentId}
                                        />
                                    )}
                                    {postKind === 'artist' && (
                                        <MusicPostDetailPanel
                                            key={`art-${activitySelectedPost?.id}`}
                                            post={activitySelectedPost}
                                            user={user}
                                            onViewPost={() => {}}
                                            onLocationClick={() => {}}
                                            scrollToCommentId={activityScrollCommentId}
                                            highlightCommentId={activityHighlightCommentId}
                                        />
                                    )}
                                    {postKind === 'user' && (
                                        <PostPage
                                            key={`usr-${activitySelectedPost?.id}`}
                                            embedded
                                            post={activitySelectedPost}
                                            user={user}
                                            hideCategoryChip={false}
                                            onLocationClick={() => {}}
                                            scrollToCommentId={activityScrollCommentId}
                                            highlightCommentId={activityHighlightCommentId}
                                        />
                                    )}
                                </Box>
                            );
                        })()}
                    </DetailPanel>
                </Dialog>
            )}

            {/* ═══ Photo Comments Dialog ═══ */}
            <PhotoCommentsDialog
                open={photoCommentsOpen}
                onClose={() => { setPhotoCommentsOpen(false); setPhotoCommentsPhotoId(null); setPhotoCommentsPhotoUrl(null); }}
                profileHandleOrId={slugOrId}
                viewerId={viewerId || 0}
                isOwner={!!isOwnBusiness}
                photoType={photoCommentsType === 'gallery' ? undefined : photoCommentsType}
                photoId={photoCommentsType === 'gallery' ? photoCommentsPhotoId : undefined}
                photoUrl={photoCommentsType === 'gallery' ? photoCommentsPhotoUrl : undefined}
                apiPrefix="/api/business"
                allPhotos={photoCommentsType === 'gallery' ? (bizGalleryLoaded && bizGalleryPhotos.length > 0 ? bizGalleryPhotos.filter((p) => p && p.url && (p.position == null || p.position >= 0)) : undefined) : undefined}
                onNavigatePhoto={photoCommentsType === 'gallery' ? (newPhotoId, newPhotoUrl) => {
                    setPhotoCommentsPhotoId(newPhotoId);
                    setPhotoCommentsPhotoUrl(newPhotoUrl || null);
                } : undefined}
            />
        </>
    );
}

/* ════════════════════════════════════════════════════════════════════════════
   QUICK MESSAGE RATE-LIMIT TRACKER (sessionStorage-backed, shared across pages)
   Tracks per-recipient, 5 msgs / 10 min window.
   Uses sessionStorage so limits carry over between BusinessPublicPage
   and BusinessDetailPanel within the same browser session.
   ════════════════════════════════════════════════════════════════════════════ */
const _BIZ_PANEL_MSG_WINDOW = 10 * 60 * 1000;
const _BIZ_PANEL_MSG_MAX = 5;
const _BIZ_PANEL_MSG_STORAGE_PREFIX = "ll:bizMsgTrack:";

function _getBizPanelMsgEntries(recipientKey) {
    const now = Date.now();
    const storageKey = _BIZ_PANEL_MSG_STORAGE_PREFIX + String(recipientKey);
    try {
        const raw = sessionStorage.getItem(storageKey);
        if (!raw) return [];
        return JSON.parse(raw).filter(t => now - t < _BIZ_PANEL_MSG_WINDOW);
    } catch { return []; }
}

function _trackBizPanelMsg(recipientKey) {
    const now = Date.now();
    const storageKey = _BIZ_PANEL_MSG_STORAGE_PREFIX + String(recipientKey);
    const entries = _getBizPanelMsgEntries(recipientKey);
    entries.push(now);
    try { sessionStorage.setItem(storageKey, JSON.stringify(entries)); } catch { /* */ }
}

function _isBizPanelLimited(recipientKey) {
    return _getBizPanelMsgEntries(recipientKey).length >= _BIZ_PANEL_MSG_MAX;
}

/* ════════════════════════════════════════════════════════════════════════════
   QUICK MESSAGE DIALOG — compact compose popup with pre-filled recipient
   ════════════════════════════════════════════════════════════════════════════ */
function QuickMessageDialog({ open, onClose, onSent, recipient }) {
    const qmTheme = useTheme();
    const isMobileQm = useMediaQuery(qmTheme.breakpoints.down('md'));
    const [body, setBody] = useState('');
    const [photos, setPhotos] = useState([]);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const [success, setSuccess] = useState(false);
    const [limitReached, setLimitReached] = useState(false);

    // Reset on close
    useEffect(() => {
        if (!open) {
            const timer = setTimeout(() => {
                setBody('');
                setPhotos([]);
                setError('');
                setCooldown(0);
                setSuccess(false);
            }, 200);
            return () => clearTimeout(timer);
        }
        // Check limit when opening — show rate-limit popup instead of compose
        if (open && recipient?.id && _isBizPanelLimited(recipient.id)) {
            setLimitReached(true);
        }
    }, [open, recipient?.id]);

    const handleSend = async () => {
        if (!recipient?.id || (!body.trim() && photos.length === 0) || cooldown > 0) return;
        if (_isBizPanelLimited(recipient.id)) { setLimitReached(true); return; }
        setSending(true);
        setError('');
        try {
            // Upload photos
            const photoPayload = [];
            for (const p of photos) {
                if (p.file) {
                    try {
                        const ct = p.file.type || "image/jpeg";
                        const sn = `${Date.now()}_msg_${p.file.name || "photo.jpg"}`;
                        const s = await getSignedUploadUrl({ folder: "business/messages", fileName: sn, contentType: ct });
                        if (s?.uploadUrl) { await uploadToSignedUrl({ uploadUrl: s.uploadUrl, file: p.file, contentType: ct }); photoPayload.push({ url: String(s.publicUrl || "").trim(), objectPath: String(s.objectPath || "").trim() }); }
                    } catch { /* skip */ }
                }
            }

            await axios.post('/api/messages/send', {
                recipient_type: recipient.type || 'business',
                recipient_id: recipient.id,
                body: body.trim(),
                photos: photoPayload,
            }, { withCredentials: true, headers: { ...getAccountHeaders() } });
            _trackBizPanelMsg(recipient.id);
            photos.forEach((p) => { if (p?.url && !p._existing) { try { URL.revokeObjectURL(p.url); } catch {} } });
            setPhotos([]);
            setSuccess(true);
            if (onSent) onSent();
        } catch (err) {
            const status = err?.response?.status;
            const data = err?.response?.data;
            if (status === 429) {
                const wait = Number(data?.retryAfterSeconds) || 15;
                setError(data?.message || data?.error || "You're sending messages too quickly. Please wait a moment.");
                setCooldown(wait);
                const timer = setInterval(() => {
                    setCooldown(prev => {
                        if (prev <= 1) { clearInterval(timer); setError(''); return 0; }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                const msg = data?.message || err?.message || 'Failed to send message.';
                setError(msg);
            }
        } finally {
            setSending(false);
        }
    };

    const closeDialog = () => {
        if (sending) return;
        photos.forEach((p) => { if (p?.url && !p._existing) { try { URL.revokeObjectURL(p.url); } catch {} } });
        setPhotos([]);
        onClose();
    };

    return (
        <>
            <Dialog
                open={open && !limitReached}
                onClose={(event, reason) => {
                    if (reason === 'backdropClick') return;
                    closeDialog();
                }}
                maxWidth="sm"
                fullWidth
                fullScreen={isMobileQm}
                disableScrollLock
                PaperProps={{ sx: { borderRadius: isMobileQm ? 0 : 3, maxHeight: isMobileQm ? '100%' : '85vh' } }}
            >
                <DialogTitle sx={{ pr: 6 }}>
                    {!success && (
                        <Typography sx={{ fontWeight: 950, fontSize: 16 }}>
                            Contact Business
                        </Typography>
                    )}
                    <IconButton aria-label="Close" onClick={closeDialog} disabled={sending}
                                sx={{ position: 'absolute', right: 12, top: 12 }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>

                <DialogContent>
                    {success ? (
                        <Stack spacing={2} sx={{ py: 2 }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                                <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 0.5 }}>Message Sent!</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    They will receive your message and get back to you soon.
                                </Typography>
                            </Box>
                            <Button variant="contained" fullWidth onClick={closeDialog}
                                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}>Done</Button>
                        </Stack>
                    ) : (
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            {/* Locked recipient */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>To:</Typography>
                                <Chip
                                    avatar={
                                        <Avatar src={recipient?.avatar_url} imgProps={{ referrerPolicy: "no-referrer" }} sx={{ width: 24, height: 24 }}>
                                            <StorefrontOutlinedIcon sx={{ fontSize: 14 }} />
                                        </Avatar>
                                    }
                                    label={recipient?.name || 'Business'}
                                    sx={{ fontWeight: 700, fontSize: '0.8rem' }}
                                />
                            </Box>
                            {/* Business context */}
                            <Box sx={(t) => ({ p: 1.5, borderRadius: 2, bgcolor: alpha(t.palette.primary.main, 0.04), border: '1px solid', borderColor: alpha(t.palette.primary.main, 0.1) })}>
                                <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{recipient?.name || 'Business'}</Typography>
                                <Typography variant="caption" color="text.secondary">Business</Typography>
                            </Box>

                            <TextField
                                label="Message"
                                placeholder="Describe what you need, timeline, budget, etc."
                                multiline
                                minRows={5}
                                maxRows={10}
                                value={body}
                                onChange={(e) => { setBody(e.target.value.slice(0, 2000)); if (error) setError(''); }}
                                inputProps={{ maxLength: 2000 }}
                                fullWidth
                                error={Boolean(error)}
                                helperText={error || `${body.length} / 2,000`}
                                FormHelperTextProps={{ sx: { textAlign: error ? 'left' : 'right', mr: 0.5, fontWeight: 600, fontSize: '0.75rem' } }}
                                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'background.paper' } }}
                            />

                            {/* Photos */}
                            <PhotosUploadSection photos={photos} setPhotos={setPhotos} disabled={sending}
                                                 maxPhotos={4} title="Photos (optional)" helperText="Add up to 4 photos to help describe what you need."
                                                 addButtonText="Add photos" />
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Button variant="outlined" onClick={closeDialog} disabled={sending}
                                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}>
                                    Cancel
                                </Button>
                                <Button variant="contained" onClick={handleSend} disabled={(!body.trim() && photos.length === 0) || sending || cooldown > 0}
                                        startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <ChatBubbleOutlineRoundedIcon />}
                                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}>
                                    {cooldown > 0 ? `Wait ${cooldown}s` : sending ? 'Sending\u2026' : 'Send Message'}
                                </Button>
                            </Stack>
                            {sending && <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />}
                        </Stack>
                    )}
                </DialogContent>
            </Dialog>

            {/* Rate limit reached dialog */}
            <Dialog open={limitReached} onClose={() => { setLimitReached(false); onClose(); }} maxWidth="xs" fullWidth
                    PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogContent sx={{ textAlign: "center", py: 4, px: 3 }}>
                    <AccessTimeRoundedIcon sx={{ fontSize: 48, color: "warning.main", mb: 2 }} />
                    <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 1 }}>Slow down a bit!</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        You've sent several messages to this business recently. Give them a chance to respond before sending more.
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

BusinessDetailPanel.propTypes = {
    business: PropTypes.any,
    emptyLabel: PropTypes.string,
    onViewPage: PropTypes.func,
    user: PropTypes.object,
    isOwnBusiness: PropTypes.bool,
    onReviewChange: PropTypes.func,
    onLocationClick: PropTypes.func,
    isFollowing: PropTypes.bool,
    onDeselect: PropTypes.func,
};
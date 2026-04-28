// src/pages/business/pages/BusinessPublicPage.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo, forwardRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Avatar,
    Paper,
    Tabs,
    Tab,
    IconButton,
    Chip,
    Stack,
    Skeleton,
    Alert,
    Button,
    TextField,
    Rating,
    LinearProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions,
    useTheme,
    useMediaQuery,
    alpha,
    Divider,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    CircularProgress,
    Tooltip,
    Collapse,
    Drawer,
    Slide,
    Snackbar,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    Phone as PhoneIcon,
    Email as EmailIcon,
    Language as WebsiteIcon,
    LocationOn as LocationIcon,
    StorefrontOutlined as OverviewIcon,
    Article as PostsIcon,
    Share as ShareIcon,
    Facebook as FacebookIcon,
    Instagram as InstagramIcon,
    Close as CloseIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Star as StarIcon,
    RateReview as ReviewIcon,
    AccessTime as TimeIcon,
    PhotoLibrary as PhotoIcon,
    Verified as VerifiedIcon,
    ThumbUp as ThumbUpIcon,
    ThumbUpOutlined as ThumbUpOutlinedIcon,
    Add as AddIcon,
    Check as CheckIcon,
    NotesOutlined as NotesOutlinedIcon,
    InfoOutlined as InfoOutlinedIcon,
    Settings as SettingsIcon,
    ArrowForward as ArrowForwardIcon,
    AddPhotoAlternate as AddPhotoIcon,
    LocalOffer as DealIcon,
    Schedule as ScheduleIcon,
    PushPin as PushPinIcon,
    PushPinOutlined as PushPinOutlinedIcon,
    StarRounded as StarRoundedIcon,
    Tune as TuneIcon,
    TuneOutlined as TuneOutlinedIcon,
    Refresh as RefreshIcon,
    Sort as SortIcon,
    MoreVert as MoreVertIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Flag as FlagIcon,
    FlagOutlined as FlagOutlinedIcon,
    Campaign as CampaignIcon,
    Reply as ReplyIcon,
    VisibilityOff as VisibilityOffIcon,
    Block as BlockIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import InputAdornment from '@mui/material/InputAdornment';
import EventIcon from '@mui/icons-material/Event';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import ForumIcon from '@mui/icons-material/Forum';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RepeatIcon from '@mui/icons-material/Repeat';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import DynamicFeedRoundedIcon from '@mui/icons-material/DynamicFeedRounded';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import XIcon from '@mui/icons-material/X';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import SvgIcon from '@mui/material/SvgIcon';

// Event category icons (matching UserProfilePage)
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import TheaterComedyRoundedIcon from '@mui/icons-material/TheaterComedyRounded';
import RestaurantRoundedIcon from '@mui/icons-material/RestaurantRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import ChildCareRoundedIcon from '@mui/icons-material/ChildCareRounded';
import SportsSoccerRoundedIcon from '@mui/icons-material/SportsSoccerRounded';
import ParkRoundedIcon from '@mui/icons-material/ParkRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import BusinessCenterRoundedIcon from '@mui/icons-material/BusinessCenterRounded';
import SpaRoundedIcon from '@mui/icons-material/SpaRounded';
import ChurchRoundedIcon from '@mui/icons-material/ChurchRounded';
import CelebrationRoundedIcon from '@mui/icons-material/CelebrationRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';

// Category Icons
import RestaurantIcon from '@mui/icons-material/Restaurant';
import StorefrontIcon from '@mui/icons-material/Storefront';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
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
import PersonIcon from '@mui/icons-material/Person';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import GroupsIcon from '@mui/icons-material/Groups';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import ForestRoundedIcon from '@mui/icons-material/ForestRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import GppGoodRoundedIcon from '@mui/icons-material/GppGoodRounded';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import HotelIcon from '@mui/icons-material/Hotel';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import LinkIcon from '@mui/icons-material/Link';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import PhotoLibraryRoundedIcon from '@mui/icons-material/PhotoLibraryRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';

import ShareDialog from '../../../components/ShareDialog';
import SearchInput from '../../../components/SearchInput';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import ActionBar, { ReportDialog } from '../../../components/ActionBar';
import EventCard from '../../events/components/EventCard';
import UserCardPopover from '../../../components/UserCardPopover';
import { MOBILE_BOTTOM_NAV_HEIGHT } from '../../../components/Header/Header';
import { useActiveAccount } from '../../../components/AccountContext';
import { useAuth } from '../../../components/AuthModalContext';
import EditPostDialog from '../components/EditBusinessPostDialog';
import ContentFadeIn from '../../../components/ContentFadeIn';
import PulsingDots from '../../../components/PulsingDots';
import BusinessEngagementTabs from '../components/BusinessEngagementTabs';
import BusinessPostDetailModal from '../components/BusinessPostDetailModal';
import MusicPostDetailPanel from '../../music/components/MusicPostDetailPanel';
import PostPage from '../../community/PostDetailModal';
import EventDetailPanel from '../../events/components/EventDetailPanel';
import CreateEditEventModal from '../../events/modals/CreateEditEventModal';
import JobDetailPanel from '../../jobs/components/JobDetailPanel';
import CreateJobModal from '../../jobs/modals/CreateJobModal';
import ApplyToJobDialog from '../../jobs/components/ApplyToJobDialog';
import { deleteJob, renewJob } from '../../jobs/api/jobs';
import { getServiceCategoryInfo } from '../../services/utils/serviceHelpers';
import ServicePopupDialog from '../../services/components/ServicePopupDialog';
import { fetchRequestResponses, acceptRequestResponse, declineRequestResponse, withdrawRequestResponse, closeServiceRequest, deleteServiceRequest } from '../../services/api/servicesApi';
import ServiceRequestCard from '../../services/components/ServiceRequestCard';
import CreateServiceRequestModal from '../../services/modals/CreateServiceRequestModal';
import RespondToRequestModal from '../../services/modals/RespondToRequestModal';
import { stripHtml } from '../../../utils/richTextUtils';
import RichTextEditor from '../../../components/RichTextEditor';
import NetworkErrorState, { isNetworkError } from '../../../components/NetworkErrorState';
import SuccessSnackbar, { useSuccessSnackbar } from '../../../components/SuccessSnackbar';
import useRateLimit from '../../../utils/useRateLimit';
import RateLimitDialog from '../../../components/RateLimitDialog';
import FollowsSection from '../../profile/userProfile/FollowsSection';
import { PhotoCommentsDialog } from '../../profile/userProfile/ProfileHeader';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import CardContent from '@mui/material/CardContent';
import Card from '@mui/material/Card';

import defaultAvatar from '../../../assets/profile/default_avatar.png';
import { getProfileSubTabsSx, getProfileSelectSx } from '../../../themes/theme';

import { CATEGORY_CONFIG, DEFAULT_CATEGORY_CONFIG } from '../config/categoryConfig';

import { fetchBusinessPublicBySlug, fetchBusinessPosts, createBusinessPost, updateBusinessPost, deleteBusinessPost, pinBusinessPost, unpinBusinessPost, reportBusinessPost, reportBusiness, fetchBusinessEvents, fetchBusinessReviews, submitBusinessReview, deleteBusinessReview, toggleReviewHelpful, replyToBusinessReview, deleteReviewReply, upsertBusinessSpecialHours, deleteBusinessSpecialHours } from '../api/businessApi';
import { getAccountHeaders } from '../../../utils/getAccountHeadersStatic';
import { secureFetch } from '../../../utils/secureFetch';
import axios from '../../../api/axiosInstance';
import PhotosUploadSection from '../../../components/PhotosUploadSection';
import MobileActivityShell, { DetailPanel } from '../../../components/MobileActivityShell';
import SmartMenu from '../../../components/SmartMenu';
import useChromeTop from '../../../hooks/useChromeTop';
import { topRightInsetSx, bottomInsetSx, SAFE_TOP } from '../../../utils/safeArea';

/* ── GCS upload helpers ── */
async function getSignedUploadUrl({ folder, fileName, contentType }) {
    const res = await secureFetch("/api/uploads/signed-url", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folder, fileName, contentType }) });
    if (!res.ok) throw new Error("Failed to get upload URL");
    return res.json();
}
async function uploadToSignedUrl({ uploadUrl, file, contentType }) {
    // GCS direct upload — intentionally raw fetch (external domain)
    const res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
    if (!res.ok) throw new Error("Upload failed");
}

// ============================
// Constants
// ============================
const CATEGORY_ICONS = {
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

/** Event category labels and icons — matches UserProfilePage exactly */
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
const EVENT_CATEGORY_ICONS = {
    'music-nightlife': MusicNoteRoundedIcon,
    'arts-culture': TheaterComedyRoundedIcon,
    'food-drink': RestaurantRoundedIcon,
    'community-social': PeopleAltRoundedIcon,
    'family-kids': ChildCareRoundedIcon,
    'sports-recreation': SportsSoccerRoundedIcon,
    'outdoors-nature': ParkRoundedIcon,
    'education-workshops': SchoolRoundedIcon,
    'business-networking': BusinessCenterRoundedIcon,
    'health-wellness': SpaRoundedIcon,
    'faith-spiritual': ChurchRoundedIcon,
    'volunteer-fundraising': VolunteerActivismIcon,
    'government-civic': AccountBalanceIcon,
    'markets-shopping': StorefrontRoundedIcon,
    'holidays-seasonal': CelebrationRoundedIcon,
    other: CategoryRoundedIcon,
};
const EVENT_CATEGORY_FILTER_OPTIONS = Object.keys(EVENT_CATEGORY_LABELS).map((key) => ({
    value: key,
    label: EVENT_CATEGORY_LABELS[key],
    Icon: EVENT_CATEGORY_ICONS[key] || CategoryRoundedIcon,
}));
function eventCategoryLabel(slug) {
    return EVENT_CATEGORY_LABELS[String(slug || '').toLowerCase()] || slug || '';
}
const formatEventCategory = (slug) => eventCategoryLabel(slug);

/** Shared dropdown styling — matches SearchInput frosted-glass look */
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

// ── Job Extend / Renew helpers ──
const MAX_LISTING_DAYS = 90;
const EXTEND_OPTIONS = [7, 14, 30, 60, 90];

const getRemainingDays = (expiresAt) => {
    if (!expiresAt) return 0;
    const exp = new Date(expiresAt);
    if (Number.isNaN(exp.valueOf())) return 0;
    const diffMs = exp.getTime() - Date.now();
    return diffMs > 0 ? Math.round(diffMs / (1000 * 60 * 60 * 24)) : 0;
};

const futureDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const ENTITY_ICON_MAP = {
    business: StorefrontIcon,
    nonprofit: VolunteerActivismIcon,
    organization: GroupsIcon,
    government: AccountBalanceIcon,
};

const HL_ICONS = {
    Star: StarRoundedIcon, Favorite: FavoriteRoundedIcon, Forest: ForestRoundedIcon,
    Volunteer: VolunteerActivismIcon, Groups: GroupsIcon, CheckCircle: CheckCircleRoundedIcon,
    Trophy: EmojiEventsRoundedIcon, Shield: GppGoodRoundedIcon, Build: BuildIcon,
};

const BUILDER_ICON_MAP = {
    menu: RestaurantMenuIcon,
    service_menu: BuildIcon,
    provider: GroupsIcon,
    class: EventIcon,
    accommodation: HotelIcon,
};

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS = { sunday: 'Sun', monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat' };

/** Slide-up transition for the fullscreen activity dialog */
const SlideUpTransition = forwardRef(function SlideUpTransition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const COVER_ASPECT_RATIO = 3.5;
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

const POST_TYPES = [
    { value: 'update', label: 'Update', description: 'General news or behind-the-scenes' },
    { value: 'deal', label: 'Deal', description: 'Sales, promotions, or special offers' },
    { value: 'announcement', label: 'Announcement', description: 'Important news or changes' },
];

const POST_TYPE_FILTERS = [
    { value: 'all', label: 'All Types' },
    { value: 'update', label: 'Updates' },
    { value: 'deal', label: 'Deals' },
    { value: 'announcement', label: 'Announcements' },
];

const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'popular', label: 'Most Popular' },
];

const MAX_POST_PHOTOS = 8;

// ============================
// Helper Functions
// ============================
function formatRelativeTime(dateStr) {
    if (!dateStr) return '';
    const now = new Date();

    let then;
    const dateString = String(dateStr);
    if (dateString.endsWith('Z') || dateString.includes('+')) {
        then = new Date(dateString);
    } else if (dateString.includes('T')) {
        // Has T separator but no timezone — treat as UTC
        then = new Date(dateString + 'Z');
    } else {
        // Raw "YYYY-MM-DD HH:MM:SS" from DB — these are UTC, append Z
        then = new Date(dateString.replace(' ', 'T') + 'Z');
    }

    // Handle invalid dates
    if (isNaN(then.getTime())) return '';

    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);

    if (diffSec < 0) return 'Just now'; // Future dates (clock skew)
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

/**
 * Build a proper social media URL from a handle/username or partial URL
 * @param {string} value - The stored value (could be username, handle, or full URL)
 * @param {string} platform - 'facebook', 'instagram', or 'twitter'
 * @returns {string} - Full URL with https://
 */
function buildSocialUrl(value, platform) {
    if (!value) return '';
    const val = String(value).trim();
    if (!val) return '';

    // If it already has a protocol, return as-is
    if (val.startsWith('http://') || val.startsWith('https://')) {
        return val;
    }

    // If it starts with the domain, add https://
    const domains = {
        facebook: 'facebook.com',
        instagram: 'instagram.com',
        twitter: 'x.com',
        linkedin: 'linkedin.com/in',
        etsy: 'etsy.com/shop',
    };
    const domain = domains[platform] || '';

    if (val.startsWith(domain) || val.startsWith(`www.${domain}`)) {
        return `https://${val}`;
    }

    // Otherwise treat as username/handle - strip @ if present
    const username = val.replace(/^@/, '');
    return `https://${domain}/${username}`;
}

function formatHoursTime(time) {
    if (!time) return '';
    const [h, m] = String(time).split(':');
    const hour = parseInt(h, 10);
    const minute = m || '00';
    if (hour === 0) return `12:${minute} AM`;
    if (hour < 12) return `${hour}:${minute} AM`;
    if (hour === 12) return `12:${minute} PM`;
    return `${hour - 12}:${minute} PM`;
}


function formatDateKeyLocal(date) {
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function findSpecialHoursForDate(specialHours, dateKey) {
    if (!Array.isArray(specialHours) || !dateKey) return null;
    const key = String(dateKey).trim();
    if (!key) return null;
    const hit = specialHours.find((s) => String(s?.date || '').slice(0, 10) === key);
    return hit || null;
}

function getCurrentDayName() {
    return DAY_NAMES[new Date().getDay()];
}

function getCategoryIcon(categoryKey) {
    return CATEGORY_ICONS[categoryKey] || CategoryIcon;
}

function getCategoryLabel(categoryKey) {
    return CATEGORY_LABELS[categoryKey] || categoryKey || 'Business';
}

function getEntityTypeLabel(type) {
    const labels = { business: 'Business', nonprofit: 'Nonprofit', organization: 'Organization', government: 'Government' };
    return labels[type] || 'Business';
}

function hasAnyHoursSet(hours) {
    if (!hours) return false;
    return Object.values(hours).some(dayHours => {
        if (!dayHours) return false;
        return dayHours.closed || dayHours.allDay || (dayHours.open && dayHours.close);
    });
}

function getTodayStatus(hours, specialHours) {
    const todayKey = formatDateKeyLocal(new Date());
    const special = findSpecialHoursForDate(specialHours, todayKey);

    if (special) {
        if (special.closed) return { status: 'closed', text: 'Temporarily closed today', isSpecial: true };
        if (special.allDay) return { status: 'open', text: 'Open 24 hours (today)', isSpecial: true };
        if (special.open && special.close) {
            return { status: 'open', text: `Special hours: ${formatHoursTime(special.open)} - ${formatHoursTime(special.close)}`, isSpecial: true };
        }
        return { status: 'unknown', text: 'Special hours set', isSpecial: true };
    }

    if (!hours) return { status: 'unknown', text: 'Hours not listed' };
    const today = getCurrentDayName();
    const todayHours = hours[today];
    if (!todayHours) return { status: 'unknown', text: 'Hours not listed' };
    if (todayHours.closed) return { status: 'closed', text: 'Closed today' };
    if (todayHours.allDay) return { status: 'open', text: 'Open 24 hours' };
    if (todayHours.open && todayHours.close) {
        return { status: 'open', text: `Open until ${formatHoursTime(todayHours.close)}` };
    }
    return { status: 'unknown', text: 'Hours not listed' };
}

// ============================
// StarRating Component
// ============================
function StarRating({ value, size = 'medium', showValue = true }) {
    return (
        <Stack direction="row" alignItems="center" spacing={0.5}>
            <Rating value={value} precision={0.5} readOnly size={size} />
            {showValue && <Typography variant="body2" fontWeight={700} color="text.primary">{value?.toFixed(1) || '0.0'}</Typography>}
        </Stack>
    );
}

// ============================
// ReviewCard Component
// ============================
function ReviewCard({ review, compact = false, businessId, viewerId, onHelpfulUpdate, viewer, isOwnBusiness, onReplyUpdate, onEditReview, onDeleteReview, onSuccess }) {
    const [helpfulBusy, setHelpfulBusy] = useState(false);
    const [lbOpen, setLbOpen] = useState(false);
    const [lbIndex, setLbIndex] = useState(0);
    const isOwn = viewerId > 0 && Number(review.userId) === viewerId;
    const photos = Array.isArray(review.photoUrls) ? review.photoUrls.filter(Boolean)
        : Array.isArray(review.photo_urls) ? review.photo_urls.filter(Boolean)
            : [];

    // Owner reply state
    const [replyOpen, setReplyOpen] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [replyPhotos, setReplyPhotos] = useState([]);
    const [replySaving, setReplySaving] = useState(false);
    const [replyError, setReplyError] = useState('');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    // Review 3-dot menu + report state
    const [rvMenuAnchor, setRvMenuAnchor] = useState(null);
    const [rvReportOpen, setRvReportOpen] = useState(false);
    const [rvReportIsReply, setRvReportIsReply] = useState(false);
    const [rvDeleteConfirmOpen, setRvDeleteConfirmOpen] = useState(false);
    const [rvDeleting, setRvDeleting] = useState(false);

    const handleOpenReply = () => {
        setReplyText(review.ownerReply || '');
        const rpUrls = Array.isArray(review.replyPhotoUrls) ? review.replyPhotoUrls.filter(Boolean) : [];
        setReplyPhotos(rpUrls.map((u) => ({ id: u, url: u, _existing: true })));
        setReplyError('');
        setReplyOpen(true);
    };

    const handleCancelReply = () => {
        if (replySaving) return;
        setReplyOpen(false);
        setReplyPhotos([]);
        setReplyError('');
    };

    const handleSaveReply = async () => {
        const body = replyText.trim();
        if (!body) { setReplyError('Reply cannot be empty.'); return; }
        if (body.length > 2000) { setReplyError('Reply must be under 2000 characters.'); return; }
        setReplySaving(true);
        setReplyError('');
        try {
            const photosToUpload = replyPhotos.map((p) => {
                if (p._existing && p.url) return p.url;
                if (p.file instanceof File) return p;
                return null;
            }).filter(Boolean);

            const resp = await replyToBusinessReview(businessId, review.id, body, photosToUpload);
            if (onReplyUpdate) {
                onReplyUpdate(review.id, resp.ownerReply || body, resp.ownerReplyAt || new Date().toISOString(), resp.replyByName || null, resp.replyByAvatar || null, resp.replyByHandle || null, resp.replyPhotoUrls || []);
            }
            setReplyOpen(false);
            setReplyPhotos([]);
            if (onSuccess) onSuccess(review.ownerReply ? 'Reply updated' : 'Reply posted');
        } catch (err) {
            setReplyError(err?.message || 'Failed to save reply.');
        } finally {
            setReplySaving(false);
        }
    };

    const handleDeleteReply = async () => {
        setReplySaving(true);
        try {
            await deleteReviewReply(businessId, review.id);
            if (onReplyUpdate) {
                onReplyUpdate(review.id, null, null, null, null, null, []);
            }
            setDeleteConfirmOpen(false);
            setReplyOpen(false);
            if (onSuccess) onSuccess('Reply deleted');
        } catch (err) {
            setReplyError(err?.message || 'Failed to delete reply.');
        } finally {
            setReplySaving(false);
        }
    };

    // UserCardPopover state
    const [cardAnchorEl, setCardAnchorEl] = useState(null);
    const [cardUser, setCardUser] = useState(null);

    const handleAvatarClick = (e) => {
        const reviewUserId = review.userId || review.user_id;
        if (!reviewUserId) return;
        setCardAnchorEl(e.currentTarget);
        setCardUser({
            id: reviewUserId,
            first_name: review.authorFirstName || review.firstName || '',
            last_name: review.authorLastName || review.lastName || '',
            handle: review.authorHandle || review.handle || review.username || '',
            avatar_url: review.authorAvatarUrl || review.profileImageUrl || '',
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
        viewer?.id != null && cardUser?.id != null && String(viewer.id) === String(cardUser.id)
    );

    const openLightbox = (idx) => {
        setLbIndex(idx);
        setLbOpen(true);
    };

    const handleHelpful = async () => {
        if (!businessId || !review.id || helpfulBusy || isOwn || !viewerId) return;
        setHelpfulBusy(true);
        try {
            const resp = await toggleReviewHelpful(businessId, review.id);
            if (onHelpfulUpdate) {
                onHelpfulUpdate(review.id, Number(resp.helpfulCount || 0), Boolean(resp.viewerFoundHelpful));
            }
        } catch {
            // silent
        } finally {
            setHelpfulBusy(false);
        }
    };

    return (
        <Box sx={{ py: 2.5, '&:last-child': { pb: 1 } }}>
            <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <Avatar
                    src={review.authorAvatarUrl || undefined}
                    sx={(t) => ({
                        width: 36, height: 36, flexShrink: 0, mt: 0.25, cursor: 'pointer',
                        bgcolor: alpha(t.palette.primary.main, 0.08),
                        color: t.palette.primary.main,
                        fontSize: '0.85rem', fontWeight: 800,
                        '& .MuiAvatar-img': { objectFit: 'cover', transform: 'scale(1.15)' },
                    })}
                    imgProps={{ referrerPolicy: 'no-referrer' }}
                    onClick={handleAvatarClick}
                >
                    <PersonIcon sx={{ fontSize: 20 }} />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' },
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%',
                            }}
                            onClick={handleAvatarClick}
                        >
                            {review.authorName || 'Anonymous'}
                        </Typography>
                    </Stack>
                    {(review.authorHandle || review.handle || review.username) && (
                        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600, lineHeight: 1.2 }}>
                            @{review.authorHandle || review.handle || review.username}
                        </Typography>
                    )}
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                        <StarRating value={review.rating} size="small" showValue={false} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                            {formatRelativeTime(review.updatedAt && review.updatedAt !== review.createdAt ? review.updatedAt : review.createdAt)}
                        </Typography>
                        {review.updatedAt && review.updatedAt !== review.createdAt && (
                            <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic', fontSize: '0.6rem' }}>
                                (edited)
                            </Typography>
                        )}
                    </Stack>
                </Box>
                {/* 3-dot menu for own reviews (edit/delete) and others' reviews (report) */}
                {viewerId > 0 && (
                    <>
                        <IconButton
                            size="small"
                            onClick={(e) => setRvMenuAnchor(e.currentTarget)}
                            sx={(t) => ({ width: 32, height: 32, flexShrink: 0, border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`, borderRadius: 999, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } })}
                        >
                            <MoreVertIcon fontSize="small" />
                        </IconButton>
                        <SmartMenu
                            anchorEl={rvMenuAnchor}
                            open={Boolean(rvMenuAnchor)}
                            onClose={() => setRvMenuAnchor(null)}
                            disableScrollLock
                            onClick={(e) => e.stopPropagation()}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            sx={{ zIndex: (t) => t.zIndex.modal + 55 }}
                            PaperProps={{ sx: { mt: 0.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: (t) => t.custom?.shadows?.lg || `0 12px 40px ${alpha(t.palette.text.primary, 0.15)}`, minWidth: 180, py: 0.5 } }}
                        >
                            {isOwn && onEditReview && (
                                <MenuItem onClick={() => { setRvMenuAnchor(null); onEditReview(review); }} sx={{ py: 1 }}>
                                    <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Edit review" />
                                </MenuItem>
                            )}
                            {isOwn && onDeleteReview && (
                                <MenuItem onClick={() => { setRvMenuAnchor(null); setRvDeleteConfirmOpen(true); }} sx={{ py: 1, color: 'error.main' }}>
                                    <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
                                    <ListItemText primary="Delete review" />
                                </MenuItem>
                            )}
                            {!isOwn && (
                                <MenuItem onClick={() => { setRvMenuAnchor(null); setRvReportIsReply(false); setRvReportOpen(true); }} sx={{ py: 1 }}>
                                    <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Report review" />
                                </MenuItem>
                            )}
                        </SmartMenu>
                    </>
                )}
            </Stack>

            {/* Title */}
            {review.title && (
                <Typography variant="body2" fontWeight={800} sx={{ mt: 0.75, lineHeight: 1.3 }}>
                    {review.title}
                </Typography>
            )}

            {/* Body text */}
            {review.text && (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        mt: 0.5,
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.6,
                        ...(compact && { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }),
                    }}
                >
                    {review.text}
                </Typography>
            )}

            {/* Photos – inside the card, clickable for lightbox */}
            {!compact && photos.length > 0 && (
                <Stack
                    direction="row"
                    spacing={0.75}
                    sx={{
                        mt: 1.5,
                        overflowX: 'auto',
                        pb: 0.5,
                        '&::-webkit-scrollbar': { height: 4 },
                        '&::-webkit-scrollbar-thumb': { borderRadius: 2, bgcolor: (t) => alpha(t.palette.common.black, 0.12) },
                    }}
                >
                    {photos.map((url, idx) => (
                        <Box
                            key={idx}
                            onClick={() => openLightbox(idx)}
                            sx={{
                                width: 88,
                                height: 88,
                                flexShrink: 0,
                                borderRadius: 2,
                                overflow: 'hidden',
                                border: '1px solid',
                                borderColor: 'divider',
                                cursor: 'pointer',
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

            {/* Owner reply – display with edit/delete for owner */}
            {!compact && review.ownerReply && !replyOpen && (
                <Box sx={(t) => ({ mt: 1.5, ml: 2, pl: 1.5, py: 1.25, borderLeft: '3px solid', borderColor: t.palette.primary.main, bgcolor: alpha(t.palette.primary.main, 0.04), borderRadius: '0 8px 8px 0' })}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
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
                        {isOwnBusiness && (
                            <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                                <IconButton size="small" onClick={handleOpenReply} sx={{ width: 28, height: 28 }}>
                                    <EditIcon sx={{ fontSize: 15 }} />
                                </IconButton>
                                <IconButton size="small" onClick={() => setDeleteConfirmOpen(true)} sx={{ width: 28, height: 28, color: 'error.main' }}>
                                    <DeleteIcon sx={{ fontSize: 15 }} />
                                </IconButton>
                            </Stack>
                        )}
                        {!isOwnBusiness && viewerId > 0 && (
                            <IconButton
                                size="small"
                                onClick={() => { setRvReportIsReply(true); setRvReportOpen(true); }}
                                sx={{ width: 28, height: 28, flexShrink: 0, color: 'text.secondary' }}
                            >
                                <MoreVertIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                        )}
                    </Stack>
                    <Typography sx={{ fontSize: '0.8rem', color: 'text.primary', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {review.ownerReply}
                    </Typography>
                    {/* Reply photos */}
                    {Array.isArray(review.replyPhotoUrls) && review.replyPhotoUrls.filter(Boolean).length > 0 && (
                        <Stack direction="row" spacing={0.75} sx={{ mt: 1, overflowX: 'auto', pb: 0.5, '&::-webkit-scrollbar': { height: 4 }, '&::-webkit-scrollbar-thumb': { borderRadius: 2, bgcolor: (t) => alpha(t.palette.common.black, 0.12) } }}>
                            {review.replyPhotoUrls.filter(Boolean).map((url, idx) => (
                                <Box key={idx} onClick={() => openLightbox(idx)} sx={{ width: 72, height: 72, flexShrink: 0, borderRadius: 1.5, overflow: 'hidden', cursor: 'pointer', border: '1px solid', borderColor: 'divider', '&:hover img': { transform: 'scale(1.05)' } }}>
                                    <Box component="img" src={url} alt={`Reply photo ${idx + 1}`} referrerPolicy="no-referrer" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 200ms ease' }} />
                                </Box>
                            ))}
                        </Stack>
                    )}
                </Box>
            )}

            {/* Inline reply form for owner */}
            {!compact && replyOpen && (
                <Box sx={(t) => ({ mt: 1.5, pl: 1.5, py: 1.5, borderLeft: '3px solid', borderColor: t.palette.primary.main, bgcolor: alpha(t.palette.primary.main, 0.04), borderRadius: '0 8px 8px 0' })}>
                    <Typography variant="body2" fontWeight={800} color="primary.dark" sx={{ mb: 1 }}>
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
                        sx={{ mb: 1, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' } }}
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
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" onClick={handleCancelReply} disabled={replySaving} sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}>
                            Cancel
                        </Button>
                        <Button
                            size="small"
                            variant="contained"
                            onClick={handleSaveReply}
                            disabled={replySaving || !replyText.trim()}
                            sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', borderRadius: 2 }}
                        >
                            {replySaving ? 'Saving...' : (review.ownerReply ? 'Update' : 'Post Reply')}
                        </Button>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'right' }}>
                        {replyText.length}/2000
                    </Typography>
                </Box>
            )}

            {/* Delete reply confirmation */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }} sx={{ zIndex: (t) => t.zIndex.modal + 55 }}>
                <DialogTitle sx={{ fontWeight: 700, pr: 6 }}>
                    Delete Response?
                    <IconButton onClick={() => setDeleteConfirmOpen(false)} sx={{ position: 'absolute', top: 8, right: 8 }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        This will permanently remove your response to this review.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteConfirmOpen(false)} disabled={replySaving} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDeleteReply} disabled={replySaving} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                        {replySaving ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Helpful button + Reply button for owner */}
            {!compact && (
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                    <Button
                        size="small"
                        disabled={helpfulBusy || isOwn || !viewerId}
                        startIcon={review.viewerFoundHelpful ? <ThumbUpIcon sx={{ fontSize: 14 }} /> : <ThumbUpOutlinedIcon sx={{ fontSize: 14 }} />}
                        onClick={handleHelpful}
                        sx={{
                            color: review.viewerFoundHelpful ? 'primary.main' : 'text.secondary',
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            borderRadius: 2,
                            px: 1,
                            minHeight: 0,
                            '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
                        }}
                    >
                        Helpful ({review.helpfulCount || 0})
                    </Button>
                    {isOwnBusiness && !review.ownerReply && !replyOpen && (
                        <Button
                            size="small"
                            startIcon={<ReplyIcon sx={{ fontSize: 14 }} />}
                            onClick={handleOpenReply}
                            sx={{
                                color: 'text.secondary',
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.75rem',
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
            )}

            {/* Review Photo Lightbox */}
            {photos.length > 0 && (
                <Dialog
                    open={lbOpen}
                    onClose={() => setLbOpen(false)}
                    maxWidth={false}
                    fullScreen={window.innerWidth < 900}
                    PaperProps={{
                        sx: window.innerWidth < 900
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
                    sx={{ zIndex: (t) => t.zIndex.modal + 55 }}
                >
                    <IconButton
                        onClick={() => setLbOpen(false)}
                        sx={{ position: 'absolute', top: 8, right: 8, color: 'common.white', zIndex: 2, bgcolor: (t) => alpha(t.palette.common.white, 0.15), '&:hover': { bgcolor: (t) => alpha(t.palette.common.white, 0.25) } }}
                    >
                        <CloseIcon />
                    </IconButton>
                    {photos.length > 1 && (
                        <Typography sx={{
                            position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
                            color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700, zIndex: 2,
                        }}>
                            {lbIndex + 1} / {photos.length}
                        </Typography>
                    )}
                    <Box
                        component="img"
                        src={photos[lbIndex]}
                        alt={`Review photo ${lbIndex + 1}`}
                        referrerPolicy="no-referrer"
                        sx={{ maxWidth: window.innerWidth < 900 ? '100vw' : '85vw', maxHeight: '80vh', objectFit: 'contain', userSelect: 'none' }}
                    />
                    {photos.length > 1 && (
                        <>
                            <IconButton
                                onClick={() => setLbIndex((prev) => (prev - 1 + photos.length) % photos.length)}
                                sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'common.white', bgcolor: (t) => alpha(t.palette.common.white, 0.15), '&:hover': { bgcolor: (t) => alpha(t.palette.common.white, 0.25) } }}
                            >
                                <ChevronLeftIcon />
                            </IconButton>
                            <IconButton
                                onClick={() => setLbIndex((prev) => (prev + 1) % photos.length)}
                                sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'common.white', bgcolor: (t) => alpha(t.palette.common.white, 0.15), '&:hover': { bgcolor: (t) => alpha(t.palette.common.white, 0.25) } }}
                            >
                                <ChevronRightIcon />
                            </IconButton>
                        </>
                    )}
                </Dialog>
            )}

            {/* User Card Popover for review avatar */}
            <UserCardPopover
                anchorEl={cardAnchorEl}
                onClose={handleCardClose}
                user={cardUser}
                isSelf={cardIsSelf}
                onViewProfile={handleCardViewProfile}
                viewProfileOnly={cardIsSelf}
            />

            {/* Review Report Dialog */}
            <ReportDialog
                open={rvReportOpen}
                onClose={() => { setRvReportOpen(false); setRvReportIsReply(false); }}
                onSubmit={async ({ reason, details }) => {
                    const reviewId = review?.id;
                    const bizId = businessId;
                    const isReply = rvReportIsReply;
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
                title={rvReportIsReply ? 'Report Reply' : 'Report Review'}
            />

            {/* Delete Review Confirmation Dialog */}
            {isOwn && onDeleteReview && (
                <Dialog open={rvDeleteConfirmOpen} onClose={() => { if (!rvDeleting) setRvDeleteConfirmOpen(false); }} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }} sx={{ zIndex: (t) => t.zIndex.modal + 55 }}>
                    <DialogTitle sx={{ fontWeight: 800, pb: 0.5 }}>Delete Your Review?</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary">
                            This will permanently remove your review. This action cannot be undone.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setRvDeleteConfirmOpen(false)} disabled={rvDeleting} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            disabled={rvDeleting}
                            onClick={async () => {
                                setRvDeleting(true);
                                try {
                                    await onDeleteReview(review);
                                    setRvDeleteConfirmOpen(false);
                                } catch { /* */ }
                                finally { setRvDeleting(false); }
                            }}
                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                        >
                            {rvDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </Box>
    );
}
function RatingBreakdownCompact({ ratings }) {
    const total = ratings.reduce((sum, r) => sum + r.count, 0) || 1;
    return (
        <Box>
            {[5, 4, 3, 2, 1].map((stars) => {
                const item = ratings.find((r) => r.stars === stars) || { count: 0 };
                const percentage = (item.count / total) * 100;
                return (
                    <Stack key={stars} direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.25 }}>
                        <Typography variant="caption" sx={{ minWidth: 10, fontSize: '0.65rem' }}>{stars}</Typography>
                        <StarIcon sx={{ fontSize: 10, color: 'warning.main' }} />
                        <Box sx={{ flex: 1 }}>
                            <LinearProgress
                                variant="determinate"
                                value={percentage}
                                sx={{ height: 6, borderRadius: 3, bgcolor: 'grey.200', '& .MuiLinearProgress-bar': { bgcolor: 'warning.main', borderRadius: 3 } }}
                            />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 16, fontSize: '0.65rem', textAlign: 'right' }}>{item.count}</Typography>
                    </Stack>
                );
            })}
        </Box>
    );
}

// ============================
// BusinessPostCard Component
// ============================
function BusinessPostCard({ post, compact = false, canPin = false, canEdit = false, onPin, onUnpin, onEdit, onDelete, onReport, user, onShare, businessSlug, navigate, business, onBeforeNavigate, onPostClick }) {
    const theme = useTheme();
    const bpcIsMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [pinning, setPinning] = useState(false);
    const [bodyExpanded, setBodyExpanded] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const postType = post.type?.toLowerCase() || 'update';
    const isDeal = postType === 'deal';
    const isAnnouncement = postType === 'announcement';
    const dealExpired = isDeal && post.validUntil && isExpired(post.validUntil);
    const isPinned = Boolean(post.isPinned);

    // Character limit for truncated body
    const BODY_CHAR_LIMIT = 280;
    const shouldTruncateBody = post.body && post.body.length > BODY_CHAR_LIMIT && !bodyExpanded;

    // Handler for comment click - open post popup or navigate to post page
    const handleCommentClick = () => {
        if (typeof onPostClick === 'function') {
            onPostClick(post);
            return;
        }
        const slug = businessSlug || business?.slug || business?.handle;
        if (slug && navigate) {
            if (typeof onBeforeNavigate === 'function') onBeforeNavigate();
            navigate(`/${slug}/posts/${post.id}`, {
                state: { post, business, from: 'business', fromBusiness: true, backBusinessSlug: slug, backBusinessName: business?.name || '' }
            });
        }
    };

    // Parse media URLs (could be JSON array or single URL)
    let mediaUrls = [];
    if (post.mediaUrl) {
        try {
            const parsed = JSON.parse(post.mediaUrl);
            mediaUrls = Array.isArray(parsed) ? parsed : [post.mediaUrl];
        } catch {
            mediaUrls = [post.mediaUrl];
        }
    }

    const openLightbox = (index) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const handleMenuOpen = (e) => {
        e.stopPropagation();
        setMenuAnchor(e.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
    };

    const handlePinToggle = async () => {
        handleMenuClose();
        setPinning(true);
        try {
            if (isPinned) {
                await onUnpin(post.id);
            } else {
                await onPin(post.id);
            }
        } catch (err) {
            // Handle error silently or show snackbar
        } finally {
            setPinning(false);
        }
    };

    const handleCardClick = (e) => {
        // Don't navigate if clicking on interactive elements
        const target = e.target;
        const isInteractive = target.closest('button, a, [role="button"], .MuiChip-root, .MuiIconButton-root, .MuiMenu-root, .MuiDialog-root, [data-interactive="true"]');
        if (isInteractive) return;

        // Open post in popup if handler provided, otherwise navigate
        if (typeof onPostClick === 'function') {
            onPostClick(post);
            return;
        }
        const slug = businessSlug || business?.slug || business?.handle;
        if (slug && navigate) {
            if (typeof onBeforeNavigate === 'function') onBeforeNavigate();
            navigate(`/${slug}/posts/${post.id}`, {
                state: { post, business, from: 'business', fromBusiness: true, backBusinessSlug: slug, backBusinessName: business?.name || '' }
            });
        }
    };

    // Type-specific styling
    const typeStyles = {
        deal: {
            accent: theme.palette.success.main,
            accentLight: 'transparent',
            accentBorder: alpha(theme.palette.success.main, 0.25),
            chipBg: alpha(theme.palette.success.main, 0.12),
            chipColor: theme.palette.success.dark,
            icon: <DealIcon sx={{ fontSize: 16 }} />,
        },
        announcement: {
            accent: theme.palette.info.main,
            accentLight: 'transparent',
            accentBorder: alpha(theme.palette.info.main, 0.2),
            chipBg: alpha(theme.palette.info.main, 0.12),
            chipColor: theme.palette.info.dark,
            icon: <CampaignIcon sx={{ fontSize: 16 }} />,
        },
        update: {
            accent: theme.palette.warning.main,
            accentLight: 'transparent',
            accentBorder: 'transparent',
            chipBg: alpha(theme.palette.warning.main, 0.12),
            chipColor: theme.palette.warning.dark,
            icon: <PostsIcon sx={{ fontSize: 16 }} />,
        },
    };

    const style = typeStyles[postType] || typeStyles.update;

    // Photo grid layout helper
    const renderPhotoGrid = () => {
        if (mediaUrls.length === 0 || compact) return null;

        const count = mediaUrls.length;

        const imgCell = (url, idx, sx = {}) => (
            <Box
                key={idx}
                onClick={(e) => { e.stopPropagation(); openLightbox(idx); }}
                sx={{
                    position: 'relative', cursor: 'pointer', overflow: 'hidden',
                    '&:hover img': { transform: 'scale(1.03)' },
                    ...sx,
                }}
            >
                <Box component="img" src={url} alt="" sx={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: 'cover', display: 'block',
                    transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                }} />
            </Box>
        );

        const overlayBadge = (extra) => (
            <Box sx={{
                position: 'absolute', inset: 0,
                bgcolor: (t) => alpha(t.palette.common.black, 0.55),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
            }}>
                <Typography sx={{ color: 'common.white', fontWeight: 800, fontSize: '1.5rem' }}>+{extra}</Typography>
            </Box>
        );

        if (count === 1) {
            return (
                <Box sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                    <Box onClick={(e) => { e.stopPropagation(); openLightbox(0); }}
                         sx={{ position: 'relative', cursor: 'pointer', '&:hover img': { transform: 'scale(1.02)' } }}>
                        <Box component="img" src={mediaUrls[0]} alt="" sx={{
                            width: '100%', maxHeight: 520, objectFit: 'cover', display: 'block',
                            transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                        }} />
                    </Box>
                </Box>
            );
        }
        if (count === 2) {
            return (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 220, sm: 280, md: 320 } }}>
                    {imgCell(mediaUrls[0], 0)}
                    {imgCell(mediaUrls[1], 1)}
                </Box>
            );
        }
        if (count === 3) {
            return (
                <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gridTemplateRows: '1fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 260, sm: 340, md: 400 } }}>
                    {imgCell(mediaUrls[0], 0, { gridRow: '1 / 3' })}
                    {imgCell(mediaUrls[1], 1)}
                    {imgCell(mediaUrls[2], 2)}
                </Box>
            );
        }
        if (count === 4) {
            return (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '2fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 300, sm: 380, md: 440 } }}>
                    {imgCell(mediaUrls[0], 0, { gridColumn: '1 / 4' })}
                    {imgCell(mediaUrls[1], 1)}
                    {imgCell(mediaUrls[2], 2)}
                    {imgCell(mediaUrls[3], 3)}
                </Box>
            );
        }
        // 5+ photos
        const extra = count - 5;
        return (
            <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 2fr 2fr', gridTemplateRows: '1fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 280, sm: 360, md: 420 } }}>
                {imgCell(mediaUrls[0], 0, { gridRow: '1 / 3' })}
                {imgCell(mediaUrls[1], 1)}
                {imgCell(mediaUrls[2], 2)}
                {imgCell(mediaUrls[3], 3)}
                <Box onClick={(e) => { e.stopPropagation(); openLightbox(4); }}
                     sx={{ position: 'relative', cursor: 'pointer', overflow: 'hidden', '&:hover img': { transform: 'scale(1.03)' } }}>
                    <Box component="img" src={mediaUrls[4]} alt="" sx={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%',
                        objectFit: 'cover', display: 'block',
                        transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                    }} />
                    {extra > 0 && overlayBadge(extra)}
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
                    borderBottom: '2px solid',
                    borderColor: (t) => alpha(t.palette.text.primary, 0.10),
                    '&:last-child': { borderBottom: 'none' },
                    bgcolor: 'transparent',
                    mx: { xs: -2, sm: -3 },
                    px: { xs: 2, sm: 3 },
                    cursor: 'pointer',
                    transition: (t) => `background-color ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                    overflow: 'hidden',
                    '&:hover': {
                        bgcolor: (t) => alpha(t.palette.text.primary, 0.03),
                    },
                }}
            >
                {/* Post Header */}
                <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.5 }}>
                    <Avatar
                        src={business?.avatar_url}
                        sx={(t) => ({ width: 40, height: 40, bgcolor: alpha(t.palette.primary.main, 0.08), color: 'primary.main', border: '2px solid', borderColor: alpha(t.palette.text.primary, 0.06) })}
                    >
                        <StorefrontOutlinedIcon sx={{ fontSize: 22 }} />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap">
                            <Typography variant="body2" fontWeight={700} noWrap>{business?.name}</Typography>
                            {!!business?.is_verified && <VerifiedIcon sx={{ fontSize: 14, color: 'info.main' }} />}
                        </Stack>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            {(business?.slug || business?.handle) && (
                                <Typography variant="caption" color="text.secondary" noWrap sx={{ lineHeight: 1.2 }}>
                                    @{business?.slug || business?.handle}
                                </Typography>
                            )}
                            <Typography variant="caption" color="text.disabled">·</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>{formatRelativeTime(post.createdAt)}</Typography>
                            {Boolean(post?.edited_at || post?.editedAt || (post?.updated_at && post?.created_at && String(post.updated_at) !== String(post.created_at))) && (
                                <>
                                    <Typography variant="caption" color="text.disabled">·</Typography>
                                    <Typography
                                        variant="caption"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            try {
                                                window.dispatchEvent(new CustomEvent('ll:businessPost:requestHistory', { detail: { postId: post.id, post } }));
                                            } catch { /* ignore */ }
                                        }}
                                        sx={{ fontWeight: 600, cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                                    >
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
                                icon={<PushPinIcon sx={{ fontSize: 14, transform: 'rotate(45deg)' }} />}
                                label="Pinned"
                                size="small"
                                sx={{
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                    bgcolor: (t) => alpha(t.palette.warning.main, 0.10),
                                    border: (t) => `1px solid ${alpha(t.palette.warning.main, 0.28)}`,
                                    color: 'warning.dark',
                                    '& .MuiChip-icon': { color: 'warning.dark' },
                                }}
                            />
                        )}
                        <IconButton
                            size="small"
                            onClick={handleMenuOpen}
                            disabled={pinning}
                            sx={{ flexShrink: 0, color: 'text.secondary' }}
                        >
                            {pinning ? <CircularProgress size={16} /> : <MoreVertIcon sx={{ fontSize: 18 }} />}
                        </IconButton>
                        <SmartMenu
                            anchorEl={menuAnchor}
                            open={Boolean(menuAnchor)}
                            onClose={handleMenuClose}
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
                            {[
                                canEdit ? (
                                    <MenuItem key="edit" onClick={() => { handleMenuClose(); onEdit?.(post); }} sx={{ py: 1 }}>
                                        <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                                        <ListItemText primary="Edit post" />
                                    </MenuItem>
                                ) : null,
                                canEdit ? (
                                    <MenuItem key="delete" onClick={() => { handleMenuClose(); setDeleteConfirmOpen(true); }} sx={{ py: 1, color: 'error.main' }}>
                                        <ListItemIcon sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" /></ListItemIcon>
                                        <ListItemText primary="Delete post" />
                                    </MenuItem>
                                ) : null,
                                canEdit ? <Divider key="divider" sx={{ my: 0.5 }} /> : null,
                                canPin ? (
                                    <MenuItem key="pin" onClick={handlePinToggle} sx={{ py: 1 }}>
                                        <ListItemIcon>{isPinned ? <PushPinOutlinedIcon fontSize="small" /> : <PushPinIcon fontSize="small" />}</ListItemIcon>
                                        <ListItemText primary={isPinned ? 'Unpin post' : 'Pin to top'} />
                                    </MenuItem>
                                ) : null,
                                !canEdit ? (
                                    <MenuItem key="report" onClick={() => { handleMenuClose(); onReport?.(post); }} sx={{ py: 1 }}>
                                        <ListItemIcon><FlagIcon fontSize="small" /></ListItemIcon>
                                        <ListItemText primary="Report post" />
                                    </MenuItem>
                                ) : null,
                            ].filter(Boolean)}
                        </SmartMenu>
                    </Stack>
                </Stack>

                {/* Type badges */}
                {(postType !== 'update' || dealExpired) && (
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75, flexWrap: 'wrap' }}>
                        {postType !== 'update' && (
                            <Chip
                                icon={style.icon}
                                label={postType.charAt(0).toUpperCase() + postType.slice(1)}
                                size="small"
                                sx={{
                                    height: 24,
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    bgcolor: style.chipBg,
                                    color: style.chipColor,
                                    '& .MuiChip-icon': { color: style.chipColor },
                                }}
                            />
                        )}
                        {dealExpired && (
                            <Chip label="Expired" size="small" sx={{ height: 24, fontSize: '0.72rem', fontWeight: 600, bgcolor: 'error.light', color: 'error.contrastText' }} />
                        )}
                    </Stack>
                )}

                {/* Title */}
                {post.title && (
                    <Typography
                        variant="h6"
                        sx={{
                            mt: 0,
                            fontSize: '1rem',
                            fontWeight: 700,
                            letterSpacing: '-0.01em',
                            lineHeight: 1.3,
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere',
                            mb: 0.5,
                        }}
                    >
                        {post.title}
                    </Typography>
                )}

                {/* Deal discount inline */}
                {isDeal && post.discountText && !dealExpired && (
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
                        <DealIcon sx={{ fontSize: 16, color: 'success.dark' }} />
                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'success.dark' }}>
                            {post.discountText}
                        </Typography>
                    </Stack>
                )}

                {/* Body preview */}
                {post.body && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            mt: 0.25,
                            lineHeight: 1.5,
                            fontSize: '0.85rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere',
                            whiteSpace: 'pre-wrap',
                        }}
                    >
                        {post.body.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()}
                    </Typography>
                )}

                {/* Valid until for deals */}
                {isDeal && post.validUntil && (
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                        <ScheduleIcon sx={{ fontSize: 13, color: dealExpired ? 'error.main' : 'text.secondary' }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, color: dealExpired ? 'error.main' : 'text.secondary' }}>
                            {dealExpired ? 'Expired' : `Until ${formatDate(post.validUntil)}`}
                        </Typography>
                    </Stack>
                )}

                {/* Full-width photo grid — matches community PostList */}
                {mediaUrls.length > 0 && (
                    <Box sx={{ mt: 1.5 }}>
                        {renderPhotoGrid()}
                    </Box>
                )}

                {/* Location — below photos, matches PostList pattern */}
                {(() => {
                    const locCity = String(post?.city || business?.city || '').trim();
                    const locCounty = String(post?.county || business?.county || '').trim();
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
                            <LocationIcon className="post-loc-icon" sx={{ fontSize: 15, color: 'primary.main', transition: (t) => `color ${t.custom?.motion?.fast || 150}ms ${t.custom?.motion?.ease || 'ease'}` }} />
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

                {/* Action bar — fit-content wrapper so clicking empty space on this line opens the post */}
                <Box sx={{ mt: 1.5 }}>
                    <Box onClick={(e) => e.stopPropagation()} sx={{ width: 'fit-content' }}>
                        <ActionBar
                            variant="business"
                            user={user}
                            postId={post.id}
                            post={post}
                            initialLikes={Number(post.likesCount ?? post.likes_count ?? post.like_count ?? post.likeCount ?? post.likes ?? 0) || 0}
                            initiallyLiked={Boolean(post.viewerLiked ?? post.viewer_liked ?? post.liked ?? post.is_liked)}
                            commentsCount={Number(post.commentsCount ?? post.comments_count ?? post.comment_count ?? post.commentCount ?? post.comments ?? 0) || 0}
                            initialReposts={Number(post.repostsCount ?? post.reposts_count ?? post.repost_count ?? post.repostCount ?? post.reposts ?? 0) || 0}
                            initiallyReposted={Boolean(post.viewerReposted ?? post.viewer_reposted ?? post.reposted ?? post.is_reposted)}
                            useShareDialog
                            onComment={handleCommentClick}
                        />
                    </Box>
                </Box>
            </Box>

            {/* Lightbox */}
            <Dialog
                open={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                fullScreen={bpcIsMobile}
                maxWidth="lg"
                fullWidth
                sx={{ zIndex: (t) => t.zIndex.modal + 50 }}
                PaperProps={{ sx: { bgcolor: 'common.black', ...(!bpcIsMobile && { maxHeight: '90vh' }), overflow: 'hidden' } }}
            >
                <IconButton
                    onClick={() => setLightboxOpen(false)}
                    sx={{ position: 'absolute', ...topRightInsetSx(), color: 'common.white', zIndex: 1, bgcolor: (t) => alpha(t.palette.common.black, 0.55), '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.75) } }}
                >
                    <CloseIcon />
                </IconButton>
                {mediaUrls.length > 1 && (
                    <>
                        <IconButton
                            onClick={() => setLightboxIndex((prev) => (prev - 1 + mediaUrls.length) % mediaUrls.length)}
                            sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'common.white', bgcolor: (t) => alpha(t.palette.common.black, 0.50), '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.70) } }}
                        >
                            <ChevronLeftIcon />
                        </IconButton>
                        <IconButton
                            onClick={() => setLightboxIndex((prev) => (prev + 1) % mediaUrls.length)}
                            sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'common.white', bgcolor: (t) => alpha(t.palette.common.black, 0.50), '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.70) } }}
                        >
                            <ChevronRightIcon />
                        </IconButton>
                    </>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, height: bpcIsMobile ? '100%' : '80vh' }}>
                    <Box
                        component="img"
                        src={mediaUrls[lightboxIndex]}
                        alt=""
                        sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                </Box>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight={700}>Delete Post?</Typography>
                    <IconButton onClick={() => setDeleteConfirmOpen(false)} size="small"><CloseIcon /></IconButton>
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
// PhotoGallery Component
// ============================
function PhotoGallery({ images = [], businessName, maxDisplay = 8, isOverview = false, onViewAll, onPhotoClick }) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const pgIsMobile = useMediaQuery((t) => t.breakpoints.down('sm'));

    const displayImages = images.slice(0, maxDisplay);
    const remaining = images.length - maxDisplay;

    const handlePhotoClick = (img, index) => {
        if (onPhotoClick) {
            // Accept whichever ID field the API/data layer happens to use.
            const photoId = typeof img === 'string'
                ? null
                : (img.id || img.photo_id || img.photoId || img.record_id || img.recordId || null);
            const photoUrl = typeof img === 'string' ? img : (img.url || img.photo_url || img.photoUrl);
            // Diagnostic — remove once gallery comments confirmed working
            // eslint-disable-next-line no-console
            console.log('[BizPhotoGallery] click', { photoId, photoUrl, index, raw: img });
            onPhotoClick(photoId, photoUrl, index);
        } else {
            setLightboxIndex(index);
            setLightboxOpen(true);
        }
    };

    if (displayImages.length === 0) return null;

    return (
        <>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: isOverview ? 'repeat(2, 1fr)' : { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
                    gap: 1,
                }}
            >
                {displayImages.map((img, idx) => {
                    const isLastWithMore = idx === maxDisplay - 1 && remaining > 0;
                    return (
                        <Box
                            key={idx}
                            onClick={() => handlePhotoClick(img, idx)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePhotoClick(img, idx); }}
                            sx={{
                                position: 'relative',
                                paddingTop: '100%',
                                borderRadius: 2,
                                overflow: 'hidden',
                                cursor: 'pointer',
                                '&:hover img': { transform: 'scale(1.05)' },
                            }}
                        >
                            <Box
                                component="img"
                                src={typeof img === 'string' ? img : img.url}
                                alt={`${businessName} photo ${idx + 1}`}
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transition: (t) => `transform ${t.custom.motion.slow}ms ${t.custom.motion.ease}`,
                                }}
                            />
                            {isLastWithMore && (
                                <Box
                                    onClick={(e) => { e.stopPropagation(); onViewAll?.(); }}
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        bgcolor: (t) => alpha(t.palette.common.black, 0.50),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Typography variant="h5" fontWeight={700} color="white">+{remaining}</Typography>
                                </Box>
                            )}
                        </Box>
                    );
                })}
            </Box>

            <Dialog
                open={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                fullScreen={pgIsMobile}
                maxWidth="lg"
                fullWidth
                sx={{ zIndex: (t) => t.zIndex.modal + 50 }}
                PaperProps={{ sx: { bgcolor: 'common.black', ...(!pgIsMobile && { maxHeight: '90vh' }), overflow: 'hidden' } }}
            >
                <IconButton onClick={() => setLightboxOpen(false)} sx={{ position: 'absolute', ...topRightInsetSx(), color: 'common.white', zIndex: 1, bgcolor: (t) => alpha(t.palette.common.black, 0.55), '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.75) } }}><CloseIcon /></IconButton>
                {images.length > 1 && (
                    <>
                        <IconButton
                            onClick={() => setLightboxIndex((prev) => (prev - 1 + images.length) % images.length)}
                            sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'common.white', bgcolor: (t) => alpha(t.palette.common.black, 0.50), '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.70) } }}
                        >
                            <ChevronLeftIcon />
                        </IconButton>
                        <IconButton
                            onClick={() => setLightboxIndex((prev) => (prev + 1) % images.length)}
                            sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'common.white', bgcolor: (t) => alpha(t.palette.common.black, 0.50), '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.70) } }}
                        >
                            <ChevronRightIcon />
                        </IconButton>
                    </>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, height: pgIsMobile ? '100%' : '80vh' }}>
                    <Box
                        component="img"
                        src={typeof images[lightboxIndex] === 'string' ? images[lightboxIndex] : images[lightboxIndex]?.url}
                        alt=""
                        sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                </Box>
            </Dialog>
        </>
    );
}

// ============================
// BusinessHoursDisplay Component
// ============================
function BusinessHoursDisplay({ hours, specialHours }) {
    const currentDay = getCurrentDayName();
    const todayKey = formatDateKeyLocal(new Date());
    const todaySpecial = findSpecialHoursForDate(specialHours, todayKey);

    if (!hours || !hasAnyHoursSet(hours)) {
        return (
            <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 1 }}>
                    <TimeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        Hours not available
                    </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Contact the business for hours information
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            {DAY_NAMES.map((day) => {
                const dayHours = hours[day];
                const isToday = day === currentDay;
                let hoursText = '-';

                if (isToday && todaySpecial) {
                    if (todaySpecial.closed) hoursText = 'Closed';
                    else if (todaySpecial.allDay) hoursText = 'Open 24 hours';
                    else if (todaySpecial.open && todaySpecial.close) hoursText = `${formatHoursTime(todaySpecial.open)} - ${formatHoursTime(todaySpecial.close)}`;
                } else if (dayHours) {
                    if (dayHours.closed) hoursText = '-';
                    else if (dayHours.allDay) hoursText = 'Open 24 hours';
                    else if (dayHours.open && dayHours.close) hoursText = `${formatHoursTime(dayHours.open)} - ${formatHoursTime(dayHours.close)}`;
                }

                return (
                    <Stack
                        key={day}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{
                            py: 0.75,
                            px: 1,
                            mx: -1,
                            borderRadius: 1,
                            bgcolor: isToday ? (t) => alpha(t.palette.primary.main, 0.08) : 'transparent',
                        }}
                    >
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body2" fontWeight={isToday ? 700 : 400} sx={{ minWidth: 36 }}>{DAY_LABELS[day]}</Typography>
                            {isToday && <Chip label="Today" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, bgcolor: 'primary.main', color: 'common.white' }} />}
                            {isToday && todaySpecial && <Chip label="Temporary" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'warning.main', color: 'common.white' }} />}
                        </Stack>
                        <Typography variant="body2" color={isToday ? 'primary.main' : 'text.secondary'} fontWeight={isToday ? 600 : 400}>{hoursText}</Typography>
                    </Stack>
                );
            })}
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1.5, color: 'text.secondary' }}>
                <TimeIcon sx={{ fontSize: 14 }} />
                <Typography variant="caption">Hours may vary (holidays & temporary hours)</Typography>
            </Stack>
        </Box>
    );
}

// ============================
// WriteReviewDialog Component
// ============================
function WriteReviewDialog({ open, onClose, businessId, businessName, existingReview, onSaved, onSuccess, isOwnBusiness = false, isNonPersonalAccount = false }) {
    const wrdTheme = useTheme();
    const wrdIsMobile = useMediaQuery(wrdTheme.breakpoints.down('md'));
    const [rating, setRating] = useState(0);
    const [title, setTitle] = useState('');
    const [reviewBody, setReviewBody] = useState('');
    const [photos, setPhotos] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);

    // Pre-fill when editing an existing review
    useEffect(() => {
        if (open && existingReview) {
            setRating(existingReview.rating || 0);
            setTitle(existingReview.title || '');
            setReviewBody(existingReview.body || '');
            // Convert existing photo URLs into the shape PhotosUploadSection expects
            const existingPhotos = Array.isArray(existingReview.photoUrls) ? existingReview.photoUrls : [];
            setPhotos(existingPhotos.filter(Boolean).map((url) => ({ id: url, url, _existing: true })));
        } else if (open) {
            setRating(0);
            setTitle('');
            setReviewBody('');
            setPhotos([]);
        }
        setError('');
    }, [open, existingReview]);

    const handleClose = () => {
        photos.forEach((p) => { if (p?.url && !p._existing) { try { URL.revokeObjectURL(p.url); } catch {} } });
        setRating(0);
        setTitle('');
        setReviewBody('');
        setPhotos([]);
        setError('');
        setDeleteConfirmOpen(false);
        onClose();
    };

    const handleSubmit = async () => {
        if (isOwnBusiness) {
            setError('Business owners cannot review their own business.');
            return;
        }
        if (isNonPersonalAccount) {
            setError('Please switch to your personal account to leave a review.');
            return;
        }
        if (!rating) { setError('Please select a rating.'); return; }
        setSubmitting(true);
        setError('');
        try {
            // Separate existing URLs (kept) from new File objects (to upload)
            const existingUrls = photos.filter((p) => p._existing).map((p) => p.url);
            const newFiles = photos.filter((p) => p.file instanceof File).map((p) => p.file);

            await submitBusinessReview(businessId, {
                rating,
                title,
                body: reviewBody,
                photos: newFiles,
                _existingPhotoUrls: existingUrls,
            });
            handleClose();
            if (onSaved) onSaved();
            if (onSuccess) onSuccess(existingReview ? 'Review updated' : 'Review submitted');
        } catch (err) {
            setError(String(err?.message || 'Failed to submit review.'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteReview = async () => {
        setDeleteSubmitting(true);
        try {
            await deleteBusinessReview(businessId);
            setDeleteConfirmOpen(false);
            handleClose();
            if (onSaved) onSaved();
            if (onSuccess) onSuccess('Review deleted');
        } catch (err) {
            setError(String(err?.message || 'Failed to delete review.'));
            setDeleteConfirmOpen(false);
        } finally {
            setDeleteSubmitting(false);
        }
    };

    // Shared form content used by both mobile Drawer and desktop Dialog
    const reviewFormContent = (isOwnBusiness || isNonPersonalAccount) ? (
        <Box
            sx={{
                py: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
            }}
        >
            <Box
                sx={(t) => ({
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    bgcolor: alpha(t.palette.primary.main, 0.08),
                    color: 'primary.main',
                })}
            >
                <ReviewIcon sx={{ fontSize: 30 }} />
            </Box>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                {isOwnBusiness ? 'You cannot review your own business.' : 'Switch to your personal account'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320 }}>
                {isOwnBusiness
                    ? 'Business owners cannot leave reviews on their own business.'
                    : 'Reviews must be left from your personal profile. Switch to your personal account to leave a review.'}
            </Typography>
        </Box>
    ) : (
        <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Share your experience with {businessName}
            </Typography>
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Your Rating *</Typography>
                <Rating value={rating} precision={1} onChange={(_e, newVal) => setRating(newVal || 0)} size="large" />
            </Box>
            <TextField fullWidth label="Review Title (optional)" value={title} onChange={(e) => setTitle(e.target.value.slice(0, 160))} size="small" sx={{ mb: 2 }} inputProps={{ maxLength: 160 }} />
            <TextField fullWidth multiline rows={4} label="Your Review" value={reviewBody} onChange={(e) => setReviewBody(e.target.value)} placeholder="What did you like or dislike? What was the service like?" sx={{ mb: 2 }} />
            <PhotosUploadSection
                photos={photos}
                setPhotos={setPhotos}
                disabled={submitting}
                maxPhotos={4}
                title="Photos (optional)"
                helperText="Add up to 4 photos of your experience."
                addButtonText="Add photos"
            />
            {error && <Typography variant="body2" color="error" fontWeight={700} sx={{ mt: 1 }}>{error}</Typography>}
        </>
    );

    const reviewActions = (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: (isOwnBusiness || isNonPersonalAccount) ? 'flex-end' : (existingReview ? 'space-between' : 'flex-end'), width: '100%', gap: 1, flexWrap: 'wrap' }}>
            {!isOwnBusiness && !isNonPersonalAccount && existingReview && (
                <Button
                    color="error"
                    startIcon={<DeleteOutlineIcon sx={{ fontSize: '18px !important' }} />}
                    onClick={() => setDeleteConfirmOpen(true)}
                    disabled={submitting}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                    Delete
                </Button>
            )}
            <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                <Button onClick={handleClose} disabled={submitting} sx={{ textTransform: 'none', fontWeight: 700 }}>Close</Button>
                {!isOwnBusiness && !isNonPersonalAccount && (
                    <Button variant="contained" disabled={!rating || submitting} onClick={handleSubmit} sx={{ textTransform: 'none', fontWeight: 800 }}>
                        {submitting ? 'Saving…' : (existingReview ? 'Update Review' : 'Submit Review')}
                    </Button>
                )}
            </Box>
        </Box>
    );

    return (
        <>
            {/* ── Mobile: fullscreen Drawer ── */}
            {wrdIsMobile ? (
                <Drawer
                    anchor="bottom"
                    open={open && !deleteConfirmOpen}
                    onClose={submitting ? undefined : handleClose}
                    transitionDuration={{ enter: 300, exit: 240 }}
                    PaperProps={{
                        sx: {
                            width: '100%',
                            height: '100%',
                            borderRadius: 0,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        },
                    }}
                    ModalProps={{ keepMounted: false }}
                    sx={{ zIndex: (t) => t.zIndex.modal + 50 }}
                >
                    {/* Top bar */}
                    <Box
                        sx={(t) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 0.5,
                            py: 0.25,
                            minHeight: 46,
                            borderBottom: '1px solid',
                            borderColor: alpha(t.palette.divider, 0.1),
                            bgcolor: t.palette.background.paper,
                            flexShrink: 0,
                        })}
                    >
                        <IconButton
                            onClick={handleClose}
                            disabled={submitting}
                            size="small"
                            aria-label="Back"
                            sx={{ width: 36, height: 36 }}
                        >
                            <ArrowBackRoundedIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 800, fontSize: 15, flex: 1 }}>
                            {existingReview ? 'Edit Your Review' : 'Write a Review'}
                        </Typography>
                    </Box>

                    {/* Scrollable content */}
                    <Box sx={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', px: 2, py: 2 }}>
                        {reviewFormContent}
                    </Box>

                    {/* Bottom actions */}
                    <Box sx={(t) => ({ px: 2, py: 1.5, borderTop: '1px solid', borderColor: alpha(t.palette.divider, 0.1), bgcolor: t.palette.background.paper, flexShrink: 0 })}>
                        {reviewActions}
                        {submitting && <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />}
                    </Box>
                </Drawer>
            ) : (
                /* ── Desktop: standard Dialog ── */
                <Dialog open={open && !deleteConfirmOpen} onClose={submitting ? undefined : handleClose} maxWidth="sm" fullWidth disableScrollLock>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6" fontWeight={800}>{existingReview ? 'Edit Your Review' : 'Write a Review'}</Typography>
                        <IconButton onClick={handleClose} disabled={submitting} size="small"><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent>
                        {reviewFormContent}
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3, justifyContent: (isOwnBusiness || isNonPersonalAccount) ? 'flex-end' : (existingReview ? 'space-between' : 'flex-end') }}>
                        {reviewActions}
                    </DialogActions>
                    {submitting && <LinearProgress />}
                </Dialog>
            )}

            {/* Delete Review Confirmation Dialog */}
            <Dialog
                open={deleteConfirmOpen}
                onClose={deleteSubmitting ? undefined : () => setDeleteConfirmOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
            >
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Box sx={(t) => ({
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        bgcolor: alpha(t.palette.error.main, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                    })}>
                        <DeleteOutlineIcon sx={{ fontSize: 28, color: 'error.main' }} />
                    </Box>
                    <Typography variant="h6" fontWeight={900} sx={{ mb: 0.75 }}>
                        Delete Your Review?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, mb: 2.5, maxWidth: 280, mx: 'auto' }}>
                        This will permanently remove your review and rating. This action cannot be undone.
                    </Typography>
                    <Stack direction="row" spacing={1.5} justifyContent="center">
                        <Button
                            onClick={() => setDeleteConfirmOpen(false)}
                            disabled={deleteSubmitting}
                            sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2, px: 3 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleDeleteReview}
                            disabled={deleteSubmitting}
                            startIcon={deleteSubmitting ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon sx={{ fontSize: '16px !important' }} />}
                            sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2, px: 3 }}
                        >
                            {deleteSubmitting ? 'Deleting…' : 'Delete Review'}
                        </Button>
                    </Stack>
                </Box>
            </Dialog>
        </>
    );
}

// ============================
// CreatePostDialog Component
// ============================
function CreatePostDialog({ open, onClose, businessId, businessName, onPostCreated }) {
    const theme = useTheme();
    const [postType, setPostType] = useState('update');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [photos, setPhotos] = useState([]);
    const [discountText, setDiscountText] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [terms, setTerms] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const isDeal = postType === 'deal';

    const handleClose = () => {
        // Revoke object URLs for photos
        photos.forEach(p => {
            if (p?.url) {
                try { URL.revokeObjectURL(p.url); } catch {}
            }
        });
        setPostType('update');
        setTitle('');
        setBody('');
        setPhotos([]);
        setDiscountText('');
        setValidUntil('');
        setTerms('');
        setError(null);
        onClose();
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError(null);
        try {
            // Convert photos to format expected by API
            const photoFiles = photos.map(p => ({ file: p.file }));

            const postData = {
                type: postType,
                title: title.trim(),
                body: body.trim(),
                photos: photoFiles,
            };

            if (isDeal) {
                postData.discount_text = discountText.trim();
                if (validUntil) postData.valid_until = validUntil;
                if (terms) postData.terms = terms.trim();
            }

            await createBusinessPost(businessId, postData);
            handleClose();
            onPostCreated?.();
        } catch (err) {
            setError(err?.message || 'Failed to create post. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const today = new Date();
    const minDate = today.toISOString().split('T')[0];

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { maxHeight: '90vh' }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                <Typography variant="h6" fontWeight={800}>New Post</Typography>
                <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ overflowY: 'auto', overflowX: 'hidden' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Share an update with your followers as {businessName}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="post-type-label">Post Type</InputLabel>
                    <Select
                        labelId="post-type-label"
                        value={postType}
                        label="Post Type"
                        onChange={(e) => setPostType(e.target.value)}
                    >
                        {POST_TYPES.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                                <Stack>
                                    <Typography variant="body2" fontWeight={600}>{type.label}</Typography>
                                    <Typography variant="caption" color="text.secondary">{type.description}</Typography>
                                </Stack>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

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

                {isDeal && (
                    <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: 2, border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.2) }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <DealIcon sx={{ fontSize: 18 }} /> Deal Details
                        </Typography>

                        <TextField
                            fullWidth
                            label="Discount/Offer"
                            value={discountText}
                            onChange={(e) => setDiscountText(e.target.value)}
                            sx={{ mb: 2 }}
                            placeholder='e.g., "20% off all pizzas" or "Buy 1 Get 1 Free"'
                            inputProps={{ maxLength: 100 }}
                            required
                        />

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                            <TextField
                                fullWidth
                                label="Valid Until (optional)"
                                type="date"
                                value={validUntil}
                                onChange={(e) => setValidUntil(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ min: minDate }}
                            />
                        </Stack>

                        <TextField
                            fullWidth
                            label="Terms & Conditions (optional)"
                            value={terms}
                            onChange={(e) => setTerms(e.target.value)}
                            multiline
                            rows={2}
                            placeholder="e.g., Cannot be combined with other offers. Valid for dine-in only."
                        />
                    </Paper>
                )}

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
                        maxLength={5000}
                        placeholder={isDeal ? "Add more details about this deal..." : "Tell your followers what's happening..."}
                        minRows={10}
                    />
                </Box>

                <PhotosUploadSection
                    photos={photos}
                    setPhotos={setPhotos}
                    disabled={submitting}
                    maxPhotos={MAX_POST_PHOTOS}
                    title="Photos"
                    helperText="Add photos to make your post stand out"
                    addButtonText="Add photos"
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!title.trim() || (isDeal && !discountText.trim()) || submitting}
                    startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
                >
                    {submitting ? 'Publishing...' : 'Publish Post'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// Report dialogs now use shared ReportDialog from ActionBar

// ============================
// SectionHeader Component
// ============================
function SectionHeader({ icon, title, action, compact = false }) {
    return (
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: compact ? 1.5 : 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ color: 'primary.main' }}>{icon}</Box>
                <Typography variant={compact ? 'body1' : 'h6'} fontWeight={700}>{title}</Typography>
            </Stack>
            {action}
        </Stack>
    );
}

// ============================
// EmptyStateCard Component
// ============================
function EmptyStateCard({ icon, title, description, action, compact = false }) {
    return (
        <Box sx={{ textAlign: 'center', py: compact ? 3 : 5 }}>
            <Box sx={{ color: 'primary.main', mb: 1.5 }}>{icon}</Box>
            <Typography variant={compact ? 'body1' : 'h6'} fontWeight={700} sx={{ mb: 0.5, color: 'primary.main' }}>{title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: action ? 2 : 0, maxWidth: 300, mx: 'auto' }}>{description}</Typography>
            {action}
        </Box>
    );
}

// ============================
// Post Kind Detection — determines which detail modal to render
// ============================
function detectPostKind(post) {
    if (!post) return 'user';
    const cat = String(post?.category || '').toLowerCase().trim();
    if (cat === 'business_post') return 'business';
    if (cat === 'artist_post') return 'artist';
    // Check postType field (set by likes/reposts API)
    const pType = String(post?.postType || post?.post_type || '').toLowerCase().trim();
    if (pType === 'business') return 'business';
    if (pType === 'artist') return 'artist';
    // Fallback: check for entity ids
    const hasArtist = Boolean(
        post.artist_id || post.artistId || post.artistName || post.artist_name ||
        post.artistHandle || post.artist_handle
    );
    const hasBusiness = Boolean(
        post.business_id || post.businessId || post.businessPageId ||
        post.business_page_id || post.page_id || post.pageId ||
        post.businessName || post.business_name || post.pageName || post.page_name
    );
    if (hasArtist && !hasBusiness) return 'artist';
    if (hasBusiness) return 'business';
    return 'user';
}

// ============================
// Main Component
// ============================
export default function BusinessPublicPage({ user = null, embedded = false, embeddedSlug = '', onBack = null }) {
    const params = useParams();
    const slug = embedded ? (embeddedSlug || '') : (params.slug || params.handleOrId || '');
    const navigate = useNavigate();
    const routeLocation = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const chromeTop = useChromeTop();
    const cameFromBusinesses = embedded || routeLocation?.state?.from === 'businesses' || routeLocation?.state?.from === 'businessHub';
    const cameFromMap = routeLocation?.state?.from === 'businessMap';
    const fromProfile = Boolean(routeLocation?.state?.fromProfile);
    const backProfileName = routeLocation?.state?.backProfileName || '';
    const backProfileHandle = routeLocation?.state?.backProfileHandle || '';
    const backProfileId = routeLocation?.state?.backProfileId || '';
    const backToProfileUrl = routeLocation?.state?.backToProfileUrl || (backProfileHandle ? `/${backProfileHandle}` : backProfileId ? `/${backProfileId}` : '');
    const handleBack = () => {
        if (embedded && onBack) { onBack(); return; }
        if (window.history.length > 1) navigate(-1); else navigate('/businesses');
    };
    const handleProfileReturn = () => {
        try {
            const rawKey = backProfileHandle || backProfileId;
            const norm = String(rawKey || '').replace(/^@/, '').trim();
            const candidates = [rawKey, norm, norm ? `@${norm}` : ''].filter(Boolean);
            candidates.forEach((k) => {
                sessionStorage.setItem(`ll:profile:${k}:restore`, '1');
            });
        } catch { /* ignore */ }

        if (window.history?.length > 1) {
            window.history.back();
            return;
        }
        if (backToProfileUrl) {
            navigate(backToProfileUrl, { state: { restoreProfile: true, fromPostPage: true } });
        } else {
            navigate('/');
        }
    };
    const {
        isBusinessAccount: isBA,
        isArtistAccount: isAA,
        activeBusinessId: aBizId,
        activeArtistId: aArtId,
        activeAccount: acctObj,
        getAccountPayload,
        getAccountParams,
        getAccountHeaders: getAcctHeaders,
        accountCacheKey,
    } = useActiveAccount();
    const { requireAuth, user: authUser } = useAuth();
    const { showSuccess, snackbarProps } = useSuccessSnackbar();

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





    // Build viewer from prop OR from auth context (route may not pass user prop)
    const viewer = user?.user || user || authUser?.user || authUser || null;

    // Restore state when returning from event detail or post detail.
    // The tab index and scroll position were saved to sessionStorage BEFORE navigating.
    const [returnState] = useState(() => {
        try {
            const raw = sessionStorage.getItem('ll:businessScrollRestore');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && (Date.now() - parsed.ts) < 30000 && parsed.slug === slug) {
                    return { tab: parsed.tab, eventSubTab: parsed.eventSubTab, postsSubTab: parsed.postsSubTab, scrollY: parsed.scrollY };
                }
                sessionStorage.removeItem('ll:businessScrollRestore');
            }
        } catch {
            // ignore
        }
        return null;
    });
    const isScrollRestore = Boolean(returnState);

    /* ---------- track postsSubTab for scroll-restore on return from post detail ---------- */
    const postsSubTabRef = useRef(returnState?.postsSubTab || 0);
    const [activePostsSubTab, setActivePostsSubTab] = useState(returnState?.postsSubTab || 0);
    const handlePostsSubTabChange = useCallback((val) => {
        postsSubTabRef.current = val;
        setActivePostsSubTab(val);
        setPostSearchQuery('');
        setCommittedSearchQuery('');
    }, []);

    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rawLoadError, setRawLoadError] = useState(null);
    const [posts, setPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState({ average: 0, total: 0, breakdown: [{ stars: 5, count: 0 }, { stars: 4, count: 0 }, { stars: 3, count: 0 }, { stars: 2, count: 0 }, { stars: 1, count: 0 }] });
    const [activeTab, setActiveTab] = useState(() => {
        const restoredTab = returnState?.tab;
        if (typeof restoredTab === 'number') return restoredTab;
        // If navigated from a notification with scrollToReviews, we'll switch
        // to the reviews tab via an effect once the tabs array is computed.
        return 0;
    });

    // Track whether the Activity fullscreen header should be hidden (synced with engagement tabs scroll)
    const [activityHeaderHidden, setActivityHeaderHidden] = useState(false);
    const businessEngagementSubTabRef = useRef('posts');
    const [businessEngagementSubTabNonce, setBusinessEngagementSubTabNonce] = useState(0);

    /**
     * Save current UI state to sessionStorage so returning from a post/event detail
     * page restores tabs + scroll position instead of resetting the whole page.
     */
    const saveBusinessScrollState = useCallback(() => {
        try {
            sessionStorage.setItem('ll:businessScrollRestore', JSON.stringify({
                slug,
                tab: activeTab,
                postsSubTab: postsSubTabRef.current,
                scrollY: window.scrollY || document.documentElement.scrollTop || 0,
                ts: Date.now(),
            }));
        } catch { /* ignore */ }
    }, [slug, activeTab]);

    const [pendingScrollToReviews] = useState(
        () => Boolean(routeLocation?.state?.scrollToReviews)
    );
    const [highlightReviewId, setHighlightReviewId] = useState(
        () => Number(routeLocation?.state?.highlightReviewId || 0) || null
    );
    const [writeReviewOpen, setWriteReviewOpen] = useState(false);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [sharePostData, setSharePostData] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followBusy, setFollowBusy] = useState(false);
    const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
    const [followsRefreshNonce, setFollowsRefreshNonce] = useState(0);
    const followsRef = useRef(null);
    const [followsSnack, setFollowsSnack] = useState('');
    const [isOwnBusiness, setIsOwnBusiness] = useState(false);
    // Broader check than isOwnBusiness — true whenever the viewer is linked to
    // this business (owner, admin, team member) from ANY active account. Used
    // to hide destructive actions (Report / Hide posts / Block) even when the
    // viewer is on their personal account. Management UI still uses isOwnBusiness
    // because that requires an active switch into the business account.
    const [isLinkedToBusiness, setIsLinkedToBusiness] = useState(false);
    const [viewerRole, setViewerRole] = useState(null);
    const [createPostOpen, setCreatePostOpen] = useState(false);
    const [eventsTotalCount, setEventsTotalCount] = useState(0);
    const [editPostOpen, setEditPostOpen] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [reportPostOpen, setReportPostOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);

    // Detail popup state — events, jobs, services
    const [selectedEventPopup, setSelectedEventPopup] = useState(null);
    const [selectedJobPopup, setSelectedJobPopup] = useState(null);
    const [selectedServicePopup, setSelectedServicePopup] = useState(null);

    // ── Post comment scroll/highlight state ──
    const [postScrollToCommentId, setPostScrollToCommentId] = useState(null);
    const [postHighlightCommentId, setPostHighlightCommentId] = useState(null);

    // ── Event comment scroll/highlight state ──
    const [eventScrollToCommentId, setEventScrollToCommentId] = useState(null);
    const [eventHighlightCommentId, setEventHighlightCommentId] = useState(null);

    // ── Service Request Detail Popup state ──
    const [selectedRequestPopup, setSelectedRequestPopup] = useState(null);
    const [requestPopupResponses, setRequestPopupResponses] = useState([]);
    const [requestPopupResponsesLoading, setRequestPopupResponsesLoading] = useState(false);
    const [requestPopupIsRequester, setRequestPopupIsRequester] = useState(false);
    const [requestPopupMyResponse, setRequestPopupMyResponse] = useState(null);
    const [respondModalOpen, setRespondModalOpen] = useState(false);
    const [respondModalRequest, setRespondModalRequest] = useState(null);
    const [editRequestModalOpen, setEditRequestModalOpen] = useState(false);
    const [editingRequestItem, setEditingRequestItem] = useState(null);
    const handleCreateServiceRequest = useCallback(() => {
        setEditingRequestItem(null);
        setEditRequestModalOpen(true);
    }, []);
    const [serviceRequestsNonce, setServiceRequestsNonce] = useState(0);
    const [svcReqConfirmDialog, setSvcReqConfirmDialog] = useState(null);
    const [svcReqConfirmLoading, setSvcReqConfirmLoading] = useState(false);
    const handleSvcReqConfirmAction = useCallback(async () => {
        if (!svcReqConfirmDialog?.action) return;
        setSvcReqConfirmLoading(true);
        try {
            await svcReqConfirmDialog.action();
            setSvcReqConfirmDialog(null);
        } catch (err) {
            showSuccess(err?.message || 'Something went wrong.');
        } finally {
            setSvcReqConfirmLoading(false);
        }
    }, [svcReqConfirmDialog, showSuccess]);
    const [jobsNonce, setJobsNonce] = useState(0);
    const [editJobOpen, setEditJobOpen] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [deleteJobTarget, setDeleteJobTarget] = useState(null);
    const [applyJobTarget, setApplyJobTarget] = useState(null);
    const [renewTarget, setRenewTarget] = useState(null);
    const [renewDays, setRenewDays] = useState(30);
    const [isRenewing, setIsRenewing] = useState(false);
    const [renewError, setRenewError] = useState(null);
    const [extendRemaining, setExtendRemaining] = useState(0);

    // Edit history dialog state
    const [bizHistoryOpen, setBizHistoryOpen] = useState(false);
    const [bizHistoryRows, setBizHistoryRows] = useState([]);
    const [bizHistoryLoading, setBizHistoryLoading] = useState(false);
    const [bizHistoryError, setBizHistoryError] = useState('');

    useEffect(() => {
        const onRequestHistory = (e) => {
            const pid = e?.detail?.postId;
            if (!pid) return;
            setBizHistoryOpen(true);
            setBizHistoryLoading(true);
            setBizHistoryError('');
            setBizHistoryRows([]);
            secureFetch(`/api/business/posts/${encodeURIComponent(pid)}/edits`, {
                credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json' },
            })
                .then((r) => r.ok ? r.json() : Promise.reject(new Error('Failed to load')))
                .then((data) => setBizHistoryRows(Array.isArray(data) ? data : []))
                .catch((err) => setBizHistoryError(err?.message || 'Failed to load edit history.'))
                .finally(() => setBizHistoryLoading(false));
        };
        window.addEventListener('ll:businessPost:requestHistory', onRequestHistory);
        return () => window.removeEventListener('ll:businessPost:requestHistory', onRequestHistory);
    }, []);
    const [reportingPost, setReportingPost] = useState(null);
    const [reportBusinessOpen, setReportBusinessOpen] = useState(false);
    const [businessMenuAnchor, setBusinessMenuAnchor] = useState(null);
    const [hideBusy, setHideBusy] = useState(false);
    const [blockBusy, setBlockBusy] = useState(false);
    const [blockedByMe, setBlockedByMe] = useState(false);
    const [hiddenPostsByMe, setHiddenPostsByMe] = useState(false);

    // Events state — moved to EventsSubTabs component
    const [eventSubTab] = useState(() => {
        const restored = returnState?.eventSubTab;
        return typeof restored === 'number' ? restored : 0;
    }); // only kept for initial value pass-through

    // Jobs & Services — lightweight check if business has any, to show/hide tabs
    const [bizHasJobs, setBizHasJobs] = useState(false);
    const [bizHasServices, setBizHasServices] = useState(false);

    // Filter state
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [showFilters, setShowFilters] = useState(true);
    const [postDateFrom, setPostDateFrom] = useState('');
    const [postDateTo, setPostDateTo] = useState('');
    const [postSearchQuery, setPostSearchQuery] = useState('');
    const [committedSearchQuery, setCommittedSearchQuery] = useState('');

    // Pagination state for posts
    const POSTS_PER_PAGE = 50;
    const [displayedPostsCount, setDisplayedPostsCount] = useState(POSTS_PER_PAGE);
    const [loadingMorePosts, setLoadingMorePosts] = useState(false);

    // Sticky header and sidebar state
    const [isHeaderSticky, setIsHeaderSticky] = useState(false);
    const [isSidebarSticky, setIsSidebarSticky] = useState(false);
    const [sidebarStickyTop, setSidebarStickyTop] = useState(16);
    const sidebarRef = useRef(null);
    const sidebarContentRef = useRef(null);
    const postsHeaderRef = useRef(null);

    // Blocked / hidden user IDs for filtering engagement tabs
    const [blockedAndHiddenUserIds, setBlockedAndHiddenUserIds] = useState(new Set());
    const [blockedBusinessIds, setBlockedBusinessIds] = useState(new Set());
    const [blockedArtistIds, setBlockedArtistIds] = useState(new Set());
    const [viewerFollowingIds, setViewerFollowingIds] = useState(new Set());

    const ABOUT_MIN_HEIGHT = 170;
    const ABOUT_MAX_SCROLL_HEIGHT = 300;
    const [descExpanded, setDescExpanded] = useState(false);
    const [photoPreviewSrc, setPhotoPreviewSrc] = useState('');
    const [quickMsgOpen, setQuickMsgOpen] = useState(false);

    // ── Photo comments popup state (like/comment on profile pic, cover, gallery photos) ──
    const [photoCommentsOpen, setPhotoCommentsOpen] = useState(false);
    const [photoCommentsType, setPhotoCommentsType] = useState('avatar'); // 'avatar' | 'cover' | 'gallery'
    const [photoCommentsPhotoId, setPhotoCommentsPhotoId] = useState(null);
    const [photoCommentsPhotoUrl, setPhotoCommentsPhotoUrl] = useState(null);

    // Photo report state
    const [photoReportOpen, setPhotoReportOpen] = useState(false);
    const [photoReportTarget, setPhotoReportTarget] = useState(null);

    const handlePhotoReportOpen = useCallback((photoType, photoUrl, photoId) => {
        setPhotoReportTarget({ photoType, photoUrl: photoUrl || '', photoId: photoId || null, ownerId: Number(business?.owner_user_id || business?.submitted_by_user_id || 0) });
        setPhotoReportOpen(true);
    }, [business]);

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
    const [avatarImgLoaded, setAvatarImgLoaded] = useState(!!business?.avatar_url);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            if (!slug) { setError('Missing business identifier.'); setLoading(false); return; }
            setLoading(true); setError(null); setRawLoadError(null);
            try {
                const res = await fetchBusinessPublicBySlug(slug);
                if (cancelled) return;
                setBusiness(res?.business || res || null);
            } catch (err) { if (cancelled) return; setRawLoadError(err); setError(err?.message || 'Failed to load business.'); }
            finally { if (!cancelled) setLoading(false); }
        }
        load();
        return () => { cancelled = true; };
    }, [slug]);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            if (!business?.id) return;
            setPostsLoading(true);
            try {
                const res = await fetchBusinessPosts({
                    businessId: business.id,
                    sort: sortBy,
                    type: filterType,
                    limit: 50,
                    activeBusinessId: aBizId || null,
                    activeArtistId: aArtId || null,
                });
                if (cancelled) return;
                setPosts(res?.items || []);
            } catch { if (cancelled) return; setPosts([]); }
            finally { if (!cancelled) setPostsLoading(false); }
        }
        load();
        return () => { cancelled = true; };
    }, [business?.id, sortBy, filterType, aBizId, aArtId]);

    // ── Check if business has jobs ──────────────────────────────────────────
    // Use posterBusinessId (not posterUserId) so we only match jobs posted by
    // THIS specific business — not every business the owner's personal account has.
    useEffect(() => {
        if (!business?.id) return;
        let alive = true;
        const ctrl = new AbortController();
        (async () => {
            try {
                const hdrs = typeof getAcctHeaders === 'function' ? getAcctHeaders() : (getAccountHeaders() || {});
                const res = await axios.get('/api/jobs/feed', {
                    params: { posterBusinessId: business.id, limit: 1 },
                    signal: ctrl.signal, withCredentials: true,
                    headers: { ...hdrs, 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
                });
                if (!alive) return;
                const items = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
                setBizHasJobs(items.length > 0);
            } catch (err) {
                if (alive) setBizHasJobs(false);
            }
        })();
        return () => { alive = false; ctrl.abort(); };
    }, [business?.id]);

    // ── Check if business has services ──────────────────────────────────────
    // Use posterBusinessId (not posterUserId) so we only match services posted by
    // THIS specific business — not every business the owner's personal account has.
    useEffect(() => {
        if (!business?.id) return;
        let alive = true;
        const ctrl = new AbortController();
        (async () => {
            try {
                const hdrs = typeof getAcctHeaders === 'function' ? getAcctHeaders() : (getAccountHeaders() || {});
                const res = await axios.get('/api/services/feed', {
                    params: { posterBusinessId: business.id, limit: 1 },
                    signal: ctrl.signal, withCredentials: true,
                    headers: { ...hdrs, 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
                });
                if (!alive) return;
                const items = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
                setBizHasServices(items.length > 0);
            } catch (err) {
                if (alive) setBizHasServices(false);
            }
        })();
        return () => { alive = false; ctrl.abort(); };
    }, [business?.id]);

    // ── Fetch blocked/hidden user IDs for engagement tab filtering ──────────
    useEffect(() => {
        if (!viewer?.id) return;
        let cancelled = false;
        (async () => {
            try {
                const hdrs = typeof getAcctHeaders === 'function' ? getAcctHeaders() : (getAccountHeaders() || {});
                const res = await secureFetch('/api/users/moderation-state', {
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json', ...hdrs },
                });
                if (!res.ok || cancelled) return;
                const data = await res.json();
                if (cancelled) return;
                const ids = new Set(
                    [
                        ...(Array.isArray(data.blocked_user_ids) ? data.blocked_user_ids : []),
                        ...(Array.isArray(data.hidden_user_ids) ? data.hidden_user_ids : []),
                        ...(Array.isArray(data.hidden_post_user_ids) ? data.hidden_post_user_ids : []),
                        ...(Array.isArray(data.blocked_owner_ids_legacy) ? data.blocked_owner_ids_legacy : []),
                    ].map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0)
                );
                setBlockedAndHiddenUserIds(ids);

                // Business entity IDs
                const bizIds = [
                    ...(Array.isArray(data.blocked_business_ids) ? data.blocked_business_ids : []),
                    ...(Array.isArray(data.hidden_post_business_ids) ? data.hidden_post_business_ids : []),
                ];
                const bSet = new Set();
                for (const id of bizIds) { bSet.add(Number(id)); bSet.add(String(id)); }
                setBlockedBusinessIds(bSet);

                // Artist entity IDs
                const artIds = [
                    ...(Array.isArray(data.blocked_artist_ids) ? data.blocked_artist_ids : []),
                    ...(Array.isArray(data.hidden_post_artist_ids) ? data.hidden_post_artist_ids : []),
                ];
                const aSet = new Set();
                for (const id of artIds) { aSet.add(Number(id)); aSet.add(String(id)); }
                setBlockedArtistIds(aSet);

                // Viewer's following list for followers-only post filtering
                const followingArr = Array.isArray(data.viewer_following_ids) ? data.viewer_following_ids : [];
                if (followingArr.length > 0) {
                    setViewerFollowingIds(new Set(followingArr.map(Number).filter((n) => n > 0)));
                }
            } catch {
                // fail-open
            }
        })();
        return () => { cancelled = true; };
    }, [viewer?.id, accountCacheKey, aBizId, aArtId]);

    // ── Listen for block/hide events to update the set in real-time ──────────
    useEffect(() => {
        const handleBlockChange = (e) => {
            const detail = e?.detail || {};
            const userId = Number(detail.userId || 0);
            if (!Number.isFinite(userId) || userId <= 0) return;
            const targetType = String(detail.targetType || '').toLowerCase();
            const isActive = e.type === 'll:user:blocked-changed' ? Boolean(detail.blocked) : Boolean(detail.hidden);

            if (targetType === 'business') {
                setBlockedBusinessIds((prev) => {
                    const next = new Set(prev);
                    if (isActive) { next.add(userId); next.add(String(userId)); }
                    else { next.delete(userId); next.delete(String(userId)); }
                    return next;
                });
            } else if (targetType === 'artist') {
                setBlockedArtistIds((prev) => {
                    const next = new Set(prev);
                    if (isActive) { next.add(userId); next.add(String(userId)); }
                    else { next.delete(userId); next.delete(String(userId)); }
                    return next;
                });
            } else {
                setBlockedAndHiddenUserIds((prev) => {
                    const next = new Set(prev);
                    if (isActive) next.add(userId);
                    else next.delete(userId);
                    return next;
                });
            }
        };
        window.addEventListener('ll:user:hidden-changed', handleBlockChange);
        window.addEventListener('ll:user:blocked-changed', handleBlockChange);
        return () => {
            window.removeEventListener('ll:user:hidden-changed', handleBlockChange);
            window.removeEventListener('ll:user:blocked-changed', handleBlockChange);
        };
    }, []);


    // Scroll restoration: When returning from event detail or post detail, restore
    // the scroll position. If a scrollY was saved (from engagement tabs), restore
    // exact position. The effect keeps retrying until the page is tall enough to
    // actually reach the saved scroll position (content loads asynchronously).
    useEffect(() => {
        if (!isScrollRestore) return;

        const savedScrollY = returnState?.scrollY;
        const startTime = Date.now();
        const maxWait = 12000;
        let settled = false;

        const intervalId = setInterval(() => {
            if (Date.now() - startTime > maxWait) {
                clearInterval(intervalId);
                sessionStorage.removeItem('ll:businessScrollRestore');
                return;
            }

            const tabsEl = document.getElementById('business-tabs');
            if (!tabsEl) return; // tabs haven't mounted yet

            if (typeof savedScrollY === 'number' && savedScrollY > 0) {
                window.scrollTo(0, savedScrollY);

                // Check if the page is tall enough to actually reach the target position.
                // document.documentElement.scrollHeight must exceed savedScrollY + viewport height
                // (or at least the current scrollY should be close to the target).
                const currentY = window.scrollY || window.pageYOffset || 0;
                const tolerance = 150; // px — allow for minor layout differences
                const reachedTarget = Math.abs(currentY - savedScrollY) < tolerance;
                const pageFullyTall = document.documentElement.scrollHeight >= savedScrollY + window.innerHeight * 0.5;

                if (reachedTarget || pageFullyTall) {
                    // Re-apply one final time after a short delay so any last layout shifts settle
                    if (!settled) {
                        settled = true;
                        setTimeout(() => {
                            window.scrollTo(0, savedScrollY);
                            clearInterval(intervalId);
                            sessionStorage.removeItem('ll:businessScrollRestore');
                        }, 80);
                    }
                }
                // else: page isn't tall enough yet — keep retrying next tick
            } else {
                tabsEl.scrollIntoView({ behavior: 'instant', block: 'start' });
                clearInterval(intervalId);
                sessionStorage.removeItem('ll:businessScrollRestore');
            }
        }, 100);

        return () => {
            clearInterval(intervalId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load reviews from API
    const [reviewSortBy, setReviewSortBy] = useState('newest');
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [userReview, setUserReview] = useState(null);

    const loadReviews = React.useCallback(async () => {
        if (!business?.id) return;
        setReviewsLoading(true);
        try {
            const resp = await fetchBusinessReviews({ businessId: business.id, limit: 50, sort: reviewSortBy });
            const items = Array.isArray(resp?.items) ? resp.items : [];
            setReviews(items.map((r) => {
                const rName = [r.firstName, r.lastName].filter(Boolean).join(' ') || r.username || 'Anonymous';
                return {
                    id: r.id,
                    author: rName,
                    authorName: rName,
                    authorAvatarUrl: r.profileImageUrl || '',
                    authorFirstName: r.firstName || '',
                    authorLastName: r.lastName || '',
                    authorHandle: r.handle || '',
                    username: r.username || '',
                    rating: r.rating,
                    text: r.body || '',
                    title: r.title || '',
                    photoUrls: Array.isArray(r.photoUrls) ? r.photoUrls : [],
                    ownerReply: r.ownerReply || null,
                    ownerReplyAt: r.ownerReplyAt || null,
                    replyByName: r.replyByName || null,
                    replyByAvatar: r.replyByAvatar || null,
                    replyByHandle: r.replyByHandle || null,
                    replyPhotoUrls: Array.isArray(r.replyPhotoUrls) ? r.replyPhotoUrls : [],
                    createdAt: r.createdAt,
                    updatedAt: r.updatedAt || null,
                    userId: r.userId,
                    helpfulCount: Number(r.helpfulCount || 0),
                    viewerFoundHelpful: Boolean(r.viewerFoundHelpful),
                };
            }));
            const avg = Number(resp?.averageRating || 0);
            const tot = Number(resp?.total || 0);
            const rc = resp?.ratingCounts || {};
            setReviewStats({
                average: avg,
                total: tot,
                breakdown: [
                    { stars: 5, count: rc[5] || 0 },
                    { stars: 4, count: rc[4] || 0 },
                    { stars: 3, count: rc[3] || 0 },
                    { stars: 2, count: rc[2] || 0 },
                    { stars: 1, count: rc[1] || 0 },
                ],
            });
            setUserReview(resp?.userReview || null);
            // Broadcast review stats change so other components (directory cards, detail panels) can update
            try {
                window.dispatchEvent(new CustomEvent('ll:business:review-changed', {
                    detail: { businessId: business.id, reviewCount: tot, averageRating: avg, _source: 'publicPage' }
                }));
            } catch { /* */ }
        } catch {
            setReviews([]);
            setReviewStats({ average: 0, total: 0, breakdown: [{ stars: 5, count: 0 }, { stars: 4, count: 0 }, { stars: 3, count: 0 }, { stars: 2, count: 0 }, { stars: 1, count: 0 }] });
        } finally {
            setReviewsLoading(false);
        }
    }, [business?.id, reviewSortBy]);

    useEffect(() => {
        loadReviews();
    }, [loadReviews]);

    // Listen for review changes from other components (e.g. detail panel)
    useEffect(() => {
        const handler = (e) => {
            const d = e.detail;
            if (!d || !business?.id || String(d.businessId) !== String(business.id)) return;
            if (d._source === 'publicPage') return; // ignore own dispatches
            loadReviews();
        };
        window.addEventListener('ll:business:review-changed', handler);
        return () => window.removeEventListener('ll:business:review-changed', handler);
    }, [business?.id, loadReviews]);

    // Moved above scroll-to-review effect so it's available as a dependency.
    const businessAllowReviews = (() => {
        const s = business?.settings || business?.businessSettings || business;
        if (!s) return true;
        const v = s.allow_reviews ?? s.allowReviews;
        if (v == null) return true;
        if (typeof v === 'boolean') return v;
        return Number(v) !== 0;
    })();

    // Boost highlighted review to the top so the user sees it immediately
    const sortedReviews = useMemo(() => {
        if (!highlightReviewId) return reviews;
        const idx = reviews.findIndex((r) => Number(r.id) === Number(highlightReviewId));
        if (idx <= 0) return reviews; // already first or not found
        const copy = [...reviews];
        const [target] = copy.splice(idx, 1);
        copy.unshift(target);
        return copy;
    }, [reviews, highlightReviewId]);

    // Compute the reviews tab index dynamically — on mobile the "activity" tab
    // is inserted after overview, pushing photos and reviews one slot later.
    // Tab layout on mobile:  overview(0), activity(1), photos(2), reviews(3)
    // Tab layout on desktop: overview(0), photos(1), reviews(2)
    const reviewsTabIdx = businessAllowReviews
        ? (isMobile ? 3 : 2)
        : -1;

    // Scroll to and highlight a specific review when coming from a notification
    useEffect(() => {
        if (!highlightReviewId || reviewsLoading || reviews.length === 0) return;
        if (activeTab !== reviewsTabIdx) return;
        // Give DOM time to render
        const scrollTimer = setTimeout(() => {
            const el = document.querySelector(`[data-review-id="${highlightReviewId}"]`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 400);
        // Clear highlight after 6 seconds
        const fadeTimer = setTimeout(() => {
            setHighlightReviewId(null);
        }, 6500);
        return () => { clearTimeout(scrollTimer); clearTimeout(fadeTimer); };
    }, [highlightReviewId, reviewsLoading, reviews.length, activeTab, reviewsTabIdx]);

    // When arriving from a notification without a specific review ID, scroll
    // down to the tabs / reviews section so the user lands in the right spot.
    useEffect(() => {
        if (!pendingScrollToReviews || !businessAllowReviews) return;
        if (activeTab !== reviewsTabIdx) return;
        const scrollTimer = setTimeout(() => {
            // If we have a specific review to highlight, that effect handles scrolling.
            if (highlightReviewId) return;
            const tabsEl = document.getElementById('business-tabs');
            if (tabsEl) {
                tabsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 450);
        return () => clearTimeout(scrollTimer);
    }, [pendingScrollToReviews, businessAllowReviews, activeTab, highlightReviewId, reviewsTabIdx]);

    // ── Business settings (from business_settings table or embedded in business object) ──
    // Default to true (enabled) when the setting doesn't exist yet for backward compatibility.
    const businessAllowMessages = (() => {
        const s = business?.settings || business?.businessSettings || business;
        if (!s) return true;
        const v = s.allow_messages ?? s.allowMessages;
        if (v == null) return true;
        if (typeof v === 'boolean') return v;
        return Number(v) !== 0;
    })();

    const businessHoursVisible = (() => {
        const s = business?.settings || business?.businessSettings || business;
        if (!s) return true;
        const v = s.hours_visibility ?? s.hoursVisibility;
        if (v == null) return true;
        return String(v).toLowerCase() !== 'hidden';
    })();

    const isNonPersonalAccount = isBA || isAA;
    const canWriteReview = Boolean(viewer?.id) && !isOwnBusiness && !isNonPersonalAccount && businessAllowReviews;
    const handleOpenWriteReview = () => {
        if (isOwnBusiness) {
            showSuccess("You can't review your own business — but your customers can!");
            return;
        }
        if (isNonPersonalAccount) {
            showSuccess('Switch to your personal account to leave a review.');
            return;
        }
        if (!viewer?.id) return;
        if (!businessAllowReviews) return;
        setWriteReviewOpen(true);
    };

    // Determine if this is the viewer's own business.
    // Follow the same pattern as ActionBar: use useActiveAccount() to check
    // if the currently active account IS this business. No API call needed.
    useEffect(() => {
        if (!business?.id) {
            setIsOwnBusiness(false);
            setIsLinkedToBusiness(false);
            setViewerRole(null);
            return;
        }

        // Broader link check: the viewer owns/submitted this business, regardless
        // of which account they're currently using. This gates destructive actions
        // but NOT management UI (which still requires switching accounts).
        const bizOwnerUserId = Number(
            business?.owner_user_id ||
            business?.submitted_by_user_id ||
            business?.user_id ||
            0
        );
        const linkedByOwnerField = Boolean(
            viewer?.id && bizOwnerUserId > 0 && Number(viewer.id) === bizOwnerUserId
        );

        // Only treat as "own business" when actively switched to this business account.
        // Being on a personal account that owns this business should NOT expose
        // management UI — the user must switch into the business account first.
        if (isBA && aBizId && String(aBizId) === String(business.id)) {
            setIsOwnBusiness(true);
            setIsLinkedToBusiness(true);
            setViewerRole(acctObj?.role || 'owner');
            return;
        }

        // Not switched to this business — treat as a normal visitor for management
        // UI purposes, but still flag the link so we hide block/hide/report.
        setIsOwnBusiness(false);
        setIsLinkedToBusiness(linkedByOwnerField);
        setViewerRole(null);
    }, [business?.id, business?.owner_user_id, business?.submitted_by_user_id, business?.user_id, viewer?.id, isBA, aBizId, acctObj?.role]);

    // Load follow state — uses /api/follows/status (same endpoint as UserCardPopover)
    // which properly resolves account-scoped follows via headers.
    useEffect(() => {
        let cancelled = false;
        const cached = readBusinessFollowState(business?.id, accountCacheKey);
        if (cached && typeof cached.isFollowing === 'boolean') {
            setIsFollowing(Boolean(cached.isFollowing));
        }
        if (!business?.id || !viewer?.id) {
            setIsFollowing(false);
            return;
        }
        const qs = new URLSearchParams({
            target_id: String(business.id),
            target_type: 'business',
        });
        const hdrs = typeof getAcctHeaders === 'function' ? getAcctHeaders() : (getAccountHeaders() || {});
        secureFetch(`/api/follows/status?${qs.toString()}`, {
            credentials: 'include',
            headers: { Accept: 'application/json', ...hdrs },
        })
            .then((r) => r.ok ? r.json() : null)
            .then((data) => {
                if (cancelled || !data) return;
                const next = Boolean(data.following);
                setIsFollowing(next);
                writeBusinessFollowState(business.id, next, accountCacheKey);
            })
            .catch(() => { if (!cancelled) setIsFollowing(Boolean(readBusinessFollowState(business?.id, accountCacheKey)?.isFollowing || false)); });
        return () => { cancelled = true; };
    }, [business?.id, viewer?.id, accountCacheKey, aBizId, aArtId]);

    // Listen for follow changes broadcast by hub cards, detail panel, etc.
    useEffect(() => {
        if (!business?.id) return;
        const bizId = Number(business.id);
        const handler = (e) => {
            const { businessId, isFollowing: nowFollowing, accountCacheKey: eventAccountKey } = e.detail || {};
            if (Number(businessId) !== bizId) return;
            if (eventAccountKey && eventAccountKey !== accountCacheKey) return;
            setIsFollowing(Boolean(nowFollowing));
            writeBusinessFollowState(bizId, Boolean(nowFollowing), accountCacheKey);
        };
        window.addEventListener('ll:business:follow-changed', handler);
        return () => window.removeEventListener('ll:business:follow-changed', handler);
    }, [business?.id]);

    const handleFollowToggle = async () => {
        if (!business?.id || followBusy) return;
        if (!viewer?.id) {
            if (typeof requireAuth === 'function') {
                try { await requireAuth(); } catch { /* ignore */ }
            }
            return;
        }
        const bizId = Number(business.id);
        const wasFollowing = isFollowing;
        setFollowBusy(true);
        setIsFollowing(!wasFollowing);
        writeBusinessFollowState(bizId, !wasFollowing, accountCacheKey);
        try {
            const payload = {
                target_id: bizId,
                target_type: 'business',
                action: wasFollowing ? 'unfollow' : 'follow',
            };
            try {
                const acctPayload = typeof getAccountPayload === 'function' ? getAccountPayload() : {};
                // Merge account context but preserve our target fields
                const { target_id: _tid, target_type: _tt, action: _a, ...safeAcct } = acctPayload || {};
                Object.assign(payload, safeAcct);
            } catch { /* ignore */ }
            const hdrs = typeof getAcctHeaders === 'function' ? getAcctHeaders() : (getAccountHeaders() || {});
            const res = await secureFetch('/api/follows/toggle', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...hdrs },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                setIsFollowing(wasFollowing);
                writeBusinessFollowState(bizId, wasFollowing, accountCacheKey);
            } else {
                const data = await res.json().catch(() => null);
                const nowFollowing = Boolean(data?.following ?? data?.isFollowing ?? !wasFollowing);
                setIsFollowing(nowFollowing);
                writeBusinessFollowState(bizId, nowFollowing, accountCacheKey);
                window.dispatchEvent(new CustomEvent(BUSINESS_FOLLOW_EVENT, {
                    detail: { businessId: bizId, isFollowing: nowFollowing, accountCacheKey, source: 'publicPage' },
                }));
                setFollowsRefreshNonce((n) => n + 1);
            }
        } catch {
            setIsFollowing(wasFollowing);
            writeBusinessFollowState(bizId, wasFollowing, accountCacheKey);
        } finally {
            setFollowBusy(false);
        }
    };

    const handleBusinessUpdate = async () => {
        if (!slug) return;
        try {
            const res = await fetchBusinessPublicBySlug(slug);
            setBusiness(res?.business || res || null);
        } catch {
            // Ignore
        }
    };

    const handlePostCreated = async () => {
        if (!business?.id) return;
        try {
            const res = await fetchBusinessPosts({ businessId: business.id, sort: sortBy, type: filterType, limit: 50, activeBusinessId: aBizId || null, activeArtistId: aArtId || null });
            setPosts(res?.items || []);
        } catch {
            // Ignore
        }
    };

    const handlePinPost = async (postId) => {
        await pinBusinessPost(postId);
        await handlePostCreated();
    };

    const handleUnpinPost = async (postId) => {
        await unpinBusinessPost(postId);
        await handlePostCreated();
    };

    // Listen for business post edit events to refresh the list immediately
    // Preserve scroll position so the user doesn't lose their place
    useEffect(() => {
        const onUpdated = async () => {
            const savedTop = window.scrollY || document.documentElement.scrollTop || 0;
            await handlePostCreated();
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    window.scrollTo(0, savedTop);
                });
            });
        };
        window.addEventListener('ll:businessPost:updated', onUpdated);
        window.addEventListener('ll:businessPost:refresh', onUpdated);
        return () => {
            window.removeEventListener('ll:businessPost:updated', onUpdated);
            window.removeEventListener('ll:businessPost:refresh', onUpdated);
        };
    }, [business?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSharePost = (post) => {
        if (!post) return;
        setSharePostData({
            id: post.id,
            title: post.title,
            body: post.body,
            businessName: business?.name,
            businessSlug: business?.slug,
        });
        setShareDialogOpen(true);
    };

    const handleEditPost = (post) => {
        setEditingPost(post);
        setEditPostOpen(true);
    };

    const handleDeletePost = async (postId) => {
        try {
            await deleteBusinessPost(postId);
            await handlePostCreated(); // Refresh posts
            showSuccess('Post deleted successfully');
        } catch (err) {
            // Handle error
        }
    };

    const handleReportPost = (post) => {
        setReportingPost(post);
        setReportPostOpen(true);
    };

    const submitPostReport = React.useCallback(async ({ reason, details }) => {
        const pid = reportingPost?.id;
        if (!pid) return;
        try {
            await reportBusinessPost({ postId: pid, reason, details });
        } catch { /* ignore */ }
    }, [reportingPost?.id]);

    const submitBusinessReport = React.useCallback(async ({ reason, details }) => {
        const bid = business?.id;
        if (!bid) return;
        try {
            await reportBusiness({ businessId: bid, reason, details });
        } catch { /* ignore */ }
    }, [business?.id]);

    const handleHideBusiness = React.useCallback(async () => {
        const bizId = Number(business?.id || 0);
        if (!bizId || hideBusy || blockBusy) return;
        setBusinessMenuAnchor(null);
        setHideBusy(true);
        const displayName = business?.name || 'Business';
        try {
            const hdrs = { 'Content-Type': 'application/json', ...(typeof getAcctHeaders === 'function' ? (getAcctHeaders() || {}) : {}) };
            const payload = { target_id: bizId, target_type: 'business', action: 'hide' };
            try {
                const res = await secureFetch('/api/users/hide', { method: 'POST', credentials: 'include', headers: hdrs, body: JSON.stringify(payload) });
                if (res.ok) {
                    try { window.dispatchEvent(new CustomEvent('ll:user:hidden-changed', { detail: { userId: bizId, targetType: 'business', hidden: true } })); } catch { /* */ }
                    try { window.dispatchEvent(new CustomEvent('ll:business:hidden-changed', { detail: { businessId: bizId, hidden: true, source: 'menu' } })); } catch { /* */ }
                    setHiddenPostsByMe(true);
                    showSuccess(`Posts from ${displayName} hidden`);
                    return;
                }
            } catch { /* */ }
        } catch { /* */ } finally { setHideBusy(false); }
    }, [business?.id, business?.name, hideBusy, blockBusy, getAcctHeaders, showSuccess]);

    const handleUnhideBusiness = React.useCallback(async () => {
        const bizId = Number(business?.id || 0);
        if (!bizId) return;
        const displayName = business?.name || 'Business';
        try {
            const hdrs = { 'Content-Type': 'application/json', ...(typeof getAcctHeaders === 'function' ? (getAcctHeaders() || {}) : {}) };
            const payload = { target_id: bizId, target_type: 'business', action: 'unhide' };
            await secureFetch('/api/users/hide', { method: 'POST', credentials: 'include', headers: hdrs, body: JSON.stringify(payload) });
            try { window.dispatchEvent(new CustomEvent('ll:user:hidden-changed', { detail: { userId: bizId, targetType: 'business', hidden: false } })); } catch { /* */ }
            setHiddenPostsByMe(false);
            showSuccess(`Posts from ${displayName} unhidden`);
        } catch { /* */ }
    }, [business?.id, business?.name, getAcctHeaders, showSuccess]);

    const handleBlockBusiness = React.useCallback(async () => {
        const bizId = Number(business?.id || 0);
        if (!bizId || hideBusy || blockBusy) return;
        setBusinessMenuAnchor(null);
        setBlockBusy(true);
        const displayName = business?.name || 'Business';
        try {
            const hdrs = { 'Content-Type': 'application/json', ...(typeof getAcctHeaders === 'function' ? (getAcctHeaders() || {}) : {}) };
            const payload = { target_id: bizId, target_type: 'business', action: 'block' };
            try {
                const res = await secureFetch('/api/users/block', { method: 'POST', credentials: 'include', headers: hdrs, body: JSON.stringify(payload) });
                if (res.ok) {
                    try { window.dispatchEvent(new CustomEvent('ll:user:blocked-changed', { detail: { userId: bizId, targetType: 'business', blocked: true } })); } catch { /* */ }
                    try { window.dispatchEvent(new CustomEvent('ll:business:blocked-changed', { detail: { businessId: bizId, blocked: true, source: 'menu' } })); } catch { /* */ }
                    setBlockedByMe(true);
                    setHiddenPostsByMe(true);
                    showSuccess(`${displayName} blocked`);
                    return;
                }
            } catch { /* */ }
        } catch { /* */ } finally { setBlockBusy(false); }
    }, [business?.id, business?.name, hideBusy, blockBusy, getAcctHeaders, showSuccess]);

    const handleUnblockBusiness = React.useCallback(async () => {
        const bizId = Number(business?.id || 0);
        if (!bizId) return;
        const displayName = business?.name || 'Business';
        try {
            const hdrs = { 'Content-Type': 'application/json', ...(typeof getAcctHeaders === 'function' ? (getAcctHeaders() || {}) : {}) };
            const payload = { target_id: bizId, target_type: 'business', action: 'unblock' };
            await secureFetch('/api/users/block', { method: 'POST', credentials: 'include', headers: hdrs, body: JSON.stringify(payload) });
            try { window.dispatchEvent(new CustomEvent('ll:user:blocked-changed', { detail: { userId: bizId, targetType: 'business', blocked: false } })); } catch { /* */ }
            setBlockedByMe(false);
            showSuccess(`${displayName} unblocked`);
            // Delay reload so the toast has time to show
            setTimeout(() => { window.location.reload(); }, 1500);
        } catch { /* */ }
    }, [business?.id, business?.name, getAcctHeaders, showSuccess]);

    // Check if user can create posts (must be owner or admin)
    const canCreatePosts = isOwnBusiness && (viewerRole === 'owner' || viewerRole === 'admin');
    const canEditPosts = canCreatePosts;
    const canPinPosts = canCreatePosts;

    // Business management capabilities — only when actively switched into this
    // exact business account as the owner. Being on a personal account that has
    // this business attached should not expose management UI.
    const canManageBusiness = isOwnBusiness && String(viewerRole || '').toLowerCase() === 'owner';


    // Temporary / special hours dialog
    const [tempHoursOpen, setTempHoursOpen] = useState(false);
    const [tempHoursSaving, setTempHoursSaving] = useState(false);
    const [tempHoursError, setTempHoursError] = useState('');
    const [tempHoursDate, setTempHoursDate] = useState(() => formatDateKeyLocal(new Date()));
    const [tempHoursClosed, setTempHoursClosed] = useState(false);
    const [tempHoursAllDay, setTempHoursAllDay] = useState(false);
    const [tempHoursOpenTime, setTempHoursOpenTime] = useState('09:00');
    const [tempHoursCloseTime, setTempHoursCloseTime] = useState('17:00');
    const [tempHoursNote, setTempHoursNote] = useState('');

    const openTempHoursDialog = () => {
        const dateKey = formatDateKeyLocal(new Date());
        const existing = findSpecialHoursForDate(specialHours, dateKey);
        setTempHoursDate(dateKey);
        setTempHoursClosed(Boolean(existing?.closed));
        setTempHoursAllDay(Boolean(existing?.allDay));
        setTempHoursOpenTime(existing?.open || '09:00');
        setTempHoursCloseTime(existing?.close || '17:00');
        setTempHoursNote(existing?.note || '');
        setTempHoursError('');
        setTempHoursOpen(true);
    };

    const closeTempHoursDialog = () => {
        if (tempHoursSaving) return;
        setTempHoursOpen(false);
        setTempHoursError('');
    };

    const handleSaveTempHours = async () => {
        if (!business?.id) return;
        const dateKey = String(tempHoursDate || '').trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
            setTempHoursError('Please choose a valid date.');
            return;
        }

        if (!tempHoursClosed && !tempHoursAllDay) {
            if (!/^\d{2}:\d{2}$/.test(tempHoursOpenTime) || !/^\d{2}:\d{2}$/.test(tempHoursCloseTime)) {
                setTempHoursError('Please enter open and close times (HH:MM).');
                return;
            }
        }

        setTempHoursSaving(true);
        setTempHoursError('');
        try {
            await upsertBusinessSpecialHours(business.id, {
                date: dateKey,
                closed: Boolean(tempHoursClosed),
                allDay: Boolean(tempHoursAllDay),
                open: (!tempHoursClosed && !tempHoursAllDay) ? tempHoursOpenTime : null,
                close: (!tempHoursClosed && !tempHoursAllDay) ? tempHoursCloseTime : null,
                note: String(tempHoursNote || '').trim(),
            });
            await handleBusinessUpdate();
            setTempHoursOpen(false);
            showSuccess('Temporary hours saved');
        } catch (err) {
            setTempHoursError(err?.message || 'Failed to save temporary hours.');
        } finally {
            setTempHoursSaving(false);
        }
    };

    const handleDeleteTempHours = async () => {
        if (!business?.id) return;
        const dateKey = String(tempHoursDate || '').trim();
        setTempHoursSaving(true);
        setTempHoursError('');
        try {
            await deleteBusinessSpecialHours(business.id, dateKey);
            await handleBusinessUpdate();
            setTempHoursOpen(false);
            showSuccess('Temporary hours removed');
        } catch (err) {
            setTempHoursError(err?.message || 'Failed to remove temporary hours.');
        } finally {
            setTempHoursSaving(false);
        }
    };

    // Filter and sort posts client-side
    const filteredAndSortedPosts = (() => {
        let result = [...posts];
        if (filterType !== 'all') {
            result = result.filter(p => (p.type?.toLowerCase() || 'update') === filterType);
        }
        if (committedSearchQuery.trim()) {
            const q = committedSearchQuery.trim().toLowerCase();
            result = result.filter(p => {
                const title = (p.title || '').toLowerCase();
                const body = (p.body || p.content || '').toLowerCase();
                const authorName = (p.authorName || p.author_name || '').toLowerCase();
                return title.includes(q) || body.includes(q) || authorName.includes(q);
            });
        }
        if (postDateFrom) {
            const from = new Date(postDateFrom);
            from.setHours(0, 0, 0, 0);
            result = result.filter(p => {
                const d = new Date(p.createdAt || 0);
                return d >= from;
            });
        }
        if (postDateTo) {
            const to = new Date(postDateTo);
            to.setHours(23, 59, 59, 999);
            result = result.filter(p => {
                const d = new Date(p.createdAt || 0);
                return d <= to;
            });
        }
        result.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
            if (sortBy === 'popular') return ((b.likeCount || 0) + (b.commentCount || 0)) - ((a.likeCount || 0) + (a.commentCount || 0));
            return 0;
        });
        return result;
    })();

    // Calculate displayed posts with pagination
    const displayedPosts = filteredAndSortedPosts.slice(0, displayedPostsCount);
    const hasMorePosts = filteredAndSortedPosts.length > displayedPostsCount;

    // Load more posts handler
    const handleLoadMorePosts = () => {
        setLoadingMorePosts(true);
        // Simulate slight delay for UX
        setTimeout(() => {
            setDisplayedPostsCount(prev => prev + POSTS_PER_PAGE);
            setLoadingMorePosts(false);
        }, 500);
    };

    // Scroll to top handler
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Calculate sidebar sticky top value
    useEffect(() => {
        if (activeTab !== 0 || isMobile) {
            setIsHeaderSticky(false);
            setIsSidebarSticky(false);
            return;
        }

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

            if (sidebarContentRef.current) {
                const sidebarRect = sidebarContentRef.current.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const bottomPadding = 16;
                const isStuck = sidebarRect.bottom <= viewportHeight - bottomPadding + 5;
                setIsSidebarSticky(isStuck);
            }
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

    // When arriving from a notification that wants the reviews tab open,
    // resolve the correct tab index now that business data is available.
    useEffect(() => {
        if (!pendingScrollToReviews || !businessAllowReviews) return;
        if (activeTab !== reviewsTabIdx) {
            setActiveTab(reviewsTabIdx);
        }
    }, [pendingScrollToReviews, businessAllowReviews, reviewsTabIdx]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Photo comments hooks (must be before early returns) ──
    const openAvatarComments = useCallback(() => {
        if (!business?.avatar_url) return;
        if (business.avatar_url.includes('default_avatar') || business.avatar_url.includes('default_business')) return;
        const slugOrId = business?.slug || business?.handle || business?.id;
        if (!slugOrId) return;
        setPhotoCommentsType('avatar');
        setPhotoCommentsPhotoId(null);
        setPhotoCommentsPhotoUrl(null);
        setPhotoCommentsOpen(true);
    }, [business?.avatar_url, business?.slug, business?.handle, business?.id]);

    const openCoverComments = useCallback(() => {
        if (!business?.cover_url) return;
        const slugOrId = business?.slug || business?.handle || business?.id;
        if (!slugOrId) return;
        setPhotoCommentsType('cover');
        setPhotoCommentsPhotoId(null);
        setPhotoCommentsPhotoUrl(null);
        setPhotoCommentsOpen(true);
    }, [business?.cover_url, business?.slug, business?.handle, business?.id]);

    const openGalleryPhotoComments = useCallback((photoId, photoUrl) => {
        if (!photoId) return;
        setPhotoCommentsType('gallery');
        setPhotoCommentsPhotoId(photoId);
        setPhotoCommentsPhotoUrl(photoUrl || null);
        setPhotoCommentsOpen(true);
    }, []);

    // ── Fetch business gallery photos from API (with DB record IDs for like/comment support) ──
    const [businessGalleryPhotos, setBusinessGalleryPhotos] = useState([]);
    const [businessGalleryLoaded, setBusinessGalleryLoaded] = useState(false);

    // Simple gallery lightbox (no comments — just photo viewing)
    const [bizGalleryLbOpen, setBizGalleryLbOpen] = useState(false);
    const [bizGalleryLbIdx, setBizGalleryLbIdx] = useState(0);

    // Simple lightbox opener for gallery thumbnails.
    // Now routes through the comments dialog when a DB photo ID is
    // available (matches the Cover/Avatar UX); falls back to the simple
    // lightbox for photos without DB records.
    const openBizGalleryLightbox = useCallback((photoId, photoUrl, index) => {
        if (photoId) {
            openGalleryPhotoComments(photoId, photoUrl);
            return;
        }
        // No ID — open the simple lightbox at the right photo
        const items = businessGalleryPhotos.length > 0 ? businessGalleryPhotos : [];
        const idx = typeof index === 'number'
            ? index
            : items.findIndex((p) => {
                const purl = typeof p === 'string' ? p : (p.url || p.photo_url);
                return purl === photoUrl;
            });
        setBizGalleryLbIdx(idx >= 0 ? idx : 0);
        setBizGalleryLbOpen(true);
    }, [businessGalleryPhotos, openGalleryPhotoComments]);

    useEffect(() => {
        const slugOrId = business?.slug || business?.handle || business?.id;
        if (!slugOrId) return;
        let alive = true;
        (async () => {
            try {
                const r = await axios.get(`/api/business/photos/${encodeURIComponent(slugOrId)}`, { withCredentials: true });
                const items = Array.isArray(r.data?.photos) ? r.data.photos : [];
                if (alive) {
                    setBusinessGalleryPhotos(items);
                    setBusinessGalleryLoaded(true);
                }
            } catch {
                if (alive) setBusinessGalleryLoaded(true);
            }
        })();
        return () => { alive = false; };
    }, [business?.slug, business?.handle, business?.id]);

    // Auto-open photo comments dialog when arriving from a notification
    const [pendingPhotoHighlightId, setPendingPhotoHighlightId] = useState(null);
    const [pendingBizPhotoNotif, setPendingBizPhotoNotif] = useState(null);

    // Step 1: Capture notification state from location
    useEffect(() => {
        const st = routeLocation?.state || {};
        if (!st.llOpenPhotoComments) return;
        const nextId = st.llPhotoCommentId ? String(st.llPhotoCommentId) : null;
        setPendingPhotoHighlightId(nextId);
        const pType = st.llPhotoType || 'avatar';

        if (pType === 'cover') {
            openCoverComments();
            navigate(routeLocation.pathname, { replace: true, state: null });
        } else if (pType === 'gallery' && st.llPhotoId) {
            // Store pending — will be resolved once gallery photos are loaded
            setPendingBizPhotoNotif({
                galleryPhotoId: Number(st.llPhotoId) || null,
                galleryPhotoUrl: st.llPhotoUrl || null,
            });
            navigate(routeLocation.pathname, { replace: true, state: null });
        } else {
            openAvatarComments();
            navigate(routeLocation.pathname, { replace: true, state: null });
        }
    }, [routeLocation, navigate, openAvatarComments, openCoverComments, openGalleryPhotoComments]);

    // Step 2: Once gallery photos are loaded and we have a pending notification, open the dialog
    useEffect(() => {
        if (!pendingBizPhotoNotif) return;
        if (!businessGalleryLoaded) return; // wait for gallery photos to finish loading

        const { galleryPhotoId, galleryPhotoUrl } = pendingBizPhotoNotif;

        // Resolve the photo URL: prefer notification data, fall back to loaded gallery photos
        let resolvedUrl = galleryPhotoUrl || null;
        if (!resolvedUrl && businessGalleryPhotos.length > 0) {
            const match = businessGalleryPhotos.find((p) => Number(p.id) === Number(galleryPhotoId));
            if (match) resolvedUrl = match.url || null;
        }

        openGalleryPhotoComments(galleryPhotoId, resolvedUrl);
        setPendingBizPhotoNotif(null);
    }, [pendingBizPhotoNotif, businessGalleryLoaded, businessGalleryPhotos, openGalleryPhotoComments]);

    if (loading) {
        return (
            <Box sx={{ bgcolor: { xs: 'background.paper', md: 'background.default' }, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PulsingDots />
            </Box>
        );
    }

    if (error || !business) {
        if (isNetworkError(rawLoadError)) {
            return (
                <Box sx={{ bgcolor: { xs: 'background.paper', md: 'background.default' }, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <NetworkErrorState onRetry={() => window.location.reload()} />
                </Box>
            );
        }
        return (
            <Container maxWidth="md" sx={{ py: 8 }}>
                <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => navigate(-1)}>Go Back</Button>}>{error || 'Business not found.'}</Alert>
            </Container>
        );
    }

    // Build data
    const hasAddress = Boolean(business.address);
    const CategoryIconComp = getCategoryIcon(business.category_key);
    const categoryLabel = getCategoryLabel(business.category_key);
    const hours = business.hours || (typeof business.hours_json === 'string' ? JSON.parse(business.hours_json) : business.hours_json) || null;
    const galleryRaw = business.gallery || (typeof business.gallery_json === 'string' ? JSON.parse(business.gallery_json) : business.gallery_json) || [];
    // Prefer API-fetched photos (have DB record IDs for like/comment support);
    // fall back to raw gallery data while the fetch is in progress.
    const gallery = businessGalleryLoaded && businessGalleryPhotos.length > 0
        ? businessGalleryPhotos
        : galleryRaw;
    const hasSocials = business.facebook_url || business.instagram_url || business.twitter_url || business.linkedin_url || business.etsy_url;
    const specialHours = Array.isArray(business.special_hours) ? business.special_hours : [];
    const todayStatus = getTodayStatus(hours, specialHours);

    // Parse new profile fields
    const ownerInfo = (() => { try { const v = business.owner_info_json; return typeof v === 'string' ? JSON.parse(v) : v || null; } catch { return null; } })();
    const highlightSections = (() => { try { const v = business.highlight_sections_json; const arr = typeof v === 'string' ? JSON.parse(v) : v; return Array.isArray(arr) ? arr.filter((s) => s && (s.title || s.body)) : []; } catch { return []; } })();
    const servicesOffered = (() => { try { const v = business.services_offered_json; const arr = typeof v === 'string' ? JSON.parse(v) : v; return Array.isArray(arr) ? arr.filter(Boolean) : []; } catch { return []; } })();
    const categoryData = (() => { try { const v = business.category_data_json; return typeof v === 'string' ? JSON.parse(v) : v || {}; } catch { return {}; } })();
    const catCfg = CATEGORY_CONFIG[business.category_key] || DEFAULT_CATEGORY_CONFIG;
    const hasOwnerInfo = ownerInfo && (ownerInfo.name || ownerInfo.avatar_url);
    const additionalOwners = Array.isArray(ownerInfo?.additional_owners) ? ownerInfo.additional_owners.filter((ao) => ao && (ao.name || ao.avatar_url)) : [];

    const tabs = [
        { key: 'overview', label: 'About', icon: <OverviewIcon sx={{ fontSize: 18 }} /> },
        ...(isMobile ? [{ key: 'activity', label: 'Activity', icon: <DynamicFeedRoundedIcon sx={{ fontSize: 18 }} /> }] : []),
        { key: 'photos', label: 'Photos', icon: <PhotoIcon sx={{ fontSize: 18 }} /> },
        ...(businessAllowReviews ? [{ key: 'reviews', label: 'Reviews', icon: <ReviewIcon sx={{ fontSize: 18 }} /> }] : []),
    ];

    const activeTabKey = tabs[activeTab]?.key || 'overview';
    const isMobileActivity = activeTabKey === 'activity' && isMobile;

    const shareData = { id: business.id, title: business.name, description: business.description, city: business.city, county: business.county, og_image: business.avatar_url || business.cover_url };

    const hasPhotos = gallery.length > 0;
    const hasPosts = posts.length > 0;
    const hasReviews = reviews.length > 0;

    // ── Photo comments derived values (hooks are above early returns) ──
    const hasRealAvatar = Boolean(business.avatar_url && !business.avatar_url.includes('default_avatar') && !business.avatar_url.includes('default_business'));
    const hasRealCover = Boolean(business.cover_url);
    const businessSlugOrId = business.slug || business.handle || business.id;

    // Sidebar for other tabs (matches Overview styling)
    const SidebarContent = () => (
        <Stack spacing={2.5}>
            {/* Contact Card */}
            <Paper sx={{ p: { xs: 1.75, sm: 2.5 }, borderRadius: 3, border: '1px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.12), boxShadow: (t) => `0 2px 8px ${alpha(t.palette.primary.main, 0.06)}`, '&:hover': { boxShadow: (t) => `0 2px 8px ${alpha(t.palette.primary.main, 0.06)}` } }}>
                <SectionHeader icon={<PhoneIcon sx={{ fontSize: 20 }} />} title="Contact" compact />
                <Stack spacing={0.5}>
                    {business.phone && (
                        <Box
                            component="a"
                            href={`tel:${business.phone}`}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                textDecoration: 'none',
                                color: 'text.primary',
                                py: 1.25,
                                px: 1.5,
                                mx: -1.5,
                                borderRadius: 1.5,
                                '&:hover': { bgcolor: 'action.hover' },
                            }}
                        >
                            <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: (t) => alpha(t.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main' }}>
                                <PhoneIcon sx={{ fontSize: 18 }} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="caption" color="text.secondary">Phone</Typography>
                                <Typography variant="body2" fontWeight={600} color="primary.main">{business.phone}</Typography>
                            </Box>
                        </Box>
                    )}
                    {business.email_public && (
                        <Box
                            component="a"
                            href={`mailto:${business.email_public}`}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                textDecoration: 'none',
                                color: 'text.primary',
                                py: 1.25,
                                px: 1.5,
                                mx: -1.5,
                                borderRadius: 1.5,
                                '&:hover': { bgcolor: 'action.hover' },
                            }}
                        >
                            <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: (t) => alpha(t.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main' }}>
                                <EmailIcon sx={{ fontSize: 18 }} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="caption" color="text.secondary">Email</Typography>
                                <Typography variant="body2" fontWeight={600} color="primary.main" noWrap>{business.email_public}</Typography>
                            </Box>
                        </Box>
                    )}
                    {business.website_url && (
                        <Box
                            component="a"
                            href={business.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                textDecoration: 'none',
                                color: 'text.primary',
                                py: 1.25,
                                px: 1.5,
                                mx: -1.5,
                                borderRadius: 1.5,
                                '&:hover': { bgcolor: 'action.hover' },
                            }}
                        >
                            <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: (t) => alpha(t.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main' }}>
                                <WebsiteIcon sx={{ fontSize: 18 }} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="caption" color="text.secondary">Website</Typography>
                                <Typography variant="body2" fontWeight={600} color="primary.main" noWrap>{business.website_url?.replace(/^https?:\/\//, '')}</Typography>
                            </Box>
                        </Box>
                    )}
                    {hasAddress && (() => {
                        const addrParts = [business.address, business.city, business.county ? `${business.county} County` : null, 'Alabama'].filter(Boolean).join(', ');
                        const dirUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addrParts)}`;
                        return (
                            <Box
                                component="a"
                                href={dirUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 1.5,
                                    textDecoration: 'none',
                                    color: 'text.primary',
                                    py: 1.25,
                                    px: 1.5,
                                    mx: -1.5,
                                    borderRadius: 1.5,
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: 'action.hover' },
                                }}
                            >
                                <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: (t) => alpha(t.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main', flexShrink: 0 }}>
                                    <LocationIcon sx={{ fontSize: 18 }} />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="caption" color="text.secondary">Address</Typography>
                                    <Typography variant="body2" fontWeight={600} color="primary.main">
                                        {business.address}
                                    </Typography>
                                    <Typography variant="body2" color="primary.main" fontWeight={500}>
                                        {[business.city, business.county ? `${business.county} County` : null, 'Alabama'].filter(Boolean).join(', ')}
                                    </Typography>
                                </Box>
                            </Box>
                        );
                    })()}
                </Stack>
            </Paper>

            {/* Hours Card — hidden when business owner has disabled hours visibility */}
            {businessHoursVisible && (
                <Paper sx={{ p: { xs: 1.75, sm: 2.5 }, position: 'relative', overflow: 'hidden', borderRadius: 3, border: '1px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.12), boxShadow: (t) => `0 2px 8px ${alpha(t.palette.primary.main, 0.06)}`, '&:hover': { boxShadow: (t) => `0 2px 8px ${alpha(t.palette.primary.main, 0.06)}` } }}>
                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: todayStatus.status === 'open' ? 'success.main' : todayStatus.status === 'closed' ? 'error.main' : 'grey.300' }} />
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5, gap: 1 }}>
                        <SectionHeader icon={<TimeIcon sx={{ fontSize: 20 }} />} title="Hours" compact />
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                            {canManageBusiness && (
                                <Button
                                    size="small"
                                    variant="text"
                                    onClick={openTempHoursDialog}
                                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.7rem', px: 0.75, py: 0.25, minWidth: 0 }}
                                >
                                    Add Temporary Hours
                                </Button>
                            )}
                            {todayStatus.status !== 'unknown' && (
                                <Chip label={todayStatus.text} size="small" color={todayStatus.status === 'open' ? 'success' : todayStatus.status === 'closed' ? 'error' : 'default'} sx={{ fontWeight: 600, fontSize: '0.7rem', maxWidth: 220 }} />
                            )}
                        </Stack>
                    </Stack>
                    <BusinessHoursDisplay hours={hours} specialHours={specialHours} />
                </Paper>
            )}
        </Stack>
    );

    return (
        <ContentFadeIn triggerKey={slug}>
            <Box
                sx={{
                    bgcolor: { xs: 'background.paper', md: 'background.default' },
                    minHeight: embedded ? 'auto' : { xs: `calc(100vh - ${chromeTop}px)`, md: '100vh' },
                    pt: embedded ? 0 : { xs: `${chromeTop}px`, md: 0 },
                    pb: embedded ? 2 : { xs: `${MOBILE_BOTTOM_NAV_HEIGHT}px`, md: 4 },
                    overflowX: 'hidden',
                }}
            >
                <Container maxWidth={false} sx={{ pt: { xs: 0, md: 2 }, px: { xs: 0, md: 2 }, maxWidth: 1400 }}>
                    {/* Cover Photo + Header Card + Tabs — one seamless block */}
                    <Paper sx={{ overflow: 'hidden', border: '1px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.12), borderRadius: { xs: 0, md: 3 }, boxShadow: (t) => ({ xs: 'none', md: `0 2px 8px ${alpha(t.palette.primary.main, 0.06)}` }), '&:hover': { boxShadow: (t) => ({ xs: 'none', md: `0 2px 8px ${alpha(t.palette.primary.main, 0.06)}` }) } }}>
                        {!embedded && (cameFromBusinesses || cameFromMap || fromProfile) && (
                            <Box sx={{ px: { xs: 2, sm: 3 }, py: 1.25, borderBottom: '1px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.12) }}>
                                <Button onClick={fromProfile ? handleProfileReturn : handleBack} startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 18 }} />}
                                        sx={{ px: 1.5, py: 0.5, minWidth: 0, fontWeight: 800, fontSize: 13, textTransform: 'none', borderRadius: 999, color: 'primary.main', '&:hover': { bgcolor: 'action.hover' } }}>
                                    {fromProfile
                                        ? backProfileName
                                            ? `Return to ${backProfileName}'s profile`
                                            : 'Return to Profile'
                                        : cameFromMap
                                            ? 'Back to Map'
                                            : 'Return to Businesses'}
                                </Button>
                            </Box>
                        )}
                        {business.cover_url && (
                            <Box
                                sx={{ position: 'relative', width: '100%', paddingTop: { xs: `${100 / 2.2}%`, sm: `${100 / COVER_ASPECT_RATIO}%` }, overflow: 'hidden', bgcolor: 'primary.main', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
                                onClick={openCoverComments}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openCoverComments(); }}
                            >
                                <Box onClick={openCoverComments} sx={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(to bottom, transparent 60%, ${alpha(theme.palette.common.black, 0.30)}), url(${business.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'filter 0.2s ease', '&:hover': { filter: 'brightness(0.92)' } }} />
                            </Box>
                        )}

                        <Box sx={{ p: { xs: 2, sm: 3 } }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 3 }} alignItems={{ xs: 'center', sm: 'flex-start' }}>
                                <Box
                                    onClick={() => { if (avatarImgLoaded) openAvatarComments(); }}
                                    onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && avatarImgLoaded) openAvatarComments(); }}
                                    role={avatarImgLoaded ? 'button' : undefined}
                                    tabIndex={avatarImgLoaded ? 0 : undefined}
                                    sx={{ position: 'relative', cursor: avatarImgLoaded ? 'pointer' : 'default', WebkitTapHighlightColor: 'transparent' }}
                                >
                                    <Avatar variant="circular" src={business.avatar_url}
                                            sx={(t) => ({ width: { xs: 110, sm: 140 }, height: { xs: 110, sm: 140 }, border: '4px solid', borderColor: 'background.paper', boxShadow: 3, background: `linear-gradient(${alpha(t.palette.primary.main, 0.08)}, ${alpha(t.palette.primary.main, 0.08)}), ${t.palette.background.paper}`, color: 'primary.main', mt: business.cover_url ? { xs: -7, sm: -8 } : { xs: 3, sm: 0 }, cursor: avatarImgLoaded ? 'pointer' : 'default', transition: 'transform 0.2s ease', '&:hover': avatarImgLoaded ? { transform: 'scale(1.03)' } : {} })}
                                            imgProps={{ referrerPolicy: 'no-referrer', onLoad: () => setAvatarImgLoaded(true), onError: () => setAvatarImgLoaded(false) }}>
                                        <StorefrontOutlinedIcon sx={{ fontSize: { xs: 48, sm: 64 } }} />
                                    </Avatar>
                                    {/* Online indicator — shown when the business owner is online.
                                        Backend should populate business.owner_is_online (or ownerIsOnline). */}
                                    {!isOwnBusiness && Boolean(business?.owner_is_online || business?.ownerIsOnline) && (
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

                                <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' }, minWidth: 0 }}>
                                    {/* Top row: Name and actions */}
                                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'center', sm: 'flex-start' }} justifyContent="space-between" spacing={1}>
                                        <Box>
                                            <Stack direction="row" alignItems="center" justifyContent={{ xs: 'center', sm: 'flex-start' }} spacing={0.5} flexWrap="wrap">
                                                <Typography variant="h5" fontWeight={800}>{business.name}</Typography>
                                                {!!business.is_verified && (
                                                    <Tooltip title="Verified Local Business" arrow>
                                                        <VerifiedIcon sx={{ fontSize: 22, color: 'info.main' }} />
                                                    </Tooltip>
                                                )}
                                            </Stack>
                                            {(business.slug || business.handle) && (
                                                <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mt: 0.25 }}>
                                                    @{business.slug || business.handle}
                                                </Typography>
                                            )}
                                            <Stack direction="row" alignItems="center" justifyContent={{ xs: 'center', sm: 'flex-start' }} spacing={1} sx={{ mt: 0.5 }} flexWrap="wrap">
                                                <Chip
                                                    icon={<CategoryIconComp sx={{ fontSize: '14px !important' }} />}
                                                    label={categoryLabel}
                                                    size="small"
                                                    sx={(t) => ({
                                                        height: 24,
                                                        borderRadius: 999,
                                                        fontWeight: 800,
                                                        fontSize: 11,
                                                        bgcolor: alpha(t.palette.primary.main, 0.08),
                                                        color: t.palette.primary.main,
                                                        border: '1px solid',
                                                        borderColor: alpha(t.palette.primary.main, 0.25),
                                                        '& .MuiChip-label': { px: 0.9, lineHeight: 1 },
                                                        '& .MuiChip-icon': { ml: 0.5, color: t.palette.primary.main },
                                                    })}
                                                />
                                                {business.entity_type && business.entity_type !== 'business' && (() => {
                                                    const EntIcon = ENTITY_ICON_MAP[business.entity_type] || StorefrontIcon;
                                                    return (
                                                        <Chip
                                                            icon={<EntIcon sx={{ fontSize: '14px !important' }} />}
                                                            label={getEntityTypeLabel(business.entity_type)}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{
                                                                height: 24,
                                                                fontWeight: 800,
                                                                fontSize: '0.7rem',
                                                                '& .MuiChip-label': { px: 0.75 },
                                                                '& .MuiChip-icon': { color: 'text.secondary' },
                                                            }}
                                                        />
                                                    );
                                                })()}
                                            </Stack>
                                            {/* Hours status */}
                                            <Stack
                                                direction="row"
                                                alignItems="center"
                                                justifyContent={{ xs: 'center', sm: 'flex-start' }}
                                                spacing={1.5}
                                                sx={{ mt: 0.5 }}
                                            >
                                                {hours && hasAnyHoursSet(hours) && (() => {
                                                    const now = new Date();
                                                    const todayIdx = now.getDay();
                                                    const DAY_ORDER_H = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                                                    const DAY_DISPLAY_H = { sunday: 'Sun', monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat' };
                                                    const todayKey = DAY_ORDER_H[todayIdx];
                                                    const todayData = hours[todayKey];
                                                    let statusLabel = 'Closed';
                                                    let statusColor = 'error.main';
                                                    let detailLabel = '';
                                                    let isTemporary = false;

                                                    // Check for temporary hours override first
                                                    const todaySpecialHeader = findSpecialHoursForDate(specialHours, formatDateKeyLocal(now));
                                                    if (todaySpecialHeader) {
                                                        isTemporary = true;
                                                        if (todaySpecialHeader.closed) {
                                                            statusLabel = 'Closed'; statusColor = 'error.main'; detailLabel = 'Temporary hours';
                                                        } else if (todaySpecialHeader.allDay) {
                                                            statusLabel = 'Open'; statusColor = 'success.main'; detailLabel = '24 hours (temporary)';
                                                        } else if (todaySpecialHeader.open && todaySpecialHeader.close) {
                                                            const nowMins = now.getHours() * 60 + now.getMinutes();
                                                            const [oh, om] = (todaySpecialHeader.open || '0:0').split(':').map(Number);
                                                            const [ch, cm] = (todaySpecialHeader.close || '0:0').split(':').map(Number);
                                                            const openMins = oh * 60 + (om || 0);
                                                            const closeMins = ch * 60 + (cm || 0);
                                                            if (closeMins > openMins) {
                                                                if (nowMins >= openMins && nowMins < closeMins) { statusLabel = 'Open'; statusColor = 'success.main'; detailLabel = `Closes ${formatHoursTime(todaySpecialHeader.close)} (temporary)`; }
                                                                else { statusLabel = 'Closed'; statusColor = 'error.main'; detailLabel = nowMins < openMins ? `Opens ${formatHoursTime(todaySpecialHeader.open)} (temporary)` : 'Temporary hours'; }
                                                            } else {
                                                                if (nowMins >= openMins || nowMins < closeMins) { statusLabel = 'Open'; statusColor = 'success.main'; detailLabel = `Closes ${formatHoursTime(todaySpecialHeader.close)} (temporary)`; }
                                                                else { statusLabel = 'Closed'; statusColor = 'error.main'; detailLabel = `Opens ${formatHoursTime(todaySpecialHeader.open)} (temporary)`; }
                                                            }
                                                        } else {
                                                            statusLabel = 'Closed'; statusColor = 'error.main'; detailLabel = 'Temporary hours';
                                                        }
                                                    } else if (todayData) {
                                                        if (todayData.allDay) { statusLabel = 'Open'; statusColor = 'success.main'; detailLabel = '24 hours'; }
                                                        else if (!todayData.closed && todayData.open && todayData.close) {
                                                            const nowMins = now.getHours() * 60 + now.getMinutes();
                                                            const [oh, om] = (todayData.open || '0:0').split(':').map(Number);
                                                            const [ch, cm] = (todayData.close || '0:0').split(':').map(Number);
                                                            const openMins = oh * 60 + (om || 0);
                                                            const closeMins = ch * 60 + (cm || 0);
                                                            if (closeMins > openMins) {
                                                                if (nowMins >= openMins && nowMins < closeMins) { statusLabel = 'Open'; statusColor = 'success.main'; detailLabel = `Closes ${formatHoursTime(todayData.close)}`; }
                                                                else { statusLabel = 'Closed'; statusColor = 'error.main'; detailLabel = nowMins < openMins ? `Opens ${formatHoursTime(todayData.open)}` : ''; }
                                                            } else {
                                                                if (nowMins >= openMins || nowMins < closeMins) { statusLabel = 'Open'; statusColor = 'success.main'; detailLabel = `Closes ${formatHoursTime(todayData.close)}`; }
                                                                else { statusLabel = 'Closed'; statusColor = 'error.main'; detailLabel = `Opens ${formatHoursTime(todayData.open)}`; }
                                                            }
                                                        } else {
                                                            statusLabel = 'Closed'; statusColor = 'error.main';
                                                            for (let i = 1; i <= 7; i++) { const nIdx = (todayIdx + i) % 7; const nKey = DAY_ORDER_H[nIdx]; const nData = hours[nKey]; if (nData && !nData.closed && (nData.allDay || (nData.open && nData.close))) { detailLabel = `Opens ${DAY_DISPLAY_H[nKey]}${nData.allDay ? '' : ` ${formatHoursTime(nData.open)}`}`; break; } }
                                                        }
                                                    } else {
                                                        for (let i = 1; i <= 7; i++) { const nIdx = (todayIdx + i) % 7; const nKey = DAY_ORDER_H[nIdx]; const nData = hours[nKey]; if (nData && !nData.closed && (nData.allDay || (nData.open && nData.close))) { detailLabel = `Opens ${DAY_DISPLAY_H[nKey]}${nData.allDay ? '' : ` ${formatHoursTime(nData.open)}`}`; break; } }
                                                    }
                                                    return (
                                                        <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                                                            <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                            <Typography sx={{ fontSize: 12, fontWeight: 800, color: statusColor }}>{statusLabel}</Typography>
                                                            {detailLabel && (
                                                                <>
                                                                    <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 500 }}>&middot;</Typography>
                                                                    <Typography sx={{ fontSize: 12, color: isTemporary ? 'warning.dark' : 'text.secondary', fontWeight: 600 }}>{detailLabel}</Typography>
                                                                </>
                                                            )}
                                                            {canManageBusiness && (
                                                                <>
                                                                    <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 500 }}>&middot;</Typography>
                                                                    <Typography
                                                                        component="span"
                                                                        onClick={openTempHoursDialog}
                                                                        sx={{ fontSize: 11, fontWeight: 600, color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                                                    >
                                                                        Add Temporary Hours
                                                                    </Typography>
                                                                </>
                                                            )}
                                                        </Stack>
                                                    );
                                                })()}
                                            </Stack>
                                            {/* Review stars + count */}
                                            {reviewStats.total > 0 && (
                                                <Stack
                                                    direction="row"
                                                    alignItems="center"
                                                    justifyContent={{ xs: 'center', sm: 'flex-start' }}
                                                    spacing={0.75}
                                                    sx={{
                                                        mt: 0.75,
                                                        cursor: 'pointer',
                                                        '&:hover': { opacity: 0.8 },
                                                    }}
                                                    onClick={() => setActiveTab(Math.max(0, tabs.findIndex((t) => t.key === 'reviews')))}
                                                >
                                                    <Rating
                                                        value={reviewStats.average}
                                                        precision={0.5}
                                                        readOnly
                                                        size="small"
                                                    />
                                                    <Typography variant="body2" fontWeight={600} color="text.primary">
                                                        {reviewStats.average.toFixed(1)}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        ({reviewStats.total} {reviewStats.total === 1 ? 'review' : 'reviews'})
                                                    </Typography>
                                                </Stack>
                                            )}
                                            {/* Followers / Following stats row */}
                                            <Stack
                                                direction="row"
                                                alignItems="center"
                                                justifyContent={{ xs: 'center', sm: 'flex-start' }}
                                                spacing={1.5}
                                                divider={<Divider orientation="vertical" flexItem />}
                                                sx={{ mt: 0.75 }}
                                            >
                                                <Stack
                                                    direction="row"
                                                    alignItems="baseline"
                                                    spacing={0.5}
                                                    onClick={() => followsRef.current?.openAll(0)}
                                                    sx={{ cursor: 'pointer', '&:hover .stat-label': { textDecoration: 'underline' } }}
                                                >
                                                    <Typography variant="body2" fontWeight={700}>{followCounts.followers}</Typography>
                                                    <Typography className="stat-label" variant="caption" color="text.secondary">Followers</Typography>
                                                </Stack>
                                                <Stack
                                                    direction="row"
                                                    alignItems="baseline"
                                                    spacing={0.5}
                                                    onClick={() => followsRef.current?.openAll(1)}
                                                    sx={{ cursor: 'pointer', '&:hover .stat-label': { textDecoration: 'underline' } }}
                                                >
                                                    <Typography variant="body2" fontWeight={700}>{followCounts.following}</Typography>
                                                    <Typography className="stat-label" variant="caption" color="text.secondary">Following</Typography>
                                                </Stack>
                                            </Stack>
                                        </Box>
                                        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                                            {!isOwnBusiness && (
                                                isMobile ? (
                                                    <Tooltip title={isFollowing ? 'Following' : 'Follow'} arrow>
                                                        <IconButton
                                                            onClick={handleFollowToggle}
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
                                                        variant={isFollowing ? 'outlined' : 'contained'}
                                                        startIcon={isFollowing ? <HowToRegRoundedIcon /> : <PersonAddRoundedIcon />}
                                                        onClick={handleFollowToggle}
                                                        disabled={followBusy}
                                                        sx={{ textTransform: 'none', fontWeight: 700, fontSize: 13, borderRadius: 999, px: 2 }}
                                                    >
                                                        {isFollowing ? 'Following' : 'Follow'}
                                                    </Button>
                                                )
                                            )}

                                            {/* Message — icon on mobile, hidden on desktop (use text button below) */}
                                            {!isOwnBusiness && businessAllowMessages && (
                                                <Tooltip title="Message" arrow disableTouchListener>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            if (!viewer?.id) {
                                                                if (typeof requireAuth === 'function') {
                                                                    try { requireAuth(); } catch { /* ignore */ }
                                                                }
                                                                return;
                                                            }
                                                            setQuickMsgOpen(true);
                                                        }}
                                                        sx={{ width: 36, height: 36, border: '1px solid', borderColor: 'divider', color: 'text.secondary', '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) } }}
                                                    >
                                                        <EmailIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}

                                            {/* Share — icon button matching artist style */}
                                            <Tooltip title="Share" arrow disableTouchListener>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setShareDialogOpen(true)}
                                                    sx={{ width: 36, height: 36, border: '1px solid', borderColor: 'divider', color: 'text.secondary', '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) } }}
                                                >
                                                    <ShareIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </Tooltip>

                                            {canManageBusiness && viewer?.id && !isMobile && (
                                                <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/${business?.slug || business?.handle || slug}/admin`)} sx={{ textTransform: 'none', fontWeight: 700, fontSize: 13, borderRadius: 999, px: 2 }}>Edit Profile</Button>
                                            )}
                                            {canManageBusiness && viewer?.id && isMobile && (
                                                <Tooltip title="Edit Profile" arrow disableTouchListener>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => navigate(`/${business?.slug || business?.handle || slug}/admin`)}
                                                        sx={{ width: 36, height: 36, border: '1px solid', borderColor: 'divider', color: 'text.secondary', '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) } }}
                                                    >
                                                        <EditIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {/* 3-dot overflow menu — shown for everyone; Copy link is universal,
                                                Report / Hide / Block only render for non-linked viewers. */}
                                            <Tooltip title="More" arrow disableTouchListener>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => setBusinessMenuAnchor(e.currentTarget)}
                                                    sx={{ width: 36, height: 36, border: '1px solid', borderColor: 'divider', color: 'text.secondary', '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) } }}
                                                >
                                                    <MoreVertIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </Tooltip>
                                            <SmartMenu
                                                anchorEl={businessMenuAnchor}
                                                open={Boolean(businessMenuAnchor)}
                                                onClose={() => setBusinessMenuAnchor(null)}
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
                                                <MenuItem
                                                    onClick={() => {
                                                        setBusinessMenuAnchor(null);
                                                        const bizSlug = business?.slug || business?.handle || slug;
                                                        const url = `${window.location.origin}/${bizSlug}`;
                                                        try {
                                                            if (navigator.clipboard?.writeText) {
                                                                navigator.clipboard.writeText(url);
                                                            } else {
                                                                const ta = document.createElement('textarea');
                                                                ta.value = url;
                                                                ta.style.position = 'fixed';
                                                                ta.style.opacity = '0';
                                                                document.body.appendChild(ta);
                                                                ta.select();
                                                                document.execCommand('copy');
                                                                document.body.removeChild(ta);
                                                            }
                                                            showSuccess('Link copied');
                                                        } catch {
                                                            showSuccess('Could not copy link');
                                                        }
                                                    }}
                                                    sx={{ py: 1 }}
                                                >
                                                    <ListItemIcon><LinkRoundedIcon fontSize="small" /></ListItemIcon>
                                                    <ListItemText primary="Copy link" />
                                                </MenuItem>
                                                {!isLinkedToBusiness && (
                                                    <MenuItem onClick={() => { setBusinessMenuAnchor(null); setReportBusinessOpen(true); }} sx={{ py: 1 }}>
                                                        <ListItemIcon><FlagIcon fontSize="small" /></ListItemIcon>
                                                        <ListItemText primary="Report business" />
                                                    </MenuItem>
                                                )}
                                                {viewer?.id && !isLinkedToBusiness && (
                                                    <MenuItem onClick={hiddenPostsByMe ? handleUnhideBusiness : handleHideBusiness} disabled={hideBusy || blockBusy} sx={{ py: 1 }}>
                                                        <ListItemIcon><VisibilityOffIcon fontSize="small" /></ListItemIcon>
                                                        <ListItemText primary={hiddenPostsByMe ? 'Unhide posts' : 'Hide posts'} />
                                                    </MenuItem>
                                                )}
                                                {viewer?.id && !isLinkedToBusiness && (
                                                    <MenuItem onClick={blockedByMe ? handleUnblockBusiness : handleBlockBusiness} disabled={hideBusy || blockBusy} sx={{ py: 1, color: blockedByMe ? 'text.primary' : 'error.main' }}>
                                                        <ListItemIcon sx={{ color: blockedByMe ? 'text.primary' : 'error.main' }}><BlockIcon fontSize="small" /></ListItemIcon>
                                                        <ListItemText primary={blockedByMe ? 'Unblock business' : 'Block business'} />
                                                    </MenuItem>
                                                )}
                                            </SmartMenu>
                                        </Stack>
                                    </Stack>

                                </Box>
                            </Stack>

                        </Box>

                        <Tabs id="business-tabs" value={activeTab} onChange={(e, newVal) => { setActiveTab(newVal); if (isMobile) { const tabsEl = document.getElementById('business-tabs'); if (tabsEl) { requestAnimationFrame(() => { tabsEl.scrollIntoView({ block: 'nearest', behavior: 'auto' }); }); } } }} variant={isMobile ? 'fullWidth' : 'standard'} scrollButtons={false} sx={(t) => ({ borderTop: isMobile ? 'none' : '1px solid', borderBottom: isMobile ? '1px solid' : 'none', borderColor: 'divider', bgcolor: 'background.paper', px: { xs: 0.5, sm: 2 }, '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0', backgroundColor: t.palette.text.primary }, '& .MuiTab-root': { minHeight: isMobile ? 44 : 48, minWidth: 0, px: { xs: 1, sm: 2 }, textTransform: 'none', fontWeight: 700, fontSize: isMobile ? '0.72rem' : '0.85rem', letterSpacing: '-0.01em', color: alpha(t.palette.text.primary, 0.55), borderRadius: 0, bgcolor: 'transparent', transition: `color ${t.custom.motion.base}ms ${t.custom.motion.ease}`, '&.Mui-selected': { color: t.palette.text.primary }, '& .MuiSvgIcon-root': { color: alpha(t.palette.text.primary, 0.5), transition: `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` }, '&.Mui-selected .MuiSvgIcon-root': { color: t.palette.text.primary }, '&:hover .MuiSvgIcon-root': { color: t.palette.text.primary } } })}>
                            {tabs.map((tab) => <Tab key={tab.key} label={<Stack direction={isMobile ? "column" : "row"} alignItems="center" spacing={isMobile ? 0.25 : 0.75}>{React.cloneElement(tab.icon, { sx: { fontSize: isMobile ? 20 : 18 } })}<span>{tab.label}</span></Stack>} />)}
                        </Tabs>
                    </Paper>

                    {/* Tab content */}
                    <Box sx={{ pt: { xs: 0, md: 2.5 }, bgcolor: { xs: 'background.paper', md: 'transparent' }, minHeight: { xs: 200, md: 300 } }}>

                        {/* ── Blocked / Hidden notice ── */}
                        {blockedByMe && !isOwnBusiness && (
                            <Box sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
                                <Card variant="outlined" sx={(t) => ({ borderRadius: 3, overflow: 'hidden', borderColor: alpha(t.palette.error.main, 0.22), boxShadow: `0 14px 44px ${alpha(t.palette.text.primary, 0.10)}`, bgcolor: 'background.paper' })}>
                                    <Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                        <Box sx={(t) => ({ width: 36, height: 36, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(t.palette.error.main, 0.10), border: `1px solid ${alpha(t.palette.error.main, 0.20)}`, flexShrink: 0 })}>
                                            <BlockIcon fontSize="small" />
                                        </Box>
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.25 }}>You blocked {business?.name || 'this business'}</Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>You won't see their posts or be able to interact with their profile until you unblock them.</Typography>
                                            <Button variant="outlined" onClick={handleUnblockBusiness} sx={(t) => ({ mt: 1.25, borderRadius: 999, textTransform: 'none', fontWeight: 900, borderColor: alpha(t.palette.error.main, 0.35), color: 'error.main', '&:hover': { borderColor: alpha(t.palette.error.main, 0.55), bgcolor: alpha(t.palette.error.main, 0.06) } })}>
                                                Unblock
                                            </Button>
                                        </Box>
                                    </Box>
                                </Card>
                            </Box>
                        )}
                        {!blockedByMe && hiddenPostsByMe && !isOwnBusiness && (
                            <Box sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
                                <Card variant="outlined" sx={(t) => ({ borderRadius: 3, overflow: 'hidden', borderColor: alpha(t.palette.primary.main, 0.14), boxShadow: `0 14px 44px ${alpha(t.palette.text.primary, 0.10)}`, bgcolor: 'background.paper' })}>
                                    <Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                        <Box sx={(t) => ({ width: 36, height: 36, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(t.palette.primary.main, 0.10), border: `1px solid ${alpha(t.palette.primary.main, 0.14)}`, flexShrink: 0 })}>
                                            <VisibilityOffIcon fontSize="small" />
                                        </Box>
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.25 }}>You've hidden posts from {business?.name || 'this business'}</Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>Their posts won't show up for you until you unhide them.</Typography>
                                            <Button variant="outlined" onClick={handleUnhideBusiness} sx={{ mt: 1.25, borderRadius: 999, textTransform: 'none', fontWeight: 900 }}>
                                                Unhide posts
                                            </Button>
                                        </Box>
                                    </Box>
                                </Card>
                            </Box>
                        )}

                        {/* ============ OVERVIEW TAB ============ */}
                        {activeTabKey === 'overview' && (
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5}>
                                {/* LEFT SIDEBAR */}
                                <Box
                                    ref={sidebarRef}
                                    data-biz-sidebar={isMobile ? 'mobile' : undefined}
                                    sx={{
                                        width: { xs: '100%', md: 440 },
                                        flexShrink: 0,
                                        order: { xs: 0, md: 0 },
                                        alignSelf: { md: 'stretch' },
                                    }}
                                >
                                    {/* Mobile: strip Paper card styling — no shadows, borders, or radius. Background inherits from parent (paper). */}
                                    {isMobile && (
                                        <style>{`
                                            [data-biz-sidebar="mobile"] .MuiPaper-root {
                                                box-shadow: none !important;
                                                border-radius: 0 !important;
                                                background-color: inherit !important;
                                                background-image: none !important;
                                                border: none !important;
                                            }
                                            [data-biz-sidebar="mobile"] .MuiCard-root {
                                                box-shadow: none !important;
                                                border-radius: 0 !important;
                                                border: none !important;
                                            }
                                        `}</style>
                                    )}
                                    <Box
                                        ref={sidebarContentRef}
                                        sx={{
                                            position: { md: 'sticky' },
                                            top: { md: sidebarStickyTop },
                                            transition: (t) => `top ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                                        }}
                                    >
                                        <Stack spacing={{ xs: 0, sm: 2.5 }}>
                                            {/* About */}
                                            <Paper sx={{ p: { xs: 1.75, sm: 2.5 }, borderRadius: 3, border: '1px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.12), boxShadow: (t) => `0 2px 8px ${alpha(t.palette.primary.main, 0.06)}`, '&:hover': { boxShadow: (t) => `0 2px 8px ${alpha(t.palette.primary.main, 0.06)}` } }}>
                                                {!isMobile && <SectionHeader icon={<NotesOutlinedIcon sx={{ fontSize: 20 }} />} title="About" compact />}
                                                {business.description ? (
                                                    <Box>
                                                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                                            {business.description.length > 700 && !descExpanded ? `${business.description.slice(0, 700).trim()}...` : business.description}
                                                        </Typography>
                                                        {business.description.length > 700 && (
                                                            <Typography component="span" onClick={() => setDescExpanded((v) => !v)} sx={{ fontSize: 12, fontWeight: 800, color: 'primary.main', cursor: 'pointer', mt: 0.5, display: 'inline-block', '&:hover': { textDecoration: 'underline' } }}>
                                                                {descExpanded ? 'Show less' : 'Read more'}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                ) : (
                                                    <Box sx={{ minHeight: ABOUT_MIN_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Typography variant="body2" color="text.secondary" fontStyle="italic">No description provided.</Typography>
                                                    </Box>
                                                )}

                                                {/* Owner Info */}
                                                {hasOwnerInfo && (
                                                    <>
                                                        <Divider sx={{ my: 2 }} />
                                                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                                                            <PersonIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                                                            <Typography sx={{ fontWeight: 900, fontSize: 14 }}>{ownerInfo.section_title || (additionalOwners.length > 0 ? 'Meet the Owners' : 'Meet the Owner')}</Typography>
                                                        </Stack>
                                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                                            <Avatar src={ownerInfo.avatar_url || undefined} alt={ownerInfo.name || 'Owner'} variant="rounded" onClick={() => { if (ownerInfo.avatar_url) setPhotoPreviewSrc(ownerInfo.avatar_url); }} sx={{ width: 90, height: 90, borderRadius: 2.5, border: '2px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.12), boxShadow: (t) => `0 2px 12px ${alpha(t.palette.common.black, 0.08)}`, ...(ownerInfo.avatar_url ? { cursor: 'pointer', transition: 'opacity 0.15s', '&:hover': { opacity: 0.85 } } : {}) }} imgProps={{ referrerPolicy: 'no-referrer' }}>
                                                                <PersonIcon sx={{ fontSize: 36, color: 'text.disabled' }} />
                                                            </Avatar>
                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                <Typography sx={{ fontWeight: 900, fontSize: 13.5, lineHeight: 1.2 }}>{ownerInfo.name}</Typography>
                                                                {ownerInfo.title && <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: 'text.secondary', mt: 0.15 }}>{ownerInfo.title}</Typography>}
                                                            </Box>
                                                        </Stack>
                                                        {ownerInfo.about && <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>{ownerInfo.about}</Typography>}
                                                        {additionalOwners.map((ao, aoIdx) => (
                                                            <React.Fragment key={aoIdx}>
                                                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.5 }}>
                                                                    <Avatar src={ao.avatar_url || undefined} alt={ao.name || 'Team'} onClick={() => { if (ao.avatar_url) setPhotoPreviewSrc(ao.avatar_url); }} sx={{ width: 40, height: 40, borderRadius: 2, border: '2px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.10), ...(ao.avatar_url ? { cursor: 'pointer', transition: 'opacity 0.15s', '&:hover': { opacity: 0.85 } } : {}) }} imgProps={{ referrerPolicy: 'no-referrer' }}>
                                                                        <PersonIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
                                                                    </Avatar>
                                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                        <Typography sx={{ fontWeight: 900, fontSize: 12.5, lineHeight: 1.2 }}>{ao.name}</Typography>
                                                                        {ao.title && <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', mt: 0.15 }}>{ao.title}</Typography>}
                                                                    </Box>
                                                                </Stack>
                                                                {ao.about && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>{ao.about}</Typography>}
                                                            </React.Fragment>
                                                        ))}
                                                    </>
                                                )}

                                                {/* Highlight Sections */}
                                                {highlightSections.length > 0 && (
                                                    <>
                                                        <Divider sx={{ my: 2 }} />
                                                        {highlightSections.map((sec, idx) => {
                                                            const HlIcon = HL_ICONS[sec.icon] || StarRoundedIcon;
                                                            return (
                                                                <Box key={idx} sx={{ mb: 1.5, borderRadius: 2.5, overflow: 'hidden', border: '1px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.15), bgcolor: (t) => alpha(t.palette.primary.main, 0.03) }}>
                                                                    {sec.title && (
                                                                        <Box sx={{ px: 1.5, py: 0.65, bgcolor: (t) => alpha(t.palette.primary.main, 0.07), borderBottom: '1px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.12), display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                                            <HlIcon sx={{ fontSize: 15, color: 'primary.main' }} />
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
                                                            );
                                                        })}
                                                    </>
                                                )}

                                                {/* Services & Pricing (merged) */}
                                                {(() => {
                                                    const cd = categoryData || {};
                                                    const hasPrice = cd.price_range;
                                                    const extraFields = (catCfg.extraFields || []).filter((f) => { const val = cd[f.key]; if (Array.isArray(val)) return val.length > 0; return Boolean(val); });
                                                    const hasCategoryDetails = hasPrice || extraFields.length > 0;
                                                    const builderCfg = catCfg.builder;
                                                    const isServiceMenu = builderCfg && builderCfg.type === 'service_menu';
                                                    const svcMenuItems = isServiceMenu ? (Array.isArray(cd[builderCfg.dataKey]) ? cd[builderCfg.dataKey] : []).filter((it) => it && it.name) : [];
                                                    const hasAnything = servicesOffered.length > 0 || hasCategoryDetails || svcMenuItems.length > 0;
                                                    if (!hasAnything) return null;
                                                    const labelSx = { fontSize: 10.5, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.4 };
                                                    const hasPricingData = hasPrice || svcMenuItems.some((it) => it.price);
                                                    const servicesHeading = hasPricingData ? (catCfg.servicesLabel || 'Services & Pricing') : 'Services';
                                                    return (
                                                        <>
                                                            <Divider sx={{ my: 2 }} />
                                                            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                                                                <CategoryIconComp sx={{ fontSize: 18, color: 'primary.main' }} />
                                                                <Typography sx={{ fontWeight: 900, fontSize: 14 }}>{servicesHeading}</Typography>
                                                            </Stack>
                                                            {servicesOffered.length > 0 && (
                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: hasCategoryDetails || svcMenuItems.length > 0 ? 1.5 : 0 }}>
                                                                    {servicesOffered.map((svc) => <Chip key={svc} label={svc} size="small" variant="outlined" sx={{ fontSize: 11, fontWeight: 700, height: 24, borderRadius: 999 }} />)}
                                                                </Box>
                                                            )}
                                                            {hasCategoryDetails && (
                                                                <Stack spacing={1.25} sx={{ mb: svcMenuItems.length > 0 ? 1.5 : 0 }}>
                                                                    {hasPrice && (
                                                                        <Box>
                                                                            <Typography sx={labelSx}>Price Range</Typography>
                                                                            <Chip label={`${cd.price_range} · ${cd.price_range === '$' ? 'Budget-friendly' : cd.price_range === '$$' ? 'Moderate' : cd.price_range === '$$$' ? 'Upscale' : 'Premium'}`} size="small" sx={(t) => ({ fontWeight: 700, fontSize: 11, height: 26, bgcolor: alpha(t.palette.primary.main, 0.08), color: 'primary.dark', borderRadius: 999 })} />
                                                                        </Box>
                                                                    )}
                                                                    {extraFields.map((f) => {
                                                                        const val = cd[f.key];
                                                                        if (f.type === 'toggle') return null;
                                                                        if (f.type === 'multiselect' && Array.isArray(val)) return (<Box key={f.key}><Typography sx={labelSx}>{f.label}</Typography><Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{val.map((v) => <Chip key={v} label={v} size="small" variant="outlined" sx={{ fontSize: 10, fontWeight: 600, height: 22, borderRadius: 999 }} />)}</Box></Box>);
                                                                        if (f.type === 'select' || f.type === 'text') return (<Box key={f.key}><Typography sx={labelSx}>{f.label}</Typography><Typography sx={{ fontSize: 12, color: 'text.primary', fontWeight: 700 }}>{val}</Typography></Box>);
                                                                        return null;
                                                                    })}
                                                                    {(() => {
                                                                        const toggles = extraFields.filter((f) => f.type === 'toggle' && cd[f.key]);
                                                                        if (toggles.length === 0) return null;
                                                                        return (<Stack spacing={0}>{toggles.map((f) => (<Stack key={f.key} direction="row" alignItems="center" spacing={0.75} sx={{ py: 0.35 }}><CheckCircleRoundedIcon sx={{ fontSize: 18, color: 'success.main' }} /><Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.primary' }}>{f.label}</Typography></Stack>))}</Stack>);
                                                                    })()}
                                                                </Stack>
                                                            )}
                                                            {svcMenuItems.length > 0 && (
                                                                <Stack spacing={1}>
                                                                    {svcMenuItems.slice(0, 3).map((item, idx) => (
                                                                        <Box key={idx} sx={(t) => ({ borderRadius: 2.5, overflow: 'hidden', border: `1px solid ${alpha(t.palette.primary.main, 0.15)}`, bgcolor: alpha(t.palette.primary.main, 0.03) })}>
                                                                            {item.photo_url && <Box component="img" src={item.photo_url} alt={item.name} referrerPolicy="no-referrer" onClick={() => setPhotoPreviewSrc(item.photo_url)} sx={{ width: '100%', height: 'auto', maxHeight: 200, objectFit: 'cover', display: 'block', cursor: 'pointer', transition: 'opacity 0.15s', '&:hover': { opacity: 0.85 } }} />}
                                                                            <Box sx={{ p: 1.25 }}>
                                                                                <Stack direction="row" justifyContent="space-between" alignItems="baseline"><Typography sx={{ fontWeight: 800, fontSize: 12.5 }}>{item.name}</Typography>{item.price && <Typography sx={{ fontWeight: 800, fontSize: 12, color: 'primary.main', flexShrink: 0, ml: 1 }}>${item.price}</Typography>}</Stack>
                                                                                {item.description && <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500, lineHeight: 1.3, mt: 0.15 }}>{item.description}</Typography>}
                                                                            </Box>
                                                                        </Box>
                                                                    ))}
                                                                    {svcMenuItems.length > 3 && <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'primary.main', textAlign: 'center' }}>+{svcMenuItems.length - 3} more services</Typography>}
                                                                </Stack>
                                                            )}
                                                        </>
                                                    );
                                                })()}

                                                {/* Non-service_menu builders (menu, provider, class, accommodation) */}
                                                {(() => {
                                                    const cd = categoryData || {};
                                                    const builderCfg = catCfg.builder;
                                                    if (!builderCfg || builderCfg.type === 'service_menu') return null;
                                                    const rawItems = Array.isArray(cd[builderCfg.dataKey]) ? cd[builderCfg.dataKey] : [];
                                                    const valid = rawItems.filter((it) => it && it.name);
                                                    if (valid.length === 0) return null;
                                                    const title = builderCfg.builderTitle || 'Details';
                                                    const BIcon = BUILDER_ICON_MAP[builderCfg.type] || BuildIcon;
                                                    return (
                                                        <>
                                                            <Divider sx={{ my: 2 }} />
                                                            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                                                                <BIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                                                                <Typography sx={{ fontWeight: 900, fontSize: 14 }}>{title}</Typography>
                                                            </Stack>
                                                            <Stack spacing={1}>
                                                                {valid.slice(0, 3).map((item, idx) => (
                                                                    <Stack key={idx} spacing={0} sx={(t) => ({ borderRadius: 2, overflow: 'hidden', bgcolor: alpha(t.palette.primary.main, 0.03), border: `1px solid ${alpha(t.palette.primary.main, 0.1)}` })}>
                                                                        {item.photo_url && <Box component="img" src={item.photo_url} alt={item.name} referrerPolicy="no-referrer" onClick={() => setPhotoPreviewSrc(item.photo_url)} sx={{ width: '100%', height: 'auto', maxHeight: 200, objectFit: 'cover', display: 'block', cursor: 'pointer', transition: 'opacity 0.15s', '&:hover': { opacity: 0.85 } }} />}
                                                                        {!item.photo_url && item.name && <Avatar sx={{ width: '100%', height: 120, borderRadius: 0, bgcolor: (t) => alpha(t.palette.primary.main, 0.08), fontSize: 20, fontWeight: 800, color: 'primary.main' }}>{item.name[0]}</Avatar>}
                                                                        <Box sx={{ p: 1 }}>
                                                                            <Typography sx={{ fontWeight: 800, fontSize: 12 }}>{item.name}</Typography>
                                                                            {(item.description || item.bio || item.specialty || item.title) && <Typography sx={{ fontSize: 10.5, color: 'text.secondary', fontWeight: 500, lineHeight: 1.3 }}>{item.description || item.bio || item.specialty || item.title}</Typography>}
                                                                        </Box>
                                                                    </Stack>
                                                                ))}
                                                                {valid.length > 3 && <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'primary.main', textAlign: 'center' }}>+{valid.length - 3} more</Typography>}
                                                            </Stack>
                                                        </>
                                                    );
                                                })()}

                                                {/* Connect — social links (matching UserProfilePage style) */}
                                                {hasSocials && (() => {
                                                    const links = [
                                                        business.website_url && { key: 'website', url: business.website_url.startsWith('http') ? business.website_url : `https://${business.website_url}`, icon: <WebsiteIcon sx={{ fontSize: 18 }} />, color: null, label: 'Website' },
                                                        business.facebook_url && { key: 'facebook', url: buildSocialUrl(business.facebook_url, 'facebook'), icon: <FacebookIcon sx={{ fontSize: 18 }} />, color: '#1877F2', label: 'Facebook' },
                                                        business.instagram_url && { key: 'instagram', url: buildSocialUrl(business.instagram_url, 'instagram'), icon: <InstagramIcon sx={{ fontSize: 18 }} />, color: '#E4405F', label: 'Instagram' },
                                                        business.twitter_url && { key: 'x', url: buildSocialUrl(business.twitter_url, 'twitter'), icon: <XIcon sx={{ fontSize: 16 }} />, color: null, label: 'X (Twitter)' },
                                                        business.linkedin_url && { key: 'linkedin', url: buildSocialUrl(business.linkedin_url, 'linkedin'), icon: <LinkedInIcon sx={{ fontSize: 18 }} />, color: '#0A66C2', label: 'LinkedIn' },
                                                        business.etsy_url && { key: 'etsy', url: buildSocialUrl(business.etsy_url, 'etsy'), icon: <StorefrontRoundedIcon sx={{ fontSize: 18 }} />, color: '#F1641E', label: 'Etsy Shop' },
                                                    ].filter(Boolean);
                                                    if (!links.length) return null;
                                                    return (
                                                        <>
                                                            <Divider sx={{ my: 2 }} />
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                                <LinkRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                                                                <Typography sx={{ fontWeight: 900, fontSize: 15 }}>Connect</Typography>
                                                            </Box>
                                                            <Stack spacing={0.5}>
                                                                {links.map((l) => (
                                                                    <Box
                                                                        key={l.key}
                                                                        component="a"
                                                                        href={l.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        sx={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: 1.5,
                                                                            textDecoration: 'none',
                                                                            color: 'text.primary',
                                                                            py: 1,
                                                                            px: 1.5,
                                                                            mx: -1.5,
                                                                            borderRadius: 1.5,
                                                                            '&:hover': { bgcolor: 'action.hover' },
                                                                        }}
                                                                    >
                                                                        <Box sx={(t) => { const c = l.color || t.palette.text.primary; return { width: 36, height: 36, borderRadius: 1.5, bgcolor: alpha(c, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: c }; }}>
                                                                            {l.icon}
                                                                        </Box>
                                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                            <Typography variant="body2" fontWeight={600} sx={(t) => ({ color: l.color || t.palette.text.primary })} noWrap>{l.label}</Typography>
                                                                        </Box>
                                                                    </Box>
                                                                ))}
                                                            </Stack>
                                                        </>
                                                    );
                                                })()}
                                            </Paper>
                                            <Paper sx={{ p: { xs: 1.75, sm: 2.5 }, borderRadius: 3, border: '1px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.12), boxShadow: (t) => `0 2px 8px ${alpha(t.palette.primary.main, 0.06)}`, '&:hover': { boxShadow: (t) => `0 2px 8px ${alpha(t.palette.primary.main, 0.06)}` } }}>
                                                <SectionHeader icon={<PhoneIcon sx={{ fontSize: 20 }} />} title="Contact" compact />
                                                <Stack spacing={0.5}>
                                                    {business.phone && (
                                                        <Box
                                                            component="a"
                                                            href={`tel:${business.phone}`}
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 1.5,
                                                                textDecoration: 'none',
                                                                color: 'text.primary',
                                                                py: 1.25,
                                                                px: 1.5,
                                                                mx: -1.5,
                                                                borderRadius: 1.5,
                                                                '&:hover': { bgcolor: 'action.hover' },
                                                            }}
                                                        >
                                                            <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: (t) => alpha(t.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main' }}>
                                                                <PhoneIcon sx={{ fontSize: 18 }} />
                                                            </Box>
                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                <Typography variant="caption" color="text.secondary">Phone</Typography>
                                                                <Typography variant="body2" fontWeight={600} color="primary.main">{business.phone}</Typography>
                                                            </Box>
                                                        </Box>
                                                    )}
                                                    {business.email_public && (
                                                        <Box
                                                            component="a"
                                                            href={`mailto:${business.email_public}`}
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 1.5,
                                                                textDecoration: 'none',
                                                                color: 'text.primary',
                                                                py: 1.25,
                                                                px: 1.5,
                                                                mx: -1.5,
                                                                borderRadius: 1.5,
                                                                '&:hover': { bgcolor: 'action.hover' },
                                                            }}
                                                        >
                                                            <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: (t) => alpha(t.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main' }}>
                                                                <EmailIcon sx={{ fontSize: 18 }} />
                                                            </Box>
                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                <Typography variant="caption" color="text.secondary">Email</Typography>
                                                                <Typography variant="body2" fontWeight={600} color="primary.main" noWrap>{business.email_public}</Typography>
                                                            </Box>
                                                        </Box>
                                                    )}
                                                    {business.website_url && (
                                                        <Box
                                                            component="a"
                                                            href={business.website_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 1.5,
                                                                textDecoration: 'none',
                                                                color: 'text.primary',
                                                                py: 1.25,
                                                                px: 1.5,
                                                                mx: -1.5,
                                                                borderRadius: 1.5,
                                                                '&:hover': { bgcolor: 'action.hover' },
                                                            }}
                                                        >
                                                            <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: (t) => alpha(t.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main' }}>
                                                                <WebsiteIcon sx={{ fontSize: 18 }} />
                                                            </Box>
                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                <Typography variant="caption" color="text.secondary">Website</Typography>
                                                                <Typography variant="body2" fontWeight={600} color="primary.main" noWrap>{business.website_url?.replace(/^https?:\/\//, '')}</Typography>
                                                            </Box>
                                                        </Box>
                                                    )}
                                                    {hasAddress && (() => {
                                                        const addrParts = [business.address, business.city, business.county ? `${business.county} County` : null, 'Alabama'].filter(Boolean).join(', ');
                                                        const dirUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addrParts)}`;
                                                        return (
                                                            <Box
                                                                component="a"
                                                                href={dirUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'flex-start',
                                                                    gap: 1.5,
                                                                    textDecoration: 'none',
                                                                    color: 'text.primary',
                                                                    py: 1.25,
                                                                    px: 1.5,
                                                                    mx: -1.5,
                                                                    borderRadius: 1.5,
                                                                    cursor: 'pointer',
                                                                    '&:hover': { bgcolor: 'action.hover' },
                                                                }}
                                                            >
                                                                <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: (t) => alpha(t.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main', flexShrink: 0 }}>
                                                                    <LocationIcon sx={{ fontSize: 18 }} />
                                                                </Box>
                                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                    <Typography variant="caption" color="text.secondary">Address</Typography>
                                                                    <Typography variant="body2" fontWeight={600} color="primary.main">
                                                                        {business.address}
                                                                    </Typography>
                                                                    <Typography variant="body2" color="primary.main" fontWeight={500}>
                                                                        {[business.city, business.county ? `${business.county} County` : null, 'Alabama'].filter(Boolean).join(', ')}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        );
                                                    })()}
                                                    {/* Map Preview - show when business has coordinates */}
                                                    {business.latitude && business.longitude && (() => {
                                                        const addrParts = [business.address, business.city, business.county ? `${business.county} County` : null, 'Alabama'].filter(Boolean).join(', ');
                                                        const hasStreet = Boolean(business.address);
                                                        const mapQuery = hasStreet
                                                            ? `https://www.google.com/maps/embed/v1/place?key=${process.env.REACT_APP_GOOGLE_API_KEY || ''}&q=${encodeURIComponent(addrParts)}&zoom=15`
                                                            : `https://www.google.com/maps/embed/v1/view?key=${process.env.REACT_APP_GOOGLE_API_KEY || ''}&center=${business.latitude},${business.longitude}&zoom=11`;
                                                        const dirQuery = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addrParts)}`;
                                                        return (
                                                            <Box
                                                                component="a"
                                                                href={dirQuery}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                sx={{
                                                                    display: 'block',
                                                                    mt: 1,
                                                                    mx: -1.5,
                                                                    mb: -1.5,
                                                                    borderRadius: '0 0 12px 12px',
                                                                    overflow: 'hidden',
                                                                    textDecoration: 'none',
                                                                    '&:hover': { opacity: 0.95 },
                                                                }}
                                                            >
                                                                <Box
                                                                    component="iframe"
                                                                    src={mapQuery}
                                                                    sx={{
                                                                        width: '100%',
                                                                        height: 150,
                                                                        border: 0,
                                                                        pointerEvents: 'none',
                                                                    }}
                                                                    allowFullScreen={false}
                                                                    loading="lazy"
                                                                    referrerPolicy="no-referrer-when-downgrade"
                                                                    title={`Map showing ${business.name} location`}
                                                                />
                                                                <Box
                                                                    sx={{
                                                                        py: 1,
                                                                        px: 1.5,
                                                                        bgcolor: 'primary.main',
                                                                        color: 'common.white',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        gap: 0.75,
                                                                    }}
                                                                >
                                                                    <LocationIcon sx={{ fontSize: 16 }} />
                                                                    <Typography variant="body2" fontWeight={600}>
                                                                        {hasStreet ? 'Get Directions' : 'View on Map'}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        );
                                                    })()}
                                                </Stack>
                                            </Paper>

                                            {/* Followers & Following Card — desktop only */}
                                            {!isMobile && (
                                                <Card variant="outlined" sx={(t) => ({ borderRadius: 3, overflow: 'hidden', borderColor: alpha(t.palette.primary.main, 0.14), boxShadow: `0 2px 8px ${alpha(t.palette.primary.main, 0.06)}` })}>
                                                    <Box sx={(t) => ({ px: { xs: 1.5, sm: 2 }, py: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, borderBottom: '1px solid', borderColor: alpha(t.palette.primary.main, 0.10) })}>
                                                        <Stack direction="row" alignItems="center" spacing={1}>
                                                            <PeopleAltOutlinedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                                                            <Typography variant="h6" sx={{ fontWeight: 900 }}>Followers & Following</Typography>
                                                        </Stack>
                                                        <Button size="small" onClick={() => followsRef.current?.openAll()}>VIEW ALL</Button>
                                                    </Box>
                                                    <CardContent sx={{ pt: 0.5, pb: 1.25 }}>
                                                        <FollowsSection
                                                            ref={followsRef}
                                                            viewer={viewer}
                                                            profileId={business?.id}
                                                            profileHandle={business?.slug || business?.handle}
                                                            profileAvatar={business?.avatar_url}
                                                            profileName={business?.name || ''}
                                                            profileUsername={business?.slug || business?.handle || business?.id}
                                                            onFlash={(msg) => {
                                                                const text = typeof msg === 'string' ? msg : msg?.text || '';
                                                                setFollowsSnack(text);
                                                            }}
                                                            refreshNonce={followsRefreshNonce}
                                                            showFollowingTabInSection={true}
                                                            fillHeight={false}
                                                            onCountsChange={setFollowCounts}
                                                            accountType="business"
                                                            accountId={business?.id}
                                                            ownerUserId={viewer?.id}
                                                            isOwner={isOwnBusiness}
                                                        />
                                                    </CardContent>
                                                </Card>
                                            )}

                                            {/* Hours Card — hidden when business owner has disabled hours visibility */}
                                            {businessHoursVisible && (
                                                <Paper sx={{ p: { xs: 1.75, sm: 2.5 }, position: 'relative', overflow: 'hidden', borderRadius: 3, border: '1px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.12), boxShadow: (t) => `0 2px 8px ${alpha(t.palette.primary.main, 0.06)}`, '&:hover': { boxShadow: (t) => `0 2px 8px ${alpha(t.palette.primary.main, 0.06)}` } }}>
                                                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: todayStatus.status === 'open' ? 'success.main' : todayStatus.status === 'closed' ? 'error.main' : 'grey.300' }} />
                                                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5, gap: 1 }}>
                                                        <SectionHeader icon={<TimeIcon sx={{ fontSize: 20 }} />} title="Hours" compact />
                                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                                                            {canManageBusiness && (
                                                                <Button
                                                                    size="small"
                                                                    variant="text"
                                                                    onClick={openTempHoursDialog}
                                                                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.7rem', px: 0.75, py: 0.25, minWidth: 0 }}
                                                                >
                                                                    Add Temporary Hours
                                                                </Button>
                                                            )}
                                                            {todayStatus.status !== 'unknown' && (
                                                                <Chip label={todayStatus.text} size="small" color={todayStatus.status === 'open' ? 'success' : todayStatus.status === 'closed' ? 'error' : 'default'} sx={{ fontWeight: 600, fontSize: '0.7rem', maxWidth: 220 }} />
                                                            )}
                                                        </Stack>
                                                    </Stack>
                                                    <BusinessHoursDisplay hours={hours} specialHours={specialHours} />
                                                </Paper>
                                            )}

                                            {/* Photos Preview */}
                                            <Paper sx={{ p: { xs: 1.75, sm: 2.5 }, borderRadius: 3, border: '1px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.12), boxShadow: (t) => `0 2px 8px ${alpha(t.palette.primary.main, 0.06)}`, '&:hover': { boxShadow: (t) => `0 2px 8px ${alpha(t.palette.primary.main, 0.06)}` } }}>
                                                <SectionHeader
                                                    icon={<PhotoIcon sx={{ fontSize: 20 }} />}
                                                    title="Photos"
                                                    compact
                                                    action={hasPhotos && (
                                                        <Button size="small" onClick={() => setActiveTab(Math.max(0, tabs.findIndex((t) => t.key === 'photos')))} endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />} sx={{ textTransform: 'none', fontWeight: 700 }}>
                                                            View All
                                                        </Button>
                                                    )}
                                                />
                                                {hasPhotos ? (
                                                    <PhotoGallery
                                                        images={gallery}
                                                        businessName={business.name}
                                                        maxDisplay={4}
                                                        isOverview
                                                        onViewAll={() => setActiveTab(Math.max(0, tabs.findIndex((t) => t.key === 'photos')))}
                                                        onPhotoClick={openBizGalleryLightbox}
                                                    />
                                                ) : (
                                                    <EmptyStateCard icon={<PhotoIcon sx={{ fontSize: 40 }} />} title="No photos yet" description={`${business.name} hasn't added any photos yet.`} compact />
                                                )}
                                            </Paper>

                                            {/* Reviews Preview — only shown when reviews are enabled */}
                                            {businessAllowReviews && (
                                                <Paper sx={{ p: { xs: 1.75, sm: 2.5 }, borderRadius: 3, border: '1px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.12), boxShadow: (t) => `0 2px 8px ${alpha(t.palette.primary.main, 0.06)}`, '&:hover': { boxShadow: (t) => `0 2px 8px ${alpha(t.palette.primary.main, 0.06)}` } }}>
                                                    <SectionHeader
                                                        icon={<ReviewIcon sx={{ fontSize: 20 }} />}
                                                        title="Reviews"
                                                        compact
                                                        action={
                                                            <Button size="small" onClick={() => setActiveTab(tabs.findIndex((t) => t.key === 'reviews'))} endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />} sx={{ textTransform: 'none', fontWeight: 700 }}>
                                                                View All
                                                            </Button>
                                                        }
                                                    />
                                                    {hasReviews ? (
                                                        <Box>
                                                            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                                                                <Typography variant="h4" fontWeight={800} color="primary.main">{reviewStats.average.toFixed(1)}</Typography>
                                                                <Box>
                                                                    <StarRating value={reviewStats.average} size="small" showValue={false} />
                                                                    <Typography variant="body2" color="text.secondary">{reviewStats.total} {reviewStats.total === 1 ? 'review' : 'reviews'}</Typography>
                                                                </Box>
                                                            </Stack>
                                                            {/* Show latest review preview */}
                                                            {reviews.length > 0 && (
                                                                <Box sx={{ p: 2, bgcolor: (t) => alpha(t.palette.primary.main, 0.04), borderRadius: 2 }}>
                                                                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                                                        <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                                                                            {reviews[0].author?.[0]?.toUpperCase() || 'U'}
                                                                        </Avatar>
                                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                            <Typography variant="body2" fontWeight={600} noWrap>{reviews[0].author || 'Anonymous'}</Typography>
                                                                            <StarRating value={reviews[0].rating} size="small" showValue={false} />
                                                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                                                {reviews[0].text || reviews[0].comment || 'Great experience!'}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Stack>
                                                                </Box>
                                                            )}
                                                            {!isOwnBusiness && viewer?.id && (
                                                                <Button
                                                                    fullWidth
                                                                    variant="outlined"
                                                                    startIcon={<ReviewIcon />}
                                                                    onClick={handleOpenWriteReview}
                                                                    sx={{ mt: 2, textTransform: 'none', fontWeight: 600 }}
                                                                >
                                                                    {userReview ? 'Edit Your Review' : 'Write a Review'}
                                                                </Button>
                                                            )}
                                                        </Box>
                                                    ) : isOwnBusiness ? (
                                                        <Box sx={{ textAlign: 'center', py: 2 }}>
                                                            <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>No reviews on your business yet. When customers share their experience, it will show up here.</Typography>
                                                        </Box>
                                                    ) : (
                                                        <Box sx={{ textAlign: 'center', py: 2 }}>
                                                            <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600, mb: 2 }}>No reviews yet. Be the first!</Typography>
                                                            {viewer?.id && (
                                                                <Button
                                                                    variant="contained"
                                                                    startIcon={<ReviewIcon />}
                                                                    onClick={handleOpenWriteReview}
                                                                    sx={{ textTransform: 'none', fontWeight: 600 }}
                                                                >
                                                                    Write a Review
                                                                </Button>
                                                            )}
                                                        </Box>
                                                    )}
                                                </Paper>
                                            )}
                                        </Stack>
                                    </Box>
                                </Box>

                                {/* RIGHT MAIN - Tabbed Engagement (Posts / Events / Jobs / Services) — hidden on mobile (shown in Activity tab) */}
                                <Box sx={{ flex: 1, minWidth: 0, order: { xs: 0, md: 1 }, display: { xs: 'none', md: 'block' } }}>
                                    <BusinessEngagementTabs
                                        business={business}
                                        viewer={viewer}
                                        isOwnBusiness={isOwnBusiness}
                                        canCreatePosts={canCreatePosts}
                                        onCreatePost={handleOpenCreatePost}
                                        posts={posts}
                                        postsLoading={postsLoading}
                                        canEditPosts={canEditPosts}
                                        canPinPosts={canPinPosts}
                                        onPinPost={handlePinPost}
                                        onUnpinPost={handleUnpinPost}
                                        onEditPost={handleEditPost}
                                        onDeletePost={handleDeletePost}
                                        onReportPost={handleReportPost}
                                        onSharePost={handleSharePost}
                                        activeAccount={acctObj}
                                        initialPostsSubTab={returnState?.postsSubTab || 0}
                                        onPostsSubTabChange={handlePostsSubTabChange}
                                        onBeforeNavigate={saveBusinessScrollState}
                                        businessSlug={business?.slug || business?.handle || slug}
                                        parentActiveTab={activeTab}
                                        onPostClick={(post) => {
                                            setPostScrollToCommentId(null);
                                            setPostHighlightCommentId(null);
                                            setSelectedPost(post);
                                        }}
                                        blockedAndHiddenUserIds={blockedAndHiddenUserIds}
                                        blockedBusinessIds={blockedBusinessIds}
                                        blockedArtistIds={blockedArtistIds}
                                        viewerFollowingIds={viewerFollowingIds}
                                        stickyTabs
                                        searchQuery={committedSearchQuery}
                                        serviceRequestsNonce={serviceRequestsNonce}
                                        hasEvents={eventsTotalCount > 0}
                                        eventsCount={eventsTotalCount}
                                        eventsContent={
                                            <EventsSubTabs
                                                business={business}
                                                viewer={viewer}
                                                slug={slug}
                                                navigate={navigate}
                                                getAcctHeaders={getAcctHeaders}
                                                initialEventSubTab={0}
                                                onTotalCountChange={setEventsTotalCount}
                                                canCreateEvents={canCreatePosts}
                                                isOwnBusiness={isOwnBusiness}
                                                onEventClick={(evt, commentId) => {
                                                    setEventScrollToCommentId(commentId || null);
                                                    setEventHighlightCommentId(commentId || null);
                                                    setSelectedEventPopup(evt);
                                                }}
                                            />
                                        }
                                        hasJobs={bizHasJobs}
                                        hasServices={bizHasServices}
                                        onJobClick={(job) => {
                                            setSelectedJobPopup(job);
                                        }}
                                        onEditJob={(job) => {
                                            setEditingJob(job);
                                            setEditJobOpen(true);
                                        }}
                                        onDeleteJobClick={(job) => {
                                            setDeleteJobTarget(job);
                                        }}
                                        onJobApply={(job) => {
                                            setApplyJobTarget(job);
                                        }}
                                        onJobRenew={(job) => {
                                            const rawExpiry = job?.expiresAt || job?.expires_at || '';
                                            const remaining = getRemainingDays(rawExpiry);
                                            const maxExtend = Math.max(0, MAX_LISTING_DAYS - remaining);
                                            const available = EXTEND_OPTIONS.filter((d) => d <= maxExtend);
                                            const defaultPick = available.length > 0
                                                ? (available.includes(30) ? 30 : available[available.length - 1])
                                                : EXTEND_OPTIONS[0];
                                            setExtendRemaining(remaining);
                                            setRenewTarget(job);
                                            setRenewDays(defaultPick);
                                            setRenewError(null);
                                        }}
                                        jobsNonce={jobsNonce}
                                        onServiceClick={setSelectedServicePopup}
                                        onServiceRequestClick={(req) => {
                                            setSelectedRequestPopup(req);
                                        }}
                                        onEditServiceRequest={(req) => {
                                            setEditingRequestItem(req);
                                            setEditRequestModalOpen(true);
                                        }}
                                        onDeleteServiceRequest={(req) => {
                                            setSvcReqConfirmDialog({
                                                title: 'Delete This Request?',
                                                message: 'This action cannot be undone. All responses will also be removed.',
                                                confirmLabel: 'Delete',
                                                confirmColor: 'error',
                                                action: async () => {
                                                    await deleteServiceRequest(req.id);
                                                    setServiceRequestsNonce((n) => n + 1);
                                                    showSuccess('Service request deleted');
                                                    if (selectedRequestPopup?.id === req.id) {
                                                        setSelectedRequestPopup(null);
                                                    }
                                                },
                                            });
                                        }}
                                        onRespondServiceRequest={(req) => {
                                            setRespondModalRequest(req);
                                            setRespondModalOpen(true);
                                        }}
                                        onCommentClick={(post, commentId) => {
                                            if (!post?.id) return;
                                            setPostScrollToCommentId(commentId);
                                            setPostHighlightCommentId(commentId);
                                            setSelectedPost(post);
                                        }}
                                    />
                                </Box>
                            </Stack>
                        )}



                        {/* ============ EVENTS TAB ============ */}
                        {activeTabKey === 'events' && (
                            <EventsTabIndexContext.Provider value={activeTab}>
                                <EventsSubTabs
                                    business={business}
                                    viewer={viewer}
                                    slug={slug}
                                    navigate={navigate}
                                    getAcctHeaders={getAcctHeaders}
                                    initialEventSubTab={eventSubTab}
                                    onTotalCountChange={setEventsTotalCount}
                                    canCreateEvents={canCreatePosts}
                                    isOwnBusiness={isOwnBusiness}
                                    onEventClick={(evt, commentId) => {
                                        setEventScrollToCommentId(commentId || null);
                                        setEventHighlightCommentId(commentId || null);
                                        setSelectedEventPopup(evt);
                                    }}
                                />
                            </EventsTabIndexContext.Provider>
                        )}

                        {/* ============ REVIEWS TAB ============ */}
                        {activeTabKey === 'reviews' && (
                            <Box>
                                <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: { xs: 0, sm: undefined }, boxShadow: { xs: 'none', sm: undefined }, border: { xs: 'none', sm: undefined } }}>
                                    <SectionHeader
                                        icon={<ReviewIcon />}
                                        title="All Reviews"
                                        action={!isOwnBusiness && viewer?.id ? (
                                            <Button variant="contained" startIcon={<ReviewIcon />} onClick={handleOpenWriteReview} size="small">
                                                {userReview ? 'Edit Review' : 'Write Review'}
                                            </Button>
                                        ) : null}
                                    />
                                    {hasReviews ? (
                                        <>
                                            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, mb: 3, bgcolor: (t) => alpha(t.palette.primary.main, 0.04), borderRadius: 3 }}>
                                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
                                                    <Box sx={{ textAlign: 'center', minWidth: 120 }}>
                                                        <Typography variant="h2" fontWeight={800} color="primary.main">{reviewStats.average.toFixed(1)}</Typography>
                                                        <StarRating value={reviewStats.average} showValue={false} />
                                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{reviewStats.total} reviews</Typography>
                                                    </Box>
                                                    <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                                                    <Box sx={{ flex: 1, width: '100%' }}><RatingBreakdownCompact ratings={reviewStats.breakdown} /></Box>
                                                </Stack>
                                            </Paper>

                                            {/* Sort Filter */}
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                                                <FormControl size="small" sx={{ minWidth: 140 }}>
                                                    <InputLabel>Sort By</InputLabel>
                                                    <Select
                                                        value={reviewSortBy}
                                                        label="Sort By"
                                                        onChange={(e) => setReviewSortBy(e.target.value)}
                                                        startAdornment={<SortIcon sx={{ fontSize: 18, mr: 0.5, color: 'text.secondary' }} />}
                                                        sx={{ fontSize: '0.85rem' }}
                                                        MenuProps={{
                                                            disableScrollLock: true,
                                                            sx: { zIndex: (t) => t.zIndex.modal + 55 },
                                                            PaperProps: { sx: { borderRadius: 2.5 } },
                                                        }}
                                                    >
                                                        <MenuItem value="newest">Newest</MenuItem>
                                                        <MenuItem value="oldest">Oldest</MenuItem>
                                                        <MenuItem value="highest">Highest Rated</MenuItem>
                                                        <MenuItem value="lowest">Lowest Rated</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Stack>

                                            {/* Review List with fade transition */}
                                            <Box
                                                sx={{
                                                    opacity: reviewsLoading ? 0.35 : 1,
                                                    transition: (t) => `opacity ${t.custom.motion.slow}ms ${t.custom.motion.ease}`,
                                                    pointerEvents: reviewsLoading ? 'none' : 'auto',
                                                }}
                                            >
                                                {sortedReviews.map((review, idx) => {
                                                    const isHighlighted = highlightReviewId && Number(review.id) === Number(highlightReviewId);
                                                    return (
                                                        <Box
                                                            key={review.id}
                                                            data-review-id={review.id}
                                                            sx={(t) => ({
                                                                transition: `background-color ${t.custom?.motion?.slow || 400}ms ease, box-shadow ${t.custom?.motion?.slow || 400}ms ease, border-color ${t.custom?.motion?.slow || 400}ms ease`,
                                                                border: '2px solid transparent',
                                                                borderRadius: 2,
                                                                ...(isHighlighted ? {
                                                                    px: 1,
                                                                    mx: -1,
                                                                    backgroundColor: alpha(t.custom?.brand?.brass || '#A87822', 0.14),
                                                                    borderColor: alpha(t.custom?.brand?.brass || '#A87822', 0.70),
                                                                    boxShadow: `0 14px 34px ${alpha(t.custom?.brand?.brass || '#A87822', 0.20)}`,
                                                                } : {}),
                                                            })}
                                                        >
                                                            {idx > 0 && <Divider />}
                                                            <ReviewCard
                                                                review={review}
                                                                businessId={business.id}
                                                                viewerId={Number(viewer?.id || 0)}
                                                                viewer={viewer}
                                                                isOwnBusiness={isOwnBusiness}
                                                                onEditReview={() => {
                                                                    setWriteReviewOpen(true);
                                                                }}
                                                                onDeleteReview={async () => {
                                                                    await deleteBusinessReview(business.id);
                                                                    await loadReviews();
                                                                    showSuccess('Review deleted');
                                                                }}
                                                                onSuccess={showSuccess}
                                                                onHelpfulUpdate={(reviewId, helpfulCount, viewerFoundHelpful) => {
                                                                    setReviews((prev) =>
                                                                        prev.map((r) =>
                                                                            r.id === reviewId
                                                                                ? { ...r, helpfulCount, viewerFoundHelpful }
                                                                                : r
                                                                        )
                                                                    );
                                                                }}
                                                                onReplyUpdate={(reviewId, ownerReply, ownerReplyAt, replyByName, replyByAvatar, replyByHandle, replyPhotoUrls) => {
                                                                    setReviews((prev) =>
                                                                        prev.map((r) =>
                                                                            r.id === reviewId
                                                                                ? { ...r, ownerReply, ownerReplyAt, replyByName, replyByAvatar, replyByHandle, replyPhotoUrls: replyPhotoUrls || [] }
                                                                                : r
                                                                        )
                                                                    );
                                                                }}
                                                            />
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                        </>
                                    ) : isOwnBusiness ? (
                                        <EmptyStateCard
                                            icon={<ReviewIcon sx={{ fontSize: 64 }} />}
                                            title="No reviews on your business yet"
                                            description="When customers leave reviews about their experience, they'll show up here. Great service leads to great reviews!"
                                        />
                                    ) : (
                                        <EmptyStateCard
                                            icon={<ReviewIcon sx={{ fontSize: 64 }} />}
                                            title="No reviews yet"
                                            description={`Be the first to review ${business.name} and help others in your community!`}
                                        />
                                    )}
                                </Paper>
                            </Box>
                        )}

                        {/* ============ PHOTOS TAB ============ */}
                        {activeTabKey === 'photos' && (
                            <Box>
                                <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: { xs: 0, sm: undefined }, boxShadow: { xs: 'none', sm: undefined }, border: { xs: 'none', sm: undefined } }}>
                                    <SectionHeader icon={<PhotoIcon />} title="All Photos" />
                                    {hasPhotos ? (
                                        <PhotoGallery
                                            images={gallery}
                                            businessName={business.name}
                                            maxDisplay={100}
                                            onPhotoClick={openBizGalleryLightbox}
                                        />
                                    ) : (
                                        <EmptyStateCard
                                            icon={<PhotoIcon sx={{ fontSize: 64 }} />}
                                            title="No photos yet"
                                            description={`${business.name} hasn't added any photos yet.`}
                                        />
                                    )}
                                </Paper>
                            </Box>
                        )}

                        {/* ============ ACTIVITY TAB (mobile only) ============ */}
                        {activeTabKey === 'activity' && isMobile && (
                            <EventsTabIndexContext.Provider value={activeTab}>
                                <Dialog
                                    open={true}
                                    fullScreen
                                    onClose={() => setActiveTab(0)}
                                    TransitionComponent={SlideUpTransition}
                                    PaperProps={{ sx: { bgcolor: 'background.paper', borderRadius: 0, overflowY: 'auto', overflowX: 'hidden', display: 'block' } }}
                                    TransitionProps={{ unmountOnExit: true }}
                                    disableScrollLock
                                    disableEnforceFocus
                                    sx={{ zIndex: (t) => t.zIndex.modal + 20 }}
                                >
                                    <BusinessEngagementTabs
                                        business={business}
                                        viewer={viewer}
                                        isOwnBusiness={isOwnBusiness}
                                        canCreatePosts={canCreatePosts}
                                        onCreatePost={handleOpenCreatePost}
                                        posts={posts}
                                        postsLoading={postsLoading}
                                        canEditPosts={canEditPosts}
                                        canPinPosts={canPinPosts}
                                        onPinPost={handlePinPost}
                                        onUnpinPost={handleUnpinPost}
                                        onEditPost={handleEditPost}
                                        onDeletePost={handleDeletePost}
                                        onReportPost={handleReportPost}
                                        onSharePost={handleSharePost}
                                        activeAccount={acctObj}
                                        initialPostsSubTab={returnState?.postsSubTab || 0}
                                        onPostsSubTabChange={handlePostsSubTabChange}
                                        onBeforeNavigate={saveBusinessScrollState}
                                        businessSlug={business?.slug || business?.handle || slug}
                                        parentActiveTab={activeTab}
                                        blockedAndHiddenUserIds={blockedAndHiddenUserIds}
                                        blockedBusinessIds={blockedBusinessIds}
                                        blockedArtistIds={blockedArtistIds}
                                        viewerFollowingIds={viewerFollowingIds}
                                        stickyTabs
                                        mobileFullscreen
                                        onHeaderHiddenChange={setActivityHeaderHidden}
                                        activityBarContent={
                                            <Box sx={{
                                                bgcolor: 'background.paper',
                                                borderBottom: '1px solid', borderColor: 'divider',
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                px: 1.5, py: 1, minHeight: 48,
                                            }}>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <IconButton size="small" onClick={() => setActiveTab(0)} sx={{ color: 'text.primary' }}>
                                                        <ArrowBackRoundedIcon sx={{ fontSize: 22 }} />
                                                    </IconButton>
                                                    <Typography sx={{ fontWeight: 800, fontSize: 16 }}>Activity</Typography>
                                                </Stack>
                                                <Stack
                                                    direction="row"
                                                    alignItems="center"
                                                    spacing={0.75}
                                                    onClick={() => setActiveTab(0)}
                                                    sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                                                >
                                                    <Box sx={{ textAlign: 'right' }}>
                                                        <Typography sx={{ fontWeight: 800, fontSize: 13, lineHeight: 1.1 }}>{business?.name}</Typography>
                                                        {(business?.handle || business?.slug) && (
                                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: 11, lineHeight: 1, mt: -0.1, display: 'block' }}>
                                                                @{business?.handle || business?.slug}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    <Avatar
                                                        src={business?.avatar_url || business?.logo_url || undefined}
                                                        alt={business?.name}
                                                        imgProps={{ referrerPolicy: 'no-referrer' }}
                                                        sx={(t) => ({
                                                            width: 32, height: 32, border: '1px solid', borderColor: 'divider',
                                                            ...(!(business?.avatar_url || business?.logo_url) ? {
                                                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                                                color: t.palette.primary.main,
                                                            } : {}),
                                                        })}
                                                    >
                                                        <StorefrontRoundedIcon sx={{ fontSize: 18 }} />
                                                    </Avatar>
                                                </Stack>
                                            </Box>
                                        }
                                        searchQuery={committedSearchQuery}
                                        serviceRequestsNonce={serviceRequestsNonce}
                                        hasEvents={eventsTotalCount > 0}
                                        eventsCount={eventsTotalCount}
                                        eventsContent={
                                            <EventsSubTabs
                                                business={business}
                                                viewer={viewer}
                                                slug={slug}
                                                navigate={navigate}
                                                getAcctHeaders={getAcctHeaders}
                                                initialEventSubTab={0}
                                                onTotalCountChange={setEventsTotalCount}
                                                canCreateEvents={canCreatePosts}
                                                isOwnBusiness={isOwnBusiness}
                                                onEventClick={(evt, commentId) => {
                                                    setEventScrollToCommentId(commentId || null);
                                                    setEventHighlightCommentId(commentId || null);
                                                    setSelectedEventPopup(evt);
                                                }}
                                            />
                                        }
                                        hasJobs={bizHasJobs}
                                        hasServices={bizHasServices}
                                        onEditJob={(job) => {
                                            setEditingJob(job);
                                            setEditJobOpen(true);
                                        }}
                                        onDeleteJobClick={(job) => {
                                            setDeleteJobTarget(job);
                                        }}
                                        onJobApply={(job) => {
                                            setApplyJobTarget(job);
                                        }}
                                        onJobRenew={(job) => {
                                            const rawExpiry = job?.expiresAt || job?.expires_at || '';
                                            const remaining = getRemainingDays(rawExpiry);
                                            const maxExtend = Math.max(0, MAX_LISTING_DAYS - remaining);
                                            const available = EXTEND_OPTIONS.filter((d) => d <= maxExtend);
                                            const defaultPick = available.length > 0
                                                ? (available.includes(30) ? 30 : available[available.length - 1])
                                                : EXTEND_OPTIONS[0];
                                            setExtendRemaining(remaining);
                                            setRenewTarget(job);
                                            setRenewDays(defaultPick);
                                            setRenewError(null);
                                        }}
                                        jobsNonce={jobsNonce}
                                        onEditServiceRequest={(req) => {
                                            setEditingRequestItem(req);
                                            setEditRequestModalOpen(true);
                                        }}
                                        onDeleteServiceRequest={(req) => {
                                            setSvcReqConfirmDialog({
                                                title: 'Delete This Request?',
                                                message: 'This action cannot be undone. All responses will also be removed.',
                                                confirmLabel: 'Delete',
                                                confirmColor: 'error',
                                                action: async () => {
                                                    await deleteServiceRequest(req.id);
                                                    setServiceRequestsNonce((n) => n + 1);
                                                    showSuccess('Service request deleted');
                                                },
                                            });
                                        }}
                                        onRespondServiceRequest={(req) => {
                                            setRespondModalRequest(req);
                                            setRespondModalOpen(true);
                                        }}
                                        onPostClick={(post) => {
                                            setPostScrollToCommentId(null);
                                            setPostHighlightCommentId(null);
                                            setSelectedPost(post);
                                        }}
                                        onCommentClick={(post, commentId) => {
                                            if (!post?.id) return;
                                            setPostScrollToCommentId(commentId);
                                            setPostHighlightCommentId(commentId);
                                            setSelectedPost(post);
                                        }}
                                        onJobClick={(job) => {
                                            setSelectedJobPopup(job);
                                        }}
                                        onServiceClick={setSelectedServicePopup}
                                        onServiceRequestClick={(req) => {
                                            setSelectedRequestPopup(req);
                                        }}
                                        onEventClick={(evt, commentId) => {
                                            setEventScrollToCommentId(commentId || null);
                                            setEventHighlightCommentId(commentId || null);
                                            setSelectedEventPopup(evt);
                                        }}
                                    />

                                    {/* ── Detail panel — slides in from the right ── */}
                                    <DetailPanel
                                        open={Boolean(selectedPost || selectedEventPopup || selectedJobPopup || selectedServicePopup || selectedRequestPopup)}
                                        onClose={() => {
                                            if (selectedPost) { setSelectedPost(null); setPostScrollToCommentId(null); setPostHighlightCommentId(null); }
                                            else if (selectedEventPopup) { setSelectedEventPopup(null); setEventScrollToCommentId(null); setEventHighlightCommentId(null); }
                                            else if (selectedJobPopup) { setSelectedJobPopup(null); }
                                            else if (selectedServicePopup) { setSelectedServicePopup(null); }
                                            else if (selectedRequestPopup) { setSelectedRequestPopup(null); setRequestPopupResponses([]); setRequestPopupResponsesLoading(false); setRequestPopupIsRequester(false); setRequestPopupMyResponse(null); }
                                        }}
                                        title={selectedPost ? 'Post' : selectedEventPopup ? 'Event' : selectedJobPopup ? 'Job' : selectedServicePopup ? 'Service' : selectedRequestPopup ? 'Request' : ''}
                                    >
                                        {selectedPost ? (() => {
                                            const postKind = detectPostKind(selectedPost);
                                            return (
                                                <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                                                    {postKind === 'business' && (
                                                        <BusinessPostDetailModal embedded post={selectedPost} user={viewer} onViewPage={() => {}} onShare={handleSharePost} onLocationClick={() => {}} scrollToCommentId={postScrollToCommentId} highlightCommentId={postHighlightCommentId} />
                                                    )}
                                                    {postKind === 'artist' && (
                                                        <MusicPostDetailPanel post={selectedPost} user={viewer} onViewPost={() => {}} onLocationClick={() => {}} scrollToCommentId={postScrollToCommentId} highlightCommentId={postHighlightCommentId} />
                                                    )}
                                                    {postKind === 'user' && (
                                                        <PostPage embedded post={selectedPost} user={viewer} hideCategoryChip={false} onLocationClick={() => {}} scrollToCommentId={postScrollToCommentId} highlightCommentId={postHighlightCommentId} />
                                                    )}
                                                </Box>
                                            );
                                        })() : selectedEventPopup ? (
                                            <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
                                                <EventDetailPanel
                                                    event={selectedEventPopup}
                                                    user={viewer}
                                                    onRequireAuth={() => requireAuth?.()}
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
                                                    user={viewer}
                                                    loggedInUser={viewer}
                                                    activeAccount={acctObj}
                                                    onClose={() => setSelectedJobPopup(null)}
                                                    onApply={(job) => setApplyJobTarget(job)}
                                                    onDeleted={() => { setSelectedJobPopup(null); setJobsNonce((n) => n + 1); showSuccess('Job deleted successfully'); }}
                                                    onRenew={(job) => {
                                                        const rawExpiry = job?.expiresAt || job?.expires_at || '';
                                                        const remaining = getRemainingDays(rawExpiry);
                                                        const maxExtend = Math.max(0, MAX_LISTING_DAYS - remaining);
                                                        const available = EXTEND_OPTIONS.filter((d) => d <= maxExtend);
                                                        const defaultPick = available.length > 0
                                                            ? (available.includes(30) ? 30 : available[available.length - 1])
                                                            : EXTEND_OPTIONS[0];
                                                        setExtendRemaining(remaining);
                                                        setRenewTarget(job);
                                                        setRenewDays(defaultPick);
                                                        setRenewError(null);
                                                    }}
                                                />
                                            </Box>
                                        ) : selectedServicePopup ? (
                                            <ServicePopupDialog
                                                service={selectedServicePopup}
                                                open={true}
                                                onClose={() => setSelectedServicePopup(null)}
                                                user={viewer}
                                                embedded
                                            />
                                        ) : selectedRequestPopup ? (
                                            <ServiceRequestDetailPopup
                                                request={selectedRequestPopup}
                                                open={true}
                                                onClose={() => { setSelectedRequestPopup(null); setRequestPopupResponses([]); setRequestPopupResponsesLoading(false); setRequestPopupIsRequester(false); setRequestPopupMyResponse(null); }}
                                                user={viewer}
                                                responses={requestPopupResponses}
                                                responsesLoading={requestPopupResponsesLoading}
                                                isRequester={requestPopupIsRequester}
                                                myResponse={requestPopupMyResponse}
                                                setResponses={setRequestPopupResponses}
                                                setIsRequester={setRequestPopupIsRequester}
                                                setMyResponse={setRequestPopupMyResponse}
                                                setResponsesLoading={setRequestPopupResponsesLoading}
                                                onDeleted={() => { setSelectedRequestPopup(null); setServiceRequestsNonce((n) => n + 1); showSuccess('Service request deleted'); }}
                                                onEdit={(req) => { setEditingRequestItem(req); setEditRequestModalOpen(true); }}
                                                onRespond={(req) => { setRespondModalRequest(req); setRespondModalOpen(true); }}
                                                isDesktopLayout={false}
                                                navigate={navigate}
                                                activeAccount={acctObj}
                                                embedded
                                            />
                                        ) : null}
                                    </DetailPanel>
                                </Dialog>
                            </EventsTabIndexContext.Provider>
                        )}
                    </Box>{/* end tab content */}
                </Container>


                {/* Temporary / Special Hours Dialog */}
                <Dialog open={tempHoursOpen} onClose={closeTempHoursDialog} fullWidth maxWidth="xs">
                    <DialogTitle sx={{ pr: 6 }}>
                        Temporary hours
                        <IconButton
                            onClick={closeTempHoursDialog}
                            aria-label="Close"
                            sx={{ position: 'absolute', right: 8, top: 8 }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2} sx={{ pt: 0.5 }}>
                            {tempHoursError ? <Alert severity="error">{tempHoursError}</Alert> : null}

                            <TextField
                                label="Date"
                                type="date"
                                value={tempHoursDate}
                                onChange={(e) => setTempHoursDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />

                            <Stack direction="row" spacing={1}>
                                <Button
                                    variant={tempHoursClosed ? 'contained' : 'outlined'}
                                    color={tempHoursClosed ? 'error' : 'inherit'}
                                    onClick={() => {
                                        setTempHoursClosed((v) => !v);
                                        if (!tempHoursClosed) setTempHoursAllDay(false);
                                    }}
                                    fullWidth
                                    sx={{ textTransform: 'none', fontWeight: 800 }}
                                >
                                    Closed
                                </Button>
                                <Button
                                    variant={tempHoursAllDay ? 'contained' : 'outlined'}
                                    onClick={() => {
                                        setTempHoursAllDay((v) => !v);
                                        if (!tempHoursAllDay) setTempHoursClosed(false);
                                    }}
                                    fullWidth
                                    sx={{ textTransform: 'none', fontWeight: 800 }}
                                >
                                    Open 24h
                                </Button>
                            </Stack>

                            {!tempHoursClosed && !tempHoursAllDay && (
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <TextField
                                        label="Open"
                                        type="time"
                                        value={tempHoursOpenTime}
                                        onChange={(e) => setTempHoursOpenTime(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        fullWidth
                                    />
                                    <TextField
                                        label="Close"
                                        type="time"
                                        value={tempHoursCloseTime}
                                        onChange={(e) => setTempHoursCloseTime(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        fullWidth
                                    />
                                </Stack>
                            )}

                            <TextField
                                label="Note (optional)"
                                value={tempHoursNote}
                                onChange={(e) => setTempHoursNote(e.target.value)}
                                placeholder="Holiday, weather, emergency, etc."
                                fullWidth
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 2, py: 1.5 }}>
                        <Button
                            onClick={closeTempHoursDialog}
                            disabled={tempHoursSaving}
                            sx={{ textTransform: 'none', fontWeight: 800 }}
                        >
                            Cancel
                        </Button>

                        {findSpecialHoursForDate(specialHours, tempHoursDate) ? (
                            <Button
                                onClick={handleDeleteTempHours}
                                disabled={tempHoursSaving}
                                color="error"
                                sx={{ textTransform: 'none', fontWeight: 900 }}
                            >
                                Remove
                            </Button>
                        ) : null}

                        <Button
                            onClick={handleSaveTempHours}
                            variant="contained"
                            disabled={tempHoursSaving}
                            startIcon={tempHoursSaving ? <CircularProgress size={16} /> : <CheckIcon />}
                            sx={{ textTransform: 'none', fontWeight: 900 }}
                        >
                            Save
                        </Button>
                    </DialogActions>
                </Dialog>

                <WriteReviewDialog open={writeReviewOpen} onClose={() => setWriteReviewOpen(false)} businessId={business.id} businessName={business.name} existingReview={userReview} onSaved={loadReviews} onSuccess={showSuccess} isOwnBusiness={isOwnBusiness} isNonPersonalAccount={isNonPersonalAccount} />
                <ShareDialog
                    open={shareDialogOpen}
                    onClose={() => {
                        setShareDialogOpen(false);
                        setSharePostData(null);
                    }}
                    contentType={sharePostData ? 'post' : 'business'}
                    post={sharePostData || undefined}
                    business={sharePostData ? undefined : business}
                    viewer={viewer}
                />
                <CreatePostDialog
                    open={createPostOpen}
                    onClose={() => setCreatePostOpen(false)}
                    businessId={business.id}
                    businessName={business.name}
                    onPostCreated={() => { recordPost(); handlePostCreated(); }}
                />





                {/* Edit Post Dialog */}
                <EditPostDialog
                    open={editPostOpen}
                    onClose={() => { setEditPostOpen(false); setEditingPost(null); }}
                    post={editingPost}
                    businessId={business.id}
                    businessName={business.name}
                    onPostUpdated={() => { handlePostCreated(); showSuccess('Post updated successfully'); }}
                />

                {/* Report Post Dialog */}
                <ReportDialog
                    open={reportPostOpen}
                    onClose={() => { setReportPostOpen(false); setReportingPost(null); }}
                    onSubmit={submitPostReport}
                    title="Report Post"
                />

                {/* Report Business Dialog */}
                <ReportDialog
                    open={reportBusinessOpen}
                    onClose={() => setReportBusinessOpen(false)}
                    onSubmit={submitBusinessReport}
                    title="Report Business"
                />

                {/* Business Post Edit History Dialog */}
                <Dialog open={bizHistoryOpen} onClose={() => setBizHistoryOpen(false)} fullWidth maxWidth="sm">
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        Edit history
                        <IconButton onClick={() => setBizHistoryOpen(false)} size="small"><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent dividers>
                        {bizHistoryLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={28} /></Box>
                        ) : null}
                        {!bizHistoryLoading && bizHistoryError ? (
                            <Alert severity="error">{bizHistoryError}</Alert>
                        ) : null}
                        {!bizHistoryLoading && !bizHistoryError && bizHistoryRows.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                                This post was edited, but detailed version history is not available for edits made before history tracking was enabled.
                            </Typography>
                        ) : null}
                        {!bizHistoryLoading && !bizHistoryError && bizHistoryRows.length > 0 ? (
                            <Stack spacing={2}>
                                {bizHistoryRows.map((row, idx) => {
                                    const snap = row?.snapshot || {};
                                    const diff = row?.diff || {};
                                    const when = row?.edited_at;
                                    const isOriginal = idx === bizHistoryRows.length - 1;
                                    const rowTitle = String(snap?.title || '').trim();
                                    const bodyText = String(snap?.body || snap?.description || '').trim();
                                    const photos = Array.isArray(snap?.photos) ? snap.photos.filter(Boolean) : [];
                                    const prevSnap = idx + 1 < bizHistoryRows.length ? (bizHistoryRows[idx + 1]?.snapshot || {}) : {};
                                    const titleChanged = !isOriginal && String(prevSnap?.title || '') !== rowTitle;
                                    const bodyChanged = !isOriginal && String(prevSnap?.body || prevSnap?.description || '') !== bodyText;
                                    const added = Array.isArray(diff?.added) ? diff.added.filter(Boolean) : [];
                                    const removed = Array.isArray(diff?.removed) ? diff.removed.filter(Boolean) : [];
                                    const hasChanges = titleChanged || bodyChanged || added.length > 0 || removed.length > 0;
                                    return (
                                        <Box key={row?.id ?? idx}>
                                            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{isOriginal ? 'Original Post' : `Edit #${bizHistoryRows.length - idx}`}</Typography>
                                            {when ? <Typography variant="caption" color="text.secondary">{new Date(when).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} · {new Date(when).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()}</Typography> : null}
                                            <Box sx={{ mt: 1 }}>
                                                {isOriginal ? <Typography variant="body2" sx={{ mb: 0.75, color: 'primary.main', fontWeight: 600 }}>Original version</Typography> : (
                                                    <>
                                                        {titleChanged ? <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Title changed:</strong> {rowTitle || '(no title)'}</Typography> : null}
                                                        {bodyChanged ? <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Description changed</strong></Typography> : null}
                                                        {added.length > 0 ? <Box sx={{ mb: 1 }}><Typography variant="body2" sx={{ mb: 0.5 }}><strong>Photos added:</strong></Typography><Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>{added.map((url) => <Box key={url} component="img" src={url} alt="" sx={{ width: 72, height: 72, borderRadius: 1, objectFit: 'cover', border: '1px solid', borderColor: 'divider' }} />)}</Box></Box> : null}
                                                        {removed.length > 0 ? <Box sx={{ mb: 1 }}><Typography variant="body2" sx={{ mb: 0.5 }}><strong>Photos removed:</strong></Typography><Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>{removed.map((url) => <Box key={url} component="img" src={url} alt="" sx={{ width: 72, height: 72, borderRadius: 1, objectFit: 'cover', border: '1px solid', borderColor: 'divider', opacity: 0.5 }} />)}</Box></Box> : null}
                                                        {!hasChanges ? <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Content updated</Typography> : null}
                                                    </>
                                                )}
                                                {bodyText ? <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{bodyText}</Typography> : null}
                                                {isOriginal && photos.length > 0 ? <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>{photos.map((url) => <Box key={url} component="img" src={url} alt="" sx={{ width: 72, height: 72, borderRadius: 1, objectFit: 'cover', border: '1px solid', borderColor: 'divider' }} />)}</Box> : null}
                                            </Box>
                                            {idx < bizHistoryRows.length - 1 ? <Divider sx={{ mt: 2 }} /> : null}
                                        </Box>
                                    );
                                })}
                            </Stack>
                        ) : null}
                    </DialogContent>
                    <DialogActions><Button onClick={() => setBizHistoryOpen(false)}>Close</Button></DialogActions>
                </Dialog>

                {/* Photo preview lightbox */}
                <Dialog
                    open={Boolean(photoPreviewSrc)}
                    onClose={() => setPhotoPreviewSrc('')}
                    fullScreen={isMobile}
                    maxWidth="md"
                    disableScrollLock
                    sx={{ zIndex: (t) => t.zIndex.modal + 50 }}
                    PaperProps={{
                        sx: {
                            bgcolor: 'black',
                            borderRadius: isMobile ? 0 : 2,
                            overflow: 'hidden',
                            position: 'relative',
                            // Mobile: fill the screen and respect safe areas
                            ...(isMobile && {
                                width: '100vw',
                                height: '100dvh',
                                maxWidth: '100vw',
                                maxHeight: '100dvh',
                                m: 0,
                            }),
                        },
                    }}
                >
                    {/* Tap anywhere on the backdrop / outside the image to close */}
                    <Box
                        onClick={() => setPhotoPreviewSrc('')}
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                        }}
                    >
                        {photoPreviewSrc && (
                            <Box
                                component="img"
                                src={photoPreviewSrc}
                                alt=""
                                referrerPolicy="no-referrer"
                                onClick={(e) => e.stopPropagation()}
                                sx={{
                                    display: 'block',
                                    maxWidth: '100%',
                                    maxHeight: isMobile ? '85dvh' : '80vh',
                                    objectFit: 'contain',
                                    cursor: 'default',
                                    // Push image down so it doesn't hide behind the
                                    // notch/dynamic island on mobile
                                    mt: isMobile ? 'env(safe-area-inset-top, 0px)' : 0,
                                }}
                            />
                        )}
                    </Box>

                    {/* Close button — pushed below the iOS notch / dynamic island */}
                    <IconButton
                        onClick={() => setPhotoPreviewSrc('')}
                        aria-label="Close photo"
                        sx={{
                            position: 'absolute',
                            top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
                            right: 'calc(env(safe-area-inset-right, 0px) + 12px)',
                            color: 'white',
                            bgcolor: 'rgba(0,0,0,0.55)',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
                            zIndex: 2,
                            width: 44,
                            height: 44,
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Dialog>

                {/* ═══════════ Photo Comments (Like/Comment on Avatar, Cover, Gallery Photos) ═══════════ */}
                <PhotoCommentsDialog
                    open={photoCommentsOpen}
                    onClose={() => { setPhotoCommentsOpen(false); setPhotoCommentsPhotoId(null); setPhotoCommentsPhotoUrl(null); }}
                    profileHandleOrId={businessSlugOrId}
                    viewerId={viewer?.id || 0}
                    isOwner={!!isOwnBusiness}
                    highlightCommentId={pendingPhotoHighlightId}
                    photoType={photoCommentsType === 'gallery' ? undefined : photoCommentsType}
                    photoId={photoCommentsType === 'gallery' ? photoCommentsPhotoId : undefined}
                    photoUrl={photoCommentsType === 'gallery' ? photoCommentsPhotoUrl : undefined}
                    apiPrefix="/api/business"
                    onSuccess={showSuccess}
                    allPhotos={photoCommentsType === 'gallery' ? gallery : undefined}
                    onNavigatePhoto={photoCommentsType === 'gallery' ? (newPhotoId, newPhotoUrl) => {
                        setPhotoCommentsPhotoId(newPhotoId);
                        setPhotoCommentsPhotoUrl(newPhotoUrl || null);
                    } : undefined}
                    onReportPhoto={handlePhotoReportOpen}
                />

                {/* Photo report dialog */}
                <ReportDialog
                    open={photoReportOpen}
                    onClose={() => { setPhotoReportOpen(false); setPhotoReportTarget(null); }}
                    onSubmit={handlePhotoReportSubmit}
                    title="Report Photo"
                />

                {/* ═══════════ Simple Gallery Lightbox (no comments) ═══════════ */}
                {(() => {
                    const lbPhotos = gallery.filter((p) => {
                        const url = typeof p === 'string' ? p : p?.url;
                        return Boolean(url);
                    });
                    if (lbPhotos.length === 0) return null;
                    const lbIdx = Math.min(bizGalleryLbIdx, lbPhotos.length - 1);
                    const lbUrl = typeof lbPhotos[lbIdx] === 'string' ? lbPhotos[lbIdx] : lbPhotos[lbIdx]?.url;
                    return (
                        <Dialog
                            open={bizGalleryLbOpen}
                            onClose={() => setBizGalleryLbOpen(false)}
                            maxWidth={false}
                            fullScreen={isMobile}
                            disableScrollLock
                            sx={{ zIndex: (t) => t.zIndex.modal + 50 }}
                            PaperProps={{
                                sx: isMobile
                                    ? { bgcolor: '#000', m: 0, borderRadius: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }
                                    : { bgcolor: 'rgba(0,0,0,0.92)', borderRadius: 3, maxWidth: '90vw', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
                            }}
                        >
                            <IconButton
                                onClick={() => setBizGalleryLbOpen(false)}
                                sx={{ position: 'absolute', ...topRightInsetSx(), zIndex: 2, color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}
                            >
                                <CloseIcon />
                            </IconButton>
                            {!isOwnBusiness && (
                                <IconButton
                                    aria-label="Report photo"
                                    onClick={() => { const photo = lbPhotos[lbIdx]; handlePhotoReportOpen('gallery', typeof photo === 'string' ? photo : photo?.url, typeof photo === 'string' ? null : photo?.id || photo?.photo_id || null); }}
                                    sx={{ position: 'absolute', ...topRightInsetSx({ baseRight: 52 }), zIndex: 2, color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}
                                >
                                    <FlagOutlinedIcon />
                                </IconButton>
                            )}
                            {lbPhotos.length > 1 && (
                                <>
                                    <Typography sx={{ position: 'absolute', top: `calc(${SAFE_TOP} + 14px)`, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700, zIndex: 2 }}>
                                        {lbIdx + 1} / {lbPhotos.length}
                                    </Typography>
                                    <IconButton onClick={() => setBizGalleryLbIdx((i) => (i - 1 + lbPhotos.length) % lbPhotos.length)} sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
                                        <ChevronLeftIcon />
                                    </IconButton>
                                    <IconButton onClick={() => setBizGalleryLbIdx((i) => (i + 1) % lbPhotos.length)} sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
                                        <ChevronRightIcon />
                                    </IconButton>
                                </>
                            )}
                            <Box
                                component="img"
                                src={lbUrl}
                                alt={`Photo ${lbIdx + 1}`}
                                sx={{ maxWidth: isMobile ? '100vw' : '85vw', maxHeight: isMobile ? '80vh' : '80vh', objectFit: 'contain', userSelect: 'none' }}
                            />
                        </Dialog>
                    );
                })()}

                {/* Quick message dialog */}
                <QuickMessageDialog
                    open={quickMsgOpen}
                    onClose={() => setQuickMsgOpen(false)}
                    onSent={() => { setQuickMsgOpen(false); }}
                    recipient={{
                        type: 'business',
                        id: Number(business?.id || 0),
                        name: business?.name || 'Business',
                        avatar_url: business?.avatar_url || null,
                        handle: business?.slug || business?.handle || slug || null,
                    }}
                />

                <Snackbar
                    open={Boolean(followsSnack)}
                    autoHideDuration={3000}
                    onClose={() => setFollowsSnack('')}
                    message={followsSnack}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                />

                {/* ═══════════ Post Detail Popup ═══════════ */}
                <Dialog
                    open={Boolean(selectedPost) && !isMobileActivity}
                    onClose={() => { setSelectedPost(null); setPostScrollToCommentId(null); setPostHighlightCommentId(null); }}
                    maxWidth="lg"
                    fullWidth
                    fullScreen={isMobile}
                    scroll="paper"
                    PaperProps={{
                        sx: {
                            borderRadius: isMobile ? 0 : 3,
                            height: isMobile ? '100%' : '94vh',
                            maxHeight: isMobile ? '100%' : '94vh',
                            overflow: 'hidden',
                            width: isMobile ? '100%' : 'min(960px, 90vw)',
                            position: 'relative',
                        },
                    }}
                >
                    {selectedPost && (() => {
                        const postKind = detectPostKind(selectedPost);
                        return (
                            <>
                                {/* Sticky header bar with close button */}
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
                                    <IconButton
                                        size="small"
                                        onClick={() => { setSelectedPost(null); setPostScrollToCommentId(null); setPostHighlightCommentId(null); }}
                                        aria-label="Close"
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </Box>

                                {/* Scrollable post detail content */}
                                <Box sx={{ overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
                                    {postKind === 'business' && (
                                        <BusinessPostDetailModal
                                            embedded
                                            post={selectedPost}
                                            user={viewer}
                                            onViewPage={() => {}}
                                            onShare={handleSharePost}
                                            onLocationClick={() => {}}
                                            scrollToCommentId={postScrollToCommentId}
                                            highlightCommentId={postHighlightCommentId}
                                        />
                                    )}

                                    {postKind === 'artist' && (
                                        <MusicPostDetailPanel
                                            post={selectedPost}
                                            user={viewer}
                                            onViewPost={() => {}}
                                            onLocationClick={() => {}}
                                            scrollToCommentId={postScrollToCommentId}
                                            highlightCommentId={postHighlightCommentId}
                                        />
                                    )}

                                    {postKind === 'user' && (
                                        <PostPage
                                            embedded
                                            post={selectedPost}
                                            user={viewer}
                                            hideCategoryChip={false}
                                            onLocationClick={() => {}}
                                            scrollToCommentId={postScrollToCommentId}
                                            highlightCommentId={postHighlightCommentId}
                                        />
                                    )}
                                </Box>
                            </>
                        );
                    })()}
                </Dialog>

                {/* ═══════════ Event Detail Popup ═══════════ */}
                <Dialog
                    open={Boolean(selectedEventPopup) && !isMobileActivity}
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
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>
                            {/* Scrollable content area */}
                            <Box sx={{ overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
                                <EventDetailPanel
                                    event={selectedEventPopup}
                                    user={viewer}
                                    onRequireAuth={() => requireAuth?.()}
                                    onEventUpdate={(updated) => setSelectedEventPopup((prev) => prev ? { ...prev, ...updated } : prev)}
                                    scrollToCommentId={eventScrollToCommentId}
                                    highlightCommentId={eventHighlightCommentId}
                                />
                            </Box>
                        </>
                    )}
                </Dialog>

                {/* ═══════════ Job Detail Popup ═══════════ */}
                <Dialog
                    open={Boolean(selectedJobPopup) && !isMobileActivity}
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
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>
                            <Box sx={{ position: 'absolute', top: 48, left: 0, right: 0, bottom: 0, overflowY: 'auto' }}>
                                <JobDetailPanel
                                    job={selectedJobPopup}
                                    jobId={selectedJobPopup?.id}
                                    user={viewer}
                                    loggedInUser={viewer}
                                    activeAccount={acctObj}
                                    onClose={() => setSelectedJobPopup(null)}
                                    onApply={(job) => setApplyJobTarget(job)}
                                    onDeleted={() => {
                                        setSelectedJobPopup(null);
                                        setJobsNonce((n) => n + 1);
                                        showSuccess('Job deleted successfully');
                                    }}
                                    onRenew={(job) => {
                                        const rawExpiry = job?.expiresAt || job?.expires_at || '';
                                        const remaining = getRemainingDays(rawExpiry);
                                        const maxExtend = Math.max(0, MAX_LISTING_DAYS - remaining);
                                        const available = EXTEND_OPTIONS.filter((d) => d <= maxExtend);
                                        const defaultPick = available.length > 0
                                            ? (available.includes(30) ? 30 : available[available.length - 1])
                                            : EXTEND_OPTIONS[0];
                                        setExtendRemaining(remaining);
                                        setRenewTarget(job);
                                        setRenewDays(defaultPick);
                                        setRenewError(null);
                                    }}
                                />
                            </Box>
                        </>
                    )}
                </Dialog>


                {/* ═══════════ Service Detail Popup ═══════════ */}
                <ServicePopupDialog
                    service={selectedServicePopup}
                    open={Boolean(selectedServicePopup) && !isMobileActivity}
                    onClose={() => setSelectedServicePopup(null)}
                    user={viewer}
                />

                {/* ═══════════ Service Request Detail Popup ═══════════ */}
                <ServiceRequestDetailPopup
                    request={selectedRequestPopup}
                    open={Boolean(selectedRequestPopup) && !isMobileActivity}
                    onClose={() => {
                        setSelectedRequestPopup(null);
                        setRequestPopupResponses([]);
                        setRequestPopupResponsesLoading(false);
                        setRequestPopupIsRequester(false);
                        setRequestPopupMyResponse(null);
                    }}
                    user={viewer}
                    responses={requestPopupResponses}
                    responsesLoading={requestPopupResponsesLoading}
                    isRequester={requestPopupIsRequester}
                    myResponse={requestPopupMyResponse}
                    setResponses={setRequestPopupResponses}
                    setIsRequester={setRequestPopupIsRequester}
                    setMyResponse={setRequestPopupMyResponse}
                    setResponsesLoading={setRequestPopupResponsesLoading}
                    onDeleted={() => {
                        setSelectedRequestPopup(null);
                        setServiceRequestsNonce((n) => n + 1);
                        showSuccess('Service request deleted');
                    }}
                    onEdit={(req) => {
                        setEditingRequestItem(req);
                        setEditRequestModalOpen(true);
                    }}
                    onRespond={(req) => {
                        setRespondModalRequest(req);
                        setRespondModalOpen(true);
                    }}
                    isDesktopLayout={!isMobile}
                    navigate={navigate}
                    activeAccount={acctObj}
                />

                {/* ═══════════ Edit Service Request Modal ═══════════ */}
                <CreateServiceRequestModal
                    open={editRequestModalOpen}
                    onClose={() => { setEditRequestModalOpen(false); setEditingRequestItem(null); }}
                    onSuccess={() => {
                        setEditRequestModalOpen(false);
                        setEditingRequestItem(null);
                        setSelectedRequestPopup(null);
                        setServiceRequestsNonce((n) => n + 1);
                        showSuccess(editingRequestItem ? 'Service request updated' : 'Service request created');
                    }}
                    editingRequest={editingRequestItem}
                />

                {/* ═══════════ Respond to Service Request Modal ═══════════ */}
                <RespondToRequestModal
                    open={respondModalOpen}
                    onClose={() => { setRespondModalOpen(false); setRespondModalRequest(null); }}
                    request={respondModalRequest}
                    onSuccess={() => {
                        setRespondModalOpen(false);
                        setRespondModalRequest(null);
                        setServiceRequestsNonce((n) => n + 1);
                        showSuccess('Response sent!');
                    }}
                />

                {/* ═══════════ Edit Job Modal ═══════════ */}
                <CreateJobModal
                    open={editJobOpen}
                    onClose={() => { setEditJobOpen(false); setEditingJob(null); }}
                    onCreated={() => {
                        setEditJobOpen(false);
                        setEditingJob(null);
                        setJobsNonce((n) => n + 1);
                        showSuccess('Job updated successfully');
                    }}
                    editingJob={editingJob}
                />

                {/* ═══════════ Delete Job Confirm Dialog ═══════════ */}
                <Dialog open={Boolean(deleteJobTarget)} onClose={() => setDeleteJobTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                    <DialogTitle sx={{ fontWeight: 900, fontSize: 17, pb: 0.5, pr: 5 }}>
                        Delete Job Listing?
                        <IconButton onClick={() => setDeleteJobTarget(null)} sx={{ position: 'absolute', top: 8, right: 8 }}>
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                            Are you sure you want to delete &ldquo;{deleteJobTarget?.title}&rdquo;? This cannot be undone.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setDeleteJobTarget(null)} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, color: 'text.secondary' }}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={async () => {
                                if (!deleteJobTarget?.id) return;
                                try {
                                    await deleteJob(deleteJobTarget.id);
                                    setDeleteJobTarget(null);
                                    setJobsNonce((n) => n + 1);
                                    showSuccess('Job deleted successfully');
                                    if (selectedJobPopup?.id === deleteJobTarget.id) {
                                        setSelectedJobPopup(null);
                                    }
                                } catch { /* ignore */ }
                            }}
                            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, px: 3, boxShadow: 'none' }}
                        >
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* ═══════════ Extend / Renew Job Dialog ═══════════ */}
                <Dialog open={Boolean(renewTarget)} onClose={() => setRenewTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                    <DialogTitle sx={{ pr: 6 }}>
                        <Typography sx={{ fontWeight: 950, fontSize: 16 }}>
                            {extendRemaining > 0 ? 'Extend Job Listing' : 'Renew Job Listing'}
                        </Typography>
                        <IconButton
                            aria-label="Close"
                            onClick={() => setRenewTarget(null)}
                            disabled={isRenewing}
                            sx={{ position: 'absolute', right: 12, top: 12 }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {extendRemaining > 0
                                    ? <>How many days would you like to add to &quot;{renewTarget?.title}&quot;?</>
                                    : <>How long would you like to renew &quot;{renewTarget?.title}&quot;?</>}
                            </Typography>

                            <Box
                                sx={(t) => ({
                                    p: 1.25, borderRadius: 2,
                                    bgcolor: extendRemaining > 0 ? alpha(t.palette.success.main, 0.06) : alpha(t.palette.error.main, 0.06),
                                    border: '1px solid',
                                    borderColor: extendRemaining > 0 ? alpha(t.palette.success.main, 0.15) : alpha(t.palette.error.main, 0.15),
                                    display: 'flex', alignItems: 'center', gap: 1,
                                })}
                            >
                                <AccessTimeRoundedIcon sx={{ fontSize: 16, color: extendRemaining > 0 ? 'success.main' : 'error.main' }} />
                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
                                    {extendRemaining > 0
                                        ? `${extendRemaining} day${extendRemaining === 1 ? '' : 's'} remaining`
                                        : 'Listing expired'}
                                </Typography>
                            </Box>

                            {(() => {
                                const maxExtend = Math.max(0, MAX_LISTING_DAYS - extendRemaining);
                                const availableOptions = EXTEND_OPTIONS.filter((d) => d <= maxExtend);

                                if (maxExtend <= 0) {
                                    return (
                                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                                            This listing already has {extendRemaining} days remaining (maximum {MAX_LISTING_DAYS}). No extension needed.
                                        </Alert>
                                    );
                                }

                                return (
                                    <>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Extend by"
                                            value={availableOptions.includes(renewDays) ? renewDays : (availableOptions[availableOptions.length - 1] || renewDays)}
                                            onChange={(e) => setRenewDays(Number(e.target.value))}
                                        >
                                            {availableOptions.map((d) => (
                                                <MenuItem key={d} value={d}>
                                                    {d} day{d === 1 ? '' : 's'}
                                                </MenuItem>
                                            ))}
                                        </TextField>

                                        <Box
                                            sx={(t) => ({
                                                p: 1.25, borderRadius: 2,
                                                bgcolor: alpha(t.palette.primary.main, 0.04),
                                                border: '1px solid',
                                                borderColor: alpha(t.palette.primary.main, 0.12),
                                                display: 'flex', alignItems: 'center', gap: 1,
                                            })}
                                        >
                                            <AutorenewRoundedIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
                                                New expiry: {futureDate(extendRemaining + renewDays)} ({extendRemaining + renewDays} day{(extendRemaining + renewDays) === 1 ? '' : 's'} total)
                                            </Typography>
                                        </Box>
                                    </>
                                );
                            })()}

                            {renewError ? <Alert severity="error" sx={{ borderRadius: 2 }}>{renewError.message || 'Failed to renew.'}</Alert> : null}
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Button variant="outlined" onClick={() => setRenewTarget(null)} disabled={isRenewing}>Cancel</Button>
                                <Button
                                    variant="contained"
                                    onClick={async () => {
                                        if (!renewTarget) return;
                                        setIsRenewing(true);
                                        setRenewError(null);
                                        try {
                                            const totalDays = extendRemaining + renewDays;
                                            await renewJob(renewTarget.id, totalDays);
                                            setRenewTarget(null);
                                            setJobsNonce((n) => n + 1);
                                            showSuccess('Job listing extended successfully');
                                        } catch (err) {
                                            setRenewError(err);
                                        } finally {
                                            setIsRenewing(false);
                                        }
                                    }}
                                    disabled={isRenewing || (MAX_LISTING_DAYS - extendRemaining) <= 0}
                                    startIcon={<AutorenewRoundedIcon />}
                                    sx={(t) => ({ fontWeight: 900, color: t.palette.common.white })}
                                >
                                    {isRenewing ? 'Extending...' : extendRemaining > 0 ? 'Extend' : 'Renew'}
                                </Button>
                            </Stack>
                        </Stack>
                    </DialogContent>
                </Dialog>

                {/* ═══════════ Rate Limit Dialog ═══════════ */}
                <RateLimitDialog
                    open={rateLimitOpen}
                    onClose={() => setRateLimitOpen(false)}
                    retryAfterSec={rateLimitInfo.retryAfterSec}
                    reason={rateLimitInfo.reason}
                    actionLabel={rateLimitInfo.actionLabel}
                />

                {/* ═══════════ Delete Service Request Confirm ═══════════ */}
                <Dialog open={Boolean(svcReqConfirmDialog)} onClose={() => { if (!svcReqConfirmLoading) setSvcReqConfirmDialog(null); }} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                    <DialogTitle sx={{ fontWeight: 900, fontSize: 17, pb: 0.5, pr: 5 }}>
                        {svcReqConfirmDialog?.title || ''}
                        <IconButton onClick={() => setSvcReqConfirmDialog(null)} disabled={svcReqConfirmLoading} sx={{ position: 'absolute', top: 8, right: 8 }}>
                            <CloseIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>{svcReqConfirmDialog?.message || ''}</Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setSvcReqConfirmDialog(null)} disabled={svcReqConfirmLoading} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, color: 'text.secondary' }}>
                            Cancel
                        </Button>
                        <Button variant="contained" color={svcReqConfirmDialog?.confirmColor || 'primary'} onClick={handleSvcReqConfirmAction} disabled={svcReqConfirmLoading}
                                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, px: 3, boxShadow: 'none' }}>
                            {svcReqConfirmLoading ? 'Processing…' : (svcReqConfirmDialog?.confirmLabel || 'Confirm')}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* ═══════════ Apply to Job Dialog ═══════════ */}
                <ApplyToJobDialog
                    open={Boolean(applyJobTarget)}
                    onClose={() => setApplyJobTarget(null)}
                    job={applyJobTarget}
                    user={viewer}
                    onApplied={() => {
                        setJobsNonce((n) => n + 1);
                    }}
                />

                {/* ═══════════ Success Snackbar ═══════════ */}
                <SuccessSnackbar {...snackbarProps} />
            </Box>
        </ContentFadeIn>
    );
}

/* ════════════════════════════════════════════════════════════════════════════
   SERVICE REQUEST DETAIL POPUP — copied from UserProfilePage for reuse
   ════════════════════════════════════════════════════════════════════════════ */
const REQ_DESC_MAX_HEIGHT = 160;

function ServiceRequestDetailPopup({
                                       request,
                                       open,
                                       onClose,
                                       user,
                                       responses,
                                       responsesLoading,
                                       isRequester: isRequesterFromApi,
                                       myResponse,
                                       setResponses,
                                       setIsRequester,
                                       setMyResponse,
                                       setResponsesLoading,
                                       onDeleted,
                                       isDesktopLayout,
                                       navigate,
                                       activeAccount,
                                       onEdit,
                                       onRespond,
                                       onShare,
                                       showSuccess: showSuccessExternal,
                                       embedded = false,
                                   }) {
    const { isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId, accountCacheKey } = useActiveAccount();
    const [detailTab, setDetailTab] = React.useState(0);
    const [deleteLoading, setDeleteLoading] = React.useState(false);
    const [toast, setToast] = React.useState('');
    const [confirmDialog, setConfirmDialog] = React.useState(null);
    const [confirmLoading, setConfirmLoading] = React.useState(false);
    const [descExpanded, setDescExpanded] = React.useState(false);
    const [acting, setActing] = React.useState(false);

    // 3-dot menu
    const [menuAnchor, setMenuAnchor] = React.useState(null);
    const menuOpen = Boolean(menuAnchor);

    const userId = user?.id || user?.user_id;

    // Ownership detection — mirrors ServiceRequestDetailPage
    const isOwner = React.useMemo(() => {
        if (!request || !userId) return false;
        if (typeof request.isRequester === 'boolean') return request.isRequester;

        const reqAccountType = String(
            request.requesterAccountType || request.requester_account_type ||
            request.requesterType || request.requester_type ||
            request.accountType || request.account_type || ''
        ).toLowerCase().trim();

        const reqBusinessId = request.requesterBusinessId || request.requester_business_id || request.businessId || request.business_id
            || (reqAccountType === 'business' ? (request.requesterProfileId || request.requester_profile_id) : null)
            || null;
        const reqArtistId = request.requesterArtistId || request.requester_artist_id || request.artistId || request.artist_id
            || ((reqAccountType === 'artist' || reqAccountType === 'music' || reqAccountType === 'music_artist') ? (request.requesterProfileId || request.requester_profile_id) : null)
            || null;
        const reqUserId = request.requesterId || request.requester_id || request.user_id || request.owner_id || null;

        if ((reqAccountType === 'business' || reqBusinessId) && isBusinessAccount && activeBusinessId && reqBusinessId) {
            return String(activeBusinessId) === String(reqBusinessId);
        }
        if ((reqAccountType === 'artist' || reqArtistId) && isArtistAccount && activeArtistId && reqArtistId) {
            return String(activeArtistId) === String(reqArtistId);
        }
        if (!isBusinessAccount && !isArtistAccount && reqUserId) {
            return String(userId) === String(reqUserId);
        }
        return false;
    }, [request, userId, isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId]);

    const effectiveIsRequester = isOwner || (isRequesterFromApi && !isBusinessAccount && !isArtistAccount);

    // Photo extraction — must be above the early return (rules of hooks)
    const photos = React.useMemo(() => {
        if (!request?.photos || !Array.isArray(request.photos)) return [];
        return request.photos
            .map((p) => (typeof p === 'string' ? p : p?.url || p?.photo_url || p?.photoUrl || null))
            .filter(Boolean)
            .slice(0, 20);
    }, [request?.photos]);

    // Fetch responses when popup opens
    React.useEffect(() => {
        if (!open || !request?.id) return;
        let mounted = true;
        setResponsesLoading(true);

        fetchRequestResponses(request.id)
            .then((data) => {
                if (!mounted) return;
                setResponses(data.responses || []);
                setIsRequester(Boolean(data.isRequester));
                setMyResponse(data.myResponse || null);
                setResponsesLoading(false);
            })
            .catch(() => {
                if (!mounted) return;
                setResponses([]);
                setResponsesLoading(false);
            });
        return () => { mounted = false; };
    }, [open, request?.id, accountCacheKey]); // eslint-disable-line react-hooks/exhaustive-deps

    // Reset state when popup closes
    React.useEffect(() => {
        if (!open) {
            setDetailTab(0);
            setDescExpanded(false);
            setDeleteLoading(false);
            setConfirmDialog(null);
            setConfirmLoading(false);
            setToast('');
            setMenuAnchor(null);
            setActing(false);
        }
    }, [open]);

    if (!request) return null;

    const catInfo = getServiceCategoryInfo(request.categorySlug || '');
    const isFilled = request.status === 'filled';
    const desc = request.description || '';

    // Visible responses
    const visibleResponses = (responses || []).filter((r) => {
        if (r.status === 'withdrawn' && !effectiveIsRequester && String(r.responderId) !== String(userId)) return false;
        return true;
    });
    const sortedResponses = [
        ...visibleResponses.filter((r) => r.status === 'accepted'),
        ...visibleResponses.filter((r) => r.status === 'pending'),
        ...visibleResponses.filter((r) => r.status !== 'accepted' && r.status !== 'pending'),
    ];

    // ── Handlers ──
    const handleCopyLink = () => {
        navigator.clipboard?.writeText(`${window.location.origin}/services/requests/${request.id}`);
        setToast('Link copied');
    };

    const handleCloseRequest = () => {
        const wasFilled = isFilled;
        setConfirmDialog({
            title: wasFilled ? 'Reopen Request?' : 'Mark as Filled?',
            message: wasFilled
                ? 'This will reopen the request so providers can respond again.'
                : 'This will mark the request as filled. Providers will no longer be able to respond.',
            confirmLabel: wasFilled ? 'Reopen' : 'Mark Filled',
            confirmColor: wasFilled ? 'primary' : 'success',
            action: async () => {
                await closeServiceRequest(request.id);
                if (onDeleted) onDeleted();
            },
        });
    };

    const handleDelete = () => {
        setConfirmDialog({
            title: 'Delete Request?',
            message: 'This will permanently delete your service request and all responses. This cannot be undone.',
            confirmLabel: 'Delete',
            confirmColor: 'error',
            action: async () => {
                await deleteServiceRequest(request.id);
                if (onDeleted) onDeleted();
            },
        });
    };

    const handleAcceptResponse = (responseId) => {
        const resp = sortedResponses.find((r) => r.id === responseId);
        setConfirmDialog({
            title: 'Accept This Response?',
            message: `You're accepting ${resp?.responderName || 'this provider'}'s response. Their contact info will be shared with you.`,
            confirmLabel: 'Accept',
            confirmColor: 'success',
            action: async () => {
                const updated = await acceptRequestResponse(request.id, responseId);
                setResponses((prev) => prev.map((r) => r.id === responseId ? { ...r, ...updated, status: 'accepted' } : r));
            },
        });
    };

    const handleDeclineResponse = (responseId) => {
        const resp = sortedResponses.find((r) => r.id === responseId);
        setConfirmDialog({
            title: 'Decline This Response?',
            message: `This will decline ${resp?.responderName || 'this provider'}'s response.`,
            confirmLabel: 'Decline',
            confirmColor: 'warning',
            action: async () => {
                await declineRequestResponse(request.id, responseId);
                setResponses((prev) => prev.map((r) => r.id === responseId ? { ...r, status: 'declined' } : r));
            },
        });
    };

    const handleConfirmAction = async () => {
        if (!confirmDialog?.action) return;
        setConfirmLoading(true);
        try {
            await confirmDialog.action();
        } catch (err) {
            setToast(err?.message || 'Something went wrong.');
        } finally {
            setConfirmLoading(false);
            setConfirmDialog(null);
        }
    };

    // Live requester avatar
    const liveRequesterAvatar = (() => {
        if (!isOwner) return request.requesterAvatar || '';
        const acctType = String(isBusinessAccount ? 'business' : isArtistAccount ? 'artist' : 'personal');
        if (acctType === 'business' || acctType === 'artist') return (activeAccount?.avatar_url || '').trim() || request.requesterAvatar || '';
        return (activeAccount?.avatar_url || user?.avatar_url || user?.profile_picture || '').trim() || request.requesterAvatar || '';
    })();

    /* ── Shared scrollable content + sub-dialogs (used by both Dialog and embedded modes) ── */
    const requestDetailContent = (
        <>
            {/* Scrollable content */}
            <Box sx={{ overflowY: 'auto', flex: 1 }}>
                <Stack spacing={0} sx={{ p: { xs: 1.5, md: 2 } }}>

                    {/* ══ HEADER ══ */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1 }}>
                        <Avatar
                            src={liveRequesterAvatar}
                            sx={{ width: 44, height: 44, border: '2px solid', borderColor: (t) => alpha(t.palette.text.primary, 0.06) }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 900, fontSize: 15, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {request.requesterName || 'Someone'}
                            </Typography>
                            {request.requesterHandle && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>@{request.requesterHandle}</Typography>
                            )}
                        </Box>
                        {/* Category chip + 3-dot */}
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                            <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}
                                        sx={(t) => ({ width: 32, height: 32, border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`, borderRadius: 999, bgcolor: 'background.paper', color: 'text.secondary', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } })}>
                                <MoreVertIcon fontSize="small" />
                            </IconButton>
                        </Stack>

                        {/* 3-dot menu */}
                        <SmartMenu anchorEl={menuAnchor} open={menuOpen} onClose={() => setMenuAnchor(null)}
                                   disableScrollLock onClick={(e) => e.stopPropagation()}
                                   anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                   PaperProps={{ sx: { mt: 0.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: '0 12px 40px rgba(0,0,0,0.15)', minWidth: 200, py: 0.5 } }}>
                            <MenuItem onClick={() => { setMenuAnchor(null); handleCopyLink(); }} sx={{ py: 1 }}>
                                <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
                                <ListItemText primary="Copy link" />
                            </MenuItem>
                            {effectiveIsRequester && typeof onEdit === 'function' && (
                                <MenuItem onClick={() => { setMenuAnchor(null); onEdit(request); }} sx={{ py: 1 }}>
                                    <ListItemIcon><EditRoundedIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Edit" />
                                </MenuItem>
                            )}
                            {effectiveIsRequester && (
                                <MenuItem onClick={() => { setMenuAnchor(null); handleDelete(); }} sx={{ py: 1, color: 'error.main' }}>
                                    <ListItemIcon sx={{ color: 'error.main' }}><DeleteRoundedIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Delete" />
                                </MenuItem>
                            )}
                        </SmartMenu>
                    </Box>

                    {/* ══ TITLE ══ */}
                    <Typography sx={{ fontWeight: 950, fontSize: 22, lineHeight: 1.2, mb: 0.5, wordBreak: 'break-word', letterSpacing: '-0.01em' }}>
                        {request.title}
                    </Typography>

                    {catInfo && (
                        <Chip size="small" icon={catInfo.Icon ? <catInfo.Icon sx={{ fontSize: 13 }} /> : undefined} label={catInfo.name}
                              sx={(t) => ({ height: 24, borderRadius: 999, fontWeight: 800, fontSize: 10.5, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main, border: '1px solid', borderColor: alpha(t.palette.primary.main, 0.2), '& .MuiChip-icon': { color: t.palette.primary.main }, mb: 0.5, alignSelf: 'flex-start' })} />
                    )}

                    {/* ─── Full-width action buttons ─── */}
                    <Divider sx={{ mt: 1.5 }} />
                    <Stack direction="row" spacing={1} sx={{ pt: 1.5, pb: 1 }}>
                        {/* Non-owner: Respond / Responded */}
                        {!effectiveIsRequester && !isFilled && typeof onRespond === 'function' && (
                            myResponse && myResponse.status !== 'withdrawn' ? (
                                <Button variant="outlined" fullWidth disabled
                                        startIcon={<CheckCircleRoundedIcon sx={{ fontSize: !isDesktopLayout ? '15px !important' : '18px !important' }} />}
                                        sx={(t) => ({
                                            borderRadius: 2, textTransform: 'none', fontWeight: 900, py: !isDesktopLayout ? 0.75 : 1, fontSize: !isDesktopLayout ? '0.75rem' : '0.85rem',
                                            color: t.palette.success.main,
                                            borderColor: alpha(t.palette.success.main, 0.3),
                                            '&.Mui-disabled': { color: t.palette.success.main, borderColor: alpha(t.palette.success.main, 0.3) },
                                        })}>
                                    Responded
                                </Button>
                            ) : (
                                <Button variant="contained" fullWidth
                                        startIcon={<SendRoundedIcon sx={{ fontSize: !isDesktopLayout ? '15px !important' : '18px !important' }} />}
                                        onClick={() => onRespond(request)}
                                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 900, py: !isDesktopLayout ? 0.75 : 1, fontSize: !isDesktopLayout ? '0.75rem' : '0.85rem' }}>
                                    Respond
                                </Button>
                            )
                        )}
                        {effectiveIsRequester && (
                            <Button
                                variant={isFilled ? 'outlined' : 'contained'}
                                color={isFilled ? 'inherit' : 'success'}
                                fullWidth
                                startIcon={isFilled ? <LockOpenRoundedIcon sx={{ fontSize: !isDesktopLayout ? '15px !important' : '18px !important' }} /> : <CheckCircleRoundedIcon sx={{ fontSize: !isDesktopLayout ? '15px !important' : '18px !important' }} />}
                                onClick={handleCloseRequest}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 900, py: !isDesktopLayout ? 0.75 : 1, fontSize: !isDesktopLayout ? '0.75rem' : '0.85rem' }}
                            >
                                {isFilled ? 'Reopen' : 'Mark as Filled'}
                            </Button>
                        )}
                        {isDesktopLayout && (
                            <Button variant="outlined" fullWidth startIcon={<OpenInNewRoundedIcon sx={{ fontSize: '18px !important' }} />}
                                    onClick={() => { onClose(); navigate(`/services/requests/${request.id}`); }}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 900, py: 1, fontSize: '0.85rem', borderColor: 'divider', color: 'text.primary', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}>
                                View Request Page
                            </Button>
                        )}
                        <Button variant="outlined" fullWidth startIcon={<ShareRoundedIcon sx={{ fontSize: !isDesktopLayout ? '15px !important' : '18px !important' }} />}
                                onClick={() => { if (typeof onShare === 'function') onShare(request); else handleCopyLink(); }}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 900, py: !isDesktopLayout ? 0.75 : 1, fontSize: !isDesktopLayout ? '0.75rem' : '0.85rem', borderColor: 'divider', color: 'text.primary', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}>
                            Share
                        </Button>
                    </Stack>

                    {/* ─── Sticky Tabs ─── */}
                    <Box sx={{ position: 'sticky', top: 0, zIndex: 10, bgcolor: 'background.paper', pt: 1.25, pb: 0.5 }}>
                        <Divider />
                        <Tabs value={detailTab} onChange={(_e, v) => setDetailTab(v)} variant="fullWidth"
                              sx={(t) => ({
                                  minHeight: 44, flexShrink: 0, borderRadius: 0, padding: 0, backgroundColor: 'transparent', border: 'none', boxShadow: 'none',
                                  borderBottom: '1px solid', borderColor: 'divider', px: 1,
                                  '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0', backgroundColor: t.palette.text.primary },
                                  '& .MuiTab-root': { minHeight: 44, textTransform: 'none', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '-0.01em', py: 0, px: 1, minWidth: 0, borderRadius: 0, color: alpha(t.palette.text.primary, 0.55), '&.Mui-selected': { color: t.palette.text.primary }, '& .MuiSvgIcon-root': { color: alpha(t.palette.text.primary, 0.5) }, '&.Mui-selected .MuiSvgIcon-root': { color: t.palette.text.primary } },
                              })}>
                            <Tab label={<Stack direction="column" alignItems="center" spacing={0.25}><DescriptionRoundedIcon sx={{ fontSize: 20 }} /><span>About</span></Stack>} value={0} />
                            <Tab label={<Stack direction="column" alignItems="center" spacing={0.25}><PhotoLibraryRoundedIcon sx={{ fontSize: 20 }} /><span>{`Photos${photos.length > 0 ? ` (${photos.length})` : ''}`}</span></Stack>} value={1} />
                            {effectiveIsRequester && (
                                <Tab label={<Stack direction="column" alignItems="center" spacing={0.25}><ChatBubbleOutlineRoundedIcon sx={{ fontSize: 20 }} /><span>{`Responses${sortedResponses.length > 0 ? ` (${sortedResponses.length})` : ''}`}</span></Stack>} value={2} />
                            )}
                        </Tabs>
                    </Box>

                    {/* ══ TAB 0: ABOUT ══ */}
                    {detailTab === 0 && (
                        <Stack spacing={1.75} sx={{ pt: 2 }}>
                            <Stack spacing={1.5}>
                                <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                                    <LocationOnRoundedIcon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.15, flexShrink: 0 }} />
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.03em', fontSize: 10.5 }}>Location</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
                                            {request.locationLabel || [request.city, request.county ? `${request.county} County` : ''].filter(Boolean).join(', ') || 'Alabama (Statewide)'}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                                    <InfoRoundedIcon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.15, flexShrink: 0 }} />
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.03em', fontSize: 10.5 }}>Status</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{isFilled ? 'Filled' : 'Open'}</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                                    <ScheduleRoundedIcon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.15, flexShrink: 0 }} />
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.03em', fontSize: 10.5 }}>Timeline</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                            {request.urgency === 'asap' ? 'ASAP' : request.urgency === 'within_week' ? 'This Week' : request.urgency === 'within_month' ? 'This Month' : 'Flexible'}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                                    <AccessTimeRoundedIcon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.15, flexShrink: 0 }} />
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.03em', fontSize: 10.5 }}>Posted</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                            {request.createdAt ? new Date(request.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recently'}
                                        </Typography>
                                    </Box>
                                </Box>
                                {request.contactPreference && (
                                    <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                                        {request.contactPreference === 'call' ? <PhoneRoundedIcon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.15, flexShrink: 0 }} />
                                            : request.contactPreference === 'email' ? <EmailRoundedIcon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.15, flexShrink: 0 }} />
                                                : <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.15, flexShrink: 0 }} />}
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.03em', fontSize: 10.5 }}>Preferred Contact</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                {request.contactPreference === 'call' ? 'Phone Call' : request.contactPreference === 'email' ? 'Email' : 'Message'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}
                            </Stack>
                            <Divider />
                            {/* Description */}
                            {desc && (
                                <Box sx={{ position: 'relative' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.03em', fontSize: 10.5, display: 'block', mb: 0.5 }}>Description</Typography>
                                    <Box sx={{ maxHeight: descExpanded ? 'none' : REQ_DESC_MAX_HEIGHT, overflowY: descExpanded ? 'visible' : 'hidden', position: 'relative' }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{desc}</Typography>
                                    </Box>
                                    {!descExpanded && desc.length > 200 && (
                                        <Box sx={(t) => ({ position: 'absolute', bottom: 0, left: 0, right: 0, height: 64, background: `linear-gradient(to bottom, ${alpha(t.palette.background.paper, 0)} 0%, ${t.palette.background.paper} 85%)`, pointerEvents: 'none' })} />
                                    )}
                                    {desc.length > 200 && (
                                        <Button size="small" onClick={() => setDescExpanded((prev) => !prev)}
                                                sx={{ mt: descExpanded ? 0.5 : -0.25, position: 'relative', zIndex: 2, textTransform: 'none', fontWeight: 850, fontSize: '0.78rem', px: 0, minWidth: 0, color: 'primary.main', '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}>
                                            {descExpanded ? 'Show less' : 'Show more'}
                                        </Button>
                                    )}
                                </Box>
                            )}
                            {/* Budget */}
                            {(request.budgetMin || request.budgetMax || request.budgetNotes || request.budgetType) && (
                                <Box sx={(t) => ({ p: 1.5, borderRadius: 2, bgcolor: alpha(t.palette.success.main, 0.04), border: '1px solid', borderColor: alpha(t.palette.success.main, 0.12) })}>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                                        <AttachMoneyRoundedIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                        <Typography variant="caption" sx={{ fontWeight: 900, color: 'success.main', textTransform: 'uppercase', letterSpacing: '0.03em', fontSize: 10.5 }}>Budget</Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ fontWeight: 800, fontSize: 15, mb: 0.25 }}>
                                        {request.budgetMin && request.budgetMax
                                            ? `$${Number(request.budgetMin).toLocaleString()}–$${Number(request.budgetMax).toLocaleString()}`
                                            : request.budgetMin ? `From $${Number(request.budgetMin).toLocaleString()}`
                                                : request.budgetMax ? `Up to $${Number(request.budgetMax).toLocaleString()}`
                                                    : request.budgetNotes || (request.budgetType === 'flexible' ? 'Flexible' : 'Not specified')}
                                        {request.budgetType === 'hourly' ? '/hr' : request.budgetType === 'flat' ? ' (flat rate)' : ''}
                                    </Typography>
                                    {request.budgetNotes && (request.budgetMin || request.budgetMax) && (
                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25, wordBreak: 'break-word' }}>{request.budgetNotes}</Typography>
                                    )}
                                </Box>
                            )}
                            {/* Timeline notes */}
                            {request.timelineNotes && (
                                <Box sx={(t) => ({ p: 1.5, borderRadius: 2, bgcolor: alpha(t.palette.info.main, 0.04), border: '1px solid', borderColor: alpha(t.palette.info.main, 0.12) })}>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                                        <EventNoteRoundedIcon sx={{ fontSize: 16, color: 'info.main' }} />
                                        <Typography variant="caption" sx={{ fontWeight: 900, color: 'info.main', textTransform: 'uppercase', letterSpacing: '0.03em', fontSize: 10.5 }}>Timeline Notes</Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ lineHeight: 1.6, color: 'text.secondary', wordBreak: 'break-word' }}>{request.timelineNotes}</Typography>
                                </Box>
                            )}
                        </Stack>
                    )}

                    {/* ══ TAB 1: PHOTOS ══ */}
                    {detailTab === 1 && (
                        <Box sx={{ pt: 2 }}>
                            {photos.length === 0 ? (
                                <Box sx={{ py: 6, textAlign: 'center' }}>
                                    <PhotoLibraryRoundedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                    <Typography sx={{ fontWeight: 800, fontSize: 15, color: 'text.secondary' }}>No photos attached</Typography>
                                </Box>
                            ) : (
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 1 }}>
                                    {photos.map((url, i) => (
                                        <Box key={i} component="img" src={url} alt={`Photo ${i + 1}`} loading="lazy"
                                             sx={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }} />
                                    ))}
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* ══ TAB 2: RESPONSES (owner only) ══ */}
                    {detailTab === 2 && effectiveIsRequester && (
                        <Stack spacing={0} sx={{ pt: 2 }}>
                            {responsesLoading ? (
                                <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box>
                            ) : sortedResponses.length === 0 ? (
                                <Box sx={(t) => ({ py: 4, px: 3, textAlign: 'center', borderRadius: 2.5, border: '1px dashed', borderColor: alpha(t.palette.text.primary, 0.12), bgcolor: alpha(t.palette.background.default, 0.5) })}>
                                    <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                                    <Typography sx={{ fontWeight: 800, fontSize: 15, mb: 0.5 }}>No responses yet</Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 360, mx: 'auto' }}>
                                        Providers will see your request and can send you quotes and messages.
                                    </Typography>
                                </Box>
                            ) : (
                                <Stack spacing={1.5}>
                                    {sortedResponses.map((resp) => {
                                        const isPending = resp.status === 'pending';
                                        const isAccepted = resp.status === 'accepted';
                                        const isDeclined = resp.status === 'declined' || resp.status === 'withdrawn';
                                        const hasQuote = resp.quoteMin || resp.quoteMax || resp.quoteType === 'free_estimate';
                                        return (
                                            <Box key={resp.id} sx={(t) => ({
                                                p: 2, borderRadius: 2.5, border: '1px solid',
                                                borderColor: isAccepted ? alpha(t.palette.success.main, 0.25) : isDeclined ? alpha(t.palette.text.disabled, 0.12) : alpha(t.palette.divider, 0.8),
                                                bgcolor: isAccepted ? alpha(t.palette.success.main, 0.04) : t.palette.background.paper,
                                                opacity: isDeclined ? 0.6 : 1,
                                            })}>
                                                {/* Responder header */}
                                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                                                    <Avatar src={resp.responderAvatar} sx={{ width: 36, height: 36, border: '2px solid', borderColor: (t) => alpha(t.palette.text.primary, 0.06) }} />
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography sx={{ fontWeight: 900, fontSize: 13.5, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {resp.responderName || 'Provider'}
                                                        </Typography>
                                                        {resp.responderHandle && (
                                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 11 }}>@{resp.responderHandle}</Typography>
                                                        )}
                                                    </Box>
                                                    <Chip size="small" label={isAccepted ? 'Accepted' : isDeclined ? (resp.status === 'withdrawn' ? 'Withdrawn' : 'Declined') : 'Pending'}
                                                          color={isAccepted ? 'success' : isPending ? 'warning' : 'default'}
                                                          variant={isAccepted ? 'filled' : 'outlined'}
                                                          sx={{ height: 22, fontSize: 10.5, fontWeight: 800 }} />
                                                </Stack>
                                                {/* Message */}
                                                {resp.message && (
                                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.55, color: 'text.secondary', mb: 1 }}>{resp.message}</Typography>
                                                )}
                                                {/* Quote */}
                                                {hasQuote && (
                                                    <Stack direction="row" spacing={0.75} sx={{ mb: 1 }}>
                                                        <Chip size="small" icon={<AttachMoneyRoundedIcon sx={{ fontSize: 13 }} />}
                                                              label={resp.quoteType === 'free_estimate' ? 'Free Estimate' : resp.quoteMin && resp.quoteMax ? `$${Number(resp.quoteMin).toLocaleString()}–$${Number(resp.quoteMax).toLocaleString()}${resp.quoteType === 'hourly' ? '/hr' : ''}` : resp.quoteMin ? `From $${Number(resp.quoteMin).toLocaleString()}` : `Up to $${Number(resp.quoteMax).toLocaleString()}`}
                                                              sx={{ height: 22, fontSize: 10.5, fontWeight: 700 }} color="success" variant="outlined" />
                                                        {resp.estimatedTimeline && <Chip size="small" icon={<AccessTimeRoundedIcon sx={{ fontSize: 13 }} />} label={resp.estimatedTimeline} sx={{ height: 22, fontSize: 10.5, fontWeight: 700 }} variant="outlined" />}
                                                    </Stack>
                                                )}
                                                {/* Accepted contact reveal */}
                                                {isAccepted && resp.responderContact && (
                                                    <Box sx={(t) => ({ p: 1.25, borderRadius: 2, mb: 0.75, bgcolor: alpha(t.palette.success.main, 0.06), border: '1px solid', borderColor: alpha(t.palette.success.main, 0.15) })}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                                            <LockOpenRoundedIcon sx={{ fontSize: 14, color: 'success.main' }} />
                                                            <Typography variant="caption" sx={{ fontWeight: 900, color: 'success.main', textTransform: 'uppercase', fontSize: 10 }}>Contact Info Revealed</Typography>
                                                        </Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
                                                            {resp.responderContact.preference === 'call' ? 'Phone: ' : resp.responderContact.preference === 'email' ? 'Email: ' : 'Message: '}
                                                            {resp.responderContact.value || 'Available via message'}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                {/* Accept / Decline buttons */}
                                                {isPending && !isFilled && (
                                                    <Stack direction="row" spacing={1}>
                                                        <Button size="small" variant="contained" color="success" disabled={acting} onClick={() => handleAcceptResponse(resp.id)}
                                                                startIcon={<CheckCircleRoundedIcon sx={{ fontSize: 15 }} />} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, fontSize: 12, flex: 1 }}>Accept</Button>
                                                        <Button size="small" variant="outlined" color="inherit" disabled={acting} onClick={() => handleDeclineResponse(resp.id)}
                                                                startIcon={<CancelRoundedIcon sx={{ fontSize: 15 }} />} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, fontSize: 12, flex: 1 }}>Decline</Button>
                                                    </Stack>
                                                )}
                                                <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.75, fontSize: 10.5 }}>
                                                    {resp.createdAt ? new Date(resp.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}
                                                </Typography>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Stack>
                    )}
                </Stack>

                <Box sx={{ height: 32 }} />
            </Box>

            {/* Confirm dialog for request actions */}
            <Dialog open={Boolean(confirmDialog)} onClose={() => { if (!confirmLoading) setConfirmDialog(null); }} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 900, fontSize: 17, pb: 0.5, pr: 5 }}>
                    {confirmDialog?.title || ''}
                    <IconButton onClick={() => setConfirmDialog(null)} disabled={confirmLoading} sx={{ position: 'absolute', top: 8, right: 8 }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>{confirmDialog?.message || ''}</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setConfirmDialog(null)} disabled={confirmLoading} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, color: 'text.secondary' }}>
                        Cancel
                    </Button>
                    <Button variant="contained" color={confirmDialog?.confirmColor || 'primary'} onClick={handleConfirmAction} disabled={confirmLoading}
                            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, px: 3, boxShadow: 'none' }}>
                        {confirmLoading ? 'Processing…' : (confirmDialog?.confirmLabel || 'Confirm')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Toast */}
            <Snackbar open={Boolean(toast)} autoHideDuration={3000} onClose={() => setToast('')}
                      message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
        </>
    );

    /* ── Embedded mode: return content directly (no Dialog wrapper) ── */
    if (embedded) {
        return (
            <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
                {requestDetailContent}
            </Box>
        );
    }

    /* ── Normal mode: wrap in a Dialog ── */
    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="md"
                fullWidth
                fullScreen={!isDesktopLayout}
                disableScrollLock
                slotProps={{ backdrop: { sx: { backdropFilter: 'blur(6px)', bgcolor: 'rgba(0,0,0,0.45)' } } }}
                PaperProps={{
                    sx: {
                        borderRadius: !isDesktopLayout ? 0 : 3,
                        height: !isDesktopLayout ? '100%' : '92vh',
                        maxHeight: !isDesktopLayout ? '100%' : '92vh',
                        overflow: 'hidden',
                        width: !isDesktopLayout ? '100%' : 'min(780px, 90vw)',
                        position: 'relative',
                    },
                }}
            >
                {/* Sticky close bar */}
                <Box
                    sx={(t) => ({
                        position: 'sticky', top: 0, left: 0, right: 0, height: 48,
                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                        px: 1.5,
                        bgcolor: alpha(t.palette.background.paper, 0.95),
                        backdropFilter: 'blur(8px)',
                        borderBottom: '1px solid', borderColor: 'divider', zIndex: 10,
                    })}
                >
                    <IconButton size="small" onClick={onClose} aria-label="Close">
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
                {requestDetailContent}
            </Dialog>
        </>
    );
}


/* ════════════════════════════════════════════════════════════════════════════
   EVENTS SUB-TABS — isolated component so sub-tab state changes don't
   re-render the parent (cover photo, header, etc.)
   ════════════════════════════════════════════════════════════════════════════ */
const EventsTabIndexContext = React.createContext(0);
const EVENTS_PAGE_SIZE = 25;

function EventsSubTabs({ business, viewer, slug, navigate, getAcctHeaders, initialEventSubTab = 0, onEventClick, onTotalCountChange, canCreateEvents = false, isOwnBusiness = false }) {
    const _evtTheme = useTheme();
    const isMobileEvt = useMediaQuery(_evtTheme.breakpoints.down('md'));

    // ── Sub-tab state ──
    const [eventSubTab, setEventSubTab] = useState(initialEventSubTab);

    // ── Per-tab cached data ──
    const [eventsTabData, setEventsTabData] = useState([]);
    const [likesTabData, setLikesTabData] = useState([]);
    const [repostsTabData, setRepostsTabData] = useState([]);
    const [eventsTabLoading, setEventsTabLoading] = useState(false);
    const [likesTabLoading, setLikesTabLoading] = useState(false);
    const [repostsTabLoading, setRepostsTabLoading] = useState(false);
    const [eventsTabLoaded, setEventsTabLoaded] = useState(false);
    const [likesTabLoaded, setLikesTabLoaded] = useState(false);
    const [repostsTabLoaded, setRepostsTabLoaded] = useState(false);

    // ── Comments sub-tab ──
    const [eventEngagementComments, setEventEngagementComments] = useState([]);
    const [eventCommentsLoading, setEventCommentsLoading] = useState(false);
    const [eventCommentsLoaded, setEventCommentsLoaded] = useState(false);

    // ── Filter / sort ──
    const [eventFilterRange, setEventFilterRange] = useState('upcoming');
    const [eventSortBy, setEventSortBy] = useState('soonest');
    const [eventCategory, setEventCategory] = useState('');
    const [showEventFilters, setShowEventFilters] = useState(false);
    const [mobileEventFilterOpen, setMobileEventFilterOpen] = useState(false);
    const [eventSearchQuery, setEventSearchQuery] = useState('');
    const [committedEventSearchQuery, setCommittedEventSearchQuery] = useState('');
    const [eventDateFrom, setEventDateFrom] = useState('');
    const [eventDateTo, setEventDateTo] = useState('');

    // ── Edit event modal state ──
    const [editingEvent, setEditingEvent] = useState(null);
    const [editEventModalOpen, setEditEventModalOpen] = useState(false);

    // ── Success snackbar (edit / delete feedback) ──
    const { showSuccess: showEventsSuccess, snackbarProps: eventsSnackbarProps } = useSuccessSnackbar();

    // ── Sticky header ──
    const [isEventsHeaderSticky, setIsEventsHeaderSticky] = useState(false);
    const eventsHeaderRef = useRef(null);

    // ── Pagination ──
    const [eventsRenderCount, setEventsRenderCount] = useState(EVENTS_PAGE_SIZE);
    const eventsSentinelRef = useRef(null);

    // ── Derived ──
    const businessEvents = eventSubTab === 2 ? likesTabData : eventSubTab === 3 ? repostsTabData : eventsTabData;
    const eventsLoading = eventSubTab === 0 ? eventsTabLoading : eventSubTab === 2 ? likesTabLoading : eventSubTab === 3 ? repostsTabLoading : false;
    const hasEvents = businessEvents.length > 0;

    // ── Report total count (events + comments + likes + reposts) to parent for the main tab badge ──
    useEffect(() => {
        if (typeof onTotalCountChange === 'function') {
            const total = eventsTabData.length + eventEngagementComments.length + likesTabData.length + repostsTabData.length;
            onTotalCountChange(total);
        }
    }, [eventsTabData.length, eventEngagementComments.length, likesTabData.length, repostsTabData.length, onTotalCountChange]);

    const sortedEventsAll = React.useMemo(() => {
        let result = [...businessEvents];

        // Category filter
        if (eventCategory) {
            const catNorm = eventCategory.toLowerCase();
            result = result.filter((evt) => String(evt.category || '').toLowerCase() === catNorm);
        }

        // Search filter
        if (committedEventSearchQuery) {
            const q = committedEventSearchQuery.toLowerCase();
            result = result.filter((evt) => {
                const title = String(evt.title || '').toLowerCase();
                const desc = String(evt.description || '').toLowerCase();
                const location = String(evt.location || evt.venue || '').toLowerCase();
                const category = String(evt.category || '').toLowerCase();
                return title.includes(q) || desc.includes(q) || location.includes(q) || category.includes(q);
            });
        }

        // Date range filter
        if (eventDateFrom) {
            const from = new Date(eventDateFrom);
            result = result.filter((evt) => {
                const d = new Date(evt.start_date || evt.startDate || 0);
                return d >= from;
            });
        }
        if (eventDateTo) {
            const to = new Date(eventDateTo);
            to.setHours(23, 59, 59, 999);
            result = result.filter((evt) => {
                const d = new Date(evt.start_date || evt.startDate || 0);
                return d <= to;
            });
        }

        if (eventSubTab === 0) {
            result.sort((a, b) => new Date(a.start_date || a.startDate || 0) - new Date(b.start_date || b.startDate || 0));
        }
        return result;
    }, [businessEvents, eventSubTab, eventCategory, committedEventSearchQuery, eventDateFrom, eventDateTo]);

    const sortedEvents = sortedEventsAll.slice(0, eventsRenderCount);

    // Filter event engagement data by search + category + sort
    const filteredEventComments = useMemo(() => {
        let items = [...eventEngagementComments];
        // Category filter
        if (eventCategory) {
            const catNorm = eventCategory.toLowerCase();
            items = items.filter((group) => String(group?.event?.category || '').toLowerCase() === catNorm);
        }
        if (committedEventSearchQuery) {
            const q = committedEventSearchQuery.toLowerCase();
            items = items.filter((group) => {
                const ev = group?.event || {};
                const comments = Array.isArray(group?.comments) ? group.comments : [];
                return String(ev?.title || '').toLowerCase().includes(q) ||
                    String(ev?.category || '').toLowerCase().includes(q) ||
                    comments.some((c) => String(c?.content || '').toLowerCase().includes(q));
            });
        }
        // Sort by event start date (soonest first)
        items.sort((a, b) => {
            const aDate = new Date(a?.event?.start_date || a?.event?.startDate || 0);
            const bDate = new Date(b?.event?.start_date || b?.event?.startDate || 0);
            return aDate - bDate;
        });
        return items;
    }, [eventEngagementComments, committedEventSearchQuery, eventCategory]);

    const filteredEventLikes = useMemo(() => {
        let items = [...likesTabData];
        if (committedEventSearchQuery) {
            const q = committedEventSearchQuery.toLowerCase();
            items = items.filter((evt) =>
                String(evt?.title || '').toLowerCase().includes(q) ||
                String(evt?.description || '').toLowerCase().includes(q) ||
                String(evt?.category || '').toLowerCase().includes(q)
            );
        }
        // Category filter
        if (eventCategory) {
            const catNorm = eventCategory.toLowerCase();
            items = items.filter((evt) => String(evt?.category || '').toLowerCase() === catNorm);
        }
        // Sort by event start date (soonest first)
        items.sort((a, b) => new Date(a.start_date || a.startDate || 0) - new Date(b.start_date || b.startDate || 0));
        return items;
    }, [likesTabData, committedEventSearchQuery, eventCategory]);

    const filteredEventReposts = useMemo(() => {
        let items = [...repostsTabData];
        if (committedEventSearchQuery) {
            const q = committedEventSearchQuery.toLowerCase();
            items = items.filter((evt) =>
                String(evt?.title || '').toLowerCase().includes(q) ||
                String(evt?.description || '').toLowerCase().includes(q) ||
                String(evt?.category || '').toLowerCase().includes(q)
            );
        }
        // Category filter
        if (eventCategory) {
            const catNorm = eventCategory.toLowerCase();
            items = items.filter((evt) => String(evt?.category || '').toLowerCase() === catNorm);
        }
        // Sort by event start date (soonest first)
        items.sort((a, b) => new Date(a.start_date || a.startDate || 0) - new Date(b.start_date || b.startDate || 0));
        return items;
    }, [repostsTabData, committedEventSearchQuery, eventCategory]);

    const visibleComments = filteredEventComments.slice(0, eventsRenderCount);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    // ── Effects ──
    useEffect(() => { setEventsRenderCount(EVENTS_PAGE_SIZE); }, [eventSubTab, eventFilterRange, eventCategory, committedEventSearchQuery, eventDateFrom, eventDateTo]);

    useEffect(() => {
        const node = eventsSentinelRef.current;
        if (!node) return;
        const totalItems = eventSubTab === 1 ? eventEngagementComments.length : businessEvents.length;
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && eventsRenderCount < totalItems) {
                    setEventsRenderCount((c) => Math.min(c + EVENTS_PAGE_SIZE, totalItems + EVENTS_PAGE_SIZE));
                }
            },
            { rootMargin: '400px' }
        );
        io.observe(node);
        return () => io.disconnect();
    }, [eventsRenderCount, businessEvents.length, eventEngagementComments.length, eventSubTab]);

    // Sub-tab 0: Events
    useEffect(() => {
        if (eventSubTab !== 0 || eventsTabLoaded || !business?.id) return;
        let cancelled = false;
        (async () => {
            setEventsTabLoading(true);
            try {
                const res = await fetchBusinessEvents({ businessAccountId: business.id, limit: 200, range: eventFilterRange });
                if (cancelled) return;
                const rawItems = res?.items || [];
                // Enrich events with ownership fields so EventCard's ownership detection works.
                // These events belong to this business — ensure business_account_id and user_id are set.
                const viewerUserId = Number(viewer?.id || viewer?.user_id || 0);
                const enriched = isOwnBusiness && viewerUserId
                    ? rawItems.map((evt) => ({
                        ...evt,
                        business_account_id: evt.business_account_id || evt.businessAccountId || business.id,
                        businessAccountId: evt.businessAccountId || evt.business_account_id || business.id,
                        user_id: evt.user_id || evt.organizer_id || viewerUserId,
                        organizer: {
                            ...(evt.organizer || {}),
                            id: evt.organizer?.id || evt.organizer?.user_id || evt.user_id || evt.organizer_id || viewerUserId,
                        },
                    }))
                    : rawItems;
                setEventsTabData(enriched);
                setEventsTabLoaded(true);
            } catch { if (!cancelled) setEventsTabData([]); }
            finally { if (!cancelled) setEventsTabLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [business?.id, eventFilterRange, eventSubTab, eventsTabLoaded, viewer?.id, isOwnBusiness]);

    useEffect(() => { setEventsTabLoaded(false); }, [eventFilterRange]);

    // Sub-tab 2: Likes — fetch eagerly so count shows on tab
    useEffect(() => {
        if (likesTabLoaded || !business?.id) return;
        let cancelled = false;
        (async () => {
            setLikesTabLoading(true);
            try {
                const res = await axios.get('/api/events', {
                    params: { limit: 200, range: 'custom', includeStatewide: 1, sort: 'recent', engagementBusinessId: business.id, engagementType: 'like' },
                    withCredentials: true,
                    headers: { ...getAcctHeaders() },
                });
                if (cancelled) return;
                const items = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data?.events) ? res.data.events : Array.isArray(res.data) ? res.data : [];
                setLikesTabData(items);
                setLikesTabLoaded(true);
            } catch { if (!cancelled) setLikesTabData([]); }
            finally { if (!cancelled) setLikesTabLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [business?.id, likesTabLoaded, getAcctHeaders]);

    // Sub-tab 3: Reposts — fetch eagerly so count shows on tab
    useEffect(() => {
        if (repostsTabLoaded || !business?.id) return;
        let cancelled = false;
        (async () => {
            setRepostsTabLoading(true);
            try {
                const res = await axios.get('/api/events', {
                    params: { limit: 200, range: 'custom', includeStatewide: 1, sort: 'recent', engagementBusinessId: business.id, engagementType: 'repost' },
                    withCredentials: true,
                    headers: { ...getAcctHeaders() },
                });
                if (cancelled) return;
                const items = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data?.events) ? res.data.events : Array.isArray(res.data) ? res.data : [];
                setRepostsTabData(items);
                setRepostsTabLoaded(true);
            } catch { if (!cancelled) setRepostsTabData([]); }
            finally { if (!cancelled) setRepostsTabLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [business?.id, repostsTabLoaded, getAcctHeaders]);

    // Sub-tab 1: Comments — fetch eagerly so count shows on tab
    useEffect(() => {
        if (!business?.id || eventCommentsLoaded) return;
        let alive = true;
        const controller = new AbortController();
        (async () => {
            setEventCommentsLoading(true);
            try {
                const res = await axios.get(`/api/events/business/${business.id}/event-comments`, { signal: controller.signal, withCredentials: true });
                if (!alive) return;
                setEventEngagementComments(Array.isArray(res.data?.comments) ? res.data.comments : []);
                setEventCommentsLoaded(true);
            } catch { if (alive) setEventEngagementComments([]); }
            finally { if (alive) setEventCommentsLoading(false); }
        })();
        return () => { alive = false; controller.abort(); };
    }, [business?.id, eventCommentsLoaded]);

    // Sticky detection
    useEffect(() => {
        const handleScroll = () => {
            if (eventsHeaderRef.current) {
                const rect = eventsHeaderRef.current.getBoundingClientRect();
                setIsEventsHeaderSticky(rect.top <= 1);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Get parent's activeTab index for sessionStorage saves
    const parentActiveTab = React.useContext(EventsTabIndexContext);

    // ── Edit handler — opens CreateEditEventModal with the selected event ──
    const handleEventEdit = useCallback((evt) => {
        setEditingEvent(evt);
        setEditEventModalOpen(true);
    }, []);

    // ── After edit saves — update the event in-place and show success snackbar ──
    const handleEventEditSaved = useCallback((savedEvent) => {
        setEditEventModalOpen(false);
        setEditingEvent(null);
        showEventsSuccess('Event updated successfully');

        // Refresh all tabs so the card reflects the change
        setEventsTabLoaded(false);
        setLikesTabLoaded(false);
        setRepostsTabLoaded(false);
        setEventCommentsLoaded(false);

        // Broadcast so other EventCards in the page sync
        try {
            window.dispatchEvent(new CustomEvent('ll:event:edited', { detail: { eventId: savedEvent?.id, event: savedEvent } }));
        } catch { /* ignore */ }
    }, [showEventsSuccess]);

    // ── Delete handler — remove event from local state and show success snackbar ──
    const handleEventDelete = useCallback((deletedEventId) => {
        showEventsSuccess('Event deleted successfully');
        // Remove from all tab caches so the card disappears immediately
        setEventsTabData((prev) => prev.filter((e) => String(e.id) !== String(deletedEventId)));
        setLikesTabData((prev) => prev.filter((e) => String(e.id) !== String(deletedEventId)));
        setRepostsTabData((prev) => prev.filter((e) => String(e.id) !== String(deletedEventId)));
    }, [showEventsSuccess]);

    return (
        <Box>
            <Paper sx={{ overflow: 'visible', ...(isMobileEvt ? { borderRadius: 0, boxShadow: 'none', border: 'none', backgroundImage: 'none' } : {}) }}>
                {/* Event sub-tabs — icon-only on mobile, text on desktop */}
                <Box sx={{ flexShrink: 0, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'transparent' }}>
                    {isMobileEvt ? (
                        <Stack direction="row" spacing={0} alignItems="center" justifyContent="center" sx={{ px: 1 }}>
                            {[
                                { count: eventsTabData.length, icon: <EventIcon />, idx: 0 },
                                { count: eventEngagementComments.length, icon: <ChatBubbleOutlineIcon />, idx: 1 },
                                { count: likesTabData.length, icon: <FavoriteIcon />, idx: 2 },
                                { count: repostsTabData.length, icon: <RepeatIcon />, idx: 3 },
                            ].map((sub) => {
                                const isActive = eventSubTab === sub.idx;
                                return (
                                    <Box
                                        key={sub.idx}
                                        onClick={() => setEventSubTab(sub.idx)}
                                        sx={(t) => ({
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.4,
                                            flex: 1, py: 1, cursor: 'pointer',
                                            borderBottom: '2px solid',
                                            borderColor: isActive ? t.palette.secondary.main : 'transparent',
                                            color: isActive ? 'secondary.main' : 'text.disabled',
                                            transition: 'color 150ms ease, border-color 150ms ease',
                                            '&:hover': { color: isActive ? 'secondary.main' : 'text.secondary' },
                                        })}
                                    >
                                        {React.cloneElement(sub.icon, { sx: { fontSize: 18 } })}
                                        {sub.count > 0 && (
                                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, lineHeight: 1 }}>
                                                {sub.count}
                                            </Typography>
                                        )}
                                    </Box>
                                );
                            })}
                            {/* Search toggle */}
                            <Box onClick={() => { setShowEventFilters((v) => !v); }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1, py: 1, cursor: 'pointer', color: showEventFilters ? 'primary.main' : 'text.disabled', '&:hover': { color: 'text.secondary' } }}>
                                <SearchRoundedIcon sx={{ fontSize: 18 }} />
                            </Box>
                            {/* Filter collapse toggle */}
                            <Box
                                onClick={() => setMobileEventFilterOpen((v) => !v)}
                                sx={(t) => ({
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1, py: 1, cursor: 'pointer',
                                    color: (mobileEventFilterOpen || eventFilterRange !== 'upcoming' || eventCategory || eventDateFrom || eventDateTo) ? 'primary.main' : 'text.disabled',
                                    '&:hover': { color: 'text.secondary' },
                                })}
                            >
                                <TuneRoundedIcon sx={{ fontSize: 18 }} />
                            </Box>
                        </Stack>
                    ) : (
                        <Tabs
                            value={eventSubTab}
                            onChange={(_, v) => setEventSubTab(v)}
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
                            <Tab icon={<EventIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Events${eventsTabData.length > 0 ? ` (${eventsTabData.length})` : ''}`} />
                            <Tab icon={<ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Comments${eventEngagementComments.length > 0 ? ` (${eventEngagementComments.length})` : ''}`} />
                            <Tab icon={<FavoriteIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Likes${likesTabData.length > 0 ? ` (${likesTabData.length})` : ''}`} />
                            <Tab icon={<RepeatIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Reposts${repostsTabData.length > 0 ? ` (${repostsTabData.length})` : ''}`} />
                        </Tabs>
                    )}
                </Box>

                {/* ── MOBILE: collapsible search bar only ── */}
                {isMobileEvt && (
                    <Collapse in={showEventFilters}>
                        <Box sx={{ px: 1.5, py: 1, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                            <SearchInput
                                placeholder={eventSubTab === 0 ? 'Search events…' : eventSubTab === 1 ? 'Search comments…' : eventSubTab === 2 ? 'Search likes…' : 'Search reposts…'}
                                value={eventSearchQuery}
                                onChange={(e) => setEventSearchQuery(e?.target?.value ?? '')}
                                onSearch={() => setCommittedEventSearchQuery(eventSearchQuery.trim())}
                                onClear={() => { setEventSearchQuery(''); setCommittedEventSearchQuery(''); }}
                                inputProps={{ name: 'll-biz-events-search' }}
                                autoFocus
                            />
                        </Box>
                    </Collapse>
                )}

                {/* ── MOBILE: inline filter collapse (matching ArtistProfilePage pattern) ── */}
                {isMobileEvt && (
                    <Collapse in={mobileEventFilterOpen}>
                        <Box sx={{ px: 1.5, py: 1.5, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: eventSubTab === 0 ? '1fr 1fr' : '1fr', gap: 1, mb: 1 }}>
                                {eventSubTab === 0 && (
                                    <FormControl size="small" fullWidth sx={PROFILE_CONTROL_SX}>
                                        <InputLabel shrink>View</InputLabel>
                                        <Select label="View" value={eventFilterRange} onChange={(e) => setEventFilterRange(e.target.value)} MenuProps={profileMenuProps}>
                                            <MenuItem value="upcoming">Upcoming</MenuItem>
                                            <MenuItem value="week">This Week</MenuItem>
                                            <MenuItem value="month">This Month</MenuItem>
                                            <MenuItem value="past">Past Events</MenuItem>
                                            <MenuItem value="all">All Events</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                                <FormControl size="small" fullWidth sx={PROFILE_CONTROL_SX}>
                                    <InputLabel shrink>Category</InputLabel>
                                    <Select
                                        label="Category"
                                        value={eventCategory}
                                        onChange={(e) => setEventCategory(e.target.value)}
                                        displayEmpty
                                        renderValue={(v) => {
                                            if (!v) {
                                                const countMap = {};
                                                const addCat = (c) => { const s = String(c || '').trim().toLowerCase(); if (s) countMap[s] = (countMap[s] || 0) + 1; };
                                                if (eventSubTab === 0) eventsTabData.forEach((e) => addCat(e.category));
                                                else if (eventSubTab === 1) eventEngagementComments.forEach((g) => addCat(g?.event?.category));
                                                else if (eventSubTab === 2) likesTabData.forEach((e) => addCat(e.category));
                                                else if (eventSubTab === 3) repostsTabData.forEach((e) => addCat(e.category));
                                                return `All Categories (${Object.keys(countMap).length})`;
                                            }
                                            const label = eventCategoryLabel(v);
                                            const Icon = EVENT_CATEGORY_ICONS[v] || CategoryRoundedIcon;
                                            return (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                    <Icon sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                                                    {label}
                                                </Box>
                                            );
                                        }}
                                        MenuProps={profileMenuProps}
                                    >
                                        <MenuItem value="">All Categories</MenuItem>
                                        {(() => {
                                            const countMap = {};
                                            const addCat = (c) => { const s = String(c || '').trim().toLowerCase(); if (s) countMap[s] = (countMap[s] || 0) + 1; };
                                            if (eventSubTab === 0) eventsTabData.forEach((e) => addCat(e.category));
                                            else if (eventSubTab === 1) eventEngagementComments.forEach((g) => addCat(g?.event?.category));
                                            else if (eventSubTab === 2) likesTabData.forEach((e) => addCat(e.category));
                                            else if (eventSubTab === 3) repostsTabData.forEach((e) => addCat(e.category));

                                            return EVENT_CATEGORY_FILTER_OPTIONS
                                                .filter(({ value }) => (countMap[value] || 0) > 0)
                                                .map(({ value, label, Icon }) => {
                                                    const count = countMap[value] || 0;
                                                    return (
                                                        <MenuItem key={value} value={value}>
                                                            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                                <ProfileCategoryRow Icon={Icon} label={label} />
                                                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                                                    {count}
                                                                </Typography>
                                                            </Box>
                                                        </MenuItem>
                                                    );
                                                });
                                        })()}
                                    </Select>
                                </FormControl>
                            </Box>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
                                <TextField size="small" label="From" type="date" value={eventDateFrom} onChange={(e) => setEventDateFrom(e.target.value || '')} InputLabelProps={{ shrink: true }} fullWidth sx={{ ...PROFILE_CONTROL_SX, '& .MuiInputBase-input': { fontSize: 13 } }} />
                                <TextField size="small" label="To" type="date" value={eventDateTo} onChange={(e) => setEventDateTo(e.target.value || '')} InputLabelProps={{ shrink: true }} fullWidth sx={{ ...PROFILE_CONTROL_SX, '& .MuiInputBase-input': { fontSize: 13 } }} />
                            </Box>
                            {(eventFilterRange !== 'upcoming' || eventCategory || eventDateFrom || eventDateTo) && (
                                <Button size="small" onClick={() => { setEventFilterRange('upcoming'); setEventSortBy('soonest'); setEventCategory(''); setEventDateFrom(''); setEventDateTo(''); }} startIcon={<ClearRoundedIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: 'none', fontWeight: 700, fontSize: 12, color: 'text.secondary' }}>
                                    Clear filters
                                </Button>
                            )}
                        </Box>
                    </Collapse>
                )}

                {/* ── DESKTOP: full search + filter bar (unchanged) ── */}
                {!isMobileEvt && (
                    <Box sx={{ px: 1.5, pt: 1.25, pb: 0.5, bgcolor: 'background.paper', zIndex: 7 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.75 }}>
                            <SearchInput
                                placeholder={eventSubTab === 0 ? 'Search events…' : eventSubTab === 1 ? 'Search comments…' : eventSubTab === 2 ? 'Search likes…' : 'Search reposts…'}
                                value={eventSearchQuery}
                                onChange={(e) => setEventSearchQuery(e?.target?.value ?? '')}
                                onSearch={() => setCommittedEventSearchQuery(eventSearchQuery.trim())}
                                onClear={() => { setEventSearchQuery(''); setCommittedEventSearchQuery(''); }}
                                inputProps={{ name: 'll-biz-events-search' }}
                            />
                            <Tooltip title="Clear all filters" arrow>
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        setEventSearchQuery(''); setCommittedEventSearchQuery('');
                                        setEventFilterRange('upcoming'); setEventSortBy('soonest');
                                        setEventCategory('');
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

                        {/* Filter dropdowns — View on Events sub-tab, Category + Date range on all */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: eventSubTab === 0 ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr' }, gap: 1, pb: 0.75 }}>
                            {eventSubTab === 0 && (
                                <FormControl size="small" fullWidth sx={PROFILE_CONTROL_SX}>
                                    <InputLabel shrink>View</InputLabel>
                                    <Select label="View" value={eventFilterRange} onChange={(e) => setEventFilterRange(e.target.value)} MenuProps={profileMenuProps}>
                                        <MenuItem value="upcoming">Upcoming</MenuItem>
                                        <MenuItem value="week">This Week</MenuItem>
                                        <MenuItem value="month">This Month</MenuItem>
                                        <MenuItem value="past">Past Events</MenuItem>
                                        <MenuItem value="all">All Events</MenuItem>
                                    </Select>
                                </FormControl>
                            )}
                            <FormControl size="small" fullWidth sx={PROFILE_CONTROL_SX}>
                                <InputLabel shrink>Category</InputLabel>
                                <Select
                                    label="Category"
                                    value={eventCategory}
                                    onChange={(e) => setEventCategory(e.target.value)}
                                    displayEmpty
                                    renderValue={(v) => {
                                        if (!v) {
                                            const countMap = {};
                                            const addCat = (c) => { const s = String(c || '').trim().toLowerCase(); if (s) countMap[s] = (countMap[s] || 0) + 1; };
                                            if (eventSubTab === 0) eventsTabData.forEach((e) => addCat(e.category));
                                            else if (eventSubTab === 1) eventEngagementComments.forEach((g) => addCat(g?.event?.category));
                                            else if (eventSubTab === 2) likesTabData.forEach((e) => addCat(e.category));
                                            else if (eventSubTab === 3) repostsTabData.forEach((e) => addCat(e.category));
                                            return `All Categories (${Object.keys(countMap).length})`;
                                        }
                                        const label = eventCategoryLabel(v);
                                        const Icon = EVENT_CATEGORY_ICONS[v] || CategoryRoundedIcon;
                                        return (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                <Icon sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                                                {label}
                                            </Box>
                                        );
                                    }}
                                    MenuProps={profileMenuProps}
                                >
                                    <MenuItem value="">All Categories</MenuItem>
                                    {(() => {
                                        const countMap = {};
                                        const addCat = (c) => { const s = String(c || '').trim().toLowerCase(); if (s) countMap[s] = (countMap[s] || 0) + 1; };
                                        if (eventSubTab === 0) eventsTabData.forEach((e) => addCat(e.category));
                                        else if (eventSubTab === 1) eventEngagementComments.forEach((g) => addCat(g?.event?.category));
                                        else if (eventSubTab === 2) likesTabData.forEach((e) => addCat(e.category));
                                        else if (eventSubTab === 3) repostsTabData.forEach((e) => addCat(e.category));

                                        return EVENT_CATEGORY_FILTER_OPTIONS
                                            .filter(({ value }) => (countMap[value] || 0) > 0)
                                            .map(({ value, label, Icon }) => {
                                                const count = countMap[value] || 0;
                                                return (
                                                    <MenuItem key={value} value={value}>
                                                        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                            <ProfileCategoryRow Icon={Icon} label={label} />
                                                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                                                {count}
                                                            </Typography>
                                                        </Box>
                                                    </MenuItem>
                                                );
                                            });
                                    })()}
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
                )}

                {/* Events content area */}
                <Box sx={{ p: { xs: 0, sm: 3 }, minHeight: 280 }}>
                    <ContentFadeIn triggerKey={eventSubTab}>
                        {/* ── Comments sub-tab ── */}
                        {eventSubTab === 1 ? (
                            eventCommentsLoading ? (
                                <PulsingDots />
                            ) : eventEngagementComments.length === 0 ? (
                                <EmptyStateCard
                                    icon={<ChatBubbleOutlineIcon sx={{ fontSize: 64 }} />}
                                    title="No current activity"
                                    description={`${business.name} hasn't commented on any events yet.`}
                                />
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {visibleComments.map((group) => {
                                        const ev0 = group.event || {};
                                        const comments = Array.isArray(group.comments) ? group.comments : [];
                                        const total = comments.length;
                                        const latest = comments[0] || null;

                                        const eventPhoto = String(ev0?.mainPhotoUrl || ev0?.image_url || ev0?.photoUrl || '').trim();
                                        const ecTruncate = (t, n) => {
                                            const s0 = String(t || '').trim();
                                            if (!s0) return '';
                                            return s0.length > n ? `${s0.slice(0, n)}…` : s0;
                                        };
                                        const eventTimeAgo = (raw) => {
                                            if (!raw) return '';
                                            const d = new Date(raw);
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
                                        };

                                        const saveAndNavigate = (commentId) => {
                                            if (onEventClick) { onEventClick(ev0, commentId || null); return; }
                                            try {
                                                sessionStorage.setItem('ll:businessScrollRestore', JSON.stringify({
                                                    slug: slug,
                                                    tab: parentActiveTab,
                                                    eventSubTab,
                                                    ts: Date.now(),
                                                }));
                                            } catch { /* ignore */ }
                                            navigate(`/events/${ev0.id}`, {
                                                state: {
                                                    fromEvents: true,
                                                    fromBusiness: {
                                                        slug: slug,
                                                        name: business.name || '',
                                                        _savedTab: parentActiveTab,
                                                        _savedEventSubTab: eventSubTab,
                                                    },
                                                    ...(commentId ? { scrollToCommentId: commentId, highlightCommentId: commentId } : {}),
                                                },
                                            });
                                        };

                                        const bizAvatar = business?.avatar_url || business?.logo_url || '';

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
                                                    onClick={() => saveAndNavigate(null)}
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
                                                                <EventIcon sx={{ fontSize: 20, color: '#fff' }} />
                                                            </Avatar>
                                                        )}
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography sx={{ fontWeight: 900, fontSize: 14 }} noWrap title={String(ev0?.title || '')}>
                                                                {String(ev0?.title || '').trim() || 'Event'}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary" noWrap>
                                                                {ev0?.category ? `${formatEventCategory(ev0.category)} • ` : ''}
                                                                {latest?.created_at ? eventTimeAgo(latest.created_at) : ''}
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

                                                        const commenterAvatar = c?.account_avatar_url || c?.user_avatar || c?.avatar_url || c?.profile_picture || c?.profileImageUrl || c?.commenterAvatar || bizAvatar;
                                                        const commenterName = c?.account_name || c?.user_name || c?.commenter_name || c?.author_name || c?.name || (c?.first_name ? `${c.first_name || ''}${c.last_name ? ` ${c.last_name}` : ''}`.trim() : (business.name || 'Business'));
                                                        const commenterHandle = c?.account_handle || c?.user_handle || c?.handle || c?.commenter_handle || (business.slug ? String(business.slug).replace(/^@+/, '') : '');

                                                        return (
                                                            <Box
                                                                key={`ec-c-${c?.id || c?.comment_id || ''}`}
                                                                onClick={(e) => { e.stopPropagation(); saveAndNavigate(commentId); }}
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
                                                                        <Avatar src={commenterAvatar} alt={commenterName} sx={{ width: 34, height: 34 }} imgProps={{ referrerPolicy: 'no-referrer' }} />
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
                                                                        {cTime ? eventTimeAgo(cTime) : ''}
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
                                                            onClick={(e) => { e.stopPropagation(); saveAndNavigate(null); }}
                                                        >
                                                            View all comments on this event
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            )
                        ) : (
                            /* ── Events / Likes / Reposts sub-tabs ── */
                            eventsLoading ? (
                                <PulsingDots />
                            ) : hasEvents ? (
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: { xs: 0, sm: 2 } }}>
                                    {sortedEvents.map((evt) => (
                                        <Box key={evt.id} sx={(t) => ({ borderBottom: { xs: `1px solid ${alpha(t.palette.divider, 0.12)}`, sm: 'none' }, '&:last-child': { borderBottom: 'none' } })}>
                                            <EventCard
                                                event={evt}
                                                user={viewer}
                                                onClick={() => {
                                                    if (onEventClick) { onEventClick(evt); return; }
                                                    try {
                                                        sessionStorage.setItem('ll:businessScrollRestore', JSON.stringify({
                                                            slug: slug,
                                                            tab: parentActiveTab,
                                                            eventSubTab,
                                                            ts: Date.now(),
                                                        }));
                                                    } catch { /* ignore */ }
                                                    navigate(`/events/${evt.id}`, {
                                                        state: {
                                                            fromEvents: true,
                                                            fromBusiness: {
                                                                slug: slug,
                                                                name: business.name || '',
                                                                _savedTab: parentActiveTab,
                                                                _savedEventSubTab: eventSubTab,
                                                            },
                                                        },
                                                    });
                                                }}
                                                onEdit={handleEventEdit}
                                                onDelete={handleEventDelete}
                                            />
                                        </Box>
                                    ))}
                                </Box>
                            ) : (
                                <EmptyStateCard
                                    icon={
                                        eventSubTab === 2
                                            ? <FavoriteIcon sx={{ fontSize: 64 }} />
                                            : eventSubTab === 3
                                                ? <RepeatIcon sx={{ fontSize: 64 }} />
                                                : <EventIcon sx={{ fontSize: 64 }} />
                                    }
                                    title={
                                        eventSubTab === 2
                                            ? 'No current activity'
                                            : eventSubTab === 3
                                                ? 'No current activity'
                                                : eventFilterRange === 'upcoming' ? 'No upcoming events'
                                                    : eventFilterRange === 'past' ? 'No past events'
                                                        : 'No events found'
                                    }
                                    description={
                                        eventSubTab === 2
                                            ? `${business.name} hasn't liked any events yet.`
                                            : eventSubTab === 3
                                                ? `${business.name} hasn't reposted any events yet.`
                                                : eventFilterRange === 'past'
                                                    ? `${business.name} doesn't have any past events on record.`
                                                    : eventFilterRange !== 'all'
                                                        ? `Try changing the date range in the filter.`
                                                        : `${business.name} hasn't posted any events yet.`
                                    }
                                    action={
                                        eventSubTab === 0 && eventFilterRange !== 'all' ? (
                                            <Button variant="outlined" onClick={() => setEventFilterRange('all')} sx={{ textTransform: 'none', fontWeight: 700, mt: 1 }}>
                                                Show All Events
                                            </Button>
                                        ) : null
                                    }
                                />
                            )
                        )}
                    </ContentFadeIn>
                </Box>
                <Box ref={eventsSentinelRef} sx={{ height: 1 }} />
            </Paper>

            {/* Edit Event Modal */}
            <CreateEditEventModal
                open={editEventModalOpen}
                onClose={() => { setEditEventModalOpen(false); setEditingEvent(null); }}
                user={viewer}
                eventToEdit={editingEvent}
                onSaved={handleEventEditSaved}
            />

            <SuccessSnackbar {...eventsSnackbarProps} />
        </Box>
    );
}


/* ════════════════════════════════════════════════════════════════════════════
   QUICK MESSAGE RATE-LIMIT TRACKER (sessionStorage-backed, shared across pages)
   Tracks per-recipient, 5 msgs / 10 min window.
   Uses sessionStorage so limits carry over between BusinessPublicPage
   and BusinessDetailPanel within the same browser session.
   ════════════════════════════════════════════════════════════════════════════ */
const _BIZ_MSG_WINDOW = 10 * 60 * 1000;
const _BIZ_MSG_MAX = 5;
const _BIZ_MSG_STORAGE_PREFIX = "ll:bizMsgTrack:";

function _getBizMsgEntries(recipientKey) {
    const now = Date.now();
    const storageKey = _BIZ_MSG_STORAGE_PREFIX + String(recipientKey);
    try {
        const raw = sessionStorage.getItem(storageKey);
        if (!raw) return [];
        return JSON.parse(raw).filter(t => now - t < _BIZ_MSG_WINDOW);
    } catch { return []; }
}

function _trackBizMsg(recipientKey) {
    const now = Date.now();
    const storageKey = _BIZ_MSG_STORAGE_PREFIX + String(recipientKey);
    const entries = _getBizMsgEntries(recipientKey);
    entries.push(now);
    try { sessionStorage.setItem(storageKey, JSON.stringify(entries)); } catch { /* */ }
}

function _isBizLimited(recipientKey) {
    return _getBizMsgEntries(recipientKey).length >= _BIZ_MSG_MAX;
}

/* ════════════════════════════════════════════════════════════════════════════
   QUICK MESSAGE DIALOG — compact compose popup with pre-filled recipient
   ════════════════════════════════════════════════════════════════════════════ */
function QuickMessageDialog({ open, onClose, onSent, recipient }) {
    const qmTheme = useTheme();
    const qmIsMobile = useMediaQuery(qmTheme.breakpoints.down('md'));
    const [body, setBody] = useState('');
    const [photos, setPhotos] = useState([]);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const [limitReached, setLimitReached] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!open) {
            const timer = setTimeout(() => { setBody(''); setPhotos([]); setError(''); setCooldown(0); setSuccess(false); }, 200);
            return () => clearTimeout(timer);
        }
        if (open && recipient?.id && _isBizLimited(recipient.id)) { setLimitReached(true); }
    }, [open, recipient?.id]);

    const handleSend = async () => {
        if (!recipient?.id || (!body.trim() && photos.length === 0) || cooldown > 0) return;
        if (_isBizLimited(recipient.id)) { setLimitReached(true); return; }
        setSending(true); setError('');
        try {
            const photoPayload = [];
            for (const p of photos) {
                if (p.file) {
                    try {
                        const ct = p.file.type || 'image/jpeg';
                        const sn = `${Date.now()}_msg_${p.file.name || 'photo.jpg'}`;
                        const s = await getSignedUploadUrl({ folder: 'business/messages', fileName: sn, contentType: ct });
                        if (s?.uploadUrl) { await uploadToSignedUrl({ uploadUrl: s.uploadUrl, file: p.file, contentType: ct }); photoPayload.push({ url: String(s.publicUrl || '').trim(), objectPath: String(s.objectPath || '').trim() }); }
                    } catch { /* skip */ }
                }
            }
            const hdrs = getAccountHeaders();
            await axios.post('/api/messages/send', { recipient_type: 'business', recipient_id: recipient.id, body: body.trim(), photos: photoPayload }, { withCredentials: true, headers: { ...hdrs } });
            _trackBizMsg(recipient.id);
            photos.forEach((p) => { if (p?.url && !p._existing) { try { URL.revokeObjectURL(p.url); } catch {} } });
            setPhotos([]); setSuccess(true);
        } catch (err) {
            const status = err?.response?.status; const data = err?.response?.data;
            if (status === 429) {
                const wait = Number(data?.retryAfterSeconds) || 15;
                setError(data?.message || data?.error || "You're sending messages too quickly.");
                setCooldown(wait);
                const timer = setInterval(() => { setCooldown(prev => { if (prev <= 1) { clearInterval(timer); setError(''); return 0; } return prev - 1; }); }, 1000);
            } else { setError(data?.message || err?.message || 'Failed to send message.'); }
        } finally { setSending(false); }
    };

    const closeDialog = () => { if (sending) return; photos.forEach((p) => { if (p?.url && !p._existing) { try { URL.revokeObjectURL(p.url); } catch {} } }); setPhotos([]); onClose(); };

    return (
        <>
            <Dialog
                open={open && !limitReached}
                onClose={closeDialog}
                maxWidth="sm"
                fullWidth
                fullScreen={qmIsMobile}
                disableScrollLock
                PaperProps={{ sx: { borderRadius: qmIsMobile ? 0 : 3, maxHeight: qmIsMobile ? '100vh' : '85vh', ...(qmIsMobile && { display: 'flex', flexDirection: 'column' }) } }}
                sx={{ zIndex: (t) => t.zIndex.modal + 50 }}
            >
                <DialogTitle sx={{ pr: 6, ...(qmIsMobile && { borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }) }}>
                    {!success && (<Typography sx={{ fontWeight: 950, fontSize: 16 }}>Contact Business</Typography>)}
                    <IconButton aria-label="Close" onClick={closeDialog} disabled={sending} sx={{ position: 'absolute', right: 12, top: 12 }}><CloseIcon fontSize="small" /></IconButton>
                </DialogTitle>
                <DialogContent sx={qmIsMobile ? { flex: 1, overflowY: 'auto', pb: 0, display: 'flex', flexDirection: 'column' } : undefined}>
                    {success ? (
                        <Stack spacing={2} sx={{ py: 2, ...(qmIsMobile && { flex: 1, justifyContent: 'center' }) }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                                <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 0.5 }}>Message Sent!</Typography>
                                <Typography variant="body2" color="text.secondary">They will receive your message and get back to you soon.</Typography>
                            </Box>
                            <Button variant="contained" fullWidth onClick={() => { closeDialog(); if (onSent) onSent(); }}
                                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, ...(qmIsMobile && { py: 1.5, fontSize: '1rem' }) }}>Done</Button>
                        </Stack>
                    ) : (
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>To:</Typography>
                                <Chip avatar={<Avatar src={recipient?.avatar_url} imgProps={{ referrerPolicy: "no-referrer" }} sx={{ width: 24, height: 24 }}><StorefrontOutlinedIcon sx={{ fontSize: 14 }} /></Avatar>} label={recipient?.name || 'Business'} sx={{ fontWeight: 700, fontSize: '0.8rem' }} />
                            </Box>
                            <Box sx={(t) => ({ p: 1.5, borderRadius: 2, bgcolor: alpha(t.palette.primary.main, 0.04), border: '1px solid', borderColor: alpha(t.palette.primary.main, 0.1) })}>
                                <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{recipient?.name || 'Business'}</Typography>
                                <Typography variant="caption" color="text.secondary">Business</Typography>
                            </Box>
                            <TextField label="Message" placeholder="Describe what you need, timeline, budget, etc." multiline minRows={qmIsMobile ? 4 : 5} maxRows={qmIsMobile ? 8 : 10} value={body} onChange={(e) => { setBody(e.target.value.slice(0, 2000)); if (error) setError(''); }} inputProps={{ maxLength: 2000 }} fullWidth error={Boolean(error)} helperText={error || `${body.length} / 2,000`} FormHelperTextProps={{ sx: { textAlign: error ? 'left' : 'right', mr: 0.5, fontWeight: 600, fontSize: '0.75rem' } }} sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'background.paper' } }} />
                            <PhotosUploadSection photos={photos} setPhotos={setPhotos} disabled={sending} maxPhotos={4} title="Photos (optional)" helperText="Add up to 4 photos to help describe what you need." addButtonText="Add photos" />
                        </Stack>
                    )}
                </DialogContent>
                {!success && (
                    <Box sx={{ flexShrink: 0, borderTop: '1px solid', borderColor: 'divider', p: 2, pb: qmIsMobile ? bottomInsetSx({ basePadding: 16 }).paddingBottom : 2, bgcolor: 'background.paper' }}>
                        {sending && <LinearProgress sx={{ mb: 1.5, borderRadius: 1 }} />}
                        <Stack direction="row" spacing={1.5} justifyContent={qmIsMobile ? 'stretch' : 'flex-end'}>
                            <Button variant="outlined" onClick={closeDialog} disabled={sending} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, ...(qmIsMobile && { flex: 1, py: 1.4, fontSize: '0.95rem' }) }}>Cancel</Button>
                            <Button variant="contained" onClick={handleSend} disabled={(!body.trim() && photos.length === 0) || sending || cooldown > 0} startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendRoundedIcon />} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, ...(qmIsMobile && { flex: 2, py: 1.4, fontSize: '0.95rem' }) }}>{cooldown > 0 ? `Wait ${cooldown}s` : sending ? 'Sending\u2026' : 'Send Message'}</Button>
                        </Stack>
                    </Box>
                )}
            </Dialog>

            <Dialog open={limitReached} onClose={() => { setLimitReached(false); onClose(); }} maxWidth="xs" fullWidth disableScrollLock sx={{ zIndex: (t) => t.zIndex.modal + 50 }} PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogContent sx={{ textAlign: "center", py: 4, px: 3 }}>
                    <AccessTimeRoundedIcon sx={{ fontSize: 48, color: "warning.main", mb: 2 }} />
                    <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 1 }}>Slow down a bit!</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>You've sent several messages to this business recently. Give them a chance to respond before sending more.</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: "center" }}>
                    <Button variant="contained" onClick={() => { setLimitReached(false); onClose(); }} sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, px: 4 }}>Got it</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

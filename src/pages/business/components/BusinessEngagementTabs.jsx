// src/pages/business/components/BusinessEngagementTabs.jsx
//
// Tabbed engagement interface for the business public page (replaces "Posts & Updates").
//
//   Top-level pill tabs:  Posts  |  Events  |  Jobs  |  Services
//
//   - Posts tab:     sub-tabs → Posts / Comments / Likes / Reposts
//                    "Posts" sub-tab content provided by parent via `postsContent` prop.
//                    Comments / Likes / Reposts fetched internally from the user
//                    engagement API (same endpoint as user-profile right rail).
//   - Events tab:   content provided by parent via `eventsContent` prop.
//   - Jobs tab:     fetched internally from /api/jobs/feed, rendered with JobCard.
//   - Services tab: fetched internally from /api/services/feed, rendered with ServiceCard.
//
//   Events/Jobs/Services tabs only render if they have data.
//   Everything scrolls with the page (no internal scroll-box).

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../api/axiosInstance';
import { secureFetch } from '../../../utils/secureFetch';
import { alpha } from '@mui/material/styles';
import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Collapse,
    Dialog,
    Fab,
    FormControl,
    IconButton,
    InputLabel,
    Menu as MuiMenu,
    MenuItem,
    Paper,
    Select,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import ForumIcon from '@mui/icons-material/Forum';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import RepeatIcon from '@mui/icons-material/Repeat';
import EventIcon from '@mui/icons-material/Event';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import AddIcon from '@mui/icons-material/Add';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';

import { getAccountHeaders } from '../../../utils/getAccountHeadersStatic';
import { getProfileSubTabsSx, getProfileFilterBarSx, getProfileSelectSx } from '../../../themes/theme';
import { ProfilePostCard } from '../../profile/userProfile/ProfilePostsList';
import { MusicPostCardItem } from '../../music/components/MusicPostsList';
import BusinessPostCard from './BusinessPostCard';
import JobCard from '../../jobs/components/JobCard';
import ServiceCard from '../../services/components/ServiceCard';
import ServiceRequestCard from '../../services/components/ServiceRequestCard';
import { getServiceCategoryInfo } from '../../services/utils/serviceHelpers';
import UserCardPopover from '../../../components/UserCardPopover';
import AccountAvatar from '../../../components/AccountAvatar';
import SearchInput from '../../../components/SearchInput';
import FrontHandRoundedIcon from '@mui/icons-material/FrontHandRounded';
import HandymanRoundedIcon from '@mui/icons-material/HandymanRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import { fetchEvents, formatEventDateTimeCT, formatEventLocation, getEventCategoryLabel } from '../../events/api/eventsApi';

// Job category icons (matching UserProfilePage)
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import MemoryRoundedIcon from '@mui/icons-material/MemoryRounded';
import LocalHospitalRoundedIcon from '@mui/icons-material/LocalHospitalRounded';
import ConstructionRoundedIcon from '@mui/icons-material/ConstructionRounded';
import PrecisionManufacturingRoundedIcon from '@mui/icons-material/PrecisionManufacturingRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import CleaningServicesRoundedIcon from '@mui/icons-material/CleaningServicesRounded';
import GavelRoundedIcon from '@mui/icons-material/GavelRounded';
import GppGoodRoundedIcon from '@mui/icons-material/GppGoodRounded';
import AgricultureRoundedIcon from '@mui/icons-material/AgricultureRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import UpdateRoundedIcon from '@mui/icons-material/UpdateRounded';
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded';
import BusinessCenterRoundedIcon from '@mui/icons-material/BusinessCenterRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import RestaurantRoundedIcon from '@mui/icons-material/RestaurantRounded';
import VolunteerActivismRoundedIcon from '@mui/icons-material/VolunteerActivismRounded';
import {
    fetchBusinessActivityComments,
    fetchBusinessActivityLikes,
    fetchBusinessActivityReposts,
} from '../api/businessApi';
import { fetchServiceRequestsByUser } from '../../services/api/servicesApi';

const api = process.env.REACT_APP_API_URL || '';

/* ── Job category labels & icons (matching UserProfilePage) ── */
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

/* ── Post type filter options with icons ── */
const POST_TYPE_ICON_OPTIONS = [
    { value: 'all', label: 'All Types', Icon: ListAltRoundedIcon },
    { value: 'update', label: 'Updates', Icon: UpdateRoundedIcon },
    { value: 'deal', label: 'Deals', Icon: LocalOfferRoundedIcon },
    { value: 'announcement', label: 'Announcements', Icon: CampaignRoundedIcon },
];

/* ── Shared dropdown styling — matches SearchInput frosted-glass look ── */
const PROFILE_CONTROL_SX = Object.freeze({
    '& .MuiOutlinedInput-root': {
        borderRadius: 999,
        backgroundColor: (t) => {
            const isDark = t.palette.mode === 'dark';
            const frost = t.custom?.brand?.frost || (isDark ? '#232D3D' : '#E7EBF1');
            return isDark ? alpha(frost, 0.6) : alpha(t.palette.common.white, 0.92);
        },
        backdropFilter: 'saturate(140%) blur(10px)',
        minHeight: 40, overflow: 'hidden',
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

/* ────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────── */

/** Format large numbers: 999 → "999", 1000 → "1k", 1100 → "1.1k", 12345 → "12.3k", 1000000 → "1M" */
const formatCount = (n) => {
    const num = Number(n || 0);
    if (num < 1000) return String(num);
    if (num < 1_000_000) {
        const k = num / 1000;
        return k % 1 === 0 ? `${k}k` : `${parseFloat(k.toFixed(1))}k`;
    }
    const m = num / 1_000_000;
    return m % 1 === 0 ? `${m}M` : `${parseFloat(m.toFixed(1))}M`;
};

const formatTimeAgo = (raw) => {
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
};

const normalizePost = (post) => {
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
};

const PAGE_SIZE = 25;

/* ────────────────────────────────────────────────────────────────
   Photo helpers — match ProfilePostsList exactly
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

function BizPostPhotoGrid({ mediaUrls }) {
    if (!mediaUrls || mediaUrls.length === 0) return null;
    const count = mediaUrls.length;

    // Clicks bubble up to the parent card row which opens the post detail.
    const imgCell = (url, idx, sx = {}) => (
        <Box key={idx}
             sx={{ position: 'relative', cursor: 'pointer', overflow: 'hidden', ...sx }}>
            <Box component="img" src={url} alt="" sx={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', display: 'block',
                transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
        </Box>
    );

    const overlay = (extra) => (
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: (t) => alpha(t.palette.common.black, 0.55), display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <Typography sx={{ color: 'common.white', fontWeight: 800, fontSize: '1.5rem' }}>+{extra}</Typography>
        </Box>
    );

    // 1 photo — natural aspect ratio, capped height, no crop
    if (count === 1) {
        return (
            <Box sx={{ borderRadius: 2.5, overflow: 'hidden', mt: 1.5 }}>
                <Box
                    sx={{ position: 'relative', cursor: 'pointer',  }}
                >
                    <Box
                        component="img"
                        src={mediaUrls[0]}
                        alt=""
                        sx={{
                            width: '100%',
                            maxHeight: 600,
                            objectFit: 'contain',
                            display: 'block',
                            transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    />
                </Box>
            </Box>
        );
    }
    if (count === 2) return (<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 220, sm: 280, md: 320 }, mt: 1.5 }}>{imgCell(mediaUrls[0], 0)}{imgCell(mediaUrls[1], 1)}</Box>);
    if (count === 3) return (<Box sx={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gridTemplateRows: '1fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 260, sm: 340, md: 400 }, mt: 1.5 }}>{imgCell(mediaUrls[0], 0, { gridRow: '1 / 3' })}{imgCell(mediaUrls[1], 1)}{imgCell(mediaUrls[2], 2)}</Box>);
    if (count === 4) return (<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '2fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 300, sm: 380, md: 440 }, mt: 1.5 }}>{imgCell(mediaUrls[0], 0, { gridColumn: '1 / 4' })}{imgCell(mediaUrls[1], 1)}{imgCell(mediaUrls[2], 2)}{imgCell(mediaUrls[3], 3)}</Box>);
    const extra = count - 5;
    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 2fr 2fr', gridTemplateRows: '1fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 280, sm: 360, md: 420 }, mt: 1.5 }}>
            {imgCell(mediaUrls[0], 0, { gridRow: '1 / 3' })}{imgCell(mediaUrls[1], 1)}{imgCell(mediaUrls[2], 2)}{imgCell(mediaUrls[3], 3)}
            <Box sx={{ position: 'relative', cursor: 'pointer', overflow: 'hidden', }}>
                <Box component="img" src={mediaUrls[4]} alt="" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)' }} />
                {extra > 0 && overlay(extra)}
            </Box>
        </Box>
    );
}

function BizPhotoLightbox({ open, onClose, mediaUrls, initialIndex }) {
    const [index, setIndex] = useState(initialIndex || 0);
    useEffect(() => { if (open) setIndex(initialIndex || 0); }, [open, initialIndex]);
    if (!mediaUrls || mediaUrls.length === 0) return null;
    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { bgcolor: 'common.black', maxHeight: '90vh' } }}>
            <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8, color: 'common.white', zIndex: 1 }}><CloseIcon /></IconButton>
            {mediaUrls.length > 1 && (
                <>
                    <IconButton onClick={() => setIndex((p) => (p - 1 + mediaUrls.length) % mediaUrls.length)} sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'common.white', bgcolor: (t) => alpha(t.palette.common.black, 0.50), '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.70) } }}><ChevronLeftRoundedIcon /></IconButton>
                    <IconButton onClick={() => setIndex((p) => (p + 1) % mediaUrls.length)} sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'common.white', bgcolor: (t) => alpha(t.palette.common.black, 0.50), '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.70) } }}><ChevronRightRoundedIcon /></IconButton>
                </>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, height: '80vh' }}>
                <Box component="img" src={mediaUrls[index]} alt="" sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </Box>
        </Dialog>
    );
}

/* ────────────────────────────────────────────────────────────────
   Styles
   ──────────────────────────────────────────────────────────────── */
/* Pill chip button sx — matches UserProfilePage right-rail tab styling exactly */
const pillChipSx = (t, active) => ({
    borderRadius: 999,
    textTransform: 'none',
    fontFamily: t.typography.fontFamily,
    fontWeight: active ? 950 : 700,
    letterSpacing: '-0.01em',
    fontSize: { xs: 12.5, md: 13.5 },
    lineHeight: 1,
    '& .MuiButton-startIcon': { marginRight: 0.9 },
    height: 38,
    px: { xs: 1.25, md: 1.75 },
    whiteSpace: 'nowrap',
    flexShrink: 0,
    color: active ? t.palette.primary.main : t.palette.text.secondary,
    backgroundColor: active ? alpha(t.palette.primary.main, 0.08) : 'transparent',
    border: '1px solid',
    borderColor: active ? alpha(t.palette.primary.main, 0.2) : 'transparent',
    boxShadow: 'none',
    transition: `all ${t.custom?.motion?.base || 200}ms ${t.custom?.motion?.ease || 'ease'}`,
    '&:hover': {
        backgroundColor: active ? alpha(t.palette.primary.main, 0.1) : alpha(t.palette.text.primary, 0.04),
        color: active ? t.palette.primary.main : t.palette.text.primary,
    },
    '&:focus-visible': {
        outline: 'none',
        boxShadow: `0 0 0 3px ${alpha(t.palette.primary.main, 0.20)}`,
    },
});

const pillIconSx = (t, active) => ({
    fontSize: 20,
    opacity: active ? 1 : 0.72,
    color: active ? t.palette.primary.main : t.palette.text.secondary,
});

const subTabsSx = (t) => ({
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
});


/* ════════════════════════════════════════════════════════════════
   Component
   ════════════════════════════════════════════════════════════════ */
export default function BusinessEngagementTabs({
                                                   business,
                                                   viewer,
                                                   isOwnBusiness = false,
                                                   canCreatePosts = false,
                                                   onCreatePost,
                                                   onCreateEvent,
                                                   onCreateJob,
                                                   onCreateService,
                                                   onCreateServiceRequest,

                                                   // Posts tab — raw business posts array + loading state
                                                   posts: postsProp = [],
                                                   postsLoading = false,

                                                   // Post action handlers for BusinessPostCard
                                                   canEditPosts = false,
                                                   canPinPosts = false,
                                                   onPinPost,
                                                   onUnpinPost,
                                                   onEditPost,
                                                   onDeletePost,
                                                   onReportPost,
                                                   onSharePost,

                                                   // Events tab
                                                   hasEvents = false,
                                                   eventsContent,
                                                   eventsCount = 0,

                                                   // Jobs/Services — passed by parent if already fetched, otherwise we fetch
                                                   hasJobs = false,
                                                   jobsFromParent,
                                                   jobsLoading: jobsLoadingProp,
                                                   hasServices = false,
                                                   servicesFromParent,
                                                   servicesLoading: servicesLoadingProp,

                                                   // Job action handlers (passed through from parent)
                                                   onJobClick,
                                                   onEditJob,
                                                   onDeleteJobClick,
                                                   onJobShare,
                                                   onJobSaveToggle,
                                                   onJobApply,
                                                   onJobReport,
                                                   onJobRenew,

                                                   // Service action handlers
                                                   onServiceClick,
                                                   onServiceRequestClick,
                                                   onEditServiceRequest,
                                                   onDeleteServiceRequest,
                                                   onRespondServiceRequest,
                                                   onServiceShare,
                                                   onServiceFavorite,
                                                   onServiceMessage,

                                                   // Post click handler — if provided, opens post in a popup instead of navigating
                                                   onPostClick,

                                                   // Comment click handler — if provided, called with (post, commentId) so parent can open popup with highlight
                                                   onCommentClick,

                                                   activeAccount,
                                                   initialPostsSubTab = 0,

                                                   // ── Scroll-restore support ──
                                                   // Called when the posts sub-tab changes so the parent can track it
                                                   onPostsSubTabChange,
                                                   // Called before navigating away so the parent can save scroll state
                                                   onBeforeNavigate,
                                                   // The parent's top-level activeTab index (Overview=0, Events=1, etc.)
                                                   parentActiveTab,
                                                   // Business slug passed from parent for navigation state
                                                   businessSlug: businessSlugProp,

                                                   // Blocked/hidden user IDs — filter engagement tabs
                                                   blockedAndHiddenUserIds,
                                                   // Blocked/hidden entity IDs — filter by business_id and artist_id
                                                   blockedBusinessIds: blockedBusinessIdsProp,
                                                   blockedArtistIds: blockedArtistIdsProp,
                                                   // Viewer's following IDs — filter followers-only posts
                                                   viewerFollowingIds,
                                                   // Make tabs sticky on scroll
                                                   stickyTabs = false,
                                                   // Search query from parent for filtering engagement data
                                                   searchQuery = '',
                                                   // Nonce to force service requests refetch
                                                   serviceRequestsNonce = 0,
                                                   // Nonce to force jobs refetch
                                                   jobsNonce = 0,
                                                   // When true, the component is rendered inside a fullscreen dialog on mobile
                                                   mobileFullscreen = false,
                                                   // Callback when mobile scroll hides/shows the header
                                                   onHeaderHiddenChange,
                                                   // Content to render above the tabs inside the sticky header (e.g. Activity bar)
                                                   activityBarContent,
                                               }) {
    const navigate = useNavigate();
    const _engTheme = useTheme();
    const isMobileEng = useMediaQuery(_engTheme.breakpoints.down('md'));

    /* ── Mobile FAB menu ── */
    const [fabMenuAnchor, setFabMenuAnchor] = useState(null);
    /* ── Mobile filter drawer ── */
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    /* ── Mobile filter drawers for other tabs ── */
    const [mobileJobsFilterOpen, setMobileJobsFilterOpen] = useState(false);
    const [mobileServicesFilterOpen, setMobileServicesFilterOpen] = useState(false);
    /* ── Mobile search expanded (per-tab) ── */
    const [mobileSearchVisible, setMobileSearchVisible] = useState(false);
    const [mobileJobsSearchVisible, setMobileJobsSearchVisible] = useState(false);
    const [mobileServicesSearchVisible, setMobileServicesSearchVisible] = useState(false);
    /* ── Mobile scroll-direction header hide/show ── */
    const [headerHidden, setHeaderHidden] = useState(false);
    const lastScrollY = useRef(0);
    const scrollTicking = useRef(false);

    useEffect(() => {
        if (!mobileFullscreen || !isMobileEng) { setHeaderHidden(false); return; }
        // Find the nearest scrollable ancestor of the sticky header
        const findScrollParent = (el) => {
            let node = el?.parentElement;
            while (node) {
                const ov = getComputedStyle(node).overflowY;
                if (ov === 'auto' || ov === 'scroll') return node;
                node = node.parentElement;
            }
            return window;
        };
        const scrollEl = findScrollParent(stickyHeaderRef.current);
        const getScrollTop = () => scrollEl === window ? (window.scrollY || document.documentElement.scrollTop) : scrollEl.scrollTop;

        const onScroll = () => {
            if (scrollTicking.current) return;
            scrollTicking.current = true;
            requestAnimationFrame(() => {
                const currentY = getScrollTop();
                const delta = currentY - lastScrollY.current;
                // Only toggle after a meaningful scroll (>8px) to avoid jitter
                if (delta > 8) setHeaderHidden(true);   // scrolling down → hide
                else if (delta < -8) setHeaderHidden(false); // scrolling up → show
                lastScrollY.current = currentY;
                scrollTicking.current = false;
            });
        };
        const target = scrollEl === window ? window : scrollEl;
        target.addEventListener('scroll', onScroll, { passive: true });
        return () => target.removeEventListener('scroll', onScroll);
    }, [mobileFullscreen, isMobileEng]);

    // Notify parent when header hidden state changes (for Activity bar sync)
    useEffect(() => {
        if (typeof onHeaderHiddenChange === 'function') onHeaderHiddenChange(headerHidden);
    }, [headerHidden, onHeaderHiddenChange]);

    /* ── Sticky header detection ── */
    const stickyHeaderRef = useRef(null);
    const [isHeaderSticky, setIsHeaderSticky] = useState(false);

    const scrollToContentTop = useCallback(() => {
        const el = stickyHeaderRef.current || cardRef.current;
        if (el) {
            let top = 0;
            let node = el;
            while (node) { top += node.offsetTop || 0; node = node.offsetParent; }
            window.scrollTo({ top, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, []);

    useEffect(() => {
        if (!stickyTabs) { setIsHeaderSticky(false); return; }
        const handleScroll = () => {
            if (stickyHeaderRef.current) {
                const rect = stickyHeaderRef.current.getBoundingClientRect();
                setIsHeaderSticky(rect.top <= 1);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [stickyTabs]);

    /* ── Top-level tab ── */
    const [activeTab, setActiveTab] = useState('posts');

    /* ── Service Requests state (declared early so safeTab can reference it) ── */
    const [serviceRequests, setServiceRequests] = useState([]);
    const [serviceRequestsLoading, setServiceRequestsLoading] = useState(false);
    const [serviceRequestsFetched, setServiceRequestsFetched] = useState(false);
    const hasServiceRequests = serviceRequests.length > 0;

    /* ── Internal events state (self-fetch fallback when eventsContent not provided) ── */
    const [internalEvents, setInternalEvents] = useState([]);
    const [internalEventsLoading, setInternalEventsLoading] = useState(false);
    const [internalEventsFetched, setInternalEventsFetched] = useState(false);
    const [internalEventComments, setInternalEventComments] = useState([]);
    const [internalEventCommentsLoading, setInternalEventCommentsLoading] = useState(false);
    const [internalEventEngagement, setInternalEventEngagement] = useState([]);
    const [internalEventEngagementLoading, setInternalEventEngagementLoading] = useState(false);
    const [eventSubTab, setEventSubTab] = useState(0); // 0=Events, 1=Comments, 2=Likes, 3=Reposts
    const useInternalEvents = !eventsContent;
    const effectiveHasEvents = hasEvents || (useInternalEvents && internalEvents.length > 0);

    const safeTab = useMemo(() => {
        if (activeTab === 'posts') return 'posts';
        if (activeTab === 'events' && effectiveHasEvents) return 'events';
        if (activeTab === 'jobs' && hasJobs) return 'jobs';
        if (activeTab === 'services' && (hasServices || hasServiceRequests)) return 'services';
        return 'posts';
    }, [activeTab, effectiveHasEvents, hasJobs, hasServices, hasServiceRequests]);

    /* ── Posts sub-tab: 0=Posts, 1=Comments, 2=Likes, 3=Reposts ── */
    const [postsSubTab, setPostsSubTabLocal] = useState(initialPostsSubTab);
    const setPostsSubTab = useCallback((val) => {
        setPostsSubTabLocal(val);
        if (typeof onPostsSubTabChange === 'function') onPostsSubTabChange(val);
    }, [onPostsSubTabChange]);

    /* ── Engagement data (Comments / Likes / Reposts) ── */
    // Use the business handle to look up engagement — same endpoint as user profile
    const businessKey = business?.handle || business?.slug || business?.public_id || business?.id;
    const businessId = Number(business?.id || 0);

    const [engagementComments, setEngagementComments] = useState([]);
    const [engagementLikes, setEngagementLikes] = useState([]);
    const [engagementReposts, setEngagementReposts] = useState([]);
    const [engagementLoading, setEngagementLoading] = useState(false);
    const [engagementLoaded, setEngagementLoaded] = useState(false);

    // Fetch engagement data eagerly so counts appear on all sub-tabs immediately.
    // Uses the business-specific activity endpoints that query by business_id
    // on the shared engagement tables (post_comments, post_likes, post_reposts).
    useEffect(() => {
        if (engagementLoaded || !businessId) return;
        let alive = true;
        const ctrl = new AbortController();

        (async () => {
            setEngagementLoading(true);
            try {
                // Fetch all three in parallel
                const [commentsRes, likesRes, repostsRes] = await Promise.all([
                    fetchBusinessActivityComments(businessId, ctrl.signal).catch(() => ({ comments: [] })),
                    fetchBusinessActivityLikes(businessId, ctrl.signal).catch(() => ({ items: [] })),
                    fetchBusinessActivityReposts(businessId, ctrl.signal).catch(() => ({ items: [] })),
                ]);

                if (!alive) return;

                // Comments come grouped by post — flatten into individual items
                // shaped as { post: {...}, comment: {...} } for the existing renderer.
                const rawGroups = Array.isArray(commentsRes?.comments) ? commentsRes.comments : [];
                const flatComments = [];
                rawGroups.forEach((group) => {
                    const post = group?.post || {};
                    const cArr = Array.isArray(group?.comments) ? group.comments : [];
                    cArr.forEach((c) => {
                        flatComments.push({ post, comment: c });
                    });
                });
                setEngagementComments(flatComments);

                // Likes & Reposts — normalize into the post shape ProfilePostCard expects
                const mapN = (arr) =>
                    (Array.isArray(arr) ? arr : []).map(normalizePost).filter(Boolean);
                const normalizedLikes = mapN(likesRes?.items);
                const normalizedReposts = mapN(repostsRes?.items);

                setEngagementLikes(normalizedLikes);
                setEngagementReposts(normalizedReposts);

                setEngagementLoaded(true);

                // ── Hydrate fresh counts in the background (non-blocking) ──
                // Only hydrate community posts — business and artist posts already
                // return correct counts + viewerLiked/viewerReposted from the
                // activity endpoints, and they don't exist at /api/community/:id.
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
                                    // Build query string with active business account so the
                                    // backend returns the correct viewerLiked / viewerReposted
                                    // per-account (mirrors PostPage reloadPost pattern).
                                    const hydrateQp = new URLSearchParams();
                                    if (businessId) hydrateQp.set('activeBusinessId', businessId);
                                    const hydrateQs = hydrateQp.toString() ? `?${hydrateQp.toString()}` : '';
                                    const acctHeaders = (() => { try { return getAccountHeaders(); } catch { return {}; } })();

                                    await Promise.allSettled(
                                        batch.map((id) =>
                                            secureFetch(`/api/community/${encodeURIComponent(id)}${hydrateQs}`, {
                                                credentials: 'include',
                                                headers: { ...acctHeaders },
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

                                setEngagementLikes((prev) => mergeCounts(prev));
                                setEngagementReposts((prev) => mergeCounts(prev));
                            } catch { /* non-critical background hydration */ }
                        })();
                    }, 0);
                }
            } catch {
                if (alive) {
                    setEngagementLikes([]);
                    setEngagementReposts([]);
                    setEngagementComments([]);
                }
            } finally {
                if (alive) setEngagementLoading(false);
            }
        })();

        return () => { alive = false; ctrl.abort(); };
    }, [engagementLoaded, businessId]);

    /* ── Internal events fetch (fallback when eventsContent not provided) ── */
    useEffect(() => {
        if (!useInternalEvents || internalEventsFetched || !businessId) return;
        let alive = true;
        setInternalEventsLoading(true);
        (async () => {
            try {
                const data = await fetchEvents({ businessAccountId: businessId, limit: 50, page: 1, includeTotal: 1, range: 'all' });
                if (alive) {
                    setInternalEvents(Array.isArray(data?.items) ? data.items : []);
                    setInternalEventsFetched(true);
                }
            } catch { if (alive) { setInternalEvents([]); setInternalEventsFetched(true); } }
            finally { if (alive) setInternalEventsLoading(false); }
        })();
        return () => { alive = false; };
    }, [useInternalEvents, internalEventsFetched, businessId]);

    /* ── Internal event engagement (likes/reposts sub-tabs) ── */
    useEffect(() => {
        if (!useInternalEvents || !businessId || safeTab !== 'events' || (eventSubTab !== 2 && eventSubTab !== 3)) return;
        let alive = true;
        setInternalEventEngagementLoading(true);
        (async () => {
            try {
                const engType = eventSubTab === 2 ? 'like' : 'repost';
                const data = await fetchEvents({ sort: 'recent', range: 'custom', limit: 50, includeStatewide: 1, engagementBusinessId: businessId, engagementType: engType });
                if (alive) setInternalEventEngagement(Array.isArray(data?.items) ? data.items : []);
            } catch { if (alive) setInternalEventEngagement([]); }
            finally { if (alive) setInternalEventEngagementLoading(false); }
        })();
        return () => { alive = false; };
    }, [useInternalEvents, businessId, safeTab, eventSubTab]);

    /* ── Internal event comments sub-tab ── */
    useEffect(() => {
        if (!useInternalEvents || !businessId || safeTab !== 'events' || eventSubTab !== 1) return;
        let alive = true;
        setInternalEventCommentsLoading(true);
        (async () => {
            try {
                const res = await axios.get(`/api/events/business/${businessId}/event-comments`, { withCredentials: true });
                if (alive) setInternalEventComments(Array.isArray(res.data?.comments) ? res.data.comments : []);
            } catch { if (alive) setInternalEventComments([]); }
            finally { if (alive) setInternalEventCommentsLoading(false); }
        })();
        return () => { alive = false; };
    }, [useInternalEvents, businessId, safeTab, eventSubTab]);

    /* ── Filter engagement data: remove blocked/hidden users + apply search ── */
    const isBlockedUser = useCallback((userId) => {
        if (!blockedAndHiddenUserIds || blockedAndHiddenUserIds.size === 0) return false;
        const id = Number(userId);
        return Number.isFinite(id) && id > 0 && blockedAndHiddenUserIds.has(id);
    }, [blockedAndHiddenUserIds]);

    const isBlockedBizEntity = useCallback((bizId) => {
        if (!blockedBusinessIdsProp || blockedBusinessIdsProp.size === 0) return false;
        const id = Number(bizId);
        return Number.isFinite(id) && id > 0 && (blockedBusinessIdsProp.has(id) || blockedBusinessIdsProp.has(String(id)));
    }, [blockedBusinessIdsProp]);

    const isBlockedArtEntity = useCallback((artId) => {
        if (!blockedArtistIdsProp || blockedArtistIdsProp.size === 0) return false;
        const id = Number(artId);
        return Number.isFinite(id) && id > 0 && (blockedArtistIdsProp.has(id) || blockedArtistIdsProp.has(String(id)));
    }, [blockedArtistIdsProp]);

    /** Returns true if a post has visibility='followers' and the viewer doesn't follow the author */
    const isFollowersOnlyHidden = useCallback((post) => {
        if (!viewerFollowingIds || viewerFollowingIds.size === 0) return false;
        const vis = String(post?.visibility || '').toLowerCase().trim();
        if (vis !== 'followers' && vis !== 'private') return false;
        const authorId = Number(post?.user_id ?? post?.author_id ?? 0);
        if (!authorId) return false;
        // Allow if viewer is the author
        const vid = Number(viewer?.id || viewer?.user?.id || 0);
        if (vid && vid === authorId) return false;
        // Allow if viewer follows the author
        if (viewerFollowingIds.has(authorId)) return false;
        return true;
    }, [viewerFollowingIds, viewer]);

    /* ── Posts search state (declared early so matchesSearch can reference it) ── */
    const [localPostSearch, setLocalPostSearch] = useState('');
    const [localPostSearchTerm, setLocalPostSearchTerm] = useState('');

    const matchesSearch = useCallback((text) => {
        const q = (localPostSearch || searchQuery || '').trim().toLowerCase();
        if (!q) return true;
        return String(text || '').toLowerCase().includes(q);
    }, [searchQuery, localPostSearch]);

    /* ── Posts filter state (declared early so filtered engagement data can use them) ── */
    const [postFilterType, setPostFilterType] = useState('all');
    const [postSort, setPostSort] = useState('newest');
    const [postDateFrom, setPostDateFrom] = useState('');
    const [postDateTo, setPostDateTo] = useState('');

    const filteredComments = useMemo(() => {
        let items = engagementComments;
        if ((blockedAndHiddenUserIds && blockedAndHiddenUserIds.size > 0) || (blockedBusinessIdsProp && blockedBusinessIdsProp.size > 0) || (blockedArtistIdsProp && blockedArtistIdsProp.size > 0)) {
            items = items.filter((item) => {
                const post = item?.post || {};
                const postUserId = Number(post?.user_id ?? post?.userId ?? post?.author_id ?? 0);
                if (isBlockedUser(postUserId)) return false;
                const bizOwnerId = Number(post?.businessOwnerId ?? post?.business_owner_id ?? post?.owner_id ?? 0);
                if (isBlockedUser(bizOwnerId)) return false;
                const bizId = Number(post?.business_id ?? post?.businessId ?? post?.businessPageId ?? post?.business_page_id ?? 0);
                if (isBlockedBizEntity(bizId)) return false;
                const artId = Number(post?.artist_id ?? post?.artistId ?? 0);
                if (isBlockedArtEntity(artId)) return false;
                return true;
            });
        }
        // Followers-only post filtering
        items = items.filter((item) => !isFollowersOnlyHidden(item?.post || {}));
        const q = (localPostSearch || searchQuery || '').trim();
        if (q) {
            items = items.filter((item) => {
                const post = item?.post || {};
                const comment = item?.comment || item;
                return matchesSearch(post?.title) || matchesSearch(post?.body) || matchesSearch(comment?.content) || matchesSearch(comment?.body) || matchesSearch(comment?.text) || matchesSearch(post?.business_name) || matchesSearch(post?.artist_name) || matchesSearch(post?.post_author_name);
            });
        }
        // Date range
        if (postDateFrom) {
            const from = new Date(postDateFrom); from.setHours(0, 0, 0, 0);
            items = items.filter((item) => {
                const c = item?.comment || item;
                const d = new Date(c?.created_at || c?.createdAt || 0);
                return d >= from;
            });
        }
        if (postDateTo) {
            const to = new Date(postDateTo); to.setHours(23, 59, 59, 999);
            items = items.filter((item) => {
                const c = item?.comment || item;
                const d = new Date(c?.created_at || c?.createdAt || 0);
                return d <= to;
            });
        }
        // Sort
        if (postSort === 'popular') {
            items = [...items].sort((a, b) => {
                const post_a = a?.post || {};
                const post_b = b?.post || {};
                const la = Number(post_b?.likesCount || post_b?.likes_count || 0) - Number(post_a?.likesCount || post_a?.likes_count || 0);
                if (la !== 0) return la;
                return new Date(b?.comment?.created_at || b?.created_at || 0) - new Date(a?.comment?.created_at || a?.created_at || 0);
            });
        } else {
            items = [...items].sort((a, b) => new Date(b?.comment?.created_at || b?.created_at || 0) - new Date(a?.comment?.created_at || a?.created_at || 0));
        }
        return items;
    }, [engagementComments, blockedAndHiddenUserIds, isBlockedUser, isFollowersOnlyHidden, searchQuery, localPostSearch, matchesSearch, postSort, postDateFrom, postDateTo]);

    const filteredLikes = useMemo(() => {
        let items = engagementLikes;
        if ((blockedAndHiddenUserIds && blockedAndHiddenUserIds.size > 0) || (blockedBusinessIdsProp && blockedBusinessIdsProp.size > 0) || (blockedArtistIdsProp && blockedArtistIdsProp.size > 0)) {
            items = items.filter((post) => {
                const userId = Number(post?.user_id ?? post?.userId ?? post?.author_id ?? post?.owner_id ?? 0);
                if (isBlockedUser(userId)) return false;
                const bizOwnerId = Number(post?.businessOwnerId ?? post?.business_owner_id ?? post?.owner_id ?? 0);
                if (isBlockedUser(bizOwnerId)) return false;
                const bizId = Number(post?.business_id ?? post?.businessId ?? post?.businessPageId ?? post?.business_page_id ?? 0);
                if (isBlockedBizEntity(bizId)) return false;
                const artId = Number(post?.artist_id ?? post?.artistId ?? 0);
                if (isBlockedArtEntity(artId)) return false;
                return true;
            });
        }
        // Followers-only post filtering
        items = items.filter((post) => !isFollowersOnlyHidden(post));
        const q = (localPostSearch || searchQuery || '').trim();
        if (q) {
            items = items.filter((post) => {
                return matchesSearch(post?.title) || matchesSearch(post?.body) || matchesSearch(post?.content) || matchesSearch(post?.authorName) || matchesSearch(post?.author_name) || matchesSearch(post?.business_name) || matchesSearch(post?.artist_name);
            });
        }
        // Date range
        if (postDateFrom) {
            const from = new Date(postDateFrom); from.setHours(0, 0, 0, 0);
            items = items.filter((post) => { const d = new Date(post?.created_at || post?.date_created || post?.posted_at || 0); return d >= from; });
        }
        if (postDateTo) {
            const to = new Date(postDateTo); to.setHours(23, 59, 59, 999);
            items = items.filter((post) => { const d = new Date(post?.created_at || post?.date_created || post?.posted_at || 0); return d <= to; });
        }
        // Sort
        if (postSort === 'popular') {
            items = [...items].sort((a, b) => {
                const la = Number(b?.likesCount || b?.likes_count || 0) - Number(a?.likesCount || a?.likes_count || 0);
                if (la !== 0) return la;
                return new Date(b?.created_at || b?.date_created || 0) - new Date(a?.created_at || a?.date_created || 0);
            });
        } else {
            items = [...items].sort((a, b) => new Date(b?.created_at || b?.date_created || 0) - new Date(a?.created_at || a?.date_created || 0));
        }
        return items;
    }, [engagementLikes, blockedAndHiddenUserIds, isBlockedUser, isFollowersOnlyHidden, searchQuery, localPostSearch, matchesSearch, postSort, postDateFrom, postDateTo]);

    const filteredReposts = useMemo(() => {
        let items = engagementReposts;
        if ((blockedAndHiddenUserIds && blockedAndHiddenUserIds.size > 0) || (blockedBusinessIdsProp && blockedBusinessIdsProp.size > 0) || (blockedArtistIdsProp && blockedArtistIdsProp.size > 0)) {
            items = items.filter((post) => {
                const userId = Number(post?.user_id ?? post?.userId ?? post?.author_id ?? post?.owner_id ?? 0);
                if (isBlockedUser(userId)) return false;
                const bizOwnerId = Number(post?.businessOwnerId ?? post?.business_owner_id ?? post?.owner_id ?? 0);
                if (isBlockedUser(bizOwnerId)) return false;
                const bizId = Number(post?.business_id ?? post?.businessId ?? post?.businessPageId ?? post?.business_page_id ?? 0);
                if (isBlockedBizEntity(bizId)) return false;
                const artId = Number(post?.artist_id ?? post?.artistId ?? 0);
                if (isBlockedArtEntity(artId)) return false;
                return true;
            });
        }
        // Followers-only post filtering
        items = items.filter((post) => !isFollowersOnlyHidden(post));
        const q = (localPostSearch || searchQuery || '').trim();
        if (q) {
            items = items.filter((post) => {
                return matchesSearch(post?.title) || matchesSearch(post?.body) || matchesSearch(post?.content) || matchesSearch(post?.authorName) || matchesSearch(post?.author_name) || matchesSearch(post?.business_name) || matchesSearch(post?.artist_name);
            });
        }
        // Date range
        if (postDateFrom) {
            const from = new Date(postDateFrom); from.setHours(0, 0, 0, 0);
            items = items.filter((post) => { const d = new Date(post?.created_at || post?.date_created || post?.posted_at || 0); return d >= from; });
        }
        if (postDateTo) {
            const to = new Date(postDateTo); to.setHours(23, 59, 59, 999);
            items = items.filter((post) => { const d = new Date(post?.created_at || post?.date_created || post?.posted_at || 0); return d <= to; });
        }
        // Sort
        if (postSort === 'popular') {
            items = [...items].sort((a, b) => {
                const la = Number(b?.likesCount || b?.likes_count || 0) - Number(a?.likesCount || a?.likes_count || 0);
                if (la !== 0) return la;
                return new Date(b?.created_at || b?.date_created || 0) - new Date(a?.created_at || a?.date_created || 0);
            });
        } else {
            items = [...items].sort((a, b) => new Date(b?.created_at || b?.date_created || 0) - new Date(a?.created_at || a?.date_created || 0));
        }
        return items;
    }, [engagementReposts, blockedAndHiddenUserIds, isBlockedUser, isFollowersOnlyHidden, searchQuery, localPostSearch, matchesSearch, postSort, postDateFrom, postDateTo]);

    /* ── Posts filter state (matching ProfileEngagementTabs pattern) ── */
    const POST_TYPE_FILTERS = [
        { value: 'all', label: 'All Types' },
        { value: 'update', label: 'Updates' },
        { value: 'deal', label: 'Deals' },
        { value: 'announcement', label: 'Announcements' },
    ];

    const POSTS_SORT_OPTIONS = [
        { value: 'newest', label: 'Newest' },
        { value: 'popular', label: 'Most Popular' },
    ];

    const POSTS_PAGE_SIZE = 50;
    const [displayedPostsCount, setDisplayedPostsCount] = useState(POSTS_PAGE_SIZE);
    const postsSentinelRef = useRef(null);

    // Reset pagination when filters change
    useEffect(() => { setDisplayedPostsCount(POSTS_PAGE_SIZE); }, [postFilterType, postSort, postDateFrom, postDateTo, searchQuery, localPostSearch]);

    // IntersectionObserver for infinite scroll on posts
    useEffect(() => {
        const el = postsSentinelRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) setDisplayedPostsCount((p) => p + POSTS_PAGE_SIZE);
        }, { rootMargin: '200px' });
        obs.observe(el);
        return () => obs.disconnect();
    }, [safeTab, postsSubTab]);

    const filteredAndSortedPosts = useMemo(() => {
        let list = Array.isArray(postsProp) ? [...postsProp] : [];

        // Filter by type
        if (postFilterType && postFilterType !== 'all') {
            list = list.filter((p) => {
                const t = String(p?.post_type || p?.postType || p?.type || '').trim().toLowerCase();
                return t === postFilterType;
            });
        }

        // Search (parent search + local search)
        const combinedSearch = (localPostSearch || searchQuery || '').trim().toLowerCase();
        if (combinedSearch) {
            list = list.filter((p) => {
                const title = String(p?.title || '').toLowerCase();
                const body = String(p?.body || p?.content || '').toLowerCase();
                const type = String(p?.post_type || '').toLowerCase();
                return title.includes(combinedSearch) || body.includes(combinedSearch) || type.includes(combinedSearch);
            });
        }

        // Date range
        if (postDateFrom) {
            const from = new Date(postDateFrom);
            from.setHours(0, 0, 0, 0);
            list = list.filter((p) => {
                const d = new Date(p?.created_at || p?.date_created || p?.posted_at || 0);
                return d >= from;
            });
        }
        if (postDateTo) {
            const to = new Date(postDateTo);
            to.setHours(23, 59, 59, 999);
            list = list.filter((p) => {
                const d = new Date(p?.created_at || p?.date_created || p?.posted_at || 0);
                return d <= to;
            });
        }

        // Sort (matches profile: popular sorts by likes, then by date as tiebreaker; newest is default)
        if (postSort === 'popular') {
            list.sort((a, b) => {
                const la = Number(b?.likesCount || b?.likes_count || 0) - Number(a?.likesCount || a?.likes_count || 0);
                if (la !== 0) return la;
                return new Date(b?.created_at || b?.date_created || 0) - new Date(a?.created_at || a?.date_created || 0);
            });
        } else {
            // newest (default)
            list.sort((a, b) => new Date(b?.created_at || b?.date_created || 0) - new Date(a?.created_at || a?.date_created || 0));
        }

        return list;
    }, [postsProp, postFilterType, postSort, postDateFrom, postDateTo, searchQuery, localPostSearch]);

    const displayedPosts = useMemo(() => filteredAndSortedPosts.slice(0, displayedPostsCount), [filteredAndSortedPosts, displayedPostsCount]);
    const hasMorePosts = displayedPostsCount < filteredAndSortedPosts.length;
    const postsCount = filteredAndSortedPosts.length;

    // Build category counts for the filter dropdown
    const postTypeCounts = useMemo(() => {
        const counts = {};
        (Array.isArray(postsProp) ? postsProp : []).forEach((p) => {
            const t = String(p?.post_type || p?.postType || p?.type || 'update').trim().toLowerCase();
            counts[t] = (counts[t] || 0) + 1;
        });
        return counts;
    }, [postsProp]);

    /* ── Jobs data ── */
    const [jobs, setJobs] = useState([]);
    const [jobsLoading, setJobsLoading] = useState(false);
    const [jobsFetched, setJobsFetched] = useState(false);
    const [jobsSort, setJobsSort] = useState('newest');
    const [jobsCategory, setJobsCategory] = useState('');
    const [localJobSearch, setLocalJobSearch] = useState('');
    const [localJobSearchTerm, setLocalJobSearchTerm] = useState('');

    // Fetch jobs eagerly so count shows on main tab
    useEffect(() => {
        if (jobsFromParent !== undefined) {
            const raw = Array.isArray(jobsFromParent) ? jobsFromParent : [];
            const enriched = isOwnBusiness
                ? raw.map((item) => ({ ...item, isOwner: true }))
                : raw;
            setJobs(enriched);
            setJobsFetched(true);
            return;
        }
        if (jobsFetched || !business?.id) return;
        let alive = true;
        const ctrl = new AbortController();
        (async () => {
            setJobsLoading(true);
            try {
                const acctHeaders = (() => { try { return getAccountHeaders(); } catch { return {}; } })();
                const res = await axios.get('/api/jobs/feed', {
                    params: { posterBusinessId: business.id, limit: 200 },
                    signal: ctrl.signal,
                    withCredentials: true,
                    headers: { ...acctHeaders },
                });
                if (!alive) return;
                const items = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
                // When viewing own business profile, mark all jobs as owned
                // so the 3-dot menu shows Edit/Delete/Renew
                const enriched = isOwnBusiness
                    ? items.map((item) => ({ ...item, isOwner: true }))
                    : items;
                setJobs(enriched);
                setJobsFetched(true);
            } catch {
                if (alive) setJobs([]);
            } finally {
                if (alive) setJobsLoading(false);
            }
        })();
        return () => { alive = false; ctrl.abort(); };
    }, [jobsFetched, business?.id, jobsFromParent]);

    const filteredJobs = useMemo(() => {
        let list = [...jobs];
        if (localJobSearch?.trim()) {
            const q = localJobSearch.trim().toLowerCase();
            list = list.filter((j) => {
                const title = String(j?.title || '').toLowerCase();
                const desc = String(j?.description || j?.body || '').toLowerCase();
                const cat = String(j?.category || j?.job_category || '').toLowerCase();
                const company = String(j?.company_name || j?.businessName || '').toLowerCase();
                return title.includes(q) || desc.includes(q) || cat.includes(q) || company.includes(q);
            });
        }
        if (jobsCategory) {
            list = list.filter((j) => {
                const cat = String(j?.category || j?.job_category || '').trim().toLowerCase();
                return cat === jobsCategory.toLowerCase();
            });
        }
        if (jobsSort === 'newest') {
            list.sort((a, b) => new Date(b?.created_at || b?.date_created || 0) - new Date(a?.created_at || a?.date_created || 0));
        } else if (jobsSort === 'expiring') {
            list.sort((a, b) => {
                const rawA = a?.expires_at || a?.expiresAt || a?.expiry_date || a?.expiryDate || null;
                const rawB = b?.expires_at || b?.expiresAt || b?.expiry_date || b?.expiryDate || null;
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

    /* ── Services data ── */
    const [services, setServices] = useState([]);
    const [servicesLoading, setServicesLoading] = useState(false);
    const [servicesFetched, setServicesFetched] = useState(false);
    const [servicesCategory, setServicesCategory] = useState('');
    const [localServiceSearch, setLocalServiceSearch] = useState('');
    const [localServiceSearchTerm, setLocalServiceSearchTerm] = useState('');

    // Fetch services eagerly so count shows on main tab
    useEffect(() => {
        if (servicesFromParent !== undefined) {
            setServices(Array.isArray(servicesFromParent) ? servicesFromParent : []);
            setServicesFetched(true);
            return;
        }
        if (servicesFetched || !business?.id) return;
        let alive = true;
        const ctrl = new AbortController();
        (async () => {
            setServicesLoading(true);
            try {
                const acctHeaders = (() => { try { return getAccountHeaders(); } catch { return {}; } })();
                const res = await axios.get('/api/services/feed', {
                    params: { posterBusinessId: business.id, limit: 200 },
                    signal: ctrl.signal,
                    withCredentials: true,
                    headers: { ...acctHeaders },
                });
                if (!alive) return;
                const items = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
                setServices(items);
                setServicesFetched(true);
            } catch {
                if (alive) setServices([]);
            } finally {
                if (alive) setServicesLoading(false);
            }
        })();
        return () => { alive = false; ctrl.abort(); };
    }, [servicesFetched, business?.id, servicesFromParent]);

    /* ── Services sub-tab: 'services' | 'requests' ── */
    const [servicesSubTab, setServicesSubTab] = useState('services');
    const [servicesView, setServicesView] = useState('offered'); // 'offered' | 'favorites'
    const [favServices, setFavServices] = useState([]);
    const [favLoading, setFavLoading] = useState(false);

    // Fetch favorite services for the business owner
    useEffect(() => {
        const ownerUserId = Number(business?.user_id || business?.userId || business?.owner_user_id || business?.ownerUserId || 0);
        if (!ownerUserId || !businessId) return;
        let alive = true;
        const ctrl = new AbortController();
        (async () => {
            setFavLoading(true);
            try {
                const acctHeaders = (() => { try { return getAccountHeaders(); } catch { return {}; } })();
                const res = await axios.get(`/api/services/user/${ownerUserId}/favorites`, {
                    signal: ctrl.signal, withCredentials: true, headers: { ...acctHeaders },
                });
                if (!alive) return;
                const items = Array.isArray(res.data?.items) ? res.data.items : [];
                setFavServices(items);
            } catch { if (alive) setFavServices([]); }
            finally { if (alive) setFavLoading(false); }
        })();
        return () => { alive = false; ctrl.abort(); };
    }, [businessId, business?.user_id, business?.userId, business?.owner_user_id, business?.ownerUserId]);

    const servicesSource = servicesView === 'favorites' ? favServices : services;
    const servicesSourceLoading = servicesView === 'favorites' ? favLoading : (servicesLoadingProp || servicesLoading);

    const filteredServices = useMemo(() => {
        let list = [...servicesSource];
        if (localServiceSearch?.trim()) {
            const q = localServiceSearch.trim().toLowerCase();
            list = list.filter((s) => {
                const title = String(s?.title || s?.name || '').toLowerCase();
                const desc = String(s?.description || s?.body || '').toLowerCase();
                const cat = String(s?.categoryName || s?.category_name || s?.categorySlug || '').toLowerCase();
                const provider = String(s?.providerName || s?.provider_name || '').toLowerCase();
                return title.includes(q) || desc.includes(q) || cat.includes(q) || provider.includes(q);
            });
        }
        if (servicesCategory) {
            list = list.filter((s) => {
                const slug = String(s?.categorySlug || s?.category_slug || '').trim().toLowerCase();
                return slug === servicesCategory.toLowerCase();
            });
        }
        return list;
    }, [servicesSource, servicesCategory, localServiceSearch]);

    // Fetch service requests eagerly so count shows on main tab
    useEffect(() => {
        if (serviceRequestsFetched || !businessId) return;
        let alive = true;
        const ctrl = new AbortController();

        (async () => {
            setServiceRequestsLoading(true);
            try {
                const data = await fetchServiceRequestsByUser({
                    businessId,
                    signal: ctrl.signal,
                });
                if (!alive) return;
                const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
                // When viewing own business profile, mark all requests as owned
                // so the 3-dot menu shows Edit/Delete
                const enriched = isOwnBusiness
                    ? items.map((item) => ({ ...item, isRequester: true }))
                    : items;
                setServiceRequests(enriched);
                setServiceRequestsFetched(true);
            } catch {
                if (alive) setServiceRequests([]);
            } finally {
                if (alive) setServiceRequestsLoading(false);
            }
        })();

        return () => { alive = false; ctrl.abort(); };
    }, [serviceRequestsFetched, businessId, isOwnBusiness]);

    // Reset fetched flag when nonce changes (e.g. after delete/edit) to force refetch
    useEffect(() => {
        if (serviceRequestsNonce > 0) {
            setServiceRequestsFetched(false);
        }
    }, [serviceRequestsNonce]);

    // Reset jobs fetched flag when nonce changes to force refetch
    useEffect(() => {
        if (jobsNonce > 0) {
            setJobsFetched(false);
        }
    }, [jobsNonce]);

    /* ── Pagination ── */
    const [jobsPage, setJobsPage] = useState(PAGE_SIZE);
    const [servicesPage, setServicesPage] = useState(PAGE_SIZE);
    const jobsSentinelRef = useRef(null);
    const servicesSentinelRef = useRef(null);

    useEffect(() => { setJobsPage(PAGE_SIZE); }, [jobsSort, jobsCategory, localJobSearch]);
    useEffect(() => { setServicesPage(PAGE_SIZE); }, [servicesCategory, localServiceSearch, servicesView]);

    useEffect(() => {
        const el = jobsSentinelRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setJobsPage((p) => p + PAGE_SIZE); }, { rootMargin: '200px' });
        obs.observe(el);
        return () => obs.disconnect();
    }, [safeTab]);

    useEffect(() => {
        const el = servicesSentinelRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setServicesPage((p) => p + PAGE_SIZE); }, { rootMargin: '200px' });
        obs.observe(el);
        return () => obs.disconnect();
    }, [safeTab]);

    const visibleJobs = useMemo(() => filteredJobs.slice(0, jobsPage), [filteredJobs, jobsPage]);
    const visibleServices = useMemo(() => filteredServices.slice(0, servicesPage), [filteredServices, servicesPage]);

    /* ── Helpers ── */
    const cardRef = useRef(null);
    const avatarSrc = business?.avatar_url || business?.logo || '';
    const bizName = business?.name || 'Business';

    const handleOpenPost = useCallback((post) => {
        if (!post?.id) return;

        // If the parent provided an onPostClick handler, open in popup instead of navigating
        if (typeof onPostClick === 'function') {
            onPostClick(post);
            return;
        }

        const cat = String(post?.category || '').toLowerCase().trim();
        const bizSlug = businessSlugProp || business?.slug || business?.handle || '';
        const bizName = business?.name || '';

        // Let the parent save scroll + tab state (preferred — parent knows its own activeTab)
        if (typeof onBeforeNavigate === 'function') {
            onBeforeNavigate();
        } else {
            // Fallback: save scroll state ourselves
            try {
                sessionStorage.setItem('ll:businessScrollRestore', JSON.stringify({
                    slug: bizSlug,
                    tab: typeof parentActiveTab === 'number' ? parentActiveTab : 0,
                    postsSubTab,
                    scrollY: window.scrollY || 0,
                    ts: Date.now(),
                }));
            } catch { /* ignore */ }
        }

        // Navigation state so the post page can show "Back to {business name}'s profile"
        const fromState = {
            fromBusiness: true,
            backBusinessName: bizName,
            backBusinessSlug: bizSlug,
            backBusinessId: business?.id,
        };

        if (cat === 'business_post') {
            const postSlug = post?.bp_business_slug || post?.business_slug || post?.handle || bizSlug;
            if (postSlug) navigate(`/${postSlug}/posts/${post.id}`, { state: fromState });
            return;
        }

        if (cat === 'artist_post') {
            const artistSlug = post?.artist_slug || post?.artist_handle || post?.handle;
            if (artistSlug) {
                navigate(`/${artistSlug}/posts/${post.id}`, { state: fromState });
            } else {
                navigate(`/posts/${post.id}`, { state: fromState });
            }
            return;
        }

        // Community post or any other category
        navigate(`/posts/${post.id}`, { state: fromState });
    }, [business, navigate, postsSubTab, onBeforeNavigate, parentActiveTab, businessSlugProp, onPostClick]);

    const handleJobClick = useCallback((job) => {
        if (onJobClick) { onJobClick(job); return; }
        if (job?.id) navigate(`/jobs/${job.id}`);
    }, [onJobClick, navigate]);

    const handleServiceClick = useCallback((svc) => {
        if (onServiceClick) { onServiceClick(svc); return; }
        if (svc?.id) navigate(`/services/${svc.id}`);
    }, [onServiceClick, navigate]);

    /* ── UserCardPopover state (same pattern as PostList) ── */
    const [userAnchor, setUserAnchor] = useState(null);
    const [userForCard, setUserForCard] = useState(null);

    const [serverFollowingSet, setServerFollowingSet] = useState(() => new Set());
    const [locallyFollowed, setLocallyFollowed] = useState(() => new Set());

    const hydrateTargetFromPublic = useCallback(async (target) => {
        if (!target) return null;
        const handleOrId = target.handle || target.id;
        if (!handleOrId) return null;
        const urls = [
            `${api}/users/public/${encodeURIComponent(handleOrId)}`,
            `/users/public/${encodeURIComponent(handleOrId)}`,
            `/api/users/public/${encodeURIComponent(handleOrId)}`,
        ].filter(Boolean);
        for (const u of urls) {
            try {
                const res = await axios.get(u, { withCredentials: true });
                const profile = res?.data?.profile;
                if (!profile) continue;
                setUserForCard((prev) => {
                    if (!prev) return prev;
                    if (!prev.id && profile.id) return { ...prev, id: profile.id };
                    return prev;
                });
                const sj = typeof profile.social_json === 'string'
                    ? JSON.parse(profile.social_json || '{}')
                    : (profile.social_json || {});
                const followers = Array.isArray(sj?.followers) ? sj.followers : [];
                const isF = !!viewer?.id && followers.includes(Number(viewer.id));
                if (profile.id && isF) {
                    setServerFollowingSet((old) => { const next = new Set(old); next.add(Number(profile.id)); return next; });
                }
                return profile;
            } catch { /* try next */ }
        }
        return null;
    }, [viewer?.id]);

    const handleOpenUserCard = useCallback((el, author) => {
        setUserAnchor(el);
        setUserForCard({
            ...author,
            id: Number(author?.user_id) || Number(author?.author_id) || Number(author?.id) || undefined,
            first_name: author?.first_name,
            last_name: author?.last_name,
            handle: author?.handle || author?.username,
            avatar_url: author?.avatar_url || author?.profile_picture,
        });
        hydrateTargetFromPublic(author);
    }, [hydrateTargetFromPublic]);

    /** Check whether a post was authored by the business whose profile we're on */
    const isThisBusinessPost = useCallback(
        (p) => {
            if (!p || !businessId) return false;
            const postBizId = Number(p?.business_id ?? p?.businessId ?? p?.businessPageId ?? p?.business_page_id ?? 0);
            if (postBizId && postBizId === businessId) return true;
            // Also check slug/handle match
            const bizSlug = String(business?.slug || business?.handle || '').toLowerCase().trim();
            const postSlug = String(p?.business_slug ?? p?.businessSlug ?? p?.business_handle ?? '').toLowerCase().trim();
            if (bizSlug && postSlug && bizSlug === postSlug) return true;
            return false;
        },
        [businessId, business?.slug, business?.handle]
    );

    /** Return handleOpenUserCard only if the post is NOT by this business */
    const userCardHandlerForPost = useCallback(
        (post) => isThisBusinessPost(post) ? undefined : handleOpenUserCard,
        [isThisBusinessPost, handleOpenUserCard]
    );

    const isSelf = useMemo(() => {
        if (!viewer || !userForCard) return false;
        const idMatch = Number(viewer.id) === Number(userForCard.id);
        const handleMatch = (viewer.handle && userForCard.handle) &&
            String(viewer.handle).toLowerCase() === String(userForCard.handle).toLowerCase();
        return idMatch || !!handleMatch;
    }, [viewer, userForCard]);

    const isFollowingForCard = useMemo(() => {
        const tid = Number(userForCard?.id);
        if (!tid) return false;
        return serverFollowingSet.has(tid) || locallyFollowed.has(tid);
    }, [userForCard, serverFollowingSet, locallyFollowed]);

    const handleFollow = useCallback(async (targetUser) => {
        const tid0 = Number(targetUser?.id || userForCard?.id);
        const handle0 = targetUser?.handle || userForCard?.handle;
        if (!tid0 && !handle0) return;
        if (isSelf) return;
        let tid = tid0;
        if (!tid && handle0) {
            const p = await hydrateTargetFromPublic({ handle: handle0 });
            if (p?.id) tid = Number(p.id);
        }
        if (!tid) return;
        setLocallyFollowed((prev) => { const next = new Set(prev); next.add(tid); return next; });
        const urls = [`${api}/users/follow`, '/api/users/follow', '/users/follow'].filter(Boolean);
        let ok = false;
        for (const url of urls) {
            try { await axios.post(url, { target_id: tid, action: 'follow' }, { withCredentials: true }); ok = true; break; } catch { /* try next */ }
        }
        if (ok) {
            setServerFollowingSet((prev) => { const next = new Set(prev); next.add(tid); return next; });
        } else {
            setLocallyFollowed((prev) => { const next = new Set(prev); next.delete(tid); return next; });
        }
    }, [userForCard, isSelf, hydrateTargetFromPublic]);

    /* ════════════════════════════════════════════
       Render
       ════════════════════════════════════════════ */
    return (
        <Paper ref={cardRef} sx={(t) => ({ overflow: mobileFullscreen ? 'visible' : 'hidden', backgroundImage: 'none', borderRadius: mobileFullscreen ? 0 : 3, border: 'none', boxShadow: mobileFullscreen ? 'none' : `0 2px 8px ${alpha(t.palette.primary.main, 0.06)}`, ...(mobileFullscreen ? { bgcolor: 'background.paper', backgroundImage: 'none', minHeight: '100%' } : {}) })}>
            {/* ── Sticky header: pill tabs + sub-tabs + filters ── */}
            <Box
                ref={stickyHeaderRef}
                sx={{
                    ...(stickyTabs ? { position: 'sticky', top: 0, zIndex: 12, borderRadius: 0 } : {}),
                    bgcolor: 'background.paper',
                    boxShadow: isHeaderSticky ? 2 : 0,
                    transition: (t) => `box-shadow ${t.custom?.motion?.slow || 300}ms ease, transform 200ms ease`,
                    ...(mobileFullscreen && isMobileEng ? {
                        transform: headerHidden ? 'translateY(-100%)' : 'translateY(0)',
                    } : {}),
                }}
            >
                {/* ── MOBILE FULLSCREEN: two-row navigation ── */}
                {mobileFullscreen && isMobileEng ? (
                    <>
                        {/* Activity bar injected from parent (back arrow + title + profile) */}
                        {activityBarContent}
                        {/* Row 1: Content type pills — Posts / Events / Jobs / Services (circular pill style, icon above label) */}
                        <Box sx={{
                            borderBottom: '1px solid', borderColor: 'divider',
                            bgcolor: 'background.paper',
                        }}>
                            <Stack direction="row" spacing={0} alignItems="stretch" justifyContent="center" sx={{ px: 0.5, py: 0.5 }}>
                                {[
                                    { key: 'posts', label: 'Posts', icon: <ForumIcon />, show: true },
                                    { key: 'events', label: 'Events', icon: <EventIcon />, show: effectiveHasEvents },
                                    { key: 'jobs', label: 'Jobs', icon: <WorkRoundedIcon />, show: hasJobs },
                                    { key: 'services', label: 'Services', icon: <BuildRoundedIcon />, show: hasServices || hasServiceRequests },
                                ].filter((t) => t.show).map((tabDef) => {
                                    const isActive = safeTab === tabDef.key;
                                    return (
                                        <Box
                                            key={tabDef.key}
                                            onClick={() => { setActiveTab(tabDef.key); if (tabDef.key === 'posts') setPostsSubTab(0); }}
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
                                            {React.cloneElement(tabDef.icon, { sx: { fontSize: 18, opacity: isActive ? 1 : 0.72 } })}
                                            <Typography sx={{ fontSize: '0.6rem', fontWeight: isActive ? 900 : 700, lineHeight: 1, mt: 0.25, whiteSpace: 'nowrap' }}>
                                                {tabDef.label}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Box>

                        {/* Row 2: Posts sub-tabs (icon-only) — only when Posts is active */}
                        {safeTab === 'posts' && (
                            <Box sx={{
                                borderBottom: '1px solid', borderColor: 'divider',
                                bgcolor: 'background.paper',
                            }}>
                                <Stack direction="row" spacing={0} alignItems="center" justifyContent="center" sx={{ px: 1 }}>
                                    {[
                                        { count: filteredAndSortedPosts.length, icon: <ForumIcon />, idx: 0, tip: 'Posts' },
                                        { count: filteredComments.length, icon: <ChatBubbleOutlineIcon />, idx: 1, tip: 'Comments' },
                                        { count: filteredLikes.length, icon: <FavoriteIcon />, idx: 2, tip: 'Likes' },
                                        { count: filteredReposts.length, icon: <RepeatIcon />, idx: 3, tip: 'Reposts' },
                                    ].map((sub) => {
                                        const isActive = postsSubTab === sub.idx;
                                        return (
                                            <Box
                                                key={sub.idx}
                                                onClick={() => setPostsSubTab(sub.idx)}
                                                sx={(t) => ({
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.4,
                                                    flex: 1, py: 1, cursor: 'pointer',
                                                    borderBottom: '2px solid',
                                                    borderColor: isActive ? t.palette.secondary.main : 'transparent',
                                                    color: isActive ? 'secondary.main' : 'text.disabled',
                                                    transition: `color 150ms ease, border-color 150ms ease`,
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
                                    {/* Search + Filter */}
                                    <Box
                                        onClick={() => setMobileSearchVisible((v) => !v)}
                                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1, py: 1, cursor: 'pointer', color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}
                                    >
                                        <SearchRoundedIcon sx={{ fontSize: 18 }} />
                                    </Box>
                                    <Box
                                        onClick={() => setMobileFilterOpen((v) => !v)}
                                        sx={(t) => ({
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1, py: 1, cursor: 'pointer',
                                            color: (mobileFilterOpen || postFilterType !== 'all' || postSort !== 'newest' || postDateFrom || postDateTo) ? 'primary.main' : 'text.disabled',
                                            '&:hover': { color: 'text.secondary' },
                                        })}
                                    >
                                        <TuneRoundedIcon sx={{ fontSize: 18 }} />
                                    </Box>
                                </Stack>
                            </Box>
                        )}
                        {/* ── JOBS: mobile search + filter row ── */}
                        {safeTab === 'jobs' && (
                            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                                <Stack direction="row" spacing={0} alignItems="center" justifyContent="center" sx={{ px: 1 }}>
                                    <Box sx={{ flex: 1 }} />
                                    <Box
                                        onClick={() => setMobileJobsSearchVisible((v) => !v)}
                                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1, py: 1, cursor: 'pointer', color: mobileJobsSearchVisible ? 'primary.main' : 'text.disabled', '&:hover': { color: 'text.secondary' } }}
                                    >
                                        <SearchRoundedIcon sx={{ fontSize: 18 }} />
                                    </Box>
                                    <Box
                                        onClick={() => setMobileJobsFilterOpen((v) => !v)}
                                        sx={(t) => ({
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1, py: 1, cursor: 'pointer',
                                            color: (mobileJobsFilterOpen || jobsSort !== 'newest' || jobsCategory) ? 'primary.main' : 'text.disabled',
                                            '&:hover': { color: 'text.secondary' },
                                        })}
                                    >
                                        <TuneRoundedIcon sx={{ fontSize: 18 }} />
                                    </Box>
                                </Stack>
                            </Box>
                        )}



                        {/* ── Collapsible search bars per tab ── */}
                        <Collapse in={mobileSearchVisible && safeTab === 'posts'}>
                            <Box sx={{ px: 1.5, py: 1, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                                <SearchInput
                                    placeholder="Search posts…"
                                    value={localPostSearchTerm}
                                    onChange={(e) => setLocalPostSearchTerm(e?.target?.value ?? '')}
                                    onSearch={() => setLocalPostSearch(localPostSearchTerm)}
                                    onClear={() => { setLocalPostSearchTerm(''); setLocalPostSearch(''); }}
                                    inputProps={{ name: 'll-biz-posts-search' }}
                                    autoFocus
                                />
                            </Box>
                        </Collapse>
                        <Collapse in={mobileJobsSearchVisible && safeTab === 'jobs'}>
                            <Box sx={{ px: 1.5, py: 1, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                                <SearchInput
                                    placeholder="Search jobs…"
                                    value={localJobSearchTerm}
                                    onChange={(e) => setLocalJobSearchTerm(e?.target?.value ?? '')}
                                    onSearch={() => setLocalJobSearch(localJobSearchTerm)}
                                    onClear={() => { setLocalJobSearchTerm(''); setLocalJobSearch(''); }}
                                    inputProps={{ name: 'll-biz-jobs-search' }}
                                    autoFocus
                                />
                            </Box>
                        </Collapse>


                        {/* ══════ MOBILE INLINE FILTER COLLAPSES (matching ArtistProfilePage pattern) ══════ */}

                        {/* Posts inline filter collapse */}
                        <Collapse in={mobileFilterOpen && safeTab === 'posts'}>
                            <Box sx={{ px: 1.5, py: 1.5, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: postsSubTab === 0 ? '1fr 1fr' : '1fr 1fr', gap: 1, mb: 1 }}>
                                    {postsSubTab === 0 && (
                                        <FormControl size="small" fullWidth sx={PROFILE_CONTROL_SX}>
                                            <InputLabel shrink>Type</InputLabel>
                                            <Select label="Type" value={postFilterType} onChange={(e) => setPostFilterType(e.target.value)} displayEmpty
                                                    renderValue={(v) => { const opt = POST_TYPE_ICON_OPTIONS.find((o) => o.value === v) || POST_TYPE_ICON_OPTIONS[0]; return <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><opt.Icon sx={{ fontSize: 18, color: 'primary.main' }} />{opt.label}</Box>; }}
                                                    MenuProps={profileMenuProps}>
                                                {POST_TYPE_ICON_OPTIONS.filter((opt) => opt.value === 'all' || (postTypeCounts[opt.value] || 0) > 0).map((opt) => (
                                                    <MenuItem key={opt.value} value={opt.value}><ProfileCategoryRow Icon={opt.Icon} label={opt.label} /></MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
                                    <FormControl size="small" fullWidth sx={PROFILE_CONTROL_SX}>
                                        <InputLabel shrink>Sort by</InputLabel>
                                        <Select label="Sort by" value={postSort} onChange={(e) => setPostSort(e.target.value)} MenuProps={profileMenuProps}>
                                            {POSTS_SORT_OPTIONS.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Box>
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
                                    <TextField size="small" label="From" type="date" value={postDateFrom} onChange={(e) => setPostDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth sx={{ ...PROFILE_CONTROL_SX, '& .MuiInputBase-input': { fontSize: 13 } }} />
                                    <TextField size="small" label="To" type="date" value={postDateTo} onChange={(e) => setPostDateTo(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth sx={{ ...PROFILE_CONTROL_SX, '& .MuiInputBase-input': { fontSize: 13 } }} />
                                </Box>
                                {(postFilterType !== 'all' || postSort !== 'newest' || postDateFrom || postDateTo) && (
                                    <Button size="small" onClick={() => { setPostFilterType('all'); setPostSort('newest'); setPostDateFrom(''); setPostDateTo(''); }} startIcon={<ClearRoundedIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: 'none', fontWeight: 700, fontSize: 12, color: 'text.secondary' }}>
                                        Clear filters
                                    </Button>
                                )}
                            </Box>
                        </Collapse>

                        {/* Jobs inline filter collapse */}
                        <Collapse in={mobileJobsFilterOpen && safeTab === 'jobs'}>
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
                                        <Select
                                            label="Category"
                                            value={jobsCategory}
                                            onChange={(e) => setJobsCategory(e.target.value)}
                                            displayEmpty
                                            renderValue={(v) => {
                                                if (!v) return 'All Categories';
                                                const label = jobCategoryLabel(v);
                                                const Icon = JOB_CATEGORY_ICONS[v] || CategoryRoundedIcon;
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
                                                jobs.forEach((j) => {
                                                    const c = String(j?.category || j?.job_category || '').trim().toLowerCase();
                                                    if (c) countMap[c] = (countMap[c] || 0) + 1;
                                                });
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
                                {(jobsSort !== 'newest' || jobsCategory) && (
                                    <Button size="small" onClick={() => { setJobsSort('newest'); setJobsCategory(''); }} startIcon={<ClearRoundedIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: 'none', fontWeight: 700, fontSize: 12, color: 'text.secondary' }}>
                                        Clear filters
                                    </Button>
                                )}
                            </Box>
                        </Collapse>


                    </>
                ) : (
                    <>
                        {/* ── DESKTOP: Original two-level tab structure (unchanged) ── */}
                        <Box sx={{
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            borderRadius: stickyTabs ? 0 : '12px 12px 0 0',
                            overflowX: 'auto',
                            overflowY: 'hidden',
                            WebkitOverflowScrolling: 'touch',
                            scrollbarWidth: 'none',
                            '&::-webkit-scrollbar': { display: 'none' },
                        }}>
                            <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                                sx={{ px: { xs: 1.25, sm: 2 }, py: { xs: 0.75, sm: 1 }, width: 'fit-content', minWidth: '100%' }}
                            >
                                {[
                                    { key: 'posts', label: 'Posts', icon: <ForumIcon />, show: true },
                                    { key: 'events', label: 'Events', icon: <EventIcon />, show: effectiveHasEvents },
                                    { key: 'jobs', label: 'Jobs', icon: <WorkRoundedIcon />, show: hasJobs },
                                    { key: 'services', label: 'Services', icon: <BuildRoundedIcon />, show: hasServices || hasServiceRequests },
                                ].filter((t) => t.show).map((tabDef) => {
                                    const active = safeTab === tabDef.key;
                                    return (
                                        <Button
                                            key={tabDef.key}
                                            role="tab"
                                            aria-selected={active}
                                            onClick={() => { setActiveTab(tabDef.key); scrollToContentTop(); }}
                                            variant="text"
                                            disableElevation
                                            startIcon={React.cloneElement(tabDef.icon, {
                                                sx: (t) => pillIconSx(t, active),
                                            })}
                                            sx={(t) => pillChipSx(t, active)}
                                        >
                                            {tabDef.label}
                                        </Button>
                                    );
                                })}
                                <Box sx={{ flex: 1 }} />
                                {isHeaderSticky && (
                                    <Tooltip title="Return to top">
                                        <IconButton size="small" onClick={scrollToContentTop} sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}>
                                            <KeyboardArrowUpIcon />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Stack>
                        </Box>

                        {/* Posts sub-tabs — inside sticky header */}
                        {safeTab === 'posts' && (
                            <Box sx={(t) => ({
                                flexShrink: 0,
                                borderBottom: '1px solid',
                                borderColor: alpha(t.palette.primary.main, 0.08),
                                bgcolor: 'background.paper',
                            })}>
                                <Tabs value={postsSubTab} onChange={(_, v) => setPostsSubTab(v)} variant="fullWidth" sx={subTabsSx}>
                                    <Tab icon={<ForumIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Posts${filteredAndSortedPosts.length > 0 ? ` (${filteredAndSortedPosts.length})` : ''}`} />
                                    <Tab icon={<ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Comments${filteredComments.length > 0 ? ` (${filteredComments.length})` : ''}`} />
                                    <Tab icon={<FavoriteIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Likes${filteredLikes.length > 0 ? ` (${filteredLikes.length})` : ''}`} />
                                    <Tab icon={<RepeatIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Reposts${filteredReposts.length > 0 ? ` (${filteredReposts.length})` : ''}`} />
                                </Tabs>
                            </Box>
                        )}
                    </>
                )}
            </Box>
            {/* ── END sticky header ── */}

            {/* Content area — minHeight prevents layout shift when switching tabs */}
            <Box sx={{ ...(mobileFullscreen ? { minHeight: 'calc(100vh - 160px)' } : {}) }}>

                {/* ═══════════ POSTS TAB ═══════════ */}
                {safeTab === 'posts' && (
                    <>
                        {/* Search bar — visible on desktop; hidden on mobile fullscreen (moved to header) */}
                        {!(mobileFullscreen && isMobileEng) && (
                            <Box sx={{ px: 1.5, pt: 1.25, pb: 0.5, bgcolor: 'background.paper', zIndex: 7 }}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.75 }}>
                                    <SearchInput
                                        placeholder={postsSubTab === 0 ? 'Search posts…' : postsSubTab === 1 ? 'Search comments…' : postsSubTab === 2 ? 'Search likes…' : 'Search reposts…'}
                                        value={localPostSearchTerm}
                                        onChange={(e) => setLocalPostSearchTerm(e?.target?.value ?? '')}
                                        onSearch={() => setLocalPostSearch(localPostSearchTerm)}
                                        onClear={() => { setLocalPostSearchTerm(''); setLocalPostSearch(''); }}
                                        inputProps={{ name: 'll-biz-posts-search' }}
                                    />
                                    <Tooltip title="Clear all filters" arrow>
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                setLocalPostSearchTerm(''); setLocalPostSearch('');
                                                setPostFilterType('all'); setPostSort('newest');
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
                                    {postsSubTab === 0 && canCreatePosts && onCreatePost && (
                                        <Button
                                            variant="contained"
                                            size="small"
                                            startIcon={<AddIcon />}
                                            onClick={onCreatePost}
                                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999, flexShrink: 0, whiteSpace: 'nowrap' }}
                                        >
                                            New Post
                                        </Button>
                                    )}
                                </Stack>

                                {/* Filter dropdowns — Sort + dates on all sub-tabs, Type only on Posts */}
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: postsSubTab === 0 ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr' }, gap: 1, pb: 0.75 }}>
                                    {postsSubTab === 0 && (
                                        <FormControl size="small" fullWidth sx={PROFILE_CONTROL_SX}>
                                            <InputLabel shrink>Type</InputLabel>
                                            <Select
                                                label="Type"
                                                value={postFilterType}
                                                onChange={(e) => setPostFilterType(e.target.value)}
                                                displayEmpty
                                                renderValue={(v) => {
                                                    const opt = POST_TYPE_ICON_OPTIONS.find((o) => o.value === v) || POST_TYPE_ICON_OPTIONS[0];
                                                    return (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                            <opt.Icon sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                                                            {opt.label}
                                                        </Box>
                                                    );
                                                }}
                                                MenuProps={profileMenuProps}
                                            >
                                                {POST_TYPE_ICON_OPTIONS
                                                    .filter((opt) => opt.value === 'all' || (postTypeCounts[opt.value] || 0) > 0)
                                                    .map((opt) => {
                                                        const count = postTypeCounts[opt.value] || 0;
                                                        return (
                                                            <MenuItem key={opt.value} value={opt.value}>
                                                                <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                                    <ProfileCategoryRow Icon={opt.Icon} label={opt.label} />
                                                                    {opt.value !== 'all' && count > 0 && (
                                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                                                            {count}
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            </MenuItem>
                                                        );
                                                    })}
                                            </Select>
                                        </FormControl>
                                    )}

                                    <FormControl size="small" fullWidth sx={PROFILE_CONTROL_SX}>
                                        <InputLabel shrink>Sort by</InputLabel>
                                        <Select
                                            label="Sort by"
                                            value={postSort}
                                            onChange={(e) => setPostSort(e.target.value)}
                                            MenuProps={profileMenuProps}
                                        >
                                            {POSTS_SORT_OPTIONS.map((opt) => (
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
                        )}

                        {postsSubTab === 0 && (
                            <>
                                <Box>
                                    {postsLoading ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                            <CircularProgress size={28} />
                                        </Box>
                                    ) : displayedPosts.length === 0 ? (
                                        <EngagementEmpty
                                            icon={<ForumIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />}
                                            title={postFilterType !== 'all' || searchQuery ? 'No posts match your filters' : 'No posts yet'}
                                            subtitle={
                                                postFilterType !== 'all' || searchQuery
                                                    ? 'Try adjusting your filters or search.'
                                                    : isOwnBusiness
                                                        ? 'Share updates, deals, and announcements with your followers.'
                                                        : `${bizName} hasn't posted any updates yet.`
                                            }
                                        />
                                    ) : (
                                        <>
                                            <style>{`
                                            [data-biz-flat-posts] [data-business-post-id],
                                            [data-biz-flat-posts] [data-business-post-id][class],
                                            [data-biz-flat-posts] .MuiCard-root[data-business-post-id],
                                            [data-biz-flat-posts] .MuiPaper-root[data-business-post-id],
                                            [data-biz-flat-posts] .MuiCard-root.MuiCard-root[data-business-post-id],
                                            [data-biz-flat-posts] .MuiPaper-root.MuiPaper-root[data-business-post-id] {
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
                                            [data-biz-flat-posts] [data-business-post-id]:hover,
                                            [data-biz-flat-posts] [data-business-post-id][class]:hover,
                                            [data-biz-flat-posts] .MuiCard-root[data-business-post-id]:hover,
                                            [data-biz-flat-posts] .MuiPaper-root[data-business-post-id]:hover {
                                                box-shadow: none !important;
                                                transform: none !important;
                                                background-color: transparent !important;
                                                background: transparent !important;
                                            }
                                            [data-biz-flat-posts] [data-business-post-id]::before,
                                            [data-biz-flat-posts] [data-business-post-id]::after {
                                                display: none !important;
                                            }
                                            [data-biz-flat-posts] [data-business-post-id] > .MuiCardActions-root {
                                                padding: 0 !important;
                                                border: none !important;
                                            }
                                            /* Zero out internal padding on Business cards to match flat style */
                                            [data-biz-flat-posts] [data-business-post-id] > .MuiBox-root {
                                                padding-left: 0 !important;
                                                padding-right: 0 !important;
                                                padding-top: 0 !important;
                                            }
                                            [data-biz-flat-posts] [data-business-post-id] > .MuiCardActions-root {
                                                padding-left: 0 !important;
                                                padding-right: 0 !important;
                                                padding-bottom: 0 !important;
                                                border-top: none !important;
                                                margin-top: 0 !important;
                                            }
                                            /* Hide built-in small square thumbnails so the full-width photo grid renders instead */
                                            [data-biz-flat-posts] [data-business-post-id] img[loading="lazy"][alt=""] {
                                                display: none !important;
                                            }
                                            [data-biz-flat-posts] [data-business-post-id] .MuiBox-root:has(> .MuiBox-root > img[loading="lazy"][alt=""]) {
                                                display: none !important;
                                            }
                                        `}</style>
                                            <Box data-biz-flat-posts="1" sx={{
                                                display: 'flex', flexDirection: 'column', gap: 0,
                                            }}>
                                                {displayedPosts.map((post) => {
                                                    const urls = extractMediaUrls(post);
                                                    const photoGrid = urls.length > 0 ? <BizPostPhotoGrid mediaUrls={urls} /> : null;
                                                    return (
                                                        <Box
                                                            key={post.id}
                                                            onClick={(e) => {
                                                                if (e.target?.closest?.('.MuiIconButton-root, [role="menuitem"], [role="button"], .MuiMenuItem-root, a[href], .MuiChip-root, .MuiMenu-root, .MuiDialog-root, [data-interactive="true"]')) return;
                                                                handleOpenPost(post);
                                                            }}
                                                            sx={{
                                                                borderBottom: '2px solid',
                                                                borderColor: (t) => alpha(t.palette.text.primary, 0.10),
                                                                '&:last-child': { borderBottom: 'none' },
                                                                bgcolor: 'transparent',
                                                                py: 2.5,
                                                                px: { xs: 2, sm: 3 },
                                                                cursor: 'pointer',
                                                                transition: (t) => `background-color ${t.custom?.motion?.base || 180}ms ease`,
                                                                overflow: 'hidden',
                                                                '&:hover': {
                                                                    bgcolor: (t) => alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.07 : 0.03),
                                                                },
                                                            }}
                                                        >
                                                            <BusinessPostCard
                                                                post={post}
                                                                canPin={canPinPosts}
                                                                canEdit={canEditPosts}
                                                                onPin={onPinPost}
                                                                onUnpin={onUnpinPost}
                                                                onEdit={onEditPost}
                                                                onDelete={onDeletePost}
                                                                onReport={onReportPost}
                                                                businessSlug={businessSlugProp || business?.slug || business?.handle || ''}
                                                                navigate={navigate}
                                                                business={business}
                                                                user={viewer}
                                                                onShare={onSharePost}
                                                                onBeforeNavigate={onBeforeNavigate}
                                                                onPostClick={onPostClick}
                                                                flat={isMobileEng}
                                                                renderBeforeActions={photoGrid}
                                                                onSelect={(p) => {
                                                                    if (typeof onPostClick === 'function') { onPostClick(p); return; }
                                                                    handleOpenPost(p);
                                                                }}
                                                            />
                                                        </Box>
                                                    );
                                                })}
                                                <Box ref={postsSentinelRef} sx={{ height: 1 }} />
                                            </Box>
                                        </>
                                    )}
                                </Box>

                            </>
                        )}

                        {postsSubTab === 1 && (
                            <EngagementList loading={engagementLoading} items={filteredComments} emptyIcon={<ChatBubbleOutlineIcon />} emptyTitle="No comments yet" emptySubtitle={`${bizName} hasn't commented on any posts yet.`} footerLabel="comment">
                                {(() => {
                                    // Group comments by post (matching user profile pattern)
                                    const groupMap = new Map();
                                    const groupOrder = [];
                                    filteredComments.forEach((item) => {
                                        const post = item?.post || {};
                                        const comment = item?.comment || item;
                                        const pid = Number(post?.id || comment?.post_id || 0);
                                        if (!pid) return;
                                        if (!groupMap.has(pid)) {
                                            groupMap.set(pid, { post, comments: [], postType: item?.postType || 'community' });
                                            groupOrder.push(pid);
                                        }
                                        groupMap.get(pid).comments.push(comment);
                                    });

                                    // Sort groups based on current sort selection
                                    if (postSort === 'popular') {
                                        // Sort by most comments the business made on each post
                                        groupOrder.sort((a, b) => {
                                            const ca = groupMap.get(a)?.comments || [];
                                            const cb = groupMap.get(b)?.comments || [];
                                            const countDiff = cb.length - ca.length;
                                            if (countDiff !== 0) return countDiff;
                                            // Tiebreaker: most recent comment
                                            return new Date(cb[0]?.created_at || 0) - new Date(ca[0]?.created_at || 0);
                                        });
                                    } else {
                                        // newest — sort by most recent comment in each group
                                        groupOrder.sort((a, b) => {
                                            const ca = groupMap.get(a)?.comments || [];
                                            const cb = groupMap.get(b)?.comments || [];
                                            const latestA = Math.max(...ca.map((c) => new Date(c?.created_at || c?.createdAt || 0).getTime()));
                                            const latestB = Math.max(...cb.map((c) => new Date(c?.created_at || c?.createdAt || 0).getTime()));
                                            return latestB - latestA;
                                        });
                                    }

                                    const truncate = (t, n) => {
                                        const s = String(t || '').trim();
                                        return s.length > n ? `${s.slice(0, n)}…` : s;
                                    };

                                    return (
                                        <Box sx={{ display: 'grid', gap: { xs: 1.25, sm: 2 }, p: { xs: 1.25, sm: 2 } }}>
                                            {groupOrder.map((pid) => {
                                                const g = groupMap.get(pid);
                                                const post0 = g.post;
                                                const cmts = g.comments;
                                                const total = cmts.length;
                                                const latest = cmts[0] || null;
                                                const postTitle = truncate(post0?.title || post0?.body || 'Post', 80);
                                                const postHandleRaw = String(post0?.handle || post0?.business_slug || post0?.businessSlug || post0?.artist_handle || post0?.artistHandle || '').trim();
                                                const postHandle = postHandleRaw ? `@${postHandleRaw.replace(/^@/, '')}` : '';

                                                // Post author info — resolve per post-type
                                                const postAuthorPostType = (() => {
                                                    const pType = String(g.postType || '').toLowerCase();
                                                    const cat = String(post0?.category || '').toLowerCase();
                                                    if (pType === 'business' || cat === 'business_post' || cat === 'business') return 'business';
                                                    if (pType === 'artist' || cat === 'artist_post' || cat === 'artist') return 'artist';
                                                    return 'user';
                                                })();
                                                const postAuthorName = (() => {
                                                    if (postAuthorPostType === 'business') return post0?.businessName || post0?.business_name || [post0?.first_name, post0?.last_name].filter(Boolean).join(' ') || '';
                                                    if (postAuthorPostType === 'artist') return post0?.artistName || post0?.artist_name || [post0?.first_name, post0?.last_name].filter(Boolean).join(' ') || '';
                                                    return [post0?.first_name, post0?.last_name].filter(Boolean).join(' ') || '';
                                                })().trim() || (postHandle ? postHandle : 'Someone');
                                                const postAuthorAvatarRaw = (() => {
                                                    if (postAuthorPostType === 'business') return post0?.businessAvatarUrl || post0?.business_avatar_url || post0?.avatar_url || post0?.profile_picture || '';
                                                    if (postAuthorPostType === 'artist') return post0?.artistAvatarUrl || post0?.artist_avatar_url || post0?.artistAvatar || post0?.avatar_url || post0?.profile_picture || '';
                                                    return post0?.avatar_url || post0?.profile_picture || '';
                                                })();
                                                const hasRealAvatar = Boolean(postAuthorAvatarRaw && !postAuthorAvatarRaw.includes('default_avatar') && !postAuthorAvatarRaw.includes('default_business') && !postAuthorAvatarRaw.includes('default_logo') && !postAuthorAvatarRaw.includes('placeholder'));
                                                const postAuthorAvatar = hasRealAvatar ? postAuthorAvatarRaw : '';
                                                const postAuthorVerified = Boolean(post0?.is_verified);

                                                // Only show the post author's @handle if it differs from the business
                                                const bizHandleNorm = String(business?.slug || business?.handle || '').replace(/^@+/, '').toLowerCase().trim();
                                                const postHandleNorm = String(postHandleRaw || '').replace(/^@+/, '').toLowerCase().trim();
                                                const showPostHandle = !!(postHandleNorm && postHandleNorm !== bizHandleNorm);

                                                return (
                                                    <Box
                                                        key={`comment-group-${pid}`}
                                                        role="button"
                                                        tabIndex={0}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                e.preventDefault();
                                                                if (typeof onCommentClick === 'function') {
                                                                    onCommentClick(post0, null);
                                                                } else {
                                                                    handleOpenPost(post0);
                                                                }
                                                            }
                                                        }}
                                                        onClick={() => {
                                                            if (typeof onCommentClick === 'function') {
                                                                onCommentClick(post0, null);
                                                            } else {
                                                                handleOpenPost(post0);
                                                            }
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
                                                                px: { xs: 1.25, sm: 1.5 },
                                                                py: { xs: 0.75, sm: 1 },
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                gap: { xs: 0.75, sm: 1 },
                                                                background: `linear-gradient(90deg, ${alpha(
                                                                    t.custom?.brand?.brass || '#A87822',
                                                                    0.14
                                                                )} 0%, ${alpha(t.palette.background.paper, 0)} 75%)`,
                                                                borderBottom: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                                                            })}
                                                        >
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1.25 }, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                                                <AccountAvatar
                                                                    src={postAuthorAvatar}
                                                                    alt={postAuthorName}
                                                                    accountType={postAuthorPostType}
                                                                    size={isMobileEng ? 32 : 38}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (isThisBusinessPost(post0)) return;
                                                                        handleOpenUserCard(e.currentTarget, {
                                                                            handle: postHandleRaw,
                                                                            first_name: postAuthorName,
                                                                            avatar_url: postAuthorAvatar,
                                                                            id: post0?.user_id || post0?.userId || post0?.author_id,
                                                                        });
                                                                    }}
                                                                    sx={(t) => ({
                                                                        cursor: isThisBusinessPost(post0) ? 'default' : 'pointer',
                                                                        border: '2px solid',
                                                                        borderColor: alpha(t.palette.text.primary, 0.06),
                                                                        transition: `border-color 150ms ease`,
                                                                        ...(!isThisBusinessPost(post0) && {
                                                                            '&:hover': { borderColor: t.palette.primary.main },
                                                                        }),
                                                                    })}
                                                                />
                                                                <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                                                    <Typography
                                                                        sx={{ fontWeight: 900, fontSize: { xs: '0.85rem', sm: '1rem' }, lineHeight: 1.2 }}
                                                                        noWrap
                                                                        title={String(post0?.title || '')}
                                                                    >
                                                                        {postTitle}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', lineHeight: 1.3, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                                                        {postAuthorName}
                                                                        {postAuthorVerified && <VerifiedRoundedIcon sx={{ fontSize: 13, color: 'primary.main', ml: 0.3, verticalAlign: 'middle' }} />}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'flex', alignItems: 'center', gap: 0.3, fontSize: { xs: '0.65rem', sm: '0.72rem' } }}>
                                                                        {showPostHandle ? postHandle : ''}
                                                                        {latest?.created_at ? `${showPostHandle ? ' • ' : ''}${formatTimeAgo(latest.created_at)}` : ''}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>

                                                            {/* Comment count chip */}
                                                            <Box
                                                                role="button"
                                                                tabIndex={0}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (typeof onCommentClick === 'function') {
                                                                        onCommentClick(post0, null);
                                                                    } else {
                                                                        handleOpenPost(post0);
                                                                    }
                                                                }}
                                                                sx={(t) => ({
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: 0.4,
                                                                    px: { xs: 0.75, sm: 1.1 },
                                                                    py: { xs: 0.3, sm: 0.4 },
                                                                    borderRadius: 999,
                                                                    flexShrink: 0,
                                                                    border: `1px solid ${alpha(t.palette.primary.main, 0.16)}`,
                                                                    bgcolor: alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.12 : 0.06),
                                                                    cursor: 'pointer',
                                                                    transition: 'all 150ms ease',
                                                                    '&:hover': {
                                                                        bgcolor: alpha(t.custom?.brand?.brass || '#A87822', 0.14),
                                                                        borderColor: alpha(t.custom?.brand?.brass || '#A87822', 0.35),
                                                                    },
                                                                    '&:hover .MuiTypography-root': {
                                                                        color: t.custom?.brand?.brass || '#A87822',
                                                                    },
                                                                })}
                                                            >
                                                                <ChatBubbleOutlineIcon sx={{ fontSize: { xs: 11, sm: 13 }, color: 'primary.main' }} />
                                                                <Typography variant="caption" sx={{ fontWeight: 900, fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: 'primary.main', transition: 'color 150ms ease', whiteSpace: 'nowrap' }}>
                                                                    {total === 1 ? '1 comment' : `${total} comments`}
                                                                </Typography>
                                                            </Box>
                                                        </Box>

                                                        {/* Individual comment rows */}
                                                        <Box sx={{ px: { xs: 1, sm: 1.5 }, py: { xs: 0.75, sm: 1.25 }, display: 'grid', gap: { xs: 0.75, sm: 1 } }}>
                                                            {cmts.slice(0, 3).map((c, ci) => {
                                                                const cText = String(c?.content || c?.body || c?.text || '').trim();
                                                                const isReply = Boolean(c?.parent_id || c?.parentId);
                                                                const cTime = c?.created_at || c?.createdAt || '';
                                                                // Use the actual commenter's avatar/name/handle from the API
                                                                const cAvatar = c?.account_avatar_url || c?.user_avatar || c?.avatar_url || c?.profile_picture || c?.profileImageUrl || avatarSrc;
                                                                const cName = c?.account_name || c?.user_name || c?.commenter_name || c?.author_name || c?.name || (c?.first_name ? `${c.first_name}${c.last_name ? ` ${c.last_name}` : ''}`.trim() : '') || bizName;
                                                                const cHandle = c?.account_handle || c?.user_handle || c?.handle || business?.slug || business?.handle || '';
                                                                const cCommentId = Number(c?.comment_id || c?.id || 0) || null;

                                                                return (
                                                                    <Box
                                                                        key={c?.id || c?.comment_id || ci}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (typeof onCommentClick === 'function') {
                                                                                onCommentClick(post0, cCommentId);
                                                                            } else {
                                                                                handleOpenPost(post0);
                                                                            }
                                                                        }}
                                                                        role="button"
                                                                        tabIndex={0}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                if (typeof onCommentClick === 'function') {
                                                                                    onCommentClick(post0, cCommentId);
                                                                                } else {
                                                                                    handleOpenPost(post0);
                                                                                }
                                                                            }
                                                                        }}
                                                                        sx={(t) => ({
                                                                            border: '1px solid',
                                                                            borderColor: alpha(t.palette.text.primary, 0.08),
                                                                            borderRadius: 2,
                                                                            px: { xs: 1, sm: 1.25 },
                                                                            py: { xs: 0.75, sm: 1 },
                                                                            bgcolor: alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.06 : 0.02),
                                                                            cursor: 'pointer',
                                                                            '&:hover': { borderColor: alpha(t.palette.primary.main, 0.32) },
                                                                        })}
                                                                    >
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: { xs: 0.5, sm: 1 } }}>
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 }, minWidth: 0 }}>
                                                                                <AccountAvatar
                                                                                    src={cAvatar}
                                                                                    alt={cName}
                                                                                    accountType="business"
                                                                                    size={isMobileEng ? 28 : 34}
                                                                                />
                                                                                <Box sx={{ minWidth: 0 }}>
                                                                                    <Typography
                                                                                        variant="body2"
                                                                                        sx={{ fontWeight: 900, lineHeight: 1.1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                                                                                        noWrap
                                                                                        title={cName}
                                                                                    >
                                                                                        {cName}
                                                                                    </Typography>
                                                                                    <Typography variant="caption" color="text.secondary" noWrap>
                                                                                        {cHandle ? `@${cHandle.replace(/^@/, '')}` : ''}
                                                                                        {isReply ? ' • Reply' : ''}
                                                                                    </Typography>
                                                                                </Box>
                                                                            </Box>
                                                                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                                                                {cTime ? formatTimeAgo(cTime) : ''}
                                                                            </Typography>
                                                                        </Box>
                                                                        <Typography
                                                                            variant="body2"
                                                                            sx={{
                                                                                fontWeight: 800,
                                                                                color: 'text.primary',
                                                                                mt: 0.5,
                                                                                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                                                                whiteSpace: 'pre-wrap',
                                                                                overflowWrap: 'anywhere',
                                                                            }}
                                                                        >
                                                                            {truncate(cText, 260)}
                                                                        </Typography>
                                                                        {/* Comment photos */}
                                                                        {(() => {
                                                                            const cImg = c?.image || (Array.isArray(c?.images) && c.images.length > 0 ? c.images[0] : null);
                                                                            if (!cImg) return null;
                                                                            return (
                                                                                <Box
                                                                                    component="img"
                                                                                    src={cImg}
                                                                                    alt="comment image"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        if (typeof onCommentClick === 'function') {
                                                                                            onCommentClick(post0, cCommentId);
                                                                                        } else {
                                                                                            handleOpenPost(post0);
                                                                                        }
                                                                                    }}
                                                                                    sx={{
                                                                                        mt: 0.75,
                                                                                        width: 56,
                                                                                        height: 56,
                                                                                        objectFit: 'cover',
                                                                                        borderRadius: 1.5,
                                                                                        border: '1px solid',
                                                                                        borderColor: (t) => alpha(t.palette.text.primary, 0.10),
                                                                                        display: 'block',
                                                                                        flexShrink: 0,
                                                                                        cursor: 'pointer',
                                                                                        transition: 'opacity 150ms ease',
                                                                                        '&:hover': { opacity: 0.85 },
                                                                                    }}
                                                                                />
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
                                })()}
                            </EngagementList>
                        )}

                        {postsSubTab === 2 && (
                            <EngagementList loading={engagementLoading} items={filteredLikes} emptyIcon={<FavoriteIcon />} emptyTitle="No liked posts" emptySubtitle={`${bizName} hasn't liked any posts yet.`} footerLabel="liked post">
                                {filteredLikes.map((post) => {
                                    const pType = String(post?.postType || '').toLowerCase();
                                    const urls = extractMediaUrls(post);
                                    const cardKey = `${post.category || 'post'}-${post.id}`;
                                    const wrapSx = { py: 2.5, px: { xs: 2, sm: 3 }, cursor: 'pointer', transition: (t) => `background-color ${t.custom?.motion?.base || 180}ms ease`, overflow: 'hidden', '&:hover': { bgcolor: (t) => alpha(t.palette.text.primary, 0.03) } };
                                    const photoGrid = urls.length > 0 ? <BizPostPhotoGrid mediaUrls={urls} /> : null;
                                    const cardUserHandler = userCardHandlerForPost(post);
                                    const ownBiz = isThisBusinessPost(post);

                                    if (pType === 'business') {
                                        return (
                                            <Box key={cardKey} data-profile-post-id={String(post?.id || '')} {...(ownBiz && { 'data-own-biz-post': '1' })} onClick={(e) => { if (e.target?.closest?.('.MuiIconButton-root, [role="menuitem"], [role="button"], .MuiMenuItem-root, a[href], .MuiChip-root')) return; handleOpenPost(post); }} sx={wrapSx}>
                                                <BusinessPostCard post={post} user={viewer} hoveredId={null} setHoveredId={() => {}} onCardClick={handleOpenPost} onOpenUserCard={cardUserHandler} renderBeforeActions={photoGrid} flat={isMobileEng} />
                                            </Box>
                                        );
                                    }
                                    if (pType === 'artist') {
                                        return (
                                            <Box key={cardKey} data-profile-post-id={String(post?.id || '')} {...(ownBiz && { 'data-own-biz-post': '1' })} onClick={(e) => { if (e.target?.closest?.('.MuiIconButton-root, [role="menuitem"], [role="button"], .MuiMenuItem-root, a[href], .MuiChip-root')) return; handleOpenPost(post); }} sx={wrapSx}>
                                                <MusicPostCardItem post={post} user={viewer} hoveredId={null} setHoveredId={() => {}} onCardClick={handleOpenPost} onOpenUserCard={cardUserHandler} renderBeforeActions={photoGrid} />
                                            </Box>
                                        );
                                    }
                                    return (
                                        <Box key={cardKey} data-profile-post-id={String(post?.id || '')} {...(ownBiz && { 'data-own-biz-post': '1' })} onClick={(e) => { if (e.target?.closest?.('.MuiIconButton-root, [role="menuitem"], [role="button"], .MuiMenuItem-root, a[href], .MuiChip-root')) return; handleOpenPost(post); }} sx={wrapSx}>
                                            <ProfilePostCard post={post} user={viewer} onCardClick={() => handleOpenPost(post)} onOpenUserCard={cardUserHandler} previewLineClamp={4} disableHover renderBeforeActions={photoGrid} />
                                        </Box>
                                    );
                                })}
                            </EngagementList>
                        )}

                        {postsSubTab === 3 && (
                            <EngagementList loading={engagementLoading} items={filteredReposts} emptyIcon={<RepeatIcon />} emptyTitle="No reposts" emptySubtitle={`${bizName} hasn't reposted anything yet.`} footerLabel="repost">
                                {filteredReposts.map((post) => {
                                    const pType = String(post?.postType || '').toLowerCase();
                                    const urls = extractMediaUrls(post);
                                    const cardKey = `${post.category || 'post'}-${post.id}`;
                                    const wrapSx = { py: 2.5, px: { xs: 2, sm: 3 }, cursor: 'pointer', transition: (t) => `background-color ${t.custom?.motion?.base || 180}ms ease`, overflow: 'hidden', '&:hover': { bgcolor: (t) => alpha(t.palette.text.primary, 0.03) } };
                                    const photoGrid = urls.length > 0 ? <BizPostPhotoGrid mediaUrls={urls} /> : null;
                                    const cardUserHandler = userCardHandlerForPost(post);
                                    const ownBiz = isThisBusinessPost(post);

                                    if (pType === 'business') {
                                        return (
                                            <Box key={cardKey} data-profile-post-id={String(post?.id || '')} {...(ownBiz && { 'data-own-biz-post': '1' })} onClick={(e) => { if (e.target?.closest?.('.MuiIconButton-root, [role="menuitem"], [role="button"], .MuiMenuItem-root, a[href], .MuiChip-root')) return; handleOpenPost(post); }} sx={wrapSx}>
                                                <BusinessPostCard post={post} user={viewer} hoveredId={null} setHoveredId={() => {}} onCardClick={handleOpenPost} onOpenUserCard={cardUserHandler} renderBeforeActions={photoGrid} flat={isMobileEng} />
                                            </Box>
                                        );
                                    }
                                    if (pType === 'artist') {
                                        return (
                                            <Box key={cardKey} data-profile-post-id={String(post?.id || '')} {...(ownBiz && { 'data-own-biz-post': '1' })} onClick={(e) => { if (e.target?.closest?.('.MuiIconButton-root, [role="menuitem"], [role="button"], .MuiMenuItem-root, a[href], .MuiChip-root')) return; handleOpenPost(post); }} sx={wrapSx}>
                                                <MusicPostCardItem post={post} user={viewer} hoveredId={null} setHoveredId={() => {}} onCardClick={handleOpenPost} onOpenUserCard={cardUserHandler} renderBeforeActions={photoGrid} />
                                            </Box>
                                        );
                                    }
                                    return (
                                        <Box key={cardKey} data-profile-post-id={String(post?.id || '')} {...(ownBiz && { 'data-own-biz-post': '1' })} onClick={(e) => { if (e.target?.closest?.('.MuiIconButton-root, [role="menuitem"], [role="button"], .MuiMenuItem-root, a[href], .MuiChip-root')) return; handleOpenPost(post); }} sx={wrapSx}>
                                            <ProfilePostCard post={post} user={viewer} onCardClick={() => handleOpenPost(post)} onOpenUserCard={cardUserHandler} previewLineClamp={4} disableHover renderBeforeActions={photoGrid} />
                                        </Box>
                                    );
                                })}
                            </EngagementList>
                        )}
                    </>
                )}

                {/* ═══════════ EVENTS TAB ═══════════ */}
                {/* Events content — always mounted so counts load eagerly; hidden when not active */}
                {eventsContent ? (
                    <Box sx={{ display: safeTab === 'events' ? 'block' : 'none' }}>{eventsContent}</Box>
                ) : safeTab === 'events' && (
                    <Box>
                        {/* Event sub-tabs: Events | Comments | Likes | Reposts */}
                        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                            <Stack direction="row" spacing={0} alignItems="center" justifyContent="center" sx={{ px: 1 }}>
                                {[
                                    { idx: 0, icon: <EventIcon sx={{ fontSize: 18 }} />, count: internalEvents.length },
                                    { idx: 1, icon: <ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />, count: internalEventComments.length },
                                    { idx: 2, icon: <FavoriteIcon sx={{ fontSize: 18 }} />, count: internalEventEngagement.length },
                                    { idx: 3, icon: <RepeatIcon sx={{ fontSize: 18 }} />, count: 0 },
                                ].map((sub) => {
                                    const isActive = eventSubTab === sub.idx;
                                    return (
                                        <Box key={sub.idx} onClick={() => setEventSubTab(sub.idx)} sx={(t) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.4, flex: 1, py: 1, cursor: 'pointer', borderBottom: '2px solid', borderColor: isActive ? t.palette.secondary.main : 'transparent', color: isActive ? 'secondary.main' : 'text.disabled', transition: 'color 150ms ease, border-color 150ms ease', '&:hover': { color: isActive ? 'secondary.main' : 'text.secondary' } })}>
                                            {sub.icon}
                                            {sub.count > 0 && <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, lineHeight: 1 }}>{sub.count}</Typography>}
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Box>

                        {/* Event tab content */}
                        {eventSubTab === 0 && (
                            internalEventsLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
                            ) : internalEvents.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', '& > *': { borderBottom: '1px solid', borderColor: (t) => alpha(t.palette.text.primary, 0.08), '&:last-child': { borderBottom: 'none' } } }}>
                                    {internalEvents.map((evt) => {
                                        const evtTitle = evt.title || evt.name || 'Untitled Event';
                                        const evtDate = typeof formatEventDateTimeCT === 'function' ? formatEventDateTimeCT(evt) : '';
                                        const evtLocation = typeof formatEventLocation === 'function' ? formatEventLocation(evt) : '';
                                        const evtCategory = typeof getEventCategoryLabel === 'function' ? getEventCategoryLabel(evt) : '';
                                        const evtPhoto = evt?.mainPhotoUrl || evt?.coverPhoto || evt?.image_url || '';
                                        return (
                                            <Box key={evt.id} sx={{ py: 1.5, px: 1.5, cursor: 'pointer', '&:hover': { bgcolor: (t) => alpha(t.palette.text.primary, 0.025) } }}>
                                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                                    <Box sx={(t) => ({ width: 72, height: 72, borderRadius: 2, flexShrink: 0, overflow: 'hidden', bgcolor: alpha(t.palette.primary.main, 0.06), border: '1px solid', borderColor: alpha(t.palette.primary.main, 0.10), display: 'flex', alignItems: 'center', justifyContent: 'center' })}>
                                                        {evtPhoto ? <Box component="img" src={evtPhoto} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} /> : <CalendarTodayRoundedIcon sx={{ fontSize: 28, color: 'primary.main' }} />}
                                                    </Box>
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{evtTitle}</Typography>
                                                        {evtDate && <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.25, fontWeight: 600 }}>{evtDate}</Typography>}
                                                        {evtLocation && <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 0.15 }}>{evtLocation}</Typography>}
                                                        {evtCategory && <Chip label={evtCategory} size="small" sx={(t) => ({ mt: 0.5, height: 20, fontWeight: 700, fontSize: '0.65rem', bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main, border: '1px solid', borderColor: alpha(t.palette.primary.main, 0.16) })} />}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            ) : (
                                <Box sx={{ py: 8, textAlign: 'center' }}>
                                    <EventIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                    <Typography variant="body2" color="text.secondary">No events yet</Typography>
                                </Box>
                            )
                        )}
                        {eventSubTab === 1 && (
                            internalEventCommentsLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
                            ) : internalEventComments.length > 0 ? (
                                <Box sx={{ p: { xs: 1.25, sm: 1.5 }, display: 'flex', flexDirection: 'column', gap: { xs: 1.25, sm: 1.5 } }}>
                                    {internalEventComments.map((group, idx) => {
                                        const ev = group?.event || {};
                                        const comments = Array.isArray(group?.comments) ? group.comments : [];
                                        if (!comments.length) return null;
                                        const evPhoto = String(ev?.mainPhotoUrl || ev?.image_url || ev?.photoUrl || '').trim();
                                        const latest = comments[0] || null;
                                        return (
                                            <Box key={`ec-${ev.id || idx}`} sx={(t) => ({ border: '1px solid', borderColor: alpha(t.palette.text.primary, 0.10), borderRadius: 2, bgcolor: 'background.paper', overflow: 'hidden', boxShadow: `0 10px 26px ${alpha(t.palette.text.primary, 0.08)}`, '&:hover': { borderColor: t.palette.primary.main } })}>
                                                <Box sx={(t) => ({
                                                    px: { xs: 1.25, sm: 1.5 },
                                                    py: { xs: 0.75, sm: 1 },
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: { xs: 0.75, sm: 1 },
                                                    borderBottom: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                                                    background: `linear-gradient(90deg, ${alpha(t.custom?.brand?.brass || '#A87822', 0.14)} 0%, ${alpha(t.palette.background.paper, 0)} 75%)`,
                                                })}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1.25 }, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                                        <Avatar src={evPhoto || undefined} sx={{ width: { xs: 32, sm: 34 }, height: { xs: 32, sm: 34 }, flexShrink: 0 }}><EventIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: 'primary.main' }} /></Avatar>
                                                        <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                                            <Typography sx={{ fontWeight: 900, fontSize: { xs: '0.82rem', sm: '0.9rem' }, lineHeight: 1.2 }} noWrap>{String(ev?.title || 'Event').trim()}</Typography>
                                                            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', lineHeight: 1.3, fontSize: { xs: '0.65rem', sm: '0.72rem' } }}>
                                                                {(ev?.startAt || ev?.start_at || ev?.start_date || ev?.startDate) ? formatEventDateTimeCT(ev) : (latest?.created_at ? formatTimeAgo(latest.created_at) : '')}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                    <Box
                                                        sx={(t) => ({
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 0.4,
                                                            px: { xs: 0.75, sm: 1.1 },
                                                            py: { xs: 0.3, sm: 0.4 },
                                                            borderRadius: 999,
                                                            flexShrink: 0,
                                                            border: `1px solid ${alpha(t.palette.primary.main, 0.16)}`,
                                                            bgcolor: alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.12 : 0.06),
                                                        })}
                                                    >
                                                        <ChatBubbleOutlineIcon sx={{ fontSize: { xs: 11, sm: 13 }, color: 'primary.main' }} />
                                                        <Typography variant="caption" sx={{ fontWeight: 900, fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: 'primary.main', whiteSpace: 'nowrap' }}>
                                                            {comments.length === 1 ? '1 comment' : `${comments.length} comments`}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Box sx={{ px: { xs: 1, sm: 1.5 }, py: { xs: 0.75, sm: 1 }, display: 'grid', gap: { xs: 0.75, sm: 1 } }}>
                                                    {comments.slice(0, 2).map((c) => (
                                                        <Box key={c?.id || c?.comment_id} sx={(t) => ({
                                                            border: '1px solid',
                                                            borderColor: alpha(t.palette.text.primary, 0.08),
                                                            borderRadius: 2,
                                                            px: { xs: 1, sm: 1.25 },
                                                            py: { xs: 0.75, sm: 1 },
                                                            bgcolor: alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.06 : 0.02),
                                                            '&:hover': { borderColor: alpha(t.palette.primary.main, 0.32) },
                                                        })}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: { xs: 0.5, sm: 1 } }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 }, minWidth: 0 }}>
                                                                    <AccountAvatar
                                                                        src={c?.account_avatar_url || c?.user_avatar || c?.avatar_url || c?.profile_picture || avatarSrc}
                                                                        alt={c?.account_name || c?.user_name || c?.commenter_name || bizName}
                                                                        accountType="business"
                                                                        size={isMobileEng ? 28 : 34}
                                                                    />
                                                                    <Box sx={{ minWidth: 0 }}>
                                                                        <Typography variant="body2" sx={{ fontWeight: 900, lineHeight: 1.1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }} noWrap>
                                                                            {c?.account_name || c?.user_name || c?.commenter_name || bizName}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: { xs: '0.65rem', sm: '0.72rem' } }}>
                                                                            {c?.account_handle ? `@${String(c.account_handle).replace(/^@/, '')}` : (business?.slug ? `@${business.slug}` : '')}
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>
                                                                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', fontSize: { xs: '0.65rem', sm: '0.72rem' } }}>
                                                                    {c?.created_at ? formatTimeAgo(c.created_at) : ''}
                                                                </Typography>
                                                            </Box>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    fontWeight: 800,
                                                                    color: 'text.primary',
                                                                    mt: 0.5,
                                                                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                                                    whiteSpace: 'pre-wrap',
                                                                    overflowWrap: 'anywhere',
                                                                    lineHeight: 1.4,
                                                                }}
                                                            >
                                                                {String(c?.content || c?.body || '').slice(0, 260)}
                                                            </Typography>
                                                            {/* Comment image preview */}
                                                            {(() => {
                                                                const cImg = c?.image || (Array.isArray(c?.images) && c.images.length > 0 ? c.images[0] : null);
                                                                if (!cImg) return null;
                                                                return (
                                                                    <Box
                                                                        component="img"
                                                                        src={cImg}
                                                                        alt="comment image"
                                                                        sx={{
                                                                            mt: 0.75,
                                                                            width: 56,
                                                                            height: 56,
                                                                            objectFit: 'cover',
                                                                            borderRadius: 1.5,
                                                                            border: '1px solid',
                                                                            borderColor: (t) => alpha(t.palette.text.primary, 0.10),
                                                                            display: 'block',
                                                                            flexShrink: 0,
                                                                        }}
                                                                    />
                                                                );
                                                            })()}
                                                        </Box>
                                                    ))}
                                                    {comments.length > 2 && <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.5, display: 'block' }}>View all {comments.length} comments</Typography>}
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            ) : (
                                <Box sx={{ py: 8, textAlign: 'center' }}>
                                    <ChatBubbleOutlineIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                    <Typography variant="body2" color="text.secondary">No event comments yet</Typography>
                                </Box>
                            )
                        )}
                        {(eventSubTab === 2 || eventSubTab === 3) && (
                            internalEventEngagementLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
                            ) : internalEventEngagement.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', '& > *': { borderBottom: '1px solid', borderColor: (t) => alpha(t.palette.text.primary, 0.08), '&:last-child': { borderBottom: 'none' } } }}>
                                    {internalEventEngagement.map((evt) => {
                                        const evtTitle = evt.title || evt.name || 'Untitled Event';
                                        const evtDate = typeof formatEventDateTimeCT === 'function' ? formatEventDateTimeCT(evt) : '';
                                        const evtPhoto = evt?.mainPhotoUrl || evt?.coverPhoto || evt?.image_url || '';
                                        return (
                                            <Box key={evt.id} sx={{ py: 1.5, px: 1.5, cursor: 'pointer', '&:hover': { bgcolor: (t) => alpha(t.palette.text.primary, 0.025) } }}>
                                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                                    <Box sx={(t) => ({ width: 72, height: 72, borderRadius: 2, flexShrink: 0, overflow: 'hidden', bgcolor: alpha(t.palette.primary.main, 0.06), border: '1px solid', borderColor: alpha(t.palette.primary.main, 0.10), display: 'flex', alignItems: 'center', justifyContent: 'center' })}>
                                                        {evtPhoto ? <Box component="img" src={evtPhoto} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} /> : <CalendarTodayRoundedIcon sx={{ fontSize: 28, color: 'primary.main' }} />}
                                                    </Box>
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', lineHeight: 1.3 }} noWrap>{evtTitle}</Typography>
                                                        {evtDate && <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.25, fontWeight: 600 }}>{evtDate}</Typography>}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            ) : (
                                <Box sx={{ py: 8, textAlign: 'center' }}>
                                    {eventSubTab === 2 ? <FavoriteIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} /> : <RepeatIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />}
                                    <Typography variant="body2" color="text.secondary">{eventSubTab === 2 ? 'No liked events yet' : 'No reposted events yet'}</Typography>
                                </Box>
                            )
                        )}
                    </Box>
                )}

                {/* ═══════════ JOBS TAB ═══════════ */}
                {safeTab === 'jobs' && (
                    <>
                        {/* Desktop: full search + filter controls */}
                        {!(mobileFullscreen && isMobileEng) && (
                            <Box sx={{ px: 1.5, pt: 1.25, pb: 0.5, bgcolor: 'background.paper', zIndex: 7 }}>
                                {/* Row 1: Search + Clear + New Job */}
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.75 }}>
                                    <SearchInput
                                        placeholder="Search jobs…"
                                        value={localJobSearchTerm}
                                        onChange={(e) => setLocalJobSearchTerm(e?.target?.value ?? '')}
                                        onSearch={() => setLocalJobSearch(localJobSearchTerm)}
                                        onClear={() => { setLocalJobSearchTerm(''); setLocalJobSearch(''); }}
                                        inputProps={{ name: 'll-biz-jobs-search' }}
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
                                    {canCreatePosts && onCreateJob && (
                                        <Button
                                            variant="contained"
                                            size="small"
                                            startIcon={<AddIcon />}
                                            onClick={onCreateJob}
                                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999, flexShrink: 0, whiteSpace: 'nowrap' }}
                                        >
                                            New Job
                                        </Button>
                                    )}
                                </Stack>

                                {/* Row 2: Filter dropdowns */}
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
                                        <Select
                                            label="Category"
                                            value={jobsCategory}
                                            onChange={(e) => setJobsCategory(e.target.value)}
                                            displayEmpty
                                            renderValue={(v) => {
                                                if (!v) return 'All Categories';
                                                const label = jobCategoryLabel(v);
                                                const Icon = JOB_CATEGORY_ICONS[v] || CategoryRoundedIcon;
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
                                                jobs.forEach((j) => {
                                                    const c = String(j?.category || j?.job_category || '').trim().toLowerCase();
                                                    if (c) countMap[c] = (countMap[c] || 0) + 1;
                                                });
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
                        <Box sx={{ p: { xs: 0, md: 1.5 }, minHeight: 200 }}>
                            {(jobsLoadingProp || jobsLoading) ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
                            ) : filteredJobs.length === 0 ? (
                                <EngagementEmpty icon={<WorkRoundedIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />} title={jobsCategory ? 'No jobs in this category' : 'No job listings'} subtitle={jobsCategory ? 'Try selecting a different category.' : `${bizName} hasn't posted any job listings yet.`} />
                            ) : (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
                                    {visibleJobs.map((job) => (
                                        <Box
                                            key={job.id}
                                            sx={(t) => ({
                                                display: 'flex',
                                                flex: { xs: '0 0 100%', md: '0 0 calc(50% - 16px)' },
                                                mx: { xs: 0, md: 1 },
                                                my: { xs: 0, md: 1 },
                                                minWidth: 0,
                                                maxWidth: '100%',
                                                borderBottom: { xs: `1px solid ${alpha(t.palette.divider, 0.1)}`, md: 'none' },
                                                '&:last-child': { borderBottom: { xs: 'none', md: 'none' } },
                                            })}
                                        >
                                            <JobCard job={job} onClick={() => handleJobClick(job)} onEdit={onEditJob} onDelete={onDeleteJobClick} onShare={onJobShare} onSave={onJobSaveToggle} onApply={onJobApply} onReport={onJobReport} onRenew={onJobRenew} user={viewer} activeAccount={activeAccount} disableHoverEffects flat={isMobileEng} />
                                        </Box>
                                    ))}
                                    <Box ref={jobsSentinelRef} sx={{ height: 1, width: '100%' }} />
                                </Box>
                            )}
                        </Box>
                    </>
                )}

                {/* ═══════════ SERVICES TAB ═══════════ */}
                {safeTab === 'services' && (
                    <>
                        {/* Services sub-tabs — only show when there are requests */}
                        {hasServiceRequests && (
                            <Box
                                sx={(t) => ({
                                    flexShrink: 0,
                                    zIndex: 8,
                                    borderBottom: '1px solid',
                                    borderColor: alpha(t.palette.primary.main, 0.08),
                                    bgcolor: 'background.paper',
                                })}
                            >
                                {mobileFullscreen && isMobileEng ? (
                                    /* Mobile: compact tab bar with labels */
                                    <Stack direction="row" spacing={0} alignItems="center" justifyContent="center" sx={{ px: 1 }}>
                                        {[
                                            { value: 'services', label: 'Services', icon: <BuildRoundedIcon />, count: filteredServices.length },
                                            { value: 'requests', label: 'Requests', icon: <FrontHandRoundedIcon />, count: serviceRequests.length },
                                        ].map((sub) => {
                                            const isActive = servicesSubTab === sub.value;
                                            return (
                                                <Box
                                                    key={sub.value}
                                                    onClick={() => setServicesSubTab(sub.value)}
                                                    sx={(t) => ({
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5,
                                                        flex: 1, py: 1, cursor: 'pointer',
                                                        borderBottom: '2px solid',
                                                        borderColor: isActive ? t.palette.secondary.main : 'transparent',
                                                        color: isActive ? 'secondary.main' : 'text.disabled',
                                                        transition: 'color 150ms ease, border-color 150ms ease',
                                                        '&:hover': { color: isActive ? 'secondary.main' : 'text.secondary' },
                                                    })}
                                                >
                                                    {React.cloneElement(sub.icon, { sx: { fontSize: 16 } })}
                                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: isActive ? 800 : 600, lineHeight: 1 }}>
                                                        {sub.label}{sub.count > 0 ? ` ${sub.count}` : ''}
                                                    </Typography>
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                ) : (
                                    <Tabs
                                        value={servicesSubTab}
                                        onChange={(_, v) => setServicesSubTab(v)}
                                        variant="fullWidth"
                                        sx={subTabsSx}
                                    >
                                        <Tab icon={<BuildRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Services${filteredServices.length > 0 ? ` (${filteredServices.length})` : ''}`} value="services" />
                                        <Tab icon={<FrontHandRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Requests${serviceRequests.length > 0 ? ` (${serviceRequests.length})` : ''}`} value="requests" />
                                    </Tabs>
                                )}
                            </Box>
                        )}

                        {/* ── Sub-tab: Services (listings) ── */}
                        {servicesSubTab === 'services' && (
                            <>


                                <Box sx={{ p: { xs: 0, md: 1.5 }, minHeight: 200 }}>
                                    {servicesSourceLoading ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
                                    ) : filteredServices.length === 0 ? (
                                        <EngagementEmpty
                                            icon={servicesView === 'favorites'
                                                ? <FavoriteRoundedIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
                                                : <BuildRoundedIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />}
                                            title={servicesView === 'favorites' ? 'No Favorite Services' : 'No services yet'}
                                            subtitle={servicesView === 'favorites'
                                                ? `${isOwnBusiness ? "You haven't" : `${bizName} hasn't`} favorited any services yet.`
                                                : `${bizName} hasn't posted any service listings yet.`}
                                        />
                                    ) : (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
                                            {visibleServices.map((svc) => (
                                                <Box
                                                    key={svc.id}
                                                    sx={{
                                                        display: 'flex',
                                                        flex: { xs: '0 0 100%', md: '0 0 calc(50% - 16px)' },
                                                        mx: { xs: 0, md: 1 },
                                                        my: { xs: 0, md: 1 },
                                                        minWidth: 0,
                                                        maxWidth: '100%',
                                                    }}
                                                >
                                                    <ServiceCard service={svc} onClick={() => handleServiceClick(svc)} onShare={onServiceShare} onFavorite={onServiceFavorite} onRequestQuote={onServiceMessage} user={viewer} activeAccount={activeAccount} />
                                                </Box>
                                            ))}
                                            <Box ref={servicesSentinelRef} sx={{ height: 1, width: '100%' }} />
                                        </Box>
                                    )}
                                </Box>
                            </>
                        )}

                        {/* ── Sub-tab: Requests ── */}
                        {servicesSubTab === 'requests' && (
                            <Box sx={{ p: { xs: 0, md: 1.5 }, minHeight: 200 }}>
                                {serviceRequestsLoading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                        <CircularProgress size={28} />
                                    </Box>
                                ) : serviceRequests.length === 0 ? (
                                    <EngagementEmpty
                                        icon={<HandymanRoundedIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />}
                                        title="No Service Requests"
                                        subtitle={
                                            isOwnBusiness
                                                ? "You haven't submitted any service requests yet. Post a request to get help from your community!"
                                                : `${bizName} hasn't submitted any service requests yet.`
                                        }
                                    />
                                ) : (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
                                        {serviceRequests.map((req) => (
                                            <Box
                                                key={req.id}
                                                sx={{
                                                    display: 'flex',
                                                    flex: { xs: '0 0 100%', md: '0 0 calc(50% - 16px)' },
                                                    mx: { xs: 0, md: 1 },
                                                    my: { xs: 0, md: 1 },
                                                    minWidth: 0,
                                                    maxWidth: '100%',
                                                }}
                                            >
                                                <ServiceRequestCard
                                                    request={req}
                                                    onClick={(r) => {
                                                        if (onServiceRequestClick) onServiceRequestClick(r);
                                                        else if (r?.id) navigate(`/services/requests/${r.id}`);
                                                    }}
                                                    onEdit={onEditServiceRequest}
                                                    onDelete={(r) => {
                                                        if (typeof onDeleteServiceRequest === 'function') {
                                                            onDeleteServiceRequest(r);
                                                        }
                                                    }}
                                                    user={viewer}
                                                    activeAccount={activeAccount}
                                                    onRespond={onRespondServiceRequest}
                                                />
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        )}
                    </>
                )}

                <UserCardPopover
                    anchorEl={userAnchor}
                    onClose={() => setUserAnchor(null)}
                    user={userForCard}
                    isSelf={isSelf}
                    following={isFollowingForCard}
                    onFollow={handleFollow}
                    onViewProfile={(u) => window.location.assign(`/${u.handle || u.id}`)}
                />

                {/* ── Mobile: Hide business category chips on post cards ── */}
                {isMobileEng && (
                    <style>{`
                    @media (max-width: 899.95px) {
                        [data-business-post-id] .MuiBox-root:has(.post-loc-icon) .MuiChip-root {
                            display: none !important;
                        }
                        [data-business-post-id] .MuiChip-filledDefault,
                        [data-business-post-id] .MuiChip-outlinedDefault {
                            display: none !important;
                        }
                    }
                `}</style>
                )}

                {/* ── Mobile FAB for creating new content (Twitter-style) — bottom of screen like CommunityPanel ── */}
                {isMobileEng && canCreatePosts && (
                    <>
                        <Fab
                            color="primary"
                            size="medium"
                            onClick={(e) => setFabMenuAnchor(e.currentTarget)}
                            sx={(t) => ({
                                position: 'fixed',
                                bottom: mobileFullscreen ? 16 : (headerHidden ? 16 : 72),
                                right: 14,
                                zIndex: 1200,
                                boxShadow: `0 3px 12px ${alpha(t.palette.primary.main, 0.35)}`,
                                transition: 'bottom 0.3s cubic-bezier(0.2,0.8,0.2,1)',
                                '&:hover': {
                                    bgcolor: alpha(t.palette.primary.main, 0.92),
                                },
                            })}
                            aria-label="Create new"
                        >
                            <AddIcon />
                        </Fab>
                        <MuiMenu
                            anchorEl={fabMenuAnchor}
                            open={Boolean(fabMenuAnchor)}
                            onClose={() => setFabMenuAnchor(null)}
                            disableScrollLock
                            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                            transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                            PaperProps={{ sx: { mb: 1, borderRadius: 3, minWidth: 180, boxShadow: (t) => `0 12px 40px ${alpha(t.palette.text.primary, 0.18)}`, py: 0.5 } }}
                        >
                            {onCreatePost && <MenuItem onClick={() => { setFabMenuAnchor(null); onCreatePost(); }} sx={{ py: 1.25, gap: 1.5 }}><ForumIcon sx={{ fontSize: 20, color: 'primary.main' }} /><Typography sx={{ fontWeight: 700, fontSize: 14 }}>New Post</Typography></MenuItem>}
                            {onCreateEvent && <MenuItem onClick={() => { setFabMenuAnchor(null); onCreateEvent(); }} sx={{ py: 1.25, gap: 1.5 }}><EventIcon sx={{ fontSize: 20, color: 'primary.main' }} /><Typography sx={{ fontWeight: 700, fontSize: 14 }}>New Event</Typography></MenuItem>}
                            {onCreateJob && <MenuItem onClick={() => { setFabMenuAnchor(null); onCreateJob(); }} sx={{ py: 1.25, gap: 1.5 }}><WorkRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} /><Typography sx={{ fontWeight: 700, fontSize: 14 }}>New Job</Typography></MenuItem>}
                            {onCreateService && <MenuItem onClick={() => { setFabMenuAnchor(null); onCreateService(); }} sx={{ py: 1.25, gap: 1.5 }}><BuildRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} /><Typography sx={{ fontWeight: 700, fontSize: 14 }}>New Service</Typography></MenuItem>}
                            <MenuItem onClick={() => { setFabMenuAnchor(null); if (typeof onCreateServiceRequest === 'function') onCreateServiceRequest(); else navigate('/services/requests/create'); }} sx={{ py: 1.25, gap: 1.5 }}><FrontHandRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} /><Typography sx={{ fontWeight: 700, fontSize: 14 }}>New Service Request</Typography></MenuItem>
                        </MuiMenu>
                    </>
                )}

            </Box>{/* end content area */}

        </Paper>
    );
}


/* ──────────────────────── Sub-components ──────────────────────── */

function EngagementList({ loading, items, emptyIcon, emptyTitle, emptySubtitle, footerLabel, children }) {
    return (
        <Box sx={{ minHeight: 200 }}>
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
            ) : items.length === 0 ? (
                <EngagementEmpty icon={React.cloneElement(emptyIcon, { sx: { fontSize: 48, color: 'text.secondary', opacity: 0.5 } })} title={emptyTitle} subtitle={emptySubtitle} />
            ) : (
                <>
                    {/* Flatten CommunityPostCard's and BusinessPostCard's MUI Card hover/border/shadow styles */}
                    <style>{`
                        [data-flat-posts] [data-post-id],
                        [data-flat-posts] [data-post-id][class],
                        [data-flat-posts] .MuiCard-root[data-post-id],
                        [data-flat-posts] .MuiPaper-root[data-post-id],
                        [data-flat-posts] .MuiCard-root.MuiCard-root[data-post-id],
                        [data-flat-posts] .MuiPaper-root.MuiPaper-root[data-post-id],
                        [data-flat-posts] [data-business-post-id],
                        [data-flat-posts] [data-business-post-id][class],
                        [data-flat-posts] .MuiCard-root[data-business-post-id],
                        [data-flat-posts] .MuiPaper-root[data-business-post-id],
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
                        [data-flat-posts] .MuiCard-root[data-post-id]:hover,
                        [data-flat-posts] .MuiPaper-root[data-post-id]:hover,
                        [data-flat-posts] [data-business-post-id]:hover,
                        [data-flat-posts] [data-business-post-id][class]:hover,
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
                        /* Hide built-in small square thumbnails so the full-width PostPhotoGrid renders instead */
                        [data-flat-posts] [data-post-id] img[loading="lazy"][alt=""],
                        [data-flat-posts] [data-profile-post-id] img[loading="lazy"][alt=""],
                        [data-flat-posts] [data-business-post-id] img[loading="lazy"][alt=""] {
                            display: none !important;
                        }
                        [data-flat-posts] [data-post-id] .MuiBox-root:has(> .MuiBox-root > img[loading="lazy"][alt=""]),
                        [data-flat-posts] [data-profile-post-id] .MuiBox-root:has(> .MuiBox-root > img[loading="lazy"][alt=""]),
                        [data-flat-posts] [data-business-post-id] .MuiBox-root:has(> .MuiBox-root > img[loading="lazy"][alt=""]) {
                            display: none !important;
                        }
                        [data-flat-posts] [data-profile-post-id] .MuiBox-root:has(> .MuiBox-root > img[loading="lazy"]) {
                            display: none !important;
                        }
                        /* Zero out internal padding on Business/Music cards to match community flat style */
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
                    `}</style>
                    <Box data-flat-posts="1" sx={{
                        display: 'flex', flexDirection: 'column', gap: 0,
                        '& > *': {
                            borderBottom: '2px solid',
                            borderColor: (t) => alpha(t.palette.text.primary, 0.10),
                            '&:last-child': { borderBottom: 'none' },
                        },
                    }}>{children}</Box>
                </>
            )}
        </Box>
    );
}

function EngagementEmpty({ icon, title, subtitle }) {
    return (
        <Box sx={{ py: 8, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
            <Typography sx={{ fontWeight: 800, fontSize: 18, color: 'text.primary', mt: 1 }}>{title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 320 }}>{subtitle}</Typography>
        </Box>
    );
}

function FooterCount({ children }) {
    return (
        <Box sx={{ px: 2, py: 1.25, display: 'flex', justifyContent: 'center', alignItems: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{children}</Typography>
        </Box>
    );
}

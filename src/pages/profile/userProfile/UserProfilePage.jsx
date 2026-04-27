// src/pages/profile/userProfile/UserProfilePage.jsx
// Layout: LEFT rail (About → Contact → Work → Education → Followers & Following → Photos → Location)
// RIGHT rail: Tabbed Community Activity (Posts / Likes / Reposts)
//
// Updates in this version:
// - NEW: Right-rail is now a single card with tabs (Posts / Likes / Reposts) so Likes/Reposts are not pushed to the bottom.
// - FIX: Profile posts list no longer incorrectly calls /users/:id/engagement/posts for the user's own posts.
//        Likes/Reposts are loaded by the tab card using that endpoint; owner Posts come from /users/public/:handleOrId.
// - All existing save/crop/delete flows preserved.
// - Existing scroll-restore behavior preserved.
//
// UPDATE (Profile Posts Filters + Counts + 50-at-a-time):
// - Category dropdown uses the same human category names as Community.
// - Count text is filter-accurate: "Displaying X of Y posts".
// - Expanded posts view shows filters at top (Search, Category, Sort) and scrolls to top on expand.
// - Profile posts render 50 at a time, loading more as you scroll (via ProfilePostsList + expanded grid chunking).

import React, {useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect} from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from '../../../api/axiosInstance';
import { secureFetch } from '../../../utils/secureFetch';
import { getAccountHeaders } from '../../../utils/getAccountHeadersStatic';
import PhotosUploadSection from '../../../components/PhotosUploadSection';
import SmartMenu from '../../../components/SmartMenu';
import { alpha } from '@mui/material/styles';
import { getProfileSubTabsSx, getProfileFilterBarSx } from '../../../themes';
import {
    Alert,
    Box,
    Avatar,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Drawer,
    Fade,
    FormControl,
    IconButton,
    InputLabel,
    LinearProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Popover,
    Paper,
    Radio,
    RadioGroup,
    Rating,
    Select,
    Snackbar,
    Stack,
    FormControlLabel,
    TextField,
    Tab,
    Tabs,
    Tooltip,
    Typography,
    InputAdornment,
    Collapse,
    Fab,
    Zoom,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { keyframes } from '@mui/system';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import PublicIcon from '@mui/icons-material/Public';
import CloseIcon from '@mui/icons-material/Close';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import LockIcon from '@mui/icons-material/Lock';
import ForumIcon from '@mui/icons-material/Forum';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RepeatIcon from '@mui/icons-material/Repeat';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SearchInput from '../../../components/SearchInput';

import ProfileHeader from './ProfileHeader';
import { PhotoCommentsDialog } from './ProfileHeader';
import AboutSection from './AboutSection';
import ImageCropDialog from './ImageCropDialog';
import FollowsSection from './FollowsSection';

import SellerReviewsPopup from './SellerReviewsPopup';
import postsIcon from '../../../assets/posts_icon.png';
import likeIconLit from '../../../assets/actionBar/like_icon_lit.png';
import repostIconLit from '../../../assets/actionBar/repost_lit.png';
import commentIconLit from '../../../assets/actionBar/comment_lit.png';
import defaultAvatar from '../../../assets/profile/default_avatar_square.png';

import ProfileEngagementTabs from './ProfileEngagementTabs';
import CommunityMap from '../../community/CommunityMap';
import NetworkErrorState, { isNetworkError } from '../../../components/NetworkErrorState';
import NotFound from '../../NotFound';

// Post detail modals (for in-profile preview instead of navigating away)
import PostPage from '../../community/PostDetailModal';
import BusinessPostDetailModal from '../../business/components/BusinessPostDetailModal';
import MusicPostDetailPanel from '../../music/components/MusicPostDetailPanel';

import MarketplaceListingDetailPanel from '../../marketplace/components/MarketplaceListingDetailPanel';
import EventCard from '../../events/components/EventCard';
import EventDetailPanel from '../../events/components/EventDetailPanel';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import JobCard from '../../jobs/components/JobCard';
import JobDetailPanel from '../../jobs/components/JobDetailPanel';
import ApplyToJobDialog from '../../jobs/components/ApplyToJobDialog';
import BusinessDetailPanel from '../../business/components/BusinessDetailPanel';
import ServiceCard from '../../services/components/ServiceCard';
import ServiceRequestCard from '../../services/components/ServiceRequestCard';
import ServicePopupDialog from '../../services/components/ServicePopupDialog';
import { getServiceCategoryInfo } from '../../services/utils/serviceHelpers';
import { toggleServiceFavorite } from '../../services/api/serviceFavoritesApi';
import { fetchServiceById, fetchServiceRequests, fetchServiceRequestById, fetchRequestResponses, acceptRequestResponse, declineRequestResponse, withdrawRequestResponse, closeServiceRequest, deleteServiceRequest, fetchServiceProfileCheck, fetchServiceRequestsByUser, fetchServiceLimits } from '../../services/api/servicesApi';
import RichTextDisplay from '../../../components/RichTextDisplay';
import { fetchEventProfileCheck } from '../../events/api/eventsApi';
import { ReportDialog } from '../../../components/ActionBar';
import ListingCard from '../../marketplace/components/ListingCard';
import {
    toggleFavorite as toggleListingFavorite,
    toggleRepost as toggleListingRepost,
    flagListing,
} from '../../marketplace/api/marketplace';
import CreateEditEventModal from '../../events/modals/CreateEditEventModal';
import CreateJobModal from '../../jobs/modals/CreateJobModal';
import CreateListingModal from '../../marketplace/modals/CreateListingModal';
import CreateServiceRequestModal from '../../services/modals/CreateServiceRequestModal';
import RespondToRequestModal from '../../services/modals/RespondToRequestModal';
import ContentFadeIn from '../../../components/ContentFadeIn';

import { deleteJob, saveJob, renewJob, fetchMyJobs } from '../../jobs/api/jobs';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import FrontHandRoundedIcon from '@mui/icons-material/FrontHandRounded';

// Category icons
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
import VolunteerActivismRoundedIcon from '@mui/icons-material/VolunteerActivismRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import ReviewsRoundedIcon from '@mui/icons-material/ReviewsRounded';
import SellRoundedIcon from '@mui/icons-material/SellRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import XIcon from '@mui/icons-material/X';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import PhotoLibraryRoundedIcon from '@mui/icons-material/PhotoLibraryRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import LinkIcon from '@mui/icons-material/Link';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import HourglassBottomRoundedIcon from '@mui/icons-material/HourglassBottomRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded';
import HomeRepairServiceRoundedIcon from '@mui/icons-material/HomeRepairServiceRounded';
import YardRoundedIcon from '@mui/icons-material/YardRounded';
import MedicalServicesRoundedIcon from '@mui/icons-material/MedicalServicesRounded';
import ContentCutRoundedIcon from '@mui/icons-material/ContentCutRounded';
import FitnessCenterRoundedIcon from '@mui/icons-material/FitnessCenterRounded';
import PetsRoundedIcon from '@mui/icons-material/PetsRounded';
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded';
import CelebrationRoundedIcon from '@mui/icons-material/CelebrationRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import MemoryRoundedIcon from '@mui/icons-material/MemoryRounded';
import LocalHospitalRoundedIcon from '@mui/icons-material/LocalHospitalRounded';
import HandymanRoundedIcon from '@mui/icons-material/HandymanRounded';
import ConstructionRoundedIcon from '@mui/icons-material/ConstructionRounded';
import PrecisionManufacturingRoundedIcon from '@mui/icons-material/PrecisionManufacturingRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import CleaningServicesRoundedIcon from '@mui/icons-material/CleaningServicesRounded';
import GavelRoundedIcon from '@mui/icons-material/GavelRounded';
import GppGoodRoundedIcon from '@mui/icons-material/GppGoodRounded';
import AgricultureRoundedIcon from '@mui/icons-material/AgricultureRounded';
import AddIcon from '@mui/icons-material/Add';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import DynamicFeedRoundedIcon from '@mui/icons-material/DynamicFeedRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';

// Used by expanded posts page
import { ProfilePostCard } from './ProfilePostsList';
import UserCardPopover from '../../../components/UserCardPopover';
import ShareDialog from '../../../components/ShareDialog';
import { useActiveAccount } from '../../../components/AccountContext';
import EditCommunityPostDialog from '../../community/components/EditCommunityPostDialog';
import DeletePostConfirmDialog from '../../community/components/DeletePostConfirmDialog';
import SuccessSnackbar, { useSuccessSnackbar } from '../../../components/SuccessSnackbar';
import MobileActivityShell from '../../../components/MobileActivityShell';
import { useAuth } from '../../../components/AuthModalContext';
import useChromeTop from '../../../hooks/useChromeTop';

/* ── GCS upload helpers for message photos ── */
async function getSignedUploadUrl({ folder, fileName, contentType }) {
    const res = await secureFetch("/api/uploads/signed-url", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folder, fileName, contentType }) });
    if (!res.ok) throw new Error("Failed to get upload URL");
    return res.json();
}

async function uploadToSignedUrl({ uploadUrl, file, contentType }) {
    const res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
    if (!res.ok) throw new Error("Upload failed");
}

/* ── Per-user message rate limiting (client-side) ── */
const _userMsgTracker = new Map();
const _USER_MSG_WINDOW = 10 * 60 * 1000;
const _USER_MSG_MAX = 5;

function _trackUserMsg(userId) {
    const now = Date.now();
    const key = String(userId);
    const entries = (_userMsgTracker.get(key) || []).filter(t => now - t < _USER_MSG_WINDOW);
    entries.push(now);
    _userMsgTracker.set(key, entries);
}

function _isUserMsgLimited(userId) {
    const now = Date.now();
    const key = String(userId);
    const entries = (_userMsgTracker.get(key) || []).filter(t => now - t < _USER_MSG_WINDOW);
    return entries.length >= _USER_MSG_MAX;
}

const api = process.env.REACT_APP_API_URL;

// ── Shared dropdown styling — matches SearchInput frosted-glass look ──
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
    '& .MuiInputLabel-root': {
        fontWeight: 600,
        fontSize: '0.875rem',
        color: 'text.secondary',
    },
    '& .MuiSelect-select': {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minHeight: 'unset',
        fontSize: '0.875rem',
        fontWeight: 700,
        letterSpacing: '-0.01em',
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
            mt: 0.75,
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            maxHeight: 340,
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: alpha(t.palette.text.primary, 0.08),
            boxShadow: `0 16px 34px ${alpha(t.palette.text.primary, 0.12)}`,
            '& .MuiMenuItem-root': {
                minHeight: 42,
                fontSize: '0.875rem',
                fontWeight: 600,
            },
        }),
    },
});

const RENEW_OPTIONS = [
    { value: 7, label: "7 days" },
    { value: 14, label: "14 days" },
    { value: 30, label: "30 days" },
    { value: 60, label: "60 days" },
    { value: 90, label: "90 days" },
];

// Brand colors for visual enhancements
// Lantern gold — uses theme secondary.main
// Lantern green — uses theme primary.main

// same rule as Register.jsx (3–30, lowercase letters/numbers/underscore only)
const handleRegex = /^[a-z0-9_]{3,30}$/;

const privacyLabel = (val) =>
    val === 'private' ? 'Only Me' : val === 'friends' ? 'Followers' : 'Public';

const EMPTY_ARRAY = [];
const EMPTY_MAP = new Map();

function ExpandedEmptyState({ iconSrc, icon, title, subtitle }) {
    return (
        <Box
            sx={{
                py: 5,
                px: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                minHeight: 220,
            }}
        >
            {iconSrc || icon ? (
                <Box
                    sx={(t) => ({
                        width: { xs: 92, sm: 104 },
                        height: { xs: 92, sm: 104 },
                        borderRadius: 999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1.75,
                        background: alpha(t.palette.primary.main, 0.10),
                        border: `1px solid ${alpha(t.palette.primary.main, 0.22)}`,
                        boxShadow: (t) => `0 12px 32px ${alpha(t.palette.text.primary, 0.08)}`,
                    })}
                >
                    {iconSrc ? (
                        <Box
                            component="img"
                            src={iconSrc}
                            alt=""
                            draggable={false}
                            sx={{
                                width: { xs: 56, sm: 62 },
                                height: { xs: 56, sm: 62 },
                                objectFit: 'contain',
                                opacity: 1,
                            }}
                        />
                    ) : (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                '& svg': {
                                    width: { xs: 52, sm: 58 },
                                    height: { xs: 52, sm: 58 },
                                },
                            }}
                        >
                            {icon}
                        </Box>
                    )}
                </Box>
            ) : null}

            <Typography sx={{ fontWeight: 900, fontSize: 22, color: 'text.primary' }}>
                {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 560 }}>
                {subtitle}
            </Typography>
        </Box>
    );
}

/* ── Centered 3-dots page loader ─────────────────────────────────────── */
const dotPulse = keyframes`
    0%, 80%, 100% { transform: scale(0); opacity: .4; }
    40% { transform: scale(1); opacity: 1; }
`;
function FullScreenDots() {
    return (
        <Box
            sx={(t) => ({
                minHeight: 'calc(100vh - 64px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: t.palette.mode === 'dark'
                    ? { xs: t.palette.background.paper, sm: t.palette.background.default }
                    : { xs: '#fff', sm: 'linear-gradient(135deg, #f7fbff 0%, #f4f6fb 50%, #f8fafc 100%)' },
            })}
        >
            <Box sx={{ display: 'flex', gap: 1.25 }}>
                {[0, 1, 2].map((i) => (
                    <Box
                        key={i}
                        sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: 'text.primary',
                            animation: `${dotPulse} 1.4s ease-in-out infinite`,
                            animationDelay: `${i * 0.18}s`,
                        }}
                    />
                ))}
            </Box>
        </Box>
    );
}

/** Reusable section shell */
const SectionCard = ({
                         title,
                         privacyKey,
                         editMode = false,
                         onPrivacy,
                         action,
                         children,
                         maxBodyHeight,
                         fixedBodyHeight = false,
                         contentSx,
                         headerSx,
                         cardSx,
                         showPrivacyForOwner = false,
                         ownerCanEdit = false,
                         currentPrivacy = 'public',
                     }) => (
    <Card
        variant="outlined"
        sx={(t) => ({
            borderRadius: 3,
            overflow: 'hidden',
            backgroundImage: 'none',
            borderColor: (t) => alpha(t.palette.text.primary, 0.08),
            boxShadow: (t) => `0 14px 44px ${alpha(t.palette.text.primary, 0.10)}`,
            bgcolor: 'background.paper',
            backdropFilter: 'none',
            ...(cardSx || null),
        })}
    >
        <Box
            sx={(t) => ({
                px: { xs: 1.25, sm: 1.5 },
                py: 1.15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                borderBottom: '1px solid',
                borderColor: (t) => alpha(t.palette.text.primary, 0.08),
                background: (t) =>
                    `radial-gradient(900px 120px at 0% 0%, ${alpha(t.palette.secondary.main, 0.22)} 0%, transparent 60%),
                     linear-gradient(90deg, ${alpha(t.palette.primary.main, 0.08)} 0%, ${alpha(t.palette.secondary.main, 0.10)} 42%, ${alpha(t.palette.background.paper, 0)} 115%)`,
                ...(headerSx || null),
            })}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>{title}</Typography>
                {(editMode || showPrivacyForOwner) && privacyKey && (
                    <>
                        <Tooltip title="Privacy">
                            <IconButton
                                size="small"
                                onClick={(e) => onPrivacy?.(e, privacyKey)}
                                sx={{ ml: 0.5 }}
                            >
                                <PublicIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        {ownerCanEdit && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.25 }}>
                                ({privacyLabel(currentPrivacy)})
                            </Typography>
                        )}
                    </>
                )}
            </Box>
            {action}
        </Box>
        <CardContent
            sx={{
                pt: 0.5,
                pb: 1.25,
                ...(maxBodyHeight
                    ? {
                        maxHeight: maxBodyHeight,
                        ...(fixedBodyHeight ? { minHeight: maxBodyHeight } : null),
                        overflowY: 'auto',
                    }
                    : null),
                ...(contentSx || null),
            }}
        >
            {children}
        </CardContent>
    </Card>
);

function PrivateProfileNotice() {
    return (
        <Card
            variant="outlined"
            sx={(t) => ({
                borderRadius: 3,
                overflow: 'hidden',
                borderColor: alpha(t.palette.text.primary, 0.08),
                boxShadow: `0 8px 32px ${alpha(t.palette.primary.main, 0.1)}`,
                bgcolor: 'background.paper',
                background: `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.02)} 0%, ${alpha(t.palette.secondary.main, 0.04)} 100%)`,
                maxWidth: 480,
                mx: 'auto',
            })}
        >
            <Box sx={{ p: { xs: 2.5, sm: 3 }, textAlign: 'center' }}>
                <Box
                    sx={(t) => ({
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        bgcolor: alpha(t.palette.primary.main, 0.12),
                        border: `2px solid ${alpha(t.palette.primary.main, 0.25)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                        boxShadow: `0 8px 24px ${alpha(t.palette.primary.main, 0.1)}`,
                    })}
                >
                    <LockRoundedIcon sx={{ fontSize: 32, color: "primary.main" }} />
                </Box>
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 800,
                        color: "primary.main",
                        mb: 0.75,
                    }}
                >
                    This profile is private
                </Typography>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        maxWidth: 320,
                        mx: 'auto',
                        lineHeight: 1.6,
                    }}
                >
                    Follow to request access. Once approved, you will be able to view their full profile.
                </Typography>
            </Box>
        </Card>
    );
}


function BlockedProfileNotice({ onUnblock, name = 'this user' }) {
    return (
        <Card
            variant="outlined"
            sx={(t) => ({
                borderRadius: 3,
                overflow: 'hidden',
                borderColor: (t) => alpha(t.palette.error.main, 0.22),
                boxShadow: (t) => `0 14px 44px ${alpha(t.palette.text.primary, 0.10)}`,
                bgcolor: 'background.paper',
            })}
        >
            <Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <Box
                    sx={(t) => ({
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(t.palette.error.main, 0.10),
                        border: `1px solid ${alpha(t.palette.error.main, 0.20)}`,
                        flexShrink: 0,
                    })}
                >
                    <LockIcon fontSize="small" />
                </Box>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.25 }}>
                        You blocked {name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                        You won’t see their posts or be able to interact with their profile until you unblock them.
                    </Typography>

                    {onUnblock ? (
                        <Button
                            variant="outlined"
                            onClick={onUnblock}
                            sx={(t) => ({
                                mt: 1.25,
                                borderRadius: 999,
                                textTransform: 'none',
                                fontWeight: 900,
                                borderColor: (t) => alpha(t.palette.error.main, 0.35),
                                color: 'error.main',
                                '&:hover': { borderColor: (t) => alpha(t.palette.error.main, 0.55), bgcolor: (t) => alpha(t.palette.error.main, 0.06) },
                            })}
                        >
                            Unblock
                        </Button>
                    ) : null}
                </Box>
            </Box>
        </Card>
    );
}

function HiddenPostsNotice({ onUnhide, name = 'this user' }) {
    return (
        <Card
            variant="outlined"
            sx={(t) => ({
                borderRadius: 3,
                overflow: 'hidden',
                borderColor: (t) => alpha(t.palette.text.primary, 0.08),
                boxShadow: (t) => `0 14px 44px ${alpha(t.palette.text.primary, 0.10)}`,
                bgcolor: 'background.paper',
            })}
        >
            <Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <Box
                    sx={(t) => ({
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(t.palette.primary.main, 0.10),
                        border: `1px solid ${alpha(t.palette.primary.main, 0.14)}`,
                        flexShrink: 0,
                    })}
                >
                    <PublicIcon fontSize="small" />
                </Box>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.25 }}>
                        You’ve hidden posts from {name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                        Their posts won’t show up for you in Community or on their profile until you unhide them.
                    </Typography>

                    {onUnhide ? (
                        <Button
                            variant="outlined"
                            onClick={onUnhide}
                            sx={{
                                mt: 1.25,
                                borderRadius: 999,
                                textTransform: 'none',
                                fontWeight: 900,
                            }}
                        >
                            Unhide posts
                        </Button>
                    ) : null}
                </Box>
            </Box>
        </Card>
    );
}

/* categories (same naming as Community page) */
const PROFILE_CATEGORY_OPTIONS = [
    { value: '', label: 'All Categories' },
    { value: 'announcement', label: 'Announcements' },
    { value: 'community-chat', label: 'General Discussion' },
    { value: 'help-requests', label: 'Help Requests' },
    { value: 'lost-and-found', label: 'Lost & Found' },
    { value: 'public-safety-alerts', label: 'Public Safety Alerts' },
    { value: 'tips', label: 'Tips' },
    { value: 'recommendations', label: 'Recommendations' },
    { value: 'volunteers', label: 'Volunteers' },
];

const ENABLE_EDIT_DETAIL_SECTIONS = false;


function normalizeCategoryKey(v) {
    const s = String(v || '').trim().toLowerCase();
    if (!s) return '';
    if (s === 'public-safety') return 'public-safety-alerts';
    if (s === 'recommendation') return 'recommendations';
    return s;
}

const PROFILE_CATEGORY_LABEL_MAP = new Map(
    PROFILE_CATEGORY_OPTIONS.map((o) => [normalizeCategoryKey(o.value), String(o.label || "").trim()])
);

function getProfileCategoryLabel(value) {
    const key = normalizeCategoryKey(value);
    return PROFILE_CATEGORY_LABEL_MAP.get(key) || "";
}

function normalizeLabelForCopy(label) {
    return String(label || "")
        .trim()
        .replace(/&/g, "and")
        .replace(/\s+/g, " ")
        .toLowerCase();
}

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
    'volunteer-fundraising': VolunteerActivismRoundedIcon,
    'government-civic': AccountBalanceRoundedIcon,
    'markets-shopping': StorefrontRoundedIcon,
    'holidays-seasonal': CelebrationRoundedIcon,
    other: CategoryRoundedIcon,
};
const EVENT_CATEGORY_FILTER_OPTIONS = Object.keys(EVENT_CATEGORY_LABELS).map((key) => ({
    value: key,
    label: eventCategoryLabel(key),
    Icon: EVENT_CATEGORY_ICONS[key] || CategoryRoundedIcon,
}));

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
const BUSINESS_CATEGORY_ICONS = {
    food_drink: RestaurantRoundedIcon,
    shopping_retail: StorefrontRoundedIcon,
    automotive: DirectionsCarRoundedIcon,
    home_services: HomeRepairServiceRoundedIcon,
    home_garden: YardRoundedIcon,
    health_wellness: MedicalServicesRoundedIcon,
    beauty_personal_care: ContentCutRoundedIcon,
    fitness_recreation: FitnessCenterRoundedIcon,
    professional_services: BusinessCenterRoundedIcon,
    education_childcare: SchoolRoundedIcon,
    pets_animals: PetsRoundedIcon,
    travel_lodging: TravelExploreRoundedIcon,
    arts_entertainment: TheaterComedyRoundedIcon,
    community_nonprofit: VolunteerActivismRoundedIcon,
    technology_repair: BuildRoundedIcon,
    other: CategoryRoundedIcon,
};
const BUSINESS_CATEGORY_LABELS = {
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
function ProfileCategoryRow({ Icon, label }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            {Icon ? <Icon sx={{ fontSize: 20, flexShrink: 0, color: 'primary.main' }} /> : null}
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>{label}</Typography>
        </Box>
    );
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

function getEventDateValue(event) {
    const raw = event?.startAt || event?.start_at || event?.endAt || event?.end_at || null;
    if (!raw) return null;
    const value = new Date(raw);
    return Number.isNaN(value.getTime()) ? null : value;
}

function applyProfileEventDateFilter(events, sortKey, dateFrom, dateTo) {
    const list = Array.isArray(events) ? events.slice() : [];

    // If explicit date range is provided, use it
    if (dateFrom || dateTo) {
        const fromMs = dateFrom ? new Date(dateFrom + 'T00:00:00').getTime() : 0;
        const toMs = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : Infinity;
        return list.filter((event) => {
            const value = getEventDateValue(event);
            if (!value) return true;
            const ms = value.getTime();
            return ms >= fromMs && ms <= toMs;
        });
    }

    // Legacy sort-key based filtering (used internally when no date range)
    if (sortKey === 'soonest') {
        const now = new Date();
        return list.filter((event) => {
            const value = getEventDateValue(event);
            return !value || value >= now;
        });
    }
    if (sortKey === 'past') {
        const now = new Date();
        return list.filter((event) => {
            const value = getEventDateValue(event);
            return Boolean(value && value < now);
        });
    }
    return list;
}

function categoryEmptyCopy(categoryValue) {
    const label = getProfileCategoryLabel(categoryValue);
    const norm = normalizeLabelForCopy(label);

    if (!norm) {
        return {
            title: "No posts",
            subtitle: "This user doesn’t have any posts yet.",
        };
    }

    return {
        title: `No ${label}`,
        subtitle: `This user doesn’t have any ${norm} posts yet.`,
    };
}

function matchesCategoryFilter(postCatRaw, selected) {
    const selectedKey = normalizeCategoryKey(selected);
    if (!selectedKey) return true;

    const postKey = normalizeCategoryKey(postCatRaw);

    if (selectedKey === 'recommendations') {
        return postKey === 'recommendations' || postKey === 'recommendations-tips' || postKey === 'recommendation';
    }
    if (selectedKey === 'tips') {
        return postKey === 'tips' || postKey === 'recommendations-tips';
    }
    if (selectedKey === 'help-requests') {
        return (
            postKey === 'help-requests' ||
            postKey === 'volunteer-requests' ||
            postKey === 'volunteer-help' ||
            postKey === 'volunteer-help-requests' ||
            postKey === 'volunteer-and-help-requests'
        );
    }
    if (selectedKey === 'volunteers') {
        return (
            postKey === 'volunteers' ||
            postKey === 'volunteer-requests' ||
            postKey === 'volunteer-help' ||
            postKey === 'volunteer-help-requests' ||
            postKey === 'volunteer-and-help-requests'
        );
    }

    return postKey === selectedKey;
}


function sortPosts(list, sortKey) {
    const out = Array.isArray(list) ? list.slice() : [];
    if (sortKey === 'popular') {
        out.sort((a, b) => Number(b?.likesCount ?? b?.likes_count ?? b?.likes ?? 0) - Number(a?.likesCount ?? a?.likes_count ?? a?.likes ?? 0));
        return out;
    }
    out.sort((a, b) => new Date(b?.posted_at || b?.date_created || 0) - new Date(a?.posted_at || a?.date_created || 0));
    return out;
}

// ============================
// Post Preview Dialog (opens post in overlay instead of navigating away)
// Matches ArtistProfilePage pattern
// ============================
function detectPostKind(post) {
    if (!post) return 'user';
    // Check explicit postType field (e.g. from engagement/comments API)
    const pType = String(post.postType || '').toLowerCase();
    if (pType === 'business') return 'business';
    if (pType === 'artist') return 'artist';
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

function PostDetailDialog({ post, open, onClose, user, scrollToCommentId = null, highlightCommentId = null }) {
    const postKind = detectPostKind(post);
    const pdTheme = useTheme();
    const pdIsMobile = useMediaQuery(pdTheme.breakpoints.down('md'));

    const postContent = post ? (
        <>
            {postKind === 'artist' && (
                <MusicPostDetailPanel post={post} user={user} onLocationClick={() => {}} scrollToCommentId={scrollToCommentId} highlightCommentId={highlightCommentId} />
            )}
            {postKind === 'business' && (
                <BusinessPostDetailModal embedded post={post} user={user} onViewPage={() => {}} onShare={() => {}} onLocationClick={() => {}} scrollToCommentId={scrollToCommentId} highlightCommentId={highlightCommentId} />
            )}
            {postKind === 'user' && (
                <PostPage embedded post={post} user={user} hideCategoryChip={false} onLocationClick={() => {}} scrollToCommentId={scrollToCommentId} highlightCommentId={highlightCommentId} />
            )}
        </>
    ) : null;

    // ── Mobile: fullscreen Drawer sliding from right (matches CommunityPage) ──
    if (pdIsMobile) {
        return (
            <Drawer
                anchor="right"
                open={open}
                onClose={onClose}
                ModalProps={{ keepMounted: true }}
                slotProps={{ backdrop: { sx: { bgcolor: 'transparent' } } }}
                transitionDuration={{ enter: 280, exit: 220 }}
                PaperProps={{
                    sx: {
                        width: '100vw',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        flexDirection: 'column',
                        pb: 0,
                        height: '100%',
                        top: 0,
                    },
                }}
            >
                {/* Sticky header bar with back button */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1.5,
                        py: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: (t) => alpha(t.palette.background.paper, 0.85),
                        backdropFilter: 'saturate(140%) blur(10px)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        paddingTop: 'max(8px, env(safe-area-inset-top))',
                    }}
                >
                    <IconButton onClick={onClose} size="small" sx={{ mr: 0.5 }}>
                        <ArrowBackRoundedIcon />
                    </IconButton>
                    <Typography sx={{ fontWeight: 800, fontSize: 16, flex: 1 }}>
                        Post
                    </Typography>
                </Box>

                {/* Content area */}
                <Box
                    sx={{
                        flex: 1,
                        minHeight: 0,
                        overflow: 'auto',
                        WebkitOverflowScrolling: 'touch',
                        overscrollBehavior: 'contain',
                        bgcolor: 'background.paper',
                    }}
                >
                    {postContent}
                </Box>
            </Drawer>
        );
    }

    // ── Desktop: centered Dialog (original behavior) ──
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            disableScrollLock
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    height: '92vh',
                    maxHeight: '92vh',
                    overflow: 'hidden',
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
        >
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
                    px: 2,
                    bgcolor: alpha(t.palette.background.paper, 0.95),
                    backdropFilter: 'blur(8px)',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    zIndex: 10,
                })}
            >
                <IconButton
                    onClick={onClose}
                    size="small"
                    aria-label="Close"
                    sx={{
                        color: 'text.secondary',
                        '&:hover': { bgcolor: (t) => alpha(t.palette.text.primary, 0.08) },
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>
            {post && (
                <Box sx={{ position: 'absolute', top: 48, left: 0, right: 0, bottom: 0, overflowY: 'auto', overflowX: 'hidden' }}>
                    {postContent}
                </Box>
            )}
        </Dialog>
    );
}

/* ─── Seller Reviews Popup ─────────────────────────────────────────────
   Self-contained dialog that fetches seller reviews by sellerId.
   Used when clicking a marketplace review from the Reviews tab so the
   user stays on the current page instead of navigating away.
   ─────────────────────────────────────────────────────────────────────── */

function ListingDetailDialog({ listingId, open, onClose, user, onMessage, onEdit, initialTab, highlightReviewId, highlightReviewerId, isDesktopLayout = true }) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            fullScreen={!isDesktopLayout}
            disableScrollLock
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
            slotProps={{
                backdrop: {
                    sx: {
                        bgcolor: (t) => alpha(t.palette.common.black, 0.55),
                        backdropFilter: 'blur(4px)',
                    },
                },
            }}
        >
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
                    px: 2,
                    bgcolor: alpha(t.palette.background.paper, 0.95),
                    backdropFilter: 'blur(8px)',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    zIndex: 10,
                })}
            >
                <IconButton
                    onClick={onClose}
                    size="small"
                    aria-label="Close"
                    sx={{
                        color: 'text.secondary',
                        '&:hover': { bgcolor: (t) => alpha(t.palette.text.primary, 0.08) },
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>
            {listingId && (
                <Box sx={{ position: 'absolute', top: 48, left: 0, right: 0, bottom: 0, overflowY: 'auto', overflowX: 'hidden' }}>
                    <MarketplaceListingDetailPanel
                        listingId={listingId}
                        user={user}
                        onClearSelection={onClose}
                        onMessage={onMessage}
                        onEdit={onEdit}
                        initialTab={initialTab}
                        highlightReviewId={highlightReviewId}
                        highlightReviewerId={highlightReviewerId}
                    />
                </Box>
            )}
        </Dialog>
    );
}

export default function UserProfilePage({ me }) {
    const { handleOrId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const auth = useAuth();
    const chromeTop = useChromeTop();

    const returningFromPostRef = useRef(false);

// Pre-scroll: React Router may preserve scroll position between routes.
// Start at the top unless this navigation is a "Return to Profile" restore flow.
    useLayoutEffect(() => {
        if (!handleOrId) return;

        let shouldRestore = false;
        try {
            shouldRestore = sessionStorage.getItem(`ll:profile:${handleOrId}:restore`) === '1';
            if (!shouldRestore && typeof handleOrId === 'string') {
                const norm = handleOrId.replace(/^@/, '');
                shouldRestore = sessionStorage.getItem(`ll:profile:${norm}:restore`) === '1';
            }
            if (!shouldRestore) {
                shouldRestore = !!location?.state?.restoreProfile;
            }
        } catch {
            /* ignore */
        }

        returningFromPostRef.current = shouldRestore;

        if (!shouldRestore) {
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

            // Also schedule a deferred reset — React Router and child components
            // can nudge scroll position after this synchronous layout effect.
            const rafId = requestAnimationFrame(() => {
                window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            });

            // allow the "forceTop" guard to run once after data loads
            try {
                sessionStorage.removeItem(`ll:profile:${handleOrId}:forcedTop`);
            } catch {
                /* ignore */
            }

            return () => cancelAnimationFrame(rafId);
        }

        // allow the “forceTop” guard to run once after data loads
        try {
            sessionStorage.removeItem(`ll:profile:${handleOrId}:forcedTop`);
        } catch {
            /* ignore */
        }
    }, [handleOrId]);

    // ── TOKEN_EXPIRED: redirect to login ──
    useEffect(() => {
        const onExpired = () => navigate('/login', { replace: true });
        window.addEventListener('auth:token-expired', onExpired);
        return () => window.removeEventListener('auth:token-expired', onExpired);
    }, [navigate]);


    useEffect(() => {
        freshProfileVisitRef.current = !returningFromPostRef.current;

        if (returningFromPostRef.current) return;

        try {
            const candidates = [
                handleOrId,
                typeof handleOrId === 'string' ? handleOrId.replace(/^@+/, '') : handleOrId,
            ].filter(Boolean);

            candidates.forEach((key) => {
                sessionStorage.removeItem(`ll:profile:${key}:restore`);
                sessionStorage.removeItem(`ll:profile:${key}:posts:expanded`);
                sessionStorage.removeItem(`ll:profile:${key}:posts:scroll`);
                sessionStorage.removeItem(`ll:profile:${key}:rightRailView`);
                sessionStorage.removeItem(`ll:profile:${key}:rightRail:tab`);
                sessionStorage.removeItem(`ll:profile:${key}:winY`);
                sessionStorage.removeItem(`ll:profilePageState:${key}`);
            });
        } catch {
            /* ignore */
        }

        restoredRightRailViewsRef.current = new Set();
        setRightRailView('community');
    }, [handleOrId]);

    const [pageFadeIn, setPageFadeIn] = useState(false);
    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            setReduceMotion(false);
            return undefined;
        }
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const apply = () => setReduceMotion(!!mq.matches);
        apply();

        if (typeof mq.addEventListener === 'function') {
            mq.addEventListener('change', apply);
            return () => mq.removeEventListener('change', apply);
        }

        // Safari fallback
        mq.addListener(apply);
        return () => mq.removeListener(apply);
    }, []);

    useEffect(() => {
        // Trigger a subtle fade on route loads (and when switching to a different user's profile)
        if (reduceMotion) {
            setPageFadeIn(true);
            return undefined;
        }
        setPageFadeIn(false);

        if (typeof window === 'undefined') {
            setPageFadeIn(true);
            return undefined;
        }

        const t = window.setTimeout(() => setPageFadeIn(true), 10);
        return () => window.clearTimeout(t);
    }, [handleOrId, reduceMotion]);


    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [activity, setActivity] = useState(null);
    const [error, setError] = useState('');
    const [rawLoadError, setRawLoadError] = useState(null);

    const [editMode, setEditMode] = useState(false);
    // Tracks whether the user has actually interacted with any field since opening edit.
    // Prevents false "discard changes?" prompts from normalization mismatches.
    const userTouchedEditRef = useRef(false);

    // About
    const [bioDraft, setBioDraft] = useState('');
    const [relationship, setRelationship] = useState('');
    const [birthday, setBirthday] = useState('');
    const [homeCity, setHomeCity] = useState('');
    const [homeCounty, setHomeCounty] = useState('');

    // Account privacy (public vs followers-only)
    const [accountPrivacyDraft, setAccountPrivacyDraft] = useState('public');

    // Country / State (for non-Alabama residents)
    const [countryDraft, setCountryDraft] = useState('US');
    const [stateDraft, setStateDraft] = useState('AL');
    const [alabamaResidentDraft, setAlabamaResidentDraft] = useState(true);

    // Contact
    const [contact, setContact] = useState({
        phone: '',
        email: '',
        facebook: '',
        instagram: '',
        tiktok: '',
        x: '',
        linkedin: '',
        website: '',
        snapchat: '',
    });

    // Identity: bio
    const [profileBioDraft, setProfileBioDraft] = useState('');

    // History
    const [workHistory, setWorkHistory] = useState([]);
    const [eduHistory, setEduHistory] = useState([]);
    const [workOpen, setWorkOpen] = useState(false);
    const [eduOpen, setEduOpen] = useState(false);

    // Social
    const [isFollowing, setIsFollowing] = useState(false);
    const [followRequested, setFollowRequested] = useState(false);
    const [canViewAccount, setCanViewAccount] = useState(true);

    // Moderation flags (viewer -> this profile)
    const [blockedByMe, setBlockedByMe] = useState(false);
    const [blockedByOther, setBlockedByOther] = useState(false);
    const [hiddenPostsByMe, setHiddenPostsByMe] = useState(false);

    // Refresh trigger for Followers/Following section when follow state changes
    const [followsRefreshNonce, setFollowsRefreshNonce] = useState(0);
    const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });

    const [postsRefreshNonce, setPostsRefreshNonce] = useState(0);

    // ── Mobile detection ─────────────────────────────────────────────────────
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // ── Mobile Activity fullscreen dialog state (matching ArtistProfilePage) ──
    const [mobileActivityOpen, setMobileActivityOpen] = useState(false);
    const [mobileActivityFilterOpen, setMobileActivityFilterOpen] = useState(false);
    const [mobileActivitySearchVisible, setMobileActivitySearchVisible] = useState(false);
    const [mobileActivitySubTab, setMobileActivitySubTab] = useState(0); // 0=Posts, 1=Comments, 2=Likes, 3=Reposts

    // ── Mobile profile section tabs (About / Activity / Photos) ──
    const [mobileProfileTab, setMobileProfileTab] = useState(0); // 0=About, 1=Activity, 2=Photos

    // ── Events tab state ────────────────────────────────────────────────────
    const [rightRailView, setRightRailView] = useState('community'); // 'community' | 'events' | 'jobs' | 'services' | 'marketplace' | 'reviews'
    const [communitySearch, setCommunitySearch] = useState('');
    const [communitySearchTerm, setCommunitySearchTerm] = useState('');
    const clearCommunityFiltersRef = useRef(null);
    const [profileEvents, setProfileEvents] = useState([]);
    const [profileEventsLoading, setProfileEventsLoading] = useState(false);
    const [profileHasEvents, setProfileHasEvents] = useState(false);
    // Engagement counts from profile-check (stable totals for top-level tab + sub-tab badges)
    const [eventActivityCounts, setEventActivityCounts] = useState(null); // { posted, liked, commented, reposted, rsvp, interested }
    const [eventsCategory, setEventsCategory] = useState('');
    const [eventsSort, setEventsSort] = useState('soonest');
    const [eventsDateFrom, setEventsDateFrom] = useState('');
    const [eventsDateTo, setEventsDateTo] = useState('');
    const [eventsSearch, setEventsSearch] = useState('');
    const [eventsSearchTerm, setEventsSearchTerm] = useState('');
    const [eventsView, setEventsView] = useState('all'); // 'all' | 'going' | 'interested' | 'hosted'
    const [eventSubTab, setEventSubTab] = useState(0); // 0=Events, 1=Comments, 2=Likes, 3=Reposts
    const [eventEngagementComments, setEventEngagementComments] = useState([]); // grouped comment entries for Comments sub-tab
    const [eventCommentsLoading, setEventCommentsLoading] = useState(false);
    const eventsScrollRef = useRef(null);
    const jobsScrollRef = useRef(null);
    const servicesScrollRef = useRef(null);
    const marketplaceScrollRef = useRef(null);
    const reviewsScrollRef = useRef(null);
    const EVENTS_PAGE_SIZE = 25;
    const [eventsRenderCount, setEventsRenderCount] = useState(EVENTS_PAGE_SIZE);
    const eventsSentinelRef = useRef(null);

    // ── Jobs tab state ──────────────────────────────────────────────────────
    const [profileJobs, setProfileJobs] = useState([]);
    const [profileJobsLoading, setProfileJobsLoading] = useState(false);
    const [profileHasJobs, setProfileHasJobs] = useState(false);
    const [jobsCategory, setJobsCategory] = useState('');
    const [jobsSort, setJobsSort] = useState('newest');
    const [jobsSearch, setJobsSearch] = useState('');
    const [jobsSearchTerm, setJobsSearchTerm] = useState('');
    const JOBS_PAGE_SIZE = 25;
    const [jobsRenderCount, setJobsRenderCount] = useState(JOBS_PAGE_SIZE);
    const jobsSentinelRef = useRef(null);

    // ── Services tab state ──────────────────────────────────────────────────
    const [profileServices, setProfileServices] = useState([]);
    const [profileServicesLoading, setProfileServicesLoading] = useState(false);
    const [profileHasServices, setProfileHasServices] = useState(false);
    // Stable counts from profile-check for top-level tab badge
    const [serviceActivityCounts, setServiceActivityCounts] = useState(null); // { listings, requests }
    const [servicesCategory, setServicesCategory] = useState('');
    const [servicesSearch, setServicesSearch] = useState('');
    const [servicesSearchTerm, setServicesSearchTerm] = useState('');
    const [servicesSubTab, setServicesSubTab] = useState('services'); // 'services' | 'requests'
    const [servicesView, setServicesView] = useState('offered'); // 'offered' | 'favorites'
    const [profileFavServices, setProfileFavServices] = useState([]);
    const [profileFavServicesLoading, setProfileFavServicesLoading] = useState(false);
    const [profileServiceRequests, setProfileServiceRequests] = useState([]);
    const [profileServiceRequestsLoading, setProfileServiceRequestsLoading] = useState(false);
    const [profileHasServiceRequests, setProfileHasServiceRequests] = useState(false);
    const SERVICES_PAGE_SIZE = 25;
    const [servicesRenderCount, setServicesRenderCount] = useState(SERVICES_PAGE_SIZE);
    const servicesSentinelRef = useRef(null);

    // ── Service Request Detail Popup state ───────────────────────────────────
    const [selectedRequestPopup, setSelectedRequestPopup] = useState(null);
    const [requestPopupResponses, setRequestPopupResponses] = useState([]);
    const [requestPopupResponsesLoading, setRequestPopupResponsesLoading] = useState(false);
    const [requestPopupIsRequester, setRequestPopupIsRequester] = useState(false);
    const [requestPopupMyResponse, setRequestPopupMyResponse] = useState(null);
    const [editRequestModalOpen, setEditRequestModalOpen] = useState(false);
    const [editingRequestItem, setEditingRequestItem] = useState(null);
    const [serviceLimitDialog, setServiceLimitDialog] = useState({ open: false, title: '', message: '' });

    // ── Marketplace tab state ───────────────────────────────────────────────
    const [profileListings, setProfileListings] = useState([]);
    const [profileListingsLoading, setProfileListingsLoading] = useState(false);
    const [profileHasListings, setProfileHasListings] = useState(false);
    // Stable counts from profile-check for top-level tab badge
    const [marketplaceActivityCounts, setMarketplaceActivityCounts] = useState(null); // { listings, favorited, reposted, messages }
    const [listingsCategory, setListingsCategory] = useState('');
    const [listingsSort, setListingsSort] = useState('newest');
    const [listingsSearch, setListingsSearch] = useState('');
    const [listingsSearchTerm, setListingsSearchTerm] = useState('');
    const LISTINGS_PAGE_SIZE = 25;
    const [listingsRenderCount, setListingsRenderCount] = useState(LISTINGS_PAGE_SIZE);
    const listingsSentinelRef = useRef(null);
    const [listingsRefreshNonce, setListingsRefreshNonce] = useState(0);
    const [listingFlagTarget, setListingFlagTarget] = useState(null);
    const [listingSnackMsg, setListingSnackMsg] = useState('');
    const [selectedListingId, setSelectedListingId] = useState(null);

    // ── Seller Reviews Popup state (for clicking marketplace reviews from Reviews tab) ──
    const [sellerReviewsPopup, setSellerReviewsPopup] = useState({ open: false, sellerId: null, highlightReviewId: null, highlightReviewerId: null });

    // ── Marketplace sub-tab state ────────────────────────────────────────────
    const [marketplaceSubTab, setMarketplaceSubTab] = useState('listings'); // 'listings' | 'reposts' | 'seller_info'

    // Seller reviews (reviews FROM others ABOUT this profile user as a seller)
    const [sellerReviews, setSellerReviews] = useState([]);
    const [sellerReviewStats, setSellerReviewStats] = useState({ avgRating: null, totalCount: 0 });
    const [sellerStats, setSellerStats] = useState({ totalListings: 0, soldListings: 0, activeListings: 0, memberSince: null });
    const [sellerReviewsLoading, setSellerReviewsLoading] = useState(false);

    // Review photo lightbox for seller info sections
    const [sellerRevLbOpen, setSellerRevLbOpen] = useState(false);
    const [sellerRevLbPhotos, setSellerRevLbPhotos] = useState([]);
    const [sellerRevLbIndex, setSellerRevLbIndex] = useState(0);
    const openSellerRevPhotoLb = (photos, index) => { setSellerRevLbPhotos(photos); setSellerRevLbIndex(index); setSellerRevLbOpen(true); };

    // Highlight a specific seller review (from notification navigation)
    const [highlightSellerReviewId, setHighlightSellerReviewId] = useState(
        () => Number(location?.state?.highlightSellerReviewId || 0) || null
    );

    // Pending mobile seller review popup — waits for profile to load before opening
    const [pendingMobileSellerReview, setPendingMobileSellerReview] = useState(null);

    // Boost highlighted seller review to the top so it's immediately visible
    const sortedSellerReviews = useMemo(() => {
        if (!highlightSellerReviewId) return sellerReviews;
        const idx = sellerReviews.findIndex((r) => Number(r.id) === Number(highlightSellerReviewId));
        if (idx <= 0) return sellerReviews; // already first or not found
        const copy = [...sellerReviews];
        const [target] = copy.splice(idx, 1);
        copy.unshift(target);
        return copy;
    }, [sellerReviews, highlightSellerReviewId]);

    // Marketplace reposts (listings this user has reposted)
    const [marketplaceReposts, setMarketplaceReposts] = useState([]);
    const [marketplaceRepostsLoading, setMarketplaceRepostsLoading] = useState(false);
    const [marketplaceRepostsTotal, setMarketplaceRepostsTotal] = useState(0);

    // ── Reviews tab state ───────────────────────────────────────────────────
    const [profileReviews, setProfileReviews] = useState([]);
    const [profileReviewsLoading, setProfileReviewsLoading] = useState(false);
    const [profileHasReviews, setProfileHasReviews] = useState(false);
    const [reviewsCounts, setReviewsCounts] = useState({ services: 0, businesses: 0, marketplace: 0 });
    const [reviewsType, setReviewsType] = useState('all'); // 'all' | 'services' | 'businesses' | 'marketplace'
    const REVIEWS_PAGE_SIZE = 25;
    const [reviewsRenderCount, setReviewsRenderCount] = useState(REVIEWS_PAGE_SIZE);
    const reviewsSentinelRef = useRef(null);
    const rightRailCardRef = useRef(null);
    const rightRailTabsRef = useRef(null);
    // When true, the forceTop scroll guards stop fighting user-initiated scrolls
    const userScrolledRef = useRef(false);
    // Back-to-top FAB visibility — shows when scrolled past the right-rail tabs
    const [showBackToTop, setShowBackToTop] = useState(false);

    // Compute a safe value for MUI Tabs — returns false when the desired tab
    // hasn't rendered yet (data still loading), which MUI accepts without error.
    // rightRailView itself is set immediately so content panels render and scroll refs attach.
    const safeTabValue = useMemo(() => {
        if (rightRailView === 'community') return 'community';
        if (rightRailView === 'events' && profileHasEvents) return 'events';
        if (rightRailView === 'jobs' && profileHasJobs) return 'jobs';
        if (rightRailView === 'services' && profileHasServices) return 'services';
        if (rightRailView === 'marketplace' && profileHasListings) return 'marketplace';
        if (rightRailView === 'reviews' && profileHasReviews) return 'reviews';
        return false;
    }, [rightRailView, profileHasEvents, profileHasJobs, profileHasServices, profileHasListings, profileHasReviews]);

    // ── Edit/Delete modals for Events & Jobs ────────────────────────────────
    const [editingEvent, setEditingEvent] = useState(null);
    const [editEventOpen, setEditEventOpen] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [editJobOpen, setEditJobOpen] = useState(false);


    const [editingListing, setEditingListing] = useState(null);
    const [createListingOpen, setCreateListingOpen] = useState(false);

    const [deleteJobTarget, setDeleteJobTarget] = useState(null);
    const [isDeletingJob, setIsDeletingJob] = useState(false);
    const [renewTarget, setRenewTarget] = useState(null);
    const [renewDays, setRenewDays] = useState(30);
    const [isRenewing, setIsRenewing] = useState(false);
    const [renewError, setRenewError] = useState(null);
    const [eventsRefreshNonce, setEventsRefreshNonce] = useState(0);
    const [jobsRefreshNonce, setJobsRefreshNonce] = useState(0);
    const [servicesRefreshNonce, setServicesRefreshNonce] = useState(0);

    // Staged media
    const [pendingAvatar, setPendingAvatar] = useState(null);
    const [deleteAvatar, setDeleteAvatar] = useState(false);
    const [pendingCover, setPendingCover] = useState(null);
    const [deleteCover, setDeleteCover] = useState(false);
    const [profileShareOpen, setProfileShareOpen] = useState(false);
    const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);

    // Quick message dialog state
    const [quickMsgOpen, setQuickMsgOpen] = useState(false);
    const [profileReportOpen, setProfileReportOpen] = useState(false);

    // Determine whether the Edit Profile dialog has any unsaved changes.


// Crop
    const [cropOpen, setCropOpen] = useState(false);
    const [cropSrc, setCropSrc] = useState('');
    const [cropRound, setCropRound] = useState(false); // true = avatar
// Dialogs
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [discardOpen, setDiscardOpen] = useState(false);
    const [photoChangeWarningOpen, setPhotoChangeWarningOpen] = useState(false);
    const [photoChangeWarningKind, setPhotoChangeWarningKind] = useState(null); // 'avatar' or 'cover'
    const [pendingCoverBlob, setPendingCoverBlob] = useState(null); // temporarily holds cover blob until user confirms
    const [pendingAvatarBlob, setPendingAvatarBlob] = useState(null); // temporarily holds avatar blob until user confirms
    const [confirmDeleteCoverOpen, setConfirmDeleteCoverOpen] = useState(false);

    // Privacy
    const [privacy, setPrivacy] = useState({});
    const [privacyAnchor, setPrivacyAnchor] = useState(null);
    const [privacyFor, setPrivacyFor] = useState(null);

    const [profileSnack, setProfileSnack] = useState('');

    // ── Success confirmation snackbar ──
    const { showSuccess, snackbarProps: successSnackbarProps } = useSuccessSnackbar();

    // Post preview dialog (opens post detail in overlay like ArtistProfilePage)
    const [previewPost, setPreviewPost] = useState(null);
    const [previewScrollToCommentId, setPreviewScrollToCommentId] = useState(null);
    const [previewHighlightCommentId, setPreviewHighlightCommentId] = useState(null);

    // "View All" control for Follows section (handled via ref)
    const followsRef = useRef(null);

    const sidebarHeaderRef = useRef(null);
    const [sidebarHeaderHeight, setSidebarHeaderHeight] = useState(0);
    const [sidebarStickyTop, setSidebarStickyTop] = useState(16);

    // Live moderation updates while viewing a profile (from UserCardPopover actions)
    useEffect(() => {
        const onHidden = (e) => {
            const uid = Number(e?.detail?.userId || 0);
            if (!uid) return;
            const pid = Number(profile?.id || 0);
            if (pid && uid === pid) {
                setHiddenPostsByMe(Boolean(e?.detail?.hidden));
                setPostsRefreshNonce((n) => n + 1);
            }
        };

        const onBlocked = (e) => {
            const uid = Number(e?.detail?.userId || 0);
            if (!uid) return;
            const pid = Number(profile?.id || 0);
            if (pid && uid === pid) {
                setBlockedByMe(Boolean(e?.detail?.blocked));
                // If blocked, collapse expanded view and clear any activity lists immediately.
                if (Boolean(e?.detail?.blocked)) {
                    setPostsExpanded(false);
                }
                setPostsRefreshNonce((n) => n + 1);
            }
        };

        window.addEventListener('ll:user:hidden-changed', onHidden);
        window.addEventListener('ll:user:blocked-changed', onBlocked);

        return () => {
            window.removeEventListener('ll:user:hidden-changed', onHidden);
            window.removeEventListener('ll:user:blocked-changed', onBlocked);
        };
    }, [profile?.id]);


    // Expanded Community Posts page
    const [postsExpanded, setPostsExpanded] = useState(false);
    const [expandedTab, setExpandedTab] = useState(0); // 0=Posts, 1=Comments, 2=Likes, 3=Reposts
    // Expanded Events page
    const [eventsExpanded, setEventsExpanded] = useState(false);
    const [hoveredId, setHoveredId] = useState(null);
    const [userAnchor, setUserAnchor] = useState(null);
    const [userForCard, setUserForCard] = useState(null);
    const [shareOpen, setShareOpen] = useState(false);
    const [sharePost, setSharePost] = useState(null);
    const [shareContentType, setShareContentType] = useState('post'); // 'post' | 'job'

    // Active account context (for job save/share)
    const { activeAccount, activeBusinessId, activeArtistId } = useActiveAccount();
    // Stable key that changes on account switch — drives data re-fetches so viewer state
    // (isFavorited, isReposted, viewerSaved, isOwner) is correct for the active account.
    const accountCacheKey = activeBusinessId ? `biz:${activeBusinessId}` : activeArtistId ? `art:${activeArtistId}` : 'personal';
    const accountKeyRef = useRef(accountCacheKey);
    accountKeyRef.current = accountCacheKey;

    // Location map popup (Profile: clicking the location line)
    // UI requirement: show ONE approximate pin for the user's location (city/county), not per-post markers.
    const [locationMapOpen, setLocationMapOpen] = useState(false);

    const locationMapRef = useRef(null);

    const openLocationMap = useCallback(() => {
        setLocationMapOpen(true);
    }, []);

    const closeLocationMap = useCallback(() => {
        setLocationMapOpen(false);
    }, []);

    const feedPostsRef = useRef([]);

    const handleProfileLocationCapture = useCallback((e) => {
        const t = e?.target;
        if (!t || typeof t.closest !== 'function') return;

        // Location line in PostCard uses aria-label + role=button.
        const locNode = t.closest('[aria-label="View this location on the map"]');
        if (!locNode) return;

        e.preventDefault();
        e.stopPropagation();
        openLocationMap();
    }, [openLocationMap]);

    // Scroll ref for the expanded posts area
    const postsScrollRef = useRef(null);


    // Prevent the entire page from scrolling behind the expanded Community Activity overlay.
    // (The overlay has its own internal scroll area.)
    useEffect(() => {
        if (!postsExpanded && !eventsExpanded) return undefined;
        if (typeof document === 'undefined') return undefined;

        const prevBodyOverflow = document.body.style.overflow;
        const prevHtmlOverflow = document.documentElement.style.overflow;

        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = prevBodyOverflow;
            document.documentElement.style.overflow = prevHtmlOverflow;
        };
    }, [postsExpanded, eventsExpanded]);

    // Desktop layout: keep BOTH columns pinned to the viewport and use internal scroll areas.
// This keeps the profile loading at the top and avoids page-level scrolling on desktop.
    const pageRef = useRef(null);
    const gridRef = useRef(null);
    const leftColRef = useRef(null);
    const rightColRef = useRef(null);
    const rightRailWrapRef = useRef(null);
    const rightRailContentAreaRef = useRef(null);


    // Find the first scrollable descendant inside a container (used to preserve right-rail scroll position)
    const findScrollableDescendant = (root) => {
        if (!root) return null;
        if (typeof window === 'undefined') return null;
        const isHTMLElement = (el) => {
            try {
                return typeof HTMLElement !== 'undefined' ? el instanceof HTMLElement : !!el?.nodeType;
            } catch {
                return !!el?.nodeType;
            }
        };

        const queue = [];
        if (isHTMLElement(root)) queue.push(root);

        while (queue.length) {
            const el = queue.shift();
            if (!el || !isHTMLElement(el)) continue;

            try {
                const style = window.getComputedStyle(el);
                const oy = style?.overflowY;
                const canScroll = (oy === 'auto' || oy === 'scroll') && (el.scrollHeight - el.clientHeight > 2);
                if (canScroll) return el;
            } catch {
                // ignore style errors
            }

            const kids = el.children ? Array.from(el.children) : [];
            for (const k of kids) queue.push(k);
        }

        return null;
    };

    const [isDesktopLayout, setIsDesktopLayout] = useState(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
        return !!window.matchMedia('(min-width:900px)').matches;
    });
    const [rightScrollBoxHeight, setRightScrollBoxHeight] = useState(680);
    const desktopHeightsLockedRef = useRef(false);

    /** Scroll the page so the right-rail tabs are at the top of the viewport.
     *  Tabs/filters are no longer position:sticky, so getBoundingClientRect
     *  reliably returns the true document position. */
    const scrollRightRailToTop = useCallback(() => {
        // Disable the initial-load forceTop guards so they don't fight this scroll
        userScrolledRef.current = true;

        // Reset any internal scroll containers within the right rail
        const card = rightRailCardRef.current;
        if (card) {
            const scrollers = card.querySelectorAll('[data-profile-posts-scroll], .profile-posts-scroller');
            scrollers.forEach((s) => { if (s.scrollTop > 0) s.scrollTop = 0; });
        }

        // Scroll the window so the top-level tabs bar is at the top of the viewport.
        // Now that tabs/filters are not position:sticky, getBoundingClientRect
        // returns the true document position reliably.
        const doScroll = () => {
            const anchor = rightRailTabsRef.current || rightRailCardRef.current || rightColRef?.current;
            if (anchor) {
                const rect = anchor.getBoundingClientRect();
                const scrollY = window.scrollY || window.pageYOffset || 0;
                window.scrollTo({ top: Math.max(0, rect.top + scrollY), left: 0, behavior: 'auto' });
            } else {
                window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            }
        };

        doScroll();
        requestAnimationFrame(doScroll);
    }, []);

    // Show/hide the back-to-top FAB based on scroll position.
    // Button appears once the user has scrolled past the right-rail tabs area.
    useEffect(() => {
        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                ticking = false;
                const tabsEl = rightRailTabsRef.current || rightRailCardRef.current;
                if (!tabsEl) { setShowBackToTop(false); return; }
                const rect = tabsEl.getBoundingClientRect();
                // Show button when the tabs bar has scrolled above the viewport
                setShowBackToTop(rect.bottom < 0);
            });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);


// Slight bottom gutter so the last card shadow isn’t clipped
    useEffect(() => {
        const mq = window.matchMedia('(min-width:900px)');
        const apply = () => setIsDesktopLayout(!!mq.matches);
        apply();
        if (typeof mq.addEventListener === 'function') {
            mq.addEventListener('change', apply);
            return () => mq.removeEventListener('change', apply);
        }
        mq.addListener(apply);
        return () => mq.removeListener(apply);
    }, []);


    useLayoutEffect(() => {
        if (!isDesktopLayout || postsExpanded || eventsExpanded) return;

        // Fix the right rail to a stable height so the Community Activity card doesn't "pulse" as content loads.
        // Only compute once per desktop session.
        if (desktopHeightsLockedRef.current && rightScrollBoxHeight) return;

        const minH = 620;
        const maxH = 1200;

        // Use viewport height minus header/nav
        const raw = window.innerHeight - 100; // header + small breathing room
        const h = Math.max(minH, Math.min(maxH, Math.floor(raw)));

        setRightScrollBoxHeight(h);
        desktopHeightsLockedRef.current = true;
    }, [isDesktopLayout, postsExpanded, eventsExpanded, rightScrollBoxHeight]);


    // Keep the left rail the same total height as the right rail on desktop.
    // Also dynamically calculate sticky top so the entire sidebar scrolls into view
    // before sticking (matches BusinessPublicPage behavior).
    useLayoutEffect(() => {
        if (!isDesktopLayout || postsExpanded || eventsExpanded) return;

        const calculateStickyTop = () => {
            const el = sidebarHeaderRef.current;
            if (!el) return;
            const h = Math.ceil(el.getBoundingClientRect().height || 0);
            if (Number.isFinite(h) && h > 0) setSidebarHeaderHeight(h);

            const sidebarHeight = el.getBoundingClientRect().height;
            const viewportHeight = window.innerHeight;
            const padding = 16;

            if (sidebarHeight + padding * 2 <= viewportHeight) {
                setSidebarStickyTop(padding);
            } else {
                setSidebarStickyTop(viewportHeight - sidebarHeight - padding);
            }
        };

        let resizeObserver = null;
        if (sidebarHeaderRef.current && typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(() => {
                calculateStickyTop();
            });
            resizeObserver.observe(sidebarHeaderRef.current);
        }

        const raf = requestAnimationFrame(() => { calculateStickyTop(); });
        const delayTimer = setTimeout(() => { calculateStickyTop(); }, 300);

        window.addEventListener('scroll', calculateStickyTop, { passive: true });
        window.addEventListener('resize', calculateStickyTop, { passive: true });
        return () => {
            cancelAnimationFrame(raf);
            clearTimeout(delayTimer);
            window.removeEventListener('scroll', calculateStickyTop);
            window.removeEventListener('resize', calculateStickyTop);
            if (resizeObserver) resizeObserver.disconnect();
        };
    }, [isDesktopLayout, postsExpanded, eventsExpanded, profile?.id, editMode]);

// Community post dialogs (profile page)

    const [editOpen, setEditOpen] = useState(false);
    const [editPostId, setEditPostId] = useState(null);

    // Shared delete confirm (used by Delete buttons on post cards)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deletePostId, setDeletePostId] = useState(null);

    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyPostId, setHistoryPostId] = useState(null);
    const [historyRows, setHistoryRows] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState('');

    const [markFoundOpen, setMarkFoundOpen] = useState(false);
    const [markFoundPostId, setMarkFoundPostId] = useState(null);
    const [markFoundPost, setMarkFoundPost] = useState(null);
    const [markFoundMessage, setMarkFoundMessage] = useState('');
    const [markFoundSaving, setMarkFoundSaving] = useState(false);
    const [markFoundError, setMarkFoundError] = useState('');

    const isMine = !!(me && profile && me.id === profile.id);

    const showPrivateProfileNotice = Boolean(
        profile && (Number(profile?.is_private || 0) === 1 || Boolean(profile?.isPrivateAccount)) && !isMine && !canViewAccount
    );

    const showBlockedProfileNotice = Boolean(!isMine && blockedByMe);
    const showHiddenPostsNotice = Boolean(!isMine && !showBlockedProfileNotice && hiddenPostsByMe);

    // Auto-open Edit Profile dialog when arriving from onboarding (personal
    // account flow). The onboarding flow navigates here with
    // `state: { openEditProfile: true }` so new users land directly in the
    // editor. We guard on isMine to prevent firing on someone else's profile,
    // and clear the state immediately so a page refresh doesn't re-trigger.
    const autoEditTriggeredRef = useRef(false);
    useEffect(() => {
        if (autoEditTriggeredRef.current) return;
        if (!location?.state?.openEditProfile) return;
        if (!isMine || !profile) return;
        autoEditTriggeredRef.current = true;
        setEditMode(true);
        // Clear the flag from history state so browser back/forward or a
        // reload won't re-open the editor.
        try {
            navigate(location.pathname, { replace: true, state: null });
        } catch { /* non-critical */ }
    }, [isMine, profile, location, navigate]);


    // Determine whether the Edit Profile dialog has any unsaved changes.



    // Username (handle) editing
    const [handleDraft, setHandleDraft] = useState('');
    const [handleStats, setHandleStats] = useState({ remaining: 0, nextAllowed: null });
    const [handleError, setHandleError] = useState('');

    // Name (first/last) editing
    const [firstNameDraft, setFirstNameDraft] = useState('');
    const [lastNameDraft, setLastNameDraft] = useState('');

    // Determine whether the Edit Profile dialog has any unsaved changes.
    const isEditDirty = useMemo(() => {
        if (!isMine || !profile || !editMode) return false;

        const norm = (v) => String(v ?? '').trim();
        const normLower = (v) => norm(v).toLowerCase();

        // Parse saved contact from social_json
        const savedSJ =
            profile?.social_json
                ? typeof profile.social_json === 'string'
                    ? (() => { try { return JSON.parse(profile.social_json); } catch { return {}; } })()
                    : profile.social_json
                : {};
        const savedC = (savedSJ && savedSJ.contact) || {};

        const contactChanged =
            norm(contact.facebook) !== norm(savedC.facebook) ||
            norm(contact.instagram) !== norm(savedC.instagram) ||
            norm(contact.tiktok) !== norm(savedC.tiktok) ||
            norm(contact.x) !== norm(savedC.x) ||
            norm(contact.linkedin) !== norm(savedC.linkedin);

        // Compute what alabamaResident *should* be based on saved profile
        const savedCountry = String(profile?.country || 'US').toUpperCase();
        const savedState = String(profile?.state || '').toUpperCase();
        const savedIsAlabama = savedCountry === 'US' && (savedState === 'AL' || savedState === '');

        const normCounty = (v) => norm(v).replace(/\s+county$/i, '');
        const locationChanged = alabamaResidentDraft
            ? (!savedIsAlabama ||
                normLower(homeCity) !== normLower(profile?.home_city) ||
                normCounty(homeCounty).toLowerCase() !== normCounty(profile?.home_county).toLowerCase())
            : (savedIsAlabama ||
                normLower(countryDraft) !== normLower(profile?.country || 'US') ||
                normLower(stateDraft) !== normLower(profile?.state || ''));

        const changed =
            norm(bioDraft).slice(0, 50) !== norm(profile?.bio).slice(0, 50) ||
            norm(relationship) !== norm(profile?.relationship) ||
            norm(birthday) !== norm(profile?.birthday) ||
            (accountPrivacyDraft === 'private' ? 1 : 0) !== (profile?.is_private ? 1 : 0) ||
            norm(firstNameDraft) !== norm(profile?.first_name) ||
            norm(lastNameDraft) !== norm(profile?.last_name) ||
            normLower(handleDraft).replace(/^@+/, '') !== normLower(profile?.handle).replace(/^@+/, '') ||
            norm(profileBioDraft).slice(0, 120) !== norm(profile?.profile_bio).slice(0, 120) ||
            Boolean(pendingAvatar) ||
            Boolean(deleteAvatar) ||
            Boolean(pendingCover) ||
            Boolean(deleteCover) ||
            contactChanged ||
            locationChanged;

        return Boolean(changed);
    }, [
        isMine,
        editMode,
        profile,
        bioDraft,
        relationship,
        birthday,
        homeCity,
        homeCounty,
        accountPrivacyDraft,
        firstNameDraft,
        lastNameDraft,
        handleDraft,
        pendingAvatar,
        deleteAvatar,
        pendingCover,
        deleteCover,
        contact,
        countryDraft,
        stateDraft,
        alabamaResidentDraft,
        profileBioDraft,
    ]);

    // ── Gallery photos state ──
    const [galleryPhotos, setGalleryPhotos] = useState([]); // items from DB: { id, url, kind }
    const [galleryPhotosEdit, setGalleryPhotosEdit] = useState([]); // edit-mode items: { id, url, file? }
    const [galleryPhotosLoaded, setGalleryPhotosLoaded] = useState(false);

    // ── Simple gallery lightbox (no comments — just photo viewing) ──
    const [galleryLightboxOpen, setGalleryLightboxOpen] = useState(false);
    const [galleryLightboxIdx, setGalleryLightboxIdx] = useState(0);

    // ── Reset all draft fields back to saved profile values ──
    const resetDraftsToProfile = useCallback(() => {
        if (!profile) return;
        setBioDraft(String(profile?.bio || '').slice(0, 50));
        setHandleDraft(profile?.handle || '');
        setFirstNameDraft(profile?.first_name || '');
        setLastNameDraft(profile?.last_name || '');
        setAccountPrivacyDraft(profile?.is_private ? 'private' : 'public');
        setCountryDraft(profile?.country || 'US');
        setStateDraft(profile?.state || '');
        setProfileBioDraft(String(profile?.profile_bio || '').slice(0, 120));
        setHomeCity(profile?.home_city || '');
        setHomeCounty(profile?.home_county || '');
        const pCountry = String(profile?.country || '').toUpperCase();
        const pState = String(profile?.state || '').toUpperCase();
        setAlabamaResidentDraft((pCountry === 'US' || pCountry === '') && (pState === 'AL' || pState === ''));
        // Reset contact
        const sj = profile?.social_json
            ? typeof profile.social_json === 'string'
                ? JSON.parse(profile.social_json)
                : profile.social_json
            : {};
        const c = (sj && sj.contact) || {};
        setContact({
            phone: c.phone || '',
            email: c.email || '',
            facebook: c.facebook || '',
            instagram: c.instagram || '',
            tiktok: c.tiktok || '',
            x: c.x || '',
            linkedin: c.linkedin || '',
            website: c.website || '',
            snapchat: c.snapchat || '',
        });
        // Reset work/education
        const parseJ = (v) => (typeof v === 'string' ? JSON.parse(v || '[]') : v || []);
        setWorkHistory(parseJ(profile?.work_history_json));
        setEduHistory(parseJ(profile?.education_history_json));
        // Reset gallery photos edit state
        if (galleryPhotosLoaded) {
            setGalleryPhotosEdit(galleryPhotos.map((p) => ({ id: String(p.id), url: p.url })));
        }
    }, [profile, galleryPhotos, galleryPhotosLoaded]);

    // Track first render to avoid blanking UI on background refreshes
    const initialLoadRef = useRef(true);

    // Listen for per-card action requests (dispatched by ProfilePostCard)
    useEffect(() => {
        const onReqEdit = (e) => {
            const pid = Number(e?.detail?.postId || e?.detail?.post?.id || 0);
            if (!pid) return;
            setEditPostId(pid);
            setEditOpen(true);
        };

        const onReqHistory = (e) => {
            const pid = Number(e?.detail?.postId || e?.detail?.post?.id || 0);
            if (!pid) return;
            setHistoryError('');
            setHistoryRows([]);
            setHistoryPostId(pid);
            setHistoryOpen(true);
        };

        const onReqDelete = (e) => {
            const pid = Number(e?.detail?.postId || e?.detail?.post?.id || e?.detail?.id || 0);
            if (!pid) return;
            setDeletePostId(pid);
            setDeleteConfirmOpen(true);
        };

        const onReqMarkFound = (e) => {
            const pid = Number(e?.detail?.postId || e?.detail?.post?.id || 0);
            if (!pid) return;
            setMarkFoundError('');
            setMarkFoundMessage('');
            setMarkFoundPostId(pid);
            setMarkFoundPost(e?.detail?.post || null);
            setMarkFoundOpen(true);
        };

        window.addEventListener('ll:communityPost:requestEdit', onReqEdit);
        window.addEventListener('ll:communityPost:requestHistory', onReqHistory);
        window.addEventListener('ll:communityPost:requestMarkFound', onReqMarkFound);
        window.addEventListener('ll:communityPost:requestDelete', onReqDelete);

        return () => {
            window.removeEventListener('ll:communityPost:requestEdit', onReqEdit);
            window.removeEventListener('ll:communityPost:requestHistory', onReqHistory);
            window.removeEventListener('ll:communityPost:requestMarkFound', onReqMarkFound);
            window.removeEventListener('ll:communityPost:requestDelete', onReqDelete);
        };
    }, []);

    // Fetch edit history when requested
    useEffect(() => {
        if (!historyOpen || !historyPostId) return;
        let alive = true;
        const controller = new AbortController();

        (async () => {
            setHistoryLoading(true);
            setHistoryError('');
            try {
                const res = await axios.get(`${api}/api/community/${historyPostId}/edits`, {
                    withCredentials: true,
                    signal: controller.signal,
                });
                if (!alive) return;
                const rows = Array.isArray(res.data) ? res.data : [];
                setHistoryRows(rows);
            } catch (err) {
                if (!alive) return;
                const msg = err?.response?.data?.message || err?.message || 'Could not load edit history.';
                setHistoryError(msg);
            } finally {
                if (alive) setHistoryLoading(false);
            }
        })();

        return () => {
            alive = false;
            controller.abort();
        };
    }, [historyOpen, historyPostId]);

    /* Utility: format ISO (YYYY-MM-DD) into MM/DD/YYYY */
    const formatMDY = useCallback((iso) => {
        if (!iso) return '';
        const s = String(iso).slice(0, 10);
        const parts = s.split('-');
        if (parts.length === 3) {
            const [y, m, d] = parts;
            const mm = (m || '').padStart(2, '0');
            const dd = (d || '').padStart(2, '0');
            return `${mm}/${dd}/${y}`;
        }
        return iso;
    }, []);

    /* Utility: format a date range */
    const formatRange = useCallback(
        (start, end, current) => {
            const left = formatMDY(start);
            const right = current ? 'Present' : formatMDY(end);
            if (!left && !right && !current) return '';
            return `${left || '—'} - ${right || '—'}`;
        },
        [formatMDY]
    );

    const formatDate = (v) => {
        const d = v ? new Date(v) : null;
        if (!d || Number.isNaN(d.valueOf())) return '';
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    };
    const formatTime = (v) => {
        const d = v ? new Date(v) : null;
        if (!d || Number.isNaN(d.valueOf())) return '';
        return d
            .toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })
            .toLowerCase();
    };
    const dateTimeLabel = (v) => {
        const a = formatDate(v);
        const b = formatTime(v);
        return a && b ? `${a} · ${b}` : a || b || '';
    };

    /* Load profile + activity */
    useEffect(() => {
        if (!handleOrId) {
            setLoading(false);
            setError('Profile not specified.');
            return;
        }
        let alive = true;
        const controller = new AbortController();

        (async () => {
            if (initialLoadRef.current) setLoading(true);
            setError('');
            setRawLoadError(null);
            try {
                const res = await axios.get(`${api}/users/public/${encodeURIComponent(handleOrId)}`, {
                    withCredentials: true,
                    signal: controller.signal,
                });
                if (!alive) return;

                const p = res.data.profile;
                setBlockedByMe(Boolean(res.data?.blockedByMe || res.data?.blocked || p?.blockedByMe || p?.isBlocked));
                setBlockedByOther(Boolean(res.data?.blockedBy || p?.isBlockedBy));
                setHiddenPostsByMe(Boolean(res.data?.hiddenPostsByMe || p?.hiddenPostsByMe));
                setCanViewAccount(Boolean(res.data?.canView ?? true));
                setFollowRequested(Boolean(p?.followRequested));
                setProfile(p);
                setActivity(res.data.activity || {});
                setBioDraft(String(p?.bio || '').slice(0, 50));
                setRelationship(p?.relationship || '');
                setBirthday(p?.birthday || '');
                setHomeCity(p?.home_city || '');
                setHomeCounty(p?.home_county || '');
                setHandleDraft(p?.handle || '');
                setFirstNameDraft(p?.first_name || '');
                setLastNameDraft(p?.last_name || '');
                setAccountPrivacyDraft(p?.is_private ? 'private' : 'public');
                setCountryDraft(p?.country || 'US');
                setStateDraft(p?.state || '');

                // Identity fields
                setProfileBioDraft(String(p?.profile_bio || '').slice(0, 120));
                // Alabama resident if country is US and state is explicitly AL
                const pCountry = String(p?.country || '').toUpperCase();
                const pState = String(p?.state || '').toUpperCase();
                const isAL = (pCountry === 'US' || pCountry === '') && (pState === 'AL' || pState === '');
                setAlabamaResidentDraft(isAL);

                const parseJ = (v) => (typeof v === 'string' ? JSON.parse(v || '[]') : v || []);
                setWorkHistory(parseJ(p?.work_history_json));
                setEduHistory(parseJ(p?.education_history_json));

                const pj = p?.privacy_json
                    ? typeof p.privacy_json === 'string'
                        ? JSON.parse(p.privacy_json)
                        : p.privacy_json
                    : {};
                setPrivacy(pj);

                // Seed Contact from social_json.contact
                const sj =
                    p?.social_json
                        ? typeof p.social_json === 'string'
                            ? JSON.parse(p.social_json)
                            : p.social_json
                        : {};
                const c = (sj && sj.contact) || {};
                setContact({
                    phone: c.phone || '',
                    email: c.email || '',
                    facebook: c.facebook || '',
                    instagram: c.instagram || '',
                    tiktok: c.tiktok || '',
                    x: c.x || '',
                    linkedin: c.linkedin || '',
                    website: c.website || '',
                    snapchat: c.snapchat || '',
                });

                setPendingAvatar(null);
                setDeleteAvatar(false);
                setEditMode(false);
            } catch (err) {
                if (alive) {
                    setRawLoadError(err);
                    setError(err.response?.data?.message || 'Failed to load profile.');
                }
            } finally {
                if (alive) setLoading(false);
                initialLoadRef.current = false;
            }
        })();

        return () => {
            alive = false;
            controller.abort();
        };
    }, [handleOrId]);

    // Fetch handle change stats for the owner (2 per 30 days)
    useEffect(() => {
        let alive = true;
        (async () => {
            if (!isMine) return;
            try {
                const r = await axios.get(`${api}/users/profile`, { withCredentials: true });
                const u = r.data?.user || r.data || {};
                const stats = u.handle_change_stats || { remaining: 0, nextAllowed: null };
                if (alive) setHandleStats(stats);
            } catch {
                /* ignore; default stats (0) will hide input */
            }
        })();
        return () => {
            alive = false;
        };
    }, [isMine]);

    /* Derive follow/request state when viewer or profile changes */
    useEffect(() => {
        if (!profile) return;

        if (typeof profile.isFollowing === 'boolean') {
            setIsFollowing(Boolean(profile.isFollowing));
        } else {
            try {
                const sj =
                    profile?.social_json &&
                    (typeof profile.social_json === 'string'
                        ? JSON.parse(profile.social_json || '{}')
                        : profile.social_json);
                const isF = !!me && Array.isArray(sj?.followers) && sj.followers.includes(me.id);
                setIsFollowing(isF);
            } catch {
                setIsFollowing(false);
            }
        }

        if (typeof profile.followRequested === 'boolean') {
            setFollowRequested(Boolean(profile.followRequested));
        }
    }, [me?.id, profile]);

    /* Expanded page open signal */
    useEffect(() => {
        const open = (e) => {
            const url = new URL(window.location.href);
            url.searchParams.set('view', 'posts');
            window.history.pushState({ view: 'posts' }, '', url);
            const detail = e?.detail;
            const idxRaw = typeof detail === 'number' ? detail : detail?.tabIndex;
            const idx = Number.isFinite(Number(idxRaw)) ? Number(idxRaw) : 0;
            setExpandedTab(idx);

            try {
                const detailObj = e?.detail && typeof e.detail === 'object' ? e.detail : {};
                // Always apply (even empty) so we don't carry stale selections from a previous expand.
                setExpandedCategory(String(detailObj.category ?? detailObj.subtype ?? ''));
                setExpandedSort(String(detailObj.sort ?? detailObj.sortBy ?? 'newest'));
            } catch {
                /* ignore */
            }
            setPostsExpanded(true);

            // required: scroll to top when expanding
            window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
            requestAnimationFrame(() => {
                if (postsScrollRef.current) postsScrollRef.current.scrollTop = 0;
            });
        };
        window.addEventListener('profile-posts-expand', open);
        return () => window.removeEventListener('profile-posts-expand', open);
    }, []);

    /* Sync with URL on load and back/forward */
    useEffect(() => {
        const sync = () => {
            const url = new URL(window.location.href);
            const viewParam = url.searchParams.get('view');
            const wantsPostsExpanded = viewParam === 'posts';
            const wantsEventsExpanded = viewParam === 'events';

            // Only auto-open the expanded overlay when the user is returning from the Post page.
            if (wantsPostsExpanded && !returningFromPostRef.current) {
                url.searchParams.delete('view');
                window.history.replaceState(window.history.state, '', url);
                setPostsExpanded(false);
                return;
            }

            setPostsExpanded(wantsPostsExpanded);
            setEventsExpanded(wantsEventsExpanded);
        };
        sync();
        window.addEventListener('popstate', sync);
        return () => window.removeEventListener('popstate', sync);
    }, []);

    /* File pickers / crop */
    const pickFile = (cb) => {
        const i = document.createElement('input');
        i.type = 'file';
        i.accept = 'image/*';
        i.onchange = () => {
            const f = i.files?.[0];
            if (f) cb(f);
        };
        i.click();
    };

    const changeAvatar = (blob) => {
        const hasExisting = Boolean(profile?.avatar_url || profile?.profile_picture);
        if (blob instanceof Blob) {
            if (hasExisting) {
                // Show warning — old photo's likes/comments will be removed
                setPendingAvatarBlob(blob);
                setPhotoChangeWarningKind('avatar');
                setPhotoChangeWarningOpen(true);
            } else {
                setPendingAvatar(blob);
                setDeleteAvatar(false);
            }
            return;
        }
        // No blob — open file picker directly (no existing photo)
        pickFile((f) => {
            setCropSrc(URL.createObjectURL(f));
            setCropRound(true);
            setCropOpen(true);
        });
    };
    const confirmPhotoChange = () => {
        setPhotoChangeWarningOpen(false);
        if (photoChangeWarningKind === 'avatar' && pendingAvatarBlob) {
            setPendingAvatar(pendingAvatarBlob);
            setDeleteAvatar(false);
            setPendingAvatarBlob(null);
        } else if (photoChangeWarningKind === 'cover' && pendingCoverBlob) {
            setPendingCover(pendingCoverBlob);
            setDeleteCover(false);
            setPendingCoverBlob(null);
        }
        setPhotoChangeWarningKind(null);
    };
    const onCropped = (blob) => {
        setPendingAvatar(blob);
        setDeleteAvatar(false);
        setCropOpen(false);
    };

    // 🔔 helper: cache-bust a URL (so new images render immediately)
    const bump = useCallback((url) => (url ? `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}` : url), []);
    // 🔔 helper: cache-bust post photo urls while preserving the original photos type
    const bumpPhotos = useCallback(
        (photosRaw) => {
            if (photosRaw == null) return photosRaw;

            const bumpOne = (u) => bump(String(u || '').trim());

            // Array form
            if (Array.isArray(photosRaw)) {
                return photosRaw.map(bumpOne);
            }

            // String form: either JSON array string or single URL
            if (typeof photosRaw === 'string') {
                const raw = photosRaw.trim();
                if (!raw || raw === 'null') return photosRaw;

                if (raw.startsWith('[')) {
                    try {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed)) return JSON.stringify(parsed.map(bumpOne));
                        // not an array; fall back
                    } catch {
                        // ignore parse failures
                    }
                }

                return bumpOne(raw);
            }

            return photosRaw;
        },
        [bump]
    );




    // 🔔 helper: broadcast "me updated" so Header can refresh its avatar (only when editing own profile)
    const notifyMeUpdated = useCallback(
        (uLike) => {
            if (!isMine) return;
            try {
                const nextRaw = (uLike && (uLike.user || uLike)) || {};
                const merged = { ...(profile || {}), ...nextRaw };
                const payload = {
                    ...merged,
                    avatar_url: bump(merged.avatar_url || merged.profile_picture),
                    profile_picture: bump(merged.profile_picture || merged.avatar_url),
                };
                // Same-tab listeners
                window.dispatchEvent(new CustomEvent('me:updated', { detail: { user: payload } }));
                // Cross-tab listeners
                localStorage.setItem('ll:me:updated', JSON.stringify({ t: Date.now(), user: payload }));
            } catch {
                /* ignore */
            }
        },
        [isMine, profile, bump]
    );

    const doDeleteAvatar = async () => {
        try {
            await axios.delete(`${api}/users/me/avatar`, { withCredentials: true });
            const updated = { avatar_url: null, profile_picture: null };
            setProfile((p) => (p ? { ...p, ...updated } : p));
            notifyMeUpdated(updated);
            setPendingAvatar(null);
            setDeleteAvatar(false);
            setConfirmOpen(false);
            showSuccess('Profile picture deleted.');
        } catch {
            setProfileSnack('Failed to delete profile picture.');
        }
    };
// Stable privacy opener
    const openPrivacy = useCallback((e, key) => {
        setPrivacyAnchor(e.currentTarget);
        setPrivacyFor(key);
    }, []);

    /** Persist privacy_json to /users/me (auto-save) */
    const setPrivacyLevel = async (val) => {
        if (!privacyFor) return;
        const up = { ...privacy, [privacyFor]: val };
        setPrivacy(up);
        try {
            await axios.put(`${api}/users/me`, { privacy_json: up }, { withCredentials: true });
            showSuccess('Privacy updated.');
        } catch {
            setProfileSnack('Failed to update privacy.');
        }
        setPrivacyAnchor(null);
    };

    // Section visibility helper (owner always sees)
    const canViewSection = useCallback(
        (value) => {
            const v = value || 'public';
            if (isMine) return true;
            if (v === 'private') return false;
            if (v === 'friends') return !!isFollowing;
            return true; // public
        },
        [isMine, isFollowing]
    );

    const activityPosts = useMemo(() => activity?.posts || [], [activity]);

    // Pull full post list once, then filter + paginate on the client (50-at-a-time render)
    const profileKey = useMemo(() => {
        const raw = profile?.handle || profile?.public_id || profile?.id || null;
        if (raw == null) return null;
        if (typeof raw === 'string') return raw.replace(/^@/, '');
        return raw;
    }, [profile]);
    const profilePageStateKey = profileKey ? `ll:profilePageState:${profileKey}` : null;

    const freshProfileVisitRef = useRef(false);

    const getRightRailScrollElement = useCallback((viewOverride = null) => {
        const targetView = viewOverride || rightRailView;
        const viewToRef = {
            events: eventsScrollRef,
            jobs: jobsScrollRef,
            services: servicesScrollRef,
            marketplace: marketplaceScrollRef,
            reviews: reviewsScrollRef,
        };

        const directRef = viewToRef[targetView];
        if (directRef?.current) return directRef.current;

        const communityRoot = rightRailWrapRef.current;
        if (targetView === 'community' && communityRoot) {
            const scroller =
                communityRoot.querySelector('[data-profile-posts-scroll]') ||
                communityRoot.querySelector('.profile-posts-scroller');
            if (scroller) return scroller;
        }

        return findScrollableDescendant(rightRailCardRef.current);
    }, [rightRailView]);

    const getRightRailTabScrollKey = useCallback((viewOverride = null) => {
        const keyBase = profileKey != null ? String(profileKey).replace(/^@+/, '') : '';
        const targetView = String(viewOverride || rightRailView || 'community');
        if (!keyBase || !targetView) return null;
        return `ll:profile:${keyBase}:rightRailScroll:${targetView}`;
    }, [profileKey, rightRailView]);

    const persistRightRailTabScroll = useCallback((viewOverride = null) => {
        const targetView = String(viewOverride || rightRailView || 'community');
        const storageKey = getRightRailTabScrollKey(targetView);
        if (!storageKey) return;
        const el = getRightRailScrollElement(targetView);
        const scrollTop = Number(el?.scrollTop || 0);
        try {
            sessionStorage.setItem(storageKey, String(Number.isFinite(scrollTop) ? scrollTop : 0));
        } catch {
            /* ignore */
        }
    }, [getRightRailScrollElement, getRightRailTabScrollKey, rightRailView]);

    const restoredRightRailViewsRef = useRef(new Set());
    const profilePageRestoredRef = useRef(false);
    const restoringProfilePageStateRef = useRef(false);
    const suppressRenderCountResetUntilRef = useRef(0);
    const lastAppliedProfilePageStateRef = useRef(null);
    const hasRestoredRightRailViewRef = useRef(false);

    // -------------------------------
    // Preserve profile UI state when navigating away (e.g., into a Post page)
    // -------------------------------


    useEffect(() => {
        if (!profilePageStateKey || profilePageRestoredRef.current) return;

        // Only restore the expanded overlay state when returning from the Post page.
        // Otherwise, always start the profile on the normal (non-expanded) view.
        if (!returningFromPostRef.current) {
            try {
                sessionStorage.removeItem(profilePageStateKey);
            } catch {
                /* ignore */
            }
            profilePageRestoredRef.current = true;
            return;
        }

        let raw = null;
        try {
            raw = sessionStorage.getItem(profilePageStateKey);
        } catch {
            raw = null;
        }
        if (!raw) {
            profilePageRestoredRef.current = true;
            return;
        }

        if (lastAppliedProfilePageStateRef.current === raw) {
            profilePageRestoredRef.current = true;
            return;
        }

        let scrollRestoreIntervalId = 0;

        try {
            const s = JSON.parse(raw);
            lastAppliedProfilePageStateRef.current = raw;
            restoringProfilePageStateRef.current = true;

            // Restore expanded overlay first so the scroller exists before setting scrollTop.
            if (typeof s.postsExpanded === 'boolean') {
                setPostsExpanded((prev) => (prev === s.postsExpanded ? prev : s.postsExpanded));
            }
            if (typeof s.eventsExpanded === 'boolean') {
                setEventsExpanded((prev) => (prev === s.eventsExpanded ? prev : s.eventsExpanded));
            }
            if (Number.isFinite(s.expandedTab)) {
                setExpandedTab((prev) => (prev === s.expandedTab ? prev : s.expandedTab));
            }
            if (typeof s.expandedCategory === 'string') {
                setExpandedCategory((prev) => (prev === s.expandedCategory ? prev : s.expandedCategory));
            }
            if (typeof s.expandedSort === 'string') {
                setExpandedSort((prev) => (prev === s.expandedSort ? prev : s.expandedSort));
            }
            if (Number.isFinite(s.expandedRenderCount)) {
                setExpandedRenderCount((prev) => (prev === s.expandedRenderCount ? prev : s.expandedRenderCount));
            }
            // Always reset to Community tab — events/jobs open as in-page popups now
            setRightRailView('community');

            // Restore community search
            if (typeof s.communitySearch === 'string') { setCommunitySearch(s.communitySearch); setCommunitySearchTerm(s.communitySearch); }

            // Restore events tab filters
            if (typeof s.eventsView === 'string') setEventsView((prev) => (prev === s.eventsView ? prev : s.eventsView));
            if (typeof s.eventsCategory === 'string') setEventsCategory((prev) => (prev === s.eventsCategory ? prev : s.eventsCategory));
            if (typeof s.eventsSort === 'string') setEventsSort((prev) => (prev === s.eventsSort ? prev : s.eventsSort));
            if (typeof s.eventsDateFrom === 'string') setEventsDateFrom((prev) => (prev === s.eventsDateFrom ? prev : s.eventsDateFrom));
            if (typeof s.eventsDateTo === 'string') setEventsDateTo((prev) => (prev === s.eventsDateTo ? prev : s.eventsDateTo));
            if (typeof s.eventsSearch === 'string') { setEventsSearch(s.eventsSearch); setEventsSearchTerm(s.eventsSearch); }
            if (Number.isFinite(s.eventSubTab)) setEventSubTab((prev) => (prev === s.eventSubTab ? prev : s.eventSubTab));

            // Restore jobs tab filters
            if (typeof s.jobsCategory === 'string') setJobsCategory((prev) => (prev === s.jobsCategory ? prev : s.jobsCategory));
            if (typeof s.jobsSort === 'string') setJobsSort((prev) => (prev === s.jobsSort ? prev : s.jobsSort));
            if (typeof s.jobsSearch === 'string') { setJobsSearch(s.jobsSearch); setJobsSearchTerm(s.jobsSearch); }

            // Restore services tab filters
            if (typeof s.servicesCategory === 'string') setServicesCategory((prev) => (prev === s.servicesCategory ? prev : s.servicesCategory));
            if (typeof s.servicesView === 'string') setServicesView((prev) => (prev === s.servicesView ? prev : s.servicesView));
            if (typeof s.servicesSubTab === 'string') setServicesSubTab((prev) => (prev === s.servicesSubTab ? prev : s.servicesSubTab));
            if (typeof s.servicesSearch === 'string') { setServicesSearch(s.servicesSearch); setServicesSearchTerm(s.servicesSearch); }

            // Restore marketplace tab filters
            if (typeof s.listingsCategory === 'string') setListingsCategory((prev) => (prev === s.listingsCategory ? prev : s.listingsCategory));
            if (typeof s.listingsSort === 'string') setListingsSort((prev) => (prev === s.listingsSort ? prev : s.listingsSort));
            if (typeof s.listingsSearch === 'string') { setListingsSearch(s.listingsSearch); setListingsSearchTerm(s.listingsSearch); }
            if (typeof s.marketplaceSubTab === 'string') setMarketplaceSubTab((prev) => (prev === s.marketplaceSubTab ? prev : s.marketplaceSubTab));

            // Restore reviews tab filters
            if (typeof s.reviewsType === 'string') setReviewsType((prev) => (prev === s.reviewsType ? prev : s.reviewsType));

            // Restore render counts so content height matches what was saved
            if (Number.isFinite(s.eventsRenderCount) && s.eventsRenderCount > EVENTS_PAGE_SIZE) setEventsRenderCount((prev) => (prev === s.eventsRenderCount ? prev : s.eventsRenderCount));
            if (Number.isFinite(s.jobsRenderCount) && s.jobsRenderCount > JOBS_PAGE_SIZE) setJobsRenderCount((prev) => (prev === s.jobsRenderCount ? prev : s.jobsRenderCount));
            if (Number.isFinite(s.servicesRenderCount) && s.servicesRenderCount > SERVICES_PAGE_SIZE) setServicesRenderCount((prev) => (prev === s.servicesRenderCount ? prev : s.servicesRenderCount));
            if (Number.isFinite(s.listingsRenderCount) && s.listingsRenderCount > LISTINGS_PAGE_SIZE) setListingsRenderCount((prev) => (prev === s.listingsRenderCount ? prev : s.listingsRenderCount));
            if (Number.isFinite(s.reviewsRenderCount) && s.reviewsRenderCount > REVIEWS_PAGE_SIZE) setReviewsRenderCount((prev) => (prev === s.reviewsRenderCount ? prev : s.reviewsRenderCount));

            // Block render-count-reset effects for 8s so API data arrival doesn't shrink content
            suppressRenderCountResetUntilRef.current = Date.now() + 8000;

            // ── Scroll restoration: interval retry (same approach PET uses) ──
            const savedView = s.rightRailView || 'community';
            const scrollMap = {
                events:      { ref: eventsScrollRef,      val: s.eventsScrollTop },
                jobs:        { ref: jobsScrollRef,        val: s.jobsScrollTop },
                services:    { ref: servicesScrollRef,    val: s.servicesScrollTop },
                marketplace: { ref: marketplaceScrollRef, val: s.marketplaceScrollTop },
                reviews:     { ref: reviewsScrollRef,     val: s.reviewsScrollTop },
            };
            const activeTarget = scrollMap[savedView] || null;
            const expandedVal = s.expandedScrollTop;
            const winVal = s.windowScrollY;

            scrollRestoreIntervalId = setInterval(() => {
                if (suppressRenderCountResetUntilRef.current <= Date.now()) {
                    clearInterval(scrollRestoreIntervalId);
                    restoringProfilePageStateRef.current = false;
                    return;
                }
                if (postsScrollRef.current && Number.isFinite(expandedVal) && expandedVal > 0) {
                    postsScrollRef.current.scrollTop = expandedVal;
                }
                // Keep retrying for the full suppress window — data fetches can
                // re-render lists and reset scroll after an apparent success.
                if (activeTarget && Number.isFinite(activeTarget.val) && activeTarget.val > 0) {
                    const el = activeTarget.ref.current;
                    if (el) el.scrollTop = activeTarget.val;
                }
                if (Number.isFinite(winVal)) window.scrollTo(0, winVal);
            }, 120);
        } catch {
            // ignore malformed saved state
        } finally {
            profilePageRestoredRef.current = true;
            try {
                sessionStorage.removeItem(profilePageStateKey);
            } catch {
                /* ignore */
            }
        }

        return () => { if (scrollRestoreIntervalId) clearInterval(scrollRestoreIntervalId); };
    }, [profilePageStateKey]);
    const [profilePostsAll, setProfilePostsAll] = useState([]);
    const [profilePostsLoading, setProfilePostsLoading] = useState(false);

    useEffect(() => {
        if (!profileKey) return;
        let alive = true;
        const controller = new AbortController();
        (async () => {
            setProfilePostsLoading(true);
            try {
                const res = await secureFetch(
                    `${api}/api/community?user=${encodeURIComponent(profileKey)}&limit=5000`,
                    { credentials: 'include', signal: controller.signal }
                );
                const j = await res.json();
                if (!alive) return;
                const arr = Array.isArray(j) ? j : Array.isArray(j?.posts) ? j.posts : [];
                setProfilePostsAll(arr);
            } catch {
                if (alive) setProfilePostsAll(Array.isArray(activityPosts) ? activityPosts : []);
            } finally {
                if (alive) setProfilePostsLoading(false);
            }
        })();
        return () => {
            alive = false;
            controller.abort();
        };
    }, [profileKey, activityPosts]);

    // Keep a local posts list for patching after edits/deletes
    const [feedPosts, setFeedPosts] = useState([]);

    useEffect(() => {
        feedPostsRef.current = Array.isArray(feedPosts) ? feedPosts : [];
    }, [feedPosts]);
    useEffect(() => {
        const base = Array.isArray(profilePostsAll) && profilePostsAll.length
            ? profilePostsAll
            : Array.isArray(activityPosts) && activityPosts.length
                ? activityPosts
                : EMPTY_ARRAY;

        // If the viewer hid this user's posts, show an empty feed on their profile.
        if (!isMine && hiddenPostsByMe) {
            setFeedPosts((prev) => (prev.length === 0 ? prev : EMPTY_ARRAY));
            return;
        }

        setFeedPosts((prev) => (prev === base ? prev : base));
    }, [profilePostsAll, activityPosts, hiddenPostsByMe, isMine]);

    // ── Profile-check: determine tab visibility from ANY activity (posted, liked, commented, reposted, etc.) ──
    // This fires once per profile and sets profileHas* flags early so tabs appear
    // even if the user has only engaged (not posted) in events/services/marketplace.
    useEffect(() => {
        if (!profileKey || !profile?.id) return;
        let alive = true;

        // Reset flags when switching profiles — data-fetch effects preserve
        // true but never flip back to false, so we need this clean slate.
        setProfileHasEvents(false);
        setProfileHasServices(false);
        setProfileHasServiceRequests(false);
        setProfileHasListings(false);
        setEventActivityCounts(null);
        setServiceActivityCounts(null);
        setMarketplaceActivityCounts(null);

        const idArg = { userId: profile.id };

        // Events profile check
        fetchEventProfileCheck(idArg)
            .then((result) => {
                if (!alive) return;
                if (result?.hasActivity) setProfileHasEvents(true);
                if (result?.counts) setEventActivityCounts(result.counts);
            })
            .catch(() => {});

        // Services profile check
        fetchServiceProfileCheck(idArg)
            .then((result) => {
                if (!alive) return;
                if (result?.hasActivity) setProfileHasServices(true);
                if (result?.counts?.requests > 0) setProfileHasServiceRequests(true);
                if (result?.counts) setServiceActivityCounts(result.counts);
            })
            .catch(() => {});

        // Marketplace profile check
        axios.get(`/api/marketplace/profile-check/${profile.id}`, { withCredentials: true })
            .then((res) => {
                if (!alive) return;
                if (res.data?.hasActivity) setProfileHasListings(true);
                if (res.data?.counts) setMarketplaceActivityCounts(res.data.counts);
            })
            .catch(() => {});

        return () => { alive = false; };
    }, [profileKey, profile?.id]);

    // ── Fetch events for this profile user ──────────────────────────────────
    useEffect(() => {
        if (!profileKey || !profile?.id) return;
        let alive = true;
        const controller = new AbortController();
        const opts = { signal: controller.signal, withCredentials: true, headers: { ...getAccountHeaders() } };

        const baseParams = {
            limit: 50,
            range: 'custom',
            includeStatewide: 1,
        };

        const extractItems = (payload) => {
            const data = payload?.data;
            if (Array.isArray(data?.items)) return data.items;
            if (Array.isArray(data?.events)) return data.events;
            if (Array.isArray(data)) return data;
            return [];
        };

        const loadAllEventPages = async (extraParams = {}) => {
            const mergedItems = [];
            const seen = new Set();
            let page = 1;
            let keepGoing = true;

            while (keepGoing && alive) {
                const res = await axios.get('/api/events', {
                    params: { ...baseParams, page, ...extraParams },
                    ...opts,
                });

                const items = extractItems(res);
                items.forEach((item) => {
                    const eventId = Number(item?.id);
                    if (!eventId || seen.has(eventId)) return;
                    seen.add(eventId);
                    mergedItems.push(item);
                });

                const hasMore = Boolean(res?.data?.hasMore) || items.length >= baseParams.limit;
                if (!hasMore || items.length === 0) {
                    keepGoing = false;
                } else {
                    page += 1;
                }
            }

            return mergedItems;
        };

        // Likes/reposts: sort by recently added since these are engagement-focused
        // Events/going/interested: sort by soonest (upcoming first)
        const sortParam = (eventSubTab === 2 || eventSubTab === 3) ? 'recent' : 'soonest';

        (async () => {
            setProfileEventsLoading(true);
            try {
                if (eventSubTab === 1) {
                    const items = await loadAllEventPages({ sort: sortParam, engagementUserId: profile.id, engagementType: 'comment' });
                    if (!alive) return;
                    setProfileEvents(items);
                    setProfileHasEvents((prev) => items.length > 0 ? true : prev);
                } else if (eventSubTab === 2) {
                    const items = await loadAllEventPages({ sort: sortParam, engagementUserId: profile.id, engagementType: 'like' });
                    if (!alive) return;
                    setProfileEvents(items);
                    setProfileHasEvents((prev) => items.length > 0 ? true : prev);
                } else if (eventSubTab === 3) {
                    const items = await loadAllEventPages({ sort: sortParam, engagementUserId: profile.id, engagementType: 'repost' });
                    if (!alive) return;
                    setProfileEvents(items);
                    setProfileHasEvents((prev) => items.length > 0 ? true : prev);
                } else if (eventsView === 'going') {
                    const items = await loadAllEventPages({ sort: sortParam, engagementUserId: profile.id, engagementType: 'rsvp' });
                    if (!alive) return;
                    setProfileEvents(items);
                    setProfileHasEvents((prev) => items.length > 0 ? true : prev);
                } else if (eventsView === 'interested') {
                    const items = await loadAllEventPages({ sort: sortParam, engagementUserId: profile.id, engagementType: 'interested' });
                    if (!alive) return;
                    setProfileEvents(items);
                    setProfileHasEvents((prev) => items.length > 0 ? true : prev);
                } else if (eventsView === 'hosted') {
                    const items = await loadAllEventPages({ sort: sortParam, organizerUserId: profile.id });
                    if (!alive) return;
                    setProfileEvents(items);
                    setProfileHasEvents((prev) => items.length > 0 ? true : prev);
                } else {
                    const [hostedItems, goingItems, interestedItems] = await Promise.all([
                        loadAllEventPages({ sort: sortParam, organizerUserId: profile.id }).catch(() => []),
                        loadAllEventPages({ sort: sortParam, engagementUserId: profile.id, engagementType: 'rsvp' }).catch(() => []),
                        loadAllEventPages({ sort: sortParam, engagementUserId: profile.id, engagementType: 'interested' }).catch(() => []),
                    ]);
                    if (!alive) return;
                    const hosted = hostedItems.map((e) => ({ ...e, _section: 'hosted' }));
                    const going = goingItems.map((e) => ({ ...e, _section: 'going' }));
                    const interested = interestedItems.map((e) => ({ ...e, _section: 'interested' }));
                    const seen = new Set();
                    const combined = [];
                    for (const ev of [...hosted, ...going, ...interested]) {
                        const eventId = Number(ev?.id);
                        if (!eventId || seen.has(eventId)) continue;
                        seen.add(eventId);
                        combined.push(ev);
                    }
                    setProfileEvents(combined);
                    setProfileHasEvents((prev) => combined.length > 0 ? true : prev);
                }
            } catch {
                if (alive) {
                    setProfileEvents([]);
                    setProfileHasEvents((prev) => prev);
                }
            } finally {
                if (alive) setProfileEventsLoading(false);
            }
        })();

        return () => {
            alive = false;
            controller.abort();
        };
    }, [profileKey, profile?.id, eventsView, eventSubTab, eventsRefreshNonce, accountCacheKey]);

    // ── Fetch jobs posted by this profile user ────────────────────────────────
    // Own profile: use /api/jobs/my which reliably returns the current user's jobs.
    // Other profiles: use posterUserId on /api/jobs/feed.
    useEffect(() => {
        if (!profileKey || !profile?.id) return;
        let alive = true;
        const controller = new AbortController();

        (async () => {
            setProfileJobsLoading(true);
            try {
                let items;
                if (isMine) {
                    // Own profile — use the dedicated "my jobs" endpoint
                    const data = await fetchMyJobs({
                        signal: controller.signal,
                        status: 'active',
                    });
                    if (!alive) return;
                    items = Array.isArray(data) ? data : [];
                } else {
                    // Other user's profile — filter the public feed by poster
                    const res = await axios.get('/api/jobs/feed', {
                        params: { posterUserId: profile.id, limit: 200 },
                        signal: controller.signal,
                        withCredentials: true,
                        headers: { ...getAccountHeaders() },
                    });
                    if (!alive) return;
                    items = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
                }
                setProfileJobs(items);
                setProfileHasJobs(items.length > 0);
            } catch {
                if (alive) {
                    setProfileJobs([]);
                    setProfileHasJobs(false);
                }
            } finally {
                if (alive) setProfileJobsLoading(false);
            }
        })();

        return () => {
            alive = false;
            controller.abort();
        };
    }, [profileKey, profile?.id, isMine, jobsRefreshNonce, accountCacheKey]);

    // ── Fetch services posted by this profile user ──────────────────────────
    // Own profile: use onlyMine=1 with forced personal account headers so only
    // services from the personal account are returned (not business/artist).
    // Other profiles: use posterUserId so the backend returns their services.
    useEffect(() => {
        if (!profileKey || !profile?.id) return;
        let alive = true;
        const controller = new AbortController();

        (async () => {
            setProfileServicesLoading(true);
            try {
                let items;
                if (isMine) {
                    // Force personal account headers so only personal services are returned
                    const res = await axios.get('/api/services/feed', {
                        params: { onlyMine: 1, limit: 200 },
                        signal: controller.signal,
                        withCredentials: true,
                        headers: { 'x-account-type': 'personal' },
                    });
                    if (!alive) return;
                    items = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
                } else {
                    const res = await axios.get('/api/services/feed', {
                        params: { posterUserId: profile.id, limit: 200 },
                        signal: controller.signal,
                        withCredentials: true,
                        headers: { ...getAccountHeaders() },
                    });
                    if (!alive) return;
                    items = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
                }
                setProfileServices(items);
                setProfileHasServices((prev) => items.length > 0 ? true : prev);
            } catch {
                if (alive) {
                    setProfileServices([]);
                    setProfileHasServices((prev) => prev);
                }
            } finally {
                if (alive) setProfileServicesLoading(false);
            }
        })();

        return () => {
            alive = false;
            controller.abort();
        };
    }, [profileKey, profile?.id, isMine, servicesRefreshNonce, accountCacheKey]);

    // ── Fetch favorite services for this profile user ───────────────────────
    useEffect(() => {
        if (!profileKey || !profile?.id) return;
        let alive = true;
        const controller = new AbortController();

        (async () => {
            setProfileFavServicesLoading(true);
            try {
                const res = await axios.get(`/api/services/user/${profile.id}/favorites`, {
                    signal: controller.signal,
                    withCredentials: true,
                    headers: { ...getAccountHeaders() },
                });
                if (!alive) return;
                const items = Array.isArray(res.data?.items) ? res.data.items : [];
                setProfileFavServices(items);
                // Show tab if user has either offered services OR favorites
                if (items.length > 0) setProfileHasServices(true);
            } catch {
                if (alive) setProfileFavServices([]);
            } finally {
                if (alive) setProfileFavServicesLoading(false);
            }
        })();

        return () => {
            alive = false;
            controller.abort();
        };
    }, [profileKey, profile?.id, servicesRefreshNonce, accountCacheKey]);

    // ── Fetch service requests by this profile user ─────────────────────────
    useEffect(() => {
        if (!profileKey || !profile?.id) {
            setProfileServiceRequests([]);
            setProfileHasServiceRequests((prev) => prev);
            return;
        }
        let alive = true;
        const controller = new AbortController();

        (async () => {
            setProfileServiceRequestsLoading(true);
            try {
                let data;
                if (isMine) {
                    // Own profile — use the mine=1 filter (respects active account)
                    data = await fetchServiceRequests({
                        mine: true,
                        status: 'open',
                        limit: 200,
                        signal: controller.signal,
                    });
                } else {
                    // Other user's profile — use requesterUserId param
                    data = await fetchServiceRequestsByUser({
                        userId: profile.id,
                        status: 'all',
                        limit: 200,
                        signal: controller.signal,
                    });
                }
                if (!alive) return;
                const items = Array.isArray(data?.items) ? data.items : [];
                setProfileServiceRequests(items);
                setProfileHasServiceRequests((prev) => items.length > 0 ? true : prev);
                // Show services tab if user has requests
                if (items.length > 0) setProfileHasServices(true);
            } catch {
                if (alive) {
                    setProfileServiceRequests([]);
                    setProfileHasServiceRequests((prev) => prev);
                }
            } finally {
                if (alive) setProfileServiceRequestsLoading(false);
            }
        })();

        return () => {
            alive = false;
            controller.abort();
        };
    }, [profileKey, profile?.id, isMine, servicesRefreshNonce, accountCacheKey]);

    // ── Fetch marketplace listings by this profile user ────────────────────
    useEffect(() => {
        if (!profileKey || !profile?.id) return;
        let alive = true;
        const controller = new AbortController();

        (async () => {
            setProfileListingsLoading(true);
            try {
                const res = await axios.get('/api/marketplace/listings', {
                    params: { posterUserId: profile.id, status: 'available', limit: 200 },
                    signal: controller.signal,
                    withCredentials: true,
                    headers: { ...getAccountHeaders() },
                });
                if (!alive) return;
                const items = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data?.listings) ? res.data.listings : [];
                setProfileListings(items);
                setProfileHasListings((prev) => items.length > 0 ? true : prev);
            } catch {
                if (alive) {
                    setProfileListings([]);
                    setProfileHasListings((prev) => prev);
                }
            } finally {
                if (alive) setProfileListingsLoading(false);
            }
        })();

        return () => {
            alive = false;
            controller.abort();
        };
    }, [profileKey, profile?.id, listingsRefreshNonce, accountCacheKey]);

    // ── Listen for marketplace listing updates (sold, relist, edit) to refresh immediately ──
    useEffect(() => {
        const onListingUpdated = () => {
            setListingsRefreshNonce((n) => n + 1);
        };
        window.addEventListener('ll:marketplace:listing:updated', onListingUpdated);
        return () => window.removeEventListener('ll:marketplace:listing:updated', onListingUpdated);
    }, []);

    // ── Fetch seller reviews (reviews about this profile user as seller) ─────
    useEffect(() => {
        if (!profileKey || !profile?.id) return;
        let alive = true;
        const controller = new AbortController();

        (async () => {
            setSellerReviewsLoading(true);
            try {
                const res = await axios.get(`/api/marketplace/sellers/${profile.id}/reviews`, {
                    params: { limit: 50 },
                    signal: controller.signal,
                    withCredentials: true,
                    headers: { ...getAccountHeaders() },
                });
                if (!alive) return;
                setSellerReviewStats({ avgRating: res.data?.avgRating ?? null, totalCount: res.data?.totalCount ?? 0 });
                setSellerReviews(Array.isArray(res.data?.reviews) ? res.data.reviews : []);
                if (res.data?.sellerStats) setSellerStats(res.data.sellerStats);
                // If there are seller reviews or listings, ensure marketplace tab shows
                if ((res.data?.totalCount || 0) > 0 || (res.data?.sellerStats?.totalListings || 0) > 0) {
                    setProfileHasListings(true);
                }
            } catch {
                if (alive) {
                    setSellerReviews([]);
                    setSellerReviewStats({ avgRating: null, totalCount: 0 });
                }
            } finally {
                if (alive) setSellerReviewsLoading(false);
            }
        })();

        return () => { alive = false; controller.abort(); };
    }, [profileKey, profile?.id, accountCacheKey]);

    // ── Auto-switch to marketplace/seller_info when navigating from a seller review notification ──
    useEffect(() => {
        const navState = location?.state;
        if (!navState?.rightRailView || navState.rightRailView !== 'marketplace') return;

        const hlReviewId = Number(navState.highlightSellerReviewId || 0) || null;

        // On mobile, the right-rail seller_info tab isn't visible — open the
        // SellerReviewsPopup instead so the highlighted review is front-and-center.
        if (!isDesktopLayout && navState.marketplaceSubTab === 'seller_info' && hlReviewId) {
            setPendingMobileSellerReview(hlReviewId);
            // Clear navigation state so refresh/back doesn't re-trigger
            navigate(location.pathname, { replace: true, state: null });
            return;
        }

        setProfileHasListings(true); // ensure marketplace tab is visible
        setRightRailView('marketplace');
        if (navState.marketplaceSubTab) setMarketplaceSubTab(navState.marketplaceSubTab);
        if (hlReviewId) {
            setHighlightSellerReviewId(hlReviewId);
        }
    }, [location?.state, isDesktopLayout, navigate]);

    // ── Mobile: open SellerReviewsPopup once profile id is available ──
    useEffect(() => {
        if (!pendingMobileSellerReview) return;
        const selfId = profile?.id;
        if (!selfId) return; // wait for profile to load

        setSellerReviewsPopup({
            open: true,
            sellerId: selfId,
            highlightReviewId: pendingMobileSellerReview,
            highlightReviewerId: null,
        });
        setPendingMobileSellerReview(null);
    }, [pendingMobileSellerReview, profile?.id]);

    // ── Highlight a specific seller review (from notification) ── no scroll needed,
    // the review is boosted to the top by sortedSellerReviews useMemo.
    const hlSellerObserverRef = useRef(null);
    useEffect(() => {
        if (!highlightSellerReviewId || sellerReviewsLoading || sellerReviews.length === 0) return;
        if (rightRailView !== 'marketplace' || marketplaceSubTab !== 'seller_info') return;
        const timer = setTimeout(() => {
            const el = document.querySelector(`[data-seller-review-id="${highlightSellerReviewId}"]`);
            if (el) {
                if (hlSellerObserverRef.current) hlSellerObserverRef.current.disconnect();
                const observer = new IntersectionObserver(([entry]) => {
                    if (entry.isIntersecting) {
                        observer.disconnect();
                        hlSellerObserverRef.current = null;
                        setTimeout(() => setHighlightSellerReviewId(null), 1800);
                    }
                }, { threshold: 0.3 });
                observer.observe(el);
                hlSellerObserverRef.current = observer;
            }
        }, 200);
        return () => { clearTimeout(timer); if (hlSellerObserverRef.current) { hlSellerObserverRef.current.disconnect(); hlSellerObserverRef.current = null; } };
    }, [highlightSellerReviewId, sellerReviewsLoading, sellerReviews.length, rightRailView, marketplaceSubTab]);

    // ── Open SellerReviewsPopup when navigating from a seller_review_reply notification ──
    // This handles the case where the seller's profile is private — instead of navigating
    // to their profile (which would be blocked), we navigate to our own profile and open
    // the seller reviews popup directly.
    useEffect(() => {
        const navState = location?.state;
        if (!navState?.openSellerReviewsPopup) return;

        const sellerId = Number(navState.sellerReviewsPopupSellerId || 0);
        const sellerHandle = String(navState.sellerReviewsPopupSellerHandle || '').trim();
        const highlightId = Number(navState.highlightSellerReviewId || 0);

        // We need either a numeric seller ID or a handle to resolve one
        if (sellerId > 0) {
            setSellerReviewsPopup({
                open: true,
                sellerId,
                highlightReviewId: highlightId > 0 ? highlightId : null,
                highlightReviewerId: null,
            });
        } else if (sellerHandle) {
            // Resolve seller handle to ID, then open popup
            (async () => {
                try {
                    const res = await secureFetch(`/users/public/${sellerHandle}`, {
                        credentials: 'include',
                        headers: { Accept: 'application/json' },
                    });
                    if (res.ok) {
                        const data = await res.json();
                        const resolvedId = Number(data?.user?.id || data?.id || 0);
                        if (resolvedId > 0) {
                            setSellerReviewsPopup({
                                open: true,
                                sellerId: resolvedId,
                                highlightReviewId: highlightId > 0 ? highlightId : null,
                                highlightReviewerId: null,
                            });
                        }
                    }
                } catch {
                    // ignore — popup won't open if we can't resolve the seller
                }
            })();
        }

        // Clear the navigation state so it doesn't re-trigger
        window.history.replaceState({}, '');
    }, [location?.state]);

    // ── Fetch marketplace reposts by this profile user ───────────────────────
    useEffect(() => {
        if (!profileKey || !profile?.id) return;
        let alive = true;
        const controller = new AbortController();

        (async () => {
            setMarketplaceRepostsLoading(true);
            try {
                const res = await axios.get(`/api/marketplace/reposts/by-user/${profile.id}`, {
                    params: { limit: 100 },
                    signal: controller.signal,
                    withCredentials: true,
                    headers: { ...getAccountHeaders() },
                });
                if (!alive) return;
                const repostItems = Array.isArray(res.data?.items) ? res.data.items : [];
                setMarketplaceReposts(repostItems);
                setMarketplaceRepostsTotal(Number(res.data?.total || 0));
                // Show marketplace tab if user has reposts even without own listings
                if (repostItems.length > 0) setProfileHasListings(true);
            } catch {
                if (alive) {
                    setMarketplaceReposts([]);
                    setMarketplaceRepostsTotal(0);
                }
            } finally {
                if (alive) setMarketplaceRepostsLoading(false);
            }
        })();

        return () => { alive = false; controller.abort(); };
    }, [profileKey, profile?.id, accountCacheKey]);

    // ── Fetch reviews left by this profile user ────────────────────────────
    useEffect(() => {
        if (!profileKey || !profile?.id) return;
        let alive = true;
        const controller = new AbortController();

        (async () => {
            setProfileReviewsLoading(true);
            try {
                const res = await axios.get(`/api/users/${profile.id}/reviews`, {
                    params: { type: 'all', limit: 200 },
                    signal: controller.signal,
                    withCredentials: true,
                });
                if (!alive) return;
                const items = Array.isArray(res.data?.items) ? res.data.items : [];
                // Filter out reviews for entities that have disabled reviews
                const filtered = items.filter((r) => r.allowReviews !== false && r.allow_reviews !== false);
                setProfileReviews(filtered);
                setProfileHasReviews(filtered.length > 0);
                if (res.data?.counts) setReviewsCounts(res.data.counts);
            } catch {
                if (alive) {
                    setProfileReviews([]);
                    setProfileHasReviews(false);
                }
            } finally {
                if (alive) setProfileReviewsLoading(false);
            }
        })();

        return () => {
            alive = false;
            controller.abort();
        };
    }, [profileKey, profile?.id]);

    // ── Fetch event comments for this profile user (Comments sub-tab) ──
    useEffect(() => {
        if (!profileKey || !profile?.id || eventSubTab !== 1) {
            return;
        }
        let alive = true;
        const controller = new AbortController();

        (async () => {
            setEventCommentsLoading(true);
            try {
                const res = await axios.get(`/api/events/user/${profile.id}/event-comments`, {
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

        return () => {
            alive = false;
            controller.abort();
        };
    }, [profileKey, profile?.id, eventSubTab]);


    // Expanded tabs need full Likes/Reposts data (photos + counts)
    // Fetch once per profile key so expanded view can show Likes/Reposts.
    const [engagementLoading, setEngagementLoading] = useState(false);
    const [engagementLikes, setEngagementLikes] = useState([]);
    const [engagementReposts, setEngagementReposts] = useState([]);
    const [engagementComments, setEngagementComments] = useState([]);

    const normalizeEngagementPost = useCallback((post) => {
        if (!post) return null;

        let photos = [];
        const raw = post.photos;

        if (raw) {
            if (typeof raw === 'string') {
                if (raw.startsWith('[')) {
                    try {
                        const parsed = JSON.parse(raw);
                        photos = Array.isArray(parsed)
                            ? parsed.filter((p) => p && typeof p === 'string' && p !== 'null')
                            : [];
                    } catch {
                        if (raw !== 'null' && raw.trim()) photos = [raw];
                    }
                } else if (raw !== 'null' && raw.trim()) {
                    photos = [raw];
                }
            } else if (Array.isArray(raw)) {
                photos = raw.filter((p) => p && typeof p === 'string' && p !== 'null');
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
    }, []);

    useEffect(() => {
        if (!profileKey) {
            setEngagementLikes([]);
            setEngagementReposts([]);
            setEngagementComments([]);
            return;
        }

        let alive = true;
        const controller = new AbortController();

        const tryFetch = async (url) => {
            const acctHeaders = (() => {
                try { return getAccountHeaders(); } catch { return {}; }
            })();
            const res = await secureFetch(url, {
                credentials: 'include',
                signal: controller.signal,
                headers: { ...acctHeaders },
            });
            if (!res.ok) throw new Error('bad_status');
            return res.json();
        };

        (async () => {
            setEngagementLoading(true);
            try {
                const key = encodeURIComponent(profileKey);
                const urls = [
                    `${api}/users/${key}/engagement/posts?types=likes,reposts,comments&limit=500`,
                    `${api}/api/users/${key}/engagement/posts?types=likes,reposts,comments&limit=500`,
                    `/users/${key}/engagement/posts?types=likes,reposts,comments&limit=500`,
                    `/api/users/${key}/engagement/posts?types=likes,reposts,comments&limit=500`,
                ];

                let j = null;
                for (const u of urls) {
                    try {
                        // eslint-disable-next-line no-await-in-loop
                        j = await tryFetch(u);
                        break;
                    } catch {
                        // try next
                    }
                }

                if (!alive) return;

                const mapPosts = (arr) => (Array.isArray(arr) ? arr.map(normalizeEngagementPost).filter(Boolean) : []);
                // Filter out soft-deleted comments the backend may still return
                const mapComments = (arr) => (Array.isArray(arr) ? arr.filter((c) => c && Number(c?.is_removed) !== 1 && c?.is_removed !== true && !c?.removed_at) : []);

                setEngagementLikes(mapPosts(j?.likes));
                setEngagementReposts(mapPosts(j?.reposts));
                setEngagementComments(mapComments(j?.comments));
            } catch {
                if (!alive) return;
                setEngagementLikes([]);
                setEngagementReposts([]);
                setEngagementComments([]);
            } finally {
                if (alive) setEngagementLoading(false);
            }
        })();

        return () => {
            alive = false;
            controller.abort();
        };
    }, [api, profileKey, normalizeEngagementPost, accountCacheKey]);

    // ── Listen for comment deletions from post detail modals ──
    useEffect(() => {
        const onCommentDeleted = (e) => {
            const cid = Number(e?.detail?.commentId || 0);
            if (!cid) return;
            setEngagementComments((prev) => {
                const next = prev.filter((c) => Number(c?.id || c?.comment_id || 0) !== cid);
                return next.length === prev.length ? prev : next;
            });
        };
        window.addEventListener('ll:comment:deleted', onCommentDeleted);
        return () => window.removeEventListener('ll:comment:deleted', onCommentDeleted);
    }, []);

// Keep Likes/Reposts lists in sync when the user toggles actions from any post card
    useEffect(() => {
        const findInAny = (idNum) => {
            const findPost = (arr) => (Array.isArray(arr) ? arr.find((p) => Number(p?.id) === idNum) : null);
            return findPost(feedPosts) || findPost(engagementLikes) || findPost(engagementReposts) || null;
        };

        const onLikeEvt = (e) => {
            const d = e?.detail || {};
            const idNum = Number(d.postId);
            if (!Number.isFinite(idNum)) return;

            const liked = Boolean(d.liked);
            const likesCount = Number(d.likes);
            // The engagement lists represent the PROFILE OWNER's activity.
            // Only add/remove when the action came from the profile owner's
            // personal account.  A business/artist account is a separate
            // identity — their actions must not alter the profile owner's lists.
            const isProfileOwnerAction = !d._acct || d._acct === 'personal';

            const base = findInAny(idNum);

            // Counts are universal; viewer flags are not patched — ActionBar
            // manages its own viewer state via accountCacheKey.
            const patch = (p) => {
                if (!p || Number(p?.id) !== idNum) return p;
                return {
                    ...p,
                    likesCount: Number.isFinite(likesCount) ? likesCount : Number(p?.likesCount ?? p?.likes_count ?? p?.likes ?? 0),
                    likes_count: Number.isFinite(likesCount) ? likesCount : p?.likes_count,
                };
            };

            setEngagementLikes((prev) => {
                const arr = Array.isArray(prev) ? prev.map(patch) : [];
                if (!isProfileOwnerAction) return arr;
                const exists = arr.some((p) => Number(p?.id) === idNum);

                if (liked && !exists) {
                    const toAdd = base ? patch(base) : { id: idNum, viewerLiked: true, likesCount: Number.isFinite(likesCount) ? likesCount : 0 };
                    return [toAdd, ...arr];
                }
                if (!liked && exists && !isMine) {
                    return arr.filter((p) => Number(p?.id) !== idNum);
                }
                return arr;
            });

            // Also keep the main posts feed cards accurate (counts only)
            setFeedPosts((prev) => (Array.isArray(prev) ? prev.map(patch) : prev));
        };

        const onRepostEvt = (e) => {
            const d = e?.detail || {};
            const idNum = Number(d.postId);
            if (!Number.isFinite(idNum)) return;

            const reposted = Boolean(d.reposted);
            const repostsCount = Number(d.reposts);
            const isProfileOwnerAction = !d._acct || d._acct === 'personal';

            const base = findInAny(idNum);

            const patch = (p) => {
                if (!p || Number(p?.id) !== idNum) return p;
                return {
                    ...p,
                    repostsCount: Number.isFinite(repostsCount) ? repostsCount : Number(p?.repostsCount ?? p?.reposts_count ?? p?.reposts ?? 0),
                    reposts_count: Number.isFinite(repostsCount) ? repostsCount : p?.reposts_count,
                };
            };

            setEngagementReposts((prev) => {
                const arr = Array.isArray(prev) ? prev.map(patch) : [];
                if (!isProfileOwnerAction) return arr;
                const exists = arr.some((p) => Number(p?.id) === idNum);

                if (reposted && !exists) {
                    const toAdd = base ? patch(base) : { id: idNum, viewerReposted: true, repostsCount: Number.isFinite(repostsCount) ? repostsCount : 0 };
                    return [toAdd, ...arr];
                }
                if (!reposted && exists && !isMine) {
                    return arr.filter((p) => Number(p?.id) !== idNum);
                }
                return arr;
            });

            setFeedPosts((prev) => (Array.isArray(prev) ? prev.map(patch) : prev));
        };

        window.addEventListener('ll:post:like-changed', onLikeEvt);
        window.addEventListener('ll:post:repost-changed', onRepostEvt);
        return () => {
            window.removeEventListener('ll:post:like-changed', onLikeEvt);
            window.removeEventListener('ll:post:repost-changed', onRepostEvt);
        };
    }, [feedPosts, engagementLikes, engagementReposts, isMine]);
    // Apply an updated post (after edit / mark-found) across the profile UI
    const applyUpdatedCommunityPost = useCallback((updated) => {
        if (!updated || !updated.id) return;
        const idNum = Number(updated.id);
        if (!Number.isFinite(idNum)) return;

        const patched = { ...updated, photos: bumpPhotos(updated.photos) };

        try {
            window.dispatchEvent(new CustomEvent('ll:communityPost:updated', { detail: { post: patched } }));
        } catch {
            /* ignore */
        }

        const patchList = (prev) =>
            Array.isArray(prev)
                ? prev.map((p) => (Number(p?.id) === idNum ? { ...p, ...patched } : p))
                : prev;

        setFeedPosts((prev) => patchList(prev));
        setProfilePostsAll((prev) => patchList(prev));
        setEngagementLikes((prev) => patchList(prev));
        setEngagementReposts((prev) => patchList(prev));
        setActivity((prev) => {
            if (!prev) return prev;
            const next = { ...prev };
            if (Array.isArray(prev.posts)) next.posts = patchList(prev.posts);
            if (Array.isArray(prev.reposts)) next.reposts = patchList(prev.reposts);
            if (Array.isArray(prev.likes)) next.likes = patchList(prev.likes);
            return next;
        });

        setPostsRefreshNonce((n) => n + 1);
    }, [bumpPhotos]);

    const applyDeletedCommunityPost = useCallback((postId) => {
        const idNum = Number(postId);
        if (!Number.isFinite(idNum) || !idNum) return;

        try {
            window.dispatchEvent(new CustomEvent('ll:communityPost:deleted', { detail: { postId: idNum } }));
        } catch {
            /* ignore */
        }

        const removeFromList = (prev) =>
            Array.isArray(prev) ? prev.filter((p) => Number(p?.id) !== idNum) : prev;

        setFeedPosts((prev) => removeFromList(prev));
        setProfilePostsAll((prev) => removeFromList(prev));
        setEngagementLikes((prev) => removeFromList(prev));
        setEngagementReposts((prev) => removeFromList(prev));
        setActivity((prev) => {
            if (!prev) return prev;
            const next = { ...prev };
            if (Array.isArray(prev.posts)) next.posts = removeFromList(prev.posts);
            if (Array.isArray(prev.reposts)) next.reposts = removeFromList(prev.reposts);
            if (Array.isArray(prev.likes)) next.likes = removeFromList(prev.likes);
            return next;
        });

        setPostsRefreshNonce((n) => n + 1);
    }, []);


    // After editing a post (especially photos), refresh the post so the profile list shows the new images immediately.
    // This also cache-busts image URLs via applyUpdatedCommunityPost → bumpPhotos.
    const refreshPostAfterEdit = useCallback(
        async (postId) => {
            const pid = Number(postId);
            if (!Number.isFinite(pid) || pid <= 0) return;

            // Try to fetch the updated post directly (includes updated photos)
            const urls = [
                `${api}/api/community/${pid}`,
                `/api/community/${pid}`,
            ];

            let postObj = null;

            for (const u of urls) {
                try {
                    // eslint-disable-next-line no-await-in-loop
                    const res = await axios.get(u, { withCredentials: true });
                    const data = res?.data;

                    const candidate =
                        (data && typeof data === 'object' && (data.post || data.row || data.data)) ||
                        data;

                    if (candidate && typeof candidate === 'object' && Number(candidate.id) === pid) {
                        postObj = candidate;
                        break;
                    }
                } catch {
                    // try next
                }
            }

            if (postObj) {
                applyUpdatedCommunityPost(postObj);
                return;
            }

            // Fallback: re-fetch the user's posts feed for this profile.
            if (!profileKey) return;

            try {
                const res = await secureFetch(
                    `${api}/api/community?user=${encodeURIComponent(profileKey)}&limit=5000`,
                    { credentials: 'include' }
                );
                const j = await res.json();
                const arr = Array.isArray(j) ? j : Array.isArray(j?.posts) ? j.posts : [];
                setProfilePostsAll(arr);
            } catch {
                // ignore
            }
        },
        [api, applyUpdatedCommunityPost, profileKey]
    );

    const closeEditDialog = useCallback(() => {
        const pid = editPostId;
        setEditOpen(false);
        setEditPostId(null);
        if (pid) refreshPostAfterEdit(pid);
    }, [editPostId, refreshPostAfterEdit]);

    const closeHistoryDialog = useCallback(() => {
        setHistoryOpen(false);
        setHistoryPostId(null);
        setHistoryRows([]);
        setHistoryError('');
        setHistoryLoading(false);
    }, []);

    const closeMarkFoundDialog = useCallback(() => {
        setMarkFoundOpen(false);
        setMarkFoundPostId(null);
        setMarkFoundPost(null);
        setMarkFoundMessage('');
        setMarkFoundError('');
        setMarkFoundSaving(false);
    }, []);

    const submitMarkFound = useCallback(async () => {
        if (!markFoundPostId) return;
        setMarkFoundSaving(true);
        setMarkFoundError('');
        try {
            const payload = { message: markFoundMessage };
            const res = await axios.post(`${api}/api/community/${markFoundPostId}/mark-found`, payload, {
                withCredentials: true,
            });
            const updated = res.data;
            applyUpdatedCommunityPost(updated);
            closeMarkFoundDialog();
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Could not mark this item as found.';
            setMarkFoundError(msg);
        } finally {
            setMarkFoundSaving(false);
        }
    }, [markFoundPostId, markFoundMessage, applyUpdatedCommunityPost, closeMarkFoundDialog]);

    // Avoid object-URL churn and memory leaks for staged images
    const avatarObjectUrl = useMemo(() => (pendingAvatar ? URL.createObjectURL(pendingAvatar) : null), [pendingAvatar]);
    useEffect(() => {
        return () => {
            if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
        };
    }, [avatarObjectUrl]);
    const avatarSrc = avatarObjectUrl || profile?.avatar_url || profile?.profile_picture || undefined;

    const coverObjectUrl = useMemo(() => (pendingCover ? URL.createObjectURL(pendingCover) : null), [pendingCover]);
    useEffect(() => {
        return () => {
            if (coverObjectUrl) URL.revokeObjectURL(coverObjectUrl);
        };
    }, [coverObjectUrl]);
    const coverSrc = deleteCover ? '' : (coverObjectUrl || profile?.cover_url || '');
    const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.handle || 'User';

    // ── Photo comments popup state ──
    const [photoCommentsOpen, setPhotoCommentsOpen] = useState(false);
    const [photoCommentsType, setPhotoCommentsType] = useState('avatar'); // 'avatar' | 'cover' | 'gallery'
    const [photoCommentsPhotoId, setPhotoCommentsPhotoId] = useState(null);
    const [photoCommentsPhotoUrl, setPhotoCommentsPhotoUrl] = useState(null);
    const [photoCommentsHighlightId, setPhotoCommentsHighlightId] = useState(null);

    // Photo report state (avatar/cover/gallery images)
    const [photoReportOpen, setPhotoReportOpen] = useState(false);
    const [photoReportTarget, setPhotoReportTarget] = useState(null);

    const handlePhotoReportOpen = useCallback((photoType, photoUrl, photoId) => {
        setPhotoReportTarget({ photoType, photoUrl: photoUrl || '', photoId: photoId || null, ownerId: Number(profile?.id || 0) });
        setPhotoReportOpen(true);
    }, [profile]);

    const handlePhotoReportSubmit = useCallback(async ({ reason, details }) => {
        if (!photoReportTarget) return;
        try {
            await secureFetch('/api/photos/report', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reason,
                    details,
                    photo_type: photoReportTarget.photoType,
                    photo_url: photoReportTarget.photoUrl,
                    photo_id: photoReportTarget.photoId,
                    owner_user_id: photoReportTarget.ownerId,
                }),
            });
        } catch { /* handled by ReportDialog success state */ }
        setPhotoReportOpen(false);
        setPhotoReportTarget(null);
    }, [photoReportTarget]);

    const profileHandleOrId = profile?.handle || profile?.public_id || profile?.id;
    const hasRealAvatar = Boolean(avatarSrc && !deleteAvatar);
    const hasRealCover = Boolean(coverSrc);

    const openAvatarComments = useCallback(() => {
        if (!hasRealAvatar || editMode || !profileHandleOrId) return;
        if (showPrivateProfileNotice) return;
        setPhotoCommentsType('avatar');
        setPhotoCommentsPhotoId(null);
        setPhotoCommentsPhotoUrl(null);
        setPhotoCommentsOpen(true);
    }, [hasRealAvatar, editMode, profileHandleOrId, showPrivateProfileNotice]);

    const openCoverComments = useCallback(() => {
        if (!hasRealCover || editMode || !profileHandleOrId) return;
        if (showPrivateProfileNotice) return;
        setPhotoCommentsType('cover');
        setPhotoCommentsPhotoId(null);
        setPhotoCommentsPhotoUrl(null);
        setPhotoCommentsOpen(true);
    }, [hasRealCover, editMode, profileHandleOrId, showPrivateProfileNotice]);

    const openGalleryPhotoComments = useCallback((photoId, photoUrl) => {
        if (!photoId) return;
        if (showPrivateProfileNotice) return;
        setPhotoCommentsType('gallery');
        setPhotoCommentsPhotoId(photoId);
        setPhotoCommentsPhotoUrl(photoUrl || null);
        setPhotoCommentsOpen(true);
    }, [showPrivateProfileNotice]);

    // Simple lightbox for gallery thumbnails (no comments — just view photos)
    const openGalleryLightbox = useCallback((photoId, photoUrl) => {
        if (showPrivateProfileNotice) return;
        const photoItems = galleryPhotos.filter((p) => p && p.url);
        const idx = photoItems.findIndex((p) => Number(p.id) === Number(photoId));
        setGalleryLightboxIdx(idx >= 0 ? idx : 0);
        setGalleryLightboxOpen(true);
    }, [showPrivateProfileNotice, galleryPhotos]);

    // ── Auto-open photo comments from notification navigation state ──
    // Header.jsx / NotificationsPage navigates here with llOpenAvatarComments + llPhotoType.
    // ProfileHeader handles avatar type; this effect handles cover and gallery types.
    // We store the pending request and wait for profile to load before opening.
    const [pendingPhotoNotif, setPendingPhotoNotif] = useState(null);

    // Step 1: Capture the notification state from location and clear it
    useEffect(() => {
        const st = location?.state || {};
        if (!st.llOpenAvatarComments) return;

        const photoType = String(st.llPhotoType || 'avatar').toLowerCase();

        // Avatar is handled by ProfileHeader's own useEffect — skip here.
        if (photoType === 'avatar') return;

        // Store the pending notification info
        setPendingPhotoNotif({
            photoType,
            highlightId: st.llAvatarCommentId ? String(st.llAvatarCommentId) : null,
            galleryPhotoId: Number(st.llPhotoId || 0) || null,
            galleryPhotoUrl: st.llPhotoUrl || null,
        });

        // Clear navigation state so refresh/back doesn't re-trigger
        navigate(location.pathname, { replace: true, state: null });
    }, [location, navigate]);

    // Step 2: Once profile is loaded and we have a pending notification, open the dialog
    useEffect(() => {
        if (!pendingPhotoNotif) return;
        if (!profileHandleOrId) return; // profile not loaded yet — wait

        const { photoType, highlightId, galleryPhotoId, galleryPhotoUrl } = pendingPhotoNotif;

        if (photoType === 'cover') {
            setPhotoCommentsHighlightId(highlightId);
            setPhotoCommentsType('cover');
            setPhotoCommentsPhotoId(null);
            setPhotoCommentsPhotoUrl(null);
            setPhotoCommentsOpen(true);
            // Clear pending so it doesn't re-fire
            setPendingPhotoNotif(null);
        } else if (photoType === 'gallery' && galleryPhotoId) {
            // Wait for gallery photos to load so we can resolve the URL
            if (!galleryPhotosLoaded) return; // will re-run once galleryPhotosLoaded becomes true

            // Resolve the photo URL: prefer notification data, fall back to loaded gallery photos
            let resolvedUrl = galleryPhotoUrl || null;
            if (!resolvedUrl && galleryPhotos.length > 0) {
                const match = galleryPhotos.find((p) => Number(p.id) === Number(galleryPhotoId));
                if (match) resolvedUrl = match.url || null;
            }

            setPhotoCommentsHighlightId(highlightId);
            openGalleryPhotoComments(galleryPhotoId, resolvedUrl);
            // Clear pending so it doesn't re-fire
            setPendingPhotoNotif(null);
        } else {
            // Unknown photo type — clear pending
            setPendingPhotoNotif(null);
        }
    }, [pendingPhotoNotif, profileHandleOrId, openGalleryPhotoComments, galleryPhotosLoaded, galleryPhotos]);

    // ── Fetch gallery photos ──
    useEffect(() => {
        if (!profile?.id && !profile?.handle) return;
        let alive = true;
        const handleOrId = profile?.handle || profile?.public_id || profile?.id;
        (async () => {
            try {
                const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');
                const r = await axios.get(`${API_BASE}/users/photos/${encodeURIComponent(handleOrId)}`, { withCredentials: true });
                const items = Array.isArray(r.data?.photos) ? r.data.photos : [];
                if (alive) {
                    setGalleryPhotos(items);
                    setGalleryPhotosLoaded(true);
                }
            } catch {
                if (alive) setGalleryPhotosLoaded(true);
            }
        })();
        return () => { alive = false; };
    }, [profile?.id, profile?.handle, profile?.public_id]);

    // ── Sync edit photos when entering edit mode ──
    useEffect(() => {
        if (editMode && galleryPhotosLoaded) {
            setGalleryPhotosEdit(galleryPhotos.map((p) => ({ id: String(p.id), url: p.url })));
        }
    }, [editMode, galleryPhotosLoaded, galleryPhotos]);

// About edits bubble up from <AboutSection /> so Save Profile persists them
    const onAboutEdit = useCallback((partial) => {
        if (!partial || typeof partial !== 'object') return;
        if (Object.prototype.hasOwnProperty.call(partial, 'bio')) setBioDraft(String(partial.bio ?? '').slice(0, 50));
        if (Object.prototype.hasOwnProperty.call(partial, 'relationship')) setRelationship(partial.relationship ?? '');
        if (Object.prototype.hasOwnProperty.call(partial, 'birthday')) setBirthday(partial.birthday ?? '');
        if (Object.prototype.hasOwnProperty.call(partial, 'home_city')) setHomeCity(partial.home_city ?? '');
        if (Object.prototype.hasOwnProperty.call(partial, 'home_county')) setHomeCounty(partial.home_county ?? '');
    }, []);

    // --- helpers to save/restore scroll for profile page ---
    const saveProfileScrollState = useCallback(() => {
        const key = profile?.handle || profile?.public_id || profile?.id;
        if (!key) return;
        try {
            const winY = window.scrollY || document.documentElement.scrollTop || 0;
            sessionStorage.setItem(`ll:profile:${key}:winY`, String(winY));
        } catch {
            /* ignore */
        }
    }, [profile?.handle, profile?.public_id, profile?.id]);

    // When returning from Post Page, restore the profile scroll positions once.
// IMPORTANT: Do NOT consume (set to "0") the ll:profile:*:restore flag here.
// ProfileEngagementTabs (right-rail scroll) also relies on that same flag to restore its scroll position.
// If we clear it early, the right-rail treats this as a normal visit and resets to the top.
    const restoredWinScrollRef = useRef(false);
    useEffect(() => {
        // Reset one-shot guards when switching profiles.
        restoredWinScrollRef.current = false;
        profilePageRestoredRef.current = false;
        restoringProfilePageStateRef.current = false;
        lastAppliedProfilePageStateRef.current = null;
        hasRestoredRightRailViewRef.current = false;
        restoredRightRailViewsRef.current = new Set();
        userScrolledRef.current = false;
    }, [handleOrId]);

    useEffect(() => {
        if (!profile) return;
        if (restoredWinScrollRef.current) return;

        const keyRaw = profile?.handle || profile?.public_id || profile?.id;
        if (!keyRaw) return;

        const norm = typeof keyRaw === 'string' ? keyRaw.replace(/^@+/, '').trim() : String(keyRaw);
        const candidates = [String(keyRaw), norm, norm ? `@${norm}` : ''].filter(Boolean);

        let shouldRestore = false;
        try {
            // Prefer explicit navigation state, but also support session flags.
            shouldRestore = Boolean(location?.state?.restoreProfile) || candidates.some((k) => sessionStorage.getItem(`ll:profile:${k}:restore`) === '1');
        } catch {
            shouldRestore = Boolean(location?.state?.restoreProfile);
        }

        if (!shouldRestore) return;

        restoredWinScrollRef.current = true;

        // Only restore window scroll if this page actually scrolls (mobile / non-desktop layout).
        // On desktop we pin columns and scroll internally, but this is harmless.
        let y = 0;
        try {
            y = Number(sessionStorage.getItem(`ll:profile:${String(keyRaw)}:winY`) || sessionStorage.getItem(`ll:profile:${norm}:winY`) || '0');
            if (!Number.isFinite(y)) y = 0;
        } catch {
            y = 0;
        }

        requestAnimationFrame(() => {
            window.scrollTo({ top: Math.max(0, y), left: 0, behavior: 'auto' });
        });
    }, [profile, handleOrId, location]);

    // Contact updates (kept simple to avoid hook-lint issues)
    const onChangeContact = (next) => {
        setContact(next);
    };

// FOLLOW / UNFOLLOW / REQUEST FOLLOW
    const toggleFollow = async () => {
        if (!me || !(me.id || me.user_id || me.handle)) {
            try {
                if (auth && typeof auth.open === 'function') auth.open();
                else if (auth && typeof auth.openLoginPopup === 'function') auth.openLoginPopup();
                else if (auth && typeof auth.openLoginModal === 'function') auth.openLoginModal();
                else if (auth && typeof auth.openLogin === 'function') auth.openLogin();
            } catch { /* ignore */ }
            try {
                window.dispatchEvent(new CustomEvent('open-auth-modal'));
                window.dispatchEvent(new CustomEvent('open-login'));
                window.dispatchEvent(new CustomEvent('open-auth-dialog'));
                window.dispatchEvent(new CustomEvent('open-login-popup'));
            } catch { /* ignore */ }
            return;
        }
        if (!profile?.id) return;

        const targetIsPrivate = Boolean(profile?.isPrivateAccount ?? profile?.is_private);

        // UX: if request already sent, do nothing (button should be disabled anyway)
        if (!isFollowing && targetIsPrivate && followRequested) return;

        try {
            const urls = [`${api}/users/follow`, '/api/users/follow', '/users/follow'].filter(Boolean);
            const action = isFollowing ? 'unfollow' : 'follow';

            let resp = null;
            for (const u of urls) {
                try {
                    // eslint-disable-next-line no-await-in-loop
                    resp = await axios.post(u, { target_id: profile.id, action }, { withCredentials: true });
                    break;
                } catch {
                    // try next
                }
            }
            if (!resp) throw new Error('follow api failed');

            const nextFollowing = Boolean(resp.data?.isFollowing);
            const nextRequested = Boolean(resp.data?.followRequested);

            setIsFollowing(nextFollowing);
            setFollowRequested(nextRequested);

            // Only refresh follows UI when the follow state actually changes
            if (nextFollowing !== isFollowing) {
                setFollowsRefreshNonce((n) => n + 1);
                try {
                    followsRef.current?.refresh?.();
                } catch {
                    /* ignore */
                }
            }

            if (action === 'follow' && targetIsPrivate && !nextFollowing) {
                showSuccess(`Follow request sent to ${profile.first_name || profile.handle || 'user'}.`);
            } else {
                showSuccess(`${nextFollowing ? 'Now following' : 'Unfollowed'} ${profile.first_name || profile.handle || 'user'}`);
            }
        } catch (err) {
            setProfileSnack(err.response?.data?.message || 'Failed to update follow status.');
        }
    };


    // helper: refetch latest user profile + activity (soft refresh)
    const refetchProfile = async (key) => {
        try {
            const res = await axios.get(`${api}/users/public/${encodeURIComponent(key)}`, { withCredentials: true });
            const p = res.data.profile || {};
            setCanViewAccount(Boolean(res.data?.canView ?? true));
            setFollowRequested(Boolean(p?.followRequested));
            const withBusted = {
                ...p,
                avatar_url: bump(p.avatar_url || p.profile_picture),
                profile_picture: bump(p.profile_picture || p.avatar_url),
            };
            setProfile(withBusted);
            setActivity(res.data.activity || {});
            notifyMeUpdated(withBusted);
        } catch {
            window.location.reload();
        }
    };

    const unblockUser = useCallback(async () => {
        if (!me || !profile?.id) return;
        const targetId = Number(profile.id);
        try {
            const urls = [`${api}/users/block`, '/api/users/block', '/users/block'].filter(Boolean);
            for (const u of urls) {
                try {
                    await axios.post(u, { target_id: targetId, action: 'unblock' }, { withCredentials: true });
                    break;
                } catch { /* try next */ }
            }
            try {
                window.dispatchEvent(new CustomEvent('ll:user:blocked-changed', { detail: { userId: targetId, targetType: 'personal', blocked: false } }));
            } catch { /* ignore */ }
            setBlockedByMe(false);
            showSuccess('User unblocked.');
            window.location.reload();
        } catch {
            setProfileSnack('Failed to unblock user.');
        }
    }, [me, profile?.id]);

    const unhideUserPosts = useCallback(async () => {
        if (!me || !profile?.id) return;
        try {
            const urls = [`${api}/users/hide`, '/api/users/hide', '/users/hide'].filter(Boolean);
            for (const u of urls) {
                try {
                    // eslint-disable-next-line no-await-in-loop
                    await axios.post(u, { target_id: profile.id, action: 'unhide' }, { withCredentials: true });
                    break;
                } catch {
                    // try next
                }
            }
            setHiddenPostsByMe(false);
            showSuccess('Posts unhidden.');
            setPostsRefreshNonce((n) => n + 1);
        } catch {
            setProfileSnack('Failed to unhide posts.');
        }
    }, [me, profile?.id]);

    const blockUser = useCallback(async () => {
        if (!me || !profile?.id) return;
        const targetId = Number(profile.id);
        try {
            const urls = [`${api}/users/block`, '/api/users/block', '/users/block'].filter(Boolean);
            for (const u of urls) {
                try {
                    await axios.post(u, { target_id: targetId, target_type: 'personal', action: 'block' }, { withCredentials: true });
                    break;
                } catch { /* try next */ }
            }
            try { window.dispatchEvent(new CustomEvent('ll:user:blocked-changed', { detail: { userId: targetId, targetType: 'personal', blocked: true } })); } catch { /* */ }
            setBlockedByMe(true);
            setHiddenPostsByMe(true);
            showSuccess(`${profile?.first_name || profile?.handle || 'User'} blocked.`);
        } catch {
            setProfileSnack('Failed to block user.');
        }
    }, [me, profile?.id, profile?.first_name, profile?.handle]);

    const hideUserPosts = useCallback(async () => {
        if (!me || !profile?.id) return;
        try {
            const urls = [`${api}/users/hide`, '/api/users/hide', '/users/hide'].filter(Boolean);
            for (const u of urls) {
                try {
                    await axios.post(u, { target_id: profile.id, target_type: 'personal', action: 'hide' }, { withCredentials: true });
                    break;
                } catch { /* try next */ }
            }
            try { window.dispatchEvent(new CustomEvent('ll:user:hidden-changed', { detail: { userId: profile.id, targetType: 'personal', hidden: true } })); } catch { /* */ }
            setHiddenPostsByMe(true);
            showSuccess(`Posts from ${profile?.first_name || profile?.handle || 'this user'} hidden.`);
            setPostsRefreshNonce((n) => n + 1);
        } catch {
            setProfileSnack('Failed to hide posts.');
        }
    }, [me, profile?.id, profile?.first_name, profile?.handle]);



    /**
     * SAVE PROFILE
     * - Save textual fields (/users/me)
     * - Save first_name/last_name (+ handle if changed) via /users/profile (form-data)
     * - Refresh view; if handle changed, redirect to the new URL and hard-reload
     */
    const saveProfile = async () => {
        try {
            setHandleError('');
            const currentHandle = profile?.handle || '';
            const nextHandle = (handleDraft || '').replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9_]/g, '');
            const handleChanged = isMine && nextHandle !== currentHandle;

            if (handleChanged && !handleRegex.test(nextHandle)) {
                setHandleError('Username must be 3–30 chars: lowercase letters, numbers, and underscores only.');
                return;
            }

            // normalize contact for save
            const digits = String(contact.phone || '').replace(/\D/g, '').slice(0, 10);
            const phoneFmt =
                digits.length > 6
                    ? `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
                    : digits.length > 3
                        ? `${digits.slice(0, 3)}-${digits.slice(3)}`
                        : digits;

            const canonicalizeSocialForSave = (v, which) => {
                const s = String(v || '').trim();
                if (!s) return '';
                const SOCIAL_MAP = {
                    facebook: { base: 'https://facebook.com/', domain: 'facebook.com' },
                    instagram: { base: 'https://instagram.com/', domain: 'instagram.com' },
                    tiktok: { base: 'https://tiktok.com/@', domain: 'tiktok.com' },
                    x: { base: 'https://x.com/', domain: 'x.com' },
                    linkedin: { base: 'https://linkedin.com/in/', domain: 'linkedin.com' },
                    snapchat: { base: 'https://snapchat.com/add/', domain: 'snapchat.com' },
                };
                const info = SOCIAL_MAP[which];
                if (!info) {
                    // Unknown platform — just ensure a scheme
                    if (/^https?:\/\//i.test(s)) return s;
                    return `https://${s}`;
                }
                const { base, domain } = info;

                if (/^https?:\/\//i.test(s) || s.startsWith('www.')) {
                    const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
                    try {
                        const u = new URL(withScheme);
                        if (u.hostname.includes(domain) || (which === 'x' && u.hostname.includes('twitter.com'))) {
                            const path = u.pathname.replace(/^\/+/, '').replace(/^@/, '');
                            return path ? `${base}${path}` : base;
                        }
                        return withScheme;
                    } catch {
                        return withScheme;
                    }
                }
                if (s.toLowerCase().includes(domain) || (which === 'x' && s.toLowerCase().includes('twitter.com'))) {
                    const targetDomain = s.toLowerCase().includes('twitter.com') ? 'twitter.com' : domain;
                    const idx = s.toLowerCase().indexOf(targetDomain);
                    const after = s.slice(idx + targetDomain.length).replace(/^\/+/, '').replace(/^@/, '');
                    return `${base}${after}`;
                }
                const handle = s.replace(/^@/, '');
                return `${base}${handle}`;
            };

            const normalizeWebsiteForSave = (input) => {
                const s = String(input || '').trim();
                if (!s) return '';
                const withScheme = /^https?:\/\//i.test(s) ? s : `http://${s}`;
                try {
                    const u = new URL(withScheme);
                    const host = u.hostname.startsWith('www.') ? u.hostname : `www.${u.hostname}`;
                    return `${u.protocol}//${host}${u.pathname}${u.search}${u.hash}`;
                } catch {
                    return withScheme.startsWith('http') ? withScheme : `http://${withScheme}`;
                }
            };

            const prevSJ =
                (profile?.social_json &&
                    (typeof profile.social_json === 'string'
                        ? JSON.parse(profile.social_json || '{}')
                        : profile.social_json)) || {};

            const nextSJ = {
                ...prevSJ,
                contact: {
                    phone: phoneFmt || '',
                    email: String(contact.email || '').trim(),
                    facebook: canonicalizeSocialForSave(contact.facebook, 'facebook'),
                    instagram: canonicalizeSocialForSave(contact.instagram, 'instagram'),
                    tiktok: canonicalizeSocialForSave(contact.tiktok, 'tiktok'),
                    x: canonicalizeSocialForSave(contact.x, 'x'),
                    linkedin: canonicalizeSocialForSave(contact.linkedin, 'linkedin'),
                    website: normalizeWebsiteForSave(contact.website || ''),
                    snapchat: canonicalizeSocialForSave(contact.snapchat, 'snapchat'),
                },
            };

            // 1) save fields + social_json.contact
            const payload = {
                bio: String(bioDraft || '').slice(0, 50),
                relationship: relationship || null,
                birthday: birthday || null,
                home_city: alabamaResidentDraft ? (homeCity || null) : null,
                home_county: alabamaResidentDraft ? (homeCounty || null) : null,
                country: alabamaResidentDraft ? 'US' : (countryDraft || 'US'),
                state: alabamaResidentDraft ? 'AL' : (countryDraft === 'US' ? (stateDraft || null) : null),
                is_private: accountPrivacyDraft === 'private' ? 1 : 0,
                profile_bio: String(profileBioDraft || '').slice(0, 120) || null,
                work_history_json: Array.isArray(workHistory) ? workHistory : [],
                education_history_json: Array.isArray(eduHistory) ? eduHistory : [],
                social_json: nextSJ,
            };
            const fieldsRes = await axios.put(`${api}/users/me`, payload, { withCredentials: true });

            // 2) names (and handle if changed) via /users/profile (multipart form-data)
            const fd = new FormData();
            fd.append('first_name', String(firstNameDraft || '').slice(0, 50));
            fd.append('last_name', String(lastNameDraft || '').slice(0, 50));
            if (handleChanged) fd.append('handle', nextHandle);
            if (pendingCover) fd.append('cover_photo', pendingCover, 'cover.jpg');
            else if (deleteCover) fd.append('delete_cover', '1');

            try {
                const profRes = await axios.put(`${api}/users/profile`, fd, { withCredentials: true });
                const userFromProf = profRes.data?.user || profRes.data || {};
                setProfile((p) => ({ ...(p || {}), ...userFromProf }));
            } catch (err) {
                const msg = err.response?.data?.message || 'Unable to save profile at the moment.';
                if (handleChanged) {
                    setHandleError(msg);
                } else {
                    setProfileSnack(msg);
                }
                return;
            }

            // 3) avatar
            if (deleteAvatar) {
                await axios.delete(`${api}/users/me/avatar`, { withCredentials: true });
                const cleared = { avatar_url: null, profile_picture: null };
                setProfile((p) => (p ? { ...p, ...cleared } : p));
                notifyMeUpdated(cleared);
                setPendingAvatar(null);
            } else if (pendingAvatar) {
                const fdA = new FormData();
                fdA.append('file', pendingAvatar, 'avatar.jpg');
                try {
                    const rA = await axios.put(`${api}/users/me/avatar`, fdA, { withCredentials: true });
                    const uA = rA.data || {};
                    setProfile((p) => (p ? { ...p, ...uA } : uA));
                    notifyMeUpdated(uA);
                } catch {
                    const fdA2 = new FormData();
                    fdA2.append('avatar_file', pendingAvatar, 'avatar.jpg');
                    const rA2 = await axios.put(`${api}/users/me/avatar`, fdA2, { withCredentials: true });
                    const uA2 = rA2.data || {};
                    setProfile((p) => (p ? { ...p, ...uA2 } : uA2));
                    notifyMeUpdated(uA2);
                }
            }

            // reflect latest fields from /users/me response
            const updated = fieldsRes.data || {};
            setProfile((p) => ({ ...p, ...updated }));
            notifyMeUpdated(updated);

            // 4) gallery photos — upload new ones, delete removed ones
            try {
                const existingIds = new Set(galleryPhotos.map((p) => String(p.id)));
                const editIds = new Set(galleryPhotosEdit.filter((p) => !p.file).map((p) => String(p.id)));
                // Delete photos that were removed in the edit
                const toDelete = galleryPhotos.filter((p) => !editIds.has(String(p.id)));
                for (const p of toDelete) {
                    try { await axios.delete(`${api}/users/photos/${p.id}`, { withCredentials: true }); } catch { /* ignore */ }
                }
                // Upload new photos (ones that have a file blob)
                const newPhotos = galleryPhotosEdit.filter((p) => p.file);
                if (newPhotos.length > 0) {
                    const fd = new FormData();
                    newPhotos.forEach((p) => fd.append('photos', p.file));
                    await axios.post(`${api}/users/photos`, fd, { withCredentials: true });
                }
                // Refresh gallery photos from server
                const handleOrId = profile?.handle || profile?.public_id || profile?.id;
                if (handleOrId) {
                    try {
                        const r = await axios.get(`${api}/users/photos/${encodeURIComponent(handleOrId)}`, { withCredentials: true });
                        const items = Array.isArray(r.data?.photos) ? r.data.photos : [];
                        setGalleryPhotos(items);
                    } catch { /* ignore */ }
                }
            } catch { /* gallery photo save is best-effort */ }

            setPendingAvatar(null);
            setDeleteAvatar(false);
            setPendingCover(null);
            setPendingCoverBlob(null);
            setDeleteCover(false);
            setEditMode(false);
            showSuccess('Profile updated.');

            // Refresh view:
            if (handleChanged) {
                const to = `/${nextHandle}`;
                navigate(to, { replace: true });
                window.location.replace(to);
            } else {
                const key = profile?.handle || profile?.public_id || profile?.id;
                if (key) await refetchProfile(key);
            }
        } catch (err) {
            setProfileSnack(err.response?.data?.message || 'Failed to save profile.');
        }
    };

    const handleBackToProfile = () => {
        // When leaving the expanded overlay, mirror the current expanded tab/filters back
        // to the right-rail card so the UI stays perfectly in sync.
        try {
            const pk = typeof profileKey === 'string' ? profileKey.replace(/^@+/, '') : profileKey;
            const key = pk ? `ll:profileEngagementState:${pk}` : null;

            const snapshot = {
                tab: Number.isFinite(expandedTab) ? expandedTab : 0,
                category: String(expandedCategory || ''),
                sortBy: String(expandedSort || 'newest'),
                scrollTop: 0,
            };

            if (key) {
                sessionStorage.setItem(key, JSON.stringify(snapshot));
            }

            window.dispatchEvent(
                new CustomEvent('ll:profileEngagement:setState', {
                    detail: { profileKey: pk, ...snapshot },
                })
            );
        } catch {
            /* ignore */
        }

        // If the expanded overlay was opened via ?view=posts, remove that param instead of using history.back().
        // history.back() can send the user back to a PostPage route (exactly the bug you’re seeing).
        try {
            const url = new URL(window.location.href);
            if (url.searchParams.get('view') === 'posts') {
                url.searchParams.delete('view');
                const nextSearch = url.searchParams.toString();
                navigate(`${location.pathname}${nextSearch ? `?${nextSearch}` : ''}`, { replace: true, state: { restoreProfile: true } });
            }
        } catch {
            /* ignore */
        }
        setPostsExpanded(false);
    };

    const handleBackFromEvents = () => {
        try {
            const url = new URL(window.location.href);
            if (url.searchParams.get('view') === 'events') {
                url.searchParams.delete('view');
                const nextSearch = url.searchParams.toString();
                navigate(`${location.pathname}${nextSearch ? `?${nextSearch}` : ''}`, { replace: true, state: { restoreProfile: true } });
            }
        } catch {
            /* ignore */
        }
        setEventsExpanded(false);
    };
    // Expanded/profile posts: block location interactions ONLY when the click originated
    // from the location line itself (not anywhere in the card). This prevents accidental
    // blocking of normal card navigation.
    const blockLocationClicks = (e) => {
        const t = e?.target;
        if (!t || typeof t.closest !== 'function') return;

        // Keyboard: only intercept Enter / Space activations
        if (e?.type === 'keydown') {
            const k = String(e?.key || '');
            if (k !== 'Enter' && k !== ' ') return;
        }

        const interactive = t.closest('a, button, [role="button"]');
        if (!interactive) return;

        const isAnchor = interactive.tagName === 'A';
        const hrefRaw = isAnchor ? String(interactive.getAttribute('href') || '') : '';
        const href = hrefRaw.toLowerCase();

        // Only treat as location-like if the ORIGINAL click target is within a location-marked node,
        // or if it is a direct map link.
        const inLocationNode = !!t.closest('[data-location], [data-post-location], [data-post-location-link]');
        const looksLikeMapHref = isAnchor && (href.includes('google.com/maps') || href.includes('maps') || href.includes('/map'));
        const looksLikeFilteredHref = isAnchor && (/\/(community|posts)\?/.test(href) && /(location|city|county|region)=/.test(href));

        const looksLikeLocation = inLocationNode || looksLikeMapHref || looksLikeFilteredHref;
        if (!looksLikeLocation) return;

        e.preventDefault();
        e.stopPropagation();
    };

    // Open post page from expanded view
    const openPostFromExpanded = useCallback(
        (post) => {
            if (!post || !post.id) return;
            const key = profile?.handle || profile?.public_id || profile?.id;
            const name = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Profile';
            const scTop = postsScrollRef.current?.scrollTop || 0;

            try {
                sessionStorage.setItem(`ll:profile:${key}:posts:expanded`, '1');
                sessionStorage.setItem(`ll:profile:${key}:posts:scroll`, String(scTop));
                const winY = window.scrollY || document.documentElement.scrollTop || 0;
                sessionStorage.setItem(`ll:profile:${key}:winY`, String(winY));
            } catch {
                /* ignore */
            }

            const backHandle = (profile?.handle || '').replace(/^@/, '');
            const backUrl = `/${backHandle || profile?.public_id || profile?.id}?view=posts`;
            navigate(`/posts/${post.id}`, {
                state: {
                    post,
                    fromProfile: true,
                    backProfileId: profile?.id,
                    backProfileHandle: typeof key === 'string' ? key.replace(/^@/, '') : key,
                    backProfileName: name,
                    backToProfileUrl: backUrl,
                    groupContext: (() => {
                        const gidRaw = post?.group_id ?? post?.groupId ?? post?.groupID ?? post?.community_group_id ?? null;
                        const gid = gidRaw != null && String(gidRaw).trim() !== '' ? Number(gidRaw) : null;
                        if (!gid) return null;
                        return {
                            id: gid,
                            name: String(post?.group_name ?? post?.groupName ?? post?.groupTitle ?? ''),
                            avatarUrl: String(post?.group_image_url ?? post?.groupImageUrl ?? post?.groupAvatarUrl ?? ''),
                        };
                    })(),
                },
            });
        },
        [navigate, profile]
    );



    const openCommentFromExpanded = useCallback(
        (commentItem) => {
            const c = commentItem || {};
            const post0 = c.post || {};
            if (!post0 || !post0.id) return;

            const key0 = profile?.handle || profile?.public_id || profile?.id;
            const name0 = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Profile';
            const scTop = postsScrollRef.current?.scrollTop || 0;

            try {
                sessionStorage.setItem(`ll:profile:${key0}:posts:expanded`, '1');
                sessionStorage.setItem(`ll:profile:${key0}:posts:scroll`, String(scTop));
                const winY = window.scrollY || document.documentElement.scrollTop || 0;
                sessionStorage.setItem(`ll:profile:${key0}:winY`, String(winY));
            } catch {
                /* ignore */
            }

            const backHandle = (profile?.handle || '').replace(/^@/, '');
            const backUrl = `/${backHandle || profile?.public_id || profile?.id}?view=posts`;
            navigate(`/posts/${post0.id}`, {
                state: {
                    post: post0,
                    fromProfile: true,
                    backProfileId: profile?.id,
                    backProfileHandle: typeof key0 === 'string' ? key0.replace(/^@/, '') : key0,
                    backProfileName: name0,
                    backToProfileUrl: backUrl,
                    scrollToCommentId: Number(c?.comment_id || c?.id || 0) || undefined,
                },
            });
        },
        [navigate, profile]
    );
    // Expanded posts filters
    const [expandedCategory, setExpandedCategory] = useState('');
    const [expandedSort, setExpandedSort] = useState('newest');

    const expandedActiveBase = useMemo(() => {
        if (expandedTab === 2) return Array.isArray(engagementLikes) ? engagementLikes : [];
        if (expandedTab === 3) return Array.isArray(engagementReposts) ? engagementReposts : [];
        if (expandedTab === 1) return Array.isArray(engagementComments) ? engagementComments : [];
        return Array.isArray(feedPosts) ? feedPosts : [];
    }, [expandedTab, feedPosts, engagementLikes, engagementReposts, engagementComments]);


    const expandedActiveFiltered = useMemo(() => {
        let list = expandedActiveBase;

        if (expandedTab === 1) {
            // Comments activity: group by post
            let out = Array.isArray(list) ? list.slice() : [];

            if (expandedCategory) {
                out = out.filter((c) => matchesCategoryFilter(c?.post?.category || c?.post?.subtype, expandedCategory));
            }

            // Always sort comments newest-first before grouping (so each group has newest first)
            out.sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0));

            const map = new Map();
            const groups = [];

            for (const c of out) {
                const post = c?.post && typeof c.post === 'object' ? c.post : null;
                const pid = Number(post?.id ?? c?.post_id ?? 0);
                if (!Number.isFinite(pid) || pid <= 0) continue;

                if (!map.has(pid)) {
                    const g = { post: post || {}, post_id: pid, comments: [] };
                    map.set(pid, g);
                    groups.push(g);
                }

                map.get(pid).comments.push(c);
            }

            if (expandedSort === 'popular') {
                groups.sort((a, b) => {
                    const aLikes = Number(a?.post?.likesCount ?? a?.post?.likes_count ?? a?.post?.likes ?? 0);
                    const bLikes = Number(b?.post?.likesCount ?? b?.post?.likes_count ?? b?.post?.likes ?? 0);
                    return bLikes - aLikes;
                });
            }

            return groups;
        }

        // Posts / Likes / Reposts
        let out = list;

        if (expandedCategory) {
            out = out.filter((p) => matchesCategoryFilter(p?.category || p?.subtype, expandedCategory));
        }

        return sortPosts(out, expandedSort);
    }, [expandedActiveBase, expandedCategory, expandedSort, expandedTab]);


    // Expanded grid chunking (50 at a time)
    const [expandedRenderCount, setExpandedRenderCount] = useState(50);

    const handleExpandedTabChange = (e, v) => {
        const next = Number.isFinite(Number(v)) ? Number(v) : 0;
        setExpandedTab(next);
        // Clear filters when switching tabs (keep behavior consistent with right-rail)
        setExpandedCategory('');
        setExpandedSort('newest');
        setExpandedRenderCount(50);
        requestAnimationFrame(() => {
            if (postsScrollRef.current) postsScrollRef.current.scrollTop = 0;
        });
    };



    const saveProfilePageState = useCallback(() => {
        if (!profilePageStateKey) return;

        const expandedScrollTop = postsScrollRef.current ? postsScrollRef.current.scrollTop : 0;

        const rightRailEl = findScrollableDescendant(rightRailWrapRef.current);
        const rightRailScrollTop = rightRailEl ? rightRailEl.scrollTop : 0;

        const eventsScrollTop = eventsScrollRef.current ? eventsScrollRef.current.scrollTop : 0;
        const jobsScrollTop = jobsScrollRef.current ? jobsScrollRef.current.scrollTop : 0;
        const servicesScrollTop = servicesScrollRef.current ? servicesScrollRef.current.scrollTop : 0;
        const marketplaceScrollTop = marketplaceScrollRef.current ? marketplaceScrollRef.current.scrollTop : 0;
        const reviewsScrollTop = reviewsScrollRef.current ? reviewsScrollRef.current.scrollTop : 0;

        const snapshot = {
            // page scroll (for the non-expanded profile view)
            windowScrollY: typeof window !== 'undefined' ? window.scrollY : 0,
            rightRailScrollTop: Number.isFinite(rightRailScrollTop) ? rightRailScrollTop : 0,
            eventsScrollTop: Number.isFinite(eventsScrollTop) ? eventsScrollTop : 0,
            jobsScrollTop: Number.isFinite(jobsScrollTop) ? jobsScrollTop : 0,
            servicesScrollTop: Number.isFinite(servicesScrollTop) ? servicesScrollTop : 0,
            marketplaceScrollTop: Number.isFinite(marketplaceScrollTop) ? marketplaceScrollTop : 0,
            reviewsScrollTop: Number.isFinite(reviewsScrollTop) ? reviewsScrollTop : 0,

            // community search state
            communitySearch: communitySearch || '',

            // events tab filter state
            eventsView: eventsView || 'all',
            eventsCategory: eventsCategory || '',
            eventsSort: eventsSort || 'soonest',
            eventsDateFrom: eventsDateFrom || '',
            eventsDateTo: eventsDateTo || '',
            eventsSearch: eventsSearch || '',
            eventSubTab: Number.isFinite(eventSubTab) ? eventSubTab : 0,

            // jobs tab filter state
            jobsCategory: jobsCategory || '',
            jobsSort: jobsSort || 'newest',
            jobsSearch: jobsSearch || '',

            // services tab filter state
            servicesCategory: servicesCategory || '',
            servicesView: servicesView || 'offered',
            servicesSubTab: servicesSubTab || 'services',
            servicesSearch: servicesSearch || '',

            // marketplace tab filter state
            listingsCategory: listingsCategory || '',
            listingsSort: listingsSort || 'newest',
            listingsSearch: listingsSearch || '',
            marketplaceSubTab: marketplaceSubTab || 'listings',

            // reviews tab filter state
            reviewsType: reviewsType || 'all',

            eventsRenderCount: Number.isFinite(eventsRenderCount) ? eventsRenderCount : EVENTS_PAGE_SIZE,
            jobsRenderCount: Number.isFinite(jobsRenderCount) ? jobsRenderCount : JOBS_PAGE_SIZE,
            servicesRenderCount: Number.isFinite(servicesRenderCount) ? servicesRenderCount : SERVICES_PAGE_SIZE,
            listingsRenderCount: Number.isFinite(listingsRenderCount) ? listingsRenderCount : LISTINGS_PAGE_SIZE,
            reviewsRenderCount: Number.isFinite(reviewsRenderCount) ? reviewsRenderCount : REVIEWS_PAGE_SIZE,

            // right rail view tab
            rightRailView: rightRailView || 'community',

            // expanded overlay state
            postsExpanded: !!postsExpanded,
            eventsExpanded: !!eventsExpanded,
            expandedTab: Number.isFinite(expandedTab) ? expandedTab : 0,
            expandedCategory: expandedCategory || '',
            expandedSort: expandedSort || 'newest',
            expandedRenderCount: Number.isFinite(expandedRenderCount) ? expandedRenderCount : 0,
            expandedScrollTop: Number.isFinite(expandedScrollTop) ? expandedScrollTop : 0,

            // keep query string state (so /:handle?view=posts stays / not)
            path: location?.pathname || '',
            search: location?.search || '',
        };

        try {
            sessionStorage.setItem(profilePageStateKey, JSON.stringify(snapshot));
        } catch {
            // ignore storage errors
        }
    }, [
        profilePageStateKey,
        postsExpanded,
        eventsExpanded,
        expandedTab,
        expandedCategory,
        expandedSort,
        expandedRenderCount,
        rightRailView,
        communitySearch,
        eventsView,
        eventsCategory,
        eventsSort,
        eventsDateFrom,
        eventsDateTo,
        eventsSearch,
        eventSubTab,
        jobsCategory,
        jobsSort,
        jobsSearch,
        servicesCategory,
        servicesView,
        servicesSubTab,
        servicesSearch,
        listingsCategory,
        listingsSort,
        listingsSearch,
        reviewsType,
        eventsRenderCount,
        jobsRenderCount,
        servicesRenderCount,
        listingsRenderCount,
        reviewsRenderCount,
        location?.pathname,
        location?.search,
    ]);


    useEffect(() => {
        return () => {
            saveProfilePageState();
        };
    }, [saveProfilePageState]);


    useEffect(() => {
        if (!profilePageStateKey) return;
        if (freshProfileVisitRef.current) return;
        if (!returningFromPostRef.current) return;

        const targetView = String(rightRailView || 'community');
        if (restoredRightRailViewsRef.current.has(targetView)) return;

        let stop = false;
        let tries = 0;
        const maxTries = 120;

        const restore = () => {
            if (stop) return;
            tries += 1;

            const storageKey = getRightRailTabScrollKey(targetView);
            if (!storageKey) {
                restoredRightRailViewsRef.current.add(targetView);
                return;
            }

            let saved = 0;
            try {
                saved = Number(sessionStorage.getItem(storageKey) || '0');
            } catch {
                saved = 0;
            }

            if (!Number.isFinite(saved) || saved <= 0) {
                restoredRightRailViewsRef.current.add(targetView);
                return;
            }

            const el = getRightRailScrollElement(targetView);
            if (!el) {
                if (tries < maxTries) requestAnimationFrame(restore);
                return;
            }

            el.scrollTop = saved;

            if (Math.abs(Number(el.scrollTop || 0) - saved) <= 3 || tries >= maxTries) {
                restoredRightRailViewsRef.current.add(targetView);
                return;
            }

            requestAnimationFrame(restore);
        };

        requestAnimationFrame(() => requestAnimationFrame(restore));

        return () => {
            stop = true;
        };
    }, [
        profilePageStateKey,
        rightRailView,
        getRightRailScrollElement,
        getRightRailTabScrollKey,
        profileEventsLoading,
        profileJobsLoading,
        profileServicesLoading,
        profileListingsLoading,
        profileReviewsLoading,
        eventCommentsLoading,
    ]);

    useEffect(() => {
        const targetView = String(rightRailView || 'community');
        const el = getRightRailScrollElement(targetView);
        if (!el) return undefined;

        const onScroll = () => {
            persistRightRailTabScroll(targetView);
        };

        el.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            el.removeEventListener('scroll', onScroll);
        };
    }, [rightRailView, getRightRailScrollElement, persistRightRailTabScroll]);

    useEffect(() => {
        // When restoring from a PostPage return, we re-apply the saved expanded scrollTop.
        // Do NOT stomp it back to 0 during the restore paint.
        if (restoringProfilePageStateRef.current) return;
        if (!postsExpanded) return;

        setExpandedRenderCount(50);
        requestAnimationFrame(() => {
            if (postsScrollRef.current) postsScrollRef.current.scrollTop = 0;
        });
    }, [expandedCategory, expandedSort, expandedTab, postsExpanded]);

    const expandedVisibleCount = Math.min(expandedRenderCount, expandedActiveFiltered.length);
    const expandedSentinelIndex = Math.max(0, expandedVisibleCount - 10);
    const expandedLoadMoreRef = useRef(null);

    useEffect(() => {
        const el = expandedLoadMoreRef.current;
        const rootEl = postsScrollRef.current;
        if (!el || !rootEl) return;

        const io = new IntersectionObserver(
            (entries) => {
                if (!entries[0].isIntersecting) return;
                setExpandedRenderCount((c) => Math.min(c + 50, expandedActiveFiltered.length));
            },
            { root: rootEl, rootMargin: '600px' }
        );

        io.observe(el);
        return () => io.disconnect();
    }, [expandedActiveFiltered.length, expandedVisibleCount]);


    const expandedCountText = useMemo(() => {
        const total = expandedActiveFiltered.length;
        const showing = Math.min(expandedVisibleCount, total);
        const word = total === 1 ? 'post' : 'posts';
        return `Displaying ${showing} of ${total} ${word}`;
    }, [expandedActiveFiltered.length, expandedVisibleCount]);


    // Ensure the profile initially stays at the top.
    // (We already scroll to top on route change above, but this prevents any child component from pulling the page down
    // during the first paint / data hydrate — e.g. MUI scrollable Tabs calling scrollIntoView on mount.)
    //
    // EARLY guard: MUI Tabs with variant="scrollable" call scrollIntoView on their
    // active indicator during their own useLayoutEffect, which fires BEFORE loading
    // completes. We catch those immediately, independent of loading state.
    useLayoutEffect(() => {
        if (!handleOrId) return;
        if (postsExpanded || eventsExpanded) return;
        if (userScrolledRef.current) return;

        let shouldRestore = false;
        try {
            shouldRestore = sessionStorage.getItem(`ll:profile:${handleOrId}:restore`) === '1';
            if (!shouldRestore && typeof handleOrId === 'string') {
                const norm = handleOrId.replace(/^@/, '');
                shouldRestore = sessionStorage.getItem(`ll:profile:${norm}:restore`) === '1';
            }
            if (!shouldRestore) {
                shouldRestore = !!location?.state?.restoreProfile;
            }
        } catch {
            /* ignore */
        }
        if (shouldRestore) return;

        let cancelled = false;
        const forceTop = () => { if (!cancelled && !userScrolledRef.current) window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); };

        // Immediate reset
        forceTop();

        // Deferred resets to catch late MUI scrollIntoView calls from sticky Tabs
        const rafId = requestAnimationFrame(forceTop);
        const t1 = setTimeout(forceTop, 0);
        const t2 = setTimeout(forceTop, 50);
        const t3 = setTimeout(forceTop, 150);
        const t4 = setTimeout(forceTop, 300);
        const t5 = setTimeout(forceTop, 500);
        return () => {
            cancelled = true;
            cancelAnimationFrame(rafId);
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
            clearTimeout(t5);
        };
    }, [handleOrId, postsExpanded, eventsExpanded]);

    // POST-LOAD guard: once loading finishes, keep forcing scroll to top for an
    // extended window (3s) to catch late MUI scrollable Tabs mounts from secondary
    // data loads (events, jobs, services, marketplace tabs appear asynchronously
    // when profileHas* flips to true, and each mount calls scrollIntoView internally).
    useLayoutEffect(() => {
        if (!handleOrId) return;
        if (postsExpanded || eventsExpanded) return;
        if (loading) return;
        if (userScrolledRef.current) return;

        let shouldRestore = false;
        try {
            shouldRestore = sessionStorage.getItem(`ll:profile:${handleOrId}:restore`) === '1';
            if (!shouldRestore && typeof handleOrId === 'string') {
                const norm = handleOrId.replace(/^@/, '');
                shouldRestore = sessionStorage.getItem(`ll:profile:${norm}:restore`) === '1';
            }
            if (!shouldRestore) {
                shouldRestore = !!location?.state?.restoreProfile;
            }
        } catch {
            /* ignore */
        }
        if (shouldRestore) return;

        // Only force once per profile load
        const k = `ll:profile:${handleOrId}:forcedTop`;
        try {
            if (sessionStorage.getItem(k) === '1') return;
            sessionStorage.setItem(k, '1');
        } catch {
            /* ignore */
        }

        let cancelled = false;
        const forceTop = () => { if (!cancelled && !userScrolledRef.current) window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); };
        forceTop();
        const rafId = requestAnimationFrame(forceTop);
        const t1 = setTimeout(forceTop, 0);
        const t2 = setTimeout(forceTop, 50);
        const t3 = setTimeout(forceTop, 150);
        const t4 = setTimeout(forceTop, 300);

        // Extended guard: MUI scrollable Tabs call Element.scrollIntoView on mount.
        // Secondary data loads (events, jobs, services, marketplace) create new Tabs
        // well after the initial 300ms window.  Use a scroll listener to snap back to
        // top whenever an unexpected scroll-down happens within the first 3 seconds.
        const guardStart = Date.now();
        const GUARD_DURATION = 3000; // ms
        const onScroll = () => {
            if (cancelled) return;
            if (userScrolledRef.current) return;
            if (Date.now() - guardStart > GUARD_DURATION) return;
            // Only snap back if the page scrolled downward (MUI scrollIntoView).
            // Ignore tiny jitter (< 5px).
            const y = window.scrollY || document.documentElement.scrollTop || 0;
            if (y > 5) {
                window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        // Clean up the scroll listener after the guard window expires
        const guardTimer = setTimeout(() => {
            window.removeEventListener('scroll', onScroll);
        }, GUARD_DURATION + 100);

        return () => {
            cancelled = true;
            cancelAnimationFrame(rafId);
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
            clearTimeout(guardTimer);
            window.removeEventListener('scroll', onScroll);
        };
    }, [handleOrId, loading, postsExpanded, eventsExpanded]);

    // Guard against MUI scrollable Tabs scrollIntoView when new right-rail tabs
    // appear (profileHasEvents/Jobs/Services/Listings/Reviews flips to true).
    // Each flip causes a new <Tab> element to mount inside the scrollable Tabs
    // bar, which triggers MUI's internal scrollIntoView on the active indicator.
    useLayoutEffect(() => {
        if (!handleOrId || loading) return;
        if (postsExpanded || eventsExpanded) return;
        if (userScrolledRef.current) return;

        // Don't interfere with scroll restoration
        let shouldRestore = false;
        try {
            shouldRestore = sessionStorage.getItem(`ll:profile:${handleOrId}:restore`) === '1';
            if (!shouldRestore && typeof handleOrId === 'string') {
                shouldRestore = sessionStorage.getItem(`ll:profile:${handleOrId.replace(/^@/, '')}:restore`) === '1';
            }
            if (!shouldRestore) shouldRestore = !!location?.state?.restoreProfile;
        } catch { /* ignore */ }
        if (shouldRestore) return;

        // After a tab-count change, snap back to top if the page was scrolled down
        // by MUI's internal scrollIntoView.  Use rAF to run after the browser
        // processes the MUI layout effect.
        let cancelled = false;
        const snap = () => {
            if (cancelled || userScrolledRef.current) return;
            const y = window.scrollY || document.documentElement.scrollTop || 0;
            if (y > 5) {
                window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            }
        };
        const raf = requestAnimationFrame(snap);
        const t1 = setTimeout(snap, 50);
        const t2 = setTimeout(snap, 150);
        return () => {
            cancelled = true;
            cancelAnimationFrame(raf);
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [handleOrId, loading, postsExpanded, eventsExpanded, profileHasEvents, profileHasJobs, profileHasServices, profileHasListings, profileHasReviews]);

    const leftFollowsCardHeight = useMemo(() => {
        if (!isDesktopLayout) return null;
        const total = Number(rightScrollBoxHeight || 0);
        const headerH = Number(sidebarHeaderHeight || 0);
        const gap = 12; // visual gap between the header card and follows card
        const available = total > 0 ? Math.max(360, total - headerH - gap) : 360;
        return available;
    }, [isDesktopLayout, rightScrollBoxHeight, sidebarHeaderHeight]);

    const eventCategoryCounts = useMemo(() => {
        const filteredByDate = applyProfileEventDateFilter(profileEvents, eventsSort, eventsDateFrom, eventsDateTo);
        const counts = {};
        EVENT_CATEGORY_FILTER_OPTIONS.forEach((option) => {
            counts[option.value] = 0;
        });
        filteredByDate.forEach((event) => {
            const key = String(event?.category || event?.categorySlug || '').toLowerCase();
            if (!key) return;
            counts[key] = Number(counts[key] || 0) + 1;
        });
        return counts;
    }, [profileEvents, eventsSort, eventsDateFrom, eventsDateTo]);

    const totalEventCategoryCount = useMemo(
        () => Object.values(eventCategoryCounts).reduce((sum, value) => sum + Number(value || 0), 0),
        [eventCategoryCounts]
    );

    // ── Community search is passed to ProfileEngagementTabs as searchQuery prop ──

    // ── Filtered/sorted events for the Events tab ────────────────────────
    const filteredProfileEvents = useMemo(() => {
        let list = applyProfileEventDateFilter(profileEvents, eventsSort, eventsDateFrom, eventsDateTo);
        if (eventsSearch.trim()) {
            const q = eventsSearch.trim().toLowerCase();
            list = list.filter((ev) => {
                const title = String(ev?.title || '').toLowerCase();
                const desc = String(ev?.description || '').toLowerCase();
                const cat = String(ev?.category || ev?.categorySlug || '').toLowerCase();
                const city = String(ev?.city || '').toLowerCase();
                const county = String(ev?.county || '').toLowerCase();
                const venue = String(ev?.venueName || ev?.venue_name || ev?.location || '').toLowerCase();
                const orgName = String(ev?.organizer?.firstName || '').toLowerCase() + ' ' + String(ev?.organizer?.lastName || '').toLowerCase();
                const orgHandle = String(ev?.organizer?.handle || '').toLowerCase();
                return title.includes(q) || desc.includes(q) || cat.includes(q) || city.includes(q) || county.includes(q) || venue.includes(q) || orgName.includes(q) || orgHandle.includes(q);
            });
        }
        if (eventsCategory) {
            list = list.filter((ev) => {
                const cat = String(ev?.category || ev?.categorySlug || '').toLowerCase();
                return cat === eventsCategory;
            });
        }

        // Sort by event start date (soonest first)
        const sorter = (a, b) => new Date(a?.startAt || a?.start_at || 0) - new Date(b?.startAt || b?.start_at || 0);

        const hasSections = list.some((ev) => ev?._section);
        if (hasSections) {
            const sectionOrder = ['hosted', 'going', 'interested'];
            const buckets = {};
            for (const s of sectionOrder) buckets[s] = [];
            for (const ev of list) {
                const s = ev?._section || 'hosted';
                (buckets[s] ||= []).push(ev);
            }
            const out = [];
            for (const s of sectionOrder) {
                if (buckets[s]?.length) out.push(...buckets[s].sort(sorter));
            }
            return out;
        }
        list.sort(sorter);
        return list;
    }, [profileEvents, eventsCategory, eventsSort, eventsDateFrom, eventsDateTo, eventsSearch]);

    // Reset render count when data or filters change
    useEffect(() => {
        if (suppressRenderCountResetUntilRef.current > Date.now()) return;
        setEventsRenderCount(EVENTS_PAGE_SIZE);
    }, [profileEvents, eventsCategory, eventsSort, eventsDateFrom, eventsDateTo, eventsSearch, eventsView, eventSubTab]);

    const visibleProfileEvents = useMemo(
        () => filteredProfileEvents.slice(0, eventsRenderCount),
        [filteredProfileEvents, eventsRenderCount]
    );

    const eventsHasMore = eventsRenderCount < filteredProfileEvents.length;

    // Infinite scroll observer for events
    useEffect(() => {
        const node = eventsSentinelRef.current;
        if (!node) return;
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && eventsHasMore) {
                    setEventsRenderCount((c) => Math.min(c + EVENTS_PAGE_SIZE, filteredProfileEvents.length + EVENTS_PAGE_SIZE));
                }
            },
            { rootMargin: '300px' }
        );
        io.observe(node);
        return () => io.disconnect();
    }, [eventsHasMore, filteredProfileEvents.length]);

    // ── Filtered/sorted jobs for the Jobs tab ────────────────────────────
    const filteredProfileJobs = useMemo(() => {
        let list = Array.isArray(profileJobs) ? profileJobs.slice() : [];
        if (jobsSearch.trim()) {
            const q = jobsSearch.trim().toLowerCase();
            list = list.filter((j) => {
                const title = String(j?.title || '').toLowerCase();
                const desc = String(j?.description || '').toLowerCase();
                const cat = String(j?.category || '').toLowerCase();
                const company = String(j?.companyName || j?.company_name || j?.company || '').toLowerCase();
                const city = String(j?.city || '').toLowerCase();
                const county = String(j?.county || '').toLowerCase();
                const location = String(j?.location || '').toLowerCase();
                const posterName = String(j?.poster?.firstName || j?.poster_first_name || '').toLowerCase() + ' ' + String(j?.poster?.lastName || j?.poster_last_name || '').toLowerCase();
                const posterHandle = String(j?.poster?.handle || j?.poster_handle || '').toLowerCase();
                const jobType = String(j?.jobType || j?.job_type || '').toLowerCase();
                return title.includes(q) || desc.includes(q) || cat.includes(q) || company.includes(q) || city.includes(q) || county.includes(q) || location.includes(q) || posterName.includes(q) || posterHandle.includes(q) || jobType.includes(q);
            });
        }
        if (jobsCategory) {
            list = list.filter((j) => {
                const cat = String(j?.category || '').toLowerCase();
                return cat === jobsCategory.toLowerCase();
            });
        }
        if (jobsSort === 'oldest') {
            list.sort((a, b) => new Date(a?.created_at || 0) - new Date(b?.created_at || 0));
        } else {
            list.sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0));
        }
        return list;
    }, [profileJobs, jobsCategory, jobsSort, jobsSearch]);

    useEffect(() => {
        if (suppressRenderCountResetUntilRef.current > Date.now()) return;
        setJobsRenderCount(JOBS_PAGE_SIZE);
    }, [profileJobs, jobsCategory, jobsSort, jobsSearch]);

    const visibleProfileJobs = useMemo(
        () => filteredProfileJobs.slice(0, jobsRenderCount),
        [filteredProfileJobs, jobsRenderCount]
    );

    const jobsHasMore = jobsRenderCount < filteredProfileJobs.length;

    useEffect(() => {
        const node = jobsSentinelRef.current;
        if (!node) return;
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && jobsHasMore) {
                    setJobsRenderCount((c) => Math.min(c + JOBS_PAGE_SIZE, filteredProfileJobs.length + JOBS_PAGE_SIZE));
                }
            },
            { rootMargin: '300px' }
        );
        io.observe(node);
        return () => io.disconnect();
    }, [jobsHasMore, filteredProfileJobs.length]);

    // ── Filtered/sorted services for the Services tab ────────────────────
    const filteredProfileServices = useMemo(() => {
        const source = servicesView === 'favorites' ? profileFavServices : profileServices;
        let list = Array.isArray(source) ? source.slice() : [];
        if (servicesSearch.trim()) {
            const q = servicesSearch.trim().toLowerCase();
            list = list.filter((s) => {
                const title = String(s?.title || s?.name || '').toLowerCase();
                const desc = String(s?.description || '').toLowerCase();
                const cat = String(s?.categorySlug || s?.category_slug || s?.category || '').toLowerCase();
                const catName = String(s?.categoryName || s?.category_name || '').toLowerCase();
                const city = String(s?.city || '').toLowerCase();
                const county = String(s?.county || '').toLowerCase();
                const providerName = String(s?.provider?.firstName || s?.provider_first_name || '').toLowerCase() + ' ' + String(s?.provider?.lastName || s?.provider_last_name || '').toLowerCase();
                const providerHandle = String(s?.provider?.handle || s?.provider_handle || '').toLowerCase();
                return title.includes(q) || desc.includes(q) || cat.includes(q) || catName.includes(q) || city.includes(q) || county.includes(q) || providerName.includes(q) || providerHandle.includes(q);
            });
        }
        if (servicesCategory) {
            list = list.filter((s) => {
                const cat = String(s?.categorySlug || s?.category_slug || '').toLowerCase();
                return cat === servicesCategory.toLowerCase();
            });
        }
        // Favorites stay in favorited-order; offered sort newest first
        if (servicesView !== 'favorites') {
            list.sort((a, b) => new Date(b?.createdAt || b?.created_at || 0) - new Date(a?.createdAt || a?.created_at || 0));
        }
        return list;
    }, [profileServices, profileFavServices, servicesView, servicesCategory, servicesSearch]);

    useEffect(() => {
        if (suppressRenderCountResetUntilRef.current > Date.now()) return;
        setServicesRenderCount(SERVICES_PAGE_SIZE);
        setServicesCategory('');
    }, [servicesView]);

    useEffect(() => {
        if (suppressRenderCountResetUntilRef.current > Date.now()) return;
        setServicesRenderCount(SERVICES_PAGE_SIZE);
    }, [profileServices, profileFavServices, servicesCategory, servicesSearch]);

    // Auto-switch to favorites view if user has no offered services but has favorites
    useEffect(() => {
        if (suppressRenderCountResetUntilRef.current > Date.now()) return;
        if (!profileServicesLoading && !profileFavServicesLoading) {
            if (profileServices.length === 0 && profileFavServices.length > 0) {
                setServicesView('favorites');
            }
        }
    }, [profileServices.length, profileFavServices.length, profileServicesLoading, profileFavServicesLoading]);

    const visibleProfileServices = useMemo(
        () => filteredProfileServices.slice(0, servicesRenderCount),
        [filteredProfileServices, servicesRenderCount]
    );

    const servicesHasMore = servicesRenderCount < filteredProfileServices.length;

    useEffect(() => {
        const node = servicesSentinelRef.current;
        if (!node) return;
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && servicesHasMore) {
                    setServicesRenderCount((c) => Math.min(c + SERVICES_PAGE_SIZE, filteredProfileServices.length + SERVICES_PAGE_SIZE));
                }
            },
            { rootMargin: '300px' }
        );
        io.observe(node);
        return () => io.disconnect();
    }, [servicesHasMore, filteredProfileServices.length]);

    // ── Filtered/sorted marketplace listings ─────────────────────────────
    const filteredProfileListings = useMemo(() => {
        let list = Array.isArray(profileListings) ? profileListings.slice() : [];
        if (listingsSearch.trim()) {
            const q = listingsSearch.trim().toLowerCase();
            list = list.filter((l) => {
                const title = String(l?.title || '').toLowerCase();
                const desc = String(l?.description || '').toLowerCase();
                const cat = String(l?.category || '').toLowerCase();
                const city = String(l?.city || '').toLowerCase();
                const county = String(l?.county || '').toLowerCase();
                const location = String(l?.location || '').toLowerCase();
                const sellerName = String(l?.seller?.firstName || l?.seller_first_name || '').toLowerCase() + ' ' + String(l?.seller?.lastName || l?.seller_last_name || '').toLowerCase();
                const sellerHandle = String(l?.seller?.handle || l?.seller_handle || '').toLowerCase();
                const condition = String(l?.condition || '').toLowerCase();
                return title.includes(q) || desc.includes(q) || cat.includes(q) || city.includes(q) || county.includes(q) || location.includes(q) || sellerName.includes(q) || sellerHandle.includes(q) || condition.includes(q);
            });
        }
        if (listingsCategory) {
            list = list.filter((l) => {
                const cat = String(l?.category || '').trim();
                return cat.toLowerCase() === listingsCategory.toLowerCase();
            });
        }
        if (listingsSort === 'price_low') {
            list.sort((a, b) => (Number(a?.price_cents || 0)) - (Number(b?.price_cents || 0)));
        } else if (listingsSort === 'price_high') {
            list.sort((a, b) => (Number(b?.price_cents || 0)) - (Number(a?.price_cents || 0)));
        } else {
            list.sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0));
        }
        return list;
    }, [profileListings, listingsSearch, listingsCategory, listingsSort]);

    useEffect(() => {
        if (suppressRenderCountResetUntilRef.current > Date.now()) return;
        setListingsRenderCount(LISTINGS_PAGE_SIZE);
    }, [profileListings, listingsSearch, listingsCategory, listingsSort]);

    const visibleProfileListings = useMemo(
        () => filteredProfileListings.slice(0, listingsRenderCount),
        [filteredProfileListings, listingsRenderCount]
    );

    const listingsHasMore = listingsRenderCount < filteredProfileListings.length;

    useEffect(() => {
        const node = listingsSentinelRef.current;
        if (!node) return;
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && listingsHasMore) {
                    setListingsRenderCount((c) => Math.min(c + LISTINGS_PAGE_SIZE, filteredProfileListings.length + LISTINGS_PAGE_SIZE));
                }
            },
            { rootMargin: '300px' }
        );
        io.observe(node);
        return () => io.disconnect();
    }, [listingsHasMore, filteredProfileListings.length]);

    // ── Filtered reviews ─────────────────────────────────────────────────
    const filteredProfileReviews = useMemo(() => {
        if (reviewsType === 'all') return profileReviews;
        return profileReviews.filter((r) => {
            const src = r?.source || '';
            if (reviewsType === 'businesses') return src === 'business' || src === 'businesses';
            if (reviewsType === 'services') return src === 'service' || src === 'services';
            if (reviewsType === 'marketplace') return src === 'marketplace';
            return src === reviewsType;
        });
    }, [profileReviews, reviewsType]);

    useEffect(() => {
        if (suppressRenderCountResetUntilRef.current > Date.now()) return;
        setReviewsRenderCount(REVIEWS_PAGE_SIZE);
    }, [reviewsType]);

    const visibleProfileReviews = useMemo(
        () => filteredProfileReviews.slice(0, reviewsRenderCount),
        [filteredProfileReviews, reviewsRenderCount]
    );

    const reviewsHasMore = reviewsRenderCount < filteredProfileReviews.length;

    useEffect(() => {
        const node = reviewsSentinelRef.current;
        if (!node) return;
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && reviewsHasMore) {
                    setReviewsRenderCount((c) => Math.min(c + REVIEWS_PAGE_SIZE, filteredProfileReviews.length + REVIEWS_PAGE_SIZE));
                }
            },
            { rootMargin: '300px' }
        );
        io.observe(node);
        return () => io.disconnect();
    }, [reviewsHasMore, filteredProfileReviews.length]);

    const handleListingClick = useCallback((listing) => {
        const lid = listing?.id;
        if (!lid) return;
        setSelectedListingId(lid);
    }, []);

    const handleListingDetailClose = useCallback(() => {
        const lid = selectedListingId;
        setSelectedListingId(null);
        setHighlightReviewId(null);
        setHighlightReviewerId(null);
        if (!lid) return;
        // Bump the local view count so the grid card reflects the new view
        const bumpViews = (prev) =>
            prev.map((l) =>
                l.id === lid
                    ? { ...l, viewsCount: (l.viewsCount || 0) + 1, views_count: (l.views_count || l.viewsCount || 0) + 1 }
                    : l
            );
        setProfileListings(bumpViews);
        setMarketplaceReposts(bumpViews);
        // Refresh listings to pick up sold/relist status changes
        setListingsRefreshNonce((n) => n + 1);
    }, [selectedListingId]);

    const [selectedServicePopup, setSelectedServicePopup] = useState(null);
    const [selectedEventPopup, setSelectedEventPopup] = useState(null);
    const [eventScrollToCommentId, setEventScrollToCommentId] = useState(null);
    const [eventHighlightCommentId, setEventHighlightCommentId] = useState(null);
    const [selectedJobPopup, setSelectedJobPopup] = useState(null);
    const [applyJobTarget, setApplyJobTarget] = useState(null);
    const [selectedBusinessPopup, setSelectedBusinessPopup] = useState(null);
    const [selectedBusinessPopupTab, setSelectedBusinessPopupTab] = useState(0);
    const [selectedServicePopupTab, setSelectedServicePopupTab] = useState(0);
    const [highlightReviewId, setHighlightReviewId] = useState(null);
    const [highlightReviewerId, setHighlightReviewerId] = useState(null);

    // ── DOM-based review highlight fallback ──
    // When a popup opens with a highlightReviewId, switch to the Reviews tab
    // and apply gold highlight styling directly via DOM. This works even when
    // wrapper components (ServicePopupDialog) don't forward highlight props.
    // The highlighted review is boosted to the top by the child component's
    // sort logic, so no scrolling is needed — just ensure the tab is selected
    // and apply styling with IntersectionObserver-based dismiss.
    useEffect(() => {
        if (!highlightReviewId && !highlightReviewerId) return;
        if (!selectedServicePopup && !selectedBusinessPopup && !selectedListingId) return;

        const BRASS = '#A87822';
        const timers = [];
        let found = false;
        let observer = null;

        const clickReviewsTab = () => {
            // Find and click the "Reviews" tab button inside any open dialog
            const dialogs = document.querySelectorAll('[role="dialog"], .MuiDialog-root');
            for (const dialog of dialogs) {
                const tabs = dialog.querySelectorAll('[role="tab"], .MuiTab-root, button.MuiTab-root');
                for (const tab of tabs) {
                    const label = (tab.textContent || '').trim().toLowerCase();
                    if (label.startsWith('review')) {
                        tab.click();
                        return true;
                    }
                }
            }
            return false;
        };

        const tryHighlight = () => {
            if (found) return true;
            const selectors = [
                `[id="review-highlight-${highlightReviewId}"]`,
                `[data-service-review-id="${highlightReviewId}"]`,
                `[data-review-id="${highlightReviewId}"]`,
                `[data-seller-review-id="${highlightReviewId}"]`,
            ];
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el) {
                    el.style.borderRadius = '10px';
                    el.style.border = `2px solid ${BRASS}73`;
                    el.style.backgroundColor = `${BRASS}0F`;
                    el.style.boxShadow = `0 0 16px ${BRASS}26`;
                    el.style.padding = '12px';
                    el.style.margin = '4px -12px';
                    el.style.transition = 'background-color 600ms ease, box-shadow 600ms ease, border-color 600ms ease';
                    // IntersectionObserver: dismiss highlight after user sees it
                    if (observer) observer.disconnect();
                    observer = new IntersectionObserver(([entry]) => {
                        if (entry.isIntersecting) {
                            observer.disconnect();
                            observer = null;
                            setTimeout(() => {
                                el.style.border = '';
                                el.style.backgroundColor = '';
                                el.style.boxShadow = '';
                                el.style.padding = '';
                                el.style.margin = '';
                            }, 1800);
                        }
                    }, { threshold: 0.3 });
                    observer.observe(el);
                    found = true;
                    return true;
                }
            }
            return false;
        };

        // Step 1: Click the Reviews tab (retry a few times as dialog may still be mounting)
        timers.push(setTimeout(clickReviewsTab, 300));
        timers.push(setTimeout(clickReviewsTab, 600));

        // Step 2: Try to find and highlight the review (retry as reviews load async)
        [800, 1400, 2200, 3500, 5000].forEach((ms) => {
            timers.push(setTimeout(() => {
                if (!found) clickReviewsTab(); // ensure tab is still selected
                tryHighlight();
            }, ms));
        });

        return () => { timers.forEach(clearTimeout); if (observer) observer.disconnect(); };
    }, [highlightReviewId, highlightReviewerId, selectedServicePopup, selectedBusinessPopup, selectedListingId]);

    // ── Intercept navigation to /messages while a service or listing popup is open ──
    // Child components (ServicePopupDialog, MarketplaceListingDetailPanel) may call
    // navigate('/messages/...') when the message button is clicked. Instead of leaving
    // the profile page, we catch that navigation, go back, and open the message center
    // popover so the user stays on the profile with the popup still visible.
    const popupOpenRef = useRef(false);
    popupOpenRef.current = Boolean(selectedServicePopup) || Boolean(selectedListingId) || Boolean(selectedBusinessPopup);

    useEffect(() => {
        if (!popupOpenRef.current) return;
        const path = location.pathname || '';
        if (!path.startsWith('/messages')) return;

        // Extract userId from /messages/:userId or /messages/new/:userId patterns
        const segments = path.split('/').filter(Boolean);
        let targetUserId = null;
        if (segments.length >= 2) {
            const last = segments[segments.length - 1];
            if (/^\d+$/.test(last)) targetUserId = last;
        }

        // Go back to the profile page
        navigate(-1);

        // Open the message center popover
        if (targetUserId) {
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('open-message-center', { detail: { userId: Number(targetUserId) } }));
            }, 100);
        }
    }, [location.pathname, navigate]);

    const handleServiceClick = useCallback((svc) => {
        if (!svc?.id && !svc?.service_id) return;
        setSelectedServicePopup(svc);
    }, []);

    // ── Toggle favorite on a service card ──
    const handleServiceFavorite = useCallback(async (svc, opts) => {
        if (!svc?.id) return;

        const fromCard = opts?.fromCard;
        const cardFavorited = opts?.favorited;
        const cardFavCount = opts?.favoritesCount;

        // If the card already made the API call and confirmed, just sync state — don't call API again
        if (fromCard && cardFavorited !== undefined) {
            const svcId = String(svc.id);
            const favorited = Boolean(cardFavorited);
            const favoritesCount = Number(cardFavCount ?? 0);

            setProfileServices((prev) =>
                prev.map((item) =>
                    String(item.id || item.service_id) !== svcId ? item : {
                        ...item,
                        isFavorited: favorited,
                        is_favorited: favorited,
                        favoritesCount,
                        favorites_count: favoritesCount,
                    }
                )
            );

            setSelectedServicePopup((prev) => {
                if (!prev || String(prev.id) !== svcId) return prev;
                return {
                    ...prev,
                    isFavorited: favorited,
                    is_favorited: favorited,
                    favoritesCount,
                    favorites_count: favoritesCount,
                };
            });

            if (favorited) {
                setProfileFavServices((prev) => {
                    const exists = prev.some((item) => String(item.id || item.service_id) === svcId);
                    if (exists) {
                        return prev.map((item) =>
                            String(item.id || item.service_id) !== svcId ? item : {
                                ...item, isFavorited: true, is_favorited: true, favoritesCount, favorites_count: favoritesCount,
                            }
                        );
                    }
                    return [...prev, { ...svc, isFavorited: true, is_favorited: true, favoritesCount, favorites_count: favoritesCount }];
                });
            } else {
                setProfileFavServices((prev) =>
                    prev.filter((item) => String(item.id || item.service_id) !== svcId)
                );
            }
            return;
        }

        // Called without fromCard (e.g. from detail panel fallback) — make API call
        try {
            const result = await toggleServiceFavorite(svc.id);
            if (!result) return;
            const { favorited, favoritesCount } = result;
            const svcId = String(svc.id);

            setProfileServices((prev) =>
                prev.map((item) =>
                    String(item.id || item.service_id) !== svcId ? item : {
                        ...item,
                        isFavorited: favorited,
                        is_favorited: favorited,
                        favoritesCount,
                        favorites_count: favoritesCount,
                    }
                )
            );

            setSelectedServicePopup((prev) => {
                if (!prev || String(prev.id) !== svcId) return prev;
                return {
                    ...prev,
                    isFavorited: favorited,
                    is_favorited: favorited,
                    favoritesCount,
                    favorites_count: favoritesCount,
                };
            });

            if (favorited) {
                setProfileFavServices((prev) => {
                    const exists = prev.some((item) => String(item.id || item.service_id) === svcId);
                    if (exists) {
                        return prev.map((item) =>
                            String(item.id || item.service_id) !== svcId ? item : {
                                ...item, isFavorited: true, is_favorited: true, favoritesCount, favorites_count: favoritesCount,
                            }
                        );
                    }
                    return [...prev, { ...svc, isFavorited: true, is_favorited: true, favoritesCount, favorites_count: favoritesCount }];
                });
            } else {
                setProfileFavServices((prev) =>
                    prev.filter((item) => String(item.id || item.service_id) !== svcId)
                );
            }
        } catch {
            // silent
        }
    }, []);

    // ── Message a service provider ──
    const handleServiceMessage = useCallback((svc) => {
        if (!svc) return;
        const providerId = svc.providerId || svc.provider_id || svc.createdByUserId || svc.created_by_user_id;
        if (providerId) {
            window.dispatchEvent(new CustomEvent('open-message-center', { detail: { userId: providerId } }));
        }
    }, []);

    // ── Marketplace listing actions ──
    const handleListingFavorite = useCallback(async (listing) => {
        if (!listing?.id) return;
        try {
            const result = await toggleListingFavorite(listing.id, { businessId: activeBusinessId, artistId: activeArtistId });
            if (!result) return;
            const listingId = String(listing.id);
            setProfileListings((prev) =>
                prev.map((l) =>
                    String(l.id) !== listingId ? l : {
                        ...l,
                        isFavorited: Boolean(result.favorited),
                        is_favorited: Boolean(result.favorited),
                        favoritesCount: typeof result.favoritesCount === 'number' ? result.favoritesCount : l.favoritesCount,
                        favorites_count: typeof result.favoritesCount === 'number' ? result.favoritesCount : l.favorites_count,
                    }
                )
            );
            if (isMine) setListingsRefreshNonce((n) => n + 1);
        } catch { /* silent */ }
    }, [activeBusinessId, activeArtistId, isMine]);

    const handleListingRepost = useCallback(async (listing) => {
        if (!listing?.id) return;
        try {
            const result = await toggleListingRepost(listing.id, { businessId: activeBusinessId, artistId: activeArtistId });
            if (!result) return;
            const listingId = String(listing.id);
            setProfileListings((prev) =>
                prev.map((l) =>
                    String(l.id) !== listingId ? l : {
                        ...l,
                        isReposted: Boolean(result.reposted),
                        is_reposted: Boolean(result.reposted),
                        repostsCount: typeof result.repostsCount === 'number' ? result.repostsCount : l.repostsCount,
                        reposts_count: typeof result.repostsCount === 'number' ? result.repostsCount : l.reposts_count,
                    }
                )
            );
            showSuccess(result.reposted ? 'Reposted!' : 'Repost removed');
            if (isMine) setListingsRefreshNonce((n) => n + 1);
        } catch { /* silent */ }
    }, [activeBusinessId, activeArtistId, isMine]);

    const handleListingFlag = useCallback((listing) => {
        if (!listing?.id) return;
        setListingFlagTarget(listing);
    }, []);

    const handleListingFlagSubmit = useCallback(async ({ reason, details }) => {
        if (!listingFlagTarget?.id) return;
        try {
            await flagListing(listingFlagTarget.id, { reason, details });
            showSuccess('Report submitted. Thank you.');
        } catch {
            setListingSnackMsg('Could not submit report. Please try again.');
        }
        setListingFlagTarget(null);
    }, [listingFlagTarget]);

    const handleListingContact = useCallback((listing) => {
        if (!listing?.id) return;
        const sellerId = listing.userId || listing.user_id || listing.sellerId || listing.seller_id;
        if (sellerId) {
            window.dispatchEvent(new CustomEvent('open-message-center', { detail: { userId: sellerId } }));
        }
    }, []);

    const handleJobClick = useCallback((job) => {
        if (!job?.id) return;
        setSelectedJobPopup(job);
    }, []);

    // ── Edit/Delete handlers for Events ──
    const handleEditEvent = useCallback((evt) => {
        setEditingEvent(evt);
        setEditEventOpen(true);
    }, []);

    const handleDeleteEvent = useCallback(() => {
        setEventsRefreshNonce((n) => n + 1);
        showSuccess('Event deleted successfully');
    }, [showSuccess]);

    const handleEventSaved = useCallback(() => {
        setEditEventOpen(false);
        setEditingEvent(null);
        setEventsRefreshNonce((n) => n + 1);
        showSuccess('Event updated successfully');
    }, [showSuccess]);

    // Update local event state when engagement (like/repost/rsvp/interested) is toggled on a card
    const handleEventEngagementChange = useCallback((eventId, field, value) => {
        setProfileEvents((prev) =>
            prev.map((ev) =>
                String(ev.id) === String(eventId)
                    ? {
                        ...ev,
                        viewerEngagement: { ...ev.viewerEngagement, [field]: value },
                        engagement: {
                            ...ev.engagement,
                            counts: {
                                ...ev.engagement?.counts,
                                [field]: Math.max(0, (ev.engagement?.counts?.[field] || 0) + (value ? 1 : -1)),
                            },
                        },
                    }
                    : ev
            )
        );
    }, []);

    // ── Edit/Delete handlers for Jobs ──
    const handleEditJob = useCallback((job) => {
        setEditingJob(job);
        setEditJobOpen(true);
    }, []);

    const handleDeleteJobClick = useCallback((job) => {
        setDeleteJobTarget(job);
    }, []);

    const handleConfirmDeleteJob = useCallback(async () => {
        if (!deleteJobTarget?.id) return;
        setIsDeletingJob(true);
        try {
            await deleteJob(deleteJobTarget.id);
            setDeleteJobTarget(null);
            setJobsRefreshNonce((n) => n + 1);
            showSuccess('Job deleted successfully');
        } catch { /* ignore */ }
        setIsDeletingJob(false);
    }, [deleteJobTarget, showSuccess]);

    const handleJobSaved = useCallback(() => {
        setEditJobOpen(false);
        setEditingJob(null);
        setJobsRefreshNonce((n) => n + 1);
        showSuccess('Job updated successfully');
    }, [profile?.id, showSuccess]);

    // ── Save/unsave a job listing (profile Jobs tab) ──
    const handleJobSaveToggle = useCallback(async (job) => {
        if (!job?.id) return;
        try {
            const result = await saveJob(job.id);
            if (!result) return;
            const jobId = String(job.id);
            setProfileJobs((prev) =>
                prev.map((j) =>
                    String(j.id) !== jobId ? j : {
                        ...j,
                        viewerSaved: typeof result.saved === 'boolean' ? result.saved : !j.viewerSaved,
                        isSaved: typeof result.saved === 'boolean' ? result.saved : !j.isSaved,
                        is_saved: typeof result.saved === 'boolean' ? result.saved : !j.is_saved,
                    }
                )
            );
        } catch {
            // ignore — optimistic UI already toggled in JobCard
        }
    }, []);

    // ── Share a job listing (profile Jobs tab) ──
    const handleJobShare = useCallback((job) => {
        setSharePost(job);
        setShareContentType('job');
        setShareOpen(true);
    }, []);

    // ── Apply for a job listing (navigates to the job detail page) ──
    const handleJobApply = useCallback((job) => {
        if (!job?.id) return;
        setApplyJobTarget(job);
    }, []);

    // ── Report a job listing ──
    const handleJobReport = useCallback((job) => {
        if (!job?.id) return;
        window.dispatchEvent(new CustomEvent('ll:report', { detail: { entityType: 'job', entityId: job.id, job } }));
    }, []);

    // ── Renew/extend a job listing (profile Jobs tab) ──
    const handleRenew = useCallback((job) => {
        setRenewTarget(job);
        setRenewDays(30);
        setRenewError(null);
    }, []);

    const handleConfirmRenew = useCallback(async () => {
        if (!renewTarget) return;
        setIsRenewing(true);
        setRenewError(null);
        try {
            await renewJob(renewTarget.id, renewDays);
            setRenewTarget(null);
            setJobsRefreshNonce((n) => n + 1);
        } catch (err) {
            setRenewError(err);
        } finally {
            setIsRenewing(false);
        }
    }, [renewTarget, renewDays]);

    const handleEventClick = useCallback((ev) => {
        if (!ev?.id) return;
        setSelectedEventPopup(ev);
    }, []);

    const openEventComment = useCallback((commentItem, eventObj) => {
        if (!eventObj?.id) return;
        const viewOnly = Boolean(commentItem?._viewEventOnly);
        const commentId = viewOnly ? null : (Number(commentItem?.comment_id || commentItem?.id || 0) || null);
        setEventScrollToCommentId(commentId);
        setEventHighlightCommentId(commentId);
        setSelectedEventPopup(eventObj);
    }, []);

    // Always default to Community tab when returning to the profile page.
    // Events/jobs now open as in-page popups so there's no need to restore
    // the previous right-rail view on navigation return.
    useEffect(() => {
        if (!profileKey || !returningFromPostRef.current || hasRestoredRightRailViewRef.current) return;
        hasRestoredRightRailViewRef.current = true;
        setRightRailView('community');
    }, [profileKey, profile?.handle, profile?.public_id, profile?.id]);

    // Gate initial render behind profile load (and no hard error)
    const pageLoading = !error && loading;
    if (pageLoading) {
        return <FullScreenDots />;
    }

    // Determine the viewed profile's account type
    const viewedAccountType = (profile?.account_type || '').toLowerCase();
    const isBusinessOrArtistProfile = viewedAccountType === 'business' || viewedAccountType === 'artist';

    // If the OTHER user has blocked us:
    // - Personal profiles: show "Not Found" so the visitor doesn't know they were blocked.
    // - Business/Artist profiles: still show the profile (it's public-facing) but restrict interactions.
    if (!isMine && blockedByOther && !isBusinessOrArtistProfile) {
        return <NotFound />;
    }

    const isPrivateAccount = Boolean(profile?.isPrivateAccount ?? profile?.is_private);
    const canViewProfile = Boolean(isMine || canViewAccount) && !blockedByMe;

    // Section privacy checks
    const canViewAbout = canViewProfile && canViewSection(privacy?.about);
    const canViewContact = canViewProfile && canViewSection(privacy?.contact);
    const canViewWork = canViewProfile && canViewSection(privacy?.work_history);
    const canViewEducation = canViewProfile && canViewSection(privacy?.education_history);
    const canViewFollows = canViewProfile && canViewSection(privacy?.follows);
    const canViewPhotos = canViewProfile && canViewSection(privacy?.photos);

    // Posts privacy
    const canViewPosts = canViewProfile && canViewSection(privacy?.posts || 'public');

    return (
        <Fade in={pageFadeIn || reduceMotion} appear timeout={reduceMotion ? 0 : 220}>
            <Box
                ref={pageRef}
                sx={(t) => ({
                    pb: { xs: 0, md: 0 },
                    pt: { xs: `${chromeTop}px`, md: 0 },
                    background: { xs: t.palette.background.paper, md: t.palette.background.default },
                    minHeight: { xs: `calc(100vh - ${chromeTop}px)`, md: 0 },
                    display: { xs: 'block', md: 'flex' },
                    flexDirection: { md: 'column' },
                })}
            >
                {/* Suppress focus rings on profile page Cards — prevents colored border on click */}
                <style>{`
                    .MuiCard-root:focus,
                    .MuiCard-root:focus-visible,
                    .MuiCard-root:focus-within {
                        outline: none !important;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.04) !important;
                    }
                `}</style>
                {error && isNetworkError(rawLoadError) && !profile && (
                    <Box sx={{ maxWidth: 1400, mx: 'auto', px: 2, mt: 4 }}>
                        <NetworkErrorState />
                    </Box>
                )}

                {error && !isNetworkError(rawLoadError) && (
                    <Box sx={{ maxWidth: 1400, mx: 'auto', px: 2, mt: 1 }}>
                        <Alert severity="error" onClose={() => setError('')}>
                            {error}
                        </Alert>
                    </Box>
                )}

                {/* MAIN PROFILE — hidden when the expanded page is active */}
                <Box
                    sx={{
                        display: (postsExpanded || eventsExpanded) ? 'none' : 'block',
                        flex: { md: 1 },
                        minHeight: { md: 0 },
                        overflow: { md: 'visible' },
                    }}
                >
                    {/* ══════ SEAMLESS HEADER BLOCK (matching ArtistProfilePage) ══════ */}
                    <Box sx={{ maxWidth: 1400, mx: 'auto', pt: { xs: 0, md: 2 }, px: { xs: 0, md: 3 } }}>
                        <Paper sx={{ overflow: 'hidden', border: '1px solid', borderColor: (t) => alpha(t.palette.text.primary, 0.08), borderRadius: { xs: 0, md: 3 }, boxShadow: { xs: 'none', md: (t) => `0 2px 8px ${alpha(t.palette.text.primary, 0.04)}` } }}>

                            {/* Cover Photo — same aspect ratio as BusinessPublicPage (3.5:1) */}
                            {coverSrc && (
                                <Box
                                    sx={{
                                        position: 'relative', width: '100%', paddingTop: { xs: `${100 / 2.2}%`, sm: `${100 / 3.5}%` }, overflow: 'hidden', bgcolor: 'primary.main',
                                        cursor: !editMode && !showPrivateProfileNotice ? 'pointer' : 'default',
                                    }}
                                    onClick={() => { if (!editMode && !showPrivateProfileNotice) openCoverComments(); }}
                                    role={!editMode && !showPrivateProfileNotice ? 'button' : undefined}
                                    tabIndex={!editMode && !showPrivateProfileNotice ? 0 : undefined}
                                    onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !editMode && !showPrivateProfileNotice) openCoverComments(); }}
                                >
                                    <Box sx={{ position: 'absolute', inset: 0, backgroundImage: (t) => `linear-gradient(to bottom, transparent 60%, ${alpha(t.palette.common.black, 0.30)}), url(${coverSrc})`, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'filter 0.2s ease', '&:hover': !editMode && !showPrivateProfileNotice ? { filter: 'brightness(0.92)' } : {} }} />
                                </Box>
                            )}

                            <Box sx={{ px: { xs: 2, sm: 3 }, pt: coverSrc ? { xs: 0, sm: 3 } : { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, position: 'relative' }}>
                                {/* Avatar — positioned outside the Stack so negative margin reliably overlaps cover (matches ArtistProfilePage visually) */}
                                {coverSrc ? (
                                    <Box
                                        onClick={() => { if (hasRealAvatar && !editMode && !showPrivateProfileNotice) openAvatarComments(); }}
                                        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && hasRealAvatar && !editMode && !showPrivateProfileNotice) openAvatarComments(); }}
                                        role={hasRealAvatar && !editMode && !showPrivateProfileNotice ? 'button' : undefined}
                                        tabIndex={hasRealAvatar && !editMode && !showPrivateProfileNotice ? 0 : undefined}
                                        sx={{
                                            cursor: hasRealAvatar && !editMode && !showPrivateProfileNotice ? 'pointer' : 'default',
                                            WebkitTapHighlightColor: 'transparent',
                                            mt: { xs: -7, sm: -8 },
                                            mb: { xs: 1.5, sm: 0 },
                                            display: { xs: 'flex', sm: 'none' },
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                            <Avatar
                                                src={avatarSrc || undefined}
                                                alt={displayName}
                                                sx={(t) => ({
                                                    width: 110,
                                                    height: 110,
                                                    border: '4px solid',
                                                    borderColor: 'background.paper',
                                                    boxShadow: 3,
                                                    fontSize: 44,
                                                    // Opaque tint: stack 8% primary over solid paper so
                                                    // the cover photo doesn't bleed through the default icon.
                                                    background: `linear-gradient(${alpha(t.palette.primary.main, 0.08)}, ${alpha(t.palette.primary.main, 0.08)}), ${t.palette.background.paper}`,
                                                    color: 'primary.main',
                                                    cursor: hasRealAvatar && !editMode && !showPrivateProfileNotice ? 'pointer' : 'default',
                                                    transition: 'transform 0.2s ease',
                                                    '&:hover': hasRealAvatar && !editMode && !showPrivateProfileNotice ? { transform: 'scale(1.03)' } : {},
                                                    '& .MuiAvatar-img': { objectFit: 'cover', transform: 'scale(1.15)' },
                                                })}
                                                imgProps={{ referrerPolicy: 'no-referrer' }}
                                            >
                                                <PersonRoundedIcon sx={{ fontSize: 48 }} />
                                            </Avatar>
                                            {!isMine && !editMode && Boolean(profile?.is_online) && (
                                                <Box sx={{ position: 'absolute', bottom: 8, right: 4, width: 18, height: 18, borderRadius: '50%', bgcolor: '#44b700', border: '3px solid', borderColor: 'background.paper', zIndex: 2 }} />
                                            )}
                                        </Box>
                                    </Box>
                                ) : null}

                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 3 }} alignItems={{ xs: 'center', sm: 'flex-start' }}>
                                    {/* Avatar — desktop / sm+ layout (inside Stack for row alignment), or mobile without cover */}
                                    <Box
                                        onClick={() => { if (hasRealAvatar && !editMode && !showPrivateProfileNotice) openAvatarComments(); }}
                                        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && hasRealAvatar && !editMode && !showPrivateProfileNotice) openAvatarComments(); }}
                                        role={hasRealAvatar && !editMode && !showPrivateProfileNotice ? 'button' : undefined}
                                        tabIndex={hasRealAvatar && !editMode && !showPrivateProfileNotice ? 0 : undefined}
                                        sx={{
                                            cursor: hasRealAvatar && !editMode && !showPrivateProfileNotice ? 'pointer' : 'default',
                                            WebkitTapHighlightColor: 'transparent',
                                            display: coverSrc ? { xs: 'none', sm: 'block' } : 'block',
                                        }}
                                    >
                                        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                            <Avatar
                                                src={avatarSrc || undefined}
                                                alt={displayName}
                                                sx={(t) => ({
                                                    width: { xs: 110, sm: 140 },
                                                    height: { xs: 110, sm: 140 },
                                                    border: '4px solid',
                                                    borderColor: 'background.paper',
                                                    boxShadow: 3,
                                                    fontSize: 44,
                                                    mt: coverSrc ? { sm: -8 } : 0,
                                                    // Opaque tint — same reasoning as the mobile avatar above.
                                                    background: `linear-gradient(${alpha(t.palette.primary.main, 0.08)}, ${alpha(t.palette.primary.main, 0.08)}), ${t.palette.background.paper}`,
                                                    color: 'primary.main',
                                                    cursor: hasRealAvatar && !editMode && !showPrivateProfileNotice ? 'pointer' : 'default',
                                                    transition: 'transform 0.2s ease',
                                                    '&:hover': hasRealAvatar && !editMode && !showPrivateProfileNotice ? { transform: 'scale(1.03)' } : {},
                                                    '& .MuiAvatar-img': { objectFit: 'cover', transform: 'scale(1.15)' },
                                                })}
                                                imgProps={{ referrerPolicy: 'no-referrer' }}
                                            >
                                                <PersonRoundedIcon sx={{ fontSize: { xs: 48, sm: 64 } }} />
                                            </Avatar>
                                            {!isMine && !editMode && Boolean(profile?.is_online) && (
                                                <Box sx={{ position: 'absolute', bottom: { xs: 8, sm: 12 }, right: { xs: 4, sm: 6 }, width: { xs: 18, sm: 20 }, height: { xs: 18, sm: 20 }, borderRadius: '50%', bgcolor: '#44b700', border: '3px solid', borderColor: 'background.paper', zIndex: 2 }} />
                                            )}
                                        </Box>
                                    </Box>

                                    <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' }, minWidth: 0 }}>
                                        {/* Top row: Name + actions */}
                                        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'center', sm: 'flex-start' }} justifyContent="space-between" spacing={1}>
                                            <Box>
                                                <Stack direction="row" alignItems="center" justifyContent={{ xs: 'center', sm: 'flex-start' }} spacing={0.5} flexWrap="wrap">
                                                    <Typography variant="h5" fontWeight={800}>{displayName}</Typography>
                                                    {Boolean(Number(profile?.is_local_lantern_admin) === 1) && (
                                                        <Tooltip title="Verified" arrow>
                                                            <VerifiedRoundedIcon sx={{ fontSize: 22, color: 'info.main' }} />
                                                        </Tooltip>
                                                    )}
                                                </Stack>
                                                {profile?.handle && (
                                                    <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mt: 0.25 }}>
                                                        @{profile.handle}
                                                    </Typography>
                                                )}
                                                {/* Followers / Following stats row */}
                                                {canViewFollows && (
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
                                                )}
                                                {/* Location + Joined date */}
                                                <Stack direction="row" alignItems="center" justifyContent={{ xs: 'center', sm: 'flex-start' }} spacing={1.5} sx={{ mt: 0.75 }} flexWrap="wrap">
                                                    {(profile?.home_city || profile?.home_county) && (
                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                            <LocationOnRoundedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                                                            <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 600 }}>
                                                                {[profile.home_city, profile.home_county ? (String(profile.home_county).toLowerCase().includes('county') ? profile.home_county : `${profile.home_county} County`) : null, 'Alabama'].filter(Boolean).join(', ')}
                                                            </Typography>
                                                        </Stack>
                                                    )}
                                                    {profile?.created_at && (
                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                            <CalendarMonthRoundedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                                                            <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 600 }}>
                                                                Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                            </Typography>
                                                        </Stack>
                                                    )}
                                                </Stack>
                                            </Box>

                                            {/* Action buttons — top right */}
                                            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0 }}>
                                                {isMine ? (
                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<EditRoundedIcon sx={{ fontSize: 16 }} />}
                                                        onClick={() => setEditMode(true)}
                                                        sx={{ textTransform: 'none', fontWeight: 700, fontSize: 13, borderRadius: 999, px: 2 }}
                                                    >
                                                        Edit Profile
                                                    </Button>
                                                ) : (
                                                    <>
                                                        {/* Follow button — hidden if this business/artist blocked us */}
                                                        {!blockedByOther && (
                                                            <Button
                                                                variant={isFollowing ? 'outlined' : followRequested ? 'outlined' : 'contained'}
                                                                startIcon={followRequested ? <HourglassBottomRoundedIcon />
                                                                    : isFollowing ? <HowToRegRoundedIcon />
                                                                        : <PersonAddAlt1RoundedIcon />}
                                                                onClick={toggleFollow}
                                                                sx={{ textTransform: 'none', fontWeight: 700, fontSize: 13, borderRadius: 999, px: 2 }}
                                                            >
                                                                {followRequested ? 'Requested' : isFollowing ? 'Unfollow' : 'Follow'}
                                                            </Button>
                                                        )}
                                                        {/* Message button — hidden if blocked, or if user set messages to nobody, or followers-only and not following */}
                                                        {!blockedByOther && (() => {
                                                            const mp = String(profile?.message_privacy || 'everyone').toLowerCase();
                                                            if (mp === 'nobody') return null;
                                                            if (mp === 'followers' && !isFollowing) return null;
                                                            return (
                                                                <Tooltip title="Message" arrow disableTouchListener>
                                                                    <IconButton
                                                                        onClick={() => {
                                                                            if (!me || !(me.id || me.user_id || me.handle)) {
                                                                                try {
                                                                                    if (auth && typeof auth.open === 'function') auth.open();
                                                                                    else if (auth && typeof auth.openLoginPopup === 'function') auth.openLoginPopup();
                                                                                    else if (auth && typeof auth.openLoginModal === 'function') auth.openLoginModal();
                                                                                    else if (auth && typeof auth.openLogin === 'function') auth.openLogin();
                                                                                } catch { /* ignore */ }
                                                                                try {
                                                                                    window.dispatchEvent(new CustomEvent('open-auth-modal'));
                                                                                    window.dispatchEvent(new CustomEvent('open-login'));
                                                                                    window.dispatchEvent(new CustomEvent('open-auth-dialog'));
                                                                                    window.dispatchEvent(new CustomEvent('open-login-popup'));
                                                                                } catch { /* ignore */ }
                                                                                return;
                                                                            }
                                                                            setQuickMsgOpen(true);
                                                                        }}
                                                                        size="small"
                                                                        sx={{ width: 36, height: 36, border: '1px solid', borderColor: 'divider', color: 'text.secondary', '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) } }}
                                                                    >
                                                                        <MailOutlineRoundedIcon sx={{ fontSize: 18 }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            );
                                                        })()}
                                                    </>
                                                )}
                                                {/* Share button */}
                                                <Tooltip title="Share" arrow disableTouchListener>
                                                    <IconButton
                                                        onClick={() => setProfileShareOpen(true)}
                                                        size="small"
                                                        sx={{ width: 36, height: 36, border: '1px solid', borderColor: 'divider', color: 'text.secondary', '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) } }}
                                                    >
                                                        <ShareOutlinedIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                {/* 3-dot menu */}
                                                <Tooltip title="More" arrow disableTouchListener>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => setProfileMenuAnchor(e.currentTarget)}
                                                        sx={{ width: 36, height: 36, border: '1px solid', borderColor: 'divider', color: 'text.secondary', '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) } }}
                                                    >
                                                        <MoreVertIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </Stack>
                                    </Box>
                                </Stack>
                            </Box>

                            {/* Mobile-only tabs — About | Activity | Photos */}
                            {isMobile && (
                                <Tabs
                                    value={mobileProfileTab}
                                    onChange={(e, newVal) => {
                                        if (newVal === 1) {
                                            // Activity tab opens fullscreen dialog
                                            setMobileActivityOpen(true);
                                        } else {
                                            setMobileProfileTab(newVal);
                                        }
                                    }}
                                    variant="fullWidth"
                                    sx={(t) => ({
                                        borderBottom: '1px solid',
                                        borderColor: 'divider',
                                        bgcolor: 'background.paper',
                                        px: 1,
                                        '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0', backgroundColor: t.palette.text.primary },
                                        '& .MuiTab-root': {
                                            minHeight: 44,
                                            textTransform: 'none',
                                            fontWeight: 700,
                                            fontSize: '0.72rem',
                                            letterSpacing: '-0.01em',
                                            color: alpha(t.palette.text.primary, 0.55),
                                            '&.Mui-selected': { color: t.palette.text.primary },
                                            '& .MuiSvgIcon-root': { color: alpha(t.palette.text.primary, 0.5) },
                                            '&.Mui-selected .MuiSvgIcon-root': { color: t.palette.text.primary },
                                        },
                                    })}
                                >
                                    <Tab label={<Stack direction="column" alignItems="center" spacing={0.25}><PersonRoundedIcon sx={{ fontSize: 20 }} /><span>About</span></Stack>} />
                                    <Tab label={<Stack direction="column" alignItems="center" spacing={0.25}><DynamicFeedRoundedIcon sx={{ fontSize: 20 }} /><span>Activity</span></Stack>} />
                                    <Tab label={<Stack direction="column" alignItems="center" spacing={0.25}><PhotoLibraryRoundedIcon sx={{ fontSize: 20 }} /><span>Photos</span></Stack>} />
                                </Tabs>
                            )}
                        </Paper>

                        {/* Share dialog */}
                        <ShareDialog
                            contentType="profile"
                            open={profileShareOpen}
                            onClose={() => setProfileShareOpen(false)}
                            profile={profile}
                            viewer={me}
                        />

                        {/* 3-dot menu */}
                        <SmartMenu
                            anchorEl={profileMenuAnchor}
                            open={Boolean(profileMenuAnchor)}
                            onClose={() => setProfileMenuAnchor(null)}
                            disableScrollLock
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            PaperProps={{ sx: { mt: 0.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', minWidth: 200, py: 0.5 } }}
                        >
                            <MenuItem onClick={() => {
                                setProfileMenuAnchor(null);
                                const url = `${window.location.origin}/${profile?.handle || profile?.id}`;
                                navigator.clipboard.writeText(url).then(() => showSuccess('Link copied to clipboard')).catch(() => {});
                            }} sx={{ py: 1 }}>
                                <ListItemIcon><ContentCopyRoundedIcon fontSize="small" /></ListItemIcon>
                                <ListItemText primary="Copy link" />
                            </MenuItem>
                            {!isMine && (
                                <MenuItem onClick={() => { setProfileMenuAnchor(null); setProfileReportOpen(true); }} sx={{ py: 1 }}>
                                    <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Report profile" />
                                </MenuItem>
                            )}
                            {!isMine && me?.id && (
                                <MenuItem onClick={() => { setProfileMenuAnchor(null); hiddenPostsByMe ? unhideUserPosts() : hideUserPosts(); }} sx={{ py: 1 }}>
                                    <ListItemIcon><VisibilityOffRoundedIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary={hiddenPostsByMe ? 'Unhide posts' : 'Hide posts'} />
                                </MenuItem>
                            )}
                            {!isMine && me?.id && (
                                <MenuItem onClick={() => { setProfileMenuAnchor(null); blockedByMe ? unblockUser() : blockUser(); }} sx={{ py: 1, color: blockedByMe ? 'text.primary' : 'error.main' }}>
                                    <ListItemIcon sx={{ color: blockedByMe ? 'text.primary' : 'error.main' }}><BlockRoundedIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary={blockedByMe ? 'Unblock' : 'Block'} />
                                </MenuItem>
                            )}
                        </SmartMenu>

                        {/* Report profile dialog */}
                        <ReportDialog
                            open={profileReportOpen}
                            onClose={() => setProfileReportOpen(false)}
                            onSubmit={async ({ reason, details }) => {
                                try {
                                    await axios.post(`/api/users/${profile?.id}/report`, { reason, details }, { withCredentials: true });
                                } catch { /* silent */ }
                            }}
                            title="Report Profile"
                        />

                        {/* ProfileHeader — edit dialog only (hidden when not editing) */}
                        <ProfileHeader
                            viewerId={me?.id || 0}
                            layout="full"
                            profile={profile}
                            avatarSrc={avatarSrc}
                            hasCoverPhoto={Boolean(coverSrc)}
                            isMine={isMine}
                            editMode={editMode}
                            onEnterEdit={() => { userTouchedEditRef.current = false; setEditMode(true); }}
                            onSave={saveProfile}
                            onCancel={() => {
                                if (userTouchedEditRef.current && isEditDirty) setDiscardOpen(true);
                                else {
                                    resetDraftsToProfile();
                                    setPendingAvatar(null);
                                    setDeleteAvatar(false);
                                    setPendingCover(null);
                                    setPendingCoverBlob(null);
                                    setDeleteCover(false);
                                    setEditMode(false);
                                    setDiscardOpen(false);
                                }
                            }}
                            onChangeAvatar={changeAvatar}
                            onDeleteAvatar={() => { setConfirmOpen(true); }}
                            coverSrc={coverSrc}
                            onChangeCover={(blob) => {
                                const hasExistingCover = Boolean(profile?.cover_url);
                                if (hasExistingCover) {
                                    setPendingCoverBlob(blob);
                                    setPhotoChangeWarningKind('cover');
                                    setPhotoChangeWarningOpen(true);
                                } else {
                                    setPendingCover(blob);
                                    setDeleteCover(false);
                                }
                            }}
                            onDeleteCover={() => { setConfirmDeleteCoverOpen(true); }}
                            stagedDeleteCover={deleteCover}
                            viewer={me}
                            isFollowing={isFollowing}
                            onToggleFollow={toggleFollow}
                            followRequested={followRequested}
                            isPrivateAccount={isPrivateAccount}
                            handleDraft={handleDraft}
                            onHandleDraftChange={setHandleDraft}
                            handleStats={handleStats}
                            handleError={handleError}
                            onClearHandleError={() => setHandleError('')}
                            firstNameDraft={firstNameDraft}
                            lastNameDraft={lastNameDraft}
                            onFirstNameDraftChange={setFirstNameDraft}
                            onLastNameDraftChange={setLastNameDraft}
                            bioDraft={bioDraft}
                            onBioDraftChange={(v) => setBioDraft(String(v || '').slice(0, 50))}
                            contact={contact}
                            onContactChange={onChangeContact}
                            countryDraft={countryDraft}
                            onCountryDraftChange={setCountryDraft}
                            stateDraft={stateDraft}
                            onStateDraftChange={setStateDraft}
                            alabamaResident={alabamaResidentDraft}
                            onAlabamaResidentChange={setAlabamaResidentDraft}
                            homeCityDraft={homeCity}
                            onHomeCityDraftChange={setHomeCity}
                            homeCountyDraft={homeCounty}
                            onHomeCountyDraftChange={setHomeCounty}
                            privacyDraft={accountPrivacyDraft}
                            onPrivacyDraftChange={setAccountPrivacyDraft}
                            profileBioDraft={profileBioDraft}
                            onProfileBioDraftChange={setProfileBioDraft}
                            stagedDeleteAvatar={deleteAvatar}
                            onSuccess={showSuccess}
                            galleryPhotos={galleryPhotosEdit}
                            setGalleryPhotos={setGalleryPhotosEdit}
                            onEditTouched={() => { userTouchedEditRef.current = true; }}
                        />

                        {/* Blocked / Private / Hidden notices */}
                        {showBlockedProfileNotice ? (
                            <Box sx={{ mt: 2, px: 2 }}>
                                <BlockedProfileNotice onUnblock={unblockUser} name={profile?.first_name || profile?.handle || 'this user'} />
                            </Box>
                        ) : showPrivateProfileNotice ? (
                            <Box sx={{ mt: 2, px: 2 }}>
                                <PrivateProfileNotice />
                            </Box>
                        ) : showHiddenPostsNotice ? (
                            <Box sx={{ mt: 2, px: 2 }}>
                                <HiddenPostsNotice onUnhide={unhideUserPosts} name={profile?.first_name || profile?.handle || 'this user'} />
                            </Box>
                        ) : null}
                    </Box>

                    {/* ══════ TWO-COLUMN CONTENT (artist-profile style) ══════ */}
                    <Box
                        ref={gridRef}
                        sx={{
                            maxWidth: (showPrivateProfileNotice || showBlockedProfileNotice) ? 600 : 1400,
                            mx: 'auto',
                            px: { xs: 0, md: 2 },
                            pt: { xs: 0, md: 2.5 },
                            bgcolor: { xs: 'background.paper', md: 'transparent' },
                            flex: { md: 1 },
                            minHeight: { md: 0 },
                        }}
                    >
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5}>
                            {/* LEFT SIDEBAR (artist-profile style — About + Followers + Photos) */}
                            <Box
                                ref={leftColRef}
                                data-user-sidebar={isMobile ? 'mobile' : undefined}
                                sx={{
                                    width: { xs: '100%', md: 400 },
                                    flexShrink: 0,
                                    order: { xs: 1, md: 0 },
                                    alignSelf: { md: 'stretch' },
                                }}
                            >
                                {/* Mobile: strip Paper card styling — no shadows, borders, or radius. Background inherits from parent (paper). */}
                                {isMobile && (
                                    <style>{`
                                        [data-user-sidebar="mobile"] .MuiPaper-root {
                                            box-shadow: none !important;
                                            border-radius: 0 !important;
                                            background-color: inherit !important;
                                            background-image: none !important;
                                            border: none !important;
                                        }
                                        [data-user-sidebar="mobile"] .MuiCard-root {
                                            box-shadow: none !important;
                                            border-radius: 0 !important;
                                            border: none !important;
                                        }
                                    `}</style>
                                )}
                                <Box
                                    ref={sidebarHeaderRef}
                                    sx={{
                                        position: { md: 'sticky' },
                                        top: { md: sidebarStickyTop },
                                        transition: 'top 0.2s ease',
                                    }}
                                >
                                    <Stack spacing={{ xs: 0, md: 2.5 }}>

                                        {/* About Card — hidden on mobile Photos tab */}
                                        {(!isMobile || mobileProfileTab === 0) && canViewAbout && (() => {
                                            // Determine if there's any About content to show
                                            const hasBio = Boolean(profile?.profile_bio);

                                            // Check social links
                                            const sj = profile?.social_json
                                                ? typeof profile.social_json === 'string'
                                                    ? (() => { try { return JSON.parse(profile.social_json); } catch { return {}; } })()
                                                    : profile.social_json
                                                : {};
                                            const c = sj?.contact || {};
                                            const hasLinks = Boolean(c.website || c.facebook || c.instagram || c.tiktok || c.x || c.linkedin);

                                            // Check relationship status
                                            const rawRel = profile?.relationship;
                                            const relNorm = rawRel == null || rawRel === '' ? 'prefer-not'
                                                : typeof rawRel === 'number' ? ({ 1: 'single', 2: 'in-relationship', 3: 'married', 4: 'its-complicated' }[rawRel] || 'prefer-not')
                                                    : String(rawRel).trim().toLowerCase().replace(/[']/g, "'");
                                            const hasRelationship = relNorm && relNorm !== 'prefer-not' && relNorm !== 'do not display' && relNorm !== 'hide' && relNorm !== 'none' && relNorm !== 'prefer-not-to-say';

                                            const hasContent = hasBio || hasLinks || hasRelationship;

                                            // If nothing to show and not the owner, skip the card
                                            if (!hasContent && !isMine) return null;

                                            return (
                                                <Card variant="outlined" sx={(t) => ({ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: alpha(t.palette.text.primary, 0.08), boxShadow: `0 2px 8px ${alpha(t.palette.text.primary, 0.04)}`, '&:hover': { boxShadow: `0 2px 8px ${alpha(t.palette.text.primary, 0.04)}` } })}>
                                                    <Box sx={(t) => ({ px: { xs: 1.5, sm: 2 }, py: 1.25, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: alpha(t.palette.text.primary, 0.08) })}>
                                                        <PersonRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                                                        <Typography variant="h6" sx={{ fontWeight: 900 }}>About</Typography>
                                                    </Box>
                                                    <CardContent sx={{ pt: 1.5, pb: 2 }}>
                                                        {/* Bio (profile_bio) */}
                                                        {profile?.profile_bio ? (
                                                            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, wordBreak: 'break-word', overflowWrap: 'anywhere', mb: 1.5 }}>
                                                                {profile.profile_bio}
                                                            </Typography>
                                                        ) : isMine ? (
                                                            <Typography variant="body2" color="text.secondary" fontStyle="italic" sx={{ mb: 1.5 }}>
                                                                Add a bio to tell people about yourself.
                                                            </Typography>
                                                        ) : null}

                                                        {/* AboutSection (relationship info — location & badge moved to header) */}
                                                        <AboutSection
                                                            editMode={false}
                                                            isOwner={isMine}
                                                            profile={{
                                                                ...profile,
                                                                home_city: undefined,
                                                                home_county: undefined,
                                                                city: undefined,
                                                                county: undefined,
                                                            }}
                                                            isFollower={isFollowing}
                                                            isPrivateAccount={isPrivateAccount}
                                                            isAlabama={false}
                                                            onEdit={onAboutEdit}
                                                        />

                                                        {/* Connect — social links (matching ArtistProfilePage style) */}
                                                        {(() => {
                                                            const sj = profile?.social_json
                                                                ? typeof profile.social_json === 'string'
                                                                    ? (() => { try { return JSON.parse(profile.social_json); } catch { return {}; } })()
                                                                    : profile.social_json
                                                                : {};
                                                            const c = sj?.contact || {};
                                                            const buildUrl = (val, platform) => {
                                                                const s = String(val || '').trim();
                                                                if (!s) return '';
                                                                if (s.startsWith('http://') || s.startsWith('https://')) return s;
                                                                const bases = { facebook: 'https://facebook.com/', instagram: 'https://instagram.com/', tiktok: 'https://tiktok.com/@', x: 'https://x.com/', linkedin: 'https://linkedin.com/in/' };
                                                                return (bases[platform] || 'https://') + s.replace(/^@/, '');
                                                            };
                                                            const links = [
                                                                c.website && { key: 'website', url: c.website.startsWith('http') ? c.website : `https://${c.website}`, icon: <LanguageRoundedIcon sx={{ fontSize: 18 }} />, color: null, label: 'Website' },
                                                                c.facebook && { key: 'facebook', url: buildUrl(c.facebook, 'facebook'), icon: <FacebookIcon sx={{ fontSize: 18 }} />, color: '#1877F2', label: 'Facebook' },
                                                                c.instagram && { key: 'instagram', url: buildUrl(c.instagram, 'instagram'), icon: <InstagramIcon sx={{ fontSize: 18 }} />, color: '#E4405F', label: 'Instagram' },
                                                                c.tiktok && { key: 'tiktok', url: buildUrl(c.tiktok, 'tiktok'), icon: <PublicIcon sx={{ fontSize: 18 }} />, color: null, label: 'TikTok' },
                                                                c.x && { key: 'x', url: buildUrl(c.x, 'x'), icon: <XIcon sx={{ fontSize: 16 }} />, color: null, label: 'X (Twitter)' },
                                                                c.linkedin && { key: 'linkedin', url: buildUrl(c.linkedin, 'linkedin'), icon: <LinkedInIcon sx={{ fontSize: 18 }} />, color: '#0A66C2', label: 'LinkedIn' },
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
                                                    </CardContent>
                                                </Card>
                                            );
                                        })()}

                                        {/* Followers & Following Card — hidden on mobile Photos tab */}
                                        {(!isMobile || mobileProfileTab === 0) && canViewFollows && !showPrivateProfileNotice && (
                                            <Card variant="outlined" sx={(t) => ({ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: alpha(t.palette.text.primary, 0.08), boxShadow: `0 2px 8px ${alpha(t.palette.text.primary, 0.04)}`, '&:hover': { boxShadow: `0 2px 8px ${alpha(t.palette.text.primary, 0.04)}` } })}>
                                                <Box sx={(t) => ({ px: { xs: 1.5, sm: 2 }, py: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, borderBottom: '1px solid', borderColor: alpha(t.palette.text.primary, 0.08) })}>
                                                    <Typography variant="h6" sx={{ fontWeight: 900 }}>Followers & Following</Typography>
                                                    <Button size="small" onClick={() => followsRef.current?.openAll()}>VIEW ALL</Button>
                                                </Box>
                                                <CardContent sx={{ pt: 0.5, pb: 1.25 }}>
                                                    <FollowsSection
                                                        ref={followsRef}
                                                        viewer={me}
                                                        profileId={profile?.id}
                                                        profileHandle={profile?.handle}
                                                        profileAvatar={avatarSrc}
                                                        profileName={`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()}
                                                        profileUsername={profile?.handle || profile?.public_id || profile?.id}
                                                        onFlash={(msg) => {
                                                            const text = typeof msg === 'string' ? msg : msg?.text || '';
                                                            if (typeof msg === 'object' && msg?.type === 'success') {
                                                                showSuccess(text);
                                                            } else {
                                                                setProfileSnack(text);
                                                            }
                                                        }}
                                                        isFollowingProfile={isFollowing}
                                                        onToggleFollowProfile={toggleFollow}
                                                        refreshNonce={followsRefreshNonce}
                                                        showFollowingTabInSection={true}
                                                        fillHeight={false}
                                                        onCountsChange={setFollowCounts}
                                                    />
                                                </CardContent>
                                            </Card>
                                        )}

                                        {/* Photos Card — on mobile only shown in Photos tab; on desktop always shown */}
                                        {(!isMobile || mobileProfileTab === 2) && !showPrivateProfileNotice && (() => {
                                            const photoItems = galleryPhotos.filter((p) => p && p.url);
                                            if (photoItems.length === 0 && !isMine) return null;
                                            return (
                                                <Card variant="outlined" sx={(t) => ({ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: alpha(t.palette.text.primary, 0.08), boxShadow: `0 2px 8px ${alpha(t.palette.text.primary, 0.04)}`, '&:hover': { boxShadow: `0 2px 8px ${alpha(t.palette.text.primary, 0.04)}` } })}>
                                                    <Box sx={(t) => ({ px: { xs: 1.5, sm: 2 }, py: 1.25, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: alpha(t.palette.text.primary, 0.08) })}>
                                                        <Typography variant="h6" sx={{ fontWeight: 900 }}>Photos</Typography>
                                                        {photoItems.length > 0 && (
                                                            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                                                                {photoItems.length} photo{photoItems.length !== 1 ? 's' : ''}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    <CardContent sx={{ pt: 1.5, pb: 2 }}>
                                                        {photoItems.length > 0 ? (
                                                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.75 }}>
                                                                {photoItems.slice(0, 9).map((photo, idx) => (
                                                                    <Box
                                                                        key={photo.id || idx}
                                                                        onClick={() => openGalleryLightbox(photo.id, photo.url)}
                                                                        role="button"
                                                                        tabIndex={0}
                                                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openGalleryLightbox(photo.id, photo.url); }}
                                                                        sx={{
                                                                            position: 'relative',
                                                                            aspectRatio: '1',
                                                                            borderRadius: 1.5,
                                                                            overflow: 'hidden',
                                                                            cursor: 'pointer',
                                                                            '&:hover img': { transform: 'scale(1.05)' },
                                                                        }}
                                                                    >
                                                                        <Box component="img" src={photo.url} alt="" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 200ms ease' }} />
                                                                    </Box>
                                                                ))}
                                                            </Box>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary" fontStyle="italic" sx={{ textAlign: 'center', py: 3 }}>
                                                                No photos yet.
                                                            </Typography>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            );
                                        })()}

                                    </Stack>
                                </Box>
                            </Box>


                            {/* RIGHT COLUMN — Activity feed (artist-profile style) — hidden on mobile */}
                            {canViewPosts && !showBlockedProfileNotice ? (
                                <Box
                                    ref={rightColRef}
                                    sx={{
                                        flex: 1,
                                        minWidth: 0,
                                        order: { xs: 0, md: 1 },
                                        display: { xs: 'none', md: 'block' },
                                    }}
                                >
                                    {/* ── Activity content ── */}
                                    <Card
                                        ref={rightRailCardRef}
                                        variant="outlined"
                                        sx={(t) => ({
                                            borderRadius: 3,
                                            overflow: 'hidden',
                                            backgroundImage: 'none',
                                            border: '1px solid',
                                            borderColor: alpha(t.palette.text.primary, 0.08),
                                            boxShadow: `0 2px 8px ${alpha(t.palette.text.primary, 0.04)}`,
                                            bgcolor: 'background.paper',
                                            outline: 'none',
                                            '&:focus, &:focus-visible, &:focus-within': { outline: 'none', boxShadow: `0 2px 8px ${alpha(t.palette.text.primary, 0.04)}` },
                                            '&:hover': { boxShadow: `0 2px 8px ${alpha(t.palette.text.primary, 0.04)}` },
                                        })}
                                    >
                                        {/* Tab header — pill chips (CommunityPanel style) */}
                                        <Box
                                            ref={rightRailTabsRef}
                                            sx={{
                                                zIndex: 10,
                                                borderBottom: '1px solid',
                                                borderColor: (t) => alpha(t.palette.text.primary, 0.08),
                                                bgcolor: 'background.paper',
                                                overflowX: 'auto',
                                                overflowY: 'hidden',
                                                WebkitOverflowScrolling: 'touch',
                                                scrollbarWidth: 'none',
                                                '&::-webkit-scrollbar': { display: 'none' },
                                            }}
                                        >
                                            <Stack
                                                direction="row"
                                                spacing={0.5}
                                                sx={{ px: { xs: 1.25, sm: 2 }, py: { xs: 0.75, sm: 1 }, width: 'fit-content', minWidth: '100%', alignItems: 'center' }}
                                            >
                                                {[
                                                    { key: 'community', label: 'Posts', icon: <ForumIcon />, show: true },
                                                    { key: 'events', label: 'Events', icon: <EventRoundedIcon />, show: profileHasEvents },
                                                    { key: 'jobs', label: 'Jobs', icon: <WorkRoundedIcon />, show: profileHasJobs },
                                                    { key: 'services', label: 'Services', icon: <BuildRoundedIcon />, show: profileHasServices || profileHasServiceRequests },
                                                    { key: 'marketplace', label: 'Marketplace', icon: <StorefrontRoundedIcon />, show: profileHasListings },
                                                    { key: 'reviews', label: 'Reviews', icon: <RateReviewRoundedIcon />, show: profileHasReviews },
                                                ].filter((t) => t.show).map((tabDef) => {
                                                    const active = rightRailView === tabDef.key;
                                                    return (
                                                        <Button
                                                            key={tabDef.key}
                                                            role="tab"
                                                            aria-selected={active}
                                                            onClick={() => { setRightRailView(tabDef.key); scrollRightRailToTop(); }}
                                                            variant="text"
                                                            disableElevation
                                                            startIcon={React.cloneElement(tabDef.icon, {
                                                                sx: (t) => ({
                                                                    fontSize: 20,
                                                                    opacity: active ? 1 : 0.72,
                                                                    color: active ? t.palette.primary.main : t.palette.text.secondary,
                                                                }),
                                                            })}
                                                            sx={(t) => ({
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
                                                                transition: `all ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                                                                '&:hover': {
                                                                    backgroundColor: active ? alpha(t.palette.primary.main, 0.1) : alpha(t.palette.text.primary, 0.04),
                                                                    color: active ? t.palette.primary.main : t.palette.text.primary,
                                                                },
                                                                '&:focus-visible': {
                                                                    outline: 'none',
                                                                    boxShadow: `0 0 0 3px ${alpha(t.palette.primary.main, 0.20)}`,
                                                                },
                                                            })}
                                                        >
                                                            {tabDef.label}
                                                        </Button>
                                                    );
                                                })}

                                            </Stack>
                                        </Box>

                                        {/* Content area — fades on tab/filter changes */}
                                        <ContentFadeIn triggerKey={`${rightRailView}-${postsRefreshNonce}-${eventsRefreshNonce}-${jobsRefreshNonce}-${servicesRefreshNonce}-${listingsRefreshNonce}`}>
                                            <Box ref={rightRailContentAreaRef} sx={{ minHeight: 400 }}>

                                                {/* ── Community tab content ── */}
                                                {rightRailView === 'community' && (
                                                    <>
                                                        <Box
                                                            ref={rightRailWrapRef}
                                                            onClickCapture={handleProfileLocationCapture}
                                                            onKeyDownCapture={handleProfileLocationCapture}
                                                            sx={{
                                                                minHeight: 280,
                                                                // Strip PET's internal Card visuals so it blends into the parent Card
                                                                '& > :first-child': {
                                                                    boxShadow: 'none !important',
                                                                    border: 'none !important',
                                                                    borderRadius: '0 !important',
                                                                    overflow: 'visible !important',
                                                                    minHeight: 'auto !important',
                                                                    height: 'auto !important',
                                                                    maxHeight: 'none !important',
                                                                },
                                                                // Hide PET's "Community Activity" gradient header row (title + expand icon)
                                                                '& > :first-child > :first-child > :first-child': {
                                                                    display: 'none !important',
                                                                },
                                                                // PET's sub-tabs + filters flow naturally (no sticky)
                                                                '& > :first-child > :first-child': {
                                                                    zIndex: '8 !important',
                                                                    bgcolor: 'background.paper',
                                                                },
                                                                // Ensure PET's internal scroll containers don't trap page scroll
                                                                '& .profile-posts-scroller': {
                                                                    overflowY: 'visible !important',
                                                                    overscrollBehaviorY: 'auto !important',
                                                                },
                                                                // PET body wrapper — let content flow naturally
                                                                '& > :first-child > :nth-child(2)': {
                                                                    overflow: 'visible !important',
                                                                },
                                                                // Flatten ALL inner post cards (BusinessPostCard, MusicPostCardItem, etc.)
                                                                // so they match the flat ProfilePostCard style
                                                                '& .MuiCard-root, & .MuiPaper-root': {
                                                                    boxShadow: 'none !important',
                                                                    border: 'none !important',
                                                                    borderRadius: '0 !important',
                                                                    backgroundImage: 'none !important',
                                                                    backgroundColor: 'transparent !important',
                                                                    overflow: 'visible !important',
                                                                },
                                                            }}
                                                        >
                                                            <ProfileEngagementTabs
                                                                me={me}
                                                                isScrollBox={false}
                                                                scrollBoxHeight={0}
                                                                disableInitialAutoScroll={true}
                                                                pageScrollOffset={0}
                                                                profile={profile}
                                                                posts={feedPosts}
                                                                searchQuery={communitySearch}
                                                                clearFiltersRef={clearCommunityFiltersRef}
                                                                searchBarSlot={
                                                                    <Box sx={(t) => ({ px: 1.5, pt: 1.25, pb: 0.5, bgcolor: 'background.paper', zIndex: 7 })}>
                                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                                            <SearchInput
                                                                                placeholder="Search posts…"
                                                                                value={communitySearchTerm}
                                                                                onChange={(e) => setCommunitySearchTerm(e?.target?.value ?? '')}
                                                                                onSearch={() => { setCommunitySearch(communitySearchTerm); scrollRightRailToTop(); }}
                                                                                onClear={() => { setCommunitySearchTerm(''); setCommunitySearch(''); }}
                                                                                inputProps={{ name: 'll-profile-community-search' }}
                                                                            />
                                                                            <Tooltip title="Clear all filters" arrow>
                                                                                <IconButton
                                                                                    size="small"
                                                                                    onClick={() => { setCommunitySearchTerm(''); setCommunitySearch(''); clearCommunityFiltersRef.current?.(); scrollRightRailToTop(); }}
                                                                                    sx={(t) => ({
                                                                                        width: 36, height: 36, flexShrink: 0,
                                                                                        borderRadius: 999,
                                                                                        border: '1px solid',
                                                                                        borderColor: alpha(t.palette.text.primary, 0.08),
                                                                                        bgcolor: alpha(t.palette.text.primary, 0.03),
                                                                                        '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.06), borderColor: alpha(t.palette.primary.main, 0.18) },
                                                                                    })}
                                                                                    aria-label="Clear filters"
                                                                                >
                                                                                    <RestartAltRoundedIcon sx={{ fontSize: 18 }} />
                                                                                </IconButton>
                                                                            </Tooltip>

                                                                        </Stack>
                                                                    </Box>
                                                                }
                                                                isMine={isMine}
                                                                isFollowing={isFollowing}
                                                                privacy={{
                                                                    posts: privacy?.posts || 'public',
                                                                    likes: privacy?.likes || 'public',
                                                                    reposts: privacy?.reposts || 'public',
                                                                    comments: privacy?.comments || 'public',
                                                                }}
                                                                canViewSection={canViewSection}
                                                                onOpenPost={(post) => {
                                                                    if (!post || !post.id) return;
                                                                    setPreviewScrollToCommentId(null);
                                                                    setPreviewHighlightCommentId(null);
                                                                    setPreviewPost(post);
                                                                }}
                                                                onOpenComment={(commentItem) => {
                                                                    const c = commentItem || {};
                                                                    const post0 = c.post || {};
                                                                    if (!post0?.id) return;
                                                                    // Carry postType onto the post object so detectPostKind can identify business/artist posts
                                                                    const pType = String(c?.postType || post0?.postType || '').toLowerCase();
                                                                    const enrichedPost = pType ? { ...post0, postType: pType } : post0;
                                                                    const viewOnly = Boolean(c._viewPostOnly);
                                                                    const commentId = viewOnly ? null : (Number(c?.comment_id || c?.id || 0) || null);
                                                                    setPreviewScrollToCommentId(commentId);
                                                                    setPreviewHighlightCommentId(commentId);
                                                                    setPreviewPost(enrichedPost);
                                                                }}
                                                                onFilterChange={() => {
                                                                    scrollRightRailToTop();
                                                                }}
                                                                onScrollToTop={scrollRightRailToTop}
                                                                onExpandPosts={(payload) => {
                                                                    const url = new URL(window.location.href);
                                                                    url.searchParams.set('view', 'posts');
                                                                    window.history.pushState({ view: 'posts' }, '', url);

                                                                    const detailObj = payload && typeof payload === 'object' ? payload : {};
                                                                    const idxRaw =
                                                                        typeof payload === 'number'
                                                                            ? payload
                                                                            : (detailObj.tabIndex ?? detailObj.tab ?? 0);
                                                                    const idx = Number.isFinite(Number(idxRaw)) ? Number(idxRaw) : 0;

                                                                    setExpandedTab(idx);

                                                                    setExpandedCategory(String(detailObj.category ?? detailObj.subtype ?? ''));
                                                                    setExpandedSort(String(detailObj.sort ?? detailObj.sortBy ?? 'newest'));

                                                                    setPostsExpanded(true);

                                                                    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                                                                    requestAnimationFrame(() => {
                                                                        if (postsScrollRef.current) postsScrollRef.current.scrollTop = 0;
                                                                    });
                                                                }}
                                                            />
                                                        </Box>

                                                        {/* Post detail overlay dialog */}
                                                        <PostDetailDialog
                                                            post={previewPost}
                                                            open={Boolean(previewPost)}
                                                            onClose={() => { setPreviewPost(null); setPreviewScrollToCommentId(null); setPreviewHighlightCommentId(null); }}
                                                            user={me}
                                                            scrollToCommentId={previewScrollToCommentId}
                                                            highlightCommentId={previewHighlightCommentId}
                                                        />
                                                    </>
                                                )}

                                                {/* ── Events tab content ── */}
                                                {rightRailView === 'events' && (
                                                    <>
                                                        {/* Event sub-tabs — Events | Comments | Likes | Reposts */}
                                                        <Box
                                                            sx={(t) => ({
                                                                flexShrink: 0,
                                                                zIndex: 8,
                                                                borderBottom: '1px solid',
                                                                borderColor: alpha(t.palette.primary.main, 0.08),
                                                                bgcolor: 'background.paper',
                                                            })}
                                                        >
                                                            <Tabs
                                                                value={eventSubTab}
                                                                onChange={(_, v) => {
                                                                    setEventSubTab(v);
                                                                    setEventsCategory('');
                                                                    scrollRightRailToTop();
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
                                                                <Tab icon={<EventRoundedIcon />} iconPosition="start" label={`Events${eventActivityCounts ? (() => { const n = (eventActivityCounts.posted || 0) + (eventActivityCounts.rsvp || 0) + (eventActivityCounts.interested || 0); return n > 0 ? ` (${n})` : ''; })() : ''}`} />
                                                                <Tab icon={<ChatBubbleOutlineIcon />} iconPosition="start" label={`Comments${eventActivityCounts?.commented ? ` (${eventActivityCounts.commented})` : ''}`} />
                                                                <Tab icon={<FavoriteIcon />} iconPosition="start" label={`Likes${eventActivityCounts?.liked ? ` (${eventActivityCounts.liked})` : ''}`} />
                                                                <Tab icon={<RepeatIcon />} iconPosition="start" label={`Reposts${eventActivityCounts?.reposted ? ` (${eventActivityCounts.reposted})` : ''}`} />
                                                            </Tabs>
                                                        </Box>

                                                        {/* Event search + filters */}
                                                        <Box sx={(t) => ({ px: 1.5, pt: 1.25, pb: 0.5, bgcolor: 'background.paper', zIndex: 7 })}>
                                                            {/* Row 1: Search + Clear + New */}
                                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.75 }}>
                                                                <SearchInput
                                                                    placeholder="Search events…"
                                                                    value={eventsSearchTerm}
                                                                    onChange={(e) => setEventsSearchTerm(e?.target?.value ?? '')}
                                                                    onSearch={() => { setEventsSearch(eventsSearchTerm); scrollRightRailToTop(); }}
                                                                    onClear={() => { setEventsSearchTerm(''); setEventsSearch(''); }}
                                                                    inputProps={{ name: 'll-profile-events-search' }}
                                                                />
                                                                <Tooltip title="Clear all filters" arrow>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => { setEventsSearchTerm(''); setEventsSearch(''); setEventsCategory(''); setEventsSort('soonest'); setEventsDateFrom(''); setEventsDateTo(''); setEventsView('all'); scrollRightRailToTop(); }}
                                                                        sx={(t) => ({
                                                                            width: 36, height: 36, flexShrink: 0,
                                                                            borderRadius: 999,
                                                                            border: '1px solid',
                                                                            borderColor: alpha(t.palette.text.primary, 0.08),
                                                                            bgcolor: alpha(t.palette.text.primary, 0.03),
                                                                            '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.06), borderColor: alpha(t.palette.primary.main, 0.18) },
                                                                        })}
                                                                        aria-label="Clear filters"
                                                                    >
                                                                        <RestartAltRoundedIcon sx={{ fontSize: 18 }} />
                                                                    </IconButton>
                                                                </Tooltip>

                                                            </Stack>

                                                            {/* Row 2: Filter dropdowns */}
                                                            <Box sx={{ display: 'grid', gridTemplateColumns: eventSubTab === 0 ? { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' } : { xs: '1fr 1fr', sm: '1fr 1fr 1fr' }, gap: 1, pb: 0.75 }}>
                                                                {/* View dropdown — only on Events sub-tab */}
                                                                {eventSubTab === 0 && (
                                                                    <FormControl size="small" fullWidth sx={PROFILE_CONTROL_SX}>
                                                                        <InputLabel id="profile-events-view-label" shrink>View</InputLabel>
                                                                        <Select
                                                                            labelId="profile-events-view-label"
                                                                            label="View"
                                                                            value={eventsView}
                                                                            onChange={(e) => { setEventsView(String(e.target.value || 'all')); scrollRightRailToTop(); }}
                                                                            MenuProps={profileMenuProps}
                                                                        >
                                                                            <MenuItem value="all">All Events</MenuItem>
                                                                            <MenuItem value="hosted">Hosted</MenuItem>
                                                                            <MenuItem value="going">Going</MenuItem>
                                                                            <MenuItem value="interested">Interested</MenuItem>
                                                                        </Select>
                                                                    </FormControl>
                                                                )}

                                                                <FormControl size="small" fullWidth sx={PROFILE_CONTROL_SX}>
                                                                    <InputLabel id="profile-events-category-label" shrink>Category</InputLabel>
                                                                    <Select
                                                                        labelId="profile-events-category-label"
                                                                        label="Category"
                                                                        value={eventsCategory}
                                                                        onChange={(e) => { setEventsCategory(String(e.target.value || '')); scrollRightRailToTop(); }}
                                                                        displayEmpty
                                                                        renderValue={(val) => {
                                                                            const selected = String(val || '');
                                                                            if (!selected) return `All Categories (${totalEventCategoryCount})`;
                                                                            const label = eventCategoryLabel(selected) || selected;
                                                                            const count = Number(eventCategoryCounts[selected] || 0);
                                                                            return `${label} (${count})`;
                                                                        }}
                                                                        MenuProps={profileMenuProps}
                                                                    >
                                                                        <MenuItem value="">All Categories ({totalEventCategoryCount})</MenuItem>
                                                                        {EVENT_CATEGORY_FILTER_OPTIONS
                                                                            .filter(({ value }) => Number(eventCategoryCounts[value] || 0) > 0)
                                                                            .map(({ value, label, Icon }) => {
                                                                                const count = Number(eventCategoryCounts[value] || 0);
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
                                                                            })}
                                                                    </Select>
                                                                </FormControl>

                                                                <TextField
                                                                    size="small"
                                                                    type="date"
                                                                    label="From"
                                                                    InputLabelProps={{ shrink: true }}
                                                                    value={eventsDateFrom}
                                                                    onChange={(e) => { setEventsDateFrom(e.target.value || ''); scrollRightRailToTop(); }}
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
                                                                    value={eventsDateTo}
                                                                    onChange={(e) => { setEventsDateTo(e.target.value || ''); scrollRightRailToTop(); }}
                                                                    sx={{
                                                                        ...PROFILE_CONTROL_SX,
                                                                        '& .MuiInputBase-input': { fontSize: 13 },
                                                                    }}
                                                                />
                                                            </Box>
                                                        </Box>

                                                        {/* Events list */}
                                                        <Box
                                                            ref={eventsScrollRef}
                                                            sx={{
                                                                flex: 'unset',
                                                                minHeight: 0,
                                                                overflowY: 'visible',
                                                                overscrollBehaviorY: 'auto',
                                                                p: 1.5,
                                                            }}
                                                        >
                                                            {eventSubTab === 1 ? (
                                                                /* ── Comments sub-tab ── */
                                                                eventCommentsLoading ? (
                                                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                                                        <CircularProgress size={28} />
                                                                    </Box>
                                                                ) : eventEngagementComments.length === 0 ? (
                                                                    <Box sx={{ pt: 10, pb: 5, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                                                        <ChatBubbleOutlineIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                                                                        <Typography sx={{ fontWeight: 800, fontSize: 18, color: 'text.primary' }}>
                                                                            No current activity
                                                                        </Typography>
                                                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                                            {`${isMine ? "You don't" : "This user doesn't"} have any comments on events yet.`}
                                                                        </Typography>
                                                                    </Box>
                                                                ) : (
                                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                                                        {eventEngagementComments.map((group) => {
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

                                                                            return (
                                                                                <Box
                                                                                    key={`ec-${ev0.id}`}
                                                                                    role="button"
                                                                                    tabIndex={0}
                                                                                    onKeyDown={(e) => {
                                                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                                                            e.preventDefault();
                                                                                            if (latest) openEventComment({ ...latest, _viewEventOnly: true }, ev0);
                                                                                        }
                                                                                    }}
                                                                                    onClick={() => {
                                                                                        if (latest) openEventComment({ ...latest, _viewEventOnly: true }, ev0);
                                                                                    }}
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
                                                                                    {/* Event header */}
                                                                                    <Box
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
                                                                                                <Avatar
                                                                                                    src={eventPhoto}
                                                                                                    alt={String(ev0?.title || '')}
                                                                                                    sx={{ width: 38, height: 38, flexShrink: 0 }}
                                                                                                />
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
                                                                                                    {formatEventDate(ev0) || (latest?.created_at ? eventTimeAgo(latest.created_at) : '')}
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

                                                                                    {/* Comment rows */}
                                                                                    <Box sx={{ px: 1.5, py: 1.25, display: 'grid', gap: 1 }}>
                                                                                        {comments.slice(0, 3).map((c) => {
                                                                                            const cText = String(c?.content || '').trim();
                                                                                            const isReply = !!c?.parent_id;
                                                                                            const cTime = c?.created_at || null;

                                                                                            return (
                                                                                                <Box
                                                                                                    key={`ec-c-${c?.id || c?.comment_id || ''}`}
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        openEventComment(c, ev0);
                                                                                                    }}
                                                                                                    sx={(t) => ({
                                                                                                        border: '1px solid',
                                                                                                        borderColor: alpha(t.palette.text.primary, 0.08),
                                                                                                        borderRadius: 2,
                                                                                                        px: 1.25,
                                                                                                        py: 1,
                                                                                                        bgcolor: alpha(t.palette.primary.main, 0.02),
                                                                                                        '&:hover': { borderColor: alpha(t.palette.primary.main, 0.32) },
                                                                                                    })}
                                                                                                >
                                                                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                                                                                            <Avatar
                                                                                                                src={avatarSrc || defaultAvatar}
                                                                                                                alt={`${String(profile?.first_name || '').trim()} ${String(profile?.last_name || '').trim()}`.trim() || 'User'}
                                                                                                                sx={{ width: 34, height: 34 }}
                                                                                                            />
                                                                                                            <Box sx={{ minWidth: 0 }}>
                                                                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                                                                    <Typography
                                                                                                                        variant="body2"
                                                                                                                        sx={{ fontWeight: 900, lineHeight: 1.1 }}
                                                                                                                        noWrap
                                                                                                                    >
                                                                                                                        {`${String(profile?.first_name || '').trim()} ${String(profile?.last_name || '').trim()}`.trim() || 'User'}
                                                                                                                    </Typography>
                                                                                                                </Box>
                                                                                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                                                                                    {profile?.handle ? `@${String(profile.handle).trim().replace(/^@+/, '')}` : ''}
                                                                                                                    {isReply ? ' • Reply' : ''}
                                                                                                                </Typography>
                                                                                                            </Box>
                                                                                                        </Box>
                                                                                                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                                                                                            {cTime ? eventTimeAgo(cTime) : ''}
                                                                                                        </Typography>
                                                                                                    </Box>
                                                                                                    <Typography
                                                                                                        variant="body2"
                                                                                                        sx={{
                                                                                                            fontWeight: 800,
                                                                                                            color: 'text.primary',
                                                                                                            mt: 0.5,
                                                                                                            whiteSpace: 'pre-wrap',
                                                                                                            overflowWrap: 'anywhere',
                                                                                                        }}
                                                                                                    >
                                                                                                        {ecTruncate(cText, 260)}
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
                                                                                                                onClick={(e) => {
                                                                                                                    e.stopPropagation();
                                                                                                                    openEventComment(c, ev0);
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
                                                                profileEventsLoading ? (
                                                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                                                        <CircularProgress size={28} />
                                                                    </Box>
                                                                ) : filteredProfileEvents.length === 0 ? (
                                                                    <Box sx={{ pt: 10, pb: 5, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                                                        {eventSubTab === 2
                                                                            ? <FavoriteIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                                                                            : eventSubTab === 3
                                                                                ? <RepeatIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                                                                                : <EventRoundedIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />}
                                                                        <Typography sx={{ fontWeight: 800, fontSize: 18, color: 'text.primary' }}>
                                                                            {eventSubTab === 2
                                                                                ? 'No current activity'
                                                                                : eventSubTab === 3
                                                                                    ? 'No current activity'
                                                                                    : eventsView === 'going'
                                                                                        ? 'Not going to any events'
                                                                                        : eventsView === 'interested'
                                                                                            ? 'Not interested in any events'
                                                                                            : eventsView === 'hosted'
                                                                                                ? 'No hosted events'
                                                                                                : (eventsSearch || eventsCategory)
                                                                                                    ? 'No events match your filters'
                                                                                                    : 'No events'}
                                                                        </Typography>
                                                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                                            {eventSubTab === 2
                                                                                ? `${isMine ? "You haven't" : "This user hasn't"} liked any events yet.`
                                                                                : eventSubTab === 3
                                                                                    ? `${isMine ? "You haven't" : "This user hasn't"} reposted any events yet.`
                                                                                    : eventsView === 'going'
                                                                                        ? `${isMine ? "You haven't" : "This user hasn't"} RSVP'd to any events yet.`
                                                                                        : eventsView === 'interested'
                                                                                            ? `${isMine ? "You haven't" : "This user hasn't"} marked interest in any events yet.`
                                                                                            : eventsView === 'hosted'
                                                                                                ? `${isMine ? "You haven't" : "This user hasn't"} created any events yet.`
                                                                                                : (eventsSearch || eventsCategory)
                                                                                                    ? 'Try adjusting your search or filters.'
                                                                                                    : `${isMine ? "You haven't" : "This user hasn't"} hosted, RSVP'd to, or shown interest in any events yet.`}
                                                                        </Typography>
                                                                    </Box>
                                                                ) : (
                                                                    <Box>
                                                                        {(() => {
                                                                            const hasSections = eventsView === 'all' && eventSubTab === 0 && filteredProfileEvents.some((ev) => ev?._section);
                                                                            if (!hasSections) {
                                                                                return (
                                                                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
                                                                                        {visibleProfileEvents.map((ev) => (
                                                                                            <EventCard key={ev.id} event={ev} onClick={() => handleEventClick(ev)} onEdit={handleEditEvent} onDelete={handleDeleteEvent} onEngagementChange={handleEventEngagementChange} user={me} activeAccount={activeAccount} compact />
                                                                                        ))}
                                                                                    </Box>
                                                                                );
                                                                            }
                                                                            const profileName = `${profile?.first_name || ''}`.trim() || 'User';
                                                                            const sections = [
                                                                                { key: 'hosted', label: isMine ? 'Your Hosted Events' : `${profileName}'s Hosted Events` },
                                                                                { key: 'going', label: isMine ? 'Events You\'re Going To' : `${profileName}'s Going To` },
                                                                                { key: 'interested', label: isMine ? 'Events You\'re Interested In' : `${profileName}'s Interested In` },
                                                                            ];
                                                                            return sections.map(({ key: sKey }) => {
                                                                                const items = visibleProfileEvents.filter((ev) => ev?._section === sKey);
                                                                                if (!items.length) return null;
                                                                                return (
                                                                                    <Box key={sKey} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
                                                                                        {items.map((ev) => (
                                                                                            <EventCard key={ev.id} event={ev} onClick={() => handleEventClick(ev)} onEdit={handleEditEvent} onDelete={handleDeleteEvent} onEngagementChange={handleEventEngagementChange} user={me} activeAccount={activeAccount} compact />
                                                                                        ))}
                                                                                    </Box>
                                                                                );
                                                                            });
                                                                        })()}
                                                                        <Box ref={eventsSentinelRef} sx={{ height: 1 }} />
                                                                    </Box>
                                                                )
                                                            )}
                                                        </Box>

                                                    </>
                                                )}

                                                {/* ── Jobs tab content ── */}
                                                {rightRailView === 'jobs' && (
                                                    <>
                                                        {/* Jobs search + filters */}
                                                        <Box sx={(t) => ({ px: 1.5, pt: 1.25, pb: 0.5, bgcolor: 'background.paper', zIndex: 8 })}>
                                                            {/* Row 1: Search + Clear + New */}
                                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.75 }}>
                                                                <SearchInput
                                                                    placeholder="Search jobs…"
                                                                    value={jobsSearchTerm}
                                                                    onChange={(e) => setJobsSearchTerm(e?.target?.value ?? '')}
                                                                    onSearch={() => { setJobsSearch(jobsSearchTerm); scrollRightRailToTop(); }}
                                                                    onClear={() => { setJobsSearchTerm(''); setJobsSearch(''); }}
                                                                    inputProps={{ name: 'll-profile-jobs-search' }}
                                                                />
                                                                <Tooltip title="Clear all filters" arrow>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => { setJobsSearchTerm(''); setJobsSearch(''); setJobsCategory(''); setJobsSort('newest'); scrollRightRailToTop(); }}
                                                                        sx={(t) => ({
                                                                            width: 36, height: 36, flexShrink: 0,
                                                                            borderRadius: 999,
                                                                            border: '1px solid',
                                                                            borderColor: alpha(t.palette.text.primary, 0.08),
                                                                            bgcolor: alpha(t.palette.text.primary, 0.03),
                                                                            '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.06), borderColor: alpha(t.palette.primary.main, 0.18) },
                                                                        })}
                                                                        aria-label="Clear filters"
                                                                    >
                                                                        <RestartAltRoundedIcon sx={{ fontSize: 18 }} />
                                                                    </IconButton>
                                                                </Tooltip>

                                                            </Stack>

                                                            {/* Row 2: Filter dropdowns */}
                                                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1, pb: 0.75 }}>
                                                                <FormControl size="small" fullWidth sx={PROFILE_CONTROL_SX}>
                                                                    <InputLabel id="profile-jobs-sort-label" shrink>Sort by</InputLabel>
                                                                    <Select
                                                                        labelId="profile-jobs-sort-label"
                                                                        label="Sort by"
                                                                        value={jobsSort}
                                                                        onChange={(e) => { setJobsSort(String(e.target.value || 'newest')); scrollRightRailToTop(); }}
                                                                        MenuProps={profileMenuProps}
                                                                    >
                                                                        <MenuItem value="newest">Newest</MenuItem>
                                                                        <MenuItem value="oldest">Oldest</MenuItem>
                                                                    </Select>
                                                                </FormControl>

                                                                <FormControl size="small" fullWidth sx={PROFILE_CONTROL_SX}>
                                                                    <InputLabel id="profile-jobs-category-label" shrink>Category</InputLabel>
                                                                    <Select
                                                                        labelId="profile-jobs-category-label"
                                                                        label="Category"
                                                                        value={jobsCategory}
                                                                        onChange={(e) => { setJobsCategory(String(e.target.value || '')); scrollRightRailToTop(); }}
                                                                        displayEmpty
                                                                        renderValue={(val) => {
                                                                            if (!val) return 'All Categories';
                                                                            return jobCategoryLabel(val) || val;
                                                                        }}
                                                                        MenuProps={profileMenuProps}
                                                                    >
                                                                        <MenuItem value="">All Categories</MenuItem>
                                                                        {(() => {
                                                                            const cats = new Set();
                                                                            profileJobs.forEach((j) => {
                                                                                const c = String(j?.category || '').trim().toLowerCase();
                                                                                if (c) cats.add(c);
                                                                            });
                                                                            return Array.from(cats).sort().map((c) => {
                                                                                const CatIcon = JOB_CATEGORY_ICONS[c] || CategoryRoundedIcon;
                                                                                return (
                                                                                    <MenuItem key={c} value={c}>
                                                                                        <ProfileCategoryRow Icon={CatIcon} label={jobCategoryLabel(c)} />
                                                                                    </MenuItem>
                                                                                );
                                                                            });
                                                                        })()}
                                                                    </Select>
                                                                </FormControl>
                                                            </Box>
                                                        </Box>

                                                        {/* Jobs list */}
                                                        <Box ref={jobsScrollRef} sx={{ flex: 'unset', minHeight: 0, overflowY: 'visible', overscrollBehaviorY: 'auto', p: 1.5 }}>
                                                            {profileJobsLoading ? (
                                                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                                                    <CircularProgress size={28} />
                                                                </Box>
                                                            ) : filteredProfileJobs.length === 0 ? (
                                                                <Box sx={{ pt: 10, pb: 5, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                                                    <WorkRoundedIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                                                                    <Typography sx={{ fontWeight: 800, fontSize: 18, color: 'text.primary' }}>
                                                                        {(jobsSearch || jobsCategory) ? 'No jobs match your filters' : 'No job listings'}
                                                                    </Typography>
                                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                                        {(jobsSearch || jobsCategory) ? 'Try adjusting your search or filters.' : `${isMine ? "You haven't" : "This user hasn't"} posted any job listings yet.`}
                                                                    </Typography>
                                                                </Box>
                                                            ) : (
                                                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
                                                                    {visibleProfileJobs.map((job) => (
                                                                        <JobCard
                                                                            key={job.id}
                                                                            job={job}
                                                                            onClick={() => handleJobClick(job)}
                                                                            onEdit={handleEditJob}
                                                                            onDelete={handleDeleteJobClick}
                                                                            onShare={handleJobShare}
                                                                            onSave={handleJobSaveToggle}
                                                                            onApply={handleJobApply}
                                                                            onReport={handleJobReport}
                                                                            onRenew={handleRenew}
                                                                            user={me}
                                                                            activeAccount={activeAccount}
                                                                            disableHoverEffects
                                                                        />
                                                                    ))}
                                                                    <Box ref={jobsSentinelRef} sx={{ height: 1, gridColumn: '1 / -1' }} />
                                                                </Box>
                                                            )}
                                                        </Box>

                                                    </>
                                                )}

                                                {/* ── Services tab content ── */}
                                                {rightRailView === 'services' && (
                                                    <>
                                                        {/* Services sub-tabs (Services | Requests) — mirrors marketplace sub-tabs */}
                                                        <Box
                                                            sx={(t) => ({
                                                                flexShrink: 0,
                                                                zIndex: 8,
                                                                borderBottom: '1px solid',
                                                                borderColor: alpha(t.palette.primary.main, 0.08),
                                                                bgcolor: 'background.paper',
                                                            })}
                                                        >
                                                            <Tabs
                                                                value={servicesSubTab}
                                                                onChange={(_, v) => { setServicesSubTab(v); scrollRightRailToTop(); }}
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
                                                                    '& .MuiTabs-indicator': { backgroundColor: t.palette.text.primary },
                                                                    '& .MuiTab-root.Mui-selected': { color: t.palette.text.primary },
                                                                })}
                                                            >
                                                                <Tab icon={<BuildRoundedIcon />} iconPosition="start" label={`Services${profileServices.length > 0 ? ` (${profileServices.length})` : ''}`} value="services" />
                                                                {(isMine || profileHasServiceRequests) && (
                                                                    <Tab icon={<FrontHandRoundedIcon />} iconPosition="start" label={`Requests${profileServiceRequests.length > 0 ? ` (${profileServiceRequests.length})` : ''}`} value="requests" />
                                                                )}
                                                            </Tabs>
                                                        </Box>

                                                        {/* ── Sub-tab: Services (offered / favorites) ── */}
                                                        {servicesSubTab === 'services' && (
                                                            <>


                                                                {/* Services list */}
                                                                <Box ref={servicesScrollRef} sx={{ flex: 'unset', minHeight: 0, overflowY: 'visible', overscrollBehaviorY: 'auto', p: 1.5 }}>
                                                                    {(servicesView === 'favorites' ? profileFavServicesLoading : profileServicesLoading) ? (
                                                                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                                                            <CircularProgress size={28} />
                                                                        </Box>
                                                                    ) : filteredProfileServices.length === 0 ? (
                                                                        <Box sx={{ pt: 10, pb: 5, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                                                            {servicesView === 'favorites'
                                                                                ? <FavoriteIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                                                                                : <BuildRoundedIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />}
                                                                            <Typography sx={{ fontWeight: 800, fontSize: 18, color: 'text.primary' }}>
                                                                                {servicesView === 'favorites'
                                                                                    ? 'No Favorite Services'
                                                                                    : 'No Services Yet'}
                                                                            </Typography>
                                                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 320 }}>
                                                                                {servicesView === 'favorites'
                                                                                    ? `${isMine ? "You haven't" : `${profile?.first_name || 'This user'} hasn't`} favorited any services yet.`
                                                                                    : `${isMine ? "You haven't" : `${profile?.first_name || 'This user'} hasn't`} posted any service listings yet.`}
                                                                            </Typography>
                                                                        </Box>
                                                                    ) : (
                                                                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
                                                                            {visibleProfileServices.map((svc) => (
                                                                                <ServiceCard
                                                                                    key={svc.id}
                                                                                    service={svc}
                                                                                    onClick={() => handleServiceClick(svc)}
                                                                                    onShare={(s) => {
                                                                                        setSharePost(s);
                                                                                        setShareContentType('post');
                                                                                        setShareOpen(true);
                                                                                    }}
                                                                                    onFavorite={handleServiceFavorite}
                                                                                    onRequestQuote={handleServiceMessage}
                                                                                    user={me}
                                                                                    activeAccount={activeAccount}
                                                                                />
                                                                            ))}
                                                                            <Box ref={servicesSentinelRef} sx={{ height: 1, gridColumn: '1 / -1' }} />
                                                                        </Box>
                                                                    )}
                                                                </Box>
                                                            </>
                                                        )}

                                                        {/* ── Sub-tab: Requests ── */}
                                                        {servicesSubTab === 'requests' && (
                                                            <Box ref={servicesScrollRef} sx={{ flex: 'unset', minHeight: 0, overflowY: 'visible', overscrollBehaviorY: 'auto', p: 1.5 }}>
                                                                {profileServiceRequestsLoading ? (
                                                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                                                        <CircularProgress size={28} />
                                                                    </Box>
                                                                ) : profileServiceRequests.length === 0 ? (
                                                                    <Box sx={{ pt: 10, pb: 5, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                                                        <HandymanRoundedIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                                                                        <Typography sx={{ fontWeight: 800, fontSize: 18, color: 'text.primary' }}>
                                                                            No Service Requests
                                                                        </Typography>
                                                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 320 }}>
                                                                            {isMine
                                                                                ? "You haven't submitted any service requests yet. Post a request to get help from your community!"
                                                                                : `${profile?.first_name || 'This user'} hasn't submitted any service requests yet.`}
                                                                        </Typography>
                                                                    </Box>
                                                                ) : (
                                                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
                                                                        {profileServiceRequests.map((req) => (
                                                                            <ServiceRequestCard
                                                                                key={req.id}
                                                                                request={req}
                                                                                onClick={(r) => {
                                                                                    if (r?.id) {
                                                                                        setSelectedRequestPopup(r);
                                                                                    }
                                                                                }}
                                                                                onEdit={(r) => {
                                                                                    setEditingRequestItem(r);
                                                                                    setEditRequestModalOpen(true);
                                                                                }}
                                                                                onDelete={(r) => {
                                                                                    if (!window.confirm('Delete this service request? This cannot be undone.')) return;
                                                                                    deleteServiceRequest(r.id)
                                                                                        .then(() => {
                                                                                            setServicesRefreshNonce((n) => n + 1);
                                                                                            showSuccess('Service request deleted');
                                                                                        })
                                                                                        .catch(() => {});
                                                                                }}
                                                                                user={me}
                                                                                activeAccount={activeAccount}
                                                                            />
                                                                        ))}
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                        )}
                                                    </>
                                                )}

                                                {/* ── Marketplace tab content ── */}
                                                {rightRailView === 'marketplace' && (
                                                    <>
                                                        {/* Marketplace sub-tabs */}
                                                        <Box
                                                            sx={(t) => ({
                                                                flexShrink: 0,
                                                                zIndex: 8,
                                                                borderBottom: '1px solid',
                                                                borderColor: alpha(t.palette.primary.main, 0.08),
                                                                bgcolor: 'background.paper',
                                                            })}
                                                        >
                                                            <Tabs
                                                                value={marketplaceSubTab}
                                                                onChange={(_, v) => { setMarketplaceSubTab(v); scrollRightRailToTop(); }}
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
                                                                    '& .MuiTabs-indicator': { backgroundColor: t.palette.text.primary },
                                                                    '& .MuiTab-root.Mui-selected': { color: t.palette.text.primary },
                                                                })}
                                                            >
                                                                <Tab icon={<StorefrontRoundedIcon />} iconPosition="start" label={`Listings${profileListings.length > 0 ? ` (${profileListings.length})` : ''}`} value="listings" />
                                                                <Tab icon={<RepeatIcon />} iconPosition="start" label={`Reposts${marketplaceRepostsTotal > 0 ? ` (${marketplaceRepostsTotal})` : ''}`} value="reposts" />
                                                                <Tab icon={<PersonRoundedIcon />} iconPosition="start" label="Seller Info" value="seller_info" />
                                                            </Tabs>
                                                        </Box>

                                                        {/* ── Sub-tab: Seller Info ── */}
                                                        {marketplaceSubTab === 'seller_info' && (
                                                            <Box ref={marketplaceScrollRef} sx={{ flex: 'unset', minHeight: 0, overflowY: 'visible', overscrollBehaviorY: 'auto', p: 1.5 }}>
                                                                {sellerReviewsLoading ? (
                                                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                                                        <CircularProgress size={28} />
                                                                    </Box>
                                                                ) : (
                                                                    <>
                                                                        {/* Seller card */}
                                                                        <Box sx={(t) => ({ p: 1.5, borderRadius: 2.5, border: '1px solid', borderColor: alpha(t.palette.text.primary, 0.06), bgcolor: alpha(t.palette.text.primary, 0.015), mb: 1.5 })}>
                                                                            <Stack direction="row" spacing={1.25} alignItems="flex-start">
                                                                                <Avatar
                                                                                    src={profile?.profile_picture || profile?.avatar_url || defaultAvatar}
                                                                                    alt={`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()}
                                                                                    sx={(t) => ({ width: 48, height: 48, border: `2px solid ${alpha(t.palette.text.primary, 0.06)}`, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main })}
                                                                                >
                                                                                    <PersonRoundedIcon sx={{ fontSize: 26 }} />
                                                                                </Avatar>
                                                                                <Box sx={{ minWidth: 0 }}>
                                                                                    <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
                                                                                        {`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Seller'}
                                                                                    </Typography>
                                                                                    {profile?.handle && (
                                                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                                                                                            @{profile.handle}
                                                                                        </Typography>
                                                                                    )}
                                                                                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                                                                                        {sellerReviewStats.avgRating !== null ? (
                                                                                            <>
                                                                                                <Rating
                                                                                                    value={sellerReviewStats.avgRating}
                                                                                                    precision={0.1}
                                                                                                    readOnly
                                                                                                    size="small"
                                                                                                    icon={<StarRoundedIcon sx={{ fontSize: 14 }} />}
                                                                                                    emptyIcon={<StarRoundedIcon sx={{ fontSize: 14 }} />}
                                                                                                    sx={{ '& .MuiRating-icon': { fontSize: 14 } }}
                                                                                                />
                                                                                                <Typography variant="caption" sx={{ fontWeight: 800, fontSize: 11 }}>
                                                                                                    {sellerReviewStats.avgRating}
                                                                                                </Typography>
                                                                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5 }}>
                                                                                                    ({sellerReviewStats.totalCount})
                                                                                                </Typography>
                                                                                            </>
                                                                                        ) : (
                                                                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5 }}>
                                                                                                No reviews yet
                                                                                            </Typography>
                                                                                        )}
                                                                                    </Stack>
                                                                                </Box>
                                                                            </Stack>
                                                                        </Box>

                                                                        {/* Seller stats badges */}
                                                                        {(() => {
                                                                            const sellerSearchName = profile?.handle ? `@${profile.handle}` : (`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || '');
                                                                            const navToMarketplace = (statusFilter) => {
                                                                                navigate('/marketplace', {
                                                                                    state: { sellerFilter: { query: sellerSearchName, status: statusFilter } },
                                                                                });
                                                                            };
                                                                            return (
                                                                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0.75, mb: 1.5 }}>
                                                                                    <Box
                                                                                        onClick={() => navToMarketplace('all')}
                                                                                        sx={(t) => ({ p: 1, borderRadius: 2, border: '1px solid', borderColor: alpha(t.palette.text.primary, 0.08), bgcolor: alpha(t.palette.primary.main, 0.04), textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s ease', '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.1), transform: 'translateY(-1px)' } })}
                                                                                    >
                                                                                        <Typography sx={{ fontWeight: 900, fontSize: 16, color: 'primary.main', lineHeight: 1.2 }}>
                                                                                            {sellerStats.totalListings}
                                                                                        </Typography>
                                                                                        <Typography sx={{ fontSize: 9.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                                                                            Total Listings
                                                                                        </Typography>
                                                                                    </Box>
                                                                                    <Box
                                                                                        onClick={() => navToMarketplace('sold')}
                                                                                        sx={(t) => ({ p: 1, borderRadius: 2, border: '1px solid', borderColor: alpha(t.palette.success.main, 0.12), bgcolor: alpha(t.palette.success.main, 0.04), textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s ease', '&:hover': { bgcolor: alpha(t.palette.success.main, 0.1), transform: 'translateY(-1px)' } })}
                                                                                    >
                                                                                        <Typography sx={{ fontWeight: 900, fontSize: 16, color: 'success.main', lineHeight: 1.2 }}>
                                                                                            {sellerStats.soldListings}
                                                                                        </Typography>
                                                                                        <Typography sx={{ fontSize: 9.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                                                                            Sold
                                                                                        </Typography>
                                                                                    </Box>
                                                                                    <Box
                                                                                        onClick={() => navToMarketplace('available')}
                                                                                        sx={(t) => ({ p: 1, borderRadius: 2, border: '1px solid', borderColor: alpha(t.palette.info.main, 0.12), bgcolor: alpha(t.palette.info.main, 0.04), textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s ease', '&:hover': { bgcolor: alpha(t.palette.info.main, 0.1), transform: 'translateY(-1px)' } })}
                                                                                    >
                                                                                        <Typography sx={{ fontWeight: 900, fontSize: 16, color: 'info.main', lineHeight: 1.2 }}>
                                                                                            {sellerStats.activeListings}
                                                                                        </Typography>
                                                                                        <Typography sx={{ fontSize: 9.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                                                                            Active
                                                                                        </Typography>
                                                                                    </Box>
                                                                                </Box>
                                                                            );
                                                                        })()}

                                                                        {/* Seller Reviews header */}
                                                                        <Typography sx={{ fontWeight: 900, fontSize: 10.5, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'text.secondary', mb: 1 }}>
                                                                            Seller Reviews {sellerReviewStats.totalCount > 0 ? `(${sellerReviewStats.totalCount})` : ''}
                                                                        </Typography>

                                                                        {/* Rating breakdown histogram */}
                                                                        {sellerReviews.length > 0 && sellerReviewStats.avgRating !== null && (() => {
                                                                            const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                                                                            sellerReviews.forEach((r) => {
                                                                                const s = Math.round(Number(r.rating) || 0);
                                                                                if (s >= 1 && s <= 5) ratingCounts[s]++;
                                                                            });
                                                                            const maxCount = Math.max(1, ...Object.values(ratingCounts));
                                                                            return (
                                                                                <Box sx={{ mb: 2 }}>
                                                                                    <Stack direction="row" spacing={2} alignItems="flex-start">
                                                                                        <Box sx={{ textAlign: 'center', minWidth: 72 }}>
                                                                                            <Typography sx={{ fontWeight: 900, fontSize: '2rem', lineHeight: 1 }}>
                                                                                                {(sellerReviewStats.avgRating || 0).toFixed(1)}
                                                                                            </Typography>
                                                                                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.25 }}>
                                                                                                <Rating
                                                                                                    value={sellerReviewStats.avgRating || 0}
                                                                                                    precision={0.5}
                                                                                                    readOnly
                                                                                                    size="small"
                                                                                                    sx={{ '& .MuiRating-icon': { fontSize: 14 } }}
                                                                                                />
                                                                                            </Box>
                                                                                            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 700, mt: 0.25 }}>
                                                                                                {sellerReviewStats.totalCount} review{sellerReviewStats.totalCount !== 1 ? 's' : ''}
                                                                                            </Typography>
                                                                                        </Box>
                                                                                        <Box sx={{ flex: 1 }}>
                                                                                            {[5, 4, 3, 2, 1].map((star) => (
                                                                                                <Stack key={star} direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.25 }}>
                                                                                                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, width: 10, textAlign: 'right' }}>{star}</Typography>
                                                                                                    <Rating value={1} max={1} readOnly size="small" sx={{ '& .MuiRating-icon': { fontSize: 12 } }} />
                                                                                                    <Box sx={(t) => ({ flex: 1, height: 8, borderRadius: 4, bgcolor: alpha(t.palette.divider, 0.3), overflow: 'hidden' })}>
                                                                                                        <Box sx={{ width: `${(ratingCounts[star] / maxCount) * 100}%`, height: '100%', borderRadius: 4, bgcolor: 'secondary.main', transition: (t) => `width ${t.custom?.motion?.slow || 400}ms ${t.custom?.motion?.ease || 'ease'}` }} />
                                                                                                    </Box>
                                                                                                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: 'text.secondary', width: 20, textAlign: 'right' }}>{ratingCounts[star]}</Typography>
                                                                                                </Stack>
                                                                                            ))}
                                                                                        </Box>
                                                                                    </Stack>
                                                                                </Box>
                                                                            );
                                                                        })()}

                                                                        {/* Review cards */}
                                                                        {sortedSellerReviews.length > 0 ? (
                                                                            <Stack spacing={0} sx={{ mb: 1 }}>
                                                                                {sortedSellerReviews.map((rev, idx) => {
                                                                                    const reviewerName = rev.reviewer_name || rev.reviewer?.name || [rev.reviewer_first_name, rev.reviewer_last_name].filter(Boolean).join(' ') || 'User';
                                                                                    const reviewerHandle = rev.reviewer_handle || rev.reviewer?.handle || '';
                                                                                    const reviewerAvatar = rev.reviewer_avatar || rev.reviewer?.avatarUrl || '';
                                                                                    const reviewDate = rev.created_at || rev.createdAt;
                                                                                    const reviewDateStr = reviewDate ? (() => {
                                                                                        const d = new Date(reviewDate);
                                                                                        if (Number.isNaN(d.getTime())) return '';
                                                                                        const diffMs = Date.now() - d.getTime();
                                                                                        const diffMin = Math.floor(diffMs / 60000);
                                                                                        if (diffMin < 1) return 'Just now';
                                                                                        if (diffMin < 60) return `${diffMin}m ago`;
                                                                                        const diffHr = Math.floor(diffMin / 60);
                                                                                        if (diffHr < 24) return `${diffHr}h ago`;
                                                                                        const diffDay = Math.floor(diffHr / 24);
                                                                                        if (diffDay < 7) return `${diffDay}d ago`;
                                                                                        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                                                                    })() : '';

                                                                                    return (
                                                                                        <Box
                                                                                            key={rev.id || idx}
                                                                                            data-seller-review-id={rev.id}
                                                                                            sx={(t) => {
                                                                                                const isHighlighted = highlightSellerReviewId && Number(rev.id) === Number(highlightSellerReviewId);
                                                                                                const brass = t.custom?.brand?.brass || '#A87822';
                                                                                                return {
                                                                                                    py: 1.5,
                                                                                                    borderBottom: idx < sortedSellerReviews.length - 1 ? '1px solid' : 'none',
                                                                                                    borderColor: alpha(t.palette.divider, 0.5),
                                                                                                    transition: `background-color ${t.custom?.motion?.slow || 400}ms ease, box-shadow ${t.custom?.motion?.slow || 400}ms ease, border-color ${t.custom?.motion?.slow || 400}ms ease`,
                                                                                                    borderRadius: 2,
                                                                                                    border: isHighlighted ? '2px solid' : '2px solid transparent',
                                                                                                    ...(isHighlighted ? {
                                                                                                        px: 1,
                                                                                                        mx: -1,
                                                                                                        backgroundColor: alpha(brass, 0.14),
                                                                                                        borderColor: alpha(brass, 0.70),
                                                                                                        boxShadow: `0 14px 34px ${alpha(brass, 0.20)}`,
                                                                                                    } : {}),
                                                                                                };
                                                                                            }}
                                                                                        >
                                                                                            <Stack direction="row" spacing={1} alignItems="flex-start">
                                                                                                <Avatar
                                                                                                    src={reviewerAvatar || undefined}
                                                                                                    alt={reviewerName}
                                                                                                    sx={(t) => ({
                                                                                                        width: 32, height: 32, fontSize: 13, fontWeight: 700,
                                                                                                        ...(!reviewerAvatar ? { bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main } : {}),
                                                                                                    })}
                                                                                                >
                                                                                                    {(() => {
                                                                                                        const rat = (rev.reviewer_account_type || rev.reviewer?.account_type || '').toLowerCase();
                                                                                                        if (rat === 'business') return <StorefrontRoundedIcon sx={{ fontSize: 18 }} />;
                                                                                                        if (rat === 'artist') return <MusicNoteRoundedIcon sx={{ fontSize: 17 }} />;
                                                                                                        return <PersonRoundedIcon sx={{ fontSize: 18 }} />;
                                                                                                    })()}
                                                                                                </Avatar>
                                                                                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                                                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                                                                        <Typography sx={{ fontWeight: 800, fontSize: 12.5 }}>{reviewerName}</Typography>
                                                                                                        {reviewerHandle && (
                                                                                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5 }}>
                                                                                                                @{reviewerHandle}
                                                                                                            </Typography>
                                                                                                        )}
                                                                                                        {reviewDateStr && (
                                                                                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5 }}>
                                                                                                                &middot; {reviewDateStr}
                                                                                                            </Typography>
                                                                                                        )}
                                                                                                    </Stack>
                                                                                                    <Rating
                                                                                                        value={Number(rev.rating) || 0}
                                                                                                        readOnly
                                                                                                        size="small"
                                                                                                        icon={<StarRoundedIcon sx={{ fontSize: 14 }} />}
                                                                                                        emptyIcon={<StarRoundedIcon sx={{ fontSize: 14 }} />}
                                                                                                        sx={{ mt: 0.25, '& .MuiRating-icon': { fontSize: 14 } }}
                                                                                                    />
                                                                                                    {(rev.comment || rev.body) && (
                                                                                                        <Typography variant="body2" sx={{ mt: 0.5, fontSize: 12.5, lineHeight: 1.5, color: 'text.primary', wordBreak: 'break-word' }}>
                                                                                                            {rev.comment || rev.body}
                                                                                                        </Typography>
                                                                                                    )}
                                                                                                    {/* Review photos — bigger, clickable */}
                                                                                                    {(() => {
                                                                                                        const revPhotos = rev.photo_urls || rev.photoUrls || [];
                                                                                                        if (!revPhotos.length) return null;
                                                                                                        return (
                                                                                                            <Stack direction="row" spacing={0.75} sx={{ mt: 1, overflowX: 'auto', pb: 0.5, '&::-webkit-scrollbar': { height: 4 }, '&::-webkit-scrollbar-thumb': { borderRadius: 2, bgcolor: (t) => alpha(t.palette.common.black, 0.12) } }}>
                                                                                                                {revPhotos.slice(0, 4).map((url, pi) => (
                                                                                                                    <Box key={pi} onClick={() => openSellerRevPhotoLb(revPhotos, pi)}
                                                                                                                         sx={{ position: 'relative', width: 80, height: 80, flexShrink: 0, borderRadius: 2, overflow: 'hidden', cursor: 'pointer', border: '1px solid', borderColor: 'divider', '&:hover img': { transform: 'scale(1.05)' }, '&:hover .ll-rv-zoom': { opacity: 1 }, '&:hover': { boxShadow: (t) => t.custom?.shadows?.xs || '0 1px 4px rgba(0,0,0,0.1)' } }}>
                                                                                                                        <Box component="img" src={url} alt={`Review photo ${pi + 1}`} referrerPolicy="no-referrer"
                                                                                                                             sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 250ms ease' }} />
                                                                                                                        <Box className="ll-rv-zoom" sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: (t) => alpha(t.palette.common.black, 0.35), opacity: 0, transition: 'opacity 200ms ease', pointerEvents: 'none' }}>
                                                                                                                            <ZoomInRoundedIcon sx={{ color: 'common.white', fontSize: 20 }} />
                                                                                                                        </Box>
                                                                                                                    </Box>
                                                                                                                ))}
                                                                                                            </Stack>
                                                                                                        );
                                                                                                    })()}
                                                                                                    {rev.listingTitle && (
                                                                                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: 10.5, fontStyle: 'italic' }}>
                                                                                                            Re: {rev.listingTitle}
                                                                                                        </Typography>
                                                                                                    )}
                                                                                                    {/* Seller reply — with avatar, name, handle, reply photos */}
                                                                                                    {rev.seller_reply && (() => {
                                                                                                        const rpName = rev.reply_by_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Seller';
                                                                                                        const rpHandle = rev.reply_by_handle || profile?.handle || '';
                                                                                                        const rpAvatar = rev.reply_by_avatar || profile?.profile_picture || profile?.avatar_url || '';
                                                                                                        const rpPhotos = Array.isArray(rev.reply_photo_urls) ? rev.reply_photo_urls.filter(Boolean) : [];
                                                                                                        return (
                                                                                                            <Box sx={(t) => ({ mt: 1.5, ml: 1, pl: 1.5, py: 1, borderLeft: '3px solid', borderColor: t.palette.primary.main, bgcolor: alpha(t.palette.primary.main, 0.04), borderRadius: '0 8px 8px 0' })}>
                                                                                                                <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 0.75 }}>
                                                                                                                    <Avatar src={rpAvatar || undefined} sx={(t) => ({ width: 30, height: 30, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main, mt: 0.1, flexShrink: 0 })}>
                                                                                                                        <PersonRoundedIcon sx={{ fontSize: 16 }} />
                                                                                                                    </Avatar>
                                                                                                                    <Box sx={{ minWidth: 0 }}>
                                                                                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                                                                                            <Typography sx={{ fontWeight: 800, fontSize: 12, color: 'primary.dark', lineHeight: 1.3 }}>{rpName}</Typography>
                                                                                                                            <Chip label="Seller" size="small" sx={{ height: 16, fontSize: 9, fontWeight: 800, bgcolor: 'primary.main', color: 'common.white', '& .MuiChip-label': { px: 0.6 } }} />
                                                                                                                        </Stack>
                                                                                                                        {rpHandle && (
                                                                                                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11, lineHeight: 1.2, display: 'block' }}>@{rpHandle}</Typography>
                                                                                                                        )}
                                                                                                                    </Box>
                                                                                                                </Stack>
                                                                                                                <Typography variant="body2" sx={{ fontSize: 12, lineHeight: 1.45, color: 'text.secondary', pl: 4.75 }}>
                                                                                                                    {rev.seller_reply}
                                                                                                                </Typography>
                                                                                                                {rpPhotos.length > 0 && (
                                                                                                                    <Stack direction="row" spacing={0.75} sx={{ mt: 1, pl: 4.75, overflowX: 'auto', pb: 0.5, '&::-webkit-scrollbar': { height: 4 }, '&::-webkit-scrollbar-thumb': { borderRadius: 2, bgcolor: (t) => alpha(t.palette.common.black, 0.12) } }}>
                                                                                                                        {rpPhotos.map((url, ri) => (
                                                                                                                            <Box key={ri} onClick={() => openSellerRevPhotoLb(rpPhotos, ri)}
                                                                                                                                 sx={{ position: 'relative', width: 68, height: 68, flexShrink: 0, borderRadius: 2, overflow: 'hidden', cursor: 'pointer', border: '1px solid', borderColor: 'divider', '&:hover img': { transform: 'scale(1.05)' }, '&:hover .ll-rv-zoom': { opacity: 1 } }}>
                                                                                                                                <Box component="img" src={url} alt={`Reply photo ${ri + 1}`} referrerPolicy="no-referrer"
                                                                                                                                     sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 250ms ease' }} />
                                                                                                                                <Box className="ll-rv-zoom" sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: (t) => alpha(t.palette.common.black, 0.35), opacity: 0, transition: 'opacity 200ms ease', pointerEvents: 'none' }}>
                                                                                                                                    <ZoomInRoundedIcon sx={{ color: 'common.white', fontSize: 18 }} />
                                                                                                                                </Box>
                                                                                                                            </Box>
                                                                                                                        ))}
                                                                                                                    </Stack>
                                                                                                                )}
                                                                                                            </Box>
                                                                                                        );
                                                                                                    })()}
                                                                                                </Box>
                                                                                            </Stack>
                                                                                        </Box>
                                                                                    );
                                                                                })}
                                                                            </Stack>
                                                                        ) : (
                                                                            <Box sx={{ py: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                                                                <ReviewsRoundedIcon sx={{ fontSize: 44, color: 'primary.main' }} />
                                                                                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'primary.main' }}>
                                                                                    {isMine ? 'No reviews on your seller profile yet' : 'No reviews yet'}
                                                                                </Typography>
                                                                                <Typography color="text.secondary" sx={{ fontSize: '0.82rem', textAlign: 'center', maxWidth: 280 }}>
                                                                                    {isMine
                                                                                        ? 'When buyers share their experience, their reviews will show up here.'
                                                                                        : `Be the first to share your experience with this seller.`}
                                                                                </Typography>
                                                                            </Box>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </Box>
                                                        )}

                                                        {/* ── Sub-tab: Listings ── */}
                                                        {marketplaceSubTab === 'listings' && (
                                                            <>
                                                                {/* Marketplace search + filters */}
                                                                <Box sx={(t) => ({ px: 1.5, pt: 1.25, pb: 0.5, bgcolor: 'background.paper', zIndex: 7 })}>
                                                                    {/* Row 1: Search + Clear + New */}
                                                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.75 }}>
                                                                        <SearchInput
                                                                            placeholder="Search listings…"
                                                                            value={listingsSearchTerm}
                                                                            onChange={(e) => setListingsSearchTerm(e?.target?.value ?? '')}
                                                                            onSearch={() => { setListingsSearch(listingsSearchTerm); scrollRightRailToTop(); }}
                                                                            onClear={() => { setListingsSearchTerm(''); setListingsSearch(''); }}
                                                                            inputProps={{ name: 'll-profile-listings-search' }}
                                                                        />
                                                                        <Tooltip title="Clear all filters" arrow>
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={() => { setListingsSearchTerm(''); setListingsSearch(''); setListingsCategory(''); setListingsSort('newest'); scrollRightRailToTop(); }}
                                                                                sx={(t) => ({
                                                                                    width: 36, height: 36, flexShrink: 0,
                                                                                    borderRadius: 999,
                                                                                    border: '1px solid',
                                                                                    borderColor: alpha(t.palette.text.primary, 0.08),
                                                                                    bgcolor: alpha(t.palette.text.primary, 0.03),
                                                                                    '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.06), borderColor: alpha(t.palette.primary.main, 0.18) },
                                                                                })}
                                                                                aria-label="Clear filters"
                                                                            >
                                                                                <RestartAltRoundedIcon sx={{ fontSize: 18 }} />
                                                                            </IconButton>
                                                                        </Tooltip>

                                                                    </Stack>

                                                                    {/* Row 2: Filter dropdowns */}
                                                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1, pb: 0.75 }}>
                                                                        <FormControl size="small" fullWidth sx={PROFILE_CONTROL_SX}>
                                                                            <InputLabel id="profile-listings-category-label" shrink>Category</InputLabel>
                                                                            <Select
                                                                                labelId="profile-listings-category-label"
                                                                                label="Category"
                                                                                value={listingsCategory}
                                                                                onChange={(e) => { setListingsCategory(String(e.target.value || '')); scrollRightRailToTop(); }}
                                                                                displayEmpty
                                                                                renderValue={(val) => val || 'All Categories'}
                                                                                MenuProps={profileMenuProps}
                                                                            >
                                                                                <MenuItem value="">All Categories</MenuItem>
                                                                                {(() => {
                                                                                    const cats = new Set();
                                                                                    profileListings.forEach((l) => {
                                                                                        const c = String(l?.category || '').trim();
                                                                                        if (c) cats.add(c);
                                                                                    });
                                                                                    return Array.from(cats).sort().map((c) => (
                                                                                        <MenuItem key={c} value={c}>
                                                                                            <ProfileCategoryRow Icon={StorefrontRoundedIcon} label={c} />
                                                                                        </MenuItem>
                                                                                    ));
                                                                                })()}
                                                                            </Select>
                                                                        </FormControl>

                                                                        <FormControl size="small" fullWidth sx={PROFILE_CONTROL_SX}>
                                                                            <InputLabel id="profile-listings-sort-label" shrink>Sort by</InputLabel>
                                                                            <Select
                                                                                labelId="profile-listings-sort-label"
                                                                                label="Sort by"
                                                                                value={listingsSort}
                                                                                onChange={(e) => { setListingsSort(String(e.target.value || 'newest')); scrollRightRailToTop(); }}
                                                                                MenuProps={profileMenuProps}
                                                                            >
                                                                                <MenuItem value="newest">Newest</MenuItem>
                                                                                <MenuItem value="price_low">Price: Low to High</MenuItem>
                                                                                <MenuItem value="price_high">Price: High to Low</MenuItem>
                                                                            </Select>
                                                                        </FormControl>
                                                                    </Box>
                                                                </Box>

                                                                {/* Marketplace list */}
                                                                <Box ref={marketplaceScrollRef} sx={{ flex: 'unset', minHeight: 0, overflowY: 'visible', overscrollBehaviorY: 'auto', p: 1.5 }}>
                                                                    {profileListingsLoading ? (
                                                                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                                                            <CircularProgress size={28} />
                                                                        </Box>
                                                                    ) : filteredProfileListings.length === 0 ? (
                                                                        <Box sx={{ pt: 10, pb: 5, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                                                            <StorefrontRoundedIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                                                                            <Typography sx={{ fontWeight: 800, fontSize: 18, color: 'text.primary' }}>
                                                                                {(listingsSearch || listingsCategory) ? 'No Listings Found' : 'No Marketplace Listings'}
                                                                            </Typography>
                                                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 320 }}>
                                                                                {(listingsSearch || listingsCategory)
                                                                                    ? 'Try adjusting your search or filters.'
                                                                                    : `${isMine ? "You don't" : `${profile?.first_name || 'This user'} doesn't`} have any items for sale.`}
                                                                            </Typography>
                                                                        </Box>
                                                                    ) : (
                                                                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
                                                                            {visibleProfileListings.map((listing) => (
                                                                                <ListingCard
                                                                                    key={listing.id}
                                                                                    listing={listing}
                                                                                    onSelect={() => handleListingClick(listing)}
                                                                                    onFavorite={handleListingFavorite}
                                                                                    onRepost={handleListingRepost}
                                                                                    onContact={handleListingContact}
                                                                                    onFlag={handleListingFlag}
                                                                                    onEdit={(l) => { setEditingListing(l); setCreateListingOpen(true); }}
                                                                                    user={me}
                                                                                />
                                                                            ))}
                                                                            <Box ref={listingsSentinelRef} sx={{ height: 1, gridColumn: '1 / -1' }} />
                                                                        </Box>
                                                                    )}
                                                                </Box>

                                                            </>
                                                        )}

                                                        {/* ── Sub-tab: Reposts ── */}
                                                        {marketplaceSubTab === 'reposts' && (
                                                            <Box sx={{ flex: 'unset', minHeight: 0, overflowY: 'visible', overscrollBehaviorY: 'auto', p: 1.5 }}>
                                                                {marketplaceRepostsLoading ? (
                                                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                                                        <CircularProgress size={28} />
                                                                    </Box>
                                                                ) : marketplaceReposts.length === 0 ? (
                                                                    <Box sx={{ pt: 10, pb: 5, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                                                        <RepeatIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                                                                        <Typography sx={{ fontWeight: 800, fontSize: 18, color: 'text.primary' }}>
                                                                            No Marketplace Reposts
                                                                        </Typography>
                                                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 320 }}>
                                                                            {isMine
                                                                                ? "You haven't reposted any marketplace listings yet."
                                                                                : `${profile?.first_name || 'This user'} hasn't reposted any marketplace listings yet.`}
                                                                        </Typography>
                                                                    </Box>
                                                                ) : (
                                                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
                                                                        {marketplaceReposts.map((listing) => (
                                                                            <ListingCard
                                                                                key={listing.id}
                                                                                listing={listing}
                                                                                onSelect={() => handleListingClick(listing)}
                                                                                onFavorite={handleListingFavorite}
                                                                                onRepost={handleListingRepost}
                                                                                onContact={handleListingContact}
                                                                                onFlag={handleListingFlag}
                                                                                onEdit={(l) => { setEditingListing(l); setCreateListingOpen(true); }}
                                                                                user={me}
                                                                            />
                                                                        ))}
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                        )}
                                                    </>
                                                )}

                                                {/* ── Reviews tab content ── */}
                                                {rightRailView === 'reviews' && (
                                                    <>
                                                        {/* Reviews filter */}
                                                        <Box sx={(t) => ({
                                                            ...getProfileFilterBarSx(t),
                                                            zIndex: 8,
                                                            bgcolor: 'background.paper',
                                                        })}>
                                                            <FormControl size="small" fullWidth sx={PROFILE_CONTROL_SX}>
                                                                <InputLabel id="profile-reviews-type-label" shrink>Type</InputLabel>
                                                                <Select
                                                                    labelId="profile-reviews-type-label"
                                                                    label="Type"
                                                                    value={reviewsType}
                                                                    onChange={(e) => { setReviewsType(String(e.target.value || 'all')); scrollRightRailToTop(); }}
                                                                    MenuProps={profileMenuProps}
                                                                >
                                                                    <MenuItem value="all">All Reviews ({profileReviews.length})</MenuItem>
                                                                    {reviewsCounts.services > 0 && <MenuItem value="services"><BuildRoundedIcon sx={{ fontSize: 16, mr: 0.75, color: 'primary.main' }} />Services ({reviewsCounts.services})</MenuItem>}
                                                                    {reviewsCounts.businesses > 0 && <MenuItem value="businesses"><StorefrontRoundedIcon sx={{ fontSize: 16, mr: 0.75, color: 'primary.main' }} />Businesses ({reviewsCounts.businesses})</MenuItem>}
                                                                    {reviewsCounts.marketplace > 0 && <MenuItem value="marketplace"><SellRoundedIcon sx={{ fontSize: 16, mr: 0.75, color: 'primary.main' }} />Marketplace ({reviewsCounts.marketplace})</MenuItem>}
                                                                </Select>
                                                            </FormControl>
                                                        </Box>

                                                        {/* Reviews list */}
                                                        <Box ref={reviewsScrollRef} sx={{ flex: 'unset', minHeight: 0, overflowY: 'visible', overscrollBehaviorY: 'auto', p: 1.5 }}>
                                                            {profileReviewsLoading ? (
                                                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                                                    <CircularProgress size={28} />
                                                                </Box>
                                                            ) : filteredProfileReviews.length === 0 ? (
                                                                <Box sx={{ pt: 10, pb: 5, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                                                    <RateReviewRoundedIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                                                                    <Typography sx={{ fontWeight: 800, fontSize: 18, color: 'text.primary' }}>
                                                                        {reviewsType !== 'all' ? 'No Reviews in This Category' : 'No Reviews Yet'}
                                                                    </Typography>
                                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 320 }}>
                                                                        {reviewsType !== 'all'
                                                                            ? 'Try selecting a different type.'
                                                                            : `${isMine ? "You haven't" : `${profile?.first_name || 'This user'} hasn't`} left any reviews yet.`}
                                                                    </Typography>
                                                                </Box>
                                                            ) : (
                                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                                                    {visibleProfileReviews.map((review) => {
                                                                        const profileName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'User';
                                                                        const profileHandle = profile?.handle ? `@${profile.handle.replace(/^@/, '')}` : '';
                                                                        const profileAvatarRaw = profile?.profile_picture || profile?.avatar_url || '';
                                                                        const profileAvatarValid = profileAvatarRaw && !profileAvatarRaw.includes('default_avatar') && !profileAvatarRaw.includes('default_business') && !profileAvatarRaw.includes('default_logo');
                                                                        const profileAvatar = profileAvatarValid ? profileAvatarRaw : undefined;

                                                                        const getSourceIcon = () => {
                                                                            if (review.source === 'business') {
                                                                                const et = review.entityType || 'business';
                                                                                if (et === 'nonprofit') return VolunteerActivismRoundedIcon;
                                                                                if (et === 'organization') return AccountBalanceRoundedIcon;
                                                                                return StorefrontRoundedIcon;
                                                                            }
                                                                            if (review.source === 'marketplace') return SellRoundedIcon;
                                                                            if (review.source === 'service') return BuildRoundedIcon;
                                                                            return null;
                                                                        };
                                                                        const SourceIcon = getSourceIcon();

                                                                        const reviewTimeAgo = (() => {
                                                                            if (!review.createdAt) return '';
                                                                            const d = new Date(review.createdAt);
                                                                            if (Number.isNaN(d.getTime())) return '';
                                                                            const diffMs = Date.now() - d;
                                                                            const diffH = Math.floor(diffMs / 3600000);
                                                                            if (diffH < 1) return 'Just now';
                                                                            if (diffH < 24) return `${diffH}h ago`;
                                                                            const diffD = Math.floor(diffH / 24);
                                                                            if (diffD < 30) return `${diffD}d ago`;
                                                                            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                                                        })();

                                                                        return (
                                                                            <Box
                                                                                key={review.id}
                                                                                onClick={() => {
                                                                                    if (!review.entityPath && !review.entityId) return;
                                                                                    // Open the appropriate detail popup instead of navigating away
                                                                                    if (review.source === 'business') {
                                                                                        // Build a minimal business object for BusinessDetailPanel
                                                                                        setSelectedBusinessPopup({
                                                                                            id: review.entityId || review.businessId || review.business_id,
                                                                                            slug: review.entityHandle || review.entitySlug || review.businessSlug || (review.entityPath || '').replace(/^\//, ''),
                                                                                            name: review.entityName,
                                                                                            avatar_url: review.entityAvatar,
                                                                                        });
                                                                                        setSelectedBusinessPopupTab(3); // Reviews tab
                                                                                        setHighlightReviewId(review.id);
                                                                                        setHighlightReviewerId(profile?.id);
                                                                                    } else if (review.source === 'service') {
                                                                                        const svcId = review.entityId || review.serviceId || review.service_id;
                                                                                        if (!svcId) return;
                                                                                        // Fetch full service data so the popup renders correctly
                                                                                        fetchServiceById(svcId).then((data) => {
                                                                                            const svc = data?.listing || data?.service || data;
                                                                                            if (svc?.id) {
                                                                                                setSelectedServicePopup(svc);
                                                                                                setSelectedServicePopupTab(3);
                                                                                                setHighlightReviewId(review.id);
                                                                                                setHighlightReviewerId(profile?.id);
                                                                                            }
                                                                                        }).catch(() => {
                                                                                            // Fallback: open with minimal data
                                                                                            setSelectedServicePopup({
                                                                                                id: svcId,
                                                                                                name: review.entityName,
                                                                                                avatar_url: review.entityAvatar,
                                                                                            });
                                                                                            setSelectedServicePopupTab(3);
                                                                                            setHighlightReviewId(review.id);
                                                                                            setHighlightReviewerId(profile?.id);
                                                                                        });
                                                                                    } else if (review.source === 'marketplace') {
                                                                                        // Open seller reviews popup in-place instead of navigating away
                                                                                        const sellerId = review.entityId || review.sellerId || review.seller_id;
                                                                                        if (sellerId) {
                                                                                            setSellerReviewsPopup({ open: true, sellerId, highlightReviewId: review.id, highlightReviewerId: profile?.id });
                                                                                        }
                                                                                    } else if (review.entityPath) {
                                                                                        // Fallback: navigate for unknown source types
                                                                                        navigate(review.entityPath);
                                                                                    }
                                                                                }}
                                                                                sx={(t) => ({
                                                                                    border: '1px solid',
                                                                                    borderColor: alpha(t.palette.text.primary, 0.10),
                                                                                    borderRadius: 2,
                                                                                    bgcolor: 'background.paper',
                                                                                    overflow: 'hidden',
                                                                                    cursor: (review.entityPath || review.entityId || review.source) ? 'pointer' : 'default',
                                                                                    boxShadow: `0 10px 26px ${alpha(t.palette.text.primary, 0.08)}`,
                                                                                    '&:hover': (review.entityPath || review.entityId || review.source) ? { borderColor: t.palette.primary.main } : {},
                                                                                })}
                                                                            >
                                                                                {/* Entity header with gradient */}
                                                                                <Box
                                                                                    sx={(t) => ({
                                                                                        px: 1.5,
                                                                                        py: 1,
                                                                                        display: 'flex',
                                                                                        alignItems: 'flex-start',
                                                                                        justifyContent: 'space-between',
                                                                                        gap: 1,
                                                                                        background: `linear-gradient(90deg, ${alpha(t.custom?.brand?.brass || '#A87822', 0.14)} 0%, ${alpha(t.palette.background.paper, 0)} 75%)`,
                                                                                        borderBottom: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                                                                                    })}
                                                                                >
                                                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, minWidth: 0 }}>
                                                                                        {review.entityAvatar && !String(review.entityAvatar).startsWith('blob:') ? (
                                                                                            <Avatar src={review.entityAvatar} sx={{ width: 38, height: 38, flexShrink: 0, mt: 0.25 }} />
                                                                                        ) : (
                                                                                            <Avatar sx={(t) => ({ width: 38, height: 38, flexShrink: 0, mt: 0.25, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main })}>
                                                                                                {(() => {
                                                                                                    if (review.source === 'business') {
                                                                                                        const et = review.entityType || 'business';
                                                                                                        if (et === 'nonprofit') return <VolunteerActivismRoundedIcon sx={{ fontSize: 20 }} />;
                                                                                                        if (et === 'organization') return <AccountBalanceRoundedIcon sx={{ fontSize: 20 }} />;
                                                                                                        return <StorefrontRoundedIcon sx={{ fontSize: 20 }} />;
                                                                                                    }
                                                                                                    if (review.source === 'service') return <BuildRoundedIcon sx={{ fontSize: 20 }} />;
                                                                                                    return <PersonRoundedIcon sx={{ fontSize: 20 }} />;
                                                                                                })()}
                                                                                            </Avatar>
                                                                                        )}
                                                                                        <Box sx={{ minWidth: 0 }}>
                                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                                                <Typography sx={{ fontWeight: 900, lineHeight: 1.2 }} noWrap title={review.entityName}>
                                                                                                    {review.entityName}
                                                                                                </Typography>
                                                                                                {review.entityVerified && (
                                                                                                    <VerifiedRoundedIcon sx={{ fontSize: 15, color: 'primary.main', flexShrink: 0 }} />
                                                                                                )}
                                                                                            </Box>
                                                                                            {review.entityHandle && (
                                                                                                <Typography variant="caption" color="text.secondary" noWrap sx={{ lineHeight: 1.3, display: 'block' }}>
                                                                                                    @{String(review.entityHandle).replace(/^@/, '')}
                                                                                                </Typography>
                                                                                            )}
                                                                                            {/* Category chip — matches card styling */}
                                                                                            {(() => {
                                                                                                let chipIcon = null;
                                                                                                let chipLabel = null;
                                                                                                if (review.source === 'business' && review.categoryKey) {
                                                                                                    chipIcon = BUSINESS_CATEGORY_ICONS[review.categoryKey] || CategoryRoundedIcon;
                                                                                                    chipLabel = BUSINESS_CATEGORY_LABELS[review.categoryKey] || review.categoryName || review.categoryKey;
                                                                                                } else if (review.source === 'service' && review.categorySlug) {
                                                                                                    const svcInfo = getServiceCategoryInfo(review.categorySlug);
                                                                                                    chipIcon = svcInfo?.Icon || null;
                                                                                                    chipLabel = svcInfo?.name || review.categoryName || review.categorySlug;
                                                                                                } else if (review.source === 'business' && review.categoryName) {
                                                                                                    chipIcon = StorefrontRoundedIcon;
                                                                                                    chipLabel = review.categoryName;
                                                                                                }
                                                                                                if (review.source === 'marketplace' && review.listingTitle) {
                                                                                                    chipIcon = SellRoundedIcon;
                                                                                                    chipLabel = review.listingTitle;
                                                                                                }
                                                                                                if (!chipLabel) return null;
                                                                                                const ChipIcon = chipIcon;
                                                                                                return (
                                                                                                    <Box sx={(t) => ({
                                                                                                        display: 'inline-flex', alignItems: 'center', gap: 0.4,
                                                                                                        mt: 0.5, px: 0.75, height: 22,
                                                                                                        borderRadius: 999,
                                                                                                        bgcolor: alpha(t.palette.primary.main, 0.08),
                                                                                                        border: '1px solid', borderColor: alpha(t.palette.primary.main, 0.25),
                                                                                                    })}>
                                                                                                        {ChipIcon && <ChipIcon sx={{ fontSize: 13, color: 'primary.main' }} />}
                                                                                                        <Typography sx={{ fontSize: 11, fontWeight: 800, color: 'primary.main', lineHeight: 1 }}>
                                                                                                            {chipLabel}
                                                                                                        </Typography>
                                                                                                    </Box>
                                                                                                );
                                                                                            })()}
                                                                                        </Box>
                                                                                    </Box>
                                                                                </Box>

                                                                                {/* Review content */}
                                                                                <Box sx={{ px: 1.5, py: 1.25 }}>
                                                                                    <Box sx={(t) => ({
                                                                                        border: '1px solid', borderColor: alpha(t.palette.text.primary, 0.08),
                                                                                        borderRadius: 2, px: 1.25, py: 1,
                                                                                        bgcolor: alpha(t.palette.primary.main, 0.02),
                                                                                    })}>
                                                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.75 }}>
                                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                                                                                <Avatar
                                                                                                    src={profileAvatar}
                                                                                                    alt={profileName}
                                                                                                    sx={(t) => ({
                                                                                                        width: 34, height: 34,
                                                                                                        ...(!profileAvatar ? { bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main } : {}),
                                                                                                    })}
                                                                                                >
                                                                                                    {(() => {
                                                                                                        const pat = (profile?.account_type || '').toLowerCase();
                                                                                                        if (pat === 'business') return <StorefrontRoundedIcon sx={{ fontSize: 18 }} />;
                                                                                                        if (pat === 'artist') return <MusicNoteRoundedIcon sx={{ fontSize: 17 }} />;
                                                                                                        return <PersonRoundedIcon sx={{ fontSize: 18 }} />;
                                                                                                    })()}
                                                                                                </Avatar>
                                                                                                <Box sx={{ minWidth: 0 }}>
                                                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                                                        <Typography variant="body2" sx={{ fontWeight: 900, lineHeight: 1.1 }} noWrap>
                                                                                                            {profileName}
                                                                                                        </Typography>
                                                                                                        {Boolean(Number(profile?.is_local_lantern_admin) === 1) && <VerifiedRoundedIcon sx={{ fontSize: 14, color: 'primary.main', flexShrink: 0 }} />}
                                                                                                    </Box>
                                                                                                    <Typography variant="caption" color="text.secondary" noWrap>
                                                                                                        {profileHandle}
                                                                                                    </Typography>
                                                                                                </Box>
                                                                                            </Box>
                                                                                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                                                                                {reviewTimeAgo}
                                                                                            </Typography>
                                                                                        </Box>
                                                                                        <Rating
                                                                                            value={Math.round(review.rating)}
                                                                                            readOnly
                                                                                            size="small"
                                                                                            sx={{ mb: 0.5, '& .MuiRating-icon': { fontSize: 16 } }}
                                                                                        />
                                                                                        {review.title && (
                                                                                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25 }}>
                                                                                                {review.title}
                                                                                            </Typography>
                                                                                        )}
                                                                                        {review.body && (
                                                                                            <Typography variant="body2" sx={{
                                                                                                color: 'text.secondary', lineHeight: 1.45,
                                                                                                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                                                                            }}>
                                                                                                {review.body}
                                                                                            </Typography>
                                                                                        )}
                                                                                        {(() => {
                                                                                            const rPhotos = review.photoUrls || review.photo_urls || [];
                                                                                            if (!rPhotos.length) return null;
                                                                                            return (
                                                                                                <Box sx={{ display: 'flex', gap: 0.75, mt: 1, overflow: 'hidden' }}>
                                                                                                    {rPhotos.slice(0, 3).map((url, i) => (
                                                                                                        <Box key={i} component="img" src={url} alt="" referrerPolicy="no-referrer" sx={{ width: 56, height: 56, borderRadius: 1.5, objectFit: 'cover', flexShrink: 0 }} />
                                                                                                    ))}
                                                                                                </Box>
                                                                                            );
                                                                                        })()}
                                                                                    </Box>
                                                                                </Box>
                                                                            </Box>
                                                                        );
                                                                    })}
                                                                    <Box ref={reviewsSentinelRef} sx={{ height: 1 }} />
                                                                </Box>
                                                            )}
                                                        </Box>

                                                    </>
                                                )}
                                            </Box>{/* end content area */}
                                        </ContentFadeIn>
                                    </Card>

                                </Box>
                            ) : null}
                        </Stack>
                    </Box>
                </Box>

                {/* ============ MOBILE ACTIVITY DIALOG (using shared MobileActivityShell) ============ */}
                {isMobile && mobileActivityOpen && canViewPosts && !showBlockedProfileNotice && (
                    <MobileActivityShell
                        open={true}
                        onClose={() => { setMobileActivityOpen(false); setMobileProfileTab(0); }}
                        name={profile?.first_name ? `${profile.first_name}${profile.last_name ? ` ${profile.last_name}` : ''}` : (profile?.handle || '')}
                        handle={profile?.handle}
                        avatarSrc={profile?.avatar_url || profile?.profile_picture}
                        accountType="personal"
                        detailContent={
                            previewPost ? (() => {
                                    const postKind = detectPostKind(previewPost);
                                    return (
                                        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                                            {postKind === 'artist' && (
                                                <MusicPostDetailPanel post={previewPost} user={me} onLocationClick={() => {}} scrollToCommentId={previewScrollToCommentId} highlightCommentId={previewHighlightCommentId} />
                                            )}
                                            {postKind === 'business' && (
                                                <BusinessPostDetailModal embedded post={previewPost} user={me} onViewPage={() => {}} onShare={() => {}} onLocationClick={() => {}} scrollToCommentId={previewScrollToCommentId} highlightCommentId={previewHighlightCommentId} />
                                            )}
                                            {postKind === 'user' && (
                                                <PostPage embedded post={previewPost} user={me} hideCategoryChip={false} onLocationClick={() => {}} scrollToCommentId={previewScrollToCommentId} highlightCommentId={previewHighlightCommentId} />
                                            )}
                                        </Box>
                                    );
                                })()
                                : selectedEventPopup ? (
                                        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
                                            <EventDetailPanel
                                                event={selectedEventPopup}
                                                user={me}
                                                onRequireAuth={() => {}}
                                                onEventUpdate={(updated) => {
                                                    setSelectedEventPopup((prev) => prev ? { ...prev, ...updated } : prev);
                                                    if (isMine) setEventsRefreshNonce((n) => n + 1);
                                                }}
                                                scrollToCommentId={eventScrollToCommentId}
                                                highlightCommentId={eventHighlightCommentId}
                                            />
                                        </Box>
                                    )
                                    : selectedJobPopup ? (
                                            <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
                                                <JobDetailPanel
                                                    job={selectedJobPopup}
                                                    jobId={selectedJobPopup?.id}
                                                    user={me}
                                                    loggedInUser={me}
                                                    activeAccount={activeAccount}
                                                    onClose={() => setSelectedJobPopup(null)}
                                                    onDeleted={() => { setSelectedJobPopup(null); setJobsRefreshNonce((n) => n + 1); showSuccess('Job deleted successfully'); }}
                                                    onEdit={(job) => { setSelectedJobPopup(null); handleEditJob(job); }}
                                                    onRenew={(job) => { handleRenew(job); }}
                                                    onApply={(job) => setApplyJobTarget(job)}
                                                />
                                            </Box>
                                        )
                                        : selectedServicePopup ? (
                                                <ServicePopupDialog
                                                    service={selectedServicePopup}
                                                    open={true}
                                                    onClose={() => { setSelectedServicePopup(null); setSelectedServicePopupTab(0); setHighlightReviewId(null); setHighlightReviewerId(null); }}
                                                    user={me}
                                                    embedded
                                                    initialTab={selectedServicePopupTab}
                                                    highlightReviewId={highlightReviewId}
                                                    highlightReviewerId={highlightReviewerId}
                                                    onMessage={handleServiceMessage}
                                                    onFavoriteChange={(svc, { favorited, favoritesCount }) => {
                                                        const svcId = String(svc?.id);
                                                        setProfileServices((prev) =>
                                                            prev.map((s) => String(s.id) !== svcId ? s : { ...s, isFavorited: favorited, is_favorited: favorited, favoritesCount, favorites_count: favoritesCount })
                                                        );
                                                    }}
                                                />
                                            )
                                            : selectedListingId ? (
                                                    <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
                                                        <MarketplaceListingDetailPanel
                                                            listingId={selectedListingId}
                                                            user={me}
                                                            onClearSelection={handleListingDetailClose}
                                                            onMessage={(listing) => {
                                                                const uid = listing?.userId || listing?.user_id;
                                                                if (uid) window.dispatchEvent(new CustomEvent('open-message-center', { detail: { userId: Number(uid) } }));
                                                            }}
                                                            onEdit={(listing) => { setEditingListing(listing); setCreateListingOpen(true); }}
                                                            initialTab={highlightReviewId ? 1 : undefined}
                                                            highlightReviewId={highlightReviewId}
                                                            highlightReviewerId={highlightReviewerId}
                                                        />
                                                    </Box>
                                                )
                                                : selectedRequestPopup ? (
                                                        <ServiceRequestDetailPopup
                                                            request={selectedRequestPopup}
                                                            open={true}
                                                            onClose={() => { setSelectedRequestPopup(null); setRequestPopupResponses([]); setRequestPopupResponsesLoading(false); setRequestPopupIsRequester(false); setRequestPopupMyResponse(null); }}
                                                            user={me}
                                                            responses={requestPopupResponses}
                                                            responsesLoading={requestPopupResponsesLoading}
                                                            isRequester={requestPopupIsRequester}
                                                            myResponse={requestPopupMyResponse}
                                                            setResponses={setRequestPopupResponses}
                                                            setIsRequester={setRequestPopupIsRequester}
                                                            setMyResponse={setRequestPopupMyResponse}
                                                            setResponsesLoading={setRequestPopupResponsesLoading}
                                                            onDeleted={() => { setSelectedRequestPopup(null); setServicesRefreshNonce((n) => n + 1); showSuccess('Service request deleted'); }}
                                                            onEdit={(req) => { setEditingRequestItem(req); setEditRequestModalOpen(true); }}
                                                            isDesktopLayout={false}
                                                            navigate={navigate}
                                                            activeAccount={activeAccount}
                                                        />
                                                    )
                                                    : sellerReviewsPopup.open ? (
                                                            <EmbeddedSellerReviews
                                                                sellerId={sellerReviewsPopup.sellerId}
                                                                highlightReviewId={sellerReviewsPopup.highlightReviewId}
                                                                highlightReviewerId={sellerReviewsPopup.highlightReviewerId}
                                                                profileUser={profile}
                                                            />
                                                        )
                                                        : null
                        }
                        detailTitle={previewPost ? 'Post' : selectedEventPopup ? 'Event' : selectedJobPopup ? 'Job' : selectedServicePopup ? 'Service' : selectedListingId ? 'Listing' : selectedRequestPopup ? 'Request' : sellerReviewsPopup.open ? 'Seller Reviews' : ''}
                        onDetailClose={() => {
                            if (previewPost) { setPreviewPost(null); setPreviewScrollToCommentId(null); setPreviewHighlightCommentId(null); }
                            else if (selectedEventPopup) { setSelectedEventPopup(null); setEventScrollToCommentId(null); setEventHighlightCommentId(null); }
                            else if (selectedJobPopup) { setSelectedJobPopup(null); }
                            else if (selectedServicePopup) { setSelectedServicePopup(null); setSelectedServicePopupTab(0); setHighlightReviewId(null); setHighlightReviewerId(null); }
                            else if (selectedListingId) { handleListingDetailClose(); }
                            else if (selectedRequestPopup) { setSelectedRequestPopup(null); setRequestPopupResponses([]); setRequestPopupResponsesLoading(false); setRequestPopupIsRequester(false); setRequestPopupMyResponse(null); }
                            else if (sellerReviewsPopup.open) { setSellerReviewsPopup({ open: false, sellerId: null, highlightReviewId: null, highlightReviewerId: null }); }
                        }}
                        createMenuItems={null}
                        stickyHeader={
                            <>
                                {/* ── Pill tabs (circular, icon above label) ── */}
                                <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                                    <Stack direction="row" spacing={0} alignItems="stretch" justifyContent="center" sx={{ px: 0.5, py: 0.5 }}>
                                        {[
                                            { key: 'community', label: 'Posts', icon: <ForumIcon />, show: true },
                                            { key: 'events', label: 'Events', icon: <EventRoundedIcon />, show: profileHasEvents },
                                            { key: 'jobs', label: 'Jobs', icon: <WorkRoundedIcon />, show: profileHasJobs },
                                            { key: 'services', label: 'Services', icon: <BuildRoundedIcon />, show: profileHasServices || profileHasServiceRequests },
                                            { key: 'marketplace', label: 'Market', icon: <StorefrontRoundedIcon />, show: profileHasListings },
                                            { key: 'reviews', label: 'Reviews', icon: <RateReviewRoundedIcon />, show: profileHasReviews },
                                        ].filter((t) => t.show).map((tab) => {
                                            const isActive = rightRailView === tab.key;
                                            return (
                                                <Box
                                                    key={tab.key}
                                                    onClick={() => { setRightRailView(tab.key); setMobileActivitySearchVisible(false); setMobileActivityFilterOpen(false); }}
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

                                {/* Posts mode — icon-only sub-tabs */}
                                {rightRailView === 'community' && (
                                    <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                                        <Stack direction="row" spacing={0} alignItems="center" justifyContent="center" sx={{ px: 1 }}>
                                            {(() => {
                                                const postCount = Array.isArray(feedPosts) ? feedPosts.length : 0;
                                                const commentCount = Array.isArray(engagementComments) ? engagementComments.length : 0;
                                                const likeCount = Array.isArray(engagementLikes) ? engagementLikes.length : 0;
                                                const repostCount = Array.isArray(engagementReposts) ? engagementReposts.length : 0;
                                                return [
                                                    { count: postCount, icon: <ForumIcon />, idx: 0 },
                                                    { count: commentCount, icon: <ChatBubbleOutlineIcon />, idx: 1 },
                                                    { count: likeCount, icon: <FavoriteIcon />, idx: 2 },
                                                    { count: repostCount, icon: <RepeatIcon />, idx: 3 },
                                                ].map((sub) => {
                                                    const isActive = (mobileActivitySubTab ?? 0) === sub.idx;
                                                    return (
                                                        <Box key={sub.idx} onClick={() => setMobileActivitySubTab(sub.idx)}
                                                             sx={(t) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.4, flex: 1, py: 1, cursor: 'pointer', borderBottom: '2px solid', borderColor: isActive ? t.palette.secondary.main : 'transparent', color: isActive ? 'secondary.main' : 'text.disabled', transition: 'color 150ms ease, border-color 150ms ease', '&:hover': { color: isActive ? 'secondary.main' : 'text.secondary' } })}
                                                        >
                                                            {React.cloneElement(sub.icon, { sx: { fontSize: 18 } })}
                                                            {sub.count > 0 && <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, lineHeight: 1 }}>{sub.count}</Typography>}
                                                        </Box>
                                                    );
                                                });
                                            })()}
                                            <Box onClick={() => setMobileActivitySearchVisible((v) => !v)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1, py: 1, cursor: 'pointer', color: mobileActivitySearchVisible ? 'primary.main' : 'text.disabled', '&:hover': { color: 'text.secondary' } }}>
                                                <SearchRoundedIcon sx={{ fontSize: 18 }} />
                                            </Box>
                                            <Box onClick={() => setMobileActivityFilterOpen((v) => !v)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1, py: 1, cursor: 'pointer', color: mobileActivityFilterOpen ? 'primary.main' : 'text.disabled', '&:hover': { color: 'text.secondary' } }}>
                                                <TuneRoundedIcon sx={{ fontSize: 18 }} />
                                            </Box>
                                        </Stack>
                                    </Box>
                                )}

                                {/* Posts — collapsible search bar */}
                                <Collapse in={mobileActivitySearchVisible && rightRailView === 'community'}>
                                    <Box sx={{ px: 1.5, py: 1, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <SearchInput placeholder="Search posts…" value={communitySearchTerm} onChange={(e) => setCommunitySearchTerm(e?.target?.value ?? '')} onSearch={() => setCommunitySearch(communitySearchTerm)} onClear={() => { setCommunitySearchTerm(''); setCommunitySearch(''); }} inputProps={{ name: 'll-profile-mobile-community-search' }} autoFocus />

                                        </Stack>
                                    </Box>
                                </Collapse>

                                {/* Posts — inline filter dropdowns */}
                                <Collapse in={mobileActivityFilterOpen && rightRailView === 'community'}>
                                    <Box sx={{ px: 1.5, py: 1.5, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
                                            <TextField size="small" label="From" type="date" value="" onChange={() => {}} InputLabelProps={{ shrink: true }} fullWidth sx={{ '& .MuiInputBase-input': { fontSize: 13 } }} />
                                            <TextField size="small" label="To" type="date" value="" onChange={() => {}} InputLabelProps={{ shrink: true }} fullWidth sx={{ '& .MuiInputBase-input': { fontSize: 13 } }} />
                                        </Box>
                                        <Button size="small" onClick={() => { setCommunitySearchTerm(''); setCommunitySearch(''); clearCommunityFiltersRef.current?.(); setMobileActivityFilterOpen(false); }} startIcon={<ClearRoundedIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: 'none', fontWeight: 700, fontSize: 12, color: 'text.secondary' }}>
                                            Clear filters
                                        </Button>
                                    </Box>
                                </Collapse>

                                {/* Events mode — icon-only sub-tabs */}
                                {rightRailView === 'events' && (
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
                                            <Box onClick={() => setMobileActivitySearchVisible((v) => !v)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1, py: 1, cursor: 'pointer', color: mobileActivitySearchVisible ? 'primary.main' : 'text.disabled', '&:hover': { color: 'text.secondary' } }}>
                                                <SearchRoundedIcon sx={{ fontSize: 18 }} />
                                            </Box>
                                            <Box onClick={() => setMobileActivityFilterOpen((v) => !v)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1, py: 1, cursor: 'pointer', color: mobileActivityFilterOpen ? 'primary.main' : 'text.disabled', '&:hover': { color: 'text.secondary' } }}>
                                                <TuneRoundedIcon sx={{ fontSize: 18 }} />
                                            </Box>
                                        </Stack>
                                    </Box>
                                )}

                                {/* Events — collapsible search */}
                                <Collapse in={mobileActivitySearchVisible && rightRailView === 'events'}>
                                    <Box sx={{ px: 1.5, py: 1, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                                        <SearchInput placeholder={eventSubTab === 0 ? 'Search events…' : eventSubTab === 1 ? 'Search comments…' : eventSubTab === 2 ? 'Search likes…' : 'Search reposts…'} value={eventsSearchTerm} onChange={(e) => setEventsSearchTerm(e?.target?.value ?? '')} onSearch={() => setEventsSearch(eventsSearchTerm.trim())} onClear={() => { setEventsSearchTerm(''); setEventsSearch(''); }} inputProps={{ name: 'll-profile-mobile-events-search' }} autoFocus />
                                    </Box>
                                </Collapse>

                                {/* Events — inline filter dropdowns */}
                                <Collapse in={mobileActivityFilterOpen && rightRailView === 'events'}>
                                    <Box sx={{ px: 1.5, py: 1.5, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: eventSubTab === 0 ? '1fr 1fr 1fr' : '1fr 1fr', gap: 1, mb: 1 }}>
                                            {eventSubTab === 0 && (
                                                <FormControl size="small" fullWidth>
                                                    <InputLabel shrink>View</InputLabel>
                                                    <Select label="View" value={eventsView} onChange={(e) => { setEventsView(e.target.value); setEventsDateFrom(''); setEventsDateTo(''); }}>
                                                        <MenuItem value="all">All Events</MenuItem>
                                                        <MenuItem value="going">Going</MenuItem>
                                                        <MenuItem value="interested">Interested</MenuItem>
                                                        <MenuItem value="hosted">Hosted</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            )}
                                            <TextField size="small" label="From" type="date" value={eventsDateFrom} onChange={(e) => setEventsDateFrom(e.target.value || '')} InputLabelProps={{ shrink: true }} fullWidth sx={{ '& .MuiInputBase-input': { fontSize: 13 } }} />
                                            <TextField size="small" label="To" type="date" value={eventsDateTo} onChange={(e) => setEventsDateTo(e.target.value || '')} InputLabelProps={{ shrink: true }} fullWidth sx={{ '& .MuiInputBase-input': { fontSize: 13 } }} />
                                        </Box>
                                        {(eventsView !== 'all' || eventsDateFrom || eventsDateTo) && (
                                            <Button size="small" onClick={() => { setEventsView('all'); setEventsDateFrom(''); setEventsDateTo(''); }} startIcon={<ClearRoundedIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: 'none', fontWeight: 700, fontSize: 12, color: 'text.secondary' }}>Clear filters</Button>
                                        )}
                                    </Box>
                                </Collapse>

                                {/* Services / Jobs / Marketplace — search + filter icon bar */}
                                {(rightRailView === 'jobs' || rightRailView === 'marketplace') && (
                                    <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                                        <Stack direction="row" spacing={0} alignItems="center" justifyContent="flex-end" sx={{ px: 1 }}>
                                            <Box onClick={() => setMobileActivitySearchVisible((v) => !v)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1, py: 1, cursor: 'pointer', color: mobileActivitySearchVisible ? 'primary.main' : 'text.disabled', '&:hover': { color: 'text.secondary' } }}>
                                                <SearchRoundedIcon sx={{ fontSize: 18 }} />
                                            </Box>
                                            <Box onClick={() => setMobileActivityFilterOpen((v) => !v)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1, py: 1, cursor: 'pointer', color: mobileActivityFilterOpen ? 'primary.main' : 'text.disabled', '&:hover': { color: 'text.secondary' } }}>
                                                <TuneRoundedIcon sx={{ fontSize: 18 }} />
                                            </Box>
                                        </Stack>
                                    </Box>
                                )}

                                <Collapse in={mobileActivitySearchVisible && rightRailView === 'jobs'}>
                                    <Box sx={{ px: 1.5, py: 1, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                                        <SearchInput placeholder="Search jobs…" value={jobsSearchTerm} onChange={(e) => setJobsSearchTerm(e?.target?.value ?? '')} onSearch={() => setJobsSearch(jobsSearchTerm)} onClear={() => { setJobsSearchTerm(''); setJobsSearch(''); }} inputProps={{ name: 'll-profile-mobile-jobs-search' }} autoFocus />
                                    </Box>
                                </Collapse>
                                <Collapse in={mobileActivitySearchVisible && rightRailView === 'marketplace'}>
                                    <Box sx={{ px: 1.5, py: 1, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                                        <SearchInput placeholder="Search marketplace…" value={listingsSearchTerm || ''} onChange={(e) => setListingsSearchTerm(e?.target?.value ?? '')} onSearch={() => setListingsSearch(listingsSearchTerm)} onClear={() => { setListingsSearchTerm(''); setListingsSearch(''); }} inputProps={{ name: 'll-profile-mobile-marketplace-search' }} autoFocus />
                                    </Box>
                                </Collapse>

                                {/* Jobs — inline filter dropdowns */}
                                <Collapse in={mobileActivityFilterOpen && rightRailView === 'jobs'}>
                                    <Box sx={{ px: 1.5, py: 1.5, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
                                            <FormControl size="small" fullWidth>
                                                <InputLabel shrink>Sort by</InputLabel>
                                                <Select label="Sort by" value={jobsSort} onChange={(e) => setJobsSort(String(e.target.value || 'newest'))}>
                                                    <MenuItem value="newest">Newest</MenuItem>
                                                    <MenuItem value="oldest">Oldest</MenuItem>
                                                </Select>
                                            </FormControl>
                                            <FormControl size="small" fullWidth>
                                                <InputLabel shrink>Category</InputLabel>
                                                <Select label="Category" value={jobsCategory} onChange={(e) => setJobsCategory(String(e.target.value || ''))} displayEmpty renderValue={(val) => val ? (jobCategoryLabel(val) || val) : 'All Categories'}>
                                                    <MenuItem value="">All Categories</MenuItem>
                                                    {(() => {
                                                        const cats = new Set();
                                                        profileJobs.forEach((j) => { const c = String(j?.category || '').trim().toLowerCase(); if (c) cats.add(c); });
                                                        return Array.from(cats).sort().map((c) => (<MenuItem key={c} value={c}>{jobCategoryLabel(c) || c}</MenuItem>));
                                                    })()}
                                                </Select>
                                            </FormControl>
                                        </Box>
                                        {(jobsCategory || jobsSort !== 'newest' || jobsSearch) && (
                                            <Button size="small" onClick={() => { setJobsSearchTerm(''); setJobsSearch(''); setJobsCategory(''); setJobsSort('newest'); setMobileActivityFilterOpen(false); }} startIcon={<ClearRoundedIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: 'none', fontWeight: 700, fontSize: 12, color: 'text.secondary' }}>Clear filters</Button>
                                        )}
                                    </Box>
                                </Collapse>



                                {/* Marketplace — inline filter dropdowns */}
                                <Collapse in={mobileActivityFilterOpen && rightRailView === 'marketplace'}>
                                    <Box sx={{ px: 1.5, py: 1.5, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
                                            <FormControl size="small" fullWidth>
                                                <InputLabel shrink>View</InputLabel>
                                                <Select label="View" value={marketplaceSubTab} onChange={(e) => setMarketplaceSubTab(e.target.value)}>
                                                    <MenuItem value="listings">Listings{profileListings.length > 0 ? ` (${profileListings.length})` : ''}</MenuItem>
                                                    <MenuItem value="reposts">Reposts{marketplaceRepostsTotal > 0 ? ` (${marketplaceRepostsTotal})` : ''}</MenuItem>
                                                    <MenuItem value="seller_info">Seller Info</MenuItem>
                                                </Select>
                                            </FormControl>
                                            {marketplaceSubTab === 'listings' && (
                                                <FormControl size="small" fullWidth>
                                                    <InputLabel shrink>Sort</InputLabel>
                                                    <Select label="Sort" value={listingsSort} onChange={(e) => setListingsSort(String(e.target.value || 'newest'))}>
                                                        <MenuItem value="newest">Newest</MenuItem>
                                                        <MenuItem value="oldest">Oldest</MenuItem>
                                                        <MenuItem value="price_low">Price: Low → High</MenuItem>
                                                        <MenuItem value="price_high">Price: High → Low</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            )}
                                        </Box>
                                        {(listingsCategory || listingsSort !== 'newest' || listingsSearch) && marketplaceSubTab === 'listings' && (
                                            <Button size="small" onClick={() => { setListingsSearchTerm(''); setListingsSearch(''); setListingsCategory(''); setListingsSort('newest'); setMobileActivityFilterOpen(false); }} startIcon={<ClearRoundedIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: 'none', fontWeight: 700, fontSize: 12, color: 'text.secondary' }}>Clear filters</Button>
                                        )}
                                    </Box>
                                </Collapse>

                                {/* Reviews — search + filter icon bar */}
                                {rightRailView === 'reviews' && (
                                    <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                                        <Stack direction="row" spacing={0} alignItems="center" justifyContent="flex-end" sx={{ px: 1 }}>
                                            <Box onClick={() => setMobileActivityFilterOpen((v) => !v)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1, py: 1, cursor: 'pointer', color: mobileActivityFilterOpen ? 'primary.main' : 'text.disabled', '&:hover': { color: 'text.secondary' } }}>
                                                <TuneRoundedIcon sx={{ fontSize: 18 }} />
                                            </Box>
                                        </Stack>
                                    </Box>
                                )}
                                <Collapse in={mobileActivityFilterOpen && rightRailView === 'reviews'}>
                                    <Box sx={{ px: 1.5, py: 1.5, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                                        <FormControl size="small" fullWidth>
                                            <InputLabel shrink>Type</InputLabel>
                                            <Select label="Type" value={reviewsType} onChange={(e) => setReviewsType(String(e.target.value || 'all'))}>
                                                <MenuItem value="all">All Reviews ({profileReviews.length})</MenuItem>
                                                {reviewsCounts.services > 0 && <MenuItem value="services">Services ({reviewsCounts.services})</MenuItem>}
                                                {reviewsCounts.businesses > 0 && <MenuItem value="businesses">Businesses ({reviewsCounts.businesses})</MenuItem>}
                                                {reviewsCounts.marketplace > 0 && <MenuItem value="marketplace">Marketplace ({reviewsCounts.marketplace})</MenuItem>}
                                            </Select>
                                        </FormControl>
                                        {reviewsType !== 'all' && (
                                            <Button size="small" onClick={() => { setReviewsType('all'); setMobileActivityFilterOpen(false); }} startIcon={<ClearRoundedIcon sx={{ fontSize: 14 }} />} sx={{ mt: 1, textTransform: 'none', fontWeight: 700, fontSize: 12, color: 'text.secondary' }}>Clear filters</Button>
                                        )}
                                    </Box>
                                </Collapse>
                            </>
                        }
                    >

                        {/* ── Content area ── */}
                        <ContentFadeIn triggerKey={`mobile-${rightRailView}-${postsRefreshNonce}-${eventsRefreshNonce}-${jobsRefreshNonce}-${servicesRefreshNonce}-${listingsRefreshNonce}`}>
                            <Box>
                                {/* Posts content — PET with hidden internal tabs/search (our icon tabs control it) */}
                                {rightRailView === 'community' && (
                                    <>
                                        <Box
                                            onClickCapture={handleProfileLocationCapture}
                                            onKeyDownCapture={handleProfileLocationCapture}
                                            sx={{
                                                minHeight: 280,
                                                '& > :first-child': { boxShadow: 'none !important', border: 'none !important', borderRadius: '0 !important', overflow: 'visible !important', minHeight: 'auto !important', height: 'auto !important', maxHeight: 'none !important' },
                                                // Hide PET header
                                                '& > :first-child > :first-child > :first-child': { display: 'none !important' },
                                                // Hide PET sub-tabs (we use our icon tabs)
                                                '& > :first-child > :first-child > :nth-child(2)': { display: 'none !important' },
                                                // Hide PET search bar slot
                                                '& > :first-child > :first-child > :nth-child(3)': { display: 'none !important' },
                                                '& > :first-child > :first-child': { zIndex: '8 !important', bgcolor: 'background.paper' },
                                                '& .profile-posts-scroller': { overflowY: 'visible !important', overscrollBehaviorY: 'auto !important' },
                                                '& > :first-child > :nth-child(2)': { overflow: 'visible !important' },
                                                '& .MuiCard-root, & .MuiPaper-root': { boxShadow: 'none !important', border: 'none !important', borderRadius: '0 !important', backgroundImage: 'none !important', backgroundColor: 'transparent !important', overflow: 'visible !important' },
                                            }}
                                        >
                                            <ProfileEngagementTabs
                                                me={me} isScrollBox={false} scrollBoxHeight={0} disableInitialAutoScroll={true} pageScrollOffset={0}
                                                profile={profile} posts={feedPosts} searchQuery={communitySearch} clearFiltersRef={clearCommunityFiltersRef}
                                                initialTab={mobileActivitySubTab} searchBarSlot={null}
                                                isMine={isMine} isFollowing={isFollowing}
                                                privacy={{ posts: privacy?.posts || 'public', likes: privacy?.likes || 'public', reposts: privacy?.reposts || 'public', comments: privacy?.comments || 'public' }}
                                                canViewSection={canViewSection}
                                                onOpenPost={(post) => { if (!post || !post.id) return; setPreviewScrollToCommentId(null); setPreviewHighlightCommentId(null); setPreviewPost(post); }}
                                                onOpenComment={(commentItem) => { const c = commentItem || {}; const post0 = c.post || {}; if (!post0?.id) return; const pType = String(c?.postType || post0?.postType || '').toLowerCase(); const enrichedPost = pType ? { ...post0, postType: pType } : post0; const viewOnly = Boolean(c._viewPostOnly); const commentId = viewOnly ? null : (Number(c?.comment_id || c?.id || 0) || null); setPreviewScrollToCommentId(commentId); setPreviewHighlightCommentId(commentId); setPreviewPost(enrichedPost); }}
                                                onFilterChange={() => {}} onScrollToTop={() => {}}
                                                onExpandPosts={(payload) => { setMobileActivityOpen(false); const url = new URL(window.location.href); url.searchParams.set('view', 'posts'); window.history.pushState({ view: 'posts' }, '', url); const detailObj = payload && typeof payload === 'object' ? payload : {}; const idxRaw = typeof payload === 'number' ? payload : (detailObj.tabIndex ?? detailObj.tab ?? 0); const idx = Number.isFinite(Number(idxRaw)) ? Number(idxRaw) : 0; setExpandedTab(idx); setExpandedCategory(String(detailObj.category ?? detailObj.subtype ?? '')); setExpandedSort(String(detailObj.sort ?? detailObj.sortBy ?? 'newest')); setPostsExpanded(true); window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); }}
                                            />
                                        </Box>
                                    </>
                                )}

                                {/* Events content */}
                                {rightRailView === 'events' && (
                                    <Box sx={{ minHeight: 280, px: 0, pt: 1.5 }}>
                                        <ContentFadeIn triggerKey={`mobile-events-${eventSubTab}`}>
                                            {eventSubTab === 1 ? (
                                                /* ── Comments sub-tab (matching desktop format) ── */
                                                eventCommentsLoading ? (
                                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
                                                ) : eventEngagementComments.length === 0 ? (
                                                    <Box sx={{ textAlign: 'center', py: 6 }}>
                                                        <ChatBubbleOutlineIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {`${isMine ? "You don't" : "This user doesn't"} have any comments on events yet.`}
                                                        </Typography>
                                                    </Box>
                                                ) : (
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, px: 1.5 }}>
                                                        {eventEngagementComments.map((group) => {
                                                            const ev0 = group.event || {};
                                                            const comments = Array.isArray(group.comments) ? group.comments : [];
                                                            const total = comments.length;
                                                            const latest = comments[0] || null;
                                                            const eventPhoto = String(ev0?.mainPhotoUrl || ev0?.image_url || ev0?.photoUrl || '').trim();
                                                            const ecTruncate = (t, n) => { const s0 = String(t || '').trim(); if (!s0) return ''; return s0.length > n ? `${s0.slice(0, n)}…` : s0; };
                                                            const avatarSrc = profile?.avatar_url || profile?.profile_picture || '';
                                                            const ownerName = `${String(profile?.first_name || '').trim()} ${String(profile?.last_name || '').trim()}`.trim() || 'User';
                                                            const ownerHandle = profile?.handle ? `@${String(profile.handle).trim().replace(/^@+/, '')}` : '';

                                                            return (
                                                                <Box
                                                                    key={`ec-m-${ev0.id}`}
                                                                    role="button"
                                                                    tabIndex={0}
                                                                    onClick={() => { if (latest) openEventComment({ ...latest, _viewEventOnly: true }, ev0); }}
                                                                    onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && latest) { e.preventDefault(); openEventComment({ ...latest, _viewEventOnly: true }, ev0); } }}
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
                                                                    {/* Event header with gradient */}
                                                                    <Box sx={(t) => ({
                                                                        px: 1.5, py: 1,
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
                                                                        background: `linear-gradient(90deg, ${alpha(t.custom?.brand?.brass || '#A87822', 0.14)} 0%, ${alpha(t.palette.background.paper, 0)} 75%)`,
                                                                        borderBottom: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                                                                    })}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                                                                            {eventPhoto ? (
                                                                                <Avatar src={eventPhoto} alt={String(ev0?.title || '')} sx={{ width: 38, height: 38, flexShrink: 0 }} imgProps={{ referrerPolicy: 'no-referrer' }} />
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
                                                                                    {formatEventDate(ev0) || (latest?.created_at ? eventTimeAgo(latest.created_at) : '')}
                                                                                </Typography>
                                                                            </Box>
                                                                        </Box>
                                                                        <Box sx={(t) => ({
                                                                            display: 'inline-flex', alignItems: 'center', gap: 0.5,
                                                                            px: 1.1, py: 0.4, borderRadius: 999,
                                                                            border: `1px solid ${alpha(t.palette.primary.main, 0.16)}`,
                                                                            bgcolor: alpha(t.palette.primary.main, 0.06),
                                                                        })}>
                                                                            <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main' }}>
                                                                                {total === 1 ? '1 comment' : `${total} comments`}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Box>

                                                                    {/* Individual comment rows */}
                                                                    <Box sx={{ px: 1.5, py: 1.25, display: 'grid', gap: 1 }}>
                                                                        {comments.slice(0, 3).map((c) => {
                                                                            const cText = String(c?.content || c?.body || '').trim();
                                                                            const isReply = !!c?.parent_id;
                                                                            const cTime = c?.created_at || null;
                                                                            return (
                                                                                <Box
                                                                                    key={`ec-cm-${c?.id || c?.comment_id || ''}`}
                                                                                    onClick={(e) => { e.stopPropagation(); openEventComment(c, ev0); }}
                                                                                    sx={(t) => ({
                                                                                        border: '1px solid',
                                                                                        borderColor: alpha(t.palette.text.primary, 0.08),
                                                                                        borderRadius: 2,
                                                                                        px: 1.25, py: 1,
                                                                                        bgcolor: alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.06 : 0.02),
                                                                                        '&:hover': { borderColor: alpha(t.palette.primary.main, 0.32) },
                                                                                    })}
                                                                                >
                                                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                                                                            <Avatar
                                                                                                src={avatarSrc || defaultAvatar}
                                                                                                alt={ownerName}
                                                                                                sx={{ width: 34, height: 34 }}
                                                                                                imgProps={{ referrerPolicy: 'no-referrer' }}
                                                                                            />
                                                                                            <Box sx={{ minWidth: 0 }}>
                                                                                                <Typography variant="body2" sx={{ fontWeight: 900, lineHeight: 1.1 }} noWrap>
                                                                                                    {ownerName}
                                                                                                </Typography>
                                                                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                                                                    {ownerHandle}{isReply ? ' • Reply' : ''}
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
                                                                                    {(() => {
                                                                                        const cImg = c?.image || (Array.isArray(c?.images) && c.images.length > 0 ? c.images[0] : null);
                                                                                        if (!cImg) return null;
                                                                                        return (
                                                                                            <Box component="img" src={cImg} alt="comment image"
                                                                                                 onClick={(e) => { e.stopPropagation(); openEventComment(c, ev0); }}
                                                                                                 sx={{ mt: 0.75, width: 56, height: 56, objectFit: 'cover', borderRadius: 1.5, border: '1px solid', borderColor: (t) => alpha(t.palette.text.primary, 0.10), display: 'block', flexShrink: 0, cursor: 'pointer', transition: 'opacity 150ms ease', '&:hover': { opacity: 0.85 } }}
                                                                                            />
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
                                            ) : (
                                                /* ── Events / Likes / Reposts sub-tabs (0, 2, 3) ── */
                                                profileEventsLoading ? (
                                                    <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress size={28} /></Box>
                                                ) : filteredProfileEvents.length > 0 ? (
                                                    <Stack spacing={1.5} sx={{ px: 1.5 }}>
                                                        {filteredProfileEvents.map((ev) => (
                                                            <EventCard key={ev.id} event={ev} onClick={() => setSelectedEventPopup(ev)} compact />
                                                        ))}
                                                    </Stack>
                                                ) : (
                                                    <Box sx={{ textAlign: 'center', py: 6 }}>
                                                        {eventSubTab === 2
                                                            ? <FavoriteIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                                            : eventSubTab === 3
                                                                ? <RepeatIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                                                : <EventRoundedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />}
                                                        <Typography variant="body2" color="text.secondary">
                                                            {eventSubTab === 2
                                                                ? `${isMine ? "You haven't" : "This user hasn't"} liked any events yet.`
                                                                : eventSubTab === 3
                                                                    ? `${isMine ? "You haven't" : "This user hasn't"} reposted any events yet.`
                                                                    : (eventsSearch || eventsDateFrom || eventsDateTo || eventsView !== 'all') ? 'No events match your filters.' : 'No events yet.'}
                                                        </Typography>
                                                    </Box>
                                                )
                                            )}
                                        </ContentFadeIn>
                                    </Box>
                                )}

                                {/* Jobs content */}
                                {rightRailView === 'jobs' && (
                                    <Box sx={{ minHeight: 280, px: 0, pt: 0 }}>
                                        {profileJobsLoading ? (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
                                        ) : filteredProfileJobs.length > 0 ? (
                                            <Box>{filteredProfileJobs.map((job) => (
                                                <Box
                                                    key={job.id}
                                                    sx={(t) => ({
                                                        borderBottom: `1px solid ${alpha(t.palette.divider, 0.1)}`,
                                                        '&:last-child': { borderBottom: 'none' },
                                                    })}
                                                >
                                                    <JobCard
                                                        job={job}
                                                        onClick={() => handleJobClick(job)}
                                                        onEdit={handleEditJob}
                                                        onDelete={handleDeleteJobClick}
                                                        onShare={handleJobShare}
                                                        onSave={handleJobSaveToggle}
                                                        onApply={handleJobApply}
                                                        onReport={handleJobReport}
                                                        onRenew={handleRenew}
                                                        user={me}
                                                        activeAccount={activeAccount}
                                                        flat
                                                    />
                                                </Box>
                                            ))}</Box>
                                        ) : (
                                            <Box sx={{ textAlign: 'center', py: 6 }}>
                                                <WorkRoundedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {(jobsSearch || jobsCategory) ? 'No jobs match your filters.' : 'No jobs posted yet.'}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                )}

                                {/* Services content */}
                                {rightRailView === 'services' && (
                                    <Box sx={{ minHeight: 280, px: 0, pt: 1.5 }}>
                                        {servicesSubTab === 'services' && (
                                            <>
                                                {profileServicesLoading ? (
                                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
                                                ) : filteredProfileServices.length > 0 ? (
                                                    <Stack spacing={1.5} sx={{ px: 1.5 }}>{filteredProfileServices.map((svc) => (
                                                        <ServiceCard
                                                            key={svc.id}
                                                            service={svc}
                                                            onClick={() => setSelectedServicePopup(svc)}
                                                            onFavorite={(s) => toggleServiceFavorite(s.id).then((res) => { setServicesRefreshNonce((n) => n + 1); }).catch(() => {})}
                                                            user={me}
                                                            activeAccount={activeAccount}
                                                            compact
                                                        />
                                                    ))}</Stack>
                                                ) : (
                                                    <Box sx={{ textAlign: 'center', py: 6 }}>
                                                        <BuildRoundedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {'No services listed yet.'}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </>
                                        )}
                                        {servicesSubTab === 'requests' && (
                                            <>
                                                {profileServiceRequestsLoading ? (
                                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
                                                ) : profileServiceRequests.length > 0 ? (
                                                    <Stack spacing={1.5} sx={{ px: 1.5 }}>{profileServiceRequests.map((req) => (
                                                        <ServiceRequestCard
                                                            key={req.id}
                                                            request={req}
                                                            onClick={(r) => { if (r?.id) setSelectedRequestPopup(r); }}
                                                            onEdit={(r) => { setEditingRequestItem(r); setEditRequestModalOpen(true); }}
                                                            onDelete={(r) => {
                                                                if (!window.confirm('Delete this service request? This cannot be undone.')) return;
                                                                deleteServiceRequest(r.id).then(() => { setServicesRefreshNonce((n) => n + 1); showSuccess('Service request deleted'); }).catch(() => {});
                                                            }}
                                                            user={me}
                                                            activeAccount={activeAccount}
                                                        />
                                                    ))}</Stack>
                                                ) : (
                                                    <Box sx={{ textAlign: 'center', py: 6 }}>
                                                        <FrontHandRoundedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                                        <Typography variant="body2" color="text.secondary">No service requests yet.</Typography>
                                                    </Box>
                                                )}
                                            </>
                                        )}
                                    </Box>
                                )}

                                {/* Marketplace content */}
                                {rightRailView === 'marketplace' && (
                                    <Box sx={{ minHeight: 280, px: 0, pt: 1.5 }}>
                                        {marketplaceSubTab === 'listings' && (
                                            <>
                                                {profileListingsLoading ? (
                                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
                                                ) : filteredProfileListings.length > 0 ? (
                                                    <Stack spacing={1.5} sx={{ px: 1.5 }}>{filteredProfileListings.map((listing) => (
                                                        <ListingCard
                                                            key={listing.id}
                                                            listing={listing}
                                                            onSelect={() => handleListingClick(listing)}
                                                            onFavorite={handleListingFavorite}
                                                            onRepost={handleListingRepost}
                                                            onContact={handleListingContact}
                                                            onFlag={handleListingFlag}
                                                            onEdit={(l) => { setEditingListing(l); setCreateListingOpen(true); }}
                                                            user={me}
                                                            compact
                                                        />
                                                    ))}</Stack>
                                                ) : (
                                                    <Box sx={{ textAlign: 'center', py: 6 }}>
                                                        <StorefrontRoundedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {(listingsSearch || listingsCategory) ? 'No listings match your filters.' : 'No marketplace listings yet.'}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </>
                                        )}
                                        {marketplaceSubTab === 'reposts' && (
                                            <>
                                                {marketplaceRepostsLoading ? (
                                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
                                                ) : marketplaceReposts.length > 0 ? (
                                                    <Stack spacing={1.5} sx={{ px: 1.5 }}>{marketplaceReposts.map((listing) => (
                                                        <ListingCard
                                                            key={listing.id}
                                                            listing={listing}
                                                            onSelect={() => handleListingClick(listing)}
                                                            onFavorite={handleListingFavorite}
                                                            onRepost={handleListingRepost}
                                                            onContact={handleListingContact}
                                                            onFlag={handleListingFlag}
                                                            user={me}
                                                            compact
                                                        />
                                                    ))}</Stack>
                                                ) : (
                                                    <Box sx={{ textAlign: 'center', py: 6 }}>
                                                        <RepeatIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                                        <Typography variant="body2" color="text.secondary">No marketplace reposts yet.</Typography>
                                                    </Box>
                                                )}
                                            </>
                                        )}
                                        {marketplaceSubTab === 'seller_info' && (
                                            <Box sx={{ px: 1.5 }}>
                                                {sellerReviewsLoading ? (
                                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
                                                ) : (
                                                    <>
                                                        {/* Seller card */}
                                                        <Box sx={(t) => ({ p: 1.5, borderRadius: 2.5, border: '1px solid', borderColor: alpha(t.palette.text.primary, 0.06), bgcolor: alpha(t.palette.text.primary, 0.015), mb: 1.5 })}>
                                                            <Stack direction="row" spacing={1.25} alignItems="center">
                                                                <Avatar
                                                                    src={profile?.profile_picture || profile?.avatar_url || defaultAvatar}
                                                                    sx={{ width: 40, height: 40 }}
                                                                />
                                                                <Box sx={{ minWidth: 0 }}>
                                                                    <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
                                                                        {`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Seller'}
                                                                    </Typography>
                                                                    {sellerReviewStats.avgRating !== null ? (
                                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                                            <Rating value={sellerReviewStats.avgRating} precision={0.1} readOnly size="small" />
                                                                            <Typography variant="caption" color="text.secondary">({sellerReviewStats.totalCount})</Typography>
                                                                        </Stack>
                                                                    ) : (
                                                                        <Typography variant="caption" color="text.secondary">No reviews yet</Typography>
                                                                    )}
                                                                </Box>
                                                            </Stack>
                                                        </Box>
                                                        {/* Seller reviews */}
                                                        {sortedSellerReviews.length > 0 ? (
                                                            <Stack spacing={1.5}>
                                                                {sortedSellerReviews.map((rev) => {
                                                                    const rpName = rev.reply_by_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Seller';
                                                                    const rpHandle = rev.reply_by_handle || profile?.handle || '';
                                                                    const rpAvatar = rev.reply_by_avatar || profile?.profile_picture || profile?.avatar_url || '';
                                                                    const rpPhotos = Array.isArray(rev.reply_photo_urls) ? rev.reply_photo_urls.filter(Boolean) : [];
                                                                    const revPhotos = rev.photo_urls || rev.photoUrls || [];
                                                                    const revName = rev.reviewer_name || rev.reviewerName || 'Reviewer';
                                                                    const revHandle = rev.reviewer_handle || rev.reviewerHandle || '';
                                                                    const revDateStr = (() => {
                                                                        const raw = rev.created_at || rev.createdAt;
                                                                        if (!raw) return '';
                                                                        const d = new Date(raw);
                                                                        if (Number.isNaN(d.getTime())) return '';
                                                                        const diffMs = Date.now() - d.getTime();
                                                                        const diffH = Math.floor(diffMs / 3600000);
                                                                        if (diffH < 1) return 'Just now';
                                                                        if (diffH < 24) return `${diffH}h ago`;
                                                                        const diffD = Math.floor(diffH / 24);
                                                                        if (diffD < 7) return `${diffD}d ago`;
                                                                        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                                                    })();
                                                                    return (
                                                                        <Box key={rev.id} sx={(t) => ({ border: '1px solid', borderColor: alpha(t.palette.text.primary, 0.10), borderRadius: 2, p: 1.5, bgcolor: 'background.paper' })}>
                                                                            <Stack direction="row" spacing={1} alignItems="flex-start">
                                                                                <Avatar src={rev.reviewer_avatar || rev.reviewerAvatar} sx={(t) => ({ width: 36, height: 36, flexShrink: 0, mt: 0.25, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main })}>
                                                                                    <PersonRoundedIcon sx={{ fontSize: 20 }} />
                                                                                </Avatar>
                                                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                                    <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                        {revName}
                                                                                    </Typography>
                                                                                    {revHandle && (
                                                                                        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600, lineHeight: 1.2 }}>
                                                                                            @{revHandle}
                                                                                        </Typography>
                                                                                    )}
                                                                                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                                                                                        <Rating value={Number(rev.rating) || 0} readOnly size="small" sx={{ '& .MuiRating-icon': { fontSize: 15 } }} />
                                                                                        {revDateStr && (
                                                                                            <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 600 }}>
                                                                                                {revDateStr}
                                                                                            </Typography>
                                                                                        )}
                                                                                    </Stack>
                                                                                </Box>
                                                                            </Stack>
                                                                            {(rev.comment || rev.body) && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{rev.comment || rev.body}</Typography>}
                                                                            {revPhotos.length > 0 && (
                                                                                <Stack direction="row" spacing={0.75} sx={{ mt: 1, overflowX: 'auto', pb: 0.5 }}>
                                                                                    {revPhotos.slice(0, 4).map((url, pi) => (
                                                                                        <Box key={pi} onClick={() => openSellerRevPhotoLb(revPhotos, pi)}
                                                                                             sx={{ position: 'relative', width: 72, height: 72, flexShrink: 0, borderRadius: 2, overflow: 'hidden', cursor: 'pointer', border: '1px solid', borderColor: 'divider' }}>
                                                                                            <Box component="img" src={url} alt="" referrerPolicy="no-referrer"
                                                                                                 sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                                                                        </Box>
                                                                                    ))}
                                                                                </Stack>
                                                                            )}
                                                                            {rev.listingTitle && (
                                                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: 10.5, fontStyle: 'italic' }}>
                                                                                    Re: {rev.listingTitle}
                                                                                </Typography>
                                                                            )}
                                                                            {rev.seller_reply && (
                                                                                <Box sx={(t) => ({ mt: 1.5, ml: 0.5, pl: 1.5, py: 1, borderLeft: '3px solid', borderColor: t.palette.primary.main, bgcolor: alpha(t.palette.primary.main, 0.04), borderRadius: '0 8px 8px 0' })}>
                                                                                    <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 0.75 }}>
                                                                                        <Avatar src={rpAvatar || undefined} sx={(t) => ({ width: 26, height: 26, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main, mt: 0.1, flexShrink: 0 })}>
                                                                                            <PersonRoundedIcon sx={{ fontSize: 14 }} />
                                                                                        </Avatar>
                                                                                        <Box sx={{ minWidth: 0 }}>
                                                                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                                                                <Typography sx={{ fontWeight: 800, fontSize: 11.5, color: 'primary.dark', lineHeight: 1.3 }}>{rpName}</Typography>
                                                                                                <Chip label="Seller" size="small" sx={{ height: 15, fontSize: 8.5, fontWeight: 800, bgcolor: 'primary.main', color: 'common.white', '& .MuiChip-label': { px: 0.5 } }} />
                                                                                            </Stack>
                                                                                            {rpHandle && (
                                                                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5, lineHeight: 1.2, display: 'block' }}>@{rpHandle}</Typography>
                                                                                            )}
                                                                                        </Box>
                                                                                    </Stack>
                                                                                    <Typography variant="body2" sx={{ fontSize: 12, lineHeight: 1.45, color: 'text.secondary', pl: 4.5 }}>
                                                                                        {rev.seller_reply}
                                                                                    </Typography>
                                                                                    {rpPhotos.length > 0 && (
                                                                                        <Stack direction="row" spacing={0.75} sx={{ mt: 1, pl: 4.5, overflowX: 'auto', pb: 0.5 }}>
                                                                                            {rpPhotos.map((url, ri) => (
                                                                                                <Box key={ri} onClick={() => openSellerRevPhotoLb(rpPhotos, ri)}
                                                                                                     sx={{ position: 'relative', width: 60, height: 60, flexShrink: 0, borderRadius: 2, overflow: 'hidden', cursor: 'pointer', border: '1px solid', borderColor: 'divider' }}>
                                                                                                    <Box component="img" src={url} alt="" referrerPolicy="no-referrer"
                                                                                                         sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                                                                                </Box>
                                                                                            ))}
                                                                                        </Stack>
                                                                                    )}
                                                                                </Box>
                                                                            )}
                                                                        </Box>
                                                                    );
                                                                })}
                                                            </Stack>
                                                        ) : (
                                                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                                                <ReviewsRoundedIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }} />
                                                                <Typography variant="body2" color="text.secondary">No seller reviews yet.</Typography>
                                                            </Box>
                                                        )}
                                                    </>
                                                )}
                                            </Box>
                                        )}
                                    </Box>
                                )}

                                {/* Reviews content */}
                                {rightRailView === 'reviews' && (
                                    <Box sx={{ minHeight: 280, px: 0, pt: 1.5 }}>
                                        {profileReviewsLoading ? (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
                                        ) : filteredProfileReviews.length > 0 ? (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, px: 1.5 }}>
                                                {filteredProfileReviews.map((review) => {
                                                    const profileName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'User';
                                                    const profileHandleStr = profile?.handle ? `@${profile.handle.replace(/^@/, '')}` : '';
                                                    const profileAvatarRaw = profile?.profile_picture || profile?.avatar_url || '';
                                                    const profileAvatarValid = profileAvatarRaw && !profileAvatarRaw.includes('default_avatar') && !profileAvatarRaw.includes('default_business') && !profileAvatarRaw.includes('default_logo');
                                                    const profileAvatar = profileAvatarValid ? profileAvatarRaw : undefined;

                                                    const getSourceIcon = () => {
                                                        if (review.source === 'business') {
                                                            const et = review.entityType || 'business';
                                                            if (et === 'nonprofit') return VolunteerActivismRoundedIcon;
                                                            if (et === 'organization') return AccountBalanceRoundedIcon;
                                                            return StorefrontRoundedIcon;
                                                        }
                                                        if (review.source === 'marketplace') return SellRoundedIcon;
                                                        if (review.source === 'service') return BuildRoundedIcon;
                                                        return null;
                                                    };
                                                    const SourceIcon = getSourceIcon();

                                                    const reviewTimeAgo = (() => {
                                                        if (!review.createdAt) return '';
                                                        const d = new Date(review.createdAt);
                                                        if (Number.isNaN(d.getTime())) return '';
                                                        const diffMs = Date.now() - d;
                                                        const diffH = Math.floor(diffMs / 3600000);
                                                        if (diffH < 1) return 'Just now';
                                                        if (diffH < 24) return `${diffH}h ago`;
                                                        const diffD = Math.floor(diffH / 24);
                                                        if (diffD < 30) return `${diffD}d ago`;
                                                        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                                    })();

                                                    return (
                                                        <Box
                                                            key={review.id}
                                                            onClick={() => {
                                                                if (!review.entityPath && !review.entityId) return;
                                                                if (review.source === 'business') {
                                                                    setSelectedBusinessPopup({
                                                                        id: review.entityId || review.businessId || review.business_id,
                                                                        slug: review.entityHandle || review.entitySlug || review.businessSlug || (review.entityPath || '').replace(/^\//, ''),
                                                                        name: review.entityName,
                                                                        avatar_url: review.entityAvatar,
                                                                    });
                                                                    setSelectedBusinessPopupTab(3);
                                                                    setHighlightReviewId(review.id);
                                                                    setHighlightReviewerId(profile?.id);
                                                                } else if (review.source === 'service') {
                                                                    const svcId = review.entityId || review.serviceId || review.service_id;
                                                                    if (!svcId) return;
                                                                    fetchServiceById(svcId).then((data) => {
                                                                        const svc = data?.listing || data?.service || data;
                                                                        if (svc?.id) {
                                                                            setSelectedServicePopup(svc);
                                                                            setSelectedServicePopupTab(3);
                                                                            setHighlightReviewId(review.id);
                                                                            setHighlightReviewerId(profile?.id);
                                                                        }
                                                                    }).catch(() => {
                                                                        setSelectedServicePopup({ id: svcId, name: review.entityName, avatar_url: review.entityAvatar });
                                                                        setSelectedServicePopupTab(3);
                                                                        setHighlightReviewId(review.id);
                                                                        setHighlightReviewerId(profile?.id);
                                                                    });
                                                                } else if (review.source === 'marketplace') {
                                                                    const sellerId = review.entityId || review.sellerId || review.seller_id;
                                                                    if (sellerId) {
                                                                        setSellerReviewsPopup({ open: true, sellerId, highlightReviewId: review.id, highlightReviewerId: profile?.id });
                                                                    }
                                                                } else if (review.entityPath) {
                                                                    navigate(review.entityPath);
                                                                }
                                                            }}
                                                            sx={(t) => ({
                                                                border: '1px solid',
                                                                borderColor: alpha(t.palette.text.primary, 0.10),
                                                                borderRadius: 2,
                                                                bgcolor: 'background.paper',
                                                                overflow: 'hidden',
                                                                cursor: (review.entityPath || review.entityId || review.source) ? 'pointer' : 'default',
                                                                transition: 'border-color 150ms ease',
                                                                '&:hover': (review.entityPath || review.entityId || review.source) ? { borderColor: t.palette.primary.main } : {},
                                                            })}
                                                        >
                                                            {/* Entity header with gradient */}
                                                            <Box
                                                                sx={(t) => ({
                                                                    px: 1.5, py: 1,
                                                                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1,
                                                                    background: `linear-gradient(90deg, ${alpha(t.custom?.brand?.brass || '#A87822', 0.14)} 0%, ${alpha(t.palette.background.paper, 0)} 75%)`,
                                                                    borderBottom: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                                                                })}
                                                            >
                                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, minWidth: 0 }}>
                                                                    {review.entityAvatar && !String(review.entityAvatar).startsWith('blob:') ? (
                                                                        <Avatar src={review.entityAvatar} sx={{ width: 38, height: 38, flexShrink: 0, mt: 0.25 }} />
                                                                    ) : (
                                                                        <Avatar sx={(t) => ({ width: 38, height: 38, flexShrink: 0, mt: 0.25, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main })}>
                                                                            {(() => {
                                                                                if (review.source === 'business') {
                                                                                    const et = review.entityType || 'business';
                                                                                    if (et === 'nonprofit') return <VolunteerActivismRoundedIcon sx={{ fontSize: 20 }} />;
                                                                                    if (et === 'organization') return <AccountBalanceRoundedIcon sx={{ fontSize: 20 }} />;
                                                                                    return <StorefrontRoundedIcon sx={{ fontSize: 20 }} />;
                                                                                }
                                                                                if (review.source === 'service') return <BuildRoundedIcon sx={{ fontSize: 20 }} />;
                                                                                return <PersonRoundedIcon sx={{ fontSize: 20 }} />;
                                                                            })()}
                                                                        </Avatar>
                                                                    )}
                                                                    <Box sx={{ minWidth: 0 }}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                            <Typography sx={{ fontWeight: 900, lineHeight: 1.2 }} noWrap title={review.entityName}>
                                                                                {review.entityName}
                                                                            </Typography>
                                                                            {review.entityVerified && (
                                                                                <VerifiedRoundedIcon sx={{ fontSize: 15, color: 'primary.main', flexShrink: 0 }} />
                                                                            )}
                                                                        </Box>
                                                                        {review.entityHandle && (
                                                                            <Typography variant="caption" color="text.secondary" noWrap sx={{ lineHeight: 1.3, display: 'block' }}>
                                                                                @{String(review.entityHandle).replace(/^@/, '')}
                                                                            </Typography>
                                                                        )}
                                                                        {/* Category chip */}
                                                                        {(() => {
                                                                            let chipIcon = null;
                                                                            let chipLabel = null;
                                                                            if (review.source === 'business' && review.categoryKey) {
                                                                                chipIcon = BUSINESS_CATEGORY_ICONS[review.categoryKey] || CategoryRoundedIcon;
                                                                                chipLabel = BUSINESS_CATEGORY_LABELS[review.categoryKey] || review.categoryName || review.categoryKey;
                                                                            } else if (review.source === 'service' && review.categorySlug) {
                                                                                const svcInfo = getServiceCategoryInfo(review.categorySlug);
                                                                                chipIcon = svcInfo?.Icon || null;
                                                                                chipLabel = svcInfo?.name || review.categoryName || review.categorySlug;
                                                                            } else if (review.source === 'business' && review.categoryName) {
                                                                                chipIcon = StorefrontRoundedIcon;
                                                                                chipLabel = review.categoryName;
                                                                            }
                                                                            if (review.source === 'marketplace' && review.listingTitle) {
                                                                                chipIcon = SellRoundedIcon;
                                                                                chipLabel = review.listingTitle;
                                                                            }
                                                                            if (!chipLabel) return null;
                                                                            const ChipIcon = chipIcon;
                                                                            return (
                                                                                <Box sx={(t) => ({
                                                                                    display: 'inline-flex', alignItems: 'center', gap: 0.4,
                                                                                    mt: 0.5, px: 0.75, height: 22,
                                                                                    borderRadius: 999,
                                                                                    bgcolor: alpha(t.palette.primary.main, 0.08),
                                                                                    border: '1px solid', borderColor: alpha(t.palette.primary.main, 0.25),
                                                                                })}>
                                                                                    {ChipIcon && <ChipIcon sx={{ fontSize: 13, color: 'primary.main' }} />}
                                                                                    <Typography sx={{ fontSize: 11, fontWeight: 800, color: 'primary.main', lineHeight: 1 }}>
                                                                                        {chipLabel}
                                                                                    </Typography>
                                                                                </Box>
                                                                            );
                                                                        })()}
                                                                    </Box>
                                                                </Box>
                                                            </Box>

                                                            {/* Review content */}
                                                            <Box sx={{ px: 1.5, py: 1.25 }}>
                                                                <Box sx={(t) => ({
                                                                    border: '1px solid', borderColor: alpha(t.palette.text.primary, 0.08),
                                                                    borderRadius: 2, px: 1.25, py: 1,
                                                                    bgcolor: alpha(t.palette.primary.main, 0.02),
                                                                })}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.75 }}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                                                            <Avatar
                                                                                src={profileAvatar}
                                                                                alt={profileName}
                                                                                sx={(t) => ({
                                                                                    width: 34, height: 34,
                                                                                    ...(!profileAvatar ? { bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main } : {}),
                                                                                })}
                                                                            >
                                                                                <PersonRoundedIcon sx={{ fontSize: 18 }} />
                                                                            </Avatar>
                                                                            <Box sx={{ minWidth: 0 }}>
                                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                                    <Typography variant="body2" sx={{ fontWeight: 900, lineHeight: 1.1 }} noWrap>
                                                                                        {profileName}
                                                                                    </Typography>
                                                                                    {Boolean(Number(profile?.is_local_lantern_admin) === 1) && <VerifiedRoundedIcon sx={{ fontSize: 14, color: 'primary.main', flexShrink: 0 }} />}
                                                                                </Box>
                                                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                                                    {profileHandleStr}
                                                                                </Typography>
                                                                            </Box>
                                                                        </Box>
                                                                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                                                            {reviewTimeAgo}
                                                                        </Typography>
                                                                    </Box>
                                                                    <Rating value={Math.round(review.rating)} readOnly size="small" sx={{ mb: 0.5, '& .MuiRating-icon': { fontSize: 16 } }} />
                                                                    {review.title && (
                                                                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25 }}>
                                                                            {review.title}
                                                                        </Typography>
                                                                    )}
                                                                    {review.body && (
                                                                        <Typography variant="body2" sx={{
                                                                            color: 'text.secondary', lineHeight: 1.45,
                                                                            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                                                        }}>
                                                                            {review.body}
                                                                        </Typography>
                                                                    )}
                                                                    {(() => {
                                                                        const rPhotos = review.photoUrls || review.photo_urls || [];
                                                                        if (!rPhotos.length) return null;
                                                                        return (
                                                                            <Box sx={{ display: 'flex', gap: 0.75, mt: 1, overflow: 'hidden' }}>
                                                                                {rPhotos.slice(0, 3).map((url, i) => (
                                                                                    <Box key={i} component="img" src={url} alt="" referrerPolicy="no-referrer" sx={{ width: 56, height: 56, borderRadius: 1.5, objectFit: 'cover', flexShrink: 0 }} />
                                                                                ))}
                                                                            </Box>
                                                                        );
                                                                    })()}
                                                                </Box>
                                                            </Box>
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                        ) : (
                                            <Box sx={{ textAlign: 'center', py: 6 }}>
                                                <RateReviewRoundedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {reviewsType !== 'all' ? 'No reviews in this category.' : 'No reviews yet.'}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        </ContentFadeIn>
                    </MobileActivityShell>
                )}


                {postsExpanded && canViewPosts && !showBlockedProfileNotice && (
                    <Box sx={{ width: '100%', maxWidth: 'none', mx: 'auto', px: { xs: 1.25, sm: 2, md: 4 }, pt: { xs: 1.5, sm: 2, md: 2.5 }, pb: 3 }}>
                        {(() => {
                            const canViewCommentsExpanded = canViewSection(privacy?.comments || 'public');
                            const canViewLikesExpanded = canViewSection(privacy?.likes || 'public');
                            const canViewRepostsExpanded = canViewSection(privacy?.reposts || 'public');

                            const cannotViewText = (val) => {
                                const v = val || 'public';
                                if (v === 'private') return 'This section is visible to this user only.';
                                return 'This section is visible to followers.';
                            };

                            const tabCanView = expandedTab === 0 ? true : expandedTab === 1 ? canViewCommentsExpanded : expandedTab === 2 ? canViewLikesExpanded : canViewRepostsExpanded;
                            const emptyCopy =
                                expandedTab === 0
                                    ? (expandedCategory ? categoryEmptyCopy(expandedCategory) : { title: "No posts", subtitle: "This user doesn’t have any posts yet." })
                                    : expandedTab === 1
                                        ? { title: "No comments", subtitle: "This user hasn’t commented on any posts yet." }
                                        : expandedTab === 2
                                            ? { title: "No liked posts", subtitle: "This user hasn’t liked any posts yet." }
                                            : { title: "No reposts", subtitle: "This user hasn’t reposted anything yet." };

                            const emptyTitle = emptyCopy.title;
                            const emptySubtitle = emptyCopy.subtitle;


                            return (
                                <Card
                                    variant="outlined"
                                    sx={(t) => ({
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                        borderColor: (t) => alpha(t.palette.text.primary, 0.08),
                                        boxShadow: (t) => `0 14px 44px ${alpha(t.palette.text.primary, 0.10)}`,
                                        bgcolor: 'background.paper',
                                        width: '100%',
                                        maxWidth: { xs: '100%', md: 1120, lg: 1260 },
                                        mx: 'auto',

                                        height: {
                                            xs: 'calc(100vh - 120px)',
                                            sm: 'calc(100vh - 136px)',
                                            md: 'calc(100vh - 152px)',
                                        },
                                        maxHeight: {
                                            xs: 'calc(100vh - 120px)',
                                            sm: 'calc(100vh - 136px)',
                                            md: 'calc(100vh - 152px)',
                                        },
                                        display: 'grid',
                                        gridTemplateRows: 'auto auto 1fr auto',
                                        minHeight: 0,
                                    })}
                                >
                                    {/* Title row */}
                                    <Box
                                        sx={(t) => ({
                                            px: 2,
                                            py: 0.85,
                                            borderBottom: '1px solid',
                                            borderColor: 'divider',
                                            background: (t) =>
                                                `linear-gradient(90deg, ${alpha(t.palette.secondary.main, 0.10)} 0%, ${alpha(
                                                    t.palette.secondary.main,
                                                    0.02
                                                )} 60%, ${alpha(t.palette.background.paper, 0)} 100%)`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 2,
                                            flexWrap: 'wrap',
                                        })}
                                    >
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0 }}>
                                            <Button
                                                onClick={handleBackToProfile}
                                                startIcon={<ArrowBackIcon />}
                                                sx={{ textTransform: 'none', alignSelf: 'flex-start' }}
                                            >
                                                {(() => {
                                                    const fn = String(profile?.first_name || '').trim() || 'User';
                                                    const lower = fn.toLowerCase();
                                                    const possessive = lower.endsWith('s') ? `${fn}’` : `${fn}’s`;
                                                    return `Return to ${possessive} Profile`;
                                                })()}
                                            </Button>

                                            <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                                Community Activity
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Tabs */}
                                    <Box
                                        data-profile-expanded-tabs
                                        sx={{
                                            mt: 0,
                                            borderBottom: '1px solid',
                                            borderColor: 'divider',
                                            bgcolor: 'background.paper',
                                        }}
                                    >
                                        <Tabs
                                            value={expandedTab}
                                            onChange={handleExpandedTabChange}
                                            variant="fullWidth"
                                            sx={(t) => ({
                                                minHeight: { xs: 46, sm: 58 },
                                                width: '100%',
                                                border: 'none',
                                                borderRadius: 0,
                                                bgcolor: 'transparent',
                                                px: 0,
                                                mx: 0,
                                                '& .MuiTabs-scroller': {
                                                    borderRadius: 0,
                                                },
                                                '& .MuiTabs-flexContainer': {
                                                    borderRadius: 0,
                                                },
                                                '& .MuiTabs-indicator': {
                                                    height: 3,
                                                    borderRadius: 3,
                                                    backgroundColor: t.palette.secondary.main,
                                                },
                                                '& .MuiTab-root': {
                                                    textTransform: 'none',
                                                    minHeight: { xs: 46, sm: 58 },
                                                    fontWeight: 900,
                                                    py: { xs: 0.75, sm: 1.05 },
                                                    borderRadius: 0,
                                                    color: 'text.primary',
                                                    '& .MuiTab-iconWrapper': {
                                                        marginBottom: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    },
                                                    '& .MuiSvgIcon-root': {
                                                        color: 'text.secondary',
                                                        transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}, transform ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                                    },
                                                    '&.Mui-selected': {
                                                        color: 'text.primary',
                                                    },
                                                    '&.Mui-selected .MuiSvgIcon-root': {
                                                        color: 'secondary.main',
                                                    },
                                                    '&:hover .MuiSvgIcon-root': {
                                                        color: 'secondary.main',
                                                        transform: 'translateY(-1px)',
                                                    },
                                                },
                                            })}
                                        >
                                            <Tab
                                                icon={<ForumIcon />}
                                                iconPosition="start"
                                                label="Posts"
                                            />
                                            <Tab
                                                icon={<ChatBubbleOutlineIcon />}
                                                iconPosition="start"
                                                label="Comments"
                                            />
                                            <Tab
                                                icon={<FavoriteIcon />}
                                                iconPosition="start"
                                                label="Likes"
                                            />
                                            <Tab
                                                icon={<RepeatIcon />}
                                                iconPosition="start"
                                                label="Reposts"
                                            />
                                        </Tabs>
                                    </Box>

                                    <CardContent
                                        sx={{
                                            px: { xs: 1.25, sm: 2 },
                                            pt: 0,
                                            pb: { xs: 1.25, sm: 2 },
                                            bgcolor: 'background.paper',
                                            minHeight: 0,
                                            height: '100%',
                                            overflowY: 'auto',
                                            overflowX: 'hidden',
                                            overscrollBehaviorY: 'contain',
                                            WebkitOverflowScrolling: 'touch',

                                        }}
                                        ref={postsScrollRef}
                                        onClickCapture={blockLocationClicks}
                                        onKeyDownCapture={blockLocationClicks}
                                    >
                                        {/* Filters row */}
                                        <Box
                                            sx={(t) => ({
                                                position: 'sticky',
                                                top: 0,
                                                zIndex: 30,
                                                isolation: 'isolate',
                                                bgcolor: 'background.paper',
                                                backgroundColor: 'background.paper',
                                                pr: { xs: 1.25, sm: 2 },
                                                mx: { xs: -1.25, sm: -2 },
                                                px: { xs: 1.25, sm: 2 },
                                                pt: 1.25,
                                                pb: 1.25,
                                                borderBottom: '1px solid',
                                                borderColor: 'divider',
                                                boxShadow: (t) => `0 8px 22px ${alpha(t.palette.text.primary, 0.08)}`,
                                                '& .MuiInputLabel-root': {
                                                    bgcolor: 'background.paper',
                                                    px: 0.6,
                                                },
                                                '& .MuiInputLabel-shrink': {
                                                    bgcolor: 'background.paper',
                                                    px: 0.6,
                                                },
                                            })}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    gap: 1.5,
                                                    flexWrap: 'wrap',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <Box sx={{ flex: '1 1 220px', minWidth: 200, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}>
                                                    <FormControl size="small" fullWidth sx={PROFILE_CONTROL_SX}>
                                                        <InputLabel id="profile-expanded-category" shrink>Category</InputLabel>
                                                        <Select
                                                            labelId="profile-expanded-category"
                                                            label="Category"
                                                            value={expandedCategory}
                                                            onChange={(e) => setExpandedCategory(e.target.value)}
                                                            displayEmpty
                                                            MenuProps={profileMenuProps}
                                                            renderValue={(val) => {
                                                                const v = String(val || '').trim().toLowerCase();
                                                                if (!v) return 'All Categories';
                                                                const found = PROFILE_CATEGORY_OPTIONS.find((o) => String(o.value || '').trim().toLowerCase() === v);
                                                                return found ? found.label : v;
                                                            }}
                                                        >
                                                            {PROFILE_CATEGORY_OPTIONS.map((o) => (
                                                                <MenuItem key={o.value || 'all'} value={o.value}>
                                                                    {o.label}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </Box>

                                                <Box sx={{ flex: '1 1 180px', minWidth: 160, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}>
                                                    <FormControl size="small" fullWidth sx={PROFILE_CONTROL_SX}>
                                                        <InputLabel id="profile-expanded-sort" shrink>Sort</InputLabel>
                                                        <Select
                                                            labelId="profile-expanded-sort"
                                                            label="Sort"
                                                            value={expandedSort}
                                                            onChange={(e) => setExpandedSort(e.target.value)}
                                                            MenuProps={profileMenuProps}
                                                        >
                                                            <MenuItem value="newest">Newest</MenuItem>
                                                            <MenuItem value="popular">Popular</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                </Box>
                                            </Box>
                                        </Box>

                                        {expandedTab !== 0 && engagementLoading ? (
                                            <Typography variant="body2" color="text.secondary" sx={{ px: 1, mb: 1 }}>
                                                Loading…
                                            </Typography>
                                        ) : null}

                                        {!tabCanView ? (
                                            <Box sx={{ py: 2 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
                                                    {expandedTab === 1 ? cannotViewText(privacy?.comments) : expandedTab === 2 ? cannotViewText(privacy?.likes) : cannotViewText(privacy?.reposts)}
                                                </Typography>
                                            </Box>
                                        ) : expandedActiveFiltered.length === 0 ? (
                                            <ExpandedEmptyState
                                                icon={
                                                    expandedTab === 0 ? <ForumIcon sx={{ color: 'primary.main' }} /> :
                                                        expandedTab === 1 ? <ChatBubbleOutlineIcon sx={{ color: 'primary.main' }} /> :
                                                            expandedTab === 2 ? <FavoriteIcon sx={{ color: 'primary.main' }} /> :
                                                                <RepeatIcon sx={{ color: 'primary.main' }} />
                                                }
                                                title={emptyTitle}
                                                subtitle={emptySubtitle}
                                            />
                                        ) : (
                                            <Box
                                                sx={{
                                                    display: 'grid',
                                                    gap: 2,
                                                    gridTemplateColumns:
                                                        expandedTab === 1
                                                            ? {
                                                                xs: '1fr',
                                                                sm: 'repeat(2, minmax(0, 1fr))',
                                                                lg: 'repeat(3, minmax(0, 1fr))',
                                                            }
                                                            : {
                                                                xs: '1fr',
                                                                sm: 'repeat(2, minmax(0, 1fr))',
                                                                lg: 'repeat(2, minmax(0, 1fr))',
                                                            },
                                                    alignContent: 'start',
                                                    pb: 1,
                                                }}
                                            >

                                                {expandedActiveFiltered.slice(0, expandedVisibleCount).map((item, idx) => (
                                                    <React.Fragment
                                                        key={`${expandedTab === 1 ? 'comment-group' : (item?.category || 'post')}-${expandedTab === 1 ? (item?.post_id || item?.post?.id || idx) : item?.id}-${expandedTab}`}
                                                    >
                                                        {expandedTab === 1 ? (
                                                            (() => {
                                                                const g = item || {};
                                                                const post0 = g.post || {};
                                                                const comments = Array.isArray(g.comments) ? g.comments : [];
                                                                const total = comments.length;
                                                                const latest = comments[0] || null;

                                                                const timeLabel = (iso) => {
                                                                    const d = iso ? new Date(iso) : null;
                                                                    if (!d || Number.isNaN(d.valueOf())) return '';
                                                                    return d.toLocaleString();
                                                                };

                                                                const truncate = (t, n) => {
                                                                    const s0 = String(t || '').trim();
                                                                    if (!s0) return '';
                                                                    return s0.length > n ? `${s0.slice(0, n)}…` : s0;
                                                                };

                                                                return (
                                                                    <Box
                                                                        role="button"
                                                                        tabIndex={0}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                                e.preventDefault();
                                                                                if (latest) openCommentFromExpanded(latest);
                                                                            }
                                                                        }}
                                                                        onClick={() => {
                                                                            if (latest) openCommentFromExpanded(latest);
                                                                        }}
                                                                        sx={(t) => ({
                                                                            border: '1px solid',
                                                                            borderColor: (t) => alpha(t.palette.text.primary, 0.10),
                                                                            borderRadius: 2,
                                                                            bgcolor: 'background.paper',
                                                                            overflow: 'hidden',
                                                                            cursor: 'pointer',
                                                                            boxShadow: (t) => `0 10px 26px ${alpha(t.palette.text.primary, 0.08)}`,
                                                                            '&:hover': { borderColor: t.palette.primary.main },
                                                                        })}
                                                                    >
                                                                        <Box
                                                                            sx={(t) => ({
                                                                                px: 1.5,
                                                                                py: 1,
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'space-between',
                                                                                gap: 1,
                                                                                background: `linear-gradient(90deg, ${alpha(t.custom?.brand?.brass || '#A87822', 0.14)} 0%, ${alpha(t.palette.background.paper, 0)} 75%)`,
                                                                                borderBottom: (t) => `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                                                                            })}
                                                                        >
                                                                            <Box sx={{ minWidth: 0 }}>
                                                                                <Typography sx={{ fontWeight: 900 }} noWrap title={String(post0?.title || '')}>
                                                                                    {String(post0?.title || '').trim() || 'Post'}
                                                                                </Typography>
                                                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                                                    {String(post0?.handle || '').trim() ? `@${String(post0.handle).trim()} • ` : ''}
                                                                                    {latest?.created_at ? timeLabel(latest.created_at) : ''}
                                                                                </Typography>
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

                                                                        <Box sx={{ px: 1.5, py: 1.25, display: 'grid', gap: 1 }}>
                                                                            {comments.slice(0, 3).map((c) => {
                                                                                const cText = String(c?.content || '').trim();
                                                                                const isReply = !!c?.parent_id;
                                                                                const cTime = c?.created_at || null;

                                                                                return (
                                                                                    <Box
                                                                                        key={`comment-${c?.id || c?.comment_id || ''}`}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            openCommentFromExpanded(c);
                                                                                        }}
                                                                                        role="button"
                                                                                        tabIndex={0}
                                                                                        onKeyDown={(e) => {
                                                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                                                e.preventDefault();
                                                                                                e.stopPropagation();
                                                                                                openCommentFromExpanded(c);
                                                                                            }
                                                                                        }}
                                                                                        sx={(t) => ({
                                                                                            border: '1px solid',
                                                                                            borderColor: (t) => alpha(t.palette.text.primary, 0.08),
                                                                                            borderRadius: 2,
                                                                                            px: 1.25,
                                                                                            py: 1,
                                                                                            bgcolor: alpha(t.palette.primary.main, 0.02),
                                                                                            '&:hover': { borderColor: alpha(t.palette.primary.main, 0.32) },
                                                                                        })}
                                                                                    >
                                                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                                                                                <Avatar
                                                                                                    src={avatarSrc || defaultAvatar}
                                                                                                    alt={`${String(profile?.first_name || '').trim()} ${String(profile?.last_name || '').trim()}`.trim() || (profile?.handle ? `@${String(profile.handle).trim().replace(/^@+/, '')}` : 'User')}
                                                                                                    sx={{ width: 34, height: 34 }}
                                                                                                />
                                                                                                <Box sx={{ minWidth: 0 }}>
                                                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                                                        <Typography
                                                                                                            variant="body2"
                                                                                                            sx={{ fontWeight: 900, lineHeight: 1.1 }}
                                                                                                            noWrap
                                                                                                            title={`${String(profile?.first_name || '').trim()} ${String(profile?.last_name || '').trim()}`.trim()}
                                                                                                        >
                                                                                                            {`${String(profile?.first_name || '').trim()} ${String(profile?.last_name || '').trim()}`.trim() || 'User'}
                                                                                                        </Typography>
                                                                                                    </Box>
                                                                                                    <Typography variant="caption" color="text.secondary" noWrap>
                                                                                                        {profile?.handle ? `@${String(profile.handle).trim().replace(/^@+/, '')}` : ''}
                                                                                                        {isReply ? ' • Reply' : ''}
                                                                                                    </Typography>
                                                                                                </Box>
                                                                                            </Box>

                                                                                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                                                                                {cTime ? timeLabel(cTime) : ''}
                                                                                            </Typography>
                                                                                        </Box>

                                                                                        <Typography
                                                                                            variant="body2"
                                                                                            sx={{
                                                                                                fontWeight: 800,
                                                                                                color: 'text.primary',
                                                                                                mt: 0.5,
                                                                                                whiteSpace: 'pre-wrap',
                                                                                                overflowWrap: 'anywhere',
                                                                                            }}
                                                                                        >
                                                                                            {truncate(cText, 260)}
                                                                                        </Typography>
                                                                                    </Box>
                                                                                );
                                                                            })}

                                                                            {total > 3 ? (
                                                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                                                                                    View all comments on this post
                                                                                </Typography>
                                                                            ) : null}
                                                                        </Box>
                                                                    </Box>
                                                                );
                                                            })()
                                                        ) : (
                                                            <ProfilePostCard
                                                                post={item}
                                                                user={me}
                                                                hoveredId={hoveredId}
                                                                setHoveredId={setHoveredId}
                                                                onCardClick={openPostFromExpanded}
                                                                onOpenLocationMap={openLocationMap}
                                                                onEditPost={(post0) => {
                                                                    const pid = Number(post0?.id || 0);
                                                                    if (!pid) return;
                                                                    setEditPostId(pid);
                                                                    setEditOpen(true);
                                                                }}
                                                                onDeletePost={(post0) => {
                                                                    const pid = Number(post0?.id || 0);
                                                                    if (!pid) return;
                                                                    setDeletePostId(pid);
                                                                    setDeleteConfirmOpen(true);
                                                                }}
                                                                onOpenUserCard={undefined}
                                                                onOpenShare={(post0) => {
                                                                    setSharePost(post0);
                                                                    setShareContentType('post');
                                                                    setShareOpen(true);
                                                                }}
                                                            />
                                                        )}

                                                        {idx === expandedSentinelIndex - 1 ? (
                                                            <Box ref={expandedLoadMoreRef} sx={{ height: 1 }} />
                                                        ) : null}
                                                    </React.Fragment>
                                                ))}
                                            </Box>
                                        )}
                                    </CardContent>

                                    {/* Single count location: footer ONLY */}
                                    <Box
                                        sx={{
                                            px: 2,
                                            py: 1.1,
                                            borderTop: '1px solid',
                                            borderColor: 'divider',
                                            bgcolor: 'background.paper',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {tabCanView ? (
                                            <Box
                                                sx={(t) => ({
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    px: 2.25,
                                                    py: 0.85,
                                                    borderRadius: 999,
                                                    background: alpha(t.palette.secondary.main, 0.10),
                                                    border: `1px solid ${alpha(t.palette.secondary.main, 0.22)}`,
                                                })}
                                            >
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>
                                                    {expandedCountText}
                                                </Typography>
                                            </Box>
                                        ) : null}
                                    </Box>
                                </Card>
                            );
                        })()}

                        {/* UserCardPopover moved to component root for mobile accessibility */}

                    </Box>
                )}

                {/* ── Events expanded overlay ── */}
                {eventsExpanded && !showBlockedProfileNotice && (
                    <Box sx={{ width: '100%', maxWidth: 'none', mx: 'auto', px: { xs: 1.25, sm: 2, md: 4 }, pt: { xs: 1.5, sm: 2, md: 2.5 }, pb: 3 }}>
                        <Card
                            variant="outlined"
                            sx={(t) => ({
                                borderRadius: 3,
                                overflow: 'hidden',
                                borderColor: alpha(t.palette.text.primary, 0.08),
                                boxShadow: `0 14px 44px ${alpha(t.palette.text.primary, 0.10)}`,
                                bgcolor: 'background.paper',
                                width: '100%',
                                maxWidth: { xs: '100%', md: 1120, lg: 1260 },
                                mx: 'auto',
                                height: {
                                    xs: 'calc(100vh - 120px)',
                                    sm: 'calc(100vh - 136px)',
                                    md: 'calc(100vh - 152px)',
                                },
                                maxHeight: {
                                    xs: 'calc(100vh - 120px)',
                                    sm: 'calc(100vh - 136px)',
                                    md: 'calc(100vh - 152px)',
                                },
                                display: 'grid',
                                gridTemplateRows: 'auto auto auto 1fr auto',
                            })}
                        >
                            {/* Header */}
                            <Box
                                sx={(t) => ({
                                    px: { xs: 1.5, sm: 2 },
                                    py: 1.25,
                                    borderBottom: '1px solid',
                                    borderColor: alpha(t.palette.text.primary, 0.08),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 1,
                                })}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <IconButton
                                        size="small"
                                        onClick={handleBackFromEvents}
                                        aria-label="Back"
                                        sx={(t) => ({
                                            color: 'primary.main',
                                            bgcolor: alpha(t.palette.primary.main, 0.08),
                                            '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.15) },
                                        })}
                                    >
                                        <ArrowBackIcon fontSize="small" />
                                    </IconButton>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontWeight: 900,
                                            color: 'primary.main',
                                            letterSpacing: '-0.01em',
                                        }}
                                    >
                                        Events
                                    </Typography>
                                </Box>
                                <IconButton
                                    size="small"
                                    onClick={handleBackFromEvents}
                                    aria-label="Close"
                                    sx={(t) => ({
                                        color: 'text.secondary',
                                        '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.08) },
                                    })}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>

                            {/* Sub-tabs */}
                            <Box
                                sx={(t) => ({
                                    flexShrink: 0,
                                    borderBottom: '1px solid',
                                    borderColor: alpha(t.palette.primary.main, 0.08),
                                    bgcolor: 'background.paper',
                                })}
                            >
                                <Tabs
                                    value={eventSubTab}
                                    onChange={(_, v) => {
                                        setEventSubTab(v);
                                        setEventsCategory('');
                                        scrollRightRailToTop();
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
                                        '& .MuiTabs-indicator': { backgroundColor: t.palette.text.primary },
                                        '& .MuiTab-root.Mui-selected': { color: t.palette.text.primary },
                                    })}
                                >
                                    <Tab icon={<EventRoundedIcon />} iconPosition="start" label="Events" />
                                    <Tab icon={<ChatBubbleOutlineIcon />} iconPosition="start" label="Comments" />
                                    <Tab icon={<FavoriteIcon />} iconPosition="start" label="Likes" />
                                    <Tab icon={<RepeatIcon />} iconPosition="start" label="Reposts" />
                                </Tabs>
                            </Box>

                            {/* Filters */}
                            <Box
                                sx={(t) => getProfileFilterBarSx(t, eventSubTab === 0
                                    ? { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' }
                                    : { xs: '1fr 1fr', sm: '1fr 1fr 1fr' })}
                            >
                                {eventSubTab === 0 && (
                                    <FormControl size="small" fullWidth sx={PROFILE_CONTROL_SX}>
                                        <InputLabel id="expanded-events-view-label" shrink>View</InputLabel>
                                        <Select
                                            labelId="expanded-events-view-label"
                                            label="View"
                                            value={eventsView}
                                            onChange={(e) => { setEventsView(String(e.target.value || 'all')); scrollRightRailToTop(); }}
                                            MenuProps={profileMenuProps}
                                        >
                                            <MenuItem value="all">All Events</MenuItem>
                                            <MenuItem value="hosted">Hosted</MenuItem>
                                            <MenuItem value="going">Going</MenuItem>
                                            <MenuItem value="interested">Interested</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}

                                <FormControl size="small" fullWidth sx={PROFILE_CONTROL_SX}>
                                    <InputLabel id="expanded-events-category-label" shrink>Category</InputLabel>
                                    <Select
                                        labelId="expanded-events-category-label"
                                        label="Category"
                                        value={eventsCategory}
                                        onChange={(e) => { setEventsCategory(String(e.target.value || '')); scrollRightRailToTop(); }}
                                        displayEmpty
                                        MenuProps={profileMenuProps}
                                        renderValue={(val) => {
                                            const selected = String(val || '');
                                            const count = selected ? Number(eventCategoryCounts[selected] || 0) : totalEventCategoryCount;
                                            if (!selected) return `All Categories (${count})`;
                                            const label = eventCategoryLabel(selected) || selected;
                                            return `${label} (${count})`;
                                        }}
                                    >
                                        <MenuItem value="">All Categories ({totalEventCategoryCount})</MenuItem>
                                        {EVENT_CATEGORY_FILTER_OPTIONS
                                            .filter(({ value }) => Number(eventCategoryCounts[value] || 0) > 0)
                                            .map(({ value, label, Icon }) => {
                                                const count = Number(eventCategoryCounts[value] || 0);
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
                                            })}
                                    </Select>
                                </FormControl>

                                <TextField
                                    size="small"
                                    type="date"
                                    label="From"
                                    InputLabelProps={{ shrink: true }}
                                    value={eventsDateFrom}
                                    onChange={(e) => { setEventsDateFrom(e.target.value || ''); scrollRightRailToTop(); }}
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
                                    value={eventsDateTo}
                                    onChange={(e) => { setEventsDateTo(e.target.value || ''); scrollRightRailToTop(); }}
                                    sx={{
                                        ...PROFILE_CONTROL_SX,
                                        '& .MuiInputBase-input': { fontSize: 13 },
                                    }}
                                />
                            </Box>

                            {/* Events grid */}
                            <Box sx={{ overflowY: 'auto', overscrollBehaviorY: 'contain', p: { xs: 1.5, sm: 2 } }}>
                                {eventSubTab === 1 ? (
                                    /* ── Comments sub-tab (expanded) ── */
                                    eventCommentsLoading ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                            <CircularProgress size={28} />
                                        </Box>
                                    ) : eventEngagementComments.length === 0 ? (
                                        <ExpandedEmptyState
                                            icon={<ChatBubbleOutlineIcon sx={{ fontSize: { xs: 52, sm: 58 }, color: 'primary.main' }} />}
                                            title="No current activity"
                                            subtitle={`${isMine ? "You don't" : "This user doesn't"} have any comments on events yet.`}
                                        />
                                    ) : (
                                        <Box
                                            sx={{
                                                display: 'grid',
                                                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                                                gap: 2,
                                            }}
                                        >
                                            {eventEngagementComments.map((group) => {
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

                                                return (
                                                    <Box
                                                        key={`ec-exp-${ev0.id}`}
                                                        role="button"
                                                        tabIndex={0}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                e.preventDefault();
                                                                if (latest) openEventComment({ ...latest, _viewEventOnly: true }, ev0);
                                                            }
                                                        }}
                                                        onClick={() => {
                                                            if (latest) openEventComment({ ...latest, _viewEventOnly: true }, ev0);
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
                                                        {/* Event header */}
                                                        <Box
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
                                                                    <Avatar
                                                                        src={eventPhoto}
                                                                        alt={String(ev0?.title || '')}
                                                                        sx={{ width: 38, height: 38, flexShrink: 0 }}
                                                                    />
                                                                ) : (
                                                                    <Avatar sx={(t) => ({ width: 38, height: 38, flexShrink: 0, bgcolor: t.palette.primary.light })}>
                                                                        <EventRoundedIcon sx={{ fontSize: 20, color: '#fff' }} />
                                                                    </Avatar>
                                                                )}
                                                                <Box sx={{ minWidth: 0 }}>
                                                                    <Typography sx={{ fontWeight: 900 }} noWrap title={String(ev0?.title || '')}>
                                                                        {String(ev0?.title || '').trim() || 'Event'}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary" noWrap>
                                                                        {formatEventDate(ev0) || (latest?.created_at ? eventTimeAgo(latest.created_at) : '')}
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

                                                        {/* Comment rows */}
                                                        <Box sx={{ px: 1.5, py: 1.25, display: 'grid', gap: 1 }}>
                                                            {comments.slice(0, 3).map((c) => {
                                                                const cText = String(c?.content || '').trim();
                                                                const isReply = !!c?.parent_id;
                                                                const cTime = c?.created_at || null;

                                                                return (
                                                                    <Box
                                                                        key={`ec-exp-c-${c?.id || c?.comment_id || ''}`}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openEventComment(c, ev0);
                                                                        }}
                                                                        sx={(t) => ({
                                                                            border: '1px solid',
                                                                            borderColor: alpha(t.palette.text.primary, 0.08),
                                                                            borderRadius: 2,
                                                                            px: 1.25,
                                                                            py: 1,
                                                                            bgcolor: alpha(t.palette.primary.main, 0.02),
                                                                            '&:hover': { borderColor: alpha(t.palette.primary.main, 0.32) },
                                                                        })}
                                                                    >
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                                                                <Avatar
                                                                                    src={avatarSrc || defaultAvatar}
                                                                                    alt={`${String(profile?.first_name || '').trim()} ${String(profile?.last_name || '').trim()}`.trim() || 'User'}
                                                                                    sx={{ width: 34, height: 34 }}
                                                                                />
                                                                                <Box sx={{ minWidth: 0 }}>
                                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                                        <Typography
                                                                                            variant="body2"
                                                                                            sx={{ fontWeight: 900, lineHeight: 1.1 }}
                                                                                            noWrap
                                                                                        >
                                                                                            {`${String(profile?.first_name || '').trim()} ${String(profile?.last_name || '').trim()}`.trim() || 'User'}
                                                                                        </Typography>
                                                                                    </Box>
                                                                                    <Typography variant="caption" color="text.secondary" noWrap>
                                                                                        {profile?.handle ? `@${String(profile.handle).trim().replace(/^@+/, '')}` : ''}
                                                                                        {isReply ? ' • Reply' : ''}
                                                                                    </Typography>
                                                                                </Box>
                                                                            </Box>
                                                                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                                                                {cTime ? eventTimeAgo(cTime) : ''}
                                                                            </Typography>
                                                                        </Box>
                                                                        <Typography
                                                                            variant="body2"
                                                                            sx={{
                                                                                fontWeight: 800,
                                                                                color: 'text.primary',
                                                                                mt: 0.5,
                                                                                whiteSpace: 'pre-wrap',
                                                                                overflowWrap: 'anywhere',
                                                                            }}
                                                                        >
                                                                            {ecTruncate(cText, 260)}
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
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        openEventComment(c, ev0);
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
                                    /* ── Events / Likes / Reposts sub-tabs (expanded) ── */
                                    profileEventsLoading ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                            <CircularProgress size={28} />
                                        </Box>
                                    ) : filteredProfileEvents.length === 0 ? (
                                        <ExpandedEmptyState
                                            icon={
                                                eventSubTab === 2
                                                    ? <FavoriteIcon sx={{ fontSize: { xs: 52, sm: 58 }, color: 'primary.main' }} />
                                                    : eventSubTab === 3
                                                        ? <RepeatIcon sx={{ fontSize: { xs: 52, sm: 58 }, color: 'primary.main' }} />
                                                        : <EventRoundedIcon sx={{ fontSize: { xs: 52, sm: 58 }, color: 'primary.main' }} />
                                            }
                                            title={
                                                eventSubTab === 2
                                                    ? 'No current activity'
                                                    : eventSubTab === 3
                                                        ? 'No current activity'
                                                        : eventsView === 'going'
                                                            ? 'Not going to any events'
                                                            : eventsView === 'interested'
                                                                ? 'Not interested in any events'
                                                                : eventsView === 'hosted'
                                                                    ? 'No hosted events'
                                                                    : eventsCategory
                                                                        ? 'No events in this category'
                                                                        : 'No events'
                                            }
                                            subtitle={
                                                eventSubTab === 2
                                                    ? `${isMine ? "You haven't" : "This user hasn't"} liked any events yet.`
                                                    : eventSubTab === 3
                                                        ? `${isMine ? "You haven't" : "This user hasn't"} reposted any events yet.`
                                                        : eventsView === 'going'
                                                            ? `${isMine ? "You haven't" : "This user hasn't"} RSVP'd to any events yet.`
                                                            : eventsView === 'interested'
                                                                ? `${isMine ? "You haven't" : "This user hasn't"} marked interest in any events yet.`
                                                                : eventsView === 'hosted'
                                                                    ? `${isMine ? "You haven't" : "This user hasn't"} created any events yet.`
                                                                    : eventsCategory
                                                                        ? 'Try selecting a different category.'
                                                                        : `${isMine ? "You haven't" : "This user hasn't"} hosted, RSVP'd to, or shown interest in any events yet.`
                                            }
                                        />
                                    ) : (
                                        <Box>
                                            {(() => {
                                                const hasSections = eventsView === 'all' && eventSubTab === 0 && filteredProfileEvents.some((ev) => ev?._section);
                                                if (!hasSections) {
                                                    return (
                                                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                                                            {visibleProfileEvents.map((ev) => (
                                                                <EventCard key={ev.id} event={ev} onClick={() => handleEventClick(ev)} onEdit={handleEditEvent} onDelete={handleDeleteEvent} onEngagementChange={handleEventEngagementChange} user={me} activeAccount={activeAccount} />
                                                            ))}
                                                        </Box>
                                                    );
                                                }
                                                const profileName = `${profile?.first_name || ''}`.trim() || 'User';
                                                const sections = [
                                                    { key: 'hosted', label: isMine ? 'Your Hosted Events' : `${profileName}'s Hosted Events` },
                                                    { key: 'going', label: isMine ? 'Events You\'re Going To' : `${profileName}'s Going To` },
                                                    { key: 'interested', label: isMine ? 'Events You\'re Interested In' : `${profileName}'s Interested In` },
                                                ];
                                                return sections.map(({ key: sKey }) => {
                                                    const items = visibleProfileEvents.filter((ev) => ev?._section === sKey);
                                                    if (!items.length) return null;
                                                    return (
                                                        <Box key={sKey} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                                                            {items.map((ev) => (
                                                                <EventCard key={ev.id} event={ev} onClick={() => handleEventClick(ev)} onEdit={handleEditEvent} onDelete={handleDeleteEvent} onEngagementChange={handleEventEngagementChange} user={me} activeAccount={activeAccount} />
                                                            ))}
                                                        </Box>
                                                    );
                                                });
                                            })()}
                                            <Box ref={eventsSentinelRef} sx={{ height: 1 }} />
                                        </Box>
                                    )
                                )}
                            </Box>

                            {/* Footer */}
                            <Box
                                sx={(t) => ({
                                    px: 2,
                                    py: 1.1,
                                    borderTop: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: 'background.paper',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                })}
                            >
                                <Box
                                    sx={(t) => ({
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        px: 2.25,
                                        py: 0.85,
                                        borderRadius: 999,
                                        background: alpha(t.palette.secondary.main, 0.10),
                                        border: `1px solid ${alpha(t.palette.secondary.main, 0.22)}`,
                                    })}
                                >
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>
                                        {(() => {
                                            if (eventSubTab === 1) {
                                                const ct = eventEngagementComments.length;
                                                return `Displaying ${ct} event${ct !== 1 ? 's' : ''} with comments`;
                                            }
                                            const typeLabel = eventSubTab === 2 ? 'liked event' : eventSubTab === 3 ? 'reposted event' : 'event';
                                            const plural = filteredProfileEvents.length !== 1 ? 's' : '';
                                            return `Displaying ${visibleProfileEvents.length} of ${filteredProfileEvents.length} ${typeLabel}${plural}`;
                                        })()}
                                    </Typography>
                                </Box>
                            </Box>
                        </Card>
                    </Box>
                )}

                {/* Cropper */}
                <ImageCropDialog
                    open={cropOpen}
                    src={cropSrc}
                    aspect={1}
                    round={cropRound}
                    onClose={() => setCropOpen(false)}
                    onCropped={onCropped}
                />

                {/* Delete confirmations (X in corner; no click-away close) */}
                <Dialog
                    open={confirmOpen}
                    onClose={(_, reason) => {
                        if (reason !== 'backdropClick') setConfirmOpen(false);
                    }}
                    PaperProps={{ sx: { borderRadius: 3, minWidth: 320, textAlign: 'center' } }}
                >
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', pt: 2.5 }}>
                        Delete profile picture?
                        <IconButton
                            onClick={() => setConfirmOpen(false)}
                            size="small"
                            aria-label="Close"
                            sx={{ position: 'absolute', top: 8, right: 8, color: 'text.disabled', '&:hover': { color: 'text.primary' } }}
                        >
                            <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ pb: 1, px: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                            Comments and likes on your profile picture will also be removed.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: 'center', pb: 2.5, gap: 1 }}>
                        <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
                        <Button color="error" onClick={doDeleteAvatar}>
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Warning: changing avatar/cover will clear comments & likes */}
                <Dialog
                    open={photoChangeWarningOpen}
                    onClose={(_, reason) => {
                        if (reason !== 'backdropClick') {
                            setPhotoChangeWarningOpen(false);
                            setPendingCoverBlob(null);
                            setPendingAvatarBlob(null);
                            setPhotoChangeWarningKind(null);
                        }
                    }}
                    PaperProps={{ sx: { borderRadius: 3, minWidth: 320, maxWidth: 400, textAlign: 'center' } }}
                >
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', pt: 2.5, px: 4 }}>
                        {photoChangeWarningKind === 'cover' ? 'Change cover photo?' : 'Change profile picture?'}
                        <IconButton
                            onClick={() => { setPhotoChangeWarningOpen(false); setPendingCoverBlob(null); setPendingAvatarBlob(null); setPhotoChangeWarningKind(null); }}
                            size="small"
                            aria-label="Close"
                            sx={{ position: 'absolute', top: 8, right: 8, color: 'text.disabled', '&:hover': { color: 'text.primary' } }}
                        >
                            <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ pb: 1, px: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                            Your current {photoChangeWarningKind === 'cover' ? 'cover photo' : 'profile picture'} will be replaced. Any comments and likes on it will be removed.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: 'center', pb: 2.5, gap: 1 }}>
                        <Button onClick={() => { setPhotoChangeWarningOpen(false); setPendingCoverBlob(null); setPendingAvatarBlob(null); setPhotoChangeWarningKind(null); }}>
                            Cancel
                        </Button>
                        <Button variant="contained" onClick={confirmPhotoChange}>
                            Continue
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete cover photo confirmation */}
                <Dialog
                    open={confirmDeleteCoverOpen}
                    onClose={(_, reason) => {
                        if (reason !== 'backdropClick') setConfirmDeleteCoverOpen(false);
                    }}
                    PaperProps={{ sx: { borderRadius: 3, minWidth: 320, maxWidth: 400, textAlign: 'center' } }}
                >
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', pt: 2.5 }}>
                        Delete cover photo?
                        <IconButton
                            onClick={() => setConfirmDeleteCoverOpen(false)}
                            size="small"
                            aria-label="Close"
                            sx={{ position: 'absolute', top: 8, right: 8, color: 'text.disabled', '&:hover': { color: 'text.primary' } }}
                        >
                            <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ pb: 1, px: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                            Comments and likes on your cover photo will also be removed.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: 'center', pb: 2.5, gap: 1 }}>
                        <Button onClick={() => setConfirmDeleteCoverOpen(false)}>Cancel</Button>
                        <Button color="error" onClick={() => { setDeleteCover(true); setPendingCover(null); setConfirmDeleteCoverOpen(false); }}>
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Discard changes (X in corner; no click-away close) */}
                <Dialog
                    open={discardOpen}
                    onClose={(_, reason) => {
                        if (reason !== 'backdropClick') setDiscardOpen(false);
                    }}
                    PaperProps={{ sx: { borderRadius: 3, minWidth: 320, textAlign: 'center' } }}
                >
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', pt: 2.5 }}>
                        Discard all changes?
                        <IconButton
                            onClick={() => setDiscardOpen(false)}
                            size="small"
                            aria-label="Close"
                            sx={{ position: 'absolute', top: 8, right: 8, color: 'text.disabled', '&:hover': { color: 'text.primary' } }}
                        >
                            <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </DialogTitle>
                    <DialogActions sx={{ justifyContent: 'center', pb: 2.5, gap: 1 }}>
                        <Button onClick={() => setDiscardOpen(false)}>Cancel</Button>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                resetDraftsToProfile();
                                setPendingAvatar(null);
                                setDeleteAvatar(false);
                                setPendingCover(null);
                                setPendingCoverBlob(null);
                                setDeleteCover(false);
                                setEditMode(false);
                                setDiscardOpen(false);
                                showSuccess('Changes discarded.');
                            }}
                            sx={(t) => ({
                                textTransform: 'none',
                                borderColor: (t) => alpha(t.palette.secondary.main, 0.65),
                                color: t.palette.primary.main,
                                bgcolor: 'background.paper',
                                '&:hover': {
                                    bgcolor: (t) => alpha(t.palette.secondary.main, 0.10),
                                    borderColor: (t) => alpha(t.palette.secondary.main, 0.90),
                                },
                            })}
                        >
                            Discard
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Privacy popover (X in corner; block outside click) */}
                <Popover
                    open={!!privacyAnchor}
                    anchorEl={privacyAnchor}
                    onClose={(_, reason) => {
                        if (reason === 'backdropClick') return;
                        setPrivacyAnchor(null);
                        setPrivacyFor(null);
                    }}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, pt: 1 }}>
                        <Typography variant="subtitle2">Privacy</Typography>
                        <IconButton
                            size="small"
                            onClick={() => {
                                setPrivacyAnchor(null);
                                setPrivacyFor(null);
                            }}
                            aria-label="Close"
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <Box sx={{ px: 2, pb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {`Who can see this ${privacyFor === 'posts' ? 'section' : 'field'}?`}
                        </Typography>
                        <RadioGroup value={(privacy && privacy[privacyFor]) || 'public'} onChange={(e) => setPrivacyLevel(e.target.value)}>
                            <FormControlLabel value="public" control={<Radio />} label="Public" />
                            <FormControlLabel value="friends" control={<Radio />} label="Followers" />
                            <FormControlLabel value="private" control={<Radio />} label="Only Me" />
                        </RadioGroup>
                    </Box>
                </Popover>

                {/* Edit community post dialog (shared component) */}
                <EditCommunityPostDialog open={editOpen} postId={editPostId} onClose={closeEditDialog} />

                {/* Shared delete confirmation (for delete buttons in post lists) */}
                <DeletePostConfirmDialog
                    open={deleteConfirmOpen}
                    postId={deletePostId}
                    onClose={() => {
                        setDeleteConfirmOpen(false);
                        setDeletePostId(null);
                    }}
                    onDeleted={(deletedId) => {
                        const id = Number(deletedId ?? deletePostId);
                        applyDeletedCommunityPost(id);
                        setDeleteConfirmOpen(false);
                        setDeletePostId(null);
                        showSuccess('Post deleted successfully');
                    }}
                />

                {/* Post edit history dialog — matches PostList.jsx timeline style */}
                <Dialog
                    disableScrollLock
                    open={historyOpen}
                    fullWidth
                    maxWidth="sm"
                    onClose={(_, reason) => {
                        if (reason === 'backdropClick') return;
                        closeHistoryDialog();
                    }}
                    PaperProps={{ sx: { position: 'relative' } }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <DialogTitle sx={{ pr: 7, fontWeight: 800, fontSize: 18 }}>
                        Edit History
                        <IconButton onClick={closeHistoryDialog} size="small" aria-label="Close" sx={{ position: 'absolute', right: 8, top: 8 }}>
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent dividers sx={{ minHeight: 120, px: { xs: 2, sm: 3 } }}>
                        {historyLoading && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress size={28} />
                            </Box>
                        )}
                        {!historyLoading && historyError && (
                            <Alert severity="error" sx={{ mb: 1 }}>{historyError}</Alert>
                        )}
                        {!historyLoading && !historyError && (!historyRows || historyRows.length === 0) ? (
                            <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center', fontSize: 14 }}>
                                This post was edited, but detailed version history is not available for edits made before history tracking was enabled.
                            </Typography>
                        ) : null}
                        {!historyLoading && !historyError && historyRows && historyRows.length > 0 ? (
                            <Box sx={{ position: 'relative', pl: 2.5 }}>
                                {/* Timeline vertical line */}
                                <Box sx={{ position: 'absolute', left: 5, top: 10, bottom: 10, width: 2, bgcolor: (t) => alpha(t.palette.primary.main, 0.12), borderRadius: 1 }} />
                                {historyRows.map((row, idx) => {
                                    const snap = row?.snapshot || {};
                                    const prevSnap = historyRows[idx + 1]?.snapshot || {};
                                    const diff = row?.diff || {};
                                    const isOriginal = idx === historyRows.length - 1;
                                    const isLatest = idx === 0;

                                    // Build diff items
                                    const diffItems = [];
                                    if (!isOriginal) {
                                        const s = (v) => (v == null ? '' : String(v).trim());
                                        if (s(snap.title) !== s(prevSnap.title)) diffItems.push({ label: 'Title', from: s(prevSnap.title) || '(empty)', to: s(snap.title) || '(empty)' });
                                        if (s(snap.description) !== s(prevSnap.description)) {
                                            const prevDesc = s(prevSnap.description);
                                            const curDesc = s(snap.description);
                                            const t80 = (v) => v.length > 80 ? v.slice(0, 80) + '…' : v;
                                            diffItems.push({ label: 'Description', from: t80(prevDesc) || '(empty)', to: t80(curDesc) || '(empty)' });
                                        }
                                        const added = Array.isArray(diff?.added) ? diff.added.filter(Boolean) : [];
                                        const removed = Array.isArray(diff?.removed) ? diff.removed.filter(Boolean) : [];
                                        const reordered = Boolean(diff?.reordered);
                                        if (added.length > 0 || removed.length > 0 || reordered) {
                                            const parts = [];
                                            if (added.length) parts.push(`${added.length} added`);
                                            if (removed.length) parts.push(`${removed.length} removed`);
                                            if (!parts.length && reordered) parts.push('reordered');
                                            diffItems.push({ label: 'Photos', changed: true, detail: parts.join(', '), photoAdded: added, photoRemoved: removed });
                                        }
                                    }

                                    return (
                                        <Box key={row.id || row.version || idx} sx={{ position: 'relative', pb: idx < historyRows.length - 1 ? 2.5 : 0 }}>
                                            {/* Timeline dot */}
                                            <Box sx={{
                                                position: 'absolute', left: -20, top: 4, width: 12, height: 12, borderRadius: '50%',
                                                bgcolor: isOriginal ? 'grey.400' : isLatest ? 'secondary.main' : 'primary.main',
                                                border: '2px solid', borderColor: 'background.paper',
                                                boxShadow: (t) => `0 0 0 2px ${alpha(isOriginal ? t.palette.grey[400] : isLatest ? t.palette.secondary.main : t.palette.primary.main, 0.2)}`,
                                                zIndex: 1,
                                            }} />
                                            {/* Version label + date */}
                                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                                                <Typography sx={{ fontWeight: 800, fontSize: 13, color: isOriginal ? 'text.secondary' : 'text.primary' }}>
                                                    {isOriginal ? 'Original' : isLatest ? 'Latest edit' : `Version ${row.version || historyRows.length - idx}`}
                                                </Typography>
                                                <Typography sx={{ fontSize: 11, color: 'text.disabled', fontWeight: 500 }}>
                                                    {row.edited_at ? dateTimeLabel(row.edited_at) : ''}
                                                </Typography>
                                                {row.editor_handle ? (
                                                    <Typography sx={{ fontSize: 11, color: 'text.disabled', fontWeight: 500 }}>@{row.editor_handle}</Typography>
                                                ) : null}
                                            </Stack>
                                            {/* Diff chips */}
                                            {!isOriginal && diffItems.length > 0 && (
                                                <Box sx={{ bgcolor: (t) => alpha(t.palette.primary.main, 0.025), border: '1px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.08), borderRadius: 2, px: 1.5, py: 1 }}>
                                                    {diffItems.map((item, i) => (
                                                        <Box key={i} sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, py: 0.5 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                                <Chip label={item.label} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, borderRadius: 1.5, bgcolor: (t) => alpha(t.palette.primary.main, 0.08), color: 'primary.dark', border: 'none', flexShrink: 0, mt: 0.1, '& .MuiChip-label': { px: 1 } }} />
                                                                {item.changed ? (
                                                                    <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.5, pt: 0.15 }}>{item.detail || 'Updated'}</Typography>
                                                                ) : (
                                                                    <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.5, pt: 0.15, minWidth: 0, wordBreak: 'break-word' }}>
                                                                        <Box component="span" sx={{ textDecoration: 'line-through', opacity: 0.55 }}>{item.from}</Box>
                                                                        <Box component="span" sx={{ mx: 0.5, color: 'text.disabled' }}>→</Box>
                                                                        <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{item.to}</Box>
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                            {(item.photoAdded?.length > 0 || item.photoRemoved?.length > 0) && (
                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, pl: 0.5, mt: 0.5 }}>
                                                                    {(item.photoRemoved || []).slice(0, 4).map((url, pi) => (
                                                                        <Box key={`rm-${pi}`} sx={{ position: 'relative', width: 52, height: 52, borderRadius: 1.5, overflow: 'hidden', border: '2px solid', borderColor: 'error.main', opacity: 0.6 }}>
                                                                            <Box component="img" src={url} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.35)' }}>
                                                                                <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: 16, lineHeight: 1 }}>−</Typography>
                                                                            </Box>
                                                                        </Box>
                                                                    ))}
                                                                    {(item.photoAdded || []).slice(0, 4).map((url, pi) => (
                                                                        <Box key={`add-${pi}`} sx={{ position: 'relative', width: 52, height: 52, borderRadius: 1.5, overflow: 'hidden', border: '2px solid', borderColor: 'success.main' }}>
                                                                            <Box component="img" src={url} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.2)' }}>
                                                                                <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: 16, lineHeight: 1 }}>+</Typography>
                                                                            </Box>
                                                                        </Box>
                                                                    ))}
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    ))}
                                                </Box>
                                            )}
                                            {!isOriginal && diffItems.length === 0 && (
                                                <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic', pl: 0.5 }}>Post details updated</Typography>
                                            )}
                                            {isOriginal && (
                                                <Box sx={{ bgcolor: (t) => alpha(t.palette.grey[500], 0.04), border: '1px solid', borderColor: (t) => alpha(t.palette.grey[500], 0.08), borderRadius: 2, px: 1.5, py: 1 }}>
                                                    {snap.title && <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.primary', mb: 0.25 }}>{String(snap.title).trim()}</Typography>}
                                                    <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.4 }}>Original post created</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Box>
                        ) : null}
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 1.5 }}>
                        <Button onClick={closeHistoryDialog} sx={{ fontWeight: 700 }}>Close</Button>
                    </DialogActions>
                </Dialog>

                {/* Mark Lost item as Found */}
                <Dialog
                    open={markFoundOpen}
                    fullWidth
                    maxWidth="sm"
                    onClose={(_, reason) => {
                        if (reason === 'backdropClick') return;
                        closeMarkFoundDialog();
                    }}
                >
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        Mark as Found
                        <IconButton onClick={closeMarkFoundDialog} size="small" aria-label="Close">
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent dividers>
                        {markFoundError ? (
                            <Alert severity="error" sx={{ mb: 1 }}>
                                {markFoundError}
                            </Alert>
                        ) : null}

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {markFoundPost?.title ? `You're marking “${markFoundPost.title}” as found.` : 'You are marking this item as found.'}{' '}
                            This will update the post card to show “Marked as Found by the Owner”. You can optionally add an update message (e.g., “Update: Thank you all for looking!”).
                        </Typography>

                        <TextField
                            label="Update message (optional)"
                            value={markFoundMessage}
                            onChange={(e) => setMarkFoundMessage(e.target.value)}
                            fullWidth
                            multiline
                            minRows={3}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={closeMarkFoundDialog} disabled={markFoundSaving}>
                            Cancel
                        </Button>
                        <Button variant="contained" onClick={submitMarkFound} disabled={markFoundSaving}>
                            {markFoundSaving ? 'Saving…' : 'Mark as Found'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Profile Location Map popup */}
                <Dialog
                    open={locationMapOpen}
                    onClose={() => closeLocationMap()}
                    fullWidth
                    maxWidth="md"
                    PaperProps={{
                        sx: {
                            display: 'flex',
                            flexDirection: 'column',
                            width: { xs: '94vw', sm: 860 },
                            maxWidth: '94vw',
                            height: { xs: '120vh', sm: 900 },
                            maxHeight: '120vh',
                            borderRadius: 3,
                            overflow: 'hidden',
                        },
                    }}
                >
                    <DialogTitle
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1,
                            pr: 1,
                            py: 1.25,
                        }}
                    >
                        <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 950, lineHeight: 1.1 }}>
                                Location
                            </Typography>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    mt: 0.25,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: { xs: '70vw', sm: 640 },
                                }}
                            >
                                {(() => {
                                    const city = String(profile?.city || '').trim();
                                    const county = String(profile?.county || '').trim();
                                    const parts = [];
                                    if (city) parts.push(city);
                                    if (county) parts.push(county.includes('County') ? county : `${county} County`);
                                    return parts.join(', ') || '—';
                                })()}
                            </Typography>
                        </Box>

                        <IconButton
                            onClick={closeLocationMap}
                            size="small"
                            aria-label="Close"
                            sx={(t) => ({
                                width: 36,
                                height: 36,
                                borderRadius: 999,
                                border: '1px solid',
                                borderColor: t.palette.divider,
                                backgroundColor: t.palette.background.paper,
                                '&:hover': { backgroundColor: t.palette.action.hover },
                            })}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </DialogTitle>

                    <DialogContent sx={{ p: 0, flex: 1, bgcolor: 'background.default' }}>
                        {(() => {
                            const srcPosts = Array.isArray(feedPosts) ? feedPosts : [];

                            // Prefer real coordinates from any posts that have them.
                            const coords = [];
                            for (const post0 of srcPosts) {
                                const lat0 = Number(post0?.latitude ?? post0?.lat);
                                const lng0 = Number(post0?.longitude ?? post0?.lng);
                                if (!Number.isFinite(lat0) || !Number.isFinite(lng0)) continue;
                                coords.push([lat0, lng0]);
                            }

                            // Fallback: profile might store a location coordinate.
                            const profileLat = Number(profile?.latitude ?? profile?.lat);
                            const profileLng = Number(profile?.longitude ?? profile?.lng);
                            if (coords.length === 0 && Number.isFinite(profileLat) && Number.isFinite(profileLng)) {
                                coords.push([profileLat, profileLng]);
                            }

                            if (coords.length === 0) {
                                return (
                                    <Box sx={{ p: 2 }}>
                                        <Typography sx={{ fontWeight: 900 }}>
                                            No location available
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            There are no coordinates available to display on the map.
                                        </Typography>
                                    </Box>
                                );
                            }

                            // One representative pin: average of available coords.
                            const sum = coords.reduce(
                                (acc, cur) => [acc[0] + cur[0], acc[1] + cur[1]],
                                [0, 0]
                            );
                            const lat = sum[0] / coords.length;
                            const lng = sum[1] / coords.length;

                            const data = {
                                type: 'FeatureCollection',
                                features: [
                                    {
                                        type: 'Feature',
                                        geometry: { type: 'Point', coordinates: [lng, lat] },
                                        properties: { id: 'profile-location', category: 'event' },
                                    },
                                ],
                            };

                            const hasCity = String(profile?.city || '').trim().length > 0;
                            const zoom = hasCity ? 11 : 9;

                            return (
                                <Box sx={{ width: '100%', height: '100%' }}>
                                    <CommunityMap
                                        data={data}
                                        mapRef={locationMapRef}
                                        center={[lat, lng]}
                                        zoomLevel={zoom}
                                        hoveredId={null}
                                        openedPopupId={null}
                                        popupContentById={EMPTY_MAP}
                                        onMarkerClick={undefined}
                                        onPopupClose={undefined}
                                    />
                                </Box>
                            );
                        })()}
                    </DialogContent>
                </Dialog>

                {/* keep for future */}
                <Box sx={{ display: 'none' }} data-profile-key={profileKey} />

                {/* ── Edit/Delete modals (always rendered) ── */}
                <CreateEditEventModal
                    open={editEventOpen}
                    onClose={() => { setEditEventOpen(false); setEditingEvent(null); setEventsRefreshNonce((n) => n + 1); }}
                    eventToEdit={editingEvent}
                    user={me}
                    onSaved={handleEventSaved}
                />
                <CreateJobModal
                    open={editJobOpen}
                    onClose={() => { setEditJobOpen(false); setEditingJob(null); setJobsRefreshNonce((n) => n + 1); }}
                    editingJob={editingJob}
                    onCreated={handleJobSaved}
                />
                <CreateListingModal
                    open={createListingOpen}
                    onClose={() => { setCreateListingOpen(false); setEditingListing(null); }}
                    user={me}
                    mode={editingListing ? "edit" : undefined}
                    listingId={editingListing?.id}
                    initialListing={editingListing}
                    onCreated={() => {
                        setCreateListingOpen(false);
                        setEditingListing(null);
                        setListingsRefreshNonce((n) => n + 1);
                        try { window.dispatchEvent(new Event('ll:marketplace:listing:updated')); } catch {}
                    }}
                    onUpdated={() => {
                        setCreateListingOpen(false);
                        setEditingListing(null);
                        setListingsRefreshNonce((n) => n + 1);
                        try { window.dispatchEvent(new Event('ll:marketplace:listing:updated')); } catch {}
                    }}
                />


                <Dialog open={Boolean(deleteJobTarget)} onClose={() => setDeleteJobTarget(null)} maxWidth="xs" fullWidth>
                    <DialogTitle sx={{ pr: 6 }}>
                        <Typography sx={{ fontWeight: 950, fontSize: 16 }}>Delete Job</Typography>
                        <IconButton aria-label="Close" onClick={() => setDeleteJobTarget(null)} disabled={isDeletingJob}
                                    sx={{ position: 'absolute', right: 12, top: 12 }}>
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Are you sure you want to delete &quot;{deleteJobTarget?.title}&quot;? This cannot be undone.
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                <Button variant="outlined" onClick={() => setDeleteJobTarget(null)} disabled={isDeletingJob}>Cancel</Button>
                                <Button variant="contained" color="error" onClick={handleConfirmDeleteJob} disabled={isDeletingJob}>
                                    {isDeletingJob ? 'Deleting...' : 'Delete'}
                                </Button>
                            </Box>
                        </Box>
                    </DialogContent>
                </Dialog>

                {/* ── Renew/Extend Job dialog ── */}
                <Dialog open={Boolean(renewTarget)} onClose={() => setRenewTarget(null)} maxWidth="xs" fullWidth>
                    <DialogTitle sx={{ pr: 6 }}>
                        <Typography sx={{ fontWeight: 950, fontSize: 16 }}>Renew Job Listing</Typography>
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
                                How long would you like to renew &quot;{renewTarget?.title}&quot;?
                            </Typography>
                            <TextField
                                select
                                fullWidth
                                label="Duration"
                                value={renewDays}
                                onChange={(e) => setRenewDays(Number(e.target.value))}
                            >
                                {RENEW_OPTIONS.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                ))}
                            </TextField>
                            {renewError ? (
                                <Alert severity="error" sx={{ borderRadius: 2 }}>
                                    {renewError.message || 'Failed to renew.'}
                                </Alert>
                            ) : null}
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Button variant="outlined" onClick={() => setRenewTarget(null)} disabled={isRenewing}>Cancel</Button>
                                <Button
                                    variant="contained"
                                    onClick={handleConfirmRenew}
                                    disabled={isRenewing}
                                    startIcon={<AutorenewRoundedIcon />}
                                    sx={(t) => ({ fontWeight: 900, color: t.palette.common.white })}
                                >
                                    {isRenewing ? 'Renewing...' : 'Renew'}
                                </Button>
                            </Stack>
                        </Stack>
                    </DialogContent>
                </Dialog>

                {/* ── Share dialog (global — works for posts + jobs) ── */}
                <ShareDialog
                    open={shareOpen}
                    onClose={() => { setShareOpen(false); setShareContentType('post'); }}
                    viewer={me}
                    contentType={shareContentType}
                    post={shareContentType === 'post' ? sharePost : undefined}
                    job={shareContentType === 'job' ? sharePost : undefined}
                />

                {/* ── Marketplace listing report dialog ── */}
                <ReportDialog
                    open={Boolean(listingFlagTarget)}
                    onClose={() => setListingFlagTarget(null)}
                    onSubmit={handleListingFlagSubmit}
                />

                {/* Photo report dialog */}
                <ReportDialog
                    open={photoReportOpen}
                    onClose={() => { setPhotoReportOpen(false); setPhotoReportTarget(null); }}
                    onSubmit={handlePhotoReportSubmit}
                    title="Report Photo"
                />

                {/* ── Marketplace action snackbar ── */}
                <Snackbar
                    open={Boolean(listingSnackMsg)}
                    autoHideDuration={2500}
                    onClose={() => setListingSnackMsg('')}
                    message={listingSnackMsg}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                />

                {/* ── Profile updated snackbar ── */}
                <Snackbar
                    open={Boolean(profileSnack)}
                    autoHideDuration={3000}
                    onClose={() => setProfileSnack('')}
                    message={profileSnack}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                />

                {/* ── Success snackbar ── */}
                <SuccessSnackbar {...successSnackbarProps} />

                {/* ── Back to top FAB ── */}
                <Zoom in={showBackToTop}>
                    <Fab
                        size="medium"
                        aria-label="Back to top"
                        onClick={scrollRightRailToTop}
                        sx={(t) => ({
                            position: 'fixed',
                            bottom: { xs: 24, sm: 32 },
                            right: { xs: 24, sm: 32 },
                            zIndex: 1200,
                            bgcolor: t.palette.primary.main,
                            color: t.palette.common.white,
                            boxShadow: `0 4px 14px ${alpha(t.palette.primary.main, 0.4)}`,
                            '&:hover': {
                                bgcolor: t.palette.primary.dark,
                                boxShadow: `0 6px 20px ${alpha(t.palette.primary.main, 0.5)}`,
                            },
                        })}
                    >
                        <KeyboardArrowUpRoundedIcon />
                    </Fab>
                </Zoom>

                {/* ═══════════ Event Detail Popup (skip when mobile activity shell handles it) ═══════════ */}
                <Dialog
                    open={Boolean(selectedEventPopup) && !(isMobile && mobileActivityOpen)}
                    onClose={() => { setSelectedEventPopup(null); setEventScrollToCommentId(null); setEventHighlightCommentId(null); }}
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
                    {selectedEventPopup && (
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
                                <IconButton size="small" onClick={() => { setSelectedEventPopup(null); setEventScrollToCommentId(null); setEventHighlightCommentId(null); }} aria-label="Close">
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>
                            <Box sx={{ position: 'absolute', top: 48, left: 0, right: 0, bottom: 0 }}>
                                <EventDetailPanel
                                    event={selectedEventPopup}
                                    user={me}
                                    onRequireAuth={() => {}}
                                    onEventUpdate={(updated) => {
                                        setSelectedEventPopup((prev) => prev ? { ...prev, ...updated } : prev);
                                        if (isMine) setEventsRefreshNonce((n) => n + 1);
                                    }}
                                    scrollToCommentId={eventScrollToCommentId}
                                    highlightCommentId={eventHighlightCommentId}
                                />
                            </Box>
                        </>
                    )}
                </Dialog>

                {/* ═══════════ Job Detail Popup (skip when mobile activity shell handles it) ═══════════ */}
                <Dialog
                    open={Boolean(selectedJobPopup) && !(isMobile && mobileActivityOpen)}
                    onClose={() => setSelectedJobPopup(null)}
                    maxWidth="md"
                    fullWidth
                    fullScreen={!isDesktopLayout}
                    disableScrollLock
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
                                    user={me}
                                    loggedInUser={me}
                                    onClose={() => setSelectedJobPopup(null)}
                                    onDeleted={() => { setSelectedJobPopup(null); setJobsRefreshNonce((n) => n + 1); }}
                                    onApply={(job) => setApplyJobTarget(job)}
                                />
                            </Box>
                        </>
                    )}
                </Dialog>

                {/* ═══════════ Apply to Job Dialog ═══════════ */}
                <ApplyToJobDialog
                    open={Boolean(applyJobTarget)}
                    onClose={() => {
                        setApplyJobTarget(null);
                        // Refresh jobs list so "Applied" badge syncs on cards
                        if (isMine) setJobsRefreshNonce((n) => n + 1);
                    }}
                    job={applyJobTarget}
                    user={me}
                    onApplied={(jobId) => {
                        // Only update applied status — do NOT close the dialog here
                        // so the user can see the success confirmation screen.
                        // The dialog closes when the user clicks "Done" or the X,
                        // which triggers onClose above.
                        setSelectedJobPopup((prev) => prev && String(prev.id) === String(jobId)
                            ? { ...prev, viewerApplied: true, isApplied: true, is_applied: true }
                            : prev
                        );
                    }}
                />

                {/* ═══════════ Service Detail Popup (skip when mobile activity shell handles it) ═══════════ */}
                <ServicePopupDialog
                    service={selectedServicePopup}
                    open={Boolean(selectedServicePopup) && !(isMobile && mobileActivityOpen)}
                    onClose={() => { setSelectedServicePopup(null); setSelectedServicePopupTab(0); setHighlightReviewId(null); setHighlightReviewerId(null); }}
                    user={me}
                    initialTab={selectedServicePopupTab}
                    highlightReviewId={highlightReviewId}
                    highlightReviewerId={highlightReviewerId}
                    onMessage={handleServiceMessage}
                    onFavoriteChange={(svc, { favorited, favoritesCount }) => {
                        const svcId = String(svc?.id || '');
                        if (!svcId) return;
                        // Update the popup's service object
                        setSelectedServicePopup((prev) => prev ? {
                            ...prev,
                            isFavorited: favorited,
                            is_favorited: favorited,
                            favoritesCount,
                            favorites_count: favoritesCount,
                        } : prev);
                        // Update the profile services list so cards sync
                        setProfileServices((prev) =>
                            prev.map((item) =>
                                String(item.id || item.service_id) !== svcId ? item : {
                                    ...item,
                                    isFavorited: favorited,
                                    is_favorited: favorited,
                                    favoritesCount,
                                    favorites_count: favoritesCount,
                                }
                            )
                        );
                    }}
                />

                {/* ═══════════ Service Request Detail Popup (skip when mobile activity shell handles it) ═══════════ */}
                <ServiceRequestDetailPopup
                    request={selectedRequestPopup}
                    open={Boolean(selectedRequestPopup) && !(isMobile && mobileActivityOpen)}
                    onClose={() => {
                        setSelectedRequestPopup(null);
                        setRequestPopupResponses([]);
                        setRequestPopupResponsesLoading(false);
                        setRequestPopupIsRequester(false);
                        setRequestPopupMyResponse(null);
                    }}
                    user={me}
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
                        setServicesRefreshNonce((n) => n + 1);
                    }}
                    onEdit={(req) => {
                        setEditingRequestItem(req);
                        setEditRequestModalOpen(true);
                    }}
                    isDesktopLayout={isDesktopLayout}
                    navigate={navigate}
                    activeAccount={activeAccount}
                />

                {/* ═══════════ Edit Service Request Modal ═══════════ */}
                <CreateServiceRequestModal
                    open={editRequestModalOpen}
                    onClose={() => { setEditRequestModalOpen(false); setEditingRequestItem(null); }}
                    onSuccess={() => {
                        setEditRequestModalOpen(false);
                        setEditingRequestItem(null);
                        setSelectedRequestPopup(null);
                        setServicesRefreshNonce((n) => n + 1);
                    }}
                    editingRequest={editingRequestItem}
                />

                {/* ═══════════ Service Listing Limit Dialog ═══════════ */}
                <Dialog
                    open={serviceLimitDialog.open}
                    onClose={() => setServiceLimitDialog({ open: false, title: '', message: '' })}
                    maxWidth="xs"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 3 } }}
                >
                    <DialogTitle sx={{ fontWeight: 900, fontSize: 17, pb: 0.5, pr: 5 }}>
                        {serviceLimitDialog.title}
                        <IconButton
                            onClick={() => setServiceLimitDialog({ open: false, title: '', message: '' })}
                            sx={{ position: 'absolute', top: 8, right: 8 }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                            {serviceLimitDialog.message}
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button
                            variant="contained"
                            onClick={() => setServiceLimitDialog({ open: false, title: '', message: '' })}
                            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, px: 3, boxShadow: 'none' }}
                        >
                            Got it
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* ═══════════ Business Detail Popup ═══════════ */}
                <Dialog
                    open={Boolean(selectedBusinessPopup)}
                    onClose={() => { setSelectedBusinessPopup(null); setSelectedBusinessPopupTab(0); setHighlightReviewId(null); setHighlightReviewerId(null); }}
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
                    {selectedBusinessPopup && (
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
                                <IconButton size="small" onClick={() => { setSelectedBusinessPopup(null); setSelectedBusinessPopupTab(0); setHighlightReviewId(null); }} aria-label="Close">
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>
                            <Box sx={{ position: 'absolute', top: 48, left: 0, right: 0, bottom: 0, overflowY: 'auto' }}>
                                <BusinessDetailPanel
                                    business={selectedBusinessPopup}
                                    user={me}
                                    initialTab={selectedBusinessPopupTab}
                                    highlightReviewId={highlightReviewId}
                                    highlightReviewerId={highlightReviewerId}
                                    onViewPage={() => {
                                        const slug = selectedBusinessPopup?.slug;
                                        if (slug) navigate(`/${slug}`);
                                    }}
                                />
                            </Box>
                        </>
                    )}
                </Dialog>

                {/* ═══════════ Marketplace Listing Detail Popup (skip when mobile activity shell handles it) ═══════════ */}
                <ListingDetailDialog
                    listingId={selectedListingId}
                    open={Boolean(selectedListingId) && !(isMobile && mobileActivityOpen)}
                    onClose={handleListingDetailClose}
                    user={me}
                    onMessage={handleListingContact}
                    onEdit={(listing) => { setEditingListing(listing); setCreateListingOpen(true); }}
                    initialTab={highlightReviewId ? 1 : undefined}
                    highlightReviewId={highlightReviewId}
                    highlightReviewerId={highlightReviewerId}
                    isDesktopLayout={isDesktopLayout}
                />

                {/* ═══════════ Seller Reviews Popup (skip when mobile activity shell handles it) ═══════════ */}
                <SellerReviewsPopup
                    open={sellerReviewsPopup.open && !(isMobile && mobileActivityOpen)}
                    onClose={() => setSellerReviewsPopup({ open: false, sellerId: null, highlightReviewId: null, highlightReviewerId: null })}
                    sellerId={sellerReviewsPopup.sellerId}
                    highlightReviewId={sellerReviewsPopup.highlightReviewId}
                    highlightReviewerId={sellerReviewsPopup.highlightReviewerId}
                />

                {/* ═══════════ Seller Review Photo Lightbox (for seller info sections) ═══════════ */}
                <Dialog open={sellerRevLbOpen} onClose={() => setSellerRevLbOpen(false)} maxWidth={false} fullWidth={false}
                        fullScreen={isMobile}
                        sx={{ zIndex: (t) => t.zIndex.modal + 30 }}
                        slotProps={{ backdrop: { sx: { bgcolor: (t) => alpha(t.palette.common.black, 0.88) } } }}
                        PaperProps={{ sx: isMobile
                                ? { bgcolor: '#000', m: 0, borderRadius: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }
                                : { bgcolor: 'transparent', boxShadow: 'none', overflow: 'visible', maxWidth: '92vw', maxHeight: '92vh', m: 1, borderRadius: 3, position: 'relative' }
                        }}>
                    <IconButton onClick={() => setSellerRevLbOpen(false)} aria-label="Close" sx={{ position: 'absolute', top: isMobile ? 8 : -44, right: isMobile ? 8 : 0, color: 'common.white', bgcolor: (t) => alpha(t.palette.common.white, 0.15), '&:hover': { bgcolor: (t) => alpha(t.palette.common.white, 0.25) }, zIndex: 10 }}>
                        <CloseRoundedIcon />
                    </IconButton>
                    {sellerRevLbPhotos.length > 1 && <Typography sx={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700, zIndex: 2 }}>{sellerRevLbIndex + 1} / {sellerRevLbPhotos.length}</Typography>}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <Fade in key={sellerRevLbPhotos[sellerRevLbIndex]} timeout={200}>
                            <Box component="img" src={sellerRevLbPhotos[sellerRevLbIndex] || ''} alt="" referrerPolicy="no-referrer" sx={{ maxWidth: isMobile ? '100vw' : '88vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: isMobile ? 0 : 2.5, display: 'block', userSelect: 'none' }} />
                        </Fade>
                        {sellerRevLbIndex > 0 && <IconButton onClick={() => setSellerRevLbIndex(sellerRevLbIndex - 1)} sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'common.white', bgcolor: (t) => alpha(t.palette.common.white, 0.15), '&:hover': { bgcolor: (t) => alpha(t.palette.common.white, 0.25) }, width: 40, height: 40 }}><ChevronLeftRoundedIcon sx={{ fontSize: 28 }} /></IconButton>}
                        {sellerRevLbIndex < sellerRevLbPhotos.length - 1 && <IconButton onClick={() => setSellerRevLbIndex(sellerRevLbIndex + 1)} sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'common.white', bgcolor: (t) => alpha(t.palette.common.white, 0.15), '&:hover': { bgcolor: (t) => alpha(t.palette.common.white, 0.25) }, width: 40, height: 40 }}><ChevronRightRoundedIcon sx={{ fontSize: 28 }} /></IconButton>}
                    </Box>
                    {!isMobile && sellerRevLbPhotos.length > 1 && (
                        <Stack direction="row" spacing={0.75} justifyContent="center" sx={{ mt: 1.5 }}>
                            {sellerRevLbPhotos.map((url, idx) => (
                                <Box key={url} onClick={() => setSellerRevLbIndex(idx)}
                                     sx={{ width: 48, height: 48, borderRadius: 1.5, overflow: 'hidden', cursor: 'pointer', flexShrink: 0, border: '2px solid', borderColor: (t) => idx === sellerRevLbIndex ? t.palette.common.white : alpha(t.palette.common.white, 0.25), opacity: idx === sellerRevLbIndex ? 1 : 0.6, transition: 'all 150ms ease', '&:hover': { opacity: 1 } }}>
                                    <Box component="img" src={url} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                </Box>
                            ))}
                        </Stack>
                    )}
                </Dialog>

                {/* ═══════════ Photo Comments Popup (Avatar / Cover / Gallery) ═══════════ */}
                <PhotoCommentsDialog
                    open={photoCommentsOpen}
                    onClose={() => { setPhotoCommentsOpen(false); setPhotoCommentsPhotoId(null); setPhotoCommentsPhotoUrl(null); setPhotoCommentsHighlightId(null); }}
                    profileHandleOrId={profileHandleOrId}
                    viewerId={me?.id || 0}
                    isOwner={!!isMine}
                    highlightCommentId={photoCommentsHighlightId}
                    photoType={photoCommentsType === 'gallery' ? undefined : photoCommentsType}
                    photoId={photoCommentsType === 'gallery' ? photoCommentsPhotoId : undefined}
                    photoUrl={photoCommentsType === 'gallery' ? photoCommentsPhotoUrl : undefined}
                    onSuccess={showSuccess}
                    onReportPhoto={handlePhotoReportOpen}
                />

                {/* ═══════════ Simple Gallery Lightbox (no comments) ═══════════ */}
                {(() => {
                    const lbPhotos = galleryPhotos.filter((p) => p && p.url);
                    if (lbPhotos.length === 0) return null;
                    const lbIdx = Math.min(galleryLightboxIdx, lbPhotos.length - 1);
                    return (
                        <Dialog
                            open={galleryLightboxOpen}
                            onClose={() => setGalleryLightboxOpen(false)}
                            maxWidth={false}
                            fullScreen={isMobile}
                            sx={{ zIndex: (t) => t.zIndex.modal + 20 }}
                            PaperProps={{
                                sx: isMobile
                                    ? { bgcolor: '#000', m: 0, borderRadius: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }
                                    : { bgcolor: 'rgba(0,0,0,0.92)', borderRadius: 3, maxWidth: '90vw', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
                            }}
                        >
                            <IconButton
                                onClick={() => setGalleryLightboxOpen(false)}
                                sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2, color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}
                            >
                                <CloseIcon />
                            </IconButton>
                            {/* Report photo button — non-owners only */}
                            {!isMine && (
                                <IconButton
                                    aria-label="Report photo"
                                    onClick={() => {
                                        const photo = lbPhotos[lbIdx];
                                        handlePhotoReportOpen('gallery', photo?.url, photo?.id || photo?.photo_id || null);
                                    }}
                                    sx={{ position: 'absolute', top: 8, right: 52, zIndex: 2, color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}
                                >
                                    <FlagOutlinedIcon />
                                </IconButton>
                            )}
                            {lbPhotos.length > 1 && (
                                <>
                                    <Typography sx={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700, zIndex: 2 }}>
                                        {lbIdx + 1} / {lbPhotos.length}
                                    </Typography>
                                    <IconButton onClick={() => setGalleryLightboxIdx((i) => (i - 1 + lbPhotos.length) % lbPhotos.length)} sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
                                        <ChevronLeftRoundedIcon />
                                    </IconButton>
                                    <IconButton onClick={() => setGalleryLightboxIdx((i) => (i + 1) % lbPhotos.length)} sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
                                        <ChevronRightRoundedIcon />
                                    </IconButton>
                                </>
                            )}
                            <Box
                                component="img"
                                src={lbPhotos[lbIdx]?.url}
                                alt={`Photo ${lbIdx + 1}`}
                                sx={{ maxWidth: isMobile ? '100vw' : '85vw', maxHeight: isMobile ? '80vh' : '80vh', objectFit: 'contain', userSelect: 'none' }}
                            />
                        </Dialog>
                    );
                })()}

                {/* UserCardPopover — portaled, works across all tabs including mobile activity */}
                <UserCardPopover
                    anchorEl={userAnchor}
                    onClose={() => setUserAnchor(null)}
                    user={userForCard}
                    isSelf={!!(me && me.handle === userForCard?.handle)}
                    following={false}
                    onFollow={() => {}}
                    onMessage={() =>
                        window.dispatchEvent(new CustomEvent('open-message-center', { detail: { userId: userForCard?.id } }))
                    }
                    onViewProfile={(u) => {
                        setUserAnchor(null);
                        navigate(`/${u.handle || u.id}`);
                    }}
                />

                {/* Quick message dialog */}
                <UserQuickMessageDialog
                    open={quickMsgOpen}
                    onClose={() => setQuickMsgOpen(false)}
                    onSent={() => setQuickMsgOpen(false)}
                    recipient={profile ? {
                        type: 'personal',
                        id: profile.id,
                        name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.handle || 'User',
                        avatar_url: profile.avatar_url || profile.profile_picture || null,
                        handle: profile.handle,
                    } : null}
                />
            </Box>
        </Fade>
    );
}


/* ═══════════════════════════════════════════════════════════════════════════
   SERVICE REQUEST DETAIL POPUP
   Mirrors the ServicesPage request detail panel layout exactly:
   — Header with avatar, name, category chip, 3-dot menu
   — Title
   — Action buttons (Mark as Filled / View Request Page / Share)
   — Tabs: About | Photos | Responses
   — About: location, status, timeline, posted, contact, description, budget
   — Photos: gallery grid
   — Responses: response cards with accept/decline
   ═══════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════════
   EmbeddedSellerReviews — inline panel for the MobileActivityShell detail view.
   Self-contained: fetches seller info + reviews by sellerId, renders identically
   to SellerReviewsPopup, and auto-scrolls to the highlighted review.
   ═══════════════════════════════════════════════════════════════════════════ */
function EmbeddedSellerReviews({ sellerId, highlightReviewId, highlightReviewerId, profileUser }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [seller, setSeller] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({ avgRating: null, totalCount: 0 });
    const [sellerStats, setSellerStats] = useState({ totalListings: 0, soldListings: 0, activeListings: 0 });
    const containerRef = useRef(null);

    useEffect(() => {
        if (!sellerId) return;
        let alive = true;
        setLoading(true);
        (async () => {
            try {
                const [sellerRes, reviewsRes] = await Promise.all([
                    axios.get(`/api/users/public/${sellerId}`, { withCredentials: true }).catch(() => null),
                    axios.get(`/api/marketplace/sellers/${sellerId}/reviews`, { params: { limit: 50 }, withCredentials: true }).catch(() => null),
                ]);
                if (!alive) return;
                setSeller(sellerRes?.data?.profile || sellerRes?.data?.user || sellerRes?.data || null);
                setReviews(Array.isArray(reviewsRes?.data?.reviews) ? reviewsRes.data.reviews : []);
                setStats({ avgRating: reviewsRes?.data?.avgRating ?? null, totalCount: reviewsRes?.data?.totalCount ?? 0 });
                const ss = reviewsRes?.data?.sellerStats;
                if (ss) setSellerStats({ totalListings: Number(ss.totalListings || 0), soldListings: Number(ss.soldListings || 0), activeListings: Number(ss.activeListings || 0) });
            } catch {
                if (alive) { setSeller(null); setReviews([]); }
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [sellerId]);

    // Scroll to highlighted review after data loads
    useEffect(() => {
        if ((!highlightReviewId && !highlightReviewerId) || loading || reviews.length === 0) return;
        const timer = setTimeout(() => {
            const root = containerRef.current;
            if (!root) return;
            let el = highlightReviewId ? root.querySelector(`[data-seller-embed-review-id="${highlightReviewId}"]`) : null;
            if (!el && highlightReviewerId) {
                const allRevs = root.querySelectorAll('[data-seller-embed-review-id]');
                for (const r of allRevs) {
                    if (r.getAttribute('data-seller-embed-reviewer-id') === String(highlightReviewerId)) { el = r; break; }
                }
            }
            if (el) {
                let scrollParent = el.parentElement;
                while (scrollParent && scrollParent !== document.body) {
                    const style = window.getComputedStyle(scrollParent);
                    if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && scrollParent.scrollHeight > scrollParent.clientHeight + 2) break;
                    scrollParent = scrollParent.parentElement;
                }
                if (scrollParent && scrollParent !== document.body) {
                    const containerRect = scrollParent.getBoundingClientRect();
                    const elRect = el.getBoundingClientRect();
                    const scrollTop = scrollParent.scrollTop + (elRect.top - containerRect.top) - (containerRect.height / 2) + (elRect.height / 2);
                    scrollParent.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' });
                } else {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [highlightReviewId, highlightReviewerId, loading, reviews.length]);

    const sellerName = seller ? [seller.first_name, seller.last_name].filter(Boolean).join(' ') || seller.handle || 'Seller' : 'Seller';
    const sellerAvatar = seller?.profile_picture || seller?.avatar_url || '';
    const sellerHandle = seller?.handle || '';

    // Review photo lightbox
    const [embedLbOpen, setEmbedLbOpen] = useState(false);
    const [embedLbPhotos, setEmbedLbPhotos] = useState([]);
    const [embedLbIndex, setEmbedLbIndex] = useState(0);
    const openEmbedLb = (photos, index) => { setEmbedLbPhotos(photos); setEmbedLbIndex(index); setEmbedLbOpen(true); };

    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => { const s = Math.round(Number(r.rating) || 0); if (s >= 1 && s <= 5) ratingCounts[s]++; });
    const maxCount = Math.max(1, ...Object.values(ratingCounts));

    return (
        <>
            <Box ref={containerRef} sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', px: 2, py: 2 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
                ) : (
                    <>
                        {/* ── Seller card ── */}
                        <Box sx={(t) => ({ p: 1.5, borderRadius: 2.5, border: '1px solid', borderColor: alpha(t.palette.text.primary, 0.06), bgcolor: alpha(t.palette.text.primary, 0.015), mb: 1.5 })}>
                            <Stack direction="row" spacing={1.25} alignItems="flex-start">
                                <Avatar src={sellerAvatar || undefined} alt={sellerName}
                                        sx={(t) => ({ width: 48, height: 48, border: `2px solid ${alpha(t.palette.text.primary, 0.06)}`, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main, cursor: sellerHandle ? 'pointer' : 'default' })}
                                        onClick={() => { if (sellerHandle) navigate(`/${sellerHandle}`); }}>
                                    <PersonRoundedIcon sx={{ fontSize: 26 }} />
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 800, fontSize: 14, cursor: sellerHandle ? 'pointer' : 'default', '&:hover': sellerHandle ? { textDecoration: 'underline' } : {} }}
                                                onClick={() => { if (sellerHandle) navigate(`/${sellerHandle}`); }}>
                                        {sellerName}
                                    </Typography>
                                    {sellerHandle && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>@{sellerHandle}</Typography>}
                                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                                        {stats.avgRating !== null ? (
                                            <>
                                                <Rating value={stats.avgRating} precision={0.1} readOnly size="small"
                                                        icon={<StarRoundedIcon sx={{ fontSize: 14 }} />} emptyIcon={<StarRoundedIcon sx={{ fontSize: 14 }} />}
                                                        sx={{ '& .MuiRating-icon': { fontSize: 14 } }} />
                                                <Typography variant="caption" sx={{ fontWeight: 800, fontSize: 11 }}>{stats.avgRating}</Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5 }}>({stats.totalCount})</Typography>
                                            </>
                                        ) : (
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5 }}>No reviews yet</Typography>
                                        )}
                                    </Stack>
                                </Box>
                            </Stack>
                        </Box>

                        {/* ── Listing stats badges ── */}
                        {(sellerStats.totalListings > 0 || sellerStats.soldListings > 0 || sellerStats.activeListings > 0) && (
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0.75, mb: 1.5 }}>
                                <Box sx={(t) => ({ p: 1, borderRadius: 2, border: '1px solid', borderColor: alpha(t.palette.text.primary, 0.08), bgcolor: alpha(t.palette.primary.main, 0.04), textAlign: 'center' })}>
                                    <Typography sx={{ fontWeight: 900, fontSize: 16, color: 'primary.main', lineHeight: 1.2 }}>{sellerStats.totalListings}</Typography>
                                    <Typography sx={{ fontSize: 9.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Total Listings</Typography>
                                </Box>
                                <Box sx={(t) => ({ p: 1, borderRadius: 2, border: '1px solid', borderColor: alpha(t.palette.success.main, 0.12), bgcolor: alpha(t.palette.success.main, 0.04), textAlign: 'center' })}>
                                    <Typography sx={{ fontWeight: 900, fontSize: 16, color: 'success.main', lineHeight: 1.2 }}>{sellerStats.soldListings}</Typography>
                                    <Typography sx={{ fontSize: 9.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Sold</Typography>
                                </Box>
                                <Box sx={(t) => ({ p: 1, borderRadius: 2, border: '1px solid', borderColor: alpha(t.palette.info.main, 0.12), bgcolor: alpha(t.palette.info.main, 0.04), textAlign: 'center' })}>
                                    <Typography sx={{ fontWeight: 900, fontSize: 16, color: 'info.main', lineHeight: 1.2 }}>{sellerStats.activeListings}</Typography>
                                    <Typography sx={{ fontSize: 9.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Active</Typography>
                                </Box>
                            </Box>
                        )}

                        {/* ── Reviews header ── */}
                        <Typography sx={{ fontWeight: 900, fontSize: 10.5, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'text.secondary', mb: 1 }}>
                            Seller Reviews {stats.totalCount > 0 ? `(${stats.totalCount})` : ''}
                        </Typography>

                        {/* ── Rating breakdown histogram ── */}
                        {reviews.length > 0 && stats.avgRating !== null && (
                            <Box sx={{ mb: 2 }}>
                                <Stack direction="row" spacing={2} alignItems="flex-start">
                                    <Box sx={{ textAlign: 'center', minWidth: 72 }}>
                                        <Typography sx={{ fontWeight: 900, fontSize: '2rem', lineHeight: 1 }}>
                                            {(stats.avgRating || 0).toFixed(1)}
                                        </Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.25 }}>
                                            <Rating value={stats.avgRating || 0} precision={0.5} readOnly size="small" sx={{ '& .MuiRating-icon': { fontSize: 14 } }} />
                                        </Box>
                                        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 700, mt: 0.25 }}>
                                            {stats.totalCount} review{stats.totalCount !== 1 ? 's' : ''}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        {[5, 4, 3, 2, 1].map((star) => (
                                            <Stack key={star} direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.25 }}>
                                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, width: 10, textAlign: 'right' }}>{star}</Typography>
                                                <Rating value={1} max={1} readOnly size="small" sx={{ '& .MuiRating-icon': { fontSize: 12 } }} />
                                                <Box sx={(t) => ({ flex: 1, height: 8, borderRadius: 4, bgcolor: alpha(t.palette.divider, 0.3), overflow: 'hidden' })}>
                                                    <Box sx={{ width: `${(ratingCounts[star] / maxCount) * 100}%`, height: '100%', borderRadius: 4, bgcolor: 'secondary.main', transition: 'width 400ms ease' }} />
                                                </Box>
                                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: 'text.secondary', width: 20, textAlign: 'right' }}>{ratingCounts[star]}</Typography>
                                            </Stack>
                                        ))}
                                    </Box>
                                </Stack>
                            </Box>
                        )}

                        {/* ── Review cards ── */}
                        {reviews.length > 0 ? (
                            <Stack spacing={0}>
                                {reviews.map((rev, idx) => {
                                    const revName = rev.reviewer_name || rev.reviewer?.name || [rev.reviewer_first_name, rev.reviewer_last_name].filter(Boolean).join(' ') || 'User';
                                    const revHandle = rev.reviewer_handle || rev.reviewer?.handle || '';
                                    const revAvatar = rev.reviewer_avatar || rev.reviewer?.avatarUrl || '';
                                    const revDate = rev.created_at || rev.createdAt;
                                    const revDateStr = revDate ? (() => {
                                        const d = new Date(revDate);
                                        if (Number.isNaN(d.getTime())) return '';
                                        const diffMs = Date.now() - d.getTime();
                                        const diffH = Math.floor(diffMs / 3600000);
                                        if (diffH < 1) return 'Just now';
                                        if (diffH < 24) return `${diffH}h ago`;
                                        const diffD = Math.floor(diffH / 24);
                                        if (diffD < 7) return `${diffD}d ago`;
                                        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                    })() : '';
                                    const revReviewerId = rev.reviewer_id || rev.reviewer?.id;
                                    const isHl = (highlightReviewId && Number(rev.id) === Number(highlightReviewId)) ||
                                        (highlightReviewerId && revReviewerId && Number(revReviewerId) === Number(highlightReviewerId));
                                    const revPhotos = rev.photo_urls || rev.photoUrls || [];

                                    return (
                                        <Box key={rev.id || idx} data-seller-embed-review-id={rev.id} data-seller-embed-reviewer-id={revReviewerId || ''}
                                             sx={(t) => {
                                                 const brass = t.custom?.brand?.brass || '#A87822';
                                                 return {
                                                     py: isHl ? 2 : 1.5,
                                                     px: isHl ? 1.5 : 0,
                                                     ...(isHl ? {
                                                         borderRadius: 2.5,
                                                         border: '2px solid',
                                                         borderColor: `${alpha(brass, 0.45)} !important`,
                                                         bgcolor: alpha(brass, 0.06),
                                                         boxShadow: `0 0 16px ${alpha(brass, 0.15)}`,
                                                         my: 1,
                                                     } : {
                                                         borderBottom: idx < reviews.length - 1 ? '1px solid' : 'none',
                                                         borderColor: alpha(t.palette.divider, 0.5),
                                                     }),
                                                 };
                                             }}>
                                            <Stack direction="row" spacing={1} alignItems="flex-start">
                                                <Avatar src={revAvatar || undefined} alt={revName}
                                                        sx={(t) => ({ width: 36, height: 36, fontSize: 13, fontWeight: 700, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main })}>
                                                    <PersonRoundedIcon sx={{ fontSize: 18 }} />
                                                </Avatar>
                                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                        <Typography sx={{ fontWeight: 800, fontSize: 13 }}>{revName}</Typography>
                                                        {revHandle && <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>@{revHandle}</Typography>}
                                                        {revDateStr && <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>&middot; {revDateStr}</Typography>}
                                                    </Stack>
                                                    <Rating value={Number(rev.rating) || 0} readOnly size="small"
                                                            icon={<StarRoundedIcon sx={{ fontSize: 15 }} />} emptyIcon={<StarRoundedIcon sx={{ fontSize: 15 }} />}
                                                            sx={{ mt: 0.25, '& .MuiRating-icon': { fontSize: 15 } }} />
                                                    {(rev.comment || rev.body) && (
                                                        <Typography variant="body2" sx={{ mt: 0.5, fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word' }}>
                                                            {rev.comment || rev.body}
                                                        </Typography>
                                                    )}
                                                    {revPhotos.length > 0 && (
                                                        <Stack direction="row" spacing={0.75} sx={{ mt: 1, overflowX: 'auto', pb: 0.5, '&::-webkit-scrollbar': { height: 4 }, '&::-webkit-scrollbar-thumb': { borderRadius: 2, bgcolor: (t) => alpha(t.palette.common.black, 0.12) } }}>
                                                            {revPhotos.slice(0, 4).map((url, pi) => (
                                                                <Box key={pi} onClick={() => openEmbedLb(revPhotos, pi)}
                                                                     sx={{ position: 'relative', width: 76, height: 76, flexShrink: 0, borderRadius: 2, overflow: 'hidden', cursor: 'pointer', border: '1px solid', borderColor: 'divider', '&:hover img': { transform: 'scale(1.05)' }, '&:hover .ll-rv-zoom': { opacity: 1 }, '&:hover': { boxShadow: (t) => t.custom?.shadows?.xs || '0 1px 4px rgba(0,0,0,0.1)' } }}>
                                                                    <Box component="img" src={url} alt={`Review photo ${pi + 1}`} referrerPolicy="no-referrer"
                                                                         sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 250ms ease' }} />
                                                                    <Box className="ll-rv-zoom" sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: (t) => alpha(t.palette.common.black, 0.35), opacity: 0, transition: 'opacity 200ms ease', pointerEvents: 'none' }}>
                                                                        <ZoomInRoundedIcon sx={{ color: 'common.white', fontSize: 18 }} />
                                                                    </Box>
                                                                </Box>
                                                            ))}
                                                        </Stack>
                                                    )}
                                                    {rev.listingTitle && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: 11, fontStyle: 'italic' }}>
                                                            Re: {rev.listingTitle}
                                                        </Typography>
                                                    )}
                                                    {(rev.seller_reply || rev.sellerReply) && (() => {
                                                        const rpName = rev.reply_by_name || sellerName;
                                                        const rpHandle = rev.reply_by_handle || sellerHandle;
                                                        const rpAvatar = rev.reply_by_avatar || sellerAvatar;
                                                        const rpPhotos = Array.isArray(rev.reply_photo_urls) ? rev.reply_photo_urls.filter(Boolean) : [];
                                                        return (
                                                            <Box sx={(t) => ({ mt: 1.5, ml: 1, pl: 1.5, py: 1, borderLeft: '3px solid', borderColor: t.palette.primary.main, bgcolor: alpha(t.palette.primary.main, 0.04), borderRadius: '0 8px 8px 0' })}>
                                                                <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 0.75 }}>
                                                                    <Avatar src={rpAvatar || undefined} sx={(t) => ({ width: 28, height: 28, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main, mt: 0.1, flexShrink: 0 })}>
                                                                        <PersonRoundedIcon sx={{ fontSize: 15 }} />
                                                                    </Avatar>
                                                                    <Box sx={{ minWidth: 0 }}>
                                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                                            <Typography sx={{ fontWeight: 800, fontSize: 11.5, color: 'primary.dark', lineHeight: 1.3 }}>{rpName}</Typography>
                                                                            <Chip label="Seller" size="small" sx={{ height: 16, fontSize: 9, fontWeight: 800, bgcolor: 'primary.main', color: 'common.white', '& .MuiChip-label': { px: 0.6 } }} />
                                                                        </Stack>
                                                                        {rpHandle && (
                                                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5, lineHeight: 1.2, display: 'block' }}>@{rpHandle}</Typography>
                                                                        )}
                                                                    </Box>
                                                                </Stack>
                                                                <Typography variant="body2" sx={{ fontSize: 12.5, lineHeight: 1.45, color: 'text.secondary', pl: 4.5 }}>
                                                                    {rev.seller_reply || rev.sellerReply}
                                                                </Typography>
                                                                {rpPhotos.length > 0 && (
                                                                    <Stack direction="row" spacing={0.75} sx={{ mt: 1, pl: 4.5, overflowX: 'auto', pb: 0.5 }}>
                                                                        {rpPhotos.map((url, ri) => (
                                                                            <Box key={ri} onClick={() => openEmbedLb(rpPhotos, ri)}
                                                                                 sx={{ position: 'relative', width: 64, height: 64, flexShrink: 0, borderRadius: 2, overflow: 'hidden', cursor: 'pointer', border: '1px solid', borderColor: 'divider', '&:hover img': { transform: 'scale(1.05)' }, '&:hover .ll-rv-zoom': { opacity: 1 } }}>
                                                                                <Box component="img" src={url} alt="" referrerPolicy="no-referrer"
                                                                                     sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 250ms ease' }} />
                                                                                <Box className="ll-rv-zoom" sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: (t) => alpha(t.palette.common.black, 0.35), opacity: 0, transition: 'opacity 200ms ease', pointerEvents: 'none' }}>
                                                                                    <ZoomInRoundedIcon sx={{ color: 'common.white', fontSize: 16 }} />
                                                                                </Box>
                                                                            </Box>
                                                                        ))}
                                                                    </Stack>
                                                                )}
                                                            </Box>
                                                        );
                                                    })()}
                                                </Box>
                                            </Stack>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <ReviewsRoundedIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                                <Typography color="text.secondary" sx={{ fontSize: '0.82rem' }}>No reviews yet.</Typography>
                            </Box>
                        )}
                    </>
                )}
            </Box>

            {/* Review photo lightbox */}
            <Dialog open={embedLbOpen} onClose={() => setEmbedLbOpen(false)} maxWidth={false} fullWidth={false}
                    fullScreen={typeof window !== 'undefined' && window.innerWidth < 900}
                    sx={{ zIndex: (t) => t.zIndex.modal + 30 }}
                    slotProps={{ backdrop: { sx: { bgcolor: (t) => alpha(t.palette.common.black, 0.88) } } }}
                    PaperProps={{ sx: (typeof window !== 'undefined' && window.innerWidth < 900)
                            ? { bgcolor: '#000', m: 0, borderRadius: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }
                            : { bgcolor: 'transparent', boxShadow: 'none', overflow: 'visible', maxWidth: '92vw', maxHeight: '92vh', m: 1, borderRadius: 3, position: 'relative' }
                    }}>
                <IconButton onClick={() => setEmbedLbOpen(false)} aria-label="Close" sx={{ position: 'absolute', top: 8, right: 8, color: 'common.white', bgcolor: (t) => alpha(t.palette.common.white, 0.15), '&:hover': { bgcolor: (t) => alpha(t.palette.common.white, 0.25) }, zIndex: 10 }}>
                    <CloseRoundedIcon />
                </IconButton>
                {embedLbPhotos.length > 1 && <Typography sx={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700, zIndex: 2 }}>{embedLbIndex + 1} / {embedLbPhotos.length}</Typography>}
                {embedLbPhotos[embedLbIndex] && <Box component="img" src={embedLbPhotos[embedLbIndex]} alt="" referrerPolicy="no-referrer" sx={{ maxWidth: '88vw', maxHeight: '80vh', objectFit: 'contain', display: 'block', userSelect: 'none' }} />}
                {embedLbPhotos.length > 1 && embedLbIndex > 0 && <IconButton onClick={() => setEmbedLbIndex(embedLbIndex - 1)} sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'common.white', bgcolor: (t) => alpha(t.palette.common.white, 0.15), '&:hover': { bgcolor: (t) => alpha(t.palette.common.white, 0.25) } }}><ChevronLeftRoundedIcon /></IconButton>}
                {embedLbPhotos.length > 1 && embedLbIndex < embedLbPhotos.length - 1 && <IconButton onClick={() => setEmbedLbIndex(embedLbIndex + 1)} sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'common.white', bgcolor: (t) => alpha(t.palette.common.white, 0.15), '&:hover': { bgcolor: (t) => alpha(t.palette.common.white, 0.25) } }}><ChevronRightRoundedIcon /></IconButton>}
            </Dialog>
        </>
    );
}

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
                                       onShare,
                                       showSuccess: showSuccessExternal,
                                   }) {
    const { isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId, accountCacheKey } = useActiveAccount();
    const [detailTab, setDetailTab] = React.useState(0);
    const [deleteLoading, setDeleteLoading] = React.useState(false);
    const [toast, setToast] = React.useState('');
    const [confirmDialog, setConfirmDialog] = React.useState(null);
    const [confirmLoading, setConfirmLoading] = React.useState(false);
    const [descExpanded, setDescExpanded] = React.useState(false);
    const [acting, setActing] = React.useState(false);
    const [respondModalOpen, setRespondModalOpen] = React.useState(false);

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

        const reqBusinessId = request.requesterBusinessId || request.requester_business_id || request.businessId || request.business_id || null;
        const reqArtistId = request.requesterArtistId || request.requester_artist_id || request.artistId || request.artist_id || null;
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
            setRespondModalOpen(false);
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
                                {catInfo && (
                                    <Chip size="small" icon={catInfo.Icon ? <catInfo.Icon sx={{ fontSize: 13 }} /> : undefined} label={catInfo.name}
                                          sx={(t) => ({ height: 24, borderRadius: 999, fontWeight: 800, fontSize: 10.5, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main, border: '1px solid', borderColor: alpha(t.palette.primary.main, 0.2), '& .MuiChip-icon': { color: t.palette.primary.main } })} />
                                )}
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

                        {/* ─── Full-width action buttons ─── */}
                        <Divider sx={{ mt: 1.5 }} />
                        <Stack direction="row" spacing={1} sx={{ pt: 1.5, pb: 1 }}>
                            {effectiveIsRequester && (
                                <Button
                                    variant={isFilled ? 'outlined' : 'contained'}
                                    color={isFilled ? 'inherit' : 'success'}
                                    fullWidth
                                    startIcon={isFilled ? <LockOpenRoundedIcon sx={{ fontSize: '18px !important' }} /> : <CheckCircleRoundedIcon sx={{ fontSize: '18px !important' }} />}
                                    onClick={handleCloseRequest}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 900, py: 1, fontSize: '0.85rem' }}
                                >
                                    {isFilled ? 'Reopen' : 'Mark as Filled'}
                                </Button>
                            )}
                            {!effectiveIsRequester && !isFilled && request.status === 'open' && !myResponse && (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    startIcon={<SendRoundedIcon sx={{ fontSize: '18px !important' }} />}
                                    onClick={() => setRespondModalOpen(true)}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 900, py: 1, fontSize: '0.85rem' }}
                                >
                                    Respond to Request
                                </Button>
                            )}
                            {!effectiveIsRequester && myResponse && (
                                <Button
                                    variant="outlined"
                                    color={myResponse.status === 'accepted' ? 'success' : myResponse.status === 'declined' ? 'error' : 'warning'}
                                    fullWidth
                                    disabled
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 900, py: 1, fontSize: '0.85rem' }}
                                >
                                    {myResponse.status === 'accepted' ? 'Response Accepted!' : myResponse.status === 'declined' ? 'Response Declined' : 'Response Pending'}
                                </Button>
                            )}
                            <Button variant="outlined" fullWidth startIcon={<OpenInNewRoundedIcon sx={{ fontSize: '18px !important' }} />}
                                    onClick={() => { onClose(); navigate(`/services/requests/${request.id}`); }}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 900, py: 1, fontSize: '0.85rem', borderColor: 'divider', color: 'text.primary', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}>
                                View Request Page
                            </Button>
                            <Button variant="outlined" fullWidth startIcon={<ShareRoundedIcon sx={{ fontSize: '18px !important' }} />}
                                    onClick={() => { if (typeof onShare === 'function') onShare(request); else handleCopyLink(); }}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 900, py: 1, fontSize: '0.85rem', borderColor: 'divider', color: 'text.primary', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}>
                                Share
                            </Button>
                        </Stack>

                        {/* ─── Sticky Tabs ─── */}
                        <Box sx={{ position: 'sticky', top: 0, zIndex: 10, bgcolor: 'background.paper', pt: 1.25, pb: 0.5 }}>
                            <Divider />
                            <Tabs value={detailTab} onChange={(_e, v) => setDetailTab(v)} variant="fullWidth"
                                  sx={(t) => ({
                                      minHeight: 38, flexShrink: 0, borderRadius: 0, padding: 0, backgroundColor: 'transparent', border: 'none', boxShadow: 'none',
                                      borderBottom: '1px solid', borderColor: alpha(t.palette.text.primary, 0.08),
                                      '& .MuiTab-root': { minHeight: 38, textTransform: 'none', fontWeight: 700, fontSize: 13.5, letterSpacing: '-0.01em', py: 0, px: 1, minWidth: 0, borderRadius: 0, gap: 0.25, color: t.palette.text.secondary, '&:hover': { color: t.palette.text.primary } },
                                      '& .Mui-selected': { color: `${t.palette.primary.main} !important`, fontWeight: 950 },
                                      '& .MuiTabs-indicator': { bgcolor: t.palette.primary.main, height: 2.5, borderRadius: 0 },
                                  })}>
                                <Tab icon={<DescriptionRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="About" value={0} />
                                <Tab icon={<PhotoLibraryRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start"
                                     label={`Photos${photos.length > 0 ? ` (${photos.length})` : ''}`} value={1} />
                                {effectiveIsRequester && (
                                    <Tab icon={<ChatBubbleOutlineRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start"
                                         label={`Responses${sortedResponses.length > 0 ? ` (${sortedResponses.length})` : ''}`} value={2} />
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

                                {/* ── Non-owner: "Your Response" display ── */}
                                {!effectiveIsRequester && myResponse && (
                                    <Box sx={(t) => ({
                                        p: 2, borderRadius: 2.5, border: '1px solid',
                                        borderColor: myResponse.status === 'accepted' ? alpha(t.palette.success.main, 0.25) : myResponse.status === 'declined' ? alpha(t.palette.error.main, 0.2) : alpha(t.palette.primary.main, 0.12),
                                        bgcolor: myResponse.status === 'accepted' ? alpha(t.palette.success.main, 0.04) : t.palette.background.paper,
                                    })}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography sx={{ fontWeight: 900, fontSize: 14 }}>Your Response</Typography>
                                            <Chip size="small"
                                                  label={myResponse.status === 'accepted' ? 'Accepted!' : myResponse.status === 'declined' ? 'Declined' : 'Pending Review'}
                                                  color={myResponse.status === 'accepted' ? 'success' : myResponse.status === 'declined' ? 'error' : 'warning'}
                                                  variant={myResponse.status === 'accepted' ? 'filled' : 'outlined'}
                                                  sx={{ height: 22, fontSize: 10.5, fontWeight: 800 }} />
                                        </Box>
                                        <RichTextDisplay html={myResponse.message} sx={{ color: 'text.secondary', mb: 1 }} />
                                        <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ gap: 0.5 }}>
                                            {(myResponse.quoteMin || myResponse.quoteMax || myResponse.quoteType === 'free_estimate') && (
                                                <Chip size="small" icon={<AttachMoneyRoundedIcon sx={{ fontSize: 13 }} />}
                                                      label={myResponse.quoteType === 'free_estimate' ? 'Free Estimate' : myResponse.quoteMin && myResponse.quoteMax ? `$${Number(myResponse.quoteMin).toLocaleString()}–$${Number(myResponse.quoteMax).toLocaleString()}${myResponse.quoteType === 'hourly' ? '/hr' : ''}` : myResponse.quoteMin ? `From $${Number(myResponse.quoteMin).toLocaleString()}` : `Up to $${Number(myResponse.quoteMax).toLocaleString()}`}
                                                      sx={{ height: 22, fontSize: 10.5, fontWeight: 700 }} color="success" variant="outlined" />
                                            )}
                                            {myResponse.estimatedTimeline && (
                                                <Chip size="small" icon={<AccessTimeRoundedIcon sx={{ fontSize: 13 }} />} label={myResponse.estimatedTimeline} sx={{ height: 22, fontSize: 10.5, fontWeight: 700 }} variant="outlined" />
                                            )}
                                        </Stack>
                                        {myResponse.status === 'accepted' && myResponse.requesterContact?.value && (
                                            <Box sx={(t) => ({ mt: 1.5, p: 1.25, borderRadius: 2, bgcolor: alpha(t.palette.success.main, 0.06), border: '1px solid', borderColor: alpha(t.palette.success.main, 0.15) })}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                                    <LockOpenRoundedIcon sx={{ fontSize: 14, color: 'success.main' }} />
                                                    <Typography variant="caption" sx={{ fontWeight: 900, color: 'success.main', textTransform: 'uppercase', fontSize: 10 }}>Requester Contact Info</Typography>
                                                </Box>
                                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
                                                    {myResponse.requesterContact.preference === 'call' ? 'Phone: ' : myResponse.requesterContact.preference === 'email' ? 'Email: ' : 'Preferred: Message '}
                                                    {myResponse.requesterContact.value}
                                                </Typography>
                                            </Box>
                                        )}
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
                                                        <RichTextDisplay html={resp.message} sx={{ color: 'text.secondary', mb: 1 }} />
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
            </Dialog>

            {/* ═══ Respond to Request Modal ═══ */}
            <RespondToRequestModal
                open={respondModalOpen}
                onClose={() => setRespondModalOpen(false)}
                request={request}
                onSuccess={() => {
                    setRespondModalOpen(false);
                    // Reload responses
                    setResponsesLoading(true);
                    fetchRequestResponses(request.id)
                        .then((data) => {
                            setResponses(data.responses || []);
                            setIsRequester(Boolean(data.isRequester));
                            setMyResponse(data.myResponse || null);
                        })
                        .catch(() => {})
                        .finally(() => setResponsesLoading(false));
                }}
            />

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
}

/* ═══════════════════════════════════════════════════════════════════
   USER QUICK MESSAGE DIALOG
   Same pattern as ArtistQuickMessageDialog / BusinessQuickMessageDialog
   ═══════════════════════════════════════════════════════════════════ */

function UserQuickMessageDialog({ open, onClose, onSent, recipient }) {
    const uqmTheme = useTheme();
    const uqmIsMobile = useMediaQuery(uqmTheme.breakpoints.down('md'));
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
                setBody(""); setPhotos([]); setError(""); setCooldown(0); setSuccess(false);
            }, 200);
            return () => clearTimeout(timer);
        }
        if (open && recipient?.id && _isUserMsgLimited(recipient.id)) {
            setLimitReached(true);
        }
    }, [open, recipient?.id]);

    const handleSend = async () => {
        if (!recipient?.id || (!body.trim() && photos.length === 0) || cooldown > 0) return;
        if (_isUserMsgLimited(recipient.id)) { setLimitReached(true); return; }
        setSending(true); setError("");
        try {
            const photoPayload = [];
            for (const p of photos) {
                if (p.file) {
                    try {
                        const ct = p.file.type || "image/jpeg";
                        const sn = `${Date.now()}_msg_${p.file.name || "photo.jpg"}`;
                        const s = await getSignedUploadUrl({ folder: "user/messages", fileName: sn, contentType: ct });
                        if (s?.uploadUrl) { await uploadToSignedUrl({ uploadUrl: s.uploadUrl, file: p.file, contentType: ct }); photoPayload.push({ url: String(s.publicUrl || "").trim(), objectPath: String(s.objectPath || "").trim() }); }
                    } catch { /* skip */ }
                }
            }
            await axios.post("/api/messages/send", {
                recipient_type: "personal", recipient_id: recipient.id, body: body.trim(), photos: photoPayload,
            }, { withCredentials: true, headers: { ...getAccountHeaders() } });
            _trackUserMsg(recipient.id);
            photos.forEach((p) => { if (p?.url && !p._existing) { try { URL.revokeObjectURL(p.url); } catch {} } });
            setPhotos([]); setSuccess(true);
        } catch (err) {
            const status = err?.response?.status; const data = err?.response?.data;
            if (status === 429) {
                const wait = Number(data?.retryAfterSeconds) || 15;
                setError(data?.message || data?.error || "You're sending messages too quickly. Please wait a moment.");
                setCooldown(wait);
                const timer = setInterval(() => { setCooldown(prev => { if (prev <= 1) { clearInterval(timer); setError(""); return 0; } return prev - 1; }); }, 1000);
            } else { setError(data?.message || err?.message || "Failed to send message."); }
        } finally { setSending(false); }
    };

    const handleClose = () => {
        if (sending) return;
        photos.forEach((p) => { if (p?.url && !p._existing) { try { URL.revokeObjectURL(p.url); } catch {} } });
        setPhotos([]); onClose();
    };

    return (
        <>
            <Dialog
                open={open && !limitReached}
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
                fullScreen={uqmIsMobile}
                disableScrollLock
                PaperProps={{ sx: { borderRadius: uqmIsMobile ? 0 : 3, maxHeight: uqmIsMobile ? '100vh' : '85vh', ...(uqmIsMobile && { display: 'flex', flexDirection: 'column' }) } }}
                sx={{ zIndex: (t) => t.zIndex.modal + 20 }}
            >
                <DialogTitle sx={{ pr: 6, ...(uqmIsMobile && { borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }) }}>
                    {!success && (
                        <Typography sx={{ fontWeight: 950, fontSize: 16 }}>Send Message</Typography>
                    )}
                    <IconButton aria-label="Close" onClick={handleClose} disabled={sending}
                                sx={{ position: "absolute", right: 12, top: 12 }}>
                        <CloseRoundedIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={uqmIsMobile ? { flex: 1, overflowY: 'auto', pb: 0, display: 'flex', flexDirection: 'column' } : undefined}>
                    {success ? (
                        <Stack spacing={2} sx={{ py: 2, ...(uqmIsMobile && { flex: 1, justifyContent: 'center' }) }}>
                            <Box sx={{ textAlign: "center" }}>
                                <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 48, color: "success.main", mb: 1 }} />
                                <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 0.5 }}>Message Sent!</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    They'll receive your message and get back to you soon.
                                </Typography>
                            </Box>
                            <Button variant="contained" fullWidth onClick={() => { if (onSent) onSent(); }}
                                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, ...(uqmIsMobile && { py: 1.5, fontSize: '1rem' }) }}>
                                Done
                            </Button>
                        </Stack>
                    ) : (
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: "text.secondary" }}>To:</Typography>
                                <Chip
                                    avatar={
                                        <Avatar src={recipient?.avatar_url || undefined} imgProps={{ referrerPolicy: "no-referrer" }} sx={{ width: 24, height: 24 }}>
                                            <PersonRoundedIcon sx={{ fontSize: 14 }} />
                                        </Avatar>
                                    }
                                    label={recipient?.name || "User"}
                                    sx={{ fontWeight: 700, fontSize: "0.8rem" }}
                                />
                            </Box>
                            <TextField
                                label="Message"
                                placeholder="Write your message..."
                                multiline
                                minRows={uqmIsMobile ? 4 : 5}
                                maxRows={uqmIsMobile ? 8 : 10}
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
                                                 maxPhotos={4} title="Photos (optional)" helperText="Add up to 4 photos."
                                                 addButtonText="Add photos" />
                        </Stack>
                    )}
                </DialogContent>
                {/* Pinned bottom actions */}
                {!success && (
                    <Box sx={{ flexShrink: 0, borderTop: '1px solid', borderColor: 'divider', p: 2, pb: uqmIsMobile ? 'calc(env(safe-area-inset-bottom, 0px) + 16px)' : 2, bgcolor: 'background.paper' }}>
                        {sending && <LinearProgress sx={{ mb: 1.5, borderRadius: 1 }} />}
                        <Stack direction="row" spacing={1.5} justifyContent={uqmIsMobile ? 'stretch' : 'flex-end'}>
                            <Button variant="outlined" onClick={handleClose} disabled={sending}
                                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, ...(uqmIsMobile && { flex: 1, py: 1.4, fontSize: '0.95rem' }) }}>
                                Cancel
                            </Button>
                            <Button variant="contained" onClick={handleSend} disabled={(!body.trim() && photos.length === 0) || sending || cooldown > 0}
                                    startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendRoundedIcon />}
                                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, ...(uqmIsMobile && { flex: 2, py: 1.4, fontSize: '0.95rem' }) }}>
                                {cooldown > 0 ? `Wait ${cooldown}s` : sending ? "Sending\u2026" : "Send Message"}
                            </Button>
                        </Stack>
                    </Box>
                )}
            </Dialog>

            {/* Rate limit reached dialog */}
            <Dialog open={limitReached} onClose={() => { setLimitReached(false); onClose(); }} maxWidth="xs" fullWidth
                    disableScrollLock sx={{ zIndex: (t) => t.zIndex.modal + 20 }} PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogContent sx={{ textAlign: "center", py: 4, px: 3 }}>
                    <AccessTimeRoundedIcon sx={{ fontSize: 48, color: "warning.main", mb: 2 }} />
                    <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 1 }}>Slow down a bit!</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        You've sent several messages to this person recently. Give them a chance to respond before sending more.
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

// src/pages/business/components/BusinessPostCard.jsx
//
// BusinessPostCard
// ----------------
// Condensed business post card that matches BusinessPublicPage styling.
// Shows business avatar, name, handle, timestamp, type badges, deal boxes, and photo grid.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import {
    Alert,
    Box,
    Button,
    Card,
    CardActions,
    Avatar,
    Chip,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    IconButton,
    Link,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Snackbar,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import MobileActionSheet from '../../../components/MobileActionSheet';
import CloseIcon from '@mui/icons-material/Close';

import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CampaignIcon from '@mui/icons-material/Campaign';
import ScheduleIcon from '@mui/icons-material/Schedule';
import VerifiedIcon from '@mui/icons-material/Verified';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LinkIcon from '@mui/icons-material/Link';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';


// Category icons (matching BusinessDirectoryCard)
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

import ActionBar, { ReportDialog } from '../../../components/ActionBar';
import { useAuth } from '../../../components/AuthModalContext';
import { useActiveAccount } from '../../../components/AccountContext';
import { secureFetch } from '../../../utils/secureFetch';
import EditBusinessPostDialog from './EditBusinessPostDialog';
import SuccessSnackbar, { useSuccessSnackbar } from '../../../components/SuccessSnackbar';
import { stripHtml } from '../../../utils/richTextUtils';
import RichTextDisplay from '../../../components/RichTextDisplay';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toNum = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
};

const toBool = (v) => Boolean(v === true || v === 1 || v === '1');

// Category icon + label maps (matching BusinessDirectoryCard)
const BUSINESS_CATEGORY_ICON = {
    food_drink: RestaurantIcon, shopping_retail: StorefrontIcon, automotive: DirectionsCarIcon,
    home_services: HomeRepairServiceIcon, home_garden: YardIcon, health_wellness: MedicalServicesIcon,
    beauty_personal_care: ContentCutIcon, fitness_recreation: FitnessCenterIcon,
    professional_services: BusinessCenterIcon, education_childcare: SchoolIcon,
    pets_animals: PetsIcon, travel_lodging: TravelExploreIcon, arts_entertainment: TheaterComedyIcon,
    community_nonprofit: VolunteerActivismIcon, technology_repair: BuildIcon, other: CategoryIcon,
};
const CATEGORY_LABELS = {
    food_drink: 'Food & Drink', shopping_retail: 'Shopping & Retail', automotive: 'Automotive',
    home_services: 'Home Services', home_garden: 'Home & Garden', health_wellness: 'Health & Wellness',
    beauty_personal_care: 'Beauty & Personal Care', fitness_recreation: 'Fitness & Recreation',
    professional_services: 'Professional Services', education_childcare: 'Education & Childcare',
    pets_animals: 'Pets & Animals', travel_lodging: 'Travel & Lodging', arts_entertainment: 'Arts & Entertainment',
    community_nonprofit: 'Community & Nonprofit', technology_repair: 'Technology & Repair', other: 'Other',
};
function getBizCategoryIcon(key) {
    const k = String(key || '').toLowerCase().replace(/[^a-z_]/g, '');
    return BUSINESS_CATEGORY_ICON[k] || CategoryIcon;
}
function getBizCategoryLabel(key) {
    const k = String(key || '').toLowerCase().replace(/[^a-z_]/g, '');
    return CATEGORY_LABELS[k] || '';
}

// Lantern gold for hover states (matching PostList / EventCard)

function formatRelativeTime(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    let then;
    const dateString = String(dateStr);
    if (dateString.endsWith('Z') || dateString.includes('+') || dateString.includes('T')) {
        then = new Date(dateString);
    } else {
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
    if (diffSec < 0) return 'just now';
    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    if (diffDay < 30) return `${diffWeek}w ago`;
    if (diffMonth >= 1 && diffMonth < 12) return `${diffMonth}mo ago`;
    return then.toLocaleDateString();
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const dateString = String(dateStr);
    let date;
    if (dateString.endsWith('Z') || dateString.includes('+') || dateString.includes('T')) {
        date = new Date(dateString);
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

function extractPhotos(post) {
    if (!post) return [];
    let mediaUrls = [];

    // Try mediaUrl first (JSON array or single string)
    if (post.mediaUrl) {
        try {
            const parsed = JSON.parse(post.mediaUrl);
            mediaUrls = Array.isArray(parsed) ? parsed : [post.mediaUrl];
        } catch {
            mediaUrls = [post.mediaUrl];
        }
    }

    // Fallback to other photo fields
    if (!mediaUrls.length) {
        const fallbacks = [
            post.media_url,
            post.photo_url,
            post.image_url,
            post.coverImage,
            post.cover_image,
        ].filter(Boolean);
        if (fallbacks.length) mediaUrls = fallbacks;
    }

    return mediaUrls.filter((url) => url && typeof url === 'string');
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BusinessPostCard({
                                             post,
                                             user,
                                             hoveredId,
                                             setHoveredId,
                                             selectedId,
                                             selectable = true,
                                             onSelect,
                                             onOpenUserCard,
                                             onLocationClick,
                                             onEditPost,
                                             onDeletePost,
                                             renderBeforeActions = null,
                                             flat = false,
                                         }) {
    const theme = useTheme();
    const isMobileCard = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const authCtx = useAuth();
    const {
        isBusinessAccount,
        isArtistAccount,
        activeBusinessId,
        activeAccount,
        getAccountHeaders,
    } = useActiveAccount();

    const [imgError, setImgError] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const [postMenuEl, setPostMenuEl] = useState(null);
    const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
    const [copyLinkToast, setCopyLinkToast] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [hideBlockToast, setHideBlockToast] = useState('');
    const [hideBusy, setHideBusy] = useState(false);
    const [blockBusy, setBlockBusy] = useState(false);

    useEffect(() => {
        if (!hideBlockToast) return undefined;
        const t = window.setTimeout(() => setHideBlockToast(''), 1800);
        return () => window.clearTimeout(t);
    }, [hideBlockToast]);

    // ── Success confirmation snackbar ──
    const { showSuccess, snackbarProps: successSnackbarProps } = useSuccessSnackbar();

    const postMenuOpen = Boolean(postMenuEl);
    // Guard to prevent mobile ghost-click from triggering onSelect when
    // closing a menu / opening a dialog (e.g. Report). The MUI backdrop
    // teardown can fire a synthetic click on the card underneath.
    // Only active for a brief window right after the menu closes.
    const menuInteractedRef = useRef(false);
    const openPostMenu = useCallback((e) => { e.stopPropagation(); if (isMobileCard) { setMobileSheetOpen(true); } else { setPostMenuEl(e.currentTarget); } }, [isMobileCard]);
    const closePostMenu = useCallback((e) => { if (e) e.stopPropagation(); setPostMenuEl(null); menuInteractedRef.current = true; setTimeout(() => { menuInteractedRef.current = false; }, 300); }, []);

    // ── Leaflet click-away fix ──────────────────────────────────────
    // MUI Menu relies on a document-level ClickAwayListener to close.
    // Leaflet calls L.DomEvent.disableClickPropagation() on its map
    // container, which stops click/mousedown from ever reaching
    // document in the bubbling phase — so inside a Leaflet popup the
    // menu gets permanently stuck open.
    //
    // Fix: while the menu is open, register our own listener on
    // document in the **capture** phase.  Capture runs top-down
    // (document → target) before any bubbling-phase stopPropagation
    // can block it.  If the click lands outside the menu paper we
    // force-close the menu.
    const menuPaperRef = useRef(null);
    useEffect(() => {
        if (!postMenuOpen) return;
        const onPointerDownCapture = (e) => {
            const paper = menuPaperRef.current;
            if (paper && paper.contains(e.target)) return;   // click inside menu
            setPostMenuEl(null);
        };
        // RAF so the opening click itself doesn't immediately close it
        const raf = requestAnimationFrame(() => {
            document.addEventListener('mousedown', onPointerDownCapture, true);
            document.addEventListener('touchstart', onPointerDownCapture, true);
        });
        return () => {
            cancelAnimationFrame(raf);
            document.removeEventListener('mousedown', onPointerDownCapture, true);
            document.removeEventListener('touchstart', onPointerDownCapture, true);
        };
    }, [postMenuOpen]);

    const id = post?.id ?? null;
    const isHovered = hoveredId != null && String(hoveredId) === String(id);
    const isSelected = selectable && selectedId != null && String(selectedId) === String(id);

    // Post data
    const title = post?.title || 'Post';
    const body = stripHtml(post?.body || post?.description || '');
    const rawBodyHtml = post?.body || post?.description || '';
    const bodyHasHtml = /<[a-z][\s\S]*?>/i.test(rawBodyHtml);
    const postType = (post?.type || post?.post_type || 'update').toLowerCase();
    const isDeal = postType === 'deal';

    // Normalize deal fields — API may return snake_case or camelCase
    const discountText = post?.discountText || post?.discount_text || '';
    const validUntil = post?.validUntil || post?.valid_until || '';
    const dealExpired = isDeal && validUntil && isExpired(validUntil);

    // Business info - check all possible field names from API
    // API returns: businessName, businessSlug, businessAvatarUrl
    const businessName = post?.businessName || post?.pageName || post?.business_name || post?.page_name || 'Business';

    // Business handle/slug - API returns businessSlug
    const businessHandle = post?.businessSlug || post?.pageSlug || post?.page_slug || post?.slug || post?.handle || '';

    // Business avatar - API returns businessAvatarUrl (camel) from the business feed/single-post
    // routes; aggregated-activity feeds alias it as business_avatar_url (snake). Include both.
    // Match BusinessPostDetailModal: include account_avatar_url + profile_picture fallbacks
    // and filter out default placeholder avatars so the fallback icon renders instead.
    const rawAvatar = post?.businessAvatarUrl || post?.business_avatar_url || post?.pageAvatar || post?.page_avatar || post?.businessAvatar || post?.account_avatar_url || post?.avatar_url || post?.profile_picture || post?.logo_url || post?.logoUrl || '';
    const hasValidAvatar = (() => {
        if (!rawAvatar || avatarError) return false;
        if (typeof rawAvatar === 'string' && (rawAvatar.includes('default_avatar') || rawAvatar.includes('default_business') || rawAvatar.includes('default_logo'))) return false;
        return true;
    })();

    // Check if the business is verified
    const postIsVerified = Boolean(
        post?.is_verified === true || post?.is_verified === 1 || post?.is_verified === "1" ||
        post?.isVerified === true || post?.isVerified === 1 || post?.isVerified === "1" ||
        post?.businessIsVerified === true || post?.businessIsVerified === 1 || post?.businessIsVerified === "1" ||
        post?.business_is_verified === true || post?.business_is_verified === 1 || post?.business_is_verified === "1"
    );

    const timestamp = post?.createdAt || post?.created_at || post?.publishedAt || post?.published_at || post?.postedAt || post?.posted_at || '';

    // Detect if this post has been edited
    const isEdited = Boolean(
        post?.edited_at || post?.editedAt ||
        post?.has_edits || post?.edits_count || post?.editsCount ||
        (post?.updated_at && post?.created_at && String(post.updated_at) !== String(post.created_at))
    );

    // Edit history dialog state
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyRows, setHistoryRows] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState('');

    const openHistory = useCallback((e) => {
        if (e) e.stopPropagation();
        const pid = post?.id || post?.postId;
        if (!pid) return;
        setHistoryOpen(true);
        setHistoryLoading(true);
        setHistoryError('');
        setHistoryRows([]);
        secureFetch(`/api/business/posts/${encodeURIComponent(pid)}/edits`, {
            credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json' },
        })
            .then((r) => r.ok ? r.json() : Promise.reject(new Error('Failed to load')))
            .then((data) => setHistoryRows(Array.isArray(data) ? data : []))
            .catch((err) => setHistoryError(err?.message || 'Failed to load edit history.'))
            .finally(() => setHistoryLoading(false));
    }, [post]);

    // Post location — backend sends post-level address (NULL if not set) separately
    // from businessAddress (always the business's own address). Only show street address
    // when the post itself has one — never inherit the business's street address.
    const businessAddress = post?.address || '';
    const businessCity = post?.city || post?.businessCity || '';
    const businessCounty = post?.county || post?.businessCounty || '';
    const countyLabel = businessCounty
        ? (String(businessCounty).toLowerCase().includes('county') ? businessCounty : `${businessCounty} County`)
        : '';
    const locationStr = [businessCity, countyLabel].filter(Boolean).join(', ');
    const hasLocation = Boolean(businessAddress || businessCity || businessCounty);

    // Photos
    const photos = extractPhotos(post);
    const mainPhoto = photos[0] || '';
    const showImage = !!mainPhoto && !imgError;

    // Engagement counts
    const likes = toNum(post?.likesCount ?? post?.likes_count ?? post?.like_count ?? post?.likeCount ?? post?.likes, 0);
    const comments = toNum(post?.commentsCount ?? post?.comments_count ?? post?.comment_count ?? post?.commentCount ?? post?.comments, 0);
    const reposts = toNum(post?.repostsCount ?? post?.reposts_count ?? post?.repost_count ?? post?.repostCount ?? post?.reposts, 0);
    const viewerLiked = toBool(post?.viewerLiked ?? post?.viewer_liked ?? post?.liked ?? post?.is_liked);
    const viewerReposted = toBool(post?.viewerReposted ?? post?.viewer_reposted ?? post?.reposted ?? post?.is_reposted);

    // Ownership detection for 3-dot menu
    const viewer = user?.user || user || authCtx?.user || null;
    const viewerAuthed = Boolean(viewer && (viewer.id || viewer.handle));
    const isNonPersonal = isBusinessAccount || isArtistAccount;

    const postAuthorIdRaw = post?.authorUserId ?? post?.author_user_id ?? post?.user_id ?? post?.userId ?? post?.created_by_user_id ?? post?.createdByUserId ?? null;
    const postAuthorId = postAuthorIdRaw != null ? String(postAuthorIdRaw) : '';
    const postBizId = post?.businessId || post?.businessPageId || post?.business_id || post?.business_page_id || post?.pageId || post?.page_id || '';
    const isPostOwner = useMemo(() => {
        const vid = Number(viewer?.id || 0);
        const aid = Number(postAuthorId || 0);
        if (!vid || !aid) return false;
        if (vid !== aid) return false;
        // Business post — user_id match alone is not enough; must be on biz account
        if (postBizId) return false;
        return true;
    }, [viewer?.id, postAuthorId, postBizId]);

    const isActingAsBizOwner = Boolean(isBusinessAccount && activeBusinessId && (
        (postBizId && String(activeBusinessId) === String(postBizId)) ||
        (businessHandle && activeAccount?.slug && String(activeAccount.slug).toLowerCase() === String(businessHandle).toLowerCase()) ||
        (businessHandle && activeAccount?.handle && String(activeAccount.handle).toLowerCase() === String(businessHandle).toLowerCase())
    ));
    const canManagePost = isPostOwner || isActingAsBizOwner;

    // Broader link check — true when the viewer is tied to this business in
    // any way: actively switched in, or their personal user_id matches the
    // owner of the business (exposed by the backend as businessOwnerUserId).
    // Used to gate destructive menu items (Hide posts / Block / Report) so a
    // user can't target their own business from any account.
    const postBizOwnerUserId = Number(
        post?.businessOwnerUserId ||
        post?.business_owner_user_id ||
        0
    );
    const isLinkedToBusiness = Boolean(
        canManagePost ||
        (viewer?.id && postBizOwnerUserId > 0 && Number(viewer.id) === postBizOwnerUserId)
    );

    const handleCopyPostLink = useCallback((e) => {
        if (e) e.stopPropagation();
        closePostMenu(e);
        const postUrl = `${window.location.origin}/${businessHandle}/posts/${id}`;
        navigator.clipboard.writeText(postUrl).then(() => setCopyLinkToast(true)).catch(() => setCopyLinkToast(true));
    }, [closePostMenu, businessHandle, id]);

    // ── Hide posts / Block business handlers ──
    // POST to /api/users/hide and /api/users/block with target_type='business'.
    // Backend resolves the business's owner and enforces a self-ownership
    // guard in user.js.
    const handleHideBusiness = useCallback(async (e) => {
        if (e) e.stopPropagation();
        closePostMenu(e);
        setMobileSheetOpen(false);
        const bizId = Number(postBizId || 0);
        if (!bizId || hideBusy || blockBusy) return;
        setHideBusy(true);
        const displayName = String(businessName || 'Business').trim() || 'Business';
        try {
            const hdrs = { 'Content-Type': 'application/json', ...(getAccountHeaders?.() || {}) };
            const res = await secureFetch('/api/users/hide', {
                method: 'POST',
                credentials: 'include',
                headers: hdrs,
                body: JSON.stringify({ target_id: bizId, target_type: 'business', action: 'hide' }),
            });
            if (res.ok) {
                try { window.dispatchEvent(new CustomEvent('ll:user:hidden-changed', { detail: { userId: bizId, targetType: 'business', hidden: true } })); } catch { /* */ }
                try { window.dispatchEvent(new CustomEvent('ll:business:hidden-changed', { detail: { businessId: bizId, hidden: true, source: 'businessPostCard' } })); } catch { /* */ }
                setHideBlockToast(`Posts from ${displayName} hidden`);
            }
        } catch { /* best-effort */ } finally { setHideBusy(false); }
    }, [closePostMenu, postBizId, hideBusy, blockBusy, businessName, getAccountHeaders]);

    const handleBlockBusiness = useCallback(async (e) => {
        if (e) e.stopPropagation();
        closePostMenu(e);
        setMobileSheetOpen(false);
        const bizId = Number(postBizId || 0);
        if (!bizId || hideBusy || blockBusy) return;
        setBlockBusy(true);
        const displayName = String(businessName || 'Business').trim() || 'Business';
        try {
            const hdrs = { 'Content-Type': 'application/json', ...(getAccountHeaders?.() || {}) };
            const res = await secureFetch('/api/users/block', {
                method: 'POST',
                credentials: 'include',
                headers: hdrs,
                body: JSON.stringify({ target_id: bizId, target_type: 'business', action: 'block' }),
            });
            if (res.ok) {
                try { window.dispatchEvent(new CustomEvent('ll:user:blocked-changed', { detail: { userId: bizId, targetType: 'business', blocked: true } })); } catch { /* */ }
                try { window.dispatchEvent(new CustomEvent('ll:user:hidden-changed', { detail: { userId: bizId, targetType: 'business', hidden: true } })); } catch { /* */ }
                try { window.dispatchEvent(new CustomEvent('ll:business:blocked-changed', { detail: { businessId: bizId, blocked: true, source: 'businessPostCard' } })); } catch { /* */ }
                setHideBlockToast(`${displayName} blocked`);
            }
        } catch { /* best-effort */ } finally { setBlockBusy(false); }
    }, [closePostMenu, postBizId, hideBusy, blockBusy, businessName, getAccountHeaders]);

    // Edit dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const handleEditPost = useCallback(() => {
        closePostMenu();
        if (typeof onEditPost === 'function') {
            onEditPost(post);
        } else {
            setEditDialogOpen(true);
        }
    }, [closePostMenu, onEditPost, post]);

    const handleDeletePost = useCallback(async () => {
        setDeleteConfirmOpen(false);
        if (typeof onDeletePost === 'function') {
            onDeletePost(post);
            return;
        }
        const urls = [
            `/api/business/posts/${encodeURIComponent(id)}`,
            `/api/business-posts/${encodeURIComponent(id)}`,
        ];
        for (const url of urls) {
            try {
                const res = await secureFetch(url, { method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json' } });
                if (res.ok) {
                    try { sessionStorage.removeItem('ll-business-hub-state'); } catch {}
                    try { window.dispatchEvent(new CustomEvent('ll:businessPost:deleted', { detail: { postId: id } })); } catch {}
                    showSuccess('Post deleted successfully');
                    return;
                }
            } catch { /* try next */ }
        }
    }, [id, post, onDeletePost, showSuccess]);

    // ── Report post dialog ──
    const [postReportOpen, setPostReportOpen] = useState(false);

    const handleReportPostClick = useCallback((e) => {
        if (e) e.stopPropagation();
        closePostMenu(e);
        setPostReportOpen(true);
    }, [closePostMenu]);

    const submitPostReport = useCallback(async ({ reason, details }) => {
        const urls = [
            `/api/business/posts/${encodeURIComponent(id)}/flag`,
            `/api/business-posts/${encodeURIComponent(id)}/flag`,
        ];
        for (const url of urls) {
            try {
                const res = await secureFetch(url, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason, details }) });
                if (res.ok) return;
            } catch { /* try next */ }
        }
    }, [id]);

    // Type styling
    const typeStyles = {
        deal: {
            chipBg: alpha(theme.palette.success.main, 0.12),
            chipColor: theme.palette.success.dark,
            icon: <LocalOfferIcon sx={{ fontSize: 14 }} />,
            label: 'Deal',
        },
        announcement: {
            chipBg: alpha(theme.palette.info.main, 0.12),
            chipColor: theme.palette.info.dark,
            icon: <CampaignIcon sx={{ fontSize: 14 }} />,
            label: 'Announcement',
        },
    };
    const typeStyle = typeStyles[postType] || null;

    // Truncate body for condensed view (matching PostList pattern)
    const BODY_WORD_LIMIT = 28;
    const BODY_CHAR_LIMIT = 220;
    const bodyTrimmed = body.trim();
    const bodyWords = bodyTrimmed.split(/\s+/).filter(Boolean);
    const longByWords = bodyWords.length > BODY_WORD_LIMIT;
    const longByChars = bodyTrimmed.length > BODY_CHAR_LIMIT;
    const bodyIsLong = longByWords || longByChars;
    const truncatedBody = !bodyIsLong
        ? bodyTrimmed
        : longByWords
            ? bodyWords.slice(0, BODY_WORD_LIMIT).join(' ')
            : bodyTrimmed.slice(0, BODY_CHAR_LIMIT).trimEnd();

    return (
        <>
            <Card
                data-business-post-id={id}
                data-selected={isSelected ? 'true' : 'false'}
                onClick={() => { if (menuInteractedRef.current || postMenuOpen || mobileSheetOpen || postReportOpen || deleteConfirmOpen || editDialogOpen || historyOpen) return; onSelect?.(post); }}
                elevation={flat ? 0 : undefined}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    minHeight: flat ? 'auto' : { xs: 360, sm: 350, md: 340 },
                    height: 'auto',
                    position: 'relative',
                    isolation: flat ? 'auto' : 'isolate',
                    borderRadius: flat ? '0 !important' : '16px',
                    border: flat ? '0 !important' : '1px solid',
                    borderColor: flat
                        ? 'transparent'
                        : isSelected
                            ? theme.palette.secondary.main
                            : alpha(theme.palette.text.primary, 0.08),
                    bgcolor: flat ? theme.palette.background.paper : theme.palette.background.paper,
                    ...(flat ? { backgroundImage: 'none !important', boxShadow: 'none !important' } : {}),
                    overflow: flat ? 'visible' : 'hidden',
                    cursor: 'pointer',
                    boxShadow: flat
                        ? 'none'
                        : isSelected
                            ? '0 8px 32px rgba(0,0,0,0.12)'
                            : isHovered
                                ? '0 6px 20px rgba(0,0,0,0.08)'
                                : '0 2px 8px rgba(0,0,0,0.04)',
                    transition: flat ? 'none' : 'all 180ms ease',
                    transform: 'translateY(0)',
                    '@media (hover: none)': {
                        '&:active': flat ? {} : {
                            transform: 'scale(0.985)',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                        },
                    },
                }}
                onMouseEnter={() => setHoveredId?.(id)}
                onMouseLeave={() => setHoveredId?.(null)}
            >
                {/* Header: Avatar, Name, Handle, Timestamp + Type Badge */}
                <Box sx={{ px: flat ? 2 : { xs: 1.5, sm: 2 }, pt: flat ? 1.5 : { xs: 1.5, sm: 2 }, pb: flat ? 0.5 : 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    {/* Left: Business info - hoverable */}
                    <Box
                        className="ll-author-link"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (typeof onOpenUserCard === 'function') {
                                // id must be the bizId so resolveCardTarget returns
                                // { type: 'business', id: bizId } — matching BusinessPostDetailModal.
                                const _bizId = post?.businessId || post?.businessPageId || post?.business_page_id || post?.business_id || post?.pageId || post?.page_id || undefined;
                                const _ownerId = post?.businessOwnerId || post?.business_owner_id || post?.owner_id || undefined;
                                onOpenUserCard(e.currentTarget, {
                                    id: _bizId || _ownerId || undefined,
                                    owner_id: _ownerId,
                                    first_name: businessName,
                                    last_name: '',
                                    handle: businessHandle,
                                    avatar_url: hasValidAvatar ? rawAvatar : '',
                                    isBusiness: true,
                                    account_type: 'business',
                                    business_id: _bizId,
                                    business_name: businessName,
                                    business_slug: businessHandle,
                                    business_avatar_url: hasValidAvatar ? rawAvatar : '',
                                });
                            } else {
                                onSelect?.(post);
                            }
                        }}
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'flex-start',
                            gap: 1.5,
                            cursor: typeof onOpenUserCard === 'function' ? 'pointer' : 'default',
                            borderRadius: 2,
                            p: 0.75,
                            m: -0.75,
                            transition: (t) => `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                            ...(typeof onOpenUserCard === 'function' && {
                                '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.04) },
                            }),
                            maxWidth: 'fit-content',
                        }}
                    >
                        <Avatar
                            src={hasValidAvatar ? rawAvatar : undefined}
                            onError={() => setAvatarError(true)}
                            sx={{
                                width: 48,
                                height: 48,
                                bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                                color: 'primary.main',
                                flexShrink: 0,
                                border: '2px solid',
                                borderColor: (t) => alpha(t.palette.common.black, 0.06),
                            }}
                        >
                            <StorefrontOutlinedIcon sx={{ fontSize: 28 }} />
                        </Avatar>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
                            {/* Row 1: Name */}
                            <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap">
                                <Typography
                                    variant="subtitle2"
                                    sx={{
                                        fontWeight: 750,
                                        lineHeight: 1.2,
                                    }}
                                >
                                    {businessName}
                                </Typography>
                            </Stack>
                            {/* Row 2: Handle */}
                            {businessHandle && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: 'text.secondary',
                                        lineHeight: 1.4,
                                    }}
                                >
                                    @{businessHandle}
                                </Typography>
                            )}
                            {/* Row 3: Timestamp + Edited */}
                            {timestamp && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: 'text.secondary',
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        {formatRelativeTime(timestamp)}
                                    </Typography>
                                    {isEdited && (
                                        <>
                                            <Typography variant="caption" color="text.disabled">•</Typography>
                                            <Typography
                                                variant="caption"
                                                onClick={openHistory}
                                                sx={{
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    color: 'primary.main',
                                                    '&:hover': { textDecoration: 'underline' },
                                                }}
                                            >
                                                Edited
                                            </Typography>
                                        </>
                                    )}
                                </Box>
                            )}
                        </Box>
                    </Box>

                    {/* Right: 3-dot menu */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0, mt: -0.75 }}>
                        <Tooltip title="Options">
                            <IconButton
                                size="small"
                                onClick={openPostMenu}
                                sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: 'background.paper',
                                    '&:hover': { bgcolor: 'action.hover' },
                                    width: { xs: 38, sm: 30 },
                                    height: { xs: 38, sm: 30 },
                                }}
                            >
                                <MoreVertIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>

                        <Menu
                            anchorEl={postMenuEl}
                            open={postMenuOpen}
                            onClose={closePostMenu}
                            disableScrollLock
                            onClick={(e) => e.stopPropagation()}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            PaperProps={{
                                ref: menuPaperRef,
                                sx: { mt: 0.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: (t) => t.custom.shadows.lg, minWidth: 190, py: 0.5 },
                            }}
                        >
                            {canManagePost && (
                                <MenuItem
                                    onClick={(e) => { e.stopPropagation(); closePostMenu(e); handleEditPost(); }}
                                    sx={{ py: 1 }}
                                >
                                    <ListItemIcon><EditRoundedIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Edit post" />
                                </MenuItem>
                            )}

                            {canManagePost && (
                                <MenuItem
                                    onClick={(e) => { e.stopPropagation(); closePostMenu(e); setDeleteConfirmOpen(true); }}
                                    sx={{ py: 1, color: 'error.main' }}
                                >
                                    <ListItemIcon sx={{ color: 'error.main' }}><DeleteRoundedIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Delete post" />
                                </MenuItem>
                            )}

                            {canManagePost && <Divider sx={{ my: 0.5 }} />}

                            <MenuItem onClick={handleCopyPostLink} sx={{ py: 1 }}>
                                <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
                                <ListItemText primary="Copy link" />
                            </MenuItem>

                            {!isLinkedToBusiness && viewerAuthed && (
                                <>
                                    <Divider sx={{ my: 0.5 }} />
                                    <MenuItem onClick={handleReportPostClick} sx={{ py: 1 }}>
                                        <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                                        <ListItemText primary="Report post" />
                                    </MenuItem>
                                </>
                            )}
                            {!isLinkedToBusiness && viewerAuthed && (
                                <MenuItem onClick={handleHideBusiness} disabled={hideBusy || blockBusy} sx={{ py: 1 }}>
                                    <ListItemIcon><VisibilityOffRoundedIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Hide posts" />
                                </MenuItem>
                            )}
                            {!isLinkedToBusiness && viewerAuthed && (
                                <MenuItem onClick={handleBlockBusiness} disabled={hideBusy || blockBusy} sx={{ py: 1, color: 'error.main' }}>
                                    <ListItemIcon sx={{ color: 'error.main' }}><BlockRoundedIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Block business" />
                                </MenuItem>
                            )}
                        </Menu>
                        {isMobileCard && (
                            <MobileActionSheet
                                open={mobileSheetOpen}
                                onClose={() => {
                                    setMobileSheetOpen(false);
                                    // Guard against the mobile backdrop teardown firing a
                                    // synthetic click on the card underneath (same pattern
                                    // as the desktop Menu uses).
                                    menuInteractedRef.current = true;
                                    setTimeout(() => { menuInteractedRef.current = false; }, 300);
                                }}
                                items={[
                                    // Match desktop menu order: Edit → Delete → (Divider) → Copy link → (Divider → Report) → Hide posts → Block business
                                    canManagePost && {
                                        icon: <EditRoundedIcon fontSize="small" />,
                                        label: 'Edit post',
                                        onClick: handleEditPost,
                                    },
                                    canManagePost && {
                                        icon: <DeleteRoundedIcon fontSize="small" />,
                                        label: 'Delete post',
                                        onClick: () => setDeleteConfirmOpen(true),
                                        color: 'error',
                                    },
                                    canManagePost && { divider: true },
                                    {
                                        icon: <LinkIcon fontSize="small" />,
                                        label: 'Copy link',
                                        onClick: handleCopyPostLink,
                                    },
                                    (!isLinkedToBusiness && viewerAuthed) && { divider: true },
                                    (!isLinkedToBusiness && viewerAuthed) && {
                                        icon: <FlagOutlinedIcon fontSize="small" />,
                                        label: 'Report post',
                                        onClick: handleReportPostClick,
                                    },
                                    (!isLinkedToBusiness && viewerAuthed) && {
                                        icon: <VisibilityOffRoundedIcon fontSize="small" />,
                                        label: 'Hide posts',
                                        onClick: handleHideBusiness,
                                        disabled: hideBusy || blockBusy,
                                    },
                                    (!isLinkedToBusiness && viewerAuthed) && {
                                        icon: <BlockRoundedIcon fontSize="small" />,
                                        label: 'Block business',
                                        onClick: handleBlockBusiness,
                                        disabled: hideBusy || blockBusy,
                                        color: 'error',
                                    },
                                ].filter(Boolean)}
                            />
                        )}
                    </Box>
                </Box>

                {/* Content area */}
                <Box
                    sx={{
                        flex: 1,
                        px: flat ? 2 : { xs: 1.5, sm: 2 },
                        pt: flat ? 0.5 : (showImage ? 1 : 0.5),
                        pb: flat ? 0.5 : 1,
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: (showImage && !flat) ? 'flex-start' : 'center',
                    }}
                >
                    <Box sx={{ display: 'flex', gap: (showImage && !flat) ? 2 : 0, alignItems: (showImage && !flat) ? 'center' : 'flex-start' }}>
                        {/* Photo thumbnail (LEFT side - matching community style) — hidden in flat/mobile mode */}
                        {showImage && !flat && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <Box
                                    sx={{
                                        position: 'relative',
                                        width: { xs: 110, sm: 150, md: 160 },
                                        height: { xs: 110, sm: 150, md: 160 },
                                        flexShrink: 0,
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src={mainPhoto}
                                        loading="lazy"
                                        onError={() => setImgError(true)}
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            borderRadius: '12px',
                                            border: '1px solid',
                                            borderColor: (t) => alpha(t.palette.common.black, 0.08),
                                            boxShadow: (t) => t.custom.shadows.xs,
                                            display: 'block',
                                        }}
                                        alt=""
                                    />
                                    {photos.length > 1 && (
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                left: '50%',
                                                bottom: 6,
                                                transform: 'translateX(-50%)',
                                                px: 1,
                                                py: 0.25,
                                                borderRadius: 999,
                                                bgcolor: (t) => alpha(t.palette.common.black, 0.70),
                                                backdropFilter: 'blur(4px)',
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                color: 'common.white',
                                                lineHeight: 1.2,
                                                whiteSpace: 'nowrap',
                                                userSelect: 'none',
                                            }}
                                        >
                                            +{photos.length - 1} more
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        )}

                        {/* Text content */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            {/* Title */}
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
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                }}
                            >
                                {title}
                            </Typography>

                            {/* Deal box */}
                            {isDeal && (discountText || dealExpired) && (
                                <Box
                                    sx={{
                                        mt: 1,
                                        mb: 0.5,
                                        p: 1.25,
                                        pl: 1.75,
                                        borderRadius: 2.5,
                                        borderLeft: '4px solid',
                                        borderLeftColor: dealExpired ? 'grey.400' : 'success.main',
                                        bgcolor: dealExpired
                                            ? alpha(theme.palette.grey[500], 0.06)
                                            : alpha(theme.palette.success.main, 0.05),
                                        opacity: dealExpired ? 0.85 : 1,
                                    }}
                                >
                                    {discountText && (
                                        <Stack direction="row" alignItems="center" spacing={0.75}>
                                            <LocalOfferIcon
                                                sx={{
                                                    fontSize: 15,
                                                    color: dealExpired ? 'grey.500' : 'success.dark',
                                                }}
                                            />
                                            <Typography
                                                sx={{
                                                    fontWeight: 800,
                                                    fontSize: 14,
                                                    color: dealExpired ? 'text.disabled' : 'success.dark',
                                                    textDecoration: dealExpired ? 'line-through' : 'none',
                                                }}
                                            >
                                                {discountText}
                                            </Typography>
                                        </Stack>
                                    )}
                                    {validUntil && (
                                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                                            <ScheduleIcon
                                                sx={{
                                                    fontSize: 12,
                                                    color: dealExpired ? 'error.main' : 'text.secondary',
                                                }}
                                            />
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    fontWeight: 700,
                                                    color: dealExpired ? 'error.main' : 'text.secondary',
                                                }}
                                            >
                                                {dealExpired
                                                    ? 'Expired'
                                                    : `Valid until ${formatDate(validUntil)}`}
                                            </Typography>
                                        </Stack>
                                    )}
                                    {dealExpired && !validUntil && (
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontWeight: 700,
                                                color: 'error.main',
                                                mt: discountText ? 0.5 : 0,
                                            }}
                                        >
                                            Expired
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {/* Announcement box — same accent-bar style as deal box */}
                            {postType === 'announcement' && (
                                <Box
                                    sx={{
                                        mt: 1,
                                        mb: 0.5,
                                        p: 1.25,
                                        pl: 1.75,
                                        borderRadius: 2.5,
                                        borderLeft: '4px solid',
                                        borderLeftColor: theme.palette.info.main,
                                        bgcolor: alpha(theme.palette.info.main, 0.05),
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" spacing={0.75}>
                                        <CampaignIcon
                                            sx={{
                                                fontSize: 15,
                                                color: 'info.dark',
                                            }}
                                        />
                                        <Typography
                                            sx={{
                                                fontWeight: 800,
                                                fontSize: 14,
                                                color: 'info.dark',
                                            }}
                                        >
                                            Announcement
                                        </Typography>
                                    </Stack>
                                </Box>
                            )}

                            {/* Description preview */}
                            {truncatedBody ? (
                                bodyHasHtml ? (
                                    <Box
                                        sx={{
                                            mt: 0.5,
                                            color: 'text.secondary',
                                            fontSize: '0.875rem',
                                            lineHeight: 1.4,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            wordBreak: 'break-word',
                                            overflowWrap: 'anywhere',
                                            '& p': { m: 0 },
                                            '& ul, & ol': { m: 0, pl: 2.5 },
                                            '& h1, & h2, & h3, & h4, & h5, & h6': { m: 0, fontSize: 'inherit', fontWeight: 700 },
                                            '& blockquote': { m: 0, pl: 1, borderLeft: '2px solid', borderColor: 'divider' },
                                            '& a': { color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
                                        }}
                                    >
                                        <RichTextDisplay html={rawBodyHtml} />
                                        {bodyIsLong && (
                                            <Typography
                                                component="span"
                                                sx={{ fontSize: 'inherit', fontWeight: 700, color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                            >
                                                ...more
                                            </Typography>
                                        )}
                                    </Box>
                                ) : (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            mt: 0.5,
                                            lineHeight: 1.4,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            wordBreak: 'break-word',
                                            overflowWrap: 'anywhere',
                                        }}
                                    >
                                        {truncatedBody}
                                        {bodyIsLong && (
                                            <Typography
                                                component="span"
                                                sx={{ fontSize: 'inherit', fontWeight: 700, color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                            >
                                                ...more
                                            </Typography>
                                        )}
                                    </Typography>
                                )
                            ) : null}

                        </Box>
                    </Box>


                </Box>

                {renderBeforeActions ? <Box sx={{ mb: 1 }}>{renderBeforeActions}</Box> : null}

                {/* Flat mode (mobile): full-width dynamic photo grid below text */}
                {flat && showImage && !renderBeforeActions && (() => {
                    const urls = photos;
                    const count = urls.length;
                    // Per-photo click: stop propagation so the parent Card's
                    // onClick doesn't ALSO fire, then call onSelect with the
                    // post AND the clicked index. Detail view opens at that photo.
                    const handleCellClick = (idx) => (e) => {
                        e.stopPropagation();
                        if (menuInteractedRef.current || postMenuOpen || mobileSheetOpen || postReportOpen || deleteConfirmOpen || editDialogOpen || historyOpen) return;
                        onSelect?.(post, idx);
                    };
                    const imgCell = (url, idx, sx = {}) => (
                        <Box
                            key={idx}
                            onClick={handleCellClick(idx)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onSelect?.(post, idx); } }}
                            sx={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', '&:hover img': { transform: 'scale(1.03)' }, ...sx }}
                        >
                            <Box component="img" src={url} alt="" loading="lazy" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        </Box>
                    );
                    if (count === 1) return (
                        <Box sx={{ borderRadius: 2.5, overflow: 'hidden', mt: 1.5 }}>
                            <Box
                                onClick={handleCellClick(0)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onSelect?.(post, 0); } }}
                                sx={{ position: 'relative', cursor: 'pointer', '&:hover img': { transform: 'scale(1.02)' } }}
                            >
                                <Box component="img" src={urls[0]} alt="" loading="lazy" sx={{ width: '100%', maxHeight: 600, objectFit: 'contain', display: 'block', transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)' }} />
                            </Box>
                        </Box>
                    );
                    if (count === 2) return (<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 220, sm: 280 }, mt: 1.5 }}>{imgCell(urls[0], 0)}{imgCell(urls[1], 1)}</Box>);
                    if (count === 3) return (<Box sx={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gridTemplateRows: '1fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 260, sm: 340 }, mt: 1.5 }}>{imgCell(urls[0], 0, { gridRow: '1 / 3' })}{imgCell(urls[1], 1)}{imgCell(urls[2], 2)}</Box>);
                    if (count === 4) return (<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '2fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 300, sm: 380 }, mt: 1.5 }}>{imgCell(urls[0], 0, { gridColumn: '1 / 4' })}{imgCell(urls[1], 1)}{imgCell(urls[2], 2)}{imgCell(urls[3], 3)}</Box>);
                    const extra = count - 5;
                    return (
                        <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 2fr 2fr', gridTemplateRows: '1fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 280, sm: 360 }, mt: 1.5 }}>
                            {imgCell(urls[0], 0, { gridRow: '1 / 3' })}{imgCell(urls[1], 1)}{imgCell(urls[2], 2)}{imgCell(urls[3], 3)}
                            <Box sx={{ position: 'relative', overflow: 'hidden', '&:hover img': { transform: 'scale(1.03)' } }}>
                                <Box component="img" src={urls[4]} alt="" loading="lazy" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)' }} />
                                {extra > 0 && (<Box sx={{ position: 'absolute', inset: 0, bgcolor: (t) => alpha(t.palette.common.black, 0.55), display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}><Typography sx={{ color: 'common.white', fontWeight: 800, fontSize: '1.5rem' }}>+{extra}</Typography></Box>)}
                            </Box>
                        </Box>
                    );
                })()}

                {/* Location — below photos, matches artist profile pattern */}
                {hasLocation && (
                    <Box
                        onClick={(e) => {
                            e.stopPropagation();
                            if (typeof onLocationClick === 'function') {
                                onLocationClick(post);
                            }
                        }}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: 0.25,
                            px: flat ? 2 : { xs: 1.5, sm: 2 },
                            mt: 1,
                            cursor: typeof onLocationClick === 'function' ? 'pointer' : 'default',
                            transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                            '&:hover .business-post-location-icon, &:hover .business-post-location-text': typeof onLocationClick === 'function'
                                ? { color: (t) => t.palette.secondary.main }
                                : undefined,
                        }}
                    >
                        {/* Street address with icon */}
                        {businessAddress && (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <LocationOnRoundedIcon
                                    className="business-post-location-icon"
                                    sx={{
                                        fontSize: 15,
                                        color: 'primary.main',
                                        transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                    }}
                                />
                                <Typography
                                    variant="body2"
                                    className="business-post-location-text"
                                    noWrap
                                    sx={{
                                        color: 'primary.main',
                                        fontWeight: 700,
                                        fontSize: 12,
                                        lineHeight: 1.2,
                                        maxWidth: { xs: 200, sm: 260, md: 300 },
                                        transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                    }}
                                >
                                    {businessAddress}
                                </Typography>
                            </Stack>
                        )}
                        {/* City/County — indented if street address exists, with icon if no street */}
                        {locationStr && (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                {!businessAddress && (
                                    <LocationOnRoundedIcon
                                        className="business-post-location-icon"
                                        sx={{
                                            fontSize: 15,
                                            color: 'primary.main',
                                            transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                        }}
                                    />
                                )}
                                <Typography
                                    variant="body2"
                                    className="business-post-location-text"
                                    noWrap
                                    sx={{
                                        color: 'primary.main',
                                        fontWeight: 700,
                                        fontSize: 11,
                                        lineHeight: 1.2,
                                        maxWidth: { xs: 200, sm: 260, md: 300 },
                                        transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                    }}
                                >
                                    {locationStr}
                                </Typography>
                            </Stack>
                        )}
                    </Box>
                )}

                {/* Action bar */}
                <CardActions sx={{ px: flat ? 2 : { xs: 1.5, sm: 2 }, pt: flat ? 1.5 : 0.75, pb: flat ? 0.5 : 1.25, mt: flat ? 0 : 'auto', borderTop: flat ? 'none' : '1px solid', borderColor: flat ? 'transparent' : 'divider' }}>
                    <Box onClick={(e) => e.stopPropagation()} sx={{ width: 'fit-content' }}>
                        <ActionBar
                            variant="business"
                            user={user}
                            postId={id}
                            post={post}
                            initialLikes={likes}
                            initiallyLiked={viewerLiked}
                            commentsCount={comments}
                            initialReposts={reposts}
                            initiallyReposted={viewerReposted}
                            useShareDialog
                            onComment={() => onSelect?.(post)}
                        />
                    </Box>
                </CardActions>

            </Card>

            {/* Dialogs & toasts — outside Card so React synthetic events from
                dialog interactions don't bubble to Card's onClick */}

            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth onClick={(e) => e.stopPropagation()}>
                <DialogTitle sx={{ fontWeight: 700 }}>Delete post</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to permanently delete this post? This action cannot be undone.</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ textTransform: 'none', fontWeight: 700 }}>Cancel</Button>
                    <Button onClick={handleDeletePost} color="error" variant="contained" sx={{ textTransform: 'none', fontWeight: 700 }}>Delete</Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                fullWidth
                maxWidth="sm"
                onClick={(e) => e.stopPropagation()}
                PaperProps={{ sx: { position: 'relative' } }}
            >
                <DialogTitle sx={{ pr: 7, fontWeight: 800, fontSize: 18 }}>
                    Edit History
                    <IconButton aria-label="Close" onClick={() => setHistoryOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ minHeight: 120, px: { xs: 2, sm: 3 } }}>
                    {historyLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>}
                    {!historyLoading && historyError && <Alert severity="error">{historyError}</Alert>}
                    {!historyLoading && !historyError && historyRows.length === 0 && (
                        <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center', fontSize: 14 }}>
                            This post was edited, but detailed version history is not available for edits made before history tracking was enabled.
                        </Typography>
                    )}
                    {!historyLoading && !historyError && historyRows.length > 0 && (
                        <Box sx={{ position: 'relative', pl: 2.5 }}>
                            <Box sx={{ position: 'absolute', left: 5, top: 10, bottom: 10, width: 2, bgcolor: (t) => alpha(t.palette.primary.main, 0.12), borderRadius: 1 }} />
                            {historyRows.map((row, idx) => {
                                const snap = row?.snapshot || {};
                                const prevSnap = idx + 1 < historyRows.length ? (historyRows[idx + 1]?.snapshot || {}) : {};
                                const diff = row?.diff || {};
                                const isOriginal = idx === historyRows.length - 1;
                                const isLatest = idx === 0;

                                const diffItems = [];
                                if (!isOriginal) {
                                    const s = (v) => (v == null ? '' : String(v).trim());
                                    if (s(snap.title) !== s(prevSnap.title)) diffItems.push({ label: 'Title', from: s(prevSnap.title) || '(empty)', to: s(snap.title) || '(empty)' });
                                    if (s(snap.body || snap.description) !== s(prevSnap.body || prevSnap.description)) {
                                        const prevDesc = s(prevSnap.body || prevSnap.description);
                                        const curDesc = s(snap.body || snap.description);
                                        const t80 = (v) => v.length > 80 ? v.slice(0, 80) + '…' : v;
                                        diffItems.push({ label: 'Description', from: t80(prevDesc) || '(empty)', to: t80(curDesc) || '(empty)' });
                                    }
                                    const pType = s(snap.type);
                                    const prevType = s(prevSnap.type);
                                    if (pType && prevType && pType !== prevType) diffItems.push({ label: 'Post type', from: prevType.charAt(0).toUpperCase() + prevType.slice(1), to: pType.charAt(0).toUpperCase() + pType.slice(1) });
                                    const added = Array.isArray(diff?.added) ? diff.added.filter(Boolean) : [];
                                    const removed = Array.isArray(diff?.removed) ? diff.removed.filter(Boolean) : [];
                                    if (added.length > 0 || removed.length > 0) {
                                        const parts = [];
                                        if (added.length) parts.push(`${added.length} added`);
                                        if (removed.length) parts.push(`${removed.length} removed`);
                                        diffItems.push({ label: 'Photos', changed: true, detail: parts.join(', '), photoAdded: added, photoRemoved: removed });
                                    }
                                }

                                const when = row?.edited_at;
                                const whenLabel = when ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(when)) : '';

                                return (
                                    <Box key={row?.id ?? idx} sx={{ position: 'relative', pb: idx < historyRows.length - 1 ? 2.5 : 0 }}>
                                        <Box sx={{ position: 'absolute', left: -20, top: 4, width: 12, height: 12, borderRadius: '50%', bgcolor: isOriginal ? 'grey.400' : isLatest ? 'secondary.main' : 'primary.main', border: '2px solid', borderColor: 'background.paper', boxShadow: (t) => `0 0 0 2px ${alpha(isOriginal ? t.palette.grey[400] : isLatest ? t.palette.secondary.main : t.palette.primary.main, 0.2)}`, zIndex: 1 }} />
                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                                            <Typography sx={{ fontWeight: 800, fontSize: 13, color: isOriginal ? 'text.secondary' : 'text.primary' }}>
                                                {isOriginal ? 'Original' : isLatest ? 'Latest edit' : `Version ${row.version || historyRows.length - idx}`}
                                            </Typography>
                                            <Typography sx={{ fontSize: 11, color: 'text.disabled', fontWeight: 500 }}>{whenLabel}</Typography>
                                        </Stack>
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
                                        {!isOriginal && diffItems.length === 0 && <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic', pl: 0.5 }}>Post details updated</Typography>}
                                        {isOriginal && (
                                            <Box sx={{ bgcolor: (t) => alpha(t.palette.grey[500], 0.04), border: '1px solid', borderColor: (t) => alpha(t.palette.grey[500], 0.08), borderRadius: 2, px: 1.5, py: 1 }}>
                                                {snap.title && <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.primary', mb: 0.25 }}>{String(snap.title).trim()}</Typography>}
                                                <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.4 }}>{snap.type ? `${snap.type.charAt(0).toUpperCase()}${snap.type.slice(1)} post` : 'Original post created'}</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 1.5 }}><Button onClick={() => setHistoryOpen(false)} sx={{ fontWeight: 700 }}>Close</Button></DialogActions>
            </Dialog>

            <EditBusinessPostDialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                post={post}
                businessId={post?.business_id || post?.businessId}
                businessName={post?.businessName || post?.business_name || ''}
                onPostUpdated={() => {
                    setEditDialogOpen(false);
                }}
            />

            <Snackbar
                open={copyLinkToast}
                autoHideDuration={2500}
                onClose={() => setCopyLinkToast(false)}
                message="Link copied to clipboard"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />

            <Snackbar
                open={Boolean(hideBlockToast)}
                autoHideDuration={2500}
                onClose={() => setHideBlockToast('')}
                message={hideBlockToast}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />

            <ReportDialog
                open={postReportOpen}
                onClose={() => setPostReportOpen(false)}
                onSubmit={submitPostReport}
                title="Report Post"
            />

            <SuccessSnackbar {...successSnackbarProps} />
        </>
    );
}

BusinessPostCard.propTypes = {
    post: PropTypes.any.isRequired,
    user: PropTypes.any,
    hoveredId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    setHoveredId: PropTypes.func,
    selectedId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    selectable: PropTypes.bool,
    onSelect: PropTypes.func,
    onOpenUserCard: PropTypes.func,
    onLocationClick: PropTypes.func,
    onEditPost: PropTypes.func,
    onDeletePost: PropTypes.func,
};
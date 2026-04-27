import { secureFetch } from '../../../utils/secureFetch';
import React, { useState, useCallback } from 'react';
import { useAuth } from '../../../components/AuthModalContext';
import {

    Box, Button, Chip, Divider, IconButton, MenuItem,
    ListItemIcon, ListItemText, Stack, Tooltip, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SuccessSnackbar from '../../../components/SuccessSnackbar';
import LockIcon from '@mui/icons-material/Lock';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import StarIcon from '@mui/icons-material/Star';
import ShieldIcon from '@mui/icons-material/Shield';
import PersonIcon from '@mui/icons-material/Person';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PublicIcon from '@mui/icons-material/Public';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LinkIcon from '@mui/icons-material/Link';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';

import { ReportDialog } from '../../../components/ActionBar';
import SmartMenu from '../../../components/SmartMenu';

// Group MAIN category icons
import PlaceIcon from '@mui/icons-material/Place';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import ChurchIcon from '@mui/icons-material/Church';
import PaletteIcon from '@mui/icons-material/Palette';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import ForestIcon from '@mui/icons-material/Forest';
import PetsIcon from '@mui/icons-material/Pets';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import SchoolIcon from '@mui/icons-material/School';
import WorkIcon from '@mui/icons-material/Work';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SpaIcon from '@mui/icons-material/Spa';
import GroupsIcon from '@mui/icons-material/Groups';
import JoinQuestionsDialog from './JoinQuestionsDialog';
import SwitchAccountDialog from './SwitchAccountDialog';

/**
 * GroupHeaderCard
 * ----------------
 * Hero-style group header with cover photo banner, avatar overlapping below,
 * name + location underneath the banner, glass badges, role-based actions,
 * and admin console access.
 */

const DEFAULT_AVATAR_SIZE = 110;

const GROUP_CATEGORY_OPTIONS = [
    { header: 'Local & Place-Based', items: ['Local Areas & Neighborhoods', 'City and Town Groups', 'County and Region Groups', 'New to the Area', 'Homeowners Associations'] },
    { header: 'Families & Life Stages', items: ['Parents & Families', 'Moms and Dads Groups', 'Homeschooling Families', 'Parenting Teens', 'New Parents', 'Seniors & Retirees', 'Caregivers'] },
    { header: 'Faith & Spiritual', items: ['Faith Communities', 'Church Small Groups', "Men's Groups", "Women's Groups", 'Young Adults Faith', 'Prayer and Devotional Groups'] },
    { header: 'Arts & Culture', items: ['Music & Performing Arts', 'Visual Arts', 'Photography', 'Crafts & Handmade', 'Makers and DIY', 'Writers & Poets', 'Book Clubs', 'Theater & Drama', 'Dance Groups'] },
    { header: 'Sports & Recreation', items: ['Sports Teams & Leagues', 'Pickleball', 'Basketball', 'Soccer', 'Baseball and Softball', 'Golf', 'Running and Walking Clubs', 'Cycling', 'Martial Arts', 'Yoga and Pilates', 'Fitness Accountability Groups'] },
    { header: 'Outdoors & Nature', items: ['Hiking & Trails', 'Camping', 'Fishing', 'Hunting', 'Kayaking and Canoeing', 'Gardening', 'Birdwatching and Wildlife', 'Conservation and Outdoor Stewardship'] },
    { header: 'Pets & Animals', items: ['Dog Owners', 'Cat Owners', 'Animal Rescue Supporters', 'Pet Training and Behavior', 'Farm Animals and Homesteading Animals'] },
    { header: 'Food & Home', items: ['Cooking & Recipes', 'BBQ & Grilling', 'Baking', 'Meal Prep', 'Home & Garden', 'Home Improvement', 'Interior Decor and DIY Home'] },
    { header: 'Learning & Skills', items: ['Language Learning', 'Tutoring and Study Groups', 'STEM and Tech Learners', 'Coding & Web Dev', 'Personal Finance & Budgeting', 'Career Growth & Networking', 'Public Speaking'] },
    { header: 'Schools & Alumni', items: ['School Parent Groups', 'High School Alumni', 'College Alumni', 'Band and Sports Boosters', 'Student Organizations'] },
    { header: 'Business & Professional', items: ['Small Business Owners & Entrepreneurs', 'Creators & Content Makers', 'Marketing and Social Media for Business', 'Trades and Contractors Network', 'Real Estate Professionals', 'Healthcare Professionals', 'Educators Network'] },
    { header: 'Cars & Machines', items: ['Car Enthusiasts', 'Truck and Offroad', 'Motorcycles', 'Classic Cars', 'DIY Auto Repair', 'RC Cars and Drones'] },
    { header: 'Gaming & Geek Culture', items: ['Video Games', 'Tabletop Games and Board Games', 'Trading Card Games', 'Anime and Pop Culture'] },
    { header: 'History & Civic Identity', items: ['Local History & Heritage', 'Genealogy and Family Roots', 'Historic Preservation', 'Museums and Archives'] },
    { header: 'Wellness & Support', items: ['Sobriety and Recovery Support', 'Mental Wellness and Mindfulness', "Men's Support Circles", "Women's Support Circles", 'Grief Support', 'Chronic Illness Community'] },
    { header: 'Clubs & Organizations', items: ['Civic Clubs', 'Fraternal and Service Organizations', 'Volunteer Teams', 'Community Project Groups'] },
    { header: 'Other', items: [] },
];

const GROUP_MAIN_ICON = {
    'Local & Place-Based': PlaceIcon,
    'Families & Life Stages': FamilyRestroomIcon,
    'Faith & Spiritual': ChurchIcon,
    'Arts & Culture': PaletteIcon,
    'Sports & Recreation': SportsSoccerIcon,
    'Outdoors & Nature': ForestIcon,
    'Pets & Animals': PetsIcon,
    'Food & Home': RestaurantIcon,
    'Learning & Skills': SchoolIcon,
    'Schools & Alumni': SchoolIcon,
    'Business & Professional': WorkIcon,
    'Cars & Machines': DirectionsCarIcon,
    'Gaming & Geek Culture': SportsEsportsIcon,
    'History & Civic Identity': AccountBalanceIcon,
    'Wellness & Support': SpaIcon,
    'Clubs & Organizations': GroupsIcon,
    Other: GroupsIcon,
};

// Role config uses theme-callback gradients — the actual colors are resolved at render time
// via the sx callback `(t) => ...` so they pull from the Alabama Lantern palette.
const ROLE_CONFIG = {
    owner: { label: 'Owner', icon: StarIcon },
    admin: { label: 'Admin', icon: ShieldIcon },
    member: { label: 'Member', icon: PersonIcon },
};

/**
 * Returns theme-aligned gradient + shadow for a given role key.
 * Called inside sx={(t) => ...} callbacks so palette tokens resolve correctly.
 */
function getRoleChipStyles(t, roleKey) {
    if (roleKey === 'owner') {
        return {
            background: `linear-gradient(135deg, ${t.palette.secondary.main} 0%, ${t.palette.secondary.dark} 100%)`,
            boxShadow: `0 2px 8px ${alpha(t.palette.secondary.main, 0.28)}`,
        };
    }
    if (roleKey === 'admin') {
        return {
            background: `linear-gradient(135deg, ${t.palette.primary.light} 0%, ${t.palette.primary.main} 100%)`,
            boxShadow: `0 2px 8px ${alpha(t.palette.primary.main, 0.28)}`,
        };
    }
    // member (default)
    return {
        background: `linear-gradient(135deg, ${t.palette.success.main} 0%, ${t.palette.success.dark} 100%)`,
        boxShadow: `0 2px 8px ${alpha(t.palette.success.main, 0.22)}`,
    };
}

const safeStr = (v) => String(v ?? '').trim();

const normalizeKey = (v) =>
    safeStr(v)
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/['\u2019]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

function parseGroupCategoryValue(raw) {
    const s = safeStr(raw);
    if (!s) return { main: '', sub: '' };
    if (s.includes('>')) {
        const parts = s.split('>').map((x) => safeStr(x)).filter(Boolean);
        if (parts.length >= 2) return { main: parts[0], sub: parts.slice(1).join(' > ') };
        return { main: parts[0] || s, sub: '' };
    }
    return { main: s, sub: '' };
}

const GROUP_SUB_TO_MAIN_BY_KEY = (() => {
    const map = new Map();
    GROUP_CATEGORY_OPTIONS.forEach((sec) => {
        (Array.isArray(sec.items) ? sec.items : []).forEach((it) => map.set(normalizeKey(it), sec.header));
    });
    return map;
})();

const GROUP_MAIN_HEADERS_BY_KEY = (() => {
    const map = new Map();
    GROUP_CATEGORY_OPTIONS.forEach((sec) => map.set(normalizeKey(sec.header), sec.header));
    return map;
})();

function getGroupMainCategory(group) {
    const raw =
        safeStr(group?.category_name) ||
        safeStr(group?.category) ||
        safeStr(group?.group_category) ||
        safeStr(group?.subcategory) ||
        '';
    if (!raw) return 'Other';

    const parsed = parseGroupCategoryValue(raw);
    if (GROUP_MAIN_ICON[parsed.main]) return parsed.main;

    const token = parsed.sub ? parsed.sub : parsed.main;
    const tokenKey = normalizeKey(token);
    const rawKey = normalizeKey(raw);

    const mappedBySub = GROUP_SUB_TO_MAIN_BY_KEY.get(tokenKey) || GROUP_SUB_TO_MAIN_BY_KEY.get(rawKey);
    if (mappedBySub) return mappedBySub;

    const maybeMain = GROUP_MAIN_HEADERS_BY_KEY.get(normalizeKey(parsed.main)) || GROUP_MAIN_HEADERS_BY_KEY.get(rawKey);
    if (maybeMain) return maybeMain;

    const explicit =
        safeStr(group?.main_category) ||
        safeStr(group?.mainCategory) ||
        safeStr(group?.main_category_name) ||
        safeStr(group?.mainCategoryName) ||
        '';
    const explicitResolved = GROUP_MAIN_HEADERS_BY_KEY.get(normalizeKey(explicit));
    if (explicitResolved) return explicitResolved;

    return 'Other';
}

function getVisibilityInfo(group) {
    const visRaw = String(group?.visibility || '').toLowerCase();
    const privateFlag = Boolean(group?.is_private ?? group?.isPrivate);
    const isHidden = visRaw === 'hidden';
    const isPrivate = visRaw === 'private' || privateFlag;
    return { isHidden, isPrivate, isPublic: !isHidden && !isPrivate };
}

function getGroupPhotoSrc(group) {
    return (
        safeStr(group?.photo_url) ||
        safeStr(group?.photoUrl) ||
        safeStr(group?.image_url) ||
        safeStr(group?.imageUrl) ||
        safeStr(group?.group_photo_url) ||
        safeStr(group?.groupPhotoUrl) ||
        ''
    );
}

function hasCustomGroupPhoto(group) {
    return Boolean(getGroupPhotoSrc(group));
}

function getCoverPhotoSrc(group) {
    return (
        safeStr(group?.cover_photo_url) ||
        safeStr(group?.coverPhotoUrl) ||
        safeStr(group?.cover_image) ||
        safeStr(group?.coverImage) ||
        safeStr(group?.cover_image_url) ||
        safeStr(group?.coverImageUrl) ||
        safeStr(group?.banner_url) ||
        safeStr(group?.bannerUrl) ||
        safeStr(group?.banner_image) ||
        safeStr(group?.bannerImage) ||
        ''
    );
}

function formatLocation(group) {
    const statewide = Boolean(group?.isStatewide || group?.is_statewide);
    if (statewide) return 'Statewide Alabama';
    const city = safeStr(group?.city);
    const county = safeStr(group?.county);
    const countyLabel = county
        ? (String(county).toLowerCase().includes('county') ? county : `${county} County`)
        : '';
    if (city && countyLabel) return `${city}, ${countyLabel}`;
    return city || countyLabel || '';
}

/* ================================================================== */
/*  MAIN EXPORT                                                        */
/* ================================================================== */
export default function GroupHeaderCard({
                                            group,
                                            groupPosts,
                                            defaultGroupsSrc,
                                            avatarSize = DEFAULT_AVATAR_SIZE,
                                            onJoin,
                                            onAcceptInvite,
                                            onDeclineInvite,
                                            onLeave,
                                            onToggleMute,
                                            onOpenAdminConsole,
                                            isSticky = false,
                                            showJoinCta = true,
                                            pendingRequestsCount = 0,
                                            isMuted = false,
                                            isOnPersonalAccount = true,
                                            personalAccountCanManage = false,
                                            viewerMembership,
                                        }) {
    // ── 3-dot menu state — must be before early return ──
    const [dotMenuEl, setDotMenuEl] = useState(null);
    const dotMenuOpen = Boolean(dotMenuEl);
    const [copyToast, setCopyToast] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);

    // ── Join questions dialog ──
    const [joinQDialogOpen, setJoinQDialogOpen] = useState(false);
    const [joinQSubmitting, setJoinQSubmitting] = useState(false);
    const [switchAccountOpen, setSwitchAccountOpen] = useState(false);

    // ── Auth context for login popup ──
    const ghcAuth = useAuth();

    const joinQuestions = (() => {
        try {
            const raw = group?.join_questions_json || group?.joinQuestionsJson;
            if (!raw) return [];
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return Array.isArray(parsed) ? parsed : [];
        } catch { return []; }
    })();

    const handleJoinClick = useCallback((g) => {
        // Require login
        if (!ghcAuth?.user) {
            try {
                if (ghcAuth && typeof ghcAuth.open === 'function') ghcAuth.open();
                else if (ghcAuth?.openLoginPopup) ghcAuth.openLoginPopup();
                else if (ghcAuth?.openLoginModal) ghcAuth.openLoginModal();
                else if (ghcAuth?.openLogin) ghcAuth.openLogin();
            } catch { /* ignore */ }
            try {
                window.dispatchEvent(new CustomEvent('open-auth-modal'));
                window.dispatchEvent(new CustomEvent('open-login'));
                window.dispatchEvent(new CustomEvent('open-auth-dialog'));
                window.dispatchEvent(new CustomEvent('open-login-popup'));
            } catch { /* ignore */ }
            return;
        }
        if (!isOnPersonalAccount) {
            setSwitchAccountOpen(true);
            return;
        }
        if (joinQuestions.length > 0) {
            setJoinQDialogOpen(true);
            return;
        }
        if (typeof onJoin === 'function') onJoin(g);
    }, [isOnPersonalAccount, joinQuestions, onJoin, ghcAuth]);

    const handleJoinQuestionsSubmit = useCallback(async (answers) => {
        setJoinQSubmitting(true);
        try {
            const gid = group?.id || group?.group_id;
            if (!gid) return;
            const res = await secureFetch(`/api/groups/${encodeURIComponent(String(gid))}/join`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.message || 'Failed to join');
            }
            setJoinQDialogOpen(false);
            // Call onJoin to let the parent refresh state
            if (typeof onJoin === 'function') onJoin(group, { fromQuestionsDialog: true });
        } catch (e) {
            // If onJoin exists, let parent handle the error display; otherwise swallow
            console.error('[GroupHeaderCard] join with questions error:', e);
        } finally {
            setJoinQSubmitting(false);
        }
    }, [group, onJoin]);

    const submitReport = useCallback(async ({ reason, details }) => {
        const gid = group?.id || group?.group_id;
        if (!gid) return;
        const urls = [
            `/api/groups/${encodeURIComponent(gid)}/flag`,
            `/api/community/groups/${encodeURIComponent(gid)}/flag`,
        ];
        for (const url of urls) {
            try {
                const res = await secureFetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason, details }),
                });
                if (res.ok) return;
            } catch { /* try next */ }
        }
    }, [group?.id, group?.group_id]);

    const g = group || null;
    if (!g) return null;

    const { isHidden, isPrivate } = getVisibilityInfo(g);

    // --- Membership: prefer viewerMembership prop, fall back to group fields ---
    // When the viewer is NOT on their personal account, suppress all membership
    // so they don't see Owner/Admin/Member badges or the Manage button.
    const vmRole = isOnPersonalAccount ? safeStr(viewerMembership?.role).toLowerCase() : '';
    const groupViewerRole = isOnPersonalAccount ? safeStr(g?.viewer_role ?? g?.viewerRole).toLowerCase() : '';
    const effectiveRole = vmRole || groupViewerRole || '';

    const isOwner = effectiveRole === 'owner';
    const isAdmin = effectiveRole === 'admin' || isOwner;

    const isMemberFromVm = (() => {
        if (!isOnPersonalAccount) return false;
        if (!viewerMembership && !g?.is_member && !g?.isMember) return false;
        if (viewerMembership?.is_member || viewerMembership?.isMember) return true;
        const vmStatus = safeStr(viewerMembership?.status).toLowerCase();
        if (['joined', 'member', 'owner', 'admin', 'moderator', 'accepted', 'approved'].includes(vmStatus)) return true;
        if (isOwner || isAdmin) return true;
        return Boolean(g?.is_member ?? g?.isMember);
    })();
    const isMember = isMemberFromVm;

    const requested = !isOnPersonalAccount ? false : (Boolean(
        viewerMembership?.has_requested ?? viewerMembership?.hasRequested ??
        g?.has_requested ?? g?.hasRequested
    ) || (() => {
        const vmStatus = safeStr(viewerMembership?.status).toLowerCase();
        return ['pending', 'requested', 'request_sent'].includes(vmStatus);
    })());
    const invited = !isOnPersonalAccount ? false : Boolean(
        viewerMembership?.has_invite ?? viewerMembership?.hasInvite ??
        viewerMembership?.is_invited ?? viewerMembership?.isInvited ??
        g?.has_invite ?? g?.hasInvite ?? g?.is_invited ?? g?.isInvited
    );

    const canManage = isOnPersonalAccount && (isOwner || isAdmin);

    const memberCount = Number(g?.member_count ?? g?.memberCount ?? 0) || 0;
    const postsCountRaw = Array.isArray(groupPosts)
        ? groupPosts.length
        : Number(g?.post_count ?? g?.posts_count ?? g?.postsCount ?? 0);
    const postsCount = Number.isFinite(postsCountRaw) ? postsCountRaw : 0;

    const categoryLabel = safeStr(g?.category_name) || safeStr(g?.category) || 'Uncategorized';
    const mainCategory = getGroupMainCategory(g);
    const CategoryIcon = GROUP_MAIN_ICON[mainCategory] || CategoryOutlinedIcon;

    const locationLabel = formatLocation(g);
    const groupImageSrc = getGroupPhotoSrc(g);
    const hasCustomPhoto = hasCustomGroupPhoto(g);
    const coverPhotoSrc = getCoverPhotoSrc(g);

    const roleKey = isOwner ? 'owner' : isAdmin ? 'admin' : 'member';
    const roleConfig = ROLE_CONFIG[roleKey];
    const RoleIcon = roleConfig.icon;

    const visibilityLabel = isHidden ? 'Hidden' : isPrivate ? 'Private' : 'Public';

    /** Whether the viewer should see limited content (private/hidden + not a member) */
    const isGated = (isPrivate || isHidden) && !isMember && !canManage && !personalAccountCanManage;

    return (
        <>
            <Box
                sx={{
                    position: isSticky ? 'sticky' : 'relative',
                    top: isSticky ? 8 : 'auto',
                    zIndex: isSticky ? 12 : 'auto',
                }}
            >
                {/* ============ COVER PHOTO BANNER (only if cover photo exists) ============ */}
                {coverPhotoSrc && (
                    <Box
                        sx={(t) => ({
                            position: 'relative',
                            width: '100%',
                            height: { xs: 140, sm: 180, md: 200 },
                            overflow: 'hidden',
                            bgcolor: 'primary.main',
                        })}
                    >
                        <Box
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                backgroundImage: `linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.30)), url(${coverPhotoSrc})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />
                    </Box>
                )}

                {/* ============ NAME / AVATAR / LOCATION (BELOW BANNER) ============ */}
                <Box
                    sx={{
                        position: 'relative',
                        bgcolor: 'background.paper',
                        px: { xs: 2, sm: 3 },
                        pt: { xs: 0, sm: 0 },
                        pb: 2,
                    }}
                >
                    {/* 3-dot menu — upper right, matches PostList style */}
                    <Box sx={{ position: 'absolute', top: 8, right: { xs: 8, sm: 12 }, zIndex: 5 }}>
                        <IconButton
                            size="small"
                            aria-label="Group options"
                            onClick={(e) => { e.stopPropagation(); setDotMenuEl(e.currentTarget); }}
                            sx={(t) => ({
                                width: 32,
                                height: 32,
                                bgcolor: alpha(t.palette.background.paper, 0.90),
                                color: 'text.secondary',
                                '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                            })}
                        >
                            <MoreVertIcon fontSize="small" />
                        </IconButton>

                        <SmartMenu
                            disableScrollLock
                            anchorEl={dotMenuEl}
                            open={dotMenuOpen}
                            onClose={(e) => { if (e) e.stopPropagation(); setDotMenuEl(null); }}
                            onClick={(e) => e.stopPropagation()}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            PaperProps={{
                                sx: {
                                    mt: 0.5,
                                    borderRadius: 2.5,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    boxShadow: (t) => t.custom.shadows.lg,
                                    minWidth: 200,
                                    py: 0.5,
                                },
                            }}
                        >
                            {[
                                <MenuItem key="copy-link" onClick={(e) => {
                                    e.stopPropagation();
                                    setDotMenuEl(null);
                                    const slug = g?.group_username || g?.groupUsername || g?.handle || g?.username || g?.slug || g?.id || '';
                                    const url = `${window.location.origin}/groups/${slug}`;
                                    navigator.clipboard.writeText(url).then(() => setCopyToast(true)).catch(() => {
                                        const ta = document.createElement('textarea'); ta.value = url;
                                        document.body.appendChild(ta); ta.select(); document.execCommand('copy');
                                        document.body.removeChild(ta); setCopyToast(true);
                                    });
                                }} sx={{ py: 1 }}>
                                    <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Copy link" />
                                </MenuItem>,
                                <Divider key="report-divider" sx={{ my: 0.5 }} />,
                                <MenuItem key="report-item" onClick={(e) => {
                                    e.stopPropagation();
                                    setDotMenuEl(null);
                                    setReportOpen(true);
                                }} sx={{ py: 1 }}>
                                    <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Report group" />
                                </MenuItem>,
                            ].filter(Boolean)}
                        </SmartMenu>
                    </Box>
                    {/* Avatar + Name row */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            gap: { xs: 1.5, sm: 2 },
                            mt: coverPhotoSrc ? { xs: `${-avatarSize * 0.45}px`, sm: `${-avatarSize * 0.5}px` } : 0,
                        }}
                    >
                        {/* Avatar */}
                        <Box
                            sx={(t) => ({
                                width: { xs: avatarSize * 0.82, sm: avatarSize },
                                height: { xs: avatarSize * 0.82, sm: avatarSize },
                                borderRadius: '50%',
                                border: '4px solid',
                                borderColor: t.palette.background.paper,
                                backgroundColor: hasCustomPhoto ? t.palette.background.paper : alpha(t.palette.primary.main, 0.14),
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                            })}
                        >
                            {hasCustomPhoto ? (
                                <Box
                                    component="img"
                                    alt={g?.name || 'Group'}
                                    src={groupImageSrc}
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                                />
                            ) : (
                                <GroupsIcon sx={(t) => ({ fontSize: avatarSize * 0.45, color: t.palette.primary.main })} />
                            )}
                        </Box>

                        {/* Name + location */}
                        <Box sx={{ flex: 1, minWidth: 0, pb: 0.5 }}>
                            <Typography
                                sx={{
                                    fontWeight: 900,
                                    fontSize: { xs: 20, sm: 24 },
                                    lineHeight: 1.2,
                                    color: 'text.primary',
                                    overflowWrap: 'anywhere',
                                    wordBreak: 'break-word',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                {g?.name || 'Group'}
                            </Typography>

                            {/* Group username */}
                            {(g?.group_username || g?.groupUsername) && (
                                <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mt: 0.25 }}>
                                    @{String(g?.group_username || g?.groupUsername || '').replace(/^@/, '')}
                                </Typography>
                            )}

                            {locationLabel && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                    <LocationOnRoundedIcon sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} />
                                    <Typography
                                        sx={{
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: 'text.secondary',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: { xs: 200, sm: 320, md: 440 },
                                        }}
                                    >
                                        {locationLabel}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>

                {/* ============ PRIVATE GROUP GATE (non-members of private/hidden groups) ============ */}
                {isGated && (
                    <Box
                        sx={(t) => ({
                            mx: { xs: 2, sm: 3 },
                            mb: 2,
                            p: { xs: 2.5, sm: 3.5 },
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: alpha(t.palette.divider, 0.12),
                            bgcolor: alpha(t.palette.primary.main, 0.03),
                            textAlign: 'center',
                        })}
                    >
                        <Box
                            sx={(t) => ({
                                width: 56,
                                height: 56,
                                borderRadius: '50%',
                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 2,
                            })}
                        >
                            <LockIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                        </Box>

                        <Typography sx={{ fontWeight: 800, fontSize: 17, mb: 0.5, color: 'text.primary' }}>
                            {isHidden ? 'Hidden Group' : 'Private Group'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 380, mx: 'auto', lineHeight: 1.5 }}>
                            {isHidden
                                ? 'This group is hidden. Only members can see posts and who\'s in the group.'
                                : 'This group is private. You need to be approved by an admin before you can see posts and members.'}
                        </Typography>

                        <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
                            {/* Info chips */}
                            <Chip
                                size="small"
                                icon={<CategoryIcon sx={{ fontSize: 14 }} />}
                                label={categoryLabel}
                                variant="outlined"
                                sx={(t) => ({
                                    borderRadius: 999,
                                    fontWeight: 700,
                                    fontSize: 12,
                                    height: 28,
                                    borderColor: alpha(t.palette.divider, 0.18),
                                    '& .MuiChip-icon': { color: t.palette.text.secondary },
                                    '& .MuiChip-label': { px: 0.75 },
                                })}
                            />
                            <Chip
                                size="small"
                                icon={<GroupsOutlinedIcon sx={{ fontSize: 14 }} />}
                                label={`${memberCount.toLocaleString()} ${memberCount === 1 ? 'member' : 'members'}`}
                                variant="outlined"
                                sx={(t) => ({
                                    borderRadius: 999,
                                    fontWeight: 700,
                                    fontSize: 12,
                                    height: 28,
                                    borderColor: alpha(t.palette.divider, 0.18),
                                    '& .MuiChip-icon': { color: t.palette.text.secondary },
                                    '& .MuiChip-label': { px: 0.75 },
                                })}
                            />
                            {(() => {
                                const rawDate = g?.created_at || g?.createdAt;
                                if (!rawDate) return null;
                                const d = new Date(rawDate);
                                if (Number.isNaN(d.getTime())) return null;
                                return (
                                    <Chip
                                        size="small"
                                        icon={<CalendarTodayIcon sx={{ fontSize: 13 }} />}
                                        label={`Created ${d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}`}
                                        variant="outlined"
                                        sx={(t) => ({
                                            borderRadius: 999,
                                            fontWeight: 700,
                                            fontSize: 12,
                                            height: 28,
                                            borderColor: alpha(t.palette.divider, 0.18),
                                            '& .MuiChip-icon': { color: t.palette.text.secondary },
                                            '& .MuiChip-label': { px: 0.75 },
                                        })}
                                    />
                                );
                            })()}
                        </Stack>

                        <Box sx={{ mt: 2.5 }}>
                            {/* Requested */}
                            {requested && (
                                <Chip
                                    size="small"
                                    icon={<HourglassEmptyIcon sx={{ fontSize: 13 }} />}
                                    label="Request Pending"
                                    color="warning"
                                    variant="outlined"
                                    sx={{ borderRadius: 999, fontWeight: 800, fontSize: 12, height: 32 }}
                                />
                            )}

                            {/* Invited */}
                            {!requested && invited && (
                                <Stack spacing={1.5} alignItems="center">
                                    <Chip
                                        size="small"
                                        icon={<MailOutlineIcon sx={{ fontSize: 13 }} />}
                                        label="You've been invited!"
                                        color="info"
                                        sx={{ borderRadius: 999, fontWeight: 800, fontSize: 12, height: 32 }}
                                    />
                                    {isOnPersonalAccount ? (
                                        <Stack direction="row" spacing={1}>
                                            {typeof onDeclineInvite === 'function' && (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={onDeclineInvite}
                                                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}
                                                >
                                                    Decline
                                                </Button>
                                            )}
                                            {typeof onAcceptInvite === 'function' && (
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    onClick={onAcceptInvite}
                                                    startIcon={<CheckCircleIcon sx={{ fontSize: 15 }} />}
                                                    disableElevation
                                                    sx={{
                                                        borderRadius: 999,
                                                        textTransform: 'none',
                                                        fontWeight: 800,
                                                        background: 'linear-gradient(135deg, #43A047 0%, #2E7D32 100%)',
                                                        boxShadow: '0 2px 8px rgba(46,125,50,0.3)',
                                                    }}
                                                >
                                                    Accept Invite
                                                </Button>
                                            )}
                                        </Stack>
                                    ) : (
                                        <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.6 }}>
                                            Switch to your personal account to accept this invite
                                        </Typography>
                                    )}
                                </Stack>
                            )}

                            {/* Join / Request to Join */}
                            {!requested && !invited && (
                                <Button
                                    variant="contained"
                                    onClick={() => handleJoinClick(g)}
                                    disableElevation
                                    startIcon={<LockIcon sx={{ fontSize: 16 }} />}
                                    sx={(t) => ({
                                        borderRadius: 999,
                                        textTransform: 'none',
                                        fontWeight: 800,
                                        px: 3.5,
                                        py: 1,
                                        fontSize: '0.9rem',
                                        background: `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${alpha(t.palette.primary.dark, 0.9)} 100%)`,
                                        boxShadow: `0 2px 12px ${alpha(t.palette.primary.main, 0.35)}`,
                                        transition: 'all 200ms ease',
                                        '&:hover': {
                                            boxShadow: `0 4px 18px ${alpha(t.palette.primary.main, 0.45)}`,
                                            transform: 'translateY(-1px)',
                                        },
                                    })}
                                >
                                    Request to Join
                                </Button>
                            )}
                        </Box>
                    </Box>
                )}

                {/* ============ ACTION BAR (shown when NOT gated) ============ */}
                {!isGated && showJoinCta && (
                    <Box
                        sx={(t) => ({
                            px: { xs: 2, sm: 3 },
                            py: 1.25,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1.5,
                            flexWrap: 'wrap',
                            borderBottom: '1px solid',
                            borderColor: alpha(t.palette.divider, 0.08),
                            bgcolor: 'background.paper',
                        })}
                    >
                        {/* Left: Info chips */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            {/* Role Badge */}
                            {isMember && (
                                <Chip
                                    size="small"
                                    icon={<RoleIcon sx={{ fontSize: 13 }} />}
                                    label={roleConfig.label}
                                    sx={(t) => ({
                                        borderRadius: 999,
                                        fontWeight: 800,
                                        fontSize: 12,
                                        height: 28,
                                        ...getRoleChipStyles(t, roleKey),
                                        color: '#fff',
                                        border: 'none',
                                        '& .MuiChip-label': { px: 1 },
                                        '& .MuiChip-icon': { color: '#fff', ml: 0.5 },
                                    })}
                                />
                            )}
                            <Chip
                                size="small"
                                icon={
                                    isHidden
                                        ? <VisibilityOffIcon sx={{ fontSize: 14 }} />
                                        : isPrivate
                                            ? <LockIcon sx={{ fontSize: 14 }} />
                                            : <PublicIcon sx={{ fontSize: 14 }} />
                                }
                                label={visibilityLabel}
                                variant="outlined"
                                sx={(t) => ({
                                    borderRadius: 999,
                                    fontWeight: 700,
                                    fontSize: 12,
                                    height: 28,
                                    borderColor: alpha(t.palette.divider, 0.18),
                                    '& .MuiChip-icon': { color: t.palette.text.secondary },
                                    '& .MuiChip-label': { px: 0.75 },
                                })}
                            />
                            <Chip
                                size="small"
                                icon={<CategoryIcon sx={{ fontSize: 14 }} />}
                                label={categoryLabel}
                                variant="outlined"
                                sx={(t) => ({
                                    borderRadius: 999,
                                    fontWeight: 700,
                                    fontSize: 12,
                                    height: 28,
                                    maxWidth: { xs: 160, sm: 240 },
                                    borderColor: alpha(t.palette.divider, 0.18),
                                    '& .MuiChip-icon': { color: t.palette.text.secondary },
                                    '& .MuiChip-label': { px: 0.75 },
                                })}
                            />
                            <Chip
                                size="small"
                                icon={<GroupsOutlinedIcon sx={{ fontSize: 14 }} />}
                                label={`${memberCount.toLocaleString()} ${memberCount === 1 ? 'member' : 'members'}`}
                                variant="outlined"
                                sx={(t) => ({
                                    borderRadius: 999,
                                    fontWeight: 700,
                                    fontSize: 12,
                                    height: 28,
                                    borderColor: alpha(t.palette.divider, 0.18),
                                    '& .MuiChip-icon': { color: t.palette.text.secondary },
                                    '& .MuiChip-label': { px: 0.75 },
                                })}
                            />
                            <Chip
                                size="small"
                                icon={<ArticleOutlinedIcon sx={{ fontSize: 14 }} />}
                                label={`${postsCount.toLocaleString()} ${postsCount === 1 ? 'post' : 'posts'}`}
                                variant="outlined"
                                sx={(t) => ({
                                    borderRadius: 999,
                                    fontWeight: 700,
                                    fontSize: 12,
                                    height: 28,
                                    borderColor: alpha(t.palette.divider, 0.18),
                                    display: { xs: 'none', sm: 'inline-flex' },
                                    '& .MuiChip-icon': { color: t.palette.text.secondary },
                                    '& .MuiChip-label': { px: 0.75 },
                                })}
                            />
                            {(() => {
                                const rawDate = g?.created_at || g?.createdAt;
                                if (!rawDate) return null;
                                const d = new Date(rawDate);
                                if (Number.isNaN(d.getTime())) return null;
                                return (
                                    <Chip
                                        size="small"
                                        icon={<CalendarTodayIcon sx={{ fontSize: 13 }} />}
                                        label={`Created ${d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}`}
                                        variant="outlined"
                                        sx={(t) => ({
                                            borderRadius: 999,
                                            fontWeight: 700,
                                            fontSize: 12,
                                            height: 28,
                                            borderColor: alpha(t.palette.divider, 0.18),
                                            display: { xs: 'none', sm: 'inline-flex' },
                                            '& .MuiChip-icon': { color: t.palette.text.secondary },
                                            '& .MuiChip-label': { px: 0.75 },
                                        })}
                                    />
                                );
                            })()}
                        </Box>

                        {/* Right: Actions */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            {/* ---- MEMBER VIEW ---- */}
                            {isMember && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    {/* Admin Console Button */}
                                    {canManage && isOnPersonalAccount && typeof onOpenAdminConsole === 'function' && (
                                        <Button
                                            size="small"
                                            variant="contained"
                                            onClick={onOpenAdminConsole}
                                            startIcon={<SettingsIcon sx={{ fontSize: 15 }} />}
                                            disableElevation
                                            sx={(t) => ({
                                                borderRadius: 999,
                                                textTransform: 'none',
                                                fontWeight: 800,
                                                whiteSpace: 'nowrap',
                                                px: 2,
                                                py: 0.5,
                                                fontSize: '0.8rem',
                                                position: 'relative',
                                                background: `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${alpha(t.palette.primary.dark, 0.9)} 100%)`,
                                                boxShadow: `0 2px 8px ${alpha(t.palette.primary.main, 0.3)}`,
                                                transition: 'all 180ms ease',
                                                '&:hover': {
                                                    boxShadow: `0 4px 16px ${alpha(t.palette.primary.main, 0.4)}`,
                                                    transform: 'translateY(-1px)',
                                                },
                                            })}
                                        >
                                            Admin Console
                                            {pendingRequestsCount > 0 && (
                                                <Box
                                                    sx={(t) => ({
                                                        position: 'absolute',
                                                        top: -6,
                                                        right: -6,
                                                        minWidth: 18,
                                                        height: 18,
                                                        borderRadius: 999,
                                                        bgcolor: t.palette.error.main,
                                                        color: '#fff',
                                                        fontSize: 10,
                                                        fontWeight: 900,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        px: 0.5,
                                                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                                                    })}
                                                >
                                                    {pendingRequestsCount > 99 ? '99+' : pendingRequestsCount}
                                                </Box>
                                            )}
                                        </Button>
                                    )}
                                    {canManage && !isOnPersonalAccount && (
                                        <Tooltip title="Switch to your personal account to view the Admin Console">
                                    <span>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            disabled
                                            startIcon={<SettingsIcon sx={{ fontSize: 15 }} />}
                                            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, whiteSpace: 'nowrap', px: 2, py: 0.5, fontSize: '0.8rem' }}
                                        >
                                            Admin Console
                                        </Button>
                                    </span>
                                        </Tooltip>
                                    )}

                                    {/* Member Quick Actions */}
                                    <Stack direction="row" spacing={0.5}>
                                        {typeof onToggleMute === 'function' && (
                                            <Tooltip title={isMuted ? 'Unmute notifications' : 'Mute notifications'}>
                                                <IconButton
                                                    size="small"
                                                    onClick={onToggleMute}
                                                    sx={(t) => ({
                                                        width: 32,
                                                        height: 32,
                                                        border: '1px solid',
                                                        borderColor: alpha(t.palette.divider, 0.15),
                                                        transition: 'all 160ms ease',
                                                        '&:hover': {
                                                            bgcolor: alpha(t.palette.primary.main, 0.06),
                                                            borderColor: alpha(t.palette.primary.main, 0.2),
                                                        },
                                                    })}
                                                >
                                                    {isMuted ? (
                                                        <NotificationsOffIcon sx={{ fontSize: 17 }} />
                                                    ) : (
                                                        <NotificationsIcon sx={{ fontSize: 17 }} />
                                                    )}
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        {!isOwner && typeof onLeave === 'function' && (
                                            <Tooltip title="Leave group">
                                                <IconButton
                                                    size="small"
                                                    onClick={onLeave}
                                                    sx={(t) => ({
                                                        width: 32,
                                                        height: 32,
                                                        border: '1px solid',
                                                        borderColor: alpha(t.palette.divider, 0.15),
                                                        transition: 'all 160ms ease',
                                                        '&:hover': {
                                                            bgcolor: alpha(t.palette.error.main, 0.06),
                                                            borderColor: alpha(t.palette.error.main, 0.25),
                                                            color: 'error.main',
                                                        },
                                                    })}
                                                >
                                                    <ExitToAppIcon sx={{ fontSize: 17 }} />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Stack>
                                </Box>
                            )}

                            {/* ---- INVITED VIEW ---- */}
                            {!isMember && invited && (
                                <Stack spacing={1} direction="row" alignItems="center">
                                    <Chip
                                        size="small"
                                        icon={<MailOutlineIcon sx={{ fontSize: 13 }} />}
                                        label="Invited"
                                        color="info"
                                        sx={{ borderRadius: 999, fontWeight: 800, fontSize: 11.5, height: 28 }}
                                    />
                                    {isOnPersonalAccount ? (
                                        <Stack direction="row" spacing={0.75}>
                                            {typeof onDeclineInvite === 'function' && (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={onDeclineInvite}
                                                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}
                                                >
                                                    Decline
                                                </Button>
                                            )}
                                            {typeof onAcceptInvite === 'function' && (
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    onClick={onAcceptInvite}
                                                    startIcon={<CheckCircleIcon sx={{ fontSize: 15 }} />}
                                                    disableElevation
                                                    sx={{
                                                        borderRadius: 999,
                                                        textTransform: 'none',
                                                        fontWeight: 800,
                                                        background: 'linear-gradient(135deg, #43A047 0%, #2E7D32 100%)',
                                                        boxShadow: '0 2px 8px rgba(46,125,50,0.3)',
                                                    }}
                                                >
                                                    Accept
                                                </Button>
                                            )}
                                        </Stack>
                                    ) : (
                                        <Tooltip title="Switch to your personal account to accept this invite">
                                            <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.6 }}>
                                                Switch to personal account
                                            </Typography>
                                        </Tooltip>
                                    )}
                                </Stack>
                            )}

                            {/* ---- REQUESTED VIEW ---- */}
                            {!isMember && !invited && requested && (
                                <Chip
                                    size="small"
                                    icon={<HourglassEmptyIcon sx={{ fontSize: 13 }} />}
                                    label="Request Pending"
                                    color="warning"
                                    variant="outlined"
                                    sx={{ borderRadius: 999, fontWeight: 800, fontSize: 11.5, height: 28 }}
                                />
                            )}

                            {/* ---- NON-MEMBER JOIN ---- */}
                            {!isMember && !invited && !requested && !personalAccountCanManage && (
                                <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => handleJoinClick(g)}
                                    disableElevation
                                    startIcon={(isPrivate || isHidden) ? <LockIcon sx={{ fontSize: 16 }} /> : null}
                                    sx={(t) => ({
                                        borderRadius: 999,
                                        textTransform: 'none',
                                        fontWeight: 800,
                                        whiteSpace: 'nowrap',
                                        px: 2.5,
                                        py: 0.75,
                                        background: `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${alpha(t.palette.primary.dark, 0.9)} 100%)`,
                                        boxShadow: `0 2px 10px ${alpha(t.palette.primary.main, 0.35)}`,
                                        transition: 'all 200ms ease',
                                        '&:hover': {
                                            boxShadow: `0 4px 18px ${alpha(t.palette.primary.main, 0.45)}`,
                                            transform: 'translateY(-1px)',
                                        },
                                    })}
                                >
                                    {(isPrivate || isHidden) ? 'Request to Join' : 'Join Group'}
                                </Button>
                            )}
                            {!isMember && !invited && !requested && !isOnPersonalAccount && personalAccountCanManage && (
                                <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => setSwitchAccountOpen(true)}
                                    disableElevation
                                    startIcon={<SettingsIcon sx={{ fontSize: 15 }} />}
                                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, whiteSpace: 'nowrap', px: 2, py: 0.5, fontSize: '0.8rem' }}
                                >
                                    Admin Console
                                </Button>
                            )}
                        </Box>
                    </Box>
                )}
            </Box>

            <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} onSubmit={submitReport} />
            <SuccessSnackbar
                open={copyToast}
                onClose={() => setCopyToast(false)}
                message="Link copied to clipboard"
            />

            <JoinQuestionsDialog
                open={joinQDialogOpen}
                onClose={() => setJoinQDialogOpen(false)}
                onSubmit={handleJoinQuestionsSubmit}
                questions={joinQuestions}
                groupName={g?.name || 'this group'}
                submitting={joinQSubmitting}
            />

            <SwitchAccountDialog
                open={switchAccountOpen}
                onClose={() => setSwitchAccountOpen(false)}
            />
        </>
    );
}

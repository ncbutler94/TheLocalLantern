import React, { useState, useCallback, useEffect } from 'react';
import {
    Box, Button, Chip, IconButton, MenuItem, ListItemIcon, ListItemText,
    Divider, Stack, Tooltip, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SuccessSnackbar from '../../../../components/SuccessSnackbar';
import LockIcon from '@mui/icons-material/Lock';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import StarIcon from '@mui/icons-material/Star';
import ShieldIcon from '@mui/icons-material/Shield';
import PersonIcon from '@mui/icons-material/Person';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PublicIcon from '@mui/icons-material/Public';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LinkIcon from '@mui/icons-material/Link';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';

import { ReportDialog } from '../../../../components/ActionBar';
import SmartMenu from '../../../../components/SmartMenu';

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

/**
 * GroupHeaderCard
 * ----------------
 * Hero-style group header with consistent brand coloring, cover photo support,
 * glass badges, role-based actions, and admin console access.
 */

const DEFAULT_AVATAR_SIZE = 110;
const COVER_ASPECT_RATIO = 3.5;

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
        .replace(/['']/g, '')
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
                                            onOpenAdminConsole,
                                            isSticky = false,
                                            showJoinCta = true,
                                            pendingRequestsCount = 0,
                                            isOnPersonalAccount = true,
                                            personalAccountCanManage = false,
                                            // viewerMembership prop — used as the primary source for role/status
                                            viewerMembership,
                                            onShareGroup,
                                        }) {
    // ── 3-dot menu state (matches PostList pattern) — must be before early return ──
    const [dotMenuEl, setDotMenuEl] = useState(null);
    const dotMenuOpen = Boolean(dotMenuEl);
    const [copyToast, setCopyToast] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);

    // Optimistic bump: increment post count when a new post is created in this group
    const [postCountBump, setPostCountBump] = useState(0);
    const groupIdForEvent = group?.id ?? group?.group_id ?? null;

    useEffect(() => {
        const handler = (e) => {
            const detail = e?.detail;
            if (!groupIdForEvent) return;
            if (String(detail?.groupId) === String(groupIdForEvent)) {
                setPostCountBump((prev) => prev + 1);
            }
        };
        window.addEventListener('ll:group:postCreated', handler);
        return () => window.removeEventListener('ll:group:postCreated', handler);
    }, [groupIdForEvent]);

    // Compute post count base before early return so the reset hook is always called
    const postsCountRawEarly = Array.isArray(groupPosts)
        ? groupPosts.length
        : Number(group?.post_count ?? group?.posts_count ?? group?.postsCount ?? 0);
    const postsCountBase = Number.isFinite(postsCountRawEarly) ? postsCountRawEarly : 0;

    // Reset bump when the underlying data changes (parent refreshed)
    useEffect(() => {
        setPostCountBump(0);
    }, [postsCountBase]);

    const submitReport = useCallback(async ({ reason, details }) => {
        const gid = group?.id || group?.group_id;
        if (!gid) return;
        const urls = [
            `/api/groups/${encodeURIComponent(gid)}/flag`,
            `/api/community/groups/${encodeURIComponent(gid)}/flag`,
        ];
        for (const url of urls) {
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason, details }),
                });
                if (res.ok) return;
            } catch {
                // try next
            }
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
    const postsCount = postsCountBase + postCountBump;

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

    // ── 3-dot menu handlers ──
    const handleDotMenuOpen = (e) => {
        e.stopPropagation();
        setDotMenuEl(e.currentTarget);
    };
    const handleDotMenuClose = (e) => {
        if (e) e.stopPropagation();
        setDotMenuEl(null);
    };

    const handleCopyLink = (e) => {
        if (e) e.stopPropagation();
        handleDotMenuClose(e);
        const slug =
            g?.group_username || g?.groupUsername || g?.handle ||
            g?.username || g?.slug || g?.id || '';
        const groupUrl = `${window.location.origin}/groups/${slug}`;
        navigator.clipboard.writeText(groupUrl).then(() => {
            setCopyToast(true);
        }).catch(() => {
            const textArea = document.createElement('textarea');
            textArea.value = groupUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopyToast(true);
        });
    };

    const handleReportClick = (e) => {
        if (e) e.stopPropagation();
        handleDotMenuClose(e);
        setReportOpen(true);
    };

    return (
        <>
            <Box
                sx={{
                    position: isSticky ? 'sticky' : 'relative',
                    top: isSticky ? 8 : 'auto',
                    zIndex: isSticky ? 12 : 'auto',
                }}
            >
                {/* ============ COVER PHOTO (full width, tighter on mobile) ============ */}
                {coverPhotoSrc && (
                    <Box
                        sx={(t) => ({
                            position: 'relative',
                            width: '100%',
                            // Shorter cover on mobile for faster reveal of content
                            paddingTop: { xs: `${100 / 2.8}%`, sm: `${100 / COVER_ASPECT_RATIO}%` },
                            overflow: 'hidden',
                            bgcolor: 'primary.main',
                        })}
                    >
                        <Box
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                backgroundImage: `linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.35)), url(${coverPhotoSrc})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />
                    </Box>
                )}

                {/* ============ PROFILE INFO (below cover) ============ */}
                <Box sx={{ bgcolor: 'background.paper', position: 'relative' }}>
                    {/* 3-dot menu — upper right */}
                    <Box sx={{ position: 'absolute', top: { xs: 8, sm: 12 }, right: { xs: 8, sm: 12 }, zIndex: 5 }}>
                        <IconButton
                            size="small"
                            aria-label="Group options"
                            onClick={handleDotMenuOpen}
                            sx={(t) => ({
                                width: 32,
                                height: 32,
                                bgcolor: alpha(t.palette.background.paper, 0.90),
                                color: 'text.secondary',
                                position: 'relative',
                                '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                            })}
                        >
                            <MoreVertIcon fontSize="small" />
                            {/* Mobile badge — shows pending count when admin items are in menu */}
                            {canManage && isOnPersonalAccount && pendingRequestsCount > 0 && (
                                <Box
                                    sx={(t) => ({
                                        display: { xs: 'flex', sm: 'none' },
                                        position: 'absolute',
                                        top: -3,
                                        right: -3,
                                        minWidth: 14,
                                        height: 14,
                                        borderRadius: 999,
                                        bgcolor: t.palette.error.main,
                                        color: 'common.white',
                                        fontSize: 8,
                                        fontWeight: 900,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        px: 0.3,
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                                    })}
                                >
                                    {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                                </Box>
                            )}
                        </IconButton>

                        <SmartMenu
                            disableScrollLock
                            anchorEl={dotMenuEl}
                            open={dotMenuOpen}
                            onClose={handleDotMenuClose}
                            onClick={(e) => e.stopPropagation()}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            PaperProps={{
                                sx: {
                                    mt: 0.5,
                                    borderRadius: 2.5,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                    minWidth: 200,
                                    py: 0.5,
                                },
                            }}
                        >
                            {[
                                /* Admin Console — mobile only, for owner/admin */
                                canManage && isOnPersonalAccount && typeof onOpenAdminConsole === 'function' && (
                                    <MenuItem key="admin-console" onClick={(e) => { handleDotMenuClose(e); onOpenAdminConsole(); }} sx={{ py: 1, display: { sm: 'none' } }}>
                                        <ListItemIcon>
                                            <SettingsIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    Admin Console
                                                    {pendingRequestsCount > 0 && (
                                                        <Box
                                                            component="span"
                                                            sx={(t) => ({
                                                                minWidth: 18,
                                                                height: 18,
                                                                borderRadius: 999,
                                                                bgcolor: t.palette.error.main,
                                                                color: 'common.white',
                                                                fontSize: 10,
                                                                fontWeight: 900,
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                px: 0.5,
                                                            })}
                                                        >
                                                            {pendingRequestsCount > 99 ? '99+' : pendingRequestsCount}
                                                        </Box>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </MenuItem>
                                ),

                                /* Share — mobile only */
                                typeof onShareGroup === 'function' && (
                                    <MenuItem key="share-group" onClick={(e) => { handleDotMenuClose(e); onShareGroup(); }} sx={{ py: 1, display: { sm: 'none' } }}>
                                        <ListItemIcon>
                                            <ShareOutlinedIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary="Share group" />
                                    </MenuItem>
                                ),

                                /* Copy link — always */
                                <MenuItem key="copy-link" onClick={handleCopyLink} sx={{ py: 1 }}>
                                    <ListItemIcon>
                                        <LinkIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary="Copy link" />
                                </MenuItem>,

                                /* Leave — mobile only, for non-owner members */
                                isMember && !isOwner && typeof onLeave === 'function' && (
                                    <MenuItem key="leave-group" onClick={(e) => { handleDotMenuClose(e); onLeave(); }} sx={(t) => ({ py: 1, display: { sm: 'none' }, color: t.palette.error.main })}>
                                        <ListItemIcon>
                                            <ExitToAppIcon fontSize="small" sx={{ color: 'error.main' }} />
                                        </ListItemIcon>
                                        <ListItemText primary="Leave group" />
                                    </MenuItem>
                                ),

                                /* Report */
                                <Divider key="report-divider" sx={{ my: 0.5 }} />,
                                <MenuItem key="report-item" onClick={handleReportClick} sx={{ py: 1 }}>
                                    <ListItemIcon>
                                        <FlagOutlinedIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary="Report group" />
                                </MenuItem>,
                            ].filter(Boolean)}
                        </SmartMenu>
                    </Box>

                    <Box sx={{ p: { xs: 1.75, sm: 3 }, pt: { xs: 1.25, sm: 3 } }}>
                        <Stack direction="row" spacing={{ xs: 1.5, sm: 3 }} alignItems="flex-start">
                            {/* Avatar — overlaps cover on both mobile and desktop */}
                            <Box
                                sx={(t) => ({
                                    width: { xs: 72, sm: avatarSize },
                                    height: { xs: 72, sm: avatarSize },
                                    borderRadius: '50%',
                                    border: { xs: '3px solid', sm: '4px solid' },
                                    borderColor: 'background.paper',
                                    backgroundColor: hasCustomPhoto ? 'rgba(255,255,255,0.9)' : alpha(t.palette.primary.main, 0.14),
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    boxShadow: 3,
                                    mt: coverPhotoSrc ? { xs: -5, sm: -8 } : 0,
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
                                    <GroupsIcon sx={(t) => ({ fontSize: { xs: 32, sm: avatarSize * 0.45 }, color: t.palette.primary.main })} />
                                )}
                            </Box>

                            {/* Name + username + location — always left-aligned on mobile */}
                            <Box sx={{ flex: 1, textAlign: 'left', minWidth: 0, pt: { xs: 0.25, sm: 0 } }}>
                                <Typography
                                    variant="h5"
                                    sx={{
                                        fontWeight: 900,
                                        lineHeight: 1.15,
                                        overflowWrap: 'anywhere',
                                        wordBreak: 'break-word',
                                        letterSpacing: '-0.02em',
                                        fontSize: { xs: '1.1rem', sm: '1.5rem' },
                                    }}
                                >
                                    {g?.name || 'Group'}
                                </Typography>

                                {/* Group username */}
                                {(g?.group_username || g?.groupUsername) && (
                                    <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mt: 0.15, fontSize: { xs: 12.5, sm: 14 } }}>
                                        @{String(g?.group_username || g?.groupUsername || '').replace(/^@/, '')}
                                    </Typography>
                                )}

                                {locationLabel && (
                                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.35 }}>
                                        <LocationOnRoundedIcon sx={{ fontSize: { xs: 13, sm: 14 }, color: 'text.secondary', flexShrink: 0 }} />
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                fontWeight: 600,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                maxWidth: { xs: 180, sm: 280, md: 400 },
                                                fontSize: { xs: 12, sm: 14 },
                                            }}
                                        >
                                            {locationLabel}
                                        </Typography>
                                    </Stack>
                                )}
                            </Box>
                        </Stack>
                    </Box>
                </Box>

                {/* ============ ACTION BAR ============ */}
                {showJoinCta && (
                    <Box
                        sx={(t) => ({
                            px: { xs: 1.5, sm: 3 },
                            py: { xs: 0.75, sm: 1.25 },
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexDirection: 'row',
                            gap: { xs: 0.5, sm: 1.5 },
                            flexWrap: { xs: 'nowrap', sm: 'wrap' },
                            borderBottom: '1px solid',
                            borderColor: alpha(t.palette.divider, 0.08),
                            bgcolor: 'background.paper',
                        })}
                    >
                        {/* Left: Info chips — compact wrap grid */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                flexWrap: 'wrap',
                                justifyContent: 'flex-start',
                                flex: 1,
                                minWidth: 0,
                            }}
                        >
                            {/* Role Badge */}
                            {isMember && (
                                <Chip
                                    size="small"
                                    icon={<RoleIcon sx={{ fontSize: 13 }} />}
                                    label={roleConfig.label}
                                    sx={(t) => ({
                                        borderRadius: 999,
                                        fontWeight: 800,
                                        fontSize: { xs: 11, sm: 12 },
                                        height: { xs: 24, sm: 28 },
                                        ...getRoleChipStyles(t, roleKey),
                                        color: 'common.white',
                                        border: 'none',
                                        '& .MuiChip-label': { px: 0.75 },
                                        '& .MuiChip-icon': { color: 'common.white', ml: 0.5 },
                                    })}
                                />
                            )}
                            <Chip
                                size="small"
                                icon={
                                    isHidden
                                        ? <VisibilityOffIcon sx={{ fontSize: { xs: 12, sm: 14 } }} />
                                        : isPrivate
                                            ? <LockIcon sx={{ fontSize: { xs: 12, sm: 14 } }} />
                                            : <PublicIcon sx={{ fontSize: { xs: 12, sm: 14 } }} />
                                }
                                label={visibilityLabel}
                                variant="outlined"
                                sx={(t) => ({
                                    borderRadius: 999,
                                    fontWeight: 700,
                                    fontSize: { xs: 10.5, sm: 12 },
                                    height: { xs: 24, sm: 28 },
                                    borderColor: alpha(t.palette.divider, 0.18),
                                    '& .MuiChip-icon': { color: t.palette.text.secondary },
                                    '& .MuiChip-label': { px: 0.5 },
                                })}
                            />
                            <Chip
                                size="small"
                                icon={<CategoryIcon sx={{ fontSize: { xs: 12, sm: 14 } }} />}
                                label={categoryLabel}
                                variant="outlined"
                                sx={(t) => ({
                                    borderRadius: 999,
                                    fontWeight: 700,
                                    fontSize: { xs: 10.5, sm: 12 },
                                    height: { xs: 24, sm: 28 },
                                    maxWidth: { xs: 130, sm: 240 },
                                    borderColor: alpha(t.palette.divider, 0.18),
                                    '& .MuiChip-icon': { color: t.palette.text.secondary },
                                    '& .MuiChip-label': { px: 0.5 },
                                })}
                            />
                            {/* Members count — inline text on mobile instead of chip */}
                            <Typography
                                component="span"
                                sx={(t) => ({
                                    display: { xs: 'inline-flex', sm: 'none' },
                                    alignItems: 'center',
                                    gap: 0.35,
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    color: alpha(t.palette.text.primary, 0.55),
                                    pl: 0.25,
                                })}
                            >
                                <GroupsOutlinedIcon sx={{ fontSize: 13 }} />
                                {memberCount.toLocaleString()} {memberCount === 1 ? 'member' : 'members'}
                            </Typography>
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
                                    display: { xs: 'none', sm: 'inline-flex' },
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
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.75,
                                flexWrap: { xs: 'nowrap', sm: 'wrap' },
                                justifyContent: 'flex-end',
                                flexShrink: 0,
                            }}
                        >
                            {/* ---- MEMBER VIEW ---- */}
                            {isMember && (
                                <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    {/* Admin Console Button — desktop only (mobile is in 3-dot menu) */}
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
                                                        color: 'common.white',
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

                                    {/* Member Quick Actions — desktop only */}
                                    <Stack direction="row" spacing={0.5}>
                                        {typeof onShareGroup === 'function' && (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<ShareOutlinedIcon sx={{ fontSize: 15 }} />}
                                                onClick={onShareGroup}
                                                sx={(t) => ({
                                                    borderRadius: 999,
                                                    textTransform: 'none',
                                                    fontWeight: 800,
                                                    fontSize: 12.5,
                                                    px: 1.5,
                                                    py: 0.35,
                                                    minHeight: 32,
                                                    borderColor: alpha(t.palette.divider, 0.2),
                                                    color: 'text.secondary',
                                                    transition: 'all 160ms ease',
                                                    '&:hover': {
                                                        bgcolor: alpha(t.palette.primary.main, 0.06),
                                                        borderColor: alpha(t.palette.primary.main, 0.25),
                                                        color: t.palette.primary.main,
                                                    },
                                                })}
                                            >
                                                Share
                                            </Button>
                                        )}
                                        {!isOwner && typeof onLeave === 'function' && (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<ExitToAppIcon sx={{ fontSize: 15 }} />}
                                                onClick={onLeave}
                                                sx={(t) => ({
                                                    borderRadius: 999,
                                                    textTransform: 'none',
                                                    fontWeight: 800,
                                                    fontSize: 12.5,
                                                    px: 1.5,
                                                    py: 0.35,
                                                    minHeight: 32,
                                                    borderColor: alpha(t.palette.divider, 0.2),
                                                    color: 'text.secondary',
                                                    transition: 'all 160ms ease',
                                                    '&:hover': {
                                                        bgcolor: alpha(t.palette.error.main, 0.06),
                                                        borderColor: alpha(t.palette.error.main, 0.25),
                                                        color: t.palette.error.main,
                                                    },
                                                })}
                                            >
                                                Leave
                                            </Button>
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
                                                    sx={(t) => ({
                                                        borderRadius: 999,
                                                        textTransform: 'none',
                                                        fontWeight: 800,
                                                        background: `linear-gradient(135deg, ${t.palette.success.main} 0%, ${t.palette.success.dark} 100%)`,
                                                        boxShadow: `0 2px 8px ${alpha(t.palette.success.main, 0.3)}`,
                                                    })}
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
                                    variant="outlined"
                                    sx={(t) => ({
                                        borderRadius: 999,
                                        fontWeight: 800,
                                        fontSize: 11.5,
                                        height: 28,
                                        borderColor: alpha(t.palette.warning.main, 0.5),
                                        color: t.palette.warning.dark,
                                        bgcolor: alpha(t.palette.warning.main, 0.08),
                                        '& .MuiChip-icon': { color: t.palette.warning.main },
                                    })}
                                />
                            )}

                            {/* ---- NON-MEMBER JOIN ---- */}
                            {!isMember && !invited && !requested && isOnPersonalAccount && !personalAccountCanManage && (
                                <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => (typeof onJoin === 'function' ? onJoin(g) : undefined)}
                                    disableElevation
                                    startIcon={(isPrivate || isHidden) ? <LockIcon sx={{ fontSize: { xs: 13, sm: 16 } }} /> : null}
                                    sx={(t) => ({
                                        borderRadius: 999,
                                        textTransform: 'none',
                                        fontWeight: 800,
                                        whiteSpace: 'nowrap',
                                        px: { xs: 1.5, sm: 2.5 },
                                        py: { xs: 0.4, sm: 0.75 },
                                        fontSize: { xs: '0.72rem', sm: '0.85rem' },
                                        minHeight: { xs: 28, sm: 34 },
                                        background: `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${alpha(t.palette.primary.dark, 0.9)} 100%)`,
                                        boxShadow: `0 2px 10px ${alpha(t.palette.primary.main, 0.35)}`,
                                        transition: 'all 200ms ease',
                                        '&:hover': {
                                            boxShadow: `0 4px 18px ${alpha(t.palette.primary.main, 0.45)}`,
                                            transform: 'translateY(-1px)',
                                        },
                                    })}
                                >
                                    {(isPrivate || isHidden) ? <><Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Request to </Box>Join</> : 'Join'}
                                </Button>
                            )}
                            {!isMember && !invited && !requested && !isOnPersonalAccount && personalAccountCanManage && (
                                <Tooltip title="Switch to your personal profile to view the Admin Console">
                            <span>
                                <Button size="small" variant="contained" disabled startIcon={<SettingsIcon sx={{ fontSize: 15 }} />} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, whiteSpace: 'nowrap', px: 2, py: 0.5, fontSize: '0.8rem' }}>
                                    Admin Console
                                </Button>
                            </span>
                                </Tooltip>
                            )}
                            {!isMember && !invited && !requested && !isOnPersonalAccount && !personalAccountCanManage && (
                                <Tooltip title="Switch to your personal account to join groups">
                            <span>
                                <Button size="small" variant="contained" disabled sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, whiteSpace: 'nowrap', px: 2 }} startIcon={(isPrivate || isHidden) ? <LockIcon sx={{ fontSize: 16 }} /> : null}>
                                    {(isPrivate || isHidden) ? 'Request to Join' : 'Join'}
                                </Button>
                            </span>
                                </Tooltip>
                            )}

                            {/* Share button — desktop only for non-members (mobile in 3-dot menu) */}
                            {!isMember && typeof onShareGroup === 'function' && (
                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<ShareOutlinedIcon sx={{ fontSize: 15 }} />}
                                    onClick={onShareGroup}
                                    sx={(t) => ({
                                        display: { xs: 'none', sm: 'inline-flex' },
                                        borderRadius: 999,
                                        textTransform: 'none',
                                        fontWeight: 800,
                                        fontSize: 12.5,
                                        px: 1.5,
                                        py: 0.35,
                                        minHeight: 32,
                                        borderColor: alpha(t.palette.divider, 0.2),
                                        color: 'text.secondary',
                                        transition: 'all 160ms ease',
                                        '&:hover': {
                                            bgcolor: alpha(t.palette.primary.main, 0.06),
                                            borderColor: alpha(t.palette.primary.main, 0.25),
                                            color: t.palette.primary.main,
                                        },
                                    })}
                                >
                                    Share
                                </Button>
                            )}
                        </Box>
                    </Box>
                )}
            </Box>

            {/* Report Dialog — shared component matching PostList */}
            <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} onSubmit={submitReport} />

            {/* Copy link toast */}
            <SuccessSnackbar
                open={copyToast}
                onClose={() => setCopyToast(false)}
                message="Link copied to clipboard"
            />
        </>
    );
}
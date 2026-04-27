import { secureFetch } from '../../../utils/secureFetch';

// src/pages/community/GroupsList.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Stack,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    IconButton,
    InputAdornment,
    List,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    MenuItem,
    ListItemIcon,
    TextField,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import LinkIcon from '@mui/icons-material/Link';
import CloseIcon from '@mui/icons-material/Close';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import Diversity3RoundedIcon from '@mui/icons-material/Diversity3Rounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SuccessSnackbar from '../../../components/SuccessSnackbar';
import { ReportDialog } from '../../../components/ActionBar';
import SmartMenu from '../../../components/SmartMenu';

// Group MAIN category icons (must match CommunityFilter dropdown icons)
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
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import StarIcon from '@mui/icons-material/Star';
import ShieldIcon from '@mui/icons-material/Shield';
import PersonIcon from '@mui/icons-material/Person';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';

import { useAuth } from '../../../components/AuthModalContext';
import { useActiveAccount } from '../../../components/AccountContext';
import { ensureListStaggerKeyframes, getListStaggerSx } from '../../../themes/theme';
import PulsingDots from '../../../components/PulsingDots';
import JoinQuestionsDialog from '../groups/JoinQuestionsDialog';
import SwitchAccountDialog from '../groups/SwitchAccountDialog';

let sanitizeHtml;
try {
    const DOMPurify = require("dompurify");
    sanitizeHtml = (dirty) => DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br", "span", "div", "ul", "ol", "li"],
        ALLOWED_ATTR: ["href", "target", "rel", "class", "style"],
        ALLOW_DATA_ATTR: false,
    });
} catch {
    sanitizeHtml = (dirty) => String(dirty || "").replace(/<[^>]*>/g, "");
}
// Read the active account directly from localStorage + events (no context dependency)
function useIsNonPersonalAccount() {
    const read = () => {
        try {
            const raw = localStorage.getItem('ll:activeAccount');
            if (!raw) return false;
            const parsed = JSON.parse(raw);
            const t = String(parsed?.type || parsed?.account_type || parsed?.accountType || '').toLowerCase();
            return t === 'business' || t === 'artist';
        } catch { return false; }
    };
    const [value, setValue] = useState(read);
    useEffect(() => {
        const sync = () => setValue(read());
        window.addEventListener('ll:account:changed', sync);
        window.addEventListener('storage', sync);
        sync();
        return () => {
            window.removeEventListener('ll:account:changed', sync);
            window.removeEventListener('storage', sync);
        };
    }, []);
    return value;
}

const PAGE_SIZE = 30;


function getScrollParent(el) {
    if (!el || typeof window === 'undefined') return null;
    let node = el.parentElement;
    while (node) {
        const style = window.getComputedStyle(node);
        const overflowY = style.overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll') return node;
        node = node.parentElement;
    }
    return null;
}


async function fetchGroupDetails(groupId) {
    const idStr = groupId != null ? String(groupId) : '';
    if (!idStr) return null;

    const res = await secureFetch(`/api/groups/${encodeURIComponent(idStr)}`, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    if (!res.ok) return null;

    const data = await res.json().catch(() => null);
    // backend returns { group, viewerMembership }
    const g = data?.group || data?.data?.group || data?.groupData || null;
    return g && typeof g === 'object' ? g : null;
}

function extractRulesHtml(group) {
    const raw =
        safeStr(group?.rules_html) ||
        safeStr(group?.rulesHtml) ||
        safeStr(group?.rules) ||
        safeStr(group?.rulesText) ||
        '';
    // treat "null"/"undefined" as empty (safeStr already trims but may keep literal words)
    const s = String(raw || '').trim();
    const lower = s.toLowerCase();
    if (!s) return '';
    if (lower === 'null' || lower === 'undefined') return '';
    return s;
}

async function joinGroupRequest(groupId, answers) {
    const bodyPayload = {};
    if (Array.isArray(answers) && answers.length > 0) {
        bodyPayload.answers = answers;
    }
    const res = await secureFetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bodyPayload),
    });

    const text = await res.text().catch(() => '');
    let json = null;
    try {
        json = text ? JSON.parse(text) : null;
    } catch {
        json = null;
    }

    if (!res.ok) {
        const message = json?.message || text || 'Unable to join group.';
        const err = new Error(message);
        err.status = res.status;
        throw err;
    }

    return json;
}

function safeStr(v) {
    return typeof v === 'string' ? v : '';
}

/**
 * Matches UserCardPopover pattern: returns true only when we have
 * a real, non-default avatar URL for a friend / user object.
 */
function hasValidFriendAvatar(friend) {
    const src = safeStr(friend?.avatar_url) || safeStr(friend?.profile_picture) || '';
    if (!src) return false;
    if (
        src.includes('default_avatar') ||
        src.includes('default_business') ||
        src.includes('default_logo')
    ) {
        return false;
    }
    return true;
}


function softBreakLongTokens(str, chunk = 16) {
    const s = typeof str === 'string' ? str : (str == null ? '' : String(str));
    if (!s) return '';
    // Insert zero-width spaces into long, unbroken token runs so line-clamp + ellipsis behaves correctly.
    const reToken = new RegExp(`(\\S{${chunk}})(?=\\S)`, 'g');
    return s.replace(reToken, `$1\u200b`);
}

function getGroupPhotoSrc(group) {
    const raw =
        safeStr(group?.photo_url) ||
        safeStr(group?.photoUrl) ||
        safeStr(group?.image_url) ||
        safeStr(group?.imageUrl) ||
        safeStr(group?.group_photo_url) ||
        safeStr(group?.groupPhotoUrl) ||
        '';
    return raw || '';
}

function hasCustomGroupPhoto(group) {
    const raw =
        safeStr(group?.photo_url) ||
        safeStr(group?.photoUrl) ||
        safeStr(group?.image_url) ||
        safeStr(group?.imageUrl) ||
        safeStr(group?.group_photo_url) ||
        safeStr(group?.groupPhotoUrl) ||
        '';
    return Boolean(raw);
}

function isPrivateGroup(group) {
    const vis = String(group?.visibility || '').toLowerCase();
    return vis === 'private' || vis === 'hidden' || Boolean(group?.is_private);
}

function formatLocation(group) {
    const city = safeStr(group?.city);
    const county = safeStr(group?.county);
    // Add "County" suffix if county doesn't already include it (matching PostList.jsx)
    const countyLabel = county
        ? (String(county).toLowerCase().includes('county') ? county : `${county} County`)
        : '';
    if (city && countyLabel) return `${city}, ${countyLabel}`;
    return city || countyLabel || '';
}


// MUST match CommunityFilter GROUP_CATEGORY_OPTIONS + GROUP_MAIN_ICON.
// We use this to ensure the group cards show the SAME main-category icon as the dropdown.
const GROUP_CATEGORY_OPTIONS = [
    { header: 'Local & Place-Based', items: ['Local Areas & Neighborhoods', 'City and Town Groups', 'County and Region Groups', 'New to the Area', 'Homeowners Associations'] },
    { header: 'Families & Life Stages', items: ['Parents & Families', 'Moms and Dads Groups', 'Homeschooling Families', 'Parenting Teens', 'New Parents', 'Seniors & Retirees', 'Caregivers'] },
    { header: 'Faith & Spiritual', items: ['Faith Communities', 'Church Small Groups', 'Men’s Groups', 'Women’s Groups', 'Young Adults Faith', 'Prayer and Devotional Groups'] },
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
    { header: 'Wellness & Support', items: ['Sobriety and Recovery Support', 'Mental Wellness and Mindfulness', 'Men’s Support Circles', 'Women’s Support Circles', 'Grief Support', 'Chronic Illness Community'] },
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

function parseGroupCategoryValue(raw) {
    const s = safeStr(raw).trim();
    if (!s) return { main: '', sub: '' };

    // Legacy "Main > Sub"
    if (s.includes('>')) {
        const parts = s.split('>').map((x) => safeStr(x).trim()).filter(Boolean);
        if (parts.length >= 2) return { main: parts[0], sub: parts.slice(1).join(' > ') };
        return { main: parts[0] || s, sub: '' };
    }

    return { main: s, sub: '' };
}

const GROUP_SUB_TO_MAIN = (() => {
    const map = new Map();
    GROUP_CATEGORY_OPTIONS.forEach((sec) => {
        (sec.items || []).forEach((it) => map.set(it, sec.header));
    });
    return map;
})();

function getGroupMainCategory(group) {
    const raw =
        safeStr(group?.category) ||
        safeStr(group?.group_category) ||
        safeStr(group?.category_name) ||
        safeStr(group?.subcategory) ||
        '';
    if (!raw) return '';

    const parsed = parseGroupCategoryValue(raw);

    // If the stored value is already a main header, keep it.
    if (GROUP_MAIN_ICON[parsed.main]) return parsed.main;

    const token = parsed.sub ? parsed.sub : parsed.main;
    const main = GROUP_SUB_TO_MAIN.get(token) || '';
    return main || '';
}

/* ── Static style objects for GroupListCard (OUTSIDE component — stable references) ── */
const FRIENDS_DIALOG_PAPER_PROPS = {
    sx: {
        borderRadius: 3,
        height: { xs: '70vh', sm: 440 },
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
    },
};

function FriendsInGroupDialog({ open, onClose, friends }) {
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (open) setSearchTerm('');
    }, [open]);

    const rawList = Array.isArray(friends) ? friends : [];
    const filteredList = searchTerm.trim()
        ? rawList.filter((f) => {
            const q = searchTerm.toLowerCase();
            const full = `${f.first_name || ''} ${f.last_name || ''} ${f.handle || ''}`.toLowerCase();
            return full.includes(q);
        })
        : rawList;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xs"
            PaperProps={FRIENDS_DIALOG_PAPER_PROPS}
            onClick={(e) => e.stopPropagation()}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, pt: 2, pb: 0.5 }}>
                <Typography sx={{ fontWeight: 900, fontSize: 17 }}>People You Follow</Typography>
                <IconButton size="small" onClick={onClose} aria-label="Close">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            {rawList.length > 5 && (
                <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
                    <TextField
                        size="small"
                        fullWidth
                        placeholder="Search friends..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': { borderRadius: 2.5, fontSize: 13, bgcolor: 'action.hover' },
                        }}
                    />
                </Box>
            )}

            <Box sx={{ flex: 1, overflow: 'auto', px: 1.5, pt: 1, pb: 2 }}>
                {filteredList.length === 0 ? (
                    <Typography sx={{ textAlign: 'center', py: 3, color: 'text.secondary', fontSize: 13 }}>
                        {searchTerm.trim() ? 'No matching friends' : 'No friends in this group'}
                    </Typography>
                ) : (
                    <List disablePadding>
                        {filteredList.map((friend) => {
                            const name = `${safeStr(friend.first_name)} ${safeStr(friend.last_name)}`.trim() || friend.name || 'User';
                            const handle = safeStr(friend.handle);
                            const validAvatar = hasValidFriendAvatar(friend);
                            const avatarSrc = validAvatar ? (friend.avatar_url || friend.profile_picture) : undefined;
                            return (
                                <ListItemButton
                                    key={friend.id}
                                    onClick={() => { if (handle) window.location.assign(`/${handle}`); }}
                                    sx={{ borderRadius: 2, py: 0.75, px: 1 }}
                                >
                                    <ListItemAvatar sx={{ minWidth: 44 }}>
                                        <Avatar
                                            src={avatarSrc}
                                            sx={(t) => ({
                                                width: 34,
                                                height: 34,
                                                fontSize: 13,
                                                fontWeight: 800,
                                                bgcolor: alpha(t.palette.text.primary, 0.06),
                                                color: t.palette.text.secondary,
                                            })}
                                        >
                                            <PersonRoundedIcon sx={{ fontSize: 20 }} />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={<Typography sx={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.2 }}>{name}</Typography>}
                                        secondary={handle ? <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.2 }}>@{handle}</Typography> : null}
                                    />
                                </ListItemButton>
                            );
                        })}
                    </List>
                )}
            </Box>
        </Dialog>
    );
}

/* ── Static style objects for GroupListCard (OUTSIDE component — stable references) ── */
const GLC_MENU_ANCHOR_ORIGIN = { vertical: 'bottom', horizontal: 'right' };
const GLC_MENU_TRANSFORM_ORIGIN = { vertical: 'top', horizontal: 'right' };

function GroupListCard({ group, selected, onSelect, onViewGroupPage, onJoin, busy, rulesBusy, user, flat = false }) {
    const auth = useAuth();
    const viewer = user || auth?.user || null;
    const isNonPersonalAccount = useIsNonPersonalAccount();
    const { isBusinessAccount: isBA_glc, isArtistAccount: isAA_glc, activeBusinessId: aBizId_glc, activeArtistId: aArtId_glc } = useActiveAccount();

    // People You Follow state
    const [friendsInGroup, setFriendsInGroup] = useState([]);
    const [friendsDialogOpen, setFriendsDialogOpen] = useState(false);
    const friendsFetchedRef = useRef(null);

    const groupId = group?.id || group?.group_id || null;
    const viewerId = viewer?.id || viewer?.user_id || null;

    // Build account key for refetching when account changes
    const accountKey = isBA_glc ? `biz-${aBizId_glc}` : isAA_glc ? `art-${aArtId_glc}` : 'personal';

    useEffect(() => {
        if (!groupId || !viewerId) {
            setFriendsInGroup([]);
            return;
        }
        // Build a cache key that includes account context
        const cacheKey = `${groupId}-${accountKey}`;
        if (friendsFetchedRef.current === cacheKey) return;

        let cancelled = false;

        // Include account headers so the backend returns the correct scoped following list
        const headers = { Accept: 'application/json' };
        if (isBA_glc && aBizId_glc) {
            headers['x-account-type'] = 'business';
            headers['x-business-id'] = String(aBizId_glc);
        } else if (isAA_glc && aArtId_glc) {
            headers['x-account-type'] = 'artist';
            headers['x-artist-id'] = String(aArtId_glc);
        }

        secureFetch(`/api/groups/${encodeURIComponent(groupId)}/friends-in-group`, {
            credentials: 'include',
            headers,
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (cancelled) return;
                friendsFetchedRef.current = cacheKey;
                const list = Array.isArray(data?.friends) ? data.friends : Array.isArray(data) ? data : [];
                setFriendsInGroup(list.slice(0, 20));
            })
            .catch(() => { /* endpoint may not exist yet */ });
        return () => { cancelled = true; };
    }, [groupId, viewerId, accountKey, isBA_glc, isAA_glc, aBizId_glc, aArtId_glc]);

    const name = safeStr(group?.name) || 'Group';
    const username = safeStr(group?.group_username) || safeStr(group?.groupUsername) || safeStr(group?.handle) || safeStr(group?.username) || safeStr(group?.slug) || '';
    const locationLabel = formatLocation(group);
    const categoryLabel = safeStr(group?.category_name) || safeStr(group?.category) || '';
    const memberCount = Number.isFinite(Number(group?.member_count)) ? Number(group?.member_count) : 0;
    const postCountRaw = group?.__ll_posts_count ?? group?.post_count ?? group?.posts_count ?? group?.postCount ?? group?.postsCount ?? 0;

    // Check if statewide
    const isStatewide = Boolean(group?.is_statewide ?? group?.isStatewide ?? group?.statewide);
    const displayLocation = isStatewide ? 'Statewide' : locationLabel;

    const descRaw = safeStr(group?.description) || '';
    const descTrim = descRaw.trim();
    const DESC_MAX = 180;
    const descLong = descTrim.length > DESC_MAX;
    // Show description if exists, otherwise show nothing (no placeholder text)
    const hasDescription = Boolean(descTrim);
    const descShownRaw = descLong ? `${descTrim.slice(0, DESC_MAX).trimEnd()}…` : descTrim;
    const descShown = hasDescription ? softBreakLongTokens(descShownRaw) : '';
    const postCount = Number.isFinite(Number(postCountRaw)) ? Number(postCountRaw) : 0;

    const viewerRoleRaw = safeStr(group?.viewer_role) || safeStr(group?.viewerRole) || '';
    const viewerRole = viewerRoleRaw.trim().toLowerCase();
    const isOwner = !isNonPersonalAccount && viewerRole === 'owner';
    const isAdmin = !isNonPersonalAccount && viewerRole === 'admin';

    const isBanned = !isNonPersonalAccount && Boolean(group?.is_banned);

    const isTimedOut = !isNonPersonalAccount && Boolean(group?.is_timed_out);
    const isMember = !isNonPersonalAccount && (Boolean(group?.is_member ?? group?.isMember) || isOwner || isAdmin);
    const requested = !isNonPersonalAccount && Boolean(group?.has_requested ?? group?.hasRequested);
    const privateGroup = isPrivateGroup(group);

    let joinLabel = 'Join';
    if (privateGroup) joinLabel = 'Request to Join';
    if (requested) joinLabel = 'Requested';

    let statusLabel = '';
    if (isMember) statusLabel = 'Member';
    if (isAdmin) statusLabel = 'Admin';
    if (isOwner) statusLabel = 'Owner';
    if (isTimedOut) statusLabel = 'Timed Out';

    const showJoin = !isMember && !requested && !isTimedOut && !isBanned;
    const showStatus = !isBanned && !showJoin && statusLabel;
    const mainCategory = getGroupMainCategory(group);
    const CategoryIcon = GROUP_MAIN_ICON[mainCategory] || CategoryOutlinedIcon;

    // Menu state
    const [menuAnchor, setMenuAnchor] = useState(null);
    const menuOpen = Boolean(menuAnchor);

    // Report state
    const [reportOpen, setReportOpen] = useState(false);

    // Copy link toast
    const [copyToast, setCopyToast] = useState(false);

    const handleMenuOpen = (e) => {
        e.stopPropagation();
        setMenuAnchor(e.currentTarget);
    };

    const handleMenuClose = (e) => {
        if (e) e.stopPropagation();
        setMenuAnchor(null);
    };

    const handleCopyLink = (e) => {
        if (e) e.stopPropagation();
        handleMenuClose(e);
        const slug = username || groupId || '';
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
        handleMenuClose(e);
        if (!viewer) {
            // Redirect to login
            try {
                sessionStorage.setItem('ll:returnTo', window.location.pathname + window.location.search);
            } catch { /* ignore */ }
            window.location.assign('/login');
            return;
        }
        setReportOpen(true);
    };

    const submitReport = useCallback(
        async ({ reason, details }) => {
            const groupId = group?.id || group?.group_id;
            if (!groupId) return;

            // Include active account info so the report is tracked under the correct identity
            const body = { reason, details };
            if (isBA_glc && aBizId_glc) {
                body.activeBusinessId = aBizId_glc;
            } else if (isAA_glc && aArtId_glc) {
                body.activeArtistId = aArtId_glc;
            }

            const urls = [
                `/api/groups/${encodeURIComponent(groupId)}/flag`,
                `/api/community/groups/${encodeURIComponent(groupId)}/flag`,
            ];
            for (const url of urls) {
                try {
                    const res = await secureFetch(url, {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body),
                    });
                    if (res.ok) return;
                } catch {
                    // try next
                }
            }
        },
        [group?.id, group?.group_id, isBA_glc, isAA_glc, aBizId_glc, aArtId_glc]
    );

    // Completely hide banned groups from the list
    if (isBanned) return null;

    return (
        <>
            <Box
                onClick={onSelect}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onSelect();
                }}
                sx={(t) => {
                    const m = t.custom.motion;
                    const sh = t.custom.shadows;
                    return {
                        width: '100%',
                        height: flat ? 'auto' : { xs: 'auto', sm: 320 },
                        minHeight: flat ? 'auto' : { xs: 0, sm: 320 },
                        boxSizing: 'border-box',
                        borderRadius: flat ? '0 !important' : `${t.custom.postCard.borderRadius + 4}px`,
                        border: flat ? 'none' : '1px solid',
                        borderColor: flat
                            ? 'transparent'
                            : selected ? alpha(t.palette.secondary.main, 0.80) : alpha(t.palette.text.primary, 0.10),
                        bgcolor: t.palette.background.paper,
                        overflow: flat ? 'visible' : 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: flat
                            ? 'none'
                            : selected
                                ? sh.md
                                : sh.xs,
                        ...(flat ? { boxShadow: 'none !important' } : {}),
                        position: 'relative',
                        isolation: flat ? 'auto' : 'isolate',
                        cursor: 'pointer',
                        transition: flat ? 'none' : `box-shadow ${m.slow}ms ${m.ease}, border-color ${m.slow}ms ${m.ease}, transform ${m.slow}ms ${m.ease}`,
                        WebkitTapHighlightColor: 'transparent',
                        '&:active': flat ? {} : { transform: 'scale(0.985)' },
                        '&:focus': { outline: 'none' },
                        '&:hover': flat ? {} : {
                            boxShadow: sh.sm,
                            transform: 'none',
                        },
                        '& > *': { position: 'relative', zIndex: 1 },
                        '&:focus-visible': {
                            outline: 'none',
                            boxShadow: `0 0 0 3px ${alpha(t.palette.primary.main, 0.25)}`,
                        },
                    };
                }}
            >
                {/* Header row: Avatar + Name/Username/Status + Menu */}
                <Box sx={{ display: 'flex', gap: 1.5, p: { xs: flat ? 2 : 1.5, sm: 2 }, pb: { xs: 0.75, sm: 1.25 }, alignItems: 'flex-start' }}>
                    <Box
                        sx={(t) => ({
                            width: { xs: 44, sm: 52 },
                            height: { xs: 44, sm: 52 },
                            borderRadius: '50%',
                            overflow: 'hidden',
                            flexShrink: 0,
                            border: '2px solid',
                            borderColor: hasCustomGroupPhoto(group) ? alpha(t.palette.divider, 0.6) : alpha(t.palette.primary.main, 0.22),
                            bgcolor: hasCustomGroupPhoto(group) ? 'background.paper' : alpha(t.palette.primary.main, 0.14),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 2px 8px ${alpha(t.palette.common.black, 0.08)}`,
                        })}
                    >
                        {hasCustomGroupPhoto(group) ? (
                            <Box
                                component="img"
                                src={getGroupPhotoSrc(group)}
                                alt={name}
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'block',
                                    objectFit: 'cover',
                                }}
                                onError={(e) => {
                                    // Hide the broken image, parent will show bgcolor
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        ) : (
                            <GroupsIcon sx={(t) => ({ fontSize: 26, color: t.palette.primary.main })} />
                        )}
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 0.5, alignItems: 'flex-start' }}>
                            {/* Left side: Name + Username + Public/Private + Status chip */}
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography
                                    sx={{
                                        fontWeight: 900,
                                        color: 'text.primary',
                                        lineHeight: 1.2,
                                        fontSize: 16,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        overflowWrap: 'anywhere',
                                        wordBreak: 'break-word',
                                        whiteSpace: 'normal',
                                        pr: { xs: 0, sm: categoryLabel ? 1 : 0 },
                                    }}
                                >
                                    {name}
                                </Typography>
                                {username ? (
                                    <Typography sx={{ color: (t) => alpha(t.palette.text.primary, 0.50), fontSize: 12, fontWeight: 500 }}>
                                        @{username}
                                    </Typography>
                                ) : null}
                                {/* Desktop-only: category chip under the username.
                                    Mobile keeps its own category chip in the row below (with the
                                    location pill), so this one is hidden on xs to avoid showing
                                    the chip twice. */}
                                {categoryLabel ? (
                                    <Box sx={{ mt: 0.5, display: { xs: 'none', sm: 'flex' } }}>
                                        <Chip
                                            size="small"
                                            icon={<CategoryIcon sx={{ fontSize: 13 }} />}
                                            label={categoryLabel}
                                            sx={(t) => ({
                                                fontWeight: 800,
                                                fontSize: 11,
                                                borderRadius: 999,
                                                height: 24,
                                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                                color: t.palette.primary.main,
                                                border: '1px solid',
                                                borderColor: alpha(t.palette.primary.main, 0.25),
                                                '& .MuiChip-icon': { color: t.palette.primary.main, ml: 0.5 },
                                                '& .MuiChip-label': { px: 0.9, lineHeight: 1 },
                                            })}
                                        />
                                    </Box>
                                ) : null}
                                <Typography sx={{ mt: 0.25, color: (t) => alpha(t.palette.text.primary, 0.55), fontSize: 12 }}>
                                    {privateGroup ? 'Private group' : 'Public group'}
                                </Typography>
                            </Box>

                            {/* Right side: Status chip + Menu
                                (Category chip moved to the left column, under the group name.) */}
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, flexShrink: 0 }}>
                                {/* Status chip */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                                    {/* Status / role chip */}
                                    {showStatus ? (
                                        <Chip
                                            label={statusLabel}
                                            size="small"
                                            icon={
                                                statusLabel === 'Owner'
                                                    ? <StarIcon sx={{ fontSize: 13 }} />
                                                    : statusLabel === 'Admin'
                                                        ? <ShieldIcon sx={{ fontSize: 13 }} />
                                                        : statusLabel === 'Timed Out'
                                                            ? <HourglassEmptyIcon sx={{ fontSize: 13 }} />
                                                            : <PersonIcon sx={{ fontSize: 13 }} />
                                            }
                                            sx={(t) => {
                                                const styles = statusLabel === 'Owner'
                                                    ? {
                                                        background: `linear-gradient(135deg, ${t.palette.secondary.main} 0%, ${t.palette.secondary.dark} 100%)`,
                                                        boxShadow: `0 2px 8px ${alpha(t.palette.secondary.main, 0.28)}`,
                                                    }
                                                    : statusLabel === 'Admin'
                                                        ? {
                                                            background: `linear-gradient(135deg, ${t.palette.primary.light} 0%, ${t.palette.primary.main} 100%)`,
                                                            boxShadow: `0 2px 8px ${alpha(t.palette.primary.main, 0.28)}`,
                                                        }
                                                        : statusLabel === 'Timed Out'
                                                            ? {
                                                                background: `linear-gradient(135deg, ${t.palette.warning.main} 0%, ${t.palette.warning.dark} 100%)`,
                                                                boxShadow: `0 2px 8px ${alpha(t.palette.warning.main, 0.22)}`,
                                                            }
                                                            : {
                                                                background: `linear-gradient(135deg, ${t.palette.success.main} 0%, ${t.palette.success.dark} 100%)`,
                                                                boxShadow: `0 2px 8px ${alpha(t.palette.success.main, 0.22)}`,
                                                            };
                                                return {
                                                    borderRadius: 999,
                                                    fontWeight: 800,
                                                    fontSize: 11,
                                                    height: 24,
                                                    color: '#fff',
                                                    border: 'none',
                                                    cursor: 'default',
                                                    ...styles,
                                                    '& .MuiChip-label': { px: 1 },
                                                    '& .MuiChip-icon': { color: '#fff', ml: 0.5 },
                                                };
                                            }}
                                        />
                                    ) : null}
                                </Box>

                                {/* Menu button — matches PostList style */}
                                <IconButton
                                    size="small"
                                    aria-label="Group options"
                                    onClick={handleMenuOpen}
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
                            </Box>
                        </Box>
                    </Box>
                </Box>

                {/* Mobile-only: category chip, then location below it */}
                <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 0.25, px: 1.5, pb: 0.5 }}>
                    {categoryLabel ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                            <Chip
                                size="small"
                                icon={<CategoryIcon sx={{ fontSize: '13px !important' }} />}
                                label={categoryLabel}
                                sx={(t) => ({
                                    fontWeight: 800,
                                    fontSize: 11,
                                    borderRadius: 999,
                                    height: 24,
                                    bgcolor: alpha(t.palette.primary.main, 0.08),
                                    color: t.palette.primary.main,
                                    border: '1px solid',
                                    borderColor: alpha(t.palette.primary.main, 0.25),
                                    '& .MuiChip-icon': { color: t.palette.primary.main, ml: 0.5 },
                                    '& .MuiChip-label': { px: 0.9, lineHeight: 1 },
                                })}
                            />
                            {isStatewide ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
                                    <LocationOnRoundedIcon sx={{ fontSize: 12, color: 'primary.main' }} />
                                    <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: 'primary.main', whiteSpace: 'nowrap' }}>
                                        Statewide
                                    </Typography>
                                </Box>
                            ) : null}
                        </Box>
                    ) : null}
                    {displayLocation && !isStatewide ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, pl: 0.25 }}>
                            <LocationOnRoundedIcon sx={{ fontSize: 12, color: 'primary.main', flexShrink: 0 }} />
                            <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: 'primary.main' }}>
                                {displayLocation}
                            </Typography>
                        </Box>
                    ) : null}
                </Box>

                {/* Body (description area - always takes space for consistent height) */}
                <Box sx={{ px: { xs: flat ? 2 : 1.5, sm: 2 }, pb: 1, flex: 1, minHeight: 0, overflow: 'hidden' }}>
                    {hasDescription && (
                        <Typography
                            sx={{
                                color: 'text.secondary',
                                fontSize: 13.5,
                                lineHeight: 1.5,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                            }}
                        >
                            {descShown}
                            {descLong && (
                                <Typography
                                    component="span"
                                    sx={{ fontSize: 'inherit', fontWeight: 700, color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                >
                                    ...more
                                </Typography>
                            )}
                        </Typography>
                    )}
                </Box>

                {/* People You Follow row — shown when friends data exists */}
                {friendsInGroup.length > 0 ? (
                    <Box sx={{ px: 2, py: 0.5 }}>
                        <Box
                            sx={{
                                px: 1,
                                py: 0.5,
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 1,
                                cursor: 'pointer',
                                borderRadius: 1,
                                transition: 'background-color 0.15s',
                                maxWidth: '100%',
                                '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.06) },
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setFriendsDialogOpen(true);
                            }}
                        >
                            {/* Stacked avatars — up to 3 */}
                            <Box sx={{ display: 'flex', flexShrink: 0, mt: 0.25 }}>
                                {friendsInGroup.slice(0, 3).map((friend, idx) => {
                                    const validAvatar = hasValidFriendAvatar(friend);
                                    const avatarSrc = validAvatar ? (friend.avatar_url || friend.profile_picture) : undefined;
                                    return (
                                        <Avatar
                                            key={friend.id || idx}
                                            src={avatarSrc}
                                            alt={safeStr(friend.first_name)}
                                            sx={(t) => ({
                                                width: 22,
                                                height: 22,
                                                fontSize: 9,
                                                fontWeight: 800,
                                                border: '2px solid',
                                                borderColor: t.palette.background.paper,
                                                bgcolor: alpha(t.palette.primary.main, 0.12),
                                                color: 'primary.main',
                                                ml: idx > 0 ? '-8px' : 0,
                                                zIndex: 3 - idx,
                                                position: 'relative',
                                            })}
                                        >
                                            {validAvatar ? (safeStr(friend.first_name) || '?')[0] : <PersonRoundedIcon sx={{ fontSize: 13 }} />}
                                        </Avatar>
                                    );
                                })}
                            </Box>

                            {/* Label — comma-separated first names, +X more */}
                            <Typography
                                sx={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: 'text.secondary',
                                    lineHeight: 1.35,
                                    minWidth: 0,
                                    flex: 1,
                                    // Wrap on mobile, truncate on desktop
                                    whiteSpace: { xs: 'normal', sm: 'nowrap' },
                                    overflow: { xs: 'visible', sm: 'hidden' },
                                    textOverflow: { xs: 'unset', sm: 'ellipsis' },
                                }}
                            >
                                {(() => {
                                    const MAX_NAMES = 3;
                                    const names = friendsInGroup.slice(0, MAX_NAMES).map((f) =>
                                        safeStr(f?.first_name || f?.name || 'Someone').split(' ')[0]
                                    );
                                    const remaining = friendsInGroup.length - MAX_NAMES;
                                    const total = friendsInGroup.length;
                                    let nameStr;
                                    if (remaining > 0) {
                                        nameStr = `${names.join(', ')} +${remaining} more`;
                                    } else if (names.length === 2) {
                                        nameStr = `${names[0]} and ${names[1]}`;
                                    } else if (names.length === 3) {
                                        nameStr = `${names[0]}, ${names[1]}, and ${names[2]}`;
                                    } else {
                                        nameStr = names[0] || 'Someone';
                                    }
                                    const verb = total === 1 ? 'is' : 'are';
                                    return `${nameStr} who you follow ${verb} in this group`;
                                })()}
                            </Typography>
                        </Box>
                    </Box>
                ) : null}
                {displayLocation ? (
                    <Box
                        sx={{
                            display: { xs: 'none', sm: 'flex' },
                            px: 2,
                            py: 0.75,
                            justifyContent: 'flex-end',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOnRoundedIcon sx={{ fontSize: 15, color: 'primary.main', flexShrink: 0 }} />
                            <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'primary.main', whiteSpace: 'nowrap' }}>
                                {displayLocation}
                            </Typography>
                        </Box>
                    </Box>
                ) : null}

                {/* Footer with separator: Stats (left) + Join button (right) */}
                <Box
                    sx={(t) => ({
                        px: { xs: flat ? 2 : 1.5, sm: 2 },
                        py: { xs: 0.75, sm: 1.25 },
                        mt: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        borderTop: flat ? 'none' : '1px solid',
                        borderColor: flat ? 'transparent' : 'divider',
                        minHeight: { xs: 38, sm: 48 },
                    })}
                >
                    {/* Stats — compact text on mobile, chips on desktop */}
                    <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 1, flexShrink: 0 }}>
                        <Typography sx={(t) => ({ display: 'flex', alignItems: 'center', gap: 0.3, fontSize: 10, fontWeight: 700, color: alpha(t.palette.text.primary, 0.55) })}>
                            <PeopleAltOutlinedIcon sx={{ fontSize: 11.5 }} />
                            {memberCount}
                        </Typography>
                        <Typography sx={(t) => ({ display: 'flex', alignItems: 'center', gap: 0.3, fontSize: 10, fontWeight: 700, color: alpha(t.palette.text.primary, 0.55) })}>
                            <ArticleOutlinedIcon sx={{ fontSize: 11.5 }} />
                            {postCount}
                        </Typography>
                    </Box>
                    <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
                        <Chip
                            size="small"
                            icon={<PeopleAltOutlinedIcon sx={{ fontSize: 14, opacity: 0.85 }} />}
                            label={`${memberCount} ${memberCount === 1 ? 'member' : 'members'}`}
                            sx={(t) => ({
                                fontWeight: 900,
                                borderRadius: 999,
                                height: 22,
                                bgcolor: alpha(t.palette.text.primary, 0.045),
                                border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                                '& .MuiChip-label': { px: 0.65, fontSize: 11 },
                            })}
                        />
                        <Chip
                            size="small"
                            icon={<ArticleOutlinedIcon sx={{ fontSize: 14, opacity: 0.85 }} />}
                            label={`${postCount} ${postCount === 1 ? 'post' : 'posts'}`}
                            sx={(t) => ({
                                fontWeight: 900,
                                borderRadius: 999,
                                height: 22,
                                bgcolor: alpha(t.palette.text.primary, 0.045),
                                border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                                '& .MuiChip-label': { px: 0.65, fontSize: 11 },
                            })}
                        />
                    </Box>

                    {/* Join button (right) - only for non-members */}
                    {showJoin ? (
                        <Button
                            variant="outlined"
                            size="small"
                            disabled={busy || rulesBusy}
                            onClick={(e) => { e.stopPropagation(); onJoin(group); }}
                            sx={(t) => ({
                                borderRadius: 999,
                                textTransform: 'none',
                                fontWeight: 900,
                                px: 1.5,
                                py: 0,
                                height: 22,
                                minHeight: 22,
                                lineHeight: 1,
                                minWidth: 54,
                                fontSize: 12,
                                borderColor: alpha(t.palette.primary.main, 0.5),
                                color: t.palette.primary.main,
                                transition: 'all 180ms ease',
                                '&:hover': {
                                    borderColor: t.palette.primary.main,
                                    bgcolor: alpha(t.palette.primary.main, 0.06),
                                },
                                '&.Mui-disabled': {
                                    borderColor: alpha(t.palette.text.primary, 0.12),
                                    color: alpha(t.palette.text.primary, 0.40),
                                },
                            })}
                        >
                            {joinLabel}
                        </Button>
                    ) : null}

                    {/* Request Pending chip (right) — shown when user already requested */}
                    {!isMember && !showJoin && requested && (
                        <Chip
                            size="small"
                            icon={<HourglassEmptyIcon sx={{ fontSize: 13 }} />}
                            label="Request Pending"
                            variant="outlined"
                            onClick={(e) => e.stopPropagation()}
                            sx={(t) => ({
                                borderRadius: 999,
                                fontWeight: 800,
                                fontSize: 11,
                                height: 26,
                                borderColor: alpha(t.palette.warning.main, 0.5),
                                color: t.palette.warning.dark,
                                bgcolor: alpha(t.palette.warning.main, 0.08),
                                '& .MuiChip-icon': { color: t.palette.warning.main },
                            })}
                        />
                    )}

                </Box>
            </Box>

            {/* 3-dot Menu — matches PostList style */}
            <SmartMenu
                disableScrollLock
                anchorEl={menuAnchor}
                open={menuOpen}
                onClose={handleMenuClose}
                onClick={(e) => e.stopPropagation()}
                anchorOrigin={GLC_MENU_ANCHOR_ORIGIN}
                transformOrigin={GLC_MENU_TRANSFORM_ORIGIN}
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
                    /* Copy link — always */
                    <MenuItem key="copy-link" onClick={handleCopyLink} sx={{ py: 1 }}>
                        <ListItemIcon>
                            <LinkIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Copy link" />
                    </MenuItem>,

                    /* Report — always */
                    <Divider key="report-divider" sx={{ my: 0.5 }} />,
                    <MenuItem key="report-item" onClick={handleReportClick} sx={{ py: 1 }}>
                        <ListItemIcon>
                            <FlagOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Report group" />
                    </MenuItem>,
                ].filter(Boolean)}
            </SmartMenu>

            {/* Report Dialog — shared component matching PostList */}
            <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} onSubmit={submitReport} />

            {/* Copy link toast */}
            <SuccessSnackbar
                open={copyToast}
                onClose={() => setCopyToast(false)}
                message="Link copied to clipboard"
            />

            {/* People You Follow Dialog */}
            <FriendsInGroupDialog
                open={friendsDialogOpen}
                onClose={() => setFriendsDialogOpen(false)}
                friends={friendsInGroup}
            />
        </>
    );
}

export default function GroupsList({
                                       user,
                                       groups = [],
                                       isLoading = false,
                                       totalCount = null,
                                       hasMore: hasMoreProp = null,
                                       isLoadingMore = false,
                                       onLoadMore = null,
                                       selectedGroupId = null,
                                       onSelectGroup = () => {},
                                       onViewGroupPage = null,
                                       onCreateGroup = null,
                                       groupView = 'all',
                                       isOnPersonalAccount = true,
                                   }) {
    const [localGroups, setLocalGroups] = useState(groups);
    const sentinelRef = useRef(null);

    const loadMoreGuardRef = useRef({ lastShown: 0, lastAt: 0 });
    const total = Number.isFinite(Number(totalCount)) ? Number(totalCount) : null;
    const shown = Array.isArray(localGroups) ? localGroups.length : 0;
// If the API can't provide a total count, we still allow infinite scroll as long as the parent believes more exists.
    const hasMore = typeof hasMoreProp === 'boolean' ? hasMoreProp : (total != null ? shown < total : false);

    const [joiningId, setJoiningId] = useState(null);
    const [errorText, setErrorText] = useState('');
    const [rulesOpen, setRulesOpen] = useState(false);
    const [rulesGroup, setRulesGroup] = useState(null);
    const [rulesHtml, setRulesHtml] = useState('');
    const [rulesBusy, setRulesBusy] = useState(false);

    // Join questions dialog
    const [joinQOpen, setJoinQOpen] = useState(false);
    const [joinQGroup, setJoinQGroup] = useState(null);
    const [joinQQuestions, setJoinQQuestions] = useState([]);
    const [joinQSubmitting, setJoinQSubmitting] = useState(false);

    // Switch account dialog
    const [switchAccountOpen, setSwitchAccountOpen] = useState(false);

    const glTheme = useTheme();
    const isMobileScreen = useMediaQuery(glTheme.breakpoints.down('md'));

    const glAuth = useAuth();

    // Deferred empty-state guard: don't show "No Groups Found" during the initial mount gap
    // before the first groups payload arrives. This prevents the empty state from flashing.
    const [deferGroupsEmpty, setDeferGroupsEmpty] = useState(true);

    useEffect(() => {
        if (isLoading) {
            setDeferGroupsEmpty(true);
            return undefined;
        }

        if (Array.isArray(groups) && groups.length > 0) {
            setDeferGroupsEmpty(false);
            return undefined;
        }

        const t = setTimeout(() => setDeferGroupsEmpty(false), 900);
        return () => clearTimeout(t);
    }, [isLoading, groups]);

    // Inject list stagger keyframes once
    useEffect(() => { ensureListStaggerKeyframes(); }, []);

    // If the parent provides `user` (from /users/profile), we can reliably know whether the viewer is logged in.
    // When user is missing (undefined), we skip this check to avoid false redirects.
    const hasAuthInfo = user !== undefined;
    const viewerUser = hasAuthInfo ? (user?.user || user || null) : null;

    const openAuthPopup = () => {
        try {
            if (glAuth && typeof glAuth.open === 'function') glAuth.open();
            else if (glAuth && typeof glAuth.openLoginPopup === 'function') glAuth.openLoginPopup();
            else if (glAuth && typeof glAuth.openLoginModal === 'function') glAuth.openLoginModal();
            else if (glAuth && typeof glAuth.openLogin === 'function') glAuth.openLogin();
        } catch { /* ignore */ }
        try {
            window.dispatchEvent(new CustomEvent('open-auth-modal'));
            window.dispatchEvent(new CustomEvent('open-login'));
            window.dispatchEvent(new CustomEvent('open-auth-dialog'));
            window.dispatchEvent(new CustomEvent('open-login-popup'));
        } catch { /* ignore */ }
    };


    // Stabilise: only sync when the parent actually provides a different groups array.
    // Comparing by reference avoids the infinite-loop where setLocalGroups triggers a
    // re-render whose new (but identical-content) groups array triggers another setState.
    const prevGroupsRef = useRef(groups);
    useEffect(() => {
        if (prevGroupsRef.current === groups) return;
        prevGroupsRef.current = groups;
        setLocalGroups(groups);
    }, [groups]);

    // Keep a stable ref for onLoadMore so effects don't re-run when the parent
    // passes a new function reference on each render.
    const onLoadMoreRef = useRef(onLoadMore);
    onLoadMoreRef.current = onLoadMore;


    useEffect(() => {
        if (!hasMore) return;
        if (typeof onLoadMoreRef.current !== 'function') return;

        const target = sentinelRef.current;
        if (!target) return;

        const root = getScrollParent(sentinelRef.current) || document.querySelector('[data-community-scroll]') || null;

        const obs = new IntersectionObserver(
            (entries) => {
                const first = entries && entries[0];
                if (!first?.isIntersecting) return;
                if (isLoading) return;
                if (isLoadingMore) return;
                onLoadMoreRef.current({ offset: shown, limit: PAGE_SIZE });
            },
            { root: root || null, rootMargin: '600px 0px', threshold: 0 }
        );

        obs.observe(target);
        return () => obs.disconnect();
    }, [hasMore, isLoading, isLoadingMore, shown]);

    // fallback scroll check (some browsers/DOM nesting can prevent IntersectionObserver from firing)
    useEffect(() => {
        if (!hasMore) return;
        if (typeof onLoadMoreRef.current !== 'function') return;
        if (isLoading) return;
        if (isLoadingMore) return;

        const root = getScrollParent(sentinelRef.current) || document.querySelector('[data-community-scroll]') || null;
        const el = root || window;

        let raf = 0;
        const thresholdPx = 420;

        const check = () => {
            raf = 0;
            if (!hasMore) return;
            if (isLoading || isLoadingMore) return;

            if (root) {
                const remaining = root.scrollHeight - root.scrollTop - root.clientHeight;
                if (remaining <= thresholdPx) onLoadMoreRef.current({ offset: shown, limit: PAGE_SIZE });
            } else {
                const doc = document.documentElement;
                const remaining = doc.scrollHeight - (window.scrollY + window.innerHeight);
                if (remaining <= thresholdPx) onLoadMoreRef.current({ offset: shown, limit: PAGE_SIZE });
            }
        };

        const onScroll = () => {
            if (raf) return;
            raf = window.requestAnimationFrame(check);
        };

        el.addEventListener('scroll', onScroll, { passive: true });
        // run once in case the list is already short
        onScroll();

        return () => {
            if (raf) window.cancelAnimationFrame(raf);
            el.removeEventListener('scroll', onScroll);
        };
    }, [hasMore, isLoading, isLoadingMore, shown]);

    // polling visibility check (guaranteed trigger even when scroll events don't bubble / IO root is tricky)
    useEffect(() => {
        if (!hasMore) return;
        if (typeof onLoadMoreRef.current !== 'function') return;

        const intervalMs = 250;

        const tick = () => {
            if (!hasMore) return;
            if (isLoading || isLoadingMore) return;

            const target = sentinelRef.current;
            if (!target) return;

            const root = getScrollParent(sentinelRef.current) || document.querySelector('[data-community-scroll]') || null;

            const targetRect = target.getBoundingClientRect();
            const rootRect = root ? root.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };

            // within threshold of the bottom of the visible area
            const thresholdPx = 420;
            const distanceToBottom = rootRect.bottom - targetRect.top;

            if (distanceToBottom >= 0 && distanceToBottom <= thresholdPx) {
                const now = Date.now();
                const guard = loadMoreGuardRef.current || { lastShown: 0, lastAt: 0 };

                // prevent rapid-fire calls while sentinel stays in range
                if (guard.lastShown === shown && (now - guard.lastAt) < 900) return;

                loadMoreGuardRef.current = { lastShown: shown, lastAt: now };
                onLoadMoreRef.current({ offset: shown, limit: PAGE_SIZE });
            }
        };

        const id = window.setInterval(tick, intervalMs);
        // run once immediately
        tick();

        return () => window.clearInterval(id);
    }, [hasMore, isLoading, isLoadingMore, shown]);
    useEffect(() => {
        const onPostsChanged = (e) => {
            const gid = e?.detail?.groupId != null ? String(e.detail.groupId) : '';
            const count = Number(e?.detail?.count);
            if (!gid || !Number.isFinite(count)) return;

            setLocalGroups((prev) =>
                (Array.isArray(prev) ? prev : []).map((g) => {
                    if (!g || g.id == null) return g;
                    if (String(g.id) !== gid) return g;
                    return { ...g, __ll_posts_count: count, post_count: count, posts_count: count };
                })
            );
        };

        window.addEventListener('ll:group:postsChanged', onPostsChanged);
        return () => window.removeEventListener('ll:group:postsChanged', onPostsChanged);
    }, []);

    const normalizedRaw = Array.isArray(localGroups) ? localGroups : [];

    // When viewing "People I Follow" groups, hide private groups
    const normalizedBase = groupView === 'following'
        ? normalizedRaw.filter((g) => !isPrivateGroup(g))
        : normalizedRaw;

    // Member-type sorting weight: owner first, then admin, then member/other.
    const ROLE_WEIGHT = { owner: 0, admin: 1, member: 2 };
    const getRoleWeight = (g) => {
        const role = String(g?.viewer_role || g?.viewerRole || '').trim().toLowerCase();
        return ROLE_WEIGHT[role] != null ? ROLE_WEIGHT[role] : 3;
    };

    // Default sort: owners → admins → members, preserving original order within each tier.
    // Server handles the member_type filter; client just applies role-priority sorting.
    const normalized = useMemo(() => {
        return [...normalizedBase].sort((a, b) => getRoleWeight(a) - getRoleWeight(b));
    }, [normalizedBase]);

    const isFollowingView = groupView === 'following';


    const applyMembershipPatch = (gid, status) => {
        setLocalGroups((prev) =>
            (Array.isArray(prev) ? prev : []).map((g) => {
                if (Number(g?.id) !== Number(gid)) return g;

                if (status === 'joined') {
                    const nextCount = typeof g.member_count === 'number' ? g.member_count + 1 : (Number(g.member_count) || 0) + 1;
                    return { ...g, is_member: true, isMember: true, has_requested: false, hasRequested: false, member_count: nextCount };
                }

                if (status === 'pending') {
                    return { ...g, has_requested: true, hasRequested: true, is_member: false, isMember: false };
                }

                return g;
            })
        );
    };

    const fireMembershipEvent = (gid, status) => {
        try {
            window.dispatchEvent(
                new CustomEvent('ll:group:membershipChanged', {
                    detail: { groupId: String(gid), status: status || '' },
                })
            );
        } catch {
            // ignore
        }
    };

    const finalizeJoin = async (group, answers) => {
        const gid = Number(group?.id);
        if (!Number.isFinite(gid)) return;

        setErrorText('');
        setJoiningId(gid);

        try {
            const result = await joinGroupRequest(gid, answers);
            let status = String(result?.status || result?.membership_status || '').toLowerCase();

            if (status === 'member' || status === 'accepted' || status === 'approved' || status === 'success' || status === 'ok') status = 'joined';
            if (status === 'requested' || status === 'request_sent') status = 'pending';

            if (!status) {
                if (result?.is_member || result?.isMember) status = 'joined';
                else if (result?.has_requested || result?.hasRequested) status = 'pending';
            }

            applyMembershipPatch(gid, status);
            fireMembershipEvent(gid, status);

            // Close any open dialogs
            setRulesOpen(false);
            setRulesGroup(null);
            setRulesHtml('');
            setJoinQOpen(false);
            setJoinQGroup(null);
            setJoinQQuestions([]);
        } catch (err) {
            setErrorText(err?.message || 'Unable to join group.');
        } finally {
            setJoiningId(null);
        }
    };

    // Helper: parse join questions from group data
    const extractJoinQuestions = (g) => {
        try {
            const raw = g?.join_questions_json || g?.joinQuestionsJson;
            if (!raw) return [];
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return Array.isArray(parsed) ? parsed : [];
        } catch { return []; }
    };

    // Helper: open join questions dialog if questions exist, otherwise return false
    const checkQuestionsOrJoin = (group, details) => {
        const merged = { ...(group || {}), ...(details || {}) };
        const questions = extractJoinQuestions(merged);
        if (questions.length > 0) {
            setJoinQGroup(merged);
            setJoinQQuestions(questions);
            setJoinQOpen(true);
            return true;
        }
        return false;
    };

    const handleJoin = async (group) => {
        const gid = Number(group?.id);
        if (!Number.isFinite(gid)) return;

        // Require login — check both the user prop and the auth context
        const isLoggedIn = Boolean(viewerUser) || Boolean(glAuth?.user);
        if (!isLoggedIn) {
            openAuthPopup();
            return;
        }

        // If not on personal account, show switch dialog
        if (!isOnPersonalAccount) {
            setSwitchAccountOpen(true);
            return;
        }

        // First, check if this group has rules. The list payload may not include rules_html,
        // so we fetch the group details only when needed.
        setRulesBusy(true);
        try {
            const details = await fetchGroupDetails(gid);
            const rules = extractRulesHtml(details || group);

            if (rules) {
                setRulesGroup({ ...(group || {}), ...(details || {}) });
                setRulesHtml(rules);
                setRulesOpen(true);
                return;
            }

            // No rules — check for join questions
            if (checkQuestionsOrJoin(group, details)) return;

            // No rules, no questions: join immediately.
            await finalizeJoin(group);
        } catch (err) {
            // If the details fetch fails, fall back to joining without blocking.
            await finalizeJoin(group);
        } finally {
            setRulesBusy(false);
        }
    };

    // Handle submit from join questions dialog
    const handleJoinQSubmit = async (answers) => {
        if (!joinQGroup) return;
        setJoinQSubmitting(true);
        try {
            await finalizeJoin(joinQGroup, answers);
        } catch (err) {
            setErrorText(err?.message || 'Unable to join group.');
        } finally {
            setJoinQSubmitting(false);
        }
    };


    if (isLoading) {
        return (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240 }}>
                <PulsingDots />
            </Box>
        );
    }

    // When on a business or artist account and viewing "My Groups",
    // show a friendly message — group memberships are personal-account only.
    // This must be checked BEFORE the empty/data checks because when mine is
    // not sent to the backend, it returns all groups (non-empty).
    if (groupView === 'mine' && !isOnPersonalAccount) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    flex: 1,
                    minHeight: 0,
                    height: '100%',
                    py: 4,
                    px: 2,
                }}
            >
                <Stack spacing={1.5} alignItems="center">
                    <PersonIcon
                        sx={(t) => ({
                            fontSize: 72,
                            color: alpha(t.palette.primary.main, 0.6),
                            mb: 1,
                        })}
                    />
                    <Typography sx={{ fontWeight: 950, fontSize: 17 }}>
                        Personal Account Required
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, lineHeight: 1.55 }}>
                        Switch to your personal account to see your groups. Group memberships are tied to your personal profile.
                    </Typography>
                </Stack>
            </Box>
        );
    }

    if (!normalized.length) {

        // Still waiting for the query to confirm zero results — show loader
        if (deferGroupsEmpty) {
            return (
                <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240 }}>
                    <PulsingDots />
                </Box>
            );
        }

        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    flex: 1,
                    minHeight: 0,
                    height: '100%',
                    py: 4,
                    px: 2,
                }}
            >
                <Stack spacing={1.5} alignItems="center">
                    <Diversity3RoundedIcon
                        sx={(t) => ({
                            fontSize: 84,
                            color: alpha(t.palette.primary.main, 0.86),
                            mb: 1,
                        })}
                    />
                    <Typography sx={{ fontWeight: 950, fontSize: 18 }}>
                        No Groups Found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380 }}>
                        Be the first to create a group and bring your community together!
                    </Typography>
                    {typeof onCreateGroup === 'function' ? (
                        <Button
                            variant="contained"
                            startIcon={<AddRoundedIcon />}
                            onClick={onCreateGroup}
                            sx={(t) => ({
                                mt: 1.5,
                                borderRadius: 999,
                                textTransform: 'none',
                                fontWeight: 950,
                                fontSize: 15,
                                px: 3,
                                py: 1,
                                color: t.palette.common.white,
                                boxShadow: 'none',
                                '&:hover': { boxShadow: 'none' },
                            })}
                        >
                            Create a Group
                        </Button>
                    ) : null}
                </Stack>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', position: 'relative' }}>
            <Dialog
                open={rulesOpen}
                onClose={(_e, reason) => {
                    // No X, no backdrop close, no escape close.
                    if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
                }}
                maxWidth="sm"
                fullWidth
                disableEscapeKeyDown
                data-ll-rules-dialog
            >
                <DialogTitle
                    sx={{
                        fontWeight: 950,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        pb: 1,
                    }}
                >
                    <GavelOutlinedIcon sx={{ opacity: 0.9 }} />
                    Rules
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2 }}>
                    <Typography sx={{ fontWeight: 900, mb: 1, color: 'text.primary' }}>
                        You must agree to the rules of the group before joining.
                    </Typography>

                    <Box
                        sx={(t) => ({
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            bgcolor: 'background.paper',
                            maxHeight: 340,
                            overflowY: 'auto',
                            p: 1.5,
                            '& p': { mt: 0, mb: 1 },
                            '& ul': { mt: 0.5, mb: 1.25, paddingLeft: 2.5 },
                            '& ol': { mt: 0.5, mb: 1.25, paddingLeft: 2.5 },
                        })}
                    >
                        {/* rulesHtml can contain basic HTML (saved formatting). */}
                        <Box
                            sx={{ fontSize: 14, color: 'text.primary' }}
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(rulesHtml) }}
                        />
                    </Box>

                    {errorText ? (
                        <Typography sx={{ color: 'error.main', mt: 1.25, fontWeight: 800 }}>
                            {errorText}
                        </Typography>
                    ) : null}
                </DialogContent>
                <DialogActions sx={{ px: 2, pb: 2, pt: 1.25, gap: 1 }}>
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setRulesOpen(false);
                            setRulesGroup(null);
                            setRulesHtml('');
                            setErrorText('');
                        }}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, px: 2 }}
                        disabled={Boolean(joiningId) || rulesBusy}
                    >
                        Decline
                    </Button>
                    <Button
                        variant="contained"
                        onClick={async () => {
                            if (!rulesGroup) return;
                            // After accepting rules, check for join questions
                            if (checkQuestionsOrJoin(rulesGroup, rulesGroup)) {
                                setRulesOpen(false);
                                setRulesHtml('');
                                return;
                            }
                            await finalizeJoin(rulesGroup);
                        }}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 950, px: 2.5 }}
                        disabled={Boolean(joiningId) || rulesBusy}
                    >
                        Accept and Join
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Join Questions Dialog */}
            <JoinQuestionsDialog
                open={joinQOpen}
                onClose={() => { setJoinQOpen(false); setJoinQGroup(null); setJoinQQuestions([]); }}
                onSubmit={handleJoinQSubmit}
                questions={joinQQuestions}
                groupName={joinQGroup?.name || 'this group'}
                submitting={joinQSubmitting}
            />

            {/* Switch Account Dialog */}
            <SwitchAccountDialog
                open={switchAccountOpen}
                onClose={() => setSwitchAccountOpen(false)}
            />

            {errorText ? (
                <Typography sx={{ color: 'error.main', mb: 1 }}>
                    {errorText}
                </Typography>
            ) : null}

            <Box
                sx={{
                    width: '100%',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'stretch',
                    justifyContent: 'flex-start',
                    overflowX: 'hidden',
                }}
            >
                {normalized.map((g, idx) => (
                    <Box
                        key={g.id}
                        sx={(t) => ({
                            flex: {
                                xs: '0 0 100%',
                                sm: '0 0 100%',
                                md: '0 0 calc(50% - 16px)',
                                lg: '0 0 calc(50% - 16px)',
                                xl: '0 0 calc(50% - 16px)',
                            },
                            mx: { xs: 0, md: 1 },
                            my: { xs: 0, md: 1 },
                            minWidth: 0,
                            maxWidth: '100%',
                            borderBottom: { xs: `1px solid ${alpha(t.palette.divider, 0.1)}`, md: 'none' },
                            '&:last-child': { borderBottom: { xs: 'none', md: 'none' } },
                            ...getListStaggerSx(idx),
                        })}
                    >
                        <GroupListCard
                            group={g}
                            selected={Number(selectedGroupId) === Number(g.id)}
                            onSelect={() => onSelectGroup(g)}
                            onViewGroupPage={typeof onViewGroupPage === 'function' ? () => onViewGroupPage(g) : null}
                            onJoin={handleJoin}
                            busy={Number(joiningId) === Number(g.id)}
                            rulesBusy={rulesBusy}
                            user={user}
                            flat={isMobileScreen}
                        />
                    </Box>
                ))}

                <Box ref={sentinelRef} sx={{ height: 1 }} />
                {hasMore && isLoadingMore ? (
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', py: 2 }}>
                        <PulsingDots sx={{ py: 2 }} />
                    </Box>
                ) : null}
            </Box>
        </Box>
    );
}
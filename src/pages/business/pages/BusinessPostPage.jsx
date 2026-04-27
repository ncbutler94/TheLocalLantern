// src/pages/business/pages/BusinessPostPage.jsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { isCommentBlocked, parseBlockedSets, handleBlockChangedEvent } from '../../../utils/commentBlockUtils';
import { useParams, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Paper,
    Typography,
    Avatar,
    Button,
    Divider,
    IconButton,
    Chip,
    TextField,
    InputAdornment,
    CircularProgress,
    Alert,
    Link,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    RadioGroup,
    FormControlLabel,
    Radio,
    Tooltip,
    MenuItem,
    ListItemIcon,
    ListItem,
    ListItemText,
    Skeleton,
    Stack,
    Snackbar,
    SnackbarContent,
    Popper,
    List,
    ListItemButton,
    ListItemAvatar,
    ClickAwayListener,
} from '@mui/material';
import { alpha as alphaColor, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ArticleIcon from '@mui/icons-material/Article';
import CampaignIcon from '@mui/icons-material/Campaign';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import ReplyRoundedIcon from '@mui/icons-material/ReplyRounded';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import PushPinRoundedIcon from '@mui/icons-material/PushPinRounded';
import LinkIcon from '@mui/icons-material/Link';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import BlockIcon from '@mui/icons-material/Block';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';

// Category icons (matching BusinessPostDetailModal / BusinessDirectoryCard)
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

import ShareDialog from '../../../components/ShareDialog';

import BusinessActionBar, { ReportDialog } from '../../../components/ActionBar';
import { MOBILE_BOTTOM_NAV_HEIGHT } from '../../../components/Header/Header';
import UserCardPopover from '../../../components/UserCardPopover';
import AccountAvatar from '../../../components/AccountAvatar';
import { useActiveAccount } from '../../../components/AccountContext';
import { getAccountHeaders as getStaticAccountHeaders } from '../../../utils/getAccountHeadersStatic';
import defaultAvatar from '../../../assets/profile/default_avatar.png';
import PulsingDots from '../../../components/PulsingDots';
import CommentImageAttachments, { uploadFilesToGCS } from '../../../components/CommentImageAttachments';
import CommentImages from '../../../components/CommentImages';
import NetworkErrorState, { isNetworkError } from '../../../components/NetworkErrorState';
import BlockedPostGate, { useBlockedPostGate } from '../../../components/BlockedPostGate';
import SuccessSnackbar, { useSuccessSnackbar } from '../../../components/SuccessSnackbar';
import { pinBusinessPost, unpinBusinessPost } from '../api/businessApi';
import RichTextDisplay from '../../../components/RichTextDisplay';
import useRateLimit from '../../../utils/useRateLimit';
import RateLimitDialog from '../../../components/RateLimitDialog';
import { checkProfanity } from '../../../utils/profanityCheck';
import { secureFetch } from '../../../utils/secureFetch';
import SmartMenu from '../../../components/SmartMenu';
import useChromeTop from '../../../hooks/useChromeTop';

/**
 * Scan a single image File object for NSFW content via the backend.
 * Returns { safe: true } or { safe: false, message: '...' }.
 */
async function scanImageFile(file) {
    try {
        const fd = new FormData();
        fd.append('image', file);
        const res = await secureFetch('/api/community/moderate-image', {
            method: 'POST',
            credentials: 'include',
            body: fd,
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
            if (data && data.safe === false) return { safe: false, message: data.message || 'This image doesn’t meet our community guidelines.' };
            return { safe: false, message: 'Unable to verify image safety. Please try a different image.' };
        }
        if (data && data.safe === false) return { safe: false, message: data.message || 'This image doesn’t meet our community guidelines.' };
        return { safe: true };
    } catch {
        return { safe: false, message: 'Unable to verify image safety. Please check your connection and try again.' };
    }
}

const api = process.env.REACT_APP_API_URL || '';

// ============================
// Helper Functions
// ============================
const timeAgo = (input) => {
    if (!input) return '';
    const dateString = String(input);
    let d;
    if (dateString.endsWith('Z') || dateString.includes('+')) {
        // Already has explicit timezone info — parse as-is
        d = new Date(dateString);
    } else if (dateString.includes('T')) {
        // Has T separator but no timezone — treat as UTC
        d = new Date(dateString + 'Z');
    } else {
        // Raw "YYYY-MM-DD HH:MM:SS" from DB — treat as UTC
        d = new Date(dateString.replace(' ', 'T') + 'Z');
    }
    if (!d || Number.isNaN(d.valueOf())) return '';
    const diffMs = Math.max(0, Date.now() - d.getTime());

    const s = Math.floor(diffMs / 1000);
    if (s < 60) return 'Just now';

    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ${h === 1 ? 'hr' : 'hrs'} ago`;
    const dys = Math.floor(h / 24);
    if (dys < 7) return `${dys}d ago`;
    const w = Math.floor(dys / 7);
    if (w < 5) return `${w}${w === 1 ? 'wk' : 'wks'} ago`;
    const mo = Math.floor(dys / 30);
    if (mo < 12) return `${mo}${mo === 1 ? 'mo' : 'mos'} ago`;
    const y = Math.floor(dys / 365);
    return `${y}${y === 1 ? 'yr' : 'yrs'} ago`;
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const dateString = String(dateStr);
    let d;
    if (dateString.endsWith('Z') || dateString.includes('+')) {
        d = new Date(dateString);
    } else if (dateString.includes('T')) {
        d = new Date(dateString + 'Z');
    } else {
        d = new Date(dateString.replace(' ', 'T') + 'Z');
    }
    if (Number.isNaN(d.valueOf())) return '';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

// Category icon + label maps (matching BusinessPostDetailModal)
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

const extractPhotos = (post) => {
    if (!post || typeof post !== 'object') return [];

    const pickUrl = (val) => {
        if (!val) return null;
        if (typeof val === 'string') {
            const s = val.trim();
            if (!s || s === 'null' || s === 'undefined') return null;
            return s;
        }
        if (typeof val === 'object') {
            const s = val.url || val.photo_url || val.photoUrl || val.path || val.src || null;
            return pickUrl(s);
        }
        return null;
    };

    const pushMany = (arr, out) => {
        for (const item of arr) {
            const u = pickUrl(item);
            if (u) out.push(u);
        }
    };

    const collected = [];

    // Check common field names
    const candidates = [
        post.mediaUrl,
        post.media_url,
        post.mediaUrls,
        post.media_urls,
        post.photos,
        post.photos_json,
        post.photo_urls,
        post.images,
    ];

    for (const c of candidates) {
        if (!c) continue;

        if (Array.isArray(c)) {
            pushMany(c, collected);
            continue;
        }

        if (typeof c === 'string') {
            const s = c.trim();
            if (!s || s === 'null') continue;

            if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
                try {
                    const parsed = JSON.parse(s);
                    if (Array.isArray(parsed)) pushMany(parsed, collected);
                    else {
                        const u = pickUrl(parsed);
                        if (u) collected.push(u);
                    }
                    continue;
                } catch {
                    // fall through
                }
            }

            const u = pickUrl(s);
            if (u) collected.push(u);
        }
    }

    // Fallbacks
    if (!collected.length) {
        const oneOffs = [post.photo_url, post.photoUrl, post.image_url, post.imageUrl, post.image, post.thumbnail];
        pushMany(oneOffs, collected);
    }

    // Unique
    const seen = new Set();
    const out = [];
    for (const u of collected) {
        if (!u || seen.has(u)) continue;
        seen.add(u);
        out.push(u);
        if (out.length >= 20) break;
    }

    return out;
};

const POST_TYPE_META = {
    deal: {
        label: 'Deal',
        icon: <LocalOfferIcon sx={{ fontSize: 16 }} />,
        palette: 'success',
    },
    announcement: {
        label: 'Announcement',
        icon: <CampaignIcon sx={{ fontSize: 16 }} />,
        palette: 'info',
    },
    update: {
        label: 'Update',
        icon: <ArticleIcon sx={{ fontSize: 16 }} />,
        palette: 'warning',
    },
};

const COMMENT_MAX_CHARS = 15000;
const COMMENT_PREVIEW_CHARS = 200;
const MAX_VISUAL_DEPTH = 2;
const INITIAL_REPLIES_SHOWN = 5;
const INITIAL_COMMENTS_SHOWN = 20;
const COMMENTS_LOAD_MORE = 20;

/* ─── @mention helpers ─── */
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
    const type = String(item.account_type || "").toLowerCase();
    // Sub-type for artist mention results: 'music' (default) or 'artist'.
    // Tolerant of missing field — falls back to the music-note badge.
    const profileType = String(item.profile_type || item.profileType || "").toLowerCase();
    const isVisualArtist = type === "artist" && profileType === "artist";
    return (
        <>
            {type === "business" && <StorefrontRoundedIcon sx={{ fontSize: 13, color: "text.secondary", ml: 0.25 }} />}
            {type === "artist" && !isVisualArtist && <MusicNoteRoundedIcon sx={{ fontSize: 13, color: "text.secondary", ml: 0.25 }} />}
            {isVisualArtist && <PaletteRoundedIcon sx={{ fontSize: 13, color: "text.secondary", ml: 0.25 }} />}
        </>
    );
}

function renderMentionPopper({ open, anchorEl, results, loading, activeIdx, onSelect, onClose }) {
    return (
        <Popper open={open} anchorEl={anchorEl} placement="bottom-start" disablePortal style={{ zIndex: 1500 }}
                modifiers={[{ name: "offset", options: { offset: [0, 4] } }]}>
            <ClickAwayListener onClickAway={onClose}>
                <Paper
                    variant="outlined"
                    sx={{
                        mt: 0.75,
                        borderRadius: 2,
                        overflow: 'hidden',
                        width: { xs: '100%', sm: 420 },
                        boxShadow: (t) => t.custom.shadows.lg,
                    }}
                >
                    <List dense disablePadding>
                        {loading ? (
                            <ListItem sx={{ py: 1 }}>
                                <ListItemText
                                    primary="Searching…"
                                    primaryTypographyProps={{ fontWeight: 800 }}
                                />
                            </ListItem>
                        ) : null}

                        {!loading && !results.length ? (
                            <ListItem sx={{ py: 1 }}>
                                <ListItemText
                                    primary="No users found"
                                    primaryTypographyProps={{ fontWeight: 800 }}
                                />
                            </ListItem>
                        ) : null}

                        {!loading
                            ? results.slice(0, 4).map((u, i) => {
                                const handle = u.handle || u.username || '';
                                const label = u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username;
                                const avatar = u.avatar_url || u.profile_picture || '';
                                return (
                                    <ListItemButton
                                        key={u.id || i}
                                        selected={i === activeIdx}
                                        onMouseDown={(e) => { e.preventDefault(); onSelect(u); }}
                                        sx={{ py: 1, px: 1.5 }}
                                    >
                                        <ListItemAvatar sx={{ minWidth: 44 }}>
                                            <Avatar src={avatar || undefined} sx={{ width: 32, height: 32, ...(!avatar ? { bgcolor: (t) => alphaColor(t.palette.primary.main, 0.08), color: 'primary.main' } : {}) }}>
                                                {!avatar ? <PersonRoundedIcon fontSize="small" /> : null}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={<Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>
                                                    {label}
                                                </Typography>
                                                <MentionAccountBadge item={u} />
                                            </Box>}
                                            secondary={handle ? `@${handle}` : ''}
                                            secondaryTypographyProps={{ noWrap: true }}
                                        />
                                    </ListItemButton>
                                );
                            })
                            : null}
                    </List>
                </Paper>
            </ClickAwayListener>
        </Popper>
    );
}

// ─── ComposerAvatar — shows the viewer's avatar with correct fallback icon ──

function ComposerAvatar({ url, accountType, profileType, label, size = 44, iconSize = 22, sx: sxOverride = {} }) {
    const [imgError, setImgError] = React.useState(false);
    React.useEffect(() => { setImgError(false); }, [url]);
    const showImg = Boolean(url) && !imgError;
    // For artist accounts, pick palette (visual artist) vs music note (musician).
    // Anything not explicitly 'artist' for profileType keeps the music-note fallback
    // so existing call sites that don't pass profileType behave identically.
    const artistFallbackIcon = (String(profileType || '').toLowerCase() === 'artist')
        ? PaletteRoundedIcon
        : MusicNoteRoundedIcon;
    const FallbackIcon = accountType === 'business'
        ? StorefrontOutlinedIcon
        : accountType === 'artist'
            ? artistFallbackIcon
            : PersonRoundedIcon;
    return (
        <Avatar
            src={showImg ? url : undefined}
            alt={label || 'You'}
            imgProps={{ onError: () => setImgError(true) }}
            sx={(t) => ({
                width: size,
                height: size,
                flexShrink: 0,
                border: '1px solid',
                borderColor: 'divider',
                ...(!showImg ? {
                    bgcolor: alphaColor(t.palette.primary.main, 0.08),
                    color: t.palette.primary.main,
                } : {}),
                ...sxOverride,
            })}
        >
            {!showImg && <FallbackIcon sx={{ fontSize: iconSize }} />}
        </Avatar>
    );
}

const DEFAULT_AVATAR_SX = {
    bgcolor: (t) => alphaColor(t.palette.primary.main, 0.08),
    color: 'primary.main',
};

const SEND_BUTTON_SX = {
    ml: 0.5,
    bgcolor: 'primary.main',
    color: 'common.white',
    width: { xs: 40, sm: 36 },
    height: { xs: 40, sm: 36 },
    flexShrink: 0,
    '&:hover': { bgcolor: 'primary.dark' },
    '&.Mui-disabled': {
        bgcolor: 'action.disabledBackground',
        color: 'action.disabled',
        opacity: 1,
    },
};

const NEW_COMMENT_FADE_KEYFRAMES = `@keyframes commentFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}`;
const NEW_COMMENT_FADE_SX = {
    animation: "commentFadeIn 0.45s ease-out both",
};
let _commentFadeInjected = false;
function ensureCommentFadeKeyframes() {
    if (_commentFadeInjected) return;
    _commentFadeInjected = true;
    const style = document.createElement("style");
    style.textContent = NEW_COMMENT_FADE_KEYFRAMES;
    document.head.appendChild(style);
}

// ============================
// Flag Comment Dialog (matches PostDetailModal pattern)
// ============================
function FlagCommentDialog({ open, onClose, onSubmit, initialReason = 'spam' }) {
    const [reason, setReason] = useState(initialReason);
    const [details, setDetails] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (!open) {
            const timer = setTimeout(() => {
                setReason(initialReason);
                setDetails('');
                setSubmitted(false);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [open, initialReason]);

    const handleSubmit = () => {
        onSubmit({ reason, details });
        setSubmitted(true);
    };

    return (
        <Dialog
            disableScrollLock
            open={open}
            onClose={(_e, r) => {
                if (r === 'backdropClick' || r === 'escapeKeyDown') return;
                onClose();
            }}
            fullWidth
            maxWidth="xs"
            PaperProps={{ sx: { position: 'relative' } }}
        >
            <DialogTitle sx={{ pr: 7 }}>
                {submitted ? 'Report submitted' : 'Report comment'}
                <IconButton
                    aria-label="Close"
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            {submitted ? (
                <>
                    <DialogContent>
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Box
                                sx={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: '50%',
                                    bgcolor: 'success.light',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 2,
                                }}
                            >
                                <Box component="span" sx={{ fontSize: 28, color: 'success.dark' }}>
                                    ✓
                                </Box>
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                                Thank you for reporting
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Your report helps keep our community safe. We'll review this comment and take appropriate action.
                            </Typography>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button
                            variant="contained"
                            onClick={onClose}
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                            Done
                        </Button>
                    </DialogActions>
                </>
            ) : (
                <>
                    <DialogContent dividers>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            Choose a reason:
                        </Typography>
                        <RadioGroup value={reason} onChange={(e) => setReason(e.target.value)} sx={{ gap: 0.5 }}>
                            <FormControlLabel value="spam" control={<Radio />} label="Spam" />
                            <FormControlLabel value="harassment" control={<Radio />} label="Harassment" />
                            <FormControlLabel value="hate" control={<Radio />} label="Hate speech" />
                            <FormControlLabel value="nudity" control={<Radio />} label="Nudity" />
                            <FormControlLabel value="misinformation" control={<Radio />} label="Misinformation" />
                            <FormControlLabel value="illegal" control={<Radio />} label="Illegal content" />
                            <FormControlLabel value="other" control={<Radio />} label="Other" />
                        </RadioGroup>

                        <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            label="Details (optional)"
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            sx={{ mt: 2 }}
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                            Submit report
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
}

// ============================
// Report Post — uses shared ReportDialog from ActionBar
// ============================

// ============================
// Comments Components
// ============================
// Recursively update a single comment node in a threaded tree
function updateCommentInTree(nodes, commentId, updater) {
    return nodes.map((n) => {
        if (String(n.id) === String(commentId)) return updater(n);
        if (n.replies?.length) return { ...n, replies: updateCommentInTree(n.replies, commentId, updater) };
        return n;
    });
}


/* ── Render comment text with embedded links and @mentions ── */
const renderCommentText = (text) => {
    const raw = typeof text === 'string' ? text : (text ?? '').toString();
    if (!raw) return raw;

    const urlRe = /https?:\/\/[^\s<>\"')\]]+|www\.[^\s<>\"')\]]+/gi;
    const mentionRe = /@([a-zA-Z0-9_]{2,30})/g;
    const matches = [];

    let m;
    while ((m = urlRe.exec(raw)) !== null) {
        let url = m[0];
        while (url.length > 1 && /[.,;:!?)>\]}]$/.test(url)) url = url.slice(0, -1);
        matches.push({ type: 'url', start: m.index, end: m.index + url.length, value: url });
    }
    while ((m = mentionRe.exec(raw)) !== null) {
        const start = m.index;
        const before = start > 0 ? raw[start - 1] : '';
        if (before && /[a-zA-Z_.]/.test(before)) continue;
        matches.push({ type: 'mention', start, end: start + m[0].length, value: m[1] });
    }
    if (matches.length === 0) return raw;

    matches.sort((a, b) => a.start - b.start || b.end - a.end);
    const filtered = [];
    let lastEnd = 0;
    for (const match of matches) {
        if (match.start >= lastEnd) { filtered.push(match); lastEnd = match.end; }
    }

    const out = [];
    let pos = 0;
    let key = 0;
    for (const match of filtered) {
        if (match.start > pos) out.push(raw.slice(pos, match.start));
        if (match.type === 'url') {
            const href = match.value.startsWith('www.') ? `https://${match.value}` : match.value;
            const displayUrl = match.value.replace(/^https?:\/\//, '').replace(/\/$/, '');
            out.push(
                <Link key={`url_${key++}_${match.start}`} href={href} target="_blank" rel="noopener noreferrer" underline="hover"
                      sx={{ fontWeight: 600, display: 'inline', color: 'primary.main', wordBreak: 'break-all', cursor: 'pointer' }}>
                    {displayUrl}
                </Link>
            );
        } else {
            out.push(
                <Link key={`mention_${key++}_${match.start}`} component="span" underline="hover"
                      sx={{ p: 0, fontWeight: 900, display: 'inline', color: 'primary.main', cursor: 'pointer' }}>
                    @{match.value}
                </Link>
            );
        }
        pos = match.end;
    }
    if (pos < raw.length) out.push(raw.slice(pos));
    return out;
};

function normalizeComments(raw) {
    const src = Array.isArray(raw) ? raw : raw?.items || raw?.comments || raw?.data || [];
    const items = src.map((c, idx) => ({
        id: c.id ?? c.comment_id ?? c._id ?? `c_${idx}`,
        parentId: c.parent_id ?? c.parentId ?? c.reply_to ?? null,
        user_id: c.user_id ?? c.userId ?? c.user?.id ?? null,
        is_pinned: Number(c.is_pinned ?? c.isPinned ?? c.pinned ?? 0),
        text: String(c.text ?? c.content ?? c.body ?? c.comment ?? '').trim(),
        first_name: c.first_name ?? c.firstName ?? c.author_first_name ?? c.user?.first_name ?? '',
        last_name: c.last_name ?? c.lastName ?? c.author_last_name ?? c.user?.last_name ?? '',
        handle: c.handle ?? c.user?.handle ?? c.username ?? '',
        avatar: c.avatar_url ?? c.avatarUrl ?? c.user?.avatar_url ?? c.profile_picture ?? '',
        created_at: c.created_at ?? c.createdAt ?? c.date_created ?? c.posted_at ?? c.time ?? '',
        likes: Number(c.likes ?? c.likesCount ?? c.likes_count ?? c.like_count ?? 0),
        viewer_liked: Boolean(c.viewer_liked ?? c.viewerLiked ?? c.liked ?? false),
        viewer_flagged: Boolean(c.viewer_flagged ?? c.viewerFlagged ?? false),
        liked_by_author: Boolean(c.liked_by_author ?? c.likedByAuthor ?? c.liked_by_post_author ?? c.likedByPostAuthor ?? c.author_liked ?? c.authorLiked ?? false),
        reply_count: Number(c.reply_count ?? c.replyCount ?? 0),
        // Account identity fields (for display)
        business_id: c.business_id ?? null,
        business_name: c.business_name ?? null,
        business_slug: c.business_slug ?? null,
        business_avatar_url: c.business_avatar_url ?? null,
        artist_id: c.artist_id ?? null,
        artist_name: c.artist_name ?? null,
        artist_handle: c.artist_handle ?? null,
        artist_avatar_url: c.artist_avatar_url ?? null,
        // Artist sub-type passed through so the avatar fallback can pick
        // palette (visual artist) vs music-note (musician). Backend sets
        // this per-comment from music_artists.profile_type.
        profile_type: c.profile_type ?? c.profileType ?? null,
        account_type: c.account_type ?? null,
        account_name: c.account_name ?? null,
        account_handle: c.account_handle ?? null,
        account_avatar_url: c.account_avatar_url ?? null,
        images: Array.isArray(c.images) ? c.images.filter(Boolean) : [],
        image: c.image ?? (Array.isArray(c.images) && c.images.length > 0 ? c.images[0] : null),
        replies: [],
    }));

    const byId = new Map();
    items.forEach((n) => byId.set(String(n.id), n));
    const roots = [];
    items.forEach((n) => {
        const pid = n.parentId ? String(n.parentId) : null;
        if (pid && byId.has(pid)) {
            byId.get(pid).replies.push(n);
        } else {
            roots.push(n);
        }
    });

    roots.sort((a, b) => {
        const ap = Number(a?.is_pinned ?? 0);
        const bp = Number(b?.is_pinned ?? 0);
        if (bp !== ap) return bp - ap;
        const at = a?.created_at ? new Date(a.created_at).getTime() : 0;
        const bt = b?.created_at ? new Date(b.created_at).getTime() : 0;
        return at - bt;
    });
    return roots;
}

function ThreadedCommentItem({
                                 node,
                                 depth = 0,
                                 expanded,
                                 setExpanded,
                                 viewerAvatarUrl,
                                 viewerLabel,
                                 viewerId,
                                 viewerAccountType,
                                 viewerProfileType,
                                 postAuthorId,
                                 likeComment,
                                 submitReply,
                                 openFlag,
                                 onRequestDelete,
                                 onRequestTogglePin,
                                 canPinComment,
                                 blockedUserIds,
                                 blockedBusinessIds,
                                 blockedArtistIds,
                                 blockedHandles,
                                 replyToName,
                                 replyToHandle,
                                 onShareComment,
                                 highlightedCommentId,
                                 onOpenUserCard,
                                 postId,
                                 businessSlug,
                                 onCopyLinkToast,
                             }) {
    // Account-aware display name and avatar
    const name = node.business_name
        ? node.business_name
        : node.artist_name
            ? node.artist_name
            : node.account_name
                ? node.account_name
                : (`${node.first_name || ''} ${node.last_name || ''}`.trim() || 'User');

    const displayHandle = node.business_slug
        ? node.business_slug
        : node.artist_handle
            ? node.artist_handle
            : node.account_handle
                ? node.account_handle
                : (node.handle || '');

    // Determine account type for avatar fallback icon (matching PostPage pattern)
    const isBusinessComment = Boolean(node.business_id || node.business_name || node.account_type === 'business');
    const isArtistComment = Boolean(node.artist_id || node.artist_name || node.account_type === 'artist');

    // For business/artist: use their specific avatar, then account_avatar_url.
    // NEVER fall back to node.avatar — that's the personal profile pic from the users table.
    // For normal users: use node.avatar (personal pic).
    // (Matches PostPage ThreadedCommentItem pattern exactly)
    const commentAvatarUrl = (() => {
        if (isBusinessComment) {
            return (node.business_avatar_url || node.account_avatar_url || '').trim();
        }
        if (isArtistComment) {
            return (node.artist_avatar_url || node.account_avatar_url || '').trim();
        }
        return node.avatar || '';
    })();

    // Comment author's profile sub-type (artist-only): 'music' vs 'artist'.
    // Tolerant of missing field — defaults to music-note fallback.
    const commentProfileType = String(node?.profile_type || node?.profileType || '').toLowerCase();
    const isVisualArtistComment = isArtistComment && commentProfileType === 'artist';
    const DefaultAvatarIcon = isBusinessComment
        ? StorefrontOutlinedIcon
        : isArtistComment
            ? (isVisualArtistComment ? PaletteRoundedIcon : MusicNoteRoundedIcon)
            : PersonRoundedIcon;
    const defaultAvatarSx = (isBusinessComment || isArtistComment)
        ? { bgcolor: 'action.hover', color: 'primary.main' }
        : DEFAULT_AVATAR_SX;

    const ts = node.created_at ? timeAgo(node.created_at) : '';
    const hasReplies = Array.isArray(node.replies) && node.replies.length > 0;
    const open = !!expanded[node.id];
    const isPinned = Boolean(Number(node?.is_pinned ?? 0));
    const isHighlighted = highlightedCommentId != null && String(node.id) === String(highlightedCommentId);

    const [showFull, setShowFull] = useState(false);
    const [liked, setLiked] = useState(Boolean(node.viewer_liked));
    const [likes, setLikes] = useState(Number(node.likes || 0));
    const [flagged, setFlagged] = useState(Boolean(node.viewer_flagged));

    useEffect(() => {
        setLiked(Boolean(node.viewer_liked));
        setLikes(Number(node.likes || 0));
        setFlagged(Boolean(node.viewer_flagged));
    }, [node.viewer_liked, node.viewer_flagged, node.likes]);

    // 3-dot menu state
    const [commentMenuAnchor, setCommentMenuAnchor] = useState(null);
    const commentMenuOpen = Boolean(commentMenuAnchor);
    const openCommentMenu = (e) => { e.stopPropagation(); setCommentMenuAnchor(e.currentTarget); };
    const closeCommentMenu = (e) => { if (e) e.stopPropagation(); setCommentMenuAnchor(null); };

    const viewerIdStr = viewerId != null ? String(viewerId) : null;
    const nodeId = node.user_id != null ? String(node.user_id) : null;
    // isAuthor: only show "Author" when the comment identity matches the post identity.
    // A business/artist comment from the same user_id does NOT count as "Author"
    // on a post authored by a different entity (e.g. personal comment on biz post is NOT author).
    const isAuthor = (() => {
        if (!postAuthorId || !nodeId || String(postAuthorId) !== nodeId) return false;
        // If comment is from a business/artist, it's not the personal post author
        if (commentBizId > 0 || commentArtId > 0) return false;
        return true;
    })();
    const sameUser = viewerIdStr && nodeId && viewerIdStr === nodeId;
    const commentBizId = Number(node.business_id || 0);
    const commentArtId = Number(node.artist_id || 0);

    const { isBusinessAccount: isBA_c, isArtistAccount: isAA_c, activeBusinessId: aBizId_c, activeArtistId: aArtId_c } = useActiveAccount();

    // "Own comment" — viewer made this comment from the same account identity
    const isOwnComment = sameUser && (
        (isBA_c && aBizId_c && commentBizId === Number(aBizId_c)) ||
        (isAA_c && aArtId_c && commentArtId === Number(aArtId_c)) ||
        (!isBA_c && !isAA_c && !commentBizId && !commentArtId)
    );
    // Use the viewer's LIVE avatar for their own comments so profile pic changes show immediately.
    const displayAvatarUrl = (isOwnComment && viewerAvatarUrl) ? viewerAvatarUrl : commentAvatarUrl;

    // Can delete: own comment OR post author (can delete any comment on their post)
    const isPostOwner = Boolean(postAuthorId && viewerIdStr === String(postAuthorId));
    const canDelete = isOwnComment || isPostOwner;
    const deleteLabel = depth > 0 ? 'Delete Reply' : 'Delete Comment';

    const hasNodeAvatar = !!displayAvatarUrl;

    // Open UserCardPopover on avatar/name click (matches PostPage pattern)
    const openCard = (e) => {
        if (!onOpenUserCard) return;
        e.stopPropagation();
        // For business/artist comments, only pass the account-specific avatar
        // (never the personal user avatar) so UserCardPopover shows the correct
        // fallback icon when no account avatar exists.
        const cardAvatarUrl = isBusinessComment
            ? (node.business_avatar_url || node.account_avatar_url || '')
            : isArtistComment
                ? (node.artist_avatar_url || node.account_avatar_url || '')
                : (node.avatar || '');
        onOpenUserCard(e.currentTarget, {
            id: node.user_id,
            first_name: node.first_name,
            last_name: node.last_name,
            handle: isBusinessComment
                ? (node.business_slug || node.account_handle || node.handle)
                : isArtistComment
                    ? (node.artist_handle || node.account_handle || node.handle)
                    : node.handle,
            avatar_url: cardAvatarUrl,
            ...(isBusinessComment ? {
                account_type: 'business',
                business_id: node.business_id,
                business_name: node.business_name || node.account_name,
                business_slug: node.business_slug || node.account_handle,
                business_avatar_url: node.business_avatar_url || node.account_avatar_url,
            } : {}),
            ...(isArtistComment ? {
                account_type: 'artist',
                artist_id: node.artist_id,
                artist_name: node.artist_name || node.account_name,
                artist_handle: node.artist_handle || node.account_handle,
                artist_avatar_url: node.artist_avatar_url || node.account_avatar_url,
            } : {}),
            ...(node.account_type ? { account_type: node.account_type } : {}),
            ...(node.account_name ? { account_name: node.account_name } : {}),
            ...(node.account_handle ? { account_handle: node.account_handle } : {}),
            ...(node.account_avatar_url ? { account_avatar_url: node.account_avatar_url } : {}),
        });
    };

    // Depth-capped indent — after MAX_VISUAL_DEPTH, stop adding padding
    const shouldIndent = depth > 0 && depth <= MAX_VISUAL_DEPTH;
    const indentPl = shouldIndent ? { xs: 1.5, sm: 2 } : 0;
    const indentMl = shouldIndent ? { xs: 0.5, sm: 1 } : 0;
    const avatarSize = depth === 0 ? 40 : depth === 1 ? 36 : 32;
    const commentFontSize = depth >= 2 ? 13 : 14;
    const nameFontSize = depth >= 2 ? 13 : 14;

    const [visibleReplies, setVisibleReplies] = useState(INITIAL_REPLIES_SHOWN);
    useEffect(() => {
        if (open) setVisibleReplies(INITIAL_REPLIES_SHOWN);
    }, [open]);

    const repliesToShow = hasReplies ? node.replies.slice(0, visibleReplies) : [];

    const effectiveText = node.text || '';
    const needsTruncate = !!effectiveText && effectiveText.length > COMMENT_PREVIEW_CHARS;
    const displayText =
        !effectiveText
            ? ''
            : showFull || !needsTruncate
                ? effectiveText
                : `${effectiveText.slice(0, COMMENT_PREVIEW_CHARS)}...`;

    const toggleReplies = () => setExpanded((s) => ({ ...s, [node.id]: !s[node.id] }));

    const [replyOpen, setReplyOpen] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [replying, setReplying] = useState(false);
    const [replyFiles, setReplyFiles] = useState([]);
    const [replyImageUrls, setReplyImageUrls] = useState([]);
    const [replyError, setReplyError] = useState('');

    // ── Reply @mention state ──
    const [rpMentionOpen, setRpMentionOpen] = useState(false);
    const [rpMentionQuery, setRpMentionQuery] = useState("");
    const [rpMentionResults, setRpMentionResults] = useState([]);
    const [rpMentionLoading, setRpMentionLoading] = useState(false);
    const [rpMentionActiveIdx, setRpMentionActiveIdx] = useState(0);
    const [rpMentionAnchorEl, setRpMentionAnchorEl] = useState(null);
    const rpInputRef = useRef(null);
    const rpMentionStartRef = useRef(0);
    const rpMentionEndRef = useRef(0);
    const rpAbortRef = useRef(null);

    const closeRpMention = () => { setRpMentionOpen(false); setRpMentionResults([]); setRpMentionQuery(""); setRpMentionActiveIdx(0); };

    // Dismiss reply mention dropdown on scroll
    useEffect(() => {
        if (!rpMentionOpen) return;
        const onScroll = () => closeRpMention();
        window.addEventListener('scroll', onScroll, { passive: true, capture: true });
        return () => window.removeEventListener('scroll', onScroll, { capture: true });
    }, [rpMentionOpen]);

    const insertRpMention = (user) => {
        const handle = user.handle || user.username || "";
        const before = replyText.slice(0, rpMentionStartRef.current);
        const after = replyText.slice(rpMentionEndRef.current);
        const next = before + "@" + handle + " " + after;
        setReplyText(next);
        closeRpMention();
        setTimeout(() => { const el = rpInputRef.current; if (el) { const pos = before.length + handle.length + 2; el.selectionStart = pos; el.selectionEnd = pos; el.focus(); } }, 0);
    };

    useEffect(() => {
        if (!rpMentionOpen || !rpMentionQuery) { setRpMentionResults([]); return; }
        const ctrl = new AbortController();
        rpAbortRef.current?.abort();
        rpAbortRef.current = ctrl;
        const tid = setTimeout(async () => {
            try {
                setRpMentionLoading(true);
                const res = await secureFetch(`/api/community/users/search?q=${encodeURIComponent(rpMentionQuery)}&limit=8`, { credentials: 'include', signal: ctrl.signal });
                if (!ctrl.signal.aborted) { const data = await res.json(); setRpMentionResults(Array.isArray(data) ? data : []); setRpMentionActiveIdx(0); }
            } catch { if (!ctrl.signal.aborted) setRpMentionResults([]); }
            finally { if (!ctrl.signal.aborted) setRpMentionLoading(false); }
        }, 200);
        return () => { clearTimeout(tid); ctrl.abort(); };
    }, [rpMentionOpen, rpMentionQuery]);

    const handleRpChange = (e) => {
        const val = e.target.value.slice(0, COMMENT_MAX_CHARS);
        setReplyText(val);
        if (replyError) setReplyError('');
        const cursor = e.target.selectionStart || 0;
        const match = getMentionMatch(val, cursor);
        if (match) {
            rpMentionStartRef.current = match.start;
            rpMentionEndRef.current = match.end;
            setRpMentionQuery(match.query);
            setRpMentionAnchorEl(rpInputRef.current);
            if (!rpMentionOpen) setRpMentionOpen(true);
        } else { closeRpMention(); }
    };

    const sendReply = async () => {
        const txt = replyText.trim();
        const hasImages = replyFiles.length > 0 || replyImageUrls.length > 0;
        if (!txt && !hasImages) return;

        // Client-side profanity check
        if (txt) {
            const profResult = checkProfanity(txt);
            if (!profResult.clean) {
                setReplyError('Your reply contains inappropriate language. Please revise and try again.');
                return;
            }
        }

        // Client-side image moderation check (scan each file before uploading)
        if (replyFiles.length > 0) {
            for (const file of replyFiles) {
                const result = await scanImageFile(file);
                if (!result.safe) {
                    setReplyError(result.message);
                    return;
                }
            }
        }

        setReplyError('');
        setReplying(true);
        await submitReply(node.id, txt, { files: replyFiles, imageUrls: replyImageUrls });
        setReplying(false);
        setReplyText('');
        setReplyFiles([]);
        setReplyImageUrls([]);
        setReplyOpen(false);
        setExpanded((s) => ({ ...s, [node.id]: true }));
    };

    const onReplyKeyDown = (e) => {
        if (rpMentionOpen && rpMentionResults.length > 0) {
            if (e.key === "ArrowDown") { e.preventDefault(); setRpMentionActiveIdx((i) => (i + 1) % rpMentionResults.length); return; }
            if (e.key === "ArrowUp") { e.preventDefault(); setRpMentionActiveIdx((i) => (i - 1 + rpMentionResults.length) % rpMentionResults.length); return; }
            if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertRpMention(rpMentionResults[rpMentionActiveIdx]); return; }
            if (e.key === "Escape") { e.preventDefault(); closeRpMention(); return; }
        }
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendReply();
        }
    };

    // Blocked user check
    const cUserId = Number(node.user_id || node.userId || 0);
    const cBizId = Number(node.business_id || 0);
    const cArtId = Number(node.artist_id || 0);
    const cHandle = (node.handle || node.business_slug || node.artist_handle || node.account_handle || '').toLowerCase().trim();
    const isBlockedUser =
        isCommentBlocked(node, { blockedUserIds, blockedBusinessIds, blockedArtistIds, blockedHandles });
    const [showBlockedContent, setShowBlockedContent] = useState(false);
    const showPlaceholder = isBlockedUser && !showBlockedContent;
    const showBlockedLabel = isBlockedUser && !showPlaceholder;

    if (showPlaceholder) {
        const blockedLabel = depth > 0 ? 'Reply from a blocked user' : 'Comment from a blocked user';
        return (
            <>
                <Box
                    id={`comment-${node.id}`}
                    sx={{
                        pl: indentPl,
                        borderLeft: shouldIndent ? (t) => `2px solid ${alphaColor(t.palette.common.black, 0.08)}` : 'none',
                        ml: indentMl,
                    }}
                >
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', py: 1, px: 1.5, bgcolor: (t) => alphaColor(t.palette.text.primary, 0.03), borderRadius: 2, my: 0.5 }}>
                        <BlockIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>{blockedLabel}</Typography>
                        <Link component="button" type="button" underline="hover" onClick={() => setShowBlockedContent(true)}
                              sx={{ fontSize: 13, fontWeight: 600, flexShrink: 0 }}>Show</Link>
                    </Box>
                </Box>
                {hasReplies && open ? (
                    <Box sx={{ pl: indentPl, ml: indentMl }}>
                        {node.replies.map((r) => (
                            <ThreadedCommentItem
                                key={r.id} node={r} depth={depth + 1}
                                expanded={expanded} setExpanded={setExpanded}
                                viewerAvatarUrl={viewerAvatarUrl} viewerLabel={viewerLabel} viewerId={viewerId}
                                viewerAccountType={viewerAccountType}
                                viewerProfileType={viewerProfileType}
                                postAuthorId={postAuthorId} likeComment={likeComment} submitReply={submitReply}
                                openFlag={openFlag} onRequestDelete={onRequestDelete} onRequestTogglePin={onRequestTogglePin}
                                canPinComment={false} blockedUserIds={blockedUserIds} blockedHandles={blockedHandles}
                                replyToName={name} replyToHandle={displayHandle} onShareComment={onShareComment}
                                highlightedCommentId={highlightedCommentId}
                                onOpenUserCard={onOpenUserCard}
                                postId={postId} businessSlug={businessSlug} onCopyLinkToast={onCopyLinkToast}
                            />
                        ))}
                    </Box>
                ) : null}
            </>
        );
    }

    return (
        <>
            <Box
                data-comment-id={String(node.id)}
                id={`comment-${node.id}`}
                sx={{
                    pl: indentPl,
                    borderLeft: shouldIndent ? (t) => `2px solid ${alphaColor(t.palette.common.black, 0.08)}` : 'none',
                    ml: indentMl,
                    scrollMarginTop: 120,
                    ...(isHighlighted ? {
                        bgcolor: (t) => alphaColor(t.custom?.brand?.brass || '#A87822', 0.14),
                        border: '2px solid',
                        borderColor: (t) => alphaColor(t.custom?.brand?.brass || '#A87822', 0.50),
                        boxShadow: (t) => `0 14px 34px ${alphaColor(t.custom?.brand?.brass || '#A87822', 0.18)}`,
                        borderRadius: 2,
                        transition: 'background-color 0.6s ease',
                    } : {}),
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        gap: 1,
                        alignItems: 'flex-start',
                        py: 1.25,
                        borderRadius: 2,
                        width: '100%',
                        boxSizing: 'border-box',
                    }}
                >
                    <Avatar
                        src={hasNodeAvatar ? displayAvatarUrl : undefined}
                        sx={{ width: avatarSize, height: avatarSize, flexShrink: 0, cursor: 'pointer', border: '1px solid', borderColor: 'divider', ...(!hasNodeAvatar ? defaultAvatarSx : {}) }}
                        onClick={openCard}
                    >
                        {!hasNodeAvatar ? <DefaultAvatarIcon sx={{ fontSize: avatarSize * 0.6 }} /> : null}
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {/* "Replying to @handle" label for replies */}
                        {depth > 0 && replyToHandle ? (
                            <Typography
                                variant="caption"
                                sx={{ color: 'text.secondary', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}
                            >
                                <Box component="span" sx={{ color: 'primary.main' }}>↳</Box>
                                Replying to{' '}
                                <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>
                                    @{replyToHandle}
                                </Box>
                            </Typography>
                        ) : null}

                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                gap: 1,
                                flexWrap: 'nowrap',
                            }}
                        >
                            <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.25 }}>
                                <Box sx={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, cursor: 'pointer', fontSize: nameFontSize, '&:hover': { textDecoration: 'underline' } }} onClick={openCard} noWrap>
                                        {name}
                                    </Typography>
                                    {isAuthor && (
                                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Author
                                            </Typography>
                                        </Box>
                                    )}
                                    {isPinned && depth === 0 && (
                                        <Chip size="small" icon={<PushPinRoundedIcon sx={{ fontSize: 11 }} />} label="Pinned"
                                              sx={(t) => ({ height: 18, fontSize: 10, fontWeight: 800, ml: 0.25, bgcolor: alphaColor(t.palette.secondary.main, 0.10), color: t.palette.secondary.main, border: '1px solid', borderColor: alphaColor(t.palette.secondary.main, 0.24), '& .MuiChip-icon': { ml: '2px', mr: '0px', color: t.palette.secondary.main }, '& .MuiChip-label': { px: 0.5 } })} />
                                    )}
                                    {ts ? (
                                        <>
                                            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', fontSize: 11 }}>
                                                {ts}
                                            </Typography>
                                        </>
                                    ) : null}
                                    {Boolean(node.liked_by_author) && !isAuthor && (
                                        <Chip size="small" icon={<FavoriteRoundedIcon sx={{ fontSize: 10 }} />} label="by author"
                                              sx={(t) => ({ height: 18, fontSize: 10, fontWeight: 800, ml: 0.25, bgcolor: alphaColor(t.palette.error.main, 0.08), color: t.palette.error.main, border: '1px solid', borderColor: alphaColor(t.palette.error.main, 0.18), '& .MuiChip-icon': { ml: '2px', mr: '-2px', color: t.palette.error.main }, '& .MuiChip-label': { px: 0.5 } })} />
                                    )}
                                    {showBlockedLabel && (
                                        <>
                                            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                                            <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.disabled', whiteSpace: 'nowrap' }}>
                                                {depth > 0 ? 'Reply made by a blocked user' : 'Comment made by a blocked user'}
                                            </Typography>
                                            <Link component="button" type="button" underline="hover"
                                                  onClick={(e) => { e.stopPropagation(); setShowBlockedContent(false); }}
                                                  sx={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', ml: 0.25 }}>Hide</Link>
                                        </>
                                    )}
                                </Box>
                                {displayHandle ? (
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ cursor: 'pointer', fontSize: 11, mt: 0.1, lineHeight: 1.2, whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', '&:hover': { textDecoration: 'underline' } }}
                                        onClick={openCard}
                                        noWrap
                                    >
                                        @{displayHandle}
                                    </Typography>
                                ) : null}
                            </Box>

                            {/* Unpin quick-action + 3-dot menu */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, ml: 'auto' }}>
                                {canPinComment && isPinned && depth === 0 ? (
                                    <Tooltip title="Unpin comment" placement="top">
                                        <IconButton
                                            size="small"
                                            onClick={() => onRequestTogglePin?.(node.id, true)}
                                            sx={{
                                                borderRadius: 2,
                                                bgcolor: (t) => alphaColor(t.palette.warning.main, 0.10),
                                                border: (t) => `1px solid ${alphaColor(t.palette.warning.main, 0.28)}`,
                                                '&:hover': { bgcolor: (t) => alphaColor(t.palette.warning.main, 0.16) },
                                            }}
                                        >
                                            <PushPinRoundedIcon fontSize="small" sx={{ color: 'warning.main' }} />
                                        </IconButton>
                                    </Tooltip>
                                ) : null}
                                <Box>
                                    <IconButton
                                        size="small"
                                        onClick={openCommentMenu}
                                        sx={{ flexShrink: 0, color: 'text.secondary' }}
                                    >
                                        <MoreVertIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                    <SmartMenu
                                        anchorEl={commentMenuAnchor}
                                        open={commentMenuOpen}
                                        onClose={closeCommentMenu}
                                        onClick={(e) => e.stopPropagation()}
                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                        slotProps={{ paper: { sx: { mt: 0.5, minWidth: 200, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: (t) => t.custom?.shadows?.lg || `0 12px 40px ${alphaColor(t.palette.text.primary, 0.15)}`, py: 0.5 } } }}
                                    >
                                        {/* Copy link — always available */}
                                        <MenuItem
                                            key="copy-link"
                                            onClick={(e) => {
                                                closeCommentMenu(e);
                                                const url = businessSlug
                                                    ? `${window.location.origin}/${businessSlug}/posts/${postId}?comment=${node.id}`
                                                    : `${window.location.origin}/posts/${postId}?comment=${node.id}`;
                                                navigator.clipboard.writeText(url).then(() => {
                                                    onCopyLinkToast?.();
                                                }).catch(() => {});
                                            }}
                                        >
                                            <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
                                            <ListItemText primary="Copy link" />
                                        </MenuItem>

                                        {/* Pin / Unpin — post owner only, top-level only */}
                                        {canPinComment && depth === 0 ? (
                                            <MenuItem
                                                key="pin"
                                                onClick={(e) => {
                                                    closeCommentMenu(e);
                                                    onRequestTogglePin?.(node.id, isPinned);
                                                }}
                                            >
                                                <ListItemIcon><PushPinRoundedIcon fontSize="small" /></ListItemIcon>
                                                <ListItemText primary={isPinned ? 'Unpin comment' : 'Pin comment'} />
                                            </MenuItem>
                                        ) : null}

                                        {/* Delete — own comment or post owner */}
                                        {canDelete ? (
                                            <MenuItem
                                                key="delete"
                                                onClick={(e) => {
                                                    closeCommentMenu(e);
                                                    onRequestDelete?.(node.id, depth > 0);
                                                }}
                                            >
                                                <ListItemIcon><DeleteOutlineIcon fontSize="small" /></ListItemIcon>
                                                <ListItemText primary={deleteLabel} />
                                            </MenuItem>
                                        ) : null}

                                        {/* Report — not own comment */}
                                        {!isOwnComment && !flagged ? (
                                            <MenuItem
                                                key="report"
                                                onClick={(e) => {
                                                    closeCommentMenu(e);
                                                    openFlag(node.id);
                                                }}
                                            >
                                                <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                                                <ListItemText primary="Report comment" />
                                            </MenuItem>
                                        ) : null}
                                        {!isOwnComment && flagged ? (
                                            <MenuItem key="reported" disabled>
                                                <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                                                <ListItemText primary="Reported" />
                                            </MenuItem>
                                        ) : null}
                                    </SmartMenu>
                                </Box>
                            </Box>
                        </Box>

                        {/* Comment text */}
                        {effectiveText ? (
                            <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.55, fontSize: commentFontSize }}>
                                {renderCommentText(displayText)}
                                {needsTruncate && !showFull && (
                                    <>
                                        {' '}
                                        <Link component="button" type="button" underline="hover" onClick={() => setShowFull(true)} sx={{ fontSize: 14 }}>
                                            more
                                        </Link>
                                    </>
                                )}
                                {needsTruncate && showFull && (
                                    <>
                                        {' '}
                                        <Link component="button" type="button" underline="hover" onClick={() => setShowFull(false)} sx={{ fontSize: 14 }}>
                                            less
                                        </Link>
                                    </>
                                )}
                            </Typography>
                        ) : null}

                        {/* Comment images / GIFs */}
                        {(node.images?.length > 0 || node.image) ? (
                            <CommentImages images={node.images} image={node.image} />
                        ) : null}

                        {/* Actions */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.75 }}>
                            <Link
                                component="button"
                                type="button"
                                underline="none"
                                onClick={() => {
                                    const nextLiked = !liked;
                                    setLiked(nextLiked);
                                    setLikes((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));
                                    likeComment(node.id, liked);
                                }}
                                sx={{ fontSize: 13, fontWeight: liked ? 900 : 700, color: liked ? 'primary.main' : 'text.secondary', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 0.5, p: 0 }}
                            >
                                {liked ? <FavoriteRoundedIcon sx={{ fontSize: 15 }} /> : <FavoriteBorderRoundedIcon sx={{ fontSize: 15 }} />} {likes > 0 ? likes : 'Like'}
                            </Link>

                            <Link
                                component="button"
                                type="button"
                                underline="none"
                                onClick={() => setReplyOpen((v) => !v)}
                                sx={{ fontSize: 13, fontWeight: 700, color: 'text.secondary', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 0.5, p: 0 }}
                                aria-expanded={replyOpen ? 'true' : 'false'}
                            >
                                <ReplyRoundedIcon sx={{ fontSize: 16, transform: 'scaleX(-1)' }} /> Reply
                            </Link>

                            {onShareComment && (
                                <Link
                                    component="button"
                                    type="button"
                                    underline="none"
                                    onClick={() => onShareComment(node)}
                                    sx={{ fontSize: 13, fontWeight: 700, color: 'text.secondary', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 0.5, p: 0 }}
                                >
                                    <ShareOutlinedIcon sx={{ fontSize: 14 }} /> Share
                                </Link>
                            )}
                        </Box>

                        {/* Reply box */}
                        {replyOpen && (
                            <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'flex-start' }}>
                                <AccountAvatar
                                    src={viewerAvatarUrl}
                                    accountType={viewerAccountType}
                                    profileType={viewerProfileType}
                                    alt={viewerLabel || 'You'}
                                    size={{ xs: 32, sm: 40 }}
                                    sx={{ mt: 0.25 }}
                                />

                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        minRows={2}
                                        maxRows={6}
                                        placeholder={`Reply to ${name}…`}
                                        value={replyText}
                                        onChange={handleRpChange}
                                        onKeyDown={onReplyKeyDown}
                                        inputRef={rpInputRef}
                                        disabled={replying}
                                        error={Boolean(replyError)}
                                        helperText={replyError}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, alignItems: 'flex-end' } }}
                                        inputProps={{ maxLength: COMMENT_MAX_CHARS }}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end" sx={{ alignSelf: 'flex-end', pb: 0.25 }}>
                                                    <IconButton
                                                        aria-label="Send reply"
                                                        onClick={sendReply}
                                                        disabled={replying || (!replyText.trim() && replyFiles.length === 0 && replyImageUrls.length === 0)}
                                                        sx={{ ...SEND_BUTTON_SX, width: 34, height: 34 }}
                                                    >
                                                        {replying ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : <ArrowForwardRoundedIcon />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                    {renderMentionPopper({ open: rpMentionOpen, anchorEl: rpMentionAnchorEl || rpInputRef.current, results: rpMentionResults, loading: rpMentionLoading, activeIdx: rpMentionActiveIdx, onSelect: insertRpMention, onClose: closeRpMention })}
                                    {/* Reply image + GIF attachments */}
                                    <CommentImageAttachments
                                        files={replyFiles}
                                        urls={replyImageUrls}
                                        onFilesChange={async (newFiles) => {
                                            if (replyError) setReplyError('');
                                            const added = newFiles.filter((f) => !replyFiles.includes(f));
                                            for (const file of added) {
                                                const result = await scanImageFile(file);
                                                if (!result.safe) {
                                                    setReplyError(result.message);
                                                    setReplyFiles((prev) => prev.filter((pf) => pf !== file));
                                                    return;
                                                }
                                            }
                                            setReplyFiles(newFiles);
                                        }}
                                        onUrlsChange={(u) => { setReplyImageUrls(u); if (replyError) setReplyError(''); }}
                                        maxImages={4}
                                        disabled={replying}
                                    />
                                </Box>
                            </Box>
                        )}

                        {/* Reply count when replies haven't been loaded */}
                        {node.reply_count > 0 && !hasReplies && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                {node.reply_count} repl{node.reply_count === 1 ? 'y' : 'ies'}
                            </Typography>
                        )}

                        {/* Replies toggle */}
                        {hasReplies && (
                            <Link
                                component="button"
                                type="button"
                                underline="hover"
                                onClick={toggleReplies}
                                aria-expanded={open ? 'true' : 'false'}
                                aria-label={open ? 'Hide replies' : `Show replies (${node.replies.length})`}
                                sx={{
                                    mt: 0.5,
                                    p: 0,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: 'primary.main',
                                    textAlign: 'left',
                                    '&:focus-visible': (theme) => ({
                                        outline: `2px solid ${theme.palette.primary.main}`,
                                        outlineOffset: 2,
                                        borderRadius: 0.5,
                                    }),
                                }}
                            >
                                {open ? 'Hide replies' : `Show replies (${node.replies.length})`}
                            </Link>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* Replies rendered OUTSIDE the indented box so padding doesn't stack */}
            {hasReplies && open && (
                <Box sx={{ pl: indentPl, ml: indentMl }}>
                    {repliesToShow.map((r) => (
                        <ThreadedCommentItem
                            key={r.id}
                            node={r}
                            depth={depth + 1}
                            expanded={expanded}
                            setExpanded={setExpanded}
                            viewerAvatarUrl={viewerAvatarUrl}
                            viewerLabel={viewerLabel}
                            viewerId={viewerId}
                            viewerAccountType={viewerAccountType}
                            viewerProfileType={viewerProfileType}
                            postAuthorId={postAuthorId}
                            likeComment={likeComment}
                            submitReply={submitReply}
                            openFlag={openFlag}
                            onRequestDelete={onRequestDelete}
                            onRequestTogglePin={onRequestTogglePin}
                            canPinComment={false}
                            blockedUserIds={blockedUserIds}
                            blockedBusinessIds={blockedBusinessIds}
                            blockedArtistIds={blockedArtistIds}
                            blockedHandles={blockedHandles}
                            replyToName={name}
                            replyToHandle={displayHandle}
                            onShareComment={onShareComment}
                            highlightedCommentId={highlightedCommentId}
                            onOpenUserCard={onOpenUserCard}
                            postId={postId} businessSlug={businessSlug} onCopyLinkToast={onCopyLinkToast}
                        />
                    ))}
                    {node.replies.length > visibleReplies && (
                        <Link
                            component="button"
                            type="button"
                            underline="hover"
                            onClick={() => setVisibleReplies((v) => v + INITIAL_REPLIES_SHOWN)}
                            sx={{ fontSize: 13, ml: 3, mt: 0.5, display: 'block' }}
                        >
                            Show {Math.min(INITIAL_REPLIES_SHOWN, node.replies.length - visibleReplies)} more {node.replies.length - visibleReplies === 1 ? 'reply' : 'replies'}
                        </Link>
                    )}
                </Box>
            )}
        </>
    );
}

// Sort root-level comments (pinned always first, then by sort mode)
function sortRootComments(roots, sort, boostIds) {
    const sorted = [...roots];
    sorted.sort((a, b) => {
        const ap = Number(a?.is_pinned ?? 0);
        const bp = Number(b?.is_pinned ?? 0);
        if (bp !== ap) return bp - ap;
        if (boostIds && boostIds.size > 0) {
            const aBoost = boostIds.has(String(a?.id)) ? 1 : 0;
            const bBoost = boostIds.has(String(b?.id)) ? 1 : 0;
            if (aBoost !== bBoost) return bBoost - aBoost;
        }
        if (sort === 'popular') {
            const aLikes = Number(a?.likes ?? 0);
            const bLikes = Number(b?.likes ?? 0);
            if (bLikes !== aLikes) return bLikes - aLikes;
            // tie-break by newest
            const at = a?.created_at ? new Date(a.created_at).getTime() : 0;
            const bt = b?.created_at ? new Date(b.created_at).getTime() : 0;
            return bt - at;
        }
        // newest first
        const at = a?.created_at ? new Date(a.created_at).getTime() : 0;
        const bt = b?.created_at ? new Date(b.created_at).getTime() : 0;
        return bt - at;
    });
    return sorted;
}

function CommentsSection({
                             postId,
                             businessSlug,
                             viewer,
                             postAuthorId,
                             canPinComment,
                             refreshKey,
                             onCommentsLoaded,
                             onCopyLinkToast,
                             scrollToCommentId,
                             addCommentRef,
                         }) {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState({});
    const [visibleCount, setVisibleCount] = useState(INITIAL_COMMENTS_SHOWN);
    const [flagState, setFlagState] = useState({ open: false, commentId: null });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, commentId: null, isReply: false });
    const [pinConfirm, setPinConfirm] = useState({ open: false, commentId: null, isPinned: false });

    // ── Success confirmation snackbar ──
    const { showSuccess: showCommentSuccess, snackbarProps: commentSnackbarProps } = useSuccessSnackbar();

    // Share comment dialog state
    const [shareCommentDialogOpen, setShareCommentDialogOpen] = useState(false);
    const [shareCommentTarget, setShareCommentTarget] = useState(null);

    // Rate limiting for replies
    const { checkLimit: checkCommentLimit, recordAction: recordComment } = useRateLimit('comment', { burstMax: 3, burstWindowMs: 10_000, maxPerHour: 60 });
    const [commentRateLimitOpen, setCommentRateLimitOpen] = useState(false);
    const [commentRateLimitInfo, setCommentRateLimitInfo] = useState({ retryAfterSec: 10, reason: 'cooldown' });

    const handleShareComment = useCallback((commentNode) => {
        setShareCommentTarget(commentNode);
        setShareCommentDialogOpen(true);
    }, []);

    // Comment-author UserCardPopover state
    const [commentUserAnchor, setCommentUserAnchor] = useState(null);
    const [commentUserForCard, setCommentUserForCard] = useState(null);
    const handleOpenCommentUserCard = useCallback((el, author) => {
        setCommentUserAnchor(el);
        setCommentUserForCard({
            id: author?.id,
            first_name: author?.first_name,
            last_name: author?.last_name,
            handle: author?.handle,
            avatar_url: author?.avatar_url,
            ...(author?.account_type ? { account_type: author.account_type } : {}),
            ...(author?.business_id ? { business_id: author.business_id } : {}),
            ...(author?.business_name ? { business_name: author.business_name } : {}),
            ...(author?.business_slug ? { business_slug: author.business_slug } : {}),
            ...(author?.business_avatar_url ? { business_avatar_url: author.business_avatar_url } : {}),
            ...(author?.artist_id ? { artist_id: author.artist_id } : {}),
            ...(author?.artist_name ? { artist_name: author.artist_name } : {}),
            ...(author?.artist_handle ? { artist_handle: author.artist_handle } : {}),
            ...(author?.artist_avatar_url ? { artist_avatar_url: author.artist_avatar_url } : {}),
            ...(author?.account_name ? { account_name: author.account_name } : {}),
            ...(author?.account_handle ? { account_handle: author.account_handle } : {}),
            ...(author?.account_avatar_url ? { account_avatar_url: author.account_avatar_url } : {}),
        });
    }, []);

    // Sort mode for comments: newest (default) or popular
    const [commentSort, setCommentSort] = useState('newest');
    // Display-order comments — re-sorted only on fetch or sort-change, NOT on likes
    const [displayComments, setDisplayComments] = useState([]);

    // Track newly added comment IDs for fade-in animation
    const [newCommentIds, setNewCommentIds] = useState(() => new Set());
    const prevCommentIdsRef = useRef(new Set());
    const newCommentTimerRef = useRef(0);

    // Expose a function for the parent to optimistically insert a new top-level comment
    useEffect(() => {
        if (!addCommentRef) return;
        addCommentRef.current = (serverComment) => {
            if (!serverComment) return;
            const normalized = normalizeComments([serverComment]);
            if (normalized.length > 0) {
                ensureCommentFadeKeyframes();
                const addedIds = new Set(normalized.map((c) => String(c.id)));
                setNewCommentIds((prev) => {
                    const next = new Set(prev);
                    addedIds.forEach((id) => next.add(id));
                    return next;
                });
                if (newCommentTimerRef.current) clearTimeout(newCommentTimerRef.current);
                newCommentTimerRef.current = setTimeout(() => setNewCommentIds(new Set()), 2000);
                setComments((prev) => [...normalized, ...prev]);
                setDisplayComments((prev) => [...normalized, ...prev]);
                // Update prevCommentIdsRef so refetch doesn't double-animate
                normalized.forEach((c) => prevCommentIdsRef.current.add(String(c.id)));
            }
        };
        return () => { addCommentRef.current = null; };
    }, [addCommentRef]);

    const {
        getAccountParams, getAccountPayload, getCommentPayload,
        isBusinessAccount: csIsBA, isArtistAccount: csIsAA,
        activeAccount: csActiveAccount,
        activeBusinessId: csActiveBizId, activeArtistId: csActiveArtId,
    } = useActiveAccount();

    // Stabilize account functions via refs — prevents fetchComments from being
    // recreated every render (which would cause useEffect to re-fire and re-sort)
    const getAccountParamsRef = useRef(getAccountParams);
    getAccountParamsRef.current = getAccountParams;
    const getAccountPayloadRef = useRef(getAccountPayload);
    getAccountPayloadRef.current = getAccountPayload;
    const getCommentPayloadRef = useRef(getCommentPayload);
    getCommentPayloadRef.current = getCommentPayload;

    const viewerUser = viewer?.user || viewer || null;
    const viewerId = viewerUser?.id;

    // ── Fetch active account avatar when not in context ──
    // Also captures profile_type for artist accounts so the composer avatar
    // fallback picks palette vs music-note correctly.
    const [csFetchedAvatar, setCsFetchedAvatar] = useState('');
    const [csFetchedProfileType, setCsFetchedProfileType] = useState('');
    useEffect(() => {
        if (!csIsBA && !csIsAA) {
            setCsFetchedAvatar('');
            setCsFetchedProfileType('');
            return;
        }
        // For artist accounts ALWAYS fetch so we get an authoritative
        // profile_type from the music_artists row (mirrors
        // ArtistAdminConsole's pattern). Business accounts can short-circuit
        // when avatar is already in context.
        const ctxAvatar = csActiveAccount?.avatar_url || csActiveAccount?.avatarUrl || csActiveAccount?.logo_url || csActiveAccount?.logoUrl || '';
        if (csIsBA && ctxAvatar) {
            setCsFetchedAvatar('');
            setCsFetchedProfileType('');
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                let url = '';
                if (csIsBA && csActiveBizId) {
                    // Business endpoint uses slug, not numeric ID
                    const bizSlug = csActiveAccount?.slug || csActiveAccount?.handle || (() => {
                        try {
                            const raw = localStorage.getItem('ll:activeAccount');
                            if (!raw) return '';
                            const parsed = JSON.parse(raw);
                            return parsed?.slug || parsed?.handle || '';
                        } catch { return ''; }
                    })();
                    if (bizSlug) {
                        url = `/api/business/${encodeURIComponent(bizSlug)}`;
                    }
                } else if (csIsAA && csActiveArtId) {
                    url = `/api/music/artists/${encodeURIComponent(csActiveArtId)}`;
                }
                if (!url) return;
                const res = await secureFetch(url, { credentials: 'include', headers: { Accept: 'application/json' } });
                if (!res.ok || cancelled) return;
                const data = await res.json();
                const entity = data?.business || data?.artist || data;
                const av = entity?.avatar_url || entity?.avatarUrl || entity?.logo_url || entity?.logoUrl || '';
                const pt = String(entity?.profile_type || entity?.profileType || '').toLowerCase();
                if (cancelled) return;
                if (av) setCsFetchedAvatar(av);
                // Normalize to 'artist' | 'music' for artist accounts.
                if (csIsAA) {
                    setCsFetchedProfileType(pt === 'artist' ? 'artist' : 'music');
                }
                // Patch localStorage so Header and other consumers see the
                // right value. Overwrite unconditionally (last-writer-wins)
                // so stale cached values get corrected.
                try {
                    const raw = localStorage.getItem('ll:activeAccount');
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (parsed && typeof parsed === 'object') {
                            let dirty = false;
                            if (av && parsed.avatar_url !== av) {
                                parsed.avatar_url = av;
                                dirty = true;
                            }
                            if (csIsAA) {
                                const normalized = pt === 'artist' ? 'artist' : 'music';
                                if (parsed.profileType !== normalized || parsed.profile_type !== normalized) {
                                    parsed.profile_type = normalized;
                                    parsed.profileType = normalized;
                                    dirty = true;
                                }
                            }
                            if (dirty) localStorage.setItem('ll:activeAccount', JSON.stringify(parsed));
                        }
                    }
                } catch { /* ignore */ }
            } catch { /* ignore */ }
        })();
        return () => { cancelled = true; };
    }, [csIsBA, csIsAA, csActiveBizId, csActiveArtId, csActiveAccount?.avatar_url, csActiveAccount?.avatarUrl, csActiveAccount?.logo_url, csActiveAccount?.logoUrl]);

    // Active-account-aware avatar & label (matches PostPage CommentsSection pattern)
    const viewerPersonalAvatarUrl = viewerUser?.avatar_url || viewerUser?.profile_picture || '';
    const viewerPersonalLabel = `${viewerUser?.first_name || ''} ${viewerUser?.last_name || ''}`.trim() || 'You';
    // For business/artist: return '' when no account avatar exists so the fallback
    // icon (storefront / music note) shows instead of the personal profile picture.
    // (Matches PostPage CommentsSection pattern exactly.)
    const viewerAvatar = (csIsBA || csIsAA)
        ? (csActiveAccount?.avatar_url || csActiveAccount?.avatarUrl || csActiveAccount?.logo_url || csActiveAccount?.logoUrl || csFetchedAvatar || '')
        : viewerPersonalAvatarUrl;
    const viewerLabel = (csIsBA || csIsAA)
        ? (csActiveAccount?.name || viewerPersonalLabel)
        : viewerPersonalLabel;

    // Determine viewer's active account type for avatar fallback icons
    const viewerAccountType = csIsBA ? 'business' : csIsAA ? 'artist' : 'personal';
    // Sub-type for artist accounts — musicians ('music') vs visual artists
    // ('artist'). The fetched value from the music_artists row is authoritative
    // (same approach as ArtistAdminConsole). Falls back to the active account
    // context, then localStorage, then 'music'.
    const viewerProfileType = (() => {
        if (!csIsAA) return 'music';
        const fromFetched = String(csFetchedProfileType || '').toLowerCase();
        if (fromFetched === 'artist' || fromFetched === 'music') return fromFetched;
        const fromCtx = String(csActiveAccount?.profile_type || csActiveAccount?.profileType || '').toLowerCase();
        if (fromCtx === 'artist' || fromCtx === 'music') return fromCtx;
        try {
            const raw = localStorage.getItem('ll:activeAccount');
            if (raw) {
                const parsed = JSON.parse(raw);
                const stored = String(parsed?.profile_type || parsed?.profileType || '').toLowerCase();
                if (stored === 'artist' || stored === 'music') return stored;
            }
        } catch { /* ignore */ }
        return 'music';
    })();

    // Track blocked users for comment placeholders
    const [blockedUserIds, setBlockedUserIds] = useState(() => new Set());
    const [blockedBusinessIds, setBlockedBusinessIds] = useState(() => new Set());
    const [blockedArtistIds, setBlockedArtistIds] = useState(() => new Set());
    const [blockedHandles, setBlockedHandles] = useState(() => new Set());

    useEffect(() => {
        if (!viewerId) return;
        let active = true;
        (async () => {
            try {
                const res = await secureFetch('/api/users/moderation-state', {
                    credentials: 'include',
                    headers: { Accept: 'application/json' },
                });
                if (!res.ok || !active) return;
                const data = await res.json();
                const sets = parseBlockedSets(data);
                if (!active) return;
                setBlockedUserIds(sets.blockedUserIds);
                setBlockedBusinessIds(sets.blockedBusinessIds);
                setBlockedArtistIds(sets.blockedArtistIds);
                if (sets.blockedUserIds.size > 0) {
                    const handles = new Set();
                    await Promise.all(
                        Array.from(sets.blockedUserIds).slice(0, 50).map(async (uid) => {
                            try {
                                const r = await secureFetch(`/api/users/public/${uid}`, { credentials: 'include', headers: { Accept: 'application/json' } });
                                if (!r.ok) return;
                                const d = await r.json();
                                const h = (d?.profile?.handle || d?.handle || '').toLowerCase().trim();
                                if (h) handles.add(h);
                            } catch { /* skip */ }
                        })
                    );
                    if (active && handles.size > 0) setBlockedHandles(handles);
                }
            } catch { /* non-critical */ }
        })();
        return () => { active = false; };
    }, [viewerId]);

    useEffect(() => {
        const onBlockedChanged = (e) => {
            handleBlockChangedEvent(e, setBlockedUserIds, setBlockedBusinessIds, setBlockedArtistIds);
        };
        window.addEventListener('ll:user:blocked-changed', onBlockedChanged);
        return () => window.removeEventListener('ll:user:blocked-changed', onBlockedChanged);
    }, []);

    // Use a ref for the callback to avoid infinite loop (inline arrow changes every render)
    const onCommentsLoadedRef = useRef(onCommentsLoaded);
    onCommentsLoadedRef.current = onCommentsLoaded;

    // Ref for commentSort so fetchComments doesn't depend on it
    const commentSortRef = useRef(commentSort);
    commentSortRef.current = commentSort;

    const fetchComments = useCallback(async () => {
        if (!postId) return;
        setLoading(true);

        const acctQs = new URLSearchParams({ limit: '100', offset: '0', sort: 'oldest', ...getAccountParamsRef.current() });
        const qs = acctQs.toString() ? `?${acctQs.toString()}` : '';

        const urls = [
            `/api/business/posts/${encodeURIComponent(postId)}/comments${qs}`,
            `/api/business-posts/${encodeURIComponent(postId)}/comments${qs}`,
        ];

        for (const url of urls) {
            try {
                const res = await secureFetch(url, { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    const normalized = normalizeComments(data);

                    // Detect newly added comments for fade-in animation
                    const prevIds = prevCommentIdsRef.current;
                    const freshIds = new Set(normalized.map((c) => String(c.id)));
                    const added = new Set();
                    freshIds.forEach((id) => { if (prevIds.size > 0 && !prevIds.has(id)) added.add(id); });
                    prevCommentIdsRef.current = freshIds;
                    if (added.size > 0) {
                        setNewCommentIds((prev) => {
                            const next = new Set(prev);
                            added.forEach((id) => next.add(id));
                            return next;
                        });
                    }

                    setComments(normalized);
                    setDisplayComments(sortRootComments(normalized, commentSortRef.current, added));
                    onCommentsLoadedRef.current?.(normalized.length);
                    setLoading(false);
                    return;
                }
            } catch {
                // try next
            }
        }
        setLoading(false);
    }, [postId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments, refreshKey]);

    // Re-sort display order when sort mode changes (but NOT on like updates)
    useEffect(() => {
        setDisplayComments((prev) => {
            if (!prev.length) return prev;
            return sortRootComments(prev, commentSort);
        });
        setVisibleCount(INITIAL_COMMENTS_SHOWN);
    }, [commentSort]);

    // Scroll to and highlight a specific comment (deep link from notifications).
    // 1. Walk the comment tree to find the target and all ancestor IDs.
    // 2. Expand all ancestor threads so the target is visible in the DOM.
    // 3. Ensure visibleCount is large enough to include the root thread.
    // 4. Scroll into view and apply a timed highlight.
    const autoScrollRef = useRef(false);
    const highlightTimerRef = useRef(0);
    const [highlightedCommentId, setHighlightedCommentId] = useState(null);

    // Reset scroll state when the target changes
    useEffect(() => {
        autoScrollRef.current = false;
        setHighlightedCommentId(null);
        if (highlightTimerRef.current) {
            clearTimeout(highlightTimerRef.current);
            highlightTimerRef.current = 0;
        }
    }, [scrollToCommentId]);

    useEffect(() => {
        const targetId = scrollToCommentId != null ? String(scrollToCommentId) : '';
        if (!targetId || loading || !displayComments.length || autoScrollRef.current) return;

        // Recursively find the target comment and collect all parent IDs along the path
        const findPath = (nodes) => {
            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];
                const nid = n?.id != null ? String(n.id) : '';
                if (nid === targetId) {
                    return { found: true, parentIds: [], rootIndex: i };
                }
                const kids = Array.isArray(n?.replies) ? n.replies : [];
                if (kids.length) {
                    const sub = findPath(kids);
                    if (sub?.found) {
                        return {
                            ...sub,
                            parentIds: [nid, ...(sub.parentIds || [])].filter(Boolean),
                        };
                    }
                }
            }
            return null;
        };

        // Search top-level threads
        let rootIndex = -1;
        let parentIds = [];
        for (let i = 0; i < displayComments.length; i++) {
            const root = displayComments[i];
            const rootId = root?.id != null ? String(root.id) : '';
            if (rootId === targetId) {
                rootIndex = i;
                parentIds = [];
                break;
            }
            const res = findPath(Array.isArray(root?.replies) ? root.replies : []);
            if (res?.found) {
                rootIndex = i;
                parentIds = [rootId, ...(res.parentIds || [])].filter(Boolean);
                break;
            }
        }

        // Ensure the root thread is within the visible window
        if (rootIndex >= 0 && visibleCount < rootIndex + 1) {
            setVisibleCount(rootIndex + 1);
            return; // effect re-runs after visibleCount updates
        }

        // Expand all ancestor threads so the target comment is rendered
        if (parentIds.length) {
            setExpanded((prev) => {
                const next = { ...(prev || {}) };
                parentIds.forEach((pid) => { next[pid] = true; });
                return next;
            });
        }

        // Attempt to scroll to and highlight the target after the DOM updates
        const attemptScroll = (triesLeft) => {
            const el = document.getElementById(`comment-${targetId}`) ||
                document.querySelector(`[data-comment-id="${targetId}"]`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setHighlightedCommentId(targetId);
                if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
                highlightTimerRef.current = setTimeout(() => {
                    setHighlightedCommentId(null);
                    highlightTimerRef.current = 0;
                }, 6500);
                autoScrollRef.current = true;
                return;
            }
            if (triesLeft > 0) {
                requestAnimationFrame(() => attemptScroll(triesLeft - 1));
            } else {
                autoScrollRef.current = true;
            }
        };

        requestAnimationFrame(() => requestAnimationFrame(() => attemptScroll(8)));
    }, [scrollToCommentId, loading, displayComments, visibleCount]);

    const likeComment = async (commentId, currentlyLiked) => {
        if (!viewerId || !postId) return;

        const isLikerPostAuthor = canPinComment;

        // Optimistic update helper — updates like data without changing order
        const updateNode = function updateNode(n) {
            if (String(n.id) === String(commentId)) {
                const nextLiked = !n.viewer_liked;
                return {
                    ...n,
                    viewer_liked: nextLiked,
                    likes: Math.max(0, n.likes + (nextLiked ? 1 : -1)),
                    ...(isLikerPostAuthor ? { liked_by_author: nextLiked } : {}),
                };
            }
            if (n.replies?.length) {
                return { ...n, replies: n.replies.map(updateNode) };
            }
            return n;
        };

        // Update both comments and displayComments (same order preserved)
        setComments((prev) => prev.map(updateNode));
        setDisplayComments((prev) => prev.map(updateNode));

        try {
            const res = await secureFetch(
                `/api/business/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/like`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(getAccountPayloadRef.current()),
                }
            );
            if (res.ok) {
                const data = await res.json().catch(() => null);
                if (data) {
                    const serverLiked = Boolean(data.viewerLiked ?? data.liked);
                    const serverLikes = Number(data.likesCount ?? data.likes ?? 0) || 0;
                    const reconcile = function reconcile(n) {
                        if (String(n.id) === String(commentId)) {
                            return { ...n, viewer_liked: serverLiked, likes: serverLikes, ...(data.liked_by_author !== undefined ? { liked_by_author: Boolean(data.liked_by_author) } : isLikerPostAuthor ? { liked_by_author: serverLiked } : {}) };
                        }
                        if (n.replies?.length) {
                            return { ...n, replies: n.replies.map(reconcile) };
                        }
                        return n;
                    };
                    setComments((prev) => prev.map(reconcile));
                    setDisplayComments((prev) => prev.map(reconcile));
                }
            } else {
                fetchComments();
            }
        } catch {
            fetchComments();
        }
    };

    const submitReply = async (parentId, text, { files: replyFileList = [], imageUrls: replyUrlList = [] } = {}) => {
        if (!postId || !viewerId) return;

        // Rate limit check
        const rlResult = checkCommentLimit();
        if (!rlResult.allowed) {
            setCommentRateLimitInfo({ retryAfterSec: rlResult.retryAfterSec, reason: rlResult.reason });
            setCommentRateLimitOpen(true);
            return;
        }

        // Read active account from localStorage (matches PostPage reply pattern)
        const freshAcct = (() => {
            try {
                const raw = localStorage.getItem('ll:activeAccount');
                if (!raw) return null;
                return JSON.parse(raw);
            } catch { return null; }
        })();
        const freshType = String(freshAcct?.type || '').toLowerCase();
        const freshIsBiz = freshType === 'business' && freshAcct?.id;
        const freshIsArt = freshType === 'artist' && freshAcct?.id;
        const freshAvatarUrl = freshIsBiz
            ? (freshAcct.avatar_url || freshAcct.logo_url || csActiveAccount?.avatar_url || csActiveAccount?.avatarUrl || csActiveAccount?.logo_url || csActiveAccount?.logoUrl || csFetchedAvatar || '')
            : freshIsArt
                ? (freshAcct.avatar_url || csActiveAccount?.avatar_url || csActiveAccount?.avatarUrl || csFetchedAvatar || '')
                : '';

        const replyPayload = {
            content: text,
            text,
            parent_id: parentId,
            ...getCommentPayloadRef.current(),
            ...(replyUrlList.length > 0 ? { image_urls: replyUrlList } : {}),
            ...(freshIsBiz ? {
                business_id: freshAcct.id,
                account_type: 'business',
                account_id: freshAcct.id,
                account_handle: freshAcct.slug || freshAcct.handle || '',
                account_name: freshAcct.name || '',
                account_avatar_url: freshAvatarUrl,
            } : {}),
            ...(freshIsArt ? {
                artist_id: freshAcct.id,
                account_type: 'artist',
                account_id: freshAcct.id,
                account_handle: freshAcct.handle || '',
                account_name: freshAcct.name || '',
                account_avatar_url: freshAvatarUrl,
            } : {}),
        };

        const acctHeaders = (() => { try { return getStaticAccountHeaders(); } catch { return {}; } })();

        try {
            let res;

            // Upload local image files to GCS first (deferred from selection time)
            let allReplyImageUrls = [...replyUrlList];
            if (replyFileList.length > 0) {
                try {
                    const uploadedUrls = await uploadFilesToGCS(replyFileList);
                    if (uploadedUrls.length === 0) {
                        return;
                    }
                    allReplyImageUrls = [...uploadedUrls, ...allReplyImageUrls];
                } catch {
                    return;
                }
            }

            // Merge uploaded URLs into payload
            if (allReplyImageUrls.length > 0) {
                replyPayload.image_urls = allReplyImageUrls;
            }

            res = await secureFetch(
                `/api/business/posts/${encodeURIComponent(postId)}/comments`,
                { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', ...acctHeaders }, body: JSON.stringify(replyPayload) }
            );
            if (res.ok) {
                recordComment();
                fetchComments();
            }
        } catch {
            // ignore
        }
    };

    const openFlag = (commentId) => setFlagState({ open: true, commentId });
    const closeFlag = () => setFlagState({ open: false, commentId: null });

    const submitFlag = async ({ reason, details }) => {
        const commentId = flagState.commentId;
        if (!commentId || !postId) return closeFlag();

        // Optimistically set viewer_flagged
        setComments((prev) => updateCommentInTree(prev, commentId, (c) => ({ ...c, viewer_flagged: true })));
        setDisplayComments((prev) => updateCommentInTree(prev, commentId, (c) => ({ ...c, viewer_flagged: true })));

        const urls = [
            `/api/business/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/flag`,
            `/api/community/comments/${encodeURIComponent(commentId)}/flag`,
            `/api/comments/${encodeURIComponent(commentId)}/flag`,
        ];
        let success = false;
        for (const url of urls) {
            try {
                const res = await secureFetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason, details }),
                });
                if (res.ok) {
                    success = true;
                    break;
                }
            } catch {
                /* try next */
            }
        }

        // Revert on failure
        if (!success) {
            setComments((prev) => updateCommentInTree(prev, commentId, (c) => ({ ...c, viewer_flagged: false })));
            setDisplayComments((prev) => updateCommentInTree(prev, commentId, (c) => ({ ...c, viewer_flagged: false })));
            closeFlag();
        }
        // Don't close on success — FlagCommentDialog shows confirmation; user clicks Done to close.
    };

    const requestDelete = (commentId, isReply) => setDeleteConfirm({ open: true, commentId, isReply });
    const closeDeleteConfirm = () => setDeleteConfirm({ open: false, commentId: null, isReply: false });

    const confirmDelete = async () => {
        const commentId = deleteConfirm.commentId;
        const wasReply = deleteConfirm.isReply;
        if (!commentId || !postId) return closeDeleteConfirm();

        try {
            await secureFetch(
                `/api/business/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
                {
                    method: 'DELETE',
                    credentials: 'include',
                }
            );
            fetchComments();
            showCommentSuccess(wasReply ? 'Reply deleted successfully' : 'Comment deleted successfully');
        } catch {
            // ignore
        }
        closeDeleteConfirm();
    };

    const requestTogglePin = async (commentId, isPinned) => {
        if (!commentId || !postId) return;
        const action = isPinned ? 'unpin' : 'pin';
        try {
            await secureFetch(
                `/api/business/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/${action}`,
                {
                    method: 'POST',
                    credentials: 'include',
                }
            );
            fetchComments();
        } catch {
            // ignore
        }
    };

    const visibleComments = displayComments.slice(0, visibleCount);
    const canLoadMore = displayComments.length > visibleComments.length;

    return (
        <>
            <Box id="comments-anchor" sx={{ mt: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="h6" sx={(t) => t.custom.postDetail.commentsHeading}>
                        Comments
                    </Typography>
                    {displayComments.length > 1 && (
                        <Stack direction="row" spacing={0.5}>
                            {[
                                { value: 'newest', label: 'Newest' },
                                { value: 'popular', label: 'Popular' },
                            ].map((opt) => (
                                <Chip
                                    key={opt.value}
                                    label={opt.label}
                                    size="small"
                                    variant={commentSort === opt.value ? 'filled' : 'outlined'}
                                    color={commentSort === opt.value ? 'primary' : 'default'}
                                    onClick={() => setCommentSort(opt.value)}
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: '0.72rem',
                                        cursor: 'pointer',
                                        borderRadius: 999,
                                    }}
                                />
                            ))}
                        </Stack>
                    )}
                </Stack>

                <Box sx={{ overflowX: 'auto', overflowY: 'visible', pb: 1, px: { xs: 1, sm: 1.25 } }}>
                    <Box sx={{ minWidth: '100%' }}>
                        {loading ? (
                            <PulsingDots size={8} gap={1} sx={{ py: 4 }} />
                        ) : visibleComments.length > 0 ? (
                            <>
                                {visibleComments.map((t) => (
                                    <Box key={t.id} sx={newCommentIds.has(String(t.id)) ? NEW_COMMENT_FADE_SX : undefined}>
                                        <ThreadedCommentItem
                                            node={t}
                                            depth={0}
                                            expanded={expanded}
                                            setExpanded={setExpanded}
                                            viewerAvatarUrl={viewerAvatar}
                                            viewerLabel={viewerLabel}
                                            viewerId={viewerId}
                                            viewerAccountType={viewerAccountType}
                                            viewerProfileType={viewerProfileType}
                                            postAuthorId={postAuthorId}
                                            likeComment={likeComment}
                                            submitReply={submitReply}
                                            openFlag={openFlag}
                                            onRequestDelete={requestDelete}
                                            onRequestTogglePin={requestTogglePin}
                                            canPinComment={canPinComment}
                                            blockedUserIds={blockedUserIds}
                                            blockedHandles={blockedHandles}
                                            highlightedCommentId={highlightedCommentId}
                                            onShareComment={handleShareComment}
                                            onOpenUserCard={handleOpenCommentUserCard}
                                            postId={postId} businessSlug={businessSlug} onCopyLinkToast={onCopyLinkToast}
                                        />
                                    </Box>
                                ))}
                                {canLoadMore && (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                                        <Link
                                            component="button"
                                            type="button"
                                            underline="hover"
                                            onClick={() => setVisibleCount((c) => Math.min(c + COMMENTS_LOAD_MORE, displayComments.length))}
                                            sx={{ fontWeight: 700 }}
                                        >
                                            Load more comments
                                        </Link>
                                    </Box>
                                )}
                            </>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                                <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                                    No comments yet. Be the first!
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>

                <FlagCommentDialog open={flagState.open} onClose={closeFlag} onSubmit={submitFlag} />
            </Box>

            {/* Delete confirmation */}
            <Dialog
                open={deleteConfirm.open}
                onClose={(e, r) => {
                    if (r === 'backdropClick' || r === 'escapeKeyDown') return;
                    closeDeleteConfirm();
                }}
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ pr: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        Delete {deleteConfirm.isReply ? 'reply' : 'comment'}?
                    </Typography>
                    <IconButton
                        aria-label="Close"
                        onClick={closeDeleteConfirm}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 2, py: 1.5 }}>
                    <Button onClick={closeDeleteConfirm} variant="outlined">
                        Cancel
                    </Button>
                    <Button onClick={confirmDelete} variant="contained" color="error">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Share Comment dialog */}
            <ShareDialog
                contentType="comment"
                open={shareCommentDialogOpen}
                onClose={() => {
                    setShareCommentDialogOpen(false);
                    setShareCommentTarget(null);
                }}
                comment={shareCommentTarget}
                post={{ id: postId, businessSlug }}
                postSlug={businessSlug}
                viewer={viewer}
            />

            {/* Comment-author UserCardPopover */}
            <UserCardPopover
                anchorEl={commentUserAnchor}
                onClose={() => setCommentUserAnchor(null)}
                user={commentUserForCard}
                onViewProfile={(u) => {
                    const slug = u?.handle || u?.business_slug || u?.artist_handle || u?.account_handle;
                    if (slug) window.location.assign(`/${slug}`);
                    else if (u?.id) window.location.assign(`/${u.id}`);
                }}
            />

            <SuccessSnackbar {...commentSnackbarProps} />

            {/* Rate limit dialog for replies */}
            <RateLimitDialog
                open={commentRateLimitOpen}
                onClose={() => setCommentRateLimitOpen(false)}
                retryAfterSec={commentRateLimitInfo.retryAfterSec}
                reason={commentRateLimitInfo.reason}
                actionLabel="comments"
            />
        </>
    );
}

// ============================
// Carousel Component
// ============================
function Carousel({ photos }) {
    const [index, setIndex] = useState(0);
    const touchStartRef = useRef(null);

    useEffect(() => {
        if (!Array.isArray(photos) || photos.length === 0) return;
        if (index > photos.length - 1) setIndex(0);
    }, [photos, index]);

    const prev = useCallback(() => setIndex((i) => (i - 1 + photos.length) % photos.length), [photos.length]);
    const next = useCallback(() => setIndex((i) => (i + 1) % photos.length), [photos.length]);

    const current = photos[index] || photos[0];
    const multiPhoto = photos.length > 1;

    const handleTouchStart = (e) => { touchStartRef.current = e.touches[0]?.clientX ?? null; };
    const handleTouchEnd = (e) => {
        if (touchStartRef.current == null) return;
        const diff = touchStartRef.current - (e.changedTouches[0]?.clientX ?? touchStartRef.current);
        if (Math.abs(diff) > 50) { if (diff > 0) next(); else prev(); }
        touchStartRef.current = null;
    };

    return (
        <Box sx={{ position: 'relative', mt: 2, userSelect: 'none' }}>
            {/* Main image container with blurred backdrop */}
            <Box
                onTouchStart={multiPhoto ? handleTouchStart : undefined}
                onTouchEnd={multiPhoto ? handleTouchEnd : undefined}
                sx={{
                    width: '100%',
                    height: { xs: 280, sm: 440 },
                    borderRadius: 2.5,
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                {/* Blurred background fill */}
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url(${current})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(30px) saturate(1.4)',
                        transform: 'scale(1.2)',
                        opacity: 0.45,
                    }}
                />
                <Box sx={{ position: 'absolute', inset: 0, bgcolor: (t) => alphaColor(t.palette.common.black, 0.06) }} />
                {/* Main image */}
                <Box
                    component="img"
                    key={current}
                    src={current}
                    alt={`Photo ${index + 1} of ${photos.length}`}
                    loading="lazy"
                    sx={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        display: 'block',
                        zIndex: 1,
                    }}
                />

                {/* Overlay prev/next arrows */}
                {multiPhoto && (
                    <>
                        <IconButton
                            aria-label="Previous image"
                            onClick={prev}
                            sx={{
                                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
                                bgcolor: (t) => alphaColor(t.palette.common.white, 0.85), backdropFilter: 'blur(6px)',
                                boxShadow: (t) => t.custom.shadows.xs, width: { xs: 44, sm: 36 }, height: { xs: 44, sm: 36 },
                                '&:hover': { bgcolor: (t) => alphaColor(t.palette.common.white, 0.95) },
                            }}
                        >
                            <ChevronLeftIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                        <IconButton
                            aria-label="Next image"
                            onClick={next}
                            sx={{
                                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
                                bgcolor: (t) => alphaColor(t.palette.common.white, 0.85), backdropFilter: 'blur(6px)',
                                boxShadow: (t) => t.custom.shadows.xs, width: { xs: 44, sm: 36 }, height: { xs: 44, sm: 36 },
                                '&:hover': { bgcolor: (t) => alphaColor(t.palette.common.white, 0.95) },
                            }}
                        >
                            <ChevronRightIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                    </>
                )}

                {/* Counter badge top-right */}
                {multiPhoto && (
                    <Box
                        sx={{
                            position: 'absolute', top: 10, right: 10, zIndex: 2,
                            bgcolor: (t) => alphaColor(t.palette.common.black, 0.55), backdropFilter: 'blur(6px)', color: 'common.white',
                            px: 1.25, py: 0.25, borderRadius: 999, fontSize: 12, fontWeight: 800,
                        }}
                    >
                        {index + 1} / {photos.length}
                    </Box>
                )}

                {/* Dot indicators */}
                {multiPhoto && photos.length <= 8 && (
                    <Box
                        sx={{
                            position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
                            zIndex: 2, display: 'flex', gap: 0.75,
                        }}
                    >
                        {photos.map((_, i) => (
                            <Box
                                key={i}
                                onClick={() => setIndex(i)}
                                sx={{
                                    width: i === index ? 18 : 7, height: 7, borderRadius: 999,
                                    bgcolor: (t) => i === index ? t.palette.common.white : alphaColor(t.palette.common.white, 0.5),
                                    transition: (t) => `all ${t.custom.motion.slow}ms ${t.custom.motion.ease}`, cursor: 'pointer',
                                    boxShadow: (t) => t.custom.shadows.xs,
                                }}
                            />
                        ))}
                    </Box>
                )}
            </Box>

            {/* Thumbnails strip (3+ photos) */}
            {multiPhoto && photos.length >= 3 && (
                <Box
                    sx={{
                        mt: 1, display: 'flex', justifyContent: 'center', gap: 0.75,
                        overflowX: 'auto', pb: 0.5, WebkitOverflowScrolling: 'touch',
                        '&::-webkit-scrollbar': { height: 4 },
                        '&::-webkit-scrollbar-thumb': { borderRadius: 999, bgcolor: (t) => alphaColor(t.palette.common.black, 0.15) },
                    }}
                >
                    {photos.map((u, i) => {
                        const active = i === index;
                        return (
                            <Box
                                key={`${u}-${i}`}
                                component="img"
                                src={u}
                                alt=""
                                loading="lazy"
                                onClick={() => setIndex(i)}
                                sx={{
                                    width: { xs: 52, sm: 60 },
                                    height: { xs: 52, sm: 60 },
                                    objectFit: 'cover', borderRadius: 1.5, cursor: 'pointer', flex: '0 0 auto',
                                    border: '2px solid', borderColor: active ? 'primary.main' : 'transparent',
                                    opacity: active ? 1 : 0.65, transition: (t) => `all ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                                    '&:hover': { opacity: 1 },
                                }}
                            />
                        );
                    })}
                </Box>
            )}
        </Box>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Business Post Edit History Dialog (matches EventPostPage timeline style)
   ═══════════════════════════════════════════════════════════════════════════ */

function formatBPHistoryDate(raw) {
    if (!raw) return '';
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(d);
}

function buildBPDiffs(prevSnap, snap) {
    const items = [];
    const s = (v) => (v == null ? '' : String(v).trim());
    if (s(snap.title) !== s(prevSnap.title)) items.push({ label: 'Title', from: s(prevSnap.title) || '(empty)', to: s(snap.title) || '(empty)' });
    if (s(snap.body) !== s(prevSnap.body) || s(snap.description) !== s(prevSnap.description)) items.push({ label: 'Content', changed: true });
    if (s(snap.post_type) !== s(prevSnap.post_type)) items.push({ label: 'Post type', from: s(prevSnap.post_type) || '(none)', to: s(snap.post_type) || '(none)' });
    if (s(snap.city) !== s(prevSnap.city)) items.push({ label: 'City', from: s(prevSnap.city) || '(none)', to: s(snap.city) || '(none)' });
    if (s(snap.county) !== s(prevSnap.county)) items.push({ label: 'County', from: s(prevSnap.county) || '(none)', to: s(snap.county) || '(none)' });
    if (s(snap.address) !== s(prevSnap.address)) items.push({ label: 'Address', from: s(prevSnap.address) || '(none)', to: s(snap.address) || '(none)' });

    const prevPhotos = Array.isArray(prevSnap.photos) ? prevSnap.photos : [];
    const curPhotos = Array.isArray(snap.photos) ? snap.photos : [];
    const prevSet = new Set(prevPhotos);
    const curSet = new Set(curPhotos);
    const added = curPhotos.filter((u) => !prevSet.has(u));
    const removed = prevPhotos.filter((u) => !curSet.has(u));
    if (added.length > 0 || removed.length > 0 || prevPhotos.length !== curPhotos.length) {
        const parts = [];
        if (added.length) parts.push(`${added.length} added`);
        if (removed.length) parts.push(`${removed.length} removed`);
        if (!parts.length && prevPhotos.length !== curPhotos.length) parts.push('reordered');
        items.push({ label: 'Photos', changed: true, detail: parts.join(', '), photoAdded: added, photoRemoved: removed });
    }
    return items;
}

function BPDiffChip({ label, from, to, changed, detail, photoAdded, photoRemoved }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, py: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Chip label={label} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, borderRadius: 1.5, bgcolor: (t) => alphaColor(t.palette.primary.main, 0.08), color: 'primary.dark', border: 'none', flexShrink: 0, mt: 0.1, '& .MuiChip-label': { px: 1 } }} />
                {changed ? (
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.5, pt: 0.15 }}>{detail || 'Updated'}</Typography>
                ) : (
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.5, pt: 0.15, minWidth: 0, wordBreak: 'break-word' }}>
                        <Box component="span" sx={{ textDecoration: 'line-through', opacity: 0.55 }}>{from}</Box>
                        <Box component="span" sx={{ mx: 0.5, color: 'text.disabled' }}>→</Box>
                        <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{to}</Box>
                    </Typography>
                )}
            </Box>
            {(photoAdded?.length > 0 || photoRemoved?.length > 0) && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, pl: 0.5, mt: 0.5 }}>
                    {(photoRemoved || []).slice(0, 4).map((url, i) => (
                        <Box key={`rm-${i}`} sx={{ position: 'relative', width: 52, height: 52, borderRadius: 1.5, overflow: 'hidden', border: '2px solid', borderColor: 'error.main', opacity: 0.6 }}>
                            <Box component="img" src={url} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.35)' }}>
                                <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: 16, lineHeight: 1 }}>−</Typography>
                            </Box>
                        </Box>
                    ))}
                    {(photoAdded || []).slice(0, 4).map((url, i) => (
                        <Box key={`add-${i}`} sx={{ position: 'relative', width: 52, height: 52, borderRadius: 1.5, overflow: 'hidden', border: '2px solid', borderColor: 'success.main' }}>
                            <Box component="img" src={url} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.2)' }}>
                                <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: 16, lineHeight: 1 }}>+</Typography>
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}

function BusinessPostEditHistoryDialog({ open, onClose, rows, loading, error }) {
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { position: 'relative' } }} onClick={(e) => e.stopPropagation()}>
            <DialogTitle sx={{ pr: 7, fontWeight: 800, fontSize: 18 }}>
                Edit History
                <IconButton aria-label="Close" onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ minHeight: 120, px: { xs: 2, sm: 3 } }}>
                {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>}
                {!loading && error && <Typography color="error" sx={{ py: 2, textAlign: 'center' }}>{error}</Typography>}
                {!loading && !error && rows.length === 0 && <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center', fontSize: 14 }}>This post was edited, but detailed version history is not available for edits made before history tracking was enabled.</Typography>}
                {!loading && !error && rows.length > 0 && (
                    <Box sx={{ position: 'relative', pl: 2.5 }}>
                        <Box sx={{ position: 'absolute', left: 5, top: 10, bottom: 10, width: 2, bgcolor: (t) => alphaColor(t.palette.primary.main, 0.12), borderRadius: 1 }} />
                        {rows.map((row, idx) => {
                            const snap = row.snapshot || {};
                            const prevSnap = rows[idx + 1]?.snapshot || {};
                            const isOriginal = idx === rows.length - 1 && (row.version === 1 || idx === rows.length - 1);
                            const isLatest = idx === 0;
                            const diffItems = !isOriginal ? buildBPDiffs(prevSnap, snap) : [];
                            return (
                                <Box key={row.id || idx} sx={{ position: 'relative', pb: idx < rows.length - 1 ? 2.5 : 0 }}>
                                    <Box sx={{ position: 'absolute', left: -20, top: 4, width: 12, height: 12, borderRadius: '50%', bgcolor: isOriginal ? 'grey.400' : isLatest ? 'secondary.main' : 'primary.main', border: '2px solid', borderColor: 'background.paper', boxShadow: (t) => `0 0 0 2px ${alphaColor(isOriginal ? t.palette.grey[400] : isLatest ? t.palette.secondary.main : t.palette.primary.main, 0.2)}`, zIndex: 1 }} />
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                                        <Typography sx={{ fontWeight: 800, fontSize: 13, color: isOriginal ? 'text.secondary' : 'text.primary' }}>{isOriginal ? 'Original' : isLatest ? 'Latest edit' : `Version ${row.version || rows.length - idx}`}</Typography>
                                        <Typography sx={{ fontSize: 11, color: 'text.disabled', fontWeight: 500 }}>{formatBPHistoryDate(row.edited_at)}</Typography>
                                    </Stack>
                                    {!isOriginal && diffItems.length > 0 && (
                                        <Box sx={{ bgcolor: (t) => alphaColor(t.palette.primary.main, 0.025), border: '1px solid', borderColor: (t) => alphaColor(t.palette.primary.main, 0.08), borderRadius: 2, px: 1.5, py: 1 }}>
                                            {diffItems.map((item, i) => <BPDiffChip key={i} {...item} />)}
                                        </Box>
                                    )}
                                    {!isOriginal && diffItems.length === 0 && <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic', pl: 0.5 }}>Post details updated</Typography>}
                                    {isOriginal && (
                                        <Box sx={{ bgcolor: (t) => alphaColor(t.palette.grey[500], 0.04), border: '1px solid', borderColor: (t) => alphaColor(t.palette.grey[500], 0.08), borderRadius: 2, px: 1.5, py: 1 }}>
                                            {snap.title && <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.primary', mb: 0.25 }}>{snap.title}</Typography>}
                                            <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.4 }}>{snap.post_type || 'Original post created'}</Typography>
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 1.5 }}><Button onClick={onClose} sx={{ fontWeight: 700 }}>Close</Button></DialogActions>
        </Dialog>
    );
}

// ============================
// Main Page Component
// ============================
export default function BusinessPostPage({ user }) {
    const { businessSlug, postId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    // Support ?comment=ID deep links (from copy-link and share dialogs)
    const _urlCommentId = useMemo(() => {
        try {
            const sp = new URLSearchParams(location?.search || '');
            return sp.get('comment') || null;
        } catch { return null; }
    }, [location?.search]);
    const bppTheme = useTheme();
    const bppMobile = useMediaQuery(bppTheme.breakpoints.down('sm'));
    const chromeTop = useChromeTop();

    // ── Page fade-in on mount (matches EventPostPage) ──
    // Start invisible and translated down slightly, then flip to visible on
    // the next frame so the initial paint happens with opacity:0 and the
    // transition animates to opacity:1. Note: the swipe-to-close handler
    // below writes `transform` directly to bppPageRef.current.style — once
    // the user starts swiping, that inline style wins, which is fine
    // because the fade has already finished by then (350ms).
    const [pageVisible, setPageVisible] = useState(false);
    useEffect(() => {
        const raf = requestAnimationFrame(() => setPageVisible(true));
        return () => cancelAnimationFrame(raf);
    }, []);
    const fadeSx = {
        opacity: pageVisible ? 1 : 0,
        transform: pageVisible ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 350ms ease, transform 350ms ease',
    };

    // ── Swipe-right-to-close gesture for mobile ──
    const bppSwipeRef = useRef({ startX: 0, startY: 0, currentX: 0, swiping: false, startTime: 0 });
    const bppPageRef = useRef(null);

    const handleBppTouchStart = useCallback((e) => {
        const touch = e.touches[0];
        bppSwipeRef.current = {
            startX: touch.clientX,
            startY: touch.clientY,
            currentX: touch.clientX,
            swiping: false,
            startTime: Date.now(),
        };
    }, []);

    const handleBppTouchMove = useCallback((e) => {
        const sw = bppSwipeRef.current;
        const touch = e.touches[0];
        const dx = touch.clientX - sw.startX;
        const dy = touch.clientY - sw.startY;

        if (!sw.swiping) {
            if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5 && dx > 0) {
                sw.swiping = true;
            } else if (Math.abs(dy) > 10) {
                return;
            }
        }

        if (!sw.swiping) return;
        e.preventDefault();

        sw.currentX = touch.clientX;
        const translateX = Math.max(0, dx);
        const el = bppPageRef.current;
        if (el) {
            el.style.transition = 'none';
            el.style.transform = `translateX(${translateX}px)`;
        }
    }, []);

    const handleBppTouchEnd = useCallback(() => {
        const sw = bppSwipeRef.current;
        if (!sw.swiping) return;

        const dx = sw.currentX - sw.startX;
        const elapsed = Date.now() - sw.startTime;
        const velocity = dx / Math.max(elapsed, 1);
        const screenW = window.innerWidth;

        const el = bppPageRef.current;
        if (el) {
            el.style.transition = 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)';
        }

        if (dx > screenW * 0.3 || velocity > 0.5) {
            if (el) el.style.transform = 'translateX(100%)';
            setTimeout(() => {
                navigate(-1);
            }, 320);
        } else {
            if (el) el.style.transform = 'translateX(0)';
        }

        sw.swiping = false;
    }, [navigate]);
    const {
        accountCacheKey,
        getAccountParams,
        getCommentPayload,
        isBusinessAccount,
        isArtistAccount,
        activeBusinessId,
        activeArtistId,
        activeAccount,
    } = useActiveAccount();
    const isNonPersonal = isBusinessAccount || isArtistAccount;

    // ── Post-level success confirmation snackbar ──
    const { showSuccess: showPostSuccess, snackbarProps: postSnackbarProps } = useSuccessSnackbar();

    // Stabilize account functions via refs — prevents reloadPost from being
    // recreated every render (avoids infinite useEffect loop)
    const getAccountParamsPageRef = useRef(getAccountParams);
    getAccountParamsPageRef.current = getAccountParams;
    const getCommentPayloadPageRef = useRef(getCommentPayload);
    getCommentPayloadPageRef.current = getCommentPayload;

    const [post, setPost] = useState(location.state?.post || null);
    const [business, setBusiness] = useState(location.state?.business || null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ── Blocked / hidden post gate ──
    const gate = useBlockedPostGate({ post, user, contentType: 'post' });

    const [commentText, setCommentText] = useState('');
    const [posting, setPosting] = useState(false);
    const [commentFiles, setCommentFiles] = useState([]);
    const [commentImageUrls, setCommentImageUrls] = useState([]);
    const [commentError, setCommentError] = useState('');
    const [commentRefreshKey, setCommentRefreshKey] = useState(0);

    // Rate limiting for comments & replies
    const { checkLimit: checkCommentLimit, recordAction: recordComment } = useRateLimit('comment', { burstMax: 3, burstWindowMs: 10_000, maxPerHour: 60 });
    const [commentRateLimitOpen, setCommentRateLimitOpen] = useState(false);
    const [commentRateLimitInfo, setCommentRateLimitInfo] = useState({ retryAfterSec: 10, reason: 'cooldown' });
    const addCommentRef = useRef(null);
    const [scrolled, setScrolled] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);
    const [bodyExpanded, setBodyExpanded] = useState(false);
    const [userCardAnchor, setUserCardAnchor] = useState(null);

    // ── Edited detection + edit history dialog (matches BusinessPostCard) ──
    const isEdited = Boolean(
        post?.edited_at || post?.editedAt ||
        post?.has_edits || post?.edits_count || post?.editsCount ||
        (post?.updated_at && post?.created_at && String(post.updated_at) !== String(post.created_at))
    );
    const [editHistoryOpen, setEditHistoryOpen] = useState(false);
    const [editHistoryRows, setEditHistoryRows] = useState([]);
    const [editHistoryLoading, setEditHistoryLoading] = useState(false);
    const [editHistoryError, setEditHistoryError] = useState('');

    const openEditHistory = useCallback((e) => {
        if (e) e.stopPropagation();
        const pid = post?.id || post?.postId || postId;
        if (!pid) return;
        setEditHistoryOpen(true);
        setEditHistoryLoading(true);
        setEditHistoryError('');
        setEditHistoryRows([]);
        secureFetch(`/api/business/posts/${encodeURIComponent(pid)}/edits`, {
            credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json' },
        })
            .then((r) => r.ok ? r.json() : Promise.reject(new Error('Failed to load')))
            .then((data) => setEditHistoryRows(Array.isArray(data) ? data : []))
            .catch((err) => setEditHistoryError(err?.message || 'Failed to load edit history.'))
            .finally(() => setEditHistoryLoading(false));
    }, [post, postId]);

    const commentInputRef = useRef(null);

    // ── Comment @mention state ──
    const [cmMentionOpen, setCmMentionOpen] = useState(false);
    const [cmMentionQuery, setCmMentionQuery] = useState("");
    const [cmMentionResults, setCmMentionResults] = useState([]);
    const [cmMentionLoading, setCmMentionLoading] = useState(false);
    const [cmMentionActiveIdx, setCmMentionActiveIdx] = useState(0);
    const [cmMentionAnchorEl, setCmMentionAnchorEl] = useState(null);
    const cmMentionStartRef = useRef(0);
    const cmMentionEndRef = useRef(0);
    const cmAbortRef = useRef(null);

    const closeCmMention = () => { setCmMentionOpen(false); setCmMentionResults([]); setCmMentionQuery(""); setCmMentionActiveIdx(0); };

    // Dismiss comment mention dropdown on scroll
    useEffect(() => {
        if (!cmMentionOpen) return;
        const onScroll = () => closeCmMention();
        window.addEventListener('scroll', onScroll, { passive: true, capture: true });
        return () => window.removeEventListener('scroll', onScroll, { capture: true });
    }, [cmMentionOpen]);

    const insertCmMention = (user) => {
        const handle = user.handle || user.username || "";
        const before = commentText.slice(0, cmMentionStartRef.current);
        const after = commentText.slice(cmMentionEndRef.current);
        const next = before + "@" + handle + " " + after;
        setCommentText(next);
        closeCmMention();
        setTimeout(() => { const el = commentInputRef.current; if (el) { const pos = before.length + handle.length + 2; el.selectionStart = pos; el.selectionEnd = pos; el.focus(); } }, 0);
    };

    useEffect(() => {
        if (!cmMentionOpen || !cmMentionQuery) { setCmMentionResults([]); return; }
        const ctrl = new AbortController();
        cmAbortRef.current?.abort();
        cmAbortRef.current = ctrl;
        const tid = setTimeout(async () => {
            try {
                setCmMentionLoading(true);
                const res = await secureFetch(`/api/community/users/search?q=${encodeURIComponent(cmMentionQuery)}&limit=8`, { credentials: 'include', signal: ctrl.signal });
                if (!ctrl.signal.aborted) { const data = await res.json(); setCmMentionResults(Array.isArray(data) ? data : []); setCmMentionActiveIdx(0); }
            } catch { if (!ctrl.signal.aborted) setCmMentionResults([]); }
            finally { if (!ctrl.signal.aborted) setCmMentionLoading(false); }
        }, 200);
        return () => { clearTimeout(tid); ctrl.abort(); };
    }, [cmMentionOpen, cmMentionQuery]);

    const handleCmChange = (e) => {
        const val = e.target.value.slice(0, COMMENT_MAX_CHARS);
        setCommentText(val);
        const cursor = e.target.selectionStart || 0;
        const match = getMentionMatch(val, cursor);
        if (match) {
            cmMentionStartRef.current = match.start;
            cmMentionEndRef.current = match.end;
            setCmMentionQuery(match.query);
            setCmMentionAnchorEl(commentInputRef.current);
            if (!cmMentionOpen) setCmMentionOpen(true);
        } else { closeCmMention(); }
    };

    const viewer = user?.user || user || null;
    const viewerId = viewer?.id;

    // ── Fetch active account avatar when not in context ──
    // The activeAccount from localStorage may not include avatar_url or
    // profile_type. When either is missing, fetch it from the API so the
    // composer shows the right pic AND the right artist-subtype fallback
    // icon (palette for visual artists vs music-note for musicians).
    const [fetchedAccountAvatar, setFetchedAccountAvatar] = useState('');
    const [fetchedAccountProfileType, setFetchedAccountProfileType] = useState('');

    useEffect(() => {
        // Only fetch for non-personal accounts
        if (!isBusinessAccount && !isArtistAccount) {
            setFetchedAccountAvatar('');
            setFetchedAccountProfileType('');
            return;
        }
        // Short-circuit only for business accounts that already have an avatar
        // (business accounts have no profile_type to resolve).
        // For artist accounts, ALWAYS fetch so we have an authoritative
        // profile_type from the music_artists row — this mirrors the pattern
        // used by ArtistAdminConsole, which is the only reliable way to
        // distinguish musicians from visual artists.
        const ctxAvatar = activeAccount?.avatar_url || activeAccount?.avatarUrl || activeAccount?.logo_url || activeAccount?.logoUrl || '';
        if (isBusinessAccount && ctxAvatar) {
            setFetchedAccountAvatar('');
            setFetchedAccountProfileType('');
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                let url = '';
                if (isBusinessAccount && activeBusinessId) {
                    // Business endpoint uses slug, not numeric ID
                    // Try activeAccount.slug first, then read from localStorage
                    const bizSlug = activeAccount?.slug || activeAccount?.handle || (() => {
                        try {
                            const raw = localStorage.getItem('ll:activeAccount');
                            if (!raw) return '';
                            const parsed = JSON.parse(raw);
                            return parsed?.slug || parsed?.handle || '';
                        } catch { return ''; }
                    })();
                    if (bizSlug) {
                        url = `/api/business/${encodeURIComponent(bizSlug)}`;
                    }
                } else if (isArtistAccount && activeArtistId) {
                    url = `/api/music/artists/${encodeURIComponent(activeArtistId)}`;
                }
                if (!url) return;

                const res = await secureFetch(url, { credentials: 'include', headers: { Accept: 'application/json' } });
                if (!res.ok || cancelled) return;
                const data = await res.json();
                const entity = data?.business || data?.artist || data;
                const avatarUrl = entity?.avatar_url || entity?.avatarUrl || entity?.logo_url || entity?.logoUrl || '';
                const profileType = String(entity?.profile_type || entity?.profileType || '').toLowerCase();
                if (cancelled) return;
                if (avatarUrl) setFetchedAccountAvatar(avatarUrl);
                // For artist accounts, normalize and store the authoritative
                // profile_type from the DB. Default to 'music' when the field
                // is missing (legacy rows) so the music-note fallback holds.
                if (isArtistAccount) {
                    setFetchedAccountProfileType(profileType === 'artist' ? 'artist' : 'music');
                }
                // Patch localStorage so Header and other consumers see the
                // right value on subsequent renders. Overwrite unconditionally
                // so stale values (from before profile_type was persisted)
                // get fixed.
                try {
                    const raw = localStorage.getItem('ll:activeAccount');
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (parsed && typeof parsed === 'object') {
                            let dirty = false;
                            if (avatarUrl && parsed.avatar_url !== avatarUrl) {
                                parsed.avatar_url = avatarUrl;
                                dirty = true;
                            }
                            if (isArtistAccount) {
                                const normalized = profileType === 'artist' ? 'artist' : 'music';
                                if (parsed.profileType !== normalized || parsed.profile_type !== normalized) {
                                    parsed.profile_type = normalized;
                                    parsed.profileType = normalized;
                                    dirty = true;
                                }
                            }
                            if (dirty) localStorage.setItem('ll:activeAccount', JSON.stringify(parsed));
                        }
                    }
                } catch { /* ignore */ }
            } catch { /* ignore */ }
        })();
        return () => { cancelled = true; };
    }, [isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId, activeAccount?.avatar_url, activeAccount?.avatarUrl, activeAccount?.logo_url, activeAccount?.logoUrl]);

    // Display name & avatar for the comment composer — reflects the active account
    const viewerPersonalAvatarRaw = viewer?.avatar_url || viewer?.profile_picture || '';
    const viewerPersonalAvatar = (viewerPersonalAvatarRaw && !viewerPersonalAvatarRaw.includes('default_avatar')) ? viewerPersonalAvatarRaw : '';
    const viewerPersonalLabel = `${viewer?.first_name || ''} ${viewer?.last_name || ''}`.trim() || 'You';
    const viewerAvatar = (() => {
        if (isBusinessAccount || isArtistAccount) {
            if (fetchedAccountAvatar) return fetchedAccountAvatar;
            const candidates = [activeAccount?.avatar_url, activeAccount?.avatarUrl, activeAccount?.logo_url, activeAccount?.logoUrl];
            for (const c of candidates) {
                const s = String(c || '').trim();
                if (s && s !== 'null' && s !== 'undefined' && !s.includes('default_avatar') && !s.includes('default_business') && !s.includes('default_logo')) return s;
            }
            return '';
        }
        return viewerPersonalAvatar;
    })();
    const viewerLabel = (isBusinessAccount || isArtistAccount)
        ? (activeAccount?.name || viewerPersonalLabel)
        : viewerPersonalLabel;

    // Page-level artist sub-type (musician vs visual artist). The fetched
    // value from /api/music/artists/:id (see effect above) is the
    // authoritative source — mirrors the pattern used by ArtistAdminConsole,
    // which always reads profile_type directly from the artist row. Falls
    // back to the active account context, then localStorage, then 'music'.
    const viewerProfileType = (() => {
        if (!isArtistAccount) return 'music';
        // Authoritative: value fetched from the music_artists row itself.
        const fromFetched = String(fetchedAccountProfileType || '').toLowerCase();
        if (fromFetched === 'artist' || fromFetched === 'music') return fromFetched;
        // Fallback #1: active account context (may be stale / missing field).
        const fromCtx = String(activeAccount?.profile_type || activeAccount?.profileType || '').toLowerCase();
        if (fromCtx === 'artist' || fromCtx === 'music') return fromCtx;
        // Fallback #2: localStorage (pre-migration caches).
        try {
            const raw = localStorage.getItem('ll:activeAccount');
            if (raw) {
                const parsed = JSON.parse(raw);
                const stored = String(parsed?.profile_type || parsed?.profileType || '').toLowerCase();
                if (stored === 'artist' || stored === 'music') return stored;
            }
        } catch { /* ignore */ }
        return 'music';
    })();

    // Fetch post data
    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            let lastFetchErr = null;

            // Fetch business by slug
            let biz = null;
            if (businessSlug) {
                const bizUrls = [
                    `/api/business/${encodeURIComponent(businessSlug)}`,
                    `${api}/api/business/${encodeURIComponent(businessSlug)}`,
                ];
                for (const url of bizUrls) {
                    try {
                        const res = await secureFetch(url, { credentials: 'include' });
                        if (res.ok) {
                            const data = await res.json();
                            biz = data?.business || data;
                            if (!cancelled) setBusiness(biz);
                            break;
                        }
                    } catch (err) {
                        lastFetchErr = err;
                    }
                }
            }

            // Fetch post (pass active account for per-account viewerLiked/viewerReposted)
            let fetchedPost = null;
            if (postId) {
                const acctQs = new URLSearchParams(getAccountParamsPageRef.current());
                const qs = acctQs.toString() ? `?${acctQs.toString()}` : '';
                const postUrls = [
                    `/api/business/posts/${encodeURIComponent(postId)}${qs}`,
                    `/api/business-posts/${encodeURIComponent(postId)}${qs}`,
                ];
                for (const url of postUrls) {
                    try {
                        const res = await secureFetch(url, { credentials: 'include' });
                        if (res.ok) {
                            const data = await res.json();
                            fetchedPost = data?.post || data;
                            if (!cancelled) setPost(fetchedPost);
                            lastFetchErr = null;
                            break;
                        }
                    } catch (err) {
                        lastFetchErr = err;
                    }
                }
            }

            if (!cancelled) {
                if (!fetchedPost && !location.state?.post) {
                    setError(lastFetchErr || 'Post not found');
                }
                setLoading(false);
            }
        };

        fetchData();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postId, businessSlug]);

    // Lightweight re-fetch of just the post when active account changes
    // (matches community PostPage.reloadPost pattern)
    const reloadPost = useCallback(async () => {
        if (!postId) return;
        const acctQs = new URLSearchParams(getAccountParamsPageRef.current());
        const qs = acctQs.toString() ? `?${acctQs.toString()}` : '';
        const urls = [
            `/api/business/posts/${encodeURIComponent(postId)}${qs}`,
            `/api/business-posts/${encodeURIComponent(postId)}${qs}`,
        ];
        for (const url of urls) {
            try {
                const res = await secureFetch(url, { credentials: 'include', cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    const freshPost = data?.post || data;
                    if (freshPost && typeof freshPost === 'object') setPost(freshPost);
                    break;
                }
            } catch {
                // try next
            }
        }
    }, [postId]);

    // Re-fetch post + comments when the active account changes
    const prevPageAcctRef = useRef(accountCacheKey);
    useEffect(() => {
        const prev = prevPageAcctRef.current;
        prevPageAcctRef.current = accountCacheKey;
        if (prev !== accountCacheKey) {
            reloadPost();
            setCommentRefreshKey((k) => k + 1);
        }
    }, [accountCacheKey, reloadPost]);

    // Scroll listener
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Scroll to top when navigating to a new post
    useEffect(() => {
        // Multiple approaches to ensure scroll to top works
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, [postId]);

    const cameFromHub = location.state?.from === 'businessHub';
    const cameFromProfile = location.state?.from === 'business';
    const cameFromShare = Boolean(location.state?.fromShareDialog);
    const cameFromMap = location.state?.from === 'businessMap';

    // "Return to [name]'s profile" support (when navigating from UserProfilePage)
    const fromUserProfile = Boolean(location.state?.fromProfile);
    const fromNotifications = Boolean(location.state?.fromNotifications);
    const backProfileName = location.state?.backProfileName || '';
    const backProfileHandle = location.state?.backProfileHandle || '';
    const backProfileId = location.state?.backProfileId || '';
    const backToProfileUrl =
        location.state?.backToProfileUrl ||
        (backProfileHandle ? `/${backProfileHandle}` : backProfileId ? `/${backProfileId}` : '');

    // "Back to {business}'s profile" support (when navigating from BusinessPublicPage engagement tabs)
    const fromBusinessProfile = Boolean(location.state?.fromBusiness);
    const backBusinessName = location.state?.backBusinessName || '';
    const backBusinessSlug = location.state?.backBusinessSlug || '';

    const handleReturn = () => {
        if (fromUserProfile) {
            // Set restore flags so UserProfilePage restores scroll + tab state
            try {
                const rawKey = backProfileHandle || backProfileId;
                const norm = String(rawKey || '').replace(/^@/, '').trim();
                const candidates = [rawKey, norm, norm ? `@${norm}` : ''].filter(Boolean);
                candidates.forEach((k) => {
                    sessionStorage.setItem(`ll:profile:${k}:restore`, '1');
                });
            } catch { /* ignore */ }

            if (window.history.length > 1) {
                navigate(-1);
                return;
            }
            if (backToProfileUrl) {
                navigate(backToProfileUrl, { state: { restoreProfile: true, fromPostPage: true } });
            } else {
                navigate('/', { state: { restoreProfile: true, fromPostPage: true } });
            }
            return;
        }
        // Return to business public page with scroll restoration
        if (fromBusinessProfile && backBusinessSlug) {
            if (window.history.length > 1) {
                navigate(-1);
                return;
            }
            navigate(`/${backBusinessSlug}`, { state: { fromPostPage: true } });
            return;
        }
        if (cameFromHub || cameFromProfile || cameFromMap) {
            navigate(-1);
        } else if (businessSlug) {
            navigate(`/${businessSlug}`);
        } else {
            navigate('/business');
        }
    };

    const submitComment = async () => {
        const hasImages = commentFiles.length > 0 || commentImageUrls.length > 0;
        if (!postId || (!commentText.trim() && !hasImages)) return;

        const cleaned = commentText.trim();

        // Client-side profanity check
        if (cleaned) {
            const profResult = checkProfanity(cleaned);
            if (!profResult.clean) {
                setCommentError('Your comment contains inappropriate language. Please revise and try again.');
                return;
            }
        }

        // Client-side image moderation check (scan each file before uploading)
        if (commentFiles.length > 0) {
            for (const file of commentFiles) {
                const result = await scanImageFile(file);
                if (!result.safe) {
                    setCommentError(result.message);
                    return;
                }
            }
        }

        setCommentError('');

        // Rate limit check
        const rlResult = checkCommentLimit();
        if (!rlResult.allowed) {
            setCommentRateLimitInfo({ retryAfterSec: rlResult.retryAfterSec, reason: rlResult.reason });
            setCommentRateLimitOpen(true);
            return;
        }

        setPosting(true);

        // Read active account from localStorage to avoid stale closure values (matches PostPage)
        const freshAcct = (() => {
            try {
                const raw = localStorage.getItem('ll:activeAccount');
                if (!raw) return null;
                return JSON.parse(raw);
            } catch { return null; }
        })();
        const freshType = String(freshAcct?.type || '').toLowerCase();
        const freshIsBiz = freshType === 'business' && freshAcct?.id;
        const freshIsArt = freshType === 'artist' && freshAcct?.id;
        const freshHandle = freshIsBiz
            ? (freshAcct.slug || freshAcct.handle || '')
            : freshIsArt
                ? (freshAcct.handle || '')
                : '';
        // Resolve avatar: localStorage > context > fetched
        const freshAvatarUrl = freshIsBiz
            ? (freshAcct.avatar_url || freshAcct.avatarUrl || freshAcct.logo_url || activeAccount?.avatar_url || activeAccount?.avatarUrl || activeAccount?.logo_url || activeAccount?.logoUrl || fetchedAccountAvatar || '')
            : freshIsArt
                ? (freshAcct.avatar_url || freshAcct.avatarUrl || activeAccount?.avatar_url || activeAccount?.avatarUrl || fetchedAccountAvatar || '')
                : '';

        const payload = {
            text: cleaned,
            content: cleaned,
            ...getCommentPayloadPageRef.current(),
            ...(commentImageUrls.length > 0 ? { image_urls: commentImageUrls } : {}),
            ...(freshIsBiz ? {
                business_id: freshAcct.id,
                account_type: 'business',
                account_id: freshAcct.id,
                account_handle: freshAcct.slug || freshAcct.handle || '',
                account_name: freshAcct.name || '',
                account_avatar_url: freshAvatarUrl,
            } : {}),
            ...(freshIsArt ? {
                artist_id: freshAcct.id,
                account_type: 'artist',
                account_id: freshAcct.id,
                account_handle: freshAcct.handle || '',
                account_name: freshAcct.name || '',
                account_avatar_url: freshAvatarUrl,
            } : {}),
        };

        const acctHeaders = (() => { try { return getStaticAccountHeaders(); } catch { return {}; } })();

        const urls = [
            `/api/business/posts/${encodeURIComponent(postId)}/comments`,
            `/api/business-posts/${encodeURIComponent(postId)}/comments`,
        ];

        let ok = false;
        let serverComment = null;

        // Upload local image files to GCS first (deferred from selection time)
        let allCommentImageUrls = [...(payload.image_urls || [])];
        if (commentFiles.length > 0) {
            try {
                const uploadedUrls = await uploadFilesToGCS(commentFiles);
                if (uploadedUrls.length === 0) {
                    setCommentError('Failed to upload images. Please try again.');
                    setPosting(false);
                    return;
                }
                allCommentImageUrls = [...uploadedUrls, ...allCommentImageUrls];
            } catch {
                setCommentError('Failed to upload images. Please check your connection and try again.');
                setPosting(false);
                return;
            }
        }
        if (allCommentImageUrls.length > 0) {
            payload.image_urls = allCommentImageUrls;
        }

        for (const url of urls) {
            try {
                let res;
                res = await secureFetch(url, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', ...acctHeaders }, body: JSON.stringify(payload) });
                if (res.ok) {
                    ok = true;
                    try { serverComment = await res.json(); } catch { /* no body */ }
                    break;
                }
            } catch {
                // try next
            }
        }

        setPosting(false);
        if (ok) {
            recordComment();
            setCommentText('');
            setCommentFiles([]);
            setCommentImageUrls([]);
            setPost((p) => (p ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p));

            // Build optimistic comment from server response (or synthetic fallback)
            const created = serverComment?.comment || serverComment;
            const optimistic = created && created.id
                ? {
                    ...created,
                    ...(freshIsBiz ? {
                        business_id: freshAcct.id,
                        business_name: created.business_name || freshAcct.name || '',
                        business_slug: created.business_slug || freshHandle || '',
                        business_avatar_url: created.business_avatar_url || freshAvatarUrl || '',
                        account_type: 'business',
                        account_name: created.account_name || freshAcct.name || '',
                        account_handle: created.account_handle || freshHandle || '',
                        account_avatar_url: created.account_avatar_url || freshAvatarUrl || '',
                        handle: created.account_handle || created.business_slug || freshHandle || '',
                    } : {}),
                    ...(freshIsArt ? {
                        artist_id: freshAcct.id,
                        artist_name: created.artist_name || freshAcct.name || '',
                        artist_handle: created.artist_handle || freshHandle || '',
                        artist_avatar_url: created.artist_avatar_url || freshAvatarUrl || '',
                        account_type: 'artist',
                        account_name: created.account_name || freshAcct.name || '',
                        account_handle: created.account_handle || freshHandle || '',
                        account_avatar_url: created.account_avatar_url || freshAvatarUrl || '',
                        handle: created.account_handle || created.artist_handle || freshHandle || '',
                    } : {}),
                }
                : {
                    id: `temp_comment_${Date.now()}`,
                    text: cleaned,
                    content: cleaned,
                    user_id: viewer?.user?.id || viewer?.id,
                    public_id: viewer?.user?.public_id || viewer?.public_id,
                    first_name: viewer?.user?.first_name || '',
                    last_name: viewer?.user?.last_name || '',
                    handle: freshHandle || viewer?.user?.handle || '',
                    avatar_url: freshAvatarUrl || viewer?.user?.avatar_url || viewer?.user?.profile_picture || '',
                    created_at: new Date().toISOString(),
                    likes: 0,
                    viewer_liked: false,
                    reply_count: 0,
                    replies: [],
                    images: commentImageUrls.length > 0 ? [...commentImageUrls] : [],
                    ...(freshIsBiz ? {
                        business_id: freshAcct.id,
                        business_name: freshAcct.name || '',
                        business_slug: freshHandle || '',
                        business_avatar_url: freshAvatarUrl || '',
                        account_type: 'business',
                        account_name: freshAcct.name || '',
                        account_handle: freshHandle || '',
                        account_avatar_url: freshAvatarUrl || '',
                    } : {}),
                    ...(freshIsArt ? {
                        artist_id: freshAcct.id,
                        artist_name: freshAcct.name || '',
                        artist_handle: freshHandle || '',
                        artist_avatar_url: freshAvatarUrl || '',
                        account_type: 'artist',
                        account_name: freshAcct.name || '',
                        account_handle: freshHandle || '',
                        account_avatar_url: freshAvatarUrl || '',
                    } : {}),
                };

            // Optimistically insert via CommentsSection ref
            if (typeof addCommentRef.current === 'function') {
                addCommentRef.current(optimistic);
            } else {
                // Fallback: full refetch
                setCommentRefreshKey((k) => k + 1);
            }
        }
    };

    const onComposerKeyDown = (e) => {
        if (cmMentionOpen && cmMentionResults.length > 0) {
            if (e.key === "ArrowDown") { e.preventDefault(); setCmMentionActiveIdx((i) => (i + 1) % cmMentionResults.length); return; }
            if (e.key === "ArrowUp") { e.preventDefault(); setCmMentionActiveIdx((i) => (i - 1 + cmMentionResults.length) % cmMentionResults.length); return; }
            if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertCmMention(cmMentionResults[cmMentionActiveIdx]); return; }
            if (e.key === "Escape") { e.preventDefault(); closeCmMention(); return; }
        }
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitComment();
        }
    };

    const getPostValue = (...keys) => {
        for (const key of keys) {
            const value = post?.[key];
            if (value !== undefined && value !== null && value !== '') return value;
        }
        return '';
    };

    // Derived values
    // Memoize photos to prevent Carousel's useEffect from re-firing on every render
    // (extractPhotos returns a new array reference each call, which would cause an infinite update loop)
    const photos = useMemo(() => extractPhotos(post || {}), [post]);
    const postType = (post?.type || post?.postType || post?.post_type || 'update').toLowerCase();
    const typeMeta = POST_TYPE_META[postType] || POST_TYPE_META.update;
    const isDeal = postType === 'deal';
    const dealText = getPostValue('discountText', 'discount_text', 'dealText', 'deal_text', 'deal', 'offerText', 'offer_text', 'promoText', 'promo_text');
    const promoCodeValue = getPostValue('promoCode', 'promo_code', 'code', 'couponCode', 'coupon_code');
    const validUntilValue = getPostValue('validUntil', 'valid_until', 'expiresAt', 'expires_at', 'expirationDate', 'expiration_date');
    const termsValue = getPostValue('terms', 'termsAndConditions', 'terms_and_conditions', 'termsConditions', 'finePrint', 'fine_print');
    const postBody = getPostValue('body', 'content', 'description');
    const dealExpired = isDeal && validUntilValue && new Date(validUntilValue) < new Date();

    const handleCopyCode = () => {
        if (promoCodeValue) {
            navigator.clipboard.writeText(String(promoCodeValue));
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        }
    };

    const businessName = business?.name || post?.businessName || post?.business_name || post?.pageName || 'Business';
    const businessLogo = business?.logo_url || business?.logoUrl || business?.avatar_url || post?.businessAvatarUrl || post?.businessLogo || post?.businessAvatar || post?.business_avatar_url || post?.logo_url || post?.logoUrl || '';
    const businessHandle = business?.handle || business?.slug || post?.businessSlug || post?.pageSlug || post?.business_slug || businessSlug || '';

    // Business category (matching BusinessPostDetailModal)
    const bizCategoryKey = String(
        post?.businessCategoryKey || post?.business_category_key || post?.categoryKey || post?.category_key
        || business?.category_key || business?.categoryKey || ''
    ).trim();
    const _rawCatFallback = String(post?.businessCategory || post?.business_category || post?.category_name || post?.categoryLabel || '').trim();
    const _catExclude = new Set(['business_post', 'business post', 'artist_post', 'artist post', 'community_post', 'post', 'update', 'deal', 'announcement']);
    const bizCategoryLabel = getBizCategoryLabel(bizCategoryKey)
        || (_rawCatFallback && !_catExclude.has(_rawCatFallback.toLowerCase()) ? _rawCatFallback : '');
    const BizCategoryIconComp = getBizCategoryIcon(bizCategoryKey);

    // Business location (from business object or post fields)
    const pageAddress = post?.address || '';
    const pageCity = post?.city || business?.city || post?.businessCity || '';
    const pageCounty = post?.county || business?.county || post?.businessCounty || '';
    const pageLocationText = [pageAddress, pageCity, pageCounty].filter(Boolean).join(', ');

    const isBusinessOwner = Boolean(viewer && business && (
        String(viewer.id) === String(business.owner_id || '') ||
        String(viewer.id) === String(business.ownerId || '') ||
        (isBusinessAccount && activeBusinessId && String(activeBusinessId) === String(business.id || ''))
    ));

    // Also check if user is acting as the business that owns this post (matches detail modal)
    const postBizId = post?.business_id ?? post?.businessId ?? business?.id ?? null;
    const isActingAsBizOwner = Boolean(isBusinessAccount && activeBusinessId && postBizId && String(activeBusinessId) === String(postBizId));

    // --- Post owner check (mirrors PostDetailModal) ---
    const postAuthorId = post?.created_by_user_id ?? post?.user_id ?? post?.author_id ?? post?.owner_id ?? null;
    const isOwner = useMemo(() => {
        const vid = Number(viewer?.id || 0);
        const aid = Number(postAuthorId || 0);
        if (!vid || !aid) return false;
        return vid === aid;
    }, [viewer?.id, postAuthorId]);
    const canManagePost = isOwner || isBusinessOwner || isActingAsBizOwner;
    const canPinComments = canManagePost;

    // Broader link check — true when the viewer is tied to this business in
    // any way: active business account, or their personal user_id matches the
    // owner of the business (exposed as businessOwnerUserId on the payload).
    // Used to gate Report / Hide posts / Block so the viewer can't target
    // their own business from any account.
    const postBizOwnerUserId = Number(
        post?.businessOwnerUserId ||
        post?.business_owner_user_id ||
        business?.owner_user_id ||
        business?.submitted_by_user_id ||
        0
    );
    const isLinkedToBusiness = Boolean(
        canManagePost ||
        (viewer?.id && postBizOwnerUserId > 0 && Number(viewer.id) === postBizOwnerUserId)
    );

    // Pin / Unpin post
    const isPostPinned = Boolean(post?.is_pinned || post?.isPinned || post?.pinned);
    const [pinningPost, setPinningPost] = useState(false);

    // 3-dot menu state
    const [ownerMenuEl, setOwnerMenuEl] = useState(null);
    const ownerMenuOpen = Boolean(ownerMenuEl);
    const openOwnerMenu = useCallback((e) => { if (e) e.stopPropagation(); setOwnerMenuEl(e.currentTarget); }, []);
    const closeOwnerMenu = useCallback((e) => { if (e) e.stopPropagation(); setOwnerMenuEl(null); }, []);

    const handleTogglePostPin = useCallback(async () => {
        closeOwnerMenu();
        if (pinningPost || !post?.id) return;
        setPinningPost(true);
        try {
            if (isPostPinned) {
                await unpinBusinessPost(post.id);
                setPost((p) => p ? { ...p, is_pinned: false, isPinned: false, pinned: false } : p);
                showPostSuccess('Post unpinned');
            } else {
                await pinBusinessPost(post.id);
                setPost((p) => p ? { ...p, is_pinned: true, isPinned: true, pinned: true } : p);
                showPostSuccess('Post pinned');
            }
            try { window.dispatchEvent(new CustomEvent('ll:businessPost:updated', { detail: { postId: post.id } })); } catch {}
        } catch (err) {
            showPostSuccess(err?.message || 'Failed to update pin status');
        } finally {
            setPinningPost(false);
        }
    }, [post?.id, isPostPinned, pinningPost, closeOwnerMenu, showPostSuccess]);

    // Report dialog + copy link
    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const [reportSubmitted, setReportSubmitted] = useState(false);
    const [copyLinkToast, setCopyLinkToast] = useState(false);
    // Hide/block busy flags — toast is shown via existing showPostSuccess hook.
    const [hideBusy, setHideBusy] = useState(false);
    const [blockBusy, setBlockBusy] = useState(false);

    const handleCopyPostLink = useCallback((e) => {
        if (e) e.stopPropagation();
        closeOwnerMenu(e);
        const postUrl = `${window.location.origin}/${businessSlug}/posts/${postId}`;
        navigator.clipboard.writeText(postUrl).then(() => setCopyLinkToast(true)).catch(() => setCopyLinkToast(true));
    }, [closeOwnerMenu, businessSlug, postId]);

    const handleReportMenuClick = useCallback((e) => {
        if (e) e.stopPropagation();
        closeOwnerMenu(e);
        setReportDialogOpen(true);
        setReportSubmitted(false);
    }, [closeOwnerMenu]);

    // ── Hide posts / Block business handlers ──
    // POST to /api/users/hide or /api/users/block with target_type='business'.
    // Backend enforces a self-ownership guard. Success shows an inline toast;
    // the viewer stays on the page.
    const handleHideBusiness = useCallback(async (e) => {
        if (e) e.stopPropagation();
        closeOwnerMenu(e);
        const bizId = Number(postBizId || business?.id || 0);
        if (!bizId || hideBusy || blockBusy) return;
        setHideBusy(true);
        const displayName = String(business?.name || post?.businessName || 'Business').trim() || 'Business';
        try {
            const hdrs = { 'Content-Type': 'application/json', ...(getStaticAccountHeaders?.() || {}) };
            const res = await secureFetch('/api/users/hide', {
                method: 'POST',
                credentials: 'include',
                headers: hdrs,
                body: JSON.stringify({ target_id: bizId, target_type: 'business', action: 'hide' }),
            });
            if (res.ok) {
                try { window.dispatchEvent(new CustomEvent('ll:user:hidden-changed', { detail: { userId: bizId, targetType: 'business', hidden: true } })); } catch { /* */ }
                try { window.dispatchEvent(new CustomEvent('ll:business:hidden-changed', { detail: { businessId: bizId, hidden: true, source: 'businessPostPage' } })); } catch { /* */ }
                // Hand off toast to /business and redirect — the destination
                // reads ll:toast:next and shows the SuccessSnackbar there.
                try { sessionStorage.setItem('ll:toast:next', `Posts from ${displayName} hidden`); } catch { /* */ }
                navigate('/business');
                return;
            }
        } catch { /* best-effort */ } finally { setHideBusy(false); }
    }, [closeOwnerMenu, postBizId, business?.id, business?.name, post?.businessName, hideBusy, blockBusy, navigate]);

    const handleBlockBusiness = useCallback(async (e) => {
        if (e) e.stopPropagation();
        closeOwnerMenu(e);
        const bizId = Number(postBizId || business?.id || 0);
        if (!bizId || hideBusy || blockBusy) return;
        setBlockBusy(true);
        const displayName = String(business?.name || post?.businessName || 'Business').trim() || 'Business';
        try {
            const hdrs = { 'Content-Type': 'application/json', ...(getStaticAccountHeaders?.() || {}) };
            const res = await secureFetch('/api/users/block', {
                method: 'POST',
                credentials: 'include',
                headers: hdrs,
                body: JSON.stringify({ target_id: bizId, target_type: 'business', action: 'block' }),
            });
            if (res.ok) {
                // Block stays on the page — BlockedPostGate renders the
                // themed in-place container. Confirm with a SuccessSnackbar.
                try { window.dispatchEvent(new CustomEvent('ll:user:blocked-changed', { detail: { userId: bizId, targetType: 'business', blocked: true } })); } catch { /* */ }
                try { window.dispatchEvent(new CustomEvent('ll:user:hidden-changed', { detail: { userId: bizId, targetType: 'business', hidden: true } })); } catch { /* */ }
                try { window.dispatchEvent(new CustomEvent('ll:business:blocked-changed', { detail: { businessId: bizId, blocked: true, source: 'businessPostPage' } })); } catch { /* */ }
                showPostSuccess(`${displayName} blocked`);
            }
        } catch { /* best-effort */ } finally { setBlockBusy(false); }
    }, [closeOwnerMenu, postBizId, business?.id, business?.name, post?.businessName, hideBusy, blockBusy, showPostSuccess]);

    const submitPostReport = useCallback(async ({ reason, details }) => {
        const urls = [
            `/api/business/posts/${encodeURIComponent(postId)}/flag`,
            `/api/business-posts/${encodeURIComponent(postId)}/flag`,
        ];
        for (const url of urls) {
            try {
                const res = await secureFetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason, details }),
                });
                if (res.ok) {
                    setReportSubmitted(true);
                    return;
                }
            } catch { /* try next */ }
        }
    }, [postId]);

    const handleEditPost = useCallback(() => {
        closeOwnerMenu();
        navigate(`/${businessSlug}/posts/${postId}/edit`, { state: { post, business } });
    }, [closeOwnerMenu, navigate, businessSlug, postId, post, business]);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const handleDeletePost = useCallback(async () => {
        setDeleteConfirmOpen(false);
        const urls = [
            `/api/business/posts/${encodeURIComponent(postId)}`,
            `/api/business-posts/${encodeURIComponent(postId)}`,
        ];
        for (const url of urls) {
            try {
                const res = await secureFetch(url, { method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json' } });
                if (res.ok) {
                    try {
                        sessionStorage.setItem('ll:business:postDeletedSuccess', '1');
                        sessionStorage.removeItem('ll-business-hub-state');
                    } catch {}
                    try { window.dispatchEvent(new CustomEvent('ll:businessPost:deleted', { detail: { postId } })); } catch {}
                    navigate(businessSlug ? `/${businessSlug}` : '/business', { replace: true });
                    return;
                }
            } catch { /* try next */ }
        }
    }, [postId, navigate, businessSlug]);

    const businessUserForCard = useMemo(() => {
        const bizId = business?.id || post?.businessId || post?.business_id || undefined;
        const ownerId = business?.owner_id || business?.ownerId || post?.createdByUserId || post?.created_by_user_id || post?.user_id || undefined;
        return {
            // id must be bizId so resolveCardTarget returns { type: 'business', id: bizId }
            // — matching BusinessPostDetailModal. Fall back to ownerId only if bizId is unavailable.
            id: bizId || ownerId,
            owner_id: ownerId,
            first_name: businessName,
            last_name: '',
            handle: businessHandle,
            avatar_url: businessLogo || '',
            isBusiness: true,
            account_type: 'business',
            business_id: bizId,
            business_name: businessName,
            business_slug: businessHandle,
            business_avatar_url: businessLogo || '',
        };
    }, [business?.owner_id, business?.ownerId, business?.id, post?.businessId, post?.business_id, post?.createdByUserId, post?.created_by_user_id, post?.user_id, businessName, businessHandle, businessLogo]);

    if (loading || (post && user && gate.loading)) {
        return (
            <Box sx={{ maxWidth: 1120, mx: 'auto', px: { xs: 1, sm: 2 }, py: 3, pb: { xs: `${MOBILE_BOTTOM_NAV_HEIGHT + 24}px`, sm: 3 }, ...fadeSx }}>
                <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
                <Skeleton variant="rectangular" height={200} sx={{ mb: 2, borderRadius: 2 }} />
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            </Box>
        );
    }

    if (!post && isNetworkError(error)) {
        return (
            <Box sx={{ maxWidth: 1120, mx: 'auto', px: { xs: 1, sm: 2 }, py: 3, pb: { xs: `${MOBILE_BOTTOM_NAV_HEIGHT + 24}px`, sm: 3 }, ...fadeSx }}>
                <NetworkErrorState onRetry={() => window.location.reload()} />
            </Box>
        );
    }

    if (post && gate.gated) {
        return <BlockedPostGate gate={gate} />;
    }

    if (!post) {
        return (
            <Box sx={{ maxWidth: 1120, mx: 'auto', px: { xs: 1, sm: 2 }, py: 3, pb: { xs: `${MOBILE_BOTTOM_NAV_HEIGHT + 24}px`, sm: 3 }, textAlign: 'center', ...fadeSx }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    Post not found
                </Alert>
                <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleReturn}>
                    {fromBusinessProfile
                        ? `Back to ${backBusinessName || 'Business'}'s profile`
                        : fromUserProfile
                            ? backProfileName
                                ? `Return to ${backProfileName}'s profile`
                                : 'Return to Profile'
                            : cameFromMap
                                ? 'Return to Map'
                                : 'Return to Business'}
                </Button>
            </Box>
        );
    }

    return (
        <Box
            ref={bppPageRef}
            {...(bppMobile ? {
                onTouchStart: handleBppTouchStart,
                onTouchMove: handleBppTouchMove,
                onTouchEnd: handleBppTouchEnd,
            } : {})}
            sx={{ maxWidth: 1120, mx: 'auto', px: { xs: 0, sm: 2 }, pt: { xs: `${chromeTop}px`, sm: 3 }, py: { xs: 0, sm: 3 }, pb: { xs: `${MOBILE_BOTTOM_NAV_HEIGHT + 24}px`, sm: 3 }, ...fadeSx }}
        >
            <Paper
                variant="outlined"
                sx={(t) => ({
                    p: { xs: 1.5, sm: 2.5 },
                    borderRadius: { xs: 0, sm: 3 },
                    border: { xs: 'none', sm: undefined },
                    borderColor: { xs: 'transparent', sm: alphaColor(t.palette.primary.main, 0.12) },
                    bgcolor: 'background.paper',
                    boxShadow: { xs: 'none', sm: `0 16px 56px ${alphaColor(t.palette.common.black, 0.08)}` },
                })}
            >
                {/* Mobile: sticky back arrow header */}
                {bppMobile && !fromNotifications && (
                    <Box
                        sx={(t) => ({
                            display: 'flex',
                            alignItems: 'center',
                            mb: 1,
                            pb: 1,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            mx: -1.5,
                            px: 0.5,
                            pt: 0.5,
                        })}
                    >
                        <IconButton
                            onClick={handleReturn}
                            sx={{ color: 'text.primary' }}
                            aria-label="Back"
                        >
                            <ArrowBackIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                    </Box>
                )}

                {/* Desktop: Return header — hidden when arriving from notifications */}
                {!bppMobile && !fromNotifications && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Button
                            onClick={handleReturn}
                            startIcon={<ArrowBackIcon />}
                            sx={{ px: 1.5, py: 0.5, minWidth: 0, fontWeight: 800, textTransform: 'none', borderRadius: 999, '&:hover': { bgcolor: 'action.hover' } }}
                        >
                            {fromBusinessProfile
                                ? `Back to ${backBusinessName || 'Business'}'s profile`
                                : fromUserProfile
                                    ? backProfileName
                                        ? `Return to ${backProfileName}'s profile`
                                        : 'Return to Profile'
                                    : cameFromMap
                                        ? 'Return to Map'
                                        : `Return to ${cameFromHub ? 'Businesses' : businessName}`}
                        </Button>
                    </Box>
                )}

                {/* Business header + category + menu row */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 2 }}>
                    {/* Left: avatar + name */}
                    <Box
                        onClick={(e) => {
                            e.stopPropagation();
                            setUserCardAnchor(e.currentTarget);
                        }}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            cursor: 'pointer',
                            borderRadius: 2,
                            p: 0.75,
                            m: -0.75,
                            transition: (t) => `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                            '&:hover': { bgcolor: (t) => alphaColor(t.palette.text.primary, 0.04) },
                            maxWidth: 'fit-content',
                            minWidth: 0,
                        }}
                    >
                        <Avatar
                            src={businessLogo || undefined}
                            alt={businessName}
                            sx={(t) => ({
                                width: { xs: 64, sm: 72 },
                                height: { xs: 64, sm: 72 },
                                cursor: 'pointer',
                                bgcolor: businessLogo ? undefined : alphaColor(t.palette.primary.main, 0.08),
                                color: t.palette.primary.main,
                                border: '2px solid',
                                borderColor: businessLogo ? 'divider' : alphaColor(t.palette.text.primary, 0.06),
                                '& .MuiAvatar-img': { objectFit: 'cover', transform: 'scale(1.15)' },
                            })}
                        >
                            <StorefrontOutlinedIcon sx={{ fontSize: 32 }} />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle1" sx={(t) => ({ ...t.custom.postDetail.authorName })}>
                                {businessName}
                            </Typography>
                            {businessHandle && (
                                <Typography variant="body2" color="text.secondary" sx={(t) => ({ ...t.custom.postDetail.authorHandle, mt: 0.25 })}>
                                    @{businessHandle}
                                </Typography>
                            )}
                            {/* Row 3: Timestamp + Edited (matches BusinessPostCard) */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
                                    {timeAgo(post.publishedAt || post.createdAt || post.created_at)}
                                </Typography>
                                {isEdited && (
                                    <>
                                        <Typography variant="caption" color="text.disabled">•</Typography>
                                        <Typography
                                            variant="caption"
                                            onClick={openEditHistory}
                                            sx={{
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                color: 'primary.main',
                                                '&:hover': { textDecoration: 'underline' },
                                            }}
                                            title="Click to view edit history"
                                        >
                                            Edited
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        </Box>
                    </Box>

                    {/* Right: category chip + type chip + 3-dot menu */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                        {/* Category chip — always show; fallback to "Business" when no category */}
                        <Chip
                            icon={<BizCategoryIconComp sx={{ fontSize: '14px !important' }} />}
                            size="small"
                            label={bizCategoryLabel || 'Business'}
                            sx={(t) => ({
                                height: 24,
                                borderRadius: 999,
                                bgcolor: alphaColor(t.palette.primary.main, 0.08),
                                color: t.palette.primary.main,
                                fontWeight: 800,
                                fontSize: 11,
                                border: '1px solid',
                                borderColor: alphaColor(t.palette.primary.main, 0.25),
                                '& .MuiChip-icon': {
                                    color: t.palette.primary.main,
                                    ml: 0.5,
                                },
                                '& .MuiChip-label': {
                                    px: 0.9,
                                    lineHeight: 1,
                                },
                            })}
                        />

                        <Tooltip title="Options">
                            <IconButton
                                size="small"
                                onClick={openOwnerMenu}
                                sx={{ flexShrink: 0, color: 'text.secondary' }}
                            >
                                <MoreVertIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>

                        <SmartMenu
                            anchorEl={ownerMenuEl}
                            open={ownerMenuOpen}
                            onClose={closeOwnerMenu}
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
                                    boxShadow: (t) => t.custom?.shadows?.lg || `0 12px 40px ${alphaColor(t.palette.text.primary, 0.15)}`,
                                    minWidth: 200,
                                    py: 0.5,
                                },
                            }}
                        >
                            {/* Copy link */}
                            <MenuItem onClick={handleCopyPostLink} sx={{ py: 1 }}>
                                <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
                                <ListItemText primary="Copy link" />
                            </MenuItem>

                            {/* Owner actions: Pin, Edit and Delete */}
                            {canManagePost && <Divider sx={{ my: 0.5 }} />}

                            {canManagePost && (
                                <MenuItem
                                    onClick={(e) => { e.stopPropagation(); handleTogglePostPin(); }}
                                    disabled={pinningPost}
                                    sx={{ py: 1 }}
                                >
                                    <ListItemIcon>
                                        {isPostPinned
                                            ? <PushPinOutlinedIcon fontSize="small" />
                                            : <PushPinIcon fontSize="small" />}
                                    </ListItemIcon>
                                    <ListItemText primary={isPostPinned ? 'Unpin post' : 'Pin post'} />
                                </MenuItem>
                            )}

                            {canManagePost && (
                                <Tooltip
                                    title={isNonPersonal ? 'Switch to your personal profile to edit this post' : ''}
                                    placement="left"
                                    arrow
                                    disableHoverListener={!isNonPersonal}
                                    componentsProps={{ tooltip: { sx: { fontSize: 13, fontWeight: 600, px: 1.25, py: 0.75, maxWidth: 240 } } }}
                                >
                                    <span>
                                        <MenuItem
                                            onClick={(e) => { e.stopPropagation(); if (isNonPersonal) return; closeOwnerMenu(e); handleEditPost(); }}
                                            disabled={isNonPersonal}
                                            sx={{ py: 1 }}
                                        >
                                            <ListItemIcon><EditRoundedIcon fontSize="small" /></ListItemIcon>
                                            <ListItemText primary="Edit post" />
                                        </MenuItem>
                                    </span>
                                </Tooltip>
                            )}

                            {canManagePost && (
                                <Tooltip
                                    title={isNonPersonal ? 'Switch to your personal profile to delete this post' : ''}
                                    placement="left"
                                    arrow
                                    disableHoverListener={!isNonPersonal}
                                    componentsProps={{ tooltip: { sx: { fontSize: 13, fontWeight: 600, px: 1.25, py: 0.75, maxWidth: 220 } } }}
                                >
                                    <span>
                                        <MenuItem
                                            onClick={(e) => { e.stopPropagation(); if (isNonPersonal) return; closeOwnerMenu(e); setDeleteConfirmOpen(true); }}
                                            disabled={isNonPersonal}
                                            sx={{ py: 1, color: isNonPersonal ? 'text.disabled' : 'error.main' }}
                                        >
                                            <ListItemIcon sx={{ color: isNonPersonal ? 'text.disabled' : 'error.main' }}><DeleteRoundedIcon fontSize="small" /></ListItemIcon>
                                            <ListItemText primary="Delete post" />
                                        </MenuItem>
                                    </span>
                                </Tooltip>
                            )}

                            {/* Non-owner: Report */}
                            {!isLinkedToBusiness && (
                                <>
                                    <Divider sx={{ my: 0.5 }} />
                                    <MenuItem onClick={handleReportMenuClick} sx={{ py: 1 }}>
                                        <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                                        <ListItemText primary="Report post" />
                                    </MenuItem>
                                </>
                            )}
                            {!isLinkedToBusiness && viewer?.id && (
                                <MenuItem onClick={handleHideBusiness} disabled={hideBusy || blockBusy} sx={{ py: 1 }}>
                                    <ListItemIcon><VisibilityOffRoundedIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Hide posts" />
                                </MenuItem>
                            )}
                            {!isLinkedToBusiness && viewer?.id && (
                                <MenuItem onClick={handleBlockBusiness} disabled={hideBusy || blockBusy} sx={{ py: 1, color: 'error.main' }}>
                                    <ListItemIcon sx={{ color: 'error.main' }}><BlockRoundedIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Block business" />
                                </MenuItem>
                            )}
                        </SmartMenu>
                    </Box>
                </Box>

                {/* Title */}
                <Typography variant="h5" sx={(t) => ({ mb: 1.5, wordBreak: 'break-word', ...t.custom.postDetail.title })}>
                    {post.title}
                </Typography>

                {/* Announcement box — same accent-bar style as deal box */}
                {postType === 'announcement' && (
                    <Paper
                        elevation={0}
                        sx={(t) => ({
                            p: 2,
                            mt: 1.5,
                            bgcolor: alphaColor(t.palette.info.main, 0.06),
                            borderRadius: 3,
                            borderLeft: '4px solid',
                            borderLeftColor: t.palette.info.main,
                        })}
                    >
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <CampaignIcon sx={{ fontSize: 20, color: 'info.dark', flexShrink: 0 }} />
                            <Typography
                                variant="h6"
                                sx={{ fontWeight: 800, color: 'info.dark' }}
                            >
                                Announcement
                            </Typography>
                        </Stack>
                    </Paper>
                )}

                {/* Deal box */}
                {isDeal && (dealText || promoCodeValue || validUntilValue || dealExpired) && (
                    <Paper
                        elevation={0}
                        sx={(t) => ({
                            p: 2,
                            mt: 1.5,
                            bgcolor: dealExpired
                                ? alphaColor(t.palette.grey[500], 0.06)
                                : alphaColor(t.palette.success.main, 0.06),
                            borderRadius: 3,
                            borderLeft: '4px solid',
                            borderLeftColor: dealExpired ? 'grey.400' : 'success.main',
                            position: 'relative',
                            overflow: 'hidden',
                        })}
                    >
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <LocalOfferIcon sx={{ fontSize: 20, color: dealExpired ? 'grey.500' : 'success.dark', flexShrink: 0 }} />
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 800,
                                    color: dealExpired ? 'text.disabled' : 'success.dark',
                                    textDecoration: dealExpired ? 'line-through' : 'none',
                                }}
                            >
                                {dealText || 'Deal'}
                            </Typography>
                        </Stack>
                        {promoCodeValue && !dealExpired && (
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.25 }}>
                                <Chip
                                    label={promoCodeValue}
                                    onClick={handleCopyCode}
                                    onDelete={handleCopyCode}
                                    deleteIcon={copiedCode ? <CheckIcon sx={{ fontSize: 14 }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                                    size="small"
                                    sx={{
                                        height: 28,
                                        fontWeight: 700,
                                        fontFamily: 'monospace',
                                        fontSize: '0.85rem',
                                        letterSpacing: 1,
                                        bgcolor: 'common.white',
                                        border: '1px dashed',
                                        borderColor: 'success.main',
                                    }}
                                />
                                {copiedCode && <Typography variant="body2" color="success.main" fontWeight={700}>Copied!</Typography>}
                            </Stack>
                        )}
                        {validUntilValue && (
                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                                <ScheduleIcon sx={{ fontSize: 14, color: dealExpired ? 'error.main' : 'text.secondary' }} />
                                <Typography variant="caption" color={dealExpired ? 'error.main' : 'text.secondary'} fontWeight={600}>
                                    {dealExpired ? 'Expired' : `Valid until ${formatDate(validUntilValue)}`}
                                </Typography>
                            </Stack>
                        )}
                    </Paper>
                )}

                {/* Deal expired badge (standalone — when no discount text) */}
                {dealExpired && !dealText && (
                    <Chip
                        label="Expired"
                        size="small"
                        sx={{ mt: 1.5, height: 24, fontSize: '0.7rem', fontWeight: 600, bgcolor: 'error.light', color: 'error.contrastText' }}
                    />
                )}

                {/* Deal terms */}
                {isDeal && termsValue && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        * {termsValue}
                    </Typography>
                )}

                {/* Body */}
                {postBody && (
                    <Box sx={{ mb: photos.length > 0 ? 2 : 0, position: "relative" }}>
                        <Box sx={{ maxHeight: bodyExpanded ? "none" : 160, overflowY: bodyExpanded ? "visible" : "hidden", position: "relative" }}>
                            <RichTextDisplay html={postBody} />
                        </Box>
                        {!bodyExpanded && (postBody || "").length > 300 && (
                            <Box sx={{
                                position: "absolute", bottom: 0, left: 0, right: 0, height: 64,
                                background: (t) => `linear-gradient(to bottom, ${alphaColor(t.palette.background.paper, 0)} 0%, ${t.palette.background.paper} 85%)`,
                                pointerEvents: "none",
                            }} />
                        )}
                        {(postBody || "").length > 300 && (
                            <Button
                                size="small"
                                onClick={() => setBodyExpanded((p) => !p)}
                                sx={{
                                    mt: bodyExpanded ? 0.5 : -0.25, position: "relative", zIndex: 2,
                                    textTransform: "none", fontWeight: 850, fontSize: "0.78rem", px: 0, minWidth: 0,
                                    color: "primary.main", "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                                }}
                            >
                                {bodyExpanded ? "Show less" : "Show more"}
                            </Button>
                        )}
                    </Box>
                )}

                {/* Photos */}
                {photos.length > 0 && <Carousel photos={photos} />}

                {/* Location */}
                {pageLocationText ? (
                    <>
                        <Divider sx={{ my: 1.5 }} />
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                            <LocationOnRoundedIcon sx={(t) => ({ fontSize: t.custom.postDetail.locationIcon.fontSize, color: 'primary.main', mt: t.custom.postDetail.locationIcon.mt })} />
                            <Typography variant="body2" sx={(t) => ({ ...t.custom.postDetail.locationText, color: 'primary.main' })}>
                                {pageLocationText}
                            </Typography>
                        </Box>
                        <Divider sx={{ my: 1.5 }} />
                    </>
                ) : null}

                {/* Action bar */}
                <Paper
                    variant="outlined"
                    sx={{
                        mt: 1.25,
                        p: 1,
                        borderRadius: 1.5,
                        bgcolor: 'background.paper',
                        borderColor: (t) => alphaColor(t.palette.primary.main, 0.14),
                    }}
                >
                    <BusinessActionBar
                        user={viewer}
                        postId={post.id}
                        post={post}
                        initialLikes={Number(post.likesCount ?? post.likes_count ?? post.like_count ?? post.likes ?? 0) || 0}
                        initiallyLiked={Boolean(post.viewerLiked ?? post.viewer_liked ?? post.liked ?? post.is_liked)}
                        commentsCount={Number(post.commentsCount ?? post.comments_count ?? post.comment_count ?? post.comments ?? 0) || 0}
                        initialReposts={Number(post.repostsCount ?? post.reposts_count ?? post.repost_count ?? post.reposts ?? 0) || 0}
                        initiallyReposted={Boolean(post.viewerReposted ?? post.viewer_reposted ?? post.reposted ?? post.is_reposted)}
                        useShareDialog
                        onComment={() => {
                            if (commentInputRef.current) {
                                commentInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                setTimeout(() => commentInputRef.current?.focus(), 300);
                            }
                        }}
                    />
                </Paper>

                <Divider sx={{ my: 2 }} />

                {/* Comment composer */}
                <Box
                    id="comments-composer"
                    sx={{ mt: 2, display: 'flex', alignItems: 'flex-start', gap: 1, flexWrap: 'nowrap', mb: 2 }}
                >
                    <AccountAvatar
                        src={viewerAvatar}
                        accountType={isBusinessAccount ? 'business' : isArtistAccount ? 'artist' : 'personal'}
                        profileType={viewerProfileType}
                        alt={viewerLabel || 'You'}
                        size={36}
                    />

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <TextField
                            fullWidth
                            multiline
                            minRows={1}
                            maxRows={6}
                            value={commentText}
                            inputRef={commentInputRef}
                            onChange={(e) => {
                                handleCmChange(e);
                                if (commentError) setCommentError('');
                            }}
                            onKeyDown={onComposerKeyDown}
                            label={`Leave a comment as ${viewerLabel}`}
                            placeholder="Write your comment…"
                            variant="outlined"
                            disabled={posting}
                            error={Boolean(commentError)}
                            helperText={commentError}
                            sx={{
                                '& .MuiOutlinedInput-root': { borderRadius: 2 },
                                '& .MuiInputLabel-root': { fontWeight: 700 },
                            }}
                            inputProps={{ maxLength: COMMENT_MAX_CHARS }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end" sx={{ alignSelf: 'flex-end', pb: 0.25 }}>
                                        <IconButton
                                            aria-label="Send comment"
                                            onClick={submitComment}
                                            disabled={posting || (!commentText.trim() && commentFiles.length === 0 && commentImageUrls.length === 0)}
                                            sx={SEND_BUTTON_SX}
                                        >
                                            {posting ? (
                                                <CircularProgress size={18} sx={{ color: 'inherit' }} />
                                            ) : (
                                                <ArrowForwardRoundedIcon />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        {renderMentionPopper({ open: cmMentionOpen, anchorEl: cmMentionAnchorEl || commentInputRef.current, results: cmMentionResults, loading: cmMentionLoading, activeIdx: cmMentionActiveIdx, onSelect: insertCmMention, onClose: closeCmMention })}
                        {/* Image + GIF attachment toolbar & previews */}
                        <CommentImageAttachments
                            files={commentFiles}
                            urls={commentImageUrls}
                            onFilesChange={async (newFiles) => {
                                if (commentError) setCommentError('');
                                const added = newFiles.filter((f) => !commentFiles.includes(f));
                                for (const file of added) {
                                    const result = await scanImageFile(file);
                                    if (!result.safe) {
                                        setCommentError(result.message);
                                        setCommentFiles((prev) => prev.filter((pf) => pf !== file));
                                        return;
                                    }
                                }
                                setCommentFiles(newFiles);
                            }}
                            onUrlsChange={(u) => { setCommentImageUrls(u); if (commentError) setCommentError(''); }}
                            maxImages={4}
                            disabled={posting}
                        />
                    </Box>
                </Box>

                {/* Comments section */}
                <CommentsSection
                    postId={post.id}
                    businessSlug={businessSlug}
                    viewer={viewer}
                    postAuthorId={business?.owner_id || business?.ownerId}
                    canPinComment={canPinComments}
                    refreshKey={commentRefreshKey}
                    addCommentRef={addCommentRef}
                    scrollToCommentId={location.state?.scrollToCommentId || location.state?.highlightCommentId || _urlCommentId || null}
                    onCopyLinkToast={() => setCopyLinkToast(true)}
                    onCommentsLoaded={(count) => {
                        if (count !== post.commentsCount) {
                            setPost((p) => (p ? { ...p, commentsCount: count } : p));
                        }
                    }}
                />

                {/* Back to top */}
                {scrolled && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Button
                            variant="contained"
                            startIcon={<ArrowUpwardRoundedIcon sx={{ color: 'common.white' }} />}
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                            Back to Top
                        </Button>
                    </Box>
                )}
            </Paper>

            {/* Report post dialog */}
            <ReportDialog
                open={reportDialogOpen}
                onClose={() => setReportDialogOpen(false)}
                onSubmit={submitPostReport}
                title="Report Post"
            />

            {/* Delete post confirm */}
            <Dialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ pr: 6 }}>
                    Delete post
                    <IconButton
                        aria-label="Close"
                        onClick={() => setDeleteConfirmOpen(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2">
                        Are you sure you want to delete this post? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button onClick={handleDeletePost} color="error" variant="contained" sx={{ textTransform: 'none', fontWeight: 700 }}>Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Copy link toast */}
            <Snackbar
                open={copyLinkToast}
                autoHideDuration={2000}
                onClose={() => setCopyLinkToast(false)}
                message="Link copied to clipboard"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />

            <UserCardPopover
                anchorEl={userCardAnchor}
                onClose={() => setUserCardAnchor(null)}
                user={businessUserForCard}
                isSelf={isBusinessOwner}
                viewProfileOnly={isBusinessOwner}
                onViewProfile={(u) => {
                    const slug = u?.handle || businessHandle;
                    if (slug) window.location.assign(`/${slug}`);
                }}
            />

            {/* ── Edit History Dialog (timeline style, matches EventPostPage) ── */}
            <BusinessPostEditHistoryDialog
                open={editHistoryOpen}
                onClose={() => setEditHistoryOpen(false)}
                rows={editHistoryRows}
                loading={editHistoryLoading}
                error={editHistoryError}
            />

            <SuccessSnackbar {...postSnackbarProps} />

            {/* Rate limit dialog for comments */}
            <RateLimitDialog
                open={commentRateLimitOpen}
                onClose={() => setCommentRateLimitOpen(false)}
                retryAfterSec={commentRateLimitInfo.retryAfterSec}
                reason={commentRateLimitInfo.reason}
                actionLabel="comments"
            />
        </Box>
    );
}

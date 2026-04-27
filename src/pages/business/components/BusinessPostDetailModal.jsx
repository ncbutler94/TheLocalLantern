// src/pages/business/components/BusinessPostDetailModal.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { isCommentBlocked, parseBlockedSets, handleBlockChangedEvent } from '../../../utils/commentBlockUtils';
import PropTypes from 'prop-types';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    ListItemIcon,
    ListItem,
    ListItemText,
    MenuItem,
    Paper,
    Skeleton,
    Stack,
    TextField,
    Tooltip,
    Typography,
    Link,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    RadioGroup,
    FormControlLabel,
    Radio,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Popper from '@mui/material/Popper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import { useNavigate } from 'react-router-dom';

import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CampaignIcon from '@mui/icons-material/Campaign';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import ScheduleIcon from '@mui/icons-material/Schedule';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import ReplyRoundedIcon from '@mui/icons-material/ReplyRounded';
import LinkIcon from '@mui/icons-material/Link';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import PushPinRoundedIcon from '@mui/icons-material/PushPinRounded';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import ForumIcon from '@mui/icons-material/Forum';
import BlockIcon from '@mui/icons-material/Block';
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


import ActionBar from '../../../components/ActionBar';
import UserCardPopover from '../../../components/UserCardPopover';
import AccountAvatar from '../../../components/AccountAvatar';
import ShareDialog from '../../../components/ShareDialog';
import { useAuth } from '../../../components/AuthModalContext';
import { useActiveAccount } from '../../../components/AccountContext';
import { secureFetch } from '../../../utils/secureFetch';
import PulsingDots from '../../../components/PulsingDots';
import CommentImageAttachments, { uploadFilesToGCS } from '../../../components/CommentImageAttachments';
import CommentImages from '../../../components/CommentImages';
import EditBusinessPostDialog from './EditBusinessPostDialog';
import ReportContentDialog from '../../../components/ReportContentDialog';
import SmartMenu from '../../../components/SmartMenu';
import SuccessSnackbar, { useSuccessSnackbar } from '../../../components/SuccessSnackbar';
import { pinBusinessPost, unpinBusinessPost } from '../api/businessApi';
import RichTextDisplay from '../../../components/RichTextDisplay';
import { checkProfanity } from '../../../utils/profanityCheck';

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

const safeJson = async (res) => {
    try {
        return await res.json();
    } catch {
        return null;
    }
};

const COMMENT_EVT = 'll:businessPost:comment-count-changed';

const NEW_COMMENT_FADE_KEYFRAMES = `@keyframes commentFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}`;
const NEW_COMMENT_FADE_SX = {
    animation: 'commentFadeIn 0.45s ease-out both',
};
let _commentFadeInjected = false;
function ensureCommentFadeKeyframes() {
    if (_commentFadeInjected) return;
    _commentFadeInjected = true;
    const style = document.createElement('style');
    style.textContent = NEW_COMMENT_FADE_KEYFRAMES;
    document.head.appendChild(style);
}

const broadcastCommentCount = (postId, commentsCount) => {
    try {
        window.dispatchEvent(new CustomEvent(COMMENT_EVT, { detail: { postId, commentsCount } }));
    } catch {
        // ignore
    }
};

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

const timeAgoCompact = (input) => {
    const d = input ? new Date(input) : null;
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
    if (w < 5) return `${w}wk ago`;

    const mo = Math.floor(dys / 30);
    if (mo < 12) return `${mo}mo ago`;

    const y = Math.floor(dys / 365);
    return `${y}yr ago`;
};

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

    // 1. photos field (array or JSON string) — most common for business posts
    const { photos } = post;
    if (Array.isArray(photos)) {
        mediaUrls = photos.filter((p) => p && typeof p === 'string' && p !== 'null');
    } else if (typeof photos === 'string' && photos !== 'null' && photos.trim()) {
        try {
            const parsed = JSON.parse(photos);
            if (Array.isArray(parsed)) mediaUrls = parsed.filter((p) => p && typeof p === 'string' && p !== 'null');
            else mediaUrls = [photos];
        } catch {
            mediaUrls = [photos];
        }
    }

    // 2. Try mediaUrl (may be JSON array or single URL string)
    if (!mediaUrls.length) {
        const rawMediaUrl = post.mediaUrl || post.media_url;
        if (rawMediaUrl) {
            try {
                const parsed = JSON.parse(rawMediaUrl);
                mediaUrls = Array.isArray(parsed) ? parsed : [rawMediaUrl];
            } catch {
                mediaUrls = [rawMediaUrl];
            }
        }
    }

    // 3. Single-value fallback fields
    if (!mediaUrls.length) {
        const fallbacks = [
            post.photo_url,
            post.photo,
            post.image_url,
            post.image,
            post.thumbnail,
            post.main_photo_url,
            post.cover,
            post.cover_url,
            post.coverImage,
            post.cover_image,
            post.photoUrl,
            post.imageUrl,
        ].filter(Boolean);
        for (const fb of fallbacks) {
            try {
                const parsed = JSON.parse(fb);
                if (Array.isArray(parsed)) { mediaUrls = parsed; break; }
            } catch { /* not JSON, use as-is */ }
            mediaUrls.push(fb);
            break;
        }
    }

    // 4. community_photos array of objects
    if (!mediaUrls.length && Array.isArray(post.community_photos)) {
        mediaUrls = post.community_photos.map((r) => r?.url || r?.photo_url || r?.path || null).filter(Boolean);
    }

    // 5. photos_json string
    if (!mediaUrls.length && typeof post.photos_json === 'string') {
        try {
            const arr = JSON.parse(post.photos_json);
            if (Array.isArray(arr)) mediaUrls = arr.filter((u) => typeof u === 'string' && u);
        } catch { /* ignore */ }
    }

    return mediaUrls.filter((url) => url && typeof url === 'string' && url.startsWith('http'));
}

/* ---------- Carousel Component ---------- */
function Carousel({ photos }) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        setIndex(0);
    }, [photos]);

    useEffect(() => {
        setIndex((i) => {
            if (!Array.isArray(photos) || photos.length === 0) return 0;
            const max = photos.length - 1;
            return Math.min(Math.max(0, i), max);
        });
    }, [photos.length]);

    const safeIndex = Array.isArray(photos) && photos.length ? Math.min(index, photos.length - 1) : 0;
    const current = Array.isArray(photos) ? photos[safeIndex] : null;

    const prev = () => {
        if (!Array.isArray(photos) || photos.length < 2) return;
        setIndex((i) => (i - 1 + photos.length) % photos.length);
    };

    const next = () => {
        if (!Array.isArray(photos) || photos.length < 2) return;
        setIndex((i) => (i + 1) % photos.length);
    };

    if (!current) return null;

    return (
        <Box sx={{ position: 'relative', mt: 1.5, mb: 1 }}>
            <Box
                sx={{
                    width: '100%',
                    height: { xs: 280, sm: 420 },
                    bgcolor: 'grey.900',
                    borderRadius: 2,
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                <Box
                    component="img"
                    src={current}
                    alt=""
                    loading="lazy"
                    sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        display: 'block',
                        userSelect: 'none',
                        backgroundColor: 'transparent',
                    }}
                />
            </Box>

            {photos.length > 1 && (
                <>
                    <IconButton
                        aria-label="Previous image"
                        onClick={(e) => { e.stopPropagation(); prev(); }}
                        size="medium"
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: 8,
                            transform: 'translateY(-50%)',
                            zIndex: 3,
                            width: 44,
                            height: 44,
                            bgcolor: (t) => alpha(t.palette.common.black, 0.50),
                            color: 'common.white',
                            '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.70) },
                        }}
                    >
                        <ChevronLeftIcon sx={{ fontSize: 28 }} />
                    </IconButton>

                    <IconButton
                        aria-label="Next image"
                        onClick={(e) => { e.stopPropagation(); next(); }}
                        size="medium"
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            right: 8,
                            transform: 'translateY(-50%)',
                            zIndex: 3,
                            width: 44,
                            height: 44,
                            bgcolor: (t) => alpha(t.palette.common.black, 0.50),
                            color: 'common.white',
                            '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.70) },
                        }}
                    >
                        <ChevronRightIcon sx={{ fontSize: 28 }} />
                    </IconButton>

                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 8,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor: (t) => alpha(t.palette.common.black, 0.55),
                            color: 'common.white',
                            fontSize: 13,
                            fontWeight: 600,
                        }}
                    >
                        {safeIndex + 1} / {photos.length}
                    </Box>
                </>
            )}
        </Box>
    );
}

Carousel.propTypes = {
    photos: PropTypes.arrayOf(PropTypes.string),
};

/** Placeholder for blocked comments — toggles Show/Hide via parent callback */
function BlockedCommentPlaceholder({ commentId, depth, shouldIndent, highlightedCommentId, replies, renderComment, parentName, parentHandle, onShow }) {
    const blockedLabel = depth > 0 ? 'Reply from a blocked user' : 'Comment from a blocked user';
    const isHighlighted = String(highlightedCommentId) === String(commentId);
    return (
        <React.Fragment>
            <Box
                id={`comment-${commentId}`}
                sx={{
                    pl: shouldIndent ? { xs: 1.25, sm: 2 } : 0,
                    borderLeft: shouldIndent ? (t) => `2px solid ${alpha(t.palette.common.black, 0.08)}` : 'none',
                    ml: shouldIndent ? 1 : 0,
                    ...(isHighlighted ? { bgcolor: (t) => alpha('#A87822', 0.08), borderRadius: 2.5, border: '2px solid', borderColor: (t) => `${alpha('#A87822', 0.45)}`, boxShadow: (t) => `0 0 16px ${alpha('#A87822', 0.15)}`, px: 1.5, my: 0.5, transition: 'background-color 0.6s ease, border-color 0.6s ease, box-shadow 0.6s ease' } : {}),
                }}
            >
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', py: 1, px: 1.5, bgcolor: (t) => alpha(t.palette.text.primary, 0.03), borderRadius: 2, my: 0.5 }}>
                    <BlockIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>{blockedLabel}</Typography>
                    <Link component="button" type="button" underline="hover" onClick={() => onShow(commentId)}
                          sx={{ fontSize: 13, fontWeight: 600, flexShrink: 0 }}>Show</Link>
                </Box>
            </Box>
            {replies.length ? (
                <Box sx={{ pl: shouldIndent ? 2 : 0, ml: shouldIndent ? 1 : 0 }}>
                    {replies.map((r) => renderComment(r, depth + 1, parentName, parentHandle, commentId))}
                </Box>
            ) : null}
        </React.Fragment>
    );
}

function FlagCommentDialog({ open, onClose, onSubmit, initialReason = 'spam' }) {
    const [reason, setReason] = useState(initialReason);
    const [details, setDetails] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (!open) {
            const tid = setTimeout(() => {
                setReason(initialReason);
                setDetails('');
                setSubmitted(false);
            }, 200);
            return () => clearTimeout(tid);
        }
    }, [open, initialReason]);

    return (
        <Dialog
            open={open}
            onClose={(_e, r) => {
                if (r === 'backdropClick' || r === 'escapeKeyDown') return;
                onClose();
            }}
            fullWidth
            maxWidth="xs"
            sx={{ zIndex: (t) => t.zIndex.modal + 50 }}
            PaperProps={{ sx: { position: 'relative' } }}
        >
            <DialogTitle sx={{ pr: 7, fontWeight: 900 }}>
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
                            <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: 'success.light', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                                <CheckIcon sx={{ fontSize: 28, color: 'success.dark' }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Thank you for reporting</Typography>
                            <Typography variant="body2" color="text.secondary">Your report helps keep our community safe. We&apos;ll review this comment and take appropriate action.</Typography>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button variant="contained" onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600 }}>Done</Button>
                    </DialogActions>
                </>
            ) : (
                <>
                    <DialogContent dividers>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 800 }}>
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
                        <Button onClick={onClose} variant="outlined">
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => onSubmit({ reason, details, setSubmitted })}
                            sx={{ textTransform: 'none', fontWeight: 900 }}
                        >
                            Submit report
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
}

FlagCommentDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    initialReason: PropTypes.string,
};

function DeleteConfirmDialog({ open, onClose, onConfirm, isReply }) {
    return (
        <Dialog
            open={open}
            onClose={(_e, r) => {
                if (r === 'backdropClick' || r === 'escapeKeyDown') return;
                onClose();
            }}
            fullWidth
            maxWidth="xs"
            sx={{ zIndex: (t) => t.zIndex.modal + 50 }}
        >
            <DialogTitle sx={{ pr: 6, fontWeight: 900 }}>
                Confirm delete
                <IconButton
                    aria-label="Close"
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <Typography sx={{ fontWeight: 700 }}>
                    {isReply
                        ? 'Delete this reply? This cannot be undone.'
                        : 'Delete this comment and all of its replies? This cannot be undone.'}
                </Typography>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} variant="outlined">
                    Cancel
                </Button>
                <Button onClick={onConfirm} variant="contained" color="error" sx={{ fontWeight: 900 }}>
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
}

DeleteConfirmDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    isReply: PropTypes.bool,
};

/* ──────────────── @mention helpers (comment & reply) ──────────────── */

const MENTION_RE_MATCH = /@([a-zA-Z0-9_.\-]*)$/;

function getMentionMatch(text, cursorIndex) {
    if (!text || cursorIndex <= 0) return null;
    const before = text.slice(0, cursorIndex);
    const m = before.match(MENTION_RE_MATCH);
    if (!m) return null;
    const start = m.index;
    const query = m[1] || '';
    return { start, query, end: cursorIndex };
}

function getMentionAnchorVirtualEl(textareaEl, caretIndex) {
    if (!textareaEl) return null;
    const mirror = document.createElement('div');
    const cs = window.getComputedStyle(textareaEl);
    [
        'font', 'fontSize', 'fontFamily', 'fontWeight', 'lineHeight', 'letterSpacing',
        'wordSpacing', 'textTransform', 'paddingTop', 'paddingRight', 'paddingBottom',
        'paddingLeft', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth',
        'borderLeftWidth', 'boxSizing', 'whiteSpace', 'wordWrap', 'overflowWrap',
    ].forEach((p) => { mirror.style[p] = cs[p]; });
    mirror.style.position = 'absolute';
    mirror.style.left = '-9999px';
    mirror.style.top = '-9999px';
    mirror.style.width = cs.width;
    mirror.style.visibility = 'hidden';
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.overflowWrap = 'break-word';

    const beforeText = (textareaEl.value || '').slice(0, caretIndex);
    const textNode = document.createTextNode(beforeText);
    const span = document.createElement('span');
    span.textContent = '\u200b';
    mirror.appendChild(textNode);
    mirror.appendChild(span);
    document.body.appendChild(mirror);

    const rect = textareaEl.getBoundingClientRect();
    const spanRect = span.getBoundingClientRect();
    const mirrorRect = mirror.getBoundingClientRect();
    const left = rect.left + (spanRect.left - mirrorRect.left) - textareaEl.scrollLeft;
    const top = rect.top + (spanRect.top - mirrorRect.top) - textareaEl.scrollTop;
    document.body.removeChild(mirror);

    return {
        getBoundingClientRect: () => ({ top, bottom: top + 18, left, right: left, width: 0, height: 18, x: left, y: top }),
    };
}

function MentionAccountBadge({ result }) {
    if (!result) return null;
    const acctType = String(result.account_type || '').toLowerCase();
    const profileType = String(result.profile_type || result.profileType || '').toLowerCase();
    const isVisualArtist = acctType === 'artist' && profileType === 'artist';
    return (
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, ml: 0.25 }}>
            {acctType === 'business' && <StorefrontRoundedIcon sx={{ fontSize: 13, color: 'text.secondary', ml: 0.15 }} />}
            {acctType === 'artist' && !isVisualArtist && <MusicNoteRoundedIcon sx={{ fontSize: 13, color: 'text.secondary', ml: 0.15 }} />}
            {isVisualArtist && <PaletteRoundedIcon sx={{ fontSize: 13, color: 'text.secondary', ml: 0.15 }} />}
        </Box>
    );
}

function sortFlatComments(flatArr, mode, boostIds, focusCommentId) {
    const topLevel = [];
    const children = [];
    flatArr.forEach((c) => {
        if (c?.parentId) children.push(c);
        else topLevel.push(c);
    });

    // Determine which top-level comment to focus (either it IS the comment,
    // or it's the parent of the focused reply)
    let focusTopId = null;
    if (focusCommentId) {
        const fid = String(focusCommentId);
        // Check if a top-level comment matches
        if (topLevel.some((c) => String(c?.id) === fid)) {
            focusTopId = fid;
        } else {
            // Find the reply in children and trace to its top-level parent
            const child = children.find((c) => String(c?.id) === fid);
            if (child) {
                // Walk up parentId chain to find the root
                let rootId = String(child.parentId);
                const childMap = new Map(children.map((c) => [String(c?.id), c]));
                while (childMap.has(rootId)) {
                    const parent = childMap.get(rootId);
                    if (parent?.parentId) rootId = String(parent.parentId);
                    else break;
                }
                focusTopId = rootId;
            }
        }
    }

    topLevel.sort((a, b) => {
        const ap = a?.is_pinned ? 1 : 0;
        const bp = b?.is_pinned ? 1 : 0;
        if (bp !== ap) return bp - ap;
        // Focus comment (from engagement navigation) appears right after pinned
        if (focusTopId) {
            const aFocus = String(a?.id) === focusTopId ? 1 : 0;
            const bFocus = String(b?.id) === focusTopId ? 1 : 0;
            if (aFocus !== bFocus) return bFocus - aFocus;
        }
        // Boosted (newly posted) comments appear at top, right after pinned
        if (boostIds && boostIds.size > 0) {
            const aBoost = boostIds.has(a?.id) ? 1 : 0;
            const bBoost = boostIds.has(b?.id) ? 1 : 0;
            if (aBoost !== bBoost) return bBoost - aBoost;
        }
        if (mode === 'popular') {
            const al = Number(a?.likes ?? a?.likesCount ?? a?.likes_count ?? 0);
            const bl = Number(b?.likes ?? b?.likesCount ?? b?.likes_count ?? 0);
            if (bl !== al) return bl - al;
        }
        if (mode === 'newest') {
            return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
        }
        return new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0);
    });
    return [...topLevel, ...children];
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

export default function BusinessPostDetailModal({
                                                    embedded = false,
                                                    post,
                                                    user = null,
                                                    onViewPage,
                                                    onShare,
                                                    onLocationClick,
                                                    onCommentSuccess,
                                                    afterActionBarSlot = null,
                                                    scrollToCommentId: scrollToCommentIdProp = null,
                                                    highlightCommentId: highlightCommentIdProp = null,
                                                    emptyLabel = 'Select a business post',
                                                }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const navigate = useNavigate();
    const authCtx = useAuth();
    const {
        isBusinessAccount: isBA,
        isArtistAccount: isAA,
        activeBusinessId: aBizId,
        activeArtistId: aArtId,
        activeAccount: acctObj,
        accountCacheKey,
        getAccountPayload,
        getAccountParams,
        getCommentPayload,
        getAccountHeaders,
    } = useActiveAccount();
    const isNonPersonal = isBA || isAA;

    // ── Success confirmation snackbar ──
    const { showSuccess, snackbarProps: successSnackbarProps } = useSuccessSnackbar();
    const getAccountParamsRef = useRef(getAccountParams);
    getAccountParamsRef.current = getAccountParams;
    const getAccountPayloadRef = useRef(getAccountPayload);
    getAccountPayloadRef.current = getAccountPayload;
    const getCommentPayloadRef = useRef(getCommentPayload);
    getCommentPayloadRef.current = getCommentPayload;
    const getAccountHeadersRef = useRef(getAccountHeaders);
    getAccountHeadersRef.current = getAccountHeaders;
    const [copiedCode, setCopiedCode] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const [userCardAnchor, setUserCardAnchor] = useState(null);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [bodyExpanded, setBodyExpanded] = useState(false);

    // ── Refresh counts when embedded (engagement tabs pass stale counts) ──
    const [freshCounts, setFreshCounts] = useState(null);
    useEffect(() => {
        if (!post?.id) { setFreshCounts(null); return; }
        let cancelled = false;
        (async () => {
            try {
                // Try the business post endpoint first, then community fallback
                let res = await secureFetch(`/api/business/posts/${encodeURIComponent(post.id)}`, { credentials: 'include' });
                if (!res.ok) {
                    res = await secureFetch(`/api/community/${encodeURIComponent(post.id)}`, { credentials: 'include' });
                }
                if (!res.ok) return;
                const data = await res.json();
                const d = Array.isArray(data) ? data[0] : (data?.post || data);
                if (!cancelled && d && typeof d === 'object') {
                    setFreshCounts({
                        likesCount: d.likesCount ?? d.likes_count ?? d.like_count ?? d.likes,
                        commentsCount: d.commentsCount ?? d.comments_count ?? d.comment_count ?? d.comments,
                        repostsCount: d.repostsCount ?? d.reposts_count ?? d.repost_count ?? d.reposts,
                        viewerLiked: d.viewerLiked ?? d.viewer_liked ?? d.liked ?? d.is_liked,
                        viewerReposted: d.viewerReposted ?? d.viewer_reposted ?? d.reposted ?? d.is_reposted,
                        // Also pull author info for cases where it's missing
                        first_name: d.first_name, last_name: d.last_name,
                        handle: d.handle, avatar_url: d.avatar_url,
                        businessName: d.businessName ?? d.business_name,
                        businessSlug: d.businessSlug ?? d.business_slug,
                        businessAvatarUrl: d.businessAvatarUrl ?? d.business_avatar_url,
                    });
                }
            } catch { /* non-critical */ }
        })();
        return () => { cancelled = true; };
    }, [post?.id]);

    // Merge fresh counts over the prop so downstream reads pick them up
    const effectivePost = freshCounts ? { ...post, ...Object.fromEntries(Object.entries(freshCounts).filter(([, v]) => v != null)) } : post;

    // Use effectivePost for all downstream reads (shadowing the prop)
    // eslint-disable-next-line no-shadow
    const post_ = effectivePost;

    // Business info - API returns: businessName, businessSlug, businessAvatarUrl
    const pageName = post_?.businessName || post_?.pageName || post_?.business_name || post_?.page_name
        || post_?.account_name
        || `${post_?.first_name || ''} ${post_?.last_name || ''}`.trim()
        || post_?.name || post_?.authorName || post_?.author_name
        || (post_?.handle ? `@${post_.handle}` : null)
        || (post_?.businessSlug ? `@${post_.businessSlug}` : null)
        || 'Business';
    const title = post_?.title || 'Business Post';
    const body = post_?.body || post_?.description || '';

    // Business handle/slug - API returns businessSlug
    const pageSlug = String(post_?.businessSlug || post_?.pageSlug || post_?.page_slug || post_?.slug || post_?.account_handle || post_?.handle || '').trim();

    // Business avatar - API returns businessAvatarUrl
    const rawAvatar = post_?.businessAvatarUrl || post_?.pageAvatar || post_?.page_avatar || post_?.businessAvatar || post_?.account_avatar_url || post_?.avatar_url || post_?.profile_picture || post_?.logo_url || post_?.logoUrl || '';
    const hasValidAvatar = (() => {
        if (!rawAvatar || avatarError) return false;
        if (typeof rawAvatar === 'string' && (rawAvatar.includes('default_avatar') || rawAvatar.includes('default_business') || rawAvatar.includes('default_logo'))) return false;
        return true;
    })();

    // Timestamp
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

    // Post location — only show street address when the post itself has one.
    const businessAddress = post?.address || '';
    const businessCity = post?.city || post?.businessCity || '';
    const businessCounty = post?.county || post?.businessCounty || '';
    const countyLabel = businessCounty
        ? (String(businessCounty).toLowerCase().includes('county') ? businessCounty : `${businessCounty} County`)
        : '';
    const locationCityCounty = [businessCity, countyLabel].filter(Boolean).join(', ');
    const hasLocation = Boolean(businessAddress || businessCity || businessCounty);
    // Keep locationText for any legacy usage
    const locationText = [businessAddress, locationCityCounty].filter(Boolean).join(', ');

    // Business category
    const bizCategoryKey = String(post?.businessCategoryKey || post?.business_category_key || post?.categoryKey || post?.category_key || '').trim();
    // NOTE: post.category holds the post-type slug ('business_post'), NOT the business category.
    // Exclude it from the fallback chain to avoid showing "business_post" as the chip label.
    const _rawCatFallback = String(post?.businessCategory || post?.business_category || post?.category_name || post?.categoryLabel || '').trim();
    const _catExclude = new Set(['business_post', 'business post', 'artist_post', 'artist post', 'community_post', 'post', 'update', 'deal', 'announcement']);
    const staticBizCategoryLabel = getBizCategoryLabel(bizCategoryKey)
        || (_rawCatFallback && !_catExclude.has(_rawCatFallback.toLowerCase()) ? _rawCatFallback : '');

    // When category is missing (e.g. post from engagement API), fetch from business profile
    const [fetchedCategoryKey, setFetchedCategoryKey] = useState('');
    const needsCategoryFetch = Boolean(!staticBizCategoryLabel && pageSlug);
    const [categoryLoading, setCategoryLoading] = useState(needsCategoryFetch);
    useEffect(() => {
        if (staticBizCategoryLabel || !pageSlug) {
            setCategoryLoading(false);
            return;
        }
        let active = true;
        setCategoryLoading(true);
        (async () => {
            try {
                const res = await secureFetch(`/api/business/${encodeURIComponent(pageSlug)}`, {
                    credentials: 'include', headers: { Accept: 'application/json' },
                });
                if (!res.ok || !active) return;
                const data = await res.json();
                const biz = data?.business || data || {};
                const key = String(biz?.category_key || biz?.categoryKey || '').trim();
                if (key && active) setFetchedCategoryKey(key);
            } catch { /* non-critical */ }
            finally { if (active) setCategoryLoading(false); }
        })();
        return () => { active = false; };
    }, [staticBizCategoryLabel, pageSlug]);

    const bizCategoryLabel = staticBizCategoryLabel || getBizCategoryLabel(fetchedCategoryKey);
    const BizCategoryIconComp = getBizCategoryIcon(bizCategoryKey || fetchedCategoryKey);

    // Post type styling
    const postType = (post?.type || post?.post_type || 'update').toLowerCase();
    const isDeal = postType === 'deal';

    // Normalize deal fields — API may return snake_case or camelCase
    const discountText = post?.discountText || post?.discount_text || '';
    const promoCode = post?.promoCode || post?.promo_code || '';
    const validUntil = post?.validUntil || post?.valid_until || '';
    const dealTerms = post?.terms || post?.deal_terms || '';
    const dealExpired = isDeal && validUntil && isExpired(validUntil);

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

    // Photos for slideshow
    const photos = useMemo(() => extractPhotos(post), [post]);

    const likes = toNum(post_?.likesCount ?? post_?.likes_count ?? post_?.like_count ?? post_?.likes, 0);
    const initialCommentsCount = toNum(
        post_?.commentsCount ?? post_?.comments_count ?? post_?.comment_count ?? post_?.comments,
        0
    );
    const reposts = toNum(post_?.repostsCount ?? post_?.reposts_count ?? post_?.repost_count ?? post_?.reposts, 0);

    const viewerLiked = toBool(post_?.viewerLiked ?? post_?.viewer_liked ?? post_?.liked ?? post_?.is_liked);
    const viewerReposted = toBool(
        post_?.viewerReposted ?? post_?.viewer_reposted ?? post_?.reposted ?? post_?.is_reposted
    );

    const viewer = user?.user || user || authCtx?.user || null;
    const viewerAuthed = Boolean(viewer && (viewer.id || viewer.handle));

    // Account-aware viewer identity for comment composer
    const viewerPersonalAvatarUrl = (() => {
        const raw = viewer?.avatar_url || viewer?.profile_picture || '';
        if (!raw || raw.includes('default_avatar')) return '';
        return raw;
    })();
    const viewerPersonalLabel = `${viewer?.first_name || ''} ${viewer?.last_name || ''}`.trim() || 'You';

    const [fetchedAccountAvatar, setFetchedAccountAvatar] = useState('');
    const [fetchedAccountProfileType, setFetchedAccountProfileType] = useState('');
    useEffect(() => {
        if (!isBA && !isAA) {
            setFetchedAccountAvatar('');
            setFetchedAccountProfileType('');
            return;
        }
        // For artist accounts ALWAYS fetch so we get an authoritative
        // profile_type from the music_artists row (mirrors
        // ArtistAdminConsole's pattern). Business accounts can short-circuit
        // when the avatar is already populated in context.
        const existingAvatar = String(acctObj?.avatar_url || acctObj?.avatarUrl || acctObj?.logo_url || acctObj?.logoUrl || '').trim();
        const hasAvatar = existingAvatar && !existingAvatar.includes('default_avatar') && !existingAvatar.includes('default_business') && !existingAvatar.includes('default_logo');
        if (isBA && hasAvatar) {
            setFetchedAccountAvatar('');
            setFetchedAccountProfileType('');
            return;
        }
        let active = true;
        (async () => {
            try {
                let url = '';
                if (isBA) {
                    const slug = String(acctObj?.slug || acctObj?.handle || '').trim();
                    if (!slug || /^\d+$/.test(slug)) return;
                    url = `/api/business/${encodeURIComponent(slug)}`;
                } else if (isAA && aArtId) {
                    url = `/api/music/artists/${encodeURIComponent(String(aArtId))}`;
                }
                if (!url) return;
                const res = await secureFetch(url, { credentials: 'include', headers: { Accept: 'application/json' } });
                if (!res.ok || !active) return;
                const data = await res.json();
                const entity = data?.business || data?.artist || data || {};
                const av = String(entity?.avatar_url || entity?.avatarUrl || entity?.logo_url || entity?.logoUrl || '').trim();
                const pt = String(entity?.profile_type || entity?.profileType || '').toLowerCase();
                if (!active) return;
                const okAv = av && !av.includes('default_avatar') && !av.includes('default_business') && !av.includes('default_logo');
                if (okAv) setFetchedAccountAvatar(av);
                // For artist accounts, always set a normalized profile type
                // so the composer fallback icon renders correctly on first paint.
                if (isAA) {
                    setFetchedAccountProfileType(pt === 'artist' ? 'artist' : 'music');
                }
                // Patch localStorage so Header and other consumers see the
                // right value. Overwrite unconditionally (last-writer-wins)
                // so stale cached values get corrected.
                try {
                    const stored = JSON.parse(localStorage.getItem('ll:activeAccount') || '{}');
                    if (stored && typeof stored === 'object') {
                        let dirty = false;
                        if (okAv && stored.avatar_url !== av) {
                            stored.avatar_url = av;
                            dirty = true;
                        }
                        if (isAA) {
                            const normalized = pt === 'artist' ? 'artist' : 'music';
                            if (stored.profile_type !== normalized || stored.profileType !== normalized) {
                                stored.profile_type = normalized;
                                stored.profileType = normalized;
                                dirty = true;
                            }
                        }
                        if (dirty) localStorage.setItem('ll:activeAccount', JSON.stringify(stored));
                    }
                } catch { /* ignore */ }
            } catch { /* non-critical */ }
        })();
        return () => { active = false; };
    }, [isBA, isAA, aArtId, acctObj?.slug, acctObj?.handle, acctObj?.avatar_url, acctObj?.avatarUrl, acctObj?.logo_url, acctObj?.logoUrl]);

    const viewerAvatarUrl = (() => {
        if (isBA || isAA) {
            if (fetchedAccountAvatar) return fetchedAccountAvatar;
            const candidates = [
                acctObj?.avatar_url, acctObj?.avatarUrl, acctObj?.logo_url, acctObj?.logoUrl,
                acctObj?.image_url, acctObj?.imageUrl, acctObj?.photo_url, acctObj?.photoUrl,
                acctObj?.account_avatar_url,
            ];
            for (const c of candidates) {
                const s = String(c || '').trim();
                if (s && s !== 'null' && s !== 'undefined' && !s.includes('default_avatar') && !s.includes('default_business') && !s.includes('default_logo')) return s;
            }
            return '';
        }
        return viewerPersonalAvatarUrl;
    })();
    const viewerAccountType = isBA ? 'business' : isAA ? 'artist' : 'personal';
    // Sub-type for artist viewers: 'music' (default) or 'artist' (visual artist).
    // The fetched value from /api/music/artists/:id is authoritative — mirrors
    // the pattern in ArtistAdminConsole, which reads profile_type directly
    // from the artist row. Falls back to context, then localStorage.
    const viewerProfileType = (() => {
        if (!isAA) return 'music';
        const fromFetched = String(fetchedAccountProfileType || '').toLowerCase();
        if (fromFetched === 'artist' || fromFetched === 'music') return fromFetched;
        const fromCtx = String(acctObj?.profile_type || acctObj?.profileType || '').toLowerCase();
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
    const viewerLabel = (isBA || isAA)
        ? (acctObj?.name || viewerPersonalLabel)
        : viewerPersonalLabel;

    const openLoginPopup = useCallback((e) => {
        if (e) e.preventDefault();
        try {
            window.dispatchEvent(new CustomEvent('open-login'));
            window.dispatchEvent(new CustomEvent('open-auth-dialog'));
            window.dispatchEvent(new CustomEvent('open-login-popup'));
        } catch {
            // ignore
        }
    }, []);

    const postAuthorIdRaw =
        post?.authorUserId ??
        post?.author_user_id ??
        post?.user_id ??
        post?.userId ??
        post?.created_by_user_id ??
        post?.createdByUserId ??
        null;
    const postAuthorId = postAuthorIdRaw != null ? String(postAuthorIdRaw) : '';

    const viewerIsAuthor = Boolean(viewerAuthed && postAuthorId && String(viewer?.id ?? '') === String(postAuthorId));

    // Post owner check — for business posts, ownership requires being actively
    // switched to the business account. The user who physically created the post
    // on behalf of the business should NOT get owner powers from their personal account.
    const postBizId = post?.businessId || post?.businessPageId || post?.business_id || post?.business_page_id || post?.pageId || post?.page_id || '';
    const isPostOwner = useMemo(() => {
        const vid = Number(viewer?.id || 0);
        const aid = Number(postAuthorId || 0);
        if (!vid || !aid) return false;
        if (vid !== aid) return false;
        // Business post — user_id match alone is not enough
        if (postBizId) return false;
        return true;
    }, [viewer?.id, postAuthorId, postBizId]);

    const isActingAsBizOwner = Boolean(isBA && aBizId && String(aBizId) === String(postBizId));
    const canManagePost = isPostOwner || isActingAsBizOwner;

    // Broader link check — true when the viewer is tied to this business in
    // any way: active business account, or their personal user_id matches the
    // backend-provided businessOwnerUserId. Used to gate destructive menu
    // actions (Hide posts / Block / Report) so the viewer can't target their
    // own business from any account.
    const postBizOwnerUserId = Number(
        post?.businessOwnerUserId ||
        post?.business_owner_user_id ||
        0
    );
    const isLinkedToBusiness = Boolean(
        canManagePost ||
        (viewer?.id && postBizOwnerUserId > 0 && Number(viewer.id) === postBizOwnerUserId)
    );

    // Post 3-dot menu
    const [postMenuEl, setPostMenuEl] = useState(null);
    const postMenuOpen = Boolean(postMenuEl);
    const openPostMenu = useCallback((e) => { if (e) e.stopPropagation(); setPostMenuEl(e.currentTarget); }, []);
    const closePostMenu = useCallback((e) => { if (e) e.stopPropagation(); setPostMenuEl(null); }, []);

    const [postReportOpen, setPostReportOpen] = useState(false);
    const [bizReportOpen, setBizReportOpen] = useState(false);
    const [copyLinkToast, setCopyLinkToast] = useState(false);
    const [deletePostConfirm, setDeletePostConfirm] = useState(false);
    const [hideBlockToast, setHideBlockToast] = useState('');
    const [hideBusy, setHideBusy] = useState(false);
    const [blockBusy, setBlockBusy] = useState(false);

    useEffect(() => {
        if (!hideBlockToast) return undefined;
        const t = window.setTimeout(() => setHideBlockToast(''), 1800);
        return () => window.clearTimeout(t);
    }, [hideBlockToast]);

    // Pin / Unpin post
    const isPostPinned = Boolean(post?.is_pinned || post?.isPinned || post?.pinned);
    const [pinningPost, setPinningPost] = useState(false);
    const handleTogglePostPin = useCallback(async () => {
        closePostMenu();
        if (pinningPost || !post?.id) return;
        setPinningPost(true);
        try {
            if (isPostPinned) {
                await unpinBusinessPost(post.id);
                showSuccess('Post unpinned');
            } else {
                await pinBusinessPost(post.id);
                showSuccess('Post pinned');
            }
            try { window.dispatchEvent(new CustomEvent('ll:businessPost:updated', { detail: { postId: post.id } })); } catch {}
        } catch (err) {
            showSuccess(err?.message || 'Failed to update pin status');
        } finally {
            setPinningPost(false);
        }
    }, [post?.id, isPostPinned, pinningPost, closePostMenu, showSuccess]);

    const handleCopyPostLink = useCallback((e) => {
        if (e) e.stopPropagation();
        closePostMenu(e);
        const postUrl = `${window.location.origin}/${pageSlug}/posts/${post?.id}`;
        navigator.clipboard.writeText(postUrl).then(() => setCopyLinkToast(true)).catch(() => setCopyLinkToast(true));
    }, [closePostMenu, pageSlug, post?.id]);

    const handleReportPostClick = useCallback((e) => {
        if (e) e.stopPropagation();
        closePostMenu(e);
        setPostReportOpen(true);
    }, [closePostMenu]);

    const handleReportBusinessClick = useCallback((e) => {
        if (e) e.stopPropagation();
        closePostMenu(e);
        setBizReportOpen(true);
    }, [closePostMenu]);

    // ── Hide posts / Block business handlers ──
    // Mirrors BusinessPostCard logic. Backend resolves target_type='business'
    // to the business's owner and enforces a self-ownership guard in user.js.
    const handleHideBusiness = useCallback(async (e) => {
        if (e) e.stopPropagation();
        closePostMenu(e);
        const bizId = Number(postBizId || 0);
        if (!bizId || hideBusy || blockBusy) return;
        setHideBusy(true);
        const displayName = String(post?.businessName || post?.pageName || post?.business_name || 'Business').trim() || 'Business';
        try {
            const hdrs = { 'Content-Type': 'application/json', ...(getAccountHeadersRef.current?.() || {}) };
            const res = await secureFetch('/api/users/hide', {
                method: 'POST',
                credentials: 'include',
                headers: hdrs,
                body: JSON.stringify({ target_id: bizId, target_type: 'business', action: 'hide' }),
            });
            if (res.ok) {
                try { window.dispatchEvent(new CustomEvent('ll:user:hidden-changed', { detail: { userId: bizId, targetType: 'business', hidden: true } })); } catch { /* */ }
                try { window.dispatchEvent(new CustomEvent('ll:business:hidden-changed', { detail: { businessId: bizId, hidden: true, source: 'businessPostDetailModal' } })); } catch { /* */ }
                setHideBlockToast(`Posts from ${displayName} hidden`);
            }
        } catch { /* best-effort */ } finally { setHideBusy(false); }
    }, [closePostMenu, postBizId, hideBusy, blockBusy, post?.businessName, post?.pageName, post?.business_name]);

    const handleBlockBusiness = useCallback(async (e) => {
        if (e) e.stopPropagation();
        closePostMenu(e);
        const bizId = Number(postBizId || 0);
        if (!bizId || hideBusy || blockBusy) return;
        setBlockBusy(true);
        const displayName = String(post?.businessName || post?.pageName || post?.business_name || 'Business').trim() || 'Business';
        try {
            const hdrs = { 'Content-Type': 'application/json', ...(getAccountHeadersRef.current?.() || {}) };
            const res = await secureFetch('/api/users/block', {
                method: 'POST',
                credentials: 'include',
                headers: hdrs,
                body: JSON.stringify({ target_id: bizId, target_type: 'business', action: 'block' }),
            });
            if (res.ok) {
                try { window.dispatchEvent(new CustomEvent('ll:user:blocked-changed', { detail: { userId: bizId, targetType: 'business', blocked: true } })); } catch { /* */ }
                try { window.dispatchEvent(new CustomEvent('ll:user:hidden-changed', { detail: { userId: bizId, targetType: 'business', hidden: true } })); } catch { /* */ }
                try { window.dispatchEvent(new CustomEvent('ll:business:blocked-changed', { detail: { businessId: bizId, blocked: true, source: 'businessPostDetailModal' } })); } catch { /* */ }
                setHideBlockToast(`${displayName} blocked`);
            }
        } catch { /* best-effort */ } finally { setBlockBusy(false); }
    }, [closePostMenu, postBizId, hideBusy, blockBusy, post?.businessName, post?.pageName, post?.business_name]);

    const submitBizReport = useCallback(async ({ reason, details }) => {
        const bizId = post?.businessPageId || post?.business_page_id || post?.pageId || post?.page_id;
        if (!bizId) return;
        const urls = [
            `/api/business/${encodeURIComponent(bizId)}/flag`,
            `/api/business-pages/${encodeURIComponent(bizId)}/flag`,
        ];
        for (const url of urls) {
            try {
                const res = await secureFetch(url, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason, details }) });
                if (res.ok) { return; }
            } catch { /* try next */ }
        }
    }, [post?.businessPageId, post?.business_page_id, post?.pageId, post?.page_id]);

    const submitPostReport = useCallback(async ({ reason, details }) => {
        const urls = [
            `/api/business/posts/${encodeURIComponent(post?.id)}/flag`,
            `/api/business-posts/${encodeURIComponent(post?.id)}/flag`,
        ];
        for (const url of urls) {
            try {
                const res = await secureFetch(url, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason, details }) });
                if (res.ok) { return; }
            } catch { /* try next */ }
        }
    }, [post?.id]);

    // Edit dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const handleEditPost = useCallback(() => {
        closePostMenu();
        setEditDialogOpen(true);
    }, [closePostMenu]);

    const handleDeletePost = useCallback(async () => {
        setDeletePostConfirm(false);
        const urls = [
            `/api/business/posts/${encodeURIComponent(post?.id)}`,
            `/api/business-posts/${encodeURIComponent(post?.id)}`,
        ];
        for (const url of urls) {
            try {
                const res = await secureFetch(url, { method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json' } });
                if (res.ok) {
                    try { sessionStorage.removeItem('ll-business-hub-state'); } catch {}
                    try { window.dispatchEvent(new CustomEvent('ll:businessPost:deleted', { detail: { postId: post?.id } })); } catch {}
                    return;
                }
            } catch { /* try next */ }
        }
    }, [post?.id]);

    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentsError, setCommentsError] = useState('');
    const [commentDraft, setCommentDraft] = useState('');
    const [commentSending, setCommentSending] = useState(false);
    const [commentsCount, setCommentsCount] = useState(initialCommentsCount);
    const initialCommentsCountRef = useRef(initialCommentsCount);
    initialCommentsCountRef.current = initialCommentsCount;
    const [commentSort, setCommentSort] = useState('popular');
    const [displayComments, setDisplayComments] = useState([]);
    const [newCommentIds, setNewCommentIds] = useState(() => new Set());
    const commentSortRef = useRef('popular');
    commentSortRef.current = commentSort;
    const [expandedReplyThreads, setExpandedReplyThreads] = useState({});
    const [highlightedCommentId, setHighlightedCommentId] = useState(null);
    const highlightTimerRef = useRef(0);

    const scrollToComment = useCallback((commentId) => {
        const el = document.getElementById(`comment-${commentId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedCommentId(String(commentId));
            clearTimeout(highlightTimerRef.current);
            highlightTimerRef.current = setTimeout(() => setHighlightedCommentId(null), 2200);
        }
    }, []);

    const toggleReplyThread = useCallback((commentId) => {
        setExpandedReplyThreads((prev) => ({
            ...prev,
            [commentId]: !prev[commentId],
        }));
    }, []);

    const [replyingToId, setReplyingToId] = useState(null);
    const [replyDraft, setReplyDraft] = useState('');
    const [replySending, setReplySending] = useState(false);
    const [commentFiles, setCommentFiles] = useState([]);
    const [commentImageUrls, setCommentImageUrls] = useState([]);
    const [replyFiles, setReplyFiles] = useState([]);
    const [replyImageUrls, setReplyImageUrls] = useState([]);
    const [commentError, setCommentError] = useState('');
    const [replyError, setReplyError] = useState('');

    const [flagState, setFlagState] = useState({ open: false, commentId: null });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, commentId: null, isReply: false });
    const [commentShareToast, setCommentShareToast] = useState(false);
    const [shareCommentDialogOpen, setShareCommentDialogOpen] = useState(false);
    const [shareCommentTarget, setShareCommentTarget] = useState(null);
    const [commentUserAnchor, setCommentUserAnchor] = useState(null);
    const [commentUserForCard, setCommentUserForCard] = useState(null);
    const [pinConfirm, setPinConfirm] = useState({ open: false, commentId: null, mode: 'pin', willReplace: false });
    const [commentMenuAnchor, setCommentMenuAnchor] = useState(null);
    const [commentMenuId, setCommentMenuId] = useState(null);

    // Track blocked users for comment placeholders
    const [blockedUserIds, setBlockedUserIds] = useState(() => new Set());
    const [blockedBusinessIds, setBlockedBusinessIds] = useState(() => new Set());
    const [blockedArtistIds, setBlockedArtistIds] = useState(() => new Set());
    const [blockedHandles, setBlockedHandles] = useState(() => new Set());
    const [shownBlockedIds, setShownBlockedIds] = useState(() => new Set());
    const handleShowBlocked = useCallback((commentId) => {
        setShownBlockedIds((prev) => new Set(prev).add(Number(commentId)));
    }, []);
    const handleHideBlocked = useCallback((commentId) => {
        setShownBlockedIds((prev) => { const next = new Set(prev); next.delete(Number(commentId)); return next; });
    }, []);

    useEffect(() => {
        if (!viewer?.id) return;
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
    }, [viewer?.id]);
    // Listen for blocked-changed events (real-time updates during session)
    useEffect(() => {
        const onBlockedChanged = (e) => {
            handleBlockChangedEvent(e, setBlockedUserIds, setBlockedBusinessIds, setBlockedArtistIds);
        };
        window.addEventListener('ll:user:blocked-changed', onBlockedChanged);
        return () => window.removeEventListener('ll:user:blocked-changed', onBlockedChanged);
    }, []);


    // @mention state for comment input
    const [cmMentionOpen, setCmMentionOpen] = useState(false);
    const [cmMentionQuery, setCmMentionQuery] = useState('');
    const [cmMentionResults, setCmMentionResults] = useState([]);
    const [cmMentionLoading, setCmMentionLoading] = useState(false);
    const [cmMentionActiveIdx, setCmMentionActiveIdx] = useState(0);
    const [cmMentionAnchorEl, setCmMentionAnchorEl] = useState(null);
    const cmInputRef = useRef(null);
    const cmMentionCaretRef = useRef(0);
    const cmMentionStartRef = useRef(0);
    const cmMentionEndRef = useRef(0);
    const cmAbortRef = useRef(null);

    // @mention state for reply input
    const [rpMentionOpen, setRpMentionOpen] = useState(false);
    const [rpMentionQuery, setRpMentionQuery] = useState('');
    const [rpMentionResults, setRpMentionResults] = useState([]);
    const [rpMentionLoading, setRpMentionLoading] = useState(false);
    const [rpMentionActiveIdx, setRpMentionActiveIdx] = useState(0);
    const [rpMentionAnchorEl, setRpMentionAnchorEl] = useState(null);
    const rpInputRef = useRef(null);
    const rpMentionCaretRef = useRef(0);
    const rpMentionStartRef = useRef(0);
    const rpMentionEndRef = useRef(0);
    const rpAbortRef = useRef(null);

    // Shared mention search debounce
    useEffect(() => {
        if (!cmMentionOpen || cmMentionQuery.length < 1) { setCmMentionResults([]); return; }
        const timer = setTimeout(() => {
            cmAbortRef.current?.abort();
            const ac = new AbortController();
            cmAbortRef.current = ac;
            setCmMentionLoading(true);
            secureFetch(`/api/community/users/search?q=${encodeURIComponent(cmMentionQuery)}&limit=8`, {
                credentials: 'include', signal: ac.signal,
            })
                .then((r) => r.json())
                .then((d) => { if (!ac.signal.aborted) { setCmMentionResults(Array.isArray(d) ? d : d?.results || []); setCmMentionActiveIdx(0); } })
                .catch(() => {})
                .finally(() => { if (!ac.signal.aborted) setCmMentionLoading(false); });
        }, 200);
        return () => { clearTimeout(timer); cmAbortRef.current?.abort(); };
    }, [cmMentionOpen, cmMentionQuery]);

    useEffect(() => {
        if (!rpMentionOpen || rpMentionQuery.length < 1) { setRpMentionResults([]); return; }
        const timer = setTimeout(() => {
            rpAbortRef.current?.abort();
            const ac = new AbortController();
            rpAbortRef.current = ac;
            setRpMentionLoading(true);
            secureFetch(`/api/community/users/search?q=${encodeURIComponent(rpMentionQuery)}&limit=8`, {
                credentials: 'include', signal: ac.signal,
            })
                .then((r) => r.json())
                .then((d) => { if (!ac.signal.aborted) { setRpMentionResults(Array.isArray(d) ? d : d?.results || []); setRpMentionActiveIdx(0); } })
                .catch(() => {})
                .finally(() => { if (!ac.signal.aborted) setRpMentionLoading(false); });
        }, 200);
        return () => { clearTimeout(timer); rpAbortRef.current?.abort(); };
    }, [rpMentionOpen, rpMentionQuery]);

    const closeCmMention = useCallback(() => {
        setCmMentionOpen(false);
        setCmMentionQuery('');
        setCmMentionResults([]);
        setCmMentionAnchorEl(null);
    }, []);

    const closeRpMention = useCallback(() => {
        setRpMentionOpen(false);
        setRpMentionQuery('');
        setRpMentionResults([]);
        setRpMentionAnchorEl(null);
    }, []);

    // Dismiss mention dropdowns on scroll
    useEffect(() => {
        if (!cmMentionOpen) return;
        const onScroll = () => closeCmMention();
        window.addEventListener('scroll', onScroll, { passive: true, capture: true });
        return () => window.removeEventListener('scroll', onScroll, { capture: true });
    }, [cmMentionOpen, closeCmMention]);

    useEffect(() => {
        if (!rpMentionOpen) return;
        const onScroll = () => closeRpMention();
        window.addEventListener('scroll', onScroll, { passive: true, capture: true });
        return () => window.removeEventListener('scroll', onScroll, { capture: true });
    }, [rpMentionOpen, closeRpMention]);

    const insertCmMention = useCallback((handle) => {
        const el = cmInputRef.current;
        if (!el) return;
        const val = el.value || '';
        const before = val.slice(0, cmMentionStartRef.current);
        const after = val.slice(cmMentionEndRef.current);
        const inserted = `@${handle} `;
        const next = before + inserted + after;
        setCommentDraft(next);
        closeCmMention();
        requestAnimationFrame(() => {
            const pos = before.length + inserted.length;
            el.focus();
            el.setSelectionRange(pos, pos);
        });
    }, [closeCmMention]);

    const insertRpMention = useCallback((handle) => {
        const el = rpInputRef.current;
        if (!el) return;
        const val = el.value || '';
        const before = val.slice(0, rpMentionStartRef.current);
        const after = val.slice(rpMentionEndRef.current);
        const inserted = `@${handle} `;
        const next = before + inserted + after;
        setReplyDraft(next);
        closeRpMention();
        requestAnimationFrame(() => {
            const pos = before.length + inserted.length;
            el.focus();
            el.setSelectionRange(pos, pos);
        });
    }, [closeRpMention]);

    const handleCmChange = (e) => {
        const val = e.target.value;
        setCommentDraft(val);
        const cursor = e.target.selectionStart ?? val.length;
        cmMentionCaretRef.current = cursor;
        const match = getMentionMatch(val, cursor);
        if (match) {
            cmMentionStartRef.current = match.start;
            cmMentionEndRef.current = match.end;
            setCmMentionQuery(match.query);
            if (!cmMentionOpen) setCmMentionOpen(true);
            const virt = getMentionAnchorVirtualEl(e.target, cursor);
            if (virt) setCmMentionAnchorEl(virt);
        } else {
            closeCmMention();
        }
    };

    const handleRpChange = (e) => {
        const val = e.target.value;
        setReplyDraft(val);
        const cursor = e.target.selectionStart ?? val.length;
        rpMentionCaretRef.current = cursor;
        const match = getMentionMatch(val, cursor);
        if (match) {
            rpMentionStartRef.current = match.start;
            rpMentionEndRef.current = match.end;
            setRpMentionQuery(match.query);
            if (!rpMentionOpen) setRpMentionOpen(true);
            const virt = getMentionAnchorVirtualEl(e.target, cursor);
            if (virt) setRpMentionAnchorEl(virt);
        } else {
            closeRpMention();
        }
    };

    const handleCmKeyDown = (e) => {
        if (cmMentionOpen && cmMentionResults.length > 0) {
            if (e.key === 'ArrowDown') { e.preventDefault(); setCmMentionActiveIdx((i) => Math.min(i + 1, cmMentionResults.length - 1)); return; }
            if (e.key === 'ArrowUp') { e.preventDefault(); setCmMentionActiveIdx((i) => Math.max(i - 1, 0)); return; }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                const sel = cmMentionResults[cmMentionActiveIdx];
                if (sel) insertCmMention(sel.handle || sel.username);
                return;
            }
            if (e.key === 'Escape') { e.preventDefault(); closeCmMention(); return; }
        }
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submitComment();
        }
    };

    const handleRpKeyDown = (e) => {
        if (rpMentionOpen && rpMentionResults.length > 0) {
            if (e.key === 'ArrowDown') { e.preventDefault(); setRpMentionActiveIdx((i) => Math.min(i + 1, rpMentionResults.length - 1)); return; }
            if (e.key === 'ArrowUp') { e.preventDefault(); setRpMentionActiveIdx((i) => Math.max(i - 1, 0)); return; }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                const sel = rpMentionResults[rpMentionActiveIdx];
                if (sel) insertRpMention(sel.handle || sel.username);
                return;
            }
            if (e.key === 'Escape') { e.preventDefault(); closeRpMention(); return; }
        }
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submitReply();
        }
    };

    // Render a mention Popper dropdown
    const renderMentionPopper = (open, anchorEl, results, loading, activeIdx, onSelect, onClose) => (
        <Popper open={open && Boolean(anchorEl)} anchorEl={anchorEl} placement="bottom-start" sx={{ zIndex: 1500 }} modifiers={[{ name: 'offset', options: { offset: [0, 4] } }]}>
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
                        {loading && results.length === 0 ? (
                            <ListItem sx={{ py: 1 }}>
                                <ListItemText
                                    primary="Searching…"
                                    primaryTypographyProps={{ fontWeight: 800 }}
                                />
                            </ListItem>
                        ) : null}

                        {!loading && results.length === 0 ? (
                            <ListItem sx={{ py: 1 }}>
                                <ListItemText
                                    primary="No users found"
                                    primaryTypographyProps={{ fontWeight: 800 }}
                                />
                            </ListItem>
                        ) : null}

                        {!loading
                            ? results.slice(0, 4).map((r, idx) => {
                                const handle = r.handle || r.username || '';
                                const name = r.name || r.first_name || handle;
                                const avatarSrc = r.avatar_url || r.profile_picture || '';
                                return (
                                    <ListItemButton
                                        key={`${handle}-${idx}`}
                                        selected={idx === activeIdx}
                                        onClick={() => onSelect(handle)}
                                        sx={{ py: 1, px: 1.5 }}
                                    >
                                        <ListItemAvatar sx={{ minWidth: 44 }}>
                                            <Avatar src={avatarSrc || undefined} sx={{ width: 32, height: 32, ...(!avatarSrc ? { bgcolor: (t) => alpha(t.palette.primary.main, 0.08), color: 'primary.main' } : {}) }}>
                                                {!avatarSrc ? <PersonRoundedIcon fontSize="small" /> : null}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>
                                                    {name}
                                                </Typography>
                                                <MentionAccountBadge result={r} />
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

    const commentMenuOpen = Boolean(commentMenuAnchor);
    const openCommentMenu = (e, cId) => {
        e.stopPropagation();
        setCommentMenuAnchor(e.currentTarget);
        setCommentMenuId(cId);
    };
    const closeCommentMenu = () => {
        setCommentMenuAnchor(null);
        setCommentMenuId(null);
    };

    const postId = post?.id ?? null;

    const handleCopyCode = (e) => {
        if (e) e.stopPropagation();
        const code = post?.promoCode || post?.promo_code || '';
        if (code) {
            navigator.clipboard.writeText(code);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        }
    };

    const loadComments = useCallback(async () => {
        if (!postId) return;
        setCommentsLoading(true);
        setCommentsError('');
        try {
            const params = new URLSearchParams({ limit: '50', offset: '0', sort: 'oldest', ...getAccountParamsRef.current() });
            const res = await secureFetch(
                `/api/business/posts/${encodeURIComponent(String(postId))}/comments?${params.toString()}`,
                {
                    method: 'GET',
                    credentials: 'include',
                    headers: { Accept: 'application/json' },
                }
            );
            const data = await safeJson(res);
            if (!res.ok) throw new Error(data?.message || `Failed to load comments (${res.status}).`);
            const items = Array.isArray(data?.items) ? data.items : [];
            setComments(items);
            setDisplayComments(sortFlatComments(items, commentSortRef.current, undefined, scrollToCommentIdProp));
            const nextTotal = typeof data?.total === 'number' ? data.total : items.length;
            setCommentsCount(nextTotal);
            broadcastCommentCount(postId, nextTotal);
        } catch (e) {
            setCommentsError(String(e?.message || 'Failed to load comments.'));
            setComments([]);
            setDisplayComments([]);
        } finally {
            setCommentsLoading(false);
        }
    }, [postId]);

    useEffect(() => {
        setComments([]);
        setDisplayComments([]);
        setCommentsError('');
        setCommentDraft('');
        setCommentSending(false);
        setCommentsCount(initialCommentsCountRef.current);
        setReplyingToId(null);
        setReplyDraft('');
        setReplySending(false);
        setFlagState({ open: false, commentId: null });
        setDeleteConfirm({ open: false, commentId: null, isReply: false });
        setAvatarError(false);
        setCopiedCode(false);

        if (postId) {
            void loadComments();
        }
    }, [postId, loadComments]);

    // Re-fetch comments when the active account changes so viewerLiked reflects new account
    const prevAcctRef = useRef(accountCacheKey);
    useEffect(() => {
        const prev = prevAcctRef.current;
        prevAcctRef.current = accountCacheKey;
        if (prev !== accountCacheKey) {
            if (postId) {
                void loadComments();
            }
        }
    }, [accountCacheKey, postId, loadComments]);

    // Highlight a specific comment when opened from engagement tab.
    // The comment's thread is boosted to the top by sortFlatComments (focusCommentId),
    // so no scrolling is needed. The highlight persists until the user has actually
    // seen the comment (IntersectionObserver) and then fades after a short delay.
    const highlightAppliedBizRef = useRef(null);
    const highlightObserverBizRef = useRef(null);

    useEffect(() => {
        highlightAppliedBizRef.current = null;
        if (highlightObserverBizRef.current) { highlightObserverBizRef.current.disconnect(); highlightObserverBizRef.current = null; }
    }, [postId]);

    useEffect(() => {
        const targetId = scrollToCommentIdProp ?? highlightCommentIdProp;
        if (!targetId || commentsLoading || !displayComments.length) return;

        const targetKey = `${postId}:${targetId}`;
        if (highlightAppliedBizRef.current === targetKey) return;
        highlightAppliedBizRef.current = targetKey;

        // If the target is a reply, expand its parent thread so the DOM element renders
        const targetComment = displayComments.find((c) => String(c.id) === String(targetId));
        const parentId = targetComment ? Number(targetComment.parent_id || 0) : 0;
        if (parentId > 0) {
            setExpandedReplyThreads((prev) => ({ ...prev, [parentId]: true }));
        }

        // Set highlight immediately — persists until the comment is visible to the user
        setHighlightedCommentId(String(targetId));

        // Watch for the comment element to enter the viewport, then fade highlight
        const waitForEl = () => {
            const el = document.getElementById(`comment-${targetId}`);
            if (el) {
                if (highlightObserverBizRef.current) highlightObserverBizRef.current.disconnect();
                const observer = new IntersectionObserver(
                    ([entry]) => {
                        if (entry.isIntersecting) {
                            observer.disconnect();
                            highlightObserverBizRef.current = null;
                            clearTimeout(highlightTimerRef.current);
                            highlightTimerRef.current = setTimeout(() => setHighlightedCommentId(null), 1800);
                        }
                    },
                    { threshold: 0.3 }
                );
                observer.observe(el);
                highlightObserverBizRef.current = observer;
            } else {
                setTimeout(waitForEl, 200);
            }
        };
        setTimeout(waitForEl, 100);

        return () => {
            if (highlightObserverBizRef.current) { highlightObserverBizRef.current.disconnect(); highlightObserverBizRef.current = null; }
        };
    }, [postId, scrollToCommentIdProp, highlightCommentIdProp, commentsLoading, displayComments]);

    useEffect(() => {
        setDisplayComments((prev) => {
            if (!prev.length) return prev;
            return sortFlatComments(prev, commentSort);
        });
    }, [commentSort]);

    const submitComment = async () => {
        const content = String(commentDraft || '').trim();
        if (!viewerAuthed) {
            openLoginPopup();
            return;
        }
        const hasImages = commentFiles.length > 0 || commentImageUrls.length > 0;
        if (!postId || (!content && !hasImages) || commentSending) return;

        // Client-side profanity check
        if (content) {
            const profResult = checkProfanity(content);
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
        setCommentSending(true);
        setCommentsError('');
        try {
            let res;
            const acctHeaders = getAccountHeadersRef.current();
            const acctPayloadBody = getCommentPayloadRef.current();

            // Upload local image files to GCS first (deferred from selection time)
            let allImageUrls = [...commentImageUrls]; // starts with Tenor GIF URLs
            if (commentFiles.length > 0) {
                try {
                    const uploadedUrls = await uploadFilesToGCS(commentFiles);
                    if (uploadedUrls.length === 0) {
                        setCommentError('Failed to upload images. Please try again.');
                        setCommentSending(false);
                        return;
                    }
                    allImageUrls = [...uploadedUrls, ...allImageUrls];
                } catch {
                    setCommentError('Failed to upload images. Please check your connection and try again.');
                    setCommentSending(false);
                    return;
                }
            }

            res = await secureFetch(`/api/business/posts/${encodeURIComponent(String(postId))}/comments`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...acctHeaders },
                body: JSON.stringify({
                    content,
                    text: content,
                    ...acctPayloadBody,
                    ...(allImageUrls.length > 0 ? { image_urls: allImageUrls } : {}),
                }),
            });
            const data = await safeJson(res);
            if (!res.ok) throw new Error(data?.message || `Failed to post comment (${res.status}).`);

            const created = data?.comment || null;
            setCommentDraft('');
            setCommentFiles([]);
            setCommentImageUrls([]);

            // Build optimistic comment with account-aware fields
            const acctPayload = getCommentPayloadRef.current();
            const optimistic = created && created.id ? {
                ...created,
                images: allImageUrls.length > 0 ? [...allImageUrls] : [],
                ...(isBA && aBizId ? {
                    business_id: aBizId,
                    business_name: acctPayload.account_name || '',
                    business_slug: acctPayload.account_handle || '',
                    business_avatar_url: acctPayload.account_avatar_url || '',
                    account_type: 'business',
                    account_name: acctPayload.account_name || '',
                    account_handle: acctPayload.account_handle || '',
                    account_avatar_url: acctPayload.account_avatar_url || '',
                } : {}),
                ...(isAA && aArtId ? {
                    artist_id: aArtId,
                    artist_name: acctPayload.account_name || '',
                    artist_handle: acctPayload.account_handle || '',
                    artist_avatar_url: acctPayload.account_avatar_url || '',
                    account_type: 'artist',
                    account_name: acctPayload.account_name || '',
                    account_handle: acctPayload.account_handle || '',
                    account_avatar_url: acctPayload.account_avatar_url || '',
                } : {}),
            } : null;

            if (optimistic) {
                const boostSet = new Set([optimistic.id]);
                setComments((prev) => [optimistic, ...prev]);
                setDisplayComments((prev) => sortFlatComments([optimistic, ...prev], commentSortRef.current, boostSet));
                ensureCommentFadeKeyframes();
                const newId = optimistic.id;
                setNewCommentIds((prev) => new Set(prev).add(newId));
            } else {
                void loadComments();
            }

            const nextCount =
                typeof data?.commentsCount === 'number' ? data.commentsCount : Number(commentsCount || 0) + 1;

            setCommentsCount(nextCount);
            broadcastCommentCount(postId, nextCount);
        } catch (e) {
            setCommentsError(String(e?.message || 'Failed to post comment.'));
        } finally {
            setCommentSending(false);
        }
    };

    const submitReply = async () => {
        const content = String(replyDraft || '').trim();
        const parentId = replyingToId;
        const hasImages = replyFiles.length > 0 || replyImageUrls.length > 0;

        if (!viewerAuthed || !postId || (!content && !hasImages) || replySending || !parentId) return;

        // Client-side profanity check
        if (content) {
            const profResult = checkProfanity(content);
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
        setReplySending(true);
        setCommentsError('');

        try {
            let res;
            const acctHeaders = getAccountHeadersRef.current();
            const acctPayloadBody = getCommentPayloadRef.current();

            // Upload local image files to GCS first (deferred from selection time)
            let allReplyImageUrls = [...replyImageUrls]; // starts with Tenor GIF URLs
            if (replyFiles.length > 0) {
                try {
                    const uploadedUrls = await uploadFilesToGCS(replyFiles);
                    if (uploadedUrls.length === 0) {
                        setReplyError('Failed to upload images. Please try again.');
                        setReplySending(false);
                        return;
                    }
                    allReplyImageUrls = [...uploadedUrls, ...allReplyImageUrls];
                } catch {
                    setReplyError('Failed to upload images. Please check your connection and try again.');
                    setReplySending(false);
                    return;
                }
            }

            res = await secureFetch(`/api/business/posts/${encodeURIComponent(String(postId))}/comments`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...acctHeaders },
                body: JSON.stringify({
                    content,
                    text: content,
                    parent_id: parentId,
                    ...acctPayloadBody,
                    ...(allReplyImageUrls.length > 0 ? { image_urls: allReplyImageUrls } : {}),
                }),
            });
            const data = await safeJson(res);
            if (!res.ok) throw new Error(data?.message || `Failed to post reply (${res.status}).`);

            const created = data?.comment || null;
            setReplyDraft('');
            setReplyingToId(null);
            setReplyFiles([]);
            setReplyImageUrls([]);

            // Build optimistic reply with account-aware fields
            const replyAcctPayload = getCommentPayloadRef.current();
            const optimistic = created && created.id ? {
                ...created,
                parentId: parentId,
                images: allReplyImageUrls.length > 0 ? [...allReplyImageUrls] : [],
                ...(isBA && aBizId ? {
                    business_id: aBizId,
                    business_name: replyAcctPayload.account_name || '',
                    business_slug: replyAcctPayload.account_handle || '',
                    business_avatar_url: replyAcctPayload.account_avatar_url || '',
                    account_type: 'business',
                    account_name: replyAcctPayload.account_name || '',
                    account_handle: replyAcctPayload.account_handle || '',
                    account_avatar_url: replyAcctPayload.account_avatar_url || '',
                } : {}),
                ...(isAA && aArtId ? {
                    artist_id: aArtId,
                    artist_name: replyAcctPayload.account_name || '',
                    artist_handle: replyAcctPayload.account_handle || '',
                    artist_avatar_url: replyAcctPayload.account_avatar_url || '',
                    account_type: 'artist',
                    account_name: replyAcctPayload.account_name || '',
                    account_handle: replyAcctPayload.account_handle || '',
                    account_avatar_url: replyAcctPayload.account_avatar_url || '',
                } : {}),
            } : null;

            if (optimistic) {
                setComments((prev) => [...prev, optimistic]);
                setDisplayComments((prev) => [...prev, optimistic]);
                ensureCommentFadeKeyframes();
                const newId = optimistic.id;
                setNewCommentIds((prev) => new Set(prev).add(newId));
            } else {
                void loadComments();
            }

            const nextCount =
                typeof data?.commentsCount === 'number' ? data.commentsCount : Number(commentsCount || 0) + 1;

            setCommentsCount(nextCount);
            broadcastCommentCount(postId, nextCount);
        } catch (e) {
            setCommentsError(String(e?.message || 'Failed to post reply.'));
        } finally {
            setReplySending(false);
        }
    };

    const toggleCommentLike = async (commentId) => {
        if (!viewerAuthed || !postId || !commentId) return;

        const isLikerPostAuthor = viewerIsAuthor || isActingAsBizOwner;

        const optimisticUpdater = (c) => {
            if (Number(c?.id) !== Number(commentId)) return c;
            const liked = Boolean(c?.viewerLiked);
            const nextLiked = !liked;
            const nextCount = Math.max(0, Number(c?.likesCount || 0) + (nextLiked ? 1 : -1));
            return { ...c, viewerLiked: nextLiked ? 1 : 0, likesCount: nextCount, ...(isLikerPostAuthor ? { liked_by_author: nextLiked } : {}) };
        };
        setComments((prev) => prev.map(optimisticUpdater));
        setDisplayComments((prev) => prev.map(optimisticUpdater));

        try {
            const res = await secureFetch(
                `/api/business/posts/${encodeURIComponent(String(postId))}/comments/${encodeURIComponent(
                    String(commentId)
                )}/like`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...getAccountHeadersRef.current() },
                    body: JSON.stringify(getAccountPayloadRef.current()),
                }
            );
            const data = await safeJson(res);
            if (!res.ok) throw new Error(data?.message || `Failed (${res.status}).`);

            const likesCountServer = Number(data?.likesCount ?? data?.likes ?? 0) || 0;
            const viewerLikedServer = Boolean(data?.viewerLiked ?? data?.liked);

            const serverUpdater = (c) => {
                if (Number(c?.id) !== Number(commentId)) return c;
                return { ...c, viewerLiked: viewerLikedServer ? 1 : 0, likesCount: likesCountServer, ...(data?.liked_by_author !== undefined ? { liked_by_author: Boolean(data.liked_by_author) } : isLikerPostAuthor ? { liked_by_author: viewerLikedServer } : {}) };
            };
            setComments((prev) => prev.map(serverUpdater));
            setDisplayComments((prev) => prev.map(serverUpdater));
        } catch {
            void loadComments();
        }
    };

    const openFlag = (commentId) => {
        if (!viewerAuthed) return;
        setFlagState({ open: true, commentId });
    };

    const closeFlag = () => setFlagState({ open: false, commentId: null });

    const submitFlag = async ({ reason, details, setSubmitted }) => {
        const commentId = flagState.commentId;
        if (!viewerAuthed || !postId || !commentId) {
            closeFlag();
            return;
        }

        const flagUpdater = (c) => {
            if (Number(c?.id) !== Number(commentId)) return c;
            return { ...c, viewerFlagged: 1 };
        };
        setComments((prev) => prev.map(flagUpdater));
        setDisplayComments((prev) => prev.map(flagUpdater));

        const urls = [
            `/api/business/posts/${encodeURIComponent(String(postId))}/comments/${encodeURIComponent(String(commentId))}/flag`,
            `/api/community/posts/${encodeURIComponent(String(postId))}/comments/${encodeURIComponent(String(commentId))}/flag`,
            `/api/posts/${encodeURIComponent(String(postId))}/comments/${encodeURIComponent(String(commentId))}/flag`,
        ];

        let success = false;
        for (const url of urls) {
            try {
                const res = await secureFetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...getAccountHeadersRef.current() },
                    body: JSON.stringify({ reason, details }),
                });
                if (res.ok) {
                    success = true;
                    break;
                }
            } catch {
                // try next endpoint
            }
        }

        if (success) {
            if (typeof setSubmitted === 'function') setSubmitted(true);
        } else {
            closeFlag();
            void loadComments();
        }
    };

    const requestDeleteComment = (commentId, isReply = false) => {
        if (!viewerAuthed || !postId || !commentId) return;
        setDeleteConfirm({ open: true, commentId, isReply: Boolean(isReply) });
    };

    const closeDeleteConfirm = () => setDeleteConfirm({ open: false, commentId: null, isReply: false });

    const deleteComment = async (commentId) => {
        if (!viewerAuthed || !postId || !commentId) return;

        setComments((prev) => prev.filter((c) => Number(c?.id) !== Number(commentId)));
        setDisplayComments((prev) => prev.filter((c) => Number(c?.id) !== Number(commentId)));

        try {
            const res = await secureFetch(
                `/api/business/posts/${encodeURIComponent(String(postId))}/comments/${encodeURIComponent(
                    String(commentId)
                )}`,
                {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...getAccountHeadersRef.current() },
                    body: JSON.stringify(getAccountPayloadRef.current()),
                }
            );
            const data = await safeJson(res);
            if (!res.ok) throw new Error(data?.message || `Failed (${res.status}).`);

            const nextCount =
                typeof data?.commentsCount === 'number'
                    ? data.commentsCount
                    : Math.max(0, Number(commentsCount || 0) - 1);

            setCommentsCount(nextCount);
            broadcastCommentCount(postId, nextCount);

            // Notify profile engagement tabs so deleted comments are removed from the Comments tab
            try {
                window.dispatchEvent(new CustomEvent('ll:comment:deleted', { detail: { commentId: Number(commentId), postId: Number(postId) } }));
            } catch { /* ignore */ }

            // Refresh comments from the server to ensure the list is fully up-to-date
            // (also removes any orphaned replies of a deleted parent)
            setTimeout(() => { void loadComments(); }, 400);
        } catch {
            void loadComments();
        }
    };

    const confirmDelete = async () => {
        const cid = deleteConfirm.commentId;
        const wasReply = deleteConfirm.isReply;
        if (!cid) return;
        await deleteComment(cid);
        closeDeleteConfirm();
        const msg = wasReply ? 'Reply deleted successfully' : 'Comment deleted successfully';
        if (onCommentSuccess) {
            onCommentSuccess(msg);
        } else {
            showSuccess(msg);
        }
    };

    const shareComment = (commentIdOrNode) => {
        // Accept either a comment node object or a plain commentId (for backward compat)
        if (commentIdOrNode && typeof commentIdOrNode === 'object' && commentIdOrNode.id != null) {
            setShareCommentTarget(commentIdOrNode);
            setShareCommentDialogOpen(true);
            return;
        }
        // Lookup comment node from flat comments list by id
        const commentId = commentIdOrNode;
        const findNode = (nodes) => {
            for (const n of nodes) {
                if (String(n.id) === String(commentId)) return n;
                if (n.replies?.length) {
                    const found = findNode(n.replies);
                    if (found) return found;
                }
            }
            return null;
        };
        const node = findNode(comments);
        if (node) {
            setShareCommentTarget(node);
            setShareCommentDialogOpen(true);
        } else {
            // Fallback: construct minimal comment object for ShareDialog
            setShareCommentTarget({ id: commentId });
            setShareCommentDialogOpen(true);
        }
    };

    // ── Pin / Unpin comment ──
    const pinnedTopLevel = useMemo(() => comments.find((c) => Boolean(c?.is_pinned) && !c?.parentId) || null, [comments]);
    const pinnedTopLevelId = pinnedTopLevel?.id != null ? String(pinnedTopLevel.id) : null;

    const closePinConfirm = useCallback(() => {
        setPinConfirm({ open: false, commentId: null, mode: 'pin', willReplace: false });
    }, []);

    const requestTogglePinConfirm = useCallback((commentId, currentlyPinned) => {
        if (!viewerAuthed) return;
        const cid = Number(commentId);
        if (!Number.isFinite(cid) || cid <= 0) return;
        const nextMode = currentlyPinned ? 'unpin' : 'pin';
        const willReplace = nextMode === 'pin' && pinnedTopLevelId != null && String(pinnedTopLevelId) !== String(cid);
        setPinConfirm({ open: true, commentId: cid, mode: nextMode, willReplace });
    }, [viewerAuthed, pinnedTopLevelId]);

    const togglePinComment = useCallback(async (commentId, unpin = false) => {
        if (!viewerAuthed || !canManagePost || !postId) return;
        const cid = Number(commentId);
        if (!Number.isFinite(cid) || cid <= 0) return;

        const newPinState = !unpin;

        // Optimistic update — toggle pin and re-sort pinned first
        const pinUpdater = (c) => {
            if (Number(c?.id) === cid) {
                return { ...c, is_pinned: newPinState, pinned_at: newPinState ? new Date().toISOString() : null };
            }
            if (newPinState && !c?.parentId && Boolean(c?.is_pinned)) {
                return { ...c, is_pinned: false, pinned_at: null };
            }
            return c;
        };
        setComments((prev) => prev.map(pinUpdater));
        setDisplayComments((prev) => sortFlatComments(prev.map(pinUpdater), commentSortRef.current));

        const action = unpin ? 'unpin' : 'pin';
        try {
            const res = await secureFetch(
                `/api/business/posts/${encodeURIComponent(String(postId))}/comments/${encodeURIComponent(String(cid))}/${action}`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...getAccountHeadersRef.current() },
                    body: JSON.stringify(getAccountPayloadRef.current()),
                }
            );
            if (!res.ok) {
                // Revert on failure
                void loadComments();
            }
        } catch {
            void loadComments();
        }
    }, [viewerAuthed, canManagePost, postId, loadComments]);

    const confirmTogglePin = useCallback(async () => {
        if (!pinConfirm.commentId) return;
        await togglePinComment(pinConfirm.commentId, pinConfirm.mode === 'unpin');
        closePinConfirm();
    }, [pinConfirm.commentId, pinConfirm.mode, togglePinComment, closePinConfirm]);


    const outerSx = embedded
        ? { width: '100%', maxWidth: 'none', mx: 0, px: 0, py: 0 }
        : { width: '100%', maxWidth: 900, mx: 'auto', px: { xs: 1.25, sm: 2 }, py: { xs: 1.5, sm: 3 } };

    const mainContent = (
        <Box sx={{ width: '100%' }}>
            {/* IMPORTANT: when embedded inside the right-rail panel, the panel provides the tabs + View Page row.
          So we hide this header to avoid the duplicated "Posts" pill + duplicate View Page button. */}
            {!embedded && !isMobile ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ flex: 1 }} />
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<OpenInNewRoundedIcon />}
                        disabled={!pageSlug || !postId}
                        onClick={() => {
                            if (pageSlug && postId) {
                                navigate(`/${pageSlug}/posts/${postId}`, {
                                    state: { post, from: 'businessHub' },
                                });
                            } else {
                                onViewPage?.(pageSlug, postId);
                            }
                        }}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, whiteSpace: 'nowrap' }}
                    >
                        View Post Page
                    </Button>
                </Box>
            ) : null}

            {/* Header row with larger avatar and username */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Box
                    onClick={(e) => {
                        e.stopPropagation();
                        setUserCardAnchor(e.currentTarget);
                    }}
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'flex-start',
                        gap: 1.5,
                        cursor: 'pointer',
                        borderRadius: 2,
                        p: 0.75,
                        m: -0.75,
                        transition: (t) => `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                        '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.04) },
                        minWidth: 0,
                        maxWidth: '100%',
                    }}
                >
                    <Avatar
                        src={hasValidAvatar ? rawAvatar : undefined}
                        onError={() => setAvatarError(true)}
                        sx={{
                            width: { xs: 64, sm: 72 },
                            height: { xs: 64, sm: 72 },
                            borderRadius: '50%',
                            border: '2px solid',
                            borderColor: alpha(theme.palette.primary.main, 0.15),
                            bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                            color: 'primary.main',
                            fontWeight: 900,
                            flexShrink: 0,
                            fontSize: 24,
                        }}
                    >
                        <StorefrontOutlinedIcon sx={{ fontSize: 32 }} />
                    </Avatar>

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap">
                            <Typography variant="subtitle1" sx={(t) => ({ ...t.custom.postDetail.authorName })} noWrap>
                                {pageName}
                            </Typography>
                        </Stack>

                        {/* Category chip — shown under title on mobile only */}
                        <Chip
                            icon={<BizCategoryIconComp sx={{ fontSize: '14px !important' }} />}
                            size="small"
                            label={bizCategoryLabel || 'Business'}
                            sx={(t) => ({
                                height: 22,
                                borderRadius: 999,
                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                color: t.palette.primary.main,
                                fontWeight: 800,
                                fontSize: 11,
                                border: '1px solid',
                                borderColor: alpha(t.palette.primary.main, 0.25),
                                display: { xs: 'flex', md: 'none' },
                                mt: 0.5,
                                width: 'fit-content',
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

                        {pageSlug && (
                            <Typography variant="body2" color="text.secondary" sx={(t) => ({ ...t.custom.postDetail.authorHandle, mt: 0.25 })}>
                                @{pageSlug}
                            </Typography>
                        )}

                        {timestamp && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                                <Typography variant="caption" color="text.secondary">
                                    {timeAgoCompact(timestamp)}
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

                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
                    {/* Category chip — hidden on mobile (shown under title instead) */}
                    <Chip
                        icon={<BizCategoryIconComp sx={{ fontSize: '14px !important' }} />}
                        size="small"
                        label={bizCategoryLabel || 'Business'}
                        sx={(t) => ({
                            height: 24,
                            borderRadius: 999,
                            bgcolor: alpha(t.palette.primary.main, 0.08),
                            color: t.palette.primary.main,
                            fontWeight: 800,
                            fontSize: 11,
                            border: '1px solid',
                            borderColor: alpha(t.palette.primary.main, 0.25),
                            display: { xs: 'none', md: 'flex' },
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
                    {/* 3-dot post menu */}
                    <Tooltip title="Options">
                        <IconButton
                            size="small"
                            onClick={openPostMenu}
                            sx={{ flexShrink: 0, color: 'text.secondary' }}
                        >
                            <MoreVertIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>

                    <SmartMenu
                        anchorEl={postMenuEl}
                        open={postMenuOpen}
                        onClose={closePostMenu}
                        disableScrollLock
                        onClick={(e) => e.stopPropagation()}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        PaperProps={{ sx: { mt: 0.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: (t) => t.custom?.shadows?.lg || `0 12px 40px ${alpha(t.palette.text.primary, 0.15)}`, minWidth: 200, py: 0.5 } }}
                    >
                        <MenuItem onClick={handleCopyPostLink} sx={{ py: 1 }}>
                            <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Copy link" />
                        </MenuItem>

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
                                        : <PushPinRoundedIcon fontSize="small" />}
                                </ListItemIcon>
                                <ListItemText primary={isPostPinned ? 'Unpin post' : 'Pin post'} />
                            </MenuItem>
                        )}

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
                                onClick={(e) => { e.stopPropagation(); closePostMenu(e); setDeletePostConfirm(true); }}
                                sx={{ py: 1, color: 'error.main' }}
                            >
                                <ListItemIcon sx={{ color: 'error.main' }}><DeleteRoundedIcon fontSize="small" /></ListItemIcon>
                                <ListItemText primary="Delete post" />
                            </MenuItem>
                        )}

                        {!isLinkedToBusiness && (
                            <>
                                <Divider sx={{ my: 0.5 }} />
                                <MenuItem onClick={handleReportPostClick} sx={{ py: 1 }}>
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
            {title ? (
                <Typography variant="h5" sx={(t) => ({ mt: 1.5, wordBreak: 'break-word', ...t.custom.postDetail.title })}>
                    {title}
                </Typography>
            ) : null}

            {/* Announcement box — same accent-bar style as deal box */}
            {postType === 'announcement' && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        mt: 1.5,
                        bgcolor: alpha(theme.palette.info.main, 0.06),
                        borderRadius: 3,
                        borderLeft: '4px solid',
                        borderLeftColor: theme.palette.info.main,
                    }}
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
            {isDeal && (discountText || dealExpired) && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        mt: 1.5,
                        bgcolor: dealExpired
                            ? alpha(theme.palette.grey[500], 0.06)
                            : alpha(theme.palette.success.main, 0.06),
                        borderRadius: 3,
                        borderLeft: '4px solid',
                        borderLeftColor: dealExpired ? 'grey.400' : 'success.main',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
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
                            {discountText || 'Deal'}
                        </Typography>
                    </Stack>
                    {promoCode && !dealExpired && (
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.25 }}>
                            <Chip
                                label={promoCode}
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
                    {validUntil && (
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                            <ScheduleIcon sx={{ fontSize: 14, color: dealExpired ? 'error.main' : 'text.secondary' }} />
                            <Typography variant="caption" color={dealExpired ? 'error.main' : 'text.secondary'} fontWeight={600}>
                                {dealExpired ? 'Expired' : `Valid until ${formatDate(validUntil)}`}
                            </Typography>
                        </Stack>
                    )}
                </Paper>
            )}

            {/* Deal expired badge (standalone) */}
            {dealExpired && !discountText && (
                <Chip
                    label="Expired"
                    size="small"
                    sx={{ mt: 1.5, height: 24, fontSize: '0.7rem', fontWeight: 600, bgcolor: 'error.light', color: 'error.contrastText' }}
                />
            )}

            {/* Body text - above photos */}
            {body ? (
                <Box sx={{ mt: 1.5, position: "relative" }}>
                    <Box sx={{ maxHeight: bodyExpanded ? "none" : 160, overflowY: bodyExpanded ? "visible" : "hidden", position: "relative" }}>
                        <RichTextDisplay html={body} />
                    </Box>
                    {!bodyExpanded && (body || "").length > 300 && (
                        <Box sx={{
                            position: "absolute", bottom: 0, left: 0, right: 0, height: 64,
                            background: (t) => `linear-gradient(to bottom, ${alpha(t.palette.background.paper, 0)} 0%, ${t.palette.background.paper} 85%)`,
                            pointerEvents: "none",
                        }} />
                    )}
                    {(body || "").length > 300 && (
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
            ) : null}

            {/* Deal terms */}
            {isDeal && dealTerms && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    * {dealTerms}
                </Typography>
            )}

            {/* Image slideshow */}
            {photos.length > 0 && <Carousel photos={photos} />}

            {/* Location (after content, matching MusicPostDetailPanel) */}
            {hasLocation && (
                <>
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                        <LocationOnRoundedIcon sx={(t) => ({ fontSize: t.custom.postDetail.locationIcon.fontSize, color: 'primary.main', mt: t.custom.postDetail.locationIcon.mt })} />
                        <Box>
                            {businessAddress && (
                                <Typography
                                    variant="body2"
                                    sx={(t) => ({ ...t.custom.postDetail.locationText, color: 'primary.main' })}
                                >
                                    {businessAddress}
                                </Typography>
                            )}
                            {locationCityCounty && (
                                <Typography
                                    variant="body2"
                                    sx={(t) => ({ ...t.custom.postDetail.locationSecondary, color: 'primary.main', fontSize: businessAddress ? '0.8rem' : undefined })}
                                >
                                    {locationCityCounty}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </>
            )}

            <Divider sx={{ my: 1.5 }} />

            {/* View full post page button (when embedded) */}
            {afterActionBarSlot && !isMobile ? (
                <Box sx={{ mb: 1.5 }}>
                    {afterActionBarSlot}
                </Box>
            ) : null}

            {/* Action Bar — matches MusicPostDetailPanel */}
            <Box sx={(t) => ({ p: 1, borderRadius: 1.5, border: '1px solid', borderColor: alpha(t.palette.primary.main, 0.14), bgcolor: 'background.paper', backgroundImage: 'none', boxShadow: t.custom?.shadows?.xs || 'none' })}>
                <ActionBar
                    variant="business"
                    user={viewer}
                    postId={post?.id}
                    post={post}
                    initialLikes={likes}
                    initiallyLiked={viewerLiked}
                    commentsCount={commentsCount}
                    initialReposts={reposts}
                    initiallyReposted={viewerReposted}
                    showBoost
                    useShareDialog
                    onComment={() => {
                        const anchor = document.getElementById('business-comments-composer');
                        if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                />
            </Box>

            {/* View Post Page link (full-width, matching community PostDetailModal) */}
            {pageSlug && postId && !isMobile ? (
                <Button
                    variant="outlined"
                    fullWidth
                    endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 18 }} />}
                    onClick={() => {
                        try {
                            sessionStorage.setItem('ll:business:url', window.location.pathname + window.location.search);
                            sessionStorage.setItem('ll:business:navigatedToPost', '1');
                        } catch { /* ignore */ }
                        navigate(`/${pageSlug}/posts/${postId}`, {
                            state: { post, from: 'businessHub' },
                        });
                    }}
                    sx={(t) => ({
                        mt: 1.25,
                        ...(t.custom?.postDetail?.viewPageButton || {}),
                        textTransform: 'none',
                        borderColor: alpha(t.palette.primary.main, 0.25),
                        color: 'primary.main',
                        fontWeight: 700,
                        '&:hover': {
                            borderColor: t.palette.primary.main,
                            bgcolor: alpha(t.palette.primary.dark, 0.04),
                        },
                    })}
                >
                    View Post Page
                </Button>
            ) : null}

            {/* Composer OR login prompt */}
            {viewerAuthed ? (
                <Box
                    id="business-comments-composer"
                    sx={{ mt: 2, display: 'flex', alignItems: 'flex-start', gap: 1, flexWrap: 'nowrap' }}
                >
                    <AccountAvatar
                        src={viewerAvatarUrl}
                        accountType={viewerAccountType}
                        profileType={viewerProfileType}
                        alt={viewerLabel || 'You'}
                        size={{ xs: 36, sm: 44 }}
                    />

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <TextField
                            fullWidth
                            multiline
                            minRows={1}
                            maxRows={6}
                            label={`Leave a comment as ${viewerLabel}`}
                            placeholder="Write a comment…"
                            variant="outlined"
                            value={commentDraft}
                            onChange={(e) => {
                                handleCmChange(e);
                                if (commentError) setCommentError('');
                            }}
                            onKeyDown={handleCmKeyDown}
                            inputRef={cmInputRef}
                            error={Boolean(commentError)}
                            helperText={commentError}
                            InputProps={{
                                endAdornment: (
                                    <IconButton
                                        aria-label="Send comment"
                                        disabled={!viewerAuthed || commentSending || (!String(commentDraft || '').trim() && commentFiles.length === 0 && commentImageUrls.length === 0)}
                                        onClick={submitComment}
                                        sx={(t) => ({
                                            ml: 0.5,
                                            bgcolor: alpha(t.palette.primary.main, 0.10),
                                            color: alpha(t.palette.text.primary, 0.70),
                                            width: 38,
                                            height: 38,
                                            borderRadius: 2,
                                            '&.Mui-disabled': { opacity: 0.45 },
                                        })}
                                    >
                                        <ArrowForwardRoundedIcon />
                                    </IconButton>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    alignItems: 'flex-end',
                                },
                            }}
                        />

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
                            disabled={commentSending}
                        />

                        {renderMentionPopper(cmMentionOpen, cmMentionAnchorEl, cmMentionResults, cmMentionLoading, cmMentionActiveIdx, insertCmMention, closeCmMention)}
                    </Box>
                </Box>
            ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    You need to{' '}
                    <Link
                        href="/login"
                        onClick={openLoginPopup}
                        underline="hover"
                    >
                        log in
                    </Link>{' '}
                    to comment.
                </Typography>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, mb: 1 }}>
                <Typography variant="h6" sx={(t) => t.custom.postDetail.commentsHeading}>
                    Comments
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Link component="button" type="button" underline="none" onClick={() => setCommentSort('popular')}
                          sx={{ fontSize: 12, fontWeight: commentSort === 'popular' ? 800 : 600, color: commentSort === 'popular' ? 'primary.main' : 'text.secondary', cursor: 'pointer', px: 0.75, py: 0.25, borderRadius: 1, bgcolor: commentSort === 'popular' ? (t) => alpha(t.palette.primary.main, 0.08) : 'transparent', '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.06) } }}>
                        Popular
                    </Link>
                    <Link component="button" type="button" underline="none" onClick={() => setCommentSort('newest')}
                          sx={{ fontSize: 12, fontWeight: commentSort === 'newest' ? 800 : 600, color: commentSort === 'newest' ? 'primary.main' : 'text.secondary', cursor: 'pointer', px: 0.75, py: 0.25, borderRadius: 1, bgcolor: commentSort === 'newest' ? (t) => alpha(t.palette.primary.main, 0.08) : 'transparent', '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.06) } }}>
                        Newest
                    </Link>
                </Box>
            </Box>

            {commentsError ? (
                <Typography color="error" sx={{ fontWeight: 700, mb: 1 }}>
                    {commentsError}
                </Typography>
            ) : null}

            {commentsLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Box key={`c-skel-${i}`} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                            <Skeleton variant="circular" width={44} height={44} />
                            <Box sx={{ flex: 1 }}>
                                <Skeleton variant="text" width="35%" />
                                <Skeleton variant="text" width="90%" />
                            </Box>
                        </Box>
                    ))}
                </Box>
            ) : comments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <ChatBubbleOutlineRoundedIcon sx={(t) => t.custom.postDetail.noCommentsIcon} />
                    <Typography sx={(t) => t.custom.postDetail.noCommentsText}>
                        No comments yet. Be the first!
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    {(() => {
                        const byParent = new Map();
                        displayComments.forEach((c) => {
                            const p = c?.parentId ? Number(c.parentId) : 0;
                            if (!byParent.has(p)) byParent.set(p, []);
                            byParent.get(p).push(c);
                        });

                        const top = byParent.get(0) || [];
                        const sortAsc = (a, b) => new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0);

                        const MAX_VISUAL_DEPTH = 2;

                        const renderComment = (c, depth, parentName, parentHandle, parentId) => {
                            const name = c?.business_name
                                ? c.business_name
                                : c?.artist_name
                                    ? c.artist_name
                                    : c?.account_name
                                        ? c.account_name
                                        : (`${String(c?.firstName || c?.first_name || '').trim()} ${String(c?.lastName || c?.last_name || '').trim()}`.trim() ||
                                            (c?.handle ? `@${c.handle}` : 'User'));

                            const displayHandle = c?.business_slug
                                ? c.business_slug
                                : c?.artist_handle
                                    ? c.artist_handle
                                    : c?.account_handle
                                        ? c.account_handle
                                        : (c?.handle || '');

                            // Determine account type for avatar fallback icon (matching PostPage pattern)
                            const isBusinessComment = Boolean(c?.business_id || c?.business_name || c?.account_type === 'business');
                            const isArtistComment = Boolean(c?.artist_id || c?.artist_name || c?.account_type === 'artist');
                            const commentAccountType = isBusinessComment ? 'business'
                                : isArtistComment ? 'artist'
                                    : 'personal';
                            // Sub-type for artist commenters — musicians vs visual artists.
                            // Backend returns `profile_type` on each comment ('music' | 'artist').
                            // Defaults to music-note fallback when the field is absent (legacy rows).
                            const commentProfileType = String(c?.profile_type || c?.profileType || '').toLowerCase();
                            const isVisualArtistComment = isArtistComment && commentProfileType === 'artist';

                            // For business/artist: use their specific avatar, then account_avatar_url.
                            // NEVER fall back to c.avatar_url — that's the personal profile pic from the users table.
                            // For normal users: use c.avatar_url (personal pic).
                            // (Matches PostPage ThreadedCommentItem pattern exactly)
                            const avatar = (() => {
                                if (isBusinessComment) {
                                    return (c.business_avatar_url || c.account_avatar_url || '').trim();
                                }
                                if (isArtistComment) {
                                    return (c.artist_avatar_url || c.account_avatar_url || '').trim();
                                }
                                const personalAv = String(c?.avatar_url || c?.avatarUrl || '').trim();
                                if (personalAv && personalAv !== 'null' && personalAv !== 'undefined'
                                    && !personalAv.includes('default_avatar') && !personalAv.includes('default_business') && !personalAv.includes('default_logo')) return personalAv;
                                return '';
                            })();

                            const liked = Boolean(c?.viewerLiked);
                            const flagged = Boolean(c?.viewerFlagged);
                            const likesCountLocal = Number(c?.likesCount || 0) || 0;

                            const commentUserId = c?.userId != null ? String(c.userId) : '';
                            // "Author" = comment was posted by the same entity that authored the post.
                            // For business posts the author is the business, not the human user —
                            // so match comment's business_id against the post's business page id.
                            const isAuthor = (() => {
                                if (postBizId) {
                                    const commentBizId = Number(c?.business_id || 0);
                                    return commentBizId > 0 && String(commentBizId) === String(postBizId);
                                }
                                return Boolean(postAuthorId && commentUserId && postAuthorId === commentUserId);
                            })();

                            // Viewer can delete their own comment (account-aware) or any comment if they manage the post.
                            // Account-aware "own comment": if the comment was posted from a business account,
                            // the viewer must be on that same business account to claim ownership.
                            const commentBizId = Number(c?.business_id || 0);
                            const commentArtId = Number(c?.artist_id || 0);
                            const isOwnComment = (() => {
                                if (Number(c?.userId) !== Number(viewer?.id)) return false;
                                // Comment posted from a business account — viewer must be on that business
                                if (commentBizId > 0) return isBA && Number(aBizId) === commentBizId;
                                // Comment posted from an artist account — viewer must be on that artist
                                if (commentArtId > 0) return isAA && Number(aArtId) === commentArtId;
                                // Comment posted from personal account — viewer must be on personal
                                return !isBA && !isAA;
                            })();
                            // Use the viewer's LIVE avatar for their own comments so profile pic changes show immediately.
                            const displayAvatar = (isOwnComment && viewerAvatarUrl) ? viewerAvatarUrl : avatar;
                            const canDelete = Boolean(
                                c?.canDelete || (viewerAuthed && (canManagePost || isOwnComment))
                            );

                            const isPinned = Boolean(c?.is_pinned);
                            const canPin = Boolean(canManagePost && depth === 0);

                            const replies = (byParent.get(Number(c?.id || 0)) || []).slice().sort(sortAsc);
                            const hasReplies = replies.length > 0;
                            const isReplyThreadExpanded = Boolean(expandedReplyThreads[c.id]);

                            const shouldIndent = depth > 0 && depth <= MAX_VISUAL_DEPTH;

                            const isCommentVerified = Boolean(
                                c?.business_name || c?.business_id || c?.is_verified
                            );

                            // Blocked user check
                            const cUserId = Number(c?.userId || c?.user_id || 0);
                            const cBizId = Number(c?.business_id || 0);
                            const cArtId = Number(c?.artist_id || 0);
                            const cHandle = (c?.handle || c?.business_slug || c?.artist_handle || c?.account_handle || '').toLowerCase().trim();
                            const isBlockedComment = (
                                isCommentBlocked(c, { blockedUserIds, blockedBusinessIds, blockedArtistIds, blockedHandles })
                            );

                            if (isBlockedComment) {
                                const isShown = shownBlockedIds.has(Number(c.id));
                                if (!isShown) {
                                    return (
                                        <BlockedCommentPlaceholder
                                            key={c.id}
                                            commentId={c.id}
                                            depth={depth}
                                            shouldIndent={shouldIndent}
                                            highlightedCommentId={highlightedCommentId}
                                            replies={replies}
                                            renderComment={renderComment}
                                            parentName={name}
                                            parentHandle={displayHandle}
                                            onShow={handleShowBlocked}
                                        />
                                    );
                                }
                                // If shown, fall through to normal rendering with blocked label
                            }

                            const showBlockedLabel = isBlockedComment && shownBlockedIds.has(Number(c.id));

                            return (
                                <React.Fragment key={c.id}>
                                    <Box
                                        id={`comment-${c.id}`}
                                        sx={{
                                            pl: shouldIndent ? { xs: 1.25, sm: 2 } : 0,
                                            borderLeft: shouldIndent ? (t) => `2px solid ${alpha(t.palette.common.black, 0.08)}` : 'none',
                                            ml: shouldIndent ? 1 : 0,
                                            ...(String(highlightedCommentId) === String(c.id) ? {
                                                bgcolor: (t) => alpha('#A87822', 0.08),
                                                borderRadius: 2.5,
                                                border: '2px solid',
                                                borderColor: (t) => `${alpha('#A87822', 0.45)}`,
                                                boxShadow: (t) => `0 0 16px ${alpha('#A87822', 0.15)}`,
                                                px: 1.5,
                                                my: 0.5,
                                                transition: 'background-color 0.6s ease, border-color 0.6s ease, box-shadow 0.6s ease',
                                            } : {}),
                                            ...(newCommentIds.has(c.id) ? NEW_COMMENT_FADE_SX : {}),
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', py: 1.25 }}>
                                            <Avatar
                                                src={displayAvatar || undefined}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const cardUser = {
                                                        id: c?.userId || c?.user_id,
                                                        first_name: name,
                                                        last_name: '',
                                                        handle: displayHandle,
                                                        avatar_url: commentAccountType === 'business' ? '' : avatar,
                                                        account_type: commentAccountType,
                                                        ...(commentAccountType === 'business' ? {
                                                            isBusiness: true,
                                                            business_id: c?.business_id,
                                                            business_name: c?.business_name || name,
                                                            business_slug: c?.business_slug || displayHandle,
                                                            business_avatar_url: avatar,
                                                        } : {}),
                                                        ...(commentAccountType === 'artist' ? {
                                                            isArtist: true,
                                                            artist_id: c?.artist_id,
                                                            artist_name: c?.artist_name || name,
                                                            artist_handle: c?.artist_handle || displayHandle,
                                                            artist_avatar_url: avatar,
                                                        } : {}),
                                                    };
                                                    setCommentUserForCard(cardUser);
                                                    setCommentUserAnchor(e.currentTarget);
                                                }}
                                                sx={(t) => ({
                                                    width: { xs: 36, sm: 44 },
                                                    height: { xs: 36, sm: 44 },
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    cursor: 'pointer',
                                                    transition: `box-shadow ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                                    '&:hover': { boxShadow: t.custom.shadows.xs },
                                                    ...(!avatar && commentAccountType === 'business' ? {
                                                        bgcolor: alpha(t.palette.primary.main, 0.08),
                                                        color: t.palette.primary.main,
                                                    } : {}),
                                                    ...(!avatar && commentAccountType === 'artist' ? {
                                                        bgcolor: alpha(t.palette.primary.main, 0.08),
                                                        color: t.palette.primary.main,
                                                    } : {}),
                                                    ...(!avatar && commentAccountType !== 'business' && commentAccountType !== 'artist' ? {
                                                        bgcolor: alpha(t.palette.primary.main, 0.08),
                                                        color: t.palette.primary.main,
                                                    } : {}),
                                                })}
                                            >
                                                {!avatar && commentAccountType === 'business' && <StorefrontOutlinedIcon sx={{ fontSize: 22 }} />}
                                                {!avatar && commentAccountType === 'artist' && isVisualArtistComment && <PaletteRoundedIcon sx={{ fontSize: 22 }} />}
                                                {!avatar && commentAccountType === 'artist' && !isVisualArtistComment && <MusicNoteRoundedIcon sx={{ fontSize: 22 }} />}
                                                {!avatar && commentAccountType !== 'business' && commentAccountType !== 'artist' && <PersonRoundedIcon sx={{ fontSize: 22 }} />}
                                            </Avatar>

                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                {/* "Replying to [Name]'s comment" label for replies */}
                                                {depth > 0 && parentName ? (
                                                    <Typography variant="caption"
                                                                sx={{ color: 'text.secondary', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}
                                                    >
                                                        <Box component="span" sx={{ color: 'primary.main' }}>↳</Box>
                                                        Replying to {parentName}&apos;s{' '}
                                                        <Box
                                                            component="span"
                                                            onClick={(e) => { e.stopPropagation(); if (parentId) scrollToComment(parentId); }}
                                                            sx={{ color: 'primary.main', fontWeight: 700, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                                        >
                                                            comment
                                                        </Box>
                                                    </Typography>
                                                ) : null}

                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, flexWrap: 'nowrap' }}>
                                                    <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.25 }}>
                                                        <Box sx={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                                            <Typography
                                                                variant="subtitle2"
                                                                sx={{ fontWeight: 700, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                                                noWrap
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const cardUser = {
                                                                        id: c?.userId || c?.user_id,
                                                                        first_name: name,
                                                                        last_name: '',
                                                                        handle: displayHandle,
                                                                        avatar_url: commentAccountType === 'business' ? '' : avatar,
                                                                        account_type: commentAccountType,
                                                                        ...(commentAccountType === 'business' ? {
                                                                            isBusiness: true,
                                                                            business_id: c?.business_id,
                                                                            business_name: c?.business_name || name,
                                                                            business_slug: c?.business_slug || displayHandle,
                                                                            business_avatar_url: avatar,
                                                                        } : {}),
                                                                        ...(commentAccountType === 'artist' ? {
                                                                            isArtist: true,
                                                                            artist_id: c?.artist_id,
                                                                            artist_name: c?.artist_name || name,
                                                                            artist_handle: c?.artist_handle || displayHandle,
                                                                            artist_avatar_url: avatar,
                                                                        } : {}),
                                                                    };
                                                                    setCommentUserForCard(cardUser);
                                                                    setCommentUserAnchor(e.currentTarget);
                                                                }}
                                                            >
                                                                {name}
                                                            </Typography>
                                                            {isAuthor && (
                                                                <Chip size="small" label="Author"
                                                                      sx={(t) => ({ height: 18, fontSize: 10, fontWeight: 800, ml: 0.25, bgcolor: alpha(t.palette.primary.main, 0.10), color: t.palette.primary.main, border: '1px solid', borderColor: alpha(t.palette.primary.main, 0.24), '& .MuiChip-label': { px: 0.5 } })} />
                                                            )}
                                                            {isPinned && depth === 0 && (
                                                                <Chip size="small" icon={<PushPinRoundedIcon sx={{ fontSize: 11 }} />} label="Pinned"
                                                                      sx={(t) => ({ height: 18, fontSize: 10, fontWeight: 800, ml: 0.25, bgcolor: alpha(t.palette.secondary.main, 0.10), color: t.palette.secondary.main, border: '1px solid', borderColor: alpha(t.palette.secondary.main, 0.24), '& .MuiChip-icon': { ml: '2px', mr: '0px', color: t.palette.secondary.main }, '& .MuiChip-label': { px: 0.5 } })} />
                                                            )}
                                                            {c?.createdAt ? (
                                                                <>
                                                                    <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                                                                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                                                        {timeAgoCompact(c.createdAt)}
                                                                    </Typography>
                                                                </>
                                                            ) : null}
                                                            {Boolean(c?.liked_by_author) && !isAuthor && (
                                                                <Chip size="small" icon={<FavoriteRoundedIcon sx={{ fontSize: 10 }} />} label="by author"
                                                                      sx={(t) => ({ height: 18, fontSize: 10, fontWeight: 800, ml: 0.25, bgcolor: alpha(t.palette.error.main, 0.08), color: t.palette.error.main, border: '1px solid', borderColor: alpha(t.palette.error.main, 0.18), '& .MuiChip-icon': { ml: '2px', mr: '-2px', color: t.palette.error.main }, '& .MuiChip-label': { px: 0.5 } })} />
                                                            )}
                                                            {showBlockedLabel && (
                                                                <>
                                                                    <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                                                                    <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.disabled', whiteSpace: 'nowrap' }}>
                                                                        {depth > 0 ? 'Reply made by a blocked user' : 'Comment made by a blocked user'}
                                                                    </Typography>
                                                                    <Link component="button" type="button" underline="hover"
                                                                          onClick={(e) => { e.stopPropagation(); handleHideBlocked(c.id); }}
                                                                          sx={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', ml: 0.25 }}>Hide</Link>
                                                                </>
                                                            )}
                                                        </Box>
                                                        {displayHandle ? (
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                sx={{ lineHeight: 1.2, mt: 0.1, whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                                                noWrap
                                                            >
                                                                @{displayHandle}
                                                            </Typography>
                                                        ) : null}
                                                    </Box>

                                                    {/* Unpin quick-action + 3-dot menu */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                                                        {canPin && isPinned ? (
                                                            <Tooltip title="Unpin comment" placement="top">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => requestTogglePinConfirm(c.id, true)}
                                                                    sx={{
                                                                        borderRadius: 2,
                                                                        bgcolor: (t) => alpha(t.palette.warning.main, 0.10),
                                                                        border: (t) => `1px solid ${alpha(t.palette.warning.main, 0.28)}`,
                                                                        '&:hover': { bgcolor: (t) => alpha(t.palette.warning.main, 0.16) },
                                                                    }}
                                                                >
                                                                    <PushPinRoundedIcon
                                                                        fontSize="small"
                                                                        sx={{ color: 'warning.main' }}
                                                                    />
                                                                </IconButton>
                                                            </Tooltip>
                                                        ) : null}
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => openCommentMenu(e, c.id)}
                                                            sx={{ flexShrink: 0, color: 'text.secondary' }}
                                                        >
                                                            <MoreVertIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Box>
                                                </Box>

                                                <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, mt: 0.5, wordBreak: 'break-word' }}>
                                                    {renderCommentText(c?.content || c?.text || '')}
                                                </Typography>

                                                {/* Comment images / GIFs */}
                                                {(c?.images?.length > 0 || c?.image) ? (
                                                    <CommentImages images={c.images} image={c.image} />
                                                ) : null}

                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.75 }}>
                                                    <Link
                                                        component="button"
                                                        type="button"
                                                        underline="none"
                                                        onClick={() => toggleCommentLike(c.id)}
                                                        disabled={!viewerAuthed}
                                                        sx={{ fontSize: 13, fontWeight: liked ? 900 : 700, color: liked ? 'primary.main' : 'text.secondary', cursor: viewerAuthed ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: 0.5, p: 0 }}
                                                    >
                                                        {liked ? <FavoriteRoundedIcon sx={{ fontSize: 15 }} /> : <FavoriteBorderRoundedIcon sx={{ fontSize: 15 }} />} {likesCountLocal > 0 ? likesCountLocal : 'Like'}
                                                    </Link>

                                                    <Link
                                                        component="button"
                                                        type="button"
                                                        underline="none"
                                                        onClick={() => {
                                                            if (!viewerAuthed) return;
                                                            setReplyingToId((prev) => (Number(prev) === Number(c.id) ? null : c.id));
                                                            setReplyDraft('');
                                                            setReplyFiles([]);
                                                            setReplyImageUrls([]);
                                                        }}
                                                        sx={{ fontSize: 13, fontWeight: 700, color: 'text.secondary', cursor: viewerAuthed ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: 0.5, p: 0 }}
                                                    >
                                                        <ReplyRoundedIcon sx={{ fontSize: 16, transform: 'scaleX(-1)' }} /> Reply
                                                    </Link>

                                                    <Link
                                                        component="button"
                                                        type="button"
                                                        underline="none"
                                                        onClick={() => shareComment(c)}
                                                        sx={{ fontSize: 13, fontWeight: 700, color: 'text.secondary', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 0.5, p: 0 }}
                                                    >
                                                        <ShareOutlinedIcon sx={{ fontSize: 14 }} /> Share
                                                    </Link>
                                                </Box>

                                                {viewerAuthed && Number(replyingToId) === Number(c.id) ? (
                                                    <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
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
                                                                minRows={1}
                                                                maxRows={6}
                                                                value={replyDraft}
                                                                onChange={(e) => {
                                                                    handleRpChange(e);
                                                                    if (replyError) setReplyError('');
                                                                }}
                                                                onKeyDown={handleRpKeyDown}
                                                                inputRef={rpInputRef}
                                                                placeholder={`Reply to ${name}…`}
                                                                error={Boolean(replyError)}
                                                                helperText={replyError}
                                                                InputProps={{
                                                                    endAdornment: (
                                                                        <IconButton
                                                                            aria-label="Send reply"
                                                                            disabled={replySending || (!String(replyDraft || '').trim() && replyFiles.length === 0 && replyImageUrls.length === 0)}
                                                                            onClick={submitReply}
                                                                            sx={(t) => ({
                                                                                ml: 0.5,
                                                                                bgcolor: alpha(t.palette.primary.main, 0.10),
                                                                                color: alpha(t.palette.text.primary, 0.70),
                                                                                width: 38,
                                                                                height: 38,
                                                                                borderRadius: 2,
                                                                                '&.Mui-disabled': { opacity: 0.45 },
                                                                            })}
                                                                        >
                                                                            <ArrowForwardRoundedIcon />
                                                                        </IconButton>
                                                                    ),
                                                                }}
                                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                            />

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
                                                                disabled={replySending}
                                                            />

                                                            {renderMentionPopper(rpMentionOpen, rpMentionAnchorEl, rpMentionResults, rpMentionLoading, rpMentionActiveIdx, insertRpMention, closeRpMention)}
                                                        </Box>
                                                    </Box>
                                                ) : null}

                                                {hasReplies && !isReplyThreadExpanded ? (
                                                    <Link
                                                        component="button"
                                                        type="button"
                                                        underline="hover"
                                                        onClick={() => toggleReplyThread(c.id)}
                                                        sx={{ mt: 0.75, p: 0, display: 'inline-flex', alignItems: 'center', fontSize: 13, fontWeight: 600, color: 'primary.main', textAlign: 'left' }}
                                                    >
                                                        Show replies ({replies.length})
                                                    </Link>
                                                ) : null}
                                                {hasReplies && isReplyThreadExpanded ? (
                                                    <Link
                                                        component="button"
                                                        type="button"
                                                        underline="hover"
                                                        onClick={() => toggleReplyThread(c.id)}
                                                        sx={{ mt: 0.75, p: 0, display: 'inline-flex', alignItems: 'center', fontSize: 13, fontWeight: 600, color: 'primary.main', textAlign: 'left' }}
                                                    >
                                                        Hide replies
                                                    </Link>
                                                ) : null}
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Replies rendered OUTSIDE the indented box so padding doesn't stack */}
                                    {hasReplies && isReplyThreadExpanded ? (
                                        <Box sx={{ pl: shouldIndent ? 2 : 0, ml: shouldIndent ? 1 : 0 }}>
                                            {replies.map((r) => renderComment(r, depth + 1, name, displayHandle, c.id))}
                                        </Box>
                                    ) : null}
                                </React.Fragment>
                            );
                        };

                        return (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {top.map((c) => renderComment(c, 0, null, null, null))}
                            </Box>
                        );
                    })()}
                </Box>
            )}

            <Box sx={{ height: 24 }} />

            {/* Shared 3-dot menu for comments */}
            <SmartMenu
                anchorEl={commentMenuAnchor}
                open={commentMenuOpen}
                onClose={closeCommentMenu}
                onClick={(e) => e.stopPropagation()}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                    paper: {
                        sx: { mt: 0.5, minWidth: 200, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: (t) => t.custom?.shadows?.lg || `0 12px 40px ${alpha(t.palette.text.primary, 0.15)}`, py: 0.5 },
                    },
                }}
            >
                {/* Copy link */}
                <MenuItem
                    onClick={() => {
                        if (commentMenuId) {
                            const url = pageSlug
                                ? `${window.location.origin}/${pageSlug}/posts/${postId}?comment=${commentMenuId}`
                                : `${window.location.origin}/posts/${postId}?comment=${commentMenuId}`;
                            navigator.clipboard.writeText(url).then(() => {
                                setCopyLinkToast(true);
                            }).catch(() => {});
                        }
                        closeCommentMenu();
                    }}
                >
                    <ListItemIcon>
                        <LinkIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Copy link" />
                </MenuItem>

                {/* Pin / Unpin comment (post author / business owner only, top-level only) */}
                {viewerAuthed && canManagePost && commentMenuId && (() => {
                    const mc = comments.find((cc) => Number(cc?.id) === Number(commentMenuId));
                    if (!mc || mc?.parentId) return null; // replies can't be pinned
                    const mcPinned = Boolean(mc?.is_pinned);
                    return (
                        <MenuItem
                            onClick={() => {
                                requestTogglePinConfirm(commentMenuId, mcPinned);
                                closeCommentMenu();
                            }}
                        >
                            <ListItemIcon>
                                <PushPinRoundedIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={mcPinned ? 'Unpin comment' : 'Pin comment'} />
                        </MenuItem>
                    );
                })()}

                {/* Report comment — hidden for own comments (account-aware) */}
                {viewerAuthed && commentMenuId && (() => {
                    const mc = comments.find((cc) => Number(cc?.id) === Number(commentMenuId));
                    const mcBizId = Number(mc?.business_id || 0);
                    const mcArtId = Number(mc?.artist_id || 0);
                    const mcIsOwn = (() => {
                        if (Number(mc?.userId) !== Number(viewer?.id)) return false;
                        if (mcBizId > 0) return isBA && Number(aBizId) === mcBizId;
                        if (mcArtId > 0) return isAA && Number(aArtId) === mcArtId;
                        return !isBA && !isAA;
                    })();
                    if (mcIsOwn) return null;
                    return (
                        <MenuItem
                            onClick={() => {
                                if (commentMenuId) openFlag(commentMenuId);
                                closeCommentMenu();
                            }}
                        >
                            <ListItemIcon>
                                <FlagOutlinedIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Report comment" />
                        </MenuItem>
                    );
                })()}

                {/* Delete comment — own comment (account-aware) or post author/biz owner */}
                {viewerAuthed && commentMenuId && (() => {
                    const mc = comments.find((cc) => Number(cc?.id) === Number(commentMenuId));
                    const mcBizId = Number(mc?.business_id || 0);
                    const mcArtId = Number(mc?.artist_id || 0);
                    const mcIsOwn = (() => {
                        if (Number(mc?.userId) !== Number(viewer?.id)) return false;
                        if (mcBizId > 0) return isBA && Number(aBizId) === mcBizId;
                        if (mcArtId > 0) return isAA && Number(aArtId) === mcArtId;
                        return !isBA && !isAA;
                    })();
                    const mcCanDelete = Boolean(
                        mc?.canDelete || (canManagePost || mcIsOwn)
                    );
                    if (!mcCanDelete) return null;
                    const mcIsReply = Boolean(mc?.parentId);
                    return (
                        <MenuItem
                            onClick={() => {
                                requestDeleteComment(commentMenuId, mcIsReply);
                                closeCommentMenu();
                            }}
                        >
                            <ListItemIcon>
                                <DeleteOutlineIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={mcIsReply ? 'Delete reply' : 'Delete comment'} />
                        </MenuItem>
                    );
                })()}
            </SmartMenu>

            <FlagCommentDialog open={flagState.open} onClose={closeFlag} onSubmit={submitFlag} />

            <DeleteConfirmDialog
                open={deleteConfirm.open}
                onClose={closeDeleteConfirm}
                onConfirm={confirmDelete}
                isReply={deleteConfirm.isReply}
            />

            {/* Pin/Unpin confirm dialog */}
            <Dialog
                disableScrollLock
                open={!!pinConfirm.open}
                onClose={(_, reason) => {
                    if (reason === 'backdropClick') return;
                    closePinConfirm();
                }}
                disableEscapeKeyDown
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, position: 'relative' } }}
            >
                <DialogTitle sx={{ pr: 7, fontWeight: 900 }}>
                    {pinConfirm.mode === 'unpin' ? 'Unpin comment?' : 'Pin this comment?'}
                    <IconButton
                        aria-label="Close"
                        onClick={closePinConfirm}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Typography sx={{ mb: 0.75 }}>
                        {pinConfirm.mode === 'unpin'
                            ? 'Do you want to unpin this comment?'
                            : 'Do you want to pin this comment to the top?'}
                    </Typography>
                    {pinConfirm.mode === 'pin' && pinConfirm.willReplace ? (
                        <Alert severity="warning" sx={{ mt: 1, borderRadius: 2 }}>
                            Only one comment can be pinned at a time. Pinning this comment will replace the current pinned comment.
                        </Alert>
                    ) : null}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closePinConfirm} variant="outlined" sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                        Cancel
                    </Button>
                    <Button onClick={confirmTogglePin} variant="contained" sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                        {pinConfirm.mode === 'unpin' ? 'Unpin' : 'Pin'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );

    const businessUserForCard = useMemo(() => {
        // Check ALL possible business-entity-ID field names (matching postBizId pattern above)
        const bizId = post?.businessId || post?.businessPageId || post?.business_id || post?.business_page_id || post?.pageId || post?.page_id || undefined;
        const ownerId = post?.businessOwnerId || post?.business_owner_id || post?.owner_id || post?.authorUserId || post?.author_user_id || post?.user_id || post?.userId || undefined;
        return {
            // id must be the bizId so resolveCardTarget sees account_type='business' + id=bizId
            // and correctly returns { type: 'business', id: bizId }.
            // Putting ownerId here caused the popover hydration to fail because it used
            // the personal owner ID in place of the business entity ID.
            // Fall back to ownerId only if bizId is truly unavailable.
            id: bizId || ownerId || undefined,
            owner_id: ownerId,
            first_name: pageName,
            last_name: '',
            handle: pageSlug,
            avatar_url: hasValidAvatar ? rawAvatar : '',
            logo_url: hasValidAvatar ? rawAvatar : '',
            isBusiness: true,
            account_type: 'business',
            business_id: bizId,
            business_name: pageName,
            business_slug: pageSlug,
            business_avatar_url: hasValidAvatar ? rawAvatar : '',
        };
    }, [post?.businessId, post?.businessOwnerId, post?.business_owner_id, post?.owner_id, post?.authorUserId, post?.author_user_id, post?.user_id, post?.userId, pageName, pageSlug, hasValidAvatar, rawAvatar, post?.businessPageId, post?.business_page_id, post?.business_id, post?.pageId, post?.page_id]);

    const isSelfBusiness = Boolean(
        viewer && post && (
            // Owner of the business (personal account)
            String(viewer.id) === String(post?.businessOwnerId || post?.business_owner_id || post?.owner_id || '') ||
            // Acting as the business account that owns this page
            (isBA && aBizId && String(aBizId) === String(post?.businessPageId || post?.business_page_id || post?.pageId || post?.page_id || ''))
        )
    );

    if (!post) {
        return (
            <Box
                sx={{
                    ...outerSx,
                    py: 6,
                    px: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    minHeight: '100%',
                }}
            >
                <Box sx={{ maxWidth: 420, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                    <Box
                        sx={{
                            width: 76,
                            height: 76,
                            borderRadius: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: (t) => alpha(t.palette.text.primary, 0.03),
                            border: (t) => `1px solid ${alpha(t.palette.text.primary, 0.06)}`,
                            boxShadow: (t) => t.custom?.shadows?.xs,
                        }}
                    >
                        <ForumIcon sx={{ fontSize: 42, color: 'primary.main', opacity: 0.9 }} />
                    </Box>

                    <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
                        Select a post
                    </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 14, lineHeight: 1.45 }}>
                        Choose a post from the list to see details, comments, and photos.
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <>
            <Box sx={outerSx}>
                {embedded ? (
                    <Box
                        sx={{
                            width: '100%',
                            minHeight: '100%',
                            bgcolor: 'background.paper',
                            px: { xs: 1.25, sm: 1.75 },
                            py: { xs: 1.25, sm: 1.5 },
                        }}
                    >
                        {categoryLoading ? <PulsingDots /> : mainContent}
                    </Box>
                ) : (
                    <Paper
                        variant="outlined"
                        sx={(t) => ({
                            p: { xs: 1.25, sm: 2 },
                            borderRadius: 3,
                            borderColor: alpha(t.palette.primary.main, 0.14),
                            backgroundColor: 'background.paper',
                            backgroundImage: 'none',
                            boxShadow: `0 16px 56px ${alpha(t.palette.common.black, 0.08)}`,
                        })}
                    >
                        {categoryLoading ? <PulsingDots /> : mainContent}
                    </Paper>
                )}
            </Box>
            <UserCardPopover
                anchorEl={userCardAnchor}
                onClose={() => setUserCardAnchor(null)}
                user={businessUserForCard}
                isSelf={isSelfBusiness}
                viewProfileOnly={isSelfBusiness}
                onViewProfile={(u) => {
                    const slug = u?.handle || pageSlug;
                    if (slug) window.location.assign(`/${slug}`);
                }}
            />
            <UserCardPopover
                anchorEl={commentUserAnchor}
                onClose={() => { setCommentUserAnchor(null); setCommentUserForCard(null); }}
                user={commentUserForCard}
                isSelf={(() => {
                    if (!commentUserForCard || !viewer) return false;
                    const cu = commentUserForCard;
                    if (cu.account_type === 'business' && cu.business_id) return isBA && String(aBizId) === String(cu.business_id);
                    if (cu.account_type === 'artist' && cu.artist_id) return isAA && String(aArtId) === String(cu.artist_id);
                    return String(viewer?.id || '') === String(cu.id || '');
                })()}
                onViewProfile={(u) => {
                    const slug = u?.handle || u?.business_slug || u?.artist_handle || '';
                    if (slug) window.location.assign(`/${slug}`);
                }}
            />
            <ShareDialog
                contentType="post"
                open={shareDialogOpen}
                onClose={() => setShareDialogOpen(false)}
                viewer={viewer}
                post={post || { id: post?.id }}
                sx={{ zIndex: 100001 }}
            />
            <ShareDialog
                contentType="comment"
                open={shareCommentDialogOpen}
                onClose={() => {
                    setShareCommentDialogOpen(false);
                    setShareCommentTarget(null);
                }}
                comment={shareCommentTarget}
                post={{ id: postId, businessSlug: pageSlug }}
                postSlug={pageSlug}
                viewer={viewer}
                sx={{ zIndex: 100001 }}
            />
            <SuccessSnackbar
                open={commentShareToast}
                onClose={() => setCommentShareToast(false)}
                message="Comment link copied to clipboard"
            />

            {/* Post report dialog */}
            <ReportContentDialog
                open={postReportOpen}
                onClose={() => setPostReportOpen(false)}
                onSubmit={submitPostReport}
                title="Report post"
                sx={{ zIndex: 100001 }}
            />

            {/* Business report dialog */}
            <ReportContentDialog
                open={bizReportOpen}
                onClose={() => setBizReportOpen(false)}
                onSubmit={submitBizReport}
                title="Report business"
                sx={{ zIndex: 100001 }}
            />

            {/* Delete post confirm */}
            <Dialog open={deletePostConfirm} onClose={() => setDeletePostConfirm(false)} maxWidth="xs" fullWidth sx={{ zIndex: 100001 }}>
                <DialogTitle sx={{ pr: 6 }}>
                    Delete post
                    <IconButton aria-label="Close" onClick={() => setDeletePostConfirm(false)} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2">Are you sure you want to delete this post? This action cannot be undone.</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeletePostConfirm(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button onClick={handleDeletePost} color="error" variant="contained" sx={{ textTransform: 'none', fontWeight: 700 }}>Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Edit history dialog */}
            <Dialog
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                fullWidth
                maxWidth="sm"
                onClick={(e) => e.stopPropagation()}
                sx={{ zIndex: 100001 }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    Edit history
                    <IconButton onClick={() => setHistoryOpen(false)} size="small"><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {historyLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={28} /></Box>
                    ) : null}
                    {!historyLoading && historyError ? (
                        <Alert severity="error">{historyError}</Alert>
                    ) : null}
                    {!historyLoading && !historyError && historyRows.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            This post was edited, but detailed version history is not available for edits made before history tracking was enabled.
                        </Typography>
                    ) : null}
                    {!historyLoading && !historyError && historyRows.length > 0 ? (
                        <Stack spacing={2}>
                            {historyRows.map((row, idx) => {
                                const snap = row?.snapshot || {};
                                const diff = row?.diff || {};
                                const when = row?.edited_at;
                                const isOriginal = idx === historyRows.length - 1;
                                const rowTitle = String(snap?.title || '').trim();
                                const bodyText = String(snap?.body || snap?.description || '').trim();
                                const postType = String(snap?.type || '').trim();
                                const photos = Array.isArray(snap?.photos) ? snap.photos.filter(Boolean) : [];
                                const prevSnap = idx + 1 < historyRows.length ? (historyRows[idx + 1]?.snapshot || {}) : {};
                                const titleChanged = !isOriginal && String(prevSnap?.title || '') !== rowTitle;
                                const bodyChanged = !isOriginal && String(prevSnap?.body || prevSnap?.description || '') !== bodyText;
                                const prevType = String(prevSnap?.type || '').trim();
                                const typeChanged = !isOriginal && prevType && postType && prevType !== postType;
                                const added = Array.isArray(diff?.added) ? diff.added.filter(Boolean) : [];
                                const removed = Array.isArray(diff?.removed) ? diff.removed.filter(Boolean) : [];
                                const hasChanges = titleChanged || bodyChanged || typeChanged || added.length > 0 || removed.length > 0;
                                const formatType = (t) => t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
                                return (
                                    <Box key={row?.id ?? idx}>
                                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                            {isOriginal ? 'Original Post' : `Edit #${historyRows.length - idx}`}
                                        </Typography>
                                        {when ? (
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(when).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} · {new Date(when).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()}
                                            </Typography>
                                        ) : null}
                                        <Box sx={{ mt: 1 }}>
                                            {isOriginal ? (
                                                <Typography variant="body2" sx={{ mb: 0.75, color: 'primary.main', fontWeight: 600 }}>Original version</Typography>
                                            ) : (
                                                <>
                                                    {typeChanged ? <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Type changed:</strong> {formatType(prevType)} → {formatType(postType)}</Typography> : null}
                                                    {titleChanged ? <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Title changed:</strong> {rowTitle || '(no title)'}</Typography> : null}
                                                    {bodyChanged ? <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Description changed</strong></Typography> : null}
                                                    {added.length > 0 ? (
                                                        <Box sx={{ mb: 1 }}>
                                                            <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Photos added:</strong></Typography>
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                                {added.map((url) => <Box key={url} component="img" src={url} alt="" sx={{ width: 72, height: 72, borderRadius: 1, objectFit: 'cover', border: '1px solid', borderColor: 'divider' }} />)}
                                                            </Box>
                                                        </Box>
                                                    ) : null}
                                                    {removed.length > 0 ? (
                                                        <Box sx={{ mb: 1 }}>
                                                            <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Photos removed:</strong></Typography>
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                                {removed.map((url) => <Box key={url} component="img" src={url} alt="" sx={{ width: 72, height: 72, borderRadius: 1, objectFit: 'cover', border: '1px solid', borderColor: 'divider', opacity: 0.5 }} />)}
                                                            </Box>
                                                        </Box>
                                                    ) : null}
                                                    {!hasChanges ? <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Content updated</Typography> : null}
                                                </>
                                            )}
                                            {bodyText ? <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{renderCommentText(bodyText)}</Typography> : null}
                                            {isOriginal && photos.length > 0 ? (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                                    {photos.map((url) => <Box key={url} component="img" src={url} alt="" sx={{ width: 72, height: 72, borderRadius: 1, objectFit: 'cover', border: '1px solid', borderColor: 'divider' }} />)}
                                                </Box>
                                            ) : null}
                                        </Box>
                                        {idx < historyRows.length - 1 ? <Divider sx={{ mt: 2 }} /> : null}
                                    </Box>
                                );
                            })}
                        </Stack>
                    ) : null}
                </DialogContent>
                <DialogActions><Button onClick={() => setHistoryOpen(false)}>Close</Button></DialogActions>
            </Dialog>

            {/* Edit post dialog (shared component with full form) */}
            <EditBusinessPostDialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                post={post}
                businessId={post?.business_id || post?.businessId}
                businessName={post?.businessName || post?.business_name || ''}
                onPostUpdated={() => {
                    setEditDialogOpen(false);
                }}
                sx={{ zIndex: 100001 }}
            />

            {/* Copy link toast */}
            <SuccessSnackbar
                open={copyLinkToast}
                onClose={() => setCopyLinkToast(false)}
                message="Link copied to clipboard"
            />

            {/* Hide/Block toast */}
            <SuccessSnackbar
                open={Boolean(hideBlockToast)}
                onClose={() => setHideBlockToast('')}
                message={hideBlockToast}
            />

            <SuccessSnackbar {...successSnackbarProps} />
        </>
    );
}

BusinessPostDetailModal.propTypes = {
    embedded: PropTypes.bool,
    post: PropTypes.any,
    user: PropTypes.any,
    onViewPage: PropTypes.func,
    onShare: PropTypes.func,
    onLocationClick: PropTypes.func,
    onCommentSuccess: PropTypes.func,
};
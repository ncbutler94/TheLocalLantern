// src/pages/messages/MessagesPage.jsx
// ============================================================================
// Gmail-style messages page: conversation list (left) + reading pane (right).
// Account-aware — uses the active account from header/context.
// Mobile: full-screen list → tap opens conversation.
// ============================================================================

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
    Box,
    Typography,
    Avatar,
    IconButton,
    TextField,
    Button,
    Divider,
    CircularProgress,
    Tooltip,
    Chip,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Skeleton,
    Tabs,
    Tab,
    Checkbox,
    Alert,
    Radio,
    RadioGroup,
    FormControlLabel,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import CreateOutlinedIcon from '@mui/icons-material/CreateOutlined';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BlockIcon from '@mui/icons-material/Block';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import OutlinedFlagRoundedIcon from '@mui/icons-material/OutlinedFlagRounded';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
// Generic "artist" icon for the Messages page. Used ONLY on the composer's
// Artists TAB (a container of all artists regardless of sub-type). Per-account
// default avatars still branch on profile_type — music-note for musicians,
// palette for visual artists — via the `artistDefaultIcon` helper below.
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CheckBoxOutlineBlankRoundedIcon from '@mui/icons-material/CheckBoxOutlineBlankRounded';
import CheckBoxRoundedIcon from '@mui/icons-material/CheckBoxRounded';
import IndeterminateCheckBoxRoundedIcon from '@mui/icons-material/IndeterminateCheckBoxRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import ReplyRoundedIcon from '@mui/icons-material/ReplyRounded';
import HandymanRoundedIcon from '@mui/icons-material/HandymanRounded';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';

import { useAuth } from '../../components/AuthModalContext';
import { useActiveAccount } from '../../components/AccountContext';
import { getAccountHeaders } from '../../utils/getAccountHeadersStatic';
import LocalLanternLogo from '../../assets/LocalLanternProfilePic.png';
import CityCountySelect from '../../components/CityCountySelect';
import PulsingDots from '../../components/PulsingDots';
import NetworkErrorState, { isNetworkError } from '../../components/NetworkErrorState';
import CommentImageAttachments from '../../components/CommentImageAttachments';
import SuccessSnackbar, { useSuccessSnackbar } from '../../components/SuccessSnackbar';
import { checkProfanity } from '../../utils/profanityCheck';

import axios from '../../api/axiosInstance';
import useChromeTop from '../../hooks/useChromeTop';
import SwipeableRightDrawer from '../../components/SwipeableRightDrawer';

/* ────────────────────────── Helpers ─────────────────────────────────────── */
const API = (path) => `/api/messages${path}`;

/** Format count: 0→'', 1-999→' (N)', 1000+→' (1k)', ' (1.1k)', etc. */
function fmtCount(n) {
    if (!n) return '';
    if (n < 1000) return ` (${n})`;
    const k = n / 1000;
    const rounded = Math.round(k * 10) / 10;
    const display = rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
    return ` (${display}k)`;
}
const getAxCfg = () => ({ withCredentials: true, headers: { ...getAccountHeaders() } });

const parseDate = (d) => {
    if (!d) return null;
    if (d instanceof Date) return d;
    const s = String(d);
    // MySQL returns 'YYYY-MM-DD HH:MM:SS' in UTC — ensure JS knows it's UTC
    if (!s.endsWith('Z') && !s.includes('+') && !s.includes('T')) return new Date(s.replace(' ', 'T') + 'Z');
    if (!s.endsWith('Z') && !s.includes('+')) return new Date(s + 'Z');
    return new Date(s);
};

const timeAgo = (dateStr) => {
    const d = parseDate(dateStr);
    if (!d) return '';
    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatFullDate = (dateStr) => {
    const d = parseDate(dateStr);
    if (!d) return '';
    return d.toLocaleString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit',
    });
};

// Small tag shown next to names to indicate account type at a glance (tab
// labels, list meta, etc.). For artists this is the "collective" icon — a
// star — regardless of sub-type, because it's often used alongside a label
// like "artists" that already groups both sub-types.
const accountTypeIcon = (type) => {
    if (type === 'business') return <StorefrontOutlinedIcon sx={{ fontSize: 14 }} />;
    if (type === 'artist') return <StarRoundedIcon sx={{ fontSize: 14 }} />;
    return null;
};

// Returns the correct default-avatar icon *component* for a specific artist,
// branching on their profile_type sub-type ('music' | 'artist'). Musicians
// get the music-note; visual artists get the palette. Reads both snake_case
// and camelCase to tolerate whatever serializer shape delivered the entity.
// Defaults to music-note so rows that haven't been tagged with profile_type
// yet keep their pre-visual-artist appearance.
const artistDefaultIcon = (entity) => {
    const pt = String(entity?.profile_type || entity?.profileType || '').toLowerCase();
    return pt === 'artist' ? PaletteRoundedIcon : MusicNoteRoundedIcon;
};

/* Motion ease */
const UI_EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

/* Default avatar resolver — returns real pic or undefined for icon fallbacks */
const getAvatarSrc = (entity) => {
    if (!entity) return undefined;
    if (entity.avatar_url) return entity.avatar_url;
    return undefined;
};

/* Online status indicator dot */
const OnlineDot = ({ visible, size = 10, offset = 2 }) => {
    if (!visible) return null;
    return (
        <Box
            sx={{
                position: 'absolute',
                bottom: offset,
                right: offset,
                width: size,
                height: size,
                borderRadius: '50%',
                bgcolor: '#44b700',
                border: '2px solid',
                borderColor: 'background.paper',
                zIndex: 1,
            }}
        />
    );
};

/* ════════════════════════════════════════════════════════════════════════════
   MOBILE DRAWER WRAPPER — wraps the reading pane in a SwipeableRightDrawer on
   mobile (slides in from the right, swipe-right to dismiss). Truly fullscreen,
   covering the app header and bottom nav (matches the PostDetailModal mobile
   pattern from CommunityPage). On desktop, renders children inline.
   ════════════════════════════════════════════════════════════════════════════ */
const MobilePaneWrap = ({ isMobile, open, onClose, children }) => {
    if (!isMobile) return children;
    return (
        <SwipeableRightDrawer
            open={open}
            onClose={onClose}
            ModalProps={{ keepMounted: false }}
            slotProps={{ backdrop: { sx: { bgcolor: 'transparent' } } }}
            transitionDuration={{ enter: 280, exit: 220 }}
            PaperProps={{
                sx: {
                    width: '100vw',
                    bgcolor: 'background.paper',
                    backgroundImage: 'none',
                    boxShadow: 'none',
                    // Fullscreen — cover the app header AND bottom nav (matches
                    // CommunityPage's post-detail drawer). The drawer's own internal
                    // header (with back button) provides navigation.
                    top: 0,
                    height: '100%',
                    pb: 0,
                    display: 'flex',
                    flexDirection: 'column',
                },
            }}
        >
            {children}
        </SwipeableRightDrawer>
    );
};

/* ════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════════════════ */
export default function MessagesPage({ user }) {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const theme = useTheme();
    // Mobile + tablet use the swipeable right drawer for the reading pane.
    // Desktop (>= lg, ~1200px) uses the inline split layout.
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
    const { requireAuth } = useAuth();
    const { accountCacheKey } = useActiveAccount();
    // Note: chromeTop is no longer needed — the page is fullscreen on mobile (chrome
    // floats over the page content via its own fixed positioning), and on desktop the
    // page sits inside the static layout below the chrome.
    // const chromeTop = useChromeTop();

    // ─── State ───
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inboxError, setInboxError] = useState(null);
    const [selectedConvId, setSelectedConvId] = useState(null);
    const [convDetail, setConvDetail] = useState(null);
    const [convMessages, setConvMessages] = useState([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [replyFiles, setReplyFiles] = useState([]);
    const [replyImageUrls, setReplyImageUrls] = useState([]);
    const [sending, setSending] = useState(false);
    const [sendCooldown, setSendCooldown] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [inboxFilter, setInboxFilter] = useState('all');
    const [composeOpen, setComposeOpen] = useState(false);
    const [blockedOpen, setBlockedOpen] = useState(false);
    const [blockedAccounts, setBlockedAccounts] = useState([]);
    const [blockedLoading, setBlockedLoading] = useState(false);
    const [replyError, setReplyError] = useState('');
    const [lightboxUrl, setLightboxUrl] = useState(null);
    const [selectMode, setSelectMode] = useState(false);
    const [selectedConvIds, setSelectedConvIds] = useState([]);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const { showSuccess, snackbarProps: successSnackbarProps } = useSuccessSnackbar();
    const messagesEndRef = useRef(null);

    // Pick up ?conv= from URL
    const urlConvId = Number(searchParams.get('conv')) || null;

    // ─── Fetch inbox ───
    const fetchInbox = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        setInboxError(null);
        try {
            const res = await axios.get(API('/conversations'), { ...getAxCfg(), params: { limit: 25 } });
            setConversations(res.data?.conversations || []);
        } catch (err) {
            setInboxError(err);
        } finally {
            setLoading(false);
        }
    }, [user?.id, accountCacheKey]);

    useEffect(() => {
        fetchInbox();
    }, [fetchInbox]);

    // Clear selection when account changes
    useEffect(() => {
        setSelectedConvId(null);
        setConvDetail(null);
        setConvMessages([]);
    }, [accountCacheKey]);

    // ─── Open conversation from URL param ───
    useEffect(() => {
        if (urlConvId && urlConvId !== selectedConvId) {
            setSelectedConvId(urlConvId);
        }
        if (!urlConvId && selectedConvId) {
            setSelectedConvId(null);
            setConvDetail(null);
            setConvMessages([]);
        }
    }, [urlConvId]);

    // ─── Fetch conversation detail ───
    useEffect(() => {
        if (!selectedConvId) {
            setConvDetail(null);
            setConvMessages([]);
            return;
        }

        let alive = true;
        const load = async () => {
            setDetailLoading(true);
            try {
                const res = await axios.get(API(`/conversations/${selectedConvId}`), getAxCfg());
                if (!alive) return;
                setConvDetail(res.data?.conversation || null);
                setConvMessages(res.data?.messages || []);

                // Mark as read
                try {
                    await axios.patch(API(`/conversations/${selectedConvId}/read`), null, getAxCfg());
                    // Refresh inbox unread counts
                    setConversations((prev) =>
                        prev.map((c) => (c.id === selectedConvId ? { ...c, unread_count: 0 } : c))
                    );
                } catch {
                    // ignore
                }
            } catch {
                // ignore
            } finally {
                if (alive) setDetailLoading(false);
            }
        };
        load();
        return () => { alive = false; };
    }, [selectedConvId]);

    // ─── Auto-scroll to bottom when conversation loads or new messages arrive ───
    const prevConvIdRef = useRef(null);
    useEffect(() => {
        if (!convMessages.length || detailLoading) return;
        const isNewConv = prevConvIdRef.current !== selectedConvId;
        if (isNewConv) prevConvIdRef.current = selectedConvId;
        // Longer delay for new conversations to let DOM fully render
        const timer = setTimeout(() => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: isNewConv ? 'auto' : 'smooth' });
            }
        }, isNewConv ? 150 : 0);
        return () => clearTimeout(timer);
    }, [convMessages, selectedConvId, detailLoading]);

    // ─── Select a conversation ───
    const handleSelectConv = (convId) => {
        setSelectedConvId(convId);
        setReplyText('');
        setReplyError('');
        setSearchParams({ conv: String(convId) }, { replace: true });
    };

    // ─── Back to list (mobile) ───
    const handleBack = () => {
        searchParams.delete('conv');
        setSearchParams(searchParams, { replace: true });
        setSelectedConvId(null);
        setConvDetail(null);
        setConvMessages([]);
    };

    // ─── Send reply ───
    const handleSendReply = async () => {
        const hasText = Boolean(replyText.trim());
        const hasImages = replyFiles.length > 0 || replyImageUrls.length > 0;
        if ((!hasText && !hasImages) || !convDetail || sending || sendCooldown > 0) return;

        const authed = await requireAuth();
        if (!authed) return;

        setSending(true);
        setReplyError('');
        try {
            // Client-side profanity check
            if (hasText) {
                const profCheck = checkProfanity(replyText.trim());
                if (!profCheck.clean) {
                    setReplyError('Your message contains inappropriate language. Please revise and try again.');
                    setSending(false);
                    return;
                }
            }
            const myAccount = getMyAccountFromConv(convDetail);
            const other = myAccount?.side === 'a' ? convDetail.participant_b : convDetail.participant_a;

            const hasFileUploads = replyFiles.length > 0;

            if (hasFileUploads) {
                // Send via FormData so multer can process file uploads
                const fd = new FormData();
                fd.append('recipient_type', other.type);
                fd.append('recipient_id', String(other.id));
                fd.append('body', replyText.trim());
                fd.append('conversation_id', String(selectedConvId));
                if (convDetail.service_context?.service_id) fd.append('service_id', String(convDetail.service_context.service_id));
                if (convDetail.listing_context?.listing_id) fd.append('listing_id', String(convDetail.listing_context.listing_id));
                for (const file of replyFiles) fd.append('images', file);
                if (replyImageUrls.length > 0) fd.append('image_urls', JSON.stringify(replyImageUrls));
                const cfg = getAxCfg();
                await axios.post(API('/send'), fd, {
                    ...cfg,
                    headers: { ...cfg.headers, 'Content-Type': 'multipart/form-data' },
                });
            } else {
                // JSON body (text-only or GIF URLs only)
                await axios.post(API('/send'), {
                    recipient_type: other.type,
                    recipient_id: other.id,
                    body: replyText.trim(),
                    conversation_id: selectedConvId,
                    ...(replyImageUrls.length > 0 ? { photos: replyImageUrls } : {}),
                    ...(convDetail.service_context?.service_id ? { service_id: convDetail.service_context.service_id } : {}),
                    ...(convDetail.listing_context?.listing_id ? { listing_id: convDetail.listing_context.listing_id } : {}),
                }, getAxCfg());
            }

            setReplyText('');
            setReplyFiles([]);
            setReplyImageUrls([]);

            // Refresh this conversation
            const res = await axios.get(API(`/conversations/${selectedConvId}`), getAxCfg());
            setConvMessages(res.data?.messages || []);

            // Refresh inbox snippet
            fetchInbox();
        } catch (err) {
            const status = err.response?.status;
            const data = err.response?.data;
            if (status === 429) {
                // Friendly rate-limit message with auto-cooldown
                const wait = Number(data?.retryAfterSeconds) || 15;
                setReplyError(data?.message || 'You\'re sending messages too quickly. Please wait a moment.');
                setSendCooldown(wait);
                const timer = setInterval(() => {
                    setSendCooldown(prev => {
                        if (prev <= 1) { clearInterval(timer); setReplyError(''); return 0; }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                setReplyError(data?.message || 'Failed to send reply.');
            }
        } finally {
            setSending(false);
        }
    };

    // ─── Delete conversation ───
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [blockConfirmConv, setBlockConfirmConv] = useState(null);
    const [reportConversationOpen, setReportConversationOpen] = useState(false);
    const [reportConversationDetails, setReportConversationDetails] = useState('');
    const [reportConversationSubmitting, setReportConversationSubmitting] = useState(false);
    const [reportConversationReason, setReportConversationReason] = useState('');
    const [reportConversationSubmitted, setReportConversationSubmitted] = useState(false);
    const [reportMessageId, setReportMessageId] = useState(null);
    const [reportMessageDetails, setReportMessageDetails] = useState('');
    const [reportMessageSubmitting, setReportMessageSubmitting] = useState(false);
    const [reportMessageReason, setReportMessageReason] = useState('');
    const [reportMessageSubmitted, setReportMessageSubmitted] = useState(false);

    const handleDeleteConversation = async (convId) => {
        try {
            await axios.delete(API(`/conversations/${convId}`), getAxCfg());
            fetchInbox();
            if (selectedConvId === convId) handleBack();
            showSuccess('1 conversation deleted');
        } catch {
            // ignore
        }
        setDeleteConfirmId(null);
    };

    // ─── Block account ───
    const handleBlockAccount = async (otherType, otherId) => {
        try {
            await axios.post(API('/block'), {
                blocked_type: otherType,
                blocked_id: otherId,
            }, getAxCfg());
            // Also delete the conversation after blocking
            if (selectedConvId) {
                await axios.delete(API(`/conversations/${selectedConvId}`), getAxCfg());
                handleBack();
            }
            fetchInbox();
        } catch {
            // ignore
        }
        setBlockConfirmConv(null);
    };

    const handleReportConversation = async () => {
        if (!selectedConvId || reportConversationSubmitting || !reportConversationReason) return;

        const authed = await requireAuth();
        if (!authed) return;

        setReportConversationSubmitting(true);
        try {
            await axios.post(
                API(`/conversations/${selectedConvId}/report`),
                {
                    reason: reportConversationReason,
                    details: reportConversationDetails.trim(),
                },
                getAxCfg()
            );
            setReportConversationSubmitted(true);
        } catch (err) {
            setReplyError(err.response?.data?.message || 'Failed to report conversation.');
        } finally {
            setReportConversationSubmitting(false);
        }
    };

    const handleReportMessage = async () => {
        if (!reportMessageId || reportMessageSubmitting || !reportMessageReason) return;

        const authed = await requireAuth();
        if (!authed) return;

        setReportMessageSubmitting(true);
        try {
            await axios.post(
                API(`/${reportMessageId}/report`),
                {
                    reason: reportMessageReason,
                    details: reportMessageDetails.trim(),
                },
                getAxCfg()
            );
            setReportMessageSubmitted(true);
        } catch (err) {
            setReplyError(err.response?.data?.message || 'Failed to report message.');
        } finally {
            setReportMessageSubmitting(false);
        }
    };

    // ─── Blocked accounts ───
    const fetchBlockedAccounts = async () => {
        setBlockedLoading(true);
        try {
            const res = await axios.get(API('/block/list'), getAxCfg());
            setBlockedAccounts(res.data?.blocked || []);
        } catch {
            setBlockedAccounts([]);
        } finally {
            setBlockedLoading(false);
        }
    };

    const handleUnblock = async (type, id) => {
        try {
            await axios.delete(API('/block'), { ...getAxCfg(), data: { blocked_type: type, blocked_id: id } });
            setBlockedAccounts((prev) => prev.filter((a) => !(a.type === type && Number(a.id) === Number(id))));
            fetchInbox();
        } catch {
            // ignore
        }
    };

    // ─── Multi-select helpers ───
    const toggleSelectConv = (convId) => {
        setSelectedConvIds((prev) =>
            prev.includes(convId) ? prev.filter((id) => id !== convId) : [...prev, convId]
        );
    };

    const handleSelectAll = () => {
        if (selectedConvIds.length === filteredConvos.length) {
            setSelectedConvIds([]);
        } else {
            setSelectedConvIds(filteredConvos.map((c) => c.id));
        }
    };

    const exitSelectMode = () => {
        setSelectMode(false);
        setSelectedConvIds([]);
    };

    const handleBulkDelete = async () => {
        if (selectedConvIds.length === 0) return;
        const count = selectedConvIds.length;
        setBulkDeleting(true);
        try {
            await Promise.all(
                selectedConvIds.map((cid) => axios.delete(API(`/conversations/${cid}`), getAxCfg()))
            );
            if (selectedConvIds.includes(selectedConvId)) {
                handleBack();
            }
            fetchInbox();
            showSuccess(`${count} conversation${count !== 1 ? 's' : ''} deleted`);
        } catch {
            // ignore
        } finally {
            setBulkDeleting(false);
            setBulkDeleteOpen(false);
            exitSelectMode();
        }
    };

    // ─── Determine which side I am in a conversation ───
    const getMyAccountFromConv = (conv) => {
        if (!conv) return null;
        // The backend returns my_account on conversations list items,
        // but for the detail view we use participant_a / participant_b.
        // Compare with the active account headers to determine our side.
        const hdrs = getAccountHeaders();
        const acctType = hdrs['x-account-type'] || 'personal';
        const acctId = acctType === 'business'
            ? Number(hdrs['x-business-id'] || 0)
            : acctType === 'artist'
                ? Number(hdrs['x-artist-id'] || 0)
                : Number(user?.id || 0);

        if (conv.participant_a?.type === acctType && Number(conv.participant_a?.id) === acctId) {
            return { side: 'a' };
        }
        if (conv.participant_b?.type === acctType && Number(conv.participant_b?.id) === acctId) {
            return { side: 'b' };
        }
        // Fallback: check by user_id ownership
        if (conv.participant_a?.type === 'personal' && Number(conv.participant_a?.id) === Number(user?.id)) {
            return { side: 'a' };
        }
        if (conv.participant_b?.type === 'personal' && Number(conv.participant_b?.id) === Number(user?.id)) {
            return { side: 'b' };
        }
        return { side: 'a' };
    };

    // ─── Filtered conversations ───
    const filteredConvos = (() => {
        let list = conversations;

        // Filter by inbox tab
        if (inboxFilter === 'services') {
            list = list.filter((c) => c.service_context != null && c.listing_context == null);
        } else if (inboxFilter === 'marketplace') {
            list = list.filter((c) => c.listing_context != null);
        } else if (inboxFilter === 'businesses') {
            list = list.filter((c) => c.service_context == null && c.listing_context == null && c.other?.type === 'business');
        } else if (inboxFilter === 'artists') {
            list = list.filter((c) => c.service_context == null && c.listing_context == null && c.other?.type === 'artist');
        } else if (inboxFilter === 'personal') {
            list = list.filter((c) => c.service_context == null && c.listing_context == null && c.other?.type !== 'business' && c.other?.type !== 'artist');
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter((c) =>
                (c.other?.name || '').toLowerCase().includes(q) ||
                (c.subject || '').toLowerCase().includes(q) ||
                (c.service_context?.service_title || '').toLowerCase().includes(q) ||
                (c.listing_context?.listing_title || '').toLowerCase().includes(q)
            );
        }

        // Sort: by last_message_at descending (newest first)
        list = [...list].sort((a, b) => {
            const aTime = parseDate(a.last_message_at)?.getTime() || 0;
            const bTime = parseDate(b.last_message_at)?.getTime() || 0;
            return bTime - aTime;
        });

        return list;
    })();

    // ─── Not logged in ───
    if (!user) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2, px: 2 }}>
                <MailOutlinedIcon sx={{ fontSize: 56, color: 'primary.light' }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                    Sign in to view your messages
                </Typography>
                <Button variant="contained" color="primary" onClick={() => requireAuth()} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}>
                    Sign In
                </Button>
            </Box>
        );
    }

    // ─── Show conversation detail on mobile ───
    const showDetailMobile = isMobile && selectedConvId;
    const conversationIsSystemNotice = Boolean(convDetail?.system_notice) || conversations.find((c) => c.id === selectedConvId)?.system_notice === true || convDetail?.participant_a?.type === 'system' || convDetail?.participant_b?.type === 'system';

    return (
        <Box sx={{
            display: 'flex',
            // Mobile: fullscreen, edge-to-edge. The app header + bottom nav are rendered
            // outside this page and float OVER it via their own fixed positioning + zIndex
            // (matches the CommunityPage / post-list pattern). Internal scrollable areas
            // reserve their own top/bottom padding so content isn't hidden behind chrome.
            // Desktop: unchanged — container is centered with margins, chrome is static.
            position: { xs: 'fixed', md: 'static' },
            top: { xs: 0, md: 'auto' },
            left: { xs: 0, md: 'auto' },
            right: { xs: 0, md: 'auto' },
            bottom: { xs: 0, md: 'auto' },
            height: { xs: 'auto', sm: `calc(100dvh - ${80}px)` },
            width: { xs: 'auto', md: 'auto' },
            maxWidth: { xs: 'none', md: 1400 },
            mx: { xs: 0, md: 'auto' },
            bgcolor: 'background.paper',
            borderRadius: { xs: 0, md: 2 },
            overflow: 'hidden',
            border: { md: '1px solid' },
            borderColor: { md: 'divider' },
            mt: 0,
            mb: 0,
        }}>
            {/* ════════ LEFT: Conversation List ════════ */}
            {(!isMobile || !showDetailMobile) && (
                <Box sx={{
                    // In drawer mode (mobile + tablet), the inbox is the only thing
                    // visible — let it fill the container. On desktop, it's a fixed
                    // 560px column next to the inline reading pane.
                    width: isMobile ? '100%' : 560,
                    minWidth: isMobile ? 0 : 520,
                    maxWidth: isMobile ? 'none' : 620,
                    borderRight: !isMobile ? '1px solid' : 'none',
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    minHeight: 0,
                    overflow: 'hidden',
                }}>
                    {/* Inbox header — always visible. On mobile, paddingTop reserves
                        space for the app header which floats over this fullscreen page. */}
                    <Box sx={{
                        px: 2, py: 1.5,
                        pt: { xs: 'calc(var(--ll-nav-height, 52px) + 12px)', md: 1.5 },
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        flexShrink: 0,
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MailOutlinedIcon sx={{ fontSize: 22, color: 'primary.main' }} />
                            <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem' }}>
                                Messages
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Tooltip title="Blocked accounts" arrow>
                                <IconButton
                                    size="small"
                                    onClick={() => { setBlockedOpen(true); fetchBlockedAccounts(); }}
                                    sx={{ color: 'text.secondary', width: 34, height: 34 }}
                                >
                                    <ShieldOutlinedIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Message settings" arrow>
                                <IconButton
                                    size="small"
                                    onClick={() => navigate('/account?tab=account')}
                                    sx={{ color: 'text.secondary', width: 34, height: 34 }}
                                >
                                    <SettingsOutlinedIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Compose" arrow>
                                <IconButton
                                    size="small"
                                    onClick={() => setComposeOpen(true)}
                                    sx={{
                                        bgcolor: 'primary.main',
                                        color: 'primary.contrastText',
                                        width: 34, height: 34,
                                        '&:hover': { bgcolor: 'primary.dark' },
                                    }}
                                >
                                    <CreateOutlinedIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                    {/* Search */}
                    <Box sx={{ px: 1.5, py: 1, flexShrink: 0 }}>
                        <TextField
                            size="small"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            fullWidth
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 999,
                                    bgcolor: (t) => alpha(t.palette.action.hover, 0.04),
                                    fontSize: '0.85rem',
                                    '& fieldset': { borderColor: 'transparent' },
                                    '&:hover fieldset': { borderColor: 'divider' },
                                    '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                                },
                            }}
                        />
                    </Box>

                    {/* Inbox filter tabs */}
                    <Box sx={{ px: 0.75, flexShrink: 0, borderBottom: '1px solid', borderColor: 'divider', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
                        <Tabs
                            value={inboxFilter}
                            onChange={(_e, v) => setInboxFilter(v)}
                            variant="scrollable"
                            scrollButtons={false}
                            sx={{
                                minHeight: 36,
                                '& .MuiTab-root': {
                                    minHeight: 36,
                                    textTransform: 'none',
                                    fontWeight: 800,
                                    fontSize: '0.76rem',
                                    py: 0,
                                    whiteSpace: 'nowrap',
                                    minWidth: 'auto',
                                    px: { xs: 1.25, sm: 1 },
                                },
                                '& .MuiTabs-indicator': {
                                    bgcolor: 'primary.main',
                                    height: 2.5,
                                    borderRadius: 2,
                                },
                                '& .MuiTabs-flexContainer': {
                                    gap: 0,
                                },
                            }}
                        >
                            <Tab value="all" label={`All${fmtCount(conversations.length)}`} />
                            <Tab value="personal" label={`Personal${fmtCount(conversations.filter((c) => c.service_context == null && c.listing_context == null && c.other?.type !== 'business' && c.other?.type !== 'artist').length)}`} />
                            <Tab value="businesses" label={`Business${fmtCount(conversations.filter((c) => c.service_context == null && c.listing_context == null && c.other?.type === 'business').length)}`} />
                            <Tab value="artists" label={`Artists${fmtCount(conversations.filter((c) => c.service_context == null && c.listing_context == null && c.other?.type === 'artist').length)}`} />
                            <Tab
                                value="services"
                                label={`Services${fmtCount(conversations.filter((c) => c.service_context != null && c.listing_context == null).length)}`}
                            />
                            <Tab
                                value="marketplace"
                                label={`Marketplace${fmtCount(conversations.filter((c) => c.listing_context != null).length)}`}
                            />
                        </Tabs>
                    </Box>

                    {/* Gmail-style toolbar row */}
                    <Box sx={{
                        px: 1, py: 0.5,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        flexShrink: 0,
                        minHeight: 36,
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                            <Tooltip title={selectMode ? (selectedConvIds.length === filteredConvos.length && filteredConvos.length > 0 ? 'Deselect all' : 'Select all') : 'Select'} arrow>
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        if (!selectMode) {
                                            setSelectMode(true);
                                        } else {
                                            handleSelectAll();
                                        }
                                    }}
                                    sx={{ color: 'text.secondary', width: 30, height: 30 }}
                                >
                                    {!selectMode && <CheckBoxOutlineBlankRoundedIcon sx={{ fontSize: 19 }} />}
                                    {selectMode && selectedConvIds.length === 0 && <CheckBoxOutlineBlankRoundedIcon sx={{ fontSize: 19 }} />}
                                    {selectMode && selectedConvIds.length > 0 && selectedConvIds.length < filteredConvos.length && (
                                        <IndeterminateCheckBoxRoundedIcon sx={{ fontSize: 19, color: 'primary.main' }} />
                                    )}
                                    {selectMode && filteredConvos.length > 0 && selectedConvIds.length === filteredConvos.length && (
                                        <CheckBoxRoundedIcon sx={{ fontSize: 19, color: 'primary.main' }} />
                                    )}
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Refresh" arrow>
                                <IconButton
                                    size="small"
                                    onClick={() => fetchInbox()}
                                    sx={{ color: 'text.secondary', width: 30, height: 30 }}
                                >
                                    <RefreshRoundedIcon sx={{ fontSize: 19 }} />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        {selectMode && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                {selectedConvIds.length > 0 && (
                                    <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.73rem', color: 'primary.main', mr: 0.5 }}>
                                        {selectedConvIds.length}
                                    </Typography>
                                )}
                                <Tooltip title="Delete selected" arrow>
                                    <span>
                                        <IconButton
                                            size="small"
                                            disabled={selectedConvIds.length === 0}
                                            onClick={() => setBulkDeleteOpen(true)}
                                            sx={{ color: 'error.main', width: 30, height: 30 }}
                                        >
                                            <DeleteOutlineIcon sx={{ fontSize: 19 }} />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                                <Button
                                    size="small"
                                    onClick={exitSelectMode}
                                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.72rem', borderRadius: 999, minWidth: 0, px: 1, py: 0.25 }}
                                >
                                    Done
                                </Button>
                            </Box>
                        )}
                    </Box>

                    {/* Conversation list — on mobile, paddingBottom reserves space for
                        the bottom nav (and weather bar) which float over this page. */}
                    <Box sx={{
                        flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden',
                        pb: { xs: '60px', md: 0 },
                        scrollbarWidth: 'thin',
                        '&::-webkit-scrollbar': { width: 6 },
                        '&::-webkit-scrollbar-thumb': { bgcolor: (t) => alpha(t.palette.primary.main, 0.15), borderRadius: 3 },
                    }}>
                        {!loading && isNetworkError(inboxError) && conversations.length === 0 ? (
                            <NetworkErrorState onRetry={fetchInbox} />
                        ) : loading ? (
                            <Box sx={{ px: 2, py: 1 }}>
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Box key={i} sx={{ display: 'flex', gap: 1.5, py: 1.5 }}>
                                        <Skeleton variant="circular" width={44} height={44} />
                                        <Box sx={{ flex: 1 }}>
                                            <Skeleton width="60%" height={20} />
                                            <Skeleton width="90%" height={16} sx={{ mt: 0.5 }} />
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        ) : filteredConvos.length === 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, px: 3 }}>
                                {inboxFilter === 'services' ? (
                                    <HandymanRoundedIcon sx={{ fontSize: 48, color: 'warning.light', mb: 1.5 }} />
                                ) : inboxFilter === 'businesses' ? (
                                    <StorefrontOutlinedIcon sx={{ fontSize: 48, color: 'primary.light', mb: 1.5 }} />
                                ) : inboxFilter === 'artists' ? (
                                    <StarRoundedIcon sx={{ fontSize: 48, color: 'primary.light', mb: 1.5 }} />
                                ) : (
                                    <MailOutlinedIcon sx={{ fontSize: 48, color: 'primary.light', mb: 1.5 }} />
                                )}
                                <Typography variant="body1" sx={{ fontWeight: 800, color: 'text.secondary', textAlign: 'center' }}>
                                    {searchQuery
                                        ? 'No matching conversations'
                                        : inboxFilter === 'services'
                                            ? 'No service messages yet'
                                            : inboxFilter === 'businesses'
                                                ? 'No business messages yet'
                                                : inboxFilter === 'artists'
                                                    ? 'No artist messages yet'
                                                    : inboxFilter === 'personal'
                                                        ? 'No personal messages yet'
                                                        : 'No messages yet'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', mt: 0.5 }}>
                                    {searchQuery
                                        ? 'Try a different search'
                                        : inboxFilter === 'services'
                                            ? 'Messages from service inquiries will appear here'
                                            : inboxFilter === 'businesses'
                                                ? 'Messages to businesses will appear here'
                                                : inboxFilter === 'artists'
                                                    ? 'Messages to artists will appear here'
                                                    : 'Start a conversation with someone you follow'}
                                </Typography>
                            </Box>
                        ) : (
                            filteredConvos.map((conv) => {
                                const isSelected = conv.id === selectedConvId;
                                const hasUnread = conv.unread_count > 0;
                                const isChecked = selectedConvIds.includes(conv.id);
                                return (
                                    <Box
                                        key={conv.id}
                                        onClick={() => {
                                            if (selectMode) {
                                                toggleSelectConv(conv.id);
                                            } else {
                                                handleSelectConv(conv.id);
                                            }
                                        }}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.5,
                                            px: 2, py: 1.5,
                                            cursor: 'pointer',
                                            bgcolor: isChecked
                                                ? (t) => alpha(t.palette.primary.main, 0.1)
                                                : isSelected
                                                    ? (t) => alpha(t.palette.primary.main, 0.08)
                                                    : hasUnread
                                                        ? (t) => alpha(t.palette.primary.main, 0.03)
                                                        : 'transparent',
                                            borderLeft: !selectMode && isSelected ? '3px solid' : '3px solid transparent',
                                            borderColor: !selectMode && isSelected ? 'primary.main' : 'transparent',
                                            transition: `background-color 120ms ${UI_EASE}`,
                                            '&:hover': {
                                                bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
                                            },
                                        }}
                                    >
                                        {selectMode && (
                                            <IconButton
                                                size="small"
                                                onClick={(e) => { e.stopPropagation(); toggleSelectConv(conv.id); }}
                                                sx={{ p: 0, flexShrink: 0, color: isChecked ? 'primary.main' : 'text.disabled' }}
                                            >
                                                {isChecked
                                                    ? <CheckBoxRoundedIcon sx={{ fontSize: 22 }} />
                                                    : <CheckBoxOutlineBlankRoundedIcon sx={{ fontSize: 22 }} />
                                                }
                                            </IconButton>
                                        )}
                                        <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
                                            <Avatar
                                                src={conv.is_group ? undefined : (conv.other?.type === 'system' ? LocalLanternLogo : getAvatarSrc(conv.other))}
                                                sx={{
                                                    width: 44, height: 44, flexShrink: 0,
                                                    bgcolor: (t) => conv.is_group
                                                        ? alpha(t.palette.primary.main, 0.15)
                                                        : (conv.other?.type === 'system' || getAvatarSrc(conv.other)) ? 'transparent'
                                                            : alpha(t.palette.primary.main, 0.12),
                                                    color: 'primary.main',
                                                    fontSize: '0.95rem',
                                                    fontWeight: 800,
                                                }}
                                            >
                                                {conv.is_group
                                                    ? <PeopleOutlinedIcon sx={{ fontSize: 22 }} />
                                                    : !getAvatarSrc(conv.other) && conv.other?.type !== 'system' && (conv.other?.type === 'business' ? <StorefrontOutlinedIcon sx={{ fontSize: 22 }} />
                                                    : conv.other?.type === 'artist' ? (() => { const Ic = artistDefaultIcon(conv.other); return <Ic sx={{ fontSize: 22 }} />; })()
                                                        : <PersonRoundedIcon sx={{ fontSize: 22 }} />)}
                                            </Avatar>
                                            <OnlineDot visible={!conv.is_group && conv.other?.is_online && conv.other?.type !== 'system'} />
                                        </Box>

                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1 }}>
                                                    <Typography
                                                        variant="body2"
                                                        noWrap
                                                        sx={{
                                                            fontWeight: hasUnread ? 900 : 700,
                                                            color: hasUnread ? 'text.primary' : 'text.secondary',
                                                            fontSize: '0.875rem',
                                                        }}
                                                    >
                                                        {conv.is_group
                                                            ? (conv.group_name || conv.group_participants?.map((p) => p.name).join(', ') || 'Group')
                                                            : (conv.other?.name || 'Unknown')}
                                                    </Typography>
                                                    {!conv.is_group && conv.other?.is_verified && conv.other?.type === 'system' && (
                                                        <VerifiedRoundedIcon sx={{ fontSize: 14, color: 'primary.main', flexShrink: 0 }} />
                                                    )}
                                                </Box>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        flexShrink: 0,
                                                        fontWeight: hasUnread ? 800 : 600,
                                                        color: hasUnread ? 'primary.main' : 'text.disabled',
                                                        fontSize: '0.7rem',
                                                    }}
                                                >
                                                    {timeAgo(conv.last_message_at)}
                                                </Typography>
                                            </Box>

                                            {!conv.is_group && conv.other?.handle && (
                                                <Typography
                                                    variant="caption"
                                                    noWrap
                                                    sx={{ fontSize: '0.72rem', color: 'text.disabled', fontWeight: 600, display: 'block', lineHeight: 1.3 }}
                                                >
                                                    @{conv.other.handle}
                                                </Typography>
                                            )}

                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                                                {conv.subject && (
                                                    <Typography
                                                        variant="caption"
                                                        noWrap
                                                        sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}
                                                    >
                                                        {conv.subject} —
                                                    </Typography>
                                                )}
                                                <Typography
                                                    variant="caption"
                                                    noWrap
                                                    sx={{
                                                        flex: 1,
                                                        fontWeight: hasUnread ? 700 : 500,
                                                        color: hasUnread ? 'text.primary' : 'text.disabled',
                                                        fontSize: '0.78rem',
                                                    }}
                                                >
                                                    {conv.last_message_snippet || 'No messages'}
                                                </Typography>
                                                {hasUnread && (
                                                    <Box sx={{
                                                        minWidth: 20, height: 20,
                                                        borderRadius: 999,
                                                        bgcolor: 'primary.main',
                                                        color: 'primary.contrastText',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.65rem', fontWeight: 900,
                                                        px: 0.5, flexShrink: 0,
                                                    }}>
                                                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                                                    </Box>
                                                )}
                                            </Box>

                                            {!conv.is_group && conv.other?.type && conv.other.type !== 'personal' && conv.other.type !== 'system' && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                                    {accountTypeIcon(conv.other.type)}
                                                    <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'primary.main', textTransform: 'uppercase' }}>
                                                        {conv.other.type}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {conv.service_context && (
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    mt: 0.4,
                                                    px: 0.75,
                                                    py: 0.25,
                                                    borderRadius: 1,
                                                    bgcolor: (t) => alpha(t.palette.warning.main, 0.08),
                                                    border: '1px solid',
                                                    borderColor: (t) => alpha(t.palette.warning.main, 0.2),
                                                    width: 'fit-content',
                                                }}>
                                                    <HandymanRoundedIcon sx={{ fontSize: 12, color: 'warning.main' }} />
                                                    <Typography
                                                        variant="caption"
                                                        noWrap
                                                        sx={{
                                                            fontSize: '0.62rem',
                                                            fontWeight: 800,
                                                            color: 'warning.dark',
                                                            maxWidth: 160,
                                                        }}
                                                    >
                                                        Re: {conv.service_context.service_title}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {conv.listing_context && (
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    mt: 0.4,
                                                    px: 0.75,
                                                    py: 0.25,
                                                    borderRadius: 1,
                                                    bgcolor: (t) => alpha(t.palette.success.main, 0.08),
                                                    border: '1px solid',
                                                    borderColor: (t) => alpha(t.palette.success.main, 0.2),
                                                    width: 'fit-content',
                                                }}>
                                                    <LocalOfferOutlinedIcon sx={{ fontSize: 12, color: 'success.main' }} />
                                                    <Typography
                                                        variant="caption"
                                                        noWrap
                                                        sx={{
                                                            fontSize: '0.62rem',
                                                            fontWeight: 800,
                                                            color: 'success.dark',
                                                            maxWidth: 220,
                                                        }}
                                                    >
                                                        Re: {conv.listing_context.listing_title}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                );
                            })
                        )}
                    </Box>
                </Box>
            )}

            {/* ════════ RIGHT: Reading Pane ════════ */}
            {/* Desktop: rendered inline alongside the conversation list.
                Mobile: rendered inside a SwipeableRightDrawer that slides in from
                the right and can be swiped right to dismiss. Drawer is full-width
                between the top chrome and bottom nav, with bgcolor matching the
                page container so there's no visible seam. */}
            {(!isMobile || showDetailMobile) && (
                <MobilePaneWrap
                    isMobile={isMobile}
                    open={!!showDetailMobile}
                    onClose={handleBack}
                >
                    <Box sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        minHeight: 0,
                        overflow: 'hidden',
                        minWidth: 0,
                        bgcolor: 'background.paper',
                    }}>
                        {!selectedConvId ? (
                            /* ── Empty state ── */
                            <Box sx={{
                                flex: 1, display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', gap: 1.5, px: 3,
                            }}>
                                <MailOutlinedIcon sx={{ fontSize: 64, color: (t) => alpha(t.palette.primary.main, 0.3) }} />
                                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.disabled' }}>
                                    Select a conversation
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center' }}>
                                    Pick a conversation from the left to read and reply
                                </Typography>
                            </Box>
                        ) : detailLoading ? (
                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CircularProgress size={32} />
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                                {/* ── Conversation header ── On mobile this drawer is fullscreen,
                                but the SwipeableRightDrawer wrapper already applies env(safe-area-inset-top)
                                to its Paper, so the header only needs normal padding here. */}
                                <Box sx={{
                                    px: { xs: 1.25, md: 2 }, py: { xs: 0.75, md: 1.25 },
                                    display: 'flex', alignItems: 'center', gap: { xs: 0.75, md: 1.5 },
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    flexShrink: 0,
                                    minHeight: { xs: 52, md: 'auto' },
                                }}>
                                    {isMobile && (
                                        <IconButton size="small" onClick={handleBack} sx={{ mr: 0, flexShrink: 0 }}>
                                            <ArrowBackRoundedIcon sx={{ fontSize: 22 }} />
                                        </IconButton>
                                    )}

                                    {convDetail && (() => {
                                        // Use the pre-resolved "other" from the conversation list (backend already figured it out)
                                        const listConv = conversations.find((c) => c.id === selectedConvId);
                                        const other = listConv?.other
                                            || (convMessages.some((m) => m.is_mine && m.sender_type === convDetail.participant_a?.type && Number(m.sender_id) === Number(convDetail.participant_a?.id))
                                                ? convDetail.participant_b
                                                : convDetail.participant_a)
                                            || convDetail.participant_b
                                            || convDetail.participant_a;

                                        return (
                                            <>
                                                <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
                                                    <Avatar
                                                        src={other.type === 'system' ? LocalLanternLogo : getAvatarSrc(other)}
                                                        sx={{
                                                            width: { xs: 32, md: 36 }, height: { xs: 32, md: 36 }, flexShrink: 0,
                                                            bgcolor: (t) => (other.type === 'system' || getAvatarSrc(other)) ? 'transparent'
                                                                : alpha(t.palette.primary.main, 0.12),
                                                            color: 'primary.main',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 800,
                                                        }}
                                                        onClick={() => other.handle && navigate(`/${other.handle}`)}
                                                        style={{ cursor: other.handle ? 'pointer' : 'default' }}
                                                    >
                                                        {!getAvatarSrc(other) && other.type !== 'system' && (other.type === 'business' ? <StorefrontOutlinedIcon sx={{ fontSize: 18 }} />
                                                            : other.type === 'artist' ? (() => { const Ic = artistDefaultIcon(other); return <Ic sx={{ fontSize: 18 }} />; })()
                                                                : <PersonRoundedIcon sx={{ fontSize: 18 }} />)}
                                                    </Avatar>
                                                    <OnlineDot visible={other?.is_online && other?.type !== 'system'} size={11} offset={0} />
                                                </Box>
                                                <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <Typography
                                                            variant="body2"
                                                            noWrap
                                                            sx={{
                                                                fontWeight: 900, fontSize: { xs: '0.82rem', md: '0.9rem' },
                                                                cursor: other.handle ? 'pointer' : 'default',
                                                                '&:hover': other.handle ? { textDecoration: 'underline' } : {},
                                                            }}
                                                            onClick={() => other.handle && navigate(`/${other.handle}`)}
                                                        >
                                                            {other.name}
                                                        </Typography>
                                                        {other.is_verified && other.type === 'system' && (
                                                            <VerifiedRoundedIcon sx={{ fontSize: 15, color: 'primary.main', flexShrink: 0 }} />
                                                        )}
                                                    </Box>
                                                    {other.handle && (
                                                        <Typography
                                                            variant="caption"
                                                            noWrap
                                                            sx={{
                                                                color: 'text.disabled', fontWeight: 600, fontSize: '0.72rem', display: 'block', lineHeight: 1.3,
                                                                cursor: 'pointer',
                                                                '&:hover': { textDecoration: 'underline' },
                                                            }}
                                                            onClick={() => navigate(`/${other.handle}`)}
                                                        >
                                                            @{other.handle}
                                                        </Typography>
                                                    )}
                                                    {other?.is_online && other?.type !== 'system' && (
                                                        <Typography
                                                            variant="caption"
                                                            noWrap
                                                            sx={{
                                                                color: '#44b700',
                                                                fontWeight: 700,
                                                                fontSize: '0.68rem',
                                                                display: 'block',
                                                                lineHeight: 1.2,
                                                            }}
                                                        >
                                                            Online
                                                        </Typography>
                                                    )}
                                                    {/* Subject line - truncated on mobile */}
                                                    {convDetail.subject && !conversationIsSystemNotice && (
                                                        <Typography variant="caption" noWrap sx={{ color: 'text.secondary', fontWeight: 700, display: { xs: 'none', sm: 'block' }, mt: 0.25 }}>
                                                            Subject: {convDetail.subject}
                                                        </Typography>
                                                    )}
                                                    {/* Service / Listing / System badges - hidden on mobile header, visible on desktop */}
                                                    <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                                                        {convDetail.service_context && (
                                                            <Box
                                                                sx={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: 0.5,
                                                                    mt: 0.4,
                                                                    px: 1,
                                                                    py: 0.3,
                                                                    borderRadius: 1.5,
                                                                    bgcolor: (t) => alpha(t.palette.warning.main, 0.08),
                                                                    border: '1px solid',
                                                                    borderColor: (t) => alpha(t.palette.warning.main, 0.2),
                                                                    cursor: convDetail.service_context.service_id ? 'pointer' : 'default',
                                                                    transition: 'background-color 150ms ease',
                                                                    maxWidth: '100%',
                                                                    overflow: 'hidden',
                                                                    '&:hover': convDetail.service_context.service_id ? {
                                                                        bgcolor: (t) => alpha(t.palette.warning.main, 0.14),
                                                                    } : {},
                                                                }}
                                                                onClick={() => {
                                                                    if (convDetail.service_context?.service_id) {
                                                                        navigate(`/services/${convDetail.service_context.service_id}`);
                                                                    }
                                                                }}
                                                            >
                                                                <HandymanRoundedIcon sx={{ fontSize: 13, color: 'warning.main' }} />
                                                                <Typography variant="caption" noWrap sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'warning.dark' }}>
                                                                    Service inquiry: {convDetail.service_context.service_title}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                        {conversationIsSystemNotice && (
                                                            <Chip
                                                                size="small"
                                                                color="warning"
                                                                icon={<MailOutlinedIcon sx={{ fontSize: 16 }} />}
                                                                label="Local Lantern notice"
                                                                sx={{ fontWeight: 800, mt: 0.4 }}
                                                            />
                                                        )}
                                                        {convDetail.listing_context && (
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'flex-start',
                                                                    gap: 0.5,
                                                                    mt: 0.4,
                                                                    px: 1,
                                                                    py: 0.3,
                                                                    borderRadius: 1.5,
                                                                    bgcolor: (t) => alpha(t.palette.success.main, 0.08),
                                                                    border: '1px solid',
                                                                    borderColor: (t) => alpha(t.palette.success.main, 0.2),
                                                                    cursor: convDetail.listing_context.listing_id ? 'pointer' : 'default',
                                                                    transition: 'background-color 150ms ease',
                                                                    '&:hover': convDetail.listing_context.listing_id ? {
                                                                        bgcolor: (t) => alpha(t.palette.success.main, 0.14),
                                                                    } : {},
                                                                    maxWidth: '100%',
                                                                }}
                                                                onClick={() => {
                                                                    if (convDetail.listing_context?.listing_id) {
                                                                        navigate(`/marketplace/${convDetail.listing_context.listing_id}`);
                                                                    }
                                                                }}
                                                            >
                                                                <LocalOfferOutlinedIcon sx={{ fontSize: 13, color: 'success.main', mt: '2px', flexShrink: 0 }} />
                                                                <Typography variant="caption" sx={{
                                                                    fontWeight: 800, fontSize: '0.72rem', color: 'success.dark',
                                                                    wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: 1.4,
                                                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                                                }}>
                                                                    Marketplace: {convDetail.listing_context.listing_title}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </>
                                        );
                                    })()}

                                    {/* Action icons - compact row, no wrapping */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>

                                        <Tooltip title="Delete conversation" arrow>
                                            <IconButton size="small" onClick={() => setDeleteConfirmId(selectedConvId)}>
                                                <DeleteOutlineIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Report conversation" arrow>
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setReportConversationOpen(true);
                                                    setReportConversationDetails('');
                                                    setReportConversationReason('');
                                                    setReportConversationSubmitted(false);
                                                }}
                                            >
                                                <OutlinedFlagRoundedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Block messages from this account" arrow>
                                            <IconButton size="small" onClick={() => {
                                                // Resolve "other" participant for block
                                                if (!convDetail) return;
                                                const hdrs = getAccountHeaders();
                                                const aType = hdrs['x-account-type'] || 'personal';
                                                const aId = aType === 'business'
                                                    ? Number(hdrs['x-business-id'] || 0)
                                                    : aType === 'artist'
                                                        ? Number(hdrs['x-artist-id'] || 0)
                                                        : Number(user?.id || 0);
                                                const isA = convDetail.participant_a?.type === aType && Number(convDetail.participant_a?.id) === aId;
                                                const o = isA ? convDetail.participant_b : convDetail.participant_a;
                                                setBlockConfirmConv(o);
                                            }}>
                                                <BlockIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Box>

                                {/* ── Messages thread (email-style) ── */}
                                <Box sx={{
                                    flex: 1,
                                    minHeight: 0,
                                    overflowY: 'auto',
                                    px: { xs: 1.5, md: 2.5 },
                                    py: 2,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1.5,
                                    scrollbarWidth: 'thin',
                                    bgcolor: (t) => alpha(t.palette.action.hover, 0.02),
                                    '&::-webkit-scrollbar': { width: 6 },
                                    '&::-webkit-scrollbar-thumb': {
                                        bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
                                        borderRadius: 3,
                                    },
                                }}>
                                    {convMessages.length === 0 ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                            <Typography variant="body2" sx={{ color: 'text.disabled' }}>No messages in this conversation</Typography>
                                        </Box>
                                    ) : (
                                        convMessages.map((msg) => {
                                            const senderIsA = convDetail?.participant_a &&
                                                msg.sender_type === convDetail.participant_a.type &&
                                                Number(msg.sender_id) === Number(convDetail.participant_a.id);
                                            const sender = senderIsA ? convDetail.participant_a : convDetail.participant_b;
                                            const msgPhotos = Array.isArray(msg.photos)
                                                ? msg.photos.map((p) => typeof p === 'string' ? { url: p } : p).filter((p) => p && p.url)
                                                : [];
                                            const avatarSrc = sender?.type === 'system' ? LocalLanternLogo : getAvatarSrc(sender);

                                            return (
                                                <Box key={msg.id} sx={{
                                                    bgcolor: 'background.paper',
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    borderRadius: 2.5,
                                                    overflow: 'hidden',
                                                    flexShrink: 0,
                                                }}>
                                                    {/* Email-style header bar */}
                                                    <Box sx={{
                                                        display: 'flex', alignItems: 'center', gap: 1.5,
                                                        px: { xs: 1.5, md: 2.5 }, py: 1.5,
                                                        bgcolor: (t) => msg.is_mine
                                                            ? alpha(t.palette.primary.main, 0.03)
                                                            : alpha(t.palette.action.hover, 0.025),
                                                        borderBottom: '1px solid',
                                                        borderColor: (t) => alpha(t.palette.divider, 0.5),
                                                    }}>
                                                        <Avatar
                                                            src={avatarSrc}
                                                            sx={{
                                                                width: 40, height: 40, flexShrink: 0,
                                                                bgcolor: (t) => avatarSrc ? 'transparent'
                                                                    : sender?.type === 'business'
                                                                        ? alpha(t.palette.primary.main, 0.12)
                                                                        : alpha(t.palette.primary.main, 0.15),
                                                                color: 'primary.main',
                                                                fontSize: '0.85rem',
                                                                fontWeight: 800,
                                                            }}
                                                        >
                                                            {!avatarSrc && (sender?.type === 'business' ? <StorefrontOutlinedIcon sx={{ fontSize: 20 }} />
                                                                : sender?.type === 'artist' ? (() => { const Ic = artistDefaultIcon(sender); return <Ic sx={{ fontSize: 20 }} />; })()
                                                                    : <PersonRoundedIcon sx={{ fontSize: 20 }} />)}
                                                        </Avatar>

                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                                <Typography sx={{
                                                                    fontWeight: 800, fontSize: '0.88rem', lineHeight: 1.3,
                                                                    color: msg.is_mine ? 'primary.main' : 'text.primary',
                                                                }}>
                                                                    {msg.is_mine ? 'Me' : (sender?.name || 'Unknown')}
                                                                </Typography>
                                                                {sender?.is_verified && !msg.is_mine && sender?.type === 'system' && (
                                                                    <VerifiedRoundedIcon sx={{ fontSize: 14, color: 'primary.main', flexShrink: 0 }} />
                                                                )}
                                                            </Box>
                                                            {sender?.handle && (
                                                                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, fontSize: '0.7rem', lineHeight: 1.3, display: 'block', mt: 0.1 }}>
                                                                    @{sender.handle}
                                                                </Typography>
                                                            )}
                                                            <Typography variant="caption" sx={{
                                                                color: 'text.disabled', fontWeight: 600, fontSize: '0.68rem',
                                                                whiteSpace: 'nowrap', display: 'block', textAlign: 'right', mt: 0.25,
                                                            }}>
                                                                {formatFullDate(msg.created_at)}
                                                            </Typography>
                                                        </Box>

                                                        {/* Report button — only on other user's messages */}
                                                        {!msg.is_mine && sender?.type !== 'system' && (
                                                            <Tooltip title="Report message" arrow>
                                                                <IconButton
                                                                    size="small"
                                                                    sx={{ ml: 0.25, opacity: 0.45, '&:hover': { opacity: 1, color: 'warning.main' } }}
                                                                    onClick={() => {
                                                                        setReportMessageId(msg.id);
                                                                        setReportMessageDetails('');
                                                                        setReportMessageReason('');
                                                                        setReportMessageSubmitted(false);
                                                                    }}
                                                                >
                                                                    <OutlinedFlagRoundedIcon sx={{ fontSize: 17 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Box>

                                                    {/* Message body */}
                                                    <Box sx={{ px: { xs: 1.5, md: 2.5 }, py: 1.5, minHeight: 40 }}>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                fontSize: '0.875rem',
                                                                lineHeight: 1.75,
                                                                whiteSpace: 'pre-wrap',
                                                                wordBreak: 'break-word',
                                                                color: 'text.primary',
                                                            }}
                                                        >
                                                            {msg.body}
                                                        </Typography>

                                                        {/* Attached photos */}
                                                        {msgPhotos.length > 0 && (
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                                                                {msgPhotos.map((photo, pIdx) => (
                                                                    <Box
                                                                        key={photo.url || pIdx}
                                                                        component="img"
                                                                        src={photo.url}
                                                                        alt={`Attachment ${pIdx + 1}`}
                                                                        referrerPolicy="no-referrer"
                                                                        onClick={() => setLightboxUrl(photo.url)}
                                                                        sx={{
                                                                            width: { xs: 100, sm: 130 },
                                                                            height: { xs: 100, sm: 130 },
                                                                            objectFit: 'cover',
                                                                            borderRadius: 2,
                                                                            border: '1px solid',
                                                                            borderColor: 'divider',
                                                                            cursor: 'pointer',
                                                                            transition: 'opacity 150ms ease, transform 150ms ease',
                                                                            '&:hover': { opacity: 0.85, transform: 'scale(1.02)' },
                                                                        }}
                                                                    />
                                                                ))}
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </Box>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </Box>

                                {/* ── Reply box (email compose style) ── On mobile this drawer
                                is fullscreen, so the composer reserves iOS safe-area-inset-bottom
                                to clear the home indicator. */}
                                {(
                                    <Box sx={{
                                        px: { xs: 1, md: 3 }, py: { xs: 0.75, md: 2 },
                                        pb: { xs: 'max(0.75rem, env(safe-area-inset-bottom))', md: 2 },
                                        borderTop: '1px solid',
                                        borderColor: 'divider',
                                        flexShrink: 0,
                                        bgcolor: 'background.paper',
                                    }}>
                                        <Box sx={{
                                            borderRadius: 2.5,
                                            bgcolor: 'background.paper',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            transition: 'border-color 200ms ease',
                                            '&:focus-within': { borderColor: 'primary.main' },
                                        }}>
                                            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1, px: 1.5, pt: { xs: 0.75, md: 1.25 }, pb: 0.5 }}>
                                                <ReplyRoundedIcon sx={{ fontSize: 16, color: 'text.disabled', transform: 'scaleX(-1)' }} />
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', fontSize: '0.72rem' }}>
                                                    Reply
                                                </Typography>
                                            </Box>
                                            <TextField
                                                multiline
                                                minRows={1}
                                                maxRows={4}
                                                placeholder="Write your reply..."
                                                value={replyText}
                                                onChange={(e) => {
                                                    setReplyText(e.target.value.slice(0, 5000));
                                                    if (replyError && sendCooldown <= 0) setReplyError('');
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendReply();
                                                    }
                                                }}
                                                fullWidth
                                                size="small"
                                                error={Boolean(replyError && sendCooldown <= 0)}
                                                inputProps={{ maxLength: 5000 }}
                                                helperText={
                                                    (replyError && sendCooldown <= 0)
                                                        ? replyError
                                                        : replyText.length > 0 ? `${replyText.length} / 5,000` : ''
                                                }
                                                FormHelperTextProps={{
                                                    sx: {
                                                        textAlign: (replyError && sendCooldown <= 0) ? 'left' : 'right',
                                                        mr: 0.5,
                                                        fontWeight: (replyError && sendCooldown <= 0) ? 700 : 600,
                                                        fontSize: '0.7rem',
                                                        mt: 0,
                                                        mb: 0.5,
                                                        color: (replyError && sendCooldown <= 0) ? 'error.main' : undefined,
                                                    },
                                                }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        border: 'none',
                                                        fontSize: { xs: '0.82rem', md: '0.875rem' },
                                                        '& fieldset': { border: 'none' },
                                                    },
                                                }}
                                            />
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1, md: 1.5 }, pb: { xs: 0.75, md: 1.5 }, pt: { xs: 0.25, md: 1 } }}>
                                                <CommentImageAttachments
                                                    files={replyFiles}
                                                    urls={replyImageUrls}
                                                    onFilesChange={setReplyFiles}
                                                    onUrlsChange={setReplyImageUrls}
                                                    maxImages={4}
                                                    disabled={sending}
                                                />
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    disabled={(!replyText.trim() && replyFiles.length === 0 && replyImageUrls.length === 0) || sending || sendCooldown > 0}
                                                    onClick={handleSendReply}
                                                    startIcon={sending ? <CircularProgress size={14} color="inherit" /> : <SendRoundedIcon sx={{ fontSize: 16 }} />}
                                                    sx={{
                                                        textTransform: 'none',
                                                        fontWeight: 800,
                                                        borderRadius: 999,
                                                        px: 2.5,
                                                        fontSize: '0.82rem',
                                                        boxShadow: 'none',
                                                        '&:hover': { boxShadow: 'none' },
                                                    }}
                                                >
                                                    {sendCooldown > 0 ? `Wait ${sendCooldown}s` : sending ? 'Sending...' : 'Send'}
                                                </Button>
                                            </Box>
                                            {replyError && sendCooldown > 0 && (
                                                <Box sx={{ px: 1.5, pb: 1 }}>
                                                    <Alert severity="warning" sx={{ py: 0, fontSize: '0.8rem', borderRadius: 2 }}>
                                                        {replyError}
                                                    </Alert>
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>
                </MobilePaneWrap>
            )}

            {/* ════════ COMPOSE DIALOG ════════ */}
            <ComposeDialog
                open={composeOpen}
                onClose={() => setComposeOpen(false)}
                onSent={(convId) => {
                    setComposeOpen(false);
                    fetchInbox();
                    if (convId) handleSelectConv(convId);
                }}
            />

            {/* ════════ DELETE CONFIRM DIALOG ════════ */}
            <Dialog
                open={Boolean(deleteConfirmId)}
                onClose={() => setDeleteConfirmId(null)}
                PaperProps={{ sx: { borderRadius: 3, maxWidth: 360 } }}
            >
                <DialogTitle sx={{ fontWeight: 900, pb: 0.5 }}>
                    Delete Conversation
                    <IconButton
                        size="small"
                        onClick={() => setDeleteConfirmId(null)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        This conversation will be permanently removed from your inbox. The other person will still be able to see it.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteConfirmId(null)} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => handleDeleteConversation(deleteConfirmId)}
                        sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2 }}
                        startIcon={<DeleteOutlineIcon />}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ════════ BLOCK CONFIRM DIALOG ════════ */}
            <Dialog
                open={Boolean(blockConfirmConv)}
                onClose={() => setBlockConfirmConv(null)}
                PaperProps={{ sx: { borderRadius: 3, maxWidth: 400 } }}
            >
                <DialogTitle sx={{ fontWeight: 900, pb: 0.5 }}>
                    Block messages from {blockConfirmConv?.name || 'this account'}?
                    <IconButton
                        size="small"
                        onClick={() => setBlockConfirmConv(null)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        They won't be able to send you messages, and this conversation will be deleted from your inbox. You can unblock them later from settings.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setBlockConfirmConv(null)} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => blockConfirmConv && handleBlockAccount(blockConfirmConv.type, blockConfirmConv.id)}
                        sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2 }}
                        startIcon={<BlockIcon />}
                    >
                        Block Messages
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ════════ REPORT CONVERSATION DIALOG ════════ */}
            <Dialog
                open={reportConversationOpen}
                onClose={() => {
                    if (reportConversationSubmitting) return;
                    setReportConversationOpen(false);
                    setTimeout(() => {
                        setReportConversationReason('');
                        setReportConversationDetails('');
                        setReportConversationSubmitted(false);
                    }, 250);
                }}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
            >
                {reportConversationSubmitted ? (
                    <>
                        <DialogContent sx={{ textAlign: 'center', py: 5, px: 3 }}>
                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                                <CheckCircleRoundedIcon sx={{ fontSize: 48, color: 'success.main' }} />
                            </Box>
                            <Typography sx={{ fontWeight: 800, fontSize: 18, mb: 1 }}>
                                Thank you for your report
                            </Typography>
                            <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.5 }}>
                                We take reports seriously and will review this conversation. If it violates our community guidelines, we'll take appropriate action.
                            </Typography>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 2.5 }}>
                            <Button
                                onClick={() => {
                                    setReportConversationOpen(false);
                                    setTimeout(() => {
                                        setReportConversationReason('');
                                        setReportConversationDetails('');
                                        setReportConversationSubmitted(false);
                                    }, 250);
                                }}
                                fullWidth
                                variant="contained"
                                disableElevation
                                sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2, py: 1 }}
                            >
                                Done
                            </Button>
                        </DialogActions>
                    </>
                ) : (
                    <>
                        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1.5, fontWeight: 800, fontSize: 18 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <OutlinedFlagRoundedIcon sx={{ fontSize: 22, color: 'text.secondary' }} />
                                Report conversation
                            </Box>
                            <IconButton size="small" onClick={() => {
                                if (reportConversationSubmitting) return;
                                setReportConversationOpen(false);
                                setTimeout(() => {
                                    setReportConversationReason('');
                                    setReportConversationDetails('');
                                    setReportConversationSubmitted(false);
                                }, 250);
                            }} aria-label="Close">
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent sx={{ pt: 0, pb: 1 }}>
                            <Typography sx={{ fontSize: 14, color: 'text.secondary', mb: 2, lineHeight: 1.5 }}>
                                Why are you reporting this conversation? Your report is anonymous.
                            </Typography>
                            <RadioGroup
                                value={reportConversationReason}
                                onChange={(e) => setReportConversationReason(e.target.value)}
                            >
                                {[
                                    { value: 'spam', label: 'Spam or scam' },
                                    { value: 'harassment', label: 'Harassment or hate' },
                                    { value: 'inappropriate', label: 'Inappropriate content' },
                                    { value: 'impersonation', label: 'Impersonation' },
                                    { value: 'unwanted', label: 'Unwanted contact' },
                                    { value: 'other', label: 'Other' },
                                ].map((opt) => (
                                    <FormControlLabel
                                        key={opt.value}
                                        value={opt.value}
                                        control={<Radio size="small" />}
                                        label={<Typography sx={{ fontSize: 14 }}>{opt.label}</Typography>}
                                        sx={{
                                            mx: 0,
                                            py: 0.25,
                                            px: 1,
                                            borderRadius: 2,
                                            '&:hover': { bgcolor: 'action.hover' },
                                        }}
                                    />
                                ))}
                            </RadioGroup>
                            <TextField
                                multiline
                                minRows={3}
                                maxRows={6}
                                fullWidth
                                placeholder="Add any additional details that might help us review this report…"
                                value={reportConversationDetails}
                                onChange={(e) => setReportConversationDetails(e.target.value)}
                                inputProps={{ maxLength: 1000 }}
                                sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 14 } }}
                            />
                            <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 0.5, textAlign: 'right' }}>
                                {reportConversationDetails.length}/1000
                            </Typography>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                            <Button
                                onClick={() => {
                                    setReportConversationOpen(false);
                                    setTimeout(() => {
                                        setReportConversationReason('');
                                        setReportConversationDetails('');
                                        setReportConversationSubmitted(false);
                                    }, 250);
                                }}
                                disabled={reportConversationSubmitting}
                                sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2, color: 'text.secondary' }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleReportConversation}
                                variant="contained"
                                disableElevation
                                disabled={!reportConversationReason || reportConversationSubmitting}
                                startIcon={reportConversationSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
                                sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2, px: 3 }}
                            >
                                Submit report
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* ════════ REPORT SINGLE MESSAGE DIALOG ════════ */}
            <Dialog
                open={Boolean(reportMessageId)}
                onClose={() => {
                    if (reportMessageSubmitting) return;
                    setReportMessageId(null);
                    setTimeout(() => {
                        setReportMessageReason('');
                        setReportMessageDetails('');
                        setReportMessageSubmitted(false);
                    }, 250);
                }}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
            >
                {reportMessageSubmitted ? (
                    <>
                        <DialogContent sx={{ textAlign: 'center', py: 5, px: 3 }}>
                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                                <CheckCircleRoundedIcon sx={{ fontSize: 48, color: 'success.main' }} />
                            </Box>
                            <Typography sx={{ fontWeight: 800, fontSize: 18, mb: 1 }}>
                                Thank you for your report
                            </Typography>
                            <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.5 }}>
                                We take reports seriously and will review this message. If it violates our community guidelines, we'll take appropriate action.
                            </Typography>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 2.5 }}>
                            <Button
                                onClick={() => {
                                    setReportMessageId(null);
                                    setTimeout(() => {
                                        setReportMessageReason('');
                                        setReportMessageDetails('');
                                        setReportMessageSubmitted(false);
                                    }, 250);
                                }}
                                fullWidth
                                variant="contained"
                                disableElevation
                                sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2, py: 1 }}
                            >
                                Done
                            </Button>
                        </DialogActions>
                    </>
                ) : (
                    <>
                        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1.5, fontWeight: 800, fontSize: 18 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <OutlinedFlagRoundedIcon sx={{ fontSize: 22, color: 'text.secondary' }} />
                                Report message
                            </Box>
                            <IconButton size="small" onClick={() => {
                                if (reportMessageSubmitting) return;
                                setReportMessageId(null);
                                setTimeout(() => {
                                    setReportMessageReason('');
                                    setReportMessageDetails('');
                                    setReportMessageSubmitted(false);
                                }, 250);
                            }} aria-label="Close">
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent sx={{ pt: 0, pb: 1 }}>
                            <Typography sx={{ fontSize: 14, color: 'text.secondary', mb: 2, lineHeight: 1.5 }}>
                                Why are you reporting this message? Your report is anonymous.
                            </Typography>
                            <RadioGroup
                                value={reportMessageReason}
                                onChange={(e) => setReportMessageReason(e.target.value)}
                            >
                                {[
                                    { value: 'spam', label: 'Spam or scam' },
                                    { value: 'harassment', label: 'Harassment or hate' },
                                    { value: 'inappropriate', label: 'Inappropriate content' },
                                    { value: 'threatening', label: 'Threatening or violent' },
                                    { value: 'impersonation', label: 'Impersonation' },
                                    { value: 'other', label: 'Other' },
                                ].map((opt) => (
                                    <FormControlLabel
                                        key={opt.value}
                                        value={opt.value}
                                        control={<Radio size="small" />}
                                        label={<Typography sx={{ fontSize: 14 }}>{opt.label}</Typography>}
                                        sx={{
                                            mx: 0,
                                            py: 0.25,
                                            px: 1,
                                            borderRadius: 2,
                                            '&:hover': { bgcolor: 'action.hover' },
                                        }}
                                    />
                                ))}
                            </RadioGroup>
                            <TextField
                                multiline
                                minRows={3}
                                maxRows={6}
                                fullWidth
                                placeholder="Add any additional details that might help us review this report…"
                                value={reportMessageDetails}
                                onChange={(e) => setReportMessageDetails(e.target.value)}
                                inputProps={{ maxLength: 1000 }}
                                sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 14 } }}
                            />
                            <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 0.5, textAlign: 'right' }}>
                                {reportMessageDetails.length}/1000
                            </Typography>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                            <Button
                                onClick={() => {
                                    setReportMessageId(null);
                                    setTimeout(() => {
                                        setReportMessageReason('');
                                        setReportMessageDetails('');
                                        setReportMessageSubmitted(false);
                                    }, 250);
                                }}
                                disabled={reportMessageSubmitting}
                                sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2, color: 'text.secondary' }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleReportMessage}
                                variant="contained"
                                disableElevation
                                disabled={!reportMessageReason || reportMessageSubmitting}
                                startIcon={reportMessageSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
                                sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2, px: 3 }}
                            >
                                Submit report
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* ════════ BLOCKED ACCOUNTS DIALOG ════════ */}
            <Dialog
                open={blockedOpen}
                onClose={() => setBlockedOpen(false)}
                PaperProps={{ sx: { borderRadius: 3, maxWidth: 440, width: '100%' } }}
            >
                <DialogTitle sx={{ fontWeight: 900, pb: 0.5 }}>
                    Blocked Accounts
                    <IconButton
                        size="small"
                        onClick={() => setBlockedOpen(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ px: 2, pb: 2 }}>
                    {blockedLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress size={28} color="primary" />
                        </Box>
                    ) : blockedAccounts.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <BlockIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                            <Typography variant="body2" sx={{ color: 'text.disabled', fontWeight: 600 }}>
                                No blocked accounts
                            </Typography>
                        </Box>
                    ) : (
                        blockedAccounts.map((acct) => (
                            <Box
                                key={`${acct.type}:${acct.id}`}
                                sx={{
                                    display: 'flex', alignItems: 'center', gap: 1.5,
                                    py: 1.25, px: 1,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    '&:last-of-type': { borderBottom: 'none' },
                                }}
                            >
                                <Avatar
                                    src={getAvatarSrc(acct)}
                                    sx={{
                                        width: 38, height: 38,
                                        bgcolor: (t) => getAvatarSrc(acct) ? 'transparent' : alpha(t.palette.primary.main, 0.12),
                                        color: 'primary.main',
                                        fontSize: '0.85rem',
                                        fontWeight: 800,
                                    }}
                                >
                                    {!getAvatarSrc(acct) && (acct.type === 'business' ? <StorefrontOutlinedIcon sx={{ fontSize: 18 }} />
                                        : acct.type === 'artist' ? (() => { const Ic = artistDefaultIcon(acct); return <Ic sx={{ fontSize: 18 }} />; })()
                                            : <PersonRoundedIcon sx={{ fontSize: 18 }} />)}
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" noWrap sx={{ fontWeight: 800, fontSize: '0.875rem' }}>
                                        {acct.name}
                                    </Typography>
                                    {acct.handle && (
                                        <Typography variant="caption" noWrap sx={{ color: 'text.disabled', fontWeight: 600, fontSize: '0.72rem' }}>
                                            @{acct.handle}
                                        </Typography>
                                    )}
                                </Box>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => handleUnblock(acct.type, acct.id)}
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 800,
                                        borderRadius: 2,
                                        fontSize: '0.75rem',
                                        minWidth: 70,
                                        borderColor: 'divider',
                                        color: 'text.secondary',
                                        '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
                                    }}
                                >
                                    Unblock
                                </Button>
                            </Box>
                        ))
                    )}
                </DialogContent>
            </Dialog>

            {/* ════════ IMAGE LIGHTBOX DIALOG ════════ */}
            <Dialog
                open={Boolean(lightboxUrl)}
                onClose={() => setLightboxUrl(null)}
                maxWidth="md"
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        bgcolor: 'background.paper',
                        overflow: 'hidden',
                        maxHeight: '90vh',
                        maxWidth: '90vw',
                    },
                }}
            >
                <IconButton
                    size="small"
                    onClick={() => setLightboxUrl(null)}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        zIndex: 1,
                        bgcolor: (t) => alpha(t.palette.common.black, 0.5),
                        color: 'common.white',
                        '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.7) },
                    }}
                >
                    <CloseIcon sx={{ fontSize: 20 }} />
                </IconButton>
                {lightboxUrl && (
                    <Box
                        component="img"
                        src={lightboxUrl}
                        alt="Attachment"
                        referrerPolicy="no-referrer"
                        sx={{
                            display: 'block',
                            maxWidth: '100%',
                            maxHeight: '85vh',
                            objectFit: 'contain',
                        }}
                    />
                )}
            </Dialog>

            {/* ════════ BULK DELETE CONFIRM DIALOG ════════ */}
            <Dialog
                open={bulkDeleteOpen}
                onClose={() => setBulkDeleteOpen(false)}
                PaperProps={{ sx: { borderRadius: 3, maxWidth: 400 } }}
            >
                <DialogTitle sx={{ fontWeight: 900, pb: 0.5 }}>
                    Delete {selectedConvIds.length} conversation{selectedConvIds.length !== 1 ? 's' : ''}?
                    <IconButton
                        size="small"
                        onClick={() => setBulkDeleteOpen(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {selectedConvIds.length === 1
                            ? 'This conversation will be permanently removed from your inbox.'
                            : `These ${selectedConvIds.length} conversations will be permanently removed from your inbox.`}
                        {' '}The other participants will still be able to see them.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setBulkDeleteOpen(false)} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        disabled={bulkDeleting}
                        onClick={handleBulkDelete}
                        sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2 }}
                        startIcon={bulkDeleting ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
                    >
                        {bulkDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            <SuccessSnackbar {...successSnackbarProps} />
        </Box>
    );
}


/* ════════════════════════════════════════════════════════════════════════════
   COMPOSE DIALOG — Tabbed recipient picker + message compose
   ════════════════════════════════════════════════════════════════════════════ */
const TABS = ['friends', 'businesses', 'artists'];
const TAB_LABELS = { friends: 'Friends', businesses: 'Businesses', artists: 'Artists' };
const TAB_ICONS = {
    friends: <PeopleOutlinedIcon sx={{ fontSize: 18 }} />,
    businesses: <StorefrontOutlinedIcon sx={{ fontSize: 18 }} />,
    artists: <StarRoundedIcon sx={{ fontSize: 18 }} />,
};

function ComposeDialog({ open, onClose, onSent }) {
    // ── Mobile detection (for fullscreen dialog on small screens)
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // ── Step: 'pick' (selecting recipients) or 'compose' (writing message)
    const [step, setStep] = useState('pick');
    const [activeTab, setActiveTab] = useState('friends');

    // ── Filters
    const [searchQ, setSearchQ] = useState('');
    const [filterCity, setFilterCity] = useState('');
    const [filterCounty, setFilterCounty] = useState('');

    // ── Results
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    // ── Selection
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [selectedSingle, setSelectedSingle] = useState(null);
    const [sendMode, setSendMode] = useState('individual'); // 'individual' | 'group'

    // ── Compose
    const [body, setBody] = useState('');
    const [composeFiles, setComposeFiles] = useState([]);
    const [composeImageUrls, setComposeImageUrls] = useState([]);
    const [sending, setSending] = useState(false);
    const [composeCooldown, setComposeCooldown] = useState(0);
    const [error, setError] = useState('');

    const debounceRef = useRef(null);
    const LIMIT = 25;

    // ── Reset on close
    useEffect(() => {
        if (!open) {
            const t = setTimeout(() => {
                setStep('pick');
                setActiveTab('friends');
                setSearchQ('');
                setFilterCity('');
                setFilterCounty('');
                setItems([]);
                setTotal(0);
                setOffset(0);
                setHasLoaded(false);
                setSelectedFriends([]);
                setSelectedSingle(null);
                setSendMode('individual');
                setBody('');
                setComposeFiles([]);
                setComposeImageUrls([]);
                setError('');
                setComposeCooldown(0);
            }, 200);
            return () => clearTimeout(t);
        }
    }, [open]);

    // ── Fetch recipients
    const fetchRecipients = useCallback(async (tab, q, city, county, off, append) => {
        setLoading(true);
        try {
            const params = { tab, limit: LIMIT, offset: off };
            if (q) params.q = q;
            if (city) params.city = city;
            if (county) params.county = county;
            const res = await axios.get(API('/recipients'), { ...getAxCfg(), params });
            const newItems = res.data?.items || [];
            const newTotal = Number(res.data?.total || 0);
            setItems((prev) => append ? [...prev, ...newItems] : newItems);
            setTotal(newTotal);
            setHasLoaded(true);
        } catch {
            if (!append) setItems([]);
            setHasLoaded(true);
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Debounced search effect
    useEffect(() => {
        if (!open || step !== 'pick') return;
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setOffset(0);
            fetchRecipients(activeTab, searchQ, filterCity, filterCounty, 0, false);
        }, 300);
        return () => clearTimeout(debounceRef.current);
    }, [open, step, activeTab, searchQ, filterCity, filterCounty, fetchRecipients]);

    // ── Load more
    const handleLoadMore = () => {
        const next = offset + LIMIT;
        setOffset(next);
        fetchRecipients(activeTab, searchQ, filterCity, filterCounty, next, true);
    };

    // ── Tab change
    const handleTabChange = (_e, v) => {
        setActiveTab(TABS[v]);
        setSearchQ('');
        setFilterCity('');
        setFilterCounty('');
        setItems([]);
        setOffset(0);
        setHasLoaded(false);
    };

    // ── Toggle friend selection (multi-select)
    const toggleFriend = (item) => {
        setSelectedFriends((prev) => {
            const exists = prev.find((f) => f.id === item.id);
            if (exists) return prev.filter((f) => f.id !== item.id);
            return [...prev, item];
        });
    };

    // ── Select business/artist (single → go to compose)
    const selectSingle = (item) => {
        setSelectedSingle(item);
        setStep('compose');
    };

    // ── Proceed to compose with friends
    const proceedToCompose = () => {
        if (selectedFriends.length === 0) return;
        setStep('compose');
    };

    // ── Send message(s)
    const handleSend = async () => {
        const hasText = Boolean(body.trim());
        const hasImages = composeFiles.length > 0 || composeImageUrls.length > 0;
        if (!hasText && !hasImages) return;
        setSending(true);
        setError('');

        // Client-side profanity check
        if (hasText) {
            const profCheck = checkProfanity(body.trim());
            if (!profCheck.clean) {
                setError('Your message contains inappropriate language. Please revise and try again.');
                setSending(false);
                return;
            }
        }

        const recipients = selectedSingle
            ? [selectedSingle]
            : selectedFriends;

        try {
            const hasFileUploads = composeFiles.length > 0;
            let lastConvId = null;

            // ── Group message mode ──
            if (sendMode === 'group' && recipients.length > 1) {
                const participantIds = recipients.map((r) => ({
                    type: r.type,
                    id: r.id,
                }));

                if (hasFileUploads) {
                    const fd = new FormData();
                    fd.append('participants', JSON.stringify(participantIds));
                    fd.append('body', body.trim());
                    for (const file of composeFiles) fd.append('images', file);
                    if (composeImageUrls.length > 0) fd.append('image_urls', JSON.stringify(composeImageUrls));
                    const cfg = getAxCfg();
                    const res = await axios.post(API('/send-group'), fd, {
                        ...cfg,
                        headers: { ...cfg.headers, 'Content-Type': 'multipart/form-data' },
                    });
                    lastConvId = res.data?.conversation_id || null;
                } else {
                    const res = await axios.post(API('/send-group'), {
                        participants: participantIds,
                        body: body.trim(),
                        ...(composeImageUrls.length > 0 ? { photos: composeImageUrls } : {}),
                    }, getAxCfg());
                    lastConvId = res.data?.conversation_id || null;
                }
            } else {
                // ── Individual messages (original behavior) ──
                for (const r of recipients) {
                    if (hasFileUploads) {
                        const fd = new FormData();
                        fd.append('recipient_type', r.type);
                        fd.append('recipient_id', String(r.id));
                        fd.append('body', body.trim());
                        for (const file of composeFiles) fd.append('images', file);
                        if (composeImageUrls.length > 0) fd.append('image_urls', JSON.stringify(composeImageUrls));
                        const cfg = getAxCfg();
                        const res = await axios.post(API('/send'), fd, {
                            ...cfg,
                            headers: { ...cfg.headers, 'Content-Type': 'multipart/form-data' },
                        });
                        lastConvId = res.data?.conversation_id || lastConvId;
                    } else {
                        const res = await axios.post(API('/send'), {
                            recipient_type: r.type,
                            recipient_id: r.id,
                            body: body.trim(),
                            ...(composeImageUrls.length > 0 ? { photos: composeImageUrls } : {}),
                        }, getAxCfg());
                        lastConvId = res.data?.conversation_id || lastConvId;
                    }
                }
            }
            onSent(lastConvId);
        } catch (err) {
            const status = err.response?.status;
            const data = err.response?.data;
            if (status === 429) {
                const wait = Number(data?.retryAfterSeconds) || 15;
                setError(data?.message || 'You\'re sending messages too quickly. Please wait a moment.');
                setComposeCooldown(wait);
                const timer = setInterval(() => {
                    setComposeCooldown(prev => {
                        if (prev <= 1) { clearInterval(timer); setError(''); return 0; }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                setError(data?.message || 'Failed to send message');
            }
        } finally {
            setSending(false);
        }
    };

    // ── All selected recipients
    const allSelected = selectedSingle ? [selectedSingle] : selectedFriends;

    const hasMore = items.length < total;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            fullScreen={isMobile}
            sx={isMobile ? {
                '& .MuiDialog-container': { alignItems: 'stretch', justifyContent: 'stretch' },
                '& .MuiDialog-paper': {
                    m: 0,
                    width: '100%',
                    maxWidth: '100%',
                    height: '100%',
                    maxHeight: '100%',
                    borderRadius: 0,
                },
            } : undefined}
            PaperProps={{
                sx: isMobile
                    ? { width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }
                    : { borderRadius: 3, height: '85vh', maxHeight: 800, display: 'flex', flexDirection: 'column' }
            }}
        >
            {/* ── Header ── */}
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0.5, flexShrink: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {step === 'compose' && (
                        <IconButton size="small" onClick={() => setStep('pick')}>
                            <ArrowBackRoundedIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                    )}
                    <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1rem' }}>
                        {step === 'pick' ? 'New Message' : 'Compose'}
                    </Typography>
                </Box>
                <IconButton size="small" onClick={onClose}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            {step === 'pick' ? (
                /* ═══════ STEP 1: RECIPIENT PICKER ═══════ */
                <>
                    {/* Tabs */}
                    <Tabs
                        value={TABS.indexOf(activeTab)}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={{
                            minHeight: 40, flexShrink: 0,
                            '& .MuiTab-root': { minHeight: 40, textTransform: 'none', fontWeight: 800, fontSize: '0.8rem' },
                            '& .MuiTabs-indicator': { bgcolor: 'primary.main', height: 3, borderRadius: 2 },
                        }}
                    >
                        {TABS.map((tab) => (
                            <Tab key={tab} icon={TAB_ICONS[tab]} iconPosition="start" label={TAB_LABELS[tab]} />
                        ))}
                    </Tabs>

                    {/* Search + filters */}
                    <Box sx={{ px: 2, pt: 1.5, pb: 1, display: 'flex', flexDirection: 'column', gap: 1.5, flexShrink: 0 }}>
                        <TextField
                            size="small"
                            placeholder={`Search ${TAB_LABELS[activeTab].toLowerCase()}...`}
                            value={searchQ}
                            onChange={(e) => setSearchQ(e.target.value)}
                            fullWidth
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment>,
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' } }}
                        />
                        <CityCountySelect
                            city={filterCity}
                            setCity={setFilterCity}
                            county={filterCounty}
                            setCounty={setFilterCounty}
                            includeAllOptions
                            allCityValue=""
                            allCountyValue=""
                            emptyCityLabel="All Cities"
                            emptyCountyLabel="All Counties"
                            sx={{ flexDirection: 'row', gap: 1 }}
                            selectSx={{ flex: 1, minWidth: 120, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.8rem' } }}
                        />
                    </Box>

                    {/* Selected friends chips */}
                    {activeTab === 'friends' && selectedFriends.length > 0 && (
                        <Box sx={{ px: 2, pb: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5, flexShrink: 0, maxHeight: 100, overflowY: 'auto', scrollbarWidth: 'thin', '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: (t) => alpha(t.palette.primary.main, 0.12), borderRadius: 3 } }}>
                            {selectedFriends.map((f) => (
                                <Chip
                                    key={f.id}
                                    size="small"
                                    avatar={<Avatar src={getAvatarSrc(f)} sx={{ width: 22, height: 22 }} />}
                                    label={f.name}
                                    onDelete={() => toggleFriend(f)}
                                    sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                                />
                            ))}
                        </Box>
                    )}

                    <Divider />

                    {/* Results grid */}
                    <Box sx={{
                        flex: 1, overflowY: 'auto', px: 2, py: 1.5,
                        scrollbarWidth: 'thin',
                        '&::-webkit-scrollbar': { width: 5 },
                        '&::-webkit-scrollbar-thumb': { bgcolor: (t) => alpha(t.palette.primary.main, 0.12), borderRadius: 3 },
                    }}>
                        {!hasLoaded || (loading && items.length === 0) ? (
                            <PulsingDots size={9} sx={{ py: 5 }} />
                        ) : items.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 5 }}>
                                <Typography variant="body2" sx={{ color: 'text.disabled', fontWeight: 700 }}>
                                    {activeTab === 'friends' ? 'No mutual friends found' : `No ${TAB_LABELS[activeTab].toLowerCase()} found`}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                                    Try adjusting your search or filters
                                </Typography>
                            </Box>
                        ) : (
                            <>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
                                    {items.map((item) => {
                                        const key = `${item.type}:${item.id}`;
                                        const isSelected = activeTab === 'friends'
                                            ? selectedFriends.some((f) => f.id === item.id)
                                            : selectedSingle?.id === item.id && selectedSingle?.type === item.type;

                                        return (
                                            <RecipientCard
                                                key={key}
                                                item={item}
                                                selected={isSelected}
                                                multiSelect={activeTab === 'friends'}
                                                onClick={() => activeTab === 'friends' ? toggleFriend(item) : selectSingle(item)}
                                            />
                                        );
                                    })}
                                </Box>

                                {hasMore && (
                                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                                        <Button
                                            size="small"
                                            onClick={handleLoadMore}
                                            disabled={loading}
                                            sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2, fontSize: '0.78rem' }}
                                        >
                                            {loading ? <CircularProgress size={16} /> : `Load More (${items.length} of ${total})`}
                                        </Button>
                                    </Box>
                                )}

                                {!hasMore && items.length > 0 && total > 0 && (
                                    <Box sx={{ height: 8 }} />
                                )}
                            </>
                        )}
                    </Box>

                    {/* Pinned count footer */}
                    {items.length > 0 && total > 0 && (
                        <Box sx={{
                            flexShrink: 0, borderTop: '1px solid', borderColor: 'divider',
                            py: 0.75, textAlign: 'center', bgcolor: 'background.paper',
                        }}>
                            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.72rem' }}>
                                {items.length < total
                                    ? `Showing ${items.length} of ${total} ${TAB_LABELS[activeTab].toLowerCase()}`
                                    : `${total} ${total === 1 ? TAB_LABELS[activeTab].toLowerCase().replace(/s$/, '') : TAB_LABELS[activeTab].toLowerCase()}`
                                }
                            </Typography>
                        </Box>
                    )}

                    {/* Proceed button (friends multi-select only) */}
                    {activeTab === 'friends' && selectedFriends.length > 0 && (
                        <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={proceedToCompose}
                                sx={{ textTransform: 'none', fontWeight: 900, borderRadius: 2, py: 1 }}
                            >
                                Message {selectedFriends.length} {selectedFriends.length === 1 ? 'friend' : 'friends'}
                            </Button>
                        </Box>
                    )}
                </>
            ) : (
                /* ═══════ STEP 2: COMPOSE MESSAGE ═══════ */
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1.5, flex: 1, overflow: 'auto' }}>
                    {/* To: chips */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary', mt: 0.5, flexShrink: 0 }}>To:</Typography>
                        {allSelected.map((r) => (
                            <Chip
                                key={`${r.type}:${r.id}`}
                                size="small"
                                avatar={
                                    <Avatar src={getAvatarSrc(r)} sx={{ width: 22, height: 22, fontSize: '0.6rem', fontWeight: 800, bgcolor: (t) => alpha(t.palette.primary.main, 0.15), color: 'primary.main' }}>
                                        {!getAvatarSrc(r) && (r.type === 'business' ? <StorefrontOutlinedIcon sx={{ fontSize: 13 }} />
                                            : r.type === 'artist' ? (() => { const Ic = artistDefaultIcon(r); return <Ic sx={{ fontSize: 13 }} />; })()
                                                : <PersonRoundedIcon sx={{ fontSize: 13 }} />)}
                                    </Avatar>
                                }
                                label={r.name}
                                onDelete={() => {
                                    if (selectedSingle) {
                                        setSelectedSingle(null);
                                        setStep('pick');
                                    } else {
                                        setSelectedFriends((prev) => prev.filter((f) => f.id !== r.id));
                                        if (allSelected.length <= 1) setStep('pick');
                                    }
                                }}
                                sx={{ fontWeight: 700, fontSize: '0.78rem' }}
                            />
                        ))}
                    </Box>

                    {allSelected.length > 1 && (
                        <RadioGroup
                            row
                            value={sendMode}
                            onChange={(e) => setSendMode(e.target.value)}
                            sx={{ mt: -0.5 }}
                        >
                            <FormControlLabel value="individual" control={<Radio size="small" />}
                                              label={<Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Send individually</Typography>} />
                            <FormControlLabel value="group" control={<Radio size="small" />}
                                              label={<Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Group message</Typography>} />
                        </RadioGroup>
                    )}

                    <TextField
                        multiline
                        placeholder="Write your message..."
                        value={body}
                        onChange={(e) => {
                            setBody(e.target.value.slice(0, 5000));
                            if (error && composeCooldown <= 0) setError('');
                        }}
                        fullWidth
                        autoFocus
                        error={Boolean(error && composeCooldown <= 0)}
                        inputProps={{ maxLength: 5000, style: { height: '100%' } }}
                        helperText={
                            (error && composeCooldown <= 0)
                                ? error
                                : `${body.length} / 5,000`
                        }
                        FormHelperTextProps={{
                            sx: {
                                textAlign: (error && composeCooldown <= 0) ? 'left' : 'right',
                                mr: 0.5,
                                fontWeight: (error && composeCooldown <= 0) ? 700 : 600,
                                fontSize: '0.72rem',
                                color: (error && composeCooldown <= 0) ? 'error.main' : undefined,
                            },
                        }}
                        sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                flex: 1,
                                alignItems: 'flex-start',
                            },
                            '& .MuiInputBase-inputMultiline': {
                                height: '100% !important',
                                overflow: 'auto !important',
                            },
                        }}
                    />

                    <CommentImageAttachments
                        files={composeFiles}
                        urls={composeImageUrls}
                        onFilesChange={setComposeFiles}
                        onUrlsChange={setComposeImageUrls}
                        maxImages={4}
                        disabled={sending}
                    />

                    {error && composeCooldown > 0 && (
                        <Alert severity="warning" sx={{ py: 0, fontSize: '0.8rem', borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999 }}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            disabled={(!body.trim() && composeFiles.length === 0 && composeImageUrls.length === 0) || allSelected.length === 0 || sending || composeCooldown > 0}
                            onClick={handleSend}
                            startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendRoundedIcon />}
                            sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 999, px: 3 }}
                        >
                            {composeCooldown > 0 ? `Wait ${composeCooldown}s` : sending ? 'Sending...' : allSelected.length > 1 ? (sendMode === 'group' ? `Send group message` : `Send to ${allSelected.length}`) : 'Send'}
                        </Button>
                    </Box>
                </DialogContent>
            )}
        </Dialog>
    );
}


/* ═════════════════════════════════════════════════════════════════════════════
   RECIPIENT CARD — small selectable card for compose dialog grid
   ═════════════════════════════════════════════════════════════════════════════ */
function RecipientCard({ item, selected, multiSelect, onClick }) {
    return (
        <Box
            onClick={onClick}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                px: 1.5, py: 1,
                borderRadius: 2,
                cursor: 'pointer',
                border: '1.5px solid',
                borderColor: selected ? 'primary.main' : 'divider',
                bgcolor: (t) => selected ? alpha(t.palette.primary.main, 0.06) : 'transparent',
                transition: 'all 120ms ease',
                '&:hover': {
                    borderColor: (t) => selected ? t.palette.primary.main : alpha(t.palette.primary.main, 0.4),
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                },
                position: 'relative',
                minHeight: 60,
                overflow: 'hidden',
            }}
        >
            {/* Checkbox or check icon */}
            {multiSelect && (
                <Checkbox
                    checked={selected}
                    size="small"
                    sx={{ p: 0, color: 'text.disabled', '&.Mui-checked': { color: 'primary.main' } }}
                    tabIndex={-1}
                />
            )}
            {!multiSelect && selected && (
                <CheckCircleRoundedIcon sx={{ fontSize: 20, color: 'primary.main', position: 'absolute', top: 6, right: 6 }} />
            )}

            <Avatar
                src={getAvatarSrc(item)}
                sx={{
                    width: 38, height: 38,
                    bgcolor: (t) => getAvatarSrc(item) ? 'transparent'
                        : alpha(t.palette.primary.main, 0.12),
                    color: 'primary.main',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                }}
            >
                {!getAvatarSrc(item) && (item.type === 'business' ? <StorefrontOutlinedIcon sx={{ fontSize: 18 }} />
                    : item.type === 'artist' ? (() => { const Ic = artistDefaultIcon(item); return <Ic sx={{ fontSize: 18 }} />; })()
                        : <PersonRoundedIcon sx={{ fontSize: 18 }} />)}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 800, fontSize: '0.82rem', minWidth: 0 }}>
                        {item.name}
                    </Typography>
                    {item.is_verified && item.type === 'system' && (
                        <VerifiedRoundedIcon sx={{ fontSize: 13, color: 'primary.main', flexShrink: 0 }} />
                    )}
                </Box>
                {item.handle && (
                    <Typography variant="caption" noWrap sx={{ color: 'text.disabled', fontWeight: 600, fontSize: '0.7rem', display: 'block', lineHeight: 1.2 }}>
                        @{item.handle}
                    </Typography>
                )}
                {(item.city || item.category || item.genre) && (
                    <Typography variant="caption" noWrap sx={{ color: 'text.disabled', fontSize: '0.65rem', display: 'block', lineHeight: 1.2 }}>
                        {item.category || item.genre || [item.city, item.county].filter(Boolean).join(', ')}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}
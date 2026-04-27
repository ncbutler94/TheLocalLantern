// src/pages/admin/ArtistApplicationsTab.jsx
import React, { useEffect, useState } from 'react';
import { secureFetch } from "../../utils/secureFetch";
import {
    Alert,
    Box,
    Button,
    ButtonBase,
    Chip,
    CircularProgress,
    Divider,
    Drawer,
    IconButton,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseIcon from '@mui/icons-material/Close';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

/* ─── Constants ─── */

const NAME_REQUEST_STATUS_OPTIONS = [
    { key: '', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
];

const PAGE_SIZE = 15;

const SUB_TAB_NAME_REQUESTS = 0;
const SUB_TAB_PENDING_PROFILES = 1;

/* ─── Helpers ─── */

function statusColor(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'approved') return 'success';
    if (s === 'rejected') return 'error';
    if (s === 'contacted') return 'warning';
    if (s === 'new') return 'info';
    if (s === 'pending') return 'warning';
    return 'default';
}

function parseDateValue(value) {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date) return value;
    if (typeof value === 'number' && Number.isFinite(value)) {
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    const s = String(value).trim();
    if (!s) return null;
    if (/^\d+$/.test(s)) {
        const n = Number(s);
        if (Number.isFinite(n)) {
            const d = new Date(n);
            return Number.isNaN(d.getTime()) ? null : d;
        }
    }
    if (s.includes('T') || /[zZ]|[+-]\d\d:?\d\d$/.test(s)) {
        const d = new Date(s);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    const normalized = s.replace(' ', 'T');
    const d = new Date(normalized);
    return Number.isNaN(d.getTime()) ? null : d;
}

function fmtDate(value) {
    const d = parseDateValue(value);
    if (!d) return '';
    try {
        return new Intl.DateTimeFormat(undefined, {
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: '2-digit',
        }).format(d);
    } catch {
        return d.toLocaleString();
    }
}

function getCsrfToken() {
    const meta = typeof document !== 'undefined' ? document.querySelector('meta[name="csrf-token"]') : null;
    const metaToken = meta?.getAttribute?.('content');
    if (metaToken) return metaToken;
    const cookieStr = typeof document !== 'undefined' ? document.cookie || '' : '';
    if (!cookieStr) return '';
    const pick = (name) => {
        const match = cookieStr.split(';').map((c) => c.trim()).find((c) => c.toLowerCase().startsWith(`${name.toLowerCase()}=`));
        if (!match) return '';
        const [, v] = match.split('=');
        try { return decodeURIComponent(v || ''); } catch { return v || ''; }
    };
    return pick('XSRF-TOKEN') || pick('xsrf-token') || pick('csrfToken') || pick('csrf-token') || pick('csrf') || '';
}

function buildApiHeaders(extra) {
    const csrf = getCsrfToken();
    const base = { Accept: 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}) };
    return { ...base, ...(extra || {}) };
}

async function safeJson(res) {
    try { return await res.json(); } catch { return null; }
}

function extractErrorMessage(res, data) {
    const msg = (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
        (data && typeof data === 'object' && typeof data.error === 'string' && data.error) || '';
    if (msg) return msg;
    if (res.status === 401) return 'You are not logged in. Please sign in again.';
    if (res.status === 403) return 'Forbidden (403).';
    return `Request failed (${res.status}).`;
}

/* ─── Name Change Request API ─── */

async function fetchNameChangeRequests({ limit = 15, offset = 0, status = '', q = '' } = {}) {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    const res = await secureFetch(`/api/music/admin/name-change-requests?${params.toString()}`, {
        method: 'GET', credentials: 'include', headers: buildApiHeaders(),
    });
    const data = await safeJson(res);
    if (!res.ok) { const err = new Error(extractErrorMessage(res, data)); err.status = res.status; throw err; }
    return data;
}

async function approveNameChangeRequest(id, { admin_notes } = {}) {
    const res = await secureFetch(`/api/music/admin/name-change-requests/${encodeURIComponent(String(id))}/approve`, {
        method: 'POST', credentials: 'include',
        headers: buildApiHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
        body: JSON.stringify({ notes: admin_notes }),
    });
    const data = await safeJson(res);
    if (!res.ok) { const err = new Error(extractErrorMessage(res, data)); err.status = res.status; throw err; }
    return data;
}

async function rejectNameChangeRequest(id, { admin_notes } = {}) {
    const res = await secureFetch(`/api/music/admin/name-change-requests/${encodeURIComponent(String(id))}/reject`, {
        method: 'POST', credentials: 'include',
        headers: buildApiHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
        body: JSON.stringify({ notes: admin_notes }),
    });
    const data = await safeJson(res);
    if (!res.ok) { const err = new Error(extractErrorMessage(res, data)); err.status = res.status; throw err; }
    return data;
}

/* ─── Pending Artist Profiles API ─── */

async function fetchPendingArtistProfiles({ limit = 15, offset = 0, status = 'pending_approval', q = '' } = {}) {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    const res = await secureFetch(`/api/music/admin/pending-artist-profiles?${params.toString()}`, {
        method: 'GET', credentials: 'include', headers: buildApiHeaders(),
    });
    const data = await safeJson(res);
    if (!res.ok) { const err = new Error(extractErrorMessage(res, data)); err.status = res.status; throw err; }
    return data;
}

async function approveArtistProfile(id) {
    const res = await secureFetch(`/api/music/admin/artists/${encodeURIComponent(String(id))}/approve-profile`, {
        method: 'POST', credentials: 'include',
        headers: buildApiHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
        body: JSON.stringify({}),
    });
    const data = await safeJson(res);
    if (!res.ok) { const err = new Error(extractErrorMessage(res, data)); err.status = res.status; throw err; }
    return data;
}

async function rejectArtistProfile(id) {
    const res = await secureFetch(`/api/music/admin/artists/${encodeURIComponent(String(id))}/reject-profile`, {
        method: 'POST', credentials: 'include',
        headers: buildApiHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
        body: JSON.stringify({}),
    });
    const data = await safeJson(res);
    if (!res.ok) { const err = new Error(extractErrorMessage(res, data)); err.status = res.status; throw err; }
    return data;
}

async function sendArtistApprovalNotification(artist) {
    try {
        const userId = artist.user_id || artist.owner_id || artist.owner_user_id;
        if (!userId) return;
        // Artist sub-type ('music' | 'artist'). NotificationsPage and Header
        // both branch their approval text on this field so musicians read
        // "approved your music profile" while visual artists read "approved
        // your artist profile". Reads both camelCase and snake_case to
        // tolerate whatever shape the pending-list endpoint emits; defaults
        // to 'music' for backward compatibility.
        const rawPt = String(artist.profile_type || artist.profileType || 'music').toLowerCase();
        const profileType = (rawPt === 'artist') ? 'artist' : 'music';
        await secureFetch('/api/notifications/admin/send-approval', {
            method: 'POST',
            credentials: 'include',
            headers: buildApiHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
            body: JSON.stringify({
                recipient_user_id: userId,
                type: 'artist_approved',
                account_type: 'artist',
                account_id: String(artist.id),
                data: {
                    artistId: artist.id,
                    artistName: artist.name || 'Your artist profile',
                    artistHandle: artist.handle || '',
                    artistAvatarUrl: artist.avatar_url || '',
                    // Emit under both keys — frontend accepts either form.
                    profileType,
                    profile_type: profileType,
                },
            }),
        });
    } catch (err) {
        console.warn('[ArtistApplicationsTab] Could not send approval notification:', err.message);
    }
}

async function sendArtistWelcomeMessage(artist) {
    try {
        const userId = artist.user_id || artist.owner_id || artist.owner_user_id;
        if (!userId) return;

        // Branch the entire welcome message on the artist's sub-type. Every
        // "music page"/"music"/"tracks"/"fans"/"venues" reference below needs
        // a visual-artist equivalent; otherwise a painter gets welcomed as a
        // musician. Defaults to 'music' when the field is missing so existing
        // musicians keep their wording unchanged.
        const rawPt = String(artist.profile_type || artist.profileType || 'music').toLowerCase();
        const isVisualArtist = rawPt === 'artist';

        const artistName = artist.name || (isVisualArtist ? 'your artist page' : 'your music page');
        const handle = artist.handle || '';
        const pageNoun = isVisualArtist ? 'artist page' : 'music page';
        const pageNounCaps = isVisualArtist ? 'YOUR ARTIST PAGE' : 'YOUR MUSIC PAGE';
        const openingEmoji = isVisualArtist ? '🎨🏮' : '🎶🏮';

        const discoverLine = isVisualArtist
            ? `${handle ? `Your page is live at locallantern.com/${handle}. ` : ''}Patrons in your area can now discover your work, follow you for updates, and reach out to you directly. Make sure your profile looks great — add a bio, upload your portfolio, and set a profile photo so people can find and recognize you.`
            : `${handle ? `Your page is live at locallantern.com/${handle}. ` : ''}Fans in your area can now discover your music, follow you for updates, and reach out to you directly. Make sure your profile looks great — add a bio, upload your music, and set a profile photo so people can find and recognize you.`;
        const inboxLine = isVisualArtist
            ? `Your artist page has its own dedicated inbox. When patrons or galleries message your page, those conversations show up under your artist account — totally separate from your personal messages. Switch between accounts anytime using the account switcher.`
            : `Your music page has its own dedicated inbox. When fans or venues message your music page, those conversations show up under your artist account — totally separate from your personal messages. Switch between accounts anytime using the account switcher.`;

        const tips = isVisualArtist
            ? [
                'Upload your portfolio and keep it updated',
                'Post updates about new work, shows, commissions, or behind-the-scenes content',
                'Engage with patrons who message you — it goes a long way',
                'Share your Local Lantern page on your other social media to bring your existing audience over',
            ]
            : [
                'Upload your tracks and keep your discography updated',
                'Post updates about upcoming shows, new releases, or behind-the-scenes content',
                'Engage with fans who message you — it goes a long way',
                'Share your Local Lantern page on your other social media to bring your existing fans over',
            ];

        const closingLine = isVisualArtist
            ? `If you have questions about your page, uploading work, or anything else, just reply to this message. We love supporting local artists and we're here to help!`
            : `If you have questions about your page, uploading music, or anything else, just reply to this message. We love supporting local artists and we're here to help!`;
        const finalLine = isVisualArtist
            ? `Welcome to the Local Lantern artist community — can't wait to see what you create! 🎨`
            : `Welcome to the Local Lantern artist community — can't wait to hear what you create! 🎵`;

        const body =
            `Exciting news — ${artistName} has been approved and your ${pageNoun} is now live on Local Lantern! ${openingEmoji}

Here's what you should know:

${pageNounCaps}
${discoverLine}

ARTIST INBOX
${inboxLine}

TIPS TO GROW YOUR AUDIENCE
${tips.map((t) => `• ${t}`).join('\n')}

${closingLine}

${finalLine}

— The Local Lantern Team`;

        await secureFetch('/api/messages/system/send', {
            method: 'POST',
            credentials: 'include',
            headers: buildApiHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
            body: JSON.stringify({
                recipient_user_id: userId,
                subject: `${artistName} is live on Local Lantern!`,
                body,
            }),
        });
    } catch (err) {
        console.warn('[ArtistApplicationsTab] Could not send welcome message:', err.message);
    }
}

/* ═══ PendingArtistProfilesPanel ═══ */

function PendingArtistProfilesPanel() {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const [actionNotice, setActionNotice] = useState('');

    const loadProfiles = async () => {
        setError('');
        setLoading(true);
        try {
            const data = await fetchPendingArtistProfiles({ limit: 50, offset: 0, status: 'pending_approval' });
            setItems(Array.isArray(data?.items) ? data.items : []);
            setTotal(Number(data?.total || 0));
        } catch (err) {
            setError(err?.message || 'Failed to load pending profiles.');
            setItems([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfiles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleApprove = async (artistId) => {
        setActionLoading(artistId);
        setActionNotice('');
        try {
            await approveArtistProfile(artistId);
            const approvedArtist = items.find((a) => Number(a.id) === Number(artistId));
            if (approvedArtist) {
                sendArtistApprovalNotification(approvedArtist);
                sendArtistWelcomeMessage(approvedArtist);
            }
            setItems((prev) => prev.filter((a) => Number(a.id) !== Number(artistId)));
            setTotal((prev) => Math.max(0, prev - 1));
            setActionNotice('Artist approved and published!');
            setTimeout(() => setActionNotice(''), 4000);
        } catch (err) {
            setError(err?.message || 'Failed to approve.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (artistId) => {
        setActionLoading(artistId);
        setActionNotice('');
        try {
            await rejectArtistProfile(artistId);
            setItems((prev) => prev.filter((a) => Number(a.id) !== Number(artistId)));
            setTotal((prev) => Math.max(0, prev - 1));
            setActionNotice('Artist sent back to draft.');
            setTimeout(() => setActionNotice(''), 4000);
        } catch (err) {
            setError(err?.message || 'Failed to reject.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleViewProfile = (handle) => {
        if (!handle) return;
        window.open(`/${encodeURIComponent(handle)}`, '_blank', 'noopener,noreferrer');
    };

    return (
        <Box>
            <Paper
                variant="outlined"
                sx={(t) => ({
                    borderRadius: 2.5,
                    borderColor: alpha(t.palette.primary.main, 0.14),
                    overflow: 'hidden',
                })}
            >
                <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography sx={{ fontWeight: 900, fontSize: 15 }}>
                            Pending Artist Profiles
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>
                            Artists that have submitted their page for review.
                        </Typography>
                    </Box>
                    <Tooltip title="Refresh" placement="top">
                        <IconButton size="small" onClick={loadProfiles} disabled={loading}>
                            <RefreshRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                </Box>

                {actionNotice ? (
                    <Alert severity="success" sx={{ mx: 2, mt: 1.5, borderRadius: 2 }} onClose={() => setActionNotice('')}>
                        {actionNotice}
                    </Alert>
                ) : null}

                {error ? (
                    <Alert severity="error" sx={{ mx: 2, mt: 1.5, borderRadius: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                ) : null}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress size={28} />
                    </Box>
                ) : items.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
                        <InboxRoundedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                        <Typography sx={{ fontWeight: 800, fontSize: 14, color: 'text.secondary' }}>
                            No pending profiles found.
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={0} divider={<Divider />}>
                        {items.map((artist) => (
                            <Box
                                key={artist.id}
                                sx={{
                                    px: { xs: 1.5, sm: 2.5 }, py: 1.5,
                                    display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: { xs: 1, sm: 2 },
                                    '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.03) },
                                }}
                            >
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography sx={{ fontWeight: 800, fontSize: 14 }} noWrap>
                                            {artist.name || 'Unnamed Artist'}
                                        </Typography>
                                        <Chip
                                            label={String(artist.status || 'pending').replace(/_/g, ' ')}
                                            size="small"
                                            color="warning"
                                            sx={{ fontWeight: 700, fontSize: 11, textTransform: 'capitalize' }}
                                        />
                                    </Stack>
                                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }} noWrap>
                                        @{artist.handle || '—'} · {artist.city || artist.county || 'No location'}
                                    </Typography>
                                </Box>
                                <Stack direction="row" spacing={0.75} sx={{ flexShrink: 0, justifyContent: { xs: 'flex-end', sm: 'flex-start' } }}>
                                    <Button
                                        size="small"
                                        onClick={() => handleViewProfile(artist.handle)}
                                        disabled={!artist.handle}
                                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700, fontSize: 12, minWidth: 'auto' }}
                                    >
                                        View
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        color="success"
                                        onClick={() => handleApprove(artist.id)}
                                        disabled={actionLoading === artist.id}
                                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, fontSize: 12, boxShadow: 'none', minWidth: 'auto' }}
                                    >
                                        {actionLoading === artist.id ? '…' : 'Approve'}
                                    </Button>
                                    <Button
                                        size="small"
                                        color="error"
                                        onClick={() => handleReject(artist.id)}
                                        disabled={actionLoading === artist.id}
                                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700, fontSize: 12, minWidth: 'auto' }}
                                    >
                                        Reject
                                    </Button>
                                </Stack>
                            </Box>
                        ))}
                    </Stack>
                )}
            </Paper>
        </Box>
    );
}

/* ─── Shared sx (defined outside component to prevent infinite re-render loops) ─── */

const sectionPaperSx = (t) => ({
    p: 1.5,
    borderRadius: 2.5,
    borderColor: alpha(t.palette.primary.main, 0.14),
    bgcolor: alpha(t.palette.background.paper, 0.9),
});

const sectionTitleSx = {
    fontWeight: 950,
    mb: 1.5,
    display: 'flex',
    alignItems: 'center',
    gap: 0.75,
};

/* ─── Sub-Tab Button ─── */

function SubTabButton({ active, icon: Icon, label, onClick }) {
    return (
        <ButtonBase
            onClick={onClick}
            sx={(t) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                px: 2,
                py: 1,
                borderRadius: 2,
                fontWeight: active ? 800 : 650,
                fontSize: 13.5,
                color: active ? t.palette.primary.main : t.palette.text.secondary,
                bgcolor: active ? alpha(t.palette.primary.main, 0.10) : 'transparent',
                transition: 'all 140ms ease',
                '&:hover': {
                    bgcolor: active
                        ? alpha(t.palette.primary.main, 0.14)
                        : alpha(t.palette.action.hover, 0.6),
                },
            })}
        >
            <Icon sx={{ fontSize: 18 }} />
            <span>{label}</span>
        </ButtonBase>
    );
}

/* ══════════════════════════════════════════════════════════════
   NameChangeRequestsPanel — self-contained list + detail
   ══════════════════════════════════════════════════════════════ */

function NameChangeRequestsPanel() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending');
    const [query, setQuery] = useState('');
    const [offset, setOffset] = useState(0);

    const [selected, setSelected] = useState(null);
    const [editNotes, setEditNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveNotice, setSaveNotice] = useState('');

    const canPrev = offset > 0;
    const canNext = offset + PAGE_SIZE < total;

    const loadRequests = async (resetOffset) => {
        setError('');
        setLoading(true);
        try {
            const nextOffset = resetOffset ? 0 : offset;
            const data = await fetchNameChangeRequests({ limit: PAGE_SIZE, offset: nextOffset, status: statusFilter, q: query.trim() });
            setItems(Array.isArray(data?.items) ? data.items : []);
            setTotal(Number(data?.total || 0));
            if (resetOffset) setOffset(0);
        } catch (err) {
            setError(err?.message || 'Failed to load name change requests.');
            setItems([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        loadRequests(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter]);

    const selectRow = (row) => {
        setSelected(row);
        setEditNotes(String(row?.admin_notes || ''));
        setSaveError('');
        setSaveNotice('');
    };

    const deselectRow = () => {
        setSelected(null);
        setSaving(false);
        setSaveError('');
        setSaveNotice('');
    };

    const applyLocalPatch = (id, patch) => {
        setItems((prev) => prev.map((x) => (String(x?.id) === String(id) ? { ...x, ...patch } : x)));
        setSelected((prev) => (prev && String(prev.id) === String(id) ? { ...prev, ...patch } : prev));
    };

    const handleAction = async (action) => {
        if (!selected?.id) return;
        setSaving(true);
        setSaveError('');
        setSaveNotice('');
        try {
            if (action === 'approved') {
                await approveNameChangeRequest(selected.id, { admin_notes: editNotes });
            } else {
                await rejectNameChangeRequest(selected.id, { admin_notes: editNotes });
            }
            applyLocalPatch(selected.id, { status: action, admin_notes: editNotes });
            setSaveNotice(action === 'approved' ? 'Name change approved. The artist name has been updated.' : 'Name change request rejected.');
            loadRequests(false);
        } catch (err) {
            setSaveError(err?.message || 'Failed to update request.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveNotes = async () => {
        if (!selected?.id) return;
        setSaving(true);
        setSaveError('');
        setSaveNotice('');
        try {
            applyLocalPatch(selected.id, { admin_notes: editNotes });
            setSaveNotice('Notes saved locally. They will be submitted when you approve or reject.');
        } catch (err) {
            setSaveError(err?.message || 'Failed to save notes.');
        } finally {
            setSaving(false);
        }
    };

    const handleSearch = () => {
        setOffset(0);
        loadRequests(true);
    };

    const handlePageChange = (nextOffset) => {
        setOffset(nextOffset);
        setLoading(true);
        fetchNameChangeRequests({ limit: PAGE_SIZE, offset: nextOffset, status: statusFilter, q: query.trim() })
            .then((data) => {
                setItems(Array.isArray(data?.items) ? data.items : []);
                setTotal(Number(data?.total || 0));
            })
            .catch((err) => {
                setError(err?.message || 'Failed to load name change requests.');
                setItems([]);
                setTotal(0);
            })
            .finally(() => setLoading(false));
    };

    const isPending = String(selected?.status || '').toLowerCase() === 'pending';

    return (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2.5, alignItems: 'flex-start' }}>
            {/* ═══ LEFT: Request List ═══ */}
            <Box sx={{ flex: 1, minWidth: 0, width: { xs: '100%', lg: 'auto' } }}>
                <Paper
                    variant="outlined"
                    sx={(t) => ({
                        borderRadius: 2.5,
                        borderColor: alpha(t.palette.primary.main, 0.14),
                        bgcolor: alpha(t.palette.background.paper, 0.92),
                        overflow: 'hidden',
                    })}
                >
                    {/* Header */}
                    <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between">
                            <Box sx={{ minWidth: 0 }}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}>
                                    <EditOutlinedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                                    <Typography sx={{ fontWeight: 900 }}>Name Change Requests</Typography>
                                </Stack>
                                <Typography color="text.secondary" sx={{ fontWeight: 750, fontSize: 13 }}>
                                    Review and approve or reject artist name change requests.
                                </Typography>
                            </Box>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<RefreshRoundedIcon />}
                                onClick={() => loadRequests(false)}
                                disabled={loading}
                                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, flexShrink: 0 }}
                            >
                                Refresh
                            </Button>
                        </Stack>
                    </Box>

                    <Divider />

                    {/* Search & Filter */}
                    <Box sx={{ px: { xs: 1.5, sm: 2 }, py: 1.25 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                            <TextField
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                                placeholder="Search artist name…"
                                size="small"
                                fullWidth
                                InputProps={{
                                    startAdornment: (
                                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1, color: 'text.secondary' }}>
                                            <SearchRoundedIcon fontSize="small" />
                                        </Box>
                                    ),
                                }}
                            />
                            <TextField
                                select
                                size="small"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                sx={{ minWidth: 130 }}
                            >
                                {NAME_REQUEST_STATUS_OPTIONS.map((s) => (
                                    <MenuItem key={s.key || 'all'} value={s.key}>{s.label}</MenuItem>
                                ))}
                            </TextField>
                            <Button
                                variant="contained"
                                onClick={handleSearch}
                                disabled={loading}
                                size="small"
                                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, minWidth: 80 }}
                            >
                                Search
                            </Button>
                        </Stack>
                    </Box>

                    <Divider />

                    {error && <Alert severity="error" sx={{ mx: 2, mt: 1.25, borderRadius: 2 }}>{error}</Alert>}

                    {/* List */}
                    <Box sx={{ maxHeight: { xs: 'none', lg: 'calc(100vh - 340px)' }, overflowY: { xs: 'visible', lg: 'auto' } }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}>
                                <CircularProgress />
                            </Box>
                        ) : items.length === 0 ? (
                            <Box sx={{ py: 6, textAlign: 'center' }}>
                                <InboxRoundedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                                <Typography color="text.secondary" sx={{ fontWeight: 750 }}>
                                    No name change requests found for these filters.
                                </Typography>
                            </Box>
                        ) : (
                            items.map((row, idx) => {
                                const rowStatus = String(row?.status || '').toLowerCase();
                                const rowIsPending = rowStatus === 'pending';
                                const isSelected = String(selected?.id) === String(row.id);
                                return (
                                    <Box
                                        key={row.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => selectRow(row)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectRow(row); }}
                                        sx={(t) => ({
                                            px: 2,
                                            py: 1.25,
                                            display: 'flex',
                                            gap: 1.25,
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            cursor: 'pointer',
                                            borderLeft: '3px solid',
                                            borderLeftColor: isSelected ? t.palette.primary.main : 'transparent',
                                            bgcolor: isSelected
                                                ? alpha(t.palette.primary.main, 0.08)
                                                : rowIsPending
                                                    ? alpha(t.palette.warning.main, 0.06)
                                                    : idx % 2 === 0
                                                        ? alpha(t.palette.common.black, 0.02)
                                                        : 'transparent',
                                            transition: 'background-color 120ms ease, border-color 120ms ease',
                                            '&:hover': {
                                                bgcolor: isSelected
                                                    ? alpha(t.palette.primary.main, 0.12)
                                                    : alpha(t.palette.primary.main, 0.06),
                                            },
                                        })}
                                    >
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                                <Typography sx={{ fontWeight: 900, minWidth: 0 }} noWrap>
                                                    {row.current_name || row.artist_name || 'Unknown Artist'}
                                                </Typography>
                                                <ArrowForwardRoundedIcon sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0 }} />
                                                <Typography sx={{ fontWeight: 800, minWidth: 0, color: 'secondary.main' }} noWrap>
                                                    {row.requested_name || '—'}
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    label={String(row.status || 'pending').charAt(0).toUpperCase() + String(row.status || 'pending').slice(1)}
                                                    color={statusColor(row.status)}
                                                    sx={{ fontWeight: 800, fontSize: 11, flexShrink: 0 }}
                                                />
                                            </Stack>
                                            <Typography color="text.secondary" sx={{ fontWeight: 700, fontSize: 13 }} noWrap>
                                                {row.artist_handle ? `@${row.artist_handle}` : ''}{row.artist_handle && row.user_email ? ' · ' : ''}{row.user_email || ''}
                                            </Typography>
                                        </Box>
                                        <Typography
                                            color="text.secondary"
                                            sx={{ fontWeight: 600, fontSize: 12, flexShrink: 0, display: { xs: 'none', sm: 'block' } }}
                                        >
                                            {fmtDate(row.created_at_ms ?? row.created_at)}
                                        </Typography>
                                    </Box>
                                );
                            })
                        )}
                    </Box>

                    {/* Pagination */}
                    <Divider />
                    <Box sx={{ px: 2, py: 1.25 }}>
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                            <Typography color="text.secondary" sx={{ fontWeight: 700, fontSize: 13 }}>
                                {items.length ? offset + 1 : 0}–{Math.min(offset + items.length, total)} of {total}
                            </Typography>
                            <Stack direction="row" spacing={1}>
                                <Button variant="outlined" size="small" onClick={() => handlePageChange(Math.max(0, offset - PAGE_SIZE))} disabled={loading || !canPrev} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, minWidth: 64 }}>
                                    Prev
                                </Button>
                                <Button variant="outlined" size="small" onClick={() => handlePageChange(offset + PAGE_SIZE)} disabled={loading || !canNext} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, minWidth: 64 }}>
                                    Next
                                </Button>
                            </Stack>
                        </Stack>
                    </Box>
                </Paper>
            </Box>

            {/* ═══ RIGHT: Detail / Action Panel ═══ */}
            {isMobile ? (
                <Drawer
                    anchor="bottom"
                    open={Boolean(selected)}
                    onClose={deselectRow}
                    PaperProps={{
                        sx: {
                            borderTopLeftRadius: 16,
                            borderTopRightRadius: 16,
                            maxHeight: '92vh',
                            overflow: 'auto',
                        },
                    }}
                >
                    {selected && (
                        <Box>
                            <Box sx={(t) => ({ px: 2, py: 1.5, bgcolor: alpha(t.palette.primary.main, 0.04), position: 'sticky', top: 0, zIndex: 1 })}>
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography sx={{ fontWeight: 950 }} noWrap>Name Change Request</Typography>
                                        <Typography color="text.secondary" sx={{ fontWeight: 700, fontSize: 13 }} noWrap>
                                            {selected.created_at_ms || selected.created_at ? `Submitted ${fmtDate(selected.created_at_ms ?? selected.created_at)}` : 'Submitted —'}
                                        </Typography>
                                    </Box>
                                    <IconButton onClick={deselectRow} size="small"><CloseIcon fontSize="small" /></IconButton>
                                </Stack>
                            </Box>
                            <Divider />
                            <Box sx={{ p: 2 }}>
                                {saveError && <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>{saveError}</Alert>}
                                {saveNotice && <Alert severity="success" sx={{ mb: 1.5, borderRadius: 2 }}>{saveNotice}</Alert>}
                                <Stack spacing={2}>
                                    <Paper variant="outlined" sx={sectionPaperSx}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Typography sx={{ fontWeight: 800, fontSize: 13 }}>Status:</Typography>
                                            <Chip size="small" label={String(selected.status || 'pending').charAt(0).toUpperCase() + String(selected.status || 'pending').slice(1)} color={statusColor(selected.status)} sx={{ fontWeight: 800 }} />
                                        </Stack>
                                    </Paper>
                                    <Paper variant="outlined" sx={sectionPaperSx}>
                                        <Typography sx={sectionTitleSx}><SwapHorizRoundedIcon fontSize="small" />Name Change</Typography>
                                        <Stack spacing={1.5}>
                                            <TextField label="Current name" value={selected.current_name || selected.artist_name || ''} fullWidth size="small" InputProps={{ readOnly: true }} />
                                            <TextField label="Requested name" value={selected.requested_name || ''} fullWidth size="small" InputProps={{ readOnly: true }}
                                                       sx={(t) => ({ '& .MuiOutlinedInput-root': { bgcolor: alpha(t.palette.secondary.main, 0.04) }, '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(t.palette.secondary.main, 0.22) } })}
                                            />
                                        </Stack>
                                    </Paper>
                                    <Paper variant="outlined" sx={sectionPaperSx}>
                                        <Typography sx={sectionTitleSx}><CommentOutlinedIcon fontSize="small" />Reason</Typography>
                                        <TextField value={selected.reason || ''} fullWidth multiline minRows={2} InputProps={{ readOnly: true }} placeholder="No reason provided." />
                                    </Paper>
                                    <Paper variant="outlined" sx={sectionPaperSx}>
                                        <Typography sx={sectionTitleSx}><NotesOutlinedIcon fontSize="small" />Admin Notes</Typography>
                                        <TextField value={editNotes} onChange={(e) => setEditNotes(e.target.value)} fullWidth multiline minRows={3} placeholder="Internal notes (not visible to the artist)…" />
                                    </Paper>
                                </Stack>
                            </Box>
                            <Divider />
                            <Box sx={(t) => ({ px: 2, py: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end', bgcolor: alpha(t.palette.background.paper, 0.98), position: 'sticky', bottom: 0 })}>
                                {isPending && (
                                    <Button variant="outlined" size="small" color="error" startIcon={<CancelOutlinedIcon />} onClick={() => handleAction('rejected')} disabled={saving} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, mr: 'auto' }}>Reject</Button>
                                )}
                                {isPending ? (
                                    <Button variant="contained" size="small" color="success" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlineRoundedIcon />} onClick={() => handleAction('approved')} disabled={saving} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}>{saving ? 'Saving…' : 'Approve'}</Button>
                                ) : (
                                    <Button variant="contained" size="small" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />} onClick={handleSaveNotes} disabled={saving} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}>{saving ? 'Saving…' : 'Save Notes'}</Button>
                                )}
                            </Box>
                        </Box>
                    )}
                </Drawer>
            ) : (
                <Box
                    sx={{
                        width: { xs: '100%', lg: 420 },
                        flexShrink: 0,
                        position: { lg: 'sticky' },
                        top: { lg: 100 },
                        alignSelf: { lg: 'flex-start' },
                        maxHeight: { lg: 'calc(100vh - 120px)' },
                        overflowY: { lg: 'auto' },
                    }}
                >
                    {selected ? (
                        <Paper
                            variant="outlined"
                            sx={(t) => ({
                                borderRadius: 2.5,
                                borderColor: alpha(t.palette.primary.main, 0.20),
                                bgcolor: alpha(t.palette.background.paper, 0.96),
                                overflow: 'hidden',
                            })}
                        >
                            {/* Detail Header */}
                            <Box sx={(t) => ({ px: 2, py: 1.5, bgcolor: alpha(t.palette.primary.main, 0.04) })}>
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography sx={{ fontWeight: 950 }} noWrap>
                                            Name Change Request
                                        </Typography>
                                        <Typography color="text.secondary" sx={{ fontWeight: 700, fontSize: 13 }} noWrap>
                                            {selected.created_at_ms || selected.created_at ? `Submitted ${fmtDate(selected.created_at_ms ?? selected.created_at)}` : 'Submitted —'}
                                        </Typography>
                                    </Box>
                                    <IconButton onClick={deselectRow} size="small">
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </Stack>
                            </Box>

                            <Divider />

                            {/* Detail Body */}
                            <Box sx={{ p: 2 }}>
                                {saveError && <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>{saveError}</Alert>}
                                {saveNotice && <Alert severity="success" sx={{ mb: 1.5, borderRadius: 2 }}>{saveNotice}</Alert>}

                                <Stack spacing={2}>
                                    {/* Status Chip */}
                                    <Paper variant="outlined" sx={sectionPaperSx}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Typography sx={{ fontWeight: 800, fontSize: 13 }}>Status:</Typography>
                                            <Chip
                                                size="small"
                                                label={String(selected.status || 'pending').charAt(0).toUpperCase() + String(selected.status || 'pending').slice(1)}
                                                color={statusColor(selected.status)}
                                                sx={{ fontWeight: 800 }}
                                            />
                                        </Stack>
                                    </Paper>

                                    {/* Name Change Details */}
                                    <Paper variant="outlined" sx={sectionPaperSx}>
                                        <Typography sx={sectionTitleSx}>
                                            <SwapHorizRoundedIcon fontSize="small" />
                                            Name Change
                                        </Typography>
                                        <Stack spacing={1.5}>
                                            <TextField
                                                label="Current name"
                                                value={selected.current_name || selected.artist_name || ''}
                                                fullWidth
                                                size="small"
                                                InputProps={{ readOnly: true }}
                                            />
                                            <TextField
                                                label="Requested name"
                                                value={selected.requested_name || ''}
                                                fullWidth
                                                size="small"
                                                InputProps={{ readOnly: true }}
                                                sx={(t) => ({
                                                    '& .MuiOutlinedInput-root': {
                                                        bgcolor: alpha(t.palette.secondary.main, 0.04),
                                                    },
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: alpha(t.palette.secondary.main, 0.22),
                                                    },
                                                })}
                                            />
                                            {selected.artist_id && (
                                                <TextField
                                                    label="Artist ID"
                                                    value={selected.artist_id}
                                                    fullWidth
                                                    size="small"
                                                    InputProps={{ readOnly: true }}
                                                />
                                            )}
                                        </Stack>
                                    </Paper>

                                    {/* Reason */}
                                    <Paper variant="outlined" sx={sectionPaperSx}>
                                        <Typography sx={sectionTitleSx}>
                                            <CommentOutlinedIcon fontSize="small" />
                                            Reason
                                        </Typography>
                                        <TextField
                                            value={selected.reason || ''}
                                            fullWidth
                                            multiline
                                            minRows={2}
                                            InputProps={{ readOnly: true }}
                                            placeholder="No reason provided."
                                        />
                                    </Paper>

                                    {/* Linked User Account */}
                                    {selected.user_id ? (
                                        <Paper variant="outlined" sx={(t) => ({ p: 1.5, borderRadius: 2.5, borderColor: alpha(t.palette.success.main, 0.25), bgcolor: alpha(t.palette.success.main, 0.04) })}>
                                            <Typography sx={{ fontWeight: 950, mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.75, color: 'success.dark' }}>
                                                <AccountCircleOutlinedIcon fontSize="small" />
                                                Requesting User
                                            </Typography>
                                            <Stack spacing={1.5}>
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    {(selected.artist_avatar_url || selected.user_avatar_url) && (
                                                        <Box component="img" src={selected.artist_avatar_url || selected.user_avatar_url} alt="" sx={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                                    )}
                                                    <Stack sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
                                                            {selected.current_name || selected.artist_name || [selected.user_first_name, selected.user_last_name].filter(Boolean).join(' ') || 'No name'}
                                                        </Typography>
                                                        {(selected.artist_handle || selected.user_handle) && (
                                                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>@{selected.artist_handle || selected.user_handle}</Typography>
                                                        )}
                                                    </Stack>
                                                </Stack>
                                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                                    <TextField label="Email" value={selected.user_email || ''} fullWidth size="small" InputProps={{ readOnly: true }} />
                                                    <TextField label="Artist ID" value={selected.artist_id || ''} fullWidth size="small" InputProps={{ readOnly: true }} />
                                                </Stack>
                                            </Stack>
                                        </Paper>
                                    ) : (
                                        <Paper variant="outlined" sx={(t) => ({ p: 1.5, borderRadius: 2.5, borderColor: alpha(t.palette.warning.main, 0.25), bgcolor: alpha(t.palette.warning.main, 0.04) })}>
                                            <Typography sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.75, color: 'warning.dark', fontSize: 14 }}>
                                                <AccountCircleOutlinedIcon fontSize="small" />
                                                No linked user account
                                            </Typography>
                                        </Paper>
                                    )}

                                    {/* Admin Notes */}
                                    <Paper variant="outlined" sx={sectionPaperSx}>
                                        <Typography sx={sectionTitleSx}>
                                            <NotesOutlinedIcon fontSize="small" />
                                            Admin Notes
                                        </Typography>
                                        <TextField
                                            value={editNotes}
                                            onChange={(e) => setEditNotes(e.target.value)}
                                            fullWidth
                                            multiline
                                            minRows={3}
                                            placeholder="Internal notes (not visible to the artist)…"
                                        />
                                    </Paper>
                                </Stack>
                            </Box>

                            {/* Detail Footer */}
                            <Divider />
                            <Box sx={(t) => ({ px: 2, py: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end', bgcolor: alpha(t.palette.background.paper, 0.98) })}>
                                {isPending && (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        color="error"
                                        startIcon={<CancelOutlinedIcon />}
                                        onClick={() => handleAction('rejected')}
                                        disabled={saving}
                                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, mr: 'auto' }}
                                    >
                                        Reject
                                    </Button>
                                )}
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={deselectRow}
                                    disabled={saving}
                                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}
                                >
                                    Close
                                </Button>
                                {isPending ? (
                                    <Button
                                        variant="contained"
                                        size="small"
                                        color="success"
                                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlineRoundedIcon />}
                                        onClick={() => handleAction('approved')}
                                        disabled={saving}
                                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
                                    >
                                        {saving ? 'Saving…' : 'Approve'}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />}
                                        onClick={handleSaveNotes}
                                        disabled={saving}
                                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
                                    >
                                        {saving ? 'Saving…' : 'Save Notes'}
                                    </Button>
                                )}
                            </Box>
                        </Paper>
                    ) : (
                        <Paper
                            variant="outlined"
                            sx={(t) => ({
                                borderRadius: 2.5,
                                borderColor: alpha(t.palette.divider, 0.5),
                                bgcolor: alpha(t.palette.background.paper, 0.6),
                                py: 8,
                                px: 3,
                                textAlign: 'center',
                            })}
                        >
                            <EditOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
                            <Typography sx={{ fontWeight: 800, color: 'text.secondary', mb: 0.5 }}>
                                No Request Selected
                            </Typography>
                            <Typography variant="body2" color="text.disabled" sx={{ fontWeight: 600 }}>
                                Click a name change request on the left to review it.
                            </Typography>
                        </Paper>
                    )}
                </Box>
            )}
        </Box>
    );
}

/* ══════════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════════ */


export default function ArtistApplicationsTab() {
    const [subTab, setSubTab] = useState(SUB_TAB_NAME_REQUESTS);

    return (
        <Box>
            {/* ═══ Sub-Tab Toggle ═══ */}
            <Paper
                variant="outlined"
                sx={(t) => ({
                    mb: 2.5,
                    borderRadius: 2.5,
                    borderColor: alpha(t.palette.primary.main, 0.14),
                    bgcolor: alpha(t.palette.background.paper, 0.92),
                    p: 0.75,
                    display: 'flex',
                    gap: 0.5,
                    flexWrap: 'wrap',
                })}
            >
                <SubTabButton
                    active={subTab === SUB_TAB_NAME_REQUESTS}
                    icon={EditOutlinedIcon}
                    label="Name Changes"
                    onClick={() => setSubTab(SUB_TAB_NAME_REQUESTS)}
                />
                <SubTabButton
                    active={subTab === SUB_TAB_PENDING_PROFILES}
                    icon={CheckCircleOutlineRoundedIcon}
                    label="Pending Profiles"
                    onClick={() => setSubTab(SUB_TAB_PENDING_PROFILES)}
                />
            </Paper>

            {/* ═══ Panel Content ═══ */}
            {subTab === SUB_TAB_PENDING_PROFILES ? (
                <PendingArtistProfilesPanel />
            ) : (
                <NameChangeRequestsPanel />
            )}
        </Box>
    );
}

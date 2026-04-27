// src/pages/admin/BusinessApplicationsTab.jsx
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
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';

/* ─── Constants ─── */

const NAME_REQUEST_STATUS_OPTIONS = [
    { key: '', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
];

const PENDING_PROFILE_STATUS_OPTIONS = [
    { key: 'pending_approval', label: 'Pending Approval' },
    { key: 'all', label: 'All (incl. Draft/Rejected)' },
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

async function fetchBusinessNameChangeRequests({ limit = 15, offset = 0, status = '', q = '' } = {}) {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    const res = await secureFetch(`/api/business/admin/name-change-requests?${params.toString()}`, {
        method: 'GET', credentials: 'include', headers: buildApiHeaders(),
    });
    const data = await safeJson(res);
    if (!res.ok) { const err = new Error(extractErrorMessage(res, data)); err.status = res.status; throw err; }
    return data;
}

async function approveBusinessNameChangeRequest(id, { admin_notes } = {}) {
    const res = await secureFetch(`/api/business/admin/name-change-requests/${encodeURIComponent(String(id))}/approve`, {
        method: 'POST', credentials: 'include',
        headers: buildApiHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
        body: JSON.stringify({ notes: admin_notes }),
    });
    const data = await safeJson(res);
    if (!res.ok) { const err = new Error(extractErrorMessage(res, data)); err.status = res.status; throw err; }
    return data;
}

async function rejectBusinessNameChangeRequest(id, { admin_notes } = {}) {
    const res = await secureFetch(`/api/business/admin/name-change-requests/${encodeURIComponent(String(id))}/reject`, {
        method: 'POST', credentials: 'include',
        headers: buildApiHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
        body: JSON.stringify({ notes: admin_notes }),
    });
    const data = await safeJson(res);
    if (!res.ok) { const err = new Error(extractErrorMessage(res, data)); err.status = res.status; throw err; }
    return data;
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


/* ─── Pending Profiles API ─── */

async function fetchPendingProfiles({ limit = 15, offset = 0, status = 'pending_approval', q = '' } = {}) {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    const res = await secureFetch(`/api/business/admin/pending-profiles?${params.toString()}`, {
        method: 'GET', credentials: 'include', headers: buildApiHeaders(),
    });
    const data = await safeJson(res);
    if (!res.ok) { const err = new Error(extractErrorMessage(res, data)); err.status = res.status; throw err; }
    return data;
}

async function approveProfile(id) {
    const res = await secureFetch(`/api/business/admin/businesses/${encodeURIComponent(String(id))}/approve-profile`, {
        method: 'POST', credentials: 'include',
        headers: buildApiHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
        body: JSON.stringify({}),
    });
    const data = await safeJson(res);
    if (!res.ok) { const err = new Error(extractErrorMessage(res, data)); err.status = res.status; throw err; }
    return data;
}

async function rejectProfile(id, { feedback } = {}) {
    const res = await secureFetch(`/api/business/admin/businesses/${encodeURIComponent(String(id))}/reject-profile`, {
        method: 'POST', credentials: 'include',
        headers: buildApiHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
        body: JSON.stringify({ feedback }),
    });
    const data = await safeJson(res);
    if (!res.ok) { const err = new Error(extractErrorMessage(res, data)); err.status = res.status; throw err; }
    return data;
}

async function sendBusinessApprovalNotification(business) {
    try {
        const userId = business.user_id || business.owner_id || business.owner_user_id;
        if (!userId) return;
        await secureFetch('/api/notifications/admin/send-approval', {
            method: 'POST',
            credentials: 'include',
            headers: buildApiHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
            body: JSON.stringify({
                recipient_user_id: userId,
                type: 'business_approved',
                account_type: 'business',
                account_id: String(business.id),
                data: {
                    businessId: business.id,
                    businessName: business.name || business.business_name || 'Your business',
                    businessSlug: business.slug || '',
                    businessAvatarUrl: business.avatar_url || '',
                },
            }),
        });
    } catch (err) {
        console.warn('[BusinessApplicationsTab] Could not send approval notification:', err.message);
    }
}

async function sendBusinessWelcomeMessage(business) {
    try {
        const userId = business.user_id || business.owner_id || business.owner_user_id;
        if (!userId) return;
        const businessName = business.name || business.business_name || 'your business';
        const slug = business.slug || '';

        const body =
            `Great news — ${businessName} has been approved and is now live on Local Lantern!

Here's what you should know about your new Business Page:

YOUR BUSINESS PAGE
${slug ? `Your page is live at thelocallantern.com/${slug}. ` : ''}People in your area can now discover you, learn about what you offer, and reach out directly. Make sure your profile is filled out with a great description, photos, and your hours so customers can find everything they need.

BUSINESS INBOX
Your business page has its own dedicated inbox, separate from your personal messages. When customers message your business, those conversations will show up under your business account — not your personal one. You can switch between accounts anytime using the account switcher.

TIPS TO GET THE MOST OUT OF YOUR PAGE
• Keep your business info up to date like your hours, contact details, and description
• Post updates to keep your followers in the loop
• Customers love a business that's engaged so try to respond to messages promptly 
• Share your page link with your existing customers so they can follow you here

If you have any questions about managing your page or want tips on getting more visibility, just reply to this message. We're here to help you succeed!

Congrats again, and welcome to The Local Lantern business community!

— The Local Lantern Team`;

        await secureFetch('/api/messages/system/send', {
            method: 'POST',
            credentials: 'include',
            headers: buildApiHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
            body: JSON.stringify({
                recipient_user_id: userId,
                subject: `${businessName} is live on Local Lantern!`,
                body,
            }),
        });
    } catch (err) {
        console.warn('[BusinessApplicationsTab] Could not send welcome message:', err.message);
    }
}


/* ══════════════════════════════════════════════════════════════
   PendingProfilesPanel — list pending_approval businesses
   Click row → opens /{slug} in new tab
   Inline approve / reject buttons
   ══════════════════════════════════════════════════════════════ */

function PendingProfilesPanel() {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending_approval');
    const [query, setQuery] = useState('');
    const [offset, setOffset] = useState(0);
    const [actionLoading, setActionLoading] = useState(null); // business id being acted on
    const [actionNotice, setActionNotice] = useState('');

    const canPrev = offset > 0;
    const canNext = offset + PAGE_SIZE < total;

    const loadProfiles = async (resetOffset) => {
        setError('');
        setLoading(true);
        try {
            const nextOffset = resetOffset ? 0 : offset;
            const data = await fetchPendingProfiles({ limit: PAGE_SIZE, offset: nextOffset, status: statusFilter, q: query.trim() });
            setItems(Array.isArray(data?.items) ? data.items : []);
            setTotal(Number(data?.total || 0));
            if (resetOffset) setOffset(0);
        } catch (err) {
            setError(err?.message || 'Failed to load pending profiles.');
            setItems([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfiles(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        loadProfiles(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter]);

    const handleApprove = async (bizId) => {
        setActionLoading(bizId);
        setActionNotice('');
        try {
            await approveProfile(bizId);
            const approvedBiz = items.find((b) => Number(b.id) === Number(bizId));
            if (approvedBiz) {
                sendBusinessApprovalNotification(approvedBiz);
                sendBusinessWelcomeMessage(approvedBiz);
            }
            setItems((prev) => prev.filter((b) => Number(b.id) !== Number(bizId)));
            setTotal((prev) => Math.max(0, prev - 1));
            setActionNotice('Business approved and published!');
            setTimeout(() => setActionNotice(''), 4000);
        } catch (err) {
            setError(err?.message || 'Failed to approve.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (bizId) => {
        setActionLoading(bizId);
        setActionNotice('');
        try {
            await rejectProfile(bizId);
            setItems((prev) => prev.filter((b) => Number(b.id) !== Number(bizId)));
            setTotal((prev) => Math.max(0, prev - 1));
            setActionNotice('Business sent back to draft.');
            setTimeout(() => setActionNotice(''), 4000);
        } catch (err) {
            setError(err?.message || 'Failed to reject.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleViewProfile = (slug) => {
        if (!slug) return;
        window.open(`/${encodeURIComponent(slug)}`, '_blank', 'noopener,noreferrer');
    };

    const handleSearch = () => {
        setOffset(0);
        loadProfiles(true);
    };

    const handlePageChange = (nextOffset) => {
        setOffset(nextOffset);
        setLoading(true);
        fetchPendingProfiles({ limit: PAGE_SIZE, offset: nextOffset, status: statusFilter, q: query.trim() })
            .then((data) => {
                setItems(Array.isArray(data?.items) ? data.items : []);
                setTotal(Number(data?.total || 0));
            })
            .catch((err) => {
                setError(err?.message || 'Failed to load pending profiles.');
                setItems([]);
                setTotal(0);
            })
            .finally(() => setLoading(false));
    };

    return (
        <Box>
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
                                <VisibilityRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                                <Typography sx={{ fontWeight: 900 }}>Pending Business Profiles</Typography>
                            </Stack>
                            <Typography color="text.secondary" sx={{ fontWeight: 750, fontSize: 13 }}>
                                Review business profiles submitted for approval. Click to view their page.
                            </Typography>
                        </Box>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<RefreshRoundedIcon />}
                            onClick={() => loadProfiles(false)}
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
                            placeholder="Search business name or city…"
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
                            sx={{ minWidth: 180 }}
                        >
                            {PENDING_PROFILE_STATUS_OPTIONS.map((s) => (
                                <MenuItem key={s.key} value={s.key}>{s.label}</MenuItem>
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

                {error && <Alert severity="error" sx={{ mx: 2, mt: 1.25, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
                {actionNotice && <Alert severity="success" sx={{ mx: 2, mt: 1.25, borderRadius: 2 }} onClose={() => setActionNotice('')}>{actionNotice}</Alert>}

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
                                No pending profiles found.
                            </Typography>
                        </Box>
                    ) : (
                        items.map((row, idx) => {
                            const rowStatus = String(row?.status || '').toLowerCase();
                            const isPending = rowStatus === 'pending_approval';
                            const isActing = actionLoading === row.id;
                            return (
                                <Box
                                    key={row.id}
                                    sx={(t) => ({
                                        px: { xs: 1.5, sm: 2 },
                                        py: 1.5,
                                        display: 'flex',
                                        flexDirection: { xs: 'column', sm: 'row' },
                                        gap: { xs: 1, sm: 1.5 },
                                        alignItems: { xs: 'stretch', sm: 'center' },
                                        borderBottom: '1px solid',
                                        borderColor: alpha(t.palette.divider, 0.5),
                                        bgcolor: isPending
                                            ? alpha(t.palette.warning.main, 0.04)
                                            : idx % 2 === 0
                                                ? alpha(t.palette.common.black, 0.02)
                                                : 'transparent',
                                    })}
                                >
                                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                                        {/* Avatar */}
                                        {row.avatar_url ? (
                                            <Box component="img" src={row.avatar_url} alt="" sx={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                        ) : (
                                            <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: (t) => alpha(t.palette.primary.main, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <BusinessOutlinedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                                            </Box>
                                        )}

                                        {/* Info */}
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                                <Typography sx={{ fontWeight: 900, minWidth: 0, fontSize: { xs: '0.85rem', sm: '0.875rem' } }} noWrap>
                                                    {row.name || 'Untitled Business'}
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    label={isPending ? 'Pending' : String(row.status || '').charAt(0).toUpperCase() + String(row.status || '').slice(1)}
                                                    color={isPending ? 'warning' : statusColor(row.status)}
                                                    sx={{ fontWeight: 800, fontSize: 11, flexShrink: 0 }}
                                                />
                                            </Stack>
                                            <Typography color="text.secondary" sx={{ fontWeight: 700, fontSize: { xs: 12, sm: 13 } }} noWrap>
                                                @{row.slug || '—'} · {[row.city, row.county].filter(Boolean).join(', ') || 'No location'}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    {/* Actions */}
                                    <Stack direction="row" spacing={0.75} sx={{ flexShrink: 0, justifyContent: { xs: 'flex-end', sm: 'flex-start' } }}>
                                        <Tooltip title="View business page in new tab" arrow>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleViewProfile(row.slug)}
                                                sx={{ color: 'primary.main' }}
                                            >
                                                <OpenInNewRoundedIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        {isPending && (
                                            <>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleReject(row.id)}
                                                    disabled={Boolean(actionLoading)}
                                                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, minWidth: 60, fontSize: { xs: 12, sm: 13 } }}
                                                >
                                                    Reject
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    color="success"
                                                    startIcon={isActing ? <CircularProgress size={14} color="inherit" /> : <CheckCircleOutlineRoundedIcon sx={{ fontSize: 16 }} />}
                                                    onClick={() => handleApprove(row.id)}
                                                    disabled={Boolean(actionLoading)}
                                                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, minWidth: 80, fontSize: { xs: 12, sm: 13 } }}
                                                >
                                                    {isActing ? '…' : 'Approve'}
                                                </Button>
                                            </>
                                        )}
                                    </Stack>
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
    );
}

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
   BusinessNameChangeRequestsPanel — self-contained list + detail
   ══════════════════════════════════════════════════════════════ */

function BusinessNameChangeRequestsPanel() {
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
            const data = await fetchBusinessNameChangeRequests({ limit: PAGE_SIZE, offset: nextOffset, status: statusFilter, q: query.trim() });
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
                await approveBusinessNameChangeRequest(selected.id, { admin_notes: editNotes });
            } else {
                await rejectBusinessNameChangeRequest(selected.id, { admin_notes: editNotes });
            }
            applyLocalPatch(selected.id, { status: action, admin_notes: editNotes });
            setSaveNotice(action === 'approved' ? 'Name change approved. The business name has been updated.' : 'Name change request rejected.');
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
        fetchBusinessNameChangeRequests({ limit: PAGE_SIZE, offset: nextOffset, status: statusFilter, q: query.trim() })
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
                                    Review and approve or reject business name change requests.
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
                                placeholder="Search business name…"
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
                                                    {row.current_name || row.business_name || 'Unknown Business'}
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
                                                {row.business_slug ? `@${row.business_slug}` : ''}{row.business_slug && row.user_email ? ' · ' : ''}{row.user_email || ''}
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
            {/* On mobile: show as a bottom Drawer; on desktop: sticky side panel */}
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
                            {/* Detail Header */}
                            <Box sx={(t) => ({ px: 2, py: 1.5, bgcolor: alpha(t.palette.primary.main, 0.04), position: 'sticky', top: 0, zIndex: 1 })}>
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
                                            <TextField label="Current name" value={selected.current_name || selected.business_name || ''} fullWidth size="small" InputProps={{ readOnly: true }} />
                                            <TextField
                                                label="Requested name" value={selected.requested_name || ''} fullWidth size="small" InputProps={{ readOnly: true }}
                                                sx={(t) => ({ '& .MuiOutlinedInput-root': { bgcolor: alpha(t.palette.secondary.main, 0.04) }, '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(t.palette.secondary.main, 0.22) } })}
                                            />
                                        </Stack>
                                    </Paper>

                                    {/* Reason */}
                                    <Paper variant="outlined" sx={sectionPaperSx}>
                                        <Typography sx={sectionTitleSx}>
                                            <CommentOutlinedIcon fontSize="small" />
                                            Reason
                                        </Typography>
                                        <TextField value={selected.reason || ''} fullWidth multiline minRows={2} InputProps={{ readOnly: true }} placeholder="No reason provided." />
                                    </Paper>

                                    {/* Admin Notes */}
                                    <Paper variant="outlined" sx={sectionPaperSx}>
                                        <Typography sx={sectionTitleSx}>
                                            <NotesOutlinedIcon fontSize="small" />
                                            Admin Notes
                                        </Typography>
                                        <TextField value={editNotes} onChange={(e) => setEditNotes(e.target.value)} fullWidth multiline minRows={3} placeholder="Internal notes (not visible to the business)…" />
                                    </Paper>
                                </Stack>
                            </Box>

                            {/* Detail Footer */}
                            <Divider />
                            <Box sx={(t) => ({ px: 2, py: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end', bgcolor: alpha(t.palette.background.paper, 0.98), position: 'sticky', bottom: 0 })}>
                                {isPending && (
                                    <Button variant="outlined" size="small" color="error" startIcon={<CancelOutlinedIcon />} onClick={() => handleAction('rejected')} disabled={saving} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, mr: 'auto' }}>
                                        Reject
                                    </Button>
                                )}
                                {isPending ? (
                                    <Button variant="contained" size="small" color="success" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlineRoundedIcon />} onClick={() => handleAction('approved')} disabled={saving} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}>
                                        {saving ? 'Saving…' : 'Approve'}
                                    </Button>
                                ) : (
                                    <Button variant="contained" size="small" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />} onClick={handleSaveNotes} disabled={saving} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}>
                                        {saving ? 'Saving…' : 'Save Notes'}
                                    </Button>
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
                                                value={selected.current_name || selected.business_name || ''}
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
                                            {selected.business_id && (
                                                <TextField
                                                    label="Business ID"
                                                    value={selected.business_id}
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
                                                    {(selected.business_avatar_url || selected.user_avatar_url) && (
                                                        <Box component="img" src={selected.business_avatar_url || selected.user_avatar_url} alt="" sx={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                                    )}
                                                    <Stack sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
                                                            {selected.current_name || selected.business_name || [selected.user_first_name, selected.user_last_name].filter(Boolean).join(' ') || 'No name'}
                                                        </Typography>
                                                        {(selected.business_slug || selected.user_handle) && (
                                                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>@{selected.business_slug || selected.user_handle}</Typography>
                                                        )}
                                                    </Stack>
                                                </Stack>
                                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                                    <TextField label="Email" value={selected.user_email || ''} fullWidth size="small" InputProps={{ readOnly: true }} />
                                                    <TextField label="Business ID" value={selected.business_id || ''} fullWidth size="small" InputProps={{ readOnly: true }} />
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
                                            placeholder="Internal notes (not visible to the business)…"
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


export default function BusinessApplicationsTab() {
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
                <PendingProfilesPanel />
            ) : (
                <BusinessNameChangeRequestsPanel />
            )}
        </Box>
    );
}

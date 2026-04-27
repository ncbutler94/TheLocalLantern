import React, { useCallback, useEffect, useState } from 'react';
import { secureFetch } from "../../utils/secureFetch";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Skeleton,
    Snackbar,
    Stack,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import MusicNoteOutlinedIcon from '@mui/icons-material/MusicNoteOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

/* ─── Constants ─── */

const CATEGORIES = [
    { key: 'all', label: 'All' },
    { key: 'artist', label: 'Artists' },
    { key: 'artist_post', label: 'Artist Posts' },
    { key: 'business', label: 'Businesses' },
    { key: 'business_post', label: 'Business Posts' },
    { key: 'comment', label: 'Comments' },
    { key: 'community_post', label: 'Community Posts' },
    { key: 'event', label: 'Events' },
    { key: 'event_comment', label: 'Event Comments' },
    { key: 'community_group', label: 'Groups' },
    { key: 'photo_comment', label: 'Photo Comments' },
    { key: 'job', label: 'Jobs' },
    { key: 'marketplace', label: 'Marketplace' },
    { key: 'message', label: 'Messages' },
    { key: 'photo', label: 'Photos' },
    { key: 'post', label: 'Post Reports' },
    { key: 'review_report,business_review_report,service_review_report', label: 'Reviews' },
    { key: 'service', label: 'Services' },
    { key: 'service_request', label: 'Service Requests' },
    { key: 'user', label: 'Users' },
];

const PAGE_SIZE = 20;

const TYPE_LABEL_MAP = {
    user: 'User',
    community_post: 'Community Post',
    comment: 'Comment',
    post: 'Post Report',
    business: 'Business',
    business_post: 'Business Post',
    community_group: 'Group',
    event: 'Event',
    event_comment: 'Event Comment',
    photo_comment: 'Photo Comment',
    job: 'Job',
    marketplace: 'Marketplace',
    service: 'Service',
    service_request: 'Service Request',
    photo: 'Photo',
    artist: 'Artist',
    artist_post: 'Artist Post',
    message: 'Message',
    review_report: 'Seller Review',
    business_review_report: 'Business Review',
    service_review_report: 'Service Review',
};

/**
 * Map of raw reason keys → clean display labels.
 * Covers common reasons stored as slugs in the DB.
 */
const REASON_LABEL_MAP = {
    'conversation': 'Reported Conversation',
    'inappropriate': 'Inappropriate',
    'wrong-location': 'Wrong Location',
    'wrong_location': 'Wrong Location',
    'nudity': 'Nudity',
    'violence': 'Violence',
    'hate': 'Hate Speech',
    'hate-speech': 'Hate Speech',
    'hate_speech': 'Hate Speech',
    'spam': 'Spam',
    'harassment': 'Harassment',
    'misinformation': 'Misinformation',
    'misleading': 'Misleading Information',
    'scam': 'Scam',
    'fraud': 'Fraud',
    'other': 'Other',
    'sexual-content': 'Sexual Content',
    'sexual_content': 'Sexual Content',
    'self-harm': 'Self Harm',
    'self_harm': 'Self Harm',
    'impersonation': 'Impersonation',
    'copyright': 'Copyright Violation',
    'underage': 'Underage Content',
    'drugs': 'Illegal Drugs',
    'threatening': 'Threatening',
    'bullying': 'Bullying',
    'false-information': 'False Information',
    'false_information': 'False Information',
    'personal-info': 'Personal Info Exposed',
    'personal_info': 'Personal Info Exposed',
    'unwanted': 'Unwanted Contact',
    'cancelled': 'Event Was Cancelled',
    'duplicate': 'Duplicate',
    'illegal': 'Illegal Content',
};

/* ─── Helpers ─── */

function formatReason(raw) {
    if (!raw) return '';
    const lower = raw.trim().toLowerCase();
    if (REASON_LABEL_MAP[lower]) return REASON_LABEL_MAP[lower];
    // Fallback: title-case
    return raw
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Format content preview — capitalize first letter, and if the whole string is a known reason slug, use its label */
function formatContentPreview(raw) {
    if (!raw) return 'No preview available.';
    const trimmed = raw.trim();
    if (!trimmed) return 'No preview available.';
    const lower = trimmed.toLowerCase();
    if (REASON_LABEL_MAP[lower]) return REASON_LABEL_MAP[lower];
    // Capitalize first letter only
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function formatTypeChipLabel(reportType) {
    if (TYPE_LABEL_MAP[reportType]) return TYPE_LABEL_MAP[reportType];
    return reportType
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildReasonSummary(report) {
    const reasons = Array.isArray(report.all_reasons) && report.all_reasons.length > 0
        ? report.all_reasons
        : report.latest_reason
            ? [report.latest_reason]
            : [];

    if (reasons.length === 0) return 'No reason provided';

    const first = formatReason(reasons[0]);
    if (reasons.length === 1) return first;
    return `${first} +${reasons.length - 1}`;
}

function getAllFormattedReasons(report) {
    const reasons = Array.isArray(report.all_reasons) && report.all_reasons.length > 0
        ? report.all_reasons
        : report.latest_reason
            ? [report.latest_reason]
            : [];
    return reasons.map(formatReason).filter(Boolean);
}

/** Check if this is a message/conversation report */
function isMessageReport(report) {
    return report?.report_type === 'message';
}

/** Extract conversation ID from a message report's entity_label or route_path */
function getConversationId(report) {
    if (!report) return null;
    // route_path like /messages?conversationId=42
    if (report.route_path) {
        const match = report.route_path.match(/conversationId=(\d+)/);
        if (match) return Number(match[1]);
    }
    // entity_label like "Conversation #42"
    if (report.entity_label) {
        const match = report.entity_label.match(/Conversation\s*#(\d+)/i);
        if (match) return Number(match[1]);
    }
    return null;
}

const parseDate = (d) => {
    if (!d) return null;
    if (d instanceof Date) return d;
    const s = String(d);
    if (!s.endsWith('Z') && !s.includes('+') && !s.includes('T')) return new Date(s.replace(' ', 'T') + 'Z');
    if (!s.endsWith('Z') && !s.includes('+')) return new Date(s + 'Z');
    return new Date(s);
};

const formatFullDate = (dateStr) => {
    const d = parseDate(dateStr);
    if (!d || isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit',
    });
};

const accountTypeIcon = (type) => {
    if (type === 'business') return <StorefrontOutlinedIcon sx={{ fontSize: 16 }} />;
    if (type === 'artist') return <MusicNoteOutlinedIcon sx={{ fontSize: 16 }} />;
    if (type === 'system') return <WarningAmberRoundedIcon sx={{ fontSize: 16 }} />;
    return <PersonRoundedIcon sx={{ fontSize: 16 }} />;
};

/* ─── Sx objects ─── */

const truncatedTextSx = { maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const truncatedLabelSx = { maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const truncatedPreviewSx = { maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' };
const previewBoxSx = { whiteSpace: 'pre-wrap', p: 1.5, bgcolor: '#f7f7f7', borderRadius: 2, wordBreak: 'break-word' };
const emptyStateSx = { py: 6, textAlign: 'center' };
const loadingBoxSx = { py: 8, display: 'flex', justifyContent: 'center' };
const closeButtonSx = { position: 'absolute', right: 8, top: 8 };

/* ═══════════════════════════════════════════════════════════════════════════════
   CONVERSATION VIEWER — embedded mini-messenger for viewing reported convos
   ═══════════════════════════════════════════════════════════════════════════════ */

function ConversationViewer({ conversationId, open, onClose }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (!open || !conversationId) return;
        let alive = true;
        setLoading(true);
        setError('');

        (async () => {
            try {
                const res = await secureFetch(`/api/admin/reports/conversation-messages/${conversationId}`, {
                    credentials: 'include',
                });
                const data = await res.json().catch(() => ({}));
                if (!alive) return;
                if (!res.ok) throw new Error(data?.message || 'Failed to load conversation.');
                setConversation(data.conversation || null);
                setMessages(data.messages || []);
            } catch (err) {
                if (alive) setError(err.message || 'Failed to load conversation.');
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => { alive = false; };
    }, [open, conversationId]);

    if (!open) return null;

    const partA = conversation?.participant_a;
    const partB = conversation?.participant_b;

    const getSender = (msg) => {
        if (!partA || !partB) return { name: 'Unknown', type: 'personal' };
        if (msg.sender_type === partA.type && Number(msg.sender_id) === Number(partA.id)) return partA;
        if (msg.sender_type === partB.type && Number(msg.sender_id) === Number(partB.id)) return partB;
        if (msg.sender_type === 'system') return { name: 'The Local Lantern', type: 'system' };
        return { name: 'Unknown', type: msg.sender_type };
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 3, minHeight: 400 } }}>
            <DialogTitle sx={{ pr: 6, fontWeight: 900, fontSize: '1.1rem' }}>
                Reported Conversation #{conversationId}
                <IconButton onClick={onClose} sx={closeButtonSx}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                {loading ? (
                    <Box sx={{ p: 3 }}>
                        <Stack spacing={2}>
                            {[1, 2, 3].map((i) => (
                                <Box key={i} sx={{ display: 'flex', gap: 1.5 }}>
                                    <Skeleton variant="circular" width={36} height={36} />
                                    <Box sx={{ flex: 1 }}>
                                        <Skeleton width="30%" height={20} />
                                        <Skeleton width="80%" height={18} sx={{ mt: 0.5 }} />
                                    </Box>
                                </Box>
                            ))}
                        </Stack>
                    </Box>
                ) : error ? (
                    <Box sx={{ p: 3 }}>
                        <Alert severity="error">{error}</Alert>
                    </Box>
                ) : (
                    <Box>
                        {/* Participants banner */}
                        {partA && partB && (
                            <Box sx={(t) => ({
                                px: 2.5, py: 1.5,
                                bgcolor: alpha(t.palette.primary.main, 0.04),
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
                            })}>
                                {[partA, partB].map((p, i) => (
                                    <React.Fragment key={i}>
                                        {i === 1 && <Typography sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.75rem' }}>↔</Typography>}
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Avatar src={p.avatar_url} sx={{ width: 28, height: 28, bgcolor: (t) => alpha(t.palette.primary.main, 0.12), color: 'primary.main' }}>
                                                {!p.avatar_url && accountTypeIcon(p.type)}
                                            </Avatar>
                                            <Box>
                                                <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', lineHeight: 1.2 }}>{p.name}</Typography>
                                                {p.handle && (
                                                    <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', fontWeight: 600, lineHeight: 1.2 }}>@{p.handle} · {p.type}</Typography>
                                                )}
                                            </Box>
                                        </Stack>
                                    </React.Fragment>
                                ))}
                            </Box>
                        )}

                        {/* Messages list */}
                        <Box sx={{ maxHeight: 500, overflowY: 'auto', px: 2, py: 2 }}>
                            {messages.length === 0 ? (
                                <Typography sx={{ textAlign: 'center', color: 'text.disabled', py: 4, fontWeight: 600 }}>No messages found.</Typography>
                            ) : (
                                <Stack spacing={1.5}>
                                    {messages.map((msg) => {
                                        const sender = getSender(msg);
                                        const isPartA = partA && msg.sender_type === partA.type && Number(msg.sender_id) === Number(partA.id);

                                        return (
                                            <Box key={msg.id} sx={{
                                                bgcolor: 'background.paper',
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                borderRadius: 2,
                                                overflow: 'hidden',
                                            }}>
                                                {/* Header */}
                                                <Box sx={(t) => ({
                                                    display: 'flex', alignItems: 'center', gap: 1.25,
                                                    px: 2, py: 1,
                                                    bgcolor: isPartA ? alpha(t.palette.info.main, 0.04) : alpha(t.palette.warning.main, 0.04),
                                                    borderBottom: '1px solid',
                                                    borderColor: alpha(t.palette.divider, 0.5),
                                                })}>
                                                    <Avatar src={sender.avatar_url} sx={{ width: 30, height: 30, bgcolor: (t) => alpha(t.palette.primary.main, 0.1), color: 'primary.main' }}>
                                                        {!sender.avatar_url && accountTypeIcon(sender.type)}
                                                    </Avatar>
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', lineHeight: 1.2 }}>
                                                            {sender.name || 'Unknown'}
                                                        </Typography>
                                                        {sender.handle && (
                                                            <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', fontWeight: 600 }}>
                                                                @{sender.handle}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, fontSize: '0.7rem', flexShrink: 0 }}>
                                                        {formatFullDate(msg.created_at)}
                                                    </Typography>
                                                </Box>
                                                {/* Body */}
                                                <Box sx={{ px: 2, py: 1.25 }}>
                                                    <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                        {msg.body}
                                                    </Typography>
                                                    {Array.isArray(msg.photos) && msg.photos.length > 0 && (
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                                                            {msg.photos.map((photo, pIdx) => {
                                                                const url = typeof photo === 'string' ? photo : photo?.url;
                                                                if (!url) return null;
                                                                return (
                                                                    <Box
                                                                        key={pIdx}
                                                                        component="img"
                                                                        src={url}
                                                                        alt={`Attachment ${pIdx + 1}`}
                                                                        referrerPolicy="no-referrer"
                                                                        sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}
                                                                    />
                                                                );
                                                            })}
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Box>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function AdminReportsTab() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [activeTab, setActiveTab] = useState('all');
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [selectedKeys, setSelectedKeys] = useState([]);
    const [previewReport, setPreviewReport] = useState(null);
    const [confirmMode, setConfirmMode] = useState('delete');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    // Conversation viewer state
    const [viewConvId, setViewConvId] = useState(null);

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const typeParam = activeTab === 'all' ? '' : `&type=${encodeURIComponent(activeTab)}`;
            const res = await secureFetch(`/api/admin/reports/items?status=pending&limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}${typeParam}`, {
                credentials: 'include',
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.message || 'Failed to load reports.');
            setReports(Array.isArray(data.items) ? data.items : []);
            setTotal(Number(data.total) || 0);
        } catch (error) {
            setToast({ open: true, severity: 'error', message: error?.message || 'Failed to load reports.' });
            setReports([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [activeTab, page]);

    useEffect(() => { fetchReports(); }, [fetchReports]);
    useEffect(() => { setPage(0); setSelectedKeys([]); }, [activeTab]);

    /* ─── Derived ─── */
    const allOnPageKeys = reports.map((report) => `${report.report_type}:${report.latest_report_id}`);
    const selectedOnPageCount = allOnPageKeys.filter((key) => selectedKeys.includes(key)).length;

    const toggleSelect = (key) => {
        setSelectedKeys((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
    };

    const handleSelectAllPage = (event) => {
        if (event.target.checked) {
            setSelectedKeys((prev) => [...new Set([...prev, ...allOnPageKeys])]);
        } else {
            setSelectedKeys((prev) => prev.filter((key) => !allOnPageKeys.includes(key)));
        }
    };

    const openConfirm = (mode, keys) => {
        setConfirmMode(mode);
        setSelectedKeys(keys);
        setConfirmOpen(true);
    };

    const performMutation = async (mode, keys) => {
        const results = await Promise.all(keys.map(async (key) => {
            const [type, id] = key.split(':');
            const endpoint = mode === 'dismiss'
                ? `/api/admin/report-actions/${encodeURIComponent(type)}/${encodeURIComponent(id)}/dismiss`
                : `/api/admin/report-actions/${encodeURIComponent(type)}/${encodeURIComponent(id)}/action`;
            const res = await secureFetch(endpoint, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mode === 'dismiss'
                    ? { actionTaken: 'dismissed_by_admin' }
                    : { deleteReportedItem: true, actionTaken: 'deleted_by_admin' }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.message || `Failed to ${mode} report.`);
            return { key, type, reportId: Number(id) || 0, data };
        }));
        return results;
    };

    const handleConfirm = async () => {
        try {
            const mutationResults = await performMutation(confirmMode, selectedKeys);
            const removedKeys = new Set(selectedKeys);
            const removedCount = removedKeys.size;

            setReports((prev) => prev.filter((report) => !removedKeys.has(`${report.report_type}:${report.latest_report_id}`)));
            setTotal((prev) => Math.max(0, Number(prev || 0) - removedCount));
            setToast({
                open: true,
                severity: 'success',
                message: confirmMode === 'dismiss'
                    ? (removedCount === 1 ? 'Report dismissed.' : `${removedCount} reports dismissed.`)
                    : (removedCount === 1 ? 'Reported content deleted. Offender notified.' : `${removedCount} reported items deleted. Offenders notified.`),
            });
            setConfirmOpen(false);
            setPreviewReport(null);
            setSelectedKeys([]);
            if (mutationResults.length > 0) fetchReports();
        } catch (error) {
            setToast({ open: true, severity: 'error', message: error?.message || 'Action failed.' });
        }
    };

    const handleCloseToast = () => setToast((prev) => ({ ...prev, open: false }));
    const handleClosePreview = () => setPreviewReport(null);
    const handleCloseConfirm = () => setConfirmOpen(false);

    const bulkCount = selectedKeys.length;
    const previewReasons = previewReport ? getAllFormattedReasons(previewReport) : [];

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
            <Stack spacing={2.5}>
                <Box>
                    <Typography variant="h5" fontWeight={900} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>Reports</Typography>
                    <Typography color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Simple moderation queue by category. View what was reported, open the related page, delete content, or dismiss the report.</Typography>
                </Box>

                <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} variant="scrollable" scrollButtons="auto">
                        {CATEGORIES.map((tab) => <Tab key={tab.key} label={tab.label} value={tab.key} />)}
                    </Tabs>
                </Paper>

                {bulkCount > 0 && (
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between">
                            <Typography fontWeight={700}>{bulkCount} report{bulkCount === 1 ? '' : 's'} selected</Typography>
                            <Stack direction="row" spacing={1}>
                                <Button variant="outlined" startIcon={<CheckCircleOutlineIcon />} onClick={() => openConfirm('dismiss', selectedKeys)}>Dismiss selected</Button>
                                <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => openConfirm('delete', selectedKeys)}>Delete selected</Button>
                            </Stack>
                        </Stack>
                    </Paper>
                )}

                <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    {loading ? (
                        <Box sx={loadingBoxSx}><CircularProgress /></Box>
                    ) : (
                        <>
                            {/* ── Mobile: card layout ── */}
                            {isMobile ? (
                                <Box>
                                    {/* Select all bar */}
                                    <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Checkbox
                                            size="small"
                                            checked={reports.length > 0 && selectedOnPageCount === reports.length}
                                            indeterminate={selectedOnPageCount > 0 && selectedOnPageCount < reports.length}
                                            onChange={handleSelectAllPage}
                                        />
                                        <Typography variant="body2" color="text.secondary" fontWeight={600}>Select all</Typography>
                                    </Box>
                                    {reports.length === 0 ? (
                                        <Box sx={emptyStateSx}>
                                            <Typography fontWeight={700}>No pending reports here.</Typography>
                                        </Box>
                                    ) : (
                                        reports.map((report) => {
                                            const key = `${report.report_type}:${report.latest_report_id}`;
                                            const hasRoute = Boolean(report.route_path);
                                            const reasonSummary = buildReasonSummary(report);
                                            const isMsgReport = isMessageReport(report);
                                            const convId = isMsgReport ? getConversationId(report) : null;
                                            const isChecked = selectedKeys.includes(key);

                                            return (
                                                <Box
                                                    key={key}
                                                    sx={(t) => ({
                                                        px: 2, py: 1.5,
                                                        borderBottom: '1px solid',
                                                        borderColor: alpha(t.palette.divider, 0.5),
                                                        bgcolor: isChecked ? alpha(t.palette.primary.main, 0.04) : 'transparent',
                                                    })}
                                                >
                                                    <Stack direction="row" spacing={1} alignItems="flex-start">
                                                        <Checkbox size="small" checked={isChecked} onChange={() => toggleSelect(key)} sx={{ mt: -0.25, flexShrink: 0 }} />
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Typography fontWeight={700} sx={{ fontSize: '0.875rem', wordBreak: 'break-word' }}>
                                                                {report.entity_label}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mt: 0.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                                {formatContentPreview(report.content_preview)}
                                                            </Typography>
                                                            <Stack direction="row" spacing={0.75} sx={{ mt: 0.75, flexWrap: 'wrap', gap: 0.5 }}>
                                                                <Chip size="small" label={formatTypeChipLabel(report.report_type)} sx={{ fontSize: '0.7rem', height: 22 }} />
                                                                <Chip size="small" variant="outlined" label={`${report.total_reports} report${report.total_reports === 1 ? '' : 's'}`} sx={{ fontSize: '0.7rem', height: 22 }} />
                                                                <Chip size="small" variant="outlined" color="warning" label={reasonSummary} sx={{ fontSize: '0.7rem', height: 22 }} />
                                                            </Stack>

                                                            {/* Reporter & Offender row */}
                                                            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                                                                <Box sx={{ minWidth: 0 }}>
                                                                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Reporter</Typography>
                                                                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }} noWrap>{report.latest_reporter_name || 'Unknown'}</Typography>
                                                                </Box>
                                                                <Box sx={{ minWidth: 0 }}>
                                                                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Offender</Typography>
                                                                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }} noWrap>{report.offender_name || 'Unknown'}</Typography>
                                                                </Box>
                                                            </Stack>

                                                            {/* Actions */}
                                                            <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                                                                <IconButton size="small" onClick={() => setPreviewReport(report)} title="View report"><VisibilityIcon fontSize="small" /></IconButton>
                                                                {isMsgReport && convId ? (
                                                                    <IconButton size="small" onClick={() => setViewConvId(convId)} title="View conversation" color="primary">
                                                                        <ChatBubbleOutlineIcon fontSize="small" />
                                                                    </IconButton>
                                                                ) : (
                                                                    <IconButton size="small" disabled={!hasRoute} href={hasRoute ? report.route_path : undefined} target="_blank" rel="noreferrer" title="Open related page">
                                                                        <OpenInNewIcon fontSize="small" />
                                                                    </IconButton>
                                                                )}
                                                                <IconButton size="small" color="success" onClick={() => openConfirm('dismiss', [key])} title="Dismiss"><CheckCircleOutlineIcon fontSize="small" /></IconButton>
                                                                <IconButton size="small" color="error" onClick={() => openConfirm('delete', [key])} title="Delete content"><DeleteIcon fontSize="small" /></IconButton>
                                                            </Stack>
                                                        </Box>
                                                    </Stack>
                                                </Box>
                                            );
                                        })
                                    )}
                                </Box>
                            ) : (
                                /* ── Desktop: table layout ── */
                                <TableContainer>
                                    <Table size="small" sx={{ tableLayout: 'fixed' }}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell padding="checkbox" sx={{ width: 48 }}>
                                                    <Checkbox
                                                        checked={reports.length > 0 && selectedOnPageCount === reports.length}
                                                        indeterminate={selectedOnPageCount > 0 && selectedOnPageCount < reports.length}
                                                        onChange={handleSelectAllPage}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ width: '32%' }}>Reported Item</TableCell>
                                                <TableCell sx={{ width: '16%' }}>Reporter</TableCell>
                                                <TableCell sx={{ width: '14%' }}>Reason</TableCell>
                                                <TableCell sx={{ width: '16%' }}>Offender</TableCell>
                                                <TableCell align="right" sx={{ width: '14%' }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {reports.map((report) => {
                                                const key = `${report.report_type}:${report.latest_report_id}`;
                                                const hasRoute = Boolean(report.route_path);
                                                const reasonSummary = buildReasonSummary(report);
                                                const isMsgReport = isMessageReport(report);
                                                const convId = isMsgReport ? getConversationId(report) : null;

                                                return (
                                                    <TableRow key={key} hover>
                                                        <TableCell padding="checkbox">
                                                            <Checkbox checked={selectedKeys.includes(key)} onChange={() => toggleSelect(key)} />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Tooltip title={report.entity_label || ''} placement="top-start" enterDelay={400}>
                                                                <Typography fontWeight={700} sx={truncatedLabelSx}>
                                                                    {report.entity_label}
                                                                </Typography>
                                                            </Tooltip>
                                                            <Tooltip title={report.content_preview || 'No preview available.'} placement="top-start" enterDelay={400}>
                                                                <Typography variant="body2" color="text.secondary" sx={truncatedPreviewSx}>
                                                                    {formatContentPreview(report.content_preview)}
                                                                </Typography>
                                                            </Tooltip>
                                                            <Stack direction="row" spacing={1} sx={{ mt: 0.75 }}>
                                                                <Chip size="small" label={formatTypeChipLabel(report.report_type)} />
                                                                <Chip size="small" variant="outlined" label={`${report.total_reports} report${report.total_reports === 1 ? '' : 's'}`} />
                                                            </Stack>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Tooltip title={report.latest_reporter_name || 'Unknown reporter'} placement="top-start" enterDelay={400}>
                                                                <Typography variant="body2" fontWeight={600} sx={truncatedTextSx}>
                                                                    {report.latest_reporter_name || 'Unknown reporter'}
                                                                </Typography>
                                                            </Tooltip>
                                                            {report.latest_reporter_email ? (
                                                                <Tooltip title={report.latest_reporter_email} placement="top-start" enterDelay={400}>
                                                                    <Typography variant="caption" color="text.secondary" sx={truncatedTextSx} component="div">
                                                                        {report.latest_reporter_email}
                                                                    </Typography>
                                                                </Tooltip>
                                                            ) : null}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" sx={truncatedTextSx}>
                                                                {reasonSummary}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Tooltip title={report.offender_name || 'Unknown'} placement="top-start" enterDelay={400}>
                                                                <Typography variant="body2" fontWeight={600} sx={truncatedTextSx}>
                                                                    {report.offender_name || 'Unknown'}
                                                                </Typography>
                                                            </Tooltip>
                                                            {report.offender_handle ? (
                                                                <Tooltip title={`@${report.offender_handle}`} placement="top-start" enterDelay={400}>
                                                                    <Typography variant="caption" color="text.secondary" sx={truncatedTextSx} component="div">
                                                                        @{report.offender_handle}
                                                                    </Typography>
                                                                </Tooltip>
                                                            ) : null}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                                <IconButton size="small" onClick={() => setPreviewReport(report)} title="View report"><VisibilityIcon fontSize="small" /></IconButton>
                                                                {isMsgReport && convId ? (
                                                                    <IconButton size="small" onClick={() => setViewConvId(convId)} title="View conversation" color="primary">
                                                                        <ChatBubbleOutlineIcon fontSize="small" />
                                                                    </IconButton>
                                                                ) : (
                                                                    <IconButton size="small" disabled={!hasRoute} href={hasRoute ? report.route_path : undefined} target="_blank" rel="noreferrer" title="Open related page">
                                                                        <OpenInNewIcon fontSize="small" />
                                                                    </IconButton>
                                                                )}
                                                                <IconButton size="small" color="success" onClick={() => openConfirm('dismiss', [key])} title="Dismiss"><CheckCircleOutlineIcon fontSize="small" /></IconButton>
                                                                <IconButton size="small" color="error" onClick={() => openConfirm('delete', [key])} title="Delete content"><DeleteIcon fontSize="small" /></IconButton>
                                                            </Stack>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                            {reports.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6}>
                                                        <Box sx={emptyStateSx}>
                                                            <Typography fontWeight={700}>No pending reports here.</Typography>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ) : null}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                            <TablePagination
                                component="div"
                                count={total}
                                page={page}
                                onPageChange={(_, nextPage) => setPage(nextPage)}
                                rowsPerPage={PAGE_SIZE}
                                rowsPerPageOptions={[PAGE_SIZE]}
                                sx={isMobile ? { '.MuiTablePagination-toolbar': { px: 1, flexWrap: 'wrap', justifyContent: 'center' }, '.MuiTablePagination-spacer': { display: 'none' } } : {}}
                            />
                        </>
                    )}
                </Paper>
            </Stack>

            {/* ─── Preview dialog ─── */}
            <Dialog open={Boolean(previewReport)} onClose={handleClosePreview} fullWidth maxWidth="sm">
                <DialogTitle sx={{ pr: 6, fontWeight: 900 }}>
                    View Report
                    <IconButton onClick={handleClosePreview} sx={closeButtonSx}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={1.5}>
                        <Box>
                            <Typography variant="subtitle2">Reported Item</Typography>
                            <Typography variant="body1" fontWeight={700} sx={{ wordBreak: 'break-word' }}>
                                {previewReport?.entity_label}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2">Type</Typography>
                            <Chip size="small" label={previewReport ? formatTypeChipLabel(previewReport.report_type) : ''} sx={{ mt: 0.25 }} />
                        </Box>
                        <Box>
                            <Typography variant="subtitle2">What Was Reported</Typography>
                            <Typography variant="body2" sx={previewBoxSx}>
                                {formatContentPreview(previewReport?.content_preview)}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2">Reporter</Typography>
                            <Typography variant="body2">{previewReport?.latest_reporter_name || 'Unknown reporter'}</Typography>
                            {previewReport?.latest_reporter_email ? (
                                <Typography variant="caption" color="text.secondary">{previewReport.latest_reporter_email}</Typography>
                            ) : null}
                        </Box>
                        <Box>
                            <Typography variant="subtitle2">
                                {previewReasons.length > 1 ? `Reasons (${previewReasons.length})` : 'Reason'}
                            </Typography>
                            {previewReasons.length > 0 ? (
                                <Stack direction="row" spacing={0.75} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.75 }}>
                                    {previewReasons.map((reason) => (
                                        <Chip key={reason} size="small" label={reason} variant="outlined" />
                                    ))}
                                </Stack>
                            ) : (
                                <Typography variant="body2">No reason provided.</Typography>
                            )}
                        </Box>
                        {previewReport?.latest_details ? (
                            <Box>
                                <Typography variant="subtitle2">Reporter Note</Typography>
                                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{previewReport.latest_details}</Typography>
                            </Box>
                        ) : null}
                        <Box>
                            <Typography variant="subtitle2">Offender</Typography>
                            <Typography variant="body2">
                                {previewReport?.offender_name || 'Unknown'}
                                {previewReport?.offender_handle ? ` (@${previewReport.offender_handle})` : ''}
                            </Typography>
                        </Box>
                        {previewReport?.total_reports > 1 ? (
                            <Box>
                                <Typography variant="subtitle2">Total Reports</Typography>
                                <Typography variant="body2">
                                    {previewReport.total_reports} report{previewReport.total_reports === 1 ? '' : 's'} from {previewReport.unique_reporters || previewReport.total_reports} reporter{(previewReport.unique_reporters || previewReport.total_reports) === 1 ? '' : 's'}
                                </Typography>
                            </Box>
                        ) : null}

                        {/* Review photos for review reports */}
                        {Array.isArray(previewReport?.review_photos) && previewReport.review_photos.length > 0 ? (
                            <Box>
                                <Typography variant="subtitle2">Review Photos</Typography>
                                <Stack direction="row" spacing={1} sx={{ mt: 0.75, flexWrap: 'wrap', gap: 1 }}>
                                    {previewReport.review_photos.map((url, idx) => (
                                        <Box
                                            key={idx}
                                            component="a"
                                            href={url}
                                            target="_blank"
                                            rel="noreferrer"
                                            sx={{ display: 'block', width: 100, height: 100, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', flexShrink: 0, '&:hover': { opacity: 0.85 } }}
                                        >
                                            <Box component="img" src={url} alt={`Review photo ${idx + 1}`} referrerPolicy="no-referrer" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        ) : null}

                        {/* View conversation button for message reports */}
                        {previewReport && isMessageReport(previewReport) && getConversationId(previewReport) ? (
                            <Box>
                                <Button
                                    variant="outlined"
                                    startIcon={<ChatBubbleOutlineIcon />}
                                    onClick={() => setViewConvId(getConversationId(previewReport))}
                                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, mt: 0.5 }}
                                >
                                    View Full Conversation
                                </Button>
                            </Box>
                        ) : null}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    {previewReport?.route_path && !isMessageReport(previewReport) ? (
                        <Button component="a" href={previewReport.route_path} target="_blank" rel="noreferrer">Open page</Button>
                    ) : null}
                    <Button color="success" onClick={() => openConfirm('dismiss', [`${previewReport.report_type}:${previewReport.latest_report_id}`])}>Dismiss</Button>
                    <Button variant="contained" color="error" onClick={() => openConfirm('delete', [`${previewReport.report_type}:${previewReport.latest_report_id}`])}>Delete</Button>
                </DialogActions>
            </Dialog>

            {/* ─── Confirm dialog ─── */}
            <Dialog open={confirmOpen} onClose={handleCloseConfirm}>
                <DialogTitle sx={{ fontWeight: 800 }}>
                    {confirmMode === 'dismiss' ? 'Dismiss report?' : 'Delete reported content?'}
                    <IconButton onClick={handleCloseConfirm} sx={closeButtonSx}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        {confirmMode === 'dismiss'
                            ? 'This will remove the selected report from the moderation queue.'
                            : 'This will delete the reported content, send a moderation notice to the offender, and increment their offense count.'}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseConfirm}>Cancel</Button>
                    <Button variant="contained" color={confirmMode === 'dismiss' ? 'success' : 'error'} onClick={handleConfirm}>
                        {confirmMode === 'dismiss' ? 'Dismiss' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ─── Conversation viewer ─── */}
            <ConversationViewer
                conversationId={viewConvId}
                open={Boolean(viewConvId)}
                onClose={() => setViewConvId(null)}
            />

            {/* ─── Toast ─── */}
            <Snackbar open={toast.open} autoHideDuration={3500} onClose={handleCloseToast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={toast.severity} onClose={handleCloseToast}>{toast.message}</Alert>
            </Snackbar>
        </Box>
    );
}

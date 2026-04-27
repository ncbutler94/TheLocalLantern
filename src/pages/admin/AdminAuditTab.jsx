// src/pages/admin/AdminAuditTab.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { secureFetch } from "../../utils/secureFetch";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import GavelRoundedIcon from '@mui/icons-material/GavelRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import MusicNoteOutlinedIcon from '@mui/icons-material/MusicNoteOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

const PAGE_SIZE = 25;

const TYPE_OPTIONS = [
    { value: '', label: 'All Types' },
    { value: 'user', label: 'Users' },
    { value: 'business', label: 'Businesses' },
    { value: 'artist', label: 'Artists' },
    { value: 'community_post', label: 'Community Posts' },
    { value: 'comment', label: 'Comments' },
    { value: 'business_post', label: 'Business Posts' },
    { value: 'event', label: 'Events' },
    { value: 'event_comment', label: 'Event Comments' },
    { value: 'job', label: 'Jobs' },
    { value: 'marketplace', label: 'Marketplace' },
    { value: 'service', label: 'Services' },
    { value: 'message', label: 'Messages' },
    { value: 'review_report', label: 'Reviews' },
    { value: 'community_group', label: 'Groups' },
];

const formatType = (t) => {
    const found = TYPE_OPTIONS.find((o) => o.value === t);
    if (found) return found.label;
    return (t || '').replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const parseDate = (d) => {
    if (!d) return null;
    const s = String(d);
    if (!s.endsWith('Z') && !s.includes('+') && !s.includes('T')) return new Date(s.replace(' ', 'T') + 'Z');
    if (!s.endsWith('Z') && !s.includes('+')) return new Date(s + 'Z');
    return new Date(s);
};

const formatDate = (dateStr) => {
    const d = parseDate(dateStr);
    if (!d || isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const truncSx = { maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

/* ─── Account-type icon helper ─── */
const accountTypeIcon = (type) => {
    if (type === 'business') return <StorefrontOutlinedIcon sx={{ fontSize: 16 }} />;
    if (type === 'artist') return <MusicNoteOutlinedIcon sx={{ fontSize: 16 }} />;
    if (type === 'system') return <WarningAmberRoundedIcon sx={{ fontSize: 16 }} />;
    return <PersonRoundedIcon sx={{ fontSize: 16 }} />;
};

/* ─── Smart field display: picks out "interesting" keys from a snapshot ─── */
const SKIP_KEYS = new Set([
    'id', 'created_at', 'updated_at', 'deleted_at', 'password', 'password_hash',
    'reset_token', 'reset_expires', 'email_verified_token', 'session_token',
    'content_snapshot_json', 'related_content_json', 'metadata_json',
]);

const LABEL_MAP = {
    name: 'Name', title: 'Title', body: 'Body', description: 'Description',
    slug: 'Slug', handle: 'Handle', category: 'Category', genre: 'Genre',
    city: 'City', county: 'County', state: 'State', zip_code: 'Zip',
    email: 'Email', phone: 'Phone', website: 'Website', address: 'Address',
    status: 'Status', entity_type: 'Entity Type', report_scope: 'Report Scope',
    reason: 'Reason', details: 'Details', conversation_id: 'Conversation ID',
    message_id: 'Message ID', message_body_snapshot: 'Message Body',
    reporter_account_type: 'Reporter Type', reporter_account_id: 'Reporter ID',
    reported_account_type: 'Reported Type', reported_account_id: 'Reported ID',
    first_name: 'First Name', last_name: 'Last Name',
    published_at: 'Published', start_date: 'Start Date', end_date: 'End Date',
    start_time: 'Start Time', end_time: 'End Time', location: 'Location',
    venue_name: 'Venue', price: 'Price', subtitle: 'Subtitle',
    provider_name: 'Provider', provider_handle: 'Provider Handle',
    badge_text: 'Badge', url: 'URL', image_url: 'Image', cover_image_url: 'Cover Image',
    avatar_url: 'Avatar', photo_url: 'Photo',
};

/** Pretty-print a field label */
const fieldLabel = (key) => LABEL_MAP[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** Check if a value is a URL-like image */
const isImageUrl = (val) => typeof val === 'string' && /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg|avif)/i.test(val);

/** Check if key is image-related */
const isImageKey = (key) => /avatar|photo|image|cover|logo|banner|thumbnail/i.test(key);

/* ════════════════════════════════════════════════════════════════════════════
   SnapshotField — renders a single snapshot field in a readable way
   ════════════════════════════════════════════════════════════════════════════ */
function SnapshotField({ label, value }) {
    if (value === null || value === undefined || value === '') return null;

    // Images
    if (typeof value === 'string' && isImageUrl(value)) {
        return (
            <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>{label}</Typography>
                <Box
                    component="img"
                    src={value}
                    alt={label}
                    sx={{ maxWidth: 280, maxHeight: 180, borderRadius: 2, border: '1px solid', borderColor: 'divider', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
            </Box>
        );
    }

    // Long text (body, description, details)
    if (typeof value === 'string' && value.length > 200) {
        return (
            <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>{label}</Typography>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: '#fafafa' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.82rem', lineHeight: 1.6 }}>
                        {value}
                    </Typography>
                </Paper>
            </Box>
        );
    }

    // JSON objects/arrays
    if (typeof value === 'object') {
        const json = JSON.stringify(value, null, 2);
        if (json === '{}' || json === '[]' || json === 'null') return null;
        return (
            <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>{label}</Typography>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: '#fafafa', maxHeight: 200, overflow: 'auto' }}>
                    <pre style={{ margin: 0, fontSize: '0.75rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                        {json}
                    </pre>
                </Paper>
            </Box>
        );
    }

    // Simple values
    return (
        <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0 }}>{label}</Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-word', fontSize: '0.85rem' }}>{String(value)}</Typography>
        </Box>
    );
}

/* ════════════════════════════════════════════════════════════════════════════
   MessageBubble — renders a single message in conversation view
   ════════════════════════════════════════════════════════════════════════════ */
function MessageBubble({ msg, isEven }) {
    const senderType = msg.sender_type || 'personal';
    const photos = Array.isArray(msg.photos) ? msg.photos : [];
    return (
        <Box sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            overflow: 'hidden',
        }}>
            <Box sx={(t) => ({
                display: 'flex', alignItems: 'center', gap: 1.25,
                px: 2, py: 0.75,
                bgcolor: isEven ? alpha(t.palette.info.main, 0.04) : alpha(t.palette.warning.main, 0.04),
                borderBottom: '1px solid',
                borderColor: alpha(t.palette.divider, 0.5),
            })}>
                <Avatar sx={{ width: 26, height: 26, bgcolor: (t) => alpha(t.palette.primary.main, 0.12), color: 'primary.main' }}>
                    {accountTypeIcon(senderType)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.78rem', lineHeight: 1.2 }}>
                        {senderType}:{msg.sender_id}
                    </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', fontWeight: 600, flexShrink: 0 }}>
                    {formatDate(msg.created_at)}
                </Typography>
            </Box>
            <Box sx={{ px: 2, py: 1.25 }}>
                {msg.body ? (
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.84rem', lineHeight: 1.55 }}>
                        {msg.body}
                    </Typography>
                ) : photos.length === 0 ? (
                    <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic', fontSize: '0.84rem' }}>
                        (no text)
                    </Typography>
                ) : null}
                {photos.length > 0 && (
                    <Stack direction="row" spacing={1} sx={{ mt: msg.body ? 1 : 0, flexWrap: 'wrap', gap: 1 }}>
                        {photos.map((url, i) => (
                            <Box
                                key={i}
                                component="img"
                                src={typeof url === 'string' ? url : url?.url}
                                alt={`Attachment ${i + 1}`}
                                sx={{
                                    maxWidth: 200, maxHeight: 160, borderRadius: 1.5,
                                    border: '1px solid', borderColor: 'divider',
                                    objectFit: 'cover', cursor: 'pointer',
                                }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        ))}
                    </Stack>
                )}
            </Box>
        </Box>
    );
}

/* ════════════════════════════════════════════════════════════════════════════
   SmartSnapshotView — renders content_snapshot in a human-friendly way
   ════════════════════════════════════════════════════════════════════════════ */
function SmartSnapshotView({ snapshot, entityType, relatedContent }) {
    const [showRaw, setShowRaw] = useState(false);

    if (!snapshot) return null;

    const data = typeof snapshot === 'string' ? (() => { try { return JSON.parse(snapshot); } catch { return null; } })() : snapshot;
    if (!data || typeof data !== 'object') {
        return (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, maxHeight: 400, overflow: 'auto', bgcolor: '#fafafa' }}>
                <pre style={{ margin: 0, fontSize: '0.78rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot, null, 2)}
                </pre>
            </Paper>
        );
    }

    const related = (() => {
        if (!relatedContent) return null;
        if (typeof relatedContent === 'string') { try { return JSON.parse(relatedContent); } catch { return null; } }
        return relatedContent;
    })();

    /* ── Message / conversation type — show conversation viewer ── */
    const isMessage = entityType === 'message';
    const relatedMessages = related?.messages;

    if (isMessage && Array.isArray(relatedMessages) && relatedMessages.length > 0) {
        // Build sender lookup from the snapshot (message_reports row has reporter/reported info)
        return (
            <Stack spacing={2}>
                {/* Report info from snapshot */}
                <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>Report Info</Typography>
                    <Stack spacing={1} sx={{ pl: 0.5 }}>
                        {data.report_scope && <SnapshotField label="Scope" value={data.report_scope} />}
                        {data.conversation_id && <SnapshotField label="Conversation ID" value={data.conversation_id} />}
                        {data.message_body_snapshot && <SnapshotField label="Reported Message" value={data.message_body_snapshot} />}
                        {data.reason && <SnapshotField label="Reason" value={(data.reason || '').replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} />}
                        {data.details && <SnapshotField label="Reporter Details" value={data.details} />}
                    </Stack>
                </Box>

                <Divider />

                {/* Conversation messages */}
                <Box>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                        <ChatBubbleOutlineIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                            Conversation ({relatedMessages.length} message{relatedMessages.length !== 1 ? 's' : ''})
                        </Typography>
                    </Stack>
                    <Stack spacing={1} sx={{ maxHeight: 500, overflowY: 'auto', pr: 0.5 }}>
                        {relatedMessages.map((msg, idx) => (
                            <MessageBubble key={msg.id || idx} msg={msg} isEven={idx % 2 === 0} />
                        ))}
                    </Stack>
                </Box>

                {/* Raw JSON toggle */}
                <Box>
                    <Button
                        size="small"
                        onClick={() => setShowRaw(!showRaw)}
                        startIcon={showRaw ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}
                    >
                        {showRaw ? 'Hide' : 'Show'} raw data
                    </Button>
                    <Collapse in={showRaw}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, maxHeight: 300, overflow: 'auto', bgcolor: '#fafafa', mt: 1 }}>
                            <pre style={{ margin: 0, fontSize: '0.72rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                {JSON.stringify(data, null, 2)}
                            </pre>
                        </Paper>
                    </Collapse>
                </Box>
            </Stack>
        );
    }

    /* ── Generic entity types — smart field rendering ── */

    // Prioritize important fields at the top
    const priorityKeys = ['name', 'title', 'subtitle', 'body', 'description', 'status', 'category', 'genre',
        'city', 'county', 'state', 'address', 'venue_name', 'location', 'email', 'phone', 'website',
        'start_date', 'end_date', 'start_time', 'end_time', 'price', 'published_at',
        'slug', 'handle', 'entity_type', 'provider_name', 'provider_handle', 'badge_text'];

    // Collect image keys
    const imageEntries = [];
    // Collect priority fields
    const priorityEntries = [];
    // Collect remaining fields
    const otherEntries = [];

    const allKeys = Object.keys(data);
    const handledKeys = new Set();

    // First pass: images
    for (const key of allKeys) {
        if (SKIP_KEYS.has(key)) { handledKeys.add(key); continue; }
        const val = data[key];
        if ((isImageKey(key) && isImageUrl(val)) || isImageUrl(val)) {
            imageEntries.push([key, val]);
            handledKeys.add(key);
        }
    }

    // Second pass: priority fields
    for (const key of priorityKeys) {
        if (handledKeys.has(key)) continue;
        if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
            priorityEntries.push([key, data[key]]);
            handledKeys.add(key);
        }
    }

    // Third pass: remaining
    for (const key of allKeys) {
        if (handledKeys.has(key)) continue;
        const val = data[key];
        if (val === null || val === undefined || val === '') continue;
        // Skip big JSON blobs in the smart view
        if (typeof val === 'string' && key.endsWith('_json') && val.length > 500) continue;
        otherEntries.push([key, val]);
    }

    // Photos from related content
    const relatedPhotos = related?.photos;

    return (
        <Stack spacing={2}>
            {/* Images at top */}
            {imageEntries.length > 0 && (
                <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1.5 }}>
                    {imageEntries.map(([key, val]) => (
                        <Box key={key}>
                            <Box
                                component="img"
                                src={val}
                                alt={fieldLabel(key)}
                                sx={{ maxWidth: 220, maxHeight: 160, borderRadius: 2, border: '1px solid', borderColor: 'divider', objectFit: 'cover' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem', display: 'block', mt: 0.25 }}>{fieldLabel(key)}</Typography>
                        </Box>
                    ))}
                </Stack>
            )}

            {/* Priority fields */}
            {priorityEntries.length > 0 && (
                <Stack spacing={1.25}>
                    {priorityEntries.map(([key, val]) => (
                        <SnapshotField key={key} label={fieldLabel(key)} value={val} />
                    ))}
                </Stack>
            )}

            {/* Other fields */}
            {otherEntries.length > 0 && (
                <>
                    {priorityEntries.length > 0 && <Divider />}
                    <Stack spacing={1}>
                        {otherEntries.map(([key, val]) => (
                            <SnapshotField key={key} label={fieldLabel(key)} value={val} />
                        ))}
                    </Stack>
                </>
            )}

            {/* Related photos */}
            {Array.isArray(relatedPhotos) && relatedPhotos.length > 0 && (
                <Box>
                    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
                        <ImageOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            Photos ({relatedPhotos.length})
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                        {relatedPhotos.map((url, i) => (
                            <Box
                                key={i}
                                component="img"
                                src={url}
                                alt={`Photo ${i + 1}`}
                                sx={{ width: 120, height: 90, borderRadius: 2, border: '1px solid', borderColor: 'divider', objectFit: 'cover', cursor: 'pointer' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        ))}
                    </Stack>
                </Box>
            )}

            {/* Related content — non-photo, non-message items */}
            {related && !relatedMessages && !relatedPhotos && Object.keys(related).length > 0 && (
                <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>Related Content</Typography>
                    {Object.entries(related).filter(([k]) => k !== 'photos' && k !== 'messages').map(([key, val]) => (
                        <SnapshotField key={key} label={fieldLabel(key)} value={val} />
                    ))}
                </Box>
            )}

            {/* Raw JSON toggle */}
            <Box>
                <Button
                    size="small"
                    onClick={() => setShowRaw(!showRaw)}
                    startIcon={showRaw ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}
                >
                    {showRaw ? 'Hide' : 'Show'} raw JSON
                </Button>
                <Collapse in={showRaw}>
                    <Stack spacing={1.5} sx={{ mt: 1 }}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, maxHeight: 300, overflow: 'auto', bgcolor: '#fafafa' }}>
                            <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>Content Snapshot</Typography>
                            <pre style={{ margin: 0, fontSize: '0.72rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                {JSON.stringify(data, null, 2)}
                            </pre>
                        </Paper>
                        {related && (
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, maxHeight: 300, overflow: 'auto', bgcolor: '#fafafa' }}>
                                <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>Related Content</Typography>
                                <pre style={{ margin: 0, fontSize: '0.72rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                    {JSON.stringify(related, null, 2)}
                                </pre>
                            </Paper>
                        )}
                    </Stack>
                </Collapse>
            </Box>
        </Stack>
    );
}

export default function AdminAuditTab() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [typeFilter, setTypeFilter] = useState('');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    const [detailEntry, setDetailEntry] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const fetchAudit = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('limit', String(PAGE_SIZE));
            params.set('offset', String(page * PAGE_SIZE));
            if (typeFilter) params.set('type', typeFilter);
            if (search) params.set('q', search);

            const res = await secureFetch(`/api/admin/reports/audit?${params.toString()}`, { credentials: 'include' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.message || 'Failed to load audit history.');
            setEntries(Array.isArray(data.items) ? data.items : []);
            setTotal(Number(data.total) || 0);
        } catch (err) {
            setToast({ open: true, severity: 'error', message: err?.message || 'Failed to load audit history.' });
            setEntries([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [typeFilter, search, page]);

    useEffect(() => { fetchAudit(); }, [fetchAudit]);
    useEffect(() => { setPage(0); }, [typeFilter, search]);

    const handleSearch = () => setSearch(searchInput.trim());
    const handleClear = () => { setSearchInput(''); setSearch(''); };

    const viewDetail = async (auditId) => {
        setDetailLoading(true);
        try {
            const res = await secureFetch(`/api/admin/reports/audit/${auditId}`, { credentials: 'include' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.message || 'Failed to load detail.');
            setDetailEntry(data.entry || null);
        } catch (err) {
            setToast({ open: true, severity: 'error', message: err?.message || 'Failed to load detail.' });
        } finally {
            setDetailLoading(false);
        }
    };

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
            <Stack spacing={2.5}>
                <Box>
                    <Typography variant="h5" fontWeight={900} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>Audit Log</Typography>
                    <Typography color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Complete history of all moderation actions with full content snapshots of what was removed.</Typography>
                </Box>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Content Type</InputLabel>
                        <Select value={typeFilter} label="Content Type" onChange={(e) => setTypeFilter(e.target.value)} sx={{ borderRadius: 2.5 }}>
                            {TYPE_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <TextField
                        size="small" placeholder="Search by name, handle, or reason..."
                        value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                        sx={{ minWidth: 260, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 20, color: 'text.disabled' }} /></InputAdornment>,
                            endAdornment: searchInput ? <InputAdornment position="end"><IconButton size="small" onClick={handleClear}><ClearIcon sx={{ fontSize: 18 }} /></IconButton></InputAdornment> : null,
                        }}
                    />
                    <Button variant="contained" size="small" onClick={handleSearch} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3, height: 38 }}>Search</Button>
                </Stack>

                <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    {loading ? (
                        <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
                    ) : (
                        <>
                            {/* ── Mobile card layout ── */}
                            {isMobile ? (
                                <Box>
                                    {entries.length === 0 ? (
                                        <Box sx={{ py: 6, textAlign: 'center' }}>
                                            <GavelRoundedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                            <Typography fontWeight={700}>No audit entries yet.</Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Entries appear here when content is deleted through reports or the members panel.</Typography>
                                        </Box>
                                    ) : (
                                        entries.map((e) => (
                                            <Box
                                                key={e.id}
                                                sx={(t) => ({
                                                    px: 2, py: 1.5,
                                                    borderBottom: '1px solid',
                                                    borderColor: alpha(t.palette.divider, 0.5),
                                                })}
                                            >
                                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography fontWeight={700} sx={{ fontSize: '0.875rem', wordBreak: 'break-word' }}>
                                                            {e.entity_label || `#${e.entity_id}`}
                                                        </Typography>
                                                        <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                                                            <Chip size="small" label={formatType(e.entity_type)} sx={{ fontWeight: 600, fontSize: '0.68rem', height: 20 }} />
                                                            <Chip size="small" variant="outlined" label={e.source === 'members_panel' ? 'Members' : 'Reports'} sx={{ fontSize: '0.68rem', height: 20 }} />
                                                        </Stack>
                                                    </Box>
                                                    <IconButton size="small" onClick={() => viewDetail(e.id)} title="View snapshot" sx={{ flexShrink: 0 }}>
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>

                                                <Stack direction="row" spacing={2} sx={{ mt: 0.75 }}>
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>Offender</Typography>
                                                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }} noWrap>
                                                            {e.offender_name || '—'}
                                                            {e.offender_handle ? ` @${e.offender_handle}` : ''}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>Admin</Typography>
                                                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }} noWrap>{e.admin_name}</Typography>
                                                    </Box>
                                                </Stack>

                                                <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
                                                    {(e.reason || '').replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'No reason'}
                                                    {e.created_at ? ` · ${formatDate(e.created_at)}` : ''}
                                                </Typography>
                                            </Box>
                                        ))
                                    )}
                                </Box>
                            ) : (
                                /* ── Desktop table layout ── */
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ width: '22%' }}>Deleted Item</TableCell>
                                                <TableCell sx={{ width: '12%' }}>Type</TableCell>
                                                <TableCell sx={{ width: '16%' }}>Offender</TableCell>
                                                <TableCell sx={{ width: '12%' }}>Reason</TableCell>
                                                <TableCell sx={{ width: '12%' }}>Admin</TableCell>
                                                <TableCell sx={{ width: '10%' }}>Source</TableCell>
                                                <TableCell sx={{ width: '14%' }}>Date</TableCell>
                                                <TableCell align="right" sx={{ width: '6%' }}>View</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {entries.map((e) => (
                                                <TableRow key={e.id} hover>
                                                    <TableCell>
                                                        <Tooltip title={e.entity_label || ''} enterDelay={400}>
                                                            <Typography fontWeight={700} sx={truncSx}>{e.entity_label || `#${e.entity_id}`}</Typography>
                                                        </Tooltip>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip size="small" label={formatType(e.entity_type)} sx={{ fontWeight: 600, fontSize: '0.72rem' }} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={600} sx={truncSx}>{e.offender_name || '—'}</Typography>
                                                        {e.offender_handle && <Typography variant="caption" color="text.secondary" sx={truncSx} component="div">@{e.offender_handle}</Typography>}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={truncSx}>
                                                            {(e.reason || '').replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '—'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={truncSx}>{e.admin_name}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip size="small" variant="outlined" label={e.source === 'members_panel' ? 'Members' : 'Reports'} sx={{ fontSize: '0.7rem' }} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>{formatDate(e.created_at)}</Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <IconButton size="small" onClick={() => viewDetail(e.id)} title="View snapshot"><VisibilityIcon fontSize="small" /></IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {entries.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={8}>
                                                        <Box sx={{ py: 6, textAlign: 'center' }}>
                                                            <GavelRoundedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                                            <Typography fontWeight={700}>No audit entries yet.</Typography>
                                                            <Typography variant="body2" color="text.secondary">Entries appear here when content is deleted through reports or the members panel.</Typography>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                            <TablePagination
                                component="div"
                                count={total}
                                page={page}
                                onPageChange={(_, p) => setPage(p)}
                                rowsPerPage={PAGE_SIZE}
                                rowsPerPageOptions={[PAGE_SIZE]}
                                sx={isMobile ? { '.MuiTablePagination-toolbar': { px: 1, flexWrap: 'wrap', justifyContent: 'center' }, '.MuiTablePagination-spacer': { display: 'none' } } : {}}
                            />
                        </>
                    )}
                </Paper>
            </Stack>

            {/* ─── Detail dialog ─── */}
            <Dialog open={Boolean(detailEntry)} onClose={() => setDetailEntry(null)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 900, pr: 6 }}>
                    Audit Detail — {detailEntry?.entity_label || `#${detailEntry?.entity_id}`}
                    <IconButton onClick={() => setDetailEntry(null)} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {detailLoading ? (
                        <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
                    ) : detailEntry ? (
                        <Stack spacing={2}>
                            <Stack direction="row" spacing={3} flexWrap="wrap">
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                                    <Chip size="small" label={formatType(detailEntry.entity_type)} />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Action</Typography>
                                    <Chip size="small" color="error" icon={<DeleteIcon sx={{ fontSize: 14 }} />} label={detailEntry.action} />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                                    <Typography variant="body2">{formatDate(detailEntry.created_at)}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Source</Typography>
                                    <Typography variant="body2">{detailEntry.source === 'members_panel' ? 'Members Panel' : 'Reports'}</Typography>
                                </Box>
                            </Stack>

                            {(detailEntry.offender_name || detailEntry.offender_handle) && (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Offender</Typography>
                                    <Typography variant="body2" fontWeight={700}>
                                        {detailEntry.offender_name}{detailEntry.offender_handle ? ` (@${detailEntry.offender_handle})` : ''}
                                    </Typography>
                                </Box>
                            )}

                            {detailEntry.reason && (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Reason</Typography>
                                    <Typography variant="body2">{(detailEntry.reason || '').replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</Typography>
                                </Box>
                            )}
                            {detailEntry.details && (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Details</Typography>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{detailEntry.details}</Typography>
                                </Box>
                            )}

                            {/* Smart content view */}
                            {(detailEntry.content_snapshot || detailEntry.related_content) && (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Content</Typography>
                                    <SmartSnapshotView
                                        snapshot={detailEntry.content_snapshot}
                                        entityType={detailEntry.entity_type}
                                        relatedContent={detailEntry.related_content}
                                    />
                                </Box>
                            )}
                        </Stack>
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailEntry(null)}>Close</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={toast.open} autoHideDuration={3500} onClose={() => setToast((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={toast.severity} onClose={() => setToast((p) => ({ ...p, open: false }))}>{toast.message}</Alert>
            </Snackbar>
        </Box>
    );
}
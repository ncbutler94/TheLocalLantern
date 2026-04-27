// src/pages/admin/AdminMembersTab.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { secureFetch } from "../../utils/secureFetch";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
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
    TableSortLabel,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import MusicNoteOutlinedIcon from '@mui/icons-material/MusicNoteOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

/* ─── Constants ─── */

const PAGE_SIZE = 25;

/* ─── Helpers ─── */

const accountIcon = (type) => {
    if (type === 'business') return <StorefrontOutlinedIcon sx={{ fontSize: 16 }} />;
    if (type === 'artist') return <MusicNoteOutlinedIcon sx={{ fontSize: 16 }} />;
    return <PersonRoundedIcon sx={{ fontSize: 16 }} />;
};

const accountLabel = (type) => {
    if (type === 'business') return 'Business';
    if (type === 'artist') return 'Artist';
    return 'User';
};

const truncSx = { maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

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
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

/* Relative time formatter — matches the "Nm / Nhr / Nd / Nwk / Nmo / Ny ago" style
   used elsewhere in the app. Returns { label, online } where `online` is true
   if the user pinged within the last 5 minutes. */
const ONLINE_WINDOW_MS = 5 * 60 * 1000;
const lastSeenAgo = (dateStr) => {
    if (!dateStr) return { label: '—', online: false, never: true };
    const d = parseDate(dateStr);
    if (!d || isNaN(d.getTime())) return { label: '—', online: false, never: true };
    const diffMs = Math.max(0, Date.now() - d.getTime());
    if (diffMs < ONLINE_WINDOW_MS) return { label: 'Online', online: true };
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return { label: 'Just now', online: false };
    const min = Math.floor(sec / 60);
    if (min < 60) return { label: `${min}m ago`, online: false };
    const hr = Math.floor(min / 60);
    if (hr < 24) return { label: `${hr}hr ago`, online: false };
    const day = Math.floor(hr / 24);
    if (day < 7) return { label: `${day}d ago`, online: false };
    const wk = Math.floor(day / 7);
    if (wk < 5) return { label: `${wk}wk ago`, online: false };
    const mo = Math.floor(day / 30);
    if (mo < 12) return { label: `${mo}mo ago`, online: false };
    const yr = Math.floor(day / 365);
    return { label: `${yr}y ago`, online: false };
};

/* ─── Component ─── */

export default function AdminMembersTab() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [typeFilter, setTypeFilter] = useState('');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [sortBy, setSortBy] = useState('last_seen');
    const [sortDir, setSortDir] = useState('desc');
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('limit', String(PAGE_SIZE));
            params.set('offset', String(page * PAGE_SIZE));
            if (typeFilter) params.set('type', typeFilter);
            if (search) params.set('q', search);
            params.set('sort', sortBy);
            params.set('dir', sortDir);

            const res = await secureFetch(`/api/admin/reports/members?${params.toString()}`, { credentials: 'include' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.message || 'Failed to load members.');
            setMembers(Array.isArray(data.items) ? data.items : []);
            setTotal(Number(data.total) || 0);
        } catch (err) {
            setToast({ open: true, severity: 'error', message: err?.message || 'Failed to load members.' });
            setMembers([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [typeFilter, search, page, sortBy, sortDir]);

    useEffect(() => { fetchMembers(); }, [fetchMembers]);

    useEffect(() => { setPage(0); }, [typeFilter, search, sortBy, sortDir]);

    // Nudge a re-render every 60s so relative "last seen" times stay fresh
    // without requiring a full data refetch.
    const [, setNowTick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setNowTick((n) => n + 1), 60_000);
        return () => clearInterval(id);
    }, []);

    const handleSearch = () => setSearch(searchInput.trim());
    const handleClearSearch = () => { setSearchInput(''); setSearch(''); };

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(column);
            setSortDir(column === 'offenses' ? 'desc' : 'desc');
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const userId = deleteTarget.user_id || deleteTarget.id;
            const accountType = deleteTarget.account_type;

            const res = await secureFetch('/api/admin/report-actions/delete-account', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    account_type: accountType,
                    entity_id: accountType !== 'personal' ? deleteTarget.id : undefined,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.message || 'Failed to delete account.');

            setToast({ open: true, severity: 'success', message: `${accountLabel(accountType)} "${deleteTarget.name}" deleted successfully.` });
            setDeleteTarget(null);
            fetchMembers();
        } catch (err) {
            setToast({ open: true, severity: 'error', message: err?.message || 'Delete failed.' });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
            <Stack spacing={2.5}>
                <Box>
                    <Typography variant="h5" fontWeight={900} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>Members</Typography>
                    <Typography color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>All accounts on the platform. Search, filter by type, view profiles, and manage accounts.</Typography>
                </Box>

                {/* Filters */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Account Type</InputLabel>
                        <Select
                            value={typeFilter}
                            label="Account Type"
                            onChange={(e) => setTypeFilter(e.target.value)}
                            sx={{ borderRadius: 2.5 }}
                        >
                            <MenuItem value="">All Accounts</MenuItem>
                            <MenuItem value="personal">
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <PersonRoundedIcon sx={{ fontSize: 18 }} />
                                    <span>Users</span>
                                </Stack>
                            </MenuItem>
                            <MenuItem value="business">
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <StorefrontOutlinedIcon sx={{ fontSize: 18 }} />
                                    <span>Businesses</span>
                                </Stack>
                            </MenuItem>
                            <MenuItem value="artist">
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <MusicNoteOutlinedIcon sx={{ fontSize: 18 }} />
                                    <span>Artists</span>
                                </Stack>
                            </MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        size="small"
                        placeholder="Search by name, handle, or email..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                        sx={{ minWidth: 260, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 20, color: 'text.disabled' }} /></InputAdornment>,
                            endAdornment: searchInput ? <InputAdornment position="end"><IconButton size="small" onClick={handleClearSearch}><ClearIcon sx={{ fontSize: 18 }} /></IconButton></InputAdornment> : null,
                        }}
                    />
                    <Button variant="contained" size="small" onClick={handleSearch} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3, height: 38 }}>
                        Search
                    </Button>
                </Stack>

                {/* Table / Cards */}
                <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    {loading ? (
                        <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
                    ) : (
                        <>
                            {/* ── Mobile card layout ── */}
                            {isMobile ? (
                                <Box>
                                    {/* Sort controls */}
                                    <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={700}>Sort:</Typography>
                                        <Chip
                                            size="small"
                                            label={`Last seen ${sortBy === 'last_seen' ? (sortDir === 'desc' ? '↓' : '↑') : ''}`}
                                            onClick={() => handleSort('last_seen')}
                                            variant={sortBy === 'last_seen' ? 'filled' : 'outlined'}
                                            color={sortBy === 'last_seen' ? 'primary' : 'default'}
                                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                                        />
                                        <Chip
                                            size="small"
                                            label={`Offenses ${sortBy === 'offenses' ? (sortDir === 'desc' ? '↓' : '↑') : ''}`}
                                            onClick={() => handleSort('offenses')}
                                            variant={sortBy === 'offenses' ? 'filled' : 'outlined'}
                                            color={sortBy === 'offenses' ? 'primary' : 'default'}
                                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                                        />
                                        <Chip
                                            size="small"
                                            label={`Joined ${sortBy === 'created_at' ? (sortDir === 'desc' ? '↓' : '↑') : ''}`}
                                            onClick={() => handleSort('created_at')}
                                            variant={sortBy === 'created_at' ? 'filled' : 'outlined'}
                                            color={sortBy === 'created_at' ? 'primary' : 'default'}
                                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                                        />
                                    </Box>
                                    {members.length === 0 ? (
                                        <Box sx={{ py: 6, textAlign: 'center' }}>
                                            <Typography fontWeight={700}>{search ? `No results for "${search}"` : 'No members found.'}</Typography>
                                        </Box>
                                    ) : (
                                        members.map((m) => {
                                            const uniqueKey = `${m.account_type}:${m.id}`;
                                            return (
                                                <Box
                                                    key={uniqueKey}
                                                    sx={(t) => ({
                                                        px: 2, py: 1.5,
                                                        borderBottom: '1px solid',
                                                        borderColor: alpha(t.palette.divider, 0.5),
                                                        display: 'flex',
                                                        gap: 1.5,
                                                        alignItems: 'flex-start',
                                                    })}
                                                >
                                                    <Avatar
                                                        src={m.avatar_url || undefined}
                                                        sx={{ width: 40, height: 40, bgcolor: (t) => m.avatar_url ? 'transparent' : alpha(t.palette.primary.main, 0.1), color: 'primary.main', flexShrink: 0 }}
                                                    >
                                                        {!m.avatar_url && accountIcon(m.account_type)}
                                                    </Avatar>
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                            <Typography fontWeight={700} sx={{ fontSize: '0.875rem' }} noWrap>{m.name}</Typography>
                                                            {m.is_admin && <Tooltip title="Admin"><AdminPanelSettingsIcon sx={{ fontSize: 15, color: 'primary.main' }} /></Tooltip>}
                                                        </Stack>
                                                        {m.handle && <Typography variant="caption" color="text.secondary" component="div">@{m.handle}</Typography>}

                                                        <Stack direction="row" spacing={1} sx={{ mt: 0.75, flexWrap: 'wrap', gap: 0.5 }}>
                                                            <Chip size="small" icon={accountIcon(m.account_type)} label={accountLabel(m.account_type)} sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22 }} />
                                                            {m.offense_count > 0 && (
                                                                <Chip size="small" icon={<WarningAmberRoundedIcon sx={{ fontSize: 14 }} />} label={m.offense_count} color="warning" sx={{ fontWeight: 800, fontSize: '0.75rem', height: 22 }} />
                                                            )}
                                                            {(() => {
                                                                const ls = lastSeenAgo(m.last_seen_at);
                                                                if (ls.never) return null;
                                                                if (ls.online) {
                                                                    return (
                                                                        <Chip
                                                                            size="small"
                                                                            label="Online"
                                                                            sx={(t) => ({
                                                                                fontWeight: 800,
                                                                                fontSize: '0.7rem',
                                                                                height: 22,
                                                                                bgcolor: alpha(t.palette.success.main, 0.15),
                                                                                color: t.palette.success.dark,
                                                                                border: '1px solid',
                                                                                borderColor: alpha(t.palette.success.main, 0.3),
                                                                            })}
                                                                        />
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                        </Stack>
                                                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                                                            {[m.city, m.county].filter(Boolean).join(', ') || ''}
                                                            {m.created_at ? `${[m.city, m.county].filter(Boolean).length ? ' · ' : ''}Joined ${formatDate(m.created_at)}` : ''}
                                                            {(() => {
                                                                const ls = lastSeenAgo(m.last_seen_at);
                                                                if (ls.never || ls.online) return '';
                                                                return ` · Last seen ${ls.label}`;
                                                            })()}
                                                        </Typography>

                                                        <Stack direction="row" spacing={0.5} sx={{ mt: 0.75 }}>
                                                            <IconButton size="small" href={m.profile_path} target="_blank" rel="noreferrer" title="View profile"><OpenInNewIcon fontSize="small" /></IconButton>
                                                            <IconButton size="small" color="error" onClick={() => setDeleteTarget(m)} title="Delete account" disabled={m.is_admin}><DeleteIcon fontSize="small" /></IconButton>
                                                        </Stack>
                                                    </Box>
                                                </Box>
                                            );
                                        })
                                    )}
                                </Box>
                            ) : (
                                /* ── Desktop table layout ── */
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ width: '26%' }}>Account</TableCell>
                                                <TableCell sx={{ width: '10%' }}>Type</TableCell>
                                                <TableCell sx={{ width: '15%' }}>Location</TableCell>
                                                <TableCell sx={{ width: '9%' }} align="center" sortDirection={sortBy === 'offenses' ? sortDir : false}>
                                                    <TableSortLabel
                                                        active={sortBy === 'offenses'}
                                                        direction={sortBy === 'offenses' ? sortDir : 'desc'}
                                                        onClick={() => handleSort('offenses')}
                                                    >
                                                        Offenses
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ width: '13%' }} sortDirection={sortBy === 'last_seen' ? sortDir : false}>
                                                    <TableSortLabel
                                                        active={sortBy === 'last_seen'}
                                                        direction={sortBy === 'last_seen' ? sortDir : 'desc'}
                                                        onClick={() => handleSort('last_seen')}
                                                    >
                                                        Last seen
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ width: '13%' }} sortDirection={sortBy === 'created_at' ? sortDir : false}>
                                                    <TableSortLabel
                                                        active={sortBy === 'created_at'}
                                                        direction={sortBy === 'created_at' ? sortDir : 'desc'}
                                                        onClick={() => handleSort('created_at')}
                                                    >
                                                        Joined
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell align="right" sx={{ width: '14%' }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {members.map((m) => {
                                                const uniqueKey = `${m.account_type}:${m.id}`;
                                                return (
                                                    <TableRow key={uniqueKey} hover>
                                                        <TableCell>
                                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                                <Avatar
                                                                    src={m.avatar_url || undefined}
                                                                    sx={{ width: 36, height: 36, bgcolor: (t) => m.avatar_url ? 'transparent' : alpha(t.palette.primary.main, 0.1), color: 'primary.main' }}
                                                                >
                                                                    {!m.avatar_url && accountIcon(m.account_type)}
                                                                </Avatar>
                                                                <Box sx={{ minWidth: 0 }}>
                                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                                        <Tooltip title={m.name} placement="top-start" enterDelay={400}>
                                                                            <Typography fontWeight={700} sx={{ ...truncSx, maxWidth: 180 }}>{m.name}</Typography>
                                                                        </Tooltip>
                                                                        {m.is_admin && <Tooltip title="Admin"><AdminPanelSettingsIcon sx={{ fontSize: 15, color: 'primary.main' }} /></Tooltip>}
                                                                    </Stack>
                                                                    {m.handle && <Typography variant="caption" color="text.secondary" sx={truncSx} component="div">@{m.handle}</Typography>}
                                                                    {m.email && <Typography variant="caption" color="text.disabled" sx={{ ...truncSx, fontSize: '0.65rem' }} component="div">{m.email}</Typography>}
                                                                </Box>
                                                            </Stack>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip size="small" icon={accountIcon(m.account_type)} label={accountLabel(m.account_type)} sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" sx={truncSx}>{[m.city, m.county].filter(Boolean).join(', ') || '—'}</Typography>
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            {m.offense_count > 0 ? (
                                                                <Chip size="small" icon={<WarningAmberRoundedIcon sx={{ fontSize: 14 }} />} label={m.offense_count} color="warning" sx={{ fontWeight: 800, fontSize: '0.8rem' }} />
                                                            ) : (
                                                                <Typography variant="body2" color="text.disabled">0</Typography>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {(() => {
                                                                const ls = lastSeenAgo(m.last_seen_at);
                                                                if (ls.never) {
                                                                    return <Typography variant="body2" color="text.disabled">—</Typography>;
                                                                }
                                                                if (ls.online) {
                                                                    return (
                                                                        <Stack direction="row" spacing={0.75} alignItems="center">
                                                                            <Box
                                                                                sx={(t) => ({
                                                                                    width: 8,
                                                                                    height: 8,
                                                                                    borderRadius: '50%',
                                                                                    bgcolor: t.palette.success.main,
                                                                                    boxShadow: `0 0 0 3px ${alpha(t.palette.success.main, 0.2)}`,
                                                                                })}
                                                                            />
                                                                            <Typography variant="body2" sx={(t) => ({ color: t.palette.success.dark, fontWeight: 700 })}>
                                                                                Online
                                                                            </Typography>
                                                                        </Stack>
                                                                    );
                                                                }
                                                                return (
                                                                    <Tooltip title={m.last_seen_at ? new Date(parseDate(m.last_seen_at)).toLocaleString() : ''} placement="top" enterDelay={400}>
                                                                        <Typography variant="body2" color="text.secondary">{ls.label}</Typography>
                                                                    </Tooltip>
                                                                );
                                                            })()}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" color="text.secondary">{formatDate(m.created_at)}</Typography>
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                                <IconButton size="small" href={m.profile_path} target="_blank" rel="noreferrer" title="View profile"><OpenInNewIcon fontSize="small" /></IconButton>
                                                                <IconButton size="small" color="error" onClick={() => setDeleteTarget(m)} title="Delete account" disabled={m.is_admin}><DeleteIcon fontSize="small" /></IconButton>
                                                            </Stack>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                            {members.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={7}>
                                                        <Box sx={{ py: 6, textAlign: 'center' }}>
                                                            <Typography fontWeight={700}>{search ? `No results for "${search}"` : 'No members found.'}</Typography>
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

            {/* ─── Delete confirm ─── */}
            <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)}>
                <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
                    Delete {deleteTarget ? accountLabel(deleteTarget.account_type) : ''}?
                    <IconButton onClick={() => setDeleteTarget(null)} disabled={deleting} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to permanently delete <strong>{deleteTarget?.name}</strong>
                        {deleteTarget?.handle ? ` (@${deleteTarget.handle})` : ''}?
                    </Typography>
                    {deleteTarget?.account_type === 'personal' && (
                        <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2 }}>
                            This will permanently remove the user and all their content including posts, comments, messages, businesses, and artist profiles. This cannot be undone.
                        </Alert>
                    )}
                    {deleteTarget?.account_type === 'business' && (
                        <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 2 }}>
                            This will delete the business page and all related content (posts, listings, reviews, events). The owner's personal account will not be affected.
                        </Alert>
                    )}
                    {deleteTarget?.account_type === 'artist' && (
                        <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 2 }}>
                            This will delete the artist profile and all related content (posts, music, events). The owner's personal account will not be affected.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteTarget(null)} disabled={deleting} sx={{ textTransform: 'none', fontWeight: 700 }}>Cancel</Button>
                    <Button
                        variant="contained" color="error" onClick={handleDelete} disabled={deleting}
                        startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
                        sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2 }}
                    >
                        {deleting ? 'Deleting...' : 'Delete Permanently'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ─── Toast ─── */}
            <Snackbar open={toast.open} autoHideDuration={3500} onClose={() => setToast((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={toast.severity} onClose={() => setToast((p) => ({ ...p, open: false }))}>{toast.message}</Alert>
            </Snackbar>
        </Box>
    );
}

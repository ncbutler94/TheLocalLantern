// src/pages/admin/AdminAnalyticsTab.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { secureFetch } from '../../utils/secureFetch';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    MenuItem,
    Paper,
    Snackbar,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import MusicNoteOutlinedIcon from '@mui/icons-material/MusicNoteOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import RepeatRoundedIcon from '@mui/icons-material/RepeatRounded';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import CameraRoundedIcon from '@mui/icons-material/CameraRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';

import {
    AreaChart, Area, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';

/* ─── Constants ─── */
const PIE_COLORS = ['#2563eb', '#16a34a', '#ea580c', '#8b5cf6', '#e11d48', '#0891b2', '#ca8a04', '#64748b'];

const PERIOD_OPTIONS = [
    { value: '30', label: 'Last 30 days' },
    { value: '60', label: 'Last 60 days' },
    { value: '90', label: 'Last 90 days' },
    { value: '180', label: 'Last 6 months' },
    { value: '365', label: 'Last year' },
];

/* ─── Helpers ─── */
function fmtNum(n) {
    if (n === null || n === undefined) return '—';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

function fmtCategoryLabel(cat) {
    if (!cat) return 'Other';
    return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function percentChange(current, previous) {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
}

function fmtSnapshotDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/* ─── Stat Card ─── */
function StatCard({ icon: Icon, label, value, sub, trend, trendLabel, color = 'primary.main', small }) {
    const isUp = trend > 0;
    const isDown = trend < 0;
    return (
        <Paper
            variant="outlined"
            sx={(t) => ({
                p: small ? 1.5 : 2,
                borderRadius: 3,
                borderColor: alpha(t.palette.divider, 0.6),
                flex: 1,
                minWidth: small ? 130 : 155,
            })}
        >
            <Stack direction="row" spacing={1} alignItems="flex-start">
                {Icon && (
                    <Box sx={(t) => ({
                        width: small ? 32 : 36,
                        height: small ? 32 : 36,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(t.palette.primary.main, 0.08),
                        flexShrink: 0,
                    })}>
                        <Icon sx={{ fontSize: small ? 16 : 18, color }} />
                    </Box>
                )}
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontSize: small ? 11 : 12, fontWeight: 700, color: 'text.secondary', lineHeight: 1.2, mb: 0.25 }}>
                        {label}
                    </Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: small ? 20 : 24, lineHeight: 1.1, letterSpacing: -0.5 }}>
                        {fmtNum(value)}
                    </Typography>
                    {(sub || trend !== undefined) && (
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                            {trend !== undefined && trend !== 0 && (
                                <Chip
                                    size="small"
                                    icon={isUp ? <TrendingUpRoundedIcon sx={{ fontSize: 12 }} /> : <TrendingDownRoundedIcon sx={{ fontSize: 12 }} />}
                                    label={`${isUp ? '+' : ''}${trend}%`}
                                    color={isUp ? 'success' : 'error'}
                                    variant="outlined"
                                    sx={{ fontWeight: 800, fontSize: 10, height: 20, '& .MuiChip-icon': { ml: 0.25 } }}
                                />
                            )}
                            {sub && (
                                <Typography sx={{ fontSize: 11, color: 'text.disabled', fontWeight: 600 }}>
                                    {sub}
                                </Typography>
                            )}
                        </Stack>
                    )}
                </Box>
            </Stack>
        </Paper>
    );
}

/* ─── Section Header ─── */
function SectionHeader({ icon: Icon, title, children }) {
    return (
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
                {Icon && <Icon sx={{ fontSize: 18, color: 'primary.main' }} />}
                <Typography sx={{ fontWeight: 900, fontSize: 15 }}>{title}</Typography>
            </Stack>
            {children}
        </Stack>
    );
}

/* ─── Chart wrapper ─── */
function ChartCard({ children, title, height = 260, sx }) {
    return (
        <Paper variant="outlined" sx={(t) => ({ p: 2, borderRadius: 3, borderColor: alpha(t.palette.divider, 0.6), ...sx })}>
            {title && <Typography sx={{ fontWeight: 800, fontSize: 13, mb: 1.5, color: 'text.secondary' }}>{title}</Typography>}
            <ResponsiveContainer width="100%" height={height}>
                {children}
            </ResponsiveContainer>
        </Paper>
    );
}

/* ═══════════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════════ */
export default function AdminAnalyticsTab() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [live, setLive] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [historyDays, setHistoryDays] = useState('30');
    const [snapshotting, setSnapshotting] = useState(false);
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    const fetchLive = useCallback(async () => {
        try {
            const res = await secureFetch('/api/admin/analytics/live', { credentials: 'include' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.message || 'Failed to load analytics');
            setLive(data);
        } catch (err) {
            setError(err?.message || 'Failed to load analytics');
        }
    }, []);

    const fetchHistory = useCallback(async () => {
        try {
            const res = await secureFetch(`/api/admin/analytics/history?days=${historyDays}`, { credentials: 'include' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.message || 'Failed to load history');
            setHistory(Array.isArray(data?.snapshots) ? data.snapshots : []);
        } catch {
            setHistory([]);
        }
    }, [historyDays]);

    const loadAll = useCallback(async () => {
        setLoading(true);
        setError('');
        await Promise.all([fetchLive(), fetchHistory()]);
        setLoading(false);
    }, [fetchLive, fetchHistory]);

    useEffect(() => { loadAll(); }, [loadAll]);

    const handleSnapshot = async () => {
        setSnapshotting(true);
        try {
            const res = await secureFetch('/api/admin/analytics/snapshot', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.message || 'Snapshot failed');
            setToast({ open: true, severity: 'success', message: `Snapshot saved for ${data.snapshot_date}` });
            fetchHistory();
        } catch (err) {
            setToast({ open: true, severity: 'error', message: err?.message || 'Snapshot failed' });
        } finally {
            setSnapshotting(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error && !live) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    const u = live?.users || {};
    const c = live?.content || {};
    const e = live?.engagement || {};
    const v = live?.visitors || {};
    const userGrowth = percentChange(u.thisMonth, u.prevMonth);

    // Prepare history chart data
    const historyData = history.map((s) => ({
        date: fmtSnapshotDate(s.snapshot_date),
        users: s.total_users,
        newUsers: s.new_users,
        posts: s.new_community_posts + (s.new_business_posts || 0) + (s.new_artist_posts || 0),
        likes: s.new_likes,
        comments: s.new_comments,
        reposts: s.new_reposts,
        visitors: s.unique_visitors || 0,
        pageViews: s.page_views || 0,
    }));

    // Likes by category for pie chart
    const pieData = (e.likesByCategory || []).map((r, i) => ({
        name: fmtCategoryLabel(r.category),
        value: Number(r.count || 0),
    }));

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
            <Stack spacing={3}>
                {/* ── Header ── */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} justifyContent="space-between">
                    <Box>
                        <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>Analytics</Typography>
                        <Typography color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                            Platform metrics at a glance. Take a snapshot to track trends over time.
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<RefreshRoundedIcon />}
                            onClick={loadAll}
                            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}
                        >
                            Refresh
                        </Button>
                        <Tooltip title="Save today's stats to the history chart" arrow>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={snapshotting ? <CircularProgress size={14} color="inherit" /> : <CameraRoundedIcon />}
                                onClick={handleSnapshot}
                                disabled={snapshotting}
                                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}
                            >
                                {snapshotting ? 'Saving…' : 'Snapshot'}
                            </Button>
                        </Tooltip>
                    </Stack>
                </Stack>

                {/* ═══ VISITORS ═══ */}
                <Box>
                    <SectionHeader icon={VisibilityOutlinedIcon} title="Visitors" />
                    <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1.5 }}>
                        <StatCard icon={VisibilityOutlinedIcon} label="Page Views Today" value={v.today} sub={`${fmtNum(v.uniqueToday)} unique`} small={isMobile} />
                        <StatCard icon={VisibilityOutlinedIcon} label="This Week" value={v.week} sub={`${fmtNum(v.uniqueWeek)} unique`} small={isMobile} />
                        <StatCard icon={VisibilityOutlinedIcon} label="This Month" value={v.month} sub={`${fmtNum(v.uniqueMonth)} unique`} small={isMobile} />
                    </Stack>
                </Box>

                {/* ═══ USER GROWTH ═══ */}
                <Box>
                    <SectionHeader icon={PeopleOutlinedIcon} title="Users & Accounts" />
                    <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1.5 }}>
                        <StatCard icon={PeopleOutlinedIcon} label="Total Users" value={u.total} sub={`+${fmtNum(u.thisMonth)} this month`} trend={userGrowth} small={isMobile} />
                        <StatCard icon={PersonAddOutlinedIcon} label="New Today" value={u.today} sub={`${fmtNum(u.thisWeek)} this week`} small={isMobile} />
                        <StatCard icon={StorefrontOutlinedIcon} label="Businesses" value={live?.businesses?.total} sub={`+${fmtNum(live?.businesses?.thisMonth)} this month`} color="success.main" small={isMobile} />
                        <StatCard icon={MusicNoteOutlinedIcon} label="Artists" value={live?.artists?.total} sub={`+${fmtNum(live?.artists?.thisMonth)} this month`} color="secondary.main" small={isMobile} />
                    </Stack>
                </Box>

                {/* ═══ CONTENT ═══ */}
                <Box>
                    <SectionHeader icon={ArticleOutlinedIcon} title="Content" />
                    <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1.5 }}>
                        <StatCard icon={ArticleOutlinedIcon} label="Community Posts" value={c.communityPosts?.total} sub={`+${fmtNum(c.communityPosts?.thisMonth)} this month`} small={isMobile} />
                        <StatCard icon={StorefrontOutlinedIcon} label="Business Posts" value={c.businessPosts?.total} sub={`+${fmtNum(c.businessPosts?.thisMonth)} this month`} color="success.main" small={isMobile} />
                        <StatCard icon={MusicNoteOutlinedIcon} label="Artist Posts" value={c.artistPosts?.total} sub={`+${fmtNum(c.artistPosts?.thisMonth)} this month`} color="secondary.main" small={isMobile} />
                        <StatCard icon={EventOutlinedIcon} label="Events" value={c.events?.total} sub={`+${fmtNum(c.events?.thisMonth)} this month`} color="warning.main" small={isMobile} />
                        <StatCard icon={WorkOutlineRoundedIcon} label="Jobs" value={c.jobs?.total} sub={`+${fmtNum(c.jobs?.thisMonth)} this month`} color="info.main" small={isMobile} />
                        <StatCard icon={ShoppingBagOutlinedIcon} label="Listings" value={c.listings?.total} sub={`+${fmtNum(c.listings?.thisMonth)} this month`} small={isMobile} />
                        <StatCard icon={BuildOutlinedIcon} label="Services" value={c.services?.total} sub={`+${fmtNum(c.services?.thisMonth)} this month`} small={isMobile} />
                        <StatCard icon={GroupsOutlinedIcon} label="Groups" value={c.groups?.total} small={isMobile} />
                    </Stack>
                </Box>

                {/* ═══ ENGAGEMENT ═══ */}
                <Box>
                    <SectionHeader icon={FavoriteRoundedIcon} title="Engagement" />
                    <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
                        <StatCard icon={FavoriteRoundedIcon} label="Likes" value={e.likes?.total} sub={`+${fmtNum(e.likes?.thisMonth)} this month · ${fmtNum(e.likes?.today)} today`} color="error.main" small={isMobile} />
                        <StatCard icon={ChatBubbleOutlineRoundedIcon} label="Comments" value={e.comments?.total} sub={`+${fmtNum(e.comments?.thisMonth)} this month · ${fmtNum(e.comments?.today)} today`} color="info.main" small={isMobile} />
                        <StatCard icon={RepeatRoundedIcon} label="Reposts" value={e.reposts?.total} sub={`+${fmtNum(e.reposts?.thisMonth)} this month · ${fmtNum(e.reposts?.today)} today`} color="success.main" small={isMobile} />
                    </Stack>

                    {/* Likes by category pie chart */}
                    {pieData.length > 0 && (
                        <ChartCard title="Likes by Category" height={220} sx={{ maxWidth: { xs: '100%', md: 420 } }}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={3}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {pieData.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip formatter={(v) => fmtNum(v)} />
                            </PieChart>
                        </ChartCard>
                    )}
                </Box>

                {/* ═══ HISTORICAL TRENDS ═══ */}
                {history.length > 0 && (
                    <Box>
                        <SectionHeader icon={TrendingUpRoundedIcon} title="Trends Over Time">
                            <TextField
                                select
                                size="small"
                                value={historyDays}
                                onChange={(e) => setHistoryDays(e.target.value)}
                                sx={{ minWidth: 140, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                            >
                                {PERIOD_OPTIONS.map((o) => (
                                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                                ))}
                            </TextField>
                        </SectionHeader>

                        <Stack spacing={2}>
                            {/* User Growth */}
                            <ChartCard title="Total Users">
                                <AreaChart data={historyData}>
                                    <defs>
                                        <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(theme.palette.divider, 0.4)} />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} width={45} />
                                    <RechartsTooltip />
                                    <Area type="monotone" dataKey="users" stroke="#2563eb" fill="url(#gradUsers)" strokeWidth={2} />
                                </AreaChart>
                            </ChartCard>

                            {/* New Users per Day */}
                            <ChartCard title="New Users per Day">
                                <BarChart data={historyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(theme.palette.divider, 0.4)} />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} width={35} />
                                    <RechartsTooltip />
                                    <Bar dataKey="newUsers" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={24} />
                                </BarChart>
                            </ChartCard>

                            {/* Daily Engagement */}
                            <ChartCard title="Daily Engagement">
                                <LineChart data={historyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(theme.palette.divider, 0.4)} />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} width={35} />
                                    <RechartsTooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="likes" stroke="#e11d48" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="comments" stroke="#2563eb" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="reposts" stroke="#16a34a" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ChartCard>

                            {/* New Posts per Day */}
                            <ChartCard title="New Posts per Day (All Types)">
                                <BarChart data={historyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(theme.palette.divider, 0.4)} />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} width={35} />
                                    <RechartsTooltip />
                                    <Bar dataKey="posts" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={24} />
                                </BarChart>
                            </ChartCard>

                            {/* Visitors (only if data exists) */}
                            {historyData.some((d) => d.visitors > 0 || d.pageViews > 0) && (
                                <ChartCard title="Daily Visitors">
                                    <AreaChart data={historyData}>
                                        <defs>
                                            <linearGradient id="gradVisitors" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0891b2" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(theme.palette.divider, 0.4)} />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} width={45} />
                                        <RechartsTooltip />
                                        <Legend />
                                        <Area type="monotone" dataKey="pageViews" stroke="#64748b" fill="none" strokeWidth={1.5} name="Page Views" />
                                        <Area type="monotone" dataKey="visitors" stroke="#0891b2" fill="url(#gradVisitors)" strokeWidth={2} name="Unique Visitors" />
                                    </AreaChart>
                                </ChartCard>
                            )}
                        </Stack>
                    </Box>
                )}

                {history.length === 0 && (
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
                        <CameraRoundedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                        <Typography sx={{ fontWeight: 800, color: 'text.secondary', mb: 0.5 }}>No historical data yet</Typography>
                        <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
                            Click "Snapshot" above to save today's stats. Do this daily (or set up a cron job) to build trend charts.
                        </Typography>
                    </Paper>
                )}

                {/* ═══ TOP PAGES ═══ */}
                {live?.topPages?.length > 0 && (
                    <Box>
                        <SectionHeader icon={LanguageRoundedIcon} title="Top Pages (Last 7 Days)" />
                        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                            {live.topPages.map((p, i) => (
                                <Box
                                    key={p.path}
                                    sx={(t) => ({
                                        px: 2, py: 1.25,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        borderBottom: i < live.topPages.length - 1 ? '1px solid' : 'none',
                                        borderColor: alpha(t.palette.divider, 0.5),
                                        bgcolor: i % 2 === 0 ? alpha(t.palette.common.black, 0.015) : 'transparent',
                                    })}
                                >
                                    <Typography sx={{ fontWeight: 800, fontSize: 13, color: 'text.disabled', width: 28, textAlign: 'right', flexShrink: 0 }}>
                                        {i + 1}.
                                    </Typography>
                                    <Typography sx={{ fontWeight: 700, fontSize: 13, flex: 1, minWidth: 0 }} noWrap>
                                        {p.path}
                                    </Typography>
                                    <Chip size="small" label={`${fmtNum(Number(p.views))} views`} sx={{ fontWeight: 700, fontSize: 11 }} />
                                    <Chip size="small" variant="outlined" label={`${fmtNum(Number(p.unique_visitors))} unique`} sx={{ fontWeight: 700, fontSize: 11 }} />
                                </Box>
                            ))}
                        </Paper>
                    </Box>
                )}
            </Stack>

            {/* Toast */}
            <Snackbar open={toast.open} autoHideDuration={3500} onClose={() => setToast((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={toast.severity} onClose={() => setToast((p) => ({ ...p, open: false }))}>{toast.message}</Alert>
            </Snackbar>
        </Box>
    );
}

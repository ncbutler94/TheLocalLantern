// src/pages/admin/AdminConsolePage.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminReportsTab from './AdminReportsTab';
import AdminMembersTab from './AdminMembersTab';
import AdminAuditTab from './AdminAuditTab';
import BusinessApplicationsTab from './BusinessApplicationsTab';
import ArtistApplicationsTab from './ArtistApplicationsTab';
import DiscoverHighlightsAdmin from './DiscoverHighlightsAdmin';
import AdminAnalyticsTab from './AdminAnalyticsTab';
import {
    Alert,
    Box,
    Button,
    ButtonBase,
    CircularProgress,
    Drawer,
    Fade,
    IconButton,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
    useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import MusicNoteOutlinedIcon from '@mui/icons-material/MusicNoteOutlined';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import GavelRoundedIcon from '@mui/icons-material/GavelRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';

import { secureFetch } from '../../utils/secureFetch';
import useChromeTop from '../../hooks/useChromeTop';

/* ─── Constants ─── */

const SIDEBAR_WIDTH = 220;

const NAV_ITEMS = [
    { key: 0, label: 'Businesses', icon: BusinessOutlinedIcon },
    { key: 1, label: 'Artists', icon: MusicNoteOutlinedIcon },
    { key: 2, label: 'Reports', icon: FlagOutlinedIcon },
    { key: 3, label: 'Discover', icon: ExploreOutlinedIcon },
    { key: 4, label: 'Members', icon: PeopleOutlinedIcon },
    { key: 5, label: 'Audit Log', icon: GavelRoundedIcon },
    { key: 6, label: 'Analytics', icon: BarChartRoundedIcon },
];

/* ─── Helpers ─── */

function getIsLocalLanternAdmin(user) {
    if (!user) return false;
    const isAdmin = Number(user.is_local_lantern_admin) === 1 || user.is_local_lantern_admin === true || user.isLocalLanternAdmin === true;
    const isCorrectHandle = String(user.handle || '').toLowerCase().trim() === 'thelocallantern';
    return isAdmin && isCorrectHandle;
}

/* ─── Nav Item ─── */

function NavItem({ item, active, onClick }) {
    const Icon = item.icon;
    return (
        <ButtonBase
            onClick={onClick}
            sx={(t) => ({
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 1.25,
                px: 1.75,
                py: 1,
                borderRadius: 2,
                transition: 'all 140ms ease',
                bgcolor: active
                    ? alpha(t.palette.primary.main, 0.10)
                    : 'transparent',
                color: active
                    ? t.palette.primary.main
                    : t.palette.text.secondary,
                '&:hover': {
                    bgcolor: active
                        ? alpha(t.palette.primary.main, 0.14)
                        : alpha(t.palette.action.hover, 0.6),
                },
            })}
        >
            <Icon sx={{ fontSize: 20, flexShrink: 0 }} />
            <Typography
                sx={{
                    fontWeight: active ? 800 : 650,
                    fontSize: 13.5,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}
            >
                {item.label}
            </Typography>
        </ButtonBase>
    );
}

/* ─── Sidebar Content (shared between permanent and drawer) ─── */

function SidebarContent({ tab, setTab, navigate, onItemClick }) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                py: 1.5,
                px: 1.25,
            }}
        >
            {/* Header / Back */}
            <Box sx={{ px: 0.5, mb: 2.5 }}>
                <Stack direction="row" alignItems="center" spacing={1.25}>
                    <IconButton
                        onClick={() => navigate(-1)}
                        size="small"
                        sx={{ flexShrink: 0 }}
                    >
                        <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 15, lineHeight: 1.2 }} noWrap>
                            Admin Console
                        </Typography>
                        <Typography sx={{ fontWeight: 600, fontSize: 11, color: 'text.disabled', lineHeight: 1.2 }} noWrap>
                            Manage your platform
                        </Typography>
                    </Box>
                </Stack>
            </Box>

            {/* Nav Items */}
            <Stack spacing={0.5} sx={{ flex: 1 }}>
                {NAV_ITEMS.map((item) => (
                    <NavItem
                        key={item.key}
                        item={item}
                        active={tab === item.key}
                        onClick={() => {
                            setTab(item.key);
                            onItemClick?.();
                        }}
                    />
                ))}
            </Stack>

            {/* Footer badge */}
            <Box
                sx={(t) => ({
                    mt: 2,
                    mx: 0.5,
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: alpha(t.palette.primary.main, 0.06),
                    border: '1px solid',
                    borderColor: alpha(t.palette.primary.main, 0.12),
                })}
            >
                <Stack direction="row" spacing={1} alignItems="center">
                    <AdminPanelSettingsOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                    <Typography sx={{ fontWeight: 700, fontSize: 11, color: 'text.secondary' }}>
                        Admin Access
                    </Typography>
                </Stack>
            </Box>
        </Box>
    );
}

/* ─── Admin Password Gate ─── */

function AdminPasswordGate({ onSuccess }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        // Auto-focus the password field
        const t = setTimeout(() => inputRef.current?.focus(), 200);
        return () => clearTimeout(t);
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e?.preventDefault();
        if (!password.trim() || loading) return;

        setLoading(true);
        setError('');

        try {
            const res = await secureFetch('/api/admin/auth/verify', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data?.message || 'Verification failed.');
                setPassword('');
                setLoading(false);
                // Re-focus after error
                setTimeout(() => inputRef.current?.focus(), 100);
                return;
            }

            onSuccess();
        } catch {
            setError('Something went wrong. Please try again.');
            setLoading(false);
        }
    }, [password, loading, onSuccess]);

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: 'grey.50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 2,
            }}
        >
            <Fade in timeout={300}>
                <Paper
                    variant="outlined"
                    sx={{
                        p: { xs: 3, sm: 4 },
                        borderRadius: 3,
                        maxWidth: 400,
                        width: '100%',
                        textAlign: 'center',
                    }}
                >
                    <Box
                        sx={(t) => ({
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            bgcolor: alpha(t.palette.warning.main, 0.10),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 2.5,
                        })}
                    >
                        <LockOutlinedIcon sx={{ fontSize: 28, color: 'warning.dark' }} />
                    </Box>

                    <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 0.5 }}>
                        Admin Console
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary', mb: 3 }}>
                        Enter your admin password to continue
                    </Typography>

                    {error && (
                        <Alert
                            severity="error"
                            sx={{ borderRadius: 2, fontWeight: 700, mb: 2, textAlign: 'left' }}
                            onClose={() => setError('')}
                        >
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <TextField
                            inputRef={inputRef}
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Admin password"
                            fullWidth
                            autoComplete="off"
                            disabled={loading}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword((p) => !p)}
                                            edge="end"
                                            size="small"
                                            tabIndex={-1}
                                        >
                                            {showPassword
                                                ? <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} />
                                                : <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                                            }
                                        </IconButton>
                                    </InputAdornment>
                                ),
                                sx: { borderRadius: 2, fontWeight: 700 },
                            }}
                            sx={{ mb: 2 }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disableElevation
                            disabled={!password.trim() || loading}
                            sx={{
                                borderRadius: 999,
                                textTransform: 'none',
                                fontWeight: 900,
                                py: 1.25,
                                fontSize: 14,
                            }}
                        >
                            {loading ? (
                                <CircularProgress size={20} color="inherit" />
                            ) : (
                                'Unlock'
                            )}
                        </Button>
                    </Box>
                </Paper>
            </Fade>
        </Box>
    );
}

/* ─── Component ─── */

export default function AdminConsolePage({ user }) {
    const navigate = useNavigate();
    const theme = useTheme();
    const isAdmin = useMemo(() => getIsLocalLanternAdmin(user), [user]);
    const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
    const chromeTop = useChromeTop();

    // Admin session state: null = checking, false = not authenticated, true = authenticated
    const [adminAuthed, setAdminAuthed] = useState(null);

    // Check if there's already a valid admin session on mount
    useEffect(() => {
        if (!isAdmin) {
            setAdminAuthed(false);
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                const res = await secureFetch('/api/admin/auth/status', {
                    credentials: 'include',
                });
                const data = await res.json();
                if (!cancelled) {
                    setAdminAuthed(data?.authenticated === true);
                }
            } catch {
                if (!cancelled) {
                    setAdminAuthed(false);
                }
            }
        })();

        return () => { cancelled = true; };
    }, [isAdmin]);

    const [pageVisible, setPageVisible] = useState(false);
    useEffect(() => {
        const raf = requestAnimationFrame(() => setPageVisible(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    const [tab, setTab] = useState(0);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Not a platform admin at all — hard block
    if (!isAdmin) {
        return (
            <Box sx={{ minHeight: { xs: `calc(100vh - ${chromeTop}px)`, md: '100vh' }, pt: { xs: `${chromeTop}px`, md: 0 }, bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, maxWidth: 460, textAlign: 'center' }}>
                    <Alert severity="error" sx={{ borderRadius: 2.5, fontWeight: 800, mb: 2 }}>
                        You don't have access to the Admin Console.
                    </Alert>
                    <Button variant="contained" onClick={() => navigate('/')} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}>
                        Return Home
                    </Button>
                </Paper>
            </Box>
        );
    }

    // Still checking admin session status
    if (adminAuthed === null) {
        return (
            <Box sx={{ minHeight: { xs: `calc(100vh - ${chromeTop}px)`, md: '100vh' }, pt: { xs: `${chromeTop}px`, md: 0 }, bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={32} />
            </Box>
        );
    }

    // Admin user but hasn't entered the admin password yet
    if (!adminAuthed) {
        return <AdminPasswordGate onSuccess={() => setAdminAuthed(true)} />;
    }

    const activeLabel = NAV_ITEMS.find((n) => n.key === tab)?.label || 'Admin';

    return (
        <Fade in={pageVisible} timeout={220} appear>
            <Box sx={{ display: 'flex', minHeight: { xs: `calc(100vh - ${chromeTop}px)`, md: '100vh' }, pt: { xs: `${chromeTop}px`, md: 0 }, bgcolor: 'grey.50' }}>

                {/* ═══ SIDEBAR — Desktop (md+): sticky, sits below site header ═══ */}
                {isMdUp && (
                    <Box
                        component="nav"
                        sx={(t) => ({
                            width: SIDEBAR_WIDTH,
                            flexShrink: 0,
                            position: 'sticky',
                            top: 0,
                            alignSelf: 'flex-start',
                            height: '100vh',
                            bgcolor: 'background.paper',
                            borderRight: '1px solid',
                            borderColor: alpha(t.palette.divider, 0.7),
                            overflowY: 'auto',
                            zIndex: 10,
                        })}
                    >
                        <SidebarContent
                            tab={tab}
                            setTab={setTab}
                            navigate={navigate}
                        />
                    </Box>
                )}

                {/* ═══ SIDEBAR — Mobile (<md): drawer ═══ */}
                {!isMdUp && (
                    <Drawer
                        open={mobileOpen}
                        onClose={() => setMobileOpen(false)}
                        ModalProps={{ keepMounted: true }}
                        PaperProps={{
                            sx: {
                                width: SIDEBAR_WIDTH,
                                bgcolor: 'background.paper',
                            },
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 1, pt: 1 }}>
                            <IconButton onClick={() => setMobileOpen(false)} size="small">
                                <CloseRoundedIcon />
                            </IconButton>
                        </Box>
                        <SidebarContent
                            tab={tab}
                            setTab={setTab}
                            navigate={navigate}
                            onItemClick={() => setMobileOpen(false)}
                        />
                    </Drawer>
                )}

                {/* ═══ MAIN CONTENT ═══ */}
                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        minWidth: 0,
                    }}
                >
                    {/* Mobile top bar */}
                    {!isMdUp && (
                        <Box
                            sx={{
                                bgcolor: 'background.paper',
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                position: 'sticky',
                                top: 0,
                                zIndex: 1100,
                                px: 2,
                                py: 1.25,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                            }}
                        >
                            <IconButton onClick={() => setMobileOpen(true)} size="small">
                                <MenuRoundedIcon />
                            </IconButton>
                            <AdminPanelSettingsOutlinedIcon sx={{ fontSize: 22, color: 'primary.main' }} />
                            <Typography sx={{ fontWeight: 900, fontSize: 15 }}>
                                {activeLabel}
                            </Typography>
                        </Box>
                    )}

                    {/* Page content */}
                    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 }, maxWidth: 1600 }}>
                        {tab === 0 && <BusinessApplicationsTab />}
                        {tab === 1 && <ArtistApplicationsTab />}
                        {tab === 2 && <AdminReportsTab />}
                        {tab === 3 && <DiscoverHighlightsAdmin />}
                        {tab === 4 && <AdminMembersTab />}
                        {tab === 5 && <AdminAuditTab />}
                        {tab === 6 && <AdminAnalyticsTab />}
                    </Box>
                </Box>
            </Box>
        </Fade>
    );
}

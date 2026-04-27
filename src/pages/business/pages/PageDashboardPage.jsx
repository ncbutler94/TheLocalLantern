// src/pages/business/pages/PageDashboardPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    Chip,
    Fade,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';

import { useAuth } from '../../../components/AuthModalContext';
import { secureFetch } from '../../../utils/secureFetch';

/**
 * PageDashboardPage
 * -----------------
 * Route:
 *   /pages/:pageId
 *
 * Gates access via GET /api/pages/:pageId/me (membership helper).
 * - If not logged in: redirects to /login
 * - If not a member: shows a friendly error
 * - If a member: shows role + dashboard actions
 */
export default function PageDashboardPage() {
    const navigate = useNavigate();
    const { pageId } = useParams();
    const auth = useAuth();

    const viewer = auth?.user || null;
    const isAuthed = auth?.status === 'authenticated' && !!viewer;

    const pid = useMemo(() => {
        const n = Number(pageId);
        return Number.isFinite(n) && n > 0 ? n : null;
    }, [pageId]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [membership, setMembership] = useState(null);

    // Subtle mount fade (matches Community page feel)
    const [pageVisible, setPageVisible] = useState(false);
    useEffect(() => {
        const raf = requestAnimationFrame(() => setPageVisible(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    const role = String(membership?.role || '').toLowerCase();
    const canManageTeam = role === 'owner' || role === 'admin';

    useEffect(() => {
        if (!pid) {
            setLoading(false);
            setError('Invalid page id.');
            return;
        }

        if (!isAuthed) {
            // Preserve return URL and prompt login.
            const from = `${window.location.pathname}${window.location.search}`;
            try {
                sessionStorage.setItem('ll:returnTo', JSON.stringify({ path: from, scrollY: 0, ts: Date.now() }));
            } catch {
                // ignore
            }
            navigate(`/login?redirect=${encodeURIComponent(from)}`);
            return;
        }

        let alive = true;
        setLoading(true);
        setError('');
        setMembership(null);

        (async () => {
            try {
                const res = await secureFetch(`/api/pages/${encodeURIComponent(String(pid))}/me`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { Accept: 'application/json' },
                    cache: 'no-store',
                });

                const data = await res.json().catch(() => null);

                if (!res.ok) {
                    const msg =
                        (data && typeof data === 'object' && typeof data.message === 'string' && data.message) ||
                        `Unable to access this page (${res.status}).`;
                    if (!alive) return;
                    setError(msg);
                    setLoading(false);
                    return;
                }

                if (!alive) return;
                setMembership(data?.membership || null);
                setLoading(false);
            } catch (e) {
                if (!alive) return;
                setError(String(e?.message || 'Failed to load page membership.'));
                setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [pid, isAuthed, navigate]);

    const footerText = useMemo(() => {
        const name =
            membership?.page_name ||
            membership?.pageName ||
            membership?.page?.name ||
            membership?.page?.title ||
            '';
        const label = String(name || '').trim();
        return label ? `Dashboard · ${label}` : 'Dashboard';
    }, [membership]);

    const Shell = ({ children }) => (
        <Fade in={pageVisible} timeout={220} appear>
            <Box
                sx={{
                    width: '100%',
                    px: { xs: 1.1, sm: 2 },
                    pt: { xs: 1.1, sm: 2 },
                    pb: { xs: 1.25, sm: 2.5 },
                }}
            >
                <Box
                    sx={{
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: (t) => alpha(t.palette.primary.main, 0.12),
                        bgcolor: (t) => alpha(t.palette.common.white, 0.62),
                        backdropFilter: 'saturate(140%) blur(10px)',
                        backgroundImage: 'none',
                        boxShadow: 'none',
                        minHeight: 220,
                    }}
                >
                    <Box sx={{ p: { xs: 1.25, sm: 1.75 } }}>{children}</Box>

                    <Box
                        sx={(t) => ({
                            mt: 'auto',
                            px: 1.25,
                            py: 0.9,
                            borderTop: '1px solid',
                            borderColor: alpha(t.palette.primary.main, 0.12),
                            bgcolor: alpha(t.palette.background.paper, 0.92),
                            backdropFilter: 'blur(10px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        })}
                    >
                        <Typography variant="body2" sx={{ fontWeight: 850, color: 'text.secondary' }}>
                            {footerText}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Fade>
    );

    if (loading) {
        return (
            <Shell>
                <Alert severity="info" sx={{ borderRadius: 2.5 }}>
                    Loading…
                </Alert>
            </Shell>
        );
    }

    if (error) {
        return (
            <Shell>
                <Button
                    variant="text"
                    startIcon={<ArrowBackRoundedIcon />}
                    onClick={() => navigate(-1)}
                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
                >
                    Back
                </Button>

                <Alert severity="error" sx={{ borderRadius: 2.5, mt: 1.25 }}>
                    {error}
                </Alert>
            </Shell>
        );
    }

    return (
        <Shell>
            <Button
                variant="text"
                startIcon={<ArrowBackRoundedIcon />}
                onClick={() => navigate(-1)}
                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
            >
                Back
            </Button>

            <Paper
                variant="outlined"
                sx={(t) => ({
                    mt: 1.25,
                    borderRadius: 3,
                    p: 2,
                    borderColor: alpha(t.palette.primary.main, 0.14),
                    bgcolor: alpha(t.palette.background.paper, 0.92),
                    boxShadow: `0 16px 46px ${alpha(t.palette.common.black, 0.08)}`,
                })}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <DashboardRoundedIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.25 }}>
                        Page Dashboard
                    </Typography>

                    <Box sx={{ flex: 1 }} />

                    <Chip
                        size="small"
                        label={`Role: ${role || 'member'}`}
                        sx={(t) => ({
                            borderRadius: 999,
                            fontWeight: 900,
                            bgcolor: alpha(t.palette.primary.main, 0.06),
                            border: '1px solid',
                            borderColor: alpha(t.palette.primary.main, 0.16),
                        })}
                    />
                </Box>

                <Typography color="text.secondary" sx={{ fontWeight: 750, mt: 1, mb: 2 }}>
                    Manage your page, posts, and team.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<GroupRoundedIcon />}
                        onClick={() => navigate(`/pages/${encodeURIComponent(String(pid))}/team`)}
                        sx={{ borderRadius: 999, fontWeight: 900, textTransform: 'none' }}
                        disabled={!canManageTeam}
                    >
                        Team
                    </Button>

                    <Button
                        variant="outlined"
                        startIcon={<SettingsRoundedIcon />}
                        onClick={() => navigate(`/pages/${encodeURIComponent(String(pid))}/settings`)}
                        sx={{ borderRadius: 999, fontWeight: 900, textTransform: 'none' }}
                        disabled
                    >
                        Settings (next)
                    </Button>
                </Stack>

                {!canManageTeam ? (
                    <Alert severity="info" sx={{ borderRadius: 2.5, mt: 1.5 }}>
                        Your role does not allow team management. Ask an owner/admin to change your access.
                    </Alert>
                ) : null}
            </Paper>
        </Shell>
    );
}

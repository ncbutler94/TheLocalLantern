// src/pages/business/pages/PageInviteAcceptPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    Fade,
    Paper,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';

import { useAuth } from '../../../components/AuthModalContext';
import { acceptPageInvite } from '../api/pagesApi';

/**
 * PageInviteAcceptPage
 * --------------------
 * Route suggestion: /pages/invite?token=...
 *
 * Behavior:
 * - If not logged in -> redirect to /login and return here
 * - If logged in -> POST /api/pages/invites/accept with token
 * - On success -> navigate to the team page for that page (or future page dashboard)
 */
export default function PageInviteAcceptPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const auth = useAuth();

    const viewer = auth?.user || null;
    const isAuthenticated = auth?.status === 'authenticated' && !!viewer;

    // Subtle mount fade (matches Community page feel)
    const [pageVisible, setPageVisible] = useState(false);
    useEffect(() => {
        const raf = requestAnimationFrame(() => setPageVisible(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    const token = useMemo(() => {
        try {
            const params = new URLSearchParams(location.search || '');
            return String(params.get('token') || '').trim();
        } catch {
            return '';
        }
    }, [location.search]);

    const [status, setStatus] = useState('idle'); // idle | loading | success | error
    const [error, setError] = useState('');
    const [pageId, setPageId] = useState(null);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setError('Missing invite token.');
            return;
        }

        if (!isAuthenticated) {
            // Preserve return URL so login can bring them back here.
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
        setStatus('loading');
        setError('');

        (async () => {
            try {
                const res = await acceptPageInvite(token);
                if (!alive) return;
                const pid = Number(res?.page_id || 0);
                setPageId(Number.isFinite(pid) && pid > 0 ? pid : null);
                setStatus('success');
            } catch (e) {
                if (!alive) return;
                setStatus('error');
                setError(String(e?.message || 'Failed to accept invite.'));
            }
        })();

        return () => {
            alive = false;
        };
    }, [token, isAuthenticated, navigate]);

    const goToTeam = () => {
        if (!pageId) return;
        navigate(`/pages/${encodeURIComponent(String(pageId))}/team`);
    };

    return (
        <Fade in={pageVisible} timeout={220} appear>
            <Box
                sx={{
                    width: '100%',
                    minHeight: '70vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: { xs: 1.25, sm: 2 },
                }}
            >
                <Paper
                    variant="outlined"
                    sx={(t) => ({
                        width: '100%',
                        maxWidth: 520,
                        p: 2.25,
                        borderRadius: 3,
                        borderColor: alpha(t.palette.primary.main, 0.14),
                        bgcolor: alpha(t.palette.background.paper, 0.92),
                        boxShadow: `0 18px 48px ${alpha(t.palette.common.black, 0.10)}`,
                    })}
                >
                    <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.75 }}>
                        Page Invite
                    </Typography>

                    <Typography color="text.secondary" sx={{ fontWeight: 750, mb: 2 }}>
                        Accept your invite to manage a page.
                    </Typography>

                    {status === 'loading' ? (
                        <Alert severity="info" sx={{ borderRadius: 2.5 }}>
                            Accepting invite…
                        </Alert>
                    ) : null}

                    {status === 'error' ? (
                        <Alert
                            severity="error"
                            icon={<ErrorOutlineRoundedIcon />}
                            sx={{ borderRadius: 2.5 }}
                        >
                            {error || 'Invite could not be accepted.'}
                        </Alert>
                    ) : null}

                    {status === 'success' ? (
                        <>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1, mb: 1 }}>
                                <CheckCircleRoundedIcon color="success" />
                                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                    Invite accepted
                                </Typography>
                            </Box>

                            <Typography color="text.secondary" sx={{ fontWeight: 750, mb: 1.5 }}>
                                You now have access to manage this page.
                            </Typography>

                            <Button
                                variant="contained"
                                startIcon={<PersonAddRoundedIcon />}
                                onClick={goToTeam}
                                disabled={!pageId}
                                fullWidth
                                sx={{ borderRadius: 999, fontWeight: 900, textTransform: 'none' }}
                            >
                                Go to Team
                            </Button>
                        </>
                    ) : null}

                    {status === 'idle' ? (
                        <Alert severity="info" sx={{ borderRadius: 2.5 }}>
                            Preparing invite…
                        </Alert>
                    ) : null}
                </Paper>
            </Box>
        </Fade>
    );
}

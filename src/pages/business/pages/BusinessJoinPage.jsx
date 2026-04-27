// src/pages/business/pages/BusinessJoinPage.jsx
/**
 * BusinessJoinPage
 * ----------------
 * Route: /business/join/:token
 *
 * Handles the recipient side of a shareable invite link.
 *
 * Flow:
 *  1. Validate token via GET /api/business/join/:token
 *  2. Show business info + "Join Team" button
 *  3. If not logged in → redirect to login with return URL
 *  4. If on a non-personal account → prompt to switch
 *  5. On accept → POST /api/business/join/:token
 *  6. On success → navigate to business admin page
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Alert,
    Avatar,
    Box,
    Button,
    CircularProgress,
    Fade,
    Paper,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';

import defaultAvatar from '../../../assets/profile/default_avatar.png';
import { secureFetch } from '../../../utils/secureFetch';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
const apiUrl = (path) => (API_BASE ? `${API_BASE}${path}` : path);

const safeJson = async (res) => {
    try {
        return await res.json();
    } catch {
        return null;
    }
};

/**
 * Read the active account context from localStorage.
 * Returns { accountType, userId } or null.
 */
function getActiveAccount() {
    try {
        const raw = localStorage.getItem('ll:activeAccount');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return {
            accountType: String(parsed?.account_type || parsed?.accountType || 'personal').toLowerCase(),
            userId: parsed?.user_id || parsed?.id || null,
        };
    } catch {
        return null;
    }
}

/**
 * Switch to the personal account context.
 */
function switchToPersonalAccount() {
    try {
        const raw = localStorage.getItem('ll:activeAccount');
        if (!raw) return;
        const parsed = JSON.parse(raw);
        const personal = {
            ...parsed,
            account_type: 'personal',
            accountType: 'personal',
            business_id: null,
            businessId: null,
            artist_id: null,
            artistId: null,
        };
        localStorage.setItem('ll:activeAccount', JSON.stringify(personal));
    } catch {
        // ignore
    }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BusinessJoinPage() {
    const { token } = useParams();
    const navigate = useNavigate();

    // Page fade-in
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const raf = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    // Status: idle → validating → ready / accepting → success / error
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState('');
    const [invite, setInvite] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [joinedBusiness, setJoinedBusiness] = useState(null);

    // Account context warning
    const [needsPersonalSwitch, setNeedsPersonalSwitch] = useState(false);

    // ---- Step 1: Validate the token ----
    useEffect(() => {
        if (!token) {
            setStatus('error');
            setError('Missing invite token.');
            return;
        }

        let alive = true;
        setStatus('validating');

        (async () => {
            try {
                const res = await secureFetch(apiUrl(`/api/business/join/${encodeURIComponent(token)}`), {
                    method: 'GET',
                    credentials: 'include',
                    headers: { Accept: 'application/json' },
                });

                if (!alive) return;
                const data = await safeJson(res);

                if (!res.ok) {
                    const code = data?.code || '';
                    if (code === 'INVALID_TOKEN') {
                        setError('This invite link is invalid or does not exist.');
                    } else if (code === 'ALREADY_USED') {
                        setError('This invite link has already been used.');
                    } else if (code === 'EXPIRED') {
                        setError('This invite link has expired.');
                    } else if (code === 'TEAM_FULL') {
                        setError('This team is currently at maximum capacity.');
                    } else {
                        setError(data?.message || 'Unable to validate invite.');
                    }
                    setStatus('error');
                    return;
                }

                setInvite(data.invite || null);
                setIsAuthenticated(!!data.user_authenticated);

                // If not logged in, redirect to login and come back
                if (!data.user_authenticated) {
                    const returnTo = `/business/join/${encodeURIComponent(token)}`;
                    try {
                        sessionStorage.setItem(
                            'll:returnTo',
                            JSON.stringify({ path: returnTo, scrollY: 0, ts: Date.now() })
                        );
                    } catch {
                        // ignore
                    }
                    navigate(`/login?redirect=${encodeURIComponent(returnTo)}`, { replace: true });
                    return;
                }

                // Check if user is on personal account
                const account = getActiveAccount();
                if (account && account.accountType !== 'personal') {
                    setNeedsPersonalSwitch(true);
                }

                setStatus('ready');
            } catch (e) {
                if (!alive) return;
                setStatus('error');
                setError(String(e?.message || 'Failed to validate invite.'));
            }
        })();

        return () => {
            alive = false;
        };
    }, [token, navigate]);

    // ---- Step 2: Accept the invite ----
    const handleAccept = async () => {
        if (!token) return;

        // If still on a non-personal account, switch first
        const account = getActiveAccount();
        if (account && account.accountType !== 'personal') {
            switchToPersonalAccount();
            setNeedsPersonalSwitch(false);
        }

        setStatus('accepting');
        setError('');

        try {
            const res = await secureFetch(apiUrl(`/api/business/join/${encodeURIComponent(token)}`), {
                method: 'POST',
                credentials: 'include',
                headers: { Accept: 'application/json' },
            });

            const data = await safeJson(res);

            if (!res.ok) {
                setError(data?.message || 'Failed to join team.');
                setStatus('ready');
                return;
            }

            setJoinedBusiness(data.business || null);
            setStatus('success');
        } catch (e) {
            setError(String(e?.message || 'Failed to join team.'));
            setStatus('ready');
        }
    };

    // ---- Step 3: Navigate to admin page ----
    const handleGoToAdmin = () => {
        const slug = joinedBusiness?.slug;
        if (slug) {
            navigate(`/${slug}/admin`);
        } else {
            navigate('/');
        }
    };

    const handleSwitchAccount = () => {
        switchToPersonalAccount();
        setNeedsPersonalSwitch(false);
    };

    // ---- Render ----
    const businessName = invite?.business_name || 'this business';
    const businessAvatar = invite?.business_avatar || defaultAvatar;

    return (
        <Fade in={visible} timeout={250} appear>
            <Box
                sx={{
                    width: '100%',
                    minHeight: '80vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: { xs: 2, sm: 3 },
                    py: 4,
                }}
            >
                <Paper
                    elevation={0}
                    sx={(t) => ({
                        width: '100%',
                        maxWidth: 480,
                        borderRadius: 4,
                        border: '1px solid',
                        borderColor: alpha(t.palette.divider, 0.12),
                        overflow: 'hidden',
                    })}
                >
                    {/* Header band */}
                    <Box
                        sx={(t) => ({
                            px: 3,
                            py: 2.5,
                            background: `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.08)} 0%, ${alpha(t.palette.primary.main, 0.03)} 100%)`,
                            borderBottom: '1px solid',
                            borderColor: alpha(t.palette.divider, 0.08),
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                        })}
                    >
                        <GroupAddRoundedIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                        <Typography variant="h5" sx={{ fontWeight: 900 }}>
                            Team Invite
                        </Typography>
                    </Box>

                    {/* Body */}
                    <Box sx={{ px: 3, py: 3 }}>
                        {/* Validating */}
                        {status === 'idle' || status === 'validating' ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <CircularProgress size={32} />
                                <Typography sx={{ mt: 2, fontWeight: 700, color: 'text.secondary' }}>
                                    Validating invite…
                                </Typography>
                            </Box>
                        ) : null}

                        {/* Error */}
                        {status === 'error' ? (
                            <Box sx={{ textAlign: 'center', py: 2 }}>
                                <ErrorOutlineRoundedIcon sx={{ fontSize: 56, color: 'error.main', mb: 1.5 }} />
                                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                                    Invite Not Available
                                </Typography>
                                <Alert severity="error" sx={{ borderRadius: 2.5, textAlign: 'left', mb: 2 }}>
                                    {error}
                                </Alert>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate('/')}
                                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
                                >
                                    Go Home
                                </Button>
                            </Box>
                        ) : null}

                        {/* Ready to accept */}
                        {status === 'ready' ? (
                            <>
                                {/* Business info card */}
                                <Box
                                    sx={(t) => ({
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        p: 2,
                                        mb: 2.5,
                                        borderRadius: 3,
                                        bgcolor: alpha(t.palette.background.default, 0.6),
                                        border: '1px solid',
                                        borderColor: alpha(t.palette.divider, 0.1),
                                    })}
                                >
                                    <Avatar
                                        src={businessAvatar}
                                        alt={businessName}
                                        sx={{
                                            width: 56,
                                            height: 56,
                                            border: '2px solid',
                                            borderColor: 'divider',
                                        }}
                                    >
                                        <StorefrontRoundedIcon />
                                    </Avatar>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography sx={{ fontWeight: 900, fontSize: 18 }} noWrap>
                                            {businessName}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                            Business Page
                                        </Typography>
                                    </Box>
                                </Box>

                                <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
                                    You've been invited to join the team!
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5, lineHeight: 1.6 }}>
                                    Accepting this invite will add you as an <strong>admin</strong> of{' '}
                                    <strong>{businessName}</strong>. You'll be able to manage the business profile,
                                    post updates, and more.
                                </Typography>

                                {/* Personal account warning */}
                                {needsPersonalSwitch ? (
                                    <Alert
                                        severity="warning"
                                        icon={<PersonRoundedIcon />}
                                        sx={{ borderRadius: 2.5, mb: 2 }}
                                        action={
                                            <Button
                                                color="inherit"
                                                size="small"
                                                onClick={handleSwitchAccount}
                                                sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 999 }}
                                            >
                                                Switch Now
                                            </Button>
                                        }
                                    >
                                        You're not on your personal profile. Switch to your personal account to accept this invite.
                                    </Alert>
                                ) : null}

                                {error ? (
                                    <Alert severity="error" sx={{ borderRadius: 2.5, mb: 2 }}>
                                        {error}
                                    </Alert>
                                ) : null}

                                <Button
                                    variant="contained"
                                    fullWidth
                                    size="large"
                                    startIcon={<GroupAddRoundedIcon />}
                                    onClick={handleAccept}
                                    sx={{
                                        borderRadius: 999,
                                        textTransform: 'none',
                                        fontWeight: 800,
                                        py: 1.5,
                                        fontSize: 16,
                                    }}
                                >
                                    Join Team as Admin
                                </Button>
                            </>
                        ) : null}

                        {/* Accepting */}
                        {status === 'accepting' ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <CircularProgress size={32} />
                                <Typography sx={{ mt: 2, fontWeight: 700, color: 'text.secondary' }}>
                                    Joining team…
                                </Typography>
                            </Box>
                        ) : null}

                        {/* Success */}
                        {status === 'success' ? (
                            <Box sx={{ textAlign: 'center', py: 1 }}>
                                <CheckCircleRoundedIcon sx={{ fontSize: 64, color: 'success.main', mb: 1.5 }} />
                                <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.5 }}>
                                    You're on the team!
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.6 }}>
                                    You've joined <strong>{joinedBusiness?.name || businessName}</strong> as an admin.
                                    You can now manage the business profile from the admin console.
                                </Typography>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    size="large"
                                    startIcon={<StorefrontRoundedIcon />}
                                    onClick={handleGoToAdmin}
                                    sx={{
                                        borderRadius: 999,
                                        textTransform: 'none',
                                        fontWeight: 800,
                                        py: 1.5,
                                        fontSize: 16,
                                    }}
                                >
                                    Go to Business Admin
                                </Button>
                            </Box>
                        ) : null}
                    </Box>
                </Paper>
            </Box>
        </Fade>
    );
}

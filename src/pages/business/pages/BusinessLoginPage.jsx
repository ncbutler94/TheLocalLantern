// src/pages/business/pages/BusinessLoginPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    Paper,
    TextField,
    Typography,
    Fade,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { MOBILE_BOTTOM_NAV_HEIGHT } from '../../../components/Header/Header';

import LockRoundedIcon from '@mui/icons-material/LockRounded';

/**
 * BusinessLoginPage (scaffold)
 * ---------------------------
 * Purpose:
 * - Separate login for business accounts
 * - Uses email + password issued by admin
 * - On success, will redirect to onboarding (next file)
 *
 * NOTE:
 * This is a frontend scaffold only. Hook this to:
 *   POST /api/business/auth/login
 * once the auth endpoint is added.
 */
export default function BusinessLoginPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');


    // Subtle mount fade (matches Community page feel)
    const [pageVisible, setPageVisible] = useState(false);
    useEffect(() => {
        const raf = requestAnimationFrame(() => setPageVisible(true));
        return () => cancelAnimationFrame(raf);
    }, []);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const submit = async (e) => {
        e.preventDefault();
        if (loading) return;

        setError('');
        setLoading(true);

        try {
            // TODO: replace with real endpoint
            // await fetch('/api/business/auth/login', { ... })
            await new Promise((r) => setTimeout(r, 400));

            // TEMP: redirect to onboarding stub
            navigate('/business/onboarding');
        } catch (e2) {
            setError('Invalid email or password.');
        } finally {
            setLoading(false);
        }
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
                    pb: { xs: `${MOBILE_BOTTOM_NAV_HEIGHT + 16}px`, sm: 0 },
                }}
            >
                <Paper
                    variant="outlined"
                    sx={(t) => ({
                        width: '100%',
                        maxWidth: 420,
                        p: 2.25,
                        borderRadius: 3,
                        borderColor: alpha(t.palette.primary.main, 0.14),
                        bgcolor: alpha(t.palette.background.paper, 0.92),
                        boxShadow: `0 18px 48px ${alpha(t.palette.common.black, 0.10)}`,
                    })}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1 }}>
                        <Box
                            sx={(t) => ({
                                width: 44,
                                height: 44,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: alpha(t.palette.primary.main, 0.10),
                                border: '1px solid',
                                borderColor: alpha(t.palette.primary.main, 0.18),
                            })}
                        >
                            <LockRoundedIcon sx={{ fontSize: 26, color: 'primary.main' }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 900 }}>
                            Business Login
                        </Typography>
                    </Box>

                    <Typography color="text.secondary" sx={{ fontWeight: 750, mb: 1.25 }}>
                        Use the credentials provided by Local Lantern.
                    </Typography>

                    {error ? (
                        <Alert severity="error" sx={{ borderRadius: 2.5, mb: 1.25 }}>
                            {error}
                        </Alert>
                    ) : null}

                    <Box component="form" onSubmit={submit}>
                        <TextField
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            fullWidth
                            sx={{ mb: 1.25 }}
                        />

                        <TextField
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            fullWidth
                            sx={{ mb: 1.75 }}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            fullWidth
                            sx={{ borderRadius: 999, fontWeight: 900, textTransform: 'none' }}
                        >
                            {loading ? 'Signing in…' : 'Sign in'}
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Fade>
    );
}
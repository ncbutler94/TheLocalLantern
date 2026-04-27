// src/pages/business/pages/MyPagesPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    Fade,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { secureFetch } from '../../../utils/secureFetch';

/**
 * MyPagesPage
 * ----------
 * Route suggestion: /pages
 *
 * Requires login (uses existing auth cookie).
 * Calls: GET /api/pages/mine
 */
export default function MyPagesPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [items, setItems] = useState([]);

    // Subtle mount fade (matches Community page feel)
    const [pageVisible, setPageVisible] = useState(false);
    useEffect(() => {
        const raf = requestAnimationFrame(() => setPageVisible(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await secureFetch('/api/pages/mine', {
                method: 'GET',
                credentials: 'include',
                headers: { Accept: 'application/json' },
                cache: 'no-store',
            });

            const data = await res.json().catch(() => null);
            if (!res.ok) {
                throw new Error(data?.message || `Failed to load (${res.status}).`);
            }

            setItems(Array.isArray(data?.items) ? data.items : []);
        } catch (e) {
            setError(String(e?.message || 'Failed to load your pages.'));
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const initials = (name) => {
        const s = String(name || '').trim();
        if (!s) return 'P';
        const parts = s.split(/\s+/).filter(Boolean);
        const a = parts[0]?.[0] || 'P';
        const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
        return `${a}${b}`.toUpperCase();
    };

    const footerText = useMemo(() => {
        if (loading) return 'Loading...';
        const shown = Array.isArray(items) ? items.length : 0;
        const noun = shown === 1 ? 'page' : 'pages';
        return `Displaying ${shown.toLocaleString()} ${noun}`;
    }, [items, loading]);

    return (
        <Fade in={pageVisible} timeout={220} appear>
            <Box
                sx={{
                    width: '100%',
                    px: { xs: 1.1, md: 2 },
                    pt: { xs: 1.1, md: 1.5 },
                    pb: { xs: 1.25, md: 2 },
                }}
            >
                <Box
                    sx={{
                        height: '100%',
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
                    }}
                >
                    {/* Header row (Community-style) */}
                    <Box
                        sx={{
                            flexShrink: 0,
                            px: { xs: 1, md: 1.5 },
                            pt: { xs: 0.55, md: 0.65 },
                            pb: { xs: 0.45, md: 0.55 },
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1,
                            flexWrap: 'wrap',
                            borderBottom: '1px solid',
                            borderColor: (t) => alpha(t.palette.primary.main, 0.10),
                        }}
                    >
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 900,
                                    letterSpacing: '-0.01em',
                                    lineHeight: 1.1,
                                }}
                            >
                                My Pages
                            </Typography>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontWeight: 750, mt: 0.25 }}
                            >
                                Pages you can manage (Businesses, Musicians, Services, and more).
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Button
                                variant="outlined"
                                startIcon={<AddRoundedIcon />}
                                onClick={() => navigate('/business/apply')}
                                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, height: 38 }}
                            >
                                Submit a Page
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<OpenInNewRoundedIcon />}
                                onClick={load}
                                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, height: 38 }}
                            >
                                Refresh
                            </Button>
                        </Box>
                    </Box>

                    {/* Body */}
                    <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                        <Box
                            sx={{
                                height: '100%',
                                overflowY: 'scroll',
                                scrollbarGutter: 'stable',
                                px: { xs: 0.75, md: 1.25 },
                                py: 1.25,
                            }}
                        >
                            {error ? (
                                <Alert severity="error" sx={{ borderRadius: 2.5, mb: 1.25 }}>
                                    {error}
                                </Alert>
                            ) : null}

                            {loading ? (
                                <Alert severity="info" sx={{ borderRadius: 2.5, mb: 1.25 }}>
                                    Loading…
                                </Alert>
                            ) : null}

                            {!loading && Array.isArray(items) && items.length === 0 ? (
                                <Alert severity="info" sx={{ borderRadius: 2.5, mb: 1.25 }}>
                                    You don’t have any pages yet. Submit one to get started.
                                </Alert>
                            ) : null}

                            {!loading && Array.isArray(items) && items.length ? (
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: {
                                            xs: '1fr',
                                            sm: 'repeat(2, minmax(0, 1fr))',
                                            md: 'repeat(3, minmax(0, 1fr))',
                                        },
                                        gap: 1.35,
                                        pb: 7,
                                    }}
                                >
                                    {items.map((p) => {
                                        const pid = p?.id;
                                        const name = p?.name || 'Page';
                                        const role = String(p?.member_role || '').toLowerCase() || 'member';
                                        const type = String(p?.page_type || '').trim() || 'page';

                                        const loc = [p?.city, p?.county ? `${p.county} County` : ''].filter(Boolean).join(', ');
                                        const subtitle = [type, loc].filter(Boolean).join(' • ') || 'Alabama';

                                        return (
                                            <Paper
                                                key={pid}
                                                variant="outlined"
                                                sx={(t) => ({
                                                    borderRadius: 3,
                                                    p: 1.25,
                                                    borderColor: alpha(t.palette.primary.main, 0.14),
                                                    bgcolor: 'background.paper',
                                                    backgroundImage: `linear-gradient(180deg, ${alpha(t.palette.primary.main, 0.05)} 0%, transparent 60%)`,
                                                    boxShadow: t.custom.shadows.sm,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 1,
                                                    overflow: 'hidden',
                                                })}
                                            >
                                                <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>
                                                    <Avatar
                                                        src={p?.avatar_url || undefined}
                                                        sx={(t) => ({
                                                            width: 54,
                                                            height: 54,
                                                            borderRadius: 2.25,
                                                            bgcolor: alpha(t.palette.primary.main, 0.10),
                                                            border: '1px solid',
                                                            borderColor: alpha(t.palette.primary.main, 0.16),
                                                            fontWeight: 900,
                                                        })}
                                                    >
                                                        {initials(name)}
                                                    </Avatar>

                                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                                        <Typography sx={{ fontWeight: 900 }} noWrap>
                                                            {name}
                                                        </Typography>
                                                        <Typography color="text.secondary" sx={{ fontWeight: 800 }} noWrap>
                                                            {subtitle}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                                                    <Chip size="small" label={`Role: ${role}`} sx={{ borderRadius: 999, fontWeight: 900 }} />
                                                    <Chip size="small" label={p?.status || 'draft'} sx={{ borderRadius: 999, fontWeight: 900 }} />
                                                </Stack>

                                                <Box sx={{ mt: 'auto', display: 'flex', gap: 1 }}>
                                                    <Button
                                                        variant="contained"
                                                        startIcon={<DashboardRoundedIcon />}
                                                        onClick={() => navigate(`/pages/${encodeURIComponent(String(pid))}`)}
                                                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, flex: 1 }}
                                                    >
                                                        Dashboard
                                                    </Button>
                                                </Box>
                                            </Paper>
                                        );
                                    })}
                                </Box>
                            ) : null}

                            <Box sx={{ height: 72 }} />
                        </Box>

                        {/* Sticky footer count bar (Community-style) */}
                        <Box
                            sx={(t) => ({
                                position: 'sticky',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                mt: -6,
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
            </Box>
        </Fade>
    );
}
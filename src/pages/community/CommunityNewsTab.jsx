// src/pages/community/CommunityNewsTab.jsx
//
// News tab for the Community page right panel.
// Consumes selectedCounty / selectedCity from CommunityPage state
// and shows headlines from NewsData.io (via our /api/community/news route).
//
// Behavior:
//   - If a city is selected → scope=city
//   - Else if a county is selected → scope=county
//   - Else → scope=alabama (statewide)
//
// All articles link OUT to the original publisher (open in new tab).

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Link as MuiLink,
    Stack,
    Typography,
    useTheme,
    alpha,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import NewspaperIcon from '@mui/icons-material/Newspaper';

import { secureFetch } from '../../utils/secureFetch';

/** Human-friendly "3 hours ago" style formatter */
function timeAgo(dateInput) {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (Number.isNaN(d.valueOf())) return '';
    const diffSec = Math.max(0, (Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
    return d.toLocaleDateString();
}

/** Build the query params for /api/community/news based on selected filters */
function buildScopeQuery({ selectedCity, selectedCounty }) {
    const city = String(selectedCity || '').trim();
    const county = String(selectedCounty || '').trim();

    // Treat "All Cities" / "Statewide" / empty as statewide
    const isStatewideCity = !city || /^(all\s*cities|statewide)$/i.test(city);
    const isStatewideCounty = !county || /^(all\s*counties|statewide)$/i.test(county);

    if (!isStatewideCity) {
        return { scope: 'city', key: city, label: `${city}, AL` };
    }
    if (!isStatewideCounty) {
        return { scope: 'county', key: county, label: `${county} County, AL` };
    }
    return { scope: 'alabama', key: '', label: 'Alabama' };
}

function SkeletonCard({ theme }) {
    return (
        <Box
            sx={{
                display: 'flex',
                gap: 1.5,
                p: 1.5,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: 'background.paper',
            }}
        >
            <Box
                sx={{
                    width: 96,
                    height: 72,
                    borderRadius: 1.5,
                    flexShrink: 0,
                    bgcolor: alpha(theme.palette.text.primary, 0.06),
                }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ height: 12, width: '40%', bgcolor: alpha(theme.palette.text.primary, 0.08), borderRadius: 0.5, mb: 1 }} />
                <Box sx={{ height: 14, width: '95%', bgcolor: alpha(theme.palette.text.primary, 0.12), borderRadius: 0.5, mb: 0.75 }} />
                <Box sx={{ height: 12, width: '80%', bgcolor: alpha(theme.palette.text.primary, 0.08), borderRadius: 0.5 }} />
            </Box>
        </Box>
    );
}

function ArticleCard({ article, theme }) {
    const [imgOk, setImgOk] = useState(Boolean(article.image_url));

    return (
        <Box
            component="article"
            sx={{
                display: 'flex',
                gap: 1.5,
                p: 1.5,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: 'background.paper',
                transition: 'border-color 120ms ease, box-shadow 120ms ease',
                '&:hover': {
                    borderColor: alpha(theme.palette.primary.main, 0.4),
                    boxShadow: `0 1px 6px ${alpha(theme.palette.primary.main, 0.08)}`,
                },
            }}
        >
            {/* Thumbnail — hotlinked from publisher, never stored on our server */}
            <Box
                sx={{
                    width: 96,
                    height: 72,
                    borderRadius: 1.5,
                    flexShrink: 0,
                    overflow: 'hidden',
                    bgcolor: alpha(theme.palette.text.primary, 0.06),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {imgOk && article.image_url ? (
                    <img
                        src={article.image_url}
                        alt=""
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={() => setImgOk(false)}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                        }}
                    />
                ) : (
                    <NewspaperIcon sx={{ color: alpha(theme.palette.text.primary, 0.3), fontSize: 28 }} />
                )}
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    {article.source_name && (
                        <Chip
                            label={article.source_name}
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: 11,
                                fontWeight: 500,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                                '& .MuiChip-label': { px: 1 },
                            }}
                        />
                    )}
                    {article.published_at && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>
                            {timeAgo(article.published_at)}
                        </Typography>
                    )}
                </Stack>

                <MuiLink
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="none"
                    sx={{
                        color: 'text.primary',
                        '&:hover': { color: 'primary.main' },
                    }}
                >
                    <Typography
                        component="h3"
                        sx={{
                            fontSize: 15,
                            fontWeight: 600,
                            lineHeight: 1.35,
                            mb: 0.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}
                    >
                        {article.title}
                        <OpenInNewIcon
                            sx={{
                                fontSize: 13,
                                ml: 0.5,
                                mb: '-2px',
                                opacity: 0.5,
                            }}
                        />
                    </Typography>
                </MuiLink>

                {article.description && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            fontSize: 13,
                            lineHeight: 1.45,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}
                    >
                        {article.description}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}

/**
 * CommunityNewsTab
 * ----------------
 * Props:
 *   selectedCity     — current city filter from CommunityPage
 *   selectedCounty   — current county filter from CommunityPage
 *   sx               — optional MUI sx override for the outer container
 */
export default function CommunityNewsTab({ selectedCity, selectedCounty, sx }) {
    const theme = useTheme();
    const abortRef = useRef(null);

    const scopeInfo = useMemo(
        () => buildScopeQuery({ selectedCity, selectedCounty }),
        [selectedCity, selectedCounty]
    );

    const [state, setState] = useState({
        loading: true,
        articles: [],
        error: null,
        status: null,          // 'fresh' | 'cached' | 'stale' | 'unavailable'
        lastFetchedAt: null,
        message: null,
    });

    const loadNews = useCallback(async () => {
        // Cancel any in-flight request
        if (abortRef.current) {
            try { abortRef.current.abort(); } catch { /* ignore */ }
        }
        const ac = new AbortController();
        abortRef.current = ac;

        setState((s) => ({ ...s, loading: true, error: null }));

        const params = new URLSearchParams({ scope: scopeInfo.scope });
        if (scopeInfo.key) params.set('key', scopeInfo.key);

        try {
            const res = await secureFetch(`/api/community/news?${params.toString()}`, {
                credentials: 'include',
                signal: ac.signal,
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.message || `Request failed (${res.status})`);
            }

            const data = await res.json();
            setState({
                loading: false,
                articles: Array.isArray(data.articles) ? data.articles : [],
                error: null,
                status: data.status || null,
                lastFetchedAt: data.last_fetched_at || null,
                message: data.message || null,
            });
        } catch (err) {
            if (err.name === 'AbortError') return; // superseded by a newer request
            setState((s) => ({
                ...s,
                loading: false,
                error: err.message || 'Could not load news.',
            }));
        }
    }, [scopeInfo.scope, scopeInfo.key]);

    // Load whenever the scope changes
    useEffect(() => {
        loadNews();
        return () => {
            if (abortRef.current) {
                try { abortRef.current.abort(); } catch { /* ignore */ }
            }
        };
    }, [loadNews]);

    const { loading, articles, error, status, lastFetchedAt, message } = state;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', ...sx }}>
            {/* Header */}
            <Box
                sx={{
                    px: 2,
                    py: 1.5,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    bgcolor: 'background.paper',
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                            Local News
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>
                            {scopeInfo.label}
                            {lastFetchedAt && ` · Updated ${timeAgo(lastFetchedAt)}`}
                        </Typography>
                    </Box>
                    <Button
                        size="small"
                        startIcon={<RefreshIcon fontSize="small" />}
                        onClick={loadNews}
                        disabled={loading}
                        sx={{ textTransform: 'none' }}
                    >
                        Refresh
                    </Button>
                </Stack>
            </Box>

            {/* Content */}
            <Box
                sx={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                    p: 1.5,
                }}
            >
                {/* Status banner (stale / unavailable) */}
                {!loading && message && (
                    <Alert
                        severity={status === 'unavailable' ? 'warning' : 'info'}
                        sx={{ mb: 1.5, fontSize: 13 }}
                    >
                        {message}
                    </Alert>
                )}

                {/* Error state */}
                {!loading && error && (
                    <Alert severity="error" sx={{ mb: 1.5, fontSize: 13 }}>
                        {error}
                    </Alert>
                )}

                {/* Loading skeleton */}
                {loading && (
                    <Stack spacing={1.25}>
                        <SkeletonCard theme={theme} />
                        <SkeletonCard theme={theme} />
                        <SkeletonCard theme={theme} />
                    </Stack>
                )}

                {/* Empty state */}
                {!loading && !error && articles.length === 0 && (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            py: 6,
                            color: 'text.secondary',
                        }}
                    >
                        <NewspaperIcon sx={{ fontSize: 36, opacity: 0.4, mb: 1 }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            No news available yet
                        </Typography>
                        <Typography variant="caption" sx={{ mt: 0.5, maxWidth: 260 }}>
                            Check back soon, or try a different county or city.
                        </Typography>
                    </Box>
                )}

                {/* Article list */}
                {!loading && articles.length > 0 && (
                    <Stack spacing={1.25}>
                        {articles.map((a) => (
                            <ArticleCard key={a.id || a.url} article={a} theme={theme} />
                        ))}
                    </Stack>
                )}

                {/* Footer attribution — required by NewsData.io on free tier */}
                {!loading && articles.length > 0 && (
                    <Typography
                        variant="caption"
                        sx={{
                            display: 'block',
                            mt: 2,
                            textAlign: 'center',
                            color: 'text.secondary',
                            fontSize: 11,
                        }}
                    >
                        News provided by{' '}
                        <MuiLink
                            href="https://newsdata.io"
                            target="_blank"
                            rel="noopener noreferrer"
                            color="inherit"
                            sx={{ textDecoration: 'underline' }}
                        >
                            NewsData.io
                        </MuiLink>
                    </Typography>
                )}
            </Box>
        </Box>
    );
}

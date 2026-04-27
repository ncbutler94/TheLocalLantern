// src/pages/community/components/CommunityNewsPanel.jsx
//
// Left-rail panel for News mode. Shown when leftMode === 'news' on CommunityPage.
// Mirrors the filter + list + footer layout of CommunityPanel so the UX feels native.
//
// Behavior:
//   - Loads ONLY when mounted (i.e., when user clicks into News mode) — lazy
//   - Same location filters as Feed (county, city) + a News Category dropdown
//   - Clicking an article → calls onSelectArticle(article) so CommunityPage can
//     show it in the right panel
//   - "Read full article" buttons always link to the publisher in a new tab

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    IconButton,
    MenuItem,
    Select,
    Skeleton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import TuneIcon from '@mui/icons-material/Tune';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

import { secureFetch } from '../../../utils/secureFetch';

// 10 news categories supported by TheNewsAPI
const NEWS_CATEGORIES = [
    { value: 'all', label: 'All news' },
    { value: 'general', label: 'General' },
    { value: 'sports', label: 'Sports' },
    { value: 'politics', label: 'Politics' },
    { value: 'business', label: 'Business' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'tech', label: 'Technology' },
    { value: 'health', label: 'Health' },
    { value: 'science', label: 'Science' },
    { value: 'food', label: 'Food' },
    { value: 'travel', label: 'Travel' },
];

/* ──────────────────────────── helpers ──────────────────────────── */

function timeAgo(dateInput) {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (Number.isNaN(d.valueOf())) return '';
    const diffSec = Math.max(0, (Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString();
}

function buildScope({ selectedCity, selectedCounty }) {
    const city = String(selectedCity || '').trim();
    const county = String(selectedCounty || '').trim();
    const isStatewideCity = !city || /^(all\s*cities|statewide)$/i.test(city);
    const isStatewideCounty = !county || /^(all\s*counties|statewide)$/i.test(county);
    if (!isStatewideCity) return { scope: 'city', key: city, label: `${city}, AL` };
    if (!isStatewideCounty) return { scope: 'county', key: county, label: `${county} County, AL` };
    return { scope: 'alabama', key: '', label: 'Alabama' };
}

/* ──────────────────────────── components ──────────────────────────── */

function ArticleSkeleton({ theme }) {
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
            <Skeleton variant="rectangular" width={96} height={72} sx={{ borderRadius: 1.5, flexShrink: 0 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Skeleton variant="text" width="40%" height={14} sx={{ mb: 0.5 }} />
                <Skeleton variant="text" width="95%" height={18} />
                <Skeleton variant="text" width="80%" height={16} />
            </Box>
        </Box>
    );
}

function ArticleCard({ article, selected, onSelect, theme }) {
    const [imgOk, setImgOk] = useState(Boolean(article.image_url));

    return (
        <Box
            component="article"
            role="button"
            tabIndex={0}
            onClick={() => onSelect(article)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(article);
                }
            }}
            sx={{
                display: 'flex',
                gap: 1.5,
                p: 1.5,
                borderRadius: 2,
                border: `1px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
                bgcolor: selected ? alpha(theme.palette.primary.main, 0.04) : 'background.paper',
                cursor: 'pointer',
                transition: 'border-color 120ms ease, background-color 120ms ease',
                '&:hover': {
                    borderColor: alpha(theme.palette.primary.main, 0.5),
                    bgcolor: alpha(theme.palette.primary.main, 0.03),
                },
                '&:focus-visible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: 2,
                },
            }}
        >
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
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
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
                    {article.primary_category && (
                        <Typography variant="caption" sx={{ fontSize: 11, color: 'text.tertiary', textTransform: 'capitalize' }}>
                            {article.primary_category}
                        </Typography>
                    )}
                    {article.published_at && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                            · {timeAgo(article.published_at)}
                        </Typography>
                    )}
                </Stack>

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
                </Typography>

                {(article.snippet || article.description) && (
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
                        {article.snippet || article.description}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}

/* ──────────────────────────── main panel ──────────────────────────── */

/**
 * CommunityNewsPanel
 * ------------------
 * Drop-in replacement for CommunityPanel when leftMode === 'news'.
 *
 * Props:
 *   selectedCity, selectedCounty       — from CommunityPage state
 *   onCityChange, onCountyChange       — to mutate parent filters (optional)
 *   selectedArticleId                  — currently selected article (highlighted)
 *   onSelectArticle(article)           — user clicked an article
 *   sx                                 — MUI sx overrides
 */
export default function CommunityNewsPanel({
                                               selectedCity = '',
                                               selectedCounty = '',
                                               selectedArticleId = null,
                                               onSelectArticle = () => {},
                                               sx,
                                           }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const abortRef = useRef(null);

    // Local state for category filter (specific to News — not part of the main filter dispatch)
    const [category, setCategory] = useState('all');

    const scopeInfo = useMemo(
        () => buildScope({ selectedCity, selectedCounty }),
        [selectedCity, selectedCounty]
    );

    const [state, setState] = useState({
        loading: true,
        articles: [],
        error: null,
        status: null,
        lastFetchedAt: null,
        message: null,
    });

    const loadNews = useCallback(async () => {
        if (abortRef.current) {
            try { abortRef.current.abort(); } catch { /* ignore */ }
        }
        const ac = new AbortController();
        abortRef.current = ac;

        setState((s) => ({ ...s, loading: true, error: null }));

        const params = new URLSearchParams({ scope: scopeInfo.scope });
        if (scopeInfo.key) params.set('key', scopeInfo.key);
        if (category && category !== 'all') params.set('category', category);

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
            if (err.name === 'AbortError') return;
            setState((s) => ({
                ...s,
                loading: false,
                error: err.message || 'Could not load news.',
            }));
        }
    }, [scopeInfo.scope, scopeInfo.key, category]);

    // Load on mount + whenever scope/category changes
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
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                bgcolor: 'background.default',
                ...sx,
            }}
        >
            {/* ── Header: location + category + refresh ── */}
            <Box
                sx={{
                    px: { xs: 1.5, md: 2 },
                    py: 1.25,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    bgcolor: 'background.paper',
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <NewspaperIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                            Local News
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>
                            {scopeInfo.label}
                            {lastFetchedAt && !loading ? ` · Updated ${timeAgo(lastFetchedAt)}` : ''}
                        </Typography>
                    </Box>
                    <Tooltip title="Refresh news">
                        <span>
                            <IconButton
                                size="small"
                                onClick={loadNews}
                                disabled={loading}
                                aria-label="Refresh news"
                            >
                                {loading ? (
                                    <CircularProgress size={16} thickness={5} />
                                ) : (
                                    <RefreshIcon fontSize="small" />
                                )}
                            </IconButton>
                        </span>
                    </Tooltip>
                </Stack>

                {/* Category dropdown */}
                <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    size="small"
                    fullWidth
                    displayEmpty
                    MenuProps={{ PaperProps: { sx: { maxHeight: 360 } } }}
                    sx={{
                        '& .MuiSelect-select': { py: 0.75, fontSize: 14 },
                    }}
                >
                    {NEWS_CATEGORIES.map((c) => (
                        <MenuItem key={c.value} value={c.value} sx={{ fontSize: 14 }}>
                            {c.label}
                        </MenuItem>
                    ))}
                </Select>
            </Box>

            {/* ── Scrollable list ── */}
            <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: { xs: 1.25, md: 1.5 } }}>
                {/* Status banners */}
                {!loading && message && (
                    <Alert
                        severity={status === 'unavailable' ? 'warning' : 'info'}
                        sx={{ mb: 1.5, fontSize: 13 }}
                    >
                        {message}
                    </Alert>
                )}

                {!loading && error && (
                    <Alert severity="error" sx={{ mb: 1.5, fontSize: 13 }} action={
                        <Button size="small" onClick={loadNews}>Retry</Button>
                    }>
                        {error}
                    </Alert>
                )}

                {/* Loading skeletons */}
                {loading && (
                    <Stack spacing={1.25}>
                        <ArticleSkeleton theme={theme} />
                        <ArticleSkeleton theme={theme} />
                        <ArticleSkeleton theme={theme} />
                        <ArticleSkeleton theme={theme} />
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
                            px: 2,
                            color: 'text.secondary',
                        }}
                    >
                        <NewspaperIcon sx={{ fontSize: 40, opacity: 0.4, mb: 1.5 }} />
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                            No news available yet
                        </Typography>
                        <Typography variant="caption" sx={{ maxWidth: 280 }}>
                            Try a different category, county, or city. Local news for smaller areas can be sparse.
                        </Typography>
                    </Box>
                )}

                {/* Article list */}
                {!loading && articles.length > 0 && (
                    <Stack spacing={1.25}>
                        {articles.map((a) => (
                            <ArticleCard
                                key={a.id || a.url}
                                article={a}
                                selected={selectedArticleId === a.id}
                                onSelect={onSelectArticle}
                                theme={theme}
                            />
                        ))}
                    </Stack>
                )}
            </Box>

            {/* ── Footer: attribution + count ── */}
            {!loading && articles.length > 0 && (
                <Box
                    sx={{
                        px: 2,
                        py: 1,
                        borderTop: `1px solid ${theme.palette.divider}`,
                        bgcolor: 'background.paper',
                    }}
                >
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                            {articles.length} article{articles.length === 1 ? '' : 's'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                            News via TheNewsAPI
                        </Typography>
                    </Stack>
                </Box>
            )}
        </Box>
    );
}

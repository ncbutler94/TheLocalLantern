// src/pages/community/components/CommunityNewsDetailPanel.jsx
//
// v10 — Slice 2 update: bookmark button gated on feature flag and
// properly viewer-aware. Everything else carries forward from the
// slice 1 redesign.

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import {
    Box,
    Button,
    Chip,
    Divider,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import BookmarkRoundedIcon from '@mui/icons-material/BookmarkRounded';
import BookmarkBorderRoundedIcon from '@mui/icons-material/BookmarkBorderRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';

import ActionBar from '../../../components/ActionBar';
import ShareDialog from '../../../components/ShareDialog';
import { useAuth } from '../../../components/AuthModalContext';
import RedditComments, { NEWS_ARTICLE_RESOURCE } from '../comments/CommentThread';
import useNewsArticleDetail from './useNewsArticleDetail';
import useNewsBookmark, { isFeatureEnabled as isBookmarkFeatureEnabled } from '../useNewsBookmark';

/* ─────────────────────────── helpers ─────────────────────────── */

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

function formatDateLong(dateInput) {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (Number.isNaN(d.valueOf())) return '';
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function getArticleLocation(article) {
    if (!article) return null;
    const city = article.al_city || article.city || null;
    const county = article.al_county || article.county || null;
    if (city && county) return `${city}, ${county} Co.`;
    if (city) return city;
    if (county) return `${county} County`;
    return null;
}

export default function CommunityNewsDetailPanel({
                                                     article,
                                                     onBack = null,
                                                     showBackButton = false,
                                                     scrollToCommentId = null,
                                                     highlightCommentId = null,
                                                 }) {
    const theme = useTheme();
    const auth = useAuth();
    const viewer = auth?.user || null;

    const [refreshKey, setRefreshKey] = useState(0);

    const { article: enrichedArticle } = useNewsArticleDetail({
        articleId: article?.id || null,
        initialArticle: article || null,
        refreshKey,
    });

    const current = enrichedArticle || article || null;

    // Bookmark — shared hook, viewer-aware.
    const bookmarkFeatureOn = isBookmarkFeatureEnabled();
    const { isBookmarked, toggle: toggleBookmark, loading: bookmarkLoading } =
        useNewsBookmark(current?.id || null, { viewer });

    const [imgOk, setImgOk] = useState(Boolean(current?.image_url));

    const lastSeenIdRef = useRef(current?.id || null);
    if (current?.id && current.id !== lastSeenIdRef.current) {
        lastSeenIdRef.current = current.id;
        Promise.resolve().then(() => setImgOk(Boolean(current.image_url)));
    }

    const openOriginal = useCallback(() => {
        if (current?.url) {
            window.open(current.url, '_blank', 'noopener,noreferrer');
        }
    }, [current]);

    const [shareDialogOpen, setShareDialogOpen] = useState(false);

    const actionBarPost = useMemo(() => {
        if (!current) return null;
        return {
            id: current.id,
            title: current.title,
            url: current.url,
            image_url: current.image_url,
        };
    }, [current]);

    const commentsCount = Number(current?.comments_count ?? 0);
    const initialLikes = Number(current?.likes_count ?? 0);
    const initialReposts = Number(current?.reposts_count ?? 0);
    const initiallyLiked = Boolean(current?.viewer_liked);
    const initiallyReposted = Boolean(current?.viewer_reposted);

    const handleCommentCountChange = useCallback(() => {
        setRefreshKey((k) => k + 1);
        try {
            if (current?.id) {
                window.dispatchEvent(
                    new CustomEvent('ll:newsArticle:updated', {
                        detail: { articleId: current.id },
                    })
                );
            }
        } catch { /* ignore */ }
    }, [current]);

    const addCommentRef = useRef(null);
    const scrollToCommentBox = useCallback(() => {
        const el = addCommentRef.current;
        if (el && typeof el.scrollIntoView === 'function') {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                try {
                    const ta = el.querySelector?.('textarea');
                    if (ta) ta.focus();
                } catch { /* ignore */ }
            }, 350);
        }
    }, []);

    if (!current) return null;

    const articleLocation = getArticleLocation(current);
    const showBookmarkInHeader = bookmarkFeatureOn && current?.id;

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                bgcolor: 'background.paper',
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: { xs: 1.5, md: 2 },
                    py: 1.25,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    bgcolor: 'background.paper',
                    flexShrink: 0,
                }}
            >
                {showBackButton && onBack && (
                    <IconButton size="small" onClick={onBack} aria-label="Back">
                        <ArrowBackIosNewIcon fontSize="small" />
                    </IconButton>
                )}
                <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1, minWidth: 0 }}>
                    Article
                </Typography>

                {showBookmarkInHeader && (
                    <Tooltip title={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}>
                        <span>
                            <IconButton
                                size="small"
                                onClick={toggleBookmark}
                                disabled={bookmarkLoading}
                                aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
                                aria-pressed={isBookmarked}
                                sx={(t) => ({
                                    color: isBookmarked
                                        ? t.palette.secondary.main
                                        : t.palette.text.secondary,
                                    transition: 'color 160ms ease, transform 160ms ease',
                                    '&:hover': { transform: 'scale(1.08)' },
                                })}
                            >
                                {isBookmarked
                                    ? <BookmarkRoundedIcon fontSize="small" />
                                    : <BookmarkBorderRoundedIcon fontSize="small" />}
                            </IconButton>
                        </span>
                    </Tooltip>
                )}
            </Box>

            {/* Scrollable content */}
            <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: { xs: 1.5, md: 2 } }}>
                {imgOk && current.image_url ? (
                    <Box
                        sx={{
                            width: '100%',
                            aspectRatio: '16 / 9',
                            borderRadius: 2,
                            overflow: 'hidden',
                            mb: 2,
                            bgcolor: alpha(theme.palette.text.primary, 0.06),
                        }}
                    >
                        <img
                            src={current.image_url}
                            alt=""
                            referrerPolicy="no-referrer"
                            onError={() => setImgOk(false)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                    </Box>
                ) : (
                    <Box
                        sx={{
                            width: '100%',
                            aspectRatio: '16 / 9',
                            borderRadius: 2,
                            mb: 2,
                            bgcolor: alpha(theme.palette.text.primary, 0.06),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <NewspaperIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                    </Box>
                )}

                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                    sx={{ mb: 1.5, rowGap: 0.75 }}
                >
                    {current.source_name && (
                        <Chip
                            label={current.source_name}
                            size="small"
                            sx={{
                                height: 24,
                                fontSize: 12,
                                fontWeight: 500,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                            }}
                        />
                    )}
                    {current.primary_category && (
                        <Chip
                            label={current.primary_category.charAt(0).toUpperCase() + current.primary_category.slice(1)}
                            size="small"
                            variant="outlined"
                            sx={{ height: 24, fontSize: 12 }}
                        />
                    )}
                    {articleLocation && (
                        <Chip
                            icon={<LocationOnRoundedIcon sx={{ fontSize: 14, ml: '4px !important' }} />}
                            label={articleLocation}
                            size="small"
                            sx={{
                                height: 24,
                                fontSize: 12,
                                fontWeight: 600,
                                color: theme.palette.primary.main,
                                bgcolor: alpha(theme.palette.primary.main, 0.06),
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                '& .MuiChip-icon': { color: theme.palette.primary.main },
                            }}
                        />
                    )}
                    {current.published_at && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 13 }}>
                            {timeAgo(current.published_at)} · {formatDateLong(current.published_at)}
                        </Typography>
                    )}
                </Stack>

                <Typography
                    component="h2"
                    sx={{
                        fontSize: { xs: 20, md: 22 },
                        fontWeight: 600,
                        lineHeight: 1.3,
                        mb: 2,
                    }}
                >
                    {current.title}
                </Typography>

                {(current.snippet || current.description) && (
                    <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ fontSize: 15, lineHeight: 1.6, mb: 2.5 }}
                    >
                        {current.snippet || current.description}
                    </Typography>
                )}

                <Box
                    sx={(t) => ({
                        borderTop: `1px solid ${t.palette.divider}`,
                        borderBottom: `1px solid ${t.palette.divider}`,
                        py: 0.5,
                        mb: 2,
                    })}
                >
                    <ActionBar
                        user={viewer}
                        postId={current.id}
                        post={actionBarPost}
                        variant="news"
                        initialLikes={initialLikes}
                        initiallyLiked={initiallyLiked}
                        initialReposts={initialReposts}
                        initiallyReposted={initiallyReposted}
                        commentsCount={commentsCount}
                        onComment={scrollToCommentBox}
                        useShareDialog={false}
                        onShare={() => setShareDialogOpen(true)}
                        showBoost={false}
                        enableFlag={false}
                    />
                </Box>

                <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    endIcon={<OpenInNewIcon />}
                    onClick={openOriginal}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: 15,
                        py: 1.25,
                        borderRadius: 2,
                        mb: 2,
                    }}
                >
                    Read full article{current.source_name ? ` on ${current.source_name}` : ''}
                </Button>

                <Divider sx={{ mb: 1.5 }} />

                <RedditComments
                    postId={current.id}
                    post={current}
                    viewer={viewer}
                    postAuthor={null}
                    refreshKey={refreshKey}
                    addCommentRef={addCommentRef}
                    onCommentCountChange={handleCommentCountChange}
                    onCopyLinkToast={() => { /* not wired here */ }}
                    resourceContext={NEWS_ARTICLE_RESOURCE}
                    initialPageSize={50}
                    scrollToCommentId={scrollToCommentId}
                    highlightCommentId={highlightCommentId}
                />

                <Box
                    sx={{
                        mt: 3,
                        p: 1.25,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.text.primary, 0.02),
                        border: `1px solid ${alpha(theme.palette.text.primary, 0.05)}`,
                    }}
                >
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: 11.5, lineHeight: 1.5, display: 'block' }}
                    >
                        The Local Lantern aggregates headlines from local publishers. All content belongs to{' '}
                        {current.source_name ? <strong>{current.source_name}</strong> : 'the original publisher'}.
                    </Typography>
                </Box>
            </Box>

            {current ? (
                <ShareDialog
                    contentType="article"
                    open={shareDialogOpen}
                    onClose={() => setShareDialogOpen(false)}
                    article={current}
                    viewer={viewer}
                    sx={{ zIndex: 100001 }}
                />
            ) : null}
        </Box>
    );
}

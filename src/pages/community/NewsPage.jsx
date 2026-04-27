// src/pages/community/NewsPage.jsx
//
// v8 Slice 3 — Full-page route for news articles: /news/article/:id
//
// ═══════════════════════════════════════════════════════════════════════════
// Design
// ═══════════════════════════════════════════════════════════════════════════
//
// NewsPage is intentionally thin. The actual article UI (hero image,
// headline, ActionBar, comments) lives in CommunityNewsDetailPanel — the
// same component rendered in the community right-panel / mobile drawer.
// Keeping one component power both surfaces means:
//
//   - One place to style the article layout
//   - One place to wire engagement (ActionBar + RedditComments)
//   - Zero risk of the full-page view drifting from the panel view
//
// NewsPage's job is just to:
//
//   1. Read `:id` from the URL (via react-router's useParams)
//   2. Accept an optional `location.state.article` hand-off for the fast
//      path when navigation comes from a news list (no refetch flicker)
//   3. Provide a sensible back handler (history back, fall back to /community)
//   4. Wrap the panel in a max-width page chrome
//
// ═══════════════════════════════════════════════════════════════════════════
// Routing
// ═══════════════════════════════════════════════════════════════════════════
//
// Wire this page into your router (the file that routes PostPage) alongside
// the existing post route. Add ONE line:
//
//   <Route path="/news/article/:id" element={<NewsPage />} />
//
// See SETUP_v8.md for the full routing snippet.
//
// ═══════════════════════════════════════════════════════════════════════════

import React, { useCallback, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

import CommunityNewsDetailPanel from './components/CommunityNewsDetailPanel';
import useNewsArticleDetail from '../community/components/useNewsArticleDetail';

export default function NewsPage() {
    const theme = useTheme();
    const params = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // Support /news/article/:id — and for maximum forgiveness, also :articleId
    // and :article_id in case the route declaration uses a different param name.
    const articleId = params?.id ?? params?.articleId ?? params?.article_id ?? null;

    // Fast-path: if we navigated here via <Link state={{ article }}>, use that
    // as the seed so the page paints immediately.
    const stateArticle = location?.state?.article || null;

    // Slice 2d: notification-click plumbing.
    //
    // When a user clicks a news-comment notification (reply / like / share),
    // NotificationsPage + Header push these keys into location.state so we
    // can scroll the thread to the target comment and highlight it on
    // arrival — same UX the post page gives for post comments.
    //
    // RedditComments already consumes both props directly; we just need to
    // read them here and plumb them through CommunityNewsDetailPanel.
    const scrollToCommentId = location?.state?.scrollToCommentId ?? null;
    const highlightCommentId = location?.state?.highlightCommentId ?? null;

    // Viewer-aware fetch. Seeds from stateArticle; replaces with enriched
    // payload once it lands.
    const { article, loading, error } = useNewsArticleDetail({
        articleId,
        initialArticle: stateArticle && stateArticle.id === articleId ? stateArticle : null,
    });

    const handleBack = useCallback(() => {
        // If there's history to go back to, go back; otherwise land on
        // the community page (News mode).
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/community', { state: { mode: 'news' } });
        }
    }, [navigate]);

    // Empty-state UI for the "no id in URL" case (shouldn't happen with a
    // well-defined route, but defensive)
    const emptyState = useMemo(() => (
        <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
            <Box
                sx={{
                    textAlign: 'center',
                    py: 6,
                    px: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                }}
            >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Article not found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    This article may have been removed or the link is invalid.
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<ArrowBackRoundedIcon />}
                    onClick={handleBack}
                    sx={{ textTransform: 'none' }}
                >
                    Back to news
                </Button>
            </Box>
        </Container>
    ), [handleBack, theme.palette.divider]);

    // No ID at all → empty state
    if (!articleId) return emptyState;

    // Loading shell — panel handles its own loading once it has a seed, but
    // if we have neither a seed nor a fetched article yet, show a spinner.
    if (loading && !article) {
        return (
            <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress size={32} />
                </Box>
            </Container>
        );
    }

    // Fetch succeeded but nothing came back (or explicit error) → not found
    if ((!loading && !article) || error) {
        return emptyState;
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: theme.palette.mode === 'dark'
                    ? theme.palette.background.default
                    : theme.palette.grey[50],
            }}
        >
            <Container
                maxWidth="md"
                disableGutters
                sx={{
                    // On desktop, use a card-like floating container for the panel.
                    // On mobile, let the panel fill the viewport (no side gutters).
                    py: { xs: 0, md: 2 },
                    px: { xs: 0, md: 2 },
                }}
            >
                <Box
                    sx={{
                        bgcolor: 'background.paper',
                        border: { xs: 'none', md: `1px solid ${theme.palette.divider}` },
                        borderRadius: { xs: 0, md: 2 },
                        overflow: 'hidden',
                        // The panel uses flex column + height: 100% internally,
                        // so give it a concrete height to fill.
                        minHeight: { xs: '100vh', md: 'calc(100vh - 32px)' },
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <CommunityNewsDetailPanel
                        article={article}
                        onBack={handleBack}
                        showBackButton
                        scrollToCommentId={scrollToCommentId}
                        highlightCommentId={highlightCommentId}
                    />
                </Box>
            </Container>
        </Box>
    );
}

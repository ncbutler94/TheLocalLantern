// src/pages/community/NewsList.jsx
//
// Container for NewsArticleCard:
//   • Desktop/tablet: 3-column responsive CSS grid
//       xs: 1fr (mobile — stacked)
//       sm: 1fr 1fr (2-col tablet)
//       lg: 1fr 1fr 1fr (3-col desktop)
//     This mirrors MarketplacePage's grid exactly so News and Marketplace
//     tabs feel structurally identical when the user swaps between them.
//
//   • Mobile (xs): cards switch themselves to the compact horizontal row
//     layout (handled inside NewsArticleCard). The grid wrapper still works —
//     a single column of full-width row cards, with a light gray separator
//     line handled by the card's own borderBottom.
//
// Props (kept stable — CommunityPanel is already calling this exact shape):
//   - articles:           array of article objects (from useNewsArticles)
//   - loading:            boolean — show skeleton grid
//   - selectedArticleId:  id of the currently-selected article (highlighted)
//   - onSelectArticle:    (article) => void
//   - emptyMessage:       string shown when not loading and articles is empty

import React from 'react';
import PropTypes from 'prop-types';
import { alpha } from '@mui/material/styles';
import { Box, Skeleton, Stack, Typography } from '@mui/material';
import NewspaperRoundedIcon from '@mui/icons-material/NewspaperRounded';

import NewsArticleCard from './NewsArticleCard';

/* ─────────────────────────────── skeletons ─────────────────────────────── */

function GridCardSkeleton() {
    return (
        <Box
            sx={(t) => ({
                display: { xs: 'none', sm: 'flex' },
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                borderRadius: '14px',
                border: `1px solid ${alpha(t.palette.text.primary, 0.06)}`,
                bgcolor: t.palette.background.paper,
                overflow: 'hidden',
            })}
        >
            <Skeleton
                variant="rectangular"
                sx={{ width: '100%', aspectRatio: '4 / 3', flexShrink: 0 }}
                animation="wave"
            />
            <Box sx={{ px: 1.75, pt: 1.25, pb: 1.5, flex: 1 }}>
                <Skeleton variant="text" sx={{ fontSize: 15, width: '92%' }} animation="wave" />
                <Skeleton variant="text" sx={{ fontSize: 15, width: '75%' }} animation="wave" />
                <Skeleton
                    variant="text"
                    sx={{ fontSize: 12, width: '60%', mt: 1 }}
                    animation="wave"
                />
            </Box>
        </Box>
    );
}

function RowSkeleton() {
    return (
        <Box
            sx={(t) => ({
                display: { xs: 'flex', sm: 'none' },
                alignItems: 'stretch',
                gap: 1.25,
                px: 1.5,
                py: 1.25,
                bgcolor: t.palette.background.paper,
                borderBottom: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
            })}
        >
            <Skeleton
                variant="rounded"
                sx={{ width: 84, height: 84, flexShrink: 0, borderRadius: '10px' }}
                animation="wave"
            />
            <Box sx={{ flex: 1, minWidth: 0, py: 0.1 }}>
                <Skeleton variant="text" sx={{ fontSize: 10, width: '40%' }} animation="wave" />
                <Skeleton variant="text" sx={{ fontSize: 13, width: '95%' }} animation="wave" />
                <Skeleton variant="text" sx={{ fontSize: 13, width: '80%' }} animation="wave" />
                <Skeleton variant="text" sx={{ fontSize: 10, width: '35%' }} animation="wave" />
            </Box>
        </Box>
    );
}

/* ─────────────────────────────── grid wrapper ─────────────────────────────── */

const gridSx = {
    display: 'grid',
    gridTemplateColumns: {
        xs: '1fr',
        sm: '1fr 1fr',
        lg: '1fr 1fr 1fr',
    },
    // No gap on mobile (row cards sit flush and handle their own divider);
    // small gap on sm+ so the grid cards breathe.
    gap: { xs: 0, sm: 2 },
    // Bottom padding so the last card's shadow doesn't clip in sm+; harmless on xs.
    pb: { xs: 0, sm: 1 },
};

/* ─────────────────────────────── component ─────────────────────────────── */

export default function NewsList({
                                     articles = [],
                                     loading = false,
                                     selectedArticleId = null,
                                     onSelectArticle = null,
                                     emptyMessage = 'No news articles to show.',
                                 }) {
    // ── Loading state ──
    // Show skeletons in both layouts so the list feels responsive to the viewport
    // without a flash of blank content on resize.
    if (loading && (!articles || articles.length === 0)) {
        return (
            <Box sx={gridSx} aria-busy="true" aria-label="Loading news articles">
                {Array.from({ length: 6 }).map((_, i) => (
                    <React.Fragment key={`sk-${i}`}>
                        <GridCardSkeleton />
                        <RowSkeleton />
                    </React.Fragment>
                ))}
            </Box>
        );
    }

    // ── Empty state ──
    // Slice 2f: match the "No Posts Found" empty-state in PostList.jsx
    // exactly — same Stack-spacing layout, same badge (64×64, primary-tinted
    // at 0.08, icon 32 in primary.main), same heading (17px / fontWeight 950),
    // same subtitle (body2 at 380-max-width). Source of truth:
    // PostList.jsx ≈ lines 4222-4241.
    //
    // The subtitle is synthesized from the caller's `emptyMessage` so the
    // existing call-site API stays unchanged: we split on the first
    // sentence-ending period so "No news articles match …. Try broadening
    // your filters." renders as headline + subtitle. Single-sentence
    // messages render as headline only.
    if (!articles || articles.length === 0) {
        const msg = String(emptyMessage || '').trim();
        const firstPeriodIdx = msg.indexOf('.');
        const hasSubtitle = firstPeriodIdx !== -1 && firstPeriodIdx < msg.length - 1;
        const headline = hasSubtitle ? msg.slice(0, firstPeriodIdx).trim() : msg;
        const subtitle = hasSubtitle ? msg.slice(firstPeriodIdx + 1).trim() : '';

        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    px: 2,
                    // Fill the list viewport vertically so the block centers
                    // in the available space, matching PostList's empty state
                    // (which uses position: absolute + inset: 0 — same
                    // end result, different mechanism). `flex: 1` lets us
                    // claim remaining space inside a flex-column parent;
                    // `height: '100%'` + `minHeight` cover non-flex parents.
                    flex: 1,
                    height: '100%',
                    minHeight: { xs: 320, sm: 480 },
                }}
                role="status"
            >
                <Stack spacing={1.5} alignItems="center">
                    <Box
                        sx={(t) => ({
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            bgcolor: alpha(t.palette.primary.main, 0.08),
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 0.5,
                        })}
                    >
                        <NewspaperRoundedIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                    </Box>
                    <Typography sx={{ fontWeight: 950, fontSize: 17 }}>
                        {headline || 'No news articles to show'}
                    </Typography>
                    {subtitle ? (
                        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 380 }}>
                            {subtitle}
                        </Typography>
                    ) : null}
                </Stack>
            </Box>
        );
    }

    // ── Populated state ──
    return (
        <Box sx={gridSx} role="list" aria-label="News articles">
            {articles.map((article) => {
                const id = article?.id ?? article?.article_id ?? article?.guid ?? null;
                const key = id != null ? String(id) : Math.random().toString(36).slice(2);
                const isSelected =
                    selectedArticleId != null &&
                    id != null &&
                    String(selectedArticleId) === String(id);

                return (
                    <Box
                        key={key}
                        role="listitem"
                        sx={{
                            // Each grid slot fills; the card stretches inside it.
                            display: 'flex',
                            // On mobile, the row card handles its own edge-to-edge styling.
                        }}
                    >
                        <NewsArticleCard
                            article={article}
                            selected={isSelected}
                            onSelect={onSelectArticle || undefined}
                        />
                    </Box>
                );
            })}
        </Box>
    );
}

NewsList.propTypes = {
    articles: PropTypes.array,
    loading: PropTypes.bool,
    selectedArticleId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onSelectArticle: PropTypes.func,
    emptyMessage: PropTypes.string,
};

// src/pages/community/NewsArticleCard.jsx
//
// News article card with two layouts:
//   • Desktop (sm+): hero-image-top card (4:3 photo, title + publisher + meta below).
//                    Designed to live in the 3-column grid on CommunityPanel,
//                    dimensions mirror MarketplacePage ListingCard so cards align
//                    when users alternate between News and Marketplace tabs.
//   • Mobile (xs):   compact horizontal row (84×84 thumbnail left, text right).
//                    Edge-to-edge with a bottom divider to match PostList feel.
//
// Engagement surface
// ──────────────────
// Slice 1 of the news revamp adds:
//   • A bookmark toggle in the top-right corner (hero image overlay on desktop,
//     thumbnail overlay on mobile). Stops propagation so tapping it doesn't
//     also fire card selection.
//   • A lightweight engagement footprint at the bottom of the card when the
//     article has any likes/comments/reposts. Purely informational here — the
//     full ActionBar lives in the detail panel. This lets users see social
//     signal without opening the article.
//
// Bookmarks are backed by useNewsBookmark (localStorage today; backend in slice 2).

import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { alpha } from '@mui/material/styles';
import { Box, Card, IconButton, Tooltip, Typography } from '@mui/material';
import NewspaperRoundedIcon from '@mui/icons-material/NewspaperRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import BookmarkRoundedIcon from '@mui/icons-material/BookmarkRounded';
import BookmarkBorderRoundedIcon from '@mui/icons-material/BookmarkBorderRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import RepeatRoundedIcon from '@mui/icons-material/RepeatRounded';

import useNewsBookmark from './useNewsBookmark';

/* ─────────────────────────────── helpers ─────────────────────────────── */

/**
 * News articles come from several RSS parsers; field names vary slightly.
 * Read with fallbacks so the card is resilient if the hook shape drifts.
 */
function pickField(article, ...keys) {
    if (!article) return null;
    for (const k of keys) {
        const v = article[k];
        if (v !== undefined && v !== null && String(v).trim() !== '') return v;
    }
    return null;
}

function getThumbnail(article) {
    return pickField(
        article,
        'thumbnail_url',
        'image_url',
        'hero_image_url',
        'hero_image',
        'image',
        'thumbnail',
        'og_image',
        'media_url'
    );
}

function getPublisher(article) {
    return (
        pickField(article, 'source_name', 'feed_name', 'publisher', 'source', 'site_name') ||
        'News'
    );
}

function getLocation(article) {
    const city = pickField(article, 'al_city', 'city');
    const county = pickField(article, 'al_county', 'county');
    if (city && county) return `${city}, ${county} Co.`;
    if (city) return city;
    if (county) return `${county} County`;
    return null;
}

function getCategory(article) {
    return pickField(article, 'canonical_category', 'primary_category', 'category', 'section');
}

function getPublishedAt(article) {
    return pickField(article, 'published_at', 'pub_date', 'pubDate', 'published', 'created_at');
}

function getArticleId(article) {
    return pickField(article, 'id', 'article_id', 'guid');
}

function getCounts(article) {
    const likes = Number(pickField(article, 'likes_count', 'like_count') ?? 0) || 0;
    const comments = Number(pickField(article, 'comments_count', 'comment_count') ?? 0) || 0;
    const reposts = Number(pickField(article, 'reposts_count', 'repost_count') ?? 0) || 0;
    return { likes, comments, reposts };
}

function formatRelativeTime(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.valueOf())) return '';
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    // Older than a week: short date
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/* ─────────────────────────────── bookmark button ─────────────────────────────── */

/**
 * Compact bookmark toggle. Stops event propagation so clicks don't also
 * trigger the card's onSelect. Used in both layouts.
 */
function BookmarkButton({ articleId, variant = 'overlay', size = 'small' }) {
    const { isBookmarked, toggle } = useNewsBookmark(articleId);

    const handleClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        toggle();
    };
    const handleKey = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.stopPropagation();
            // Let the IconButton handle it
        }
    };

    const iconSize = size === 'small' ? 18 : 20;

    if (variant === 'overlay') {
        return (
            <Tooltip title={isBookmarked ? 'Remove bookmark' : 'Bookmark'} enterDelay={400}>
                <IconButton
                    size="small"
                    onClick={handleClick}
                    onKeyDown={handleKey}
                    aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
                    aria-pressed={isBookmarked}
                    sx={(t) => ({
                        width: 32,
                        height: 32,
                        bgcolor: alpha(t.palette.common.black, 0.55),
                        backdropFilter: 'blur(6px)',
                        color: isBookmarked ? t.palette.secondary.main : t.palette.common.white,
                        transition: 'background-color 160ms ease, color 160ms ease, transform 160ms ease',
                        '&:hover': {
                            bgcolor: alpha(t.palette.common.black, 0.72),
                            transform: 'scale(1.06)',
                        },
                    })}
                >
                    {isBookmarked
                        ? <BookmarkRoundedIcon sx={{ fontSize: iconSize }} />
                        : <BookmarkBorderRoundedIcon sx={{ fontSize: iconSize }} />}
                </IconButton>
            </Tooltip>
        );
    }

    // Inline variant (for mobile row — tucked top-right of the thumbnail box)
    return (
        <Tooltip title={isBookmarked ? 'Remove bookmark' : 'Bookmark'} enterDelay={400}>
            <IconButton
                size="small"
                onClick={handleClick}
                onKeyDown={handleKey}
                aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
                aria-pressed={isBookmarked}
                sx={(t) => ({
                    width: 26,
                    height: 26,
                    bgcolor: alpha(t.palette.common.black, 0.55),
                    color: isBookmarked ? t.palette.secondary.main : t.palette.common.white,
                    '&:hover': { bgcolor: alpha(t.palette.common.black, 0.72) },
                })}
            >
                {isBookmarked
                    ? <BookmarkRoundedIcon sx={{ fontSize: 15 }} />
                    : <BookmarkBorderRoundedIcon sx={{ fontSize: 15 }} />}
            </IconButton>
        </Tooltip>
    );
}

BookmarkButton.propTypes = {
    articleId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    variant: PropTypes.oneOf(['overlay', 'inline']),
    size: PropTypes.oneOf(['small', 'medium']),
};

/* ─────────────────────────────── count chip ─────────────────────────────── */

function CountChip({ icon: Icon, value, label, accent = false }) {
    if (!value || value <= 0) return null;
    return (
        <Tooltip title={`${value} ${label}`} enterDelay={600}>
            <Box
                component="span"
                sx={(t) => ({
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.3,
                    color: accent ? 'primary.main' : 'text.secondary',
                })}
                aria-label={`${value} ${label}`}
            >
                <Icon sx={{ fontSize: 13 }} />
                <Typography
                    component="span"
                    sx={{ fontSize: 11, fontWeight: 700, lineHeight: 1 }}
                >
                    {value > 999 ? `${(value / 1000).toFixed(1)}k` : value}
                </Typography>
            </Box>
        </Tooltip>
    );
}

CountChip.propTypes = {
    icon: PropTypes.elementType.isRequired,
    value: PropTypes.number,
    label: PropTypes.string.isRequired,
    accent: PropTypes.bool,
};

/* ─────────────────────────────── component ─────────────────────────────── */

export default function NewsArticleCard({
                                            article,
                                            selected = false,
                                            onSelect = null,
                                            // `layout` forces a specific layout when needed ('grid' | 'row').
                                            // Default ('auto') picks based on breakpoint via sx.
                                            layout = 'auto',
                                        }) {
    const [imgError, setImgError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const title = pickField(article, 'title', 'headline') || 'Untitled';
    const summary = pickField(article, 'summary', 'excerpt', 'description', 'snippet') || '';
    const thumb = !imgError ? getThumbnail(article) : null;
    const publisher = getPublisher(article);
    const location = getLocation(article);
    const category = getCategory(article);
    const articleId = getArticleId(article);
    const counts = useMemo(() => getCounts(article), [article]);
    const relTime = useMemo(() => formatRelativeTime(getPublishedAt(article)), [article]);

    const hasAnyCount = counts.likes > 0 || counts.comments > 0 || counts.reposts > 0;

    const handleClick = () => {
        if (typeof onSelect === 'function') onSelect(article);
    };
    const handleKey = (e) => {
        if (!onSelect) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(article);
        }
    };

    if (!article) return null;

    // Responsive visibility: render both layouts, hide one per breakpoint.
    // This avoids a remount-on-resize jitter that a useMediaQuery switch would cause.
    const showGrid = layout === 'grid' || layout === 'auto';
    const showRow = layout === 'row' || layout === 'auto';

    return (
        <>
            {/* ═══════════ DESKTOP / TABLET — hero-image-top grid card ═══════════ */}
            {showGrid && (
                <Card
                    elevation={0}
                    onClick={handleClick}
                    onKeyDown={handleKey}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    role={onSelect ? 'button' : undefined}
                    tabIndex={onSelect ? 0 : undefined}
                    aria-pressed={onSelect ? selected : undefined}
                    aria-label={`News article: ${title}${publisher ? ` from ${publisher}` : ''}`}
                    sx={(t) => ({
                        // Hide on mobile — row layout takes over below sm.
                        display: { xs: layout === 'grid' ? 'flex' : 'none', sm: 'flex' },
                        flexDirection: 'column',
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        borderRadius: { xs: 0, sm: '14px' },
                        border: {
                            xs: 'none',
                            sm: `1px solid ${
                                selected
                                    ? alpha(t.palette.secondary.main, 0.55)
                                    : alpha(t.palette.text.primary, 0.08)
                            }`,
                        },
                        bgcolor: t.palette.background.paper,
                        overflow: 'hidden',
                        cursor: onSelect ? 'pointer' : 'default',
                        boxShadow: {
                            xs: 'none',
                            sm: selected
                                ? (t.custom?.shadows?.md || '0 8px 24px rgba(0,0,0,0.10)')
                                : (t.custom?.shadows?.xs || '0 1px 3px rgba(0,0,0,0.04)'),
                        },
                        transition: `box-shadow 280ms cubic-bezier(0.4,0,0.2,1), border-color 180ms ease, transform 280ms cubic-bezier(0.4,0,0.2,1)`,
                        transform: 'translateY(0)',
                        ...(isHovered && !selected
                            ? {
                                boxShadow: {
                                    xs: 'none',
                                    sm: `0 12px 36px ${alpha(t.palette.text.primary, 0.12)}`,
                                },
                            }
                            : {}),
                        '&:focus-visible': {
                            outline: `2px solid ${alpha(t.palette.primary.main, 0.45)}`,
                            outlineOffset: 2,
                        },
                    })}
                >
                    {/* ── Hero image (4:3) ── */}
                    <Box
                        sx={(t) => ({
                            position: 'relative',
                            aspectRatio: '4 / 3',
                            overflow: 'hidden',
                            bgcolor: alpha(t.palette.secondary.main, 0.06),
                            flexShrink: 0,
                        })}
                    >
                        {thumb ? (
                            <Box
                                component="img"
                                src={thumb}
                                alt=""
                                loading="lazy"
                                onError={() => setImgError(true)}
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                    transition: 'transform 500ms cubic-bezier(0.4,0,0.2,1)',
                                    transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                                }}
                            />
                        ) : (
                            <Box
                                sx={(t) => ({
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: alpha(t.palette.primary.main, 0.06),
                                    color: alpha(t.palette.primary.main, 0.5),
                                })}
                            >
                                <NewspaperRoundedIcon sx={{ fontSize: 48 }} />
                            </Box>
                        )}

                        {/* Publisher badge — bottom-left overlay on image */}
                        <Box
                            sx={(t) => ({
                                position: 'absolute',
                                left: 10,
                                bottom: 10,
                                px: 1,
                                py: 0.4,
                                borderRadius: 999,
                                bgcolor: alpha(t.palette.common.black, 0.72),
                                backdropFilter: 'blur(6px)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                maxWidth: 'calc(100% - 20px)',
                            })}
                        >
                            <NewspaperRoundedIcon
                                sx={{ fontSize: 12, color: 'common.white', flexShrink: 0 }}
                            />
                            <Typography
                                noWrap
                                sx={{
                                    fontSize: 10.5,
                                    fontWeight: 800,
                                    color: 'common.white',
                                    letterSpacing: 0.2,
                                    lineHeight: 1,
                                }}
                            >
                                {publisher}
                            </Typography>
                        </Box>

                        {/* Category chip — top-left overlay (if present) */}
                        {category ? (
                            <Box
                                sx={(t) => ({
                                    position: 'absolute',
                                    top: 10,
                                    left: 10,
                                    px: 0.9,
                                    py: 0.35,
                                    borderRadius: 999,
                                    bgcolor: alpha(t.palette.background.paper, 0.95),
                                    border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                                })}
                            >
                                <Typography
                                    sx={{
                                        fontSize: 10,
                                        fontWeight: 800,
                                        color: 'primary.main',
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.5,
                                        lineHeight: 1,
                                    }}
                                >
                                    {String(category).replace(/_/g, ' ')}
                                </Typography>
                            </Box>
                        ) : null}

                        {/* Bookmark button — top-right overlay */}
                        {articleId != null && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    zIndex: 2,
                                }}
                            >
                                <BookmarkButton articleId={articleId} variant="overlay" />
                            </Box>
                        )}
                    </Box>

                    {/* ── Body ── */}
                    <Box
                        sx={{
                            px: 1.75,
                            pt: 1.25,
                            pb: 1.5,
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 0,
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: 15,
                                fontWeight: 800,
                                lineHeight: 1.3,
                                // Clamp to 3 lines so cards stay tidy in the grid.
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                mb: summary ? 0.75 : 1,
                            }}
                        >
                            {title}
                        </Typography>

                        {summary ? (
                            <Typography
                                sx={{
                                    fontSize: 12.5,
                                    color: 'text.secondary',
                                    lineHeight: 1.45,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    mb: 1,
                                }}
                            >
                                {summary}
                            </Typography>
                        ) : null}

                        {/* Meta row: location + time — pushed to bottom */}
                        <Box
                            sx={{
                                mt: 'auto',
                                pt: 0.5,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                flexWrap: 'wrap',
                            }}
                        >
                            {location ? (
                                <Box
                                    sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 0.35,
                                        minWidth: 0,
                                    }}
                                >
                                    <LocationOnRoundedIcon
                                        sx={{ fontSize: 13, color: 'primary.main', flexShrink: 0 }}
                                    />
                                    <Typography
                                        noWrap
                                        sx={{
                                            fontSize: 11.5,
                                            fontWeight: 700,
                                            color: 'primary.main',
                                            lineHeight: 1.2,
                                            minWidth: 0,
                                        }}
                                    >
                                        {location}
                                    </Typography>
                                </Box>
                            ) : null}

                            {relTime ? (
                                <Box
                                    sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 0.3,
                                        ml: location ? 'auto' : 0,
                                    }}
                                >
                                    <AccessTimeRoundedIcon
                                        sx={{ fontSize: 12, color: 'text.secondary' }}
                                    />
                                    <Typography
                                        sx={{
                                            fontSize: 11,
                                            color: 'text.secondary',
                                            lineHeight: 1.2,
                                        }}
                                    >
                                        {relTime}
                                    </Typography>
                                </Box>
                            ) : null}
                        </Box>

                        {/* Engagement footprint — only when article has signal */}
                        {hasAnyCount && (
                            <Box
                                sx={(t) => ({
                                    mt: 0.75,
                                    pt: 0.75,
                                    borderTop: `1px dashed ${alpha(t.palette.text.primary, 0.08)}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    flexWrap: 'wrap',
                                })}
                            >
                                <CountChip
                                    icon={FavoriteRoundedIcon}
                                    value={counts.likes}
                                    label="likes"
                                />
                                <CountChip
                                    icon={ChatBubbleOutlineRoundedIcon}
                                    value={counts.comments}
                                    label="comments"
                                    accent
                                />
                                <CountChip
                                    icon={RepeatRoundedIcon}
                                    value={counts.reposts}
                                    label="reposts"
                                />
                            </Box>
                        )}
                    </Box>
                </Card>
            )}

            {/* ═══════════ MOBILE — compact horizontal row ═══════════ */}
            {showRow && (
                <Box
                    onClick={handleClick}
                    onKeyDown={handleKey}
                    role={onSelect ? 'button' : undefined}
                    tabIndex={onSelect ? 0 : undefined}
                    aria-pressed={onSelect ? selected : undefined}
                    aria-label={`News article: ${title}${publisher ? ` from ${publisher}` : ''}`}
                    sx={(t) => ({
                        // Hide on sm+ — grid card takes over.
                        display: { xs: layout === 'row' ? 'flex' : 'flex', sm: 'none' },
                        alignItems: 'stretch',
                        gap: 1.25,
                        px: 1.5,
                        py: 1.25,
                        bgcolor: selected
                            ? alpha(t.palette.secondary.main, 0.06)
                            : t.palette.background.paper,
                        borderBottom: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                        cursor: onSelect ? 'pointer' : 'default',
                        transition: 'background-color 140ms ease',
                        '&:active': onSelect
                            ? { bgcolor: alpha(t.palette.text.primary, 0.04) }
                            : undefined,
                        '&:focus-visible': {
                            outline: `2px solid ${alpha(t.palette.primary.main, 0.45)}`,
                            outlineOffset: -2,
                        },
                    })}
                >
                    {/* Thumbnail */}
                    <Box
                        sx={(t) => ({
                            position: 'relative',
                            width: 84,
                            height: 84,
                            flexShrink: 0,
                            borderRadius: '10px',
                            overflow: 'hidden',
                            bgcolor: alpha(t.palette.secondary.main, 0.08),
                        })}
                    >
                        {thumb ? (
                            <Box
                                component="img"
                                src={thumb}
                                alt=""
                                loading="lazy"
                                onError={() => setImgError(true)}
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                }}
                            />
                        ) : (
                            <Box
                                sx={(t) => ({
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: alpha(t.palette.primary.main, 0.55),
                                })}
                            >
                                <NewspaperRoundedIcon sx={{ fontSize: 30 }} />
                            </Box>
                        )}

                        {/* Bookmark button — top-right overlay on thumb */}
                        {articleId != null && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    zIndex: 2,
                                }}
                            >
                                <BookmarkButton articleId={articleId} variant="inline" />
                            </Box>
                        )}
                    </Box>

                    {/* Text block */}
                    <Box
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            py: 0.1,
                        }}
                    >
                        {/* Publisher + category */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.6,
                                mb: 0.4,
                                flexWrap: 'nowrap',
                                minWidth: 0,
                            }}
                        >
                            <Typography
                                noWrap
                                sx={{
                                    fontSize: 10.5,
                                    fontWeight: 800,
                                    color: 'primary.main',
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.4,
                                    lineHeight: 1,
                                    flexShrink: 1,
                                    minWidth: 0,
                                }}
                            >
                                {publisher}
                            </Typography>
                            {category ? (
                                <Box
                                    component="span"
                                    sx={(t) => ({
                                        fontSize: 9.5,
                                        fontWeight: 700,
                                        color: 'text.secondary',
                                        px: 0.55,
                                        py: 0.1,
                                        borderRadius: 999,
                                        bgcolor: alpha(t.palette.text.primary, 0.06),
                                        textTransform: 'capitalize',
                                        lineHeight: 1.4,
                                        flexShrink: 0,
                                    })}
                                >
                                    {String(category).replace(/_/g, ' ')}
                                </Box>
                            ) : null}
                        </Box>

                        {/* Headline */}
                        <Typography
                            sx={{
                                fontSize: 13.5,
                                fontWeight: 800,
                                lineHeight: 1.3,
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                flex: 1,
                            }}
                        >
                            {title}
                        </Typography>

                        {/* Meta row: location, time, engagement counts */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.75,
                                mt: 0.4,
                                flexWrap: 'nowrap',
                                minWidth: 0,
                            }}
                        >
                            {location ? (
                                <Box
                                    sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 0.25,
                                        minWidth: 0,
                                        flexShrink: 1,
                                        overflow: 'hidden',
                                    }}
                                >
                                    <LocationOnRoundedIcon
                                        sx={{
                                            fontSize: 11,
                                            color: 'primary.main',
                                            flexShrink: 0,
                                        }}
                                    />
                                    <Typography
                                        noWrap
                                        sx={{
                                            fontSize: 10.5,
                                            fontWeight: 700,
                                            color: 'primary.main',
                                            lineHeight: 1.2,
                                            minWidth: 0,
                                        }}
                                    >
                                        {location}
                                    </Typography>
                                </Box>
                            ) : null}

                            {/* Mobile counts — keep just the most useful one (comments)
                                to not crowd the narrow row. */}
                            {counts.comments > 0 && (
                                <Box
                                    sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 0.2,
                                        color: 'primary.main',
                                        flexShrink: 0,
                                    }}
                                >
                                    <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 10.5 }} />
                                    <Typography
                                        sx={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            color: 'primary.main',
                                            lineHeight: 1.2,
                                        }}
                                    >
                                        {counts.comments > 999 ? `${(counts.comments / 1000).toFixed(1)}k` : counts.comments}
                                    </Typography>
                                </Box>
                            )}

                            {relTime ? (
                                <Typography
                                    sx={{
                                        fontSize: 10.5,
                                        color: 'text.secondary',
                                        lineHeight: 1.2,
                                        ml: 'auto',
                                        flexShrink: 0,
                                    }}
                                >
                                    {relTime}
                                </Typography>
                            ) : null}
                        </Box>
                    </Box>
                </Box>
            )}
        </>
    );
}

NewsArticleCard.propTypes = {
    article: PropTypes.object,
    selected: PropTypes.bool,
    onSelect: PropTypes.func,
    layout: PropTypes.oneOf(['auto', 'grid', 'row']),
};

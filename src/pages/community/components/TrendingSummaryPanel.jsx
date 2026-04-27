import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Box, Button, Paper, Skeleton, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import PersonSearchRoundedIcon from '@mui/icons-material/PersonSearchRounded';

import defaultAvatarSquare from '../../../assets/profile/default_avatar_square.png';

import announcementMarker from '../../../assets/mapMarkers/community/announcement-marker.png';
import discussionMarker from '../../../assets/mapMarkers/community/discussion-marker.png';
import lostFoundMarker from '../../../assets/mapMarkers/community/lost-and-found-marker.png';
import safetyAlertMarker from '../../../assets/mapMarkers/community/public-safety-alert-marker.png';
import recommendationsMarker from '../../../assets/mapMarkers/community/recommendations-marker.png';
import volunteerHelpMarker from '../../../assets/mapMarkers/community/help-requests-marker.png';
import communityMarker from '../../../assets/mapMarkers/community/community-marker.png';

/**
 * TrendingSummaryPanel
 * --------------------
 * Right-panel Trending tab content (Community feed only).
 *
 * UPDATE: Added polls category support (marker + singularize).
 */

const MAX_TRENDING_ROWS = 3;

function singularize(noun) {
    const s = String(noun || '').trim();
    if (!s) return 'post';
    // Common irregulars / custom nouns
    const lower = s.toLowerCase();
    if (lower === 'people') return 'person';
    if (lower === 'posts') return 'post';
    if (lower === 'discussions') return 'discussion';
    if (lower === 'announcements') return 'announcement';
    if (lower === 'alerts') return 'alert';
    if (lower === 'items') return 'item';
    if (lower === 'requests') return 'request';
    if (lower === 'volunteers') return 'volunteer';
    if (lower === 'polls') return 'poll';
    // Simple fallback: drop a trailing 's'
    return s.endsWith('s') ? s.slice(0, -1) : s;
}

function getTrendingMarkerForCategory(slug) {
    const s = String(slug || '').toLowerCase();
    if (s === 'announcement' || s === 'announcements') return announcementMarker;
    if (s === 'discussion' || s === 'community-chat') return discussionMarker;
    if (s === 'lost-and-found' || s === 'lost-found') return lostFoundMarker;
    if (s === 'public-safety-alerts') return safetyAlertMarker;
    if (s === 'recommendations' || s === 'tips' || s === 'recommendations-tips') return recommendationsMarker;
    if (s === 'help-requests' || s === 'volunteers' || s === 'volunteer-requests' || s === 'volunteer-help-requests')
        return volunteerHelpMarker;
    if (s === 'poll' || s === 'polls') return communityMarker;
    return communityMarker;
}

export default function TrendingSummaryPanel({
                                                 trendingWindow = '48h',
                                                 trendSummary,
                                                 locationLabel,
                                                 trendingLoading,
                                                 categoryMeta,
                                                 onSelect,
                                                 showTrending = true,
                                                 showPeople = true,
                                                 people,
                                                 peopleLoading = false,
                                                 onViewAllPeople,
                                                 onOpenPerson,
                                             }) {
    const navigate = useNavigate();

    const rows = Array.isArray(trendSummary) ? trendSummary : [];
    const displayRows = rows.slice(0, MAX_TRENDING_ROWS);
    const loc = locationLabel || '';

    const peopleList = Array.isArray(people) ? people.slice(0, 3) : [];

    return (
        <Box
            sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                top: { xs: 0, md: 0 },
                overflowY: 'auto',
                p: { xs: 0.75, md: 1.25 },
            }}
        >
            {/* Trending section card */}
            {showTrending ? (
                <Paper
                    variant="outlined"
                    sx={(t) => ({
                        borderRadius: 3,
                        overflow: 'hidden',
                        borderColor: alpha(t.palette.primary.main, 0.12),
                        bgcolor: alpha(t.palette.background.paper, 0.78),
                        backgroundImage: `linear-gradient(180deg, ${alpha(t.palette.primary.main, 0.08)} 0%, transparent 70%)`,
                        boxShadow: `0 14px 44px ${alpha(t.palette.common.black, 0.06)}`,
                    })}
                >
                    {/* Header */}
                    <Box
                        sx={(t) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 1.25,
                            py: 1.1,
                            borderBottom: '1px solid',
                            borderColor: alpha(t.palette.primary.main, 0.10),
                            backdropFilter: 'saturate(140%) blur(8px)',
                        })}
                    >
                        <Box
                            sx={(t) => ({
                                width: 42,
                                height: 42,
                                borderRadius: 2.25,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                border: '1px solid',
                                borderColor: alpha(t.palette.primary.main, 0.14),
                                bgcolor: alpha(t.palette.primary.main, 0.06),
                                boxShadow: `0 10px 26px ${alpha(t.palette.common.black, 0.10)}`,
                            })}
                        >
                            <TrendingUpRoundedIcon sx={{ fontSize: 26, color: 'primary.main' }} />
                        </Box>

                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="h6" sx={{ fontWeight: 950, lineHeight: 1.05 }}>
                                Trending
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>
                                Last {trendingWindow}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Body */}
                    <Box sx={{ p: 1.25, pt: 1.1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {trendingLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <Paper
                                    key={`trend-skel-${i}`}
                                    variant="outlined"
                                    sx={(t) => ({
                                        borderRadius: 2,
                                        p: 1.25,
                                        borderColor: alpha(t.palette.primary.main, 0.12),
                                        bgcolor: alpha(t.palette.background.paper, 0.6),
                                    })}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                        <Skeleton variant="rounded" width={60} height={60} />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Skeleton variant="text" width="55%" />
                                            <Skeleton variant="text" width="35%" />
                                        </Box>
                                        <Skeleton variant="rounded" width={54} height={30} sx={{ borderRadius: 999 }} />
                                    </Box>
                                </Paper>
                            ))
                        ) : null}

                        {!trendingLoading && rows.length === 0 ? (
                            <Typography color="text.secondary" sx={{ px: 0.25, py: 0.5, fontWeight: 700 }}>
                                Nothing trending{loc ? ` in ${loc}` : ''} (last {trendingWindow}).
                            </Typography>
                        ) : null}

                        {!trendingLoading
                            ? displayRows.map((row, idx) => {
                                const slug = String(row?.category || '').toLowerCase();
                                const meta = (categoryMeta && categoryMeta[slug]) || { label: row?.label || slug, noun: 'posts' };
                                const nounPlural = meta.noun || 'posts';
                                const count = Number(row?.count || 0);
                                const noun = count === 1 ? singularize(nounPlural) : nounPlural;
                                const display = `${count} ${noun}${loc ? ` in ${loc}` : ''}`;
                                // We only highlight on hover (and not by default),
                                // so the first row does not appear "pre-selected".

                                return (
                                    <Paper
                                        key={`trend-summary-${slug || idx}`}
                                        variant="outlined"
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => onSelect?.(slug)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') onSelect?.(slug);
                                        }}
                                        sx={(t) => ({
                                            borderRadius: 2,
                                            p: 1.25,
                                            display: 'flex',
                                            gap: 1,
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            transition:
                                                `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}, border-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}, box-shadow ${t.custom.motion.base}ms ${t.custom.motion.ease}, transform ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                                            borderColor: alpha(t.palette.primary.main, 0.18),
                                            bgcolor: alpha(t.palette.background.paper, 0.45),
                                            position: 'relative',
                                            boxShadow: 'none',
                                            '&:hover': {
                                                bgcolor: alpha(t.palette.secondary.main, 0.07),
                                                borderColor: alpha(t.palette.secondary.main, 0.55),
                                                boxShadow: `0 12px 30px ${alpha(t.palette.common.black, 0.10)}`,
                                                transform: 'translateY(-1px)',
                                            },
                                            '&:hover::before': {
                                                backgroundColor: t.palette.secondary.main,
                                            },
                                            '&::before': {
                                                content: '""',
                                                position: 'absolute',
                                                left: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: 4,
                                                borderTopLeftRadius: 8,
                                                borderBottomLeftRadius: 8,
                                                backgroundColor: t.palette.primary.main,
                                            },
                                        })}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flex: 1, minWidth: 0 }}>
                                            <Box
                                                component="img"
                                                src={getTrendingMarkerForCategory(slug)}
                                                alt=""
                                                sx={{
                                                    width: { xs: 52, sm: 60 },
                                                    height: { xs: 52, sm: 60 },
                                                    flexShrink: 0,
                                                    borderRadius: 2,
                                                    objectFit: 'contain',
                                                    boxShadow: (t) => t.custom.shadows.md,
                                                    border: 'none',
                                                    bgcolor: 'transparent',
                                                    p: 0,
                                                }}
                                            />
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 950, lineHeight: 1.1 }}>
                                                    {meta.label}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>
                                                    {display}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Button
                                            type="button"
                                            variant="outlined"
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelect?.(slug);
                                            }}
                                            sx={(t) => ({
                                                fontWeight: 900,
                                                borderRadius: 999,
                                                borderColor: alpha(t.palette.primary.main, 0.22),
                                                color: t.palette.primary.main,
                                                backgroundColor: alpha(t.palette.primary.main, 0.02),
                                                '&:hover': {
                                                    borderColor: alpha(t.palette.secondary.main, 0.55),
                                                    backgroundColor: alpha(t.palette.secondary.main, 0.10),
                                                    color: t.palette.primary.dark,
                                                },
                                            })}
                                        >
                                            View
                                        </Button>
                                    </Paper>
                                );
                            })
                            : null}
                    </Box>
                </Paper>
            ) : null}



            {/* People you may know */}
            {showPeople ? (
                <Paper
                    variant="outlined"
                    sx={(t) => ({
                        mt: 1.5,
                        borderRadius: 3,
                        overflow: 'hidden',
                        borderColor: alpha(t.palette.primary.main, 0.12),
                        bgcolor: alpha(t.palette.background.paper, 0.7),
                        backgroundImage: `linear-gradient(180deg, ${alpha(t.palette.secondary.main, 0.10)} 0%, transparent 70%)`,
                    })}
                >
                    <Box
                        sx={(t) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 1.25,
                            py: 1.05,
                            borderBottom: '1px solid',
                            borderColor: alpha(t.palette.primary.main, 0.10),
                        })}
                    >
                        <Box
                            sx={(t) => ({
                                width: 36,
                                height: 36,
                                borderRadius: 2.1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                border: '1px solid',
                                borderColor: alpha(t.palette.primary.main, 0.14),
                                bgcolor: alpha(t.palette.primary.main, 0.06),
                            })}
                        >
                            <PersonSearchRoundedIcon sx={{ fontSize: 22, color: 'primary.main' }} />
                        </Box>

                        <Typography variant="subtitle1" sx={{ fontWeight: 950, lineHeight: 1.1 }}>
                            People you may know
                        </Typography>

                        <Box sx={{ flex: 1 }} />

                        <Button
                            type="button"
                            variant="text"
                            size="small"
                            onClick={() => {
                                try {
                                    onViewAllPeople?.({ openTab: 'people' });
                                } catch {
                                    // ignore
                                }
                                navigate('/social', { state: { socialTab: 'people' } });
                            }}
                            sx={(t) => ({
                                textTransform: 'none',
                                fontWeight: 950,
                                borderRadius: 999,
                                color: t.palette.primary.main,
                                '&:hover': { backgroundColor: alpha(t.palette.primary.main, 0.08) },
                            })}
                        >
                            View all
                        </Button>
                    </Box>

                    <Box
                        sx={{
                            p: 1.25,
                            pt: 1.1,
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: 'repeat(2, minmax(0, 1fr))',
                                sm: 'repeat(3, minmax(0, 1fr))',
                            },
                            gap: 1,
                        }}
                    >
                        {(peopleLoading ? Array.from({ length: 3 }) : peopleList).map((u, idx) => {
                            if (peopleLoading) {
                                return (
                                    <Paper
                                        key={`pyk-skel-${idx}`}
                                        variant="outlined"
                                        sx={{
                                            borderRadius: 2,
                                            p: 1.1,
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
                                            <Skeleton variant="rounded" width={80} height={80} sx={{ borderRadius: 1.25 }} />
                                            <Skeleton variant="text" width="80%" />
                                            <Skeleton variant="text" width="60%" />
                                        </Box>
                                    </Paper>
                                );
                            }

                            const name =
                                `${u?.first_name || ''} ${u?.last_name || ''}`.trim() ||
                                u?.display_name ||
                                u?.name ||
                                (u?.handle ? `@${u.handle}` : 'User');

                            const username = u?.handle || u?.username || '';
                            const avatar = u?.avatar_url || u?.profile_picture || '';
                            const avatarSrc = avatar || defaultAvatarSquare;

                            const locationText = u?.home_city
                                ? String(u.home_city)
                                : u?.home_county
                                    ? `${String(u.home_county)} County`.replace(/ County County$/, ' County')
                                    : '';

                            return (
                                <Paper
                                    key={`pyk-${u?.id ?? u?.public_id ?? username ?? idx}`}
                                    variant="outlined"
                                    onClick={() => onOpenPerson?.(u)}
                                    sx={{
                                        cursor: 'pointer',
                                        borderRadius: 2,
                                        p: 1.1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 0.85,
                                        bgcolor: (t) => t.palette.background.paper,
                                        backgroundImage: (t) =>
                                            `linear-gradient(180deg, ${alpha(t.palette.secondary.main, 0.10)} 0%, transparent 58%)`,
                                        borderColor: (t) => alpha(t.palette.primary.main, 0.14),
                                        boxShadow: 'none',
                                        transition: (t) => `border-color ${t.custom.motion.base}ms ${t.custom.motion.ease}, box-shadow ${t.custom.motion.base}ms ${t.custom.motion.ease}, transform ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                                        '&:hover': {
                                            borderColor: (t) => alpha(t.palette.secondary.main, 0.34),
                                            boxShadow: (t) => t.custom.shadows.md,
                                            transform: 'translateY(-1px)',
                                        },
                                    }}
                                >
                                    <Avatar
                                        src={avatarSrc}
                                        alt={name}
                                        variant="square"
                                        sx={{
                                            width: 80,
                                            height: 80,
                                            borderRadius: 1.25,
                                            border: '2px solid',
                                            borderColor: (t) => alpha(t.palette.common.white, 0.9),
                                            boxShadow: (t) => t.custom.shadows.md,
                                            objectFit: 'cover',
                                        }}
                                        imgProps={{
                                            onError: (e) => {
                                                e.currentTarget.src = defaultAvatarSquare;
                                            },
                                        }}
                                    />
                                    <Box sx={{ textAlign: 'center', minWidth: 0 }}>
                                        <Typography
                                            variant="subtitle2"
                                            sx={{
                                                fontWeight: 900,
                                                lineHeight: 1.15,
                                                maxWidth: '100%',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {name}
                                        </Typography>
                                        {username ? (
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>
                                                @{username}
                                            </Typography>
                                        ) : null}
                                        {locationText ? (
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                {locationText}
                                            </Typography>
                                        ) : null}
                                    </Box>
                                </Paper>
                            );
                        })}
                    </Box>

                    {!peopleLoading && peopleList.length === 0 ? (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 1.5, pb: 1.25 }}>
                            No suggestions for this location yet.
                        </Typography>
                    ) : null}
                </Paper>
            ) : null}
        </Box>
    );
}

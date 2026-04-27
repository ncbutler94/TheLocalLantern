// src/components/ShareDialog.jsx
//
// Unified share dialog for posts, comments, and events.
// Accepts a `contentType` prop ('post' | 'comment' | 'event') to switch
// between preview cards, deep-link building, and API payload shape.
// The follower picker, search/filter bar, tile grid, and dialog chrome
// are fully shared across all three content types.
//
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    Snackbar,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FacebookIcon from '@mui/icons-material/Facebook';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import FormatQuoteRoundedIcon from '@mui/icons-material/FormatQuoteRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import BusinessCenterRoundedIcon from '@mui/icons-material/BusinessCenterRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import FrontHandRoundedIcon from '@mui/icons-material/FrontHandRounded';
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import axios from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

import CityCountySelect from './CityCountySelect';
import { useActiveAccount } from './AccountContext';
import RichTextDisplay from './RichTextDisplay';
import { stripHtml, containsHtml } from '../utils/richTextUtils';

import SuccessSnackbar from './SuccessSnackbar';
import defaultAvatar from '../assets/profile/default_avatar_square.png';

/* ═══════════════════════════════════════════════════════════════════════════
   Tile layout config per content type
   ═══════════════════════════════════════════════════════════════════════════ */
const TILE_CONFIG = {
    post: { avatarSize: 104, avatarRadius: 10, tileHeight: 230, tilePadding: 2, smColsMax: 3 },
    comment: { avatarSize: 80, avatarRadius: 8, tileHeight: 184, tilePadding: 1.5, smColsMax: 4 },
    event: { avatarSize: 104, avatarRadius: 10, tileHeight: 230, tilePadding: 2, smColsMax: 3 },
    job: { avatarSize: 104, avatarRadius: 10, tileHeight: 230, tilePadding: 2, smColsMax: 3 },
    business: { avatarSize: 104, avatarRadius: 10, tileHeight: 230, tilePadding: 2, smColsMax: 3 },
    artist: { avatarSize: 104, avatarRadius: 10, tileHeight: 230, tilePadding: 2, smColsMax: 3 },
    profile: { avatarSize: 104, avatarRadius: 10, tileHeight: 230, tilePadding: 2, smColsMax: 3 },
    listing: { avatarSize: 104, avatarRadius: 10, tileHeight: 230, tilePadding: 2, smColsMax: 3 },
    service: { avatarSize: 104, avatarRadius: 10, tileHeight: 230, tilePadding: 2, smColsMax: 3 },
    service_request: { avatarSize: 104, avatarRadius: 10, tileHeight: 230, tilePadding: 2, smColsMax: 3 },
    group: { avatarSize: 104, avatarRadius: 10, tileHeight: 230, tilePadding: 2, smColsMax: 3 },
    // Slice 4a: news article shares
    article: { avatarSize: 104, avatarRadius: 10, tileHeight: 230, tilePadding: 2, smColsMax: 3 },
};

/* ── Job type lookup (module-level to avoid re-creation) ── */
const JOB_TYPE_MAP = {
    FT: 'Full-Time',
    PT: 'Part-Time',
    Contract: 'Contract',
    Temp: 'Temporary',
    Internship: 'Internship',
};

/* ── Account type detection helpers ── */
function getUserAccountType(u) {
    if (!u) return 'personal';
    const type = safeStr(
        u.account_type || u.accountType || u.type || u.profileType || u.profile_type || ''
    ).toLowerCase().trim();
    if (type === 'business' || type === 'business_page') return 'business';
    if (type === 'artist' || type === 'music' || type === 'artist_page') return 'artist';
    if (u.is_business || u.isBusiness) return 'business';
    if (u.is_artist || u.isArtist) return 'artist';
    if (u.business_name || u.businessName) return 'business';
    if (u.artist_name || u.artistName) return 'artist';
    return 'personal';
}

function getAccountTypeLabel(accountType, profileType) {
    if (accountType === 'business') return 'Business';
    if (accountType === 'artist') {
        // Distinguish visual artists from musicians when the caller knows
        // profile_type. Falls back to the legacy 'Artist' label when the
        // sub-type isn't available.
        const sub = String(profileType || '').toLowerCase();
        if (sub === 'artist') return 'Visual Artist';
        if (sub === 'music') return 'Musician';
        return 'Artist';
    }
    return null;
}

function getAccountTypeIcon(accountType, fontSize = 22, profileType) {
    if (accountType === 'business') return <StorefrontOutlinedIcon sx={{ fontSize, opacity: 0.7 }} />;
    if (accountType === 'artist') {
        // Palette for visual artists, Music Note for musicians / unspecified.
        const sub = String(profileType || '').toLowerCase();
        if (sub === 'artist') return <PaletteRoundedIcon sx={{ fontSize, opacity: 0.7 }} />;
        return <MusicNoteRoundedIcon sx={{ fontSize, opacity: 0.7 }} />;
    }
    return <PersonRoundedIcon sx={{ fontSize, opacity: 0.7 }} />;
}

function getAccountTypeColor(accountType, palette) {
    if (accountType === 'business') return palette.primary.main;
    if (accountType === 'artist') return palette.primary.main;
    return palette.text.secondary;
}

const tileWrapSx = { width: '100%', minWidth: 0, display: 'flex' };

function makeTileSx(selected, t, cfg) {
    return {
        p: cfg.tilePadding,
        borderRadius: 2,
        border: selected
            ? `2px solid ${t.palette.primary.main}`
            : `1px solid ${alpha(t.palette.text.primary, 0.10)}`,
        background: selected
            ? alpha(t.palette.primary.main, 0.06)
            : t.palette.background.paper,
        position: 'relative',
        height: cfg.tileHeight,
        width: '100%',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 0.5,
        cursor: 'pointer',
        userSelect: 'none',
        transition: `border-color ${t.custom.motion.base}ms ${t.custom.motion.ease}, background ${t.custom.motion.base}ms ${t.custom.motion.ease}, box-shadow ${t.custom.motion.slow}ms ${t.custom.motion.ease}`,
        '&:hover': { boxShadow: t.custom.shadows.xs },
    };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Shared helpers
   ═══════════════════════════════════════════════════════════════════════════ */
function safeStr(v) {
    if (v === null || v === undefined) return '';
    return String(v);
}

function getUserAvatarSrc(u) {
    const src = safeStr(
        u?.profile_picture || u?.avatar_url || u?.avatarUrl || u?.profilePicture || ''
    ).trim();
    // Return empty when no real avatar so the squared icon fallback renders
    // for all account types (matches UserCardPopover behavior).
    if (!src || src.includes('default_avatar') || src.includes('default_business') || src.includes('default_logo')) return '';
    return src;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Post-specific helpers
   ═══════════════════════════════════════════════════════════════════════════ */
function buildPostText(post) {
    const title =
        safeStr(post?.title) ||
        safeStr(post?.post_title) ||
        safeStr(post?.headline) ||
        safeStr(post?.name) ||
        '';

    const body =
        safeStr(post?.description) ||
        safeStr(post?.text) ||
        safeStr(post?.body) ||
        safeStr(post?.content) ||
        safeStr(post?.caption) ||
        safeStr(post?.details) ||
        '';

    const city = safeStr(post?.city);
    const county = safeStr(post?.county);
    const loc = [city, county].filter(Boolean).join(', ');

    // Strip HTML tags for plain-text snippet (used in Facebook quote, OG, etc.)
    const plainBody = stripHtml(body).replace(/\s+/g, ' ').trim();
    const snippet = plainBody.length > 240 ? `${plainBody.slice(0, 240)}…` : plainBody;

    // Keep the raw body (may contain HTML) for rich preview rendering
    return { title: title.trim(), snippet, rawBody: body, location: loc.trim() };
}

function pickPostImage(post) {
    const direct =
        safeStr(post?.og_image) ||
        safeStr(post?.cover_photo) ||
        safeStr(post?.coverPhoto) ||
        safeStr(post?.image_url) ||
        safeStr(post?.imageUrl) ||
        safeStr(post?.photo_url) ||
        safeStr(post?.photoUrl) ||
        safeStr(post?.thumbnail_url) ||
        safeStr(post?.thumbnailUrl) ||
        safeStr(post?.coverImage) ||
        safeStr(post?.cover_image) ||
        '';

    if (direct) return direct;

    // Business posts store photos in mediaUrl (JSON array or single string)
    if (post?.mediaUrl) {
        try {
            const parsed = JSON.parse(post.mediaUrl);
            if (Array.isArray(parsed) && parsed.length) {
                const first = parsed[0];
                if (typeof first === 'string') return first;
            }
        } catch {
            // Not JSON — treat as a direct URL
            const url = safeStr(post.mediaUrl);
            if (url) return url;
        }
    }

    // Also check media_url (snake_case variant)
    if (post?.media_url) {
        const url = safeStr(post.media_url);
        if (url) return url;
    }

    const arr =
        post?.photos ||
        post?.images ||
        post?.media ||
        post?.photo_urls ||
        post?.image_urls ||
        post?.photoUrls ||
        post?.imageUrls;

    if (Array.isArray(arr) && arr.length) {
        const first = arr[0];
        if (typeof first === 'string') return first;
        if (first && typeof first === 'object') {
            return safeStr(first.url || first.secure_url || first.image_url || first.photo_url || '');
        }
    }

    return '';
}

/* ═══════════════════════════════════════════════════════════════════════════
   Comment-specific helpers
   ═══════════════════════════════════════════════════════════════════════════ */
function timeAgoCompact(input) {
    const d = input ? new Date(input) : null;
    if (!d || Number.isNaN(d.valueOf())) return '';
    const diffMs = Math.max(0, Date.now() - d.getTime());
    const s = Math.floor(diffMs / 1000);
    if (s < 60) return '1m ago';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}hr ago`;
    const dys = Math.floor(h / 24);
    if (dys < 7) return `${dys}d ago`;
    const w = Math.floor(dys / 7);
    if (w < 5) return `${w}wk ago`;
    const mo = Math.floor(dys / 30);
    if (mo < 12) return `${mo}mo ago`;
    const y = Math.floor(dys / 365);
    return `${y}yr ago`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Event-specific helpers
   ═══════════════════════════════════════════════════════════════════════════ */
function buildEventText(event) {
    const title = safeStr(event?.title).trim();
    const description = safeStr(event?.description).trim();
    const snippet = description.length > 240 ? `${description.slice(0, 240)}…` : description;

    const city = safeStr(event?.city);
    const county = safeStr(event?.county);
    const scope = safeStr(event?.locationScope || event?.location_scope).toLowerCase();

    let location = '';
    if (scope === 'statewide' || (!city && !county)) {
        location = 'Statewide';
    } else {
        const countyLabel = county ? `${county} County` : '';
        if (city && countyLabel) location = `${city}, ${countyLabel}`;
        else location = city || countyLabel || 'Statewide';
    }

    return { title: title || 'Untitled Event', snippet, rawBody: description, location };
}

function formatEventDateTime(event) {
    const rawStart = event?.startAt || event?.start_at;
    if (!rawStart) return '';

    const s = safeStr(rawStart).trim();
    let dateObj = null;

    const mysqlMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
    if (mysqlMatch) {
        const [, y, mo, day, hh, mm] = mysqlMatch.map(Number);
        dateObj = new Date(y, mo - 1, day, hh, mm);
    } else {
        const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
        if (isoMatch) {
            const [, y, mo, day, hh, mm] = isoMatch.map(Number);
            dateObj = new Date(y, mo - 1, day, hh, mm);
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
            const [y, mo, day] = s.split('-').map(Number);
            dateObj = new Date(y, mo - 1, day);
        } else {
            dateObj = new Date(s);
        }
    }

    if (!dateObj || Number.isNaN(dateObj.getTime())) return '';

    const startHasTime = event?.startHasTime ?? event?.start_has_time;
    const isDateOnly =
        startHasTime === false ||
        /^\d{4}-\d{2}-\d{2}$/.test(s) ||
        s.includes(' 00:00:00') ||
        s.includes('T00:00:00');

    const dateStr = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    }).format(dateObj);

    if (isDateOnly) return dateStr;

    const timeStr = dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
    return `${dateStr} · ${timeStr}`;
}

function pickEventImage(event) {
    const direct = safeStr(
        event?.mainPhotoUrl || event?.main_photo_url || event?.photoUrl || event?.photo_url
    ).trim();
    if (direct) return direct;

    const arr = event?.photos || event?.photoUrls || event?.photo_urls;
    if (Array.isArray(arr) && arr.length) {
        const first = arr[0];
        if (typeof first === 'string') return first;
        if (first && typeof first === 'object') return safeStr(first.url || '');
    }

    return '';
}

/* ═══════════════════════════════════════════════════════════════════════════
   Preview sub-components (rendered inside DialogContent)
   ═══════════════════════════════════════════════════════════════════════════ */

function PostPreview({ post, isGroupShare }) {
    const postImage = pickPostImage(post);
    const postPreview = buildPostText(post);
    const hasText = Boolean((postPreview.title || '').trim() || (postPreview.snippet || '').trim());

    if (!hasText) return null;

    return (
        <Box sx={{ px: 2, pb: 1 }}>
            <Box
                sx={(t) => ({
                    border: '1px solid',
                    borderColor: alpha(t.palette.text.primary, 0.10),
                    borderRadius: 2,
                    overflow: 'hidden',
                    background: t.palette.background.paper,
                })}
            >
                <Box
                    sx={{
                        display: 'flex',
                        gap: 1.5,
                        p: 1.5,
                        alignItems: 'stretch',
                        flexDirection: { xs: 'column', sm: 'row' },
                    }}
                >
                    <Box
                        sx={(t) => ({
                            width: { xs: '100%', sm: 124 },
                            minWidth: { xs: '100%', sm: 124 },
                            height: { xs: 150, sm: 96 },
                            borderRadius: 2,
                            overflow: 'hidden',
                            background: postImage
                                ? alpha(t.palette.text.primary, 0.06)
                                : `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.12)}, ${alpha(t.palette.secondary.main, 0.08)})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        })}
                    >
                        {postImage ? (
                            <Box
                                component="img"
                                src={postImage}
                                alt="Post preview"
                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <ShareOutlinedIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.6 }} />
                        )}
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.5, overflow: 'hidden' }}>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 900,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere',
                            }}
                        >
                            {postPreview.title || (isGroupShare ? 'Local Lantern Group' : 'Local Lantern Post')}
                        </Typography>

                        {postPreview.location ? (
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                {postPreview.location}
                            </Typography>
                        ) : null}

                        <Box
                            sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.25,
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere',
                                color: 'text.secondary',
                            }}
                        >
                            {postPreview.rawBody && containsHtml(postPreview.rawBody) ? (
                                <RichTextDisplay
                                    html={postPreview.rawBody}
                                    sx={{ fontSize: '0.875rem', lineHeight: 1.25, color: 'inherit' }}
                                />
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.25 }}>
                                    {postPreview.snippet || ' '}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

function CommentPreview({ comment }) {
    // ── Resolve commenter identity (business > artist > personal) ──
    const isBusinessComment = Boolean(
        comment?.business_id || comment?.business_name || comment?.account_type === 'business'
    );
    const isArtistComment = Boolean(
        comment?.artist_id || comment?.artist_name || comment?.account_type === 'artist'
    );
    // Sub-type for artist commenters — musicians vs visual artists.
    // Reads profile_type from the comment object if the backend provided it.
    const commentProfileType = String(comment?.profile_type || comment?.profileType || '').toLowerCase();
    const isVisualArtistComment = isArtistComment && commentProfileType === 'artist';

    const commenterName = (() => {
        if (isBusinessComment) {
            return safeStr(comment?.business_name || comment?.account_name || '').trim() || 'Business';
        }
        if (isArtistComment) {
            return safeStr(comment?.artist_name || comment?.account_name || '').trim() || 'Artist';
        }
        const first = safeStr(comment?.firstName || comment?.first_name).trim();
        const last = safeStr(comment?.lastName || comment?.last_name).trim();
        const full = `${first} ${last}`.trim();
        return full || (comment?.handle ? `@${comment.handle}` : 'User');
    })();

    const commenterHandle = (() => {
        if (isBusinessComment) {
            return safeStr(comment?.business_slug || comment?.account_handle || '').trim();
        }
        if (isArtistComment) {
            return safeStr(comment?.artist_handle || comment?.account_handle || '').trim();
        }
        return safeStr(comment?.handle || '').trim();
    })();

    // Resolve avatar: business → artist → personal, with proper fallback icons
    const commenterAvatar = (() => {
        if (isBusinessComment) {
            const src = safeStr(
                comment?.business_avatar_url || comment?.account_avatar_url || ''
            ).trim();
            return src || '';
        }
        if (isArtistComment) {
            const src = safeStr(
                comment?.artist_avatar_url || comment?.account_avatar_url || ''
            ).trim();
            return src || '';
        }
        const src = safeStr(
            comment?.avatarUrl || comment?.avatar_url || comment?.avatar ||
            comment?.profilePicture || comment?.profile_picture || ''
        ).trim();
        return src || '';
    })();

    const hasAvatar = Boolean(
        commenterAvatar &&
        !commenterAvatar.includes('default_avatar') &&
        !commenterAvatar.includes('default_business') &&
        !commenterAvatar.includes('default_logo')
    );

    const commentContent = safeStr(comment?.content || comment?.text || comment?.body || '').trim();
    const commentTime = comment?.createdAt || comment?.created_at || '';

    // ── Comment images ──
    const commentImages = (() => {
        if (Array.isArray(comment?.images) && comment.images.length > 0) {
            return comment.images.filter(Boolean);
        }
        const single = safeStr(comment?.image || '').trim();
        return single ? [single] : [];
    })();
    const hasImages = commentImages.length > 0;
    const hasContent = Boolean(commentContent);

    return (
        <Box sx={{ px: 2, pb: 1.5 }}>
            <Box
                sx={(t) => ({
                    position: 'relative',
                    border: '1px solid',
                    borderColor: alpha(t.palette.primary.main, 0.15),
                    borderRadius: 3,
                    overflow: 'hidden',
                    background: t.palette.background.paper,
                })}
            >
                {/* Accent stripe */}
                <Box
                    sx={(t) => ({
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 4,
                        background: `linear-gradient(180deg, ${t.palette.primary.main}, ${alpha(t.palette.primary.main, 0.3)})`,
                        borderRadius: '3px 0 0 3px',
                    })}
                />

                <Box sx={{ pl: 2.5, pr: 2, py: 2 }}>
                    {/* Commenter identity row */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: hasContent || hasImages ? 1.5 : 0 }}>
                        <Avatar
                            src={hasAvatar ? commenterAvatar : undefined}
                            sx={(t) => ({
                                width: 44,
                                height: 44,
                                border: '2px solid',
                                borderColor: 'divider',
                                bgcolor: isBusinessComment
                                    ? alpha(t.palette.primary.main, 0.08)
                                    : isArtistComment
                                        ? alpha(t.palette.primary.main, 0.08)
                                        : alpha(t.palette.text.primary, 0.06),
                                color: isBusinessComment || isArtistComment
                                    ? t.palette.primary.main
                                    : t.palette.text.secondary,
                            })}
                        >
                            {!hasAvatar && (
                                isBusinessComment
                                    ? <StorefrontRoundedIcon sx={{ fontSize: 22 }} />
                                    : isArtistComment
                                        ? (isVisualArtistComment
                                            ? <PaletteRoundedIcon sx={{ fontSize: 22 }} />
                                            : <MusicNoteRoundedIcon sx={{ fontSize: 22 }} />)
                                        : <PersonRoundedIcon sx={{ fontSize: 22 }} />
                            )}
                        </Avatar>

                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                                sx={{
                                    fontWeight: 900,
                                    fontSize: 14,
                                    lineHeight: 1.2,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {commenterName}
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                {commenterHandle ? (
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ fontWeight: 600, lineHeight: 1.1 }}
                                        noWrap
                                    >
                                        @{commenterHandle}
                                    </Typography>
                                ) : null}

                                {commenterHandle && commentTime ? (
                                    <Typography variant="caption" color="text.disabled" sx={{ lineHeight: 1 }}>
                                        ·
                                    </Typography>
                                ) : null}

                                {commentTime ? (
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ fontWeight: 600, lineHeight: 1.1 }}
                                    >
                                        {timeAgoCompact(commentTime)}
                                    </Typography>
                                ) : null}

                                {/* Account type badge */}
                                {isBusinessComment ? (
                                    <Typography variant="caption" sx={(t) => ({ fontWeight: 700, fontSize: '0.6rem', color: t.palette.primary.main, display: 'flex', alignItems: 'center', gap: 0.3, ml: 0.25 })}>
                                        <StorefrontRoundedIcon sx={{ fontSize: 10 }} /> Business
                                    </Typography>
                                ) : isArtistComment ? (
                                    <Typography variant="caption" sx={(t) => ({ fontWeight: 700, fontSize: '0.6rem', color: t.palette.primary.main, display: 'flex', alignItems: 'center', gap: 0.3, ml: 0.25 })}>
                                        {isVisualArtistComment
                                            ? <PaletteRoundedIcon sx={{ fontSize: 10 }} />
                                            : <MusicNoteRoundedIcon sx={{ fontSize: 10 }} />}
                                        {isVisualArtistComment ? ' Visual Artist' : ' Artist'}
                                    </Typography>
                                ) : null}
                            </Box>
                        </Box>
                    </Box>

                    {/* Quote icon + comment text (only if there IS text) */}
                    {hasContent ? (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                            <FormatQuoteRoundedIcon
                                sx={(t) => ({
                                    fontSize: 22,
                                    color: alpha(t.palette.primary.main, 0.25),
                                    mt: 0.25,
                                    flexShrink: 0,
                                    transform: 'scaleX(-1)',
                                })}
                            />

                            {containsHtml(commentContent) ? (
                                <Box
                                    sx={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 6,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        wordBreak: 'break-word',
                                        overflowWrap: 'anywhere',
                                    }}
                                >
                                    <RichTextDisplay
                                        html={commentContent}
                                        sx={{ fontSize: 14, lineHeight: 1.55 }}
                                    />
                                </Box>
                            ) : (
                                <Typography
                                    sx={{
                                        whiteSpace: 'pre-wrap',
                                        lineHeight: 1.55,
                                        fontSize: 14,
                                        color: 'text.primary',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 6,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        wordBreak: 'break-word',
                                        overflowWrap: 'anywhere',
                                    }}
                                >
                                    {commentContent}
                                </Typography>
                            )}
                        </Box>
                    ) : null}

                    {/* Comment images */}
                    {hasImages ? (
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 0.75,
                                mt: hasContent ? 1.25 : 0,
                                flexWrap: 'wrap',
                            }}
                        >
                            {commentImages.slice(0, 4).map((url, idx) => {
                                const isGif = /\.gif(\?|$)/i.test(url) || /tenor\.com/i.test(url);
                                return (
                                    <Box
                                        key={idx}
                                        sx={(t) => ({
                                            position: 'relative',
                                            width: commentImages.length === 1 ? 180 : 80,
                                            height: commentImages.length === 1 ? 120 : 80,
                                            borderRadius: 1.5,
                                            overflow: 'hidden',
                                            border: '1px solid',
                                            borderColor: alpha(t.palette.text.primary, 0.08),
                                            bgcolor: alpha(t.palette.text.primary, 0.03),
                                            flexShrink: 0,
                                        })}
                                    >
                                        <img
                                            src={url}
                                            alt={`comment image ${idx + 1}`}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                display: 'block',
                                            }}
                                        />
                                        {isGif && (
                                            <Box
                                                sx={(t) => ({
                                                    position: 'absolute',
                                                    bottom: 3,
                                                    left: 3,
                                                    bgcolor: alpha(t.palette.common.black, 0.6),
                                                    color: '#fff',
                                                    fontSize: 8,
                                                    fontWeight: 800,
                                                    px: 0.4,
                                                    py: 0.1,
                                                    borderRadius: 0.5,
                                                    lineHeight: 1.2,
                                                })}
                                            >
                                                GIF
                                            </Box>
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>
                    ) : null}
                </Box>
            </Box>
        </Box>
    );
}

function EventPreview({ event }) {
    const eventImage = pickEventImage(event);
    const eventPreview = buildEventText(event);
    const eventDateTime = formatEventDateTime(event);
    const hasText = Boolean((eventPreview.title || '').trim());

    if (!hasText) return null;

    return (
        <Box sx={{ px: 2, pb: 1 }}>
            <Box
                sx={(t) => ({
                    border: '1px solid',
                    borderColor: alpha(t.palette.primary.main, 0.15),
                    borderRadius: 2,
                    overflow: 'hidden',
                    background: t.palette.background.paper,
                })}
            >
                <Box
                    sx={{
                        display: 'flex',
                        gap: 1.5,
                        p: 1.5,
                        alignItems: 'stretch',
                        flexDirection: { xs: 'column', sm: 'row' },
                    }}
                >
                    {/* Event Image */}
                    <Box
                        sx={(t) => ({
                            width: { xs: '100%', sm: 140 },
                            minWidth: { xs: '100%', sm: 140 },
                            height: { xs: 150, sm: 110 },
                            borderRadius: 2,
                            overflow: 'hidden',
                            background: eventImage
                                ? alpha(t.palette.text.primary, 0.06)
                                : `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.12)}, ${alpha(t.palette.secondary.main, 0.08)})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        })}
                    >
                        {eventImage ? (
                            <Box
                                component="img"
                                src={eventImage}
                                alt="Event preview"
                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <EventRoundedIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.6 }} />
                        )}
                    </Box>

                    {/* Event Info */}
                    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.5, overflow: 'hidden' }}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontWeight: 900,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.2,
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere',
                            }}
                        >
                            {eventPreview.title}
                        </Typography>

                        {eventDateTime ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AccessTimeRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                                    {eventDateTime}
                                </Typography>
                            </Box>
                        ) : null}

                        {eventPreview.location ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocationOnRoundedIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
                                    {eventPreview.location}
                                </Typography>
                            </Box>
                        ) : null}

                        {eventPreview.rawBody && containsHtml(eventPreview.rawBody) ? (
                            <Box sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                mt: 0.25,
                                color: 'text.secondary',
                            }}>
                                <RichTextDisplay
                                    html={eventPreview.rawBody}
                                    sx={{ fontSize: '0.875rem', lineHeight: 1.3, color: 'inherit' }}
                                />
                            </Box>
                        ) : eventPreview.snippet ? (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    lineHeight: 1.3,
                                    mt: 0.25,
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere',
                                }}
                            >
                                {eventPreview.snippet}
                            </Typography>
                        ) : null}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   JobPreview — compact card for the job being shared
   ═══════════════════════════════════════════════════════════════════════════ */
function JobPreview({ job }) {
    if (!job) return null;

    const title = safeStr(job.title || job.jobTitle || job.job_title || '').trim();
    const company = safeStr(job.company || job.companyName || job.company_name || job.posterName || job.poster_name || '').trim();
    const location = safeStr(job.locationLabel || job.location_label || job.location || '').trim();
    const jobType = safeStr(job.jobType || job.job_type || '').trim();
    const description = safeStr(job.description || '').trim();
    const snippet = description.length > 120 ? `${description.slice(0, 120).trimEnd()}…` : description;

    const jobTypeLabel = JOB_TYPE_MAP[jobType] || jobType || '';

    return (
        <Box sx={{ px: 2, pb: 1 }}>
            <Box
                sx={(t) => ({
                    border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: alpha(t.palette.primary.main, 0.02),
                })}
            >
                <Box sx={{ display: 'flex', gap: 1.5, p: 1.5, alignItems: 'stretch', flexDirection: { xs: 'column', sm: 'row' } }}>
                    {/* Job icon area */}
                    <Box
                        sx={(t) => ({
                            width: { xs: '100%', sm: 100 },
                            minWidth: { xs: '100%', sm: 100 },
                            height: { xs: 80, sm: 100 },
                            borderRadius: 2,
                            overflow: 'hidden',
                            background: `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.12)}, ${alpha(t.palette.secondary.main, 0.08)})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        })}
                    >
                        <BusinessCenterRoundedIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.6 }} />
                    </Box>

                    {/* Job Info */}
                    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.5, overflow: 'hidden' }}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontWeight: 900,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.2,
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere',
                            }}
                        >
                            {title || 'Job Listing'}
                        </Typography>

                        {company ? (
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                                {company}
                            </Typography>
                        ) : null}

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {location ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <LocationOnRoundedIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                                    <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
                                        {location}
                                    </Typography>
                                </Box>
                            ) : null}
                            {jobTypeLabel ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <WorkRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                                        {jobTypeLabel}
                                    </Typography>
                                </Box>
                            ) : null}
                        </Box>

                        {containsHtml(description) ? (
                            <Box sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                mt: 0.25,
                                color: 'text.secondary',
                            }}>
                                <RichTextDisplay
                                    html={description}
                                    sx={{ fontSize: '0.875rem', lineHeight: 1.3, color: 'inherit' }}
                                />
                            </Box>
                        ) : snippet ? (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    lineHeight: 1.3,
                                    mt: 0.25,
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere',
                                }}
                            >
                                {snippet}
                            </Typography>
                        ) : null}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Business profile preview
   ═══════════════════════════════════════════════════════════════════════════ */
function BusinessProfilePreview({ business }) {
    if (!business) return null;

    const name = safeStr(business.name || business.business_name).trim();
    const description = safeStr(business.description || business.about || business.summary).trim();
    const snippet = description.length > 200 ? `${description.slice(0, 200)}…` : description;
    const city = safeStr(business.city);
    const countyRaw = safeStr(business.county);
    const county = countyRaw ? (countyRaw.toLowerCase().includes('county') ? countyRaw : `${countyRaw} County`) : '';
    const location = [city, county].filter(Boolean).join(', ');
    const logo = safeStr(business.avatar_url || business.logo_url || business.logoUrl || business.cover_url || '').trim();
    const category = safeStr(business.category_name || business.category || business.categoryLabel || '').trim();

    if (!name) return null;

    return (
        <Box sx={{ px: 2, pb: 1 }}>
            <Box
                sx={(t) => ({
                    border: '1px solid',
                    borderColor: alpha(t.palette.primary.main, 0.15),
                    borderRadius: 2,
                    overflow: 'hidden',
                    background: t.palette.background.paper,
                })}
            >
                <Box sx={{ display: 'flex', gap: 1.5, p: 1.5, alignItems: 'center' }}>
                    <Avatar
                        src={logo || undefined}
                        sx={(t) => ({
                            width: 56,
                            height: 56,
                            borderRadius: 2,
                            bgcolor: logo ? 'transparent' : alpha(t.palette.primary.main, 0.1),
                            flexShrink: 0,
                        })}
                    >
                        {!logo && <StorefrontRoundedIcon sx={{ fontSize: 28, color: 'primary.main', opacity: 0.6 }} />}
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.25, overflow: 'hidden' }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 15, lineHeight: 1.2 }} noWrap>
                            {name}
                        </Typography>

                        {category ? (
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                                {category}
                            </Typography>
                        ) : null}

                        {location ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocationOnRoundedIcon sx={{ fontSize: 13, color: 'primary.main' }} />
                                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
                                    {location}
                                </Typography>
                            </Box>
                        ) : null}

                        {containsHtml(description) ? (
                            <Box sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                color: 'text.secondary',
                            }}>
                                <RichTextDisplay
                                    html={description}
                                    sx={{ fontSize: 12, lineHeight: 1.3, color: 'inherit' }}
                                />
                            </Box>
                        ) : snippet ? (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    lineHeight: 1.3,
                                    fontSize: 12,
                                }}
                            >
                                {snippet}
                            </Typography>
                        ) : null}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Artist profile preview
   ═══════════════════════════════════════════════════════════════════════════ */
function ArtistProfilePreview({ artist }) {
    if (!artist) return null;

    const name = safeStr(artist.name || artist.artist_name || artist.artistName).trim();
    const handle = safeStr(artist.handle || artist.artist_handle || artist.artistHandle).trim();
    const bio = safeStr(artist.bio || artist.description || artist.about).trim();
    const snippet = bio.length > 200 ? `${bio.slice(0, 200)}…` : bio;
    const city = safeStr(artist.city);
    const countyRaw = safeStr(artist.county);
    const county = countyRaw ? (countyRaw.toLowerCase().includes('county') ? countyRaw : `${countyRaw} County`) : '';
    const location = [city, county].filter(Boolean).join(', ');
    const avatar = safeStr(artist.avatar_url || artist.avatarUrl || artist.profile_picture || '').trim();
    const genre = safeStr(artist.genre || artist.primary_genre || artist.primaryGenre || '').trim();
    // Artist sub-type for the default avatar fallback icon. Reads the
    // serializer's `profileType` first, then the raw `profile_type` column.
    // Defaults to 'music' so pre-migration rows keep the music-note icon.
    const profileType = String(artist.profileType || artist.profile_type || 'music').toLowerCase();
    const isVisualArtist = profileType === 'artist';
    const DefaultIcon = isVisualArtist ? PaletteRoundedIcon : MusicNoteRoundedIcon;

    if (!name) return null;

    return (
        <Box sx={{ px: 2, pb: 1 }}>
            <Box
                sx={(t) => ({
                    border: '1px solid',
                    borderColor: alpha(t.palette.primary.main, 0.15),
                    borderRadius: 2,
                    overflow: 'hidden',
                    background: t.palette.background.paper,
                })}
            >
                <Box sx={{ display: 'flex', gap: 1.5, p: 1.5, alignItems: 'center' }}>
                    <Avatar
                        src={avatar || undefined}
                        sx={(t) => ({
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            bgcolor: avatar ? 'transparent' : alpha(t.palette.primary.main, 0.08),
                            flexShrink: 0,
                        })}
                    >
                        {!avatar && <DefaultIcon sx={{ fontSize: 28, color: 'primary.main', opacity: 0.6 }} />}
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.25, overflow: 'hidden' }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 15, lineHeight: 1.2 }} noWrap>
                            {name}
                        </Typography>

                        {handle ? (
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                @{handle}
                            </Typography>
                        ) : null}

                        {genre ? (
                            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
                                {genre}
                            </Typography>
                        ) : null}

                        {location ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocationOnRoundedIcon sx={{ fontSize: 13, color: 'primary.main' }} />
                                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
                                    {location}
                                </Typography>
                            </Box>
                        ) : null}

                        {containsHtml(bio) ? (
                            <Box sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                color: 'text.secondary',
                            }}>
                                <RichTextDisplay
                                    html={bio}
                                    sx={{ fontSize: 12, lineHeight: 1.3, color: 'inherit' }}
                                />
                            </Box>
                        ) : snippet ? (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    lineHeight: 1.3,
                                    fontSize: 12,
                                }}
                            >
                                {snippet}
                            </Typography>
                        ) : null}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   User profile preview
   ═══════════════════════════════════════════════════════════════════════════ */
function ProfilePreview({ profile }) {
    if (!profile) return null;

    const firstName = safeStr(profile.first_name || profile.firstName).trim();
    const lastName = safeStr(profile.last_name || profile.lastName).trim();
    const name = `${firstName} ${lastName}`.trim() || safeStr(profile.display_name || profile.displayName).trim();
    const handle = safeStr(profile.handle || profile.username).trim();
    const city = safeStr(profile.home_city || profile.city);
    const countyRaw = safeStr(profile.home_county || profile.county);
    const county = countyRaw ? (countyRaw.toLowerCase().includes('county') ? countyRaw : `${countyRaw} County`) : '';
    const location = [city, county].filter(Boolean).join(', ');
    const avatar = safeStr(profile.avatar_url || profile.avatarUrl || profile.profile_picture || profile.profilePicture || '').trim();

    if (!name && !handle) return null;

    return (
        <Box sx={{ px: 2, pb: 1 }}>
            <Box
                sx={(t) => ({
                    border: '1px solid',
                    borderColor: alpha(t.palette.primary.main, 0.15),
                    borderRadius: 2,
                    overflow: 'hidden',
                    background: t.palette.background.paper,
                })}
            >
                <Box sx={{ display: 'flex', gap: 1.5, p: 1.5, alignItems: 'center' }}>
                    <Avatar
                        src={avatar || undefined}
                        sx={(t) => ({
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            bgcolor: avatar ? 'transparent' : alpha(t.palette.primary.main, 0.1),
                            flexShrink: 0,
                        })}
                    >
                        {!avatar && <PersonRoundedIcon sx={{ fontSize: 28, color: 'primary.main', opacity: 0.6 }} />}
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.25, overflow: 'hidden' }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 15, lineHeight: 1.2 }} noWrap>
                            {name || 'User'}
                        </Typography>

                        {handle ? (
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                @{handle}
                            </Typography>
                        ) : null}

                        {location ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocationOnRoundedIcon sx={{ fontSize: 13, color: 'primary.main' }} />
                                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
                                    {location}
                                </Typography>
                            </Box>
                        ) : null}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Listing-specific helpers
   ═══════════════════════════════════════════════════════════════════════════ */
function buildListingText(listing) {
    const title = safeStr(listing?.title || listing?.name || '');
    const body = safeStr(listing?.description || listing?.summary || '');
    const loc = safeStr(listing?.locationLabel || listing?.location_label || listing?.location || '');

    const bodyTrimmed = body.replace(/\s+/g, ' ').trim();
    const snippet = bodyTrimmed.length > 240 ? `${bodyTrimmed.slice(0, 240)}…` : bodyTrimmed;

    let price = '';
    const cents = Number(listing?.price_cents || listing?.priceCents || 0);
    const model = safeStr(listing?.price_model || listing?.priceModel || '');
    if (model === 'free') {
        price = 'Free';
    } else if (cents > 0) {
        price = `$${(cents / 100).toFixed(2)}`;
    } else if (listing?.price) {
        price = safeStr(listing.price);
    }
    if (model === 'negotiable' && price) price += ' (Negotiable)';

    return { title: title.trim(), snippet, rawBody: body, location: loc.trim(), price };
}

function pickListingImage(listing) {
    const direct =
        safeStr(listing?.coverUrl) ||
        safeStr(listing?.cover_url) ||
        safeStr(listing?.image_url) ||
        safeStr(listing?.imageUrl) ||
        safeStr(listing?.photo_url) ||
        safeStr(listing?.photoUrl) ||
        '';

    if (direct) return direct;

    const arr =
        listing?.photos ||
        listing?.images ||
        listing?.photo_urls ||
        listing?.photoUrls;

    if (Array.isArray(arr) && arr.length) {
        const first = arr[0];
        if (typeof first === 'string') return first;
        if (first && typeof first === 'object') {
            return safeStr(first.url || first.image_url || first.photo_url || '');
        }
    }

    return '';
}

function ListingPreview({ listing }) {
    if (!listing) return null;

    const listingImage = pickListingImage(listing);
    const listingPreview = buildListingText(listing);
    const hasText = Boolean((listingPreview.title || '').trim() || (listingPreview.snippet || '').trim());

    if (!hasText) return null;

    return (
        <Box sx={{ px: 2, pb: 1 }}>
            <Box
                sx={(t) => ({
                    border: '1px solid',
                    borderColor: alpha(t.palette.text.primary, 0.10),
                    borderRadius: 2,
                    overflow: 'hidden',
                    background: t.palette.background.paper,
                })}
            >
                <Box
                    sx={{
                        display: 'flex',
                        gap: 1.5,
                        p: 1.5,
                        alignItems: 'stretch',
                        flexDirection: { xs: 'column', sm: 'row' },
                    }}
                >
                    <Box
                        sx={(t) => ({
                            width: { xs: '100%', sm: 124 },
                            minWidth: { xs: '100%', sm: 124 },
                            height: { xs: 150, sm: 96 },
                            borderRadius: 2,
                            overflow: 'hidden',
                            background: listingImage
                                ? alpha(t.palette.text.primary, 0.06)
                                : `linear-gradient(135deg, ${alpha(t.palette.success.main, 0.10)}, ${alpha(t.palette.text.primary, 0.05)})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        })}
                    >
                        {listingImage ? (
                            <Box
                                component="img"
                                src={listingImage}
                                alt="Listing preview"
                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <LocalOfferOutlinedIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.6 }} />
                        )}
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.5, overflow: 'hidden' }}>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 900,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere',
                            }}
                        >
                            {listingPreview.title || 'Marketplace Listing'}
                        </Typography>

                        {listingPreview.price ? (
                            <Typography variant="body2" sx={{ fontWeight: 900, color: 'success.dark' }}>
                                {listingPreview.price}
                            </Typography>
                        ) : null}

                        {listingPreview.location ? (
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                {listingPreview.location}
                            </Typography>
                        ) : null}

                        {listingPreview.rawBody && containsHtml(listingPreview.rawBody) ? (
                            <Box sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                color: 'text.secondary',
                            }}>
                                <RichTextDisplay
                                    html={listingPreview.rawBody}
                                    sx={{ fontSize: '0.875rem', lineHeight: 1.25, color: 'inherit' }}
                                />
                            </Box>
                        ) : (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    lineHeight: 1.25,
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere',
                                }}
                            >
                                {listingPreview.snippet || ' '}
                            </Typography>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   News article-specific helpers (Slice 4a)
   ═══════════════════════════════════════════════════════════════════════════ */
function buildArticleText(article) {
    const title = safeStr(article?.title || '');
    const snippet = safeStr(article?.snippet || article?.description || '');
    const sourceName = safeStr(article?.source_name || article?.sourceName || article?.publisher || '');

    const snippetTrimmed = snippet.replace(/\s+/g, ' ').trim();
    const trimmedSnippet = snippetTrimmed.length > 200 ? `${snippetTrimmed.slice(0, 200)}…` : snippetTrimmed;

    return {
        title: title.trim(),
        snippet: trimmedSnippet,
        sourceName: sourceName.trim(),
    };
}

function pickArticleImage(article) {
    return (
        safeStr(article?.image_url) ||
        safeStr(article?.imageUrl) ||
        safeStr(article?.thumbnail_url) ||
        safeStr(article?.thumbnailUrl) ||
        safeStr(article?.hero_image_url) ||
        safeStr(article?.heroImageUrl) ||
        ''
    );
}

function ArticlePreview({ article }) {
    if (!article) return null;

    const articleImage = pickArticleImage(article);
    const articlePreview = buildArticleText(article);
    const hasText = Boolean((articlePreview.title || '').trim() || (articlePreview.snippet || '').trim());

    if (!hasText) return null;

    return (
        <Box sx={{ px: 2, pb: 1 }}>
            <Box
                sx={(t) => ({
                    border: '1px solid',
                    borderColor: alpha(t.palette.text.primary, 0.10),
                    borderRadius: 2,
                    overflow: 'hidden',
                    background: t.palette.background.paper,
                })}
            >
                <Box
                    sx={{
                        display: 'flex',
                        gap: 1.5,
                        p: 1.5,
                        alignItems: 'stretch',
                        flexDirection: { xs: 'column', sm: 'row' },
                    }}
                >
                    <Box
                        sx={(t) => ({
                            width: { xs: '100%', sm: 124 },
                            minWidth: { xs: '100%', sm: 124 },
                            height: { xs: 150, sm: 96 },
                            borderRadius: 2,
                            overflow: 'hidden',
                            background: articleImage
                                ? alpha(t.palette.text.primary, 0.06)
                                : `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.10)}, ${alpha(t.palette.text.primary, 0.05)})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        })}
                    >
                        {articleImage ? (
                            <Box
                                component="img"
                                src={articleImage}
                                alt="Article preview"
                                referrerPolicy="no-referrer"
                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <Typography
                                variant="caption"
                                sx={{ fontWeight: 700, color: 'text.secondary', opacity: 0.6 }}
                            >
                                NEWS
                            </Typography>
                        )}
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.5, overflow: 'hidden' }}>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 900,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere',
                            }}
                        >
                            {articlePreview.title || 'News Article'}
                        </Typography>

                        {articlePreview.sourceName ? (
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                                {articlePreview.sourceName}
                            </Typography>
                        ) : null}

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.25,
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere',
                            }}
                        >
                            {articlePreview.snippet || ' '}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Group-specific helpers
   ═══════════════════════════════════════════════════════════════════════════ */
function buildGroupText(group) {
    const name = safeStr(group?.name || group?.group_name || group?.title || '');
    const desc = safeStr(group?.description || group?.summary || group?.about || '');
    const city = safeStr(group?.city);
    const county = safeStr(group?.county);
    const loc = [city, county ? `${county} County` : ''].filter(Boolean).join(', ');
    const descTrimmed = desc.replace(/\s+/g, ' ').trim();
    const snippet = descTrimmed.length > 240 ? `${descTrimmed.slice(0, 240)}…` : descTrimmed;
    const memberCount = Number(group?.member_count || group?.memberCount || group?.members_count || 0);
    const privacy = safeStr(group?.privacy || group?.visibility || '').toLowerCase();
    return { name: name.trim(), snippet, rawBody: desc, location: loc.trim(), memberCount, privacy };
}

function pickGroupImage(group) {
    const direct = safeStr(
        group?.cover_photo || group?.coverPhoto || group?.cover_url || group?.coverUrl ||
        group?.banner_url || group?.bannerUrl || group?.image_url || group?.imageUrl ||
        group?.photo_url || group?.photoUrl || group?.avatar_url || group?.avatarUrl || ''
    ).trim();
    if (direct) return direct;

    const arr = group?.photos || group?.images;
    if (Array.isArray(arr) && arr.length) {
        const first = arr[0];
        if (typeof first === 'string') return first;
        if (first && typeof first === 'object') return safeStr(first.url || '');
    }
    return '';
}

function GroupPreview({ group }) {
    if (!group) return null;

    const groupImage = pickGroupImage(group);
    const gp = buildGroupText(group);
    const hasText = Boolean(gp.name.trim());

    if (!hasText) return null;

    return (
        <Box sx={{ px: 2, pb: 1 }}>
            <Box
                sx={(t) => ({
                    border: '1px solid',
                    borderColor: alpha(t.palette.primary.main, 0.15),
                    borderRadius: 2,
                    overflow: 'hidden',
                    background: t.palette.background.paper,
                })}
            >
                <Box
                    sx={{
                        display: 'flex',
                        gap: 1.5,
                        p: 1.5,
                        alignItems: 'stretch',
                        flexDirection: { xs: 'column', sm: 'row' },
                    }}
                >
                    {/* Group cover image */}
                    <Box
                        sx={(t) => ({
                            width: { xs: '100%', sm: 140 },
                            minWidth: { xs: '100%', sm: 140 },
                            height: { xs: 120, sm: 100 },
                            borderRadius: 2,
                            overflow: 'hidden',
                            background: groupImage
                                ? alpha(t.palette.text.primary, 0.06)
                                : `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.14)}, ${alpha(t.palette.secondary.main, 0.10)})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        })}
                    >
                        {groupImage ? (
                            <Box
                                component="img"
                                src={groupImage}
                                alt="Group cover"
                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <GroupsRoundedIcon sx={{ fontSize: 44, color: 'primary.main', opacity: 0.55 }} />
                        )}
                    </Box>

                    {/* Group Info */}
                    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.5, overflow: 'hidden' }}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontWeight: 900,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.2,
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere',
                            }}
                        >
                            {gp.name}
                        </Typography>

                        {/* Privacy & member count row */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            {gp.privacy ? (
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'capitalize' }}>
                                    {gp.privacy === 'private' ? '🔒 Private' : gp.privacy === 'public' ? '🌐 Public' : gp.privacy}
                                </Typography>
                            ) : null}
                            {gp.memberCount > 0 ? (
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                    {gp.memberCount.toLocaleString()} {gp.memberCount === 1 ? 'member' : 'members'}
                                </Typography>
                            ) : null}
                        </Box>

                        {gp.location ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocationOnRoundedIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
                                    {gp.location}
                                </Typography>
                            </Box>
                        ) : null}

                        {gp.rawBody && containsHtml(gp.rawBody) ? (
                            <Box sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                mt: 0.25,
                                color: 'text.secondary',
                            }}>
                                <RichTextDisplay
                                    html={gp.rawBody}
                                    sx={{ fontSize: '0.875rem', lineHeight: 1.3, color: 'inherit' }}
                                />
                            </Box>
                        ) : gp.snippet ? (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    lineHeight: 1.3,
                                    mt: 0.25,
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere',
                                }}
                            >
                                {gp.snippet}
                            </Typography>
                        ) : null}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Service preview — compact card for the service being shared
   ═══════════════════════════════════════════════════════════════════════════ */
function ServicePreview({ service }) {
    if (!service) return null;

    const title = safeStr(service.title || service.name || '').trim();
    const description = safeStr(service.description || service.summary || service.details || '').trim();
    const snippet = description.length > 160 ? `${description.slice(0, 160).trimEnd()}…` : description;
    const location = safeStr(service.locationLabel || service.location_label || service.location || '').trim();

    const image = safeStr(
        service.coverUrl || service.cover_url || service.providerAvatar || service.provider_avatar ||
        service.image_url || service.imageUrl || service.photo_url || service.photoUrl || ''
    ).trim();

    if (!title) return null;

    return (
        <Box sx={{ px: 2, pb: 1 }}>
            <Box
                sx={(t) => ({
                    border: '1px solid',
                    borderColor: alpha(t.palette.primary.main, 0.15),
                    borderRadius: 2,
                    overflow: 'hidden',
                    background: t.palette.background.paper,
                })}
            >
                <Box
                    sx={{
                        display: 'flex',
                        gap: 1.5,
                        p: 1.5,
                        alignItems: 'stretch',
                        flexDirection: { xs: 'column', sm: 'row' },
                    }}
                >
                    <Box
                        sx={(t) => ({
                            width: { xs: '100%', sm: 110 },
                            minWidth: { xs: '100%', sm: 110 },
                            height: { xs: 90, sm: 90 },
                            borderRadius: 2,
                            overflow: 'hidden',
                            background: image
                                ? alpha(t.palette.text.primary, 0.06)
                                : `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.12)}, ${alpha(t.palette.secondary.main, 0.08)})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        })}
                    >
                        {image ? (
                            <Box
                                component="img"
                                src={image}
                                alt="Service preview"
                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <BuildRoundedIcon sx={{ fontSize: 36, color: 'primary.main', opacity: 0.6 }} />
                        )}
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.5, overflow: 'hidden' }}>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 900,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.2,
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere',
                            }}
                        >
                            {title}
                        </Typography>

                        {location ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocationOnRoundedIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
                                    {location}
                                </Typography>
                            </Box>
                        ) : null}

                        {containsHtml(description) ? (
                            <Box sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                color: 'text.secondary',
                            }}>
                                <RichTextDisplay
                                    html={description}
                                    sx={{ fontSize: '0.875rem', lineHeight: 1.3, color: 'inherit' }}
                                />
                            </Box>
                        ) : snippet ? (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    lineHeight: 1.3,
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere',
                                }}
                            >
                                {snippet}
                            </Typography>
                        ) : null}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Service Request preview — compact card for the service request being shared
   ═══════════════════════════════════════════════════════════════════════════ */
const SR_URGENCY_LABELS = {
    asap: 'ASAP', within_week: 'This Week', within_month: 'This Month', flexible: 'Flexible',
};

function ServiceRequestPreview({ request }) {
    if (!request) return null;

    const title = safeStr(request.title || request.name || '').trim();
    const description = safeStr(request.description || request.details || request.summary || '').trim();
    const snippet = description.length > 160 ? `${description.slice(0, 160).trimEnd()}…` : description;
    const location = safeStr(request.locationLabel || request.location_label || request.location || '').trim();
    const urgency = safeStr(request.urgency || '').trim();
    const urgencyLabel = SR_URGENCY_LABELS[urgency] || '';

    const image = safeStr(
        request.coverUrl || request.cover_url ||
        request.image_url || request.imageUrl ||
        request.photo_url || request.photoUrl || ''
    ).trim() || (() => {
        const photos = Array.isArray(request.photos) ? request.photos : [];
        for (const p of photos) {
            if (!p) continue;
            if (typeof p === 'string') { const s = p.trim(); if (s && s !== 'null') return s; }
            if (typeof p === 'object') {
                const u = (p.url || p.photo_url || p.photoUrl || p.src || p.path || '').trim();
                if (u && u !== 'null') return u;
            }
        }
        return '';
    })();

    if (!title) return null;

    return (
        <Box sx={{ px: 2, pb: 1 }}>
            <Box
                sx={(t) => ({
                    border: '1px solid',
                    borderColor: alpha(t.palette.primary.main, 0.15),
                    borderRadius: 2,
                    overflow: 'hidden',
                    background: t.palette.background.paper,
                })}
            >
                <Box
                    sx={{
                        display: 'flex',
                        gap: 1.5,
                        p: 1.5,
                        alignItems: 'stretch',
                        flexDirection: { xs: 'column', sm: 'row' },
                    }}
                >
                    <Box
                        sx={(t) => ({
                            width: { xs: '100%', sm: 110 },
                            minWidth: { xs: '100%', sm: 110 },
                            height: { xs: 90, sm: 90 },
                            borderRadius: 2,
                            overflow: 'hidden',
                            background: image
                                ? alpha(t.palette.text.primary, 0.06)
                                : `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.12)}, ${alpha(t.palette.secondary.main, 0.08)})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        })}
                    >
                        {image ? (
                            <Box
                                component="img"
                                src={image}
                                alt="Request preview"
                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <FrontHandRoundedIcon sx={{ fontSize: 36, color: 'primary.main', opacity: 0.6 }} />
                        )}
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.5, overflow: 'hidden' }}>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 900,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.2,
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere',
                            }}
                        >
                            {title}
                        </Typography>

                        {(location || urgencyLabel) ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                {location ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <LocationOnRoundedIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                                        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
                                            {location}
                                        </Typography>
                                    </Box>
                                ) : null}
                                {urgencyLabel ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <AccessTimeRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                                            {urgencyLabel}
                                        </Typography>
                                    </Box>
                                ) : null}
                            </Box>
                        ) : null}

                        {containsHtml(description) ? (
                            <Box sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                color: 'text.secondary',
                            }}>
                                <RichTextDisplay
                                    html={description}
                                    sx={{ fontSize: '0.875rem', lineHeight: 1.3, color: 'inherit' }}
                                />
                            </Box>
                        ) : snippet ? (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    lineHeight: 1.3,
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere',
                                }}
                            >
                                {snippet}
                            </Typography>
                        ) : null}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Facebook share quote — builds a friendly CTA + snippet for the sharer
   quote param so the post text tells people to check it out on LL.
   ═══════════════════════════════════════════════════════════════════════════ */
function buildFacebookQuote({ contentType, post, comment, event, job, business, artist, profile, listing, group, service, request, article, isGroupShare }) {
    const clip = (s, max = 120) => {
        const t = (s || '').replace(/\s+/g, ' ').trim();
        return t.length > max ? `${t.slice(0, max).trimEnd()}…` : t;
    };

    switch (contentType) {
        case 'post': {
            const p = buildPostText(post);
            const title = p.title || '';
            const body = p.snippet || '';
            if (isGroupShare) {
                return title
                    ? `${title} — Check out this group post on The Local Lantern!`
                    : 'Check out this group post on The Local Lantern!';
            }
            return title
                ? `${clip(title)} — Check out this post on The Local Lantern!`
                : body
                    ? `"${clip(body, 100)}" — See this post on The Local Lantern!`
                    : 'Check out this post on The Local Lantern!';
        }
        case 'comment': {
            const body = stripHtml(safeStr(comment?.content || comment?.text || comment?.body || '')).trim();
            return body
                ? `"${clip(body, 100)}" — See this conversation on The Local Lantern!`
                : 'Check out this conversation on The Local Lantern!';
        }
        case 'event': {
            const e = buildEventText(event);
            const dt = formatEventDateTime(event);
            const parts = [e.title || 'This event'];
            if (dt) parts.push(dt);
            if (e.location && e.location !== 'Statewide') parts.push(e.location);
            return `${parts.join(' · ')} — Check it out on The Local Lantern!`;
        }
        case 'job': {
            const title = safeStr(job?.title || job?.jobTitle || job?.job_title || '').trim();
            const company = safeStr(job?.company || job?.companyName || job?.company_name || '').trim();
            const loc = safeStr(job?.locationLabel || job?.location_label || job?.location || '').trim();
            const parts = [title || 'New job listing'];
            if (company) parts.push(`at ${company}`);
            if (loc) parts.push(`in ${loc}`);
            return `${parts.join(' ')} — Apply on The Local Lantern!`;
        }
        case 'business': {
            const name = safeStr(business?.name || business?.business_name || '').trim();
            const cat = safeStr(business?.category_name || business?.category || '').trim();
            return name
                ? `Check out ${name}${cat ? ` (${cat})` : ''} on The Local Lantern!`
                : 'Check out this local business on The Local Lantern!';
        }
        case 'artist': {
            const name = safeStr(artist?.name || artist?.artist_name || artist?.artistName || '').trim();
            const genre = safeStr(artist?.genre || artist?.primary_genre || '').trim();
            return name
                ? `Check out ${name}${genre ? ` — ${genre}` : ''} on The Local Lantern!`
                : 'Check out this local artist on The Local Lantern!';
        }
        case 'profile': {
            const first = safeStr(profile?.first_name || profile?.firstName).trim();
            const last = safeStr(profile?.last_name || profile?.lastName).trim();
            const name = `${first} ${last}`.trim();
            return name
                ? `Check out ${name}'s profile on The Local Lantern!`
                : 'Check out this profile on The Local Lantern!';
        }
        case 'listing': {
            const lp = buildListingText(listing);
            const parts = [lp.title || 'This listing'];
            if (lp.price) parts.push(lp.price);
            return `${parts.join(' — ')} — Find it on The Local Lantern Marketplace!`;
        }
        case 'group': {
            const gp = buildGroupText(group);
            return gp.name
                ? `Join ${gp.name} on The Local Lantern!`
                : 'Check out this group on The Local Lantern!';
        }
        case 'service': {
            const title = safeStr(service?.title || service?.name || '').trim();
            return title
                ? `Need ${title}? Find it on The Local Lantern!`
                : 'Check out this service on The Local Lantern!';
        }
        case 'service_request': {
            const rTitle = safeStr(request?.title || request?.name || '').trim();
            return rTitle
                ? `Looking for help: ${clip(rTitle)} — Check it out on The Local Lantern!`
                : 'Check out this service request on The Local Lantern!';
        }
        // Slice 4a: news article share
        case 'article': {
            const ap = buildArticleText(article);
            const source = ap.sourceName ? ` (${ap.sourceName})` : '';
            return ap.title
                ? `${clip(ap.title)}${source} — Read on The Local Lantern!`
                : 'Check out this news article on The Local Lantern!';
        }
        default:
            return 'Check this out on The Local Lantern!';
    }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Facebook share image — picks the best thumbnail for the OG preview card
   ═══════════════════════════════════════════════════════════════════════════ */
function pickFacebookImage({ contentType, post, event, business, artist, profile, listing, group, service, request, article }) {
    switch (contentType) {
        case 'post':     return pickPostImage(post);
        case 'event':    return pickEventImage(event);
        case 'listing':  return pickListingImage(listing);
        case 'group':    return pickGroupImage(group);
        case 'article':  return pickArticleImage(article);
        case 'business':
            return safeStr(business?.avatar_url || business?.logo_url || business?.logoUrl || business?.cover_url || '').trim();
        case 'artist':
            return safeStr(artist?.avatar_url || artist?.avatarUrl || artist?.profile_picture || '').trim();
        case 'profile':
            return safeStr(profile?.avatar_url || profile?.avatarUrl || profile?.profile_picture || profile?.profilePicture || '').trim();
        case 'service':
            return safeStr(service?.coverUrl || service?.cover_url || service?.image_url || service?.imageUrl || '').trim();
        case 'service_request': {
            const photos = Array.isArray(request?.photos) ? request.photos : [];
            for (const p of photos) {
                if (!p) continue;
                if (typeof p === 'string') { const s = p.trim(); if (s && s !== 'null') return s; }
                if (typeof p === 'object') {
                    const u = (p.url || p.photo_url || p.photoUrl || p.src || p.path || '').trim();
                    if (u && u !== 'null') return u;
                }
            }
            return '';
        }
        default:
            return '';
    }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * @param {object}  props
 * @param {'post'|'comment'|'event'|'job'|'business'|'artist'|'profile'|'listing'|'group'|'service'|'service_request'|'article'} props.contentType
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {object}  [props.post]        — post object (contentType='post') or parent post (contentType='comment')
 * @param {object}  [props.comment]     — comment object (contentType='comment')
 * @param {object}  [props.event]       — event object (contentType='event')
 * @param {object}  [props.job]         — job object (contentType='job')
 * @param {object}  [props.business]    — business object (contentType='business')
 * @param {object}  [props.artist]      — artist object (contentType='artist')
 * @param {object}  [props.profile]     — user profile object (contentType='profile')
 * @param {object}  [props.listing]     — marketplace listing object (contentType='listing')
 * @param {object}  [props.group]       — group object (contentType='group')
 * @param {object}  [props.service]     — service object (contentType='service')
 * @param {object}  [props.request]     — service request object (contentType='service_request')
 * @param {object}  [props.article]     — news article object (contentType='article') — Slice 4a
 * @param {object}  props.viewer        — logged-in user (may be { user: {...} } wrapper)
 * @param {string}  [props.shareMode]   — 'group' for group shares (contentType='post')
 * @param {string}  [props.postSlug]    — business slug for comment URL building
 * @param {(data: object) => void} [props.onShared]
 */
export default function ShareDialog({
                                        contentType = 'post',
                                        open,
                                        onClose,
                                        post,
                                        comment,
                                        event,
                                        job,
                                        business,
                                        artist,
                                        profile,
                                        listing,
                                        group,
                                        service,
                                        request,
                                        article,
                                        viewer: viewerProp,
                                        shareMode,
                                        postSlug,
                                        onShared,
                                        dialogSx,
                                    }) {
    const api = process.env.REACT_APP_API_URL;
    const navigate = useNavigate();
    const theme = useTheme();
    const shareMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // ── Unwrap viewer (profile endpoint returns { user: {...} }) ──
    const viewer = viewerProp?.user || viewerProp || null;

    // ── Active account context ──
    const { activeAccount, activeAccountType, isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId } = useActiveAccount();
    const acctType = (activeAccountType || 'personal').toLowerCase();
    const isOnBusinessOrArtist = acctType === 'business' || acctType === 'artist';

    const effectiveViewerHandle = viewer?.handle || viewer?.username || '';

    const effectiveViewerName = (() => {
        if (isOnBusinessOrArtist && activeAccount) {
            return activeAccount.name || activeAccount.business_name || activeAccount.artist_name || '';
        }
        const first = safeStr(viewer?.first_name);
        const last = safeStr(viewer?.last_name);
        return `${first} ${last}`.trim() || viewer?.handle || '';
    })();

    const isGroupShare = contentType === 'post' && shareMode === 'group';

    // ── State ──
    const [loading, setLoading] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [successToast, setSuccessToast] = useState({ open: false, msg: '' });
    const [errorToast, setErrorToast] = useState({ open: false, msg: '' });
    const [shareTab, setShareTab] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(open);

    // Sync internal open state with parent prop (but only to open, not to close after share)
    useEffect(() => {
        if (open) setDialogOpen(true);
    }, [open]);

    const [queryDraft, setQueryDraft] = useState('');
    const [countyDraft, setCountyDraft] = useState('');
    const [cityDraft, setCityDraft] = useState('');

    const [query, setQuery] = useState('');
    const [county, setCounty] = useState('');
    const [city, setCity] = useState('');

    const [followers, setFollowers] = useState([]);
    const [, setFollowersCount] = useState(0);
    const [selected, setSelected] = useState(() => new Map());

    // ── Derived IDs ──
    const postId = post?.id ?? '';
    const commentId = comment?.id ?? '';
    const eventId = event?.id ?? '';
    const jobId = job?.id ?? '';
    const businessId = business?.id ?? '';
    const businessSlugId = safeStr(business?.slug || business?.handle || '').trim();
    const artistId = artist?.id ?? artist?.artist_id ?? '';
    const artistHandle = safeStr(artist?.handle || artist?.artist_handle || artist?.artistHandle || '').trim();
    const profileId = profile?.id ?? profile?.public_id ?? profile?.user_id ?? profile?.userId ?? '';
    const profileHandle = safeStr(profile?.handle || profile?.username || '').trim();
    const listingId = listing?.id ?? '';
    const groupId = group?.id ?? '';
    const groupSlugId = safeStr(group?.group_username || group?.groupUsername || group?.slug || group?.group_slug || '').trim();
    const serviceId = service?.id ?? '';
    const requestId = request?.id ?? '';
    const articleId = article?.id ?? '';

    // Keep a ref to the latest profile prop so handleShareInternal never has a stale ID
    const profileRef = useRef(profile);
    profileRef.current = profile;

    // ── Deep link building ──
    const publicSite = (process.env.REACT_APP_PUBLIC_SITE_URL || '').trim();
    const shareOrigin = publicSite || (typeof window !== 'undefined' ? window.location.origin : 'https://thelocallantern.com');

    const deepLink = useMemo(() => {
        if (contentType === 'profile') {
            return profileHandle
                ? `${shareOrigin}/${encodeURIComponent(profileHandle)}`
                : `${shareOrigin}/profile/${encodeURIComponent(profileId)}`;
        }

        if (contentType === 'business') {
            return businessSlugId
                ? `${shareOrigin}/${encodeURIComponent(businessSlugId)}`
                : `${shareOrigin}/business/${encodeURIComponent(businessId)}`;
        }

        if (contentType === 'artist') {
            return artistHandle
                ? `${shareOrigin}/${encodeURIComponent(artistHandle)}`
                : `${shareOrigin}/music/artists/${encodeURIComponent(artistId)}`;
        }

        if (contentType === 'comment') {
            // Only use a slug prefix for business/music page posts — never a personal user handle.
            // postSlug and businessSlug/pageSlug are explicitly passed for business page posts.
            // post?.slug or post?.handle may resolve to the commenter's personal handle which
            // would produce an invalid URL like /butlerb/posts/240 instead of /posts/240.
            const slug = safeStr(
                postSlug || post?.businessSlug || post?.pageSlug || post?.page_slug || ''
            ).trim();
            let base = '';
            if (slug && postId) {
                base = `${shareOrigin}/${slug}/posts/${postId}`;
            } else if (postId) {
                base = `${shareOrigin}/posts/${postId}`;
            } else {
                base = shareOrigin;
            }
            return commentId ? `${base}?comment=${commentId}` : base;
        }

        if (contentType === 'event') {
            return `${shareOrigin}/events/${encodeURIComponent(eventId)}`;
        }

        if (contentType === 'job') {
            return `${shareOrigin}/jobs/${encodeURIComponent(jobId)}`;
        }

        if (contentType === 'listing') {
            return `${shareOrigin}/marketplace/${encodeURIComponent(listingId)}`;
        }

        if (contentType === 'service') {
            return `${shareOrigin}/services/${encodeURIComponent(serviceId)}`;
        }

        if (contentType === 'service_request') {
            return `${shareOrigin}/services/requests/${encodeURIComponent(requestId)}`;
        }

        if (contentType === 'group') {
            return groupSlugId
                ? `${shareOrigin}/${encodeURIComponent(groupSlugId)}`
                : `${shareOrigin}/groups/${encodeURIComponent(groupId)}`;
        }

        // Slice 4a: news article deep link → matches App.js route
        if (contentType === 'article') {
            return `${shareOrigin}/news/article/${encodeURIComponent(articleId)}`;
        }

        // contentType === 'post'
        const businessSlug = post?.businessSlug || post?.pageSlug || post?.page_slug || post?.slug || '';
        const isBusinessPost = !isGroupShare && Boolean(businessSlug);
        const groupSlug = isGroupShare
            ? (safeStr(post?.slug) || safeStr(post?.group_slug) || encodeURIComponent(postId))
            : '';

        const postPath = isGroupShare
            ? `/groups/${groupSlug}`
            : isBusinessPost
                ? `/${encodeURIComponent(businessSlug)}/posts/${encodeURIComponent(postId)}`
                : `/posts/${encodeURIComponent(postId)}`;

        return `${shareOrigin}${postPath}`;
    }, [contentType, shareOrigin, postId, commentId, eventId, jobId, listingId, serviceId, requestId, groupId, groupSlugId, businessId, businessSlugId, artistId, artistHandle, profileId, profileHandle, postSlug, post, isGroupShare, articleId]);

    const selectedUsers = useMemo(() => Array.from(selected.values()), [selected]);

    const tileCfg = TILE_CONFIG[contentType] || TILE_CONFIG.post;

    // ── Dialog close handler ──
    const handleDialogClose = useCallback(
        (_event, reason) => {
            if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
            setDialogOpen(false);
            onClose();
        },
        [onClose]
    );

    // ── Load followers (account-scoped, matching SocialHome) ──
    const activeAccountId = isBusinessAccount
        ? (activeBusinessId || activeAccount?.id || '')
        : isArtistAccount
            ? (activeArtistId || activeAccount?.id || '')
            : '';
    const activeAcctType = isBusinessAccount ? 'business' : isArtistAccount ? 'artist' : 'personal';

    useEffect(() => {
        if (!open) return;

        const lookupKey = effectiveViewerHandle || (viewer?.id ? String(viewer.id) : '');
        if (!lookupKey) return;

        let alive = true;
        setLoading(true);

        (async () => {
            try {
                const isAccountScoped = activeAccountId && activeAcctType !== 'personal';

                // Build query params with account context
                const params = new URLSearchParams();
                if (isAccountScoped) {
                    params.set('account_id', String(activeAccountId));
                    params.set('account_type', activeAcctType);
                }
                const qs = params.toString();
                const suffix = qs ? `?${qs}` : '';

                // Build headers for account-scoped requests
                const headers = {};
                if (isAccountScoped) {
                    headers['x-account-type'] = activeAcctType;
                    if (activeAcctType === 'business') {
                        headers['x-business-id'] = String(activeAccountId);
                    } else if (activeAcctType === 'artist') {
                        headers['x-artist-id'] = String(activeAccountId);
                    }
                }

                // For business/artist accounts, use the follows endpoint which
                // properly scopes by account type. The old /users/social/:who
                // only returns the personal social graph.
                let res;
                if (isAccountScoped) {
                    try {
                        res = await axios.get(
                            `${api}/api/follows/social/${encodeURIComponent(lookupKey)}${suffix}`,
                            { withCredentials: true, headers }
                        );
                    } catch {
                        // Fallback to alternate URL pattern
                        res = await axios.get(
                            `/api/follows/social/${encodeURIComponent(lookupKey)}${suffix}`,
                            { withCredentials: true, headers }
                        );
                    }
                } else {
                    res = await axios.get(
                        `${api}/users/social/${encodeURIComponent(lookupKey)}`,
                        { withCredentials: true }
                    );
                }

                if (!alive) return;

                const nextFollowers = Array.isArray(res.data?.followers) ? res.data.followers : [];
                const nextCounts = res.data?.counts || {};

                setFollowers(nextFollowers);
                setFollowersCount(Number(nextCounts.followers ?? nextFollowers.length) || 0);
            } catch {
                if (alive) {
                    setFollowers([]);
                    setFollowersCount(0);
                }
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [api, open, effectiveViewerHandle, viewer?.id, activeAccountId, activeAcctType]);

    // ── Reset on open ──
    useEffect(() => {
        if (!open) return;

        setSelected((prev) => (prev.size === 0 ? prev : new Map()));
        setQueryDraft('');
        setCountyDraft('');
        setCityDraft('');
        setQuery('');
        setCounty('');
        setCity('');
        setShareTab(0);
    }, [open]);

    // ── Filter handlers ──
    const applyFilters = useCallback(() => {
        setQuery(queryDraft);
        setCounty(countyDraft);
        setCity(cityDraft);
        setShareTab(0);
    }, [cityDraft, countyDraft, queryDraft]);

    const clearFilters = useCallback(() => {
        setQueryDraft('');
        setCountyDraft('');
        setCityDraft('');
        setQuery('');
        setCounty('');
        setCity('');
        setShareTab(0);
    }, []);

    const toggle = useCallback((u) => {
        setSelected((prev) => {
            const next = new Map(prev);
            if (next.has(u.id)) next.delete(u.id);
            else next.set(u.id, u);
            return next;
        });
    }, []);

    const removeSelectedById = useCallback((id) => {
        setSelected((prev) => {
            const next = new Map(prev);
            // Handle both string and number ID types
            if (next.has(id)) {
                next.delete(id);
            } else if (next.has(Number(id))) {
                next.delete(Number(id));
            } else if (next.has(String(id))) {
                next.delete(String(id));
            }
            return next;
        });
    }, []);

    const baseList = useMemo(() => {
        // When on a business/artist account, the viewer's personal profile is
        // a legitimate follower — don't filter it out. Only exclude self when
        // sharing from a personal account (to avoid sharing to yourself).
        if (isOnBusinessOrArtist) return followers;
        return followers.filter((u) => Number(u?.id) !== Number(viewer?.id));
    }, [followers, viewer?.id, isOnBusinessOrArtist]);

    const filteredList = useMemo(() => {
        const q = query.trim().toLowerCase();
        const cty = city.trim().toLowerCase();
        const cnty = county.trim().toLowerCase();

        return baseList.filter((u) => {
            const first = safeStr(u?.first_name).trim();
            const last = safeStr(u?.last_name).trim();
            const full = `${first} ${last}`.replace(/\s+/g, ' ').trim().toLowerCase();
            const handle = safeStr(u?.handle || u?.username).trim().toLowerCase();

            const userCity = safeStr(u?.city || u?.city_name).trim().toLowerCase();
            const userCounty = safeStr(u?.county || u?.county_name).trim().toLowerCase();

            const matchesQuery = !q || full.includes(q) || handle.includes(q);
            const matchesCity = !cty || userCity === cty;
            const matchesCounty = !cnty || userCounty === cnty;

            return matchesQuery && matchesCity && matchesCounty;
        });
    }, [baseList, city, county, query]);

    const xsCols = 2;
    const smCols = tileCfg.smColsMax;

    // ── Type-specific actions ──
    // ── Facebook share quote (memoised) ──
    const fbQuote = useMemo(() => buildFacebookQuote({
        contentType, post, comment, event, job, business, artist, profile, listing, group, service, request, isGroupShare,
    }), [contentType, post, comment, event, job, business, artist, profile, listing, group, service, request, isGroupShare]);

    const handleFacebook = useCallback(async () => {
        // Mobile: Facebook deprecated their sharer.php URL scheme for the
        // mobile app in ~2018. Tapping a sharer.php link now opens the FB
        // app to the home feed with no compose screen or preview. The only
        // reliable way to share to Facebook from mobile web is the Web
        // Share API, which delegates to the OS share sheet — and the FB
        // app DOES accept OS-level share intents and opens its compose
        // screen with the URL + preview properly.
        //
        // Feature-detect navigator.share + mobile UA. If both are present,
        // use the native share sheet. Otherwise fall through to the classic
        // sharer.php URL, which still works perfectly on desktop.
        const isMobile = typeof navigator !== 'undefined' &&
            /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
        const canShare = typeof navigator !== 'undefined' &&
            typeof navigator.share === 'function';

        if (isMobile && canShare) {
            try {
                await navigator.share({
                    title: fbQuote.split('—')[0]?.trim() || 'Check this out!',
                    text: fbQuote,
                    url: deepLink,
                });
                return;
            } catch {
                // User cancelled the share sheet, or the browser refused.
                // Fall through to sharer.php as a last-resort fallback —
                // on mobile this still lands in the FB app's home feed,
                // but it's no worse than doing nothing.
            }
        }

        let shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(deepLink)}`;
        if (fbQuote) shareUrl += `&quote=${encodeURIComponent(fbQuote)}`;
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }, [deepLink, fbQuote]);

    const handleCopyLink = useCallback(() => {
        if (deepLink) {
            navigator.clipboard.writeText(deepLink).then(() => {
                setSuccessToast({ open: true, msg: 'Link copied to clipboard' });
            }).catch(() => {});
        }
    }, [deepLink]);

    // ── Native share (mobile) ──
    const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

    const handleNativeShare = useCallback(async () => {
        if (!canNativeShare) return;
        try {
            await navigator.share({
                title: fbQuote.split('—')[0]?.trim() || 'Check this out!',
                text: fbQuote,
                url: deepLink,
            });
        } catch {
            // User cancelled or error — ignore
        }
    }, [canNativeShare, deepLink, fbQuote]);

    // ── Mobile preview collapse ──
    const [previewExpanded, setPreviewExpanded] = useState(false);

    const handleViewPage = useCallback(() => {
        setDialogOpen(false);
        onClose();
        if (contentType === 'profile') {
            const handle = profileHandle || profileId;
            if (handle) navigate(`/${encodeURIComponent(handle)}`);
        } else if (contentType === 'event') {
            navigate(`/events/${encodeURIComponent(eventId)}`, { state: { event, fromShareDialog: true } });
        } else if (contentType === 'job') {
            navigate(`/jobs/${encodeURIComponent(jobId)}`, { state: { job, fromShareDialog: true } });
        } else if (contentType === 'business') {
            const slug = businessSlugId || businessId;
            if (slug) navigate(`/${encodeURIComponent(slug)}`, { state: { fromShareDialog: true }, replace: true });
        } else if (contentType === 'artist') {
            const handle = artistHandle || artistId;
            if (handle) navigate(`/${encodeURIComponent(handle)}`);
        } else if (contentType === 'listing') {
            navigate(`/marketplace/${encodeURIComponent(listingId)}`, { state: { listing, fromShareDialog: true } });
        } else if (contentType === 'service') {
            navigate(`/services/${encodeURIComponent(serviceId)}`, { state: { service, fromShareDialog: true } });
        } else if (contentType === 'service_request') {
            navigate(`/services/requests/${encodeURIComponent(requestId)}`, { state: { request, fromShareDialog: true } });
        } else if (contentType === 'group') {
            const slug = groupSlugId || groupId;
            if (slug) navigate(groupSlugId ? `/${encodeURIComponent(groupSlugId)}` : `/groups/${encodeURIComponent(groupId)}`, { state: { group, fromShareDialog: true } });
        } else if (contentType === 'article') {
            // Slice 4a: news article full-page route
            navigate(`/news/article/${encodeURIComponent(articleId)}`, { state: { article, fromShareDialog: true } });
        } else {
            // Post or group
            const businessSlug = post?.businessSlug || post?.pageSlug || post?.page_slug || post?.slug || '';
            const isBusinessPost = !isGroupShare && Boolean(businessSlug);
            const groupSlug = isGroupShare
                ? (safeStr(post?.slug) || safeStr(post?.group_slug) || encodeURIComponent(postId))
                : '';

            const postPath = isGroupShare
                ? `/groups/${groupSlug}`
                : isBusinessPost
                    ? `/${encodeURIComponent(businessSlug)}/posts/${encodeURIComponent(postId)}`
                    : `/posts/${encodeURIComponent(postId)}`;

            navigate(postPath, { state: { post, sharedPost: post, fromShareDialog: true } });
        }
    }, [onClose, navigate, contentType, eventId, event, jobId, job, businessSlugId, businessId, artistHandle, artistId, profileHandle, profileId, listingId, listing, serviceId, service, requestId, request, groupId, groupSlugId, group, post, postId, isGroupShare, articleId, article]);

    // ── Share handler (parameterized by contentType) ──
    const handleShareInternal = useCallback(async () => {
        const ids = Array.from(selected.keys());
        if (!ids.length) return;

        setSharing(true);

        try {
            let sharePayloadId = '';
            let shareType = '';

            // Debug: log profile ID resolution for profile shares
            if (contentType === 'profile') {
                const p = profileRef.current;
                console.log('[ShareDialog] profile share — profile keys:', p ? Object.keys(p).filter(k => /id/i.test(k)).map(k => `${k}=${p[k]}`) : 'null', 'derived profileId:', profileId);
            }

            if (contentType === 'comment') {
                sharePayloadId = String(commentId);
                shareType = 'comment';
            } else if (contentType === 'event') {
                sharePayloadId = eventId;
                shareType = 'event';
            } else if (contentType === 'job') {
                sharePayloadId = String(jobId);
                shareType = 'job';
            } else if (contentType === 'business') {
                sharePayloadId = String(businessId);
                shareType = 'business';
            } else if (contentType === 'artist') {
                sharePayloadId = String(artistId);
                shareType = 'artist';
            } else if (contentType === 'profile') {
                // Read from ref to guarantee latest value (avoids stale closure)
                const p = profileRef.current;
                const freshId = p?.id ?? p?.public_id ?? p?.user_id ?? p?.userId ?? profileId ?? '';
                sharePayloadId = String(freshId);
                shareType = 'profile';
                if (!sharePayloadId) {
                    console.error('[ShareDialog] profile share FAILED — no ID found. profile object:', JSON.stringify(p, null, 2));
                }
            } else if (contentType === 'listing') {
                sharePayloadId = String(listingId);
                shareType = 'listing';
            } else if (contentType === 'service') {
                sharePayloadId = String(serviceId);
                shareType = 'service';
            } else if (contentType === 'service_request') {
                sharePayloadId = String(requestId);
                shareType = 'service_request';
            } else if (contentType === 'group') {
                sharePayloadId = String(groupId);
                shareType = 'group';
            } else if (contentType === 'article') {
                // Slice 4a: news article shares
                sharePayloadId = String(articleId);
                shareType = 'news_article';
            } else {
                // post
                const businessSlug = post?.businessSlug || post?.pageSlug || post?.page_slug || post?.slug || '';
                const isBusinessPost = !isGroupShare && Boolean(businessSlug);
                const artistId = post?.artist_id || post?.artistId || null;
                const artistHandle = post?.artistHandle || post?.artist_handle || post?.artistSlug || '';
                const isArtistPost = !isGroupShare && !isBusinessPost && (Boolean(artistId) || Boolean(artistHandle) || post?.category === 'artist_post');
                sharePayloadId = postId;
                shareType = isGroupShare ? 'group' : (isBusinessPost ? 'business_post' : (isArtistPost ? 'music_post' : 'post'));
            }

            // Build account-scoping headers so the backend knows the sharer
            // is a business/artist account (not the personal account behind it).
            // Without these, the backend may reject sharing to your own personal
            // profile because it sees the same user_id for sharer and recipient.
            const shareHeaders = {};
            if (isOnBusinessOrArtist && activeAccountId) {
                shareHeaders['x-account-type'] = activeAcctType;
                if (activeAcctType === 'business') {
                    shareHeaders['x-business-id'] = String(activeAccountId);
                } else if (activeAcctType === 'artist') {
                    shareHeaders['x-artist-id'] = String(activeAccountId);
                }
            }

            await axios.post(
                `${api}/shares`,
                {
                    postId: sharePayloadId,
                    postType: shareType,
                    recipientIds: ids,
                    deepLink,
                    sharerAccountType: acctType,
                    sharerAccountSlug: isOnBusinessOrArtist
                        ? (activeAccount?.slug || activeAccount?.handle || '')
                        : '',
                    // Include account IDs in the body as well for backends
                    // that read them from the payload rather than headers.
                    ...(isOnBusinessOrArtist && activeAccountId ? {
                        business_id: activeAcctType === 'business' ? Number(activeAccountId) : undefined,
                        artist_id: activeAcctType === 'artist' ? Number(activeAccountId) : undefined,
                    } : {}),
                    // Profile share metadata — so notifications display the shared profile's name
                    ...(contentType === 'profile' && profileRef.current ? {
                        profileName: `${safeStr(profileRef.current.first_name)} ${safeStr(profileRef.current.last_name)}`.trim() || profileRef.current.handle || '',
                        profileHandle: profileRef.current.handle || profileRef.current.username || '',
                        profileId: profileRef.current.id ?? profileRef.current.public_id ?? profileRef.current.user_id ?? '',
                    } : {}),
                    // Business share metadata — so notifications display the business name and navigate to the right page
                    ...(contentType === 'business' && business ? {
                        businessName: safeStr(business.name || business.business_name || '').trim(),
                        businessSlug: safeStr(business.slug || business.handle || '').trim(),
                        businessId: String(businessId),
                    } : {}),
                    // Artist share metadata
                    ...(contentType === 'artist' && artist ? {
                        artistName: safeStr(artist.name || artist.artist_name || artist.artistName || '').trim(),
                        artistHandle: safeStr(artist.handle || artist.artist_handle || artist.artistHandle || '').trim(),
                        artistId: String(artistId),
                    } : {}),
                    // Service request share metadata — so notifications display the request title
                    ...(contentType === 'service_request' && request ? {
                        requestTitle: safeStr(request.title || request.name || '').trim(),
                        requestId: String(requestId),
                    } : {}),
                    // Slice 4a: news article share metadata — so the notification
                    // card can render title/source/image without a second fetch
                    ...(contentType === 'article' && article ? {
                        articleTitle: safeStr(article.title || '').trim(),
                        articleSourceName: safeStr(article.source_name || article.sourceName || '').trim(),
                        articleImageUrl: safeStr(article.image_url || article.imageUrl || '').trim(),
                        articleUrl: safeStr(article.url || '').trim(),
                        articleId: String(articleId),
                    } : {}),
                },
                { withCredentials: true, headers: shareHeaders }
            );

            // Fire-and-forget: send dedicated service-request share notifications
            // (author + recipient notification types) via the services API.
            if (contentType === 'service_request' && requestId) {
                axios.post(
                    `${api}/api/services/requests/${encodeURIComponent(requestId)}/share-notify`,
                    { recipientIds: ids },
                    { withCredentials: true, headers: shareHeaders }
                ).catch(() => { /* non-critical */ });
            }

            setSuccessToast({
                open: true,
                msg: `Shared with ${ids.length} ${ids.length === 1 ? 'person' : 'people'}!`,
            });

            if (onShared) {
                if (contentType === 'comment') {
                    onShared({ commentId, postId, recipientIds: ids });
                } else if (contentType === 'event') {
                    onShared({ eventId, recipientIds: ids });
                } else if (contentType === 'job') {
                    onShared({ jobId, recipientIds: ids });
                } else if (contentType === 'business') {
                    onShared({ businessId, recipientIds: ids });
                } else if (contentType === 'artist') {
                    onShared({ artistId, recipientIds: ids });
                } else if (contentType === 'profile') {
                    onShared({ profileId, recipientIds: ids });
                } else if (contentType === 'listing') {
                    onShared({ listingId, recipientIds: ids });
                } else if (contentType === 'service_request') {
                    onShared({ requestId, recipientIds: ids });
                } else if (contentType === 'group') {
                    onShared({ groupId, recipientIds: ids });
                } else if (contentType === 'article') {
                    onShared({ articleId, recipientIds: ids });
                } else {
                    onShared({ postId, recipientIds: ids });
                }
            }
            // Close the dialog visually so the toast is unobstructed
            setDialogOpen(false);
            // Brief delay so the component stays mounted for the toast to render
            setTimeout(() => { onClose(); }, 1500);
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Failed to share. Please try again.';
            setErrorToast({ open: true, msg });
        } finally {
            setSharing(false);
        }
    }, [
        api, onClose, onShared, selected, deepLink, acctType, isOnBusinessOrArtist, activeAccount,
        activeAccountId, activeAcctType,
        contentType, postId, commentId, eventId, jobId, listingId, groupId, businessId, artistId, profileId, serviceId, requestId, request, post, profile, isGroupShare,
    ]);

    // ── UserTile ──
    const UserTile = useCallback(
        ({ u }) => {
            const sel = selected.has(u.id);
            const displayName = `${safeStr(u.first_name)} ${safeStr(u.last_name)}`.replace(/\s+/g, ' ').trim();
            const username = safeStr(u.handle || u.username).trim();
            const acctType = getUserAccountType(u);
            const acctProfileType = String(u?.profile_type || u?.profileType || '').toLowerCase();
            const acctLabel = getAccountTypeLabel(acctType, acctProfileType);
            const avatarUrl = getUserAvatarSrc(u);
            const hasAvatar = Boolean(avatarUrl);
            const acctColor = getAccountTypeColor(acctType, theme.palette);

            const avatarSx = {
                width: tileCfg.avatarSize,
                height: tileCfg.avatarSize,
                borderRadius: hasAvatar ? `${tileCfg.avatarRadius}px` : `${tileCfg.avatarRadius}px`,
                objectFit: 'cover',
            };

            return (
                <Box sx={tileWrapSx} onClick={() => toggle(u)}>
                    <Box sx={makeTileSx(sel, theme, tileCfg)}>
                        <Avatar
                            src={hasAvatar ? avatarUrl : undefined}
                            alt={displayName || username || 'User'}
                            imgProps={hasAvatar ? { style: avatarSx } : undefined}
                            sx={{
                                ...avatarSx,
                                bgcolor: hasAvatar
                                    ? 'grey.600'
                                    : (acctType === 'business' || acctType === 'artist')
                                        ? alpha(theme.palette.primary.main, 0.08)
                                        : alpha(theme.palette.text.primary, 0.06),
                                color: (acctType === 'business' || acctType === 'artist')
                                    ? theme.palette.primary.main
                                    : theme.palette.text.secondary,
                            }}
                            variant="rounded"
                        >
                            {!hasAvatar && getAccountTypeIcon(acctType, tileCfg.avatarSize * 0.38, acctProfileType)}
                        </Avatar>

                        <Typography
                            variant="body2"
                            sx={{
                                mt: 0.5,
                                fontFamily: theme.typography.fontFamily,
                                fontWeight: 800,
                                textAlign: 'center',
                                lineHeight: 1.15,
                                px: 0.5,
                                width: '100%',
                                minWidth: 0,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                            }}
                        >
                            {displayName || ' '}
                        </Typography>

                        <Box
                            component="div"
                            title={username ? `@${username}` : ''}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                minWidth: 0,
                                px: 0.25,
                                lineHeight: 1.1,
                                fontSize: '0.7rem',
                                fontFamily: theme.typography.fontFamily,
                                color: theme.palette.text.secondary,
                            }}
                        >
                            {username ? (
                                <>
                                    <Box component="span" sx={{ flexShrink: 0 }}>@</Box>
                                    <Box
                                        component="span"
                                        sx={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            minWidth: 0,
                                        }}
                                    >
                                        {username}
                                    </Box>
                                </>
                            ) : ' '}
                        </Box>

                        {acctLabel && (
                            <Typography
                                variant="caption"
                                component="div"
                                sx={{
                                    fontFamily: theme.typography.fontFamily,
                                    textAlign: 'center',
                                    fontWeight: 700,
                                    fontSize: '0.65rem',
                                    lineHeight: 1,
                                    color: (acctType === 'business' || acctType === 'artist')
                                        ? theme.palette.primary.main
                                        : theme.palette.text.secondary,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 0.3,
                                    width: '100%',
                                    minWidth: 0,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {acctType === 'business' && <StorefrontOutlinedIcon sx={{ fontSize: 10, color: theme.palette.primary.main, flexShrink: 0 }} />}
                                {acctType === 'artist' && <MusicNoteRoundedIcon sx={{ fontSize: 10, color: theme.palette.primary.main, flexShrink: 0 }} />}
                                {acctLabel}
                            </Typography>
                        )}

                        {sel && (
                            <CheckCircleIcon
                                sx={(t) => ({
                                    position: 'absolute',
                                    right: contentType === 'post' ? 10 : 6,
                                    top: contentType === 'post' ? 10 : 6,
                                    color: 'primary.main',
                                    fontSize: contentType === 'post' ? 20 : 26,
                                    filter: contentType === 'post'
                                        ? undefined
                                        : `drop-shadow(0 1px 2px ${alpha(t.palette.text.primary, 0.2)})`,
                                    background: contentType === 'post' ? undefined : t.palette.background.paper,
                                    borderRadius: contentType === 'post' ? undefined : '50%',
                                })}
                            />
                        )}
                    </Box>
                </Box>
            );
        },
        [selected, toggle, theme, tileCfg, contentType]
    );

    // ── Title config ──
    // Artist sub-type for the "Share Artist" header (and the "View Artist"
    // button below). Reads from the artist prop when the caller passed one —
    // `profileType` (serializer) takes precedence, falls back to the raw
    // `profile_type` column. Defaults to 'music' so legacy callers don't
    // see behavior change.
    const artistProfileType = String(
        artist?.profileType || artist?.profile_type || 'music'
    ).toLowerCase();
    const isVisualArtistContent = contentType === 'artist' && artistProfileType === 'artist';

    const dialogTitle = (() => {
        if (contentType === 'comment') return 'Share Comment';
        if (contentType === 'event') return 'Share Event';
        if (contentType === 'job') return 'Share Job';
        if (contentType === 'business') return 'Share Business';
        if (contentType === 'artist') return isVisualArtistContent ? 'Share Artist' : 'Share Music Artist';
        if (contentType === 'profile') return 'Share Profile';
        if (contentType === 'listing') return 'Share Listing';
        if (contentType === 'service') return 'Share Service';
        if (contentType === 'service_request') return 'Share Service Request';
        if (contentType === 'group') return 'Share Group';
        return isGroupShare ? 'Share Group' : 'Share Post';
    })();

    const TitleIcon = contentType === 'comment' ? ChatBubbleOutlineRoundedIcon : contentType === 'job' ? WorkRoundedIcon : contentType === 'business' ? StorefrontRoundedIcon : contentType === 'artist' ? (isVisualArtistContent ? PaletteRoundedIcon : MusicNoteRoundedIcon) : contentType === 'listing' ? LocalOfferOutlinedIcon : contentType === 'service' ? BuildRoundedIcon : contentType === 'service_request' ? FrontHandRoundedIcon : contentType === 'group' ? GroupsRoundedIcon : ShareOutlinedIcon;

    // ── Render ──
    return (
        <>
            <Dialog
                open={dialogOpen}
                onClose={handleDialogClose}
                fullWidth
                fullScreen={shareMobile}
                maxWidth="lg"
                sx={{ zIndex: 99999, ...dialogSx }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                PaperProps={{
                    onClick: (e) => e.stopPropagation(),
                    onMouseDown: (e) => e.stopPropagation(),
                    onTouchStart: (e) => e.stopPropagation(),
                    sx: {
                        height: shareMobile ? '100%' : { xs: '95vh', sm: 820, md: 880 },
                        maxHeight: shareMobile ? '100%' : '95vh',
                        width: shareMobile ? '100%' : { xs: '96vw', sm: '94vw', md: 1240 },
                        maxWidth: shareMobile ? '100%' : { xs: '96vw', sm: '94vw', md: 1240 },
                        borderRadius: shareMobile ? 0 : 3,
                        ...(shareMobile && {
                            display: 'flex',
                            flexDirection: 'column',
                        }),
                    },
                }}
            >
                {/* ── Mobile header ── */}
                {shareMobile ? (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            px: 1.5,
                            py: 1,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            flexShrink: 0,
                        }}
                    >
                        <IconButton
                            onClick={() => { setDialogOpen(false); onClose(); }}
                            size="small"
                            aria-label="Close"
                            sx={{ mr: 0.5 }}
                        >
                            <CloseIcon />
                        </IconButton>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, flex: 1, textAlign: 'center' }}>
                            {dialogTitle}
                        </Typography>
                        <Box sx={{ width: 32 }} />
                    </Box>
                ) : (
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TitleIcon sx={{ color: 'primary.main' }} />
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                {dialogTitle}
                            </Typography>
                        </Box>
                        <IconButton onClick={() => { setDialogOpen(false); onClose(); }} size="small" aria-label="Close" sx={{ borderRadius: 2 }}>
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                )}

                <DialogContent
                    dividers={!shareMobile}
                    sx={{
                        p: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        minHeight: 0,
                        ...(shareMobile && {
                            flex: 1,
                            overflow: 'auto',
                            pb: '80px', // space for sticky footer
                        }),
                    }}
                >
                    {/* ═══════ MOBILE LAYOUT ═══════ */}
                    {shareMobile ? (
                        <>
                            {/* ── Quick share actions (big tappable icons) ── */}
                            <Box
                                sx={(t) => ({
                                    display: 'flex',
                                    justifyContent: 'center',
                                    gap: 2.5,
                                    px: 2,
                                    py: 2,
                                    borderBottom: `1px solid ${alpha(t.palette.text.primary, 0.06)}`,
                                })}
                            >
                                {/* Copy Link */}
                                <Box
                                    onClick={handleCopyLink}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        cursor: 'pointer',
                                        WebkitTapHighlightColor: 'transparent',
                                    }}
                                >
                                    <Box
                                        sx={(t) => ({
                                            width: 52,
                                            height: 52,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: alpha(t.palette.text.primary, 0.06),
                                            transition: `background-color 140ms ease`,
                                            '&:active': { bgcolor: alpha(t.palette.primary.main, 0.15) },
                                        })}
                                    >
                                        <LinkRoundedIcon sx={{ fontSize: 24, color: 'text.primary' }} />
                                    </Box>
                                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary' }}>
                                        Copy Link
                                    </Typography>
                                </Box>

                                {/* Facebook */}
                                <Box
                                    onClick={handleFacebook}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        cursor: 'pointer',
                                        WebkitTapHighlightColor: 'transparent',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 52,
                                            height: 52,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: '#1877F2',
                                            transition: `opacity 140ms ease`,
                                            '&:active': { opacity: 0.8 },
                                        }}
                                    >
                                        <FacebookIcon sx={{ fontSize: 26, color: '#fff' }} />
                                    </Box>
                                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary' }}>
                                        Facebook
                                    </Typography>
                                </Box>

                                {/* Native Share (if available) */}
                                {canNativeShare && (
                                    <Box
                                        onClick={handleNativeShare}
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            cursor: 'pointer',
                                            WebkitTapHighlightColor: 'transparent',
                                        }}
                                    >
                                        <Box
                                            sx={(t) => ({
                                                width: 52,
                                                height: 52,
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                bgcolor: t.palette.primary.main,
                                                transition: `opacity 140ms ease`,
                                                '&:active': { opacity: 0.8 },
                                            })}
                                        >
                                            <IosShareRoundedIcon sx={{ fontSize: 24, color: '#fff' }} />
                                        </Box>
                                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary' }}>
                                            More
                                        </Typography>
                                    </Box>
                                )}

                                {/* View Page */}
                                <Box
                                    onClick={handleViewPage}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        cursor: 'pointer',
                                        WebkitTapHighlightColor: 'transparent',
                                    }}
                                >
                                    <Box
                                        sx={(t) => ({
                                            width: 52,
                                            height: 52,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: alpha(t.palette.text.primary, 0.06),
                                            transition: `background-color 140ms ease`,
                                            '&:active': { bgcolor: alpha(t.palette.primary.main, 0.15) },
                                        })}
                                    >
                                        <TitleIcon sx={{ fontSize: 22, color: 'text.primary' }} />
                                    </Box>
                                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary' }}>
                                        View
                                    </Typography>
                                </Box>
                            </Box>

                            {/* ── Collapsible preview ── */}
                            <Box
                                onClick={() => setPreviewExpanded((p) => !p)}
                                sx={(t) => ({
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    px: 2,
                                    py: 1,
                                    cursor: 'pointer',
                                    borderBottom: `1px solid ${alpha(t.palette.text.primary, 0.06)}`,
                                    WebkitTapHighlightColor: 'transparent',
                                    '&:active': { bgcolor: alpha(t.palette.text.primary, 0.03) },
                                })}
                            >
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Preview
                                </Typography>
                                {previewExpanded
                                    ? <KeyboardArrowUpRoundedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                    : <KeyboardArrowDownRoundedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                }
                            </Box>
                            <Collapse in={previewExpanded} timeout={200}>
                                <Box sx={{ py: 1 }}>
                                    {contentType === 'post' && <PostPreview post={post} isGroupShare={isGroupShare} />}
                                    {contentType === 'comment' && <CommentPreview comment={comment} />}
                                    {contentType === 'event' && <EventPreview event={event} />}
                                    {contentType === 'job' && <JobPreview job={job} />}
                                    {contentType === 'business' && <BusinessProfilePreview business={business} />}
                                    {contentType === 'artist' && <ArtistProfilePreview artist={artist} />}
                                    {contentType === 'profile' && <ProfilePreview profile={profile} />}
                                    {contentType === 'listing' && <ListingPreview listing={listing} />}
                                    {contentType === 'service' && <ServicePreview service={service} />}
                                    {contentType === 'service_request' && <ServiceRequestPreview request={request} />}
                                    {contentType === 'article' && <ArticlePreview article={article} />}
                                    {contentType === 'group' && <GroupPreview group={group} />}
                                </Box>
                            </Collapse>

                            {/* ── Send to followers section ── */}
                            <Box
                                sx={(t) => ({
                                    px: 2,
                                    pt: 1.5,
                                    pb: 1,
                                    borderBottom: `1px solid ${alpha(t.palette.text.primary, 0.06)}`,
                                })}
                            >
                                <Typography sx={{ fontWeight: 900, fontSize: 15, mb: 1 }}>
                                    Send to followers
                                </Typography>

                                {/* Search */}
                                <TextField
                                    size="small"
                                    fullWidth
                                    placeholder="Search by name or @username"
                                    value={queryDraft}
                                    onChange={(e) => {
                                        setQueryDraft(e.target.value);
                                        // Auto-apply on mobile for instant search
                                        setQuery(e.target.value);
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                            </InputAdornment>
                                        ),
                                        ...(queryDraft && {
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            setQueryDraft('');
                                                            setQuery('');
                                                        }}
                                                    >
                                                        <ClearIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3,
                                            bgcolor: (t) => alpha(t.palette.text.primary, 0.04),
                                        },
                                    }}
                                />
                            </Box>

                            {/* ── Selected chips (scrollable row) ── */}
                            {selectedUsers.length > 0 && (
                                <Box
                                    sx={(t) => ({
                                        display: 'flex',
                                        gap: 0.75,
                                        px: 2,
                                        py: 1,
                                        overflowX: 'auto',
                                        borderBottom: `1px solid ${alpha(t.palette.text.primary, 0.06)}`,
                                        WebkitOverflowScrolling: 'touch',
                                        scrollbarWidth: 'none',
                                        '&::-webkit-scrollbar': { display: 'none' },
                                    })}
                                >
                                    {selectedUsers.map((u) => {
                                        const chipName = `${safeStr(u?.first_name)} ${safeStr(u?.last_name)}`.trim() || safeStr(u?.handle || u?.username).trim() || 'User';
                                        const chipAvatar = getUserAvatarSrc(u);
                                        return (
                                            <Chip
                                                key={u.id}
                                                label={chipName}
                                                avatar={
                                                    <Avatar
                                                        src={chipAvatar || undefined}
                                                        sx={{ width: 24, height: 24 }}
                                                    >
                                                        {!chipAvatar && <PersonRoundedIcon sx={{ fontSize: 14 }} />}
                                                    </Avatar>
                                                }
                                                onDelete={() => removeSelectedById(u.id)}
                                                deleteIcon={<CloseIcon sx={{ fontSize: 16 }} />}
                                                sx={(t) => ({
                                                    flexShrink: 0,
                                                    fontWeight: 700,
                                                    fontSize: 13,
                                                    borderRadius: 999,
                                                    bgcolor: alpha(t.palette.primary.main, 0.08),
                                                    border: `1px solid ${alpha(t.palette.primary.main, 0.2)}`,
                                                    '& .MuiChip-deleteIcon': {
                                                        color: alpha(t.palette.text.secondary, 0.6),
                                                        '&:hover': { color: t.palette.error.main },
                                                    },
                                                })}
                                            />
                                        );
                                    })}
                                </Box>
                            )}

                            {/* ── Follower list (compact rows for mobile) ── */}
                            <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', px: 1 }}>
                                {loading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                        <CircularProgress size={28} />
                                    </Box>
                                ) : filteredList.length === 0 ? (
                                    <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                                        <Typography sx={{ fontWeight: 700 }}>
                                            {query ? 'No results found.' : 'No followers to show.'}
                                        </Typography>
                                    </Box>
                                ) : (
                                    filteredList.map((u) => {
                                        const sel = selected.has(u.id);
                                        const displayName = `${safeStr(u.first_name)} ${safeStr(u.last_name)}`.replace(/\s+/g, ' ').trim();
                                        const username = safeStr(u.handle || u.username).trim();
                                        const acctType = getUserAccountType(u);
                                        const acctProfileType = String(u?.profile_type || u?.profileType || '').toLowerCase();
                                        const acctLabel = getAccountTypeLabel(acctType, acctProfileType);
                                        const avatarUrl = getUserAvatarSrc(u);
                                        const hasAvatar = Boolean(avatarUrl);
                                        const isBizOrArt = acctType === 'business' || acctType === 'artist';

                                        return (
                                            <Box
                                                key={u.id}
                                                onClick={() => toggle(u)}
                                                sx={(t) => ({
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1.25,
                                                    px: 1.25,
                                                    py: 1,
                                                    mx: 0.25,
                                                    borderRadius: 2.5,
                                                    cursor: 'pointer',
                                                    userSelect: 'none',
                                                    WebkitTapHighlightColor: 'transparent',
                                                    bgcolor: sel ? alpha(t.palette.primary.main, 0.08) : 'transparent',
                                                    transition: `background-color 120ms ease`,
                                                    '&:active': {
                                                        bgcolor: sel ? alpha(t.palette.primary.main, 0.14) : alpha(t.palette.text.primary, 0.04),
                                                    },
                                                })}
                                            >
                                                <Avatar
                                                    src={hasAvatar ? avatarUrl : undefined}
                                                    sx={(t) => ({
                                                        width: 44,
                                                        height: 44,
                                                        borderRadius: 1.5,
                                                        border: '2px solid',
                                                        borderColor: sel ? 'primary.main' : alpha(t.palette.text.primary, 0.08),
                                                        bgcolor: hasAvatar
                                                            ? 'grey.600'
                                                            : isBizOrArt
                                                                ? alpha(t.palette.primary.main, 0.08)
                                                                : alpha(t.palette.text.primary, 0.06),
                                                        color: isBizOrArt ? t.palette.primary.main : t.palette.text.secondary,
                                                        transition: `border-color 120ms ease`,
                                                        '& .MuiAvatar-img': { objectFit: 'cover' },
                                                    })}
                                                >
                                                    {!hasAvatar && getAccountTypeIcon(acctType, 22, acctProfileType)}
                                                </Avatar>

                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography
                                                        sx={{ fontWeight: 800, fontSize: 14, lineHeight: 1.25 }}
                                                        noWrap
                                                    >
                                                        {displayName || 'User'}
                                                    </Typography>
                                                    <Typography
                                                        sx={{ color: 'text.secondary', fontSize: 12.5, lineHeight: 1.3 }}
                                                        noWrap
                                                    >
                                                        {username ? `@${username}` : ' '}
                                                    </Typography>
                                                    {acctLabel && (
                                                        <Typography
                                                            variant="caption"
                                                            sx={(t) => ({
                                                                fontWeight: 700,
                                                                fontSize: '0.62rem',
                                                                lineHeight: 1,
                                                                color: isBizOrArt ? t.palette.primary.main : t.palette.text.secondary,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 0.3,
                                                                mt: 0.15,
                                                            })}
                                                        >
                                                            {acctType === 'business' && <StorefrontOutlinedIcon sx={{ fontSize: 10 }} />}
                                                            {acctType === 'artist' && <MusicNoteRoundedIcon sx={{ fontSize: 10 }} />}
                                                            {acctLabel}
                                                        </Typography>
                                                    )}
                                                </Box>

                                                {/* Selection indicator */}
                                                <Box
                                                    sx={(t) => ({
                                                        width: 26,
                                                        height: 26,
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        border: '2px solid',
                                                        borderColor: sel ? 'primary.main' : alpha(t.palette.text.primary, 0.2),
                                                        bgcolor: sel ? 'primary.main' : 'transparent',
                                                        flexShrink: 0,
                                                        transition: `all 120ms ease`,
                                                    })}
                                                >
                                                    {sel && <CheckCircleIcon sx={{ fontSize: 18, color: '#fff' }} />}
                                                </Box>
                                            </Box>
                                        );
                                    })
                                )}
                            </Box>
                        </>
                    ) : (
                        /* ═══════ DESKTOP LAYOUT (unchanged) ═══════ */
                        <>
                            {/* ── Top action bar ── */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: { xs: 'flex-start', sm: 'center' },
                                    justifyContent: 'space-between',
                                    px: 2,
                                    pt: 1.25,
                                    pb: 0.75,
                                    gap: 1,
                                    flexWrap: 'wrap',
                                }}
                            >
                                <Typography sx={{ fontWeight: 900 }}>
                                    {contentType === 'comment'
                                        ? 'Share this comment with your followers'
                                        : 'Share to your followers'}
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                    {contentType === 'comment' ? (
                                        <>
                                            <Tooltip title="Copy comment link">
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<ContentCopyRoundedIcon />}
                                                    onClick={handleCopyLink}
                                                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                                                >
                                                    Copy Link
                                                </Button>
                                            </Tooltip>
                                            <Button
                                                size="small"
                                                startIcon={<FacebookIcon />}
                                                variant="outlined"
                                                onClick={handleFacebook}
                                                sx={{
                                                    textTransform: 'none',
                                                    fontWeight: 700,
                                                    borderRadius: 2,
                                                }}
                                            >
                                                Facebook
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                variant="outlined"
                                                onClick={handleViewPage}
                                                startIcon={
                                                    contentType === 'event' ? <EventRoundedIcon />
                                                        : contentType === 'job' ? <WorkRoundedIcon />
                                                            : contentType === 'business' ? <StorefrontRoundedIcon />
                                                                : contentType === 'artist' ? (isVisualArtistContent ? <PaletteRoundedIcon /> : <MusicNoteRoundedIcon />)
                                                                    : contentType === 'listing' ? <LocalOfferOutlinedIcon />
                                                                        : contentType === 'service' ? <BuildRoundedIcon />
                                                                            : contentType === 'profile' ? <PersonRoundedIcon />
                                                                                : contentType === 'group' ? <GroupsRoundedIcon />
                                                                                    : contentType === 'post' ? <ArticleRoundedIcon />
                                                                                        : undefined
                                                }
                                            >
                                                {contentType === 'event'
                                                    ? 'View Event'
                                                    : contentType === 'job'
                                                        ? 'View Job'
                                                        : contentType === 'business'
                                                            ? 'View Business'
                                                            : contentType === 'artist'
                                                                ? 'View Artist'
                                                                : contentType === 'listing'
                                                                    ? 'View Listing'
                                                                    : contentType === 'service'
                                                                        ? 'View Service'
                                                                        : contentType === 'profile'
                                                                            ? 'View Profile'
                                                                            : contentType === 'group'
                                                                                ? 'View Group'
                                                                                : isGroupShare
                                                                                    ? 'View Group Page'
                                                                                    : 'View Post Page'}
                                            </Button>

                                            <Button
                                                startIcon={<FacebookIcon />}
                                                variant="outlined"
                                                onClick={handleFacebook}
                                            >
                                                Share to Facebook
                                            </Button>
                                        </>
                                    )}
                                </Box>
                            </Box>

                            {/* ── Content-type preview ── */}
                            {contentType === 'post' && <PostPreview post={post} isGroupShare={isGroupShare} />}
                            {contentType === 'comment' && <CommentPreview comment={comment} />}
                            {contentType === 'event' && <EventPreview event={event} />}
                            {contentType === 'job' && <JobPreview job={job} />}
                            {contentType === 'business' && <BusinessProfilePreview business={business} />}
                            {contentType === 'artist' && <ArtistProfilePreview artist={artist} />}
                            {contentType === 'profile' && <ProfilePreview profile={profile} />}
                            {contentType === 'listing' && <ListingPreview listing={listing} />}
                            {contentType === 'service' && <ServicePreview service={service} />}
                            {contentType === 'service_request' && <ServiceRequestPreview request={request} />}
                            {contentType === 'group' && <GroupPreview group={group} />}

                            {/* ── Search & Filters ── */}
                            <Box
                                sx={(t) => ({
                                    px: 2,
                                    py: 1,
                                    borderTop: `1px solid ${alpha(t.palette.text.primary, 0.06)}`,
                                    borderBottom: `1px solid ${alpha(t.palette.text.primary, 0.06)}`,
                                    background: t.palette.grey[50],
                                })}
                            >
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                                    <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            placeholder="Name or @username"
                                            value={queryDraft}
                                            onChange={(e) => setQueryDraft(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    applyFilters();
                                                }
                                            }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <SearchIcon fontSize="small" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Box>

                                    <Box sx={{ flex: '1.2 1 240px', minWidth: 0 }}>
                                        <CityCountySelect
                                            size="small"
                                            county={countyDraft}
                                            city={cityDraft}
                                            onCountyChange={setCountyDraft}
                                            onCityChange={setCityDraft}
                                            setCounty={setCountyDraft}
                                            setCity={setCityDraft}
                                        />
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                                        <Button onClick={applyFilters} variant="contained" startIcon={<SearchIcon />} disabled={loading} size="small">
                                            Search
                                        </Button>
                                        <Button onClick={clearFilters} variant="outlined" startIcon={<ClearIcon />} disabled={loading} size="small">
                                            Clear
                                        </Button>
                                    </Box>
                                </Box>

                                <Box sx={{ mt: 1 }}>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        <Button
                                            variant={shareTab === 0 ? 'contained' : 'outlined'}
                                            onClick={() => setShareTab(0)}
                                            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, px: 2 }}
                                        >
                                            Results
                                        </Button>
                                        <Button
                                            variant={shareTab === 1 ? 'contained' : 'outlined'}
                                            onClick={() => setShareTab(1)}
                                            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, px: 2 }}
                                        >
                                            Selected ({selectedUsers.length})
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>

                            {/* ── Follower grid ── */}
                            <Box sx={{ px: 2, pt: 1, pb: 2, flex: 1, minHeight: 0, overflow: 'auto' }}>
                                {/* ── Selected tab ── */}
                                <Box sx={{ display: shareTab === 1 ? 'block' : 'none' }}>
                                    {selectedUsers.length === 0 ? (
                                        <Box key="selected-empty" sx={{ py: 6, textAlign: 'center' }}>
                                            <Typography sx={{ fontWeight: 900 }}>No one selected</Typography>
                                            <Typography sx={{ color: 'text.secondary' }}>
                                                Select followers from Results to share with them.
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Box key="selected-list" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {/* Header row */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 0.5, pb: 0.5 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: 13 }}>
                                                    {selectedUsers.length} {selectedUsers.length === 1 ? 'person' : 'people'} selected
                                                </Typography>
                                                <Button
                                                    size="small"
                                                    onClick={() => setSelected(new Map())}
                                                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: 12, borderRadius: 2, minWidth: 0, px: 1 }}
                                                >
                                                    Clear all
                                                </Button>
                                            </Box>

                                            {/* Selected user cards */}
                                            <Box
                                                sx={{
                                                    display: 'grid',
                                                    gap: 1,
                                                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                                                }}
                                            >
                                                {selectedUsers.map((u) => {
                                                    const displayName = `${safeStr(u?.first_name)} ${safeStr(u?.last_name)}`
                                                        .replace(/\s+/g, ' ')
                                                        .trim();
                                                    const username = safeStr(u?.handle || u?.username).trim();
                                                    const selAcctType = getUserAccountType(u);
                                                    const selAcctProfileType = String(u?.profile_type || u?.profileType || '').toLowerCase();
                                                    const selAcctLabel = getAccountTypeLabel(selAcctType, selAcctProfileType);
                                                    const selAvatarUrl = getUserAvatarSrc(u);
                                                    const selHasAvatar = Boolean(selAvatarUrl);
                                                    const isBizOrArt = selAcctType === 'business' || selAcctType === 'artist';
                                                    return (
                                                        <Box
                                                            key={u.id}
                                                            sx={(t) => ({
                                                                border: '1px solid',
                                                                borderColor: alpha(t.palette.primary.main, 0.12),
                                                                borderRadius: 2.5,
                                                                p: 1.25,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 1.25,
                                                                bgcolor: alpha(t.palette.primary.main, 0.02),
                                                                transition: `background-color ${t.custom.motion.base}ms ${t.custom.motion.ease}, border-color ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                                                                '&:hover': {
                                                                    bgcolor: alpha(t.palette.primary.main, 0.05),
                                                                    borderColor: alpha(t.palette.primary.main, 0.2),
                                                                },
                                                            })}
                                                        >
                                                            <Avatar
                                                                src={selHasAvatar ? selAvatarUrl : undefined}
                                                                variant="rounded"
                                                                sx={(t) => ({
                                                                    width: 44,
                                                                    height: 44,
                                                                    borderRadius: 1.5,
                                                                    border: '2px solid',
                                                                    borderColor: alpha(t.palette.text.primary, 0.06),
                                                                    bgcolor: selHasAvatar
                                                                        ? 'grey.600'
                                                                        : isBizOrArt
                                                                            ? alpha(t.palette.primary.main, 0.08)
                                                                            : alpha(t.palette.text.primary, 0.06),
                                                                    color: isBizOrArt
                                                                        ? t.palette.primary.main
                                                                        : t.palette.text.secondary,
                                                                    '& .MuiAvatar-img': { objectFit: 'cover' },
                                                                })}
                                                            >
                                                                {!selHasAvatar && getAccountTypeIcon(selAcctType, 22, selAcctProfileType)}
                                                            </Avatar>
                                                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                                                <Typography
                                                                    sx={{
                                                                        fontWeight: 800,
                                                                        fontSize: 14,
                                                                        lineHeight: 1.2,
                                                                    }}
                                                                    noWrap
                                                                >
                                                                    {displayName || 'User'}
                                                                </Typography>
                                                                <Typography
                                                                    sx={{
                                                                        color: 'text.secondary',
                                                                        fontSize: 12,
                                                                        lineHeight: 1.3,
                                                                    }}
                                                                    noWrap
                                                                >
                                                                    {username ? `@${username}` : ' '}
                                                                </Typography>
                                                                {selAcctLabel && (
                                                                    <Typography
                                                                        variant="caption"
                                                                        sx={(t) => ({
                                                                            fontWeight: 700,
                                                                            fontSize: '0.62rem',
                                                                            lineHeight: 1,
                                                                            color: isBizOrArt
                                                                                ? t.palette.primary.main
                                                                                : t.palette.text.secondary,
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: 0.3,
                                                                            mt: 0.25,
                                                                        })}
                                                                    >
                                                                        {selAcctType === 'business' && <StorefrontOutlinedIcon sx={{ fontSize: 10 }} />}
                                                                        {selAcctType === 'artist' && <MusicNoteRoundedIcon sx={{ fontSize: 10 }} />}
                                                                        {selAcctLabel}
                                                                    </Typography>
                                                                )}
                                                            </Box>

                                                            <Tooltip title="Remove" arrow>
                                                                <IconButton
                                                                    onClick={() => removeSelectedById(u.id)}
                                                                    size="small"
                                                                    sx={(t) => ({
                                                                        color: alpha(t.palette.text.secondary, 0.6),
                                                                        '&:hover': {
                                                                            color: t.palette.error.main,
                                                                            bgcolor: alpha(t.palette.error.main, 0.06),
                                                                        },
                                                                    })}
                                                                >
                                                                    <CloseIcon sx={{ fontSize: 18 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                        </Box>
                                    )}
                                </Box>

                                {/* ── Results tab ── */}
                                <Box sx={{ display: shareTab === 0 ? 'block' : 'none' }}>
                                    {filteredList.length ? (
                                        <Box
                                            key="results-grid"
                                            sx={{
                                                display: 'grid',
                                                gridTemplateColumns: {
                                                    xs: `repeat(${xsCols}, minmax(0, 1fr))`,
                                                    sm: `repeat(${smCols}, minmax(0, 1fr))`,
                                                },
                                                gap: 1.5,
                                                alignItems: 'stretch',
                                            }}
                                        >
                                            {filteredList.map((u) => (
                                                <Box key={u.id} sx={{ minWidth: 0, display: 'flex' }}>
                                                    <UserTile u={u} />
                                                </Box>
                                            ))}
                                        </Box>
                                    ) : (
                                        <Box key="results-empty" sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                                            {loading ? 'Loading…' : 'No followers to show.'}
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        </>
                    )}
                </DialogContent>

                {/* ── Footer: sticky on mobile, standard on desktop ── */}
                {shareMobile ? (
                    <Box
                        sx={(t) => ({
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            px: 2,
                            py: 1.5,
                            bgcolor: 'background.paper',
                            borderTop: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                            boxShadow: `0 -4px 16px ${alpha(t.palette.common.black, 0.08)}`,
                            zIndex: 10,
                            pb: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
                        })}
                    >
                        <Box sx={{ minWidth: 0, flex: 1, mr: 1.5 }}>
                            {selected.size > 0 ? (
                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }} noWrap>
                                    {selected.size} {selected.size === 1 ? 'person' : 'people'} selected
                                </Typography>
                            ) : isOnBusinessOrArtist ? (
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }} noWrap>
                                    Sharing as {effectiveViewerName || effectiveViewerHandle}
                                </Typography>
                            ) : (
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                    Select followers above
                                </Typography>
                            )}
                        </Box>
                        <Button
                            onClick={handleShareInternal}
                            variant="contained"
                            disabled={!selected.size || sharing}
                            startIcon={sharing ? <CircularProgress size={16} color="inherit" /> : <ShareOutlinedIcon sx={{ fontSize: 18 }} />}
                            sx={{
                                borderRadius: 999,
                                textTransform: 'none',
                                fontWeight: 900,
                                px: 3,
                                py: 1,
                                fontSize: '0.9rem',
                                minWidth: 120,
                                flexShrink: 0,
                            }}
                        >
                            {sharing ? 'Sending…' : `Share${selected.size ? ` (${selected.size})` : ''}`}
                        </Button>
                    </Box>
                ) : (
                    <DialogActions sx={{ justifyContent: 'space-between', px: 2 }}>
                        {isOnBusinessOrArtist ? (
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                                Sharing as {effectiveViewerName || effectiveViewerHandle}
                            </Typography>
                        ) : (
                            <Box />
                        )}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                onClick={handleShareInternal}
                                variant="contained"
                                disabled={!selected.size || sharing}
                                startIcon={sharing ? <CircularProgress size={16} color="inherit" /> : null}
                            >
                                {sharing ? 'Sharing…' : `Share${selected.size ? ` (${selected.size})` : ''}`}
                            </Button>
                        </Box>
                    </DialogActions>
                )}
            </Dialog>

            {createPortal(
                <>
                    <SuccessSnackbar
                        open={successToast.open}
                        message={successToast.msg}
                        onClose={() => setSuccessToast((prev) => ({ ...prev, open: false }))}
                        autoHideDuration={2000}
                        sx={{ zIndex: 9999 }}
                    />
                    <Snackbar
                        open={errorToast.open}
                        autoHideDuration={4000}
                        onClose={() => setErrorToast((prev) => ({ ...prev, open: false }))}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                        sx={{ zIndex: 9999 }}
                    >
                        <Alert
                            onClose={() => setErrorToast((prev) => ({ ...prev, open: false }))}
                            severity="error"
                            variant="filled"
                            sx={{ width: '100%', minWidth: 260 }}
                        >
                            {errorToast.msg}
                        </Alert>
                    </Snackbar>
                </>,
                document.body
            )}
        </>
    );
}

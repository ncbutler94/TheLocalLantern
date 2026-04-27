// src/components/ActionBar.jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Tooltip,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    RadioGroup,
    Radio,
    TextField,
    Snackbar,
    IconButton,
    FormControlLabel,
} from '@mui/material';

import { alpha, useTheme } from '@mui/material/styles';

import CloseIcon from '@mui/icons-material/Close';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import RepeatIcon from '@mui/icons-material/Repeat';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CircularProgress from '@mui/material/CircularProgress';


import { useAuth } from './AuthModalContext';
import { useActiveAccount } from './AccountContext';
import { getAccountHeaders as getStaticAccountHeaders } from '../utils/getAccountHeadersStatic';
import ShareDialog from './ShareDialog';
import { secureFetch } from '../utils/secureFetch';

/* ────────────────────────────────────────────────────────────────────────────
   Helpers
   ─────────────────────────────────────────────────────────────────────────── */

const fmtCount = (n = 0) => {
    const x = Number(n) || 0;
    if (x >= 1_000_000) return `${(x / 1_000_000).toFixed(x % 1_000_000 ? 1 : 0).replace(/\.0$/, '')}M`;
    if (x >= 1_000) return `${(x / 1_000).toFixed(x % 1_000 ? 1 : 0).replace(/\.0$/, '')}k`;
    return String(x);
};

const clamp0 = (v) => Math.max(0, Number.isFinite(v) ? v : 0);

// ActionBar uses theme.custom.brand.goldLight for hover/active gold tones
// (resolved at render time via the `t` callback pattern)

async function tryPost(urls, body) {
    // Include account identity headers on every fetch so the backend
    // extractAccountContext middleware always knows which account is active,
    // even though fetch() doesn't go through the axios interceptor.
    const acctHeaders = (() => {
        try { return getStaticAccountHeaders(); } catch { return {}; }
    })();
    for (const url of urls) {
        try {
            const res = await secureFetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', ...acctHeaders },
                body: body ? JSON.stringify(body) : undefined,
            });
            if (res.ok) {
                try {
                    return await res.json();
                } catch {
                    return {};
                }
            }
        } catch {
            // try next
        }
    }
    return null;
}

/* Event bus to sync list + detail panes */
const LIKE_EVT = 'll:post:like-changed';
const REPOST_EVT = 'll:post:repost-changed';

/* Lightweight in-memory cache so optimistic like/repost doesn't revert on re-mount
   (e.g., switching tabs causes cards to unmount and mount with stale props).
   Cache is keyed by account so switching profiles doesn't show stale state. */
function getActionStateCache() {
    if (typeof window === 'undefined') return {};
    if (!window.__llPostActionState) window.__llPostActionState = {};
    return window.__llPostActionState;
}
function getAccountCacheKey(businessId, artistId) {
    if (businessId) return `biz:${businessId}`;
    if (artistId) return `art:${artistId}`;
    return 'personal';
}
function readCachedActionState(postId, accountKey) {
    const cache = getActionStateCache();
    const entry = cache[String(postId)];
    if (!entry) return null;
    // Only return cache hit if it's from the same account
    if (entry._acct !== accountKey) return null;
    // Expire after 60 s so stale entries don't override genuinely fresh server data
    if (entry.t && (Date.now() - entry.t > 60000)) {
        delete cache[String(postId)];
        return null;
    }
    return entry;
}
function writeCachedActionState(postId, patch, accountKey) {
    const cache = getActionStateCache();
    const key = String(postId);
    const prev = cache[key] || {};
    cache[key] = { ...prev, ...patch, _acct: accountKey, t: Date.now() };
}

function broadcast(evt, detail) {
    try {
        if (detail && (evt === LIKE_EVT || evt === REPOST_EVT)) {
            const acctKey = detail._acct || 'personal';
            if (evt === LIKE_EVT) {
                writeCachedActionState(detail.postId, { liked: Boolean(detail.liked), likes: clamp0(detail.likes) }, acctKey);
            } else if (evt === REPOST_EVT) {
                writeCachedActionState(detail.postId, { reposted: Boolean(detail.reposted), reposts: clamp0(detail.reposts) }, acctKey);
            }
        }
        window.dispatchEvent(new CustomEvent(evt, { detail }));
    } catch {
        /* no-op */
    }
}

/* ────────────────────────────────────────────────────────────────────────────
   Report dialog (X to close, no click-away)
   ─────────────────────────────────────────────────────────────────────────── */
export function ReportDialog({ open, onClose, onSubmit, title = 'Report Post' }) {
    const [reason, setReason] = useState('');
    const [details, setDetails] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const resetDialog = () => {
        onClose();
        setTimeout(() => {
            setReason('');
            setDetails('');
            setSubmitted(false);
            setSubmitting(false);
        }, 250);
    };

    const handleSubmit = async () => {
        if (!reason) return;
        setSubmitting(true);
        try {
            await onSubmit({ reason, details });
        } catch { /* swallow */ }
        setSubmitting(false);
        setSubmitted(true);
    };

    const REPORT_REASONS = [
        { value: 'spam', label: 'Spam or misleading' },
        { value: 'harassment', label: 'Harassment or bullying' },
        { value: 'hate', label: 'Hate speech' },
        { value: 'inappropriate', label: 'Inappropriate content' },
        { value: 'misinformation', label: 'Misinformation' },
        { value: 'illegal', label: 'Illegal content' },
        { value: 'other', label: 'Other' },
    ];

    return (
        <Dialog
            open={open}
            onClose={resetDialog}
            maxWidth="xs"
            fullWidth
            sx={{ zIndex: 99999 }}
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    overflow: 'hidden',
                },
            }}
        >
            {submitted ? (
                <>
                    <DialogContent sx={{ textAlign: 'center', py: 5, px: 3 }}>
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                            <CheckCircleRoundedIcon sx={{ fontSize: 48, color: 'success.main' }} />
                        </Box>
                        <Typography sx={{ fontWeight: 800, fontSize: 18, mb: 1 }}>
                            Thank you for your report
                        </Typography>
                        <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.5 }}>
                            We take reports seriously and will review this. If it violates our community guidelines, we'll take appropriate action.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5 }}>
                        <Button
                            onClick={resetDialog}
                            fullWidth
                            variant="contained"
                            disableElevation
                            sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2, py: 1 }}
                        >
                            Done
                        </Button>
                    </DialogActions>
                </>
            ) : (
                <>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1.5, fontWeight: 800, fontSize: 18 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FlagOutlinedIcon sx={{ fontSize: 22, color: 'text.secondary' }} />
                            {title}
                        </Box>
                        <IconButton size="small" onClick={resetDialog} aria-label="Close">
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 0, pb: 1 }}>
                        <Typography sx={{ fontSize: 14, color: 'text.secondary', mb: 2, lineHeight: 1.5 }}>
                            Why are you reporting this? Your report is anonymous.
                        </Typography>
                        <RadioGroup value={reason} onChange={(e) => setReason(e.target.value)}>
                            {REPORT_REASONS.map((r) => (
                                <FormControlLabel
                                    key={r.value}
                                    value={r.value}
                                    control={<Radio size="small" />}
                                    label={<Typography sx={{ fontSize: 14 }}>{r.label}</Typography>}
                                    sx={{
                                        mx: 0,
                                        py: 0.25,
                                        px: 1,
                                        borderRadius: 2,
                                        '&:hover': { bgcolor: 'action.hover' },
                                    }}
                                />
                            ))}
                        </RadioGroup>
                        <TextField
                            multiline
                            minRows={3}
                            maxRows={6}
                            fullWidth
                            placeholder="Add any additional details that might help us review this report…"
                            value={details}
                            onChange={(e) => setDetails(e.target.value.slice(0, 1000))}
                            inputProps={{ maxLength: 1000 }}
                            sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 14 } }}
                        />
                        <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 0.5, textAlign: 'right' }}>
                            {details.length}/1000
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                        <Button
                            onClick={resetDialog}
                            sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2, color: 'text.secondary' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            disableElevation
                            disabled={!reason || submitting}
                            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
                            sx={{
                                fontWeight: 700,
                                textTransform: 'none',
                                borderRadius: 2,
                                px: 3,
                            }}
                        >
                            Submit report
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
}

ReportDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    title: PropTypes.string,
};

/* ────────────────────────────────────────────────────────────────────────────
   Stable style objects (defined outside the component to avoid re-creation
   on every render, which prevents the "Maximum update depth exceeded" loop).
   ─────────────────────────────────────────────────────────────────────────── */
const PILL_SX = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.75,
    px: 1.25,
    py: 0.5,
    minHeight: { xs: 44, sm: 'auto' },
    borderRadius: 999,
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background 120ms cubic-bezier(.2,.8,.2,1), transform 80ms cubic-bezier(.2,.8,.2,1)',
    '&:hover': {
        bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
    },
    '&:active': {
        transform: 'scale(0.97)',
    },
};

const ICON_BOX_SX = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: { xs: 26, sm: 28 },
    height: { xs: 26, sm: 28 },
    '@keyframes llActionGlow': {
        '0%': { transform: 'translate(-50%, -50%) scale(0)', opacity: 0.85 },
        '50%': { opacity: 0.55 },
        '100%': { transform: 'translate(-50%, -50%) scale(1.25)', opacity: 0 },
    },
};

/* ────────────────────────────────────────────────────────────────────────────
   Component
   ─────────────────────────────────────────────────────────────────────────── */

export default function ActionBar({
                                      user,
                                      postId,
                                      post = null,
                                      variant = '',
                                      initialLikes = 0,
                                      initiallyLiked = false,
                                      initialReposts = 0,
                                      initiallyReposted = false,
                                      commentsCount = 0,
                                      onComment,
                                      onShare,
                                      useShareDialog = false,
                                      hideShare = false,
                                      showBoost = true,
                                      enableFlag = false, // Changed default to false - flag now lives in 3-dot menu
                                      onLikeChange,
                                      onRepostChange,
                                  }) {
    const apiBase = ''; // same-origin
    const auth = useAuth();
    const actionTheme = useTheme();
    const { isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId } = useActiveAccount();

    // Stable cache key for the current active account
    const accountCacheKey = getAccountCacheKey(activeBusinessId, activeArtistId);

    // Use AuthModalContext as a fallback if caller forgot to pass `user`
    const viewer = user || auth?.user || null;

    // Determine if the active account owns this post (for boost visibility).
    // A personal account can have attached business / artist profiles, but
    // those attached entities only count as the owner when the viewer has
    // actually switched into that exact business / artist account.
    const viewerId = Number(viewer?.id || 0);
    const viewerHandle = String(viewer?.handle || '').toLowerCase();
    const postAuthorId = Number(post?.user_id || post?.userId || post?.author_id || post?.owner_id || 0);
    const postAuthorHandle = String(post?.handle || post?.author_handle || '').toLowerCase();
    const postBusinessId = post?.businessId || post?.businessPageId || post?.business_id || post?.business_page_id || post?.pageId || post?.page_id || '';
    const postArtistId = post?.artistId || post?.artist_id || post?.music_artist_id || '';
    const isOwnerOfPost = Boolean(
        (postBusinessId && isBusinessAccount && activeBusinessId && String(activeBusinessId) === String(postBusinessId)) ||
        (postArtistId && isArtistAccount && activeArtistId && String(activeArtistId) === String(postArtistId)) ||
        ((!postBusinessId && !postArtistId) && (
            (viewerId && postAuthorId && viewerId === postAuthorId) ||
            (viewerHandle && postAuthorHandle && viewerHandle === postAuthorHandle)
        ))
    );

    // Detect music artist posts — if present, we'll prepend music-specific
    // API URLs so like/repost hits the correct backend route.
    const musicArtistId = post?.artist_id || post?.artistId || post?.music_artist_id || null;

    // Business variant — when the parent passes variant="business", route
    // like/repost/flag to /api/business/posts/:id/* so they use
    // category='business_post' instead of the community default.
    const isBizVariant = String(variant || '').toLowerCase() === 'business';

    // Slice 2c: News variant — when the parent passes variant="news", route
    // like/repost to /api/community/news/article/:id/* so engagement lands
    // in post_likes / post_reposts with category='news_article'. Report/flag
    // for news articles is intentionally not yet wired on the backend
    // (Slice 2a deferred it pending post_flags schema decision), so callers
    // should pass enableFlag={false} when variant="news".
    const isNewsVariant = String(variant || '').toLowerCase() === 'news';

    // state
    const [likes, setLikes] = useState(clamp0(initialLikes));
    const [liked, setLiked] = useState(Boolean(initiallyLiked));
    const [reposts, setReposts] = useState(clamp0(initialReposts));
    const [reposted, setReposted] = useState(Boolean(initiallyReposted));

    const [likeBusy, setLikeBusy] = useState(false);
    const [repostBusy, setRepostBusy] = useState(false);

    const [reportOpen, setReportOpen] = useState(false);
    const [toast, setToast] = useState({ open: false, msg: '' });

    const [shareDialogOpen, setShareDialogOpen] = useState(false);

    // Hover / burst (visual only)
    const [likeHover, setLikeHover] = useState(false);
    const [likeSuppressHover, setLikeSuppressHover] = useState(false);
    const [commentHover, setCommentHover] = useState(false);
    const [repostHover, setRepostHover] = useState(false);
    const [repostSuppressHover, setRepostSuppressHover] = useState(false);
    const [shareHover, setShareHover] = useState(false);
    const [reportHover, setReportHover] = useState(false);

    const [likeBurst, setLikeBurst] = useState(0);
    const [commentBurst, setCommentBurst] = useState(0);
    const [repostBurst, setRepostBurst] = useState(0);
    const [shareBurst, setShareBurst] = useState(0);
    const [reportBurst, setReportBurst] = useState(0);

    // keep "latest" refs to avoid stale closures
    const likesRef = useRef(likes);
    const likedRef = useRef(liked);
    const repostsRef = useRef(reposts);
    const repostedRef = useRef(reposted);

    useEffect(() => {
        likesRef.current = likes;
    }, [likes]);
    useEffect(() => {
        likedRef.current = liked;
    }, [liked]);
    useEffect(() => {
        repostsRef.current = reposts;
    }, [reposts]);
    useEffect(() => {
        repostedRef.current = reposted;
    }, [reposted]);

    // Cooldown ref: stays true while a like/repost is in-flight AND for a short
    // window after it finishes, so the sync effect doesn't override optimistic
    // state with stale props from a parent refetch that arrives late.
    const actionCooldownRef = useRef(false);
    const cooldownTimerRef = useRef(null);

    // ── Sync effect ──
    // Runs whenever postId, account, or parent-provided counts/booleans change.
    //
    // Strategy: the in-memory action-state cache (written by handleLike /
    // handleRepost with server-confirmed data) is the single source of truth
    // once the user has interacted with a post.  Parent props are only trusted
    // when there is no cache entry (fresh load, or cache expired after 60 s).
    //
    // Modes:
    //   (a) Mount / post change / account change → resolve from cache then
    //       fall back to props.  Also resets hover states.
    //   (b) Same-post prop update during cooldown → skip entirely (stale parent
    //       re-render that would revert the user's just-clicked action).
    //   (c) Same-post prop update outside cooldown → prefer cache for everything
    //       (counts AND booleans); fall back to props only when no cache.
    const prevPostIdRef = useRef(postId);
    const prevAccountKeyRef = useRef(accountCacheKey);
    const isFirstSyncRef = useRef(true);

    useEffect(() => {
        const postChanged = prevPostIdRef.current !== postId;
        const accountChanged = prevAccountKeyRef.current !== accountCacheKey;
        isFirstSyncRef.current = false;
        prevPostIdRef.current = postId;
        prevAccountKeyRef.current = accountCacheKey;

        // ── (b) During action cooldown, protect optimistic state entirely ──
        if (actionCooldownRef.current && !postChanged && !accountChanged) {
            return;
        }

        // Reset hover/visual states on account or post change
        if (accountChanged || postChanged) {
            setLikeHover(false);
            setLikeSuppressHover(false);
            setCommentHover(false);
            setRepostHover(false);
            setRepostSuppressHover(false);
            setShareHover(false);
            setReportHover(false);
        }

        // Read cache once — used by both (a) and (c).
        // The cache holds server-confirmed data from handleLike / handleRepost
        // and is the most authoritative source after a user interaction.
        const cached = readCachedActionState(postId, accountCacheKey);

        if (cached) {
            // Cache hit → prefer cache values, fall back to props for missing fields
            setLikes(clamp0(cached.likes != null ? cached.likes : initialLikes));
            setLiked(Boolean(cached.liked != null ? cached.liked : initiallyLiked));
            setReposts(clamp0(cached.reposts != null ? cached.reposts : initialReposts));
            setReposted(Boolean(cached.reposted != null ? cached.reposted : initiallyReposted));
        } else {
            // No cache → trust props from the server.  The server's engagement
            // endpoint now returns the correct viewerLiked / viewerReposted for
            // whichever account is active (personal, business, or artist) via
            // the account-identity headers, so we no longer force false here.
            setLikes(clamp0(initialLikes));
            setLiked(Boolean(initiallyLiked));
            setReposts(clamp0(initialReposts));
            setReposted(Boolean(initiallyReposted));
        }
    }, [postId, accountCacheKey, initialLikes, initialReposts, initiallyLiked, initiallyReposted]);

    // ── Cache flush listener ──
    // When account switches, AccountContext dispatches ll:action-cache:flush.
    // Wipe the entire in-memory cache so no stale per-account state leaks.
    useEffect(() => {
        const handleFlush = () => {
            const cache = getActionStateCache();
            Object.keys(cache).forEach((k) => delete cache[k]);
        };
        window.addEventListener('ll:action-cache:flush', handleFlush);
        return () => window.removeEventListener('ll:action-cache:flush', handleFlush);
    }, []);

    // listen for global like/repost changes for this post
    // Only apply the liked/reposted boolean from events on the SAME account;
    // always apply count updates (totals are account-agnostic).
    const accountKeyRef = useRef(accountCacheKey);
    accountKeyRef.current = accountCacheKey;

    useEffect(() => {
        const onLike = (e) => {
            const d = e?.detail;
            if (!d || String(d.postId) !== String(postId)) return;
            setLikes(clamp0(d.likes));
            // Only apply liked boolean from the same account
            if (!d._acct || d._acct === accountKeyRef.current) {
                setLiked(Boolean(d.liked));
            }
        };
        const onRepost = (e) => {
            const d = e?.detail;
            if (!d || String(d.postId) !== String(postId)) return;
            setReposts(clamp0(d.reposts));
            // Only apply reposted boolean from the same account
            if (!d._acct || d._acct === accountKeyRef.current) {
                setReposted(Boolean(d.reposted));
            }
        };
        window.addEventListener(LIKE_EVT, onLike);
        window.addEventListener(REPOST_EVT, onRepost);
        return () => {
            window.removeEventListener(LIKE_EVT, onLike);
            window.removeEventListener(REPOST_EVT, onRepost);
        };
    }, [postId]);

    const openAuthUI = useCallback(() => {
        if (auth && typeof auth.open === 'function') auth.open();
        try {
            window.dispatchEvent(new CustomEvent('open-auth-modal'));
            window.dispatchEvent(new CustomEvent('open-login'));
            window.dispatchEvent(new CustomEvent('open-auth-dialog'));
            window.dispatchEvent(new CustomEvent('open-login-popup'));
        } catch {
            /* no-op */
        }
    }, [auth]);

    // treat user as logged in if either props.user OR auth.user exists
    const requireAuth = useCallback(
        (cb) => {
            const u = viewer;
            if (u && (u.id || u.handle)) return cb?.();
            openAuthUI();
            return undefined;
        },
        [viewer, openAuthUI]
    );

    /* ────────────────────────────────────────────────────────────────────────
       LIKE (optimistic + server reconciliation)
       ──────────────────────────────────────────────────────────────────────── */
    const likeReqId = useRef(0);

    const handleLike = useCallback(() => {
        requireAuth(async () => {
            if (likeBusy) return;
            setLikeBusy(true);
            actionCooldownRef.current = true;
            if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
            const reqId = ++likeReqId.current;

            const prevLiked = Boolean(likedRef.current);
            const prevLikes = clamp0(likesRef.current);
            const nextLiked = !prevLiked;
            const newLikes = clamp0(prevLikes + (nextLiked ? 1 : -1));

            setLiked(nextLiked);
            setLikes(newLikes);

            // If they UN-like while still hovering/focused, force the discreet lantern until they leave.
            if (!nextLiked) setLikeSuppressHover(true);
            else setLikeSuppressHover(false);

            if (nextLiked) setLikeBurst((v) => v + 1);

            broadcast(LIKE_EVT, { postId, liked: nextLiked, likes: newLikes, _acct: accountCacheKey });
            onLikeChange?.({ postId, liked: nextLiked });

            const result = await tryPost(
                musicArtistId
                    ? [
                        `/api/music/artists/${encodeURIComponent(musicArtistId)}/posts/${encodeURIComponent(postId)}/like`,
                    ]
                    : isNewsVariant
                        ? [
                            `/api/community/news/article/${encodeURIComponent(postId)}/like`,
                        ]
                        : isBizVariant
                            ? [
                                `/api/business/posts/${encodeURIComponent(postId)}/like`,
                            ]
                            : [
                                `/api/posts/${encodeURIComponent(postId)}/like`,
                                `${apiBase}/api/posts/${encodeURIComponent(postId)}/like`,
                                // legacy / back-compat fallbacks (may not create notifications in some environments)
                                `/api/community/${encodeURIComponent(postId)}/like`,
                                `/api/community/posts/${encodeURIComponent(postId)}/like`,
                            ],
                isBusinessAccount && activeBusinessId
                    ? { business_id: activeBusinessId }
                    : isArtistAccount && activeArtistId
                        ? { artist_id: activeArtistId }
                        : {}
            );

            if (reqId !== likeReqId.current) return;

            if (result) {
                const serverLiked = result.viewerLiked ?? result.viewer_liked ?? result.is_liked ?? result.liked;
                const serverLikes =
                    result.likesCount ??
                    result.likeCount ??
                    result.likes_count ??
                    result.like_count ??
                    result.count ??
                    result.likes;

                if (serverLiked != null || serverLikes != null) {
                    const finalLiked = serverLiked != null ? Boolean(serverLiked) : nextLiked;
                    const finalLikes = clamp0(serverLikes != null ? Number(serverLikes) : newLikes);

                    setLiked(finalLiked);
                    setLikes(finalLikes);

                    if (finalLiked && !nextLiked) setLikeBurst((v) => v + 1);

                    broadcast(LIKE_EVT, { postId, liked: finalLiked, likes: finalLikes, _acct: accountCacheKey });
                    onLikeChange?.({ postId, liked: finalLiked });
                }
            }

            setLikeBusy(false);
            // Keep cooldown active so late-arriving parent refetches don't flash
            cooldownTimerRef.current = setTimeout(() => { actionCooldownRef.current = false; }, 1500);
        });
    }, [apiBase, postId, likeBusy, requireAuth, onLikeChange, isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId, accountCacheKey, musicArtistId, isBizVariant, isNewsVariant]);

    /* ────────────────────────────────────────────────────────────────────────
       REPOST (mirrors like)
       ──────────────────────────────────────────────────────────────────────── */
    const repostReqId = useRef(0);

    const handleRepost = useCallback(() => {
        requireAuth(async () => {
            if (repostBusy) return;
            setRepostBusy(true);
            actionCooldownRef.current = true;
            if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
            const reqId = ++repostReqId.current;

            const prevReposted = Boolean(repostedRef.current);
            const prevReposts = clamp0(repostsRef.current);
            const nextReposted = !prevReposted;
            const newReposts = clamp0(prevReposts + (nextReposted ? 1 : -1));

            setReposted(nextReposted);
            setReposts(newReposts);

            if (!nextReposted) setRepostSuppressHover(true);
            else setRepostSuppressHover(false);

            if (nextReposted) setRepostBurst((v) => v + 1);

            broadcast(REPOST_EVT, { postId, reposted: nextReposted, reposts: newReposts, _acct: accountCacheKey });
            onRepostChange?.({ postId, reposted: nextReposted });

            const result = await tryPost(
                musicArtistId
                    ? [
                        `/api/music/artists/${encodeURIComponent(musicArtistId)}/posts/${encodeURIComponent(postId)}/repost`,
                    ]
                    : isNewsVariant
                        ? [
                            `/api/community/news/article/${encodeURIComponent(postId)}/repost`,
                        ]
                        : isBizVariant
                            ? [
                                `/api/business/posts/${encodeURIComponent(postId)}/repost`,
                            ]
                            : [
                                `/api/posts/${encodeURIComponent(postId)}/repost`,
                                `${apiBase}/api/posts/${encodeURIComponent(postId)}/repost`,
                                `/api/community/${encodeURIComponent(postId)}/repost`,
                                `/api/community/posts/${encodeURIComponent(postId)}/repost`,
                            ],
                isBusinessAccount && activeBusinessId
                    ? { business_id: activeBusinessId }
                    : isArtistAccount && activeArtistId
                        ? { artist_id: activeArtistId }
                        : {}
            );

            if (reqId !== repostReqId.current) return;

            if (result) {
                const serverReposted = result.viewerReposted ?? result.viewer_reposted ?? result.is_reposted ?? result.reposted;
                const serverReposts =
                    result.repostsCount ??
                    result.repostCount ??
                    result.reposts_count ??
                    result.repost_count ??
                    result.count ??
                    result.reposts;

                if (serverReposted != null || serverReposts != null) {
                    const finalReposted = serverReposted != null ? Boolean(serverReposted) : nextReposted;
                    const finalReposts = clamp0(serverReposts != null ? Number(serverReposts) : newReposts);

                    setReposted(finalReposted);
                    setReposts(finalReposts);

                    if (finalReposted && !nextReposted) setRepostBurst((v) => v + 1);

                    broadcast(REPOST_EVT, { postId, reposted: finalReposted, reposts: finalReposts, _acct: accountCacheKey });
                    onRepostChange?.({ postId, reposted: finalReposted });
                }
            }

            setRepostBusy(false);
            cooldownTimerRef.current = setTimeout(() => { actionCooldownRef.current = false; }, 1500);
        });
    }, [apiBase, postId, repostBusy, requireAuth, onRepostChange, isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId, accountCacheKey, musicArtistId, isBizVariant, isNewsVariant]);

    /* ────────────────────────────────────────────────────────────────────────
       REPORT
       ──────────────────────────────────────────────────────────────────────── */
    const handleReportClick = useCallback(() => {
        requireAuth(() => {
            setReportBurst((v) => v + 1);
            setReportOpen(true);
        });
    }, [requireAuth]);

    const submitReport = useCallback(
        async ({ reason, details }) => {
            setReportOpen(false);

            // Slice 2c: news variant has no backend flag endpoint yet (Slice 2a
            // deferred this pending post_flags schema decision). If we ever
            // render the flag UI for news (caller should pass enableFlag={false}
            // for variant="news" until then), short-circuit with a message
            // rather than firing a doomed request to a 404.
            if (isNewsVariant) {
                setToast({
                    open: true,
                    msg: 'Reporting news articles is not yet available. Thank you for flagging.',
                });
                return;
            }

            const urls = musicArtistId
                ? [
                    `/api/music/artists/${encodeURIComponent(musicArtistId)}/posts/${encodeURIComponent(postId)}/flag`,
                ]
                : isBizVariant
                    ? [
                        `/api/business/posts/${encodeURIComponent(postId)}/flag`,
                    ]
                    : [
                        `/api/posts/${encodeURIComponent(postId)}/flag`,
                        `/api/community/${encodeURIComponent(postId)}/flag`,
                        `/api/community/posts/${encodeURIComponent(postId)}/flag`,
                    ];
            const body = { reason, details };
            if (isBusinessAccount && activeBusinessId) {
                body.business_id = activeBusinessId;
                body.account_type = 'business';
            } else if (isArtistAccount && activeArtistId) {
                body.artist_id = activeArtistId;
                body.account_type = 'artist';
            }
            const flagAcctHeaders = (() => {
                try { return getStaticAccountHeaders(); } catch { return {}; }
            })();
            for (const url of urls) {
                try {
                    const res = await secureFetch(url, {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json', ...flagAcctHeaders },
                        body: JSON.stringify(body),
                    });
                    if (res.ok) {
                        setToast({ open: true, msg: 'Report submitted. Thank you.' });
                        return;
                    }
                } catch {
                    // try next
                }
            }
            setToast({ open: true, msg: 'Could not submit report. Please try again.' });
        },
        [postId, isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId, musicArtistId, isBizVariant, isNewsVariant]
    );

    /* ────────────────────────────────────────────────────────────────────────
       SHARE
       ──────────────────────────────────────────────────────────────────────── */
    const handleShareClick = useCallback(() => {
        setShareBurst((v) => v + 1);
        if (useShareDialog) {
            setShareDialogOpen(true);
        } else if (onShare) {
            onShare();
        }
    }, [useShareDialog, onShare]);

    /* ────────────────────────────────────────────────────────────────────────
       COMMENT
       ──────────────────────────────────────────────────────────────────────── */
    const handleComment = useCallback(() => {
        setCommentBurst((v) => v + 1);
        onComment?.();
    }, [onComment]);

    /* ────────────────────────────────────────────────────────────────────────
       Styling helpers
       ──────────────────────────────────────────────────────────────────────── */
    const brandGold = actionTheme.palette.secondary.main;

    const glowBg = (t) =>
        `radial-gradient(circle, ${alpha(brandGold, 0.65)} 0%, ${alpha(brandGold, 0)} 70%)`;

    const iconColor = (active, hover) => {
        if (active) return brandGold;
        if (hover) return brandGold;
        return 'text.secondary';
    };

    const iconSx = (active, hover, scale = 1, rotate = 0, size = { xs: 22, sm: 24 }) => ({
        fontSize: size,
        color: iconColor(active, hover),
        transform: `scale(${scale})${rotate ? ` rotate(${rotate}deg)` : ''}`,
        transition: `color ${actionTheme.custom.motion.fast}ms ${actionTheme.custom.motion.ease}, transform ${actionTheme.custom.motion.fast}ms ${actionTheme.custom.motion.ease}`,
    });

    /* ────────────────────────────────────────────────────────────────────────
       Render
       ──────────────────────────────────────────────────────────────────────── */
    const likeActive = liked;
    const repostActive = reposted;

    return (
        <>
            <Box
                sx={{ width: '100%' }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: { xs: 0.75, sm: 1.25 },
                        flexWrap: 'wrap',
                    }}
                >
                    {/* LIKE */}
                    <Tooltip title={likeActive ? 'Unlike' : 'Like'}>
                        <Box
                            onClick={handleLike}
                            onKeyDown={(e) =>
                                e.key === 'Enter' || e.key === ' ' ? (e.preventDefault(), handleLike()) : null
                            }
                            onMouseEnter={() => setLikeHover(true)}
                            onMouseLeave={() => {
                                setLikeHover(false);
                                setLikeSuppressHover(false);
                            }}
                            onFocus={() => setLikeHover(true)}
                            onBlur={() => {
                                setLikeHover(false);
                                setLikeSuppressHover(false);
                            }}
                            tabIndex={0}
                            role="button"
                            aria-label={likeActive ? 'Unlike' : 'Like'}
                            sx={PILL_SX}
                        >
                            <Box sx={ICON_BOX_SX}>
                                {likeBurst > 0 && (
                                    <Box
                                        key={`like-burst-${postId}-${likeBurst}`}
                                        aria-hidden="true"
                                        sx={{
                                            position: 'absolute',
                                            left: '50%',
                                            top: '50%',
                                            width: { xs: 78, sm: 88 },
                                            height: { xs: 78, sm: 88 },
                                            transform: 'translate(-50%, -50%)',
                                            borderRadius: '50%',
                                            background: (t) => glowBg(t),
                                            filter: 'blur(0.2px)',
                                            animation: 'llActionGlow 540ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
                                            pointerEvents: 'none',
                                        }}
                                    />
                                )}

                                {likeActive ? (
                                    <FavoriteIcon
                                        sx={iconSx(true, likeHover && !likeSuppressHover, likeHover && !likeSuppressHover ? 1.12 : 1, 0, { xs: 22, sm: 24 })}
                                    />
                                ) : (
                                    <FavoriteBorderIcon
                                        sx={iconSx(false, likeHover, likeHover ? 1.08 : 1, 0, { xs: 22, sm: 24 })}
                                    />
                                )}
                            </Box>

                            <Typography
                                variant="body2"
                                sx={{
                                    fontWeight: (t) => t.typography.fontWeightBold,
                                    color: iconColor(likeActive, likeHover && !likeSuppressHover),
                                    lineHeight: 1,
                                    transform: 'translateY(-1px)',
                                }}
                            >
                                {fmtCount(likes)}
                            </Typography>
                        </Box>
                    </Tooltip>

                    {/* COMMENT */}
                    <Tooltip title="Comment">
                        <Box
                            onClick={handleComment}
                            onKeyDown={(e) =>
                                e.key === 'Enter' || e.key === ' ' ? (e.preventDefault(), handleComment()) : null
                            }
                            onMouseEnter={() => setCommentHover(true)}
                            onMouseLeave={() => setCommentHover(false)}
                            onFocus={() => setCommentHover(true)}
                            onBlur={() => setCommentHover(false)}
                            tabIndex={0}
                            role="button"
                            aria-label="Comment"
                            sx={PILL_SX}
                        >
                            <Box sx={ICON_BOX_SX}>
                                {commentBurst > 0 && (
                                    <Box
                                        key={`comment-burst-${postId}-${commentBurst}`}
                                        aria-hidden="true"
                                        sx={{
                                            position: 'absolute',
                                            left: '50%',
                                            top: '50%',
                                            width: { xs: 78, sm: 88 },
                                            height: { xs: 78, sm: 88 },
                                            transform: 'translate(-50%, -50%)',
                                            borderRadius: '50%',
                                            background: (t) => glowBg(t),
                                            filter: 'blur(0.2px)',
                                            animation: 'llActionGlow 540ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
                                            pointerEvents: 'none',
                                        }}
                                    />
                                )}

                                <ChatBubbleOutlineIcon sx={iconSx(false, commentHover, 0.92, 0, { xs: 22, sm: 24 })} />
                            </Box>

                            <Typography
                                variant="body2"
                                sx={{
                                    fontWeight: (t) => t.typography.fontWeightBold,
                                    color: iconColor(false, commentHover),
                                    lineHeight: 1,
                                    transform: 'translateY(-1px)',
                                }}
                            >
                                {fmtCount(commentsCount)}
                            </Typography>
                        </Box>
                    </Tooltip>

                    {/* REPOST */}
                    <Tooltip title={repostActive ? 'Undo repost' : 'Repost'}>
                        <Box
                            onClick={handleRepost}
                            onKeyDown={(e) =>
                                e.key === 'Enter' || e.key === ' ' ? (e.preventDefault(), handleRepost()) : null
                            }
                            onMouseEnter={() => setRepostHover(true)}
                            onMouseLeave={() => {
                                setRepostHover(false);
                                setRepostSuppressHover(false);
                            }}
                            onFocus={() => setRepostHover(true)}
                            onBlur={() => {
                                setRepostHover(false);
                                setRepostSuppressHover(false);
                            }}
                            tabIndex={0}
                            role="button"
                            aria-label={repostActive ? 'Undo repost' : 'Repost'}
                            sx={PILL_SX}
                        >
                            <Box sx={ICON_BOX_SX}>
                                {repostBurst > 0 && (
                                    <Box
                                        key={`repost-burst-${postId}-${repostBurst}`}
                                        aria-hidden="true"
                                        sx={{
                                            position: 'absolute',
                                            left: '50%',
                                            top: '50%',
                                            width: { xs: 78, sm: 88 },
                                            height: { xs: 78, sm: 88 },
                                            transform: 'translate(-50%, -50%)',
                                            borderRadius: '50%',
                                            background: (t) => glowBg(t),
                                            filter: 'blur(0.2px)',
                                            animation: 'llActionGlow 540ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
                                            pointerEvents: 'none',
                                        }}
                                    />
                                )}

                                <RepeatIcon sx={iconSx(repostActive, repostHover && !repostSuppressHover, 0.93, 0, { xs: 22, sm: 24 })} />
                            </Box>

                            <Typography
                                variant="body2"
                                sx={{
                                    fontWeight: (t) => t.typography.fontWeightBold,
                                    color: iconColor(repostActive, repostHover && !repostSuppressHover),
                                    lineHeight: 1,
                                    transform: 'translateY(-1px)',
                                }}
                            >
                                {fmtCount(reposts)}
                            </Typography>
                        </Box>
                    </Tooltip>

                    {!hideShare && (
                        <Tooltip title="Share">
                            <Box
                                onClick={handleShareClick}
                                onKeyDown={(e) =>
                                    e.key === 'Enter' || e.key === ' ' ? (e.preventDefault(), handleShareClick()) : null
                                }
                                onMouseEnter={() => setShareHover(true)}
                                onMouseLeave={() => setShareHover(false)}
                                onFocus={() => setShareHover(true)}
                                onBlur={() => setShareHover(false)}
                                tabIndex={0}
                                role="button"
                                aria-label="Share post"
                                sx={PILL_SX}
                            >
                                <Box sx={ICON_BOX_SX}>
                                    {shareBurst > 0 && (
                                        <Box
                                            key={`share-burst-${postId}-${shareBurst}`}
                                            aria-hidden="true"
                                            sx={{
                                                position: 'absolute',
                                                left: '50%',
                                                top: '50%',
                                                width: { xs: 78, sm: 88 },
                                                height: { xs: 78, sm: 88 },
                                                transform: 'translate(-50%, -50%)',
                                                borderRadius: '50%',
                                                background: (t) => glowBg(t),
                                                opacity: 0.7,
                                                filter: 'blur(0.2px)',
                                                animation: 'llActionGlow 420ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
                                                pointerEvents: 'none',
                                            }}
                                        />
                                    )}

                                    <ShareOutlinedIcon sx={iconSx(false, shareHover, 1, 0, { xs: 22, sm: 22 })} />
                                </Box>
                            </Box>
                        </Tooltip>
                    )}

                    {enableFlag && (
                        <Tooltip title="Report">
                            <Box
                                onClick={handleReportClick}
                                onKeyDown={(e) =>
                                    e.key === 'Enter' || e.key === ' ' ? (e.preventDefault(), handleReportClick()) : null
                                }
                                onMouseEnter={() => setReportHover(true)}
                                onMouseLeave={() => setReportHover(false)}
                                onFocus={() => setReportHover(true)}
                                onBlur={() => setReportHover(false)}
                                tabIndex={0}
                                role="button"
                                aria-label="Report post"
                                sx={PILL_SX}
                            >
                                <Box sx={ICON_BOX_SX}>
                                    {reportBurst > 0 && (
                                        <Box
                                            key={`report-burst-${postId}-${reportBurst}`}
                                            aria-hidden="true"
                                            sx={{
                                                position: 'absolute',
                                                left: '50%',
                                                top: '50%',
                                                width: { xs: 58, sm: 68 },
                                                height: { xs: 58, sm: 68 },
                                                transform: 'translate(-50%, -50%)',
                                                borderRadius: '50%',
                                                background: (t) => glowBg(t),
                                                opacity: 0.6,
                                                filter: 'blur(0.2px)',
                                                animation: 'llActionGlow 420ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
                                                pointerEvents: 'none',
                                            }}
                                        />
                                    )}

                                    <FlagOutlinedIcon sx={iconSx(false, reportHover, 0.98, -1, { xs: 22, sm: 24 })} />
                                </Box>
                            </Box>
                        </Tooltip>
                    )}
                </Box>
            </Box>

            <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} onSubmit={submitReport} />

            <Snackbar
                open={toast.open}
                autoHideDuration={3000}
                onClose={() => setToast({ open: false, msg: '' })}
                message={toast.msg}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />

            {useShareDialog && !hideShare && (
                <ShareDialog contentType="post"
                             open={shareDialogOpen}
                             onClose={() => setShareDialogOpen(false)}
                             viewer={viewer}
                             post={post || { id: postId }}
                />
            )}
        </>
    );
}

ActionBar.propTypes = {
    user: PropTypes.any,
    postId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    post: PropTypes.any,
    variant: PropTypes.string,
    initialLikes: PropTypes.number,
    initiallyLiked: PropTypes.bool,
    initialReposts: PropTypes.number,
    initiallyReposted: PropTypes.bool,
    commentsCount: PropTypes.number,
    onComment: PropTypes.func,
    onShare: PropTypes.func,
    useShareDialog: PropTypes.bool,
    hideShare: PropTypes.bool,
    showBoost: PropTypes.bool,
    enableFlag: PropTypes.bool,
    onLikeChange: PropTypes.func,
    onRepostChange: PropTypes.func,
};

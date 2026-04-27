// src/pages/community/groups/groupPage/GroupPostsPanel.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Fab,
    Fade,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Skeleton,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import ForumIcon from "@mui/icons-material/Forum";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PushPinIcon from "@mui/icons-material/PushPin";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import SearchInput from "../../../../components/SearchInput";
import { MOBILE_BOTTOM_NAV_HEIGHT } from "../../../../components/Header/Header";

import UserCardPopover from "../../../../components/UserCardPopover";
import { useAuth } from "../../../../components/AuthModalContext";
import { useActiveAccount } from "../../../../components/AccountContext";
import { PostCard } from "../../PostList";
import PostDetailModal from "../../PostDetailModal";
import EditCommunityPostDialog from "../../../community/components/EditCommunityPostDialog";
import DeletePostConfirmDialog from "../../../community/components/DeletePostConfirmDialog";
import { canViewPosts } from "./groupPageUtils";
import { ensureListStaggerKeyframes, getListStaggerSx } from '../../../../themes/theme';
import { secureFetch } from '../../../../utils/secureFetch';

// Read the active account directly from localStorage + events (no context dependency)
function useIsNonPersonalAccount() {
    const read = () => {
        try {
            const raw = localStorage.getItem('ll:activeAccount');
            if (!raw) return false;
            const parsed = JSON.parse(raw);
            const t = String(parsed?.type || parsed?.account_type || parsed?.accountType || '').toLowerCase();
            return t === 'business' || t === 'artist';
        } catch { return false; }
    };
    const [value, setValue] = useState(read);
    useEffect(() => {
        const sync = () => setValue(read());
        window.addEventListener('ll:account:changed', sync);
        window.addEventListener('storage', sync);
        sync();
        return () => {
            window.removeEventListener('ll:account:changed', sync);
            window.removeEventListener('storage', sync);
        };
    }, []);
    return value;
}

const api = process.env.REACT_APP_API_URL || "";

/* ─────────────────────────────────────────────────────────────────────────────
 *  FullscreenPostDetail  (mobile only)
 *  Facebook-style mobile post detail — slides up instantly, full screen,
 *  back button at top, swipe-right from edge to dismiss.
 *  Bottom nav remains visible underneath.
 * ───────────────────────────────────────────────────────────────────────────── */
function FullscreenPostDetail({ post, viewerUser, onClose, group }) {
    const [visible, setVisible] = useState(false);
    const [swipeX, setSwipeX] = useState(0);
    const touchRef = useRef({ startX: 0, startY: 0, active: false });

    // Slide up on mount + lock body scroll
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        // Trigger on next frame for CSS transition
        const raf = requestAnimationFrame(() => setVisible(true));
        return () => {
            cancelAnimationFrame(raf);
            document.body.style.overflow = prev;
        };
    }, []);

    const animateOut = useCallback((cb) => {
        setVisible(false);
        setTimeout(() => cb?.(), 220);
    }, []);

    const handleBack = useCallback(() => animateOut(onClose), [animateOut, onClose]);

    // Edge swipe gesture
    const onTouchStart = useCallback((e) => {
        const t = e.touches[0];
        if (!t || t.clientX > 30) return; // only from left 30px edge
        touchRef.current = { startX: t.clientX, startY: t.clientY, active: true };
    }, []);

    const onTouchMove = useCallback((e) => {
        if (!touchRef.current.active) return;
        const t = e.touches[0];
        if (!t) return;
        const dx = t.clientX - touchRef.current.startX;
        const dy = Math.abs(t.clientY - touchRef.current.startY);
        if (dy > Math.abs(dx) && Math.abs(dx) < 15) {
            touchRef.current.active = false;
            setSwipeX(0);
            return;
        }
        if (dx > 0) setSwipeX(dx);
    }, []);

    const onTouchEnd = useCallback(() => {
        if (!touchRef.current.active) return;
        touchRef.current.active = false;
        if (swipeX > 100) {
            setSwipeX(window.innerWidth);
            setTimeout(() => onClose?.(), 180);
        } else {
            setSwipeX(0);
        }
    }, [swipeX, onClose]);

    const pid = post?.id ?? post?.post_id;

    return (
        <Box
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1299,
                bgcolor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
                // Slide-in from right, or follow swipe
                transform: swipeX > 0
                    ? `translateX(${swipeX}px)`
                    : visible
                        ? 'translateX(0)'
                        : 'translateX(100%)',
                opacity: swipeX > 0 ? Math.max(0, 1 - swipeX / 400) : 1,
                transition: touchRef.current?.active
                    ? 'none'
                    : 'transform 260ms cubic-bezier(0.25,0.1,0.25,1), opacity 180ms ease',
                willChange: 'transform, opacity',
                // Subtle shadow at left edge
                boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
            }}
        >
            {/* ── Slim top bar ── */}
            <Box
                sx={(t) => ({
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 0.5,
                    py: 0.25,
                    minHeight: 46,
                    borderBottom: '1px solid',
                    borderColor: alpha(t.palette.divider, 0.1),
                    bgcolor: t.palette.background.paper,
                })}
            >
                <IconButton
                    onClick={handleBack}
                    size="small"
                    aria-label="Back"
                    sx={(t) => ({
                        width: 36,
                        height: 36,
                        color: t.palette.text.primary,
                    })}
                >
                    <ArrowBackIcon sx={{ fontSize: 22 }} />
                </IconButton>
                {group?.name && (
                    <Typography
                        onClick={handleBack}
                        sx={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: 'text.primary',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: 1.3,
                            '&:hover': { opacity: 0.7 },
                        }}
                    >
                        Back to group posts
                    </Typography>
                )}
            </Box>

            {/* ── Scrollable post body ── */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehavior: 'contain',
                }}
            >
                {post && (
                    <PostDetailModal
                        key={`mobile-detail-${pid || ''}`}
                        user={viewerUser}
                        embedded
                        hideCategoryChip
                        post={{
                            ...post,
                            id: pid,
                            description:
                                post?.description ??
                                post?.content ??
                                post?.body ??
                                post?.post_body ??
                                '',
                        }}
                    />
                )}
            </Box>
        </Box>
    );
}

export default function GroupPostsPanel({
                                            embedded = false,
                                            group,
                                            viewerMembership,
                                            loadingGroup,
                                            renderPrivateGate,

                                            // pinned overview (optional)
                                            overviewPinnedPosts,

                                            // hide pinned posts when filters are not default
                                            showPinnedPosts = true,

                                            openPostPage,

                                            onMutate,
                                            onPostDeleted,
                                            onPostEdited,

                                            // create
                                            canCreatePost,
                                            onOpenCreatePost,

                                            // filters
                                            postSearchText,
                                            setPostSearchText,
                                            postSort,
                                            setPostSort,
                                            postDateRange,
                                            setPostDateRange,
                                            postDateFrom,
                                            setPostDateFrom,
                                            postDateTo,
                                            setPostDateTo,
                                            onApplySearch,
                                            onClearSearch,

                                            // list
                                            visiblePosts,
                                            loadingPosts,
                                            postsCountText,

                                            // infinite scroll sentinel
                                            postsSentinelRef,

                                            // load-more status
                                            loadingPostsMore,
                                            postsEndReached,

                                            // personal account check
                                            // eslint-disable-next-line no-unused-vars
                                            isOnPersonalAccount: _isOnPersonalAccountProp = true,
                                        }) {
    // Always derive from the active account hook — the prop may be stale or missing
    const isOnPersonalAccount = !useIsNonPersonalAccount();
    const { isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId } = useActiveAccount();

    // Mobile detection — fullscreen post detail on mobile/tablet, Dialog on desktop
    const muiTheme = useTheme();
    const isMobileScreen = useMediaQuery(muiTheme.breakpoints.down('md'));

    const Root = embedded ? Box : Paper;

    // Local fallback state for date range when parent doesn't manage it
    const [localDateFrom, setLocalDateFrom] = useState('');
    const [localDateTo, setLocalDateTo] = useState('');
    const dateFrom = postDateFrom !== undefined ? postDateFrom : localDateFrom;
    const dateTo = postDateTo !== undefined ? postDateTo : localDateTo;
    const handleSetDateFrom = setPostDateFrom || setLocalDateFrom;
    const handleSetDateTo = setPostDateTo || setLocalDateTo;

    const stickyWrapRef = useRef(null);
    const [isPinned, setIsPinned] = useState(false);

    const postsLoadStartedRef = useRef(false);
    const [hasLoadedPosts, setHasLoadedPosts] = useState(() => {
        // If posts are already available on mount (restored from cache), skip the loading state
        return Array.isArray(visiblePosts) && visiblePosts.length > 0;
    });
    const stickyTop = 0;

    // Mobile collapsible filters
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    const [isTransitioning, setIsTransitioning] = useState(false);
    const transitionTimerRef = useRef(null);

    const scrollFiltersToTop = useCallback(() => {
        const el = stickyWrapRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const absoluteTop = rect.top + window.pageYOffset;
        const targetTop = Math.max(absoluteTop - stickyTop, 0);
        window.scrollTo({ top: targetTop, behavior: "smooth" });
    }, []);

    useEffect(() => {
        return () => {
            if (transitionTimerRef.current) {
                clearTimeout(transitionTimerRef.current);
                transitionTimerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (loadingPosts) {
            postsLoadStartedRef.current = true;
            return;
        }
        if (postsLoadStartedRef.current && !hasLoadedPosts) {
            setHasLoadedPosts(true);
        }
    }, [loadingPosts, hasLoadedPosts]);

    // Inject list stagger keyframes once (matches PostList behavior)
    useEffect(() => { ensureListStaggerKeyframes(); }, []);

    // user card popover (match PostList behavior)
    const auth = useAuth();
    const viewerUser = auth?.user || null;

    const [userAnchor, setUserAnchor] = useState(null);
    const [userForCard, setUserForCard] = useState(null);

    const [serverFollowingSet, setServerFollowingSet] = useState(() => new Set());
    const [locallyFollowed, setLocallyFollowed] = useState(() => new Set());

    const hydrateTargetFromPublic = useCallback(
        async (target) => {
            if (!target) return null;
            const handleOrId = target.handle || target.id;
            if (!handleOrId) return null;

            const urls = [
                `${api}/users/public/${encodeURIComponent(handleOrId)}`,
                `/users/public/${encodeURIComponent(handleOrId)}`,
                `/api/users/public/${encodeURIComponent(handleOrId)}`,
            ].filter(Boolean);

            for (let i = 0; i < urls.length; i += 1) {
                try {
                    // eslint-disable-next-line no-await-in-loop
                    const res = await secureFetch(urls[i], { credentials: "include" });
                    if (!res.ok) continue;

                    // eslint-disable-next-line no-await-in-loop
                    const data = await res.json();
                    const profile = data?.profile || data?.user || data;
                    if (!profile) continue;

                    // Optionally update id on the current card (helps follow/self checks)
                    setUserForCard((prev) => {
                        if (!prev) return prev;
                        if (!prev.id && profile.id) return { ...prev, id: profile.id };
                        return prev;
                    });

                    // Update following set if server data includes followers (best-effort)
                    const sjRaw = profile.social_json;
                    let sj = {};
                    if (typeof sjRaw === "string") {
                        try {
                            sj = JSON.parse(sjRaw || "{}");
                        } catch {
                            sj = {};
                        }
                    } else if (sjRaw && typeof sjRaw === "object") {
                        sj = sjRaw;
                    }
                    const followers = Array.isArray(sj?.followers) ? sj.followers : [];
                    const isF = !!viewerUser?.id && followers.includes(Number(viewerUser.id));
                    if (profile.id && isF) {
                        setServerFollowingSet((old) => {
                            const next = new Set(old);
                            next.add(Number(profile.id));
                            return next;
                        });
                    }

                    return profile;
                } catch {
                    // try next
                }
            }
            return null;
        },
        [viewerUser?.id]
    );

    const handleOpenUserCard = useCallback(
        (el, author) => {
            setUserAnchor(el);
            setUserForCard({
                id: author?.id ?? author?.user_id,
                first_name: author?.first_name,
                last_name: author?.last_name,
                handle: author?.handle,
                avatar_url: author?.avatar_url,
                // Preserve business/artist account info
                ...(author?.account_type ? { account_type: author.account_type } : {}),
                ...(author?.business_id ? { business_id: author.business_id } : {}),
                ...(author?.business_name ? { business_name: author.business_name } : {}),
                ...(author?.business_slug ? { business_slug: author.business_slug } : {}),
                ...(author?.business_avatar_url ? { business_avatar_url: author.business_avatar_url } : {}),
                ...(author?.artist_id ? { artist_id: author.artist_id } : {}),
                ...(author?.artist_name ? { artist_name: author.artist_name } : {}),
                ...(author?.artist_handle ? { artist_handle: author.artist_handle } : {}),
                ...(author?.artist_avatar_url ? { artist_avatar_url: author.artist_avatar_url } : {}),
                ...(author?.account_name ? { account_name: author.account_name } : {}),
                ...(author?.account_handle ? { account_handle: author.account_handle } : {}),
                ...(author?.account_avatar_url ? { account_avatar_url: author.account_avatar_url } : {}),
            });
            // Only hydrate personal profiles — business/artist cards already have display info
            const isAccountCard = Boolean(
                author?.account_type === 'business' ||
                author?.account_type === 'artist' ||
                author?.business_id ||
                author?.artist_id
            );
            if (!isAccountCard) {
                hydrateTargetFromPublic(author);
            }
        },
        [hydrateTargetFromPublic]
    );

    const openAuthUI = useCallback(() => {
        if (auth && typeof auth.open === "function") {
            auth.open();
            return;
        }
        try {
            window.dispatchEvent(new CustomEvent("open-auth-modal"));
        } catch {
            // ignore
        }
    }, [auth]);

    const requireAuth = useCallback(
        (cb) => {
            if (viewerUser) return cb?.();
            openAuthUI();
            return undefined;
        },
        [viewerUser, openAuthUI]
    );

    const normalizeGroupRole = useCallback((roleRaw) => {
        const r = String(roleRaw || '').trim().toLowerCase();
        if (!r) return '';
        if (r === 'owner' || r === 'admin' || r === 'member') return r;
        if (r === 'administrator') return 'admin';
        return r;
    }, []);

    const viewerGroupRole = normalizeGroupRole(
        viewerMembership?.role || viewerMembership?.member_role || viewerMembership?.membership_role || viewerMembership?.user_role
    );
    const canPinPosts = viewerGroupRole === 'owner' || viewerGroupRole === 'admin';

    const postFollow = useCallback(async (targetId) => {
        const payload = { target_id: targetId, action: "follow" };
        const urls = [`${api}/users/follow`, "/api/users/follow", "/users/follow"].filter(Boolean);

        for (let i = 0; i < urls.length; i += 1) {
            try {
                // eslint-disable-next-line no-await-in-loop
                const res = await secureFetch(urls[i], {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (res.ok) return true;
            } catch {
                // try next
            }
        }
        return false;
    }, []);

    const isSelfForCard = (() => {
        if (!viewerUser || !userForCard) return false;

        const isAccountCard = Boolean(
            userForCard.account_type === 'business' ||
            userForCard.account_type === 'artist' ||
            userForCard.business_id ||
            userForCard.artist_id
        );

        // Match ONLY the currently active account identity
        if (isBusinessAccount && activeBusinessId) {
            if (!isAccountCard) return false;
            return (
                (userForCard.account_type === 'business' || Boolean(userForCard.business_id)) &&
                Number(userForCard.business_id) === Number(activeBusinessId)
            );
        }
        if (isArtistAccount && activeArtistId) {
            if (!isAccountCard) return false;
            return (
                (userForCard.account_type === 'artist' || Boolean(userForCard.artist_id)) &&
                Number(userForCard.artist_id) === Number(activeArtistId)
            );
        }
        // Personal account
        if (isAccountCard) return false;
        const idMatch =
            viewerUser.id != null && userForCard.id != null && Number(viewerUser.id) === Number(userForCard.id);
        const handleMatch =
            viewerUser.handle &&
            userForCard.handle &&
            String(viewerUser.handle).toLowerCase() === String(userForCard.handle).toLowerCase();
        return idMatch || handleMatch;
    })();

    const isFollowingForCard = (() => {
        const tid = Number(userForCard?.id);
        if (!tid) return false;
        return serverFollowingSet.has(tid) || locallyFollowed.has(tid);
    })();

    const handleFollow = useCallback(
        async (targetUser) => {
            const tid0 = Number(targetUser?.id || userForCard?.id);
            const handle0 = targetUser?.handle || userForCard?.handle;
            if (!tid0 && !handle0) return;
            if (isSelfForCard) return;

            requireAuth(async () => {
                let tid = tid0;

                if (!tid && handle0) {
                    const p = await hydrateTargetFromPublic({ handle: handle0 });
                    if (p?.id) tid = Number(p.id);
                }
                if (!tid) return;

                setLocallyFollowed((prev) => {
                    const next = new Set(prev);
                    next.add(tid);
                    return next;
                });

                const ok = await postFollow(tid);
                if (ok) {
                    setServerFollowingSet((prev) => {
                        const next = new Set(prev);
                        next.add(tid);
                        return next;
                    });
                } else {
                    setLocallyFollowed((prev) => {
                        const next = new Set(prev);
                        next.delete(tid);
                        return next;
                    });
                }
            });
        },
        [hydrateTargetFromPublic, isSelfForCard, postFollow, requireAuth, userForCard?.handle, userForCard?.id]
    );

    useEffect(() => {
        const onScroll = () => {
            const el = stickyWrapRef.current;
            if (!el) return;

            const rect = el.getBoundingClientRect();
            setIsPinned(rect.top <= stickyTop + 1);
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const isPrivatePosts = !loadingGroup && !canViewPosts(group, viewerMembership);

    const handleApplySearch = useCallback(() => {
        setIsTransitioning(true);
        scrollFiltersToTop();

        if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = setTimeout(() => {
            onApplySearch?.();
        }, 160);
    }, [onApplySearch, scrollFiltersToTop]);

    const handleClearSearch = useCallback(() => {
        setIsTransitioning(true);
        scrollFiltersToTop();

        if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = setTimeout(() => {
            onClearSearch?.();
        }, 160);
    }, [onClearSearch, scrollFiltersToTop]);

    // Encode from/to dates into postDateRange so the parent sends them to the API
    const syncDateRangeAndSearch = useCallback((fromVal, toVal) => {
        if (fromVal || toVal) {
            const parts = [];
            if (fromVal) parts.push(`from:${fromVal}`);
            if (toVal) parts.push(`to:${toVal}`);
            if (setPostDateRange) setPostDateRange(parts.join(','));
        } else {
            if (setPostDateRange) setPostDateRange('all');
        }
    }, [setPostDateRange]);

    // Fade back in after results load.
    useEffect(() => {
        if (!isTransitioning) return;
        if (loadingPosts) return;

        const t = setTimeout(() => {
            setIsTransitioning(false);
        }, 120);

        return () => clearTimeout(t);
    }, [isTransitioning, loadingPosts]);

    // Edit/Delete dialogs (wired to PostCard events, same pattern as PostList)
    const [editOpen, setEditOpen] = useState(false);
    const [editPostId, setEditPostId] = useState(null);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletePostId, setDeletePostId] = useState(null);

    // Admin/owner can delete any post (even if not the author)
    const [adminDeleteOpen, setAdminDeleteOpen] = useState(false);
    const [adminDeletePostId, setAdminDeletePostId] = useState(null);
    const [adminDeleteSaving, setAdminDeleteSaving] = useState(false);
    const [adminDeleteError, setAdminDeleteError] = useState('');

    // ── Post detail popup ──
    const [detailPost, setDetailPost] = useState(null);
    const detailPostOpen = Boolean(detailPost);

    // Guard: skip opening the detail popup if a menu action (report/edit/delete/history) just fired.
    // MUI Menu onClose can re-trigger the underlying card click.
    const dialogJustOpenedRef = useRef(false);

    const handlePostClick = useCallback((postIdOrObj) => {
        // If a dialog was just opened by a menu action, skip this click
        if (dialogJustOpenedRef.current) {
            dialogJustOpenedRef.current = false;
            return;
        }
        const pid = typeof postIdOrObj === 'object' ? (postIdOrObj?.id ?? postIdOrObj?.post_id) : postIdOrObj;
        const found = (visiblePosts || []).find(
            (p) => (p?.id ?? p?.post_id) === pid
        );
        setDetailPost(found || (typeof postIdOrObj === 'object' ? postIdOrObj : null));
    }, [visiblePosts]);

    const closeDetailPost = useCallback(() => {
        setDetailPost(null);
    }, []);


    useEffect(() => {
        const onReqEdit = (e) => {
            const pid = Number(e?.detail?.postId || e?.detail?.post?.id || 0);
            if (!pid) return;
            dialogJustOpenedRef.current = true;
            setEditPostId(pid);
            setEditOpen(true);
        };

        const onReqDelete = (e) => {
            const pid = Number(e?.detail?.postId || e?.detail?.post?.id || 0);
            if (!pid) return;
            dialogJustOpenedRef.current = true;
            setDeletePostId(pid);
            setDeleteOpen(true);
        };

        window.addEventListener("ll:communityPost:requestEdit", onReqEdit);
        window.addEventListener("ll:communityPost:requestDelete", onReqDelete);

        return () => {
            window.removeEventListener("ll:communityPost:requestEdit", onReqEdit);
            window.removeEventListener("ll:communityPost:requestDelete", onReqDelete);
        };
    }, []);

    // Refresh posts list when a new post is created
    useEffect(() => {
        const handler = () => {
            if (typeof onMutate === "function") onMutate();
        };
        window.addEventListener("ll:group:postCreated", handler);
        return () => window.removeEventListener("ll:group:postCreated", handler);
    }, [onMutate]);

    const closeEdit = useCallback(() => {
        setEditOpen(false);
        setEditPostId(null);
        if (typeof onMutate === "function") onMutate();
    }, [onMutate]);

    const closeDelete = useCallback(() => {
        setDeleteOpen(false);
        setDeletePostId(null);
    }, []);

    // ── Edit history dialog ──
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyPostId, setHistoryPostId] = useState(null);
    const [historyPost, setHistoryPost] = useState(null);
    const [historyRows, setHistoryRows] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState('');

    useEffect(() => {
        const onReqHistory = (e) => {
            const pid = Number(e?.detail?.postId || e?.detail?.post?.id || 0);
            if (!pid) return;
            dialogJustOpenedRef.current = true;
            setHistoryError('');
            setHistoryRows([]);
            setHistoryPostId(pid);
            setHistoryPost(e?.detail?.post || null);
            setHistoryOpen(true);
        };
        window.addEventListener('ll:communityPost:requestHistory', onReqHistory);
        return () => window.removeEventListener('ll:communityPost:requestHistory', onReqHistory);
    }, []);

    const closeHistoryDialog = useCallback(() => {
        setHistoryOpen(false);
        setHistoryPostId(null);
        setHistoryPost(null);
        setHistoryRows([]);
        setHistoryError('');
    }, []);

    const normalizeHistoryRows = useCallback((rows) => {
        const arr = Array.isArray(rows) ? rows : [];
        return arr.map((row, idx) => {
            const current = row && typeof row === 'object' ? row : {};
            const snapshot = current.snapshot && typeof current.snapshot === 'object' ? current.snapshot : {};
            const prev = idx + 1 < arr.length ? (arr[idx + 1] || {}) : null;
            const curPhotos = Array.isArray(snapshot.photos) ? snapshot.photos.filter(Boolean) : [];
            const prevSnap = prev && typeof prev === 'object' && prev.snapshot && typeof prev.snapshot === 'object' ? prev.snapshot : {};
            const prevPhotos = Array.isArray(prevSnap.photos) ? prevSnap.photos.filter(Boolean) : [];
            const existingDiff = current.diff && typeof current.diff === 'object' ? current.diff : null;
            if (existingDiff) {
                const added = Array.isArray(existingDiff.added) ? existingDiff.added.filter(Boolean) : [];
                const removed = Array.isArray(existingDiff.removed) ? existingDiff.removed.filter(Boolean) : [];
                const reordered = Boolean(existingDiff.reordered);
                return { ...current, snapshot, diff: { ...existingDiff, added, removed, reordered } };
            }
            const curSet = new Set(curPhotos);
            const prevSet = new Set(prevPhotos);
            const added = curPhotos.filter((p) => !prevSet.has(p));
            const removed = prevPhotos.filter((p) => !curSet.has(p));
            const reordered = added.length === 0 && removed.length === 0 && curPhotos.length > 1 && prevPhotos.length > 1 && curPhotos.join('||') !== prevPhotos.join('||');
            return { ...current, snapshot, diff: { added, removed, reordered } };
        });
    }, []);

    useEffect(() => {
        if (!historyOpen || !historyPostId) return;
        let active = true;
        setHistoryLoading(true);
        setHistoryError('');
        (async () => {
            try {
                const res = await secureFetch(`/api/community/${historyPostId}/edits`, { credentials: 'include' });
                if (!res.ok) throw new Error(`Failed (${res.status})`);
                const data = await res.json();
                const rows = Array.isArray(data) ? data : Array.isArray(data?.edits) ? data.edits : [];
                if (active) setHistoryRows(normalizeHistoryRows(rows));
            } catch (err) {
                if (active) setHistoryError(err?.message || 'Failed to load edit history.');
            } finally {
                if (active) setHistoryLoading(false);
            }
        })();
        return () => { active = false; };
    }, [historyOpen, historyPostId, normalizeHistoryRows]);

    const closeAdminDelete = useCallback(() => {
        if (adminDeleteSaving) return;
        setAdminDeleteOpen(false);
        setAdminDeletePostId(null);
        setAdminDeleteSaving(false);
        setAdminDeleteError('');
    }, [adminDeleteSaving]);

    const openAdminDelete = useCallback((postId) => {
        const pid = postId != null ? Number(postId) : null;
        if (!pid) return;
        setAdminDeleteError('');
        setAdminDeleteSaving(false);
        setAdminDeletePostId(pid);
        setAdminDeleteOpen(true);
    }, []);

    const submitAdminDelete = useCallback(async () => {
        const gid = group?.id != null ? Number(group.id) : null;
        const pid = adminDeletePostId != null ? Number(adminDeletePostId) : null;
        if (!gid || !pid) return;

        setAdminDeleteSaving(true);
        setAdminDeleteError('');

        const urls = [
            `${api}/groups/${encodeURIComponent(String(gid))}/admin/posts/${encodeURIComponent(String(pid))}`,
            `/api/groups/${encodeURIComponent(String(gid))}/admin/posts/${encodeURIComponent(String(pid))}`,
            `/groups/${encodeURIComponent(String(gid))}/admin/posts/${encodeURIComponent(String(pid))}`,
        ].filter(Boolean);

        let ok = false;
        for (let i = 0; i < urls.length; i += 1) {
            try {
                // eslint-disable-next-line no-await-in-loop
                const res = await secureFetch(urls[i], { method: 'DELETE', credentials: 'include' });
                if (res.ok) {
                    ok = true;
                    break;
                }
            } catch {
                // try next
            }
        }

        if (!ok) {
            setAdminDeleteSaving(false);
            setAdminDeleteError('Unable to delete this post. Please try again.');
            return;
        }

        if (typeof onPostDeleted === 'function') onPostDeleted();
        else if (typeof onMutate === 'function') onMutate();
        closeAdminDelete();
    }, [adminDeletePostId, closeAdminDelete, group?.id, onMutate, onPostDeleted]);

    const afterDeleted = useCallback(() => {
        if (typeof onPostDeleted === "function") onPostDeleted();
        else if (typeof onMutate === "function") onMutate();
        closeDelete();
    }, [closeDelete, onMutate, onPostDeleted]);

    const afterEdited = useCallback(() => {
        if (typeof onPostEdited === "function") onPostEdited();
        else if (typeof onMutate === "function") onMutate();
    }, [onMutate, onPostEdited]);

    // Pin/unpin (owner/admin only)
    const [pinDialogOpen, setPinDialogOpen] = useState(false);
    const [pinTarget, setPinTarget] = useState(null); // { postId, isPinned }
    const [pinSaving, setPinSaving] = useState(false);
    const [pinError, setPinError] = useState('');
    const [existingPinnedPostId, setExistingPinnedPostId] = useState(null);


    const closePinDialog = useCallback(() => {
        setPinDialogOpen(false);
        setPinTarget(null);
        setPinSaving(false);
        setPinError('');
        setExistingPinnedPostId(null);
    }, []);

    const openPinDialog = useCallback(
        (postId, isPinned) => {
            if (!canPinPosts) return;
            if (!postId) return;
            const pinPool = [...(Array.isArray(overviewPinnedPosts) ? overviewPinnedPosts : []), ...(visiblePosts || [])];
            const currentPinned = pinPool.find((p) => {
                const id = p?.id ?? p?.post_id ?? p?.postId;
                const pinned = Boolean(Number(p?.is_pinned ?? p?.isPinned ?? 0));
                return pinned && Number(id) && Number(id) !== Number(postId);
            });
            const currentPinnedId = currentPinned ? Number(currentPinned?.id ?? currentPinned?.post_id ?? currentPinned?.postId) : null;
            setExistingPinnedPostId(currentPinnedId || null);
            setPinTarget({ postId: Number(postId), isPinned: Boolean(isPinned) });
            setPinError('');
            setPinSaving(false);
            setPinDialogOpen(true);
        },
        [canPinPosts, overviewPinnedPosts, visiblePosts]
    );

    const submitPinChange = useCallback(async () => {
        const gid = group?.id != null ? Number(group.id) : null;
        const pid = pinTarget?.postId != null ? Number(pinTarget.postId) : null;
        if (!gid || !pid) return;

        setPinSaving(true);
        setPinError('');

        const nextPinned = !Boolean(pinTarget?.isPinned);
        const action = nextPinned ? 'pin' : 'unpin';

        // Prefer admin routes (enforces owner/admin). Keep fallbacks for older routers.
        const urls = [
            `${api}/groups/${encodeURIComponent(String(gid))}/admin/posts/${encodeURIComponent(String(pid))}/${action}`,
            `/api/groups/${encodeURIComponent(String(gid))}/admin/posts/${encodeURIComponent(String(pid))}/${action}`,
            `/groups/${encodeURIComponent(String(gid))}/admin/posts/${encodeURIComponent(String(pid))}/${action}`,

            // Some routers may expose explicit endpoints
            `${api}/groups/${encodeURIComponent(String(gid))}/admin/posts/${encodeURIComponent(String(pid))}/${action === 'pin' ? 'pin' : 'unpin'}`,
            `/api/groups/${encodeURIComponent(String(gid))}/admin/posts/${encodeURIComponent(String(pid))}/${action === 'pin' ? 'pin' : 'unpin'}`,
            `/groups/${encodeURIComponent(String(gid))}/admin/posts/${encodeURIComponent(String(pid))}/${action === 'pin' ? 'pin' : 'unpin'}`,

            // Legacy "pin" route that accepts { pinned: true|false }
            `${api}/groups/${encodeURIComponent(String(gid))}/posts/${encodeURIComponent(String(pid))}/pin`,
            `/api/groups/${encodeURIComponent(String(gid))}/posts/${encodeURIComponent(String(pid))}/pin`,
            `/groups/${encodeURIComponent(String(gid))}/posts/${encodeURIComponent(String(pid))}/pin`,
        ].filter(Boolean);

        let ok = false;
        for (let i = 0; i < urls.length; i += 1) {
            try {
                // eslint-disable-next-line no-await-in-loop
                const res = await secureFetch(urls[i], {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pinned: nextPinned }),
                });
                if (res.ok) {
                    ok = true;
                    break;
                }
            } catch {
                // try next
            }
        }

        if (!ok) {
            setPinSaving(false);
            setPinError('Unable to update pinned status. Please try again.');
            return;
        }

        // Refresh list (pinned posts should float to top)
        if (typeof onMutate === 'function') onMutate();
        closePinDialog();
    }, [api, closePinDialog, group?.id, onMutate, pinTarget]);

    if (isPrivatePosts) {
        return renderPrivateGate?.("posts") || null;
    }

    return (
        <Root
            sx={(t) => ({
                borderRadius: 0,
                mt: 0,
                overflow: "visible",
                border: embedded ? "none" : "1px solid",
                borderColor: embedded ? "transparent" : alpha(t.palette.primary.main, 0.12),
                bgcolor: embedded ? "transparent" : t.palette.background.paper,
                boxShadow: embedded ? "none" : `0 18px 48px ${alpha(t.palette.common.black, 0.08)}`,
            })}
        >
            <Box
                ref={stickyWrapRef}
                sx={(t) => ({
                    position: "sticky",
                    top: stickyTop,
                    zIndex: 1200,
                    bgcolor: t.palette.background.paper,
                    isolation: "isolate",
                    transform: "translateZ(0)",
                    borderBottom: "1px solid",
                    borderColor: alpha(t.palette.primary.main, 0.1),
                    boxShadow: isPinned ? `0 4px 16px ${alpha(t.palette.common.black, 0.08)}` : "none",
                })}
            >
                <Box sx={{ p: { xs: 1, sm: 2.5 }, pb: { xs: 0.5, sm: 1.5 }, display: 'flex', flexDirection: 'column', gap: { xs: 0.5, sm: 1 } }}>
                    {/* Search bar + filter toggle */}
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        <Box sx={{ flex: 1 }}>
                            <SearchInput
                                placeholder="Search posts…"
                                value={postSearchText}
                                onChange={(e) => setPostSearchText(e.target.value)}
                                onSearch={handleApplySearch}
                                onClear={() => {
                                    setPostSearchText('');
                                    handleClearSearch();
                                }}
                            />
                        </Box>
                        {/* Mobile filter toggle button */}
                        <IconButton
                            size="small"
                            onClick={() => setMobileFiltersOpen((prev) => !prev)}
                            sx={(t) => ({
                                display: { xs: 'inline-flex', sm: 'none' },
                                width: 36,
                                height: 36,
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: mobileFiltersOpen
                                    ? alpha(t.palette.primary.main, 0.4)
                                    : alpha(t.palette.divider, 0.2),
                                bgcolor: mobileFiltersOpen
                                    ? alpha(t.palette.primary.main, 0.08)
                                    : 'transparent',
                                color: mobileFiltersOpen
                                    ? t.palette.primary.main
                                    : t.palette.text.secondary,
                                transition: 'all 180ms ease',
                                flexShrink: 0,
                                '&:hover': {
                                    bgcolor: alpha(t.palette.primary.main, 0.06),
                                    borderColor: alpha(t.palette.primary.main, 0.3),
                                },
                            })}
                        >
                            <TuneRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>

                    {/* Dropdown filters row — always visible on desktop, collapsible on mobile */}
                    <Box
                        sx={{
                            display: { xs: mobileFiltersOpen ? 'flex' : 'none', sm: 'flex' },
                            gap: { xs: 0.75, sm: 1.5 },
                            flexWrap: { xs: 'wrap', sm: 'wrap' },
                            alignItems: 'center',
                            pb: { xs: 0.5, sm: 0 },
                            mt: { xs: 0, sm: 0.5 },
                            // Animate on mobile
                            ...(mobileFiltersOpen ? {
                                animation: 'filterSlideIn 200ms ease-out',
                                '@keyframes filterSlideIn': {
                                    '0%': { opacity: 0, transform: 'translateY(-6px)' },
                                    '100%': { opacity: 1, transform: 'translateY(0)' },
                                },
                            } : {}),
                        }}
                    >
                        {/* Sort dropdown */}
                        <FormControl size="small" sx={{ minWidth: { xs: 0, sm: 130 }, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}>
                            <InputLabel sx={{ fontWeight: 700, fontSize: 13 }}>Sort</InputLabel>
                            <Select
                                value={postSort || 'newest'}
                                label="Sort"
                                onChange={(e) => {
                                    if (setPostSort) setPostSort(e.target.value);
                                }}
                                sx={{ bgcolor: 'background.paper', borderRadius: 1.5, fontWeight: 700, fontSize: 13 }}
                            >
                                <MenuItem value="newest">Newest</MenuItem>
                                <MenuItem value="oldest">Oldest</MenuItem>
                                <MenuItem value="most_liked">Most Liked</MenuItem>
                                <MenuItem value="most_commented">Most Discussed</MenuItem>
                            </Select>
                        </FormControl>

                        {/* From date */}
                        <TextField
                            type="date"
                            label="From"
                            size="small"
                            value={dateFrom}
                            onChange={(e) => {
                                const val = e.target.value;
                                handleSetDateFrom(val);
                                syncDateRangeAndSearch(val, dateTo);
                            }}
                            InputLabelProps={{ shrink: true, sx: { fontWeight: 700, fontSize: 13 } }}
                            sx={{ minWidth: { xs: 0, sm: 150 }, flex: { xs: '1 1 calc(50% - 4px)', sm: '0 0 auto' }, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', borderRadius: 1.5, fontSize: 13 } }}
                        />

                        {/* To date */}
                        <TextField
                            type="date"
                            label="To"
                            size="small"
                            value={dateTo}
                            onChange={(e) => {
                                const val = e.target.value;
                                handleSetDateTo(val);
                                syncDateRangeAndSearch(dateFrom, val);
                            }}
                            InputLabelProps={{ shrink: true, sx: { fontWeight: 700, fontSize: 13 } }}
                            sx={{ minWidth: { xs: 0, sm: 150 }, flex: { xs: '1 1 calc(50% - 4px)', sm: '0 0 auto' }, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', borderRadius: 1.5, fontSize: 13 } }}
                        />
                    </Box>
                </Box>

                <Divider sx={(t) => ({ borderColor: alpha(t.palette.primary.main, 0.1) })} />

                <Box
                    sx={{
                        px: { xs: 1, sm: 2.5 },
                        py: { xs: 0.75, sm: 1.25 },
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 0.75,
                        flexWrap: "nowrap",
                    }}
                >
                    <Typography sx={{ fontWeight: 950, fontSize: { xs: 11, sm: 13 }, opacity: 0.85, flexShrink: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {postsCountText ? `Displaying ${postsCountText}` : ""}
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
                        {(() => {
                            // Determine the tooltip and disabled state
                            const canPost = canCreatePost && isOnPersonalAccount;
                            let tooltipMsg = '';
                            if (!isOnPersonalAccount) {
                                tooltipMsg = 'Switch to your personal account to create a post';
                            } else if (!canCreatePost) {
                                tooltipMsg = 'Join this group to create a post';
                            }
                            const isDisabled = !canPost;

                            return (
                                <Tooltip title={tooltipMsg} arrow disableHoverListener={!isDisabled}>
                                    <span>
                                        <Button
                                            variant="outlined"
                                            disabled={isDisabled}
                                            onClick={isDisabled ? undefined : onOpenCreatePost}
                                            startIcon={<ForumIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />}
                                            sx={(t) => ({
                                                display: { xs: 'none', sm: 'inline-flex' },
                                                borderRadius: 999,
                                                textTransform: "none",
                                                fontWeight: 800,
                                                height: 40,
                                                px: 2.25,
                                                fontSize: 14,
                                                whiteSpace: "nowrap",
                                                borderColor: t.palette.primary.main,
                                                color: t.palette.primary.main,
                                                borderWidth: 1.5,
                                                "&:hover": {
                                                    borderWidth: 1.5,
                                                    bgcolor: alpha(t.palette.primary.main, 0.04),
                                                },
                                            })}
                                        >
                                            Create Post
                                        </Button>
                                    </span>
                                </Tooltip>
                            );
                        })()}

                        {isPinned ? (
                            <>
                                {/* Icon-only on mobile */}
                                <IconButton
                                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                                    sx={(t) => ({
                                        display: { xs: 'inline-flex', sm: 'none' },
                                        width: 32,
                                        height: 32,
                                        border: '1px solid',
                                        borderColor: alpha(t.palette.primary.main, 0.25),
                                        color: t.palette.primary.main,
                                    })}
                                >
                                    <ArrowUpwardIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                                {/* Full button on desktop */}
                                <Button
                                    variant="outlined"
                                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                                    startIcon={<ArrowUpwardIcon sx={{ fontSize: 20 }} />}
                                    sx={(t) => ({
                                        display: { xs: 'none', sm: 'inline-flex' },
                                        borderRadius: 999,
                                        textTransform: "none",
                                        fontWeight: 950,
                                        height: 40,
                                        px: 2,
                                        fontSize: 14,
                                        whiteSpace: "nowrap",
                                        borderColor: alpha(t.palette.primary.main, 0.25),
                                    })}
                                >
                                    Back to Top
                                </Button>
                            </>
                        ) : null}
                    </Box>
                </Box>
            </Box>

            <Box
                sx={(t) => ({
                    p: { xs: 0, sm: 2.5 },
                    bgcolor: { xs: 'transparent', sm: t.palette.background.paper },
                    opacity: isTransitioning ? 0 : 1,
                    transform: isTransitioning ? "translateY(2px)" : "translateY(0)",
                    transition: "opacity 220ms ease, transform 220ms ease",
                    pointerEvents: isTransitioning ? "none" : "auto",
                })}
            >
                {!hasLoadedPosts ? (
                    <Box
                        sx={{
                            minHeight: 260,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            py: 6,
                        }}
                    >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <CircularProgress size={26} />
                            <Typography sx={{ fontWeight: 800, opacity: 0.8 }}>Loading posts…</Typography>
                        </Stack>
                    </Box>
                ) : visiblePosts?.length ? (
                    <Box sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        width: '100%',
                        overflowX: 'hidden',
                        // On mobile: no gap, posts separated by borders (like profile feed)
                        gap: { xs: 0, sm: undefined },
                    }}>
                        {visiblePosts.map((postObj, idx) => {
                            const postId = postObj?.id ?? postObj?.post_id ?? postObj?.postId;
                            const isPinnedPost = Boolean(Number(postObj?.is_pinned ?? postObj?.isPinned ?? 0));

                            return (
                                <Box
                                    key={`${String(postId)}-${activeBusinessId || 0}-${activeArtistId || 0}`}
                                    data-group-post-id={postId}
                                    sx={(t) => ({
                                        flex: {
                                            xs: '0 0 100%',
                                            sm: '0 0 100%',
                                            md: '0 0 calc(50% - 16px)',
                                            lg: '0 0 calc(50% - 16px)',
                                            xl: '0 0 calc(50% - 16px)',
                                        },
                                        // Mobile: match community page feed style exactly
                                        mx: { xs: 0, md: 1 },
                                        my: { xs: 0, md: 1 },
                                        px: { xs: 0, sm: 0 },
                                        minWidth: 0,
                                        maxWidth: '100%',
                                        width: '100%',
                                        // Border-bottom divider on mobile (matching community page)
                                        borderBottom: { xs: `1px solid ${alpha(t.palette.divider, 0.1)}`, md: 'none' },
                                        '&:last-child': { borderBottom: 'none' },
                                        ...getListStaggerSx(idx),
                                    })}
                                >
                                    {/* Pinned Post badge */}
                                    {isPinnedPost ? (
                                        <Box
                                            sx={(t) => ({
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 0.5,
                                                mb: 0.75,
                                                ml: { xs: 1.5, sm: 0 },
                                                px: 1,
                                                py: 0.4,
                                                borderRadius: 1,
                                                bgcolor: alpha(t.palette.warning.main, 0.08),
                                                border: `1px solid ${alpha(t.palette.warning.main, 0.28)}`,
                                                userSelect: 'none',
                                            })}
                                        >
                                            <PushPinIcon
                                                sx={(t) => ({ fontSize: 14, color: t.palette.warning.main, transform: 'rotate(45deg)' })}
                                            />
                                            <Typography
                                                component="span"
                                                sx={(t) => ({
                                                    whiteSpace: 'nowrap',
                                                    fontWeight: 700,
                                                    color: t.palette.warning.dark,
                                                    fontSize: '0.7rem',
                                                    lineHeight: 1,
                                                })}
                                            >
                                                Pinned Post
                                            </Typography>
                                        </Box>
                                    ) : null}

                                    <PostCard
                                        post={postObj}
                                        user={viewerUser}
                                        hoveredId={null}
                                        setHoveredId={() => {}}
                                        onLocationClick={() => {}}
                                        locationClickable={false}
                                        onCardClick={() => {
                                            handlePostClick(postId || postObj);
                                        }}
                                        onOpenUserCard={handleOpenUserCard}
                                        onOpenShare={() => {}}
                                        selectable={false}
                                        currentView="group"
                                        groupId={Number(group?.id) || null}
                                        flat={isMobileScreen}
                                    />
                                </Box>
                            );
                        })}
                    </Box>
                ) : (
                    <Box
                        sx={{
                            py: 5,
                            px: 3,
                            textAlign: "center",
                        }}
                    >
                        <ForumIcon sx={(t) => ({ fontSize: 56, color: alpha(t.palette.primary.main, 0.7), mb: 1.5 })} />
                        {/* Show different message if filters are active vs. group has no posts */}
                        {postSearchText || postSort !== "newest" || postDateRange !== "all" || dateFrom || dateTo ? (
                            <>
                                <Typography sx={{ fontWeight: 950, fontSize: 18, mb: 0.5 }}>No posts found</Typography>
                                <Typography sx={{ opacity: 0.7, fontWeight: 650 }}>Try adjusting your filters.</Typography>
                            </>
                        ) : (
                            <>
                                <Typography sx={{ fontWeight: 950, fontSize: 18, mb: 0.5 }}>No posts yet</Typography>
                                <Typography sx={{ opacity: 0.7, fontWeight: 650 }}>This group hasn't posted yet. Be the first!</Typography>
                            </>
                        )}
                    </Box>
                )}

                <Box ref={postsSentinelRef} sx={{ height: 1 }} />

                {loadingPostsMore && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 2.5 }}>
                        <Skeleton variant="rounded" height={56} width={240} sx={{ borderRadius: 999 }} />
                    </Box>
                )}
            </Box>

            <Dialog
                open={adminDeleteOpen}
                onClose={closeAdminDelete}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 950, pr: 6, position: 'relative' }}>
                    Delete this post?
                    <IconButton
                        aria-label="Close"
                        onClick={closeAdminDelete}
                        size="small"
                        sx={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ fontWeight: 700, opacity: 0.85, mb: 1 }}>
                        This will permanently remove the post from the group.
                    </Typography>
                    {adminDeleteError ? (
                        <Typography sx={{ color: 'error.main', fontWeight: 800 }}>
                            {adminDeleteError}
                        </Typography>
                    ) : null}
                </DialogContent>
                <DialogActions sx={{ px: 2.5, pb: 2.25 }}>
                    <Button
                        onClick={closeAdminDelete}
                        disabled={adminDeleteSaving}
                        sx={{ textTransform: 'none', fontWeight: 900, borderRadius: 999 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={submitAdminDelete}
                        disabled={adminDeleteSaving}
                        sx={{ textTransform: 'none', fontWeight: 950, borderRadius: 999 }}
                    >
                        {adminDeleteSaving ? 'Deleting…' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={pinDialogOpen}
                onClose={() => {
                    if (!pinSaving) closePinDialog();
                }}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 950, pr: 6, position: 'relative' }}>
                    {pinTarget?.isPinned ? 'Unpin this post?' : 'Pin this post?'}
                    <IconButton
                        aria-label="Close"
                        onClick={() => {
                            if (!pinSaving) closePinDialog();
                        }}
                        size="small"
                        sx={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ fontWeight: 700, opacity: 0.85, mb: 1 }}>
                        {pinTarget?.isPinned
                            ? 'This post will no longer stay at the top of the group posts feed.'
                            : 'This post will be pinned to the top of the group posts feed.'}
                    </Typography>
                    {!pinTarget?.isPinned && existingPinnedPostId ? (
                        <Typography sx={{ fontWeight: 850, opacity: 0.85, mb: 1 }}>
                            Pinning this post will replace the currently pinned post.
                        </Typography>
                    ) : null}
                    {pinError ? (
                        <Typography sx={{ color: 'error.main', fontWeight: 800 }}>
                            {pinError}
                        </Typography>
                    ) : null}
                </DialogContent>
                <DialogActions sx={{ px: 2.5, pb: 2.25 }}>
                    <Button
                        onClick={closePinDialog}
                        disabled={pinSaving}
                        sx={{ textTransform: 'none', fontWeight: 900, borderRadius: 999 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={submitPinChange}
                        disabled={pinSaving}
                        sx={{ textTransform: 'none', fontWeight: 950, borderRadius: 999 }}
                    >
                        {pinTarget?.isPinned ? 'Unpin' : 'Pin'}
                    </Button>
                </DialogActions>
            </Dialog>

            <UserCardPopover
                anchorEl={userAnchor}
                onClose={() => setUserAnchor(null)}
                user={userForCard}
                isSelf={isSelfForCard}
                following={isFollowingForCard}
                onFollow={handleFollow}
                onViewProfile={(u) => {
                    // Navigate to business page
                    if (u?.account_type === 'business' || u?.business_id) {
                        const slug = u?.business_slug || u?.account_handle;
                        if (slug) return window.location.assign(`/business/${slug}`);
                    }
                    // Navigate to music page
                    if (u?.account_type === 'artist' || u?.artist_id) {
                        const ah = u?.artist_handle || u?.account_handle;
                        if (ah) return window.location.assign(`/${ah}`);
                    }
                    const h = u?.handle || u?.id;
                    if (!h) return;
                    window.location.assign(`/${h}`);
                }}
            />

            <EditCommunityPostDialog open={editOpen} postId={editPostId} onClose={closeEdit} onSaved={afterEdited} />

            <DeletePostConfirmDialog
                open={deleteOpen}
                postId={deletePostId}
                onClose={closeDelete}
                onDeleted={afterDeleted}
            />

            {/* ── Post detail: fullscreen on mobile, Dialog on desktop ── */}
            {detailPostOpen && isMobileScreen && (
                <FullscreenPostDetail
                    post={detailPost}
                    viewerUser={viewerUser}
                    onClose={closeDetailPost}
                    group={group}
                />
            )}
            {detailPostOpen && !isMobileScreen && (
                <Dialog
                    open={detailPostOpen}
                    onClose={closeDetailPost}
                    maxWidth="md"
                    fullWidth
                    disableScrollLock
                    PaperProps={{
                        sx: {
                            borderRadius: 3,
                            overflow: 'hidden',
                            maxHeight: '90vh',
                        },
                    }}
                >
                    <Box
                        sx={{
                            position: 'sticky',
                            top: 0,
                            zIndex: 5,
                            bgcolor: 'background.paper',
                            borderBottom: '1px solid',
                            borderColor: (t) => alpha(t.palette.divider, 0.15),
                            px: 1.5,
                            py: 0.75,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1,
                        }}
                    >
                        <Box sx={{ flex: 1 }} />
                        <IconButton
                            size="small"
                            onClick={closeDetailPost}
                            aria-label="Close"
                            sx={{ width: 32, height: 32 }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    <Box sx={{ overflowY: 'auto', flex: 1 }}>
                        {detailPost && (
                            <PostDetailModal
                                key={`group-page-detail-${detailPost?.id ?? detailPost?.post_id ?? ''}`}
                                user={viewerUser}
                                embedded
                                hideCategoryChip
                                topRightSlot={
                                    detailPost?.id ? (
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                                            onClick={() => {
                                                const pid = detailPost?.id ?? detailPost?.post_id;
                                                if (pid) openPostPage?.(pid);
                                            }}
                                            sx={{
                                                borderRadius: 999,
                                                textTransform: 'none',
                                                fontWeight: 800,
                                                fontSize: 12,
                                                px: 1.5,
                                                py: 0.25,
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            View post page
                                        </Button>
                                    ) : null
                                }
                                post={{
                                    ...detailPost,
                                    id: detailPost?.id ?? detailPost?.post_id,
                                    description:
                                        detailPost?.description ??
                                        detailPost?.content ??
                                        detailPost?.body ??
                                        detailPost?.post_body ??
                                        '',
                                }}
                            />
                        )}
                    </Box>
                </Dialog>
            )}

            {/* ── Edit history dialog ── */}
            <Dialog
                open={historyOpen}
                fullWidth
                maxWidth="sm"
                onClose={(_, reason) => {
                    if (reason === 'backdropClick') return;
                    closeHistoryDialog();
                }}
                PaperProps={{ sx: { position: 'relative' } }}
                onClick={(e) => e.stopPropagation()}
            >
                <DialogTitle sx={{ pr: 7, fontWeight: 800, fontSize: 18 }}>
                    Edit History
                    <IconButton onClick={closeHistoryDialog} size="small" aria-label="Close" sx={{ position: 'absolute', right: 8, top: 8 }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ minHeight: 120, px: { xs: 2, sm: 3 } }}>
                    {historyLoading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress size={28} />
                        </Box>
                    )}
                    {!historyLoading && historyError && (
                        <Alert severity="error" sx={{ mb: 1 }}>{historyError}</Alert>
                    )}
                    {!historyLoading && !historyError && (!historyRows || historyRows.length === 0) ? (
                        <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center', fontSize: 14 }}>
                            This post was edited, but detailed version history is not available for edits made before history tracking was enabled.
                        </Typography>
                    ) : null}
                    {!historyLoading && !historyError && historyRows && historyRows.length > 0 ? (
                        <Box sx={{ position: 'relative', pl: 2.5 }}>
                            <Box sx={{ position: 'absolute', left: 5, top: 10, bottom: 10, width: 2, bgcolor: (t) => alpha(t.palette.primary.main, 0.12), borderRadius: 1 }} />
                            {historyRows.map((row, idx) => {
                                const snap = row?.snapshot || {};
                                const prevSnap = historyRows[idx + 1]?.snapshot || {};
                                const diff = row?.diff || {};
                                const isOriginal = idx === historyRows.length - 1;
                                const isLatest = idx === 0;
                                const diffItems = [];
                                if (!isOriginal) {
                                    const s = (v) => (v == null ? '' : String(v).trim());
                                    if (s(snap.title) !== s(prevSnap.title)) diffItems.push({ label: 'Title', from: s(prevSnap.title) || '(empty)', to: s(snap.title) || '(empty)' });
                                    if (s(snap.description) !== s(prevSnap.description)) {
                                        const t80 = (v) => v.length > 80 ? v.slice(0, 80) + '…' : v;
                                        diffItems.push({ label: 'Description', from: t80(s(prevSnap.description)) || '(empty)', to: t80(s(snap.description)) || '(empty)' });
                                    }
                                    const added = Array.isArray(diff?.added) ? diff.added.filter(Boolean) : [];
                                    const removed = Array.isArray(diff?.removed) ? diff.removed.filter(Boolean) : [];
                                    const reordered = Boolean(diff?.reordered);
                                    if (added.length > 0 || removed.length > 0 || reordered) {
                                        const parts = [];
                                        if (added.length) parts.push(`${added.length} added`);
                                        if (removed.length) parts.push(`${removed.length} removed`);
                                        if (!parts.length && reordered) parts.push('reordered');
                                        diffItems.push({ label: 'Photos', changed: true, detail: parts.join(', '), photoAdded: added, photoRemoved: removed });
                                    }
                                }
                                const dtLabel = (() => {
                                    if (!row.edited_at) return '';
                                    const d = new Date(row.edited_at);
                                    if (Number.isNaN(d.valueOf())) return '';
                                    const date = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                                    const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
                                    return date && time ? `${date} · ${time}` : date || time || '';
                                })();
                                return (
                                    <Box key={row.id || row.version || idx} sx={{ position: 'relative', pb: idx < historyRows.length - 1 ? 2.5 : 0 }}>
                                        <Box sx={{
                                            position: 'absolute', left: -20, top: 4, width: 12, height: 12, borderRadius: '50%',
                                            bgcolor: isOriginal ? 'grey.400' : isLatest ? 'secondary.main' : 'primary.main',
                                            border: '2px solid', borderColor: 'background.paper',
                                            boxShadow: (t) => `0 0 0 2px ${alpha(isOriginal ? t.palette.grey[400] : isLatest ? t.palette.secondary.main : t.palette.primary.main, 0.2)}`,
                                            zIndex: 1,
                                        }} />
                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                                            <Typography sx={{ fontWeight: 800, fontSize: 13, color: isOriginal ? 'text.secondary' : 'text.primary' }}>
                                                {isOriginal ? 'Original' : isLatest ? 'Latest edit' : `Version ${row.version || historyRows.length - idx}`}
                                            </Typography>
                                            <Typography sx={{ fontSize: 11, color: 'text.disabled', fontWeight: 500 }}>{dtLabel}</Typography>
                                            {row.editor_handle ? (
                                                <Typography sx={{ fontSize: 11, color: 'text.disabled', fontWeight: 500 }}>@{row.editor_handle}</Typography>
                                            ) : null}
                                        </Stack>
                                        {!isOriginal && diffItems.length > 0 && (
                                            <Box sx={{ bgcolor: (t) => alpha(t.palette.primary.main, 0.025), border: '1px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.08), borderRadius: 2, px: 1.5, py: 1 }}>
                                                {diffItems.map((item, i) => (
                                                    <Box key={i} sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, py: 0.5 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                            <Chip label={item.label} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, borderRadius: 1.5, bgcolor: (t) => alpha(t.palette.primary.main, 0.08), color: 'primary.dark', border: 'none', flexShrink: 0, mt: 0.1, '& .MuiChip-label': { px: 1 } }} />
                                                            {item.changed ? (
                                                                <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.5, pt: 0.15 }}>{item.detail || 'Updated'}</Typography>
                                                            ) : (
                                                                <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.5, pt: 0.15, minWidth: 0, wordBreak: 'break-word' }}>
                                                                    <Box component="span" sx={{ textDecoration: 'line-through', opacity: 0.55 }}>{item.from}</Box>
                                                                    <Box component="span" sx={{ mx: 0.5, color: 'text.disabled' }}>→</Box>
                                                                    <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{item.to}</Box>
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                ))}
                                            </Box>
                                        )}
                                        {!isOriginal && diffItems.length === 0 && (
                                            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic', pl: 0.5 }}>Post details updated</Typography>
                                        )}
                                        {isOriginal && (
                                            <Box sx={{ bgcolor: (t) => alpha(t.palette.grey[500], 0.04), border: '1px solid', borderColor: (t) => alpha(t.palette.grey[500], 0.08), borderRadius: 2, px: 1.5, py: 1 }}>
                                                {snap.title && <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.primary', mb: 0.25 }}>{String(snap.title).trim()}</Typography>}
                                                <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.4 }}>Original post created</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>
                    ) : null}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 1.5 }}>
                    <Button onClick={closeHistoryDialog} sx={{ fontWeight: 700 }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Mobile FAB — Create Post (matches community/business FAB position) */}
            {isMobileScreen && canCreatePost && isOnPersonalAccount && onOpenCreatePost && (
                <Fab
                    onClick={onOpenCreatePost}
                    size="medium"
                    aria-label="Create Post"
                    sx={(t) => ({
                        position: 'fixed',
                        bottom: MOBILE_BOTTOM_NAV_HEIGHT + 16,
                        right: 14,
                        zIndex: 20,
                        bgcolor: t.palette.primary.main,
                        color: t.palette.common.white,
                        boxShadow: `0 3px 12px ${alpha(t.palette.primary.main, 0.35)}`,
                        '&:hover': {
                            bgcolor: alpha(t.palette.primary.main, 0.92),
                        },
                    })}
                >
                    <EditRoundedIcon />
                </Fab>
            )}

            {/* Mobile FAB — Back to Top (when scrolled down and filter bar is pinned) */}
            {isMobileScreen && isPinned && (
                <Fab
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    size="small"
                    aria-label="Back to top"
                    sx={(t) => ({
                        position: 'fixed',
                        bottom: canCreatePost && isOnPersonalAccount && onOpenCreatePost
                            ? MOBILE_BOTTOM_NAV_HEIGHT + 74
                            : MOBILE_BOTTOM_NAV_HEIGHT + 16,
                        right: 18,
                        zIndex: 20,
                        bgcolor: alpha(t.palette.background.paper, 0.92),
                        color: t.palette.primary.main,
                        border: '1px solid',
                        borderColor: alpha(t.palette.primary.main, 0.25),
                        backdropFilter: 'blur(8px)',
                        boxShadow: `0 2px 8px ${alpha(t.palette.common.black, 0.12)}`,
                        '&:hover': {
                            bgcolor: alpha(t.palette.primary.main, 0.08),
                        },
                    })}
                >
                    <ArrowUpwardIcon sx={{ fontSize: 20 }} />
                </Fab>
            )}
        </Root>
    );
}
